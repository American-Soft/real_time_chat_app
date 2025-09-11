import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { FileUploadService } from '../upload/file-upload.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { GetMessagesDto } from './dtos/get-messages.dto';
import { AuthGuard } from '../user/guards/auth.guard';
import { CurrentUser } from '../user/decorator/current-user.decorator';
import { User } from '../user/user.entity';

import { MessageType } from 'src/enums/message-type.enum';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AddGroupMemberDto } from './dtos/add-group-member.dto';
import { AddGroupAdminDto } from './dtos/add-group-admin.dto';
@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly fileUploadService: FileUploadService,
  ) { }


  @Post('group')
  @ApiOperation({ summary: 'Create a new group chat' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({
    status: 201,
    description: 'Group chat created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Study Group',
        creator: { id: 1, username: 'john' },
        admins: [{ id: 1, username: 'john' }],
        members: [{ id: 1, username: 'john' }, { id: 2, username: 'jane' }],
        createdAt: '2025-07-19T12:00:00.000Z',
        updatedAt: '2025-07-19T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })

  async createGroup(
    @CurrentUser() user: User,
    @Body() createGroupDto: CreateGroupDto,
  ) {
    return this.chatService.createGroup(user.id, createGroupDto);
  }

  @Post('group/add-member')
  @ApiOperation({ summary: 'Add a member to a group chat' })
  @ApiBody({ type: AddGroupMemberDto })
  @ApiResponse({
    status: 200,
    description: 'Member added to group successfully',
    schema: {
      example: {
        id: 1,
        name: 'Study Group',
        members: [
          { id: 1, username: 'john' },
          { id: 2, username: 'jane' },
          { id: 3, username: 'doe' },
        ],
        admins: [{ id: 1, username: 'john' }],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can add members' })

  async addGroupMember(
    @CurrentUser() user: User,
    @Body() addGroupMemberDto: AddGroupMemberDto
  ) {
    return this.chatService.addMemberToGroup(user.id, addGroupMemberDto);
  }

  @Post('group/add-admin')
  @ApiOperation({ summary: 'Add an admin to a group chat' })
  @ApiBody({ type: AddGroupAdminDto })
  @ApiResponse({
    status: 200,
    description: 'List of groups the user is part of',
    schema: {
      example: [
        {
          id: 1,
          name: 'Study Group',
          creator: { id: 1, username: 'john' },
          members: [
            { id: 1, username: 'john' },
            { id: 2, username: 'jane' },
          ],
          admins: [{ id: 1, username: 'john' }],
          createdAt: '2025-07-19T12:00:00.000Z',
          updatedAt: '2025-07-19T12:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can add other admins' })

  @Post('group/add-admin')
  async addGroupAdmin(@CurrentUser() user: User, @Body() addGroupAdminDto: AddGroupAdminDto) {
    return this.chatService.addGroupAdmin(user.id, addGroupAdminDto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get user groups' })
  @ApiResponse({
    status: 200,
    description: 'List of groups the user is part of',
    schema: {
      example: [
        {
          id: 1,
          name: 'Study Group',
          creator: { id: 1, username: 'john' },
          members: [
            { id: 1, username: 'john' },
            { id: 2, username: 'jane' },
          ],
          admins: [{ id: 1, username: 'john' }],
          createdAt: '2025-07-19T12:00:00.000Z',
          updatedAt: '2025-07-19T12:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserGroups(@CurrentUser() user: User) {
    return this.chatService.getUserGroups(user.id);
  }

  @Post('send-message')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Send a message (text or file)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        receiverId: { type: 'number', example: 2, description: 'Receiver user ID (for 1-to-1 chat)' },
        groupId: { type: 'number', example: 1, description: 'Group ID (for group chat)' },
        content: { type: 'string', example: 'Hello there!', description: 'Message content (optional when file is sent)' },
        file: { type: 'string', format: 'binary', description: 'File to upload (optional)' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    schema: {
      example: {
        id: 10,
        sender: { id: 1, username: 'john' },
        chatRoom: { id: 2, type: 'ONE_ON_ONE' },
        content: 'Hello there!',
        type: 'TEXT',
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        isRead: false,
        createdAt: '2025-07-19T12:45:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendMessage(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      receiverId?: number; // For one-on-one chats
      groupId?: number; // For group chats
      content?: string;
    },
  ) {
    const sendMessageDto: SendMessageDto = {
      receiverId: body.receiverId ? Number(body.receiverId) : undefined,
      groupId: body.groupId ? Number(body.groupId) : undefined,
      content: body.content,
      type: MessageType.TEXT,
    };

    if (file) {
      const fileUrl = this.fileUploadService.getFileUrl(file.filename);
      const messageType = this.fileUploadService.getMessageTypeFromMimeType(file.mimetype);

      Object.assign(sendMessageDto, {
        type: messageType,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    }

    return this.chatService.sendMessage(user.id, sendMessageDto);
  }


  @Get('messages')
  @ApiOperation({ summary: 'Get messages between users or from a group (with pagination)' })
  @ApiResponse({
    status: 200,
    description: 'Messages fetched successfully',
    schema: {
      example: {
        messages: [
          {
            id: 1,
            sender: { id: 1, username: 'john' },
            content: 'Hello!',
            type: 'TEXT',
            isRead: true,
            createdAt: '2025-07-19T12:00:00.000Z',
          },
          {
            id: 2,
            sender: { id: 2, username: 'jane' },
            content: 'Hi!',
            type: 'TEXT',
            isRead: false,
            createdAt: '2025-07-19T12:01:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMessages(
    @CurrentUser() user: User,
    @Query() getMessagesDto: GetMessagesDto,
  ) {
    return this.chatService.getMessages(user.id, getMessagesDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all chat conversations of the user' })
  @ApiResponse({
    status: 200,
    description: 'List of user chat rooms',
    schema: {
      example: [
        {
          id: 1,
          roomId: 'abcd-1234-efgh',
          type: 'ONE_ON_ONE',
          user1: { id: 1, username: 'john' },
          user2: { id: 2, username: 'jane' },
          lastMessage: {
            id: 101,
            content: 'See you later!',
            type: 'TEXT',
            createdAt: '2025-07-19T13:00:00.000Z',
          },
          updatedAt: '2025-07-19T13:00:00.000Z',
        },
        {
          id: 2,
          roomId: 'xyz-9876-qwerty',
          type: 'GROUP',
          group: { id: 1, name: 'Study Group' },
          lastMessage: {
            id: 102,
            content: 'Don’t forget the meeting!',
            type: 'TEXT',
            createdAt: '2025-07-19T13:05:00.000Z',
          },
          updatedAt: '2025-07-19T13:05:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConversations(@CurrentUser() user: User) {
    return this.chatService.getUserChatRooms(user.id);
  }

  @Post('mark-read/:senderId')
  @ApiOperation({ summary: 'Mark all messages as read from a user or group' })
  @ApiResponse({
    status: 200,
    description: 'Messages marked as read successfully',
    schema: { example: { success: true } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('senderIdOrGroupId', ParseIntPipe) senderIdOrGroupId: number,
  ) {
    await this.chatService.markMessagesAsRead(user.id, senderIdOrGroupId);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread messages count for the user' })
  @ApiResponse({
    status: 200,
    description: 'Unread message counts fetched successfully',
    schema: {
      example: {
        2: 5, // user ID 2 -> 5 unread messages
        group_1: 3, // group ID 1 -> 3 unread messages
      },
    },
  })

  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@CurrentUser() user: User) {
    return this.chatService.getUnreadCount(user.id);
  }

  @Get('can-chat/:userId')
  @ApiOperation({ summary: 'Get count of unread messages for all chats' })
  @ApiResponse({
    status: 200,
    description: 'Unread message counts fetched successfully',
    schema: {
      example: {
        2: 5, // user ID 2 -> 5 unread messages
        group_1: 3, // group ID 1 -> 3 unread messages
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async canChat(
    @CurrentUser() user: User,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const areFriends = await this.chatService.areFriends(user.id, userId);
    return { canChat: areFriends };
  }
} 