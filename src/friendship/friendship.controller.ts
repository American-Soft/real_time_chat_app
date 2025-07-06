import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { CurrentUser } from '../user/decorator/current-user.decorator';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { AcceptDeclineRequestDto } from './dtos/accept-decline-request.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Friendship')
@ApiBearerAuth()
@Controller('friendship')
@UseGuards(AuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('request')
    @ApiOperation({ summary: 'Send a friend request' })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
    schema: {
      example: {
        id: 5,
        requester: { id: 1, username: 'john' },
        receiver: { id: 2, username: 'jane' },
        status: 'PENDING',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data or request already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendRequest(
    @CurrentUser() user: any,
    @Body() dto: SendFriendRequestDto
  ) {
    return this.friendshipService.sendFriendRequest(user.id, dto);
  }

  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiBody({ type: AcceptDeclineRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Friend request accepted successfully',
    schema: {
      example: {
        id: 5,
        requester: { id: 1, username: 'john' },
        receiver: { id: 2, username: 'jane' },
        status: 'ACCEPTED',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })

  @Post('accept')
  async acceptRequest(
    @CurrentUser() user: any,
    @Body() dto: AcceptDeclineRequestDto
  ) {
    return this.friendshipService.acceptFriendRequest(user.id, dto);
  }


} 