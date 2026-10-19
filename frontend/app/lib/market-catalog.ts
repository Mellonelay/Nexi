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
  sessionState?: 'OPEN' | 'CLOSED';
  reason?: string;
  sequence?: string;
  sparkline?: number[];
}


const pairFor = (asset: AssetDefinition, values: Partial<MarketPair> = {}): MarketPair => ({
  assetId: asset.id, category: asset.category, symbol: asset.category === 'Stocks' ? `${asset.displaySymbol}USDT` : asset.symbol.replace('.US', '') + (asset.category === 'Crypto' ? 'USDT' : ''), pair: asset.pair,
  displaySymbol: asset.displaySymbol, name: asset.name, price: null, change: null, icon: asset.iconKey ?? asset.displaySymbol.slice(0, 3), vol: null, precision: asset.precision,
  source: 'fallback', provider: 'FALLBACK', dataState: 'UNAVAILABLE', ...values,
});

const normaliseSymbol = (symbol: string) => symbol.replaceAll('/', '').replace('.US', '').toUpperCase();
const toDisplaySymbol = (symbol: string) => symbol.endsWith('USDT') && symbol.length > 4 ? symbol.slice(0, -4) : symbol;
const MARKET_DATA_STATES = new Set<string>(['LIVE', 'STALE', 'UNAVAILABLE', 'ERROR']);

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';
const marketDataState = (value: unknown): MarketPair['dataState'] | undefined =>
  typeof value === 'string' && MARKET_DATA_STATES.has(value) ? value as MarketPair['dataState'] : undefined;

const marketSequence = (value: unknown): string | undefined => {
  switch (typeof value) {
    case 'bigint':
      return value < BigInt(0) ? undefined : value.toString();
    case 'number':
      if (!Number.isSafeInteger(value)) return undefined;
      return value < 0 ? undefined : String(value);
    case 'string': {
      const trimmed = value.trim();
      return /^\d+$/.test(trimmed) ? BigInt(trimmed).toString() : undefined;
    }
    default:
      return undefined;
  }
};

const sequenceValue = (value: string | undefined): bigint | null => value === undefined ? null : BigInt(value);

const payloadRows = (payload: unknown, root: Record<string, unknown> | null): unknown[] => {
  if (Array.isArray(payload)) return payload;
  for (const key of ['data', 'marketPairs', 'prices']) {
    const candidate = root?.[key];
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const positivePrice = (value: unknown): number | null => {
  if (value === null) return null;
  if (value === undefined) return null;
  if (value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed <= 0) return null;
  return parsed;
};

const providerFor = (ticker: Record<string, unknown>, providerHeader?: unknown): string => {
  if (typeof ticker.provider === 'string' && ticker.provider.trim()) return ticker.provider.trim();
  return String(ticker.source ?? providerHeader ?? '').trim() || 'NEXI_BACKEND';
};

const unmappedPair = (symbol: string, ticker: Record<string, unknown>): MarketPair => ({
  assetId: `unmapped:${symbol}`,
  category: 'Crypto',
  symbol,
  pair: `${toDisplaySymbol(symbol)}/USDT`,
  displaySymbol: toDisplaySymbol(symbol),
  name: typeof ticker.name === 'string' ? ticker.name : symbol,
  price: null,
  change: null,
  icon: toDisplaySymbol(symbol),
  source: 'fallback',
  provider: 'FALLBACK',
  dataState: 'UNAVAILABLE',
});

const sparklineFor = (ticker: Record<string, unknown>): number[] => {
  if (!Array.isArray(ticker.sparkline)) return [];
  return ticker.sparkline.map(finiteMarketNumber).filter((value): value is number => value !== null && value > 0);
};

const pairFromPriceRow = (row: unknown, responseState: MarketPair['dataState'] | undefined, providerHeader?: unknown): MarketPair | null => {
  if (!isRecord(row)) return null;
  const rawSymbol = typeof row.symbol === 'string' ? row.symbol : '';
  const symbol = normaliseSymbol(rawSymbol);
  if (!symbol) return null;
  const displayLookup = typeof row.displaySymbol === 'string' ? row.displaySymbol : symbol;
  const asset = findAsset(symbol) ?? findAsset(displayLookup);
  const lastPrice = positivePrice(row.lastPrice);
  const provider = providerFor(row, providerHeader);
  const base = asset ? pairFor(asset) : unmappedPair(symbol, row);
  const dataState = marketDataState(row.state ?? row.dataState) ?? responseState ?? (lastPrice === null ? 'UNAVAILABLE' : 'LIVE');
  return {
    ...base,
    price: lastPrice,
    change: finiteMarketNumber(row.priceChangePercent),
    vol: finiteMarketNumber(row.volume),
    high: finiteMarketNumber(row.high),
    low: finiteMarketNumber(row.low),
    marketCap: finiteMarketNumber(row.marketCap),
    source: provider.toUpperCase() === 'COINGECKO' ? 'external' : 'tick',
    provider,
    dataState,
    sessionState: typeof row.sessionState === 'string' && row.sessionState.toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN',
    reason: typeof row.reason === 'string' ? row.reason : undefined,
    sequence: marketSequence(row.sequence),
    observedAt: typeof row.observedAt === 'string' ? row.observedAt : undefined,
    sparkline: sparklineFor(row),
  };
};

const pairsFromPriceRows = (payload: unknown, providerHeader?: unknown): MarketPair[] => {
  const root = isRecord(payload) ? payload : null;
  const responseState = marketDataState(root?.state ?? root?.dataState);
  return payloadRows(payload, root)
    .map((row) => pairFromPriceRow(row, responseState, providerHeader))
    .filter((row): row is MarketPair => row !== null);
};

export function marketCatalog(payload: unknown = [], provider?: unknown): MarketPair[] {
  const liveByAsset = new Map(pairsFromPriceRows(payload, provider).map((item) => [item.assetId, item]));
  return ASSET_REGISTRY.map((asset) => liveByAsset.get(asset.id) ?? pairFor(asset));
}

export function applyMarketSnapshot(current: readonly MarketPair[], payload: unknown, provider?: unknown): MarketPair[] {
  const incoming = marketCatalog(payload, provider);
  const previousByAsset = new Map(current.map((row) => [row.assetId, row]));
  return incoming.map((row) => {
    const previous = previousByAsset.get(row.assetId);
    const nextSequence = sequenceValue(row.sequence);
    const previousSequence = sequenceValue(previous?.sequence);
    return previous && nextSequence !== null && previousSequence !== null && nextSequence < previousSequence ? previous : row;
  });
}

const tickState = (value: unknown): NonNullable<MarketPair['dataState']> => marketDataState(value) ?? 'LIVE';

const tickAsset = (tick: Record<string, unknown>): AssetDefinition | undefined => {
  const symbol = typeof tick.symbol === 'string' ? tick.symbol : '';
  const canonicalId = typeof tick.canonicalAssetId === 'string' ? tick.canonicalAssetId : symbol;
  return findAsset(symbol) ?? findAsset(canonicalId);
};

const tickObservedAt = (tick: Record<string, unknown>, fallback?: string): string | undefined =>
  typeof tick.timestamp === 'string' ? tick.timestamp : typeof tick.observedAt === 'string' ? tick.observedAt : fallback;

const finiteOr = (value: unknown, fallback: number | null): number | null => {
  const parsed = finiteMarketNumber(value);
  return parsed === null ? fallback : parsed;
};

const optionalFiniteOr = (value: unknown, fallback: number | null | undefined): number | null | undefined => {
  const parsed = finiteMarketNumber(value);
  return parsed === null ? fallback : parsed;
};

const stringOr = (value: unknown, fallback?: string): string | undefined =>
  typeof value === 'string' && value.trim() ? value : fallback;

const mergeMarketTick = (previous: MarketPair, tick: Record<string, unknown>, price: number, sequence: string): MarketPair => ({
  ...previous,
  price,
  change: finiteOr(tick.change ?? tick.priceChangePercent, previous.change),
  vol: optionalFiniteOr(tick.vol ?? tick.volume, previous.vol),
  provider: stringOr(tick.provider, previous.provider),
  observedAt: tickObservedAt(tick, previous.observedAt),
  source: 'tick',
  dataState: tickState(tick.state),
  sessionState: typeof tick.sessionState === 'string' ? (tick.sessionState.toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN') : previous.sessionState,
  reason: typeof tick.reason === 'string' ? tick.reason : previous.reason,
  sequence,
});

const positiveMarketNumber = (value: unknown): number | null => {
  const parsed = finiteMarketNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
};

type TickObservation = { assetId: string; tick: Record<string, unknown>; price: number; sequence: string };

const tickPrice = (tick: Record<string, unknown>): number | null =>
  positiveMarketNumber(tick.price === undefined ? tick.lastPrice : tick.price);

const tickObservation = (payload: unknown): TickObservation | null => {
  if (!isRecord(payload)) return null;
  const asset = tickAsset(payload);
  if (!asset) return null;
  const price = tickPrice(payload);
  const sequence = marketSequence(payload.sequence);
  return price === null || sequence === undefined ? null : { assetId: asset.id, tick: payload, price, sequence };
};

export function applyMarketTick(current: readonly MarketPair[], payload: unknown): MarketPair[] {
  const observation = tickObservation(payload);
  if (!observation) return [...current];
  const index = current.findIndex((item) => item.assetId === observation.assetId);
  if (index < 0) return [...current];
  const previousSequence = sequenceValue(current[index].sequence);
  const nextSequence = sequenceValue(observation.sequence);
  if (previousSequence !== null && nextSequence !== null && nextSequence <= previousSequence) return [...current];
  const next = [...current];
  next[index] = mergeMarketTick(next[index], observation.tick, observation.price, observation.sequence);
  return next;
}
