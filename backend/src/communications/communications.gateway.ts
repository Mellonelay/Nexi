import { Injectable, OnModuleDestroy, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { CommunicationsService } from './communications.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
@WebSocketGateway({ namespace: '/communications', cors: { origin: true } })
export class CommunicationsGateway implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer() server!: Server;
  private subscriber?: Redis;
  private sequence = 0;

  constructor(private readonly jwt: JwtService, private readonly redis: RedisService, private readonly service: CommunicationsService) {}

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
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (typeof token !== 'string') throw new UnauthorizedException('WebSocket authentication required');
      const payload = await this.jwt.verifyAsync<{ sub?: string; role?: string }>(token);
      if (!payload.sub) throw new UnauthorizedException('Invalid WebSocket authentication');
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch { client.disconnect(true); }
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
      for (const target of new Set(targets)) this.server.to(`user:${target}`).emit('communications.event', message);
    } catch { /* malformed transport payloads are ignored and durable state remains authoritative */ }
  }
}
