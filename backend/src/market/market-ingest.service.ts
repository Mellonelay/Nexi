import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MarketAuthorityService, NormalizedMarketQuoteInput } from './market-authority.service';
import { MarketKlineService } from './market-kline.service';
import { MarketProviderEvent, ProviderDepthEvent, ProviderTradeEvent } from './market-provider.adapter';
import { MarketProviderRouterService } from './market-provider-router.service';
import { RedisService } from '../redis/redis.service';
import { MarketReferencePersistenceService } from './market-reference-persistence.service';
import { MARKET_REFERENCE_CHANNEL } from './market.types';

@Injectable()
export class MarketIngestService implements OnModuleInit, OnModuleDestroy {
  private static readonly MAX_CONCURRENT_EVENT_WORKERS = 8;
  private readonly logger = new Logger(MarketIngestService.name);
  private readonly eventQueue: MarketProviderEvent[] = [];
  private activeWorkers = 0;
  private lastSaturationLogAt = 0;
  constructor(
    private readonly marketAuthority: MarketAuthorityService,
    private readonly marketKlines: MarketKlineService,
    private readonly providers: MarketProviderRouterService,
    private readonly redis: RedisService,
    private readonly referencePersistence: MarketReferencePersistenceService,
  ) {}

  async onModuleInit(): Promise<void> {
    const started = await this.providers.start((event) => this.enqueue(event));
    if (!started) {
      this.logger.log('Market provider disabled or not configured; serving persisted catalog and explicit unavailable states.');
    }
  }

  onModuleDestroy(): void {
    this.providers.stop();
    this.eventQueue.length = 0;
  }

  private enqueue(event: MarketProviderEvent): void {
    // Provider callbacks may arrive faster than Neon can durably persist them.
    // Coalesce queued ticker updates by symbol and bound the queue so a market
    // burst cannot exhaust the Prisma pool or the Node heap.
    if (event.kind === 'ticker' || event.kind === 'depth') {
      const existing = this.eventQueue.findIndex((queued) => queued.kind === event.kind
        && queued.symbol === event.symbol
        && queued.provider === event.provider);
      if (existing >= 0) {
        this.eventQueue[existing] = event;
        return;
      }
    }
    if (this.eventQueue.length >= 256) {
      const tradeIndex = this.eventQueue.findIndex((queued) => queued.kind === 'trade');
      const tickerIndex = this.eventQueue.findIndex((queued) => queued.kind === 'ticker');
      const discardIndex = tradeIndex >= 0 ? tradeIndex : tickerIndex >= 0 ? tickerIndex : 0;
      this.eventQueue.splice(discardIndex, 1);
      if (Date.now() - this.lastSaturationLogAt > 60_000) {
        this.lastSaturationLogAt = Date.now();
        this.logger.warn('Market provider queue saturated; oldest reference event dropped.');
      }
    }
    this.eventQueue.push(event);
    void this.drainQueue();
  }

  private async drainQueue(): Promise<void> {
    if (this.activeWorkers >= MarketIngestService.MAX_CONCURRENT_EVENT_WORKERS) return;
    this.activeWorkers += 1;
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) await this.handleProviderEvent(event);
      }
    } finally {
      this.activeWorkers -= 1;
      if (this.eventQueue.length > 0 && this.activeWorkers < MarketIngestService.MAX_CONCURRENT_EVENT_WORKERS) void this.drainQueue();
    }
  }

  async ingestNormalizedQuote(input: NormalizedMarketQuoteInput): Promise<{ accepted: boolean; reason?: string }> {
    return this.marketAuthority.ingestQuote(input);
  }

  private async handleProviderEvent(event: MarketProviderEvent): Promise<void> {
    try {
      if (event.kind === 'ticker') {
        const quote = await this.marketAuthority.ingestQuote({
          symbol: event.symbol,
          provider: event.provider,
          source: event.source,
          providerInstrument: event.providerInstrument,
          priceType: event.priceType,
          price: event.price, change24h: event.change24h, volume24h: event.volume24h,
          high24h: event.high24h, low24h: event.low24h, bid: event.bid, ask: event.ask, spread: event.spread,
          observedAt: new Date(event.eventTime),
        });
        if (quote.accepted) {
          await this.marketKlines.accumulateQuote({
            symbol: event.symbol, price: event.price, provider: event.provider,
            source: event.source,
            observedAt: new Date(event.eventTime),
          });
        }
      } else if (event.kind === 'kline' && event.closed) {
        await this.marketKlines.persist({
          symbol: event.symbol, interval: event.interval, openTime: new Date(event.openTime), closeTime: new Date(event.closeTime),
           open: event.open, high: event.high, low: event.low, close: event.close, volume: event.volume,
           provider: event.provider, source: event.source, observedAt: new Date(event.eventTime),
        });
      } else if (event.kind === 'depth' || event.kind === 'trade') {
        const result = event.kind === 'depth'
          ? await this.referencePersistence.persistDepth(event)
          : await this.referencePersistence.persistTrade(event);
        if (!result.accepted && result.reason !== 'DUPLICATE') {
          this.logger.warn(`Reference market event not persisted: ${result.reason}`);
        }
        await this.publishReferenceMarketEvent(event);
      }
    } catch (error) {
      this.logger.warn(`Market provider payload rejected: ${error instanceof Error ? error.message : 'invalid payload'}`);
    }
  }

  private async publishReferenceMarketEvent(event: ProviderDepthEvent | ProviderTradeEvent): Promise<void> {
    if (!this.redis.isAvailable()) return;
    const payload = event.kind === 'depth'
      ? { version: 'v1' as const, event: 'market.reference.depth' as const, ...event }
      : { version: 'v1' as const, event: 'market.reference.trade' as const, ...event };
    await this.redis.publish(MARKET_REFERENCE_CHANNEL, JSON.stringify(payload));
  }
}
