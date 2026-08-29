import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type MetalpriceConversion = { success?: boolean; info?: { timestamp?: number }; result?: number };

@Injectable()
export class MetalpriceApiMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'metalprice-api';

  protected requiredEnvironmentKeys(): readonly string[] { return ['METALPRICE_API_KEY']; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const body = await this.requestJson<MetalpriceConversion>(
      process.env.METALPRICE_API_BASE_URL?.trim() || 'https://api.metalpriceapi.com',
      '/v1/convert',
      { api_key: process.env.METALPRICE_API_KEY!.trim(), from: mapping.instrument, to: 'USD', amount: '1' },
    );
    if (body.success !== true || !Number.isFinite(body.result) || Number(body.result) <= 0) return null;
    return this.quote({
      symbol, source: 'rest:convert', providerInstrument: mapping.instrument, priceType: 'REFERENCE',
      eventTime: body.info?.timestamp ? body.info.timestamp * 1_000 : Date.now(), price: String(body.result),
    });
  }
}
