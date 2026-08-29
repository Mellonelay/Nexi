import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type MetalsLatest = { timestamp?: number; rates?: Record<string, number> };

@Injectable()
export class MetalsApiMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'metals-api';

  protected requiredEnvironmentKeys(): readonly string[] { return ['METALS_API_KEY', 'METALS_API_QUOTE_DIRECTION']; }

  isEnabled(): boolean {
    return super.isEnabled() && /^(USD_PER_UNIT|UNITS_PER_USD)$/.test(process.env.METALS_API_QUOTE_DIRECTION?.trim() ?? '');
  }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const body = await this.requestJson<MetalsLatest>(
      process.env.METALS_API_BASE_URL?.trim() || 'https://api.metals-api.com',
      '/api/latest',
      { access_key: process.env.METALS_API_KEY!.trim(), base: 'USD', symbols: mapping.instrument },
    );
    const rawRate = body.rates?.[mapping.instrument];
    if (!Number.isFinite(rawRate) || Number(rawRate) <= 0) return null;
    const direction = process.env.METALS_API_QUOTE_DIRECTION!.trim();
    const price = direction === 'UNITS_PER_USD' ? 1 / Number(rawRate) : Number(rawRate);
    if (!Number.isFinite(price) || price <= 0) return null;
    return this.quote({
      symbol, source: 'rest:latest', providerInstrument: mapping.instrument, priceType: 'REFERENCE',
      eventTime: body.timestamp ? body.timestamp * 1_000 : Date.now(), price: String(price),
    });
  }
}
