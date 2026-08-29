import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const sizes = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-target', width: 390, height: 1672 },
  { name: 'reference-941', width: 941, height: 1672 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
];

for (const size of sizes) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const response = await page.goto('http://127.0.0.1:3002/dashboard', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `test-results/dashboard-redesign-${size.name}.png`, fullPage: false });
  const metrics = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
  }));
  console.log(JSON.stringify({ size: size.name, status: response?.status(), pageErrors, metrics }));
  await context.close();
}

await browser.close();
