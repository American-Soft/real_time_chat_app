import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationSettings } from './notification-settings.entity';
import { User } from '../user/user.entity';
import { ChatRoom } from '../chat/chat-room.entity';
import { Group } from '../group/group.entity';
import { JwtModule } from '@nestjs/jwt';
import { ChatModule } from '../chat/chat.module';
import { NotificationService } from './notification.service';
import { ChatService } from 'src/chat/chat.service';
import { NotificationController } from './notification.controller';
import { Message } from 'src/chat/message.entity';
import { Friendship } from 'src/friendship/friendship.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationSettings,
      User,
      ChatRoom,
      Message,
      Group,
      Friendship
    ]),
    forwardRef(() => ChatModule),
  ],
  providers: [NotificationService, NotificationGateway],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule { }
