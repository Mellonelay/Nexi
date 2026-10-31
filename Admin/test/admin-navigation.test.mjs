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
      ["wallet-finance", "/wallets"],
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
    ["/settlements", "/spot", "/exposure"],
  );
});
