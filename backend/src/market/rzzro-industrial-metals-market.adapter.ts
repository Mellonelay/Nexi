import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type RzzroResponse = {
  last_updated?: string;
  unit?: string;
  commodities?: Record<string, { price?: number; change_pct?: number; exchange?: string; contract?: string }>;
};

/** Keyless daily LME reference snapshot; not a tick/WebSocket or settlement feed. */
@Injectable()
export class RzzroIndustrialMetalsMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'rzzro-industrial-metals';
  protected requiredEnvironmentKeys(): readonly string[] { return []; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const baseUrl = process.env.RZZRO_API_BASE_URL?.trim() || 'https://rzzro.com/api';
    const body = await this.requestJson<RzzroResponse>(baseUrl, '/prices.json', {}, { 'User-Agent': 'NEXI/market-reference' });
    const commodity = body.commodities?.[mapping.instrument.toLowerCase()];
    const price = commodity?.price;
    const eventTime = body.last_updated ? Date.parse(body.last_updated) : NaN;
    if (!Number.isFinite(price) || Number(price) <= 0 || !Number.isFinite(eventTime)) return null;
    return this.quote({
      symbol,
      source: `rest:daily-reference:${body.unit ?? 'USD_PER_METRIC_TON'}`,
      providerInstrument: `${commodity?.exchange ?? 'LME'}:${mapping.instrument.toUpperCase()}:${commodity?.contract ?? '3M'}`,
      priceType: 'REFERENCE',
      eventTime,
      price: String(price),
      change24h: Number.isFinite(commodity?.change_pct) ? String(commodity?.change_pct) : undefined,
    });
  }
}
