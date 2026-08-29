import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFrontendTelemetryContext, sanitizeFrontendEvent } from './telemetry-privacy.ts';

test('normalizes routes and keeps only bounded telemetry fields', () => {
  assert.deepEqual(buildFrontendTelemetryContext({ route: '/dashboard/wallet/123?token=secret', operation: 'GET wallet', status: '200', outcome: 'success' }), {
    route: '/dashboard/wallet/:id', operation: 'GET wallet', status: '200', outcome: 'success',
  });
});

test('removes bearer, storage, financial, and body fields', () => {
  assert.deepEqual(sanitizeFrontendEvent({ route: '/dashboard', authorization: 'Bearer secret', localStorage: 'token', balance: '100', body: { amount: '1' }, state: 'LIVE' }), {
    route: '/dashboard', state: 'LIVE',
  });
});
