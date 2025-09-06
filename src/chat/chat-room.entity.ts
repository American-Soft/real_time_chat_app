import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Message } from './message.entity';
import { Group } from './group.entity';
import { ChatRoomType } from 'src/enums/chat-room-type';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user1: User;

  @ManyToOne(() => User, { eager: true })
  user2: User;

  @ManyToOne(() => Group, { eager: true, nullable: true })
  group: Group;

  @Column({
    type: 'enum',
    enum: ChatRoomType,
    default: ChatRoomType.ONE_ON_ONE,
  })
  type: ChatRoomType;

  @Column({ unique: true })
  roomId: string; // Unique identifier for the room

  @OneToMany(() => Message, message => message.chatRoom)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to get the other user in the conversation
  getOtherUser(currentUserId: number): User {
    return this.user1.id === currentUserId ? this.user2 : this.user1;
  }

  // Helper method to check if a user is part of this room
  isUserInRoom(userId: number): boolean {
    if (this.type === ChatRoomType.ONE_ON_ONE) {
      return this.user1.id === userId || this.user2.id === userId;
    }
    return this.group?.members.some(member => member.id === userId) || false;
  }
}  