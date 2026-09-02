import { Injectable } from '@nestjs/common';
import { CANONICAL_MARKET_CATALOG } from './market-catalog';
import { getProviderMapping } from './market-source-registry';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';
import type { MarketKlineInput, MarketKlineInterval } from './market-kline.contract';

type Exchange = 'okx' | 'bitget' | 'htx' | 'bybit' | 'gate';
type Quote = { price?: string; indexPrice?: string; markPrice?: string; change?: string; volume?: string; high?: string; low?: string; time?: number };

/** Public read-only exchange reference adapter. It never places orders or
 * participates in settlement; it only normalizes public ticker observations. */
abstract class PublicExchangeMarketAdapter extends PollingMarketProviderAdapter {
  protected abstract readonly exchange: Exchange;
  protected abstract readonly baseUrl: string;
  get provider(): string { return this.exchange; }
  protected requiredEnvironmentKeys(): readonly string[] { return []; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    if (!getProviderMapping(symbol, this.provider)) return null;
    const instrument = this.instrument(symbol);
    const response = await this.requestJson<unknown>(this.baseUrl, this.path(), this.params(instrument));
    const quote = this.extract(response);
    const price = quote?.indexPrice ?? quote?.markPrice ?? quote?.price;
    if (!price || !Number.isFinite(Number(price)) || Number(price) <= 0) return null;
    const eventTime = quote.time && Number.isFinite(quote.time) && quote.time > 0 ? quote.time : Date.now();
    return this.quote({ symbol, source: `${this.provider}:public-reference`, providerInstrument: instrument, priceType: quote.indexPrice || quote.markPrice ? 'REFERENCE' : 'LAST', eventTime, price, change24h: quote.change, volume24h: quote.volume, high24h: quote.high, low24h: quote.low });
  }

  private instrument(symbol: string): string {
    // The provider registry is the source of truth for provider-specific
    // instruments. Keep the legacy derivation only as a bounded fallback for
    // mappings that predate the registry entry.
    const isCanonicalSymbol = CANONICAL_MARKET_CATALOG.some((item) => item.symbol === symbol);
    const mappedInstrument = isCanonicalSymbol ? getProviderMapping(symbol, this.provider)?.instrument : undefined;
    if (mappedInstrument) return mappedInstrument;

    const entry = CANONICAL_MARKET_CATALOG.find((item) => item.symbol === symbol);
    const base = entry?.category === 'stock' ? entry.providerSymbol : entry?.providerSymbol.replaceAll('/', '').replace(/USD$/, '') ?? symbol;
    if (this.exchange === 'okx') return `${base}-USDT-SWAP`;
    if (this.exchange === 'htx') return `${base}-USDT`;
    if (this.exchange === 'gate') return `${base}_USDT`;
    return `${base}USDT`;
  }

  protected abstract path(): string;
  protected params(instrument: string): Record<string, string> { return { symbol: instrument }; }
  protected abstract extract(response: unknown): Quote | null;
}

@Injectable()
export class OkxMarketAdapter extends PublicExchangeMarketAdapter {
  protected readonly exchange = 'okx' as const; protected readonly baseUrl = 'https://www.okx.com';
  protected path() { return '/api/v5/market/ticker'; }
  protected params(instrument: string) { return { instId: instrument }; }
  protected extract(response: any) { const x = response?.data?.[0]; return x && { price: x.last, volume: x.volCcy24h, high: x.high24h, low: x.low24h, time: Number(x.ts) }; }
}
@Injectable()
export class BitgetMarketAdapter extends PublicExchangeMarketAdapter {
  protected readonly exchange = 'bitget' as const; protected readonly baseUrl = 'https://api.bitget.com';
  // Bitget's current UTA market surface covers the TradFi product categories
  // shown in the public markets pages (stocks, forex, indices, commodities,
  // and metals). Keep this as reference-only market data.
  protected path() { return '/api/v3/market/tickers'; }
  protected params(instrument: string) { return { symbol: instrument, category: 'USDT-FUTURES' }; }
  protected extract(response: any) {
    const x = response?.data?.[0];
    return x && {
      price: x.lastPrice ?? x.lastPr,
      indexPrice: x.indexPrice,
      markPrice: x.markPrice,
      change: x.price24hPcnt ?? x.change24h,
      volume: x.turnover24h ?? x.quoteVolume,
      high: x.highPrice24h ?? x.high24h,
      low: x.lowPrice24h ?? x.low24h,
      time: Number(x.ts),
    };
  }
}
@Injectable()
export class HtxMarketAdapter extends PublicExchangeMarketAdapter {
  protected readonly exchange = 'htx' as const; protected readonly baseUrl = 'https://api.hbdm.com';
  protected path() { return '/linear-swap-ex/market/detail/merged'; }
  protected params(instrument: string) { return { contract_code: instrument }; }
  protected extract(response: any) { const x = response?.tick; return x && { price: String(x.close), volume: String(x.vol), high: String(x.high), low: String(x.low), time: Number(response.ts) }; }
}
@Injectable()
export class BybitMarketAdapter extends PublicExchangeMarketAdapter {
  protected readonly exchange = 'bybit' as const; protected readonly baseUrl = 'https://api.bybit.com';
  protected path() { return '/v5/market/tickers'; }
  protected params(instrument: string) { return { category: 'linear', symbol: instrument }; }
  protected extract(response: any) { const x = response?.result?.list?.[0]; return x && { price: x.lastPrice, indexPrice: x.indexPrice, markPrice: x.markPrice, change: x.price24hPcnt, volume: x.turnover24h, high: x.highPrice24h, low: x.lowPrice24h, time: Number(response.time) }; }
}
@Injectable()
export class GateMarketAdapter extends PublicExchangeMarketAdapter {
  protected readonly exchange = 'gate' as const; protected readonly baseUrl = 'https://api.gateio.ws';
  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = getProviderMapping(symbol, this.provider);
    if (!mapping?.quoteSupported) return null;
    const response = await this.requestJson<{ data?: { last_price?: string; bid_price?: string; ask_price?: string; price_change?: string; highest_price?: string; lowest_price?: string } }>(
      this.baseUrl,
      `/api/v4/tradfi/symbols/${encodeURIComponent(mapping.instrument)}/tickers`,
      {},
    );
    const quote = response.data;
    const price = quote?.last_price;
    if (!price || !Number.isFinite(Number(price)) || Number(price) <= 0) return null;
    return this.quote({
      symbol,
      source: 'gate:tradfi-reference',
      providerInstrument: mapping.instrument,
      priceType: 'REFERENCE',
      eventTime: Date.now(),
      price,
      change24h: quote.price_change,
      high24h: quote.highest_price,
      low24h: quote.lowest_price,
      bid: quote.bid_price,
      ask: quote.ask_price,
      spread: quote.bid_price && quote.ask_price && Number(quote.ask_price) >= Number(quote.bid_price)
        ? String(Number(quote.ask_price) - Number(quote.bid_price))
        : undefined,
    });
  }

  async fetchHistory(symbol: string, interval: MarketKlineInterval, limit: number): Promise<MarketKlineInput[]> {
    const supported = new Set<MarketKlineInterval>(['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']);
    if (!supported.has(interval)) return [];
    const mapping = getProviderMapping(symbol, this.provider);
    if (!mapping?.klineSupported) return [];
    const isStock = CANONICAL_MARKET_CATALOG.find((item) => item.symbol === symbol)?.category === 'stock';
    const response = await this.requestJson<
      | Array<[string, string, string, string, string, string]>
      | { data?: { list?: Array<{ o?: string; c?: string; h?: string; l?: string; t?: number }> } }
    >(
      this.baseUrl,
      isStock ? '/api/v4/stock/candlesticks' : `/api/v4/tradfi/symbols/${encodeURIComponent(mapping.instrument)}/klines`,
      isStock ? { currency_pair: mapping.instrument, interval, limit: String(Math.min(500, Math.max(40, limit))) } : { kline_type: interval, limit: String(Math.min(500, Math.max(40, limit))) },
    );
    const rows = isStock
      ? (Array.isArray(response) ? response : []).map(([t, o, h, l, c, volume]) => ({ t: Number(t), o, h, l, c, volume }))
      : (response as { data?: { list?: Array<{ o?: string; c?: string; h?: string; l?: string; t?: number }> } }).data?.list ?? [];
    const durationMs = this.intervalMs(interval);
    return rows.flatMap((row) => {
      const openTimeMs = Number(row.t) * 1000;
      const values = [row.o, row.h, row.l, row.c].map(Number);
      if (!Number.isFinite(openTimeMs) || values.some((value) => !Number.isFinite(value) || value <= 0)) return [];
      const openTime = new Date(openTimeMs);
      return [{
        symbol, interval, openTime, closeTime: new Date(openTimeMs + durationMs - 1),
        open: String(values[0]), high: String(values[1]), low: String(values[2]), close: String(values[3]), volume: 'volume' in row && row.volume != null ? String(row.volume) : null,
        provider: this.provider, source: isStock ? 'gate:rest:stock-candlesticks' : 'gate:tradfi-reference:kline', observedAt: new Date(openTimeMs + durationMs - 1),
      } satisfies MarketKlineInput];
    });
  }

  private intervalMs(interval: MarketKlineInterval): number {
    const minutes: Partial<Record<MarketKlineInterval, number>> = { '1m': 1, '3m': 3, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240, '1d': 1440 };
    return (minutes[interval] ?? 1) * 60_000;
  }

  protected path() { return '/api/v4/futures/usdt/tickers'; }
  protected params(instrument: string) { return { contract: instrument }; }
  protected extract(response: any) { const x = Array.isArray(response) ? response[0] : null; return x && { price: x.last, indexPrice: x.index_price, markPrice: x.mark_price, change: x.change_percentage, volume: x.volume_24h_quote, high: x.high_24h, low: x.low_24h, time: Number(x.funding_next_apply) * 1000 }; }
}

const GATE_INTERVALS = new Set<MarketKlineInterval>(['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '3d', '1w', '1M']);

function gateIntervalMs(interval: MarketKlineInterval): number {
  const values: Partial<Record<MarketKlineInterval, number>> = {
    '5m': 300_000, '15m': 900_000, '30m': 1_800_000, '1h': 3_600_000,
    '2h': 7_200_000, '4h': 14_400_000, '6h': 21_600_000, '12h': 43_200_000,
    '1d': 86_400_000, '3d': 259_200_000, '1w': 604_800_000, '1M': 2_592_000_000,
  };
  return values[interval] ?? 60_000;
}
