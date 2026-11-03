import test from "node:test";
import assert from "node:assert/strict";
import {
  applyMarketTick,
  applyMarketKline,
  appendRecoveryEvent,
  sortRecoveryEvents,
  marketCandleLineageLabel,
  EMPTY_STREAM_SNAPSHOT,
  normalizeMarketKline,
  normalizeMarketTick,
  marketSnapshotForSymbol,
  reconnectRecoveryStatus,
  shouldApplyRecovery,
  streamStatusAt,
  timeframeToSeconds,
} from "./market-stream.ts";

test("normalizes only valid backend ticks for the selected symbol", () => {
  assert.equal(
    normalizeMarketTick(
      { symbol: "ETHUSDT", price: 2, timestamp: 10 },
      "BTCUSDT",
    ),
    null,
  );
  assert.equal(
    normalizeMarketTick(
      { symbol: "BTCUSDT", price: 0, timestamp: 10 },
      "BTCUSDT",
    ),
    null,
  );
  assert.deepEqual(
    normalizeMarketTick(
      { symbol: "BTC/USDT", price: 42, timestamp: 1000, sequence: 1 },
      "BTCUSDT",
    ),
    {
      symbol: "BTCUSDT",
      price: 42,
      timestamp: 1000,
      sequence: 1,
      volume: undefined,
    },
  );
  assert.deepEqual(
    normalizeMarketTick(
      {
        symbol: "BTCUSDT",
        price: 42,
        timestamp: "2026-08-10T00:00:01.000Z",
        sequence: 2,
      },
      "BTCUSDT",
    ),
    {
      symbol: "BTCUSDT",
      price: 42,
      timestamp: 1_786_320_001_000,
      sequence: 2,
      volume: undefined,
    },
  );
});

test("deduplicates ticks without altering authoritative candles", () => {
  const candle = { time: 60, open: 10, high: 11, low: 9, close: 10, volume: 3 };
  const initial = { ...EMPTY_STREAM_SNAPSHOT, candles: [candle] };
  const first = applyMarketTick(
    initial,
    { symbol: "BTCUSDT", price: 12, timestamp: 60_000, sequence: 1 },
    60,
  );
  const duplicate = applyMarketTick(
    first,
    { symbol: "BTCUSDT", price: 20, timestamp: 61_000, sequence: 1 },
    60,
  );
  assert.equal(duplicate, first);
  assert.equal(first.price, 12);
  assert.deepEqual(first.candles, [candle]);
  const next = applyMarketTick(
    first,
    { symbol: "BTCUSDT", price: 13, timestamp: 120_000, sequence: 2 },
    60,
  );
  assert.deepEqual(next.candles, [candle]);
});

test("marks quiet live streams stale and parses intervals", () => {
  const snapshot = {
    ...EMPTY_STREAM_SNAPSHOT,
    status: "LIVE",
    lastTimestamp: 1_000,
  };
  assert.equal(streamStatusAt(snapshot, 20_000, 15_000), "STALE");
  assert.equal(timeframeToSeconds("4h"), 14_400);
  assert.equal(timeframeToSeconds("1M"), 2_592_000);
});

test("normalizes and applies a backend Kline event to the selected chart", () => {
  const kline = normalizeMarketKline(
    {
      symbol: "BTC/USDT",
      interval: "1m",
      openTime: 60_000,
      closeTime: 120_000,
      open: "10",
      high: "12",
      low: "9",
      close: "11",
      volume: "3",
      observedAt: "1970-01-01T00:02:00.000Z",
      sequence: 2,
    },
    "BTCUSDT",
    "1m",
  );
  assert.ok(kline);
  const updated = applyMarketKline(EMPTY_STREAM_SNAPSHOT, kline);
  assert.deepEqual(updated.candles, [
    { time: 60, open: 10, high: 12, low: 9, close: 11, volume: 3 },
  ]);
  assert.equal(updated.price, 11);
  assert.equal(
    normalizeMarketKline(
      {
        symbol: "ETHUSDT",
        interval: "1m",
        openTime: 60_000,
        open: 1,
        high: 1,
        low: 1,
        close: 1,
      },
      "BTCUSDT",
      "1m",
    ),
    null,
  );
});

