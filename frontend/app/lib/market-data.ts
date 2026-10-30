export type MarketDataStatus = 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'DISABLED' | 'LOADING' | 'ERROR' | 'CONNECTION_LOST' | 'CLOSED';
export type MarketDisplayStatus = 'Live' | 'Error' | 'Closed';

export function marketChartDisplayStatus(status: MarketDataStatus): 'LIVE' | 'LOADING' | 'ERROR' | 'CLOSED' {
  if (status === 'LIVE' || status === 'LOADING' || status === 'CLOSED') return status;
  return 'ERROR';
}

export function marketDisplayStatus(dataState: string | undefined, sessionState?: string): MarketDisplayStatus {
  if (sessionState?.toUpperCase() === 'CLOSED') return 'Closed';
  return dataState === 'LIVE' ? 'Live' : 'Error';
}

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type UnknownCandle = {
  time?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  volume?: unknown;
};

export const finiteMarketNumber = (value: unknown) => {
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && !value.trim())) return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

export function normalizeCandle(value: UnknownCandle): Candle | null {
  const time = finiteMarketNumber(value.time);
  const open = finiteMarketNumber(value.open);
  const high = finiteMarketNumber(value.high);
  const low = finiteMarketNumber(value.low);
  const close = finiteMarketNumber(value.close);
  const volume = value.volume == null ? undefined : finiteMarketNumber(value.volume);
  if (time === null || open === null || high === null || low === null || close === null || volume === null) return null;
  if (high < Math.max(open, close) || low > Math.min(open, close) || high < low) return null;
  const normalizedVolume = volume ?? undefined;
  return { time, open, high, low, close, ...(normalizedVolume === undefined ? {} : { volume: normalizedVolume }) };
}

export function marketDataStatusLabel(status: MarketDataStatus) {
  return status === 'CLOSED' ? 'Closed' : status === 'LOADING' ? 'Loading market data' : 'Market data';
}
