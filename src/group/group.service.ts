import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './group.entity';
import { User } from '../user/user.entity';
import { ChatRoom } from '../chat/chat-room.entity';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AddGroupMemberDto } from './dtos/add-group-member.dto';
import { AddGroupAdminDto } from './dtos/add-group-admin.dto';
import { ExitGroupDto } from './dtos/exit-group.dto';
import { RemoveGroupAdminDto } from './dtos/remove-group-admin.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { ChatRoomType } from '../enums/chat-room-type';
import { v4 as uuidv4 } from 'uuid';
import { FriendshipService } from '../friendship/friendship.service';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    private friendshipService: FriendshipService,
  ) {}


  async createGroup(
    userID: number,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    const { name, memberIds, description, imageUrl } = createGroupDto;
    const creator = await this.userRepository.findOne({
      where: { id: userID },
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    const members = await this.userRepository.findByIds(memberIds);
    if (members.length !== memberIds.length) {
      throw new NotFoundException('Some members not found');
    }
    const allowedMembers: User[] = [];
    for (const member of members) {
      const areFriends = await this.friendshipService.areFriends(userID, member.id);
      if (!areFriends) {
        throw new ForbiddenException(
          `You can only add friends to the group. ${member.username || 'User ' + member.id} is not your friend.`,
        );
      }
      allowedMembers.push(member);
    }

    const allMembers = [...allowedMembers];
    if (!allMembers.some((m) => m.id === creator.id)) {
      allMembers.push(creator);
    }
    const group = this.groupRepository.create({
      name,
      description,
      creator,
      image: imageUrl,
      members: allMembers,
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

  async updateGroup(
    userId: number,
    groupId: number,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['creator', 'members', 'admins'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.admins.some((admin) => admin.id === userId)) {
      throw new ForbiddenException('Only group admins can update the group');
    }

    if (updateGroupDto.name !== undefined) {
      group.name = updateGroupDto.name;
    }
    if (updateGroupDto.description !== undefined) {
      group.description = updateGroupDto.description;
    }
    if (updateGroupDto.imageUrl !== undefined) {
      group.image = updateGroupDto.imageUrl;
    }

    await this.groupRepository.save(group);

    return this.groupRepository.findOne({
      where: { id: group.id },
      relations: ['creator', 'members', 'admins'],
    });
  }

  async addMemberToGroup(
    userId: number,
    addGroupMemberDto: AddGroupMemberDto,
  ): Promise<Group> {
    const { userId: memberId, groupId } = addGroupMemberDto;
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
    if (!(await this.friendshipService.areFriends(userId, memberId))) {
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

  async removeGroupAdmin(
    userId: number,
    dto: RemoveGroupAdminDto,
  ): Promise<Group> {
    const { groupId, userId: targetAdminId } = dto;
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['creator', 'members', 'admins'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    // Only existing admins can remove another admin
    if (!group.admins.some((admin) => admin.id === userId)) {
      throw new ForbiddenException('Only group admins can remove admins');
    }

    // Creator cannot be removed by anyone
    if (group.creator?.id === targetAdminId) {
      throw new ForbiddenException('Cannot remove the group creator as admin');
    }

    // Target must be an admin
    if (!group.admins.some((admin) => admin.id === targetAdminId)) {
      throw new NotFoundException('Target user is not an admin');
    }

    // Remove target from admins
    group.admins = group.admins.filter((a) => a.id !== targetAdminId);

    // Ensure at least one admin remains; if none, promote creator or first member
    if (!group.admins || group.admins.length === 0) {
      if (group.creator) {
        group.admins = [group.creator];
      } else if (group.members && group.members.length > 0) {
        group.admins = [group.members[0]];
      }
    }

    await this.groupRepository.save(group);
    return this.groupRepository.findOne({
      where: { id: group.id },
      relations: ['creator', 'members', 'admins'],
    });
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    return this.groupRepository.find({
      where: [
        { members: { id: userId } },
        { admins: { id: userId } },
      ],
      relations: ['creator', 'members', 'admins'],
      order: { updatedAt: 'DESC' },
    });
  }

  async exitGroup(userId: number, dto: ExitGroupDto): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: dto.groupId },
      relations: ['creator', 'members', 'admins'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const isMember = group.members.some((m) => m.id === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Prevent creator from exiting to avoid orphaned group
    if (group.creator?.id === userId) {
      throw new ForbiddenException('Group creator cannot exit the group');
    }

    group.members = group.members.filter((m) => m.id !== userId);
    group.admins = group.admins?.filter((a) => a.id !== userId) || [];

    if (
      group.members.length > 0 &&
      (!group.admins || group.admins.length === 0)
    ) {
      group.admins = [group.members[0]];
    }

    await this.groupRepository.save(group);
    return this.groupRepository.findOne({
      where: { id: group.id },
      relations: ['creator', 'members', 'admins'],
    });
  }

  async getGroupById(groupId: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['creator', 'members', 'admins'],
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }
}

