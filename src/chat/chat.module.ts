import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FileUploadService } from '../upload/file-upload.service';
import { ChatRoom } from './chat-room.entity';
import { Message } from './message.entity';
import { User } from '../user/user.entity';
import { ChatGateway } from './chat.gateway';
import { NotificationModule } from 'src/notification/notification.module';
import { CallModule } from 'src/call/call.module';
import { GroupModule } from '../group/group.module';
import { FriendshipModule } from '../friendship/friendship.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, User]),
    forwardRef(() => NotificationModule),
    CallModule,
    GroupModule,
    FriendshipModule
  ],
  controllers: [ChatController],
  providers: [ChatService, FileUploadService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule { } 