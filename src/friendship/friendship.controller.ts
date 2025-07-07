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
import { SearchUsersDto } from './dtos/search-users.dto';

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



  
  @ApiOperation({ summary: 'Decline a friend request' })
  @ApiBody({ type: AcceptDeclineRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Friend request declined successfully',
    schema: {
      example: {
        id: 5,
        requester: { id: 1, username: 'john' },
        receiver: { id: 2, username: 'jane' },
        status: 'DECLINED',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
 @Post('decline')
  async declineRequest(
    @CurrentUser() user: any,
    @Body() dto: AcceptDeclineRequestDto
  ) {
    return this.friendshipService.declineFriendRequest(user.id, dto);
  }




  @ApiOperation({ summary: 'Search for users' })
  @ApiBody({ type: SearchUsersDto })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    schema: {
      example: [
        { id: 1, username: 'john', email: 'a0vH0@example.com' },
        { id: 2, username: 'jane', email: 'lRZGZ@example.com' },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'No users found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
   @Post('search')
  async searchUsers(
    @CurrentUser() user: any,
    @Body() dto: SearchUsersDto
  ) {
    return this.friendshipService.searchUsers(user.id, dto);
  }

} 