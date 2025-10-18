import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ChatRoom } from '../chat/chat-room.entity';
import { Message } from '../chat/message.entity';
import { NotificationType } from './enums/notification-type';
import { NotificationStatus } from './enums/notification-status';


@Entity('notifications')
@Index(['user', 'status', 'createdAt'])
@Index(['user', 'type', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => ChatRoom, { nullable: true })
  chatRoom: ChatRoom;

  @ManyToOne(() => Message, { nullable: true })
  message: Message;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.MESSAGE,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'json', nullable: true })
  data: any; // Additional data like sender info, room info, etc.

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ default: false })
  isSilent: boolean; // For muted notifications

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}









