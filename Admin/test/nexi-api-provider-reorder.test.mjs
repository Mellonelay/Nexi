import assert from "node:assert/strict";
import test from "node:test";
import { reorderByIds } from "../src/admin/data/banner-order.ts";

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
