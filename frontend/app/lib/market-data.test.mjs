import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCandle, marketChartDisplayStatus, marketDataStatusLabel, marketDisplayStatus } from './market-data.ts';

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
  assert.equal(marketDataStatusLabel('CLOSED'), 'Closed');
  assert.equal(marketDataStatusLabel('LOADING'), 'Loading market data');
});

test('exposes only Live, Error, or Closed as market display status', () => {
  assert.equal(marketDisplayStatus('LIVE', 'OPEN'), 'Live');
  assert.equal(marketDisplayStatus('UNAVAILABLE', 'CLOSED'), 'Closed');
  assert.equal(marketDisplayStatus('STALE', 'OPEN'), 'Error');
});

test('normalizes internal chart transport states to the three product statuses', () => {
  assert.equal(marketChartDisplayStatus('LIVE'), 'LIVE');
  assert.equal(marketChartDisplayStatus('LOADING'), 'LOADING');
  assert.equal(marketChartDisplayStatus('CLOSED'), 'CLOSED');
  for (const status of ['STALE', 'UNAVAILABLE', 'DISABLED', 'ERROR', 'CONNECTION_LOST']) {
    assert.equal(marketChartDisplayStatus(status), 'ERROR');
  }
});
