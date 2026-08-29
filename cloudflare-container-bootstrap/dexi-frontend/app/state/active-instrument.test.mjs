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
  assert.equal(crypto.name, 'ETH');
  assert.equal(crypto.category, 'Crypto');
  assert.equal(crypto.provenance, 'UNAVAILABLE');

  assert.equal(forex.symbol, 'EUR');
  assert.equal(forex.pair, 'EUR/USD');
  assert.equal(forex.category, 'Forex');
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
  });

  assert.equal(instrument.assetId, 'ETH');
  assert.equal(instrument.pair, 'ETH/USDT');
  assert.equal(instrument.provenance, 'LIVE');
  assert.equal(instrument.price, 10);
  assert.equal(instrument.change24h, 1.5);
  assert.equal(instrument.volume24h, 25);
  assert.equal(instrument.logo, 'https://example.test/eth.png');
});
