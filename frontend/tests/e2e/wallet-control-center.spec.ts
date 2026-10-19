import { expect, test } from '@playwright/test';

test.describe('Wallet control center boundary', () => {
  test('keeps the wallet route protected when no verified session exists', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard/wallet', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /wallet access|required/i })).toBeVisible();
    await expect(page.getByText('External Wallet', { exact: true })).toHaveCount(0);
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
  });

  test('preserves the protected mobile shell without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('/dashboard/wallet', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, width: window.innerWidth }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
  });
});
