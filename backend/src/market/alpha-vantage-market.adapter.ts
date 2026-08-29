import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type AlphaResponse = Record<string, unknown>;

@Injectable()
export class AlphaVantageMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'alpha-vantage';

  protected pollSpacingMs(): number { return 1_100; }

  protected requiredEnvironmentKeys(): readonly string[] { return ['ALPHA_VANTAGE_API_KEY']; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const key = process.env.ALPHA_VANTAGE_API_KEY!.trim();
    const baseUrl = process.env.ALPHA_VANTAGE_API_BASE_URL?.trim() || 'https://www.alphavantage.co';
    const entry = symbol.toUpperCase();
    if (entry.endsWith('USDT')) return this.stockQuote(symbol, mapping.instrument, baseUrl, key);
    if (entry.startsWith('XAU') || entry.startsWith('XAG')) return this.spotMetalQuote(symbol, mapping.instrument, baseUrl, key);
    if (entry === 'XCUUSD' || entry === 'XALUSD') return this.commodityQuote(symbol, mapping.instrument, baseUrl, key);
    return this.forexQuote(symbol, mapping.instrument, baseUrl, key);
  }

  private async stockQuote(symbol: string, instrument: string, baseUrl: string, key: string): Promise<ProviderQuoteEvent | null> {
    const body = await this.requestJson<AlphaResponse>(baseUrl, '/query', { function: 'GLOBAL_QUOTE', symbol: instrument, apikey: key });
    const quote = (body['Global Quote'] ?? {}) as Record<string, unknown>;
    const price = this.number(quote['05. price']);
    if (!price || price <= 0) return null;
    const day = String(quote['07. latest trading day'] ?? '');
    return this.quote({ symbol, source: 'rest:global-quote', providerInstrument: instrument, priceType: 'LAST', eventTime: this.dayTimestamp(day), price: String(price), change24h: this.string(quote['10. change percent']) });
  }

  private async forexQuote(symbol: string, instrument: string, baseUrl: string, key: string): Promise<ProviderQuoteEvent | null> {
    const [from, to] = instrument.split('/');
    if (!from || !to) return null;
    const body = await this.requestJson<AlphaResponse>(baseUrl, '/query', { function: 'FX_DAILY', from_symbol: from, to_symbol: to, apikey: key });
    const series = (body['Time Series FX (Daily)'] ?? {}) as Record<string, Record<string, unknown>>;
    const day = Object.keys(series).sort().at(-1);
    const row = day ? series[day] : undefined;
    const price = this.number(row?.['4. close']);
    if (!price || price <= 0) return null;
    return this.quote({ symbol, source: 'rest:fx-daily', providerInstrument: instrument, priceType: 'CANDLE_CLOSE', eventTime: this.dayTimestamp(day), price: String(price), high24h: this.string(row?.['2. high']), low24h: this.string(row?.['3. low']) });
  }

  private async spotMetalQuote(symbol: string, instrument: string, baseUrl: string, key: string): Promise<ProviderQuoteEvent | null> {
    const body = await this.requestJson<AlphaResponse>(baseUrl, '/query', { function: 'GOLD_SILVER_SPOT', symbol: instrument, apikey: key });
    const price = this.number(body.price ?? body['price_usd']);
    if (!price || price <= 0) return null;
    return this.quote({ symbol, source: 'rest:gold-silver-spot', providerInstrument: instrument, priceType: 'REFERENCE', eventTime: this.number(body.timestamp) || Date.now(), price: String(price) });
  }

  private async commodityQuote(symbol: string, instrument: string, baseUrl: string, key: string): Promise<ProviderQuoteEvent | null> {
    const body = await this.requestJson<AlphaResponse>(baseUrl, '/query', { function: instrument, interval: 'monthly', apikey: key });
    const rows = Array.isArray(body.data) ? body.data as Array<Record<string, unknown>> : [];
    const row = rows.at(-1);
    const price = this.number(row?.value ?? body.value);
    if (!price || price <= 0) return null;
    return this.quote({ symbol, source: 'rest:commodity-monthly', providerInstrument: instrument, priceType: 'REFERENCE', eventTime: this.dayTimestamp(this.string(row?.date)), price: String(price) });
  }

  private number(value: unknown): number | undefined { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; }
  private string(value: unknown): string | undefined { return value === undefined || value === null ? undefined : String(value); }
  private dayTimestamp(value: string | undefined): number { const parsed = value ? Date.parse(value) : NaN; return Number.isFinite(parsed) ? parsed : Date.now(); }
}
