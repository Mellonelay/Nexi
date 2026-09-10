export type InstrumentCategory = 'Crypto' | 'Metal' | 'Forex' | 'Shares';
import { findAsset } from '../lib/asset-registry.ts';

export type MarketProvenance = 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'DISABLED';

export interface ActiveInstrument {
  assetId: string;
  symbol: string;
  pair: string;
  name: string;
  category: InstrumentCategory;
  logo: string | null;
  provenance: MarketProvenance;
  spotAvailable: boolean;
  binaryAvailable: boolean;
  price: number | null;
  change24h: number | null;
  volume24h: number | null;
  precision: number | null;
  displayMetadata: Record<string, string | number | boolean>;
}

export interface MarketPairLike {
  assetId?: string;
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number | null;
  change: number | null;
  icon: string;
  vol?: number | null;
  source?: 'fallback' | 'tick' | 'external';
  dataState?: 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'ERROR';
}

export const normalizePair = (pair: string) => pair.trim().replaceAll('/', '').toUpperCase();

const categoryForSymbol = (symbol: string): InstrumentCategory => {
  if (['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'XALUSD', 'XCUUSD', 'XZNUSD'].includes(symbol)) {
    return 'Metal';
  }
  if (symbol.includes('USD') && !symbol.endsWith('USDT')) return 'Forex';
  if (/^[A-Z]{1,5}$/.test(symbol)) return 'Shares';
  return 'Crypto';
};

const pairForSymbol = (symbol: string, category: InstrumentCategory) => {
  if (symbol.includes('/')) return symbol.toUpperCase();
  if (category === 'Crypto' && symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  if (category === 'Forex' && symbol.length === 6) return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  if (category === 'Shares') {
    const canonical = symbol.toUpperCase().replace('.US', '');
    return canonical.endsWith('USDT') ? `${canonical.slice(0, -4)}/USDT` : `${canonical}/USDT`;
  }
  return symbol.toUpperCase();
};

export const pairToRouteSymbol = (pair: string) => normalizePair(pair);

export function instrumentFromPair(pair: string): ActiveInstrument {
  const normalized = normalizePair(pair);
  const category = categoryForSymbol(normalized);
  const symbol = category === 'Crypto' && normalized.endsWith('USDT')
    ? normalized.slice(0, -4)
    : category === 'Forex' || category === 'Metal'
      ? normalized.slice(0, 3)
      : normalized;

  return createActiveInstrument({
    assetId: symbol,
    symbol,
    pair: pairForSymbol(normalized, category),
    name: symbol,
    category,
    spotAvailable: category === 'Crypto',
    binaryAvailable: true,
  });
}

export function createActiveInstrument(input: Partial<ActiveInstrument> & Pick<ActiveInstrument, 'assetId' | 'symbol' | 'pair' | 'name' | 'category'>): ActiveInstrument {
  return {
    assetId: input.assetId,
    symbol: input.symbol.toUpperCase(),
    pair: input.pair.toUpperCase(),
    name: input.name,
    category: input.category,
    logo: input.logo ?? null,
    provenance: input.provenance ?? 'UNAVAILABLE',
    spotAvailable: input.spotAvailable ?? input.category === 'Crypto',
    binaryAvailable: input.binaryAvailable ?? true,
    price: input.price ?? null,
    change24h: input.change24h ?? null,
    volume24h: input.volume24h ?? null,
    precision: input.precision ?? null,
    displayMetadata: input.displayMetadata ?? {},
  };
}

export function instrumentFromMarketPair(row: MarketPairLike): ActiveInstrument {
  const symbol = normalizePair(row.symbol);
  const registered = findAsset(row.assetId ?? row.symbol);
  const category: InstrumentCategory = registered ? (registered.category === 'Metals' ? 'Metal' : registered.category === 'Stocks' ? 'Shares' : registered.category) : categoryForSymbol(symbol);
  const hasUsableMarketData = row.dataState === 'LIVE' || row.dataState === 'STALE';
  const provenance: MarketProvenance = row.dataState === 'LIVE'
    ? 'LIVE'
    : row.dataState === 'STALE'
      ? 'STALE'
      : 'UNAVAILABLE';
  return createActiveInstrument({
    assetId: registered?.id ?? row.assetId ?? (row.displaySymbol || symbol),
    symbol: row.displaySymbol || symbol,
    pair: pairForSymbol(symbol, category),
    name: row.name,
    category,
    logo: row.icon.startsWith('http') ? row.icon : null,
    provenance,
    spotAvailable: category === 'Crypto',
    binaryAvailable: true,
    price: hasUsableMarketData ? row.price : null,
    change24h: hasUsableMarketData ? row.change : null,
    volume24h: hasUsableMarketData && Number.isFinite(row.vol) ? row.vol ?? null : null,
    displayMetadata: { displaySymbol: row.displaySymbol },
  });
}

export const defaultActiveInstrument = createActiveInstrument({
  assetId: 'crypto:btc',
  symbol: 'BTC',
  pair: 'BTC/USDT',
  name: 'Bitcoin',
  category: 'Crypto',
  spotAvailable: true,
  binaryAvailable: true,
});
