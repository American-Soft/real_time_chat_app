import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { CurrentUser } from '../user/decorator/current-user.decorator';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { AcceptDeclineRequestDto } from './dtos/accept-decline-request.dto';
import { SearchUsersDto } from './dtos/search-users.dto';

@Controller('friendship')
@UseGuards(AuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('request')
  async sendRequest(
    @CurrentUser() user: any,
    @Body() dto: SendFriendRequestDto
  ) {
    return this.friendshipService.sendFriendRequest(user.id, dto);
  }

  @Post('accept')
  async acceptRequest(
    @CurrentUser() user: any,
    @Body() dto: AcceptDeclineRequestDto
  ) {
    return this.friendshipService.acceptFriendRequest(user.id, dto);
  }


} 