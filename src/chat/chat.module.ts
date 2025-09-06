import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FileUploadService } from './file-upload.service';
import { ChatRoom } from './chat-room.entity';
import { Message } from './message.entity';
import { User } from '../user/user.entity';
import { Friendship } from '../friendship/friendship.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Group } from './group.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, User, Friendship,Group]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/chat';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueName = uuidv4();
          const extension = extname(file.originalname);
          cb(null, `${uniqueName}${extension}`);
        },

      }),
      limits: { fileSize: 1024 * 1024 }

    }),
  ],
  controllers: [ChatController],
  providers: [ChatService,  FileUploadService],
  exports: [ChatService],
})
export class ChatModule { } 