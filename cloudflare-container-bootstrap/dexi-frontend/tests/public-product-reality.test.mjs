import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('realtime subscriptions own their cleanup handlers', () => {
  const notifications = read('app/components/NotificationsPanel.tsx');
  const market = read('app/hooks/useRealtimeMarket.ts');

  assert.match(notifications, /socket\.off\('connect', handleConnect\)/);
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
