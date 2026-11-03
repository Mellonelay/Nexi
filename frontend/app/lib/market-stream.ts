import type { Candle, MarketDataStatus } from "./market-data";

function normalizeStreamCandle(value: {
  time?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  volume?: unknown;
}): Candle | null {
  const number = (candidate: unknown) => {
    const parsed =
      typeof candidate === "number" ? candidate : Number(candidate);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const time = number(value.time);
  const open = number(value.open);
  const high = number(value.high);
  const low = number(value.low);
  const close = number(value.close);
  const volume = value.volume === undefined ? undefined : number(value.volume);
  if (
    time === null ||
    open === null ||
    high === null ||
    low === null ||
    close === null ||
    (value.volume !== undefined && volume === null)
  )
    return null;
  if (high < Math.max(open, close) || low > Math.min(open, close) || high < low)
    return null;
  const normalizedVolume = volume ?? undefined;
  return {
    time,
    open,
    high,
    low,
    close,
    ...(normalizedVolume === undefined ? {} : { volume: normalizedVolume }),
  };
}

export type StreamState = MarketDataStatus | "CONNECTING" | "RECONNECTING";

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
  provider?: string;
  source?: string;
  closeTime?: number | null;
  isFinal?: boolean;
}

export interface CandleRevision {
  observedAt: number;
  sequence: number | null;
  provider: string | null;
  source: string | null;
  isFinal: boolean;
}

export type MarketRecoveryEvent =
  | { type: "TICK"; tick: MarketTickEvent }
  | { type: "KLINE"; kline: MarketKlineEvent };

const MAX_RECOVERY_BUFFER = 500;

export function appendRecoveryEvent<T>(
  buffer: T[],
  event: T,
  max = MAX_RECOVERY_BUFFER,
): T[] | null {
  return buffer.length >= max ? null : [...buffer, event];
}

export function sortRecoveryEvents<T extends MarketRecoveryEvent>(
  events: T[],
): T[] {
  return [...events].sort((left, right) => {
    const leftTime =
      left.type === "TICK" ? left.tick.timestamp : left.kline.observedAt;
    const rightTime =
      right.type === "TICK" ? right.tick.timestamp : right.kline.observedAt;
    if (leftTime !== rightTime) return leftTime - rightTime;
    const leftSequence =
      left.type === "TICK"
        ? (left.tick.sequence ?? 0)
        : (left.kline.sequence ?? 0);
    const rightSequence =
      right.type === "TICK"
        ? (right.tick.sequence ?? 0)
        : (right.kline.sequence ?? 0);
    if (leftSequence !== rightSequence) return leftSequence - rightSequence;
    return left.type.localeCompare(right.type);
  });
}

export interface MarketStreamSnapshot {
  status: StreamState;
  lastSequence: number | null;
  lastTimestamp: number | null;
  lastQuoteTimestamp: number | null;
  lastKlineTimestamp: number | null;
  lastKlineProvider: string | null;
  lastKlineSource: string | null;
  lastKlineFinal: boolean | null;
  candleRevisions: Record<string, CandleRevision>;
  price: number | null;
  candles: Candle[];
}

export const EMPTY_STREAM_SNAPSHOT: MarketStreamSnapshot = {
  status: "UNAVAILABLE",
  lastSequence: null,
  lastTimestamp: null,
  lastQuoteTimestamp: null,
  lastKlineTimestamp: null,
  lastKlineProvider: null,
  lastKlineSource: null,
  lastKlineFinal: null,
  candleRevisions: {},
  price: null,
  candles: [],
};

export function normalizeMarketTick(
  value: unknown,
  expectedSymbol: string,
): MarketTickEvent | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const symbol = String(row.symbol ?? "")
    .replaceAll("/", "")
    .toUpperCase();
  const price = Number(row.price ?? row.lastPrice);
  const rawTimestamp = row.timestamp ?? row.time ?? Date.now();
  const numericTimestamp = Number(rawTimestamp);
  // MarketQuoteEvent preserves provider timestamps as ISO strings; market_tick
  // consumers require epoch milliseconds for ordering and candle bucketing.
  const timestamp = Number.isFinite(numericTimestamp)
    ? numericTimestamp
    : typeof rawTimestamp === "string"
      ? Date.parse(rawTimestamp)
      : Number.NaN;
  const sequence =
    row.sequence === undefined ? undefined : Number(row.sequence);
  const volume = row.volume === undefined ? undefined : Number(row.volume);

  if (symbol !== expectedSymbol.replaceAll("/", "").toUpperCase()) return null;
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    !Number.isFinite(timestamp) ||
    timestamp <= 0
  )
    return null;
  if (sequence !== undefined && !Number.isFinite(sequence)) return null;

  return {
    symbol,
    price,
    timestamp,
    sequence,
    volume: Number.isFinite(volume) && (volume ?? 0) >= 0 ? volume : undefined,
  };
}

