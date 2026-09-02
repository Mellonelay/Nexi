import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';
import type { MarketKlineInput, MarketKlineInterval } from './market-kline.contract';

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; regularMarketTime?: number };
      timestamp?: number[];
      indicators?: { quote?: Array<{ open?: Array<number | null>; close?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null>; volume?: Array<number | null> }> };
    }>;
    error?: unknown;
  };
};

/**
 * Yahoo chart is used only as a non-crypto reference quote source. The
 * endpoint is historical/delayed chart data, not a WebSocket or settlement
 * authority, so this adapter emits CANDLE_CLOSE and never emits depth/trades.
 */
@Injectable()
export class YahooMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'yahoo';

  protected requiredEnvironmentKeys(): readonly string[] { return []; }

  async fetchHistory(symbol: string, interval: MarketKlineInterval, limit: number): Promise<MarketKlineInput[]> {
    const mapping = this.mapping(symbol);
    const sourceInterval = interval === '4h' ? '1h' : interval;
    if (!YAHOO_INTERVALS.has(sourceInterval as MarketKlineInterval) || !mapping) return [];
    const body = await this.requestJson<YahooChartResponse>(
      process.env.YAHOO_API_BASE_URL?.trim() || 'https://query1.finance.yahoo.com',
      `/v8/finance/chart/${encodeURIComponent(mapping.instrument)}`,
      { interval: sourceInterval, range: yahooRange(sourceInterval as MarketKlineInterval), includePrePost: 'false' },
    );
    const result = body.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    if (!result?.timestamp?.length || !quote?.open || !quote.high || !quote.low || !quote.close) return [];
    const bars = result.timestamp.flatMap((timestamp, index) => {
      const values = [quote.open?.[index], quote.high?.[index], quote.low?.[index], quote.close?.[index]].map(Number);
      const openTime = new Date(Number(timestamp) * 1000);
      if (Number.isNaN(openTime.getTime()) || values.some((value) => !Number.isFinite(value) || value <= 0)) return [];
      const closeTime = new Date(openTime.getTime() + intervalMs(sourceInterval as MarketKlineInterval) - 1);
      const volume = Number(quote.volume?.[index]);
      return [{ openTime, closeTime, open: String(quote.open![index]), high: String(quote.high![index]), low: String(quote.low![index]), close: String(quote.close![index]), volume: Number.isFinite(volume) && volume >= 0 ? String(quote.volume![index]) : null }];
    });
    const normalized = interval === '4h' ? aggregateFourHour(bars) : bars;
    const now = Date.now();
    return normalized.slice(-Math.min(500, Math.max(40, limit))).map((bar) => ({
      symbol, interval, openTime: bar.openTime, closeTime: bar.closeTime,
      open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume,
      provider: this.provider, source: `yahoo:rest:chart:${sourceInterval}`,
      observedAt: new Date(Math.min(now, bar.closeTime.getTime())),
    }));
  }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const body = await this.requestJson<YahooChartResponse>(
      process.env.YAHOO_API_BASE_URL?.trim() || 'https://query1.finance.yahoo.com',
      `/v8/finance/chart/${encodeURIComponent(mapping.instrument)}`,
      { interval: '1d', range: '5d', includePrePost: 'false' },
    );
    const result = body.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    if (!result || !quote?.close || !result.timestamp?.length) return null;

    let index = -1;
    for (let i = quote.close.length - 1; i >= 0; i -= 1) {
      if (Number.isFinite(quote.close[i]) && Number(quote.close[i]) > 0) { index = i; break; }
    }
    if (index < 0) return null;
    const eventTime = Number(result.timestamp[index]) * 1000;
    const price = Number(quote.close[index]);
    if (!Number.isFinite(eventTime) || !Number.isFinite(price) || price <= 0) return null;

    return this.quote({
      symbol,
      source: 'rest:chart:1d',
      providerInstrument: mapping.instrument,
      priceType: 'CANDLE_CLOSE',
      eventTime,
      price: String(price),
      high24h: quote.high?.[index] == null ? undefined : String(quote.high[index]),
      low24h: quote.low?.[index] == null ? undefined : String(quote.low[index]),
      volume24h: quote.volume?.[index] == null ? undefined : String(quote.volume[index]),
    });
  }
}

const YAHOO_INTERVALS = new Set<MarketKlineInterval>(['1m', '5m', '15m', '30m', '1h', '1d']);

function yahooRange(interval: MarketKlineInterval): string {
  if (interval === '1m') return '1d';
  if (interval === '5m') return '5d';
  if (interval === '15m' || interval === '30m') return '1mo';
  if (interval === '1h') return '3mo';
  return '2y';
}

function intervalMs(interval: MarketKlineInterval): number {
  const values: Partial<Record<MarketKlineInterval, number>> = {
    '1m': 60_000, '5m': 300_000, '15m': 900_000, '30m': 1_800_000, '1h': 3_600_000, '1d': 86_400_000,
  };
  return values[interval] ?? 60_000;
}

type YahooBar = { openTime: Date; closeTime: Date; open: string; high: string; low: string; close: string; volume: string | null };

function aggregateFourHour(bars: YahooBar[]): YahooBar[] {
  const bucketMs = 14_400_000;
  const buckets = new Map<number, YahooBar[]>();
  for (const bar of bars) {
    const key = Math.floor(bar.openTime.getTime() / bucketMs) * bucketMs;
    buckets.set(key, [...(buckets.get(key) ?? []), bar]);
  }
  return [...buckets.entries()].sort(([a], [b]) => a - b).map(([key, bucket]) => ({
    openTime: new Date(key), closeTime: new Date(key + bucketMs - 1),
    open: bucket[0].open, high: String(Math.max(...bucket.map((bar) => Number(bar.high)))),
    low: String(Math.min(...bucket.map((bar) => Number(bar.low)))), close: bucket.at(-1)!.close,
    volume: bucket.every((bar) => bar.volume === null) ? null : String(bucket.reduce((sum, bar) => sum + Number(bar.volume ?? 0), 0)),
  }));
}
