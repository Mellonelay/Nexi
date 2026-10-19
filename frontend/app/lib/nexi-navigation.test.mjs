import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeNexiRoute, previousSafeRoute } from './nexi-navigation.ts';

test('accepts only recognized in-app dashboard routes', () => {
  assert.equal(isSafeNexiRoute('/dashboard/spot?symbol=BTCUSDT'), true);
  assert.equal(isSafeNexiRoute('/dashboard/asset/BTCUSDT'), true);
  assert.equal(isSafeNexiRoute('/dashboard/admin'), false);
  assert.equal(isSafeNexiRoute('https://example.com/dashboard'), false);
});

test('returns a safe prior route and preserves its query state', () => {
  assert.deepEqual(
    previousSafeRoute(['/dashboard', '/dashboard/asset/BTCUSDT', '/dashboard/spot?symbol=BTCUSDT'], '/dashboard/spot?symbol=BTCUSDT', '/dashboard'),
    { target: '/dashboard/asset/BTCUSDT', history: ['/dashboard', '/dashboard/asset/BTCUSDT'] },
  );
});

test('uses the deterministic parent when prior history is absent or unsafe', () => {
  assert.deepEqual(previousSafeRoute(['/dashboard/admin'], '/dashboard/spot', '/dashboard'), { target: '/dashboard', history: ['/dashboard/spot'] });
  assert.deepEqual(previousSafeRoute(['/dashboard/asset/BTCUSDT'], '/dashboard/spot', '/dashboard'), { target: '/dashboard', history: ['/dashboard/spot'] });
});
