import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type FawazResponse = { date?: string; usd?: Record<string, number> };

/**
 * Keyless daily reference-rate adapter. It is deliberately a reference feed:
 * the upstream publishes date-stamped files, not tick/WebSocket data.
 */
@Injectable()
export class FawazCurrencyMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'fawaz-currency';

  protected requiredEnvironmentKeys(): readonly string[] { return []; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const baseUrl = process.env.FAWAZ_CURRENCY_API_BASE_URL?.trim()
      || 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1';
    const body = await this.requestJson<FawazResponse>(baseUrl, '/currencies/usd.json', {});
    const rate = body.usd?.[mapping.instrument.toLowerCase()];
    if (!Number.isFinite(rate) || Number(rate) <= 0) return null;

    const base = symbol.replace(/USDT$/, '').toUpperCase();
    const inverse = base.startsWith('X') || !base.startsWith('USD');
    const price = inverse ? 1 / Number(rate) : Number(rate);
    const eventTime = body.date ? Date.parse(`${body.date}T00:00:00.000Z`) : NaN;
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(eventTime)) return null;
    return this.quote({
      symbol,
      source: 'rest:daily-reference',
      providerInstrument: mapping.instrument,
      priceType: 'REFERENCE',
      eventTime,
      price: String(price),
    });
  }

}
