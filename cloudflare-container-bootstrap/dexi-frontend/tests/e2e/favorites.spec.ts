import { expect, test } from '@playwright/test';

test('market favorites load and update through authenticated preferences', async ({ page }) => {
  const tradingSettings: Record<string, unknown> = {
    chartStyle: 'candles',
    favoriteAssetSymbols: ['BTCUSDT'],
  };
  let submittedSettings: Record<string, unknown> | null = null;

  await page.route('**/auth/preferences', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tradingSettings }),
      });
      return;
    }

    if (route.request().method() === 'PATCH') {
      const payload = route.request().postDataJSON() as { tradingSettings?: Record<string, unknown> };
      submittedSettings = payload.tradingSettings ?? null;
      Object.assign(tradingSettings, payload.tradingSettings);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tradingSettings }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: 'Favorites' }).click();
  await expect(page.getByText('BTC/USDT')).toBeVisible();

  await page.getByRole('button', { name: 'Remove pair from favorites' }).click();
  await expect(page.getByText('No saved favorites yet. Save a pair from its header or asset details.')).toBeVisible();

  expect(submittedSettings).toMatchObject({
    chartStyle: 'candles',
    favoriteAssetSymbols: [],
  });
});
