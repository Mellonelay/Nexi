import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; regularMarketTime?: number };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null>; volume?: Array<number | null> }> };
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
