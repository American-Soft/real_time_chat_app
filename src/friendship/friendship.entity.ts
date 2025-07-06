import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { FriendshipStatus } from '../enums/friendship-status.enum';

// The Friendship entity represents a friend request or friendship between two users.
@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.sentRequests, { eager: true })
  requester: User;

  @ManyToOne(() => User, user => user.receivedRequests, { eager: true })
  receiver: User;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status: FriendshipStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 