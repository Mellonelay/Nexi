import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MarketAuthorityService, NormalizedMarketQuoteInput } from './market-authority.service';
import { MarketKlineService } from './market-kline.service';
import { MarketProviderEvent, ProviderDepthEvent, ProviderTradeEvent } from './market-provider.adapter';
import { MarketProviderRouterService } from './market-provider-router.service';
import { MarketSeederService } from './market-seeder.service';
import { RedisService } from '../redis/redis.service';
import { MARKET_KLINES_CHANNEL, MARKET_REFERENCE_CHANNEL, MarketKlineRealtimeEvent } from './market.types';

@Injectable()
export class MarketIngestService implements OnModuleInit, OnModuleDestroy {
  private static readonly MAX_CONCURRENT_EVENT_WORKERS = 8;
  private readonly logger = new Logger(MarketIngestService.name);
  private readonly eventQueue: MarketProviderEvent[] = [];
  private activeWorkers = 0;
  private lastSaturationLogAt = 0;
  private providerStartRetryTimer?: NodeJS.Timeout;
  private providerStartAttempt = 0;
  private destroyed = false;
  constructor(
    private readonly marketAuthority: MarketAuthorityService,
    private readonly marketKlines: MarketKlineService,
    private readonly marketSeeder: MarketSeederService,
    private readonly providers: MarketProviderRouterService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    this.destroyed = false;
    // Catalog/provider reconciliation is intentionally asynchronous so HTTP can
    // become live quickly, but provider routing must never read D1 before that
    // reconciliation finishes. Start ingestion only from the shared promise.
    void this.startProvidersAfterReconciliation();
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    if (this.providerStartRetryTimer) clearTimeout(this.providerStartRetryTimer);
    this.providerStartRetryTimer = undefined;
    this.providers.stop();
    this.eventQueue.length = 0;
  }

  private async startProvidersAfterReconciliation(): Promise<void> {
    try {
      await this.marketSeeder.ensureReconciled();
      if (this.destroyed) return;
      const started = await this.providers.start((event) => this.enqueue(event));
      this.providerStartAttempt = 0;
      if (!started) {
        this.logger.log('Market provider disabled or not configured; serving persisted catalog and explicit unavailable states.');
      }
    } catch (error) {
      this.providers.stop();
      if (this.destroyed) return;
      const delay = Math.min(5_000 * (2 ** this.providerStartAttempt), 30_000);
      this.providerStartAttempt += 1;
      this.logger.warn(`Market provider startup waiting for catalog reconciliation; retrying in ${delay}ms: ${error instanceof Error ? error.message : 'unknown error'}`);
      this.providerStartRetryTimer = setTimeout(() => {
        this.providerStartRetryTimer = undefined;
        void this.startProvidersAfterReconciliation();
      }, delay);
      this.providerStartRetryTimer.unref?.();
    }
  }

  private enqueue(event: MarketProviderEvent): void {
    // Provider callbacks may arrive faster than D1 can durably persist them.
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
      const referenceIndex = this.eventQueue.findIndex((queued) => queued.kind === 'trade' || queued.kind === 'depth');
      const discardIndex = referenceIndex >= 0 ? referenceIndex : 0;
      const [discarded] = this.eventQueue.splice(discardIndex, 1);
      if (Date.now() - this.lastSaturationLogAt > 60_000) {
        this.lastSaturationLogAt = Date.now();
        this.logger.warn(`Market provider queue saturated; dropped ${discarded?.kind ?? 'unknown'} event to preserve bounded ingestion.`);
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
        const event = this.dequeueNextEvent();
        if (event) await this.handleProviderEvent(event);
      }
    } finally {
      this.activeWorkers -= 1;
      if (this.eventQueue.length > 0 && this.activeWorkers < MarketIngestService.MAX_CONCURRENT_EVENT_WORKERS) void this.drainQueue();
    }
  }

  private dequeueNextEvent(): MarketProviderEvent | undefined {
    const durableIndex = this.eventQueue.findIndex((event) => event.kind === 'ticker' || event.kind === 'kline');
    if (durableIndex >= 0) return this.eventQueue.splice(durableIndex, 1)[0];
    return this.eventQueue.shift();
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
      } else if (event.kind === 'kline') {
        const persisted = await this.marketKlines.persist({
          symbol: event.symbol, interval: event.interval, openTime: new Date(event.openTime), closeTime: new Date(event.closeTime),
           open: event.open, high: event.high, low: event.low, close: event.close, volume: event.volume,
           provider: event.provider, source: event.source, observedAt: new Date(event.eventTime),
        });
        await this.publishMarketKlineEvent(persisted);
        if (event.interval === '1m' && event.closed) {
          const derived = await this.marketKlines.aggregateFromOneMinute(event.symbol, new Date(event.openTime));
          for (const candle of derived) await this.publishMarketKlineEvent(candle);
        }
      } else if (event.kind === 'depth' || event.kind === 'trade') {
        // Reference depth/trade events are realtime-only. D1 remains the durable
        // authority for quotes/Klines; retired archive infrastructure must not
        // sit on the hot provider -> Valkey -> Socket.IO path.
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

  private async publishMarketKlineEvent(candle: {
    symbol: string; interval: string; time: number; closeTime: string | null;
    open: string; high: string; low: string; close: string; volume: string | null;
    provider: string; source: string; observedAt: string; receivedAt: string;
  }): Promise<void> {
    if (!this.redis.isAvailable()) return;
    const payload: MarketKlineRealtimeEvent = {
      version: 'v1', event: 'market_kline', symbol: candle.symbol, interval: candle.interval,
      openTime: candle.time * 1000, closeTime: candle.closeTime ? Date.parse(candle.closeTime) : null,
      open: candle.open, high: candle.high, low: candle.low, close: candle.close, volume: candle.volume,
      provider: candle.provider, source: candle.source, observedAt: candle.observedAt,
      receivedAt: candle.receivedAt, sequence: Date.parse(candle.observedAt),
    };
    await this.redis.publish(MARKET_KLINES_CHANNEL, JSON.stringify(payload));
  }
}
