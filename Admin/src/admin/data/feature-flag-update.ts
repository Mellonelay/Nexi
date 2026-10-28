import type { FeatureFlag } from "../types";

/** The NestJS UpdateFeatureFlagDto supports state and environment, not targeting. */
export function buildFeatureFlagUpdate(
  current: Pick<FeatureFlag, "key" | "enabled">,
  patch: Partial<Pick<FeatureFlag, "description" | "enabled" | "env" | "rolloutPct" | "roleTargets" | "userTargets">>,
  reason: string,
) {
  if (["description", "rolloutPct", "roleTargets", "userTargets"].some((field) => Object.hasOwn(patch, field))) {
    throw new Error("Feature flag rollout and targeting edits are not supported by the current NEXI API");
  }
  return {
    key: current.key,
    enabled: patch.enabled ?? current.enabled,
    environment: patch.env,
    reason,
  };
}
