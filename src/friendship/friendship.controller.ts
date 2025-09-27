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
import { MutualFriendsDto } from './dtos/mutual-friends.dto';
import { UnfriendDto } from './dtos/unfriend.dto';
import { BlockUserDto } from './dtos/block-user.dto';
import { UnblockUserDto } from './dtos/unblock-user.dto';

@ApiTags('Friendship')
@ApiBearerAuth()
@Controller('friendship')
@UseGuards(AuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) { }

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


  @ApiOperation({ summary: 'Cancel a sent friend request' })
  @ApiBody({ type: AcceptDeclineRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Friend request cancelled successfully',
    schema: {
      example: { message: 'Friend request cancelled successfully.' },
    },
  })
  @ApiResponse({ status: 404, description: 'Friend request not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('cancel')
  async cancelRequest(
    @CurrentUser() user: any,
    @Body() dto: AcceptDeclineRequestDto,
  ) {
    return this.friendshipService.cancelFriendRequest(user.id, dto);
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


  @ApiOperation({ summary: 'List friends' })
  @ApiResponse({
    status: 200,
    description: 'List of friends retrieved successfully',
    schema: {
      example: [
        { id: 1, username: 'john', email: 'a0vH0@example.com' },
        { id: 2, username: 'jane', email: 'lRZGZ@example.com' },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'No friends found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('friends')
  async listFriends(@CurrentUser() user: any) {
    return this.friendshipService.listFriends(user.id);
  }

  @ApiOperation({ summary: 'List pending friend requests' })
  @ApiResponse({
    status: 200,
    description: 'List of pending friend requests retrieved successfully',
    schema: {
      example: [
        { id: 1, requester: { id: 2, username: 'jane' }, status: 'PENDING' },
        { id: 2, requester: { id: 3, username: 'doe' }, status: 'PENDING' },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'No pending requests found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('requests')
  async listRequests(@CurrentUser() user: any) {
    return this.friendshipService.listPendingRequests(user.id);
  }

  @ApiOperation({ summary: 'Get mutual friends with another user' })
@ApiBody({ type: MutualFriendsDto })
@ApiResponse({
  status: 200,
  description: 'Mutual friends retrieved successfully',
  schema: {
    example: [
      { id: 3, username: 'sarah', email: 'sarah@example.com' },
      { id: 5, username: 'mark', email: 'mark@example.com' },
    ],
  },
})
@ApiResponse({ status: 404, description: 'No mutual friends found' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Post('mutual')
async mutualFriends(
  @CurrentUser() user: any,
  @Body() dto: MutualFriendsDto,
) {
  return this.friendshipService.getMutualFriends(user.id, dto.otherUserIds);
}

  @ApiOperation({ summary: 'Unfriend a user' })
  @ApiBody({ type: UnfriendDto })
  @ApiResponse({
    status: 200,
    description: 'Users are no longer friends',
    schema: { example: { message: 'Unfriended successfully.' } },
  })
  @ApiResponse({ status: 404, description: 'No accepted friendship found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('unfriend')
  async unfriend(
    @CurrentUser() user: any,
    @Body() dto: UnfriendDto,
  ) {
    return this.friendshipService.unfriend(user.id, dto);
  }

  @ApiOperation({ summary: 'Block a user' })
  @ApiBody({ type: BlockUserDto })
  @ApiResponse({ status: 200, description: 'User blocked', schema: { example: { message: 'User blocked successfully.' } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('block')
  async block(
    @CurrentUser() user: any,
    @Body() dto: BlockUserDto,
  ) {
    return this.friendshipService.blockUser(user.id, dto);
  }

  @ApiOperation({ summary: 'Unblock a user' })
  @ApiBody({ type: UnblockUserDto })
  @ApiResponse({ status: 200, description: 'User unblocked', schema: { example: { message: 'User unblocked successfully.' } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('unblock')
  async unblock(
    @CurrentUser() user: any,
    @Body() dto: UnblockUserDto,
  ) {
    return this.friendshipService.unblockUser(user.id, dto);
  }

} 