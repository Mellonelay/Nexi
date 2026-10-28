import assert from "node:assert/strict";
import test from "node:test";
import { buildFeatureFlagUpdate } from "../src/admin/data/feature-flag-update.ts";

test("environment-only edit preserves enabled state in NestJS feature flag DTO", () => {
  assert.deepEqual(buildFeatureFlagUpdate({ key: "market.live", enabled: true }, { env: "SANDBOX" }, "Operator requested sandbox"), {
    key: "market.live", enabled: true, environment: "SANDBOX", reason: "Operator requested sandbox",
  });
  assert.deepEqual(buildFeatureFlagUpdate({ key: "market.live", enabled: false }, { enabled: true }, "Enable flag after review"), {
    key: "market.live", enabled: true, environment: undefined, reason: "Enable flag after review",
  });
});

test("unsupported rollout or targeting changes are rejected instead of silently ignored", () => {
  for (const patch of [{ rolloutPct: 50 }, { roleTargets: ["market_operator"] }, { userTargets: ["user-1"] }]) {
    assert.throws(() => buildFeatureFlagUpdate({ key: "market.live", enabled: true }, patch, "Operator requested targeting"), /not supported/i);
  }
});
