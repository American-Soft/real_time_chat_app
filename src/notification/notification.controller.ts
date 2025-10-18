import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { GetNotificationsDto } from './dtos/get-notifications.dto';
import { MarkAllNotificationsReadDto } from './dtos/mark-all-notifications-read.dto';
import { MuteNotificationsDto } from './dtos/mute-notifications.dto';
import { UpdateNotificationSettingsDto } from './dtos/update-notification-setting.dto';
import { CurrentUser } from 'src/user/decorator/current-user.decorator';
import { MarkNotificationReadDto } from './dtos/mark-notification-read.dto';

import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({ summary: 'Get all user notifications' })
    @ApiResponse({
        status: 200,
        description: 'Notifications retrieved successfully',
        schema: {
            example: {
                success: true,
                notifications: [{ id: 1, type: 'MESSAGE', status: 'UNREAD' }],
                total: 10,
            },
        },
    })
    async getUserNotifications(
        @CurrentUser() user: any,
        @Query() dto: GetNotificationsDto,
    ) {
        const result = await this.notificationService.getUserNotifications(
            user.id,
            dto,
        );
        return { success: true, ...result };
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({
        status: 200,
        description: 'Unread notification count retrieved',
        schema: { example: { success: true, count: 3 } },
    })
    async getUnreadNotificationCount(@CurrentUser() user: any) {
        const count = await this.notificationService.getUnreadNotificationCount(
            user.id,
        );
        return { success: true, count };
    }

    @Put(':notificationId/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    @ApiResponse({
        status: 200,
        description: 'Notification marked as read',
        schema: {
            example: {
                success: true,
                notification: { id: 1, status: 'READ' },
            },
        },
    })
    async markNotificationAsRead(
        @CurrentUser() user: any,
        @Param() params: MarkNotificationReadDto,
    ) {
        const notification = await this.notificationService.markNotificationAsRead(
            user.id,
            { notificationId: params.notificationId },
        );
        return { success: true, notification };
    }

    @Put('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiBody({ type: MarkAllNotificationsReadDto })
    @ApiResponse({
        status: 200,
        description: 'All notifications marked as read',
        schema: { example: { success: true, message: 'All notifications marked as read' } },
    })
    async markAllNotificationsAsRead(
        @CurrentUser() user: any,
        @Body() dto: MarkAllNotificationsReadDto,
    ) {
        await this.notificationService.markAllNotificationsAsRead(user.id, dto);
        return { success: true, message: 'All notifications marked as read' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    @ApiResponse({
        status: 200,
        description: 'Notification deleted successfully',
        schema: { example: { success: true, message: 'Notification deleted successfully' } },
    })
    async deleteNotification(
        @CurrentUser() user: any,
        @Param('id', ParseIntPipe) notificationId: number,
    ) {
        await this.notificationService.deleteNotification(user.id, { notificationId });
        return { success: true, message: 'Notification deleted successfully' };
    }

    @Post('mute')
    @ApiOperation({ summary: 'Mute notifications for a chat/group' })
    @ApiBody({ type: MuteNotificationsDto })
    @ApiResponse({
        status: 201,
        description: 'Notifications muted',
        schema: {
            example: {
                success: true,
                settings: { chatRoomId: 2, muted: true },
                message: 'Notifications muted for 1h',
            },
        },
    })
    async muteNotifications(
        @CurrentUser() user: any,
        @Body() dto: MuteNotificationsDto,
    ) {
        const settings = await this.notificationService.muteNotifications(
            user.id,
            dto,
        );
        return {
            success: true,
            settings,
            message: `Notifications muted for ${dto.duration}`,
        };
    }

    @Post('unmute')
    @ApiOperation({ summary: 'Unmute notifications' })
    @ApiBody({ schema: { example: { chatRoomId: 2 } } })
    @ApiResponse({
        status: 200,
        description: 'Notifications unmuted',
        schema: { example: { success: true, message: 'Notifications unmuted' } },
    })
    async unmuteNotifications(
        @CurrentUser() user: any,
        @Body() dto: { chatRoomId?: number; groupId?: number },
    ) {
        await this.notificationService.unmuteNotifications(user.id, dto);
        return { success: true, message: 'Notifications unmuted' };
    }

    @Put('settings')
    @ApiOperation({ summary: 'Update notification settings' })
    @ApiBody({ type: UpdateNotificationSettingsDto })
    @ApiResponse({
        status: 200,
        description: 'Notification settings updated',
        schema: {
            example: {
                success: true,
                settings: { chatRoomId: 1, mute: false },
                message: 'Notification settings updated',
            },
        },
    })
    async updateNotificationSettings(
        @CurrentUser() user: any,
        @Body() dto: UpdateNotificationSettingsDto,
    ) {
        const settings = await this.notificationService.updateNotificationSettings(
            user.id,
            dto,
        );
        return { success: true, settings, message: 'Notification settings updated' };
    }

    @Get('settings/:chatRoomId')
    @ApiOperation({ summary: 'Get notification settings for a chat room' })
    @ApiResponse({
        status: 200,
        description: 'Notification settings retrieved',
        schema: {
            example: {
                success: true,
                settings: { chatRoomId: 1, mute: false },
            },
        },
    })
    async getNotificationSettings(
        @CurrentUser() user: any,
        @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
    ) {
        const settings = await this.notificationService.getNotificationSettings(
            user.id,
            chatRoomId,
        );
        return { success: true, settings };
    }
}
