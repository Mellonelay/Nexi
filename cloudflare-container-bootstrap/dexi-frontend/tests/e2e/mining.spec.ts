import { expect, test } from '@playwright/test';

test('keeps the subscription confirmation visible after refreshing mining data', async ({ page }) => {
  await page.addInitScript(() => {
    const provider = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return ['0x0000000000000000000000000000000000000001'];
        if (method === 'eth_chainId') return '0x1';
        if (method === 'personal_sign' || method === 'eth_sign') return `0x${'1'.repeat(130)}`;
        return null;
      },
      on: () => undefined,
      removeListener: () => undefined,
    };
    Object.defineProperty(window, 'ethereum', { configurable: true, value: provider });
  });

  await page.route('**/auth/wallet/challenge', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'NEXI test challenge', nonce: 'nonce-1', domain: 'localhost', uri: 'http://localhost', chainId: 1, issuedAt: new Date().toISOString(), expirationTime: new Date(Date.now() + 60_000).toISOString() }),
  }));
  await page.route('**/auth/wallet/verify', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ access_token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLTEifQ.sig', profile: { id: 'user-1', walletAddress: '0x0000000000000000000000000000000000000001' } }),
  }));
  await page.route('**/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 'user-1', walletAddress: '0x0000000000000000000000000000000000000001', kycStatus: 'NOT_SUBMITTED' }),
  }));
  await page.route('**/auth/preferences', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ tradingSettings: {} }),
  }));
  let subscriptionCount = 0;
  await page.route('**/mining/**', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'POST' && url.pathname.endsWith('/mining/subscribe')) {
      subscriptionCount += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'subscription-1', status: 'PENDING' }) });
      return;
    }
    const bodies: Record<string, unknown> = {
      '/mining/plans': [{ id: 'plan-1', name: 'NEXI plan', currency: 'USDT', lockupPeriod: 30, dailyYieldDecimal: '0.01', minDepositDecimal: '1', maxDepositDecimal: '100', isActive: true }],
      '/mining/my/user-1': [],
      '/mining/summary': { lockedPrincipal: '0', totalSubscriptions: 0 },
      '/mining/rewards/user-1': [],
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(bodies[url.pathname] ?? {}) });
  });

  await page.goto('/dashboard/mining', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /connect wallet/i }).first().click();
  await page.getByRole('button', { name: /metamask/i }).click();
  await page.getByRole('button', { name: 'Review product' }).click();
  await page.getByRole('textbox', { name: 'Subscription amount' }).fill('10');
  await page.getByRole('button', { name: 'Review subscription' }).click();
  await page.getByRole('button', { name: 'Confirm subscription' }).click();

  await expect(page.getByText('Request sent. Activation and reward values will appear after confirmation.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Request sent' })).toBeDisabled();
  expect(subscriptionCount).toBe(1);
});
