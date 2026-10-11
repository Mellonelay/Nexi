import { Injectable } from '@nestjs/common';
import { PollingMarketProviderAdapter } from './polling-market-provider.adapter';
import { ProviderQuoteEvent } from './market-provider.adapter';

type CoinGeckoMarketRow = {
  current_price?: number;
  price_change_percentage_24h?: number | null;
  total_volume?: number | null;
  high_24h?: number | null;
  low_24h?: number | null;
};

type CoinGeckoMarketsResponse = CoinGeckoMarketRow[];

export const COINGECKO_IDS: Readonly<Record<string, string>> = {
  BTCUSDT: 'bitcoin', ETHUSDT: 'ethereum', LTCUSDT: 'litecoin', XRPUSDT: 'ripple',
  BCHUSDT: 'bitcoin-cash', ETCUSDT: 'ethereum-classic', FILUSDT: 'filecoin',
  USDCUSDT: 'usd-coin', SUNUSDT: 'sun-token', DOTUSDT: 'polkadot', ADAUSDT: 'cardano',
  DOGEUSDT: 'dogecoin', MASKUSDT: 'mask-network', STEEMUSDT: 'steem', TRXUSDT: 'tron',
  SOLUSDT: 'solana', SUSHIUSDT: 'sushi',
};

/** Reference-only crypto quotes. Binance remains the crypto execution/stream source. */
@Injectable()
export class CoinGeckoMarketAdapter extends PollingMarketProviderAdapter {
  readonly provider = 'coingecko';

  protected requiredEnvironmentKeys(): readonly string[] { return []; }

  protected async fetchQuote(symbol: string): Promise<ProviderQuoteEvent | null> {
    const instrument = COINGECKO_IDS[symbol];
    if (!instrument) return null;
    const body = await this.requestJson<CoinGeckoMarketsResponse>(
      process.env.COINGECKO_API_BASE_URL?.trim() || 'https://api.coingecko.com',
      '/api/v3/coins/markets',
      { vs_currency: 'usd', ids: instrument, price_change_percentage: '24h' },
      process.env.COINGECKO_API_KEY?.trim() ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY.trim() } : {},
    );
    const row = body[0];
    if (!row || !Number.isFinite(row.current_price) || row.current_price <= 0) return null;
    return this.quote({
      symbol, source: 'rest:coins-markets', providerInstrument: instrument, priceType: 'REFERENCE',
      eventTime: Date.now(), price: String(row.current_price),
      change24h: Number.isFinite(row.price_change_percentage_24h) ? String(row.price_change_percentage_24h) : undefined,
      volume24h: Number.isFinite(row.total_volume) ? String(row.total_volume) : undefined,
      high24h: Number.isFinite(row.high_24h) ? String(row.high_24h) : undefined,
      low24h: Number.isFinite(row.low_24h) ? String(row.low_24h) : undefined,
    });
  }
}