export function normalizeMarketKline(
  value: unknown,
  expectedSymbol: string,
  expectedInterval: string,
): MarketKlineEvent | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const symbol = String(row.symbol ?? "")
    .replaceAll("/", "")
    .toUpperCase();
  const interval = String(row.interval ?? "");
  if (
    symbol !== expectedSymbol.replaceAll("/", "").toUpperCase() ||
    interval !== expectedInterval
  )
    return null;
  const openTime = Number(row.openTime ?? row.time);
  // The backend market_kline contract uses epoch milliseconds for openTime.
  const numericOpenTime = Number.isFinite(openTime) ? openTime : Number.NaN;
  const rawObservedAt =
    row.observedAt ?? row.receivedAt ?? row.closeTime ?? numericOpenTime;
  const observedAt =
    typeof rawObservedAt === "string"
      ? Date.parse(rawObservedAt)
      : Number(rawObservedAt);
  const rawVolume = row.volume;
  const candle = normalizeStreamCandle({
    time: Math.floor(numericOpenTime / 1000),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    ...(rawVolume === undefined || rawVolume === null
      ? {}
      : { volume: rawVolume }),
  });
  const sequence =
    row.sequence === undefined ? undefined : Number(row.sequence);
  if (
    !candle ||
    !Number.isFinite(observedAt) ||
    observedAt <= 0 ||
    (sequence !== undefined && !Number.isFinite(sequence))
  )
    return null;
  const rawCloseTime = row.closeTime;
  const closeTime =
    rawCloseTime == null
      ? null
      : typeof rawCloseTime === "string"
        ? Date.parse(rawCloseTime)
        : Number(rawCloseTime);
  return {
    symbol,
    interval,
    candle,
    observedAt,
    sequence,
    provider: typeof row.provider === "string" ? row.provider : undefined,
    source: typeof row.source === "string" ? row.source : undefined,
    closeTime: Number.isFinite(closeTime) ? closeTime : null,
    isFinal: typeof row.isFinal === "boolean" ? row.isFinal : undefined,
  };
}

export function applyMarketKline(
  snapshot: MarketStreamSnapshot,
  event: MarketKlineEvent,
  maxCandles = 500,
): MarketStreamSnapshot {
  const key = String(event.candle.time);
  const previousRevision = snapshot.candleRevisions?.[key];
  const revision: CandleRevision = {
    observedAt: event.observedAt,
    sequence: event.sequence ?? null,
    provider: event.provider ?? null,
    source: event.source ?? null,
    isFinal: event.isFinal ?? false,
  };
  const rank = (value: CandleRevision) =>
    value.source?.endsWith(":quote-aggregation")
      ? 0
      : value.source?.startsWith("derived:")
        ? 1
        : 2;
  const staleRevision =
    previousRevision &&
    revision.observedAt <= previousRevision.observedAt &&
    (revision.observedAt < previousRevision.observedAt ||
      (revision.sequence ?? Number.NEGATIVE_INFINITY) <=
        (previousRevision.sequence ?? Number.NEGATIVE_INFINITY));
  if (
    previousRevision &&
    (rank(revision) < rank(previousRevision) ||
      (previousRevision.isFinal && !revision.isFinal) ||
      (rank(revision) === rank(previousRevision) && staleRevision))
  ) {
    return snapshot;
  }
  const latestCandleTime =
    snapshot.candles.at(-1)?.time ?? Number.NEGATIVE_INFINITY;
  const isNewestCandle = event.candle.time >= latestCandleTime;
  const candles = [...snapshot.candles];
  const index = candles.findIndex(
    (candle) => candle.time === event.candle.time,
  );
  if (index >= 0) candles[index] = event.candle;
  else candles.push(event.candle);
  candles.sort((left, right) => left.time - right.time);
  const boundedCandles = candles.slice(-Math.max(1, maxCandles));
  const retainedTimes = new Set(
    boundedCandles.map((candle) => String(candle.time)),
  );
  const candleRevisions = Object.fromEntries(
    Object.entries({
      ...(snapshot.candleRevisions ?? {}),
      [key]: revision,
    }).filter(([time]) => retainedTimes.has(time)),
  );
  return {
    status:
      event.observedAt >= (snapshot.lastKlineTimestamp ?? 0)
        ? "LIVE"
        : snapshot.status,
    lastSequence: snapshot.lastSequence,
    lastTimestamp: Math.max(
      snapshot.lastKlineTimestamp ?? snapshot.lastTimestamp ?? 0,
      event.observedAt,
    ),
    lastQuoteTimestamp: snapshot.lastQuoteTimestamp,
    lastKlineTimestamp: Math.max(
      snapshot.lastKlineTimestamp ?? 0,
      event.observedAt,
    ),
    lastKlineProvider: isNewestCandle
      ? revision.provider
      : snapshot.lastKlineProvider,
    lastKlineSource: isNewestCandle
      ? revision.source
      : snapshot.lastKlineSource,
    lastKlineFinal: isNewestCandle ? revision.isFinal : snapshot.lastKlineFinal,
    candleRevisions,
    price:
      isNewestCandle && event.observedAt >= (snapshot.lastQuoteTimestamp ?? 0)
        ? event.candle.close
        : snapshot.price,
    candles: boundedCandles,
  };
}

