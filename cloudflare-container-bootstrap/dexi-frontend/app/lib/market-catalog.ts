import { ASSET_REGISTRY, findAsset, type AssetCategory, type AssetDefinition } from './asset-registry.ts';
import { finiteMarketNumber } from './market-data.ts';

export interface MarketPair {
  assetId: string;
  category: AssetCategory;
  symbol: string;
  pair: string;
  displaySymbol: string;
  name: string;
  price: number | null;
  change: number | null;
  icon: string;
  vol?: number | null;
  marketCap?: number | null;
  high?: number | null;
  low?: number | null;
  precision?: number;
  source?: 'fallback' | 'tick' | 'external';
  provider?: string;
  observedAt?: string;
  dataState?: 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'ERROR';
  sparkline?: number[];
}


const pairFor = (asset: AssetDefinition, values: Partial<MarketPair> = {}): MarketPair => ({
  assetId: asset.id, category: asset.category, symbol: asset.category === 'Stocks' ? `${asset.displaySymbol}USDT` : asset.symbol.replace('.US', '') + (asset.category === 'Crypto' ? 'USDT' : ''), pair: asset.pair,
  displaySymbol: asset.displaySymbol, name: asset.name, price: null, change: null, icon: asset.iconKey ?? asset.displaySymbol.slice(0, 3), vol: null, precision: asset.precision,
  source: 'fallback', provider: 'FALLBACK', dataState: 'UNAVAILABLE', ...values,
});

const normaliseSymbol = (symbol: string) => symbol.replaceAll('/', '').replace('.US', '').toUpperCase();
const toDisplaySymbol = (symbol: string) => symbol.endsWith('USDT') && symbol.length > 4 ? symbol.slice(0, -4) : symbol;

const pairsFromPriceRows = (payload: unknown, providerHeader?: unknown): MarketPair[] => {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.marketPairs)
        ? root.marketPairs
        : Array.isArray(root?.prices)
          ? root.prices
          : [];
  const responseState = typeof root?.dataState === 'string' ? root.dataState : undefined;
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return [];
    const ticker = row as Record<string, unknown>;
    const rawSymbol = typeof ticker.symbol === 'string' ? ticker.symbol : '';
    const symbol = normaliseSymbol(rawSymbol);
    const asset = findAsset(symbol) ?? findAsset(typeof ticker.displaySymbol === 'string' ? ticker.displaySymbol : symbol);
    const parsedPrice = ticker.lastPrice === null || ticker.lastPrice === undefined || ticker.lastPrice === '' ? null : Number(ticker.lastPrice);
    const lastPrice = Number.isFinite(parsedPrice) && parsedPrice! > 0 ? parsedPrice : null;
    if (!symbol) return [];
    const provider = typeof ticker.provider === 'string' && ticker.provider.trim()
      ? ticker.provider.trim()
      : String(ticker.source ?? providerHeader ?? '').trim() || 'NEXI_BACKEND';
    const base = asset ? pairFor(asset) : { assetId: `unmapped:${symbol}`, category: 'Crypto' as const, symbol, pair: `${toDisplaySymbol(symbol)}/USDT`, displaySymbol: toDisplaySymbol(symbol), name: typeof ticker.name === 'string' ? ticker.name : symbol, price: null, change: null, icon: toDisplaySymbol(symbol), source: 'fallback' as const, provider: 'FALLBACK' as const, dataState: 'UNAVAILABLE' as const };
    const sparkline = Array.isArray(ticker.sparkline) ? ticker.sparkline.map(finiteMarketNumber).filter((value): value is number => value !== null && value > 0) : [];
    const changeValue = finiteMarketNumber(ticker.priceChangePercent);
    const volumeValue = finiteMarketNumber(ticker.volume);
    const dataState = typeof ticker.dataState === 'string' ? ticker.dataState as MarketPair['dataState'] : responseState as MarketPair['dataState'] ?? (lastPrice === null ? 'UNAVAILABLE' : 'LIVE');
    return [{ ...base, name: base.name, price: lastPrice, change: changeValue, vol: volumeValue, high: finiteMarketNumber(ticker.high), low: finiteMarketNumber(ticker.low), marketCap: finiteMarketNumber(ticker.marketCap), icon: base.icon, source: provider.toUpperCase() === 'COINGECKO' ? 'external' as const : 'tick' as const, provider, dataState, observedAt: typeof ticker.observedAt === 'string' ? ticker.observedAt : undefined, sparkline }];
  });
};

export function marketCatalog(payload: unknown = [], provider?: unknown): MarketPair[] {
  const liveByAsset = new Map(pairsFromPriceRows(payload, provider).map((item) => [item.assetId, item]));
  return ASSET_REGISTRY.map((asset) => liveByAsset.get(asset.id) ?? pairFor(asset));
}
