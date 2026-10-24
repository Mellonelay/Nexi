import { Injectable, OnModuleDestroy, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayInit } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { CommunicationsService } from './communications.service';
import { RedisService } from '../redis/redis.service';
import { AuthenticatedUser, JwtPayload } from '../auth/auth.types';
import { JwtStrategy } from '../auth/jwt.strategy';
import { Role } from '../prisma/d1-client';
import { AdminPermissionGuard } from '../admin/admin-permission.guard';
import { isCorsOriginAllowed } from '../runtime/runtime.config';

export const ADMIN_COMMUNICATIONS_MESSAGES_ROOM = 'admin:communications:messages';

@Injectable()
@WebSocketGateway({ namespace: '/communications', cors: { origin: (origin, callback) => callback(null, isCorsOriginAllowed(origin)) } })
export class CommunicationsGateway implements OnGatewayInit, OnModuleInit, OnModuleDestroy {
  @WebSocketServer() server!: Namespace;
  private subscriber?: Redis;
  private sequence = 0;

  constructor(
    private readonly jwt: JwtService,
    private readonly jwtStrategy: JwtStrategy,
    private readonly adminPermissions: AdminPermissionGuard,
    private readonly redis: RedisService,
    private readonly service: CommunicationsService,
  ) {}

  afterInit(namespace: Namespace) {
    namespace.use((client, next) => {
      void this.authenticate(client).then(() => next()).catch(() => next(new Error('Unauthorized')));
    });
  }

  async onModuleInit() {
    if (!this.redis.isAvailable()) return;
    try {
      this.subscriber = await this.redis.createSubscriber();
      await this.subscriber.subscribe('nexi:b8:communications');
      this.subscriber.on('message', (_channel, message) => this.broadcast(message));
    } catch {
      this.subscriber = undefined;
    }
  }

  async onModuleDestroy() { if (this.subscriber) await this.redis.releaseSubscriber(this.subscriber); }

  async handleConnection(client: Socket) {
    const user = client.data.authenticatedUser as AuthenticatedUser;
    await client.join(user.surface === 'ADMIN' ? ADMIN_COMMUNICATIONS_MESSAGES_ROOM : `user:${user.userId}`);
  }

  private async authenticate(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (typeof token !== 'string' || !token) throw new UnauthorizedException('WebSocket authentication required');
    const payload = await this.jwt.verifyAsync<JwtPayload>(token);
    const user = await this.jwtStrategy.validate(payload);
    await this.authorizeCommunicationsUser(user);
    client.data.userId = user.userId;
    client.data.authenticatedUser = user;
  }

  private async authorizeCommunicationsUser(user: AuthenticatedUser) {
    if (user.surface === 'ADMIN' && user.role === Role.ADMIN) {
      if (!await this.adminPermissions.hasPermission(user.userId, 'messages.view')) {
        throw new UnauthorizedException('Messages permission is required');
      }
    } else if (user.surface !== 'PUBLIC' || user.role !== Role.USER) {
      throw new UnauthorizedException('Communications access is not allowed');
    }
  }

  @SubscribeMessage('snapshot')
  async snapshot(@ConnectedSocket() client: Socket, @MessageBody() _body: { sinceSequence?: number }) {
    if (!client.data.userId) throw new UnauthorizedException('WebSocket authentication required');
    return { type: 'communications.snapshot', sequence: this.sequence, data: await this.service.snapshot(client.data.userId) };
  }

  private broadcast(raw: string) {
    try {
      const event = JSON.parse(raw) as { payload?: Record<string, unknown> };
      const payload = event.payload ?? {};
      const targets = [payload.userId, payload.senderId, payload.recipientId].filter((value): value is string => typeof value === 'string');
      this.sequence += 1;
      const message = { sequence: this.sequence, event };
      const supportEvent = targets.includes('support:nexi');
      for (const target of new Set(targets)) {
        if (target !== 'support:nexi') this.server.to(`user:${target}`).emit('communications.event', message);
      }
      if (supportEvent) this.server.to(ADMIN_COMMUNICATIONS_MESSAGES_ROOM).emit('communications.changed', { sequence: this.sequence });
    } catch { /* malformed transport payloads are ignored and durable state remains authoritative */ }
  }
}
