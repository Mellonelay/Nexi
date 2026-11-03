import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../app/dashboard/spot/page.tsx', import.meta.url), 'utf8');

test('reference depth seeds websocket sequence from the REST snapshot and trades share provider IDs', () => {
  assert.ok(page.includes('snapshotUpdateId = String(payload.lastUpdateId'));
  assert.ok(page.includes('lastUpdateId = BigInt(snapshotUpdateId)'));
  assert.ok(page.includes('normalizePair(String(item.symbol'));
  assert.ok(page.includes('String(item.tradeId)'));
});

test('REST trade snapshots merge with concurrent websocket updates without clearing them on an empty snapshot', () => {
  const start = page.indexOf('const refreshTrades = () => {');
  const end = page.indexOf('const refreshBook = () => {', start);
  const refresh = page.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(refresh, /if \(cancelled \|\| request !== tradeRequestSequence\) return;/);
  assert.doesNotMatch(refresh, /if \(cancelled \|\| revision !== tradeRevision \|\| request !== tradeRequestSequence\) return;/);
  assert.match(refresh, /setTrades\(\(current\) => \[\.\.\.current, \.\.\.ordered\]/);
  assert.match(refresh, /if \(revision === tradeRevision\) \{ setTrades\(\[\]\); setTradeStatus\('UNAVAILABLE'\); \}/);
});

test('spot order adapter matches the authoritative PlaceOrderDto boundary', () => {
  const start = page.indexOf("api.post('/spot/order'");
  const end = page.indexOf('});', start);
  const orderCall = page.slice(start, end + 3);

  assert.ok(start >= 0 && end > start);
  assert.match(orderCall, /type: orderType,[\s\S]*amount: amount\.trim\(\),[\s\S]*price: price\.trim\(\),[\s\S]*idempotencyKey:/);
  assert.doesNotMatch(orderCall, /userId,/);
  assert.doesNotMatch(orderCall, /amount: Number\(amount\)/);
});
