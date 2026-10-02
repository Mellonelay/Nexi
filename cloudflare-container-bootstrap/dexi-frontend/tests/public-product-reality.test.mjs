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
  assert.match(drawer, /NEXI, \$\{t\("openApplicationMenu"\)\}/);
  assert.match(read('app/components/AppHeader.tsx'), /max-\[359px\]:\[&>span>span:last-child\]:hidden/);
  assert.match(timeframe, /aria-label="Chart timeframe"/);
  assert.match(timeframe, /aria-pressed=\{interval === tf\}/);
  assert.match(support, /aria-label="Ticket subject"/);
  assert.match(support, /aria-label="Ticket message"/);
  assert.doesNotMatch(asset, /router\.replace\(/);
});


test('canonical market identity has all 53 local asset marks', () => {
  const assetDir = new URL('../public/assets/market/', import.meta.url);
  const icons = readdirSync(assetDir).filter((name) => name.endsWith('.svg')).sort();
  assert.equal(icons.length, 53);
  assert.match(read('app/lib/asset-registry.ts'), /ASSET_REGISTRY_COUNT = ASSET_REGISTRY\.length/);
  assert.match(read('app/dashboard/components/QuotesHubVisuals.tsx'), /<AssetIcon/);
  assert.match(read('app/dashboard/asset/[symbol]/page.tsx'), /<AssetIcon/);
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


test('public geometry keeps touch targets stable and critical labels reflow under text enlargement', () => {
  const header = read('app/components/AppHeader.tsx');
  const variants = read('app/components/nexi-variants.ts');
  const selector = read('app/components/SymbolSelector.tsx');
  const asset = read('app/dashboard/asset/[symbol]/page.tsx');
  const binary = read('app/dashboard/binary/page.tsx');
  const wallet = read('app/dashboard/wallet/page.tsx');

  assert.match(header, /h-\[44px\] w-\[44px\]/);
  assert.match(variants, /compact:\s*'min-h-\[44px\]/);
  assert.match(wallet, /View activity[\s\S]*min-h-\[44px\]/);
  assert.match(wallet, /Asset filter[\s\S]*min-h-\[44px\]/);
  assert.match(selector, /span className="min-w-0 whitespace-normal break-words text-left leading-tight"/);
  assert.match(asset, /h1 className="break-words text-2xl/);
  assert.match(binary, /h1 id="binary-heading" className="mt-1 break-words leading-tight text-2xl/);
  assert.match(asset, /grid-cols-\[repeat\(auto-fit,minmax\(min\(100%,7rem\),1fr\)\)\]/);
});
