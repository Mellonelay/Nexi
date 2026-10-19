import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../app/dashboard/spot/page.tsx', import.meta.url), 'utf8');

test('spot order adapter matches the authoritative PlaceOrderDto boundary', () => {
  const start = page.indexOf("api.post('/spot/order'");
  const end = page.indexOf('});', start);
  const orderCall = page.slice(start, end + 3);

  assert.ok(start >= 0 && end > start);
  assert.match(orderCall, /type: orderType,[\s\S]*amount: amount\.trim\(\),[\s\S]*price: price\.trim\(\),[\s\S]*idempotencyKey:/);
  assert.doesNotMatch(orderCall, /userId,/);
  assert.doesNotMatch(orderCall, /amount: Number\(amount\)/);
});
