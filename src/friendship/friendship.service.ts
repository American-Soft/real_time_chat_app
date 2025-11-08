import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { Friendship } from './friendship.entity';
import { FriendshipStatus } from '../enums/friendship-status.enum';
import { User } from '../user/user.entity';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { AcceptDeclineRequestDto } from './dtos/accept-decline-request.dto';
import { SearchUsersDto } from './dtos/search-users.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UnfriendDto } from './dtos/unfriend.dto';
import { BlockUserDto } from './dtos/block-user.dto';
import { UnblockUserDto } from './dtos/unblock-user.dto';

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

    const where: any = [
      { username: ILike(`%${query ?? ''}%`), id: Not(userId) },
      { email: ILike(`%${query ?? ''}%`), id: Not(userId) },
    ];

    const [data, total] = await this.userRepository.findAndCount({
      where: query ? where : { id: Not(userId) },
      skip: (page - 1) * limit,
      take: limit,
      order: { username: 'ASC' },
    });

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

  async unfriend(userId: number, dto: UnfriendDto) {
    if (userId === dto.otherUserId) {
      throw new BadRequestException('You cannot unfriend yourself.');
    }

    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: userId }, receiver: { id: dto.otherUserId }, status: FriendshipStatus.ACCEPTED },
        { requester: { id: dto.otherUserId }, receiver: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('No accepted friendship found.');
    }

    await this.friendshipRepository.remove(friendship);

    return { message: 'Unfriended successfully.' };
  }

  async blockUser(userId: number, dto: BlockUserDto) {
    if (userId === dto.otherUserId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const other = await this.userRepository.findOne({ where: { id: dto.otherUserId } });
    if (!user || !other) {
      throw new NotFoundException('User not found.');
    }

    let friendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: userId }, receiver: { id: dto.otherUserId } },
        { requester: { id: dto.otherUserId }, receiver: { id: userId } },
      ],
      relations: ['requester', 'receiver', 'blockedBy'],
    });

    if (!friendship) {
      // create a record to represent a blocked relationship even if not friends
      friendship = this.friendshipRepository.create({
        requester: user,
        receiver: other,
        status: FriendshipStatus.DECLINED,
      });
    }

    friendship.isBlocked = true;
    friendship.blockedBy = user;

    await this.friendshipRepository.save(friendship);
    return { message: 'User blocked successfully.' };
  }

  async unblockUser(userId: number, dto: UnblockUserDto) {
    if (userId === dto.otherUserId) {
      throw new BadRequestException('You cannot unblock yourself.');
    }

    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: userId }, receiver: { id: dto.otherUserId } },
        { requester: { id: dto.otherUserId }, receiver: { id: userId } },
      ],
      relations: ['blockedBy'],
    });

    if (!friendship || !friendship.isBlocked || friendship.blockedBy?.id !== userId) {
      throw new NotFoundException('No block entry found for this user.');
    }

    friendship.isBlocked = false;
    friendship.blockedBy = null;
    await this.friendshipRepository.save(friendship);
    return { message: 'User unblocked successfully.' };
  }

  async isBlockedBetween(userId: number, otherUserId: number): Promise<{ blocked: boolean; blockedById?: number }> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: userId }, receiver: { id: otherUserId } },
        { requester: { id: otherUserId }, receiver: { id: userId } },
      ],
      relations: ['blockedBy'],
    });
    if (!friendship) return { blocked: false };
    return { blocked: !!friendship.isBlocked, blockedById: friendship.blockedBy?.id };
  }

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
      relations: ['blockedBy'],
    });
    if (!friendship) return false;
    if ((friendship as any).isBlocked) return false;
    return true;
  }

  // Check if users are blocked
  async areBlocked(userId1: number, userId2: number): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: userId1 }, receiver: { id: userId2 } },
        { requester: { id: userId2 }, receiver: { id: userId1 } },
      ],
      relations: ['blockedBy'],
    });
    return !!(friendship && (friendship as any).isBlocked);
  }
  async getMutualFriends(userId: number, otherUserIds: number[]) {
    if (!otherUserIds || otherUserIds.length === 0) {
      return [];
    }

    const results = [];

    for (const otherUserId of otherUserIds) {
      const qb = this.userRepository
        .createQueryBuilder('user')
        .innerJoin(
          Friendship,
          'f1',
          `(
          (f1.requesterId = user.id AND f1.receiverId = :userId)
          OR (f1.receiverId = user.id AND f1.requesterId = :userId)
        )
        AND f1.status = :status`,
          { userId, status: FriendshipStatus.ACCEPTED },
        )
        .innerJoin(
          Friendship,
          'f2',
          `(
          (f2.requesterId = user.id AND f2.receiverId = :otherUserId)
          OR (f2.receiverId = user.id AND f2.requesterId = :otherUserId)
        )
        AND f2.status = :status`,
          { otherUserId, status: FriendshipStatus.ACCEPTED },
        )
        // Exclude the two main users
        .where('user.id NOT IN (:...excluded)', {
          excluded: [userId, otherUserId],
        });

      const mutualFriends = await qb.getMany();

      results.push({
        otherUserId,
        mutualFriends,
      });
    }

    return results;
  }




} 