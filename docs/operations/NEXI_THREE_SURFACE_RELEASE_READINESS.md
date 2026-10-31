## CURRENT 2026-10-27 — independent post-release closure reconciliation

Release and deployed source IDs are unchanged (Backend `20ba4da6cc34fd8f355324bbf2ab401db2665ef0`; Public/Admin `943ebda18d9060fd817074a1bbb2ce4fe7d26a59`). Sentry directly returns their exact commits **and** production deploys; prior unchecked 'Public/Admin commit association unresolved' rows below are **SUPERSEDED**, not current tasks. Independent trace audit resolved all 1,131 references in 45 deployed Public NFT manifests, including 29 unique external shared-store targets (no missing traced file on this VPS). Backend native bcrypt/SQLite smoke passed; eight install-script-capable lockfile entries alone do not prove missing native builds. Optional MetaMask peer remains a warning, not a demonstrated error. Three `Cannot POST /` logs were external probing (same origin, neighboring `/.env.qa` attempt), not an application endpoint defect. Public and API public HTTPS both now return 200. Sentry debug IDs appear in deployed Public/Admin bundles; remote artifact-bundle verification and event-level symbolication remain unverified. Error `client_discard/network_error` aggregates (195 dropped, 14 accepted over 24h) have unknown sender/surface attribution; do not mutate Sentry config without that causal evidence. No app-source change, reinstall, build or redeploy was necessary or performed. Full evidence: `tasks/evidence/nexi-post-release-reconciliation-20261027.md`. Next stage: **existing Chrome DevTools deployed-release browser acceptance only**, reuse prior accepted proofs and four `OWNER_ACCEPTED_UNTESTED` gates; rollback remains owner-deferred.


# CURRENT 2026-10-31 — deployed product acceptance checkpoint

The current deployed release remains `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` across Backend, Public, and Admin; Public build ID is `uljjzCtkvCSVGUPLSIB3x`. This continuation began from documentation commit `311fa1c76c30df902d38ccfadcbe2cd1dd00a242`; app-source baseline is `0f81273e23f5d104fcd987b6ac5e015d82f8290b`. The earlier live health check found all services active with zero restarts, `/readyz` 200, and root headroom 1.9 GiB (97% used).

Authenticated Chrome DevTools evidence verifies selected current-release Public SIWE, market-price/support-thread reads and Admin auth/market-feed reads, with selected Public mobile and Admin workspace/Trading UI. Admin `/support` direct reload returned HTTP 200 and showed the retired-ticket state; an existing synthetic acceptance thread remains visible in Messages and untouched. This does not establish full cross-surface feature acceptance, complete UI parity, lower-role RBAC denial, message push/reconnect, or owner acceptance. No build, deployment, restart, financial operation, or Sentry mutation was performed. Full boundaries are in [the product acceptance receipt](../../tasks/evidence/nexi-final-product-acceptance-20261031.md). Sentry alert delivery and event-level source-map proof remain separately unknown per [Sentry evidence](../../tasks/evidence/nexi-sentry-detection-20261031.md).

# NEXI three-surface Sentry and release execution

**Current status (2026-10-27): coordinated release built, deployed, and locally health-checked.** The previous 2026-10-26 23:29 pause was superseded by the owner's instruction to proceed; no rollback archives were inspected, compared, created, or deleted. `ROLLBACK_PREPARATION = OWNER_DEFERRED` remains a recovery limitation, not a passed check.

| Surface | Source / Sentry release | Artifact identity | Runtime result |
|---|---|---|---|
| Backend | `20ba4da6cc34fd8f355324bbf2ab401db2665ef0` | `/srv/nexi/backend/RELEASE_SHA` | `/ops/live` and `/readyz` HTTP 200; SQLite and Redis ready; service active, 0 restarts |
| Public | `943ebda18d9060fd817074a1bbb2ce4fe7d26a59` | `.next/BUILD_ID` + `RELEASE_SHA` | local `/dashboard` HTTP 200; active, 0 restarts |
| Admin | `943ebda18d9060fd817074a1bbb2ce4fe7d26a59` | `RELEASE_SHA`; SHA embedded in built assets | local `/overview` HTTP 200; active, 0 restarts |

Both Sentry releases were finalized and deployed to `production`. Admin's build log confirms 124 source files uploaded in artifact bundle `0cc61521-aa24-5edc-a835-81471125ec31`. Public's Next integration ran with the full build-time release/environment values and its configured hide/delete-after-upload settings; the remote artifact bundle was not independently enumerable, so upload remains not independently read-verified. Backend has 193 generated maps and Node `--enable-source-maps`; symbolication has not been verified with an event. Sentry returned no matching production errors or warning/error logs in the last 24 hours.

