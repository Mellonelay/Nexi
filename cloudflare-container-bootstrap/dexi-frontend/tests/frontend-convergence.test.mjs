import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { ASSET_REGISTRY, findAsset, assetIconPath } from '../app/lib/asset-registry.ts';
import { applyMarketSnapshot, applyMarketTick, marketCatalog } from '../app/lib/market-catalog.ts';
import { finiteMarketNumber, normalizeCandle, marketDisplayStatus } from '../app/lib/market-data.ts';
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

  const closed = marketCatalog([{ symbol: 'EURUSD', lastPrice: '1.14859', state: 'UNAVAILABLE', sessionState: 'CLOSED', reason: 'MARKET_CLOSED' }]).find((item) => item.displaySymbol === 'EURUSD');
  assert.equal(closed.price, 1.14859);
  assert.equal(closed.sessionState, 'CLOSED');
  assert.equal(marketDisplayStatus(closed.dataState, closed.sessionState), 'Closed');
  assert.equal(instrumentFromMarketPair(closed).price, 1.14859);
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


test('all 53 discovery rows preserve backend state and monotonic per-symbol realtime sequences', () => {
  const empty = marketCatalog();
  const snapshot = applyMarketSnapshot(empty, { state: 'STALE', data: [
    { symbol: 'BTCUSDT', lastPrice: '101', priceChangePercent: '1.5', volume: '22', provider: 'binance-spot', state: 'STALE', sequence: '10' },
    { symbol: 'AAPLUSDT', lastPrice: '202', priceChangePercent: '-0.4', volume: '33', provider: 'gate', state: 'LIVE', sequence: '5' },
  ] });
  assert.equal(snapshot.length, 53);
  assert.equal(snapshot.find((row) => row.displaySymbol === 'BTC').price, 101);
  assert.equal(snapshot.find((row) => row.displaySymbol === 'BTC').dataState, 'STALE');
  assert.equal(snapshot.find((row) => row.displaySymbol === 'BTC').sequence, '10');
  assert.equal(snapshot.find((row) => row.displaySymbol === 'ETH').price, null);

  const ticked = applyMarketTick(snapshot, { symbol: 'BTCUSDT', price: '103', change: '2.1', vol: '44', provider: 'binance-spot', state: 'LIVE', sequence: '11', timestamp: '2026-09-16T00:00:00Z' });
  assert.equal(ticked.find((row) => row.displaySymbol === 'BTC').price, 103);
  assert.equal(ticked.find((row) => row.displaySymbol === 'BTC').sequence, '11');

  const replayed = applyMarketTick(ticked, { symbol: 'BTCUSDT', price: '99', state: 'LIVE', sequence: '10', timestamp: '2026-09-16T00:00:01Z' });
  assert.equal(replayed.find((row) => row.displaySymbol === 'BTC').price, 103);
  const lateSnapshot = applyMarketSnapshot(replayed, { state: 'LIVE', data: [
    { symbol: 'BTCUSDT', lastPrice: '102', provider: 'binance-spot', state: 'LIVE', sequence: '10' },
  ] });
  assert.equal(lateSnapshot.find((row) => row.displaySymbol === 'BTC').price, 103);
  assert.equal(lateSnapshot.find((row) => row.displaySymbol === 'BTC').sequence, '11');

  const noSequence = applyMarketTick(lateSnapshot, { symbol: 'BTCUSDT', price: '500', state: 'LIVE', timestamp: '2026-09-16T00:00:02Z' });
  assert.equal(noSequence.find((row) => row.displaySymbol === 'BTC').price, 103);
  const staleByCanonicalId = applyMarketTick(lateSnapshot, { canonicalAssetId: 'stock:aapl', price: '203', state: 'STALE', sequence: '6', observedAt: '2026-09-16T00:00:01Z' });
  assert.equal(staleByCanonicalId.find((row) => row.displaySymbol === 'AAPL').price, 203);
  assert.equal(staleByCanonicalId.find((row) => row.displaySymbol === 'AAPL').dataState, 'STALE');
});

test('source keeps the exact mobile product boundary and Operate-mode Quotes surface', () => {
  const nav = read('components/BottomNav.tsx');
  const quotes = read('dashboard/page.tsx');
  assert.match(nav, /label: "Spot\/Margin"/);
  assert.match(nav, /grid-cols-5/);
  assert.doesNotMatch(quotes, /Explore Opportunities/);
  assert.doesNotMatch(quotes, /Markets move fast/);
  assert.match(read('hooks/useMarketData.ts'), /socket\.on\('market_snapshot', handleSnapshot\)/);
  assert.match(read('hooks/useMarketData.ts'), /socket\.on\('market_tick', handleTick\)/);
});


test('market discovery and realtime catalog have one shared provider owner', () => {
  const providers = read('providers.tsx');
  const hook = read('hooks/useMarketData.ts');
  assert.match(providers, /<MarketDataProvider>/);
  assert.match(hook, /createContext<MarketDataValue/);
  assert.match(hook, /useMarketData must be used inside MarketDataProvider/);
  assert.equal((providers.match(/<MarketDataProvider>/g) ?? []).length, 1);
});


test('public financial and market copy does not expose implementation-authority jargon', () => {
  const publicSources = [
    read('dashboard/spot/page.tsx'),
    read('dashboard/wallet/page.tsx'),
    read('dashboard/asset/[symbol]/page.tsx'),
  ].join('\n');
  assert.doesNotMatch(publicSources, /authoritative API/i);
  assert.doesNotMatch(publicSources, /backend-authoritative/i);
  assert.doesNotMatch(publicSources, /approved market asset/i);
  assert.doesNotMatch(publicSources, /market asset is not approved/i);
});
