import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCandle, marketDataStatusLabel } from './market-data.ts';

test('normalizes only finite OHLCV candles', () => {
  assert.deepEqual(normalizeCandle({ time: 10, open: '1', high: '2', low: '0.5', close: '1.5', volume: '4' }), {
    time: 10, open: 1, high: 2, low: 0.5, close: 1.5, volume: 4,
  });
  assert.equal(normalizeCandle({ time: 'bad', open: 1, high: 2, low: 0, close: 1 }), null);
});

test('keeps unavailable and interrupted market states explicit', () => {
  assert.equal(marketDataStatusLabel('UNAVAILABLE'), 'Market data unavailable');
  assert.equal(marketDataStatusLabel('STALE'), 'Market data stale');
  assert.equal(marketDataStatusLabel('ERROR'), 'Market data error');
  assert.equal(marketDataStatusLabel('CONNECTION_LOST'), 'Market connection lost');
});
