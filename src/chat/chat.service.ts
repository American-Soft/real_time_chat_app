import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { Message } from './message.entity';
import { User } from '../user/user.entity';
import { SendMessageDto } from './dtos/send-message.dto';
import { GetMessagesDto } from './dtos/get-messages.dto';
import { v4 as uuidv4 } from 'uuid';
import { ChatRoomType } from 'src/enums/chat-room-type';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from 'src/notification/enums/notification-type';
import { GroupService } from '../group/group.service';
import { FriendshipService } from '../friendship/friendship.service';
import { EventEmitter2 } from '@nestjs/event-emitter';


@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
    private groupService: GroupService,
    private friendshipService: FriendshipService,
    private eventEmitter: EventEmitter2
  ) { }



  // Get or create chat room between two users
  async getOrCreateChatRoom(
    userId1: number,
    userId2OrGroupId: number,
    isGroup = false,
  ): Promise<ChatRoom> {
    if (isGroup) {
      const group = await this.groupService.getGroupById(userId2OrGroupId);

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
    const areFriends = await this.friendshipService.areFriends(userId1, userId2OrGroupId);
    if (!areFriends)
      throw new ForbiddenException('You can only chat with your friends');

    // Block check: if either has blocked the other, forbid
    /*   const isBlocked = await this.areBlocked(userId1, userId2OrGroupId);
      if (isBlocked) {
        throw new ForbiddenException(
          'Messaging is blocked between these users',
        );
      }
   */
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

      const isBlocked = await this.friendshipService.areBlocked(userId1, userId2OrGroupId);
      if (isBlocked) {
        throw new ForbiddenException(
          'Messaging is blocked between these users',
        );
      }
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

  async getChatParticipantIds(
    userId: number,
    targetId: number,
    isGroup: boolean,
  ): Promise<number[]> {
    if (isGroup) {
      const group = await this.groupService.getGroupById(targetId);

      // Check if user is a member
      if (!group.members.some((member) => member.id === userId)) {
        throw new ForbiddenException('You are not a member of this group');
      }
      return group.members.map((member) => member.id);
    }
    const canChat = await this.friendshipService.areFriends(userId, targetId);
    if (!canChat)
      throw new ForbiddenException('You can only chat with your friends');

    // Block check for 1:1 chats
    /*     const isBlocked = await this.areBlocked(userId, targetId);
        if (isBlocked) {
          throw new ForbiddenException('Messaging is blocked between these users');
        } */

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
      createdAt,
    } = sendMessageDto;

    let chatRoom: ChatRoom;
    if (groupId) {
      chatRoom = await this.getOrCreateChatRoom(senderId, groupId, true);
    } else if (receiverId) {
      // Block check before creating room and saving message
      const isBlocked = await this.friendshipService.areBlocked(senderId, receiverId);
      if (isBlocked) {
        throw new ForbiddenException(
          'Messaging is blocked between these users',
        );
      }
      chatRoom = await this.getOrCreateChatRoom(senderId, receiverId);
    } else {
      throw new ForbiddenException('Must specify receiverId or groupId');
    }

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
      ...(createdAt ? { createdAt } : {}),
    });

    const savedMessage = await this.messageRepository.save(message);
    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'chatRoom', 'chatRoom.group'],
    });

    this.eventEmitter.emit('message.sent', { message: fullMessage, chatRoom });


    return fullMessage;
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
      // Block check for 1:1 chats
      /*       const isBlocked = await this.areBlocked(userId, receiverId);
            if (isBlocked) {
              throw new ForbiddenException('Messaging is blocked between these users');
            } */
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
    let isGroup = false;
    try {
      await this.groupService.getGroupById(senderIdOrGroupId);
      isGroup = true;
    } catch (error) {
      // Not a group, treat as user ID
    }

    if (isGroup) {
      chatRoom = await this.getOrCreateChatRoom(
        userId,
        senderIdOrGroupId,
        true,
      );
    } else {
      // Block check for 1:1 chats
      const isBlocked = await this.friendshipService.areBlocked(userId, senderIdOrGroupId);
      if (isBlocked) {
        throw new ForbiddenException(
          'Messaging is blocked between these users',
        );
      }
      chatRoom = await this.getOrCreateChatRoom(userId, senderIdOrGroupId);
    }

    await this.messageRepository
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where("chatRoomId = :chatRoomId", { chatRoomId: chatRoom.id })
      .andWhere("isRead = false")
      .andWhere("senderId = :senderId", { senderId: senderIdOrGroupId })
      .execute();

    this.eventEmitter.emit('messages.read', {
      userId,
      chatRoomId: chatRoom.id,
    });

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
        { group: { admins: { id: userId } } },
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
