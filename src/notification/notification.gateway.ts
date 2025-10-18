import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWTPayloadType } from '../utils/types';
import { GetNotificationsDto } from './dtos/get-notifications.dto';
import { forwardRef, Inject } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
    user?: User;
}

@WebSocketGateway({
    namespace: '/notifications',
    cors: {
        origin: '*', // Configure this properly for production
    },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Track connected users for notifications
    private connectedUsers = new Map<number, Set<string>>(); // userId -> Set<socketId>

    constructor(
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
        private readonly jwtService: JwtService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    // Handle client connection
    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Extract token from handshake auth
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }

            // Verify JWT token and get user
            const payload = await this.jwtService.verifyAsync<JWTPayloadType>(token);
            const user = await this.userRepository.findOne({ where: { id: payload.id } });

            if (!user) {
                client.disconnect();
                return;
            }

            // Attach user to socket and track connection
            client.user = user;
            this.addSocketForUser(user.id, client.id);

            // Join a per-user private room for notifications
            client.join(this.userNotificationRoom(user.id));

            console.log(`User ${user.id} connected to notification gateway`);

        } catch (error) {
            console.error('Notification gateway connection error:', error);
            client.disconnect();
        }
    }

    // Handle client disconnection
    handleDisconnect(client: AuthenticatedSocket) {
        if (!client.user) return;

        this.removeSocketForUser(client.user.id, client.id);
        console.log(`User ${client.user.id} disconnected from notification gateway`);
    }

    // Get user notifications
    @SubscribeMessage('getNotifications')
    async handleGetNotifications(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: GetNotificationsDto,
    ) {
        try {
            if (!client.user) {
                return { error: 'Unauthorized' };
            }

            const result = await this.notificationService.getUserNotifications(
                client.user.id,
                data,
            );

            return { success: true, ...result };
        } catch (error) {
            return { error: error.message };
        }
    }


    // Emit notification to specific user
    emitNotificationToUser(userId: number, notification: any) {
        this.server.to(this.userNotificationRoom(userId)).emit('newNotification', notification);
    }

    // Emit notification to multiple users
    emitNotificationToUsers(userIds: number[], notification: any) {
        userIds.forEach((userId) => {
            this.emitNotificationToUser(userId, notification);
        });
    }

    // Check if user is online
    isUserOnline(userId: number): boolean {
        return this.connectedUsers.has(userId);
    }

    // ---- Internal helpers ----
    private addSocketForUser(userId: number, socketId: string) {
        const set = this.connectedUsers.get(userId) || new Set<string>();
        set.add(socketId);
        this.connectedUsers.set(userId, set);
    }

    private removeSocketForUser(userId: number, socketId: string) {
        const set = this.connectedUsers.get(userId);
        if (!set) return;
        set.delete(socketId);
        if (set.size === 0) {
            this.connectedUsers.delete(userId);
        } else {
            this.connectedUsers.set(userId, set);
        }
    }

    private userNotificationRoom(userId: number) {
        return `user_notifications:${userId}`;
    }
}