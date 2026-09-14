import { Injectable, Logger } from '@nestjs/common';
import { MarketKlineQueryDto } from './market-kline.dto';
import { MarketKlineService } from './market-kline.service';
import { MarketProviderRouterService } from './market-provider-router.service';

@Injectable()
export class MarketKlineQueryService {
  private readonly logger = new Logger(MarketKlineQueryService.name);

  constructor(
    private readonly klines: MarketKlineService,
    private readonly providers: MarketProviderRouterService,
  ) {}

  async list(query: MarketKlineQueryDto) {
    const symbol = query.symbol.replaceAll('/', '').toUpperCase();
    let candles = await this.klines.list(
      symbol,
      query.interval,
      query.limit,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );

    // Hydrate only a missing bounded window. Startup does not need a large
    // backfill, but a first chart request must be able to reach the selected
    // provider and persist canonical candles in D1 before returning them.
    if (candles.length === 0 && !query.from && !query.to) {
      try {
        const history = await this.providers.fetchHistory(
          symbol,
          query.interval,
          query.limit,
        );
        for (const candle of history) await this.klines.persist(candle);
        if (history.length > 0) {
          candles = await this.klines.list(
            symbol,
            query.interval,
            query.limit,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Market history hydration failed for ${symbol} ${query.interval}: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
    }

    const newest = candles.at(-1)?.observedAt
      ? new Date(candles.at(-1)!.observedAt).getTime()
      : 0;
    const configuredStaleAfterMs = Number(
      process.env.MARKET_QUOTE_STALE_AFTER_MS ?? '30000',
    );
    // Higher intervals are refreshed from each finalized 1m provider candle,
    // so allow one full aggregation cadence plus jitter before declaring them stale.
    const staleAfterMs = query.interval === '1m'
      ? configuredStaleAfterMs
      : Math.max(configuredStaleAfterMs, 90_000);
    const dataState =
      candles.length === 0
        ? 'UNAVAILABLE'
        : Date.now() - newest <= staleAfterMs
          ? 'LIVE'
          : 'STALE';

    return {
      dataState,
      symbol,
      interval: query.interval,
      candles,
      observedAt: candles.at(-1)?.observedAt ?? null,
      message:
        candles.length > 0
          ? undefined
          : 'Authoritative market candles are unavailable.',
    };
  }
}
