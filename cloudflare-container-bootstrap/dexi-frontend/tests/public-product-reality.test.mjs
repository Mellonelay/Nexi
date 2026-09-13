import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('realtime subscriptions own their cleanup handlers', () => {
  const notifications = read('app/components/NotificationsPanel.tsx');
  const market = read('app/hooks/useRealtimeMarket.ts');

  assert.match(notifications, /socket\.off\(["']connect["'], handleConnect\)/);
  assert.match(market, /socket\??\.off\("connect", handleConnect\)/);
  assert.match(read('app/dashboard/binary/page.tsx'), /submissionLock\.current/);
  assert.match(read('app/dashboard/spot/page.tsx'), /orderSubmissionLock\.current/);
  assert.match(read('app/dashboard/spot/page.tsx'), /marginSubmissionLock\.current = false/);
  assert.match(read('app/dashboard/support/page.tsx'), /submissionLock\.current/);
});

test('mobile controls expose names to assistive technology', () => {
  const drawer = read('app/components/NavigationDrawer.tsx');
  const timeframe = read('app/components/TimeframeSelector.tsx');
  const asset = read('app/dashboard/asset/[symbol]/page.tsx');
  const support = read('app/dashboard/support/page.tsx');

  assert.match(drawer, /aria-labelledby="nexi-application-drawer-title"/);
  assert.match(timeframe, /aria-label="Open timeframe menu"/);
  assert.match(support, /aria-label="Ticket subject"/);
  assert.match(support, /aria-label="Ticket message"/);
  assert.doesNotMatch(asset, /router\.replace\(/);
});


test('canonical market identity has all 53 local asset marks', () => {
  const assetDir = new URL('../public/assets/market/', import.meta.url);
  const icons = readdirSync(assetDir).filter((name) => name.endsWith('.svg')).sort();
  assert.equal(icons.length, 53);
  assert.match(read('app/lib/asset-registry.ts'), /ASSET_REGISTRY_COUNT = ASSET_REGISTRY\.length/);
  assert.match(read('app/dashboard/components/QuotesHubVisuals.tsx'), /assetIconPath\(/);
  assert.match(read('app/dashboard/asset/[symbol]/page.tsx'), /assetIconPath\(/);
});

test('product interaction feedback is progressive and accessibility-aware', () => {
  const runtime = read('app/components/RootClientRuntime.tsx');
  const haptics = read('app/lib/haptics.ts');
  const globals = read('app/globals.css');

  assert.match(runtime, /document\.addEventListener\('click', onClick\)/);
  assert.match(haptics, /navigator\.vibrate/);
  assert.match(haptics, /prefers-reduced-motion: reduce/);
  assert.match(globals, /prefers-reduced-transparency: reduce/);
});

test('public product copy does not expose raw market-state enums', () => {
  const primitives = read('app/dashboard/wallet/components/ProductPrimitives.tsx');
  const account = read('app/components/AccountIdentityHeader.tsx');
  const quotes = read('app/dashboard/page.tsx');

  assert.match(primitives, /productStateLabel\(state\)/);
  assert.match(account, /productStateLabel\(state\)/);
  assert.match(quotes, /item\.source === ["']fallback["']\) return ["']—["']/);
});
