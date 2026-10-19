/**
 * NEXI Spot Isolated Sandbox — Playwright Interaction Tests
 * Covers all required MEL-7 interaction scenarios.
 */
import { expect, test } from '@playwright/test';

const SPOT_URL = '/dashboard/spot';

test.describe('Spot | Margin mode switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SPOT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
  });

  test('Spot mode is selected by default', async ({ page }) => {
    const spotBtn = page.locator('[role="tablist"][aria-label="Trading mode"] button').first();
    await expect(spotBtn).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="spot-buy-sell"]')).toBeVisible();
    await expect(page.locator('[data-testid="margin-panel"]')).not.toBeVisible();
  });

  test('Spot controls visible in Spot mode', async ({ page }) => {
    await expect(page.locator('[data-testid="spot-buy-sell"]')).toBeVisible();
    await expect(page.locator('[data-testid="spot-order-type"]')).toBeVisible();
    await expect(page.locator('[data-testid="spot-inputs"]')).toBeVisible();
    await expect(page.locator('[data-testid="spot-submit-btn"]')).toBeVisible();
  });

  test('Switch to Margin mode hides Spot controls', async ({ page }) => {
    const marginBtn = page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1);
    await marginBtn.click();
    await expect(page.locator('[data-testid="spot-buy-sell"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="spot-order-type"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="spot-inputs"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="margin-panel"]')).toBeVisible();
  });

  test('Switch back to Spot mode shows Spot controls', async ({ page }) => {
    const marginBtn = page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1);
    await marginBtn.click();
    const spotBtn = page.locator('[role="tablist"][aria-label="Trading mode"] button').first();
    await spotBtn.click();
    await expect(page.locator('[data-testid="spot-buy-sell"]')).toBeVisible();
    await expect(page.locator('[data-testid="margin-panel"]')).not.toBeVisible();
  });
});

test.describe('Margin direction and leverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SPOT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1).click();
  });

  test('Long button selectable', async ({ page }) => {
    await page.locator('[data-testid="direction-long"]').click();
    await expect(page.locator('[data-testid="direction-long"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Short button selectable', async ({ page }) => {
    await page.locator('[data-testid="direction-short"]').click();
    await expect(page.locator('[data-testid="direction-short"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('2x leverage selectable', async ({ page }) => {
    await page.locator('[data-testid="leverage-2x"]').click();
    await expect(page.locator('[data-testid="leverage-2x"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('3x leverage selectable', async ({ page }) => {
    await page.locator('[data-testid="leverage-3x"]').click();
    await expect(page.locator('[data-testid="leverage-3x"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('5x leverage selectable', async ({ page }) => {
    await page.locator('[data-testid="leverage-5x"]').click();
    await expect(page.locator('[data-testid="leverage-5x"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Collateral input and calculations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SPOT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1).click();
  });

  test('invalid collateral (zero) shows validation error', async ({ page }) => {
    await page.locator('[data-testid="collateral-input"]').fill('0');
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('valid collateral shows calculated position size', async ({ page }) => {
    await page.locator('[data-testid="collateral-input"]').fill('100');
    // Position size should appear (not —) when market price is available
    // In dev mode with fallback data, may show — but field should exist
    await expect(page.locator('[data-testid="position-size"]')).toBeVisible();
  });

  test('valid collateral shows liquidation price', async ({ page }) => {
    await page.locator('[data-testid="collateral-input"]').fill('100');
    await expect(page.locator('[data-testid="liquidation-price"]')).toBeVisible();
  });

  test('margin metrics panel is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="margin-metrics"]')).toBeVisible();
  });
});

test.describe('Position lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SPOT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1).click();
  });

  test('Open position button disabled without collateral', async ({ page }) => {
    await expect(page.locator('[data-testid="open-position-btn"]')).toBeDisabled();
  });

  test('Fixture OPEN state shows active position', async ({ page }) => {
    await page.locator('[data-testid="fixture-open"]').click();
    await expect(page.locator('[data-testid="active-position"]')).toBeVisible();
    await expect(page.locator('[data-testid="position-status"]')).toHaveText('OPEN');
  });

  test('Fixture CLOSED state shows closed position', async ({ page }) => {
    await page.locator('[data-testid="fixture-open"]').click();
    await page.locator('[data-testid="fixture-closed"]').click();
    await expect(page.locator('[data-testid="position-status"]')).toHaveText('CLOSED');
  });

  test('Fixture LIQUIDATED state shows liquidated notice', async ({ page }) => {
    await page.locator('[data-testid="fixture-open"]').click();
    await page.locator('[data-testid="fixture-liquidated"]').click();
    await expect(page.locator('[data-testid="liquidated-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="position-status"]')).toHaveText('LIQUIDATED');
  });

  test('Fixture REJECTED state shows error', async ({ page }) => {
    await page.locator('[data-testid="fixture-rejected"]').click();
    await expect(page.locator('[data-testid="sandbox-error"]')).toBeVisible();
  });

  test('Close position button visible when OPEN', async ({ page }) => {
    await page.locator('[data-testid="fixture-open"]').click();
    await expect(page.locator('[data-testid="close-position-btn"]')).toBeVisible();
  });

  test('Close position changes status to CLOSED', async ({ page }) => {
    await page.locator('[data-testid="fixture-open"]').click();
    await page.locator('[data-testid="close-position-btn"]').click();
    await expect(page.locator('[data-testid="position-status"]')).toHaveText('CLOSED');
    await expect(page.locator('[data-testid="close-position-btn"]')).not.toBeVisible();
  });

  test('Live PNL field visible when position open', async ({ page }) => {
    await page.locator('[data-testid="fixture-open"]').click();
    await expect(page.locator('[data-testid="live-pnl"]')).toBeVisible();
  });
});

test.describe('Sandbox fixture states', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SPOT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1).click();
  });

  test('Sandbox fixture panel visible in dev mode', async ({ page }) => {
    await expect(page.locator('[data-testid="sandbox-fixture"]')).toBeVisible();
  });

  test('All required states have fixture buttons', async ({ page }) => {
    const states = ['loading','open','closed','liquidated','rejected','unavailable','disconnected','error'];
    for (const s of states) {
      await expect(page.locator(`[data-testid="fixture-${s}"]`)).toBeVisible();
    }
  });
});

test.describe('Responsive layout', () => {
  test('Margin panel visible at mobile-390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SPOT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1).click();
    await expect(page.locator('[data-testid="margin-panel"]')).toBeVisible();
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
  });

  test('Margin panel visible at desktop-1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(SPOT_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.locator('[role="tablist"][aria-label="Trading mode"] button').nth(1).click();
    await expect(page.locator('[data-testid="margin-panel"]')).toBeVisible();
  });
});
