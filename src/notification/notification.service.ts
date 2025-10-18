import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, } from './notification.entity';

import { NotificationSettings } from './notification-settings.entity';
import { User } from '../user/user.entity';
import { ChatRoom } from '../chat/chat-room.entity';
import { Message } from '../chat/message.entity';
import { Group } from '../chat/group.entity';
import { MuteNotificationsDto, } from './dtos/mute-notifications.dto';
import { GetNotificationsDto } from './dtos/get-notifications.dto';
import { NotificationType } from './enums/notification-type';
import { NotificationStatus } from './enums/notification-status';
import { MuteDuration } from './enums/mute-duration';
import { UpdateNotificationSettingsDto } from './dtos/update-notification-setting.dto';
import { MarkAllNotificationsReadDto } from './dtos/mark-all-notifications-read.dto';
import { MarkNotificationReadDto } from './dtos/mark-notification-read.dto';
import { DeleteNotificationDto } from './dtos/delete-notification.dto';
import { ChatRoomType } from 'src/enums/chat-room-type';
import { ChatService } from 'src/chat/chat.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(NotificationSettings)
        private notificationSettingsRepository: Repository<NotificationSettings>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(ChatRoom)
        private chatRoomRepository: Repository<ChatRoom>,
        @InjectRepository(Group)
        private groupRepository: Repository<Group>,
        @Inject(forwardRef(() => ChatService))
        private readonly chatService: ChatService,
        @Inject(forwardRef(() => NotificationGateway))
        private readonly notificationGateway: NotificationGateway,) { }

    // Send a notification for a new message
    async sendMessageNotification(
        message: Message,
        chatRoom: ChatRoom,
        sender: User,
    ): Promise<Notification[]> {
        const notifications: Notification[] = [];

        const participants = await this.getChatRoomParticipants(chatRoom);

        const recipients = participants.filter(user => user.id !== sender.id);

        for (const recipient of recipients) {
            const isMuted = await this.isNotificationMuted(recipient.id, chatRoom.id);

            if (isMuted) {
                continue;
            }

            // Create notification
            const notification = this.notificationRepository.create({
                user: recipient,
                chatRoom,
                message,
                type: NotificationType.MESSAGE,
                title: this.generateMessageTitle(sender, chatRoom),
                body: this.generateMessageBody(message),
                data: {
                    senderId: sender.id,
                    senderName: sender.username || sender.firstName,
                    senderProfileImage: sender.profileImage,
                    chatRoomId: chatRoom.id,
                    messageId: message.id,
                    isGroup: chatRoom.type === 'GROUP',
                    groupName: chatRoom.group?.name,
                },
                isSilent: false,
            });

            notifications.push(notification);
        }

        const savedNotifications = await this.notificationRepository.save(notifications);
        savedNotifications.forEach(notification => {
            this.notificationGateway.emitNotificationToUser(notification.user.id, notification);
        });

        return savedNotifications;
    }


    async getUserNotifications(
        userId: number,
        dto: GetNotificationsDto,
    ): Promise<{
        notifications: Notification[];
        total: number;
        page: number;
        limit: number;
    }> {
        const { status, type, page = 1, limit = 20, chatRoomId } = dto;

        const where: any = {
            user: { id: userId },
        };

        if (status) where.status = status;
        if (type) where.type = type;
        if (chatRoomId) where.chatRoom = { id: chatRoomId };

        const [notifications, total] = await this.notificationRepository.findAndCount({
            where,
            relations: {
                user: true,
                chatRoom: true,
                message: { sender: true },
            },
            order: {
                createdAt: 'DESC',
            },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            notifications,
            total,
            page,
            limit,
        };
    }



    async markNotificationAsRead(
        userId: number,
        dto: MarkNotificationReadDto,
    ): Promise<Notification> {
        const notification = await this.notificationRepository.findOne({
            where: {
                id: dto.notificationId,
                user: { id: userId },
            },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        notification.status = NotificationStatus.READ;
        return this.notificationRepository.save(notification);
    }


    async markAllNotificationsAsRead(
        userId: number,
        dto: MarkAllNotificationsReadDto,
    ): Promise<void> {
        const conditions: any = {
            user: { id: userId },
            status: NotificationStatus.UNREAD,
        };

        if (dto.type) {
            conditions.type = dto.type;
        }

        if (dto.chatRoomId) {
            conditions.chatRoom = { id: dto.chatRoomId };
        }

        await this.notificationRepository.update(conditions, {
            status: NotificationStatus.READ,
        });
    }


    async deleteNotification(
        userId: number,
        dto: DeleteNotificationDto,
    ): Promise<void> {
        const notification = await this.notificationRepository.findOne({
            where: {
                id: dto.notificationId,
                user: { id: userId },
            },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        await this.notificationRepository.remove(notification);
    }


    async muteNotifications(
        userId: number,
        dto: MuteNotificationsDto,
    ): Promise<NotificationSettings> {
        const { duration, chatRoomId, groupId } = dto;

        if (!chatRoomId && !groupId) {
            throw new BadRequestException('Either chatRoomId or groupId is required');
        }

        let chatRoom: ChatRoom;

        if (groupId) {
            // Get or create chat room for group
            chatRoom = await this.chatService.getOrCreateChatRoom(userId, groupId, true);
        } else {
            chatRoom = await this.chatRoomRepository.findOne({
                where: { id: chatRoomId },
                relations: ['user1', 'user2', 'group'],
            });

            if (!chatRoom) {
                throw new NotFoundException('Chat room not found');
            }
        }

        // Check if user is part of this chat room
        if (!this.isUserInChatRoom(userId, chatRoom)) {
            throw new BadRequestException('You are not part of this chat room');
        }

        let settings = await this.notificationSettingsRepository.findOne({
            where: {
                user: { id: userId },
                chatRoom: { id: chatRoom.id },
            },
        });

        if (!settings) {
            settings = this.notificationSettingsRepository.create({
                user: { id: userId },
                chatRoom,
                muteDuration: duration,
            });
        } else {
            settings.muteDuration = duration;
        }

        settings.mutedUntil = settings.computeMuteUntil(duration);

        return this.notificationSettingsRepository.save(settings);
    }

    async unmuteNotifications(
        userId: number,
        dto: { chatRoomId?: number; groupId?: number },
    ): Promise<void> {
        const { chatRoomId, groupId } = dto;

        if (!chatRoomId && !groupId) {
            throw new BadRequestException('Either chatRoomId or groupId is required');
        }

        let chatRoom: ChatRoom;

        if (groupId) {
            chatRoom = await this.chatService.getOrCreateChatRoom(userId, groupId, true);
        } else {
            chatRoom = await this.chatRoomRepository.findOne({
                where: { id: chatRoomId },
            });

            if (!chatRoom) {
                throw new NotFoundException('Chat room not found');
            }
        }
        await this.notificationSettingsRepository.update(
            {
                user: { id: userId },
                chatRoom: { id: chatRoom.id },
            },
            {
                muteDuration: MuteDuration.OFF,
                mutedUntil: null,
            },
        );
    }

    async updateNotificationSettings(
        userId: number,
        dto: UpdateNotificationSettingsDto,
    ): Promise<NotificationSettings> {
        const { chatRoomId, groupId, ...settingsData } = dto;

        if (!chatRoomId && !groupId) {
            throw new BadRequestException('Either chatRoomId or groupId is required');
        }

        let chatRoom: ChatRoom;

        if (groupId) {
            chatRoom = await this.chatService.getOrCreateChatRoom(userId, groupId, true);
        } else {
            chatRoom = await this.chatRoomRepository.findOne({
                where: { id: chatRoomId },
            });

            if (!chatRoom) {
                throw new NotFoundException('Chat room not found');
            }
        }
        let settings = await this.notificationSettingsRepository.findOne({
            where: {
                user: { id: userId },
                chatRoom: { id: chatRoom.id },
            },
        });

        if (!settings) {
            settings = this.notificationSettingsRepository.create({
                user: { id: userId },
                chatRoom,
                ...settingsData,
                mutedUntil: settingsData.muteDuration ? settings.computeMuteUntil(settingsData.muteDuration) : null,
            });
        } else {
            Object.assign(settings, settingsData);
            if (settingsData.muteDuration) {
                settings.mutedUntil = settings.computeMuteUntil(settingsData.muteDuration);
            }
        }

        return this.notificationSettingsRepository.save(settings);
    }

    async getNotificationSettings(
        userId: number,
        chatRoomId: number,
    ): Promise<NotificationSettings | null> {
        return this.notificationSettingsRepository.findOne({
            where: {
                user: { id: userId },
                chatRoom: { id: chatRoomId },
            },
            relations: ['user', 'chatRoom'],
        });
    }

    async getUnreadNotificationCount(userId: number): Promise<number> {
        return this.notificationRepository.count({
            where: {
                user: { id: userId },
                status: NotificationStatus.UNREAD,
            },
        });
    }


    private isUserInChatRoom(userId: number, chatRoom: ChatRoom): boolean {
        if (chatRoom.type === 'GROUP' && chatRoom.group) {
            return chatRoom.group.members.some(member => member.id === userId);
        } else {
            return chatRoom.user1.id === userId || chatRoom.user2.id === userId;
        }
    }

    private generateMessageTitle(sender: User, chatRoom: ChatRoom): string {
        if (chatRoom.type === 'GROUP' && chatRoom.group) {
            return `${sender.username || sender.firstName} in ${chatRoom.group.name}`;
        } else {
            return sender.username || sender.firstName || 'New message';
        }
    }

    private generateMessageBody(message: Message): string {
        switch (message.type) {
            case 'text':
                return message.content || 'New message';
            case 'file':
                return `📎 Sent a file: ${message.fileName || 'file'}`;
            default:
                return 'New message';
        }
    }

    private async getChatRoomParticipants(chatRoom: ChatRoom): Promise<User[]> {
        if (chatRoom.type === 'GROUP' && chatRoom.group) {
            return chatRoom.group.members;
        } else {
            return [chatRoom.user1, chatRoom.user2];
        }
    }
    private async isNotificationMuted(userId: number, chatRoomId: number): Promise<boolean> {
        const settings = await this.notificationSettingsRepository.findOne({
            where: {
                user: { id: userId },
                chatRoom: { id: chatRoomId },
            },
        });

        if (!settings) {
            return false;
        }

        return settings.isMuted();
    }

}







