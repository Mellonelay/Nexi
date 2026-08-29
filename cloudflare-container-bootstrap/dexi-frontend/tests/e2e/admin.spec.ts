import { expect, test } from '@playwright/test';

test('keeps unauthenticated Admin entry on the separate sign-in surface', async ({ page }) => {
  await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole('heading', { name: 'Admin sign in' })).toBeVisible();
  await expect(page.getByText('Separate control plane')).toBeVisible();
});

test('renders authenticated Admin governance UI without exposing client financial authority', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'test-admin-token');
    localStorage.setItem('admin_user', JSON.stringify({ id: 'admin-1', email: 'admin@example.test', role: 'ADMIN' }));
  });
  await page.route('**/api/admin/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith('/governance/commands')
      ? [{ id: 'command-1', commandType: 'MAINTENANCE_MODE', status: 'PENDING_APPROVAL', reason: 'test reason' }]
      : path.endsWith('/feature-flags')
        ? []
        : path.endsWith('/system-config')
          ? { banner_text: '', maintenance_mode: 'false' }
          : path.endsWith('/stats')
            ? { users: 0, volume: 0 }
            : path.endsWith('/users')
              ? []
              : [];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.goto('/dashboard/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible();
  await page.getByRole('button', { name: 'Governance' }).click();
  await expect(page.getByText('Governed commands')).toBeVisible();
  await expect(page.getByText('Independent approval is required; Admin UI never mutates financial truth directly.')).toBeVisible();
});
