  import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ChatRoom } from './chat-room.entity';
import { MessageType } from '../enums/message-type.enum';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  sender: User;

  @ManyToOne(() => ChatRoom, chatRoom => chatRoom.messages)
  chatRoom: ChatRoom;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'text', nullable: true })
  content: string; // For text messages

  @Column({ nullable: true })
  fileUrl: string; // For image/video file URLs

  @Column({ nullable: true })
  fileName: string; // Original filename

  @Column({ nullable: true })
  fileSize: number; // File size in bytes

  @Column({ nullable: true })
  mimeType: string; // MIME type of the file

  @Column({ default: false })
  isRead: boolean; // Track if message has been read

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 