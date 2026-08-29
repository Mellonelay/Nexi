import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../app/dashboard/spot/page.tsx', import.meta.url), 'utf8');

test('spot order adapter matches the authoritative PlaceOrderDto boundary', () => {
  assert.match(page, /api\.post\('\/spot\/order', \{[\s\S]*type: orderType,[\s\S]*amount: amount\.trim\(\),[\s\S]*price: price\.trim\(\),[\s\S]*idempotencyKey:/);
  assert.doesNotMatch(page, /api\.post\('\/spot\/order', \{[\s\S]*userId,/);
  assert.doesNotMatch(page, /api\.post\('\/spot\/order', \{[\s\S]*amount: Number\(amount\)/);
});
