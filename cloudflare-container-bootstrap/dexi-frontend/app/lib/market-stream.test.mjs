import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMarketTick,
  applyMarketKline,
  EMPTY_STREAM_SNAPSHOT,
  normalizeMarketKline,
  normalizeMarketTick,
  marketSnapshotForSymbol,
  reconnectRecoveryStatus,
  shouldApplyRecovery,
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

test('normalizes and applies a backend Kline event to the selected chart', () => {
  const kline = normalizeMarketKline({
    symbol: 'BTC/USDT', interval: '1m', openTime: 60_000, closeTime: 120_000,
    open: '10', high: '12', low: '9', close: '11', volume: '3',
    observedAt: '1970-01-01T00:02:00.000Z', sequence: 2,
  }, 'BTCUSDT', '1m');
  assert.ok(kline);
  const updated = applyMarketKline(EMPTY_STREAM_SNAPSHOT, kline);
  assert.deepEqual(updated.candles, [{ time: 60, open: 10, high: 12, low: 9, close: 11, volume: 3 }]);
  assert.equal(updated.price, 11);
  assert.equal(normalizeMarketKline({ symbol: 'ETHUSDT', interval: '1m', openTime: 60_000, open: 1, high: 1, low: 1, close: 1 }, 'BTCUSDT', '1m'), null);
});


test('anchors a snapshot to the selected row state and sequence instead of aggregate state', () => {
  const current = marketSnapshotForSymbol({
    state: 'LIVE',
    data: [
      { symbol: 'BTCUSDT', state: 'LIVE', price: '100', sequence: '9', observedAt: '2026-09-19T23:30:00.000Z' },
      { symbol: 'SUNUSDT', state: 'STALE', price: '0.02', sequence: '4', observedAt: '2026-09-19T23:28:00.000Z' },
    ],
  }, 'SUNUSDT');
  assert.deepEqual(current, {
    status: 'STALE', price: 0.02, lastSequence: 4, lastTimestamp: Date.parse('2026-09-19T23:28:00.000Z'),
  });
});

test('models reconnect read-back failure and stale recovery generations deterministically', () => {
  assert.equal(reconnectRecoveryStatus(EMPTY_STREAM_SNAPSHOT), 'UNAVAILABLE');
  assert.equal(reconnectRecoveryStatus({ ...EMPTY_STREAM_SNAPSHOT, candles: [{ time: 60, open: 1, high: 1, low: 1, close: 1 }] }), 'STALE');
  assert.equal(shouldApplyRecovery(2, 2, false), true);
  assert.equal(shouldApplyRecovery(1, 2, false), false);
  assert.equal(shouldApplyRecovery(2, 2, true), false);
});
