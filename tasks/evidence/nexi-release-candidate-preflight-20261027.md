# NEXI release candidate and Sentry preflight — 2026-10-27

## Scope and evidence labels

This receipt records the parent-supplied Oct 26 runtime and Sentry preflight for the current release candidate. The assigned writer did not independently recheck runtime, Sentry, storage, tool, or browser state. Facts below are **PARENT-REPORTED** unless marked otherwise; **UNVERIFIED** identifies proof that was not established in the supplied evidence. This receipt documents preflight only; it does not itself grant or revoke release authorization.

- Parent-reported source identity: canonical checkout HEAD `01e81159787bdf48f3d5108b96ecf7a178915573`.
- Parent-reported Oct 26 live sample: all three service units active, zero restarts, Node `24.21`; API readiness and Public/Admin HTTPS routes returned HTTP 200. SQLite/Redis details were not recaptured in the most recent readiness curl.
- Parent-reported canonical artifacts: Backend `/srv/nexi/backend/dist/src/main.js`, Public `/srv/nexi/public/current/.next/BUILD_ID`, Admin `/srv/nexi/admin/current/server/index.mjs`.
- These observations are a bounded sample, not proof of continuous health or source-to-artifact identity.

## Capacity and dependency-store preflight

- **PARENT-OBSERVED:** At 2026-10-26 22:14 UTC, disk was 2.9 GiB free of 51 GiB and I/O PSI `full avg10` was 21.67%. Under these conditions no build is considered safe. At 22:16 UTC `/readyz` returned `READY` with SQLite and Redis true; this does not prove sustained health or Public/Admin routes at that time.
- **PARENT-REPORTED:** Backend, Public, and Admin dependency stores are canonical and separate.
- **PARENT-REPORTED blocker before a Public build:** Public package and lockfile resolve `@sentry/nextjs` `10.75.2`, while its shared store contains `10.73.0`. Align the canonical Public store under coordinated service handling before building.
- **PARENT-REPORTED:** Admin Sentry `10.73.0` and Vite plugin `5.4.0` agree across configured source, lockfile, and store.

## Sentry configuration and release identity

- **PARENT-REPORTED:** Backend source has `SENTRY_RELEASE`, `sourceMap: true`, and `source-map-support` configuration. Backend runtime source-map operation has not been demonstrated.
- **PARENT-REPORTED:** Public/Admin Sentry build plugins hide source maps and delete them after successful upload; automatic release creation/finalization is disabled. Exact source-map upload success is **UNVERIFIED**.
- **PARENT-REPORTED:** `sentry-cli 3.7.0` auth info reports token authentication and organization/project `mellonelay/nexi`; write scopes were not surfaced, so write permission is **UNVERIFIED**.
- Existing readable releases reported from the bounded lookup: `ace72accfe815abf5ba20df26ee57c76898d0cab` and `3bb57e02ea921531975124ce2c827382a9f1ec6b`. No release matching Backend artifact marker `e356a00885da9517fe8c32df12dde3e6a3e49688` or current HEAD was found in that lookup. This does not establish broader release absence.
- **PARENT-REPORTED identity mismatches:**
  - Backend: deployed `RELEASE_SHA=e356a00885da9517fe8c32df12dde3e6a3e49688`; runtime `SENTRY_RELEASE=ace72accfe815abf5ba20df26ee57c76898d0cab`.
  - Public: deployed `RELEASE_SHA=3bb57e02ea921531975124ce2c827382a9f1ec6b`; `.next/BUILD_ID` and runtime `SENTRY_RELEASE` / `NEXT_PUBLIC_SENTRY_RELEASE` are `ace72accfe815abf5ba20df26ee57c76898d0cab`.
  - Admin: deployed `NEXI_RELEASE_SHA=ace72accfe815abf5ba20df26ee57c76898d0cab`; runtime `VITE_SENTRY_RELEASE=3bb57e02ea921531975124ce2c827382a9f1ec6b`.
- The existing release `ace72accfe815abf5ba20df26ee57c76898d0cab` had 10 events in a last-24-hour query. It is shared by Backend and Public and the events were not attributed to an application; treat this only as a pre-release baseline.

## Proof limits and remaining gates

- **UNVERIFIED:** source-map upload, release lifecycle, post-deployment event, symbolication, and browser behavior.
- Chrome DevTools MCP `list_pages` timed out. This is not proof that browser access is unavailable and provides no browser acceptance evidence.
- VibeDoctor's scan is dated Oct 25 and stale for this preflight. Fallow `project_info` succeeded; CodeScene project configuration resolved; Graphify query output was noisy and capped. These observations do not establish release correctness or Sentry behavior.
- The owner directed one coordinated release after corrections are ready. This receipt does not certify release readiness. Rollback preparation remains owner-deferred as a recovery limitation, not a passed check; the owner will handle backup capacity and rollback preparation after engineering. Do not reopen the backup-location question.
- No financial campaign was rerun. Mining, Loan, Withdrawal, and Ledger remain `OWNER_ACCEPTED_UNTESTED`.

## Next actions

1. Stabilize capacity and I/O; under coordinated service handling, align the Public canonical dependency store with its package and lockfile.
2. Freeze the exact full source SHA and correct each app's build and runtime Sentry release identifiers to that app's exact artifact identity.
3. Establish Sentry write permission, then build sequentially through the canonical app paths when capacity and authorization allow.
4. Verify source-map upload and release lifecycle, then execute the owner-directed coordinated release once technical preflight and applicable runbook conditions are satisfied. Preserve the deferred rollback limitation in release reporting. Run focused health, Sentry event/symbolication, and browser checks against the deployed release.

These are release-preflight actions; this receipt does not make them blockers to unrelated source work. No build, install, deployment, Sentry mutation, browser test, cleanup, or Git integration was performed for this receipt.
