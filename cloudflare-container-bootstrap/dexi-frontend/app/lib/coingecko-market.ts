import { cryptoAssets } from './asset-registry';

export const COINGECKO_MARKET_IDS = cryptoAssets.map((asset) => asset.coingeckoId).filter((id): id is string => Boolean(id));

export type CoinGeckoMarketPayload = {
  id?: unknown;
  symbol?: unknown;
  name?: unknown;
  image?: unknown;
  current_price?: unknown;
  market_cap?: unknown;
  total_volume?: unknown;
  price_change_percentage_24h?: unknown;
  sparkline_in_7d?: { price?: unknown } | null;
};

export type PublicMarketRow = {
  symbol: string;
  displaySymbol: string;
  name: string;
  lastPrice: number;
  priceChangePercent: number;
  volume: number;
  marketCap: number | null;
  icon: string;
  sparkline: number[];
  source: 'COINGECKO';
  dataState: 'LIVE';
  observedAt: string;
};

const finite = (value: unknown) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

const finiteSeries = (value: unknown) => Array.isArray(value)
  ? value.map(finite).filter((item): item is number => item !== null)
  : [];
export function normalizeCoinGeckoMarkets(
  payload: unknown,
  observedAt = new Date().toISOString(),
): PublicMarketRow[] {
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((value) => {
    if (!value || typeof value !== 'object') return [];
    const row = value as CoinGeckoMarketPayload;
    const displaySymbol = typeof row.symbol === 'string' ? row.symbol.toUpperCase() : '';
    const price = finite(row.current_price);
    if (!displaySymbol || price === null || price <= 0) return [];

    const change = finite(row.price_change_percentage_24h) ?? 0;
    const volume = finite(row.total_volume) ?? 0;
    const marketCap = finite(row.market_cap);
    const sparkline = finiteSeries(row.sparkline_in_7d?.price);

    return [{
      symbol: `${displaySymbol}USDT`,
      displaySymbol,
      name: typeof row.name === 'string' ? row.name : `${displaySymbol}/USDT`,
      lastPrice: price,
      priceChangePercent: change,
      volume,
      marketCap,
      icon: typeof row.image === 'string' ? row.image : displaySymbol,
      sparkline,
      source: 'COINGECKO' as const,
      dataState: 'LIVE' as const,
      observedAt,
    }];
  });
}
