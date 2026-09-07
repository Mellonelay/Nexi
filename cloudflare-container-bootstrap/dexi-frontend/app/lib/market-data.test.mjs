import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCandle, marketDataStatusLabel } from './market-data.ts';

test('normalizes only finite OHLCV candles', () => {
  assert.deepEqual(normalizeCandle({ time: 10, open: '1', high: '2', low: '0.5', close: '1.5', volume: '4' }), {
    time: 10, open: 1, high: 2, low: 0.5, close: 1.5, volume: 4,
  });
  assert.equal(normalizeCandle({ time: 'bad', open: 1, high: 2, low: 0, close: 1 }), null);
});

test('keeps internal market states out of user-facing labels', () => {
  assert.equal(marketDataStatusLabel('UNAVAILABLE'), 'Market data');
  assert.equal(marketDataStatusLabel('STALE'), 'Market data');
  assert.equal(marketDataStatusLabel('DISABLED'), 'Market data');
  assert.equal(marketDataStatusLabel('ERROR'), 'Market data');
  assert.equal(marketDataStatusLabel('CONNECTION_LOST'), 'Market data');
  assert.equal(marketDataStatusLabel('LOADING'), 'Loading market data');
});
