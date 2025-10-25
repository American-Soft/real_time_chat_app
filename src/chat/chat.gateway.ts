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
import { ChatService } from './chat.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { GetMessagesDto } from './dtos/get-messages.dto';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JWTPayloadType } from '../utils/types';
import { AgoraService } from 'src/call/agora.service';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly for production
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track multiple sockets per user for multi-device support
  private connectedUsers = new Map<number, Set<string>>(); // userId -> Set<socketId>

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly agoraService: AgoraService,

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

      // Join a per-user private room to simplify targeted emits
      client.join(this.userRoom(user.id));

      // Broadcast presence only when the first socket connects
      if (this.getSocketsForUser(user.id)?.size === 1) {
        this.server.emit('userOnline', { userId: user.id });
      }

    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  // Handle client disconnection
  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.user) return;
    const wasOnline = this.getSocketsForUser(client.user.id)?.size || 0;
    this.removeSocketForUser(client.user.id, client.id);
    const nowOnline = this.getSocketsForUser(client.user.id)?.size || 0;

    // Leave per-user room automatically handled by socket.io

    // If last socket disconnected, broadcast offline
    if (wasOnline > 0 && nowOnline === 0) {
      this.server.emit('userOffline', { userId: client.user.id });
    }
  }

  // Join a chat room
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId?: number; groupId?: number },
  ) {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      if (!parsedData?.receiverId && !parsedData?.groupId) {
        return { error: 'receiverId or groupId is required' };
      }

      const isGroup = !!parsedData.groupId;
      const targetId = parsedData.groupId ?? parsedData.receiverId!;

      const chatRoom = await this.chatService.getOrCreateChatRoom(
        client.user.id,
        targetId,
        isGroup,
      );

      // Join the room
      client.join(chatRoom.roomId);

      // Mark messages as read
      await this.chatService.markMessagesAsRead(client.user.id, targetId);

      // Notify others in room about join
      client.to(chatRoom.roomId).emit('userJoinedRoom', {
        userId: client.user.id,
        roomId: chatRoom.roomId,
      });

      return { success: true, roomId: chatRoom.roomId };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Send a message
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() sendMessageDto: SendMessageDto,
  ) {
    const parsedDto = typeof sendMessageDto === 'string' ? JSON.parse(sendMessageDto) : sendMessageDto;
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      // Save message to database
      const message = await this.chatService.sendMessage(
        client.user.id,
        parsedDto,
      );

      // Get chat room
      const isGroup = !!parsedDto.groupId;
      const targetId = parsedDto.groupId ?? parsedDto.receiverId;
      const chatRoom = await this.chatService.getOrCreateChatRoom(
        client.user.id,
        targetId,
        isGroup,
      );
      // Emit message to all users in the room
      // Emit message to all users in the room (only for groups)
      if (isGroup) {
        this.server.to(chatRoom.roomId).emit('newMessage', {
          message,
          roomId: chatRoom.roomId,
        });
      } else if (parsedDto.receiverId) {
        // Direct emit for 1:1 chats
        this.emitToUser(parsedDto.receiverId, 'newMessage', {
          message,
          roomId: chatRoom.roomId,
        });
      }


      // Emit to sender for confirmation
      client.emit('messageSent', { message, roomId: chatRoom.roomId });

      return { success: true, message };
    } catch (error) {
      return { error: error.message };
    }
  }


  // Get messages via websocket (optional helper to avoid REST)
  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: GetMessagesDto,
  ) {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      if (!client.user) return { error: 'Unauthorized' };
      const result = await this.chatService.getMessages(client.user.id, parsedData);
      return { success: true, ...result };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { senderId?: number; groupId?: number },
  ) {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const targetId = parsedData.groupId ?? parsedData.senderId;
      if (!targetId) return { error: 'senderId or groupId is required' };

      await this.chatService.markMessagesAsRead(client.user.id, targetId);

      // Notify the sender that messages have been read
      if (parsedData.senderId) {
        this.emitToUser(parsedData.senderId, 'messagesRead', {
          readerId: client.user.id,
        });
      } else if (parsedData.groupId) {
        // Also notify room for group reads
        const chatRoom = await this.chatService.getOrCreateChatRoom(
          client.user.id,
          parsedData.groupId,
          true,
        );
        this.server.to(chatRoom.roomId).emit('messagesRead', {
          readerId: client.user.id,
          roomId: chatRoom.roomId,
        });
      }

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Typing indicator
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { receiverId?: number; groupId?: number; isTyping: boolean },
  ) {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const isGroup = !!parsedData.groupId;
      const targetId = parsedData.groupId ?? parsedData.receiverId;
      if (!targetId) return { error: 'receiverId or groupId is required' };
      const chatRoom = await this.chatService.getOrCreateChatRoom(
        client.user.id,
        targetId,
        isGroup,
      );

      // Emit typing indicator to other users in the room
      client.to(chatRoom.roomId).emit('userTyping', {
        userId: client.user.id,
        isTyping: parsedData.isTyping,
        roomId: chatRoom.roomId,
      });
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get online status
  @SubscribeMessage('getOnlineStatus')
  async handleGetOnlineStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userIds: number[] },
  ) {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const onlineStatus = {} as Record<number, boolean>;
      parsedData.userIds.forEach((userId) => {
        onlineStatus[userId] = this.isUserOnline(userId);
      });

      return { onlineStatus };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('getUnreadCount')
  async handleGetUnreadCount(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) return { error: 'Unauthorized' };
      const result = await this.chatService.getUnreadCount(client.user.id);
      return { success: true, unread: result };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get chat rooms (conversations) for current user
  @SubscribeMessage('getUserChatRooms')
  async handleGetUserChatRooms(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) return { error: 'Unauthorized' };
      const rooms = await this.chatService.getUserChatRooms(client.user.id);
      return { success: true, rooms };
    } catch (error) {
      return { error: error.message };
    }
  }

  // ---- Call Signaling (Agora) ----
  @SubscribeMessage('startCall')
  async handleStartCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { receiverId?: number; groupId?: number; callType: 'audio' | 'video' },
  ) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!client.user) return { error: 'Unauthorized' };

      const isGroup = !!parsed.groupId;
      const targetId = parsed.groupId ?? parsed.receiverId;
      if (!targetId) return { error: 'receiverId or groupId is required' };

      // Validate and get participants
      const participantIds = await this.chatService.getChatParticipantIds(
        client.user.id,
        targetId,
        isGroup,
      );

      // Use chat room id as the Agora channel base
      const chatRoom = await this.chatService.getOrCreateChatRoom(
        client.user.id,
        targetId,
        isGroup,
      );
      const channel = `call:${chatRoom.roomId}`;

      // ✅ Generate Agora token for the caller
      const { token, expireAt } = this.agoraService.generateRtcToken(
        channel,
        client.user.id, // use user ID as UID
      );

      // Notify all other participants about incoming call
      const others = participantIds.filter((id) => id !== client.user!.id);
      this.emitToUsers(others, 'incomingCall', {
        fromUserId: client.user.id,
        callType: parsed.callType,
        isGroup,
        targetId,
        roomId: chatRoom.roomId,
        channel,
        expireAt,
      });

      // Return channel + token to the caller
      return {
        success: true,
        channel,
        roomId: chatRoom.roomId,
        token,
        expireAt,
      };
    } catch (error) {
      return { error: error.message };
    }
  }


  @SubscribeMessage('acceptCall')
  async handleAcceptCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { receiverId?: number; groupId?: number; channel: string },
  ) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!client.user) return { error: 'Unauthorized' };
      const isGroup = !!parsed.groupId;
      const targetId = parsed.groupId ?? parsed.receiverId;
      if (!targetId || !parsed.channel) return { error: 'Invalid payload' };

      // ✅ Generate Agora token for the callee
      const { token, expireAt } = this.agoraService.generateRtcToken(
        parsed.channel,
        client.user.id, // use callee's user ID as UID
      );

      // Get other participants
      const participantIds = await this.chatService.getChatParticipantIds(
        client.user.id,
        targetId,
        isGroup,
      );
      const others = participantIds.filter((id) => id !== client.user!.id);

      // Notify others that this user accepted the call
      this.emitToUsers(others, 'callAccepted', {
        byUserId: client.user.id,
        channel: parsed.channel,
        isGroup,
        targetId,
        expireAt,
      });

      return {
        success: true,
        channel: parsed.channel,
        token,
        expireAt,
      };
    } catch (error) {
      return { error: error.message };
    }
  }


  @SubscribeMessage('rejectCall')
  async handleRejectCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { receiverId?: number; groupId?: number; channel: string; reason?: string },
  ) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!client.user) return { error: 'Unauthorized' };
      const isGroup = !!parsed.groupId;
      const targetId = parsed.groupId ?? parsed.receiverId;
      if (!targetId || !parsed.channel) return { error: 'Invalid payload' };

      const participantIds = await this.chatService.getChatParticipantIds(
        client.user.id,
        targetId,
        isGroup,
      );
      const others = participantIds.filter((id) => id !== client.user!.id);
      this.emitToUsers(others, 'callRejected', {
        byUserId: client.user.id,
        channel: parsed.channel,
        reason: parsed.reason ?? 'rejected',
        isGroup,
        targetId,
      });
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  @SubscribeMessage('endCall')
  async handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { receiverId?: number; groupId?: number; channel: string },
  ) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!client.user) return { error: 'Unauthorized' };
      const isGroup = !!parsed.groupId;
      const targetId = parsed.groupId ?? parsed.receiverId;
      if (!targetId || !parsed.channel) return { error: 'Invalid payload' };

      const participantIds = await this.chatService.getChatParticipantIds(
        client.user.id,
        targetId,
        isGroup,
      );
      const others = participantIds.filter((id) => id !== client.user!.id);
      this.emitToUsers(others, 'callEnded', {
        byUserId: client.user.id,
        channel: parsed.channel,
        isGroup,
        targetId,
      });
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }

  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Helper method to emit to specific user

  emitToUser(userId: number, event: string, data: any) {
    // Use per-user room to reach all devices
    this.server.to(this.userRoom(userId)).emit(event, data);
  }

  // Helper method to emit to multiple users
  emitToUsers(userIds: number[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.emitToUser(userId, event, data);
    });
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

  private getSocketsForUser(userId: number) {
    return this.connectedUsers.get(userId);
  }

  private userRoom(userId: number) {
    return `user:${userId}`;
  }
} 