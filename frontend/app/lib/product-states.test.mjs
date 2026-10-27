import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTHORITATIVE_STATES,
  EARN_STATES,
  EXTERNAL_WALLET_STATES,
  LOAN_STATES,
  MESSAGE_DELIVERY_STATES,
  MESSAGE_THREAD_STATES,
  WALLET_DOMAINS,
  actionCanSubmit,
  normalizeExternalWalletState,
  normalizeLoanState,
  normalizeMessageDeliveryState,
  normalizeMessageThreadState,
  normalizeProductState,
  resolveEndpointTemplate,
  authoritativeValue,
} from './product-states.ts';

test('keeps backend-owned values absent instead of inventing a number', () => {
  assert.equal(authoritativeValue(null), '—');
  assert.equal(authoritativeValue(undefined), '—');
  assert.equal(authoritativeValue(''), '—');
  assert.equal(authoritativeValue('42.10'), '42.10');
  assert.equal(authoritativeValue(42.1), '42.1');
  assert.equal(authoritativeValue(Number.NaN), '—');
});

test('normalizes unknown server states to an explicit unavailable state', () => {
  assert.equal(normalizeProductState('ACTIVE', EARN_STATES), 'ACTIVE');
  assert.equal(normalizeProductState('not-a-state', EARN_STATES), 'UNAVAILABLE');
  assert.equal(normalizeProductState(null, AUTHORITATIVE_STATES), 'UNAVAILABLE');
});

test('loan lifecycle mirrors the authoritative Prisma enum', () => {
  assert.deepEqual(LOAN_STATES, ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAID', 'OVERDUE']);
  assert.equal(normalizeLoanState('active'), 'ACTIVE');
  assert.equal(normalizeLoanState('repaid'), 'UNAVAILABLE');
  assert.equal(normalizeLoanState(undefined), 'UNAVAILABLE');
});

test('message states keep delivery and thread semantics explicit', () => {
  assert.deepEqual(MESSAGE_DELIVERY_STATES, ['DRAFT', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED']);
  assert.deepEqual(MESSAGE_THREAD_STATES, ['UNREAD', 'READ', 'ARCHIVED']);
  assert.equal(normalizeMessageDeliveryState('delivered'), 'DELIVERED');
  assert.equal(normalizeMessageDeliveryState('unknown'), 'UNAVAILABLE');
  assert.equal(normalizeMessageThreadState('archived'), 'ARCHIVED');
  assert.equal(normalizeMessageThreadState(null), 'UNAVAILABLE');
});

test('external wallet state accepts only governed connection states', () => {
  assert.deepEqual(EXTERNAL_WALLET_STATES, [
    'DISCONNECTED',
    'CONNECTING',
    'CONNECTED',
    'WRONG_NETWORK',
    'UNSUPPORTED_NETWORK',
    'SIGNATURE_REQUIRED',
    'CONNECTION_ERROR',
  ]);
  assert.equal(normalizeExternalWalletState('wrong_network'), 'WRONG_NETWORK');
  assert.equal(normalizeExternalWalletState('unknown'), 'CONNECTION_ERROR');
});

test('wallet domains stay locked to the active product-owned sections', () => {
  assert.deepEqual(WALLET_DOMAINS, ['OVERVIEW', 'FUNDING', 'SPOT', 'MARGIN', 'BINARY', 'FINANCE']);
});

test('configured endpoint templates never invent missing routes', () => {
  assert.equal(resolveEndpointTemplate(undefined, { userId: 'user 1' }), null);
  assert.equal(resolveEndpointTemplate('/messages/{userId}', { userId: 'user 1' }), '/messages/user%201');
  assert.equal(resolveEndpointTemplate('/messages/{missing}', { userId: 'user 1' }), null);
});

test('mutation controls require authentication, valid input, and backend availability', () => {
  assert.equal(actionCanSubmit({ authenticated: true, valid: true, backendAvailable: true }), true);
  assert.equal(actionCanSubmit({ authenticated: true, valid: true, backendAvailable: false }), false);
  assert.equal(actionCanSubmit({ authenticated: false, valid: true, backendAvailable: true }), false);
  assert.equal(actionCanSubmit({ authenticated: true, valid: false, backendAvailable: true }), false);
});
