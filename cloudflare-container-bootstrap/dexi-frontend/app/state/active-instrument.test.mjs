import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createActiveInstrument,
  instrumentFromPair,
  instrumentFromMarketPair,
  normalizePair,
  pairToRouteSymbol,
} from './active-instrument.ts';

test('normalizes pair identifiers without changing the displayed pair', () => {
  assert.equal(normalizePair(' btc/usdt '), 'BTCUSDT');
  assert.equal(pairToRouteSymbol('BTC/USDT'), 'BTCUSDT');
});

test('derives safe direct-route metadata without carrying the previous asset name', () => {
  const crypto = instrumentFromPair('ETHUSDT');
  const forex = instrumentFromPair('EURUSD');

  assert.equal(crypto.symbol, 'ETH');
  assert.equal(crypto.pair, 'ETH/USDT');
  assert.equal(crypto.name, 'Ethereum');
  assert.equal(crypto.assetId, 'crypto:eth');
  assert.equal(crypto.category, 'Crypto');
  assert.equal(crypto.provenance, 'UNAVAILABLE');

  assert.equal(forex.symbol, 'EURUSD');
  assert.equal(forex.pair, 'EUR/USD');
  assert.equal(forex.assetId, 'forex:eurusd');
  assert.equal(forex.category, 'Forex');

  const stock = instrumentFromPair('AAPLUSDT');
  assert.equal(stock.assetId, 'stock:aapl');
  assert.equal(stock.symbol, 'AAPL');
  assert.equal(stock.pair, 'AAPL/USDT');
  assert.equal(stock.name, 'Apple');
  assert.equal(stock.category, 'Shares');
});

test('creates an unavailable instrument without inventing market values', () => {
  const instrument = createActiveInstrument({
    assetId: 'bitcoin',
    symbol: 'BTC',
    pair: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Crypto',
  });

  assert.equal(instrument.provenance, 'UNAVAILABLE');
  assert.equal(instrument.price, null);
  assert.equal(instrument.change24h, null);
  assert.equal(instrument.volume24h, null);
  assert.equal(instrument.pair, 'BTC/USDT');
});

test('maps a market row into shared instrument state', () => {
  const instrument = instrumentFromMarketPair({
    symbol: 'ETHUSDT',
    displaySymbol: 'ETH',
    name: 'Ethereum',
    price: 10,
    change: 1.5,
    icon: 'https://example.test/eth.png',
    vol: 25,
    source: 'tick',
    dataState: 'LIVE',
  });

  assert.equal(instrument.assetId, 'crypto:eth');
  assert.equal(instrument.pair, 'ETH/USDT');
  assert.equal(instrument.provenance, 'LIVE');
  assert.equal(instrument.price, 10);
  assert.equal(instrument.change24h, 1.5);
  assert.equal(instrument.volume24h, 25);
  assert.equal(instrument.logo, 'https://example.test/eth.png');
});

test('does not expose stale market values as usable public state', () => {
  const instrument = instrumentFromMarketPair({
    symbol: 'ETHUSDT',
    displaySymbol: 'ETH',
    name: 'Ethereum',
    price: 10,
    change: -1.5,
    icon: 'eth.svg',
    vol: 25,
    dataState: 'STALE',
  });

  assert.equal(instrument.provenance, 'UNAVAILABLE');
  assert.equal(instrument.price, null);
  assert.equal(instrument.change24h, null);
  assert.equal(instrument.volume24h, null);
});


test('maps canonical stock rows to the backend Kline symbol without provider suffix leakage', () => {
  const instrument = instrumentFromMarketPair({
    assetId: 'stock:aapl',
    symbol: 'AAPLUSDT',
    displaySymbol: 'AAPL',
    name: 'Apple',
    price: 190,
    change: 0.5,
    icon: 'aapl.svg',
    dataState: 'LIVE',
  });
  assert.equal(instrument.category, 'Shares');
  assert.equal(instrument.pair, 'AAPL/USDT');
  assert.equal(normalizePair(instrument.pair), 'AAPLUSDT');
});
