import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controller = await readFile(new URL('../src/market/market-public.controller.ts', import.meta.url), 'utf8');
const authority = await readFile(new URL('../src/market/market-authority.service.ts', import.meta.url), 'utf8');
const router = await readFile(new URL('../src/market/market-provider-router.service.ts', import.meta.url), 'utf8');

test('public market contracts expose canonical assets, provider state and real microstructure routes', () => {
  for (const route of ['assets', 'assets/:symbol', 'provider-state', 'depth', 'trades']) {
    assert.match(controller, new RegExp(`@Get\\('${route.replace('/', '\\/')}'\\)`));
  }
  assert.match(controller, /providers\.fetchDepth/);
  assert.match(controller, /providers\.fetchTrades/);
});

test('asset catalog is D1-backed and constrained to canonical symbols', () => {
  assert.match(authority, /marketPair\.findMany/);
  assert.match(authority, /symbol: \{ in: DEFAULT_MARKET_SYMBOLS \}/);
});

test('depth and trades require D1 provider capability and delegate to provider adapters', () => {
  assert.match(router, /supportsDepth/);
  assert.match(router, /supportsTrades/);
  assert.match(router, /symbols: \{ some: \{ enabled: true, pair: \{ symbol, status: 'ACTIVE' \} \} \}/);
  assert.match(router, /operation\.call\(adapter, symbol, limit\)/);
});
