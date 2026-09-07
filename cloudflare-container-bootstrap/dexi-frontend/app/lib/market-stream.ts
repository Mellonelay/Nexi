import type { Candle, MarketDataStatus } from './market-data';

function normalizeStreamCandle(value: {
  time?: unknown; open?: unknown; high?: unknown; low?: unknown; close?: unknown; volume?: unknown;
}): Candle | null {
  const number = (candidate: unknown) => {
    const parsed = typeof candidate === 'number' ? candidate : Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const time = number(value.time);
  const open = number(value.open);
  const high = number(value.high);
  const low = number(value.low);
  const close = number(value.close);
  const volume = value.volume === undefined ? undefined : number(value.volume);
  if (time === null || open === null || high === null || low === null || close === null || (value.volume !== undefined && volume === null)) return null;
  if (high < Math.max(open, close) || low > Math.min(open, close) || high < low) return null;
  const normalizedVolume = volume ?? undefined;
  return { time, open, high, low, close, ...(normalizedVolume === undefined ? {} : { volume: normalizedVolume }) };
}

export type StreamState = MarketDataStatus | 'CONNECTING' | 'RECONNECTING';

export interface MarketTickEvent {
  symbol: string;
  price: number;
  timestamp: number;
  sequence?: number;
  volume?: number;
}

export interface MarketKlineEvent {
  symbol: string;
  interval: string;
  candle: Candle;
  observedAt: number;
  sequence?: number;
}

export interface MarketStreamSnapshot {
  status: StreamState;
  lastSequence: number | null;
  lastTimestamp: number | null;
  price: number | null;
  candles: Candle[];
}

export const EMPTY_STREAM_SNAPSHOT: MarketStreamSnapshot = {
  status: 'UNAVAILABLE',
  lastSequence: null,
  lastTimestamp: null,
  price: null,
  candles: [],
};

export function normalizeMarketTick(value: unknown, expectedSymbol: string): MarketTickEvent | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const symbol = String(row.symbol ?? '').replaceAll('/', '').toUpperCase();
  const price = Number(row.price ?? row.lastPrice);
  const rawTimestamp = row.timestamp ?? row.time ?? Date.now();
  const numericTimestamp = Number(rawTimestamp);
  // MarketQuoteEvent preserves provider timestamps as ISO strings; market_tick
  // consumers require epoch milliseconds for ordering and candle bucketing.
  const timestamp = Number.isFinite(numericTimestamp)
    ? numericTimestamp
    : typeof rawTimestamp === 'string'
      ? Date.parse(rawTimestamp)
      : Number.NaN;
  const sequence = row.sequence === undefined ? undefined : Number(row.sequence);
  const volume = row.volume === undefined ? undefined : Number(row.volume);

  if (symbol !== expectedSymbol.replaceAll('/', '').toUpperCase()) return null;
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(timestamp) || timestamp <= 0) return null;
  if (sequence !== undefined && !Number.isFinite(sequence)) return null;

  return {
    symbol,
    price,
    timestamp,
    sequence,
    volume: Number.isFinite(volume) && (volume ?? 0) >= 0 ? volume : undefined,
  };
}

export function normalizeMarketKline(value: unknown, expectedSymbol: string, expectedInterval: string): MarketKlineEvent | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const symbol = String(row.symbol ?? '').replaceAll('/', '').toUpperCase();
  const interval = String(row.interval ?? '');
  if (symbol !== expectedSymbol.replaceAll('/', '').toUpperCase() || interval !== expectedInterval) return null;
  const openTime = Number(row.openTime ?? row.time);
  // The backend market_kline contract uses epoch milliseconds for openTime.
  const numericOpenTime = Number.isFinite(openTime) ? openTime : Number.NaN;
  const rawObservedAt = row.observedAt ?? row.receivedAt ?? row.closeTime ?? numericOpenTime;
  const observedAt = typeof rawObservedAt === 'string' ? Date.parse(rawObservedAt) : Number(rawObservedAt);
  const rawVolume = row.volume;
  const candle = normalizeStreamCandle({
    time: Math.floor(numericOpenTime / 1000),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    ...(rawVolume === undefined || rawVolume === null ? {} : { volume: rawVolume }),
  });
  const sequence = row.sequence === undefined ? undefined : Number(row.sequence);
  if (!candle || !Number.isFinite(observedAt) || observedAt <= 0 || (sequence !== undefined && !Number.isFinite(sequence))) return null;
  return { symbol, interval, candle, observedAt, sequence };
}

export function applyMarketKline(snapshot: MarketStreamSnapshot, event: MarketKlineEvent, maxCandles = 500): MarketStreamSnapshot {
  const candles = [...snapshot.candles];
  const index = candles.findIndex((candle) => candle.time === event.candle.time);
  if (index >= 0) candles[index] = event.candle;
  else candles.push(event.candle);
  candles.sort((left, right) => left.time - right.time);
  return {
    status: 'LIVE',
    lastSequence: snapshot.lastSequence,
    lastTimestamp: Math.max(snapshot.lastTimestamp ?? 0, event.observedAt),
    price: event.candle.close,
    candles: candles.slice(-Math.max(1, maxCandles)),
  };
}

export function applyMarketTick(
  snapshot: MarketStreamSnapshot,
  tick: MarketTickEvent,
  intervalSeconds: number,
  maxCandles = 500,
): MarketStreamSnapshot {
  if (tick.sequence !== undefined && snapshot.lastSequence !== null && tick.sequence <= snapshot.lastSequence) {
    return snapshot;
  }
  if (snapshot.lastTimestamp !== null && tick.timestamp < snapshot.lastTimestamp - intervalSeconds * 1000) {
    return snapshot;
  }

  const bucket = Math.floor(tick.timestamp / (intervalSeconds * 1000)) * intervalSeconds;
  const candles = [...snapshot.candles];
  const last = candles.at(-1);
  if (last?.time === bucket) {
    candles[candles.length - 1] = {
      ...last,
      high: Math.max(last.high, tick.price),
      low: Math.min(last.low, tick.price),
      close: tick.price,
      volume: (last.volume ?? 0) + (tick.volume ?? 0),
    };
  } else if (!last || bucket > last.time) {
    candles.push({
      time: bucket,
      open: tick.price,
      high: tick.price,
      low: tick.price,
      close: tick.price,
      volume: tick.volume ?? 0,
    });
  }

  return {
    status: 'LIVE',
    lastSequence: tick.sequence ?? snapshot.lastSequence,
    lastTimestamp: tick.timestamp,
    price: tick.price,
    candles: candles.slice(-Math.max(1, maxCandles)),
  };
}

export function reconnectRecoveryStatus(snapshot: MarketStreamSnapshot): StreamState {
  return snapshot.candles.length ? 'STALE' : 'UNAVAILABLE';
}

export function shouldApplyRecovery(generation: number, activeGeneration: number, disposed: boolean): boolean {
  return !disposed && generation === activeGeneration;
}

export function streamStatusAt(snapshot: MarketStreamSnapshot, now: number, staleAfterMs = 15_000): StreamState {
  if (snapshot.status !== 'LIVE' || snapshot.lastTimestamp === null) return snapshot.status;
  return now - snapshot.lastTimestamp > staleAfterMs ? 'STALE' : 'LIVE';
}

export function timeframeToSeconds(interval: string) {
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, M: 2592000 };
  const match = /^(\d+)([smhdwM])$/.exec(interval);
  return match ? Number(match[1]) * units[match[2]] : 60;
}
