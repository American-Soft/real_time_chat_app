import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FileUploadService } from '../upload/file-upload.service';
import { ChatRoom } from './chat-room.entity';
import { Message } from './message.entity';
import { User } from '../user/user.entity';
import { Friendship } from '../friendship/friendship.entity';
import { ChatGateway } from './chat.gateway';
import { Group } from './group.entity';
import { AgoraService } from 'src/call/agora.service';
import { NotificationModule } from 'src/notification/notification.module';
import { CallModule } from 'src/call/call.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, User, Friendship, Group]),
    forwardRef(() => NotificationModule),
    CallModule
  ],
  controllers: [ChatController],
  providers: [ChatService, FileUploadService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule { } 