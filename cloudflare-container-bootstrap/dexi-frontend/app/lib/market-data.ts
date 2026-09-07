export type MarketDataStatus = 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'DISABLED' | 'LOADING' | 'ERROR' | 'CONNECTION_LOST';

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

const finite = (value: unknown) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
};

export function normalizeCandle(value: UnknownCandle): Candle | null {
  const time = finite(value.time);
  const open = finite(value.open);
  const high = finite(value.high);
  const low = finite(value.low);
  const close = finite(value.close);
  const volume = value.volume === undefined ? undefined : finite(value.volume);
  if (time === null || open === null || high === null || low === null || close === null || (value.volume !== undefined && volume === null)) return null;
  if (high < Math.max(open, close) || low > Math.min(open, close) || high < low) return null;
  const normalizedVolume = volume ?? undefined;
  return { time, open, high, low, close, ...(normalizedVolume === undefined ? {} : { volume: normalizedVolume }) };
}

export function marketDataStatusLabel(status: MarketDataStatus) {
  return status === 'LOADING' ? 'Loading market data' : 'Market data';
}
