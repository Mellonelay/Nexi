import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type OandaPricing = { prices?: Array<{ instrument?: string; time?: string; bids?: Array<{ price?: string }>; asks?: Array<{ price?: string }> }> };

@Injectable()
export class OandaMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'oanda';

  protected requiredEnvironmentKeys(): readonly string[] { return ['OANDA_ACCESS_TOKEN', 'OANDA_ACCOUNT_ID']; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const mapping = this.mapping(symbol);
    const body = await this.requestJson<OandaPricing>(
      process.env.OANDA_API_BASE_URL?.trim() || 'https://api-fxpractice.oanda.com',
      `/v3/accounts/${encodeURIComponent(process.env.OANDA_ACCOUNT_ID!.trim())}/pricing`,
      { instruments: mapping.instrument },
      { Authorization: `Bearer ${process.env.OANDA_ACCESS_TOKEN!.trim()}` },
    );
    const quote = body.prices?.[0];
    const bid = Number(quote?.bids?.[0]?.price);
    const ask = Number(quote?.asks?.[0]?.price);
    if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0 || ask < bid) return null;
    const eventTime = quote?.time ? Date.parse(quote.time) : Date.now();
    return this.quote({
      symbol, source: 'rest:pricing', providerInstrument: mapping.instrument, priceType: 'MID',
      eventTime: Number.isFinite(eventTime) ? eventTime : Date.now(), price: String((bid + ask) / 2),
    });
  }
}
