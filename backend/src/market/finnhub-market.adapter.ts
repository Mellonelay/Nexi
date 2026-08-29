import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type FinnhubStockQuote = { c?: number; d?: number; dp?: number; h?: number; l?: number; t?: number };
type FinnhubForexCandles = { s?: string; c?: number[]; h?: number[]; l?: number[]; t?: number[]; v?: number[] };

@Injectable()
export class FinnhubMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'finnhub';

  protected requiredEnvironmentKeys(): readonly string[] { return ['FINNHUB_API_KEY']; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const baseUrl = process.env.FINNHUB_API_BASE_URL?.trim() || 'https://finnhub.io';
    const token = process.env.FINNHUB_API_KEY!.trim();
    if (symbol.endsWith('USDT')) {
      const body = await this.requestJson<FinnhubStockQuote>(baseUrl, '/api/v1/quote', { symbol: mapping.instrument, token });
      if (!Number.isFinite(body.c) || Number(body.c) <= 0) return null;
      return this.quote({
        symbol, source: 'rest:quote', providerInstrument: mapping.instrument, priceType: 'LAST',
        eventTime: body.t ? body.t * 1_000 : Date.now(), price: String(body.c),
        change24h: body.dp !== undefined ? String(body.dp) : undefined,
        high24h: body.h !== undefined ? String(body.h) : undefined,
        low24h: body.l !== undefined ? String(body.l) : undefined,
      });
    }
    const now = Math.floor(Date.now() / 1_000);
    const body = await this.requestJson<FinnhubForexCandles>(baseUrl, '/api/v1/forex/candle', {
      symbol: mapping.instrument, resolution: '1', from: String(now - 120), to: String(now), token,
    });
    const index = (body.c?.length ?? 0) - 1;
    const price = index >= 0 ? body.c?.[index] : undefined;
    if (!Number.isFinite(price) || Number(price) <= 0) return null;
    return this.quote({
      symbol, source: 'rest:forex-candle', providerInstrument: mapping.instrument, priceType: 'CANDLE_CLOSE',
      eventTime: (body.t?.[index] ?? now) * 1_000, price: String(price),
      high24h: body.h?.[index] !== undefined ? String(body.h[index]) : undefined,
      low24h: body.l?.[index] !== undefined ? String(body.l[index]) : undefined,
      volume24h: body.v?.[index] !== undefined ? String(body.v[index]) : undefined,
    });
  }
}
