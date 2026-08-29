import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type MassiveSnapshot = {
  ticker?: MassiveTicker;
  results?: MassiveTicker;
};

type MassiveTicker = {
  lastTrade?: { p?: number };
  lastQuote?: { b?: number; a?: number };
  last_trade?: { price?: number };
  last_quote?: { bid?: number; ask?: number };
  day?: { c?: number; h?: number; l?: number; v?: number; close?: number; high?: number; low?: number; volume?: number };
  updated?: number;
};

@Injectable()
export class MassiveMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'massive';

  protected requiredEnvironmentKeys(): readonly string[] { return ['MASSIVE_API_KEY']; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const policy = this.mapping(symbol);
    const category = symbol.endsWith('USDT') ? 'stocks' : 'forex';
    const locale = category === 'stocks' ? 'us' : 'global';
    const body = await this.requestJson<MassiveSnapshot>(
      process.env.MASSIVE_API_BASE_URL?.trim() || 'https://api.massive.com',
      `/v2/snapshot/locale/${locale}/markets/${category}/tickers/${encodeURIComponent(policy.instrument)}`,
      { apiKey: process.env.MASSIVE_API_KEY!.trim() },
    );
    const snapshot = body.ticker ?? body.results;
    if (!snapshot) return null;
    const trade = snapshot.lastTrade?.p ?? snapshot.last_trade?.price;
    const quote = snapshot.lastQuote ?? (snapshot.last_quote ? { b: snapshot.last_quote.bid, a: snapshot.last_quote.ask } : undefined);
    const close = snapshot.day?.c ?? snapshot.day?.close;
    const price = trade ?? (quote?.b !== undefined && quote?.a !== undefined ? (quote.b + quote.a) / 2 : close);
    if (!Number.isFinite(price) || Number(price) <= 0) return null;
    const day = snapshot.day;
    const eventTime = Number(snapshot.updated ?? Date.now());
    return this.quote({
      symbol, source: 'rest:snapshot', providerInstrument: policy.instrument,
      priceType: trade !== undefined ? 'LAST' : quote?.b !== undefined && quote?.a !== undefined ? 'MID' : 'CANDLE_CLOSE',
      eventTime: Number.isFinite(eventTime) ? eventTime : Date.now(), price: String(price),
      volume24h: day?.v !== undefined || day?.volume !== undefined ? String(day.v ?? day.volume) : undefined,
      high24h: day?.h !== undefined || day?.high !== undefined ? String(day.h ?? day.high) : undefined,
      low24h: day?.l !== undefined || day?.low !== undefined ? String(day.l ?? day.low) : undefined,
    });
  }
}
