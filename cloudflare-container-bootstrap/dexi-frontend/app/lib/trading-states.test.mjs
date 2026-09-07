import test from 'node:test';
import assert from 'node:assert/strict';
import {
  binaryOrderReady,
  canTransitionBinary,
  canTransitionSpot,
  normalizeBinaryPositionState,
  normalizeSpotOrderState,
  spotOrderReady,
} from './trading-states.ts';

test('spot lifecycle permits only governed transitions', () => {
  assert.equal(canTransitionSpot('DRAFT', 'SUBMITTING'), true);
  assert.equal(canTransitionSpot('OPEN', 'CANCEL_PENDING'), true);
  assert.equal(canTransitionSpot('FILLED', 'OPEN'), false);
  assert.equal(normalizeSpotOrderState('CANCELED'), 'CANCELLED');
  assert.equal(normalizeSpotOrderState('unknown'), 'FAILED');
});

test('binary lifecycle exposes governed result and recovery states', () => {
  assert.equal(canTransitionBinary('CONFIRMATION', 'SUBMITTING'), true);
  assert.equal(canTransitionBinary('OPEN', 'SETTLING'), true);
  assert.equal(canTransitionBinary('SETTLING', 'SETTLEMENT_DELAYED'), true);
  assert.equal(canTransitionBinary('SETTLEMENT_DELAYED', 'WIN'), true);
  assert.equal(canTransitionBinary('LOSS', 'HISTORY'), true);
  assert.equal(canTransitionBinary('LOSS', 'OPEN'), false);
  assert.equal(normalizeBinaryPositionState('price_stale'), 'PRICE_STALE');
  assert.equal(normalizeBinaryPositionState('refund'), 'ERROR');
  assert.equal(normalizeBinaryPositionState('failed'), 'ERROR');
});

test('spot orders stay disabled without supported backend inputs', () => {
  assert.equal(spotOrderReady({ authenticated: true, backendConfigured: true, amount: 1, orderType: 'LIMIT', price: 20 }), true);
  assert.equal(spotOrderReady({ authenticated: true, backendConfigured: true, amount: 1, orderType: 'MARKET' }), false);
  assert.equal(spotOrderReady({ authenticated: false, backendConfigured: true, amount: 1, orderType: 'LIMIT', price: 20 }), false);
});

test('binary orders require authoritative price, payout, duration and configured stake range', () => {
  assert.equal(binaryOrderReady({ authenticated: true, backendConfigured: true, amount: 10, currentPrice: 20, durationEnabled: true, payoutRate: 0.8, minimumAmount: 5, maximumAmount: 20 }), true);
  assert.equal(binaryOrderReady({ authenticated: true, backendConfigured: true, amount: 10, currentPrice: null, durationEnabled: true, payoutRate: 0.8 }), false);
  assert.equal(binaryOrderReady({ authenticated: false, backendConfigured: true, amount: 10, currentPrice: 20, durationEnabled: true, payoutRate: 0.8 }), false);
  assert.equal(binaryOrderReady({ authenticated: true, backendConfigured: true, amount: 4, currentPrice: 20, durationEnabled: true, payoutRate: 0.8, minimumAmount: 5 }), false);
  assert.equal(binaryOrderReady({ authenticated: true, backendConfigured: true, amount: 21, currentPrice: 20, durationEnabled: true, payoutRate: 0.8, maximumAmount: 20 }), false);
});
