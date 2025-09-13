import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship } from './friendship.entity';
import { FriendshipStatus } from '../enums/friendship-status.enum';
import { User } from '../user/user.entity';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { AcceptDeclineRequestDto } from './dtos/accept-decline-request.dto';
import { SearchUsersDto } from './dtos/search-users.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }


  async sendFriendRequest(requesterId: number, dto: SendFriendRequestDto) {
    if (requesterId === dto.receiverId) {
      throw new BadRequestException('You cannot send a friend request to yourself.');
    }
    const requester = await this.userRepository.findOne({ where: { id: requesterId } });
    const receiver = await this.userRepository.findOne({ where: { id: dto.receiverId } });
    if (!requester || !receiver) {
      throw new NotFoundException('User not found.');
    }
    // Check if a friendship already exists
    const existing = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: requesterId }, receiver: { id: dto.receiverId } },
        { requester: { id: dto.receiverId }, receiver: { id: requesterId } },
      ],
    });
    if (existing) {
      throw new BadRequestException('Friend request already exists or you are already friends.');
    }
    const friendship = this.friendshipRepository.create({
      requester,
      receiver,
      status: FriendshipStatus.PENDING,
    });
    return this.friendshipRepository.save(friendship);
  }

  async cancelFriendRequest(userId: number, dto: AcceptDeclineRequestDto) {
    const friendship = await this.friendshipRepository.findOne({
      where: {
        id: dto.requestId,
        requester: { id: userId },
        status: FriendshipStatus.PENDING,
      },
      relations: ['requester', 'receiver'],
    });

    if (!friendship) {
      throw new NotFoundException('Pending friend request not found or not yours to cancel.');
    }

    await this.friendshipRepository.remove(friendship);

    return { message: 'Friend request cancelled successfully.' };
  }


  async acceptFriendRequest(userId: number, dto: AcceptDeclineRequestDto) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: dto.requestId, receiver: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['requester', 'receiver'],
    });
    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }
    friendship.status = FriendshipStatus.ACCEPTED;
    return this.friendshipRepository.save(friendship);
  }

  async declineFriendRequest(userId: number, dto: AcceptDeclineRequestDto) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: dto.requestId, receiver: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['requester', 'receiver'],
    });
    if (!friendship) {
      throw new NotFoundException('Friend request not found.');
    }
    friendship.status = FriendshipStatus.DECLINED;
    return this.friendshipRepository.save(friendship);
  }

  async searchUsers(userId: number, dto: SearchUsersDto) {
    const { query, page = 1, limit = 10 } = dto;

    const qb = this.userRepository.createQueryBuilder('user');

    qb.where('user.id != :userId', { userId });

    if (query) {
      qb.andWhere('(user.username LIKE :query OR user.email LIKE :query)', {
        query: `%${query}%`,
      });
    }

    // Pagination
    qb.skip((page - 1) * limit); // OFFSET
    qb.take(limit);              // LIMIT

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async listFriends(userId: number) {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { receiver: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'receiver'],
    });
    return friendships.map(f =>
      f.requester.id === userId ? f.receiver : f.requester
    );
  }

  async listPendingRequests(userId: number) {
    return this.friendshipRepository.find({
      where: { receiver: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['requester'],
    });
  }

  async getMutualFriends(userId: number, otherUserId: number) {
    const qb = this.userRepository.createQueryBuilder('user');

    qb.innerJoin('user.sentRequests', 'f1', '(f1.receiver = :userId OR f1.requester = :userId) AND f1.status = :status', { userId, status: FriendshipStatus.ACCEPTED });
    qb.innerJoin('user.sentRequests', 'f2', '(f2.receiver = :otherUserId OR f2.requester = :otherUserId) AND f2.status = :status', { otherUserId, status: FriendshipStatus.ACCEPTED });
    qb.where('user.id != :userId AND user.id != :otherUserId', { userId, otherUserId });
    return qb.getMany();
  }
} 