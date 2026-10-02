import { expect, test } from '@playwright/test';

const routes = [
  '/dashboard',
  '/dashboard/spot',
  '/dashboard/binary',
  '/dashboard/wallet',
  '/dashboard/mining',
  '/dashboard/loans',
  '/dashboard/settings',
  '/dashboard/support',
  '/dashboard/announcement',
  '/dashboard/learn',
  '/dashboard/messages',
];

const viewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];

const allowedUnavailable = new Set([
  '/api/market/prices',
  '/api/binary/config',
]);

const primaryDestinations = [
  '/dashboard',
  '/dashboard/spot',
  '/dashboard/binary',
  '/dashboard/wallet',
  '/dashboard/mining',
  '/dashboard/loans',
  '/dashboard/support',
  '/dashboard/announcement',
  '/dashboard/learn',
  '/dashboard/messages',
  '/dashboard/settings',
];

const mobileDestinations = primaryDestinations.slice(0, 5);

for (const viewport of viewports) {
  test(`routes render without document overflow at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const pageErrors: string[] = [];
    const unexpectedResponses: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() < 400) return;
      const path = new URL(response.url()).pathname;
      if (!allowedUnavailable.has(path)) {
        unexpectedResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
      await page.waitForTimeout(250);
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `${route} overflows: ${overflow.scrollWidth}px > ${overflow.innerWidth}px`,
      ).toBeLessThanOrEqual(overflow.innerWidth + 1);

      if (['/dashboard', '/dashboard/spot', '/dashboard/binary'].includes(route)) {
        await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => undefined)));
        });
        const name = route === '/dashboard' ? 'dashboard' : route.split('/').pop();
        await page.screenshot({
          path: `test-results/${name}-${viewport.name}.png`,
          fullPage: true,
        });
      }
    }

    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
    expect(unexpectedResponses, unexpectedResponses.join('\n')).toEqual([]);
  });
}


test('header reflows without horizontal clipping at 320px with 200% text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  const normalGeometry = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('header.nexi-app-header');
    const main = document.querySelector<HTMLElement>('main');
    if (!header || !main) throw new Error('Expected NEXI header and main');
    const headerRect = header.getBoundingClientRect();
    return {
      headerHeight: headerRect.height,
      mainClientWidth: main.clientWidth,
      mainScrollWidth: main.scrollWidth,
    };
  });
  expect(normalGeometry.headerHeight).toBeGreaterThanOrEqual(55);
  expect(normalGeometry.headerHeight).toBeLessThanOrEqual(57);
  expect(normalGeometry.mainScrollWidth).toBeLessThanOrEqual(normalGeometry.mainClientWidth + 1);

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  await page.waitForTimeout(150);

  const geometry = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('header.nexi-app-header');
    const main = document.querySelector<HTMLElement>('main');
    if (!header || !main) throw new Error('Expected NEXI header and main');

    const headerRect = header.getBoundingClientRect();
    const controls = Array.from(header.querySelectorAll<HTMLElement>('button, label'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      });

    return {
      mainClientWidth: main.clientWidth,
      mainScrollWidth: main.scrollWidth,
      headerLeft: headerRect.left,
      headerRight: headerRect.right,
      controls,
    };
  });

  expect(geometry.mainScrollWidth).toBeLessThanOrEqual(geometry.mainClientWidth + 1);
  for (const control of geometry.controls) {
    expect(control.left).toBeGreaterThanOrEqual(geometry.headerLeft - 1);
    expect(control.right).toBeLessThanOrEqual(geometry.headerRight + 1);
  }
});

test('public navigation preserves the approved destination contract', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  const sidebarLinks = page.locator('aside.nexi-sidebar nav a');
  await expect(sidebarLinks).toHaveCount(primaryDestinations.length);
  const sidebarHrefs = await sidebarLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(sidebarHrefs).toEqual(primaryDestinations);

  const mobileLinks = page.locator('.nexi-bottom-nav a');
  await expect(mobileLinks).toHaveCount(mobileDestinations.length);
  const mobileHrefs = await mobileLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  expect(mobileHrefs).toEqual(mobileDestinations);

  await expect(page.locator('a[href="/dashboard/admin"]')).toHaveCount(0);
});
