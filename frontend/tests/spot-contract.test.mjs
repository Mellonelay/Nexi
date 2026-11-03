import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../app/dashboard/spot/page.tsx', import.meta.url), 'utf8');

test('reference depth validates provider, symbol and REST snapshot sequence before applying updates', () => {
  assert.ok(page.includes("snapshotUpdateId = String(payload.lastUpdateId"));
  assert.ok(page.includes("lastUpdateId = BigInt(snapshotUpdateId)"));
  assert.match(page, /BigInt\(snapshotUpdateId\) < lastUpdateId\) \{ setBookStatus\('CONNECTION_LOST'\); return; \}/);
  assert.match(page, /normalizePair\(String\(payload\.pair \?\? payload\.symbol/);
  assert.match(page, /normalizePair\(String\(event\.providerInstrument/);
  assert.match(page, /updateId <= lastUpdateId/);
  assert.ok(page.includes("socket.on('market.reference.depth', handleDepth)"));
});

test('REST reference trades are bounded, symbol-isolated and merged without erasing newer socket rows', () => {
  const start = page.indexOf('const refreshTrades = () => {');
  const end = page.indexOf('const refreshBook = () => {', start);
  const refresh = page.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(refresh, /if \(cancelled \|\| request !== tradeRequestSequence\) return;/);
  assert.match(refresh, /normalizePair\(String\(\(row as Record<string, unknown>\)\.pair/);
  assert.match(refresh, /setTrades\(\(current\) => \[\.\.\.current, \.\.\.ordered\]/);
  assert.match(refresh, /if \(revision === tradeRevision\)/);
  assert.doesNotMatch(refresh, /setTrades\(\[\]\)/);
  assert.match(page, /seenTrades\.has\(trade\.id\)/);
  assert.match(page, /\.slice\(0, 50\)/);
  assert.match(page, /tradeRevision\+\+/);
});

test('recent trade rows expose quote price, base amount, local time, and Binance maker-side semantics', () => {
  assert.match(page, /Price \(\{quoteSymbol\}\)/);
  assert.match(page, /Amount \(\{baseSymbol\}\)/);
  assert.match(page, /LocalDateTime value=\{trade\.executedAt\} timeStyle="medium"/);
  assert.match(page, /Number\(item\.tradeTime\)/);
  assert.match(page, /item\.side === 'BUY' \|\| item\.maker === false/);
  assert.match(page, /item\.side === 'SELL' \|\| item\.maker === true/);
  assert.match(page, /'STALE' \| 'EMPTY' \| 'UNAVAILABLE' \| 'ERROR' \| 'CONNECTION_LOST'/);
  assert.match(page, /status === 'EMPTY'/);
  assert.doesNotMatch(page, /Quantity BTC|Bid · USDT|Ask · USDT/);
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
