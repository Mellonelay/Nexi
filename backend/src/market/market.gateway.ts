import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { RedisService } from '../redis/redis.service';
import { isCorsOriginAllowed } from '../runtime/runtime.config';
import { MarketAuthorityService, MarketQuoteEvent } from './market-authority.service';
import { MARKET_QUOTES_CHANNEL, MARKET_REFERENCE_CHANNEL, MarketReferenceEvent } from './market.types';
import { MARKET_REALTIME_CONTRACT } from './market-realtime.contract';

@Injectable()
@WebSocketGateway({
  namespace: '/market',
  cors: {
    origin: (origin, callback) => callback(null, isCorsOriginAllowed(origin)),
  },
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MarketGateway.name);
  private subscriber?: Redis;
  private readonly lastSequenceBySymbol = new Map<string, bigint>();

  constructor(
    private readonly redisService: RedisService,
    private readonly marketAuthority: MarketAuthorityService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.subscriber = await this.redisService.createSubscriber();
      await this.subscriber.subscribe(MARKET_QUOTES_CHANNEL, MARKET_REFERENCE_CHANNEL);
    } catch {
      this.subscriber = undefined;
      this.logger.warn('Market Redis subscription deferred; readiness remains false until Redis is available.');
      return;
    }
    this.subscriber.on('message', (channel, message) => {
      try {
        if (channel === MARKET_QUOTES_CHANNEL) {
          this.broadcastMarketQuote(JSON.parse(message) as MarketQuoteEvent);
        } else if (channel === MARKET_REFERENCE_CHANNEL) {
          this.broadcastMarketReference(JSON.parse(message) as MarketReferenceEvent);
        }
      } catch (error) {
        this.logger.warn(`Ignoring malformed market event: ${error instanceof Error ? error.message : 'invalid JSON'}`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.redisService.releaseSubscriber(this.subscriber);
      this.subscriber = undefined;
    }
    this.lastSequenceBySymbol.clear();
  }

  handleConnection(client: Socket): void {
    setTimeout(() => { void this.sendSnapshot(client); }, 50);
  }

  handleDisconnect(_client: Socket): void {
    // Socket.IO owns client cleanup. No per-client market subscription state is retained.
  }

  private async sendSnapshot(client: Socket): Promise<void> {
    try {
      const prices = await this.marketAuthority.getPrices();
      client.emit('market_snapshot', {
        version: MARKET_REALTIME_CONTRACT.version,
        recovery: MARKET_REALTIME_CONTRACT.recovery,
        cursor: null,
        state: this.snapshotState(prices),
        data: prices,
      });
    } catch (error) {
      client.emit('market_snapshot', { version: MARKET_REALTIME_CONTRACT.version, recovery: MARKET_REALTIME_CONTRACT.recovery, cursor: null, state: 'UNAVAILABLE', data: [] });
      this.logger.warn(`Market snapshot unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private snapshotState(prices: Array<Record<string, unknown>>): 'LIVE' | 'STALE' | 'ERROR' | 'UNAVAILABLE' {
    const states = prices.map((price) => price.state);
    if (states.includes('LIVE')) return 'LIVE';
    if (states.includes('STALE')) return 'STALE';
    if (states.includes('ERROR')) return 'ERROR';
    return 'UNAVAILABLE';
  }

  private broadcastMarketQuote(event: MarketQuoteEvent): void {
    const symbol = event.quote.symbol;
    const sequence = BigInt(event.sequence);
    const previous = this.lastSequenceBySymbol.get(symbol);
    if (previous !== undefined && sequence <= previous) return;
    this.lastSequenceBySymbol.set(symbol, sequence);
    if (!this.redisService.isAvailable() || !this.server) return;

    this.emitMarketEvent('market_quote', event);
    // Preserve the established frontend event vocabulary with the normalized quote payload.
    this.emitMarketEvent('market_tick', {
      symbol,
      price: event.quote.price,
      change: event.quote.change24h,
      vol: event.quote.volume24h,
      timestamp: event.quote.observedAt,
      sequence: event.sequence,
      state: event.quote.state,
      provider: event.quote.provider,
      source: event.quote.source,
      providerInstrument: event.quote.providerInstrument,
      priceType: event.quote.priceType,
      canonicalAssetId: event.quote.canonicalAssetId,
      assetClass: event.quote.assetClass,
    });
  }

  private broadcastMarketReference(event: MarketReferenceEvent): void {
    if (!this.redisService.isAvailable() || !this.server) return;
    this.emitMarketEvent(event.event, event);
  }

  /**
   * Redis adapter publication can reject while its ioredis client is reconnecting.
   * Market data is reference-only, so a transient publication failure must not
   * terminate the Nest process. Clients recover from the next snapshot/reconnect.
   */
  private emitMarketEvent(event: string, payload: unknown): void {
    try {
      this.server.emit(event, payload);
    } catch (error) {
      this.logger.warn(`Market realtime publication skipped: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
}
