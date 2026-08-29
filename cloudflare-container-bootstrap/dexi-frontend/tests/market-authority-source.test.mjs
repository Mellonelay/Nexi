import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), 'utf8');
const market = read('app/hooks/useMarketData.ts');
const registry = read('app/lib/asset-registry.ts');
const icon = read('app/components/AssetIcon.tsx');

assert.doesNotMatch(market, /FALLBACK_MARKETS/);
assert.match(market, /setMarketPairs\(\[\]\)/);
assert.match(market, /setMetal\(\[\]\)/);
assert.match(market, /setShares\(\[\]\)/);
assert.match(market, /setForex\(\[\]\)/);
assert.match(registry, /cdn\.simpleicons\.org/);
assert.match(icon, /onError=\{\(\) => setSourceAvailable\(false\)\}/);
console.log('Market authority and canonical icon source conformance: PASS');
