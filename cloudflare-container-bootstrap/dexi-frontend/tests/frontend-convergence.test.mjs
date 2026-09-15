import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { ASSET_REGISTRY, findAsset, assetIconPath } from '../app/lib/asset-registry.ts';
import { marketCatalog } from '../app/lib/market-catalog.ts';
import { finiteMarketNumber, normalizeCandle } from '../app/lib/market-data.ts';
import { simpleMovingAverage, exponentialMovingAverage, bollingerBands, relativeStrengthIndex, movingAverageConvergenceDivergence } from '../app/lib/market-indicators.ts';
import { instrumentFromMarketPair, instrumentFromPair, normalizePair } from '../app/state/active-instrument.ts';
import { binaryOrderReady } from '../app/lib/trading-states.ts';

const read = (path) => readFileSync(new URL('../app/' + path, import.meta.url), 'utf8');

test('all 53 assets remain discoverable without prices and share one route identity', () => {
  const catalog = marketCatalog();
  assert.equal(catalog.length, 53);
  assert.equal(new Set(catalog.map((row) => row.assetId)).size, 53);
  for (const row of catalog) {
    assert.equal(row.price, null);
    assert.equal(row.change, null);
    assert.equal(row.dataState, 'UNAVAILABLE');
    assert.equal(row.source, 'fallback');
    const asset = findAsset(row.assetId);
    assert.ok(existsSync(new URL('../public' + assetIconPath(asset), import.meta.url)));
    const fromQuote = instrumentFromMarketPair(row);
    const fromRoute = instrumentFromPair(normalizePair(fromQuote.pair));
    assert.equal(fromRoute.assetId, row.assetId);
    assert.equal(fromRoute.pair, fromQuote.pair);
    assert.equal(fromQuote.precision, asset.precision);
  }
  for (const asset of ASSET_REGISTRY) assert.equal(findAsset(asset.pair)?.id, asset.id);
  assert.equal(normalizePair('AAPL.US/USDT'), 'AAPLUSDT');
  assert.equal(normalizePair('EURUSD/USDT'), 'EURUSD');
  assert.equal(normalizePair('XAUUSD/USDT'), 'XAUUSD');
});

test('quote/candle adapters never coerce missing observations into zero', () => {
  for (const value of [null, undefined, '', ' ', false, {}, Infinity]) assert.equal(finiteMarketNumber(value), null);
  assert.equal(finiteMarketNumber('0'), 0);
  const row = marketCatalog([{ symbol: 'BTCUSDT', lastPrice: '100', priceChangePercent: null, volume: null, high: null, low: null, marketCap: null }])[0];
  assert.equal(row.price, 100);
  for (const key of ['change', 'vol', 'high', 'low', 'marketCap']) assert.equal(row[key], null);
  assert.equal(normalizeCandle({ time: 1, open: null, high: 2, low: 0, close: 1 }), null);
  const stale = marketCatalog([{ symbol: 'ETHUSDT', lastPrice: '100', dataState: 'STALE' }]).find((item) => item.displaySymbol === 'ETH');
  assert.equal(instrumentFromMarketPair(stale).price, null);
});

test('MA EMA BOLL RSI MACD calculations preserve flat and rising-series semantics', () => {
  const candles = Array.from({ length: 60 }, (_, i) => ({ time: i + 1, open: 10, high: 10, low: 10, close: 10, volume: 1 }));
  assert.equal(simpleMovingAverage(candles, 20).at(-1).value, 10);
  assert.equal(exponentialMovingAverage(candles, 20).at(-1).value, 10);
  assert.equal(bollingerBands(candles).upper.at(-1).value, 10);
  assert.equal(relativeStrengthIndex(candles), 50);
  assert.equal(movingAverageConvergenceDivergence(candles).histogram, 0);
  assert.equal(relativeStrengthIndex(candles.map((c, i) => ({ ...c, close: i + 1 }))), 100);
  assert.match(read('components/TradingChart.tsx'), /\[activeIndicators, interval\]/);
});

test('Options fail closed without both configured stake limits', () => {
  const input = { authenticated: true, backendConfigured: true, amount: 10, currentPrice: 20, durationEnabled: true, payoutRate: 2 };
  assert.equal(binaryOrderReady(input), false);
  assert.equal(binaryOrderReady({ ...input, minimumAmount: 5, maximumAmount: 20 }), true);
  assert.equal(binaryOrderReady({ ...input, minimumAmount: 20, maximumAmount: 5 }), false);
  assert.doesNotMatch(read('dashboard/binary/page.tsx'), /raw > 1 \? raw \/ 100/);
});

test('wallet totals, action locks and shared sheets preserve source safety boundaries', () => {
  const wallet = read('dashboard/wallet/page.tsx');
  assert.match(wallet, /const overviewTotal = root.total;/);
  assert.doesNotMatch(wallet, /available \+ locked/);
  for (const name of ['Deposit', 'Withdraw', 'Transfer', 'Convert']) {
    const source = read('dashboard/wallet/components/' + name + 'Modal.tsx');
    assert.match(source, /<ModalSurface/);
    assert.match(source, /submissionLock.current/);
  }
  assert.match(read('components/ModalSurface.tsx'), /@radix-ui\/react-dialog/);
  assert.match(read('components/ModalSurface.tsx'), /onCloseAutoFocus/);
  assert.match(read('components/ModalSurface.tsx'), /76px\+env\(safe-area-inset-bottom\)/);
  assert.match(read('dashboard/spot/page.tsx'), /socket.on\('disconnect', handleConnectionLoss\)/);
  assert.match(read('dashboard/spot/page.tsx'), /socket.off\('disconnect', handleConnectionLoss\)/);
  assert.match(read('components/BottomNav.tsx'), /grid-cols-5/);
});
