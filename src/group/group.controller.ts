import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GroupService } from './group.service';
import { FileUploadService } from '../upload/file-upload.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { CurrentUser } from '../user/decorator/current-user.decorator';
import { User } from '../user/user.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { CreateGroupDto } from './dtos/create-group.dto';
import { AddGroupMemberDto } from './dtos/add-group-member.dto';
import { AddGroupAdminDto } from './dtos/add-group-admin.dto';
import { ExitGroupDto } from './dtos/exit-group.dto';
import { RemoveGroupAdminDto } from './dtos/remove-group-admin.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller('v1/groups')
@UseGuards(AuthGuard)
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('group-image'))
  @ApiOperation({ summary: 'Create a new group chat' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({
    status: 201,
    description: 'Group chat created successfully',
    schema: {
      example: {
        id: 1,
        name: 'Study Group',
        description: 'Group for study discussions',
        image: '/uploads/groups/1234567890-image.jpg',
        creator: { id: 1, username: 'john' },
        admins: [{ id: 1, username: 'john' }],
        members: [
          { id: 1, username: 'john' },
          { id: 2, username: 'jane' },
        ],
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    let imageUrl = createGroupDto.imageUrl;

    if (file) {
      imageUrl = this.fileUploadService.getGroupImageUrl(file.filename);
    }
    return this.groupService.createGroup(user.id, {
      ...createGroupDto,
      imageUrl
    });
  }

  @Patch(':groupId')
  @UseInterceptors(FileInterceptor('group-image'))
  @ApiOperation({ summary: 'Update group information (name, description, image)' })
  @ApiParam({ name: 'groupId', description: 'Group ID to update' })
  @ApiBody({ type: UpdateGroupDto })
  @ApiResponse({
    status: 200,
    description: 'Group updated successfully',
    schema: {
      example: {
        id: 1,
        name: 'Updated Study Group',
        description: 'Updated group description',
        image: '/uploads/groups/1234567890-new-image.jpg',
        creator: { id: 1, username: 'john' },
        members: [
          { id: 1, username: 'john' },
          { id: 2, username: 'jane' },
        ],
        admins: [{ id: 1, username: 'john' }],
        createdAt: '2025-07-19T12:00:00.000Z',
        updatedAt: '2025-07-19T12:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can update group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async updateGroup(
    @CurrentUser() user: User,
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateGroupDto.imageUrl = this.fileUploadService.getGroupImageUrl(file.filename);
    }

    return this.groupService.updateGroup(user.id, groupId, updateGroupDto);
  }

  @Post(':groupId/members')
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can add members',
  })
  async addGroupMember(
    @CurrentUser() user: User,
    @Body() addGroupMemberDto: AddGroupMemberDto,
  ) {
    return this.groupService.addMemberToGroup(user.id, addGroupMemberDto);
  }

  @Post(':groupId/admins')
  @ApiOperation({ summary: 'Add an admin to a group chat' })
  @ApiBody({ type: AddGroupAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Admin added to group successfully',
    schema: {
      example: {
        id: 1,
        name: 'Study Group',
        creator: { id: 1, username: 'john' },
        members: [
          { id: 1, username: 'john' },
          { id: 2, username: 'jane' },
        ],
        admins: [
          { id: 1, username: 'john' },
          { id: 2, username: 'jane' },
        ],
        createdAt: '2025-07-19T12:00:00.000Z',
        updatedAt: '2025-07-19T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can add other admins',
  })
  async addGroupAdmin(
    @CurrentUser() user: User,
    @Body() addGroupAdminDto: AddGroupAdminDto,
  ) {
    return this.groupService.addGroupAdmin(user.id, addGroupAdminDto);
  }

  @Post(':groupId/exit')
  @ApiOperation({ summary: 'Exit a group chat' })
  @ApiBody({ type: ExitGroupDto })
  @ApiResponse({ status: 200, description: 'Exited the group successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - creator cannot exit' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async exitGroup(@CurrentUser() user: User, @Body() dto: ExitGroupDto) {
    return this.groupService.exitGroup(user.id, dto);
  }

  @Post(':groupId/remove-admin')
  @ApiOperation({
    summary: 'Remove an admin from a group (creator cannot be removed)',
  })
  @ApiBody({ type: RemoveGroupAdminDto })
  @ApiResponse({ status: 200, description: 'Admin removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only admins, and creator cannot be removed',
  })
  @ApiResponse({ status: 404, description: 'Group or admin not found' })
  async removeGroupAdmin(
    @CurrentUser() user: User,
    @Body() dto: RemoveGroupAdminDto,
  ) {
    return this.groupService.removeGroupAdmin(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user groups' })
  @ApiResponse({
    status: 200,
    description: 'List of groups the user is part of',
    schema: {
      example: [
        {
          id: 1,
          name: 'Study Group',
          description: 'Group for studying',
          image: '/uploads/groups/1234567890-image.jpg',
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
    return this.groupService.getUserGroups(user.id);
  }
}

