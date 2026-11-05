import { expect, test } from "@playwright/test";

test("notification drawer is visible and clears the mobile dock", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

  const trigger = page.locator(
    'button[aria-controls="nexi-notifications-panel"]',
  );
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Notifications" });
  await expect(dialog).toBeVisible();
  for (const name of ["All", "Trading", "Wallet", "Account", "System"]) {
    await expect(dialog.getByRole("tab", { name })).toBeVisible();
  }
  const geometry = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const dock = document
      .querySelector(".nexi-bottom-nav")
      ?.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      dockTop: dock?.top ?? innerHeight,
    };
  });
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.dockTop + 1);
  await dialog.getByRole("button", { name: "Close notifications" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("header unread count follows authenticated notifications and marking read", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const provider = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts" || method === "eth_accounts")
          return ["0x0000000000000000000000000000000000000001"];
        if (method === "eth_chainId") return "0x1";
        if (method === "personal_sign" || method === "eth_sign")
          return `0x${"1".repeat(130)}`;
        return null;
      },
      on: () => undefined,
      removeListener: () => undefined,
    };
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: provider,
    });
  });
  await page.route("**/auth/wallet/challenge", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "NEXI test challenge",
        nonce: "nonce-1",
        domain: "localhost",
        uri: "http://localhost",
        chainId: 1,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 60_000).toISOString(),
      }),
    }),
  );
  await page.route("**/auth/wallet/verify", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyLTEifQ.sig",
        profile: {
          id: "user-1",
          walletAddress: "0x0000000000000000000000000000000000000001",
        },
      }),
    }),
  );
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        walletAddress: "0x0000000000000000000000000000000000000001",
        kycStatus: "NOT_SUBMITTED",
      }),
    }),
  );
  await page.route("**/auth/preferences", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tradingSettings: {} }),
    }),
  );

  let read = false;
  await page.route("**/communications/notifications**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/read") && route.request().method() === "POST")
      read = true;
    const body = path.endsWith("/unread-count")
      ? { count: read ? 0 : 1 }
      : path.endsWith("/read")
        ? { ok: true }
        : [
            {
              id: "n-1",
              type: "DEPOSIT_CREDITED",
              title: "Deposit credited",
              body: "Your deposit is available.",
              createdAt: "2026-01-01T00:00:00Z",
              readAt: read ? "2026-01-01T00:00:01Z" : null,
            },
          ];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("button", { name: /connect wallet/i })
    .first()
    .click();
  await page.getByRole("button", { name: /metamask/i }).click();
  const trigger = page.locator(
    'button[aria-controls="nexi-notifications-panel"]',
  );
  await expect(trigger).toHaveAccessibleName(/1 unread/i);
  await expect(trigger.locator('span[aria-hidden="true"]')).toHaveText("1");

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Notifications" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("tab", { name: "Wallet" }).click();
  await dialog
    .getByRole("button", { name: "Deposit credited (unread)" })
    .click();
  await expect(
    dialog.getByRole("button", { name: "Deposit credited (read)" }),
  ).toBeVisible();
  await expect(trigger).not.toHaveAccessibleName(/unread/i);
  await expect(trigger.locator('span[aria-hidden="true"]')).toHaveCount(0);
});
