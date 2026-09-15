import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), 'utf8');
const market = read('app/hooks/useMarketData.ts');
const registry = read('app/lib/asset-registry.ts');
const icon = read('app/components/AssetIcon.tsx');

assert.doesNotMatch(market, /FALLBACK_MARKETS/);
assert.match(market, /setPrices\(marketCatalog\(\)\)/);
assert.match(read('app/lib/market-catalog.ts'), /price: null, change: null/);
assert.match(registry, /\/assets\/market\/\$\{asset\.iconKey\}\.svg/);
assert.match(icon, /onError=\{\(\) => setSourceAvailable\(false\)\}/);
console.log('Market authority and canonical icon source conformance: PASS');


test('market discovery is projected from the canonical 53-asset registry', () => {
  const catalog = read('app/lib/market-catalog.ts');
  const hook = read('app/hooks/useMarketData.ts');
  assert.match(catalog, /ASSET_REGISTRY\.map\(\(asset\) => liveByAsset\.get\(asset\.id\) \?\? pairFor\(asset\)\)/);
  assert.match(hook, /marketCatalog\(data/);
  assert.doesNotMatch(hook, /const crypto = \[/);
});
