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
  private static readonly MAX_CONCURRENT_REFERENCE_WORKERS = 4;
  private static readonly MAX_REFERENCE_QUEUE_LENGTH = 256;
  private static readonly MAX_DURABLE_QUEUE_LENGTH = 1024;
  private readonly logger = new Logger(MarketIngestService.name);
  private readonly eventQueue: MarketProviderEvent[] = [];
  private readonly referenceQueue: Array<ProviderDepthEvent | ProviderTradeEvent> = [];
  private readonly activeDrains = new Set<Promise<void>>();
  private readonly activeReferenceDrains = new Set<Promise<void>>();
  private activeWorkers = 0;
  private activeReferenceWorkers = 0;
  private lastSaturationLogAt = 0;
  private lastReferenceSaturationLogAt = 0;
  private droppedDurableTickers = 0;
  private droppedDurableOpenKlines = 0;
  private droppedDurableClosedKlines = 0;
  private droppedReferenceTrades = 0;
  private droppedReferenceDepth = 0;
  private failedReferencePublications = 0;
  private lastReferenceFailureLogAt = 0;
  private providerStartRetryTimer?: NodeJS.Timeout;
  private providerStartAttempt = 0;
  private destroyed = false;
  private stopping = false;
  constructor(
    private readonly marketAuthority: MarketAuthorityService,
    private readonly marketKlines: MarketKlineService,
    private readonly marketSeeder: MarketSeederService,
    private readonly providers: MarketProviderRouterService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit(): void {
    this.destroyed = false;
    this.stopping = false;
    // Catalog/provider reconciliation is intentionally asynchronous so HTTP can
    // become live quickly, but provider routing must never read D1 before that
    // reconciliation finishes. Start ingestion only from the shared promise.
    void this.startProvidersAfterReconciliation();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;
    if (this.providerStartRetryTimer) clearTimeout(this.providerStartRetryTimer);
    this.providerStartRetryTimer = undefined;
    this.logger.log('Market shutdown: stopping providers and draining queued events.');
    try {
      await this.providers.stop();
    } finally {
      // Stop new ingestion, but allow already accepted closed candles to persist.
      if (this.eventQueue.length) this.drainQueue();
      if (this.referenceQueue.length) this.drainReferenceQueue();
      let timeout: NodeJS.Timeout | undefined;
      try {
        await Promise.race([
          Promise.allSettled([...this.activeDrains, ...this.activeReferenceDrains]),
          new Promise<void>((resolve) => { timeout = setTimeout(resolve, 5_000); }),
        ]);
      } finally {
        if (timeout) clearTimeout(timeout);
        this.destroyed = true;
        const closed = this.eventQueue.filter((event) => event.kind === 'kline' && event.closed).length;
        if (closed) this.droppedDurableClosedKlines += closed;
        if (this.eventQueue.length || this.referenceQueue.length) {
          this.logger.warn(`Market shutdown exceeded drain grace; discarded ${this.eventQueue.length} durable and ${this.referenceQueue.length} reference events (${closed} closed Klines).`);
        }
        this.eventQueue.length = 0;
        this.referenceQueue.length = 0;
      }
    }
    this.logger.log('Market shutdown complete.');
  }

  private async startProvidersAfterReconciliation(): Promise<void> {
    try {
      await this.marketSeeder.ensureReconciled();
      if (this.destroyed || this.stopping) return;
      const started = await this.providers.start((event) => {
        if (!this.destroyed && !this.stopping) this.enqueue(event);
      });
      this.providerStartAttempt = 0;
      if (!started) {
        this.logger.log('Market provider disabled or not configured; serving persisted catalog and explicit unavailable states.');
      }
    } catch (error) {
      try {
        await this.providers.stop();
      } catch (stopError) {
        this.logger.error(`Market provider cleanup failed: ${stopError instanceof Error ? stopError.message : 'unknown error'}`);
      }
      if (this.destroyed || this.stopping) return;
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
    if (this.destroyed || this.stopping) return;
    if (event.kind === 'trade' || event.kind === 'depth') {
      this.enqueueReferenceEvent(event);
      return;
    }
    // Provider callbacks may arrive faster than SQLite can durably persist.
    // Coalesce latest ticker state and bound this durable-work queue.
    if (event.kind === 'ticker') {
      const existing = this.eventQueue.findIndex((queued) => queued.kind === event.kind
        && queued.symbol === event.symbol
        && queued.provider === event.provider);
      if (existing >= 0) {
        this.eventQueue[existing] = event;
        return;
      }
    }
    if (this.eventQueue.length >= 256) {
      const replaceableIndex = this.eventQueue.findIndex((queued) => queued.kind === 'ticker'
        || (queued.kind === 'kline' && !queued.closed));
      if (replaceableIndex >= 0) {
        const [discarded] = this.eventQueue.splice(replaceableIndex, 1);
        if (discarded?.kind === 'ticker') this.droppedDurableTickers += 1;
        else if (discarded?.kind === 'kline') this.droppedDurableOpenKlines += 1;
      } else if (event.kind === 'kline' && event.closed
        && this.eventQueue.length < MarketIngestService.MAX_DURABLE_QUEUE_LENGTH) {
        // Keep closed provider candles through a bounded overload reserve.
      } else {
        if (event.kind === 'ticker') this.droppedDurableTickers += 1;
        else if (event.kind === 'kline' && event.closed) this.droppedDurableClosedKlines += 1;
        else if (event.kind === 'kline') this.droppedDurableOpenKlines += 1;
        this.logDurableQueueSaturation();
        return;
      }
      this.logDurableQueueSaturation();
    }
    this.eventQueue.push(event);
    this.drainQueue();
  }

  private logDurableQueueSaturation(): void {
    if (Date.now() - this.lastSaturationLogAt <= 60_000) return;
    this.lastSaturationLogAt = Date.now();
    this.logger.warn(
      `Market durable queue saturated; dropped ${this.droppedDurableTickers} tickers, ${this.droppedDurableOpenKlines} open Klines, and ${this.droppedDurableClosedKlines} closed Klines.`,
    );
  }

  private enqueueReferenceEvent(event: ProviderDepthEvent | ProviderTradeEvent): void {
    if (event.kind === 'depth') {
      const existing = this.referenceQueue.findIndex((queued) => queued.kind === 'depth'
        && queued.symbol === event.symbol
        && queued.provider === event.provider);
      if (existing >= 0) {
        this.referenceQueue[existing] = event;
        return;
      }
    }
    if (this.referenceQueue.length >= MarketIngestService.MAX_REFERENCE_QUEUE_LENGTH) {
      const depthIndex = this.referenceQueue.findIndex((queued) => queued.kind === 'depth');
      if (event.kind === 'trade') {
        const [discarded] = this.referenceQueue.splice(depthIndex >= 0 ? depthIndex : 0, 1);
        if (discarded?.kind === 'trade') this.droppedReferenceTrades += 1;
        else if (discarded?.kind === 'depth') this.droppedReferenceDepth += 1;
      } else if (depthIndex >= 0) {
        this.referenceQueue.splice(depthIndex, 1);
        this.droppedReferenceDepth += 1;
      } else {
        this.droppedReferenceDepth += 1;
        this.logReferenceQueueSaturation();
        return;
      }
      this.logReferenceQueueSaturation();
    }
    this.referenceQueue.push(event);
    this.drainReferenceQueue();
  }

  private logReferenceQueueSaturation(): void {
    if (Date.now() - this.lastReferenceSaturationLogAt <= 60_000) return;
    this.lastReferenceSaturationLogAt = Date.now();
    this.logger.warn(
      `Market reference queue saturated; dropped ${this.droppedReferenceTrades} trade and ${this.droppedReferenceDepth} depth events since process start.`,
    );
  }

  private drainReferenceQueue(): void {
    if (this.destroyed || this.activeReferenceWorkers >= MarketIngestService.MAX_CONCURRENT_REFERENCE_WORKERS) return;
    this.activeReferenceWorkers += 1;
    let drain: Promise<void>;
    drain = this.drainReferenceEvents().finally(() => {
      this.activeReferenceWorkers -= 1;
      this.activeReferenceDrains.delete(drain);
      if (this.destroyed || this.referenceQueue.length === 0) return;
      if (this.activeReferenceWorkers < MarketIngestService.MAX_CONCURRENT_REFERENCE_WORKERS) {
        this.drainReferenceQueue();
      }
    });
    this.activeReferenceDrains.add(drain);
  }

  private async drainReferenceEvents(): Promise<void> {
    while (!this.destroyed && this.referenceQueue.length > 0) {
      const event = this.referenceQueue.shift();
      if (!event) continue;
      try {
        // Reference events only go to Valkey; they never wait behind SQLite work.
        await this.publishReferenceMarketEvent(event);
      } catch (error) {
        this.recordReferencePublicationFailure(
          error instanceof Error ? error.message : 'unknown error',
        );
      }
    }
  }

  private recordReferencePublicationFailure(reason: string): void {
    this.failedReferencePublications += 1;
    if (Date.now() - this.lastReferenceFailureLogAt <= 60_000) return;
    this.lastReferenceFailureLogAt = Date.now();
    this.logger.warn(
      `Market reference delivery failed; discarded ${this.failedReferencePublications} events since process start. Latest cause: ${reason}.`,
    );
  }

  private drainQueue(): void {
    if (this.destroyed
      || this.activeWorkers >= MarketIngestService.MAX_CONCURRENT_EVENT_WORKERS) return;
    this.activeWorkers += 1;
    let drain: Promise<void>;
    drain = this.drainEvents().finally(() => {
      this.activeWorkers -= 1;
      this.activeDrains.delete(drain);
      if (this.destroyed) return;
      if (this.eventQueue.length > 0) {
        if (this.activeWorkers < MarketIngestService.MAX_CONCURRENT_EVENT_WORKERS) this.drainQueue();
      }
    });
    this.activeDrains.add(drain);
  }

  private async drainEvents(): Promise<void> {
    while (!this.destroyed && this.eventQueue.length > 0) {
      const event = this.dequeueNextEvent();
      if (event) await this.handleProviderEvent(event);
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
          sessionState: event.sessionState,
        });
        if (quote.accepted && event.price && event.provider !== 'binance-spot') {
          const candle = await this.marketKlines.accumulateQuote({
            symbol: event.symbol, price: event.price, provider: event.provider,
            source: event.source,
            observedAt: new Date(event.eventTime),
          });
          await this.publishMarketKlineEvent(candle);
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
    if (!this.redis.isAvailable()) {
      this.recordReferencePublicationFailure('Valkey unavailable');
      return;
    }
    const payload = event.kind === 'depth'
      ? { version: 'v1' as const, event: 'market.reference.depth' as const, ...event }
      : { version: 'v1' as const, event: 'market.reference.trade' as const, ...event };
    await this.redis.publish(MARKET_REFERENCE_CHANNEL, JSON.stringify(payload));
  }

  private async publishMarketKlineEvent(candle: {
    symbol: string; interval: string; time: number; closeTime: string | null;
    open: string; high: string; low: string; close: string; volume: string | null;
    provider: string; source: string; observedAt: string; receivedAt: string; sequence?: number; isFinal: boolean;
  }): Promise<void> {
    if (!this.redis.isAvailable()) return;
    const payload: MarketKlineRealtimeEvent = {
      version: 'v1', event: 'market_kline', symbol: candle.symbol, interval: candle.interval,
      openTime: candle.time * 1000, closeTime: candle.closeTime ? Date.parse(candle.closeTime) : null,
      open: candle.open, high: candle.high, low: candle.low, close: candle.close, volume: candle.volume,
      provider: candle.provider, source: candle.source, observedAt: candle.observedAt,
      receivedAt: candle.receivedAt, sequence: candle.sequence ?? Date.parse(candle.receivedAt), isFinal: candle.isFinal,
    };
    await this.redis.publish(MARKET_KLINES_CHANNEL, JSON.stringify(payload));
  }
}
