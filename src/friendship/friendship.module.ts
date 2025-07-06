import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './friendship.entity';
import { FriendshipService } from './friendship.service';
import { FriendshipController } from './friendship.controller';
import { User } from '../user/user.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User]),JwtModule],
  providers: [FriendshipService],
  controllers: [FriendshipController],
  exports: [FriendshipService], 
})
export class FriendshipModule {} 