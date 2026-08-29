import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type CoinMarketCapRow = { quote?: { USD?: { price?: number; percent_change_24h?: number; volume_24h?: number } } };
type CoinMarketCapResponse = { data?: Record<string, CoinMarketCapRow> };

/** Optional CoinMarketCap reference quotes; requires an explicit API key. */
@Injectable()
export class CoinMarketCapMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'coinmarketcap';

  protected requiredEnvironmentKeys(): readonly string[] { return ['COINMARKETCAP_API_KEY']; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const body = await this.requestJson<CoinMarketCapResponse>(
      process.env.COINMARKETCAP_API_BASE_URL?.trim() || 'https://pro-api.coinmarketcap.com',
      '/v3/cryptocurrency/quotes/latest',
      { symbol: symbol.replace(/USDT$/, ''), convert: 'USD' },
      { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY!.trim() },
    );
    const row = body.data?.[symbol.replace(/USDT$/, '').toUpperCase()];
    const quote = row?.quote?.USD;
    if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) return null;
    return this.quote({
      symbol, source: 'rest:quotes-latest', providerInstrument: symbol.replace(/USDT$/, ''), priceType: 'REFERENCE',
      eventTime: Date.now(), price: String(quote.price),
      change24h: Number.isFinite(quote.percent_change_24h) ? String(quote.percent_change_24h) : undefined,
      volume24h: Number.isFinite(quote.volume_24h) ? String(quote.volume_24h) : undefined,
    });
  }
}
