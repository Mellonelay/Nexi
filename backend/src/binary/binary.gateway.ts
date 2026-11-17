import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/auth.types';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthSecurityEventsService } from '../auth/auth-security-events.service';
import { isCorsOriginAllowed } from '../runtime/runtime.config';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => callback(null, isCorsOriginAllowed(origin)),
  },
})
export class BinaryGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private unsubscribeSecurityEvents?: () => void;

  constructor(
    private readonly jwtService: JwtService,
    private readonly jwtStrategy: JwtStrategy,
    private readonly securityEvents: AuthSecurityEventsService,
  ) {}

  onModuleInit(): void {
    this.unsubscribeSecurityEvents = this.securityEvents.on((event) => {
      if (event.surface !== 'PUBLIC') return;
      if (event.type === 'LOGOUT' && event.sessionId) {
        this.server?.in('auth-session:' + event.sessionId).disconnectSockets(true);
      } else if (event.type === 'LOGOUT_ALL' && event.userId) {
        this.server?.in(event.userId).disconnectSockets(true);
      }
    });
  }

  onModuleDestroy(): void {
    this.unsubscribeSecurityEvents?.();
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (typeof token !== 'string' || !token) {
      client.disconnect(true);
      return;
    }
    // The REST boundary remains the primary session authority. The gateway
    // also validates the active session before joining its private event room.
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.jwtStrategy.validate(payload);
      if (user.surface !== 'PUBLIC' || !user.sessionId) throw new Error('invalid socket claims');
      await client.join(user.userId);
      await client.join('auth-session:' + user.sessionId);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    void client;
  }

  emitPositionUpdate(userId: string, payload: unknown): void {
    this.server?.to(userId).emit('binary_position_update', payload);
  }
}
