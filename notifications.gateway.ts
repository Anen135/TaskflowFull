import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Notification } from './entities/notification.entity';

interface AuthedSocket extends Socket {
  data: { userId: string; workspaceId: string };
}

@WebSocketGateway({
  namespace: '/ws/notifications',
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwtService: JwtService) {}

  /**
   * Auth on handshake (not per-message): the client passes a short-lived JWT
   * in `auth.token`. On success we join two rooms:
   *  - `user:{userId}`      → direct notifications to this person
   *  - `workspace:{wsId}`   → workspace-wide broadcasts (e.g. project created)
   */
  async handleConnection(client: AuthedSocket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('Missing auth token');

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.workspaceId = payload.workspaceId;

      client.join(`user:${payload.sub}`);
      client.join(`workspace:${payload.workspaceId}`);

      this.logger.log(`Client connected: user=${payload.sub}`);
    } catch (err) {
      this.logger.warn(`Rejected connection: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.log(`Client disconnected: user=${client.data?.userId}`);
  }

  /** Client acks it has seen/read a notification; we relay this back to
   * NotificationsService so it can persist the read state. */
  @SubscribeMessage('notification:ack')
  handleAck(client: AuthedSocket, notificationId: string) {
    this.server
      .to(`user:${client.data.userId}`)
      .emit('notification:ack:confirmed', { notificationId });
  }

  /** Called by NotificationsService after persisting a Notification row. */
  emitToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  emitToWorkspace(workspaceId: string, event: string, payload: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, payload);
  }
}
