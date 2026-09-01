import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMarketTick,
  EMPTY_STREAM_SNAPSHOT,
  normalizeMarketTick,
  streamStatusAt,
  timeframeToSeconds,
} from './market-stream.ts';

test('normalizes only valid backend ticks for the selected symbol', () => {
  assert.equal(normalizeMarketTick({ symbol: 'ETHUSDT', price: 2, timestamp: 10 }, 'BTCUSDT'), null);
  assert.equal(normalizeMarketTick({ symbol: 'BTCUSDT', price: 0, timestamp: 10 }, 'BTCUSDT'), null);
  assert.deepEqual(normalizeMarketTick({ symbol: 'BTC/USDT', price: 42, timestamp: 1000, sequence: 1 }, 'BTCUSDT'), {
    symbol: 'BTCUSDT', price: 42, timestamp: 1000, sequence: 1, volume: undefined,
  });
  assert.deepEqual(normalizeMarketTick({ symbol: 'BTCUSDT', price: 42, timestamp: '2026-08-10T00:00:01.000Z', sequence: 2 }, 'BTCUSDT'), {
    symbol: 'BTCUSDT', price: 42, timestamp: 1_786_320_001_000, sequence: 2, volume: undefined,
  });
});

test('deduplicates sequence numbers and builds bounded incremental candles', () => {
  const first = applyMarketTick(EMPTY_STREAM_SNAPSHOT, { symbol: 'BTCUSDT', price: 10, timestamp: 60_000, sequence: 1 }, 60, 2);
  const duplicate = applyMarketTick(first, { symbol: 'BTCUSDT', price: 20, timestamp: 61_000, sequence: 1 }, 60, 2);
  assert.equal(duplicate, first);
  const update = applyMarketTick(first, { symbol: 'BTCUSDT', price: 12, timestamp: 62_000, sequence: 2 }, 60, 2);
  assert.deepEqual(update.candles[0], { time: 60, open: 10, high: 12, low: 10, close: 12, volume: 0 });
});

test('marks quiet live streams stale and parses intervals', () => {
  const snapshot = { ...EMPTY_STREAM_SNAPSHOT, status: 'LIVE', lastTimestamp: 1_000 };
  assert.equal(streamStatusAt(snapshot, 20_000, 15_000), 'STALE');
  assert.equal(timeframeToSeconds('4h'), 14_400);
  assert.equal(timeframeToSeconds('1M'), 2_592_000);
});
