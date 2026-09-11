import { chromium } from '@playwright/test';

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

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const failures = [];
page.on('response', (response) => {
  if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
});
for (const route of routes) {
  await page.goto(`http://127.0.0.1:3100${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
}

console.log([...new Set(failures)].join('\n'));
await browser.close();
