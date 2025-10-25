import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './group.entity';
import { User } from '../user/user.entity';
import { ChatRoom } from '../chat/chat-room.entity';
import { FileUploadService } from '../upload/file-upload.service';
import { NotificationModule } from '../notification/notification.module';
import { FriendshipModule } from '../friendship/friendship.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, User, ChatRoom]),
    forwardRef(() => NotificationModule),
    FriendshipModule,
  ],
  controllers: [GroupController],
  providers: [GroupService, FileUploadService],
  exports: [GroupService],
})
export class GroupModule {}
