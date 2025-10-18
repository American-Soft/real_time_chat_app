import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ChatRoom } from '../chat/chat-room.entity';
import { MuteDuration } from './enums/mute-duration';


@Entity('notification_settings')
@Unique(['user', 'chatRoom'])
export class NotificationSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => ChatRoom, { eager: true })
  chatRoom: ChatRoom;

  @Column({
    type: 'enum',
    enum: MuteDuration,
    default: MuteDuration.OFF,
  })
  muteDuration: MuteDuration;

  @Column({ type: 'timestamp', nullable: true })
  mutedUntil: Date;

  @Column({ default: true })
  allowNotifications: boolean;

  @Column({ default: true })
  allowSound: boolean;

  @Column({ default: true })
  allowVibration: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to check if notifications are currently muted
  isMuted(): boolean {
    if (this.muteDuration === MuteDuration.OFF) {
      return false;
    }

    if (!this.mutedUntil) {
      return false;
    }

    return new Date() < this.mutedUntil;
  }

  // Helper method to compute mute until date
  computeMuteUntil(duration: MuteDuration): Date | null {
    if (duration === MuteDuration.OFF) return null;

    const now = new Date();
    const muteUntil = new Date(now);

    switch (duration) {
      case MuteDuration.EIGHT_HOURS:
        muteUntil.setHours(muteUntil.getHours() + 8);
        break;
      case MuteDuration.TWENTY_FOUR_HOURS:
        muteUntil.setDate(muteUntil.getDate() + 1);
        break;
      case MuteDuration.ONE_WEEK:
        muteUntil.setDate(muteUntil.getDate() + 7);
        break;
    }

    return muteUntil;
  }
}









