import assert from "node:assert/strict";
import test from "node:test";
import { getIntentKey } from "../app/lib/intent-key.ts";

test("retries an unchanged financial intent with the same backend idempotency key", () => {
  let sequence = 0;
  const nextId = () => `id-${++sequence}`;
  const first = getIntentKey(null, JSON.stringify(["USDT","ERC20","0x123","5"]), "withdrawal", nextId);
  const retry = getIntentKey(first, JSON.stringify(["USDT","ERC20","0x123","5"]), "withdrawal", nextId);
  assert.equal(first.key, "withdrawal:id-1");
  assert.equal(retry.key, first.key);
  assert.equal(sequence, 1);
});

test("changed intent gets a new key, avoiding incompatible replay", () => {
  let sequence = 0;
  const nextId = () => `id-${++sequence}`;
  const first = getIntentKey(null, JSON.stringify(["USER",123456,"USDT","5"]), "transfer", nextId);
  const changed = getIntentKey(first, JSON.stringify(["USER",123456,"USDT","6"]), "transfer", nextId);
  assert.equal(changed.key, "transfer:id-2");
  assert.equal(sequence, 2);
});