Public emitted two warnings: optional MetaMask async-storage peer resolution and 27 standalone trace paths outside its configured tracing root. The external `nexitrading.app` hostname did not resolve from the VM during verification; direct local service routes passed. Browser acceptance was not run. Full receipt: [release evidence](../../tasks/evidence/nexi-release-candidate-preflight-20261027.md#2026-10-27-coordinated-build-deploy-and-reconciliation).

## Release contracts

- Backend NestJS uses `backend/src/instrument.ts`: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`. Set `SENTRY_RELEASE` to the exact immutable SHA of the built backend artifact in its environment before controlled backend rollout.
- Public Next.js uses `frontend/sentry.server.config.ts`, `frontend/sentry.edge.config.ts`, `frontend/instrumentation-client.ts`, and `frontend/next.config.js`. Align `SENTRY_RELEASE` with `NEXT_PUBLIC_SENTRY_RELEASE` for the **same Public build**, and ensure `SENTRY_ENVIRONMENT` aligns with `NEXT_PUBLIC_SENTRY_ENVIRONMENT`. Build IDs, `NEXI_BUILD_ID` and source maps must refer to that artifact.
- Admin uses `Admin/src/sentry.ts` and `Admin/vite.config.ts`: `VITE_SENTRY_RELEASE` and `VITE_SENTRY_ENVIRONMENT` are **build-time** Vite values; `NEXI_RELEASE_SHA` is recorded by deployment tooling. Align them with the built Admin SHA before publishing the build. Never silently substitute backend release for another surface's earlier artifact.
- Sentry is an observation and release-correlation surface, not proof that a domain is financially correct. Ignore old-release grouped issues when evaluating a new release unless their events match the current deployed SHA.

## Last observed deployed config (historical, not target)

At campaign inspection on 2026-10-20: backend environment carried `bae05aad3dcbae762427199f08a3ab7c9e01d9f5`; Admin environment carried `7fbde5ca82287902cb351546ccae1b632f1aae44`; Public environment file access was restricted. These identities are historical and superseded by the current release table above.

## 2026-10-29 — executed owner-authorized release

The owner explicitly authorized the coordinated Backend → Public → Admin production release and overrode the normal capacity/rollback-readiness gates for this release. Candidate and deployed source/artifact identity: `7e434daab146fe9c297c04e46ba9d4a0ee81401d`. The applications built once at their canonical outputs; Backend's shared store was synchronized to Prisma 7.10.1 and Admin's to Zod 4.6.7. Services are active with zero restarts, Backend SQLite/Redis readiness is true, and `/ops/live`, `/readyz`, Public `/dashboard`, and Admin `/overview` return HTTPS 200. Root storage reached 100% reported use during the build. `ROLLBACK_PREPARATION` remains `OWNER_DEFERRED`; no rollback artifact was changed. See `tasks/evidence/nexi-three-surface-release-20261029.md` for exact proof and limits. Future releases continue to use the normal capacity and rollback checks unless the owner explicitly overrides them again.

## Coordinated release workflow under the current owner directive

1. Commit and freeze the coherent Git source identity; resolve source and dependency blockers. Record the owner-deferred rollback limitation; do not create archives under this campaign. Never run three large builds simultaneously on the 8 GiB VPS.
2. Backend: build once, inject backend release identity, deploy serialized, confirm service/readiness, release SHA and fresh release-scoped Sentry events. Confirm old Public/Admin remain API-compatible while backend updates.
3. Public: inject matching server/client Sentry release and build identity; build/deploy once, confirm public route/API, Sentry release and no current-release regression.
4. Admin: inject Vite build-time Sentry release; build/deploy once, confirm Admin login/API, Sentry release and no current-release regression.
5. Preserve old deployed releases and rollback. Report strongest proven state separately: SOURCE_VALIDATED / BUILT / DEPLOYED / RUNTIME_VERIFIED / OWNER_ACCEPTED.

No SQLite migration, financial tests, or queue execution is part of this release procedure. Deployment is in scope under the current owner directive after the technical preflight is satisfied.
## CURRENT 2026-10-29 — post-release documentation/storage follow-up

This note supersedes the older “browser acceptance next” stage for the current documentation/storage follow-up. The earlier release-time `2.1 GiB` measurement below is historical; the latest recorded measurement is `2,409,308 KiB` (`2.30 GiB`).

The coordinated release remains the exact SHA recorded below. This follow-up does not repeat or alter release verification. Its authorized scope is documentation reconciliation and safe disk cleanup only; no browser acceptance, build, deployment, restart, migration, test campaign, or financial operation was performed. Root free space is currently 2.30 GiB after removal of stale temporary caches, below the separately requested 5 GiB target. The owner-deferred rollback status remains open. Cleanup paths and preserved data are recorded in `../../tasks/evidence/nexi-doc-reconciliation-storage-cleanup-20261029.md`.
# 2026-10-31 Sentry readiness addendum

The deployed release `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` and production deployment `175136980` are associated in Sentry. Production spans were observed. The exact-release production error search covered 24 hours and returned none. Alert workflow `6146426` and monitor `10813107` are enabled and linked. Notification delivery and three-surface source-map symbolication remain unverified; this addendum does not change browser, owner, or application release acceptance. Details: `tasks/evidence/nexi-sentry-detection-20261031.md`.
## CURRENT 2026-10-31 — Admin-only product shell release

| Surface | Source / deployed release | Artifact evidence | Runtime result |
| --- | --- | --- | --- |
| Backend | `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` | `/srv/nexi/backend/RELEASE_SHA` | Unchanged by Stage B; final HTTPS `/readyz` returned 200; service active, 0 restarts. |
| Public | `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` | `/srv/nexi/public/current/RELEASE_SHA`; build ID `uljjzCtkvCSVGUPLSIB3x` | Unchanged by Stage B; final HTTPS `/dashboard` returned 200; service active, 0 restarts; no rebuild or restart. |
| Admin | `737355124993705935f9aa56f743a9f1f61a2bf4` | `/srv/nexi/admin/current/RELEASE_SHA` and `NEXI_RELEASE_SHA`; 62 public JS assets contain the exact release SHA | `nexi-admin.service` active, `NRestarts=0`; local and HTTPS `/overview` returned 200. |

Sentry confirms Admin release commit `737355124993705935f9aa56f743a9f1f61a2bf4` and production deployment `175244175`. GitHub Admin, Fallow, Graphify and CodeQL checks passed; focused tests/typecheck/lint passed. This was an Admin-only build and promotion. User explicitly waived capacity and rollback prerequisites for this release; no rollback archive was created. Off-VPS restore and full cross-surface product acceptance remain separate open proof. See [the Stage B product acceptance receipt](../../tasks/evidence/nexi-final-product-acceptance-20261031.md).
