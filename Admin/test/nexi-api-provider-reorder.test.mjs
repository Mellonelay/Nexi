import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { reorderByIds } from "../src/admin/data/banner-order.ts";
import { ALL_ROUTES, findRoute, NAV_GROUPS } from "../src/admin/config/navigation.ts";
import { mapBinaryPositionStatus } from "../src/admin/types/index.ts";

test("reorders banners by a complete ID permutation and preserves each record", () => {
  const banners = [
    { id: "first", message: "First", active: true },
    { id: "second", message: "Second", active: false },
  ];
  const reordered = reorderByIds(banners, ["second", "first"]);
  assert.deepEqual(reordered, [banners[1], banners[0]]);
  assert.equal(reordered[0].active, false);
});

test("rejects duplicate, missing, and stale banner IDs", () => {
  const banners = [{ id: "first" }, { id: "second" }];
  assert.equal(reorderByIds(banners, ["first", "first"]), null);
  assert.equal(reorderByIds(banners, ["first"]), null);
  assert.equal(reorderByIds(banners, ["first", "missing"]), null);
});

test("Admin navigation presents eight workspaces and hides the guarded sandbox link", async () => {
  assert.deepEqual(
    NAV_GROUPS.map((group) => group.label),
    [
      "Overview",
      "Clients",
      "Trading",
      "Wallet & Finance",
      "Markets",
      "Products",
      "Communications",
      "Administration & Settings",
    ],
  );
  assert.equal(
    ALL_ROUTES.some((route) => route.to === "/sandbox"),
    false,
  );
  assert.equal(findRoute("/sandbox"), undefined);

  const sandbox = await readFile(new URL("../src/routes/sandbox.tsx", import.meta.url), "utf8");
  assert.match(sandbox, /createFileRoute\("\/sandbox"\)/);
  assert.match(sandbox, /RouteGuard permission="sandbox\.view"/);
  assert.doesNotMatch(sandbox, /title="Binary Trading Control"/);
});

test("settling Binary positions are not exposed as open research-control targets", () => {
  assert.equal(mapBinaryPositionStatus("active"), "open");
  assert.equal(mapBinaryPositionStatus("settling"), "settling");
  assert.equal(mapBinaryPositionStatus("settlement_delayed"), "settling");
  assert.equal(mapBinaryPositionStatus("win"), "won");
  assert.equal(mapBinaryPositionStatus("loss"), "lost");
  assert.equal(mapBinaryPositionStatus("unknown"), "error");
});

test("Trading Binary opens on positions and separates the two control contexts", async () => {
  const source = await readFile(new URL("../src/routes/binary.tsx", import.meta.url), "utf8");
  const clients = await readFile(new URL("../src/routes/users.tsx", import.meta.url), "utf8");
  assert.match(source, /view = "positions"/);
  assert.match(source, /validateSearch: binarySearchSchema/);
  assert.match(source, /data-testid="binary-position-inspector"/);
  assert.match(source, /if \(position\.status !== "open"\)/);
  assert.match(source, /if \(!position\.researchEligible\)/);
  assert.match(clients, /aria-label="Binary account default"/);
});