export function applyMarketTick(
  snapshot: MarketStreamSnapshot,
  tick: MarketTickEvent,
  _intervalSeconds: number,
  _maxCandles = 500,
): MarketStreamSnapshot {
  if (
    tick.sequence !== undefined &&
    snapshot.lastSequence !== null &&
    tick.sequence <= snapshot.lastSequence
  ) {
    return snapshot;
  }
  if (
    snapshot.lastQuoteTimestamp !== null &&
    tick.timestamp < snapshot.lastQuoteTimestamp
  ) {
    return snapshot;
  }

  return {
    ...snapshot,
    lastSequence: tick.sequence ?? snapshot.lastSequence,
    lastQuoteTimestamp: tick.timestamp,
    price: tick.price,
  };
}

export function marketSnapshotForSymbol(
  value: unknown,
  expectedSymbol: string,
): Pick<
  MarketStreamSnapshot,
  "status" | "price" | "lastSequence" | "lastTimestamp"
> | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  const rows = Array.isArray(payload.data) ? payload.data : [];
  const expected = expectedSymbol.replaceAll("/", "").toUpperCase();
  const current = rows.find((candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    return (
      String((candidate as Record<string, unknown>).symbol ?? "")
        .replaceAll("/", "")
        .toUpperCase() === expected
    );
  });
  if (!current || typeof current !== "object") return null;
  const row = current as Record<string, unknown>;
  const rawState = String(
    row.state ?? row.dataState ?? "UNAVAILABLE",
  ).toUpperCase();
  const status: MarketStreamSnapshot["status"] =
    rawState === "LIVE" ||
    rawState === "STALE" ||
    rawState === "ERROR" ||
    rawState === "UNAVAILABLE" ||
    rawState === "CLOSED"
      ? rawState
      : "UNAVAILABLE";
  const price = Number(row.price ?? row.lastPrice);
  const sequence = Number(row.sequence);
  const rawTimestamp = row.observedAt ?? row.receivedAt;
  const timestamp =
    typeof rawTimestamp === "string"
      ? Date.parse(rawTimestamp)
      : Number(rawTimestamp);
  return {
    status,
    price: Number.isFinite(price) && price > 0 ? price : null,
    lastSequence: Number.isFinite(sequence) ? sequence : null,
    lastTimestamp:
      Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null,
  };
}

export function reconnectRecoveryStatus(
  snapshot: MarketStreamSnapshot,
): StreamState {
  return snapshot.candles.length ? "STALE" : "UNAVAILABLE";
}

export function shouldApplyRecovery(
  generation: number,
  activeGeneration: number,
  disposed: boolean,
): boolean {
  return !disposed && generation === activeGeneration;
}

export function marketCandleLineageLabel(
  source: string | null,
  isFinal: boolean | null,
): string | null {
  if (!source || isFinal !== false) return null;
  if (source.endsWith(":quote-aggregation"))
    return "Quote-sampled candle · provisional";
  if (source.startsWith("derived:"))
    return "Aggregated from provider candles · provisional";
  return "Provider candle · still open";
}

export function streamStatusAt(
  snapshot: MarketStreamSnapshot,
  now: number,
  staleAfterMs = 15_000,
): StreamState {
  const lastKline = snapshot.lastKlineTimestamp ?? snapshot.lastTimestamp;
  if (snapshot.status !== "LIVE" || lastKline === null) return snapshot.status;
  return now - lastKline > staleAfterMs ? "STALE" : "LIVE";
}

export function timeframeToSeconds(interval: string) {
  const units: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    M: 2592000,
  };
  const match = /^(\d+)([smhdwM])$/.exec(interval);
  return match ? Number(match[1]) * units[match[2]] : 60;
}