test("anchors a snapshot to the selected row state and sequence instead of aggregate state", () => {
  const current = marketSnapshotForSymbol(
    {
      state: "LIVE",
      data: [
        {
          symbol: "BTCUSDT",
          state: "LIVE",
          price: "100",
          sequence: "9",
          observedAt: "2026-09-19T23:30:00.000Z",
        },
        {
          symbol: "SUNUSDT",
          state: "STALE",
          price: "0.02",
          sequence: "4",
          observedAt: "2026-09-19T23:28:00.000Z",
        },
      ],
    },
    "SUNUSDT",
  );
  assert.deepEqual(current, {
    status: "STALE",
    price: 0.02,
    lastSequence: 4,
    lastTimestamp: Date.parse("2026-09-19T23:28:00.000Z"),
  });
});

test("models reconnect read-back failure and stale recovery generations deterministically", () => {
  assert.equal(reconnectRecoveryStatus(EMPTY_STREAM_SNAPSHOT), "UNAVAILABLE");
  assert.equal(
    reconnectRecoveryStatus({
      ...EMPTY_STREAM_SNAPSHOT,
      candles: [{ time: 60, open: 1, high: 1, low: 1, close: 1 }],
    }),
    "STALE",
  );
  assert.equal(shouldApplyRecovery(2, 2, false), true);
  assert.equal(shouldApplyRecovery(1, 2, false), false);
  assert.equal(shouldApplyRecovery(2, 2, true), false);
});

test("quote freshness cannot keep stale Kline status live", () => {
  const withCandle = applyMarketKline(EMPTY_STREAM_SNAPSHOT, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 60, open: 10, high: 11, low: 9, close: 10 },
    observedAt: 60_000,
    sequence: 1,
    provider: "binance-spot",
    source: "websocket:kline",
    isFinal: true,
  });
  const quote = applyMarketTick(
    withCandle,
    { symbol: "BTCUSDT", price: 12, timestamp: 120_000, sequence: 2 },
    60,
  );
  assert.equal(quote.lastQuoteTimestamp, 120_000);
  assert.equal(quote.lastKlineTimestamp, 60_000);
  assert.equal(quote.status, "LIVE");
  assert.equal(streamStatusAt(quote, 80_000, 15_000), "STALE");
  assert.deepEqual(quote.candles, withCandle.candles);
});

test("per-candle revision rejects stale REST replay and provider lineage outranks quote aggregation", () => {
  const current = applyMarketKline(EMPTY_STREAM_SNAPSHOT, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 60, open: 10, high: 12, low: 9, close: 12 },
    observedAt: 90_000,
    sequence: 90_000,
    provider: "provider-a",
    source: "websocket:kline",
    isFinal: true,
  });
  const stale = applyMarketKline(current, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 60, open: 10, high: 10, low: 10, close: 10 },
    observedAt: 70_000,
    sequence: 70_000,
    provider: "provider-a",
    source: "rest:history",
    isFinal: false,
  });
  const quoteDerived = applyMarketKline(current, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 60, open: 10, high: 13, low: 9, close: 13 },
    observedAt: 100_000,
    sequence: 100_000,
    provider: "provider-a",
    source: "ticker:quote-aggregation",
    isFinal: false,
  });
  assert.equal(stale, current);
  assert.equal(quoteDerived, current);
  assert.equal(current.candles[0].close, 12);
});

test("an older bucket cannot refresh a newer candle clock", () => {
  const recent = applyMarketKline(EMPTY_STREAM_SNAPSHOT, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 120, open: 2, high: 2, low: 2, close: 2 },
    observedAt: 180_000,
    sequence: 180_000,
  });
  const older = applyMarketKline(recent, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 60, open: 1, high: 1, low: 1, close: 1 },
    observedAt: 120_000,
    sequence: 120_000,
  });
  assert.equal(older.status, "LIVE");
  assert.equal(older.lastKlineTimestamp, 180_000);
});

