import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { isCorsOriginAllowed } from '../runtime/runtime.config';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => callback(null, isCorsOriginAllowed(origin)),
  },
  namespace: 'spot',
})
export class SpotGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger: Logger = new Logger('SpotGateway');
  private readonly sequenceByPair = new Map<string, bigint>();

  afterInit(server: Server) {
    this.logger.log('Spot Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    client.on('spot.subscribe', (payload: unknown, acknowledge?: (result: Record<string, unknown>) => void) => {
      const pair = this.normalizePair(payload);
      if (!pair) {
        acknowledge?.({ version: 'v1', state: 'ERROR', code: 'INVALID_PAIR' });
        return;
      }
      for (const room of client.rooms) {
        if (room.startsWith('spot:pair:')) client.leave(room);
      }
      client.join(this.roomFor(pair));
      acknowledge?.({ version: 'v1', state: 'LIVE', pair });
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Order-book updates use the established Socket.IO transport. Clients fetch a
  // REST snapshot on connect/reconnect, then apply only pair-scoped updates.
  emitOrderBookUpdate(pair: string, data: any) {
    const normalizedPair = this.normalizePair(pair);
    if (!normalizedPair) return;
    const sequence = (this.sequenceByPair.get(normalizedPair) ?? 0n) + 1n;
    this.sequenceByPair.set(normalizedPair, sequence);
    this.server.to(this.roomFor(normalizedPair)).emit('spot.orderbook', {
      version: 'v1',
      event: 'spot.orderbook',
      pair: normalizedPair,
      sequence: sequence.toString(),
      emittedAt: new Date().toISOString(),
      payload: { orderBook: data },
    });
  }

  private roomFor(pair: string): string {
    return `spot:pair:${pair}`;
  }

  private normalizePair(payload: unknown): string | null {
    const value = typeof payload === 'string'
      ? payload
      : payload && typeof payload === 'object'
        ? (payload as { pair?: unknown }).pair
        : null;
    const pair = String(value ?? '').replaceAll('/', '').trim().toUpperCase();
    return /^[A-Z0-9]{3,32}$/.test(pair) ? pair : null;
  }
}
