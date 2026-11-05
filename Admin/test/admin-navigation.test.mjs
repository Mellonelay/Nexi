import assert from "node:assert/strict";
import test from "node:test";

import { getVisibleNavGroups } from "../src/admin/config/navigation.ts";

test("visible workspaces keep the configured landing route when permitted", () => {
  const groups = getVisibleNavGroups(() => true);

  assert.equal(groups.length, 8);
  assert.deepEqual(
    groups.map(({ id, primary }) => [id, primary]),
    [
      ["overview", "/overview"],
      ["clients", "/users"],
      ["trading", "/binary"],
      ["wallet-finance", "/networks"],
      ["markets", "/assets"],
      ["products", "/mining"],
      ["communications", "/messages"],
      ["settings", "/frontend-control"],
    ],
  );
});

test("visible workspaces hide unauthorized groups and use an allowed landing route", () => {
  const denied = new Set(["users.view", "kyc.view", "sessions.view", "binary.view"]);
  const groups = getVisibleNavGroups((permission) => !denied.has(permission));
  const trading = groups.find(({ id }) => id === "trading");

  assert.equal(
    groups.some(({ id }) => id === "clients"),
    false,
  );
  assert.equal(trading.primary, "/settlements");
  assert.deepEqual(
    trading.items.map(({ to }) => to),
    ["/settlements", "/spot"],
  );
});

test("normal Admin navigation excludes development-only and redundant destinations", () => {
  const groups = getVisibleNavGroups(() => true);
  const visible = new Set(groups.flatMap(({ items }) => items.map(({ to }) => to)));
  for (const path of [
    "/exposure",
    "/localization",
    "/roles",
    "/approvals",
    "/audit",
    "/health",
    "/wallets",
    "/sessions",
    "/navigation",
    "/feature-flags",
  ]) {
    assert.equal(visible.has(path), false, `${path} must not appear in normal navigation`);
  }
  for (const path of [
    "/binary",
    "/users",
    "/networks",
    "/frontend-control",
    "/admins",
    "/maintenance",
  ]) {
    assert.equal(visible.has(path), true, `${path} must remain reachable in normal navigation`);
  }
});

test("public settings remains reachable with navigation-only or flags-only access", () => {
  for (const permission of ["navigation.view", "flags.view"]) {
    const groups = getVisibleNavGroups((candidate) => candidate === permission);
    const settings = groups.find(({ id }) => id === "settings");
    assert.ok(settings, "settings workspace should be visible");
    assert.equal(settings.primary, "/frontend-control");
    assert.deepEqual(
      settings.items.map(({ to }) => to),
      ["/frontend-control"],
    );
  }
  assert.equal(
    getVisibleNavGroups(() => false).some(({ id }) => id === "settings"),
    false,
  );
});