test("out-of-order Kline buckets remain sorted and duplicate revisions are ignored", () => {
  const newerBucket = applyMarketKline(EMPTY_STREAM_SNAPSHOT, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 120, open: 2, high: 2, low: 2, close: 2 },
    observedAt: 180_000,
    sequence: 180_000,
  });
  const olderBucket = applyMarketKline(newerBucket, {
    symbol: "BTCUSDT",
    interval: "1m",
    candle: { time: 60, open: 1, high: 1, low: 1, close: 1 },
    observedAt: 120_000,
    sequence: 120_000,
  });
  assert.deepEqual(
    olderBucket.candles.map((candle) => candle.time),
    [60, 120],
  );
});

test("provisional candles keep their source visible in chart copy", () => {
  assert.equal(
    marketCandleLineageLabel("gate:ticker:quote-aggregation", false),
    "Quote-sampled candle · provisional",
  );
  assert.equal(
    marketCandleLineageLabel("derived:1m-aggregation", false),
    "Aggregated from provider candles · provisional",
  );
  assert.equal(marketCandleLineageLabel("websocket:kline", true), null);
});

test("recovery buffers are bounded and replay order is deterministic", () => {
  const tick = { type: "TICK", tick: { timestamp: 20, sequence: 2 } };
  const kline = { type: "KLINE", kline: { observedAt: 10, sequence: 1 } };
  assert.deepEqual(sortRecoveryEvents([tick, kline]), [kline, tick]);
  assert.equal(appendRecoveryEvent([1, 2], 3, 2), null);
  assert.deepEqual(appendRecoveryEvent([1], 2, 2), [1, 2]);
});

test("worker rejects stale Kline revisions and provider candles outrank quote aggregation", async () => {
  const { readFile } = await import("node:fs/promises");
  const vm = await import("node:vm");
  const source = await readFile(
    new URL("../../public/market-stream-worker.js", import.meta.url),
    "utf8",
  );
  const messages = [];
  const self = { postMessage: (value) => messages.push(value) };
  vm.runInNewContext(source, { self });
  const candle = { time: 60, open: 10, high: 12, low: 9, close: 12 };
  const snapshot = {
    ...EMPTY_STREAM_SNAPSHOT,
    candles: [candle],
    candleRevisions: {
      60: {
        observedAt: 90_000,
        sequence: 90_000,
        provider: "p",
        source: "websocket:kline",
        isFinal: true,
      },
    },
    lastKlineTimestamp: 90_000,
    lastTimestamp: 90_000,
    status: "LIVE",
  };
  self.onmessage({
    data: { type: "INIT", generation: 4, intervalSeconds: 60, snapshot },
  });
  self.onmessage({
    data: {
      type: "KLINE",
      generation: 3,
      kline: {
        observedAt: 100_000,
        sequence: 100_000,
        candle: { ...candle, close: 13 },
      },
    },
  });
  self.onmessage({
    data: {
      type: "KLINE",
      generation: 4,
      kline: {
        observedAt: 100_000,
        sequence: 100_000,
        provider: "p",
        source: "ticker:quote-aggregation",
        isFinal: false,
        candle: { ...candle, close: 13 },
      },
    },
  });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].generation, 4);
  assert.equal(messages[0].snapshot.status, "LIVE");
});

test("worker ticks preserve provider candles", async () => {
  const { readFile } = await import("node:fs/promises");
  const vm = await import("node:vm");
  const source = await readFile(
    new URL("../../public/market-stream-worker.js", import.meta.url),
    "utf8",
  );
  const messages = [];
  const self = { postMessage: (value) => messages.push(value) };
  vm.runInNewContext(source, { self });
  const candle = { time: 60, open: 10, high: 11, low: 9, close: 10, volume: 3 };
  self.onmessage({
    data: {
      type: "INIT",
      generation: 1,
      intervalSeconds: 60,
      snapshot: { ...EMPTY_STREAM_SNAPSHOT, candles: [candle] },
    },
  });
  self.onmessage({
    data: {
      type: "TICK",
      generation: 1,
      tick: { price: 15, timestamp: 60_000, sequence: 1 },
    },
  });
  assert.equal(messages[1].snapshot.price, 15);
  assert.equal(messages[1].snapshot.status, "UNAVAILABLE");
  assert.deepEqual(JSON.parse(JSON.stringify(messages[1].snapshot.candles)), [
    candle,
  ]);
});
