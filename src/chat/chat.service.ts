import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { Message } from './message.entity';
import { User } from '../user/user.entity';
import { Friendship } from '../friendship/friendship.entity';
import { FriendshipStatus } from '../enums/friendship-status.enum';
import { SendMessageDto } from './dtos/send-message.dto';
import { GetMessagesDto } from './dtos/get-messages.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateGroupDto } from './dtos/create-group.dto';
import { Group } from './group.entity';
import { ChatRoomType } from 'src/enums/chat-room-type';
import { AddGroupMemberDto } from './dtos/add-group-member.dto';
import { AddGroupAdminDto } from './dtos/add-group-admin.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) { }

  // Check if two users are friends
  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester: { id: userId1 },
          receiver: { id: userId2 },
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester: { id: userId2 },
          receiver: { id: userId1 },
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });
    return !!friendship;
  }

  async createGroup(
    userID: number,
    createGropuDto: CreateGroupDto,
  ): Promise<Group> {
    const { name, memberIds } = createGropuDto;
    const creator = await this.userRepository.findOne({
      where: { id: userID },
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    const members = await this.userRepository.findByIds(memberIds);
    console.log(members);
    if (members.length !== memberIds.length) {
      throw new NotFoundException('Some members not found');
    }
    const group = this.groupRepository.create({
      name,
      creator,
      members,
      admins: [creator],
    });
    await this.groupRepository.save(group);
    const chatRoom = this.chatRoomRepository.create({
      group,
      roomId: uuidv4(),
      type: ChatRoomType.GROUP,
    });
    await this.chatRoomRepository.save(chatRoom);
    return this.groupRepository.findOne({
  where: { id: group.id },
  relations: ['creator', 'members', 'admins'],
});
  }

  async addMemberToGroup(
    userId: number,
    AddGroupMemberDto: AddGroupMemberDto,
  ): Promise<Group> {
    const { userId: memberId, groupId } = AddGroupMemberDto;
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members', 'admins'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (!group.admins.some((admin) => admin.id === userId)) {
      throw new ForbiddenException('Only group admins can add members');
    }
    const member = await this.userRepository.findOne({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (group.members.some((member) => member.id === memberId)) {
      throw new ForbiddenException('User is already a member of the group');
    }
    if (!(await this.areFriends(userId, memberId))) {
      throw new ForbiddenException('You can only add friends to the group');
    }
    group.members.push(member);
    await this.groupRepository.save(group);
    return group;
  }

  async addGroupAdmin(
    userId: number,
    addGroupAdminDto: AddGroupAdminDto,
  ): Promise<Group> {
    const { userId: adminId, groupId } = addGroupAdminDto;
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['admins'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (!group.admins.some((admin) => admin.id === userId)) {
      throw new ForbiddenException('Only group admins can add other admins');
    }
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    if (!group.members.some((member) => member.id === adminId)) {
      throw new ForbiddenException(
        'User must be a group member to become an admin',
      );
    }
    if (group.admins.some((admin) => admin.id === adminId)) {
      throw new ForbiddenException('User is already an admin of the group');
    }
    group.admins.push(admin);
    await this.groupRepository.save(group);
    return group;
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    return this.groupRepository.find({
      where: { members: { id: userId } },
      relations: ['creator', 'members', 'admins'],
      order: { updatedAt: 'DESC' },
    });
  }
  // Get or create chat room between two users
  async getOrCreateChatRoom(
    userId1: number,
    userId2OrGroupId: number,
    isGroup = false,
  ): Promise<ChatRoom> {
    if (isGroup) {
      const group = await this.groupRepository.findOne({
        where: { id: userId2OrGroupId },
        relations: ['members'],
      });
      if (!group) throw new NotFoundException('Group not found');

      // Check if user is a member
      if (!group.members.some((member) => member.id === userId1)) {
        throw new ForbiddenException('You are not a member of this group');
      }

      let chatRoom = await this.chatRoomRepository.findOne({
        where: { group: { id: userId2OrGroupId }, type: ChatRoomType.GROUP },
      });

      if (!chatRoom) {
        chatRoom = this.chatRoomRepository.create({
          group,
          type: ChatRoomType.GROUP,
          roomId: uuidv4(),
        });
        await this.chatRoomRepository.save(chatRoom);
      }

      return chatRoom;
    }

    // Existing logic for one-on-one chats
    const areFriends = await this.areFriends(userId1, userId2OrGroupId);
    if (!areFriends)
      throw new ForbiddenException('You can only chat with your friends');

    let chatRoom = await this.chatRoomRepository.findOne({
      where: [
        { user1: { id: userId1 }, user2: { id: userId2OrGroupId } },
        { user1: { id: userId2OrGroupId }, user2: { id: userId1 } },
      ],
    });

    if (!chatRoom) {
      const user1 = await this.userRepository.findOne({
        where: { id: userId1 },
      });
      const user2 = await this.userRepository.findOne({
        where: { id: userId2OrGroupId },
      });

      if (!user1 || !user2) throw new NotFoundException('User not found');

      chatRoom = this.chatRoomRepository.create({
        user1,
        user2,
        type: ChatRoomType.ONE_ON_ONE,
        roomId: uuidv4(),
      });
      await this.chatRoomRepository.save(chatRoom);
    }

    return chatRoom;
  }

  async getChatParticipantIds(userId: number, targetId: number,isGroup: boolean): Promise<number[]> {
    if (isGroup) {
      const group = await this.groupRepository.findOne({
        where: { id: targetId },
        relations: ['members'],
      });
      if (!group) throw new NotFoundException('Group not found');
      
      // Check if user is a member
      if (!group.members.some((member) => member.id === userId)) {
        throw new ForbiddenException('You are not a member of this group');
      }
      return group.members.map(member => member.id);
    }
    const canChat = await this.areFriends(userId, targetId);
    if (!canChat)
      throw new ForbiddenException('You can only chat with your friends');
    return [userId, targetId];
  }

  // Send a message
  async sendMessage(
    senderId: number,
    sendMessageDto: SendMessageDto,
  ): Promise<Message> {
    const {
      receiverId,
      groupId,
      type,
      content,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
    } = sendMessageDto;

    let chatRoom: ChatRoom;
    if (groupId) {
      chatRoom = await this.getOrCreateChatRoom(senderId, groupId, true);
    } else if (receiverId) {
      chatRoom = await this.getOrCreateChatRoom(senderId, receiverId);
    } else {
      throw new ForbiddenException('Must specify receiverId or groupId');
    }
    // Get or create chat room

    // Create message
    const message = this.messageRepository.create({
      sender: { id: senderId },
      chatRoom,
      type,
      content,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Return message with sender details
    return this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'chatRoom'],
    });
  }

  // Get messages between two users
  async getMessages(
    userId: number,
    getMessagesDto: GetMessagesDto,
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { receiverId, groupId, page = 1, limit = 20 } = getMessagesDto;

    // Get chat room
    let chatRoom: ChatRoom;
    if (groupId) {
      chatRoom = await this.getOrCreateChatRoom(userId, groupId, true);
    } else if (receiverId) {
      chatRoom = await this.getOrCreateChatRoom(userId, receiverId);
    } else {
      throw new ForbiddenException('Must specify receiverId or groupId');
    }
    // Get messages with pagination
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { chatRoom: { id: chatRoom.id } },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      messages: messages, // Show oldest first
      total,
      page,
      limit,
    };
  }

  // Mark messages as read
  async markMessagesAsRead(
    userId: number,
    senderIdOrGroupId: number,
  ): Promise<void> {
    let chatRoom: ChatRoom;
    const isGroup = await this.groupRepository.findOne({
      where: { id: senderIdOrGroupId },
    });
    if (isGroup) {
      chatRoom = await this.getOrCreateChatRoom(
        userId,
        senderIdOrGroupId,
        true,
      );
    } else {
      chatRoom = await this.getOrCreateChatRoom(userId, senderIdOrGroupId);
    }

    await this.messageRepository.update(
      {
        chatRoom: { id: chatRoom.id },
        sender: { id: isGroup ? undefined : senderIdOrGroupId },
        isRead: false,
      },
      { isRead: true },
    );
  }

  // Get unread message count
  async getUnreadCount(userId: number): Promise<Record<string, number>> {
    const unreadMessages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.chatRoom', 'chatRoom')
      .leftJoin('chatRoom.group', 'group')
      .where(
        '(chatRoom.user1.id = :userId OR chatRoom.user2.id = :userId OR group.members.id = :userId)',
        { userId },
      )
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = :isRead', { isRead: false })
      .select([
        'message.senderId as senderId',
        'chatRoom.group.id as groupId',
        'COUNT(*) as count',
      ])
      .groupBy('message.senderId, chatRoom.group.id')
      .getRawMany();

   
  const result: Record<string, number> = {};
  unreadMessages.forEach((item) => {
    const key = item.groupId ? `group_${item.groupId}` : `${item.senderId}`;
    const count = parseInt(item.count, 10) || 0;
    result[key] = (result[key] || 0) + count; // accumulate
  }); 

  return result;
  }

  // Get user's chat rooms (conversations)
  async getUserChatRooms(userId: number): Promise<ChatRoom[]> {
    return this.chatRoomRepository.find({
      where: [
        { user1: { id: userId } },
        { user2: { id: userId } },
        { group: { members: { id: userId } } },
      ],
      relations: [
        'user1',
        'user2',
        'group',
        'group.members',
        'group.admins',
        'messages',
      ],
      order: { updatedAt: 'DESC' },
    });
  }
}
