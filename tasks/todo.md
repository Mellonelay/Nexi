## CURRENT 2026-10-30 — SentinelX source-integration takeover checkpoint

- Confirmed VM/GitHub `main` source SHA `87fba4cf0d2bf9dbcbb56811223a4a90ae58ee03`, clean after reviewed four-file source commit; no build/deploy/restart/migration/financial or queue action.
- Preserved and integrated prior dirty Public `TradingChart.tsx`, `market-data.ts`, `market-data.test.mjs` Live/Error/Closed presentation mapping and Admin `spot.tsx` Margin error feedback. Extracted `marginConfigurationSaveMessage` to preserve failed-request feedback without new component complexity.
- Focused checks: Public `node --test frontend/app/lib/market-data.test.mjs` 4/4 PASS; Admin `node --test Admin/test/nexi-api-provider-reorder.test.mjs` 20/20 PASS; `git diff --check` PASS; CodeScene pre-commit safeguard `quality_gates=passed` (Admin stable). Prior 20 Public, 5 Backend gateway, 38 Backend contract tests reused only at their recorded revisions. No typecheck, broad suite, CI or production build run; `[skip ci]` on source commit means no CI pass claim.
- Historical four financial `OWNER_ACCEPTED_UNTESTED` gates unchanged. Public/Admin source-path corrections are integrated; broader cross-surface/source integration remains `NOT PROVEN`, realtime delivery and browser/deployed acceptance remain runtime-only unknowns. No source blocker in this bounded four-file batch; pre-build decision for the wider source campaign remains open. Source is NOT a new deployed artifact.

## CURRENT 2026-10-30 — principal-scoped session and realtime continuation

- [x] INTAKE — Continued the existing goal from clean `main`/`origin/main` at `222498a22c711c24ec7ca0145b828309ec6d0e5e`; preserved the already-dirty source batch (16 tracked paths, two new focused test files). Existing Coordinator claims were checked; the owner authorized these task-record updates after reread.
- [x] SOURCE_FIXED — Admin API requests refresh an expired session once and retry the same request; concurrent 401s share one refresh. Public private-data responses, delayed 401 retries, identity-keyed profile cache and settings/dashboard state are bound to the current principal. Communications gateway retries Redis subscription after initial outage with bounded backoff.
- [x] VERIFIED — Previously executed focused regression checks passed: Admin `node --test test/nexi-api-provider-reorder.test.mjs` (20/20); Backend `NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand test/communications/communications.gateway.spec.ts` (5/5); Public `node --test tests/public-session-refresh.test.mjs tests/principal-response-race.test.mjs tests/realtime-auth-contract.test.mjs` (20/20). These results are reused; no rerun is planned absent an invalidating change.
- [x] STATICALLY_VALIDATED — Fallow MCP changed-code check was invoked once after the source edits; degraded due to unavailable node_modules/policy packs. It reported no unresolved imports, cycles, or boundary violations; dynamic/interface methods and three direct `.mjs` tests were flagged as unused. No code was removed from these findings. Graphify evidence is reused from the prior indexed snapshot; changed runtime edges are checked directly in source.
- [x] REVIEWED — Exact 23-path staged diff and whitespace check are clean. CodeScene staged safeguard ran; it reported increased method/module complexity in the changed Admin auth provider, Public Spot/Loans/Mining/Notifications paths, and Communications gateway. The added guards/retry preserve principal isolation and recovery; no unrelated refactor was added. Keep this maintainability risk visible for a later bounded cleanup.
- [x] INTEGRATED — Committed and pushed the 23 reviewed paths to `main` as `d1bf7aba0b7939ad48a52b7685b091a4210f62a4` using `[skip ci]`; push workflows invoke production builds, so CI was not run. Graphify refreshed automatically from the commit hook (7,427 nodes / 19,564 edges); this is structural evidence only.
- [ ] TODO — Owner pre-build checkpoint remains open. No build, deployment, restart, migration, live financial/queue operation, CI, or browser acceptance.

Receipt: [source integration handoff](evidence/nexi-source-integration-handoff-20261030.md). Candidate starts at `222498a22c711c24ec7ca0145b828309ec6d0e5e`; current changes are local and not deployed.

## CURRENT 2026-10-30 — three-surface source integration continuation

- [x] INTAKE — Recovered `main`/`origin/main` at `3b5e2c2b88984c3010e60305af9acd157a5c345c`, current dirty paths and bounded active claims. The owner authorized this session's narrow task-record updates after reread.
- [x] SOURCE_FIXED — Preserve stable `{createdAt,id}` ordering in Admin Communications moderation/notifications and retain the known offset-shift limitation in `requestAllPages()` without redesigning pagination.
- [x] SOURCE_FIXED — Correct Admin exposure details to show `Unavailable` instead of `0%` when exposure is unknown; Admin API auth schemas now match login/refresh token behavior; four selected integer query schemas are represented as integers.
- [x] VERIFIED — Regenerated OpenAPI once after grouped metadata changes. One final static JSON check found zero schema-less 2xx responses, no generic `Object` query refs, expected Admin refresh token requirement, and integer types on `/admin/audit`, `/admin/incidents`, `/admin/maintenance-windows`, `/market/klines`. `git diff --check` passed. At the integrated checkpoint, the affected Communications Backend suite passed 22/22 and existing Admin provider suite passed 19/19; no broader suite/typecheck/lint was run.
- [x] PROVEN_REUSED — Reuse prior Public session-retry/idempotency source review, route/method inventory, focused Backend tests/typecheck for unchanged implementation, and accepted financial proofs only within their documented scopes.
- [ ] TODO — Source integration remains incomplete as a whole: any remaining source-backed consumer or async/realtime gaps need bounded source evidence. The one focused verification pass is complete; do not repeat tests/typecheck/lint without an invalidating source change.
- [x] VERIFIED — Reviewed and committed/pushed the 33-path source/evidence batch to GitHub `main` as `f2207b63e741f2c7a4af718af7ef88aa81b101a2`. Commit used `[skip ci]`; GitHub Actions API returned no runs for the SHA because the push workflows include application builds. No PR was needed for this canonical-main change.
- [ ] TODO — Owner pre-build checkpoint; no build, deploy, restart, migration, production write, live queue mutation, or browser acceptance.

Receipt: [source integration handoff](evidence/nexi-source-integration-handoff-20261030.md) and [OpenAPI response closure](evidence/nexi-openapi-response-closure-20261030.md). Current edits are local/uncommitted at starting SHA `3b5e2c2`.

## CURRENT 2026-10-30 — capability routing cleanup

- [x] Retire the stale scanner MCP/plugin from Codex configuration and cache.
- [x] Clarify Agent Skills, Ponytail, Vibe Coding, Short Circuit, Graphify, Fallow, CodeScene, doctor CLIs, AGNIX, and Sentry responsibilities in active routing docs.
- [x] Preserve historical scan receipts as dated evidence; no application test/build/deploy/browser work was run.
- [ ] Broader three-surface source integration remains open and continues under its existing task claim.

## CURRENT 2026-10-30 — OpenAPI response contract closure

- [x] SOURCE_FIXED — Document the 32 previously schema-less successful operations from current Backend return shapes; regenerate the OpenAPI artifact through the canonical generator.
- [x] VERIFIED — Static artifact count: zero 2xx operations lacking a schema. `git diff --check` passed. No tests/typecheck/lint/build were run; verification remains deliberately limited until source corrections are complete.
- [ ] TODO — After remaining source corrections, run only the authorized focused checks that are invalidated by changed code. Do not repeat unchanged historical financial/browser proof.
- [ ] TODO — Complete reviewed Git integration and update the final exact source SHA before any separately authorized build/deploy phase.

Receipt: [OpenAPI response closure](evidence/nexi-openapi-response-closure-20261030.md). Source changes are uncommitted and not deployed; no production/runtime/browser action occurred.

## CURRENT 2026-10-29 — documentation/storage follow-up

- [x] Reconcile the owner-corrected scope to documentation alignment and safe disk cleanup only. No additional browser acceptance, build, deployment, restart, tests, migrations, or financial operations were run.
- [x] Remove only stale generated temporary caches and plugin-source staging copies after checking their installed counterparts; the latest `df -Pk /` reading is 2,409,308 KiB (2.30 GiB), following earlier rounded readings of 2.1 and 2.4G. The requested 5 GiB threshold is **not met**. Details: `tasks/evidence/nexi-doc-reconciliation-storage-cleanup-20261029.md`.
- [ ] Further cleanup must identify an additional safely disposable target; runtime/financial data, canonical dependencies/tools, session history, logs, release/rollback evidence, and the active Chrome profile remain preserved.
- [ ] Browser acceptance remains open, but is outside this follow-up's authorized scope. Existing Public partial proof and the Admin sign-in requirement are retained without further browser interaction.

All later dated frontiers in this file are historical snapshots unless explicitly carried into this leading 2026-10-29 scope. Their unchecked items do not authorize work or reopen accepted proof.

## HISTORICAL CURRENT FRONTIER — 2026-10-29 post-release product acceptance

- [x] Deploy Backend, Public, and Admin release `7e434daab146fe9c297c04e46ba9d4a0ee81401d`; all services active, zero restarts, Node 24.21.0, HTTPS routes 200, Backend SQLite/Redis ready.
- [x] Confirm Sentry release commit association, finalization, production deploy, Admin artifact uploads, and Public/Admin debug-ID presence. Sentry issue query is blocked by HTTP 403; no claim of zero current errors.
- [x] Complete bounded cache/temp cleanup before browser work; free space is 2.1 GiB. Preserve active signed-in browser profile, canonical dependencies, release/rollback data and distinct CodeQL evidence.
- [ ] Continue scoped browser acceptance for changed/unproven journeys on release `7e434daab146fe9c297c04e46ba9d4a0ee81401d`. Public Dashboard/Margin UI is partially verified; market-data status remains inconsistent with HTTP 200 responses. Admin `/admin/me` returned 401 after reload; owner sign-in is required. Keep financial actions read-only.
- [ ] Obtain owner acceptance only from the owner; retain four financial gates as `OWNER_ACCEPTED_UNTESTED` and rollback preparation as `OWNER_DEFERRED`.

## HISTORICAL 2026-10-27 — independent post-release closure reconciliation

Release and deployed source IDs are unchanged (Backend `20ba4da6cc34fd8f355324bbf2ab401db2665ef0`; Public/Admin `943ebda18d9060fd817074a1bbb2ce4fe7d26a59`). Sentry directly returns their exact commits **and** production deploys; prior unchecked 'Public/Admin commit association unresolved' rows below are **SUPERSEDED**, not current tasks. Independent trace audit resolved all 1,131 references in 45 deployed Public NFT manifests, including 29 unique external shared-store targets (no missing traced file on this VPS). Backend native bcrypt/SQLite smoke passed; eight install-script-capable lockfile entries alone do not prove missing native builds. Optional MetaMask peer remains a warning, not a demonstrated error. Three `Cannot POST /` logs were external probing (same origin, neighboring `/.env.qa` attempt), not an application endpoint defect. Public and API public HTTPS both now return 200. Sentry debug IDs appear in deployed Public/Admin bundles; remote artifact-bundle verification and event-level symbolication remain unverified. Error `client_discard/network_error` aggregates (195 dropped, 14 accepted over 24h) have unknown sender/surface attribution; do not mutate Sentry config without that causal evidence. No app-source change, reinstall, build or redeploy was necessary or performed. Full evidence: `tasks/evidence/nexi-post-release-reconciliation-20261027.md`. Next stage: **existing Chrome DevTools deployed-release browser acceptance only**, reuse prior accepted proofs and four `OWNER_ACCEPTED_UNTESTED` gates; rollback remains owner-deferred.


## HISTORICAL CONTROLLER CORRECTION — 2026-10-27 STORAGE / DEPENDENCY

- [x] Directly verify the three independent shared dependency stores and source links; the Base Account/x402 optional connector failure was fixed in committed Public Webpack configuration, not by reinstalling application dependencies. Preserve the deployed source and accepted release proof. See root/Public `AGENTS.md` and current state.
- [x] Measure actual disk owners with gdu, not estimates. The live SQLite database is about 15 GiB; other major consumers are developer tooling/session/migration artifacts, OS files, and the 4 GiB swapfile. Remove only verified regenerable inactive Webpack/RDC/Playwright caches, the old unused Codex daemon binary, and npm download cache (approximately 2.9 GiB reclaimed overall); three services remain active, root now ~93% used with 3.9 GiB available.
- [ ] Do not open a new build/dependency campaign from optional MetaMask/tracing warnings. Proceed with the previously agreed post-deployment browser acceptance and bounded Sentry proof; separately address continuing disk growth or retention with an exact owner-approved target, never financial DB/history destruction by size alone.
- [x] Synchronize the controller's documentation correction using the already-authenticated VM owner GitHub CLI credential route, then confirm checkout `main` tracks `origin/main` clean after the final addendum.

## HISTORICAL 2026-10-27 — COORDINATED RELEASE COMPLETE

- [x] Backend, Public, and Admin were built and deployed to their canonical outputs; all three services are active with zero restarts. Focused local readiness/routes passed.
- [x] Public dependency-resolution build failure fixed with the bounded `@base-org/account` Webpack alias; final Public build carries full SHA `943ebda18d9060fd817074a1bbb2ce4fe7d26a59`. Admin and Backend identities and build outcomes are in the release evidence receipt.
- [x] Sentry releases finalized and deployed to production for Backend `20ba4da6cc34fd8f355324bbf2ab401db2665ef0` and Public/Admin `943ebda18d9060fd817074a1bbb2ce4fe7d26a59`. Admin source-map bundle upload was confirmed. Public remote bundle presence and Backend event-level symbolication remain unverified.
- [x] Committed and pushed the Public source correction and release documentation, including release-evidence follow-up `90b8d9abe4e8388e33ba166d732e4a5e9dce1356`. `HEAD = origin/main = 90b8d9abe4e8388e33ba166d732e4a5e9dce1356` at the last verification before this current-state amendment.
- [ ] Sentry commit association for Public/Admin release `943ebda18d9060fd817074a1bbb2ce4fe7d26a59` remains unresolved: after push, `set-commits --auto` selected docs HEAD `d0d5678`; Sentry release details still show no commits after an explicit source range attempt. This is release metadata, not artifact/runtime identity.
- [ ] Next session: run the owner-requested browser acceptance on the deployed artifacts. Preserve the accepted scope of existing proofs; financial gates remain `OWNER_ACCEPTED_UNTESTED`.
- `ROLLBACK_PREPARATION = OWNER_DEFERRED`; no rollback archive validation or storage cleanup was performed.
- Detailed handoff: `tasks/evidence/nexi-release-candidate-preflight-20261027.md`.

**Frontier rule:** This owner-directed summary controls current tracking. The Oct 26 checklist and all older rows below remain historical records; unchecked historical items are not reactivated unless explicitly promoted here.

- [x] Reconcile the owner-provided Oct 27 frontier into the current summary while preserving the original six-stage roadmap, dated chronology, and unrelated dirty files.
- [x] Record parent-verified source identity `HEAD = origin/main = 01e81159787bdf48f3d5108b96ecf7a178915573` and Oct 26 runtime/artifact observations with their scope; these were not independently rechecked in this documentation continuation.
- [x] Keep `ROLLBACK_PREPARATION = OWNER_DEFERRED` as an open recovery limitation, not a passed check. The owner directed one coordinated release after corrections are ready; current technical preflight still prevents execution. Backup capacity and rollback preparation remain owner-managed after engineering. Do not reopen the backup-location question.
- [ ] Resolve remaining release preflight: the Public shared Sentry store is corrected to manifest/lock 10.75.2; reconcile per-surface artifact/runtime Sentry release markers. No builds now; reported root capacity is 2.9 GiB free / 51 GiB and I/O PSI full avg10 about 21%.
- [ ] Verify Sentry upload/write capability and source-map lifecycle. Existing Public/Admin plugins hide source maps, delete maps after upload, and disable automatic release create/finalize; map upload and mutation scopes are not proven. `sentry-cli` authentication alone is insufficient.
- [ ] Use `tasks/evidence/nexi-release-candidate-preflight-20261027.md` as the current release/Sentry evidence receipt; do not repeat the bounded preflight unless a relevant fact changes.
- [ ] Reacquire browser evidence when DevTools is available; the prior call timed out and no browser proof is claimed.
- [ ] Preserve separate owner decisions for off-site backup destination/key custody, Sentry write scope, and synthetic Support conversation/attachment retention.
- [ ] Preserve financial evidence as 20 PASS / 0 FAIL / 4 BLOCKED; four gates remain `OWNER_ACCEPTED_UNTESTED`. Do not reopen unchanged accepted proofs.
- [ ] Complete the directed coordinated release after technical preflight: the Public canonical-store mismatch is corrected; reconcile per-surface artifact and Sentry identities, establish release/source-map write capability, and confirm safe canonical build capacity. Preserve the deferred rollback-preparation limitation in release reporting; do not describe it as passed or ask the owner to repeat its decision. Verify exact deployed/runtime identities after release.
- [x] Apply the bounded Backend source-map instrumentation correction in `backend/src/instrument.ts`; source remains unbuilt and undeployed. Node 24.21.0 documents the used API as experimental and recommends early startup `--enable-source-maps` for coverage of already-loaded modules. NestJS Doctor 0.9.10 changed-scope scan: 85/100, no findings; `$nestjs-code-audit` found no review candidates, but ESLint config is missing and whole-project TypeScript has unrelated existing test/config errors. React Doctor 0.9.18 found no issue in the four Sentry integration config files. Exact scope and Graphify refresh limitations are in the release-preflight receipt. No app tests/build/restart/deployment were run.
- [ ] Reconcile Backend Sentry startup flag into the coordinated runtime release configuration and prove source-map upload/symbolication only during the authorized release; do not claim this source edit alone establishes runtime mapping.
- [ ] Verify Sentry lifecycle operations before release mutations: the authenticated CLI reports `org:ci` and release listing succeeds; release creation/source-map upload, commit association, deploy recording, and `org:read` CLI behavior remain unverified. Use the existing `sentry-cli` credential first; 1Password CLI is only needed if a build tool requires an environment token.
- [ ] If a Public/Admin build plugin requires `SENTRY_AUTH_TOKEN` in its environment, configure the owner-provided 1Password Environment through the `op` CLI (v2.41.0) and supply its Environment ID; current `op` has no account configured. This is not a blocker to the authenticated `sentry-cli` path. Never use the 1Password MCP or print the token. See the release-preflight receipt.
- [x] Commit and push the Backend source-map instrumentation and its bounded preflight documentation as `5fa0784a95800e918f0fbfab20d373947d325e52`. CodeScene pre-commit safeguard passed for five modified files (one code-health-eligible file). Sentry lookup for this exact SHA returned no release; no build/deployment was performed.
- [x] Revalidate live API/service/runtime and deployed release identities at 2026-10-26 22:47 UTC. All services remain active with zero restarts on Node 24.21.0 and `/readyz` is healthy; exact current marker/environment mismatches and resource limits are recorded in the release-preflight receipt. No build or restart.
- [x] Measure only the three canonical deployed output directories at 2026-10-26 22:49 UTC: Backend 21 MiB, Public 181 MiB, Admin 8.3 MiB. Compare with the prior Public build's ~1,011 MiB cache peak and Admin's ~2.9 MiB temporary cache. Current I/O PSI remains high; build capacity not cleared and no build was run.

**Parent-reported Oct 26 observations:** three services active, zero restarts on Node 24.21.0; API readiness and Public/Admin HTTPS routes returned 200; canonical artifacts exist. Backend artifact marker `e356a00885da9517fe8c32df12dde3e6a3e49688` versus runtime `ace72accfe815abf5ba20df26ee57c76898d0cab`; Public `RELEASE_SHA=3bb57e02ea921531975124ce2c827382a9f1ec6b` versus `BUILD_ID` and runtime `ace72accfe815abf5ba20df26ee57c76898d0cab`; Admin artifact marker `ace72accfe815abf5ba20df26ee57c76898d0cab` versus runtime `VITE_SENTRY_RELEASE=3bb57e02ea921531975124ce2c827382a9f1ec6b`. Admin Sentry 10.73.0 and Vite plugin 5.4.0 align. Backend/Public dependency corrections are source-only per prior receipts; Public shared-store mismatch must be resolved before build. Prior source reviews found no confirmed causal defect in their bounded scope. Oct 25 third-party scanner data is stale, not current defect evidence.

**Fresh checks:** At 22:14 UTC root capacity was 2.9 GiB free / 51 GiB and I/O PSI `full avg10` was 21.67%. At 22:16 UTC `/readyz` returned `READY` with SQLite and Redis true. This is one bounded API check; Public/Admin routes were not rechecked in that probe.

**This continuation:** the Backend instrumentation and preflight docs were committed/pushed as `5fa0784`; the later 1Password CLI and Sentry lookup evidence is recorded in the current receipt. No application build, application test, restart, browser test, deployment, migration, financial operation, or storage action was performed. The read-only audit attempted lint and repository TypeScript checks; lint lacks Backend configuration and TypeScript reported existing unrelated test-file/configuration errors.

## HISTORICAL — CURRENT 2026-10-26 — NEXI FINAL CLOSURE FRONTIER

**Frontier rule:** This top section controls current execution. Older unchecked boxes and next-step notes below are preserved as historical task records; they are not reopened unless this frontier or a newer owner directive explicitly promotes them.

- [x] 2026-10-26 16:29 UTC source/API contract reconciliation: existing NestJS 12.0.3 OpenAPI preview generator ran against current source; `docs/contracts/openapi.json` stayed byte-identical (SHA-256 `1a0b38d88f283a9ae00c0ce597a953d5eb729c7036fba27947045bcd5571d6b3`) and no preview SQLite file was created. Bounded Graphify/source review found no active route defect in the examined controller set; the JWT-only ContractController is in an unmounted module, so no speculative patch was made. This is not exhaustive API/authorization or consumer compatibility proof. Receipt: [source/API contract reconciliation](evidence/nexi-source-contract-reconciliation-20261026.md).
- [x] Updated design assurance, capability routing, browser matrix, Public `frontend/AGENTS.md`, and frontend/security guidance: OpenAPI freshness is scoped accurately; external v3.1 corpus and Graphify-output paths are distinguished; Chrome DevTools MCP is the sole browser route; MetaMask handling stops if the extension page is not exposed; active Public realtime guidance now points to promoted SQLite. Existing Playwright MCP artifacts remain historical and are not new acceptance evidence. No application source defect was confirmed in this bounded slice. No build, deployment, restart, or browser test occurred.
- [x] Source-only closure complete for the bounded current-frontier Backend, Public, Admin, and API-contract lanes. Neither parallel lane found a confirmed new application source defect, and the parent OpenAPI/auth review found no active route discrepancy in its examined scope. No speculative code change was made; remaining open items depend on later browser/runtime proof, controlled identities/fixtures, or owner release gates. Current source and browser instructions are reconciled in the receipt and docs above. **Stop now for the full pre-release report; no application build, deployment, restart, or browser test is authorized in this phase.**

- [x] Current Git reconciliation, 2026-10-26 16:20 UTC: clean `main`, `origin/main`, and `HEAD` match at `e90565de2bc47e151a8a8ea69b0efd1542c522c2`; `b4e72df` and `e90565d` commit the six Playwright page snapshots and eleven console logs, so none remain untracked. Conversion/KYC and Communications source guards and prior Backend/Public dependency corrections are pushed but have not been built or deployed in this campaign. Focused proofs remain 2 suites / 19 tests for Conversion/KYC and 2 suites / 45 tests for Communications/identity. At 16:20 UTC API `/readyz` returned 200 with SQLite/Redis ready; Public `/dashboard` and Admin `/overview` each returned HTTPS 200; all three systemd units were active with zero restarts. These routes are not source-to-runtime identity proof. `ROLLBACK_PREPARATION = OWNER_DEFERRED`; no release is authorized absent owner preparation and explicit per-app authorization. No app build, deployment, service restart, migration, financial operation, or storage/rollback action occurred in this check.
- [x] Owner-authorized cache-only cleanup: removed five inactive, regenerable exact directories under `/home/mellonelay1999/.npm/_npx` (127,632,108 bytes total); exact paths and limits are recorded in [the cache cleanup receipt](evidence/nexi-cache-prune-20261026.md). The active Context7 cache, RDC npm cache, pnpm/Corepack stores, application dependencies, and rollback artifacts were preserved. Root free space moved from 3.3 GB to 3.5 GB. This did not change `ROLLBACK_PREPARATION = OWNER_DEFERRED` or authorize deployment.

- [x] Source-level guard DI review for Conversion/KYC: both active modules import AuthModule, which provides/exports AuthSurfaceGuard; AppModule registers both. No runtime application-context proof was run for this unshipped patch.

- [x] 2026-10-26 15:56 UTC persistent reference readback: archive SHA matches; all 8 manifest file paths exist, 7 declared hashes match and the manifest self-hash mismatch remains documented. External Graphify graph query succeeds (144 nodes / 373 links / 3 hyperedges); index guide/wiki are present. Separate repository graph refresh reports 6,936 nodes / 18,397 edges / 290 communities; 19 SQL files lack symbols because the SQL parser is unavailable, so SQL topology coverage remains incomplete. No re-extraction, corpus mutation, dependency install, or storage action. See `graphify-out/INDEX_GUIDE.md` under the external corpus path and the 15:56 entry in `tasks/plan.md`.

- [x] 2026-10-26 15:54 UTC owner-requested resource check: `/readyz` HTTP 200/SQLite+Redis ready; API runnable sample; all three units active with zero restarts. RAM available 5.0 GiB, swap free 2.6 GiB; root 94% used/3.3 GB free. CPU/memory PSI low; I/O PSI remained elevated. Owner-directed stall disposition: `RECOVERED_WITHIN_VERIFIED_SCOPE` for API readiness/runnable sample only; cause/sustained recovery remain unverified. A read-only disk attribution traversal entered D-state and was interrupted without producing totals; no cleanup or process stop. Details in `tasks/evidence/nexi-api-readiness-io-stall-20261026.md`.

- [x] 2026-10-26 15:49 UTC Conversion/KYC surface-auth fix: active Conversion and KYC JWT handlers now enforce PUBLIC or ADMIN session surfaces with existing `AuthSurfaceGuard`; existing role and ownership guards remain. Red regression confirmed the missing bindings; focused pinned Node 24.21.0 Jest result: 2 suites / 19 tests passed. Bounded third-party scanner security result only flagged intentionally public `GET /conversion/rate`; explanatory note recorded, finding remains open. No build, browser acceptance, deployment, migration, restart, or financial action. Details: `tasks/evidence/nexi-conversion-kyc-auth-surface-20261026.md`.

- [x] 2026-10-26 15:41 UTC readiness and review follow-up: `/readyz` returned HTTP 200 in 0.952 s with SQLite/Redis ready; memory available 4.9 GiB, swap free 2.6 GiB, root free 3.4 GB. I/O PSI avg10 remained elevated (`some=34.93%`, `full=30.59%`), so sustained host recovery is not established and no additional parallel Codex workers were started. third-party scanner bounded security check on the CommunicationsController found only intentionally public announcement/Learn GET routes; notes were recorded, and these third-party scanner findings remain open. Its overall scan is dated 2026-10-25 and does not check cross-file auth or dependencies. Graphify path confirmed the existing guard relationship. Fallow deferred due to I/O pressure. No restart, build, deployment, or cleanup.
- [x] Bounded neighboring route review found AdminController already applies ADMIN surface and permission/role guards class-wide; inspected Financial Operations handlers declare PUBLIC. No additional patch was justified.

- [x] 2026-10-26 15:36 UTC Communications session-surface correction: all protected CommunicationsController Public handlers now require PUBLIC and all /admin/* handlers require ADMIN, retaining their existing guards, role/permission checks and ownership rules. Regression: red test identified 11 missing bindings; focused green result was 2 suites / 45 tests. Browser-level restricted-role acceptance is not proven by this controller test. Receipt: tasks/evidence/nexi-communications-auth-surface-20261026.md.

- [x] 2026-10-26 15:22 UTC bounded recovery check: API `/readyz` returned HTTP 200/READY with SQLite and Redis; all three units remained active with zero restarts. API PID `3333918` was still in `D` at `folio_wait_bit_common`, and I/O PSI avg10 remained elevated (`some=32.90%`, `full=31.61%`). Point-in-time availability is verified, but host/runtime recovery is not closed; do not restart services or start parallel workers until stability is established. See `tasks/evidence/nexi-api-readiness-io-stall-20261026.md`.

- [x] 2026-10-26 15:19 UTC artifact identity readback: pinned Node `v24.21.0`, all three canonical build entrypoints and app-specific shared dependency stores are present. Live markers remain Backend `e356a00885da9517fe8c32df12dde3e6a3e49688`; Public `RELEASE_SHA=3bb57e02ea921531975124ce2c827382a9f1ec6b` / `.next/BUILD_ID=ace72accfe815abf5ba20df26ee57c76898d0cab`; Admin `ace72accfe815abf5ba20df26ee57c76898d0cab`. Current source `1e2d28d` is not the deployed identity, so Backend/Public source-only dependency changes remain unreleased. No release action; owner rollback preparation and per-app authorization remain required.
- [x] 2026-10-26 15:17 UTC runtime sample: all three units active/running with `NRestarts=0`, all process executables on Node 24.21.0; API `/readyz` reported SQLite/Redis ready and API/Public/Admin HTTPS routes returned 200. The API was `Rsl` rather than D-state; I/O PSI remained elevated (`avg10 some 38.16%, full 36.33%`) with `MemAvailable` 4,955,240 kB and `SwapFree` 2,861,656 kB. This confirms current point-in-time availability, not root cause or sustained uptime; no restart, build, deploy, or cleanup.
- [x] Reference retrieval revalidated at `/home/mellonelay1999/.codex/reference-libraries/NEXI_Engineering_Reference_Library_v3.1`: Graphify 0.9.92 query for NEXI durable authority/cross-layer architecture succeeded against the 144-node corpus graph and returned 78 matching nodes (CLI display truncated at the current token budget). `INDEX_GUIDE.md` and `wiki/index.md` were present at this root; the guide records archive SHA and seven matching source hashes plus the manifest self-hash discrepancy. This verifies graph query/navigation, not external-reference adoption.
- [x] 2026-10-26 15:04 UTC runtime recheck: `nexi-api`, `nexi-public`, and `nexi-admin` were active/running with `NRestarts=0`; all three PIDs resolved to `/opt/nexi/runtime/node-v24.21.0/bin/node`. API `/readyz` returned `READY` with SQLite and Redis true; external API `/readyz`, Public `/dashboard`, and Admin `/overview` each returned HTTPS 200. This is a point-in-time availability check, not sustained recovery or authenticated browser acceptance; no restart, build, deploy, or data change occurred. `ROLLBACK_PREPARATION = OWNER_DEFERRED` remains in force.
- [x] 2026-10-26 14:56 UTC runtime recheck: API `/readyz` returned HTTP 200 READY with SQLite and Redis; all three units were active with zero restarts. This is point-in-time evidence and does not establish sustained host recovery; the API process was sampled in D state afterward. No restart/deploy/cleanup; `ROLLBACK_PREPARATION = OWNER_DEFERRED`.
- [x] 2026-10-26 15:01 UTC external route recheck: API `/readyz`, Public `/dashboard`, and Admin `/overview` each returned HTTPS 200; all three systemd units were active with zero restarts. Backend executable resolved to pinned Node 24.21.0. This is not authenticated browser acceptance or sustained availability proof; no service action or deployment.
- [x] S3 Admin Binary source reconciliation: current UI already provides eligible/open position research override, consequential reason plus `binary.edit`, current control-version submission, and authoritative refresh; existing Backend route enforces eligibility, active/unexpired state, version and audit. No source gap was found, so no patch or new test was justified. No live position was changed or deployed. The dated A03/A04 correction is in `Admin/docs/ADMIN_IMPLEMENTATION_CONTRACT_MAP_A_F_2026-10-21.md`; see `tasks/evidence/nexi-admin-binary-research-source-closure-20261026.md`.
- [x] Knowledge reference refresh: safely extracted the supplied v3.1 archive and recorded its SHA; 7 of 8 manifest entries match their files, while the manifest's self-hash entry mismatches its actual bytes (preserved in `graphify-out/INDEX_GUIDE.md`). Indexed all eight corpus files with Graphify 0.9.92 (144 nodes, 373 edges, 20 communities, 10 god nodes, 3 hyperedges). Query/report/wiki outputs and retrieval instructions are under `/home/mellonelay1999/.codex/reference-libraries/NEXI_Engineering_Reference_Library_v3.1/graphify-out/`. Graph data is navigation evidence only; reference adoption still requires current version, license, security and source-contract review. This adds no application-code or deployment claim.
- [x] Historical host I/O-stall samples (11:36–12:00 UTC; follow-up captured): all three units were active/running with zero restarts on pinned Node 24.21.0 at the latest systemd read. API PID `3333918` was in `Dsl` state, separate near-simultaneous `wchan` and `ps` reads reported `folio_wait_bit_common` and `jbd2_log_wait_commit`, and local `/health/live` and `/readyz` both timed out (HTTP 000); this points to an API-process/kernel I/O stall during this window; no application readiness-dependency defect has been established. I/O PSI was `some 98.97/98.65/98.31` and `full 85.41/80.38/79.21` (avg10/60/300); memory PSI was also elevated. A follow-up at 11:43 UTC still found the API and `kswapd0` in uninterruptible I/O waits and I/O PSI above 96% (`some`) / 82% (`full`); this indicates broader host pressure but not its initiating cause. The 11:46 UTC `vmstat 1 3` sample showed 3,975,056 kB of 4,194,300 kB swap used, 3,648–3,876 kB/s swap-out, and 84–97% I/O wait. The 11:57 UTC recheck again found all three units active with zero restarts, while API `/readyz` timed out and PID `3333918` remained in `Dsl`; I/O PSI `some/full` avg10 was 99.18%/91.35%, and only 15,660 kB swap remained free. Recovery is still unverified; no restart, deployment, or cleanup. At 12:00 UTC, all units still reported active with zero restarts, API `/readyz` again timed out, PID `3333918` remained in `Dsl` at `folio_wait_bit_common`, and `SwapFree` had fallen to 352 kB; root had 3.6 GB free. Cause and recovery remain unverified. Public and Admin prior successful probes remain historical and were not rechecked in this window. No restart/deploy/cleanup; preserve `ROLLBACK_PREPARATION=OWNER_DEFERRED`. See `tasks/evidence/nexi-api-readiness-io-stall-20261026.md`; recovery remains unverified. Subsequent checks at 14:56, 15:04, and 15:17 UTC observed API readiness and all three public routes returning 200; at 15:17 the API was runnable rather than in D-state, though I/O PSI remained elevated. The original stall is therefore no longer the current availability result, but its initiating host-pressure cause and sustained-uptime guarantee remain unverified. No restart, deployment, storage cleanup, or archive work was performed.

- [x] Source integration: application-source commit `ea1449682f8fcea544c1da60387c6bcad9d9c842` was pushed as `fix: update Backend and Public security dependencies`; a later documentation-only commit `1e2d28dcdc3ad303d1f20cdef11c3137d2d98127` records this closure preflight, and `main` equals `origin/main` at that SHA. The source commit contains exactly `backend/package.json`, `backend/package-lock.json`, `backend/prisma.config.ts`, `frontend/package.json`, and `frontend/package-lock.json`; these corrections are not deployed. Existing owner/campaign modifications and untracked files remain; no staged paths remain. No broad staging or cleanup.
- [x] Fresh runtime/protection readback: all three services are active/running with zero restarts on Node 24.21.0; API `/readyz` returned READY with SQLite and Redis true, `www.nexitrading.app/dashboard` and `admin.nexitrading.app/overview` returned HTTP 200; direct apex DNS lookup failed. The push changed no service or application data. Root has 3.7 GiB available (93% used); Worker-0 protection reports 70 locked, 0 unlocked, 0 missing. Exact deployed markers and release boundary are recorded in `NEXI_CURRENT_STATE.md` and the continuation evidence.
- [x] Applied source-only dependency corrections: Public Sentry 10.75.2; Backend Multer 2.5.0, `ws` 8.21.0, Browserslist 4.28.7; removed confirmed-unused Backend `socket.io-client`. Backend source-lock production audit now has one low `@babel/core` finding and no high/critical; Public remains 21 (12 high, 9 moderate), zero critical. Admin TanStack/Seroval source lock and current artifact evidence are recorded in the security receipt.
- [x] Rechecked the authenticated Admin `/frontend-control` page at 1500×816: server-confirmed Super Admin; `/admin/me`, system-config, and incidents requests returned 200. No configuration was changed. Console returned `MaxListenersExceededWarning` and `ObjectMultiplex` warnings, with no errors; the warning origin was not independently attributed.
- [x] S4 — Re-tested Public MetaMask connection and SIWE sign-in in the existing Chrome profile at 440×956. The app initially still had an active session, so its Disconnect wallet control was used before the test. MetaMask connection and the separate NEXI sign-in message completed; challenge/verify returned 201, `/auth/me`, wallet overview and activity returned 200. No transaction or financial action occurred. Receipt: [Public MetaMask SIWE browser authentication](evidence/nexi-public-wallet-siwe-20261026.md).
- [x] S5 TRIAGE — Public's 12 high npm audit rows are propagated Zod GHSA-mrhx-c7xc-m3w5 lock findings. Configured Coinbase/injected paths and the inspected deployed Public client chunks did not demonstrate the affected unbounded Zod array parse; the Zod 3 copies remain in the lock and the audit is not clean. No compatibility-risking upgrade was applied. Receipt: [Public S5 reachability](evidence/nexi-s5-public-reachability-20261026.md).
- [x] S5 TRIAGE — Admin TanStack/Seroval is source-to-artifact resolved: the deployed handler matches patched `@tanstack/start-server-core` 1.169.42, and the lock/artifact closure includes Seroval 1.6.9. No Admin release is required for this advisory. See [Admin triage](evidence/nexi-admin-tanstack-deployment-triage-20261026.md) and [security triage](evidence/nexi-security-dependency-triage-20261025.md). No exploit was reproduced; this does not establish every dynamic path or broad authentication correctness.
- [ ] S5 RELEASE — Backend/Public dependency corrections are pushed but not deployed. Fresh GitHub queries confirm 115 open Dependabot alerts: 7 critical, 30 high, 65 medium, 13 low (Backend 2/18/46/7; Public 0/1/4/2; Admin npm lock 2/3/8/3; root 3/8/7/1 by severity). These counts do not establish production reachability. Public Zod alert #279 remains open/high. The source, configured connector paths, deployed client markers, and a follow-up of installed CDP SDK schemas did not demonstrate an affected parser reachable from NEXI's configured Coinbase/injected connectors; Base Account is not configured. No source/dependency fix is justified by this bounded evidence; the audit rows remain open and the review does not prove complete bundle reachability. Reassess only if connector configuration or the Public artifact changes; do not broadly upgrade dependencies from alert counts. **`ROLLBACK_PREPARATION = OWNER_DEFERRED`**: the owner will handle storage cleanup, backup capacity, and rollback-archive placement after engineering. Do not repeat archive comparisons, create archives, or perform storage cleanup. This is not a passed rollback check and does not authorize deployment. Preserve the already-recorded archive comparison as historical evidence; no deployment occurred. Any later release still requires owner-completed rollback preparation and explicit per-app release authorization/runbook checks. Admin TanStack/Seroval is resolved source-to-artifact; no Admin redeploy is required for that advisory. Backend's earlier production audit remains scoped evidence (one low `@babel/core`, no high/critical), not a clean all-alert result.
- [x] S5 bounded Backend `viem`→`ws` reachability follow-up: only `getAddress`/`verifyMessage` are imported by `WalletAuthService`; no viem WebSocket transport or affected inbound receiver path was demonstrated. A fresh pinned-Node resolver check confirmed canonical-store `viem` resolves nested `ws@8.18.3`; `engine.io` resolves patched root `ws@8.21.0`; and `socket.io-adapter` resolves nested `ws@8.18.3`. This is not proof of a vulnerable inbound receiver or of modules loaded by the running PID. No source/package fix was justified; see `tasks/evidence/nexi-ws-viem-reachability-20261026.md`. This does not clear all `ws` findings or authorize release.
- [ ] S3/S4 — Backend service-level cross-customer attachment denial has a focused valid-UUID regression test (1 suite / 21 tests passed); authenticated browser/customer-identity proof remains open. Source reconciliation `NEXI-S5-MESSAGES-RETRY-REALTIME-20261026-B` found the Public failed-send key retention/reset rules, Backend matching-payload dedupe/mismatch rejection, atomic message+EventOutbox write, authenticated Socket.IO rooms, and reconnect/event-triggered durable thread reload consistent with the expected contract. The additional source map confirms Admin Messages reads/moderation carry JWT, ADMIN surface, ADMIN role, and `messages.view`/`messages.send` guard metadata; `admin-message-permissions.spec.ts` asserts that metadata but does not demonstrate a restricted-role request being denied. No source patch or test rerun is justified by this source evidence; browser idempotent retry, restricted-role denial, and pushed-event/reconnect proof remain open and require existing authorized identities/fixtures. Do not fabricate or elevate accounts.
- [x] S2 partial — The 2026-10-25 native `/hooks` receipt shows the relevant NEXI, Agent Skills, and Ponytail hooks trusted and enabled. During this goal's bounded Codex CLI lane, the NEXI PreToolUse gate denied a write before required skill reads, then allowed it after those reads. This verifies that one recognized write path was intercepted; it does not prove universal blocking or current-session invocation.
- [ ] S1/S2/S6 — Recheck native trust only if hook registrations/configuration changed; reconcile the reviewed Git diff and Worker-0 protection state; report exact source/deployed/runtime evidence.
- [ ] OWNER DECISIONS — Approved off-site backup destination and independent key custody; Sentry project issue-read access; retention/cleanup decision for production synthetic Support conversation `3ecc85a9-c243-4da3-bde0-a24bdf532e8f` and `nexi-support-acceptance-ace72ac.png`.
- [ ] Preserve `Mining`, `Loan`, `Withdrawal`, and `Ledger` gates as `OWNER_ACCEPTED_UNTESTED`; final NEXI-wide acceptance is not complete.

## HISTORICAL — CURRENT 2026-10-25 NEXI MAINTENANCE AND FINAL CLOSURE

- [x] User-authorized cleanup removed obsolete duplicate Backend workspace modules, stale Admin preserved pnpm modules and selected generated outputs; Backend workspace `node_modules` now links to its single shared store. Root storage approximately 4.5 GiB free (91% used) at latest inspection.
- [x] Previously released Support/Messages authenticated flow and configurable Support contacts retain their accepted scoped proofs; Backend security hotfix `e356a008` is deployed per latest release receipts. Four financial acceptance gates remain `OWNER_ACCEPTED_UNTESTED`; do not rerun.
- [x] Align Public/Admin systemd commands and PATH to pinned Node 24.21.0, preserving env files, working directories and entry points; daemon-reload and restart after the current owner's explicit authorization. All three process executables now resolve to the pinned binary; API `/readyz` reports SQLite and Redis ready; Public dashboard and Admin overview return HTTP 200. See `tasks/evidence/nexi-final-vm-consolidation-20261025.md`.
- [x] Update the protected root `AGENTS.md` with the observed runtime result using `worker0-protect unlock` → bounded edit → verify → `refresh-lock`; preserve unrelated `.codex/AGENTS.md` and browser-matrix edits.
- [x] Review the 79 tracked `tasks/evidence` receipts: 61 are referenced by tracked documentation; 18 are unreferenced by basename. Preserve all 18 as `UNKNOWN_OWNER` because age/JSON format alone does not prove superseded status or safe regeneration. No evidence file deleted; exact list and criteria are in the final VM receipt.
- [x] Confirm private GitHub CodeQL eligibility. `Mellonelay/Nexi` is a private personal-account repository; hosted scanning requires an eligible organization plan with Code Security enabled. No CodeQL CLI/workflow is configured here; do not claim activation.
- [x] Finish scoped source-design/tooling checks and classify remaining storage/evidence candidates; all unreferenced evidence remains preserved pending owner identity, and no storage candidate was proven safe to remove.
- [x] Realign current architecture, `tasks/plan.md`, and acceptance frontier to current SQLite/NestJS, Next.js, TanStack, Valkey and actual deployment identities; keep older rows below marked HISTORICAL.

## HISTORICAL (SUPERSEDED AS CURRENT PLAN) — 2026-10-23 — Final completion campaign source checkpoint

- Current source checkpoint at intake: `cf9a6ac05ad171e9f8d72a1da2e2b5d46a85414`; deployed release remains `3bb57e02ea921531975124ce2c827382a9f1ec6b` across Backend, Public, and Admin. Source repairs below are not yet committed or deployed.
- [x] SOURCE_IMPLEMENTED / TESTED: added Admin-only Learn category listing and audited, idempotent category visibility updates with stale-status rejection; Admin Learn UI now exposes Hide/Show controls and excludes inactive categories from article assignment. No production category or database was changed.
- [x] SOURCE_IMPLEMENTED / TESTED: Market ingestion shutdown now rejects new provider callbacks and waits for active persistence work before module teardown. Focused test covers in-flight work and post-stop callbacks.
- [x] Focused verification: Backend Learn/shutdown Jest suites 7/7; Backend source TypeScript build config check exit 0; Admin typecheck exit 0; Admin provider/navigation tests 10/10; initial `git diff --check` passed before the last expected-status adjustment (rerun required).
- [ ] Release: Backend/Admin build and deploy not yet performed. Requires final diff review, fresh `git diff --check`, source commit, protected rollback artifacts, and canonical serialized release checks. Public source is unchanged and its deployed artifact remains reusable.
- [ ] Runtime/browser: category visibility and shutdown fix have not been verified in production. Admin/Public acceptance remains partial; use the existing authenticated Chrome profile without replacing it.
- [ ] P3.2 Messages: no controlled conversation fixture is available; do not message customers or fabricate a thread. Two-way creation/reply/reconnect/persistence remains unverified.
- [ ] P1/P2/P3 browser remainder: eligible OPEN Binary position fixture, lower-role permission checks, remaining Admin/Public route coverage, responsive checks, and final owner acceptance remain open.
- [ ] Coordination: Codex Coordinator package/claim are available and active; Codex Tasks returned no registered environments. A single read-only Public evidence lane is operating as a subagent fallback; all source/Git/runtime writes remain with the parent.

## Latest integrated release checkpoint — 2026-10-23 (supersedes older build/deploy rows below)

- [x] Source `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` pushed; Backend and Admin canonical production builds passed and are deployed at that source SHA.
- [x] Backend/Admin services active; API readiness, all five Public Settings API reads, Admin Messages route/bundle, and protected Messages endpoints verified. Public production artifact was reused because Public production source was unchanged.
- [x] Backend/Admin rollback artifacts retained and restoration rehearsals passed. Migration 0017 was already applied with matching schema; no production data mutation occurred.
- [ ] Remaining acceptance: authenticated Admin/Public browser flows and visual/responsive checks. Sentry artifact bundles processed; some generated chunks have no auto-detected source-map reference. Public feature flags remain excluded without an approved named consumer contract.
- [x] Durable history consolidated in [Admin/Public integrated release history](evidence/admin-integrated-release-history-20261023.md); existing integration and release receipts remain the detailed proof sources. At that release checkpoint, no builds or tests were repeated because application source was unchanged.
- [x] Storage maintenance: removed the 1,043,682,946-byte Public Webpack cache, npm download cache (~177 MB), and APT package archives. All three application services remained active; Public `/dashboard` returned 200; final root free space was 1,942,331,392 bytes. Shared dependency stores, native-ABI-specific backend source dependencies, live data, browser state, and rollback archives were retained. See [storage receipt](evidence/storage-maintenance-20261023.md).
- [x] Communications acceptance repair: unpublished the explicitly `TEST_ONLY` Public announcement and moved two explicitly `TEST_ONLY` Learn articles to Draft through the authenticated Admin API with audit reasons; Admin/API/Public readbacks confirmed removal from public feeds.
- [x] SOURCE_IMPLEMENTED, TESTED only: a reviewed Admin-only category status API and UI now exist for `TEST_ONLY PRELIVE`; the deployed Public category remains unchanged until the source release and an audited operator update are performed.
- [x] Admin announcement status and mobile Binary layout repairs are committed locally in `a1746f94ab41d4dbc864677603701b0f8dc3d45d`; focused provider tests passed 10/10 and Admin TypeScript check passed. They remain undeployed; do not claim live Admin behavior is fixed until an authorized release.
- [x] Diagnose the Public `/auth/me` 401 without restarting wallet authentication: the existing app session restored through `/auth/refresh` (201), and normal `/auth/me` calls returned 200. The earlier raw fetch bypassed the app Bearer interceptor and was expected to receive 401. No new signature was needed. See the 10:55 UTC browser proof update in `NEXI_PROOF_REUSE_REGISTER.md`.
- [ ] Continue remaining P1/P2/P3 browser checks: eligible Binary research inspector/default, Client Detail details, Admin mobile visual/interaction and role-denial behavior, Public stock profile and authenticated Spot/Binary/Wallet journeys, and cross-surface configuration beyond existing Communications readback. Reuse prior Dashboard checks at 320×700, 360×956, 390×956, 430×956, and 440×956.
- [ ] P3.2 Messages remains open: both Public and Admin inboxes had no conversation, so controlled two-way message/reconnect proof was not possible. Use only a controlled test identity/thread.

## Prior release checkpoint — 2026-10-20 (historical; superseded above)

- [x] Production build completed in `/srv/nexi/public/current` with `/srv/nexi/public/shared/node_modules`; Next.js 16.4.1 optimized production build and standalone asset preparation exited successfully.
- [x] Public service restarted and active; `MainPID=2187369`, `NRestarts=0`, process cwd `/srv/nexi/public/current`, dependency symlink resolves to `/srv/nexi/public/shared/node_modules`.
- [x] Deployed build/source identity is `db802761a97eee1b9739e146a8cf95d2cd83bed8` in `.next/BUILD_ID`, `RELEASE_SHA`, and `source-provenance.json`; local `main` and `origin/main` match.
- [x] Local HTTP and `https://www.nexitrading.app` both returned 307 to `/dashboard`; no Public service error-level journal entries in the first 10 minutes.
- [ ] Browser verification intentionally deferred until owner discussion; no browser, wallet connect, signature, or authenticated flow was exercised. Admin browser acceptance and release-matched Sentry review are also not part of this stop point.

# NEXI CURRENT TODO — 2026-10-20 source-only closure

## Current owner override — injected Ethereum wallet release (2026-10-20)

- [x] Keep Coinbase SDK plus EIP-1193 injected connection; retain Wagmi EIP-6963 multi-provider discovery; remove the asynchronous preflight that delayed selected injected-provider connections.
- [x] Remove the WalletConnect connector, project-ID branch, chooser wording, and direct package dependency as requested. Wagmi's connector package still carries WalletConnect as a transitive dependency; NEXI does not register or invoke that connector.
- [x] Focused wallet/SIWE/session tests 19/19, frontend TypeScript check, changed-source Fallow (0 findings), Graphify refresh, and targeted React Doctor (0 errors, 4 existing warnings).
- [x] Commit `db802761a97eee1b9739e146a8cf95d2cd83bed8` pushed to `main`; GitHub CI is running.
- [ ] Finish the single production build in `/srv/nexi/public/current` using `/srv/nexi/public/shared/node_modules`, then verify service readiness and served release identity.
- [ ] Reattach the live Public Polypane target for post-deploy browser verification; do not use another browser owner.

Wallet source is deployed only after the above build/restart gate. No wallet connection or signature was performed; post-deploy browser acceptance remains separate.

## Current owner override — 2026-10-20 four-phase Public completion

- [x] Phase 1 Coinbase popup discrepancy localized: deployed Polypane page exposed a Coinbase injected provider and left the chooser request pending; current source suppressed the SDK popup connector in that state. GitHub commit `266e7e6` shows the prior direct SDK `connectAsync` flow.
- [x] Prefer the existing Coinbase SDK connector when available; retain injected fallback when SDK is absent. Focused connector tests pass 7/7; source change is not deployed or browser-verified.
- [x] Temporary dev server stopped and generated `frontend/.next/dev` removed at owner direction; no dev server retry. Production service remains untouched until the source frontier is ready.
- [x] Repair the existing wallet/auth test's incorrect backend-controller path; focused wallet/auth tests pass 21/21.
- [ ] Continue Public functional and responsive acceptance through the deployed Polypane target after the in-place production build. Dedicated MCP enumeration works; do not substitute Chrome 5858.
- [ ] Continue Admin source/API parity; authenticated Admin UI acceptance remains owned by Work Cloud Browser.
- [ ] Complete focused source checks, serialized Git fan-in, in-place Public deployment, then affected Polypane acceptance; no alternate build roots or rollback copies.
- [ ] Keep the four economic gates `OWNER_ACCEPTED_UNTESTED`; do not repeat broad financial acceptance.

Current run also changes `frontend/app/lib/wallet-connector-options.ts` and its tests. The Coinbase popup correction is source-only and not deployed; no wallet connection/signature was completed. Phase completion, responsive browser acceptance, Admin browser acceptance, final release and release-matched Sentry remain unverified.

- [x] Owner scope captured; repeat testing forbidden for proven unchanged or four closed business acceptance gates
- [x] Phase 1: cross-check proof reuse register vs current Git HEAD, graph local source, record unresolved/contradictory backend paths only
- [x] Phase 1: source-only review of four closed financial workflows (no HTTP/Jest/financial execution)
- [x] Phase 1: inspect NestJS DTO/guards/controllers, SQLite/Prisma financial gateway, Ledger/EventOutbox/Inbox, BullMQ/Valkey journal and shutdown relationships
- [x] Phase 2: correct obsolete financial-security D1/empty SQLite warning, active Worker-0 onboarding conflict, legacy comments without erasing immutable migration receipts
- [x] Phase 3: compare Public and Admin API clients, route/DTO/auth/error/event/financial contracts against NestJS and OpenAPI; repair verified mismatches only
- [x] Phase 4: focused static/typechecks and affected builds only if source changed; record no unnecessary financial test reruns
- [x] Phase 4: Sentry release/environment mapping in all three projects confirmed or blockers documented before any deployment
- [x] Phase 4: source-only proof/state/docs and Git fan-in in 3e3a06f; Source CI 7/7 and React Doctor passed; deployed artifact proof is a separate future gate
- [x] Historical deployment authorization gate superseded by the 2026-10-23 owner authorization and completed Backend/Admin release recorded above.

DO NOT reopen owner-closed financial testing, touch promoted SQLite, restart services, deploy, or claim runtime verification from source analysis.

---

## 2026-10-19 — Owner acceptance: four outstanding backend gates closed for current phase

CURRENT OWNER DECISION: Mark remaining four gate rows CLOSED_BY_OWNER_ACCEPTANCE and stop further live backend acceptance for this phase. The owner accepts existing backend/NestJS/schema implementation plus authenticated receipt 20 PASS / 0 FAIL / 4 BLOCKED as sufficient to close the present backend testing campaign. This closes the **work requirement**, not the historical test outcomes. Status per gate: Mining maturity/accrual/redeem = OWNER_ACCEPTED_UNTESTED; Loan collateral/apply/Admin approve/repay = OWNER_ACCEPTED_UNTESTED; Withdrawal security/network/request/Admin settlement = OWNER_ACCEPTED_UNTESTED; Ledger/Activity/EventOutbox per-operation reconciliation = OWNER_ACCEPTED_UNTESTED. Verified receipt remains `fullyAccepted=false` and is immutable; do not assert that blocked HTTP actions passed, that financial postings were reconciled, or that the four lifecycles were runtime verified. Reopen only upon a new owner decision or contradictory production evidence. No financial, schema, or deployment changes occur in this owner-acceptance documentation operation.

---

## 2026-10-19 — Authenticated four-lifecycle receipt (20 PASS / 0 FAIL / 4 BLOCKED)

- [x] Authenticated Binary full open/settle/history and Mining subscribe/replay/cancel: live receipt 20 pass, 0 fail.
- [ ] Mining accrual/redeem after eligible maturity.
- [ ] Loan collateral/application/Admin approval/repay.
- [ ] Withdrawal configured security/network request and Admin settlement.
- [ ] Ledger/Activity/Outbox economic-group correlation.

---

## 2026-10-19 — Controlled authenticated four-lifecycle receipt (partial acceptance, proof reused)

Direct Worker-0 acceptance receipt: `/tmp/nexi-four-lifecycle-565068f6-3cd7-4c83-a576-0db585d521ba.json`, at `2026-10-19T05:35:22.419Z`, records **20 PASS / 0 FAIL / 4 BLOCKED** and `fullyAccepted: false`. Public SIWE and Admin login passed; `/readyz` 200; Binary config, finance wallet funding, opening, settling, history passed; Mining plan, funding, subscribe, same-idempotency replay, cancel passed; Loan plan list and Withdrawal list passed; Public wallet, Activity, Ledger and Admin withdrawal/loan HTTP reads passed. These HTTP status checks establish endpoint success; exact expiry WIN/LOSS, cashflow equality and durable postings have not been independently proven by this receipt. The current live backend test pass subset is `AUTHENTICATED_HTTP_VERIFIED`; overall economic/Admin test completion remains **PARTIALLY_VERIFIED, NOT CLOSED**.

Explicit outstanding gates: (1) Mining reward accrual/maturity and redeem, (2) Loan genuine collateral + accessible image and Admin approve/repay, (3) Withdrawal configured security password/network/destination and Admin review/settle, (4) read-only per-economic-group Ledger/Activity/EventOutbox correlation. `fullyAccepted=false` is retained exactly. Owner considers live backend testing finished for now; stop repeating already proven HTTP paths, record remaining gates as `BLOCKED_WITH_EVIDENCE`/deferred, not `COMPLETED`.

---

## 2026-10-19 — Final bounded Binary/Mining deployment and outstanding acceptance gate

- [x] GitHub 033f6f2 CI 5/5, built/deployed verified Binary and Mining JS, healthy API SQLite/Redis release.
- [x] Doctor 334 findings indexed with source-level categories, zero errors; not equivalent to 334 fixes.
- [ ] Four positive authenticated economic/Admin lifecycles require permitted controlled execution and full accounting evidence.
- [ ] Remaining Doctor warning candidates require further justified source proof.
- [ ] Off-VPS restore deferred by owner.

---

## 2026-10-19 — Worker-0 graph-backed Doctor remediation and four-domain frontier

- [x] Worker-0 current graph CLI/mcpc and L3 targeted topology used; direct source owner confirmed.
- [x] Binary/Mining ConfigService corrections pass TypeScript and 29/29 focused tests.
- [x] All 334 current Doctor observations indexed and assigned provisional dispositions; 0 errors.
- [ ] Four live financial/Admin positive lifecycles remain evidence-limited; no secret runner bypass.
- [ ] 334 Doctor findings are not all fixed; review actionable configuration/guard/DI findings with source evidence, preserving financial schema constraints.
- [ ] Coordinated Git/CI/build/deploy and exact source/runtime identity.
- [ ] Off-VPS restore deferred by owner to after disk cleanup, not claimed tested.

---

## 2026-10-19 — Previously omitted remaining-acceptance receipt and KYC config source check

- Earlier 11:39 UTC remaining-acceptance report recovered and reconciled; do not repeat old Spot/Margin/Binary failures when subsequent proof supersedes.
- KYC source ConfigService correction typed and focused 3/3 passed; commit/deploy boundary remains separate.
- Remaining four financial/Admin flows need positive authenticated runtime evidence (Binary, Mining, Loans and Withdrawal lifecycle), not merely Doctor warnings.

---

## 2026-10-19 — Coordinated GitHub source publication and VPS backend deployment proof

- [x] Push source and Loan CAS documentation main commit cce014d; five Recovery CI jobs pass; changed-contract targeted Jest 33/33 and Nest build PASS.
- [x] Deploy compiled backend on existing VPS with rollback; update Sentry release identity; readiness proves SQLite+Redis active and immediate error-level journal clean.
- [ ] Evidence-limited economic/Admin lifecycles, off-VPS isolated restore, remaining Doctor warnings and eventual manual owner acceptance are not falsely marked completed.

---

## 2026-10-19 — Loan CAS observation
- [x] Current database: CAS column exists; 5/5 stored repayment totals match historical sums.
- [ ] Verify migration provenance and independent restore before attempting any 0016 operation.

## 2026-10-19 — NestJS source-focused remediation and diagnostics (no backend acceptance rerun)
- [x] Source-oriented fixes: async feedback/admin dump filesystem operations, authenticated ConfigService for queue/workflow secrets and guarded scheduler/Outbox/config paths, local object storage config, readonly injections.
- [x] Source TypeScript validation PASS after these edits; git diff --check PASS. No full Jest or authenticated acceptance rerun.
- [x] One justified new Doctor diagnostic scan: 87/100, 339 diagnostics, 0 error (not comparable as an exact improvement to older root/config snapshot).
- [x] Fallow guard + changed-source static inspection run; no dependency boundary/cycle/unresolved import finding; 53 package-dependency observations require explicit ownership before removal.
- [ ] Review remaining Doctor warnings per rule using source behavior, not score-chasing; do not change intentionally public/HMAC-authenticated endpoints or financial schema cascade behavior without causal evidence.
- [ ] Establish independent off-VPS encrypted backup/restore for Loan 0016 and confirm schema migration authority BEFORE any live application; remains blocked on operator-owned recovery proof.
- [ ] Reconcile local commit/GitHub main/deployed artifact identities separately; no Git push or deployment claimed by this source remediation receipt. Any final release requires specifically authorized production mutation.

---

## 2026-10-19 — Owner acceptance receipts reconciled; testing campaign stopped
- [x] Reconcile A/B acceptance reports without adding counts; preserve PASS and later proof scope.
- [x] Stop repetitive whole-backend and authenticated acceptance test campaigns by owner decision.
- [ ] Classify genuine Doctor source findings against current code and scoped configuration, with justified security/performance corrections only.
- [ ] Confirm schema 0016 migration status; no application without recovery/backup prerequisites.
- [ ] Review current BullMQ/Valkey domain consumer and reconnect defects against release-matched logs; reuse isolated successful TLS retry.
- [ ] Preserve and integrate existing dirty source edits and Doctor config after provenance/ownership review.
- [ ] Reconcile final source/compiled deploy SHA, explicit unverified accounting/recovery gates, and owner acceptance without fabricating missing proofs.

---
- [x] Lane B Graphify cloud impact/tests + Worker-0 mcpc actual shortest path; Fallow no backend boundary violations; no source repair needed.
- [x] Lane C deployed API READY and Sentry current release scoped issue search returned no matching grouped issues; SQLite Inbox/Job state captured (not workflow completion).
- [x] 2026-10-18: canonical staging fixture executed with full backend environment; two controlled fixture runs each funded 100000 USDT with unique Ledger posting ID; second fixture persisted mode-0600 controlled credentials. Admin login HTTP 201 verified and Public fixture credentials rejected by Admin login HTTP 401. Positive authenticated economic domain API execution remains pending; separate SIWE-authenticated Public identity is not yet linked to the funded fixture account.
- [x] Canonical staging fixture executed twice with correct existing backend environment; 2 unique 100000 USDT postings. Controlled Admin login HTTP 201 and Public fixture login to Admin HTTP 401.
- [ ] NEXT: no further fixture seeding; verify exact postings, establish funded SIWE Public principal, then serialized live economic API scenarios and Ledger/Activity/Outbox/replay.

- [x] Lane A: fresh legitimate disposable Public SIWE session; 8/8 authenticated HTTP reads, Public token rejected by Admin endpoint HTTP 403; no financial postings (Ledger 49, Outbox 95 unchanged). Receipt: tasks/evidence/authenticated-financial-campaign-siwe-20261018.md.
- [x] Lane A: positive controlled Admin login and canonical Ledger-backed funding, scope limited to fixture accounts; SIWE-funded principal link not established.

# ACTIVE CHECKLIST — Backend Authenticated Financial/Admin Runtime Acceptance

- [x] Owner scope confirmed: backend-only, no browser/new migration, reuse prior SIWE read + financial SQLite + workflow receipts, commit on main.
- [x] Lane A: funded SIWE Public principal authenticated 201; wallet reads 200, account transfer 201 and replay 201 replayed=true. Previously verified controlled Admin login. See VPS receipt /home/mellonelay1999/nexi-acceptance-result.json.
- [ ] Wallet: HTTP transfer and exact Ledger/Activity/Outbox/replay.
- [ ] Withdrawals: Public request, Admin review/approval/rejection and internal (non-broadcast) settlement, Ledger/Activity/Outbox/replay.
- [ ] Convert: quote/accept and accounting/expiry/replay.
- [ ] Spot: order reserve/match/fill, activity/accounting/replay.
- [ ] Margin: open/close/repayment and liquidation contract as supported, accounting/Outbox/recovery.
- [ ] Binary: open/expiry/settlement using current provider config, Ledger/Outbox/replay.
- [ ] Mining: subscribe/accrue/reward/restart idempotence, Ledger/Outbox.
- [ ] Loans: approval/disbursement/repayment/paid-state retry and accounting.
- [ ] Admin: actual authorized financial decisions and unauthorized Public rejection, AdminAuditLog/Outbox.
- [ ] Lane B: Graphify exact call-path/test mapping and Fallow only on invalidated source; report graph-index limits.
- [ ] Lane C: deployed runtime/Sentry/Valkey workflow/inbox/outbox checks tied to requests; independent full restore remains a separate operational proof.
- [ ] After each proof: update NEXI_PROOF_REUSE_REGISTER.md, NEXI_CURRENT_STATE.md, plan/todo and commit/push main.
- [ ] Finish: domain matrix reconciled with evidence; unresolved scenarios explicitly BLOCKED_WITH_EVIDENCE, no silent completion.

---
- [x] SOURCE+DEPLOYED 2026-10-18: JWT PUBLIC/ADMIN auth surface correction across all 45 financial-domain protected controller handlers; 26/26 metadata+guard tests, 9/9 linked HTTP integration tests PASS; build+VPS READY; Sentry release match. Receipt: tasks/evidence/financial-domain-surface-closure-20261018.md.
- [ ] Authenticated live seven-domain economic and Admin side-effect acceptance (legitimate test account/session required; local SIWE tool attempt blocked), durable workflow runtime replay, and independent off-VPS full restore remain UNPROVEN.

- [x] SOURCE TESTED — Margin CLOSING replay cannot change accepted key or switch close to liquidation; 11/11 service and 2/2 SQLite tests PASS. Evidence: tasks/evidence/margin-close-request-binding-20261018.md.
- [x] SOURCE TESTED — Loan exact-key replay after final payment changes status to PAID; previously returned incorrect 400, now returns original without duplicate Ledger/repayment; targeted test 1/1 PASS and typecheck exit 0. Receipt: `tasks/evidence/loan-repayment-paid-replay-20261018.md`.
- [x] SOURCE TESTED 2026-10-18 — Loan 0016 historical cumulative repayment preflight and exact-decimal atomic backfill script; 6/6 fixture tests PASS, live dry-run only. Receipt: tasks/evidence/loan-cas-exact-backfill-20261018.md.
- [ ] OWNER/OPERATOR GATE — Prove independent encrypted off-VPS backup and isolated restore, quiesce live API and execute the **complete** 0016 schema/backfill once using the canonical script; do not separately double-apply 0016 SQL. Confirm Loan repayment historical total and ledger accuracy after controlled migration.

- [x] SOURCE TESTED — Binary already-open positions retain settlement access to historical pair metadata after delisting; 18/18 service tests, 1/1 disposable gateway test PASS. Provider quote/configuration checks remain enforced; deployed authenticated acceptance pending.
- [x] SOURCE TESTED 2026-10-18 — Margin late CLOSE recovery: same close order/key, executed trade VWAP, scheduler, failure-atomic Ledger/Activity/Outbox and focused tests PASS. No deployed claim. Receipt: tasks/evidence/margin-late-close-recovery-20261018.md.
- [ ] BACKEND RELEASE GATE — Prove deployment/source identity and authenticated Margin repayment/close, plus other existing finite seven-domain runtime contracts; apply Loan migration 0016 only with current authorized backup/rollback evidence.
- [ ] OPERATIONAL GATE — Encrypted off-VPS backup + isolated restore not yet proven. Current 7 GB SQLite DB exceeds available free VPS space for a second full local copy.

- [x] TESTED 2026-10-18 — Atomic Margin late-entry fill projection and rollback, 23/23 focused tests + TypeScript check; pending late-close settlement. Receipt: tasks/evidence/margin-late-entry-atomic-20261018.md.
- [x] SOURCE TESTED 2026-10-18 — Governance command key altered-payload replay and concurrent loser approval/audit repaired on local SQLite; 2/2 focused tests + TypeScript check passed. Deployment, authenticated Admin and legacy Prisma alternative remain UNPROVEN. Receipt: tasks/evidence/governance-command-local-sqlite-20261018.md.
# NEXI Migration — Executable Frontier

## 2026-10-18 backend closeout handoff — owner stopped the campaign

- [x] TESTED — Final affected local-SQLite suite passed 14/14; focused deposit-address gateway test passed 1/1; `npx tsc --noEmit -p tsconfig.build.json` and `git diff --check` passed. The prior consolidated 9-suite / 106-test proof was reused for unchanged contracts; affected current paths were rechecked separately. Exact results: `tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md`.
- [x] IMPLEMENTED — Current batch includes Spot Activity/Outbox, stable replay and resting-price matching; Margin open projection/replay; Mining subscription intent replay; Binary settlement event and configuration replay binding; atomic deposit claim review/credit and strict deposit-address Outbox; Loan cumulative repayment CAS with migration; withdrawal additional-review/return; Admin command payload binding and conversion expiry guard.
- [ ] OPEN — Source is committed on canonical `main` at `a0a014f`, based on `e09a33172dc1d14f6d379bac8b969e20d22ac9ea`. No deployment, service restart, live database migration or financial write occurred. Owner directed stop after this reconciliation; no further campaign work is authorized in this task.
- [ ] BLOCKED_WITH_EVIDENCE — Current audit has confirmed unresolved Governance command payload collision and decision race, plus Margin partial-entry position projection and close-fill recovery gaps. Full authenticated Admin/API acceptance, other Margin debt/interest/liquidation, full Loan/Mining lifecycles, Binary provider/config integration, D1 delta watermark, durable workflow recovery and encrypted off-VPS restore remain unproven. CodeScene token remains expired (3/6 installation checks passed).
- [ ] NEXT — Next controller: conduct the owner's planned finite financial-command coverage and closure campaign. Apply migration `0016_loan_repayment_cas.sql` only as part of coordinated release. Do not deploy from this handoff.

## 2026-10-18 backend financial continuation

- [x] TESTED — Isolated local-SQLite proof covers same-user MAIN/BINARY/MARGIN wallet transfers, Binary reserve/WIN/LOSS settlement and withdrawal request/reserve/approve/settle/reject/refund. Exact Ledger, audit, Activity, AdminAuditLog, Outbox, replay and overdraft/collision rollback checks pass. Receipt: `tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md`.
- [x] IMPLEMENTED — Fixed Binary open-position SQL value count and added idempotent, state/receipt-guarded `BINARY_POSITION_SETTLED` EventOutbox insertion in the settlement batch. Strict insertion makes an occupied event key roll back the entire settlement batch. Focused local SQLite suite passes 5/5; Binary service suite passes 17/17, including exact-decimal LOSS payout calculation.
- [ ] OPEN — Authenticated live/API financial acceptance remains separate; use only an authorized test-balance identity or supported accounting-backed fixture. No live database write occurred in this proof.
- [ ] NEXT — Continue with deposit claim/review/credit or conversion on disposable state. Keep Binary provider/configuration and authenticated API acceptance, external withdrawal broadcast, and off-VPS backup destination/key-custody gates open.

Owner authority: latest 2026-10-17 directive/checkpoint. See plan.md. States are claim-scoped; test PASS is not deployed/runtime/owner acceptance. Entries above the dated 2026-10-17 live-authority checkpoint are retained historical checkpoints; use the newest dated checkpoint below as the active frontier. Name.com DNS/NS and trusted TLS are complete; the current blocker is financial authority mismatch and the still-populated Cloudflare D1/async resources, not DNS.

- [x] G0 worktree/dirty/source preservation — COMPLETED; owner RDC; proof evidence/g0-recovery.json; migration HEAD 9a41b2e, original d24862f and two pnpm files preserved.
- [x] G0 task controller — COMPLETED; owner parent/RDC; plan.md + todo.md created only after absence check; no prior tasks overwritten.
- [x] G0 recover exact 7/7 + 53/53 + build receipts — COMPLETED; owner RDC native history; prerequisite existing source; native PIDs 1630238 (7/7), 1630417 (53/53), 1631097 (build exit 0) recovered into evidence/recovered-native-proof.json; 7/7 + build become affected when Prisma initialization changes; no financial gateway source changed.
- [x] G0 live GitHub main + artifact provenance — COMPLETED at recovered checkpoint; main9a41b2e, gzipSHA256 and all92 typed data/key fingerprints verified in evidence/export-restored-content-reconciliation.json. Refresh remote ref before Git integration; no redundant export.
- [ ] G1 all 92 application tables schema/key/content — IN_PROGRESS; owner Data reconciliation via RDC/Cloudflare; prerequisite snapshot provenance; proof machine-readable manifests, no raw PII; next choose bounded streaming snapshot comparison and live source predicates.
- [ ] G1 exact financial data + market boundary/coverage — IN_PROGRESS; owner Data + NestJS/Ledger; proof deterministic content hashes, exact money/posting totals, no-gap source prefix; next inspect schema and existing reconciliation output.
- [ ] G2 each Prisma/bridge connection durability — IN_PROGRESS; owner NestJS/SQLite; proof PRAGMA tests; Prisma connection factory repaired and10 focused tests pass; production-source typecheck passed (PID1636645 exit0); runtime acceptance remains separate.
- [ ] G2 concurrency/BUSY/failure/restart/real-dataset smoke — IN_PROGRESS; owner Agent Skills/RDC; prerequisite current source + preserved tests; add only new risk tests and bind evidence.
- [x] G3 queue/DLQ + workflow inventory — COMPLETED for observed source inventory; owner Cloudflare; evidence/cloudflare-async-inventory.json plus read-only DLQ peek:2 retained messages (probe + LOAN_APPROVED). Refresh before cutover; no replay/ack/purge.
- [ ] G3 self-hosted Valkey/BullMQ durable coordinator — IN_PROGRESS; owner NestJS/RDC; prerequisite mapped contracts; proof retry/replay/duplicate/lost-queue/restart for withdrawal/mining/loan and notifications.
- [ ] G4 R2 private objects + other bindings — IN_PROGRESS; owner Cloudflare/RDC; proof secure object manifest/copy/hash/auth/restore + binding closure.
- [ ] G5 full isolated app/domain/browser parity + measured capacity — BLOCKED_WITH_EVIDENCE (G3/G4 runtime closure incomplete); owner runtime/DevTools; prerequisites G1-G4; proof domain acceptance + resource readings; no live financial writer.
- [ ] G5 independent encrypted backup restore — BLOCKED_WITH_EVIDENCE; destination not established in supplied material; prepare consistent local backup/restore tooling and determine authorized independent destination before final acceptance.
- [ ] G6 financial/public-endpoint cutover — PENDING_OWNER_ACTION; prerequisite G1-G5 + exact freeze/drain/hash/rollback-forward packet; obtain specific signoff, no switch yet.
- [x] G7 Name.com DNS/nameservers — COMPLETED by owner 2026-10-17; Name.com authoritative, A records to VPS, DNSSEC not enabled per owner; prior HTTPS/ACME proof retained. No nameserver action remains.
- [ ] G7 Cloudflare resource retirement — PENDING_OWNER_ACTION; each destructive action requires approval after backup/dependency/rollback-window closure.

## Current next action
Current: finish focused structural review, preserve tested journal/transport, integrate durable workflow and queue consumer paths using existing NestJS domain commands; then controlled isolated runtime. G1 archive-to-restore92/92 complete; current live market prefix/final freeze reconciliation remains open. The original recovery frontier is superseded by the timestamped evidence below.

## 2026-10-16 live evidence update
Remote refs/heads/main verified 9a41b2e; Node v22.23.2 / better-sqlite3 12.11.1 / SQLite 3.53.2. Cloudflare live settings confirm CORE_DB=522177fa-ac42-4d8f-a6a8-b34eed262f15 and 41 bindings, including 3 queues, 3 workflows, 2 R2 buckets. Native source-schema request is read-only.

## G1/G2/G3 newly observed evidence
- Local Prisma synchronous=NORMAL reproduced before repair (evidence/sqlite-pragmas-red.log). Connection factory now enforces/checks WAL/FULL/FK/busy timeout on every connection. Focused suite 10/10 PASS (evidence/sqlite-durability-green.log), including reconnect, FK rejection and SQLITE_BUSY rollback/recovery. Source changes remain opt-in and undeployed; typecheck pending after one-heavy-process reconciliation.
- Live schema matches restored schema exactly. 84/90 smaller table content hashes match current D1; changed tables are MarketAsset, MarketAssetCapability, MarketPair, MarketProviderConfig, MarketProviderSymbol, MarketQuoteLatest. This is additional drift beyond count differences; final snapshot/delta must preserve it. All financial/auth/domain tables in the 90-table comparison match by full normalized content. See evidence/small-table-content-reconciliation.json.
- Full gzip-to-restored typed key/content fingerprint scan active (RDC PID 1634203), bounded RAM; does not write restored file or create another full DB. See evidence/export-reconciliation.log and incremental JSON. Native source gzip CRC validation occurs only at full EOF.
- All 3 NEXI primary queues report backlog zero; domain-events DLQ reports 2 messages/604 bytes, other DLQs zero. No messages consumed. Withdrawal/mining workflow instance lists empty; loan list has 4 historical instances (2 complete, 2 errored), no running/waiting observed. Must refresh at cutover. See evidence/cloudflare-async-inventory.json.
- R2 API lists 3 deposit-proof objects and 0 KYC objects. Copy/content-hash still pending. No resource retirement performed.

### 2026-10-16T10:52Z route correction and additional proof
- [x] COMPLETED — Read-only detailed data comparison (`tasks/evidence/detailed-data-reconciliation.json`): five config tables differ only in updatedAt; MarketQuoteLatest has same53 keys with live quote/provider/state changes. LedgerAccount14 and LedgerPosting46 exact Decimal totals match by asset. This is a live-vs-historical comparison, not final cutover consistency.
- [x] COMPLETED — NEXI kernel/router re-entered after owner workflow correction; using-agent-skills + source-driven-development applied. Native Graphify EventOutboxService impact at9a41b2e and Context7 official BullMQ/Cloudflare recovery contracts captured in `tasks/evidence/route-contract-results-1052.json`. Brief builder returned partial; no acceptance authority delegated.
- [ ] IN_PROGRESS — RDC PID1634203 continues existing archive-to-restored fingerprints; only heavy workload. Next: finish all92-table content checks and gzip CRC, then typecheck the changed SQLite adapter. No production data/writer/DNS changes.

### 2026-10-16T11:00Z bounded-cycle checkpoint
- [x] COMPLETED — Ledger account/posting invariant:0 mismatches,0 orphan posting accounts (`ledger-account-posting-invariant.json`). Node3.53.2 read-only7-table real7.16GB dataset smoke:7000 indexed lookups in489ms; hot-key smoke only, not load benchmark (`real-dataset-node-read-smoke.json`). Snapshot directory700/database+archive600.
- [x] COMPLETED — Private R2 staging copy3 deposit objects6073bytes, KYC0; secondGET SHA256/metadata parity (`r2-copy-manifest.json`). Independent backup and app adapter remain unproven.
- [x] COMPLETED — Isolated Valkey8.0.1 from Debian packages extracted privately; no system package install or TCP listener;128MiB noeviction/AOF everysec/socket600. Native WAITAOF+SIGKILL restart recovered synthetic probe (`valkey-crash-recovery.json`); active PID1635337.
- [x] COMPLETED — Owner BullMQ pages read via Firecrawl; Exa upstream release discovery; Aiven live9.1.2/free-1/TLS/noeviction read-only inspection. Nest12.0.3+ioredis5.10.1; compatible published wrapper12.0.0/BullMQ6.3.15 candidates. V6 API changes recorded (`bullmq-current-contract-1100.json`); integration not installed or runtime-proven yet.
- [ ] IN_PROGRESS — Archive scan PID1634203/1634206; reuse. Detailed handoff `checkpoint-1100.json`. Next affected typecheck then durable async implementation. Owner cutover/DNS/deletion gates unchanged.

### G3 durable-journal increment — 2026-10-16T11:04Z
- [x] COMPLETED — New VPS-only additive LocalDurableJob schema and store reuse existing LocalSqliteBridgeService/BEGIN IMMEDIATE. Red5/5 unimplemented behavior failures followed by green5/5 (`durable-job-journal-red.log`, `durable-job-journal-green.log`, PID1635883 exit0). Proves idempotency/content conflict, restart persistence, cross-connection claim/stale-token fencing, retry deadlines and retained terminal failures. No application activation, transport integration or workflow completion claim.
- [ ] IN_PROGRESS — BullMQ6.3.15 + Nest wrapper12.0.0 integration candidates verified from official docs/npm peers. Next: exact6.x constructor types, isolated real queue recovery tests, then application opt-in seam. Live Cloudflare jobs remain untouched.

### G3 transport increment — 2026-10-16T11:12Z
- [x] COMPLETED — Pinned BullMQ6.3.15 + @nestjs/bullmq12.0.0; npm install9 packages exit0 (`bullmq-dependency-install.log`). Current Nest12.0.3/ioredis5.10.1 retained.
- [x] COMPLETED — DurableQueueTransport with SQLite acceptance before enqueue, generation-based job ids, original domain envelope validation, deployed Worker retry timing2^min(attempts,7) seconds (cap300), and failed-attempt retention. Real Nest BullModule/QueueEvents/Worker on private VPS Valkey:4/4 pass (`durable-queue-green.log`, PID1636408 exit0). Proves transport-job deletion recovery, exact initial2s retry boundary, invalid envelope rejection and completed-job deduplication; not full workflow or application activation.
- [ ] IN_PROGRESS — G1 archive scan still active at low CPU priority,~23MiB RSS,~8.6GiB free disk. Next full hash receipt; then affected typecheck/static review.

### Owner routing correction applied — 2026-10-16T11:17:43.369928+00:00
- [x] COMPLETED — Re-entered current Kernel/router and using-agent-skills lifecycle. Ponytail full selected (exact saved entry + mode read); reused bridge transaction and native SQLite constraints. Review checks existing Outbox/Inbox ownership before integration. No second parent or routine subagents. Three native tool lanes launched concurrently: A current source/tasks (PID1636586), B Graphify bounded ownership query at9a41b2e (partial retrieval, direct source completes Inbox/Outbox evidence), C data/proof recovery(PID1636604). Only parent/RDC mutates.
- [x] COMPLETED — G1 existing export restore fidelity:92/92 typed key+content fingerprints,11,802,372 rows; gzip CRC PASS; archiveSHA256 f65862bbd8359329e3b0db410e941462b8d77d0947024cc6205cb8a88ffa4661; artifacts unchanged;1537.15sec; finished11:11:02Z. Native receipt evidence/export-restored-content-reconciliation.json. Current production equality is NOT implied. Internal sqlite_sequence matches separately (Currency5, migrations15).
- [x] COMPLETED — Affected production-source TypeScript check: npx tsc --noEmit --incremental false --project tsconfig.build.json; PID1636645 exit0. Not a production build/deploy or runtime acceptance.
- [ ] IN_PROGRESS — Fallow changed-source review PID1636733 (read-only/no fixes); remote ref/original preservation refresh PID1636801. Recover handles; do not duplicate.

### Focused review closure in progress
- [x] COMPLETED — Explicit test:local-sqlite and test:local-async scripts added; queue integration file now explicit .integration.ts/config, no conditional describe.skip. Native4/4 pass (PID1636980). Coverage run15/15 pass (PID1637053), new measured coverage evidence, not redundant unchanged regression rerun.
- [x] COMPLETED — Live remote main remains9a41b2e; original checkout still only its two preserved pnpm untracked files (PID1636801 exit0).
- [ ] IN_PROGRESS — Fallow backend-scoped measured review; full-repo rerun included generated HTML coverage/report text and is not an application failure verdict. See implementation-review-decision.json; no suppressions/deletions applied.

### 2026-10-16T11:24:23.001949+00:00 checkpoint and review result
- [x] COMPLETED — Backend-scoped Fallow with four measured source coverage profiles:0 new dead-code findings,0 production complexity findings,0 duplication; full verdict still FAIL due10 inherited dependency findings +1 estimated test teardown complexity finding. No actual source suppressions or auto-fixes added. Native evidence/migration-fallow-backend-review.json; review limitation explicitly retained.
- [x] COMPLETED — Async explicit suite coverage4/4 pass (PID1637500); total focused SQLite/journal15 + async4; historical53 financial remain PROVEN_UNCHANGED. Checkpoint evidence/checkpoint-1124.json retains exact current source/handles/lane owners.
- [ ] IN_PROGRESS — Next smallest G3 frontier: durable workflow checkpoint/event/step persistence and domain-command replay, retaining exact Cloudflare semantics. No local workflow state tables exist in92-table source; add only required VPS metadata, no Ledger/Outbox replacement.

### 2026-10-16T11:39:42.513853+00:00 G3 workflow persistence/replay increment
- [x] COMPLETED — LocalWorkflowStore6/6 pass (PID1638041 exit0): identity, restart/saved results, early event buffering, event dedup/late-event rejection, atomic checkpoint+event+step rollback, stale lease fencing. New VPS-only3 metadata tables, same bridge; no application/production activation.
- [x] COMPLETED — Cross-midnight mining command replay reproduced2 failures/3 tests (PID1638332). Additive read-only canonical MiningRewardAccrual checkpoint and optional persisted payload guard; legacy daily Ledger mutation method unchanged. Native SQLite-backed orchestration5/5 pass (PID1638534 exit0), synthetic accrual records only; not full financial runtime proof. Coordinator must persist checkpoint before accrue.
- [x] COMPLETED — Live NEXI_CONFIG KV namespace keys0, no next page; no values or resource changes. Source consumer parity still required.
- [ ] IN_PROGRESS — Existing workflow-command regression PID1638646; native query/type review and coordinator wiring next. Source financial posting routines unchanged,53 prior tests retained only at their original claim scope.

### Workflow coordinator checkpoint 2026-10-16T11:49:43.884118+00:00
- [x] COMPLETED — Lane A/RDC: durable workflow store 6/6; mining replay 5/5; existing workflow command regression 5/5; loan/withdrawal/mining coordinator 6/6. Evidence: `tasks/evidence/local-workflow-store-green.log`, `mining-workflow-replay-green.log`, `workflow-command-regression.log`, `local-workflow-coordinator-green.log`. Source-only isolated synthetic proof; no deployment.
- [ ] IN_PROGRESS — Lane A/RDC: production-source typecheck PID1639475; recover exit, then mining crash-after-effect/before-checkpoint proof.
- [ ] IN_PROGRESS — Lane B: review replay, timeout and failed-instance recovery contracts. Lane C: acceptance frontier/backup continuity; full archive reconciliation remains completed and must not restart.

### G3 11:55Z evidence update
- [x] COMPLETED — Coordinator-source typecheck PID1639475 exit0 (27.22s), `workflow-coordinator-typecheck.log`.
- [x] COMPLETED — Native mining effect/checkpoint fault: SQLite trigger aborts workflow checkpoint after synthetic accrual commit; reopen all connections across midnight; zero duplicate effect calls;6/6 pass PID1639571 (`mining-workflow-native-crash.log`). Synthetic accrual rows, not real financial postings.
- [ ] IN_PROGRESS — Existing Inbox + loan-workflow queue consumption seam; explicit missing-module red then implementation, focused store/consumer tests PID1639803. Not activated.

- [ ] BLOCKED_WITH_EVIDENCE — One checkpoint rollback assertion failed in combined consumer/store run, then isolated6/6, combined10/10,40-instance stress11/11 passed. Root cause not explained; retain production acceptance block (`workflow-recovery-review.json`). No assertion skipped or source workaround applied.

### 2026-10-16T11:56:41.693831+00:00 queue recovery proof
- [x] COMPLETED — Native BullMQ6/Nest12/private Valkey integration5/5, PID1640196 exit0; actual canonical EventInbox migration + financial gateway + existing EventOutboxService + LocalWorkflowStore/coordinator: failure after durable dispatch before acknowledgment recovers, one Inbox receipt, one accepted decision, loan completes. Synthetic command result only; not full financial runtime. `queue-inbox-workflow-recovery.log`.
- [ ] IN_PROGRESS — Focused affected workflow/consumer/mining bundle PID1640320 includes native step-insert fault and40-instance rollback stress. Prior unexplained assertion retained. Next source typecheck and review before inactive runtime driver.


### Workflow guarded-checkpoint repair — 2026-10-16 (current RDC checkpoint)
- [x] FOCUSED VERIFIED — Replaced checkpoint's cross-statement `changes()` dependency with a first-`UPDATE ... RETURNING` row guard inside the existing `BEGIN IMMEDIATE` bridge transaction. A rejected fence executes no dependent effects; exceptions in the event/step actions roll back the checkpoint. Direct synthetic NULL/trigger/crash scenarios included.
- [x] VERIFIED — Clean affected Jest run: 5 suites / 29 tests passed, exit 0. Receipt: `tasks/evidence/workflow-guarded-checkpoint-20261016.log`. Backend build-source TypeScript check exit 0: `tasks/evidence/workflow-guarded-typecheck-20261016.log`. No trace logging remains.
- [ ] PENDING — End-to-end local BullMQ consumer ACK-loss/restart and actual finance-command runtime acceptance, broader local-workflow acceptance. Existing Cloudflare D1 remains production authority. Do not claim full migration or trigger cutover.

### 2026-10-16 later session: VPS runtime and storage integration checkpoint
- [x] INTEGRATED IN ISOLATED WORKTREE — opt-in NestJS LocalAsyncModule and LocalAsyncRuntimeService linking durable journal, BullMQ6/private Valkey, existing EventInbox queue consumer and LocalWorkflowCoordinator to canonical WorkflowCommandsService; Cloudflare default preserved.
- [x] VERIFIED — 7 focused Jest suites / 34 tests passed with strengthened lease preconditions; native local runtime private-Valkey test 1/1 passed. Evidence tasks/evidence/local-async-combined-diagnostic-20261016.log and local-runtime-valkey-20261016.log. No full financial runtime acceptance claimed.
- [x] INTEGRATED IN ISOLATED WORKTREE — local Outbox-to-SQLite durable-journal publication; local queue publishing bypasses Cloudflare queue HTTP and external scheduler Redis lock. Existing Cloudflare default preserved. Local publication focused tests 2/2.
- [x] INTEGRATED IN ISOLATED WORKTREE — local KYC private object storage and local deposit-proof PUT + same existing financial ownership authorization and claim existence check. Focused storage suites 6/6; backend TypeScript source check passed. Local object storage OFF by default.
- [x] VERIFIED — legacy affected 3 Jest suites / 17 tests passed under original Jest config; previous ESM-only execution had missing Jest global and was test harness misrouting, not product regression.
- [x] STAGED ONLY — 3 R2 deposit proof objects, 6073 bytes copied to separate private object directory with original keys, sizes, content hashes and ETags verified. Receipt tasks/evidence/r2-private-local-copy-20261016.json. Not a live path or independent backup.
- [x] CAPABILITY INVOKED — NEXI Work Kernel, Agent Skills, Ponytail, Graphify static mapping and impact, Worker-0 NestJS review SKILL.md and Fallow CLI review. Graphify index at 9a41b2e excludes uncommitted local integration; Fallow broad review includes irrelevant generated coverage HTML and must be scoped.
- [ ] NEXT — verify full NestJS startup/runtime service injection and local queue subscriber with canonical actual financial commands, including withdrawal/mining/loan paths and cold restart/ACK loss.
- [ ] NEXT — reconcile all Cloudflare Worker bindings/routing/KV/analytics/cron/rate limiter and active Workflow instances with local replacements, on live source and platform.
- [ ] NEXT — local HTTP/browser API compatibility and financial Ledger/EventOutbox acceptance, durable data reconciliation, backup/restore, final traffic switch. Cloudflare authority remains LIVE until explicit cutover acceptance.
- [ ] OWNER ACTION — final DNS and nameserver cutover after VPS origin, TLS and application acceptance. Do not change nameservers or shut down Cloudflare prematurely.

### Paused at user-requested skills-library insert — 2026-10-16 14:30Z
- [x] SUPERSEDED — The earlier combined run recorded three failed store assertions and a diagnostic note, but its inferred `UPDATE RETURNING`/`changes()` explanation was incorrect and is not supported by that artifact. The later clean affected-workflow bundle passed 24/24 across store, coordinator, consumer and mining-replay suites (`tasks/evidence/workflow-recovery-clean-green.log`, PID1647929, exit0); the native trigger rollback and restart replay passed. Treat the earlier failure as non-reproduced, not as proof of a SQLite DDL/PRAGMA defect; preserve its log for provenance.
- [x] COMPLETED — Current user side task: installed BullMQ and Socket.IO skills under `/root/.codex/skills`; verified with Creator validator and both integrity scripts. Private local skill library Git commit f573560; not pushed to any GitHub repo.


### Re-entry checkpoint 2026-10-16T14:52:20Z — recovered execution lanes
- [x] PROVEN_UNCHANGED — Focused affected workflow recovery bundle remains green at 24/24 (PID1647929, `workflow-recovery-clean-green.log`); earlier combined failure is superseded above. No test rerun.
- [x] PROVEN_UNCHANGED — Production-source TypeScript check completed exit0 (RDC PID1648000, `workflow-queue-source-typecheck.log`; empty output is expected for a clean tsc run).
- [x] PROVEN_UNCHANGED — Explicit local BullMQ/Valkey runtime acceptance already passed 1/1 in `local-runtime-valkey-20261016.log`; temporary SQLite + private Unix-socket Valkey, but the callback and event are synthetic and the service is constructed directly, so this is not full Nest DI, EventInbox or financial-command runtime acceptance.
- [x] VERIFIED — Worktree remains `migration/sqlite-local-bridge` at HEAD `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; all migration changes are uncommitted in the isolated worktree. Original checkout and Cloudflare production were not changed.
- [x] VERIFIED — Runtime-resolved dependencies are BullMQ 6.3.15 and ioredis 5.10.1. Official BullMQ v6 docs confirm constructor connection options and graceful Worker/Queue close; existing local code uses Queue retries=1, Worker retries=null, an absolute Unix socket, and closes workers/queues on module destroy. No connection-contract mismatch found.
- [ ] IN_PROGRESS — First unresolved G3 acceptance: join real LocalAsyncRuntimeService, canonical EventInbox/EventOutbox consumer, and WorkflowCommandsService in a disposable local database test; exercise representative withdrawal/mining/loan effects and cold restart/ACK loss without touching production. Existing split proofs do not yet establish this combined path.
- [ ] IN_PROGRESS — Lane B: verify source queue mapping and consumer ownership against deployed Worker code; Cloudflare service inventory/cutover remains open. Lane C: retain G1 final live data delta, independent encrypted backup/restore, and G4/G5 gaps as pending; do not repeat completed snapshot reconciliation.

### 2026-10-16T15:09Z — G3 Nest/runtime integration checkpoint

- [x] COMPLETED — Reproduced and fixed Nest DI token erasure in `LocalAsyncRuntimeService`; changed only `import type { D1WorkerBridgeService }` to a runtime class import. Red receipt: `tasks/evidence/workflow-commands-real-runtime-red.log`. The new regression test fails before the fix and passes after it.
- [x] COMPLETED — Real isolated local runtime integration: `workflow-commands.integration.ts`, 5/5 in `tasks/evidence/workflow-commands-real-runtime-final.log`; financial command effects, canonical Inbox/Outbox, ACK-loss after durable dispatch, and cold Nest restart. Temp SQLite + private Unix-socket Valkey; no production DB.
- [x] COMPLETED — Changed backend source `tsc --noEmit --incremental false --project tsconfig.build.json`, exit 0; receipt `tasks/evidence/workflow-runtime-typecheck-20261016.log`.
- [x] COMPLETED — Scoped Fallow review and post-change Graphify no-cluster refresh/path. Fallow: one changed source file, 8-file impact cone; review findings kept as structural prompts, not behavior proof. Graphify: 7,862 nodes / 19,027 edges and bridge-injection path; `tasks/evidence/graphify-runtime-import-update-20261016.log`.
- [x] PROVEN_UNCHANGED — Existing historical 24/24 workflow recovery suite, 7/7 SQLite bridge suite and 53/53 financial regression suite not rerun; source/output scope did not invalidate their prior claims. Current new integration adds stronger local scope only.
- [ ] IN_PROGRESS — Lane B/C read-only parity check: fetch current official Cloudflare Queue/Workflow docs, inspect active Worker queue handlers and live workflow instances/DLQ policy; compare message routes and persistence behavior with `LocalQueueConsumer` before changing handlers.
- [ ] PENDING — After parity evidence, continue the next smallest durable workflow/queue gap; preserve D1 as production truth and the isolated runtime opt-in until owner-approved cutover.


### 2026-10-16T15:35Z — deployed queue parity and runtime acceptance
- [x] COMPLETED — Lane B/read-only: Cloudflare API inventory of current nexi-production bindings, all three NEXI Queue consumers/DLQs/backlogs, deployed handler logic, and Workflow instance statuses. Evidence: tasks/evidence/cloudflare-queue-workflow-runtime-inventory-20261016.json. No payloads or secret values saved; no writes performed.
- [x] COMPLETED — Lane A/RDC: actual Nest LocalAsyncModule, local SQLite, private Valkey, canonical EventInbox/EventOutbox and WorkflowCommands integration passes 6/6 in 18.663s; includes all three queue classes, financial withdrawal settlement once, mining accrual, overdue-loan event, loan approval and cold restart after simulated journal ACK loss. Evidence: tasks/evidence/deployed-queue-class-parity-20261016.log (RDC PID1652071, exit0). This is isolated test evidence, not production deployment/cutover.
- [x] VERIFIED — Local durable store prior test coverage retained: idempotent receipt, SQLite reconnect, dual-connection lease fencing, due-time retry, terminal FAILED row with bounded lastError, queue partitioning/input bounds (prior evidence unchanged; not rerun).
- [x] VERIFIED — Cloudflare configured max_retries=5 means six delivery attempts including first delivery; local journal default maxAttempts=6. Worker per-message retry uses capped exponential delay; local journal uses same exponential seconds converted to milliseconds, capped at 300 seconds. Cloudflare global retry_delay=15s is overridden by explicit Worker retry for handler failures. Exact local replay from terminal FAILED remains unimplemented/unverified.
- [x] COMPLETED — Lane A/RDC: implemented terminal FAILED-job inspection and explicit replay generation with attempt/error history, conditional replay, distinct BullMQ job IDs, and payload-free dispatch. Focused test/type evidence: tasks/evidence/bullmq-failed-job-replay-contract-20261016.md. No production activation.
- [x] COMPLETED WITH SCOPE LIMIT — Lane B: official BullMQ v6, NestJS, and ioredis contracts reviewed against installed versions and local producer/worker settings; direct code review complete. Fallow included 96 changed files, generated coverage, and dependency-index warnings, so it is a structural signal rather than a scoped clean verdict. Evidence: tasks/evidence/bullmq-failed-job-replay-contract-20261016.md.
- [ ] PENDING — Lane C: G4 actual Cloudflare service consumer closure, G1 controlled final live delta, off-VPS encrypted backup/restore, G5 application/runtime acceptance, G6/G7 owner gates remain pending; historical export/reconciliation is not to be restarted.


### 2026-10-16 — BullMQ failed-job replay and connection contract

- [x] COMPLETED — Supersedes the prior IN_PROGRESS failed-job recovery item: implemented terminal FAILED-job inspection and explicit replay generation with attempt/error history, conditional replay, distinct BullMQ job IDs, and payload-free dispatch. Focused test/type evidence: tasks/evidence/bullmq-failed-job-replay-contract-20261016.md. No production activation.
- [x] COMPLETED WITH SCOPE LIMIT — Supplied official BullMQ v6, NestJS, ioredis reconnect/production docs read and checked against installed versions and local producer/worker configuration; direct code review complete. Fallow reviewed 96 branch files and generated coverage with dependency-index warnings; it is a structural signal, not a scoped clean verdict. Evidence above.
- [x] VERIFIED — Runtime/transport 8/8, journal store 6/6, backend source typecheck exit 0, git diff --check exit 0. The retained old BullMQ job remains available and a replay dispatches under a distinct generation ID.
- [ ] PENDING — Map current admin governance/auth before adding an operator-facing inspection/replay control. This slice exposes no public HTTP replay endpoint.
- [ ] PENDING — Continue G3 broader workflow/job acceptance, G4/G5 Cloudflare dependency closure and application parity, G1 controlled final delta, off-VPS encrypted backup/restore, and owner-gated G6/G7. Production D1/Cloudflare remains authoritative.


### 2026-10-16 — admin governance prerequisite for queue replay

- [x] VERIFIED — Admin route gate and RBAC location mapped: AdminController uses JWT, ADMIN auth-surface, Role.ADMIN, and per-route AdminPermissionGuard. Guard resolves role through D1FinancialCommandGateway.getAdminIdentity. Current permission keys contain no async-job controls.
- [x] VERIFIED — Canonical AdminAuditLog is present. Existing generic service audit writes can be separate from mutations; an operational replay route must atomically record actor/reason/idempotency and replay lineage/audit in the SQLite bridge transaction before exposure.
- [x] DEFERRED_SCOPE — Owner correction 2026-10-16: defer Admin async-job inspection/replay endpoint; it is not required to complete Cloudflare exit. Do not add its routes, permissions, schemas, governance controls, or interface-specific test system.
- [x] DEFERRED_SCOPE — No admin replay route is being added; no separate AdminPermissionGuard runtime work is needed for the migration.


### Owner scope correction — 2026-10-16

- [x] DEFERRED_SCOPE — Admin async-job inspection/replay endpoint, its permission/audit work, and endpoint-specific schemas/tests are not required for Cloudflare removal. Preserve existing journal replay implementation and its completed proof; do not expand it.
- [x] ROUTED — Continue migration on VPS application startup, mandatory Cloudflare dependency replacements, object/config/routing closure, and final acceptance. Keep Cloudflare production authority until gated cutover.


### 2026-10-16 — VPS runtime candidate checkpoint

- [x] COMPLETED — Worker-0/RDC: staged the built migration candidate in `/srv/nexi/backend/releases/20261016T1658Z-9a41b2e3-dirty`; current symlink points to candidate. Candidate `dist/src/main.js` checksum matches the branch build. Container image comparison confirms Cloudflare Container digest `sha256:a960be…d1037` is a separate artifact; VM had no backend image at recovery. Receipt: `tasks/evidence/vps-runtime-candidate-20261016.md`.
- [x] COMPLETED — Worker-0/RDC: created/started local Valkey service with AOF, loopback TCP, private Unix socket and `noeviction`; both endpoints PONG. Existing Public/Admin services are active and untouched.
- [x] COMPLETED — Worker-0/RDC: bootstrapped empty non-authoritative local SQLite staging DB from 15 existing D1 migrations and two VPS-only durable runtime schemas; 96 tables, integrity ok, no FK errors. No historical snapshot or customer/financial data copied.
- [x] COMPLETED — Worker-0/RDC: installed protected backend env and API systemd unit; unit validation passes. API unit is disabled/inactive. Nginx API config is staged in sites-available but not enabled; current Nginx config test passes.
- [ ] BLOCKED_WITH_EVIDENCE — API startup/readiness and route checks require an authorized `JWT_SECRET` and final market/provider runtime inputs. No secret was fabricated or read from Cloudflare. Evidence above.
- [ ] BLOCKED_WITH_EVIDENCE — API TLS vhost enablement requires certificate files and a validated TLS configuration. Current certificate paths are missing; keep site disabled and production routing unchanged.
- [ ] IN_PROGRESS — Continue G3/G4 mandatory Cloudflare dependency closure and G5 VPS application acceptance after startup prerequisites. G1 controlled final live delta, independent encrypted backup/restore, G6 financial cutover and G7 DNS/resource retirement remain open; do not repeat historical snapshot reconciliation.


### 2026-10-16 — production package and local runtime proof

- [x] COMPLETED — Diagnosed and fixed release packaging: production `@prisma/client` (exact 7.3.0) now includes runtime utils; generated D1 client copied according to existing backend Dockerfile. Regression test red/green; fresh production-only release installed. Evidence: `tasks/evidence/vps-runtime-candidate-20261016.md`.
- [x] VERIFIED — Actual candidate D1PrismaService opens staging SQLite: ready true, SQLite 3.53.2, 96 tables, WAL/FULL/FK/busy-timeout PRAGMAs correct. One disposable BullMQ job completes against local Valkey via Unix socket and is removed.
- [x] VERIFIED — Current symlink updated to `20261016T1735Z-9a41b2e3-prisma-runtimefix`; prior release retained; API still disabled/inactive.
- [ ] BLOCKED_WITH_EVIDENCE — API startup/readiness remains pending an authorized `JWT_SECRET` and confirmed market/provider inputs. API TLS vhost remains disabled pending certificate. No Cloudflare/DNS/financial authority changed.
- [ ] IN_PROGRESS — Lane B confirms live KV and Analytics handlers remain deployed; zero KV keys and no NestJS callers are evidence only. Rule out private Container callers and define local health telemetry continuity before dependency retirement. Reuse the prior R2 copy proof; do not recopy.


### 2026-10-16 — readiness authority release update
- [x] COMPLETED — Packaged the already-built SQLite readiness-authority fix in versioned release `20261016T1810Z-9a41b2e3-readinessfix`; actual Prisma + ReadinessService smoke reports READY/SQLite against empty staging DB. Evidence: `tasks/evidence/vps-runtime-candidate-20261016.md`.
- [x] VERIFIED — `/srv/nexi/backend/current` points to that release; API service remains inactive, Valkey and Nginx remain active.
- [ ] BLOCKED_WITH_EVIDENCE — Full API HTTP/readiness and route checks still require authorized `JWT_SECRET` and confirmed provider settings; TLS vhost awaits certificate. Do not activate or expose API yet.


### 2026-10-16T18:45Z — NestJS Observe removal and runtime confirmation
- [x] COMPLETED — Removed `@nestjs/observe` imports, module registration, startup instrumentation, source file, focused test, package declaration and lock entries. Search of active source/compiled output/manifest/locks returns no references. Sentry import and environment remain. No Cloudflare secrets/resources were changed.
- [x] VERIFIED — Branch build `npm run build` exit 0; Fallow scoped dead-code check reports 0 issues and scoped complexity check reports 0 findings in `src/app.module.ts` and `src/main.ts` (generated-file/boundary configuration diagnostics are unrelated).
- [x] VERIFIED — Worker-0 installed new compiled `app.module.js`/`main.js` to `/srv/nexi/backend`, removed Observe compiled files and active module directory, and preserved rollback copy plus old release. Cold restart succeeded with Observe absent. `/healthz` UP; `/readyz` READY with SQLite and Redis true; `/market/prices` HTTP 200; Socket.IO polling handshake and WebSocket connect pass. No Observe telemetry or 401/429 errors in inspected restart logs. Service remains loopback-only and boot-disabled; Nginx/TLS/DNS/Cloudflare unchanged.
- [x] PROVEN_UNCHANGED — Existing SQLite/BullMQ financial/workflow proofs were not rerun; Observe removal does not touch their source paths. Earlier Aiven BullMQ job proof remains unchanged.
- [ ] IN_PROGRESS — Resolve migration-worktree install drift before the final canonical build: npm lock resolves Nest 12.0.3 while pnpm lock resolves 12.1.3; installed worktree Prisma CLI/client are 7.10.0 while manifest pins client/adapter 7.3.0. Confirm authoritative package manager and lock-aligned node_modules without upgrading dependencies.
- [ ] IN_PROGRESS — Continue G4/G5 mandatory Cloudflare dependency closure, app parity and recovery backup. Historical D1 snapshot reconciliation remains closed; final live delta and owner-gated cutover/DNS/retirement remain pending.


### 2026-10-16T20:01Z — live runtime correction and active frontier
- [x] PROVEN_COMPLETE — Reused the existing API runtime without restart: systemd API active at `/srv/nexi/backend/dist/src/main.js`; health/readiness/market/OpenAPI checks returned 200; OpenAPI has 221 paths; Socket.IO Engine.IO v4 polling handshake opened successfully. Evidence: `tasks/evidence/runtime-checkpoint-20261016.md`.
- [x] PROVEN_COMPLETE — Aiven Valkey endpoint is the active API process's Redis target: sanitized in-memory TLS PING=PONG and 16 established sockets from API PID to the Aiven-resolved address. Current API connection to local Valkey was not observed. Keep the local test service while tests may use it.
- [x] PROVEN_UNCHANGED — Runtime package versions align with the canonical `/srv/nexi/backend/package-lock.json`; tracked npm lock declarations match the source manifest. The 12.0.3 vs 12.1.3 Nest resolution differs only within `^12.0.0`; do not reinstall/upgrade based on that alone. Untracked pnpm lock preserved.
- [x] SUPERSEDED — Earlier todo statements that API was inactive / that self-hosted Valkey is the target are historical and no longer current. API is active but remains loopback/non-authoritative; Aiven is final, local Valkey test-only. API boot enablement is disabled and remains a pending runtime-operability item after the readiness/configuration decision.
- [ ] IN_PROGRESS — Lane B: finish exact Cloudflare-only dependency closure against current Worker/Container evidence; do not repeat D1 historical reconciliation.
- [ ] IN_PROGRESS — Lane A: identify and close first confirmed mandatory integration gap from Lane B/runtime evidence. Do not rebuild until source/lock frontier and disk headroom justify it.
- [ ] IN_PROGRESS — Lane C: complete acceptance gaps (authenticated finance path, Socket.IO upgrade/event behavior, Nginx/TLS API vhost, backup/restore); only run checks that can safely remain non-authoritative.
- [ ] PENDING — Final live D1 delta and independent off-VPS encrypted backup/restore.
- [ ] PENDING_OWNER_ACTION — Financial writer cutover, Name.com DNS/nameserver change, Cloudflare retirement.


### 2026-10-16T20:03Z — boot supervision and Nginx candidate
- [x] COMPLETED — Enabled the existing API unit for boot. It stayed active on the same PID and `/healthz` remained HTTP 200; no restart or traffic cutover occurred.
- [x] COMPLETED — Removed the duplicate WebSocket upgrade `map` from the disabled API vhost draft; active Nginx configuration passes `nginx -t`.
- [ ] BLOCKED_WITH_EVIDENCE — API vhost activation awaits the candidate's browser-trusted Let's Encrypt fullchain/private-key files. Candidate remains disabled, DNS unchanged; the active Nginx config test does not parse this disabled draft.


### 2026-10-16T20:06Z — async runtime and market backpressure evidence
- [x] PROVEN_COMPLETE — Active service has local SQLite and local-async flags enabled; source selects Aiven `NEXI_VALKEY_URL` before Unix-socket fallback. Aiven-backed, read-only BullMQ counts succeeded for all three queues; all zero, no job/state writes. Evidence: `tasks/evidence/runtime-checkpoint-20261016.md`.
- [ ] IN_PROGRESS — Market acceptance: active Binance-only staging provider emits recurring bounded-ingest saturation warnings; confirm representative-load quote/kline freshness and required depth/trade realtime behavior. Source explicitly sheds volatile reference events while prioritizing durable quote/kline work; no change made pending proof.


### 2026-10-16T20:17Z — live image/binding evidence

- [x] VERIFIED — Current Cloudflare Worker version/deployment and immutable Container image digest were read without mutation; config and one running instance match digest `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`. Worker still has fetch/queue/scheduled handlers and live Cloudflare bindings. Evidence: current RDC/Wrangler and Cloudflare API observations; see this checkpoint and prior binding inventory.
- [x] VERIFIED — VM `cf` v1.0.0-beta.12 SSH invocation reached the Container's Dropbear banner but timed out after 18 seconds with raw SSH negotiation bytes. Do not infer in-container runtime or image/source parity from that output.
- [ ] IN_PROGRESS — Obtain image-internal Node/package/entrypoint evidence via a supported non-mutating route, or keep the comparison explicitly unverified; compare against the active VPS backend before any production switch.
- [ ] IN_PROGRESS — Continue only the live dependency closure needed for VPS parity: identify remaining actual Container/Worker callers for D1, Queues/Workflows, R2, KV, DO, limiter, cron, Analytics and secrets; preserve all Cloudflare production resources until gated cutover.
- [ ] PENDING — API public TLS route/certificate, authenticated API/WebSocket event acceptance, representative market-load acceptance, final live D1 delta, independent encrypted backup/restore, and owner-controlled financial cutover/DNS/resource-retirement gates remain open. Historical D1 reconciliation remains closed and must not be repeated.


### 2026-10-16T20:22Z — endpoint/image CLI follow-up

- [x] VERIFIED — Public Cloudflare API `/healthz` returned HTTP 200; this confirms current public health only, not VPS cutover/parity.
- [x] VERIFIED — `cf containers images list` shows registry tag `de16e62e` for `nexi-api-staging`, corresponding by label to current Worker version ID. The CLI provides no inspect operation; Docker on the VM has no local matching image. No image was pulled or modified.
- [ ] BLOCKED_WITH_EVIDENCE — Obtain image-internal runtime/provenance from a supported Cloudflare image/SSH route, or retain as unverified. Keep production Cloudflare, D1, DNS and public routing unchanged.

- [x] VERIFIED — Checked this `cf` CLI's own SSH syntax and tried both its documented direct command form and a harmless echo; neither produced usable in-container output (the echo form timed out during SSH negotiation).


### 2026-10-16T20:24Z — Container runtime comparison

- [x] VERIFIED — Authorized read-only SSH works with PTY plus the matching Worker-0 key. Node v24.21.0 / ABI 137; PID 1 is `node dist/src/main.js`, cwd `/app`, executable `/usr/local/bin/node`; compiled `/app/dist/src` exists.
- [x] VERIFIED — In-image package and lock hashes match deployed release commit `7fbde5ca82287902cb351546ccae1b632f1aae44`. Installed Nest core/platform/websockets 12.0.3, Observe 0.1.10, Prisma D1 adapter 7.3.0, ioredis 5.10.1, Socket.IO 4.8.3, Streams adapter 0.3.0. No Prisma SQLite client/adapter, better-sqlite3, BullMQ or @nestjs/bullmq.
- [x] SUPERSEDED — Earlier SSH/image-inspection blocker is closed. This Cloudflare image is the D1/Observe runtime, not the VPS SQLite/BullMQ runtime. No Cloudflare production changes.
- [ ] IN_PROGRESS — Continue actual Cloudflare consumer replacement and VPS acceptance: trusted TLS vhost, authenticated API/WebSocket, representative market load, final live D1 delta, independent encrypted backup/restore.
- [ ] PENDING_OWNER_ACTION — Financial writer cutover, DNS/nameserver change and destructive Cloudflare retirement remain separate gates.
- [x] Confirm authorized Wrangler SSH path against the active Cloudflare container — `wrangler 4.129.0` connected; remote Node `v24.21.0`, matching prior `cf` evidence; temporary agent socket cleanup verified; read-only. Evidence: `tasks/evidence/runtime-checkpoint-20261016.md`.


## Latest owner-controlled frontier — 2026-10-16 20:52 UTC (authoritative over earlier duplicated notes)

- [x] VERIFIED — Node 24.21.0 deployed to isolated API service and nexi-api.service is enabled/active; loopback health/readiness reports SQLite + Redis healthy. Public/Admin PIDs and Cloudflare production unchanged. Evidence: tasks/evidence/runtime-checkpoint-20261016.md.
- [x] COMPLETED — Migration worktree dependency installation aligned with tracked backend/package-lock.json via npm 10.9.8 under Node24; 926 packages. Untracked backend/pnpm-lock.yaml preserved, not used as authority.
- [x] VERIFIED — Installed package versions/native SQLite, focused SQLite 16/16, async/workflow 14/14 using local isolated Valkey, backend build exit 0. No historical financial suite or export rerun.
- [x] VERIFIED — Sentry received one explicitly tagged, non-PII vps-staging acceptance event (issue NEXI-X); this proves SDK delivery, not in-process auto-capture from NestJS.
- [x] PROVEN_UNCHANGED — Active VPS local-mode selectors choose SQLite, local jobs and local evidence storage. Cloudflare code paths are conditional compatibility fallbacks; no active call confirmed. Keep migration source and existing controls.
- [ ] BLOCKED_WITH_EVIDENCE — Public trusted TLS API vhost awaits owner DNS sequencing/certificate issuance; Cloudflare nameservers remain authoritative, candidate API vhost is disabled, and Cloudflare Origin CA is not browser-trusted.
- [ ] BLOCKED_WITH_EVIDENCE — Authenticated REST/financial acceptance lacks a documented authorized non-financial test identity; no financial command was issued.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore destination and job are not established. Historical snapshot restore is not independent DR.
- [ ] PENDING — Final live D1 delta/reconciliation and exact cutover freeze/drain/rollback-forward packet; historical 92-table/11,802,372-row reconciliation stays closed.
- [ ] BLOCKED_WITH_EVIDENCE — Exact running Cloudflare container image runtime parity remains unverified because Wrangler/CF SSH has only reached SSH protocol negotiation, no remote command output.
- [ ] PENDING_OWNER_ACTION — Production financial writer switch, Name.com nameserver change (owner performs), and destructive Cloudflare retirement.


## Canonical-main integration and documentation checkpoint — 2026-10-16 21:29 UTC

- [x] INTEGRATED — Migration source patch applied and committed locally on canonical `main`, based on `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; GitHub synchronization is pending. Migration worktree kept intact. Existing untracked `Admin/pnpm-lock.yaml` and `Admin/pnpm-workspace.yaml` were preserved.
- [x] VERIFIED — Canonical npm `package.json` and `package-lock.json` match deployed backend package/lock hashes. Fresh `npm ci` completed (923 packages); Node v24.21.0, npm 11.19.0. `npm ls --depth=0` exits 0, Native SQLite loads, and `npm run build` exits 0. Receipt: `tasks/evidence/canonical-main-integration-20261016.md`.
- [x] VERIFIED — Native SQLite load returned SQLite 3.53.2; `@prisma/adapter-better-sqlite3` resolved 7.3.0. Canonical built `dist/src/main.js` and active `/srv/nexi/backend/dist/src/main.js` have the same SHA-256. Existing systemd API is active and enabled; no restart was made.
- [x] REVIEWED — Fallow 3.30.0 scoped to the 24 changed backend production TS files (24 paths, tests/generated/deps/manifests excluded): no unresolved imports/cycles/boundary violations. Six unused-member candidates were checked; internal calls and test-only replay surfaces were retained. Policy detector did not run (no rule packs configured). This is static evidence, not type/runtime proof.
- [x] VERIFIED — Local Graphify refresh on canonical integrated source: 7,962 nodes / 19,141 edges. Focused extracted path recorded in `tasks/evidence/canonical-main-integration-20261016.md`; hosted graph is pre-integration.
- [x] UPDATED — Added `docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md` with component map, data flow, Cloudflare-to-VPS replacement matrix and exact remaining acceptance/owner gates. Updated backend, system architecture, cross-surface map, diagrams, docs index, Sentry operations, capability routing, root/backend instructions and current-state docs to describe VPS target while recording Cloudflare as still-live production. Relative-link/fence check passed 11 docs with zero issues.
- [x] COMPLETED — 11-doc relative-link/fence check returned zero issues; staged diff/secret checks passed; source and docs committed and pushed. the later GitHub `index.popsql` update was fast-forwarded and the reconciliation checkpoint was pushed. Original untracked Admin pnpm files remain untouched.
- [x] SUPERSEDED — Nginx API trusted TLS is closed in the 2026-10-17 Public DNS/TLS checkpoint below. Still open: authenticated financial REST acceptance identity; end-to-end market + Socket.IO recovery acceptance; independent encrypted off-VPS backup/restore; current live D1 delta and cutover protocol.
- [ ] PENDING_OWNER_ACTION — Final financial writer/traffic cutover and destructive Cloudflare resource retirement. Name.com nameserver change is complete. Do not mutate production Cloudflare/DNS/writer.

Superseded historical rows remain above for provenance. Do not revive old statements that the API is inactive, Node is v22, self-hosted Valkey is the final target, Container image parity is unknown (in-container inspection is recorded above), or the main source remains isolated on a migration branch.

## 2026-10-17 TODO — Public DNS/TLS routed to VPS

- [x] VERIFIED — Name.com DNS sends www/api/admin to 34.143.137.221. Owner-created GCP ingress ALLOW TCP/80 rule is enabled for tag singbox-chatgpt-24443; screenshot and live Nginx/ACME results agree.
- [x] COMPLETED — HTTP-01 staging and production issuance succeeded; SAN certificate installed for all three hostnames, expires 2027-01-15. Active Nginx configs updated with backups; nginx -t/reload passed.
- [x] VERIFIED — HTTP redirects with 301 to HTTPS for all three hosts; ACME challenge remains reachable on HTTP. Strict HTTPS returns Public/Admin 200 final routes, API readiness 200, market prices 200, Socket.IO polling handshake and actual WSS connect; TLS verify result 0 and VPS remote IP.
- [x] VERIFIED — Certbot timer, NEXI-only Nginx deploy hook, manual hook invocation and certbot renew --dry-run all passed.
- [ ] OPEN — Find authorized test identity for financial API acceptance; do not create financial test balances without the established owner-approved path.
- [ ] OPEN — Establish an authorized independent encrypted off-VPS backup destination and verify restore.
- [ ] OPEN — Reconcile final live D1 delta and prepare controlled freeze/drain/one-writer cutover. Production cutover still requires owner approval.
- [ ] OPEN — Retire Cloudflare resources only after dependency closure, backup/retention and approved cutover. No resources retired.


### 2026-10-17 live authority recheck — Wrangler + active VPS
- [x] PROVEN — At the live-authority recheck, canonical source was `/home/mellonelay1999/workspaces/Nexi`, branch `main`, HEAD and `origin/main` both `bbc849b16291b034b596b80f77790d13112f4cb2`; docs/evidence reconciliation is now committed and pushed as `89244628428176cc81239321291799333866caef`. Preserved untracked Admin pnpm files remain untouched.
- [x] PROVEN_UNCHANGED — Name.com public DNS and trusted HTTPS checkpoint reused from prior direct checks; no DNS/TLS mutations in this pass.
- [x] COMPLETED — D1 operational counts revalidated with project-local Wrangler 4.127.1 (required operator path), read-only SELECTs only. Evidence: `tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json`. Reused prior 92-table historical restore reconciliation; no export/replay.
- [x] COMPLETED — Active service config/source confirms local SQLite adapter is selected and the financial command gateway is enabled; active DB core rows are zero across the sampled financial/auth set. D1 still contains users, wallets, ledger postings/idempotency/audit, outbox/inbox, loan/mining records. No financial command was issued.
- [ ] BLOCKED_WITH_EVIDENCE — Live production API/data authority mismatch: DNS sends public hostnames to VPS; active VPS financial DB has zero core records while Cloudflare D1 has existing records; local financial gateway config is enabled. No writer switch or record copy performed. Evidence above. Next: owner-controlled decision for protecting active public financial command paths, followed by controlled final delta/cutover packet. Do not proceed with financial tests against production.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore unavailable: prior read-only lane found no configured authorized destination; Google bucket listing denied for active VM identity. Next: owner supplies approved destination and least-privilege credentials; encryption key remains separate.
- [ ] PENDING_OWNER_ACTION — Authenticated API/financial acceptance needs an authorized test identity; no credentials or synthetic financial state will be created.
- [ ] BLOCKED_WITH_EVIDENCE — Cloudflare retirement remains blocked: active one-minute Worker cron/queue handlers, D1 authority, backup and cutover gates. Wrangler read-only review confirmed the two errored loan instances were invalid-`loanId` test/probe triggers with no steps; see `tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md`. No resources stopped/deleted.
- [ ] PENDING_OWNER_ACTION — Final D1-to-SQLite financial writer cutover and destructive Cloudflare retirement remain separate owner approval gates; manual Name.com DNS action already completed by owner.


### 2026-10-17 write-path reachability review — source-only, no requests
- [x] VERIFIED — Active service env: local SQLite=true, D1 runtime/bridge compatibility flags=true, NEXI_SCHEDULER_ENABLED=false, NEXI_LOCAL_ASYNC_ENABLED=true; no secrets captured. Local SQLite adapter and local bridge are selected by source.
- [x] VERIFIED — Authenticated financial mutation paths can write through the local gateway to the empty VPS DB. Representative route families include withdrawals/transfers/conversion, loans, binary, spot/margin, mining and deposit claims. JWT-protected /lever/* endpoints include direct Prisma writes outside the gateway. No write requests were sent.
- [x] VERIFIED — Turning off D1_RUNTIME_ENABLED alone does not establish a complete write freeze. Schedulers are disabled but async workers are enabled. D1 bridge reachability from VPS remains unverified, so do not flip adapter mode blindly. Detailed source handoff: tasks/evidence/vps-financial-write-path-risk-20261017.md.
- [ ] PENDING_OWNER_ACTION — Choose coordinated temporary production write freeze/maintenance covering HTTP and local async consumers, or authorize a verified D1-backed route after its transport is proven. Preserve read-only/auth behavior and verify bounded effects. Then continue controlled D1 delta and separate writer-cutover gate.


### 2026-10-17 Cloudflare loan workflow error classification
- [x] VERIFIED — Wrangler 4.127.1 read-only descriptions show both errored loan workflow IDs were explicit proof probes failing immediately on invalid `loanId`; no steps executed. No payload was retained and no instance was mutated. Evidence: `tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md`.
- [ ] BLOCKED_WITH_EVIDENCE — Remaining Cloudflare retirement gates are active Worker cron/queue consumers, D1 authority mismatch, missing approved off-VPS encrypted backup destination, and owner-controlled financial write protection/cutover.

### 2026-10-17 SQLite artifact vs live runtime recovery

- [x] COMPLETED — Recover canonical main 1962dc73efda25d4562ddd52a63fb6e477f1c52f and preserve two untracked Admin pnpm files plus the isolated migration worktree; no checkout/reset or cleanup performed.
- [x] VERIFIED — Live service PID 1680547, systemd working directory /srv/nexi/backend, Node 24.21.0, configured SQLite path /var/lib/nexi/sqlite/nexi-staging.sqlite; process has DB/WAL/SHM descriptors. This is inode 421320, distinct from the historical restore. Evidence: tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json.
- [x] VERIFIED — Root cause of empty core tables: service targets a separate 96-table staging DB; restored 92-table full-data artifact was never installed at the service path. Five runtime-only journal/workflow tables exist and all five have count 0; restored artifact has d1_migrations instead. This disproves the same-DB/stale-read/path-alias hypothesis; do not infer current D1 equality.
- [x] PROVEN_UNCHANGED — Reused 2026-10-16 export/restored receipt: 92/92 typed key+content fingerprints and 11,802,372 source rows; archive gzip SHA-256 rechecked to the recorded digest. No repeat export or row reconciliation.
- [x] VERIFIED — Current D1 CORE_DB ID confirmed from wrangler.jsonc and read-only Wrangler query; latest observed financial posting/audit/idempotency 2026-10-17 00:00:04; outbox 00:00:13; inbox 00:00:19. Query wrote 0 rows. This is not a frozen export watermark.
- [x] PROVEN_UNCHANGED — Reused the owner-reported historical export/restored SQLite integrity and foreign-key pass; a redundant current rerun was stopped after 17m14s / 3,185,134,762 bytes read without output. No new pass is claimed, and no duplicate scan is running.
- [ ] BLOCKED_WITH_EVIDENCE — Full data artifact has not been promoted; live NestJS holds active WAL descriptors, final D1 delta not reconciled, transaction-consistent cutover watermark unavailable, and the owner-controlled write freeze/writer switch is not approved. No source database writes, service restarts, or data promotion occurred; only local consistent snapshot/restore-test files were created.
- [ ] BLOCKED_WITH_EVIDENCE — No approved/mounted off-VPS backup destination was found (findmnt/rclone listremotes returned none); filesystem had about 5.3 GB free after the local snapshot and cannot hold another full 6.67 GB restore. Obtain a user-approved no-extra-paid destination before modifying the candidate or cutover.
- [ ] NEXT — Reuse the owner-reported historical integrity proof; prepare the exact controlled freeze/drain, current-D1 delta, additive VPS schema and rollback-forward packet. Request owner action only once the cutover packet and required write-protection scope are concrete.

- [x] COMPLETED — Current-state, runtime architecture, plan, todo and machine-readable D1/artifact evidence updated; docs-only commit `d6b6ac2012a683b334eae1750028b80135c63f42` pushed to `origin/main`. No application build/deploy, DB, service, DNS or Cloudflare mutation.


### 2026-10-17 local snapshot and startup-schema checkpoint
- [x] VERIFIED — SQLite one-step online backup captured the active staging DB at /home/mellonelay1999/nexi-migration-snapshots/nexi-active-vps-staging-20261017-onestep.sqlite (329,150,464 bytes; SHA-256 ac5aa8d23094d04bab0392185caabd237b6a953927401cacfb68cd7dc4c849ce; mode 0600). integrity_check=ok, foreign-key violations 0, page_count 80359 × page_size 4096, WAL mode, SQLite CLI 3.40.1. A temporary restore copy passed the same integrity/FK checks and zero User/Wallet/LedgerPosting counts; exact temp file removed afterward. This is local rollback evidence only, not off-VPS DR.
- [x] VERIFIED — API remained active at PID 1680547. Source file inode remained 421320. This work issued no source DB writes or service restart; normal application writes continued. No data promotion was performed. Snapshot source core counts remain empty; full historical candidate remains separate.
- [x] VERIFIED — Direct startup source requires LocalDurableJob, LocalDurableJobReplayHistory, LocalWorkflowInstance, LocalWorkflowEvent, LocalWorkflowStep, and EventInbox plus replay columns before enabling local async workers. Candidate lacks five Local* tables; the exact additive SQL already exists in backend/src/jobs/*.schema.sql. No schema was applied.
- [x] PROVEN_UNCHANGED — Historical owner-reported integrity/FK result reused. A redundant reread was stopped without a result after 17m14s / 3.19GB read; no fresh pass is claimed.
- [ ] BLOCKED_WITH_EVIDENCE — No authorized independent off-VPS backup target exists; local snapshot does not satisfy disaster recovery.
- [ ] PENDING_OWNER_ACTION — Provide/authorize a no-extra-paid off-VPS destination and an acceptable bounded financial write-protection window; final D1 delta and single-writer cutover remain separately gated.


### 2026-10-17 — current SQLite promotion frontier (supersedes prior unpromoted/empty-runtime rows)
- [x] COMPLETED — Reused and atomically promoted existing restored candidate to `/var/lib/nexi/sqlite/nexi-staging.sqlite`; existing pre-promotion DB retained at `/var/lib/nexi/sqlite/nexi-staging.pre-promotion-20261017.sqlite`. No new export or duplicate 7 GB restore.
- [x] VERIFIED — API active, Node 24.21.0, canonical file/WAL/SHM open; `/readyz` database+Redis healthy; trusted HTTPS, Public/Admin pages, API/market routes, Socket.IO polling/WSS and Certbot renewal dry-run passed.
- [x] VERIFIED — Existing final export manifest records source `nexi-core-staging`, SHA-256 `4eea2b5e3ebcd591d771cad064a005ffce4744bcf80996597fb2c23fc15d478b`, 92 schema tables, 1,754 imported rows, three deferred market tables and 0 import FK violations.
- [x] VERIFIED — Exact decimal LedgerAccount/LedgerPosting reconciliation: 14 accounts, 48 postings, zero mismatches; 46 idempotency rows have zero dangling posting references. Source authority is LedgerAccount/LedgerPosting, not the legacy Ledger table.
- [ ] PENDING — Prove whether any post-export D1 updates/deletes remain and establish a defensible final data watermark; the current import manifest does not answer this.
- [ ] PENDING — Complete authenticated application acceptance using an authorized test identity; do not fabricate financial data.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore: no authorized destination found. Existing local exports and rollback DB are not independent DR.
- [x] COMPLETED — Updated current-state/runtime/operating/task docs; removed confirmed orphan sidecars and the superseded 329,150,464-byte empty-core staging snapshot after confirming the newer rollback DB is intact. Historical/final exports, manifest and rollback DB are preserved.
- [ ] PENDING — Cloudflare resource inventory/retirement remains separate; no Cloudflare resource was deleted.
- [ ] PENDING_OWNER_ACTION — Any explicit final production financial authority declaration and destructive Cloudflare retirement remain separate from this SQLite file promotion.


### 2026-10-17 continuation frontier — current live evidence
- [x] COMPLETED — Existing scheduler enabled in backend.env; API restarted once and recovered. SQLite and local async remain active; retention is off.
- [x] VERIFIED — Post-restart public/API/Admin HTTPS, trusted certificate status, readiness and Socket.IO polling handshake; relevant systemd services active. No authenticated financial write performed.
- [x] VERIFIED — Current bounded core counts and EventOutbox status recorded in tasks/plan.md; reuse prior Ledger decimal proof. No full DB scan or export repeated.
- [ ] BLOCKED_WITH_EVIDENCE — Final D1 delta / updates / deletes / watermark not proven against promoted SQLite. Historical reconciliation is not a final-live proof.
- [ ] PENDING_OWNER_ACTION — Authorized non-production identity needed for authenticated end-to-end route acceptance; no credentials or synthetic financial state created.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore lacks an authorized destination. Current local rollback/export files are not offsite DR.
- [ ] PENDING — Verify BullMQ job execution (Aiven TCP only is insufficient), provider recovery, and Sentry automatic fault capture. Market feed presently unavailable; keep it lower priority than financial/data closure.
- [ ] PENDING — Verify actual Cloudflare resource/billing inventory. Owner reports Workers/Containers retired; this is not evidence that D1/Queues/Workflows/R2/KV/DO/Analytics/Secrets were retired.
- [ ] PRESERVED — Existing modified Wrangler config and untracked Admin pnpm files remain untouched; classify before any cleanup.


### 2026-10-17 Cloudflare closure evidence (read-only account listing)
- [x] VERIFIED — Cloudflare MCP account listing: 0 Container applications; 3 account Worker scripts and none named nexi-production. This is scoped resource inventory, not proof account-level billing stopped.
- [x] VERIFIED — NEXI D1, 6 queues/DLQs (zero configured consumers), 3 workflows, 2 R2 evidence buckets, and nexi-config-staging KV still exist. Queue depth, live workflow instances and evidence object retention remain unknown.
- [ ] BLOCKED_WITH_EVIDENCE — Preserve remaining D1/queues/workflows/evidence until their contents, pending work, retention and final financial delta are reconciled. No deletion or account-wide cleanup performed.


### 2026-10-17 selected data parity checkpoint
- [x] VERIFIED — 38 selected non-market domain tables matched D1 to active SQLite by both row count and canonical content SHA-256; receipt: `tasks/evidence/d1-sqlite-selected-domain-content-check-20261017.json`. Query was read-only (D1 rows_written=0).
- [ ] BLOCKED_WITH_EVIDENCE — This bounded match is not a frozen global snapshot and does not cover every non-market table or establish a final D1 watermark. Do not describe it as whole-database equality.


### 2026-10-17 expanded D1-to-SQLite non-market reconciliation
- [x] VERIFIED — 89 common non-market tables compared, 1,754 rows on each side; 84 tables have exact row-content SHA-256 and counts. Receipt: `tasks/evidence/d1-sqlite-nonmarket-content-check-20261017.json`. No writes or export/import.
- [ ] DEFERRED — Five same-count content mismatches are market catalog/config (`MarketAsset`, `MarketAssetCapability`, `MarketPair`, `MarketProviderConfig`, `MarketProviderSymbol`); market-history tables were excluded. Revisit only after financial/domain acceptance.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted backup/restore and authorized authenticated acceptance remain unresolved. This sequential read is not a final cutover watermark.


### 2026-10-17 runtime source/storage proof
- [x] PROVEN_UNCHANGED — Deployed backend source commit has no backend path differences through code checkpoint 8570a39; current documentation commits do not require build/redeploy. Runtime entry, binary hash and Node 24.21.0 recorded in plan.
- [x] VERIFIED — Local object storage enabled at /var/lib/nexi/storage; KYC/deposit dirs 0750, DB 0600, env 0640; systemd service identity matches owner. Object-copy completeness remains separate and unproven.


### 2026-10-17 package and canonical DB identity
- [x] VERIFIED — backend `package-lock.json` declarations/lock/installed versions match for NestJS 12, Prisma 7.3, better-sqlite3, BullMQ 6, ioredis, Socket.IO 4 and Redis Streams adapter.
- [x] VERIFIED — systemd Node and Prisma CLI under service PATH are v24.21.0; native better-sqlite3 loaded on Node ABI 137 with SQLite 3.53.2. Interactive shell default Node 22 is not the API runtime.
- [x] VERIFIED — configured canonical SQLite file matches active API process open DB/WAL/SHM descriptors.
- [x] PROVEN_UNCHANGED — no package changes/reinstall/rebuild required; this evidence-only update does not change backend source.


### 2026-10-17 REST contract surface
- [x] VERIFIED — Live `/docs-json` returns OpenAPI 3.0.0 with 221 paths and expected Auth/Wallet/Transfer/Withdrawal/Convert/Spot/Margin/Binary/Mining/Loan/Admin route families.
- [ ] PENDING — Contract path presence does not replace authenticated API/business-flow acceptance.


### 2026-10-17 final runtime continuation (market + auth + async + Sentry)
- [x] FIXED — MarketQuoteLatest sequence seed now continues from indexed historical max; commit 41837777432f5926ffd2c0a0e7ae390a61284010 is built, deployed, and pushed to main.
- [x] VERIFIED — Live market projection recovered (0 active pairs with history but no latest row); no post-start uniqueness warnings; /market/prices 200.
- [x] VERIFIED — Disposable SIWE challenge/login, authenticated wallet/profile/activity reads, logout; no Ledger or EventOutbox count change.
- [x] VERIFIED — Isolated Aiven TLS/BullMQ job completed after exactly one controlled retry; temporary prefix removed.
- [x] VERIFIED — Backend Sentry release now equals deployed code SHA; release finalized/deployed, 20 backend-path commits associated, and an info event was received under the exact release.
- [ ] BLOCKED_WITH_EVIDENCE — Successful authenticated financial/Admin workflows with test balances need an authorized Admin test credential or a supported existing fixture route. No synthetic balance was written directly to SQLite.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup and restore still lacks an authorized destination and independent key-custody location; local snapshots are not DR.
- [ ] PENDING — Authenticated Socket.IO event delivery/recovery, private-object upload/read round trip, natural backend exception attribution/source-map resolution, and deferred market catalog/config mismatch acceptance remain unproven. Reuse existing transport/market evidence; do not re-export or rerun historical reconciliation.
- [ ] PRESERVED — Existing dirty Wrangler file and untracked Admin pnpm files untouched. No cleanup or destructive Cloudflare operation performed.


### 2026-10-17 authenticated local storage and realtime
- [x] VERIFIED — SIWE test identity authenticated the deposit-proof intent/authorize/upload routes; returned 201/201/200, verified stored bytes, then removed the exact test object and empty directory.
- [x] VERIFIED — Authenticated Socket.IO WebSocket connected to /communications; snapshot acknowledged; session logged out.
- [x] VERIFIED — SQLite financial posting/idempotency/outbox/inbox counts unchanged; API readiness and four systemd services remained healthy.
- [ ] PENDING — Cross-instance Socket.IO reconnect/event replay remains unproven; no second backend instance was started.


### 2026-10-17 resumed backend market frontier

- [x] PROVEN_UNCHANGED — Five historical market catalog/config D1/SQLite content mismatches reduce to `updatedAt` differences only; counts and primary-key sets match. Sequential evidence is not a final global watermark.
- [x] VERIFIED — Public Binance BTC/ETH/ADA quotes, BTC depth/trades, and a Margin quote were current at observation. Internal Spot orderbook/trades were separately empty; no provider liquidity was presented as internal execution state.
- [ ] IN_PROGRESS — USD/RUB stale-session classification: MOEX reports `TRADINGSTATUS=N` while the live API used a stale Yahoo daily quote and reported `sessionState=OPEN`. Local adapter repair requests/handles MOEX trading status; focused Node 24 test passed 17/17. Build, deployment, and actual post-deploy runtime proof remain pending.
- [ ] IN_PROGRESS — Market reference event backpressure: queue saturation drops provider trade events; REST snapshots are available, but client sequence-gap detection and recovery/replay after pressure remain unproven. These are reference events, not durable financial postings.
- [ ] PENDING — After the coherent backend repair set is closed, perform one build/deployment and verify deployed quote/session state, market event recovery, and source/runtime identity.
- [ ] BLOCKED_WITH_EVIDENCE — Authenticated financial/Admin end-to-end acceptance still needs an authorized test balance identity or supported fixture route; independent encrypted off-VPS backup/restore still needs an authorized destination and key-custody path.
- [ ] PRESERVED — No frontend edits, API restart, deployment, Git integration, D1 write, or financial operation occurred in this slice; pre-existing Wrangler/Admin changes and migration worktree remain untouched.

Receipt: `tasks/evidence/market-provider-runtime-20261017.md`.

### 2026-10-17 market repair execution workflow update

- [x] VERIFIED — BiQuote source coverage distinguished: 36/36 catalog representations, 35/36 returned candidate quotes, 31 configured in NEXI; AXP has no BiQuote tick/history/OHLC but is returned by NEXI's Gate fallback.
- [x] TESTED — MOEX `TRADINGSTATUS` follows MOEX Currency53 codes; N/C/B closed, T/S active, unknown ignored. Focused Node 24 Jest: 18/18 passed.
- [x] RUNTIME_VERIFIED — After a logged queue-drop at 15:52:04 UTC, fresh readiness/prices/depth/trades REST reads at 15:53 UTC all passed; Binance depth was 20×20 and 50 trades spanned 15:52:48–15:53:14 UTC.
- [ ] IN_PROGRESS — Build/deploy the tested backend correction once source review is closed; validate exact deployed artifact and USD/RUB session response.
- [ ] PENDING — Continue queue/reconnect verification from snapshot read-back; exact reference event replay is not provided by current contract and is not yet proven.
- [ ] BLOCKED_WITH_EVIDENCE — Financial/Admin end-to-end writes require an authorized test-balance identity or supported fixture; encrypted off-VPS restore requires authorized destination and key custody.

Execution order and release gates are specified in `tasks/plan.md` under “Active execution workflow (reconciled 2026-10-17)”.

### 2026-10-17 MOEX release result

- [x] DEPLOYED — Commit `44d7a0a47b82b226f7895230e38e644c2951ba0a` pushed to `origin/main`; backend build exited 0. Compiled MOEX JS SHA-256: `d7acabdd9015d5a65a2dfbad4a77f4d938ac5a4d7cb3639dc6bdcf53c473e285`.
- [x] RUNTIME_VERIFIED — API readiness healthy; `/market/prices` now reports USD/RUB `UNAVAILABLE/CLOSED/MARKET_CLOSED` from MOEX. BTC remains live; depth 20×20; 50 current trades; Socket.IO delivered a valid 53-symbol snapshot with matching USD/RUB/BTC states.
- [x] PRESERVED — Only the compiled MOEX adapter JS and source map were deployed. Generated D1 Prisma client and other runtime files remain intact; rollback copies are under `/srv/nexi/backend/rollback/moex-usdrub-20261017/`.
- [ ] PENDING — Resume remaining authorized backend acceptance. Exact Socket.IO event replay/client auto-refetch remains unproven; authenticated financial/Admin workflows and independent encrypted off-VPS restore remain blocked by the documented owner dependencies.
- [!] OBSERVATION — Graceful stop reached the configured 30-second timeout once; first bounded readiness window was too short and rollback restored prior files. Second rollout with 90-second readiness window succeeded. Current service is healthy, PID 1788896, `NRestarts=0`.

### 2026-10-17 Sentry release alignment and post-restart proof

- [x] DEPLOYED — Runtime `SENTRY_RELEASE` now matches backend source SHA `44d7a0a47b82b226f7895230e38e644c2951ba0a`; Sentry release has one associated commit and a production deploy record.
- [x] SOURCE_MAP_UPLOADED — Changed MOEX adapter map uploaded with debug ID `cf0666cc-ba41-4515-afa3-5dfbcadf2ef3`; deployed JS resolves to it and `node --check` passed. This is map resolution, not event-based stack-frame mapping.
- [x] RUNTIME_VERIFIED — Service restarted to PID 1790362, `NRestarts=0`; readiness recovered with SQLite+Redis. USD/RUB remains truthfully closed; Binance quote, 20x20 depth, and current trades verified. Full evidence in `tasks/evidence/market-provider-runtime-20261017.md`.
- [x] VERIFIED — Controlled production `level=info` event `554d7ce8b68a405ea37ff993342f4b47` flushed and appeared under the exact release. It is grouped with two prior controlled checks as `NEXI-Y`; all are informational, without exception type/value. No production error-level event or matching application log was found.
- [ ] IN_PROGRESS — Adapter source-map pair/debug-ID resolves, but event-based original-file/line mapping remains unverified because the safe info event stack points to the inline evaluator. Sentry API release status remains `open` despite release timestamp/deploy record.
- [ ] BLOCKED_WITH_EVIDENCE — Authenticated financial mutations require an authorized test-balance identity or supported fixture; independent encrypted backup/restore requires approved off-VPS destination and key custody. Continue independent backend gates while blocked.

### 2026-10-17 BiQuote coverage recheck and market next action

- [x] VERIFIED — Full BiQuote symbol catalog read returned 2,061 entries and represented all 36 NEXI non-crypto assets (20 stocks, 9 FX, 7 metals), using explicit aliases for Disney, Uber, Sony and American Express.
- [x] VERIFIED — Latest quote probe returned closed/stale retained quotes for the 31 currently BiQuote-configured symbols; also returned quotes for `DISUSDT`, `UBERUSDT`, `SONYUSDT`, and `USDRUB_HKN`. American Express is listed but has no quote, tick history, or OHLC bars. Exact `USDRUB` has only historical data through 2025-06-20; NEXI's MOEX primary repair is still pending deploy.
- [x] VERIFIED — Live NEXI `/market/prices` returned Gate quotes for AXP/DIS/UBER/SONY; those symbols are not absent from the overall NEXI market response. No Biquote config, source mapping, or frontend change was made from catalog discovery alone.
- [ ] IN_PROGRESS — Finish the already-tested MOEX closed-session repair; then prove queue-pressure recovery using the actual backend REST snapshots and the reconnect/re-anchor behavior already present in the source frontend. Keep the frontend unchanged in this backend phase.
- [ ] PENDING — One coordinated build/deploy after the market repair set is closed; verify deployed USD/RUB state, reference endpoint recovery, runtime identity, then continue outstanding authenticated financial/workflow and backup gates.

Receipt: `tasks/evidence/market-provider-runtime-20261017.md`.

## Latest source frontier — 2026-10-18

- [x] Governance idempotency/approval race; Admin fallback, focused local proof
- [x] Margin close request CAS and changed-order replay
- [x] Margin late ENTRY partial fills, 23/23 tests with rollback proof (`577f5c1`)
- [ ] Margin late CLOSE settlement and repayment/liquidation recovery
- [ ] Loan 0016 migration controlled application and proof
- [ ] Authenticated financial/Admin, durable workflow recovery, off-VPS encrypted backup/restore, deployed artifact
- [ ] One coordinated release after affected source closure; no BiQuote market freshness rework


### Build / graph / static tooling confirmation (2026-10-18)

- Exactly one backend NestJS build in this consolidation: `cd backend && npm run build` **PASS, exit 0**, runtime 68.30s. This built checkout artifacts, not `/srv/nexi/backend`; no service restart or deployment.
- Graphify CLI `graphify update .` **PASS** (96.15s): 8,208 nodes, 19,583 edges, 429 communities; verified independently using Worker-0 `mcpc @nexi-graphify tools-call graph_stats`. The graph is untracked/ignored generated output, not an edited source file, and is labeled with precommit `04eb876`; refresh on new commit when required.
- Fallow CLI `fallow review --base HEAD --brief` **EXECUTED**: high change risk, API contract fanout involving D1 gateway (22 consumers), KYC, Margin and local deposit storage. This is review-risk evidence, not a failed compiler gate.
- CodeScene was available as **Worker-0 `mcpc @nexi-codescene` MCP** even though no `codescene` or `codesense` command was on PATH; `code_health_score` succeeded for Margin service with **7.4**. No additional OAuth sign-in was needed. MCP is v1.5.6 and advertises v1.5.10, left unchanged.
- Focused test receipts remain: 23/23 Margin unit/transaction tests, financial controller guard-surface test, related KYC/deposit/identity suites (no full live-money acceptance). Doctor source report 84/100 and zero errors at the previously scanned checkout.
- Git consolidation intentionally includes prior two untracked admin pnpm files, the Wrangler configuration and all tracked backend source/tests. Note `Admin/pnpm-workspace.yaml` currently contains a placeholder `allowBuilds` value; it is preserved by owner request and must not be interpreted as verified pnpm build policy. No cloud deployment executed.

### 2026-10-19 — Backend component assurance reconciliation

- [x] Preserve owner-closed financial acceptance; record bounded source/runtime/test evidence in NEXI_PROOF_REUSE_REGISTER.md and NEXI_CURRENT_STATE.md.
- [x] Repair missing public read pair input and local async shutdown drain in source, focused RED/GREEN verified (not deployed).
- [x] Isolated SQLite rollback suite 18/18; isolated async Valkey 4/4; workflow store alone 8/8.
- [ ] CONTRADICTED: combined workflow trigger test 27/28; resolve causal reason before marking pass.
- [ ] Finish independent off-VPS encrypted SQLite backup/restore, current-release deployment/recovery validation when prerequisites authorized.
- [ ] Stage/fan-in only owned changes; no unrelated dirty-file overwrite. Evidence: tasks/evidence/nexi-backend-component-assurance-20261019.md.

### 2026-10-19 diagnostic combination rerun (newer than 27/28 receipt)
- [x] Instrumented combined local SQLite test 28/28 PASS (RDC PID 2016625); keep prior 27/28 contradiction visible.
- [ ] Determine whether uninstrumented combined test is stable and identify the cause of intermittent trigger bypass; do not mark full runtime verified.

## 2026-10-19 — VPS deployment and post-release verification (bae05aa)

- [x] Deploy bae05aa with Prisma client preserved, previous artifact retained and release Sentry tagged.
- [x] Live HTTPS readyz SQLite/Redis; pair query missing gives HTTP 400; deployed module hash equality.
- [ ] Resolve uninstrumented combined SQLite rollback 27/28 fault-test failure without reopening closed financial acceptance.
- [ ] Investigate old shutdown SIGKILL, verify new-version graceful lifecycle at controlled maintenance.
- [ ] Address 16 high production npm advisories with focused safe dependency resolution.
- [ ] Independently prove encrypted off-VPS SQLite restore; external destination/key custody unprovided.

### 2026-10-21 — Admin UX source-only acceptance slice
- [x] SOURCE_IMPLEMENTED — Admin navigation terminology, Binary Test Controls presentation, environment/API identity distinction, built-in Public navigation explanation, unavailable Financial Reconciliation state, and unavailable Trading Risk handling updated in Admin source. Server permission checks, API identifiers, audit confirmation flow, and canonical NestJS authority are preserved.
- [x] STATICALLY_VALIDATED — Admin TypeScript typecheck passed; Vite/Nitro production build passed; changed Admin UI lint subset passed; git diff --check passed. Targeted provider lint still reports pre-existing explicit-any/formatting findings; the wider lint attempt exposed baseline formatting findings in existing route content and is not claimed as a clean full lint pass.
- [x] TESTED — Focused SQLite Mining query regression test passed 1 test (51 skipped), proving the changed query prepares/executes in the regression harness; not a broad 52/52 suite claim.
- [x] BROWSER_OBSERVED — Existing authenticated Admin tab reached current deployed routes; old deployed UI showed the reconciliation error, unsupported Sandbox Spot/Balance controls, misleading empty Public Navigation state, and Trading Risk NaN. Public/Admin announcement titles matched but status differed (Public published, Admin draft); same record ID was not visible, so record identity/parity remains unproven. No form was submitted or data changed.
- [ ] BROWSER_VERIFIED — Changed source is not deployed, so updated screens cannot yet be browser-verified. Desktop/mobile acceptance and same-ID Admin/Public parity remain open.
- [ ] RELEASE — Source base observed at start was 27e316abc4295e53e971798822db4074cc094b77; Admin deployed artifact observed was a6b5c8535d4384d309b05f2102846a8717319acf. No commit, push, deployment, Sentry release check, production mutation, or wallet/financial action occurred.
- [ ] NEXT — Resolve remaining baseline lint findings only if they intersect changed logic; obtain same-ID announcement evidence without modifying content; request specific release approval before deployment, then browser-verify changed Admin screens at desktop/mobile and inspect release-matched Sentry.

## NEXI-ADMIN-INTEGRATION — source implementation (2026-10-21)

- [x] P0 authority recovered: canonical checkout, `origin/main`, and remote `main` were `3b54ed2d57c08187818474f75a800616c8970d8a`; worktree was clean at entry.
- [x] P1 eight-workspace compact navigation and contextual route tabs preserve route IDs, deep links, and permission visibility; session identity carries the live actor and environment.
- [x] P2 Binary account default and eligible open-position override are integrated through Admin/NestJS/SQLite schema and source migration, settlement precedence, and audit/idempotency/version fencing. Focused 51-test suite and disposable SQLite 19/19 passed. Migration remains unapplied to production.
- [x] P3 supported settings: quote-category visibility/order and localization now flow from audited Admin system-config writes through allowlisted NestJS Public reads to existing Public Quotes Hub/shell consumers. Category IDs are restricted to the existing catalog; translations are restricted to current Public message keys and six supported locales with existing-string fallback. Prior navigation integration and established Binary/market-source/Mining/Loan/wallet paths are reused.
- [x] P3 routes and banners: approved route IDs/states and banner placement/scopes now flow through validated NestJS writes and allowlisted Public reads to route presentation/navigation and scoped, ordered dashboard notices. These settings do not replace API authorization.
- [ ] P3 feature flags: no named public-safe flags, allowed values, or Public consumers have an approved contract; generic Admin flags remain private and are not reported integrated.
- [x] P4 Admin two-way Messages uses current Communications history/unread/reconnect/persistence and preserves Support/moderation; focused coverage passed.
- [x] P5 backend typecheck and 7 focused suites / 51 tests passed; disposable SQLite passed 19/19; Admin/Public typechecks passed; Public chart tests passed 6/6; changed Admin formatting lint findings fixed. Remaining ESLint diagnostics are pre-existing explicit-any occurrences in `jsonRecordValue` plus the existing session Fast Refresh warning. Fallow found 30 workspace issues and no unresolved imports, cycles, or boundary violations; Graphify refreshed (6,250 nodes / 17,327 edges); `git diff --check` passed.
- [x] P6 exact diff reviewed; Admin source commit `84b5b2dee3c6fc3e50233e21bc359da4c23bf414` and evidence commit `034fd3d664b7b292f3ccb1930516978916ef7838` pushed. Later unrelated `index.popsql` commit `badbfcd5df4ccc301626e60c5cd00971d4113af2` fetched and fast-forwarded; remote/local `main` matched at last check. No deployment, restart, browser acceptance, promoted database write, or live trade.

### P3 Public Settings follow-up — 2026-10-22

- [x] Source implemented: backend `GET /public/config/quotes-categories` and `/public/config/localization`; Admin empty-config category defaults; Public category order/filter and safe localization fallback.
- [x] Focused tests and checks: controller 7/7; disposable SQLite Admin-write/Public-readback 2/2; Public settings/locale/message 6/6; backend/Admin/Public TypeScript pass; Vite SSR self-check verifies isolated category defaults; focused Public ESLint has no errors and one existing LocaleProvider warning. No browser or runtime acceptance is claimed.
- [x] Reviewed and pushed implementation commit `0107eccca1f6990bef579ea9c2e43ca89423ddbe` and evidence-only task-state updates to GitHub `main`; final remote/local SHA was checked after task integration. Production deployment, service/database changes, and browser acceptance are excluded.

### Quotes last-visible-category defect closure — 2026-10-22

- [x] Admin Hide control is disabled for the final visible Quotes category and provides an accessible explanation; NestJS rejects malformed or all-hidden category updates before persistence/audit. Public missing/malformed configuration retains safe defaults, while an explicitly saved valid single-category selection remains selected.
- [x] Focused evidence: disposable-SQLite Admin write/Public readback integration 3/3; AppController runtime tests 7/7; backend build-scope TypeScript, Admin TypeScript, Public TypeScript, changed Admin ESLint, and Public settings tests 3/3. `git diff --check` passes. Fallow introduced-only gate passes with zero introduced dead-code, complexity, duplication, or styling findings. Graphify refreshed to 6,286 nodes / 17,422 edges.
- [x] Source commit `24cf931ced0535a6793253a8bf53e87bdaeff34f` is pushed to GitHub `main`. Backend root test-inclusive `tsc --noEmit` still fails on unrelated existing test/Jest typing errors; the Nest build-scope typecheck passed. This is not a blanket backend typecheck claim.
- [ ] Release/browser gates remain open: no deployment or service restart, no promoted SQLite migration/write, no Sentry check for a new release, and no Admin/Public browser acceptance. The new route/banner source integration is not deployed; feature flags remain outside scope pending a product contract.

### Live release integration gate — 2026-10-22

- [x] Refreshed live preflight 2026-10-22 08:57 UTC at source `e3a5a89e123e0fabee0457dad55298c77560465b`; local/tracking/remote main match and checkout clean. Admin `e2f7a65...`, Public `db802761...`, and API configured release `a6b5c85...` are active with zero restarts. HTTPS roots 307, `/readyz` 200 (SQLite/Redis true), unauthenticated `/admin/me` 401.
- [x] Confirmed all five source Public settings endpoints (navigation/routes/banners/quotes-categories/localization) return 404. Read-only promoted SQLite has no migration 0017 record or Binary research columns; the guarded runner returned `DRY_RUN state=READY; no changes made`. No production database changes occurred.
- [x] Created and tested current Admin rollback artifact `/srv/nexi/admin/shared/rollback-admin-e2f7a65-20261022.tar.gz`, SHA-256 `a2bab873521f9d73a2ca99d5b89c99e40e0e65e8424af9f0535a50c593099fad`; gzip integrity, 162-file disposable restore, release-marker match, empty live-target rsync dry-run, and temp cleanup passed. Retain through owner acceptance.
- [x] Sentry error-event searches for all three current runtime release IDs returned no events in the last 24h; this does not prove issue closure or source-map mapping. Disk headroom is 3.7 GiB.
- [ ] Integrated release remains held: Admin-only authorization does not cover Backend/Public deployment or promoted SQLite migration. Do not ship Admin while required API contracts return 404. Authenticated ChatGPT Work browser control is unavailable in this session. No production build, service restart, migration, deployment, or browser acceptance occurred. Set `VITE_SENTRY_ENVIRONMENT` explicitly for the authorized Admin build.

### P3 routes and banners — 2026-10-22

- [x] Admin banner ordering persists through the existing audited configuration provider. NestJS validates supported route IDs/states and banner fields/scopes; Public read endpoints expose normalized allowlisted values. Public dashboard navigation reflects hidden/maintenance state, direct dashboard screens show the configured availability state, and scoped notices render in saved order.
- [x] Focused checks: backend controller 10/10; disposable SQLite persistence/readback integration 4/4; Public state tests 7/7; Admin provider reorder 2/2; backend/Admin/Public TypeScript and Nest build pass; changed Public ESLint passes. Admin focused lint has only three baseline `no-explicit-any` diagnostics in `jsonRecordValue`. Graphify topology refreshed and checked; Fallow reports no unresolved imports/cycles/boundary violations but includes baseline workspace findings.
- [ ] Public feature flags remain unintegrated because no named public-safe flag/value/consumer contract is defined. This is excluded, not a source defect.
- [ ] These source changes are not deployed or browser-verified. Production release still needs coordinated Backend/Public/Admin authorization and the unapplied Binary migration decision.

#### Binary migration preparation — 2026-10-22

- [x] Added/pushed dry-run-first, transaction-guarded migration runner at `backend/scripts/binary_research_controls_migrate.py` (`0c92f90a4b0a8824369de26b184eae3574a23f89`) and disposable-SQLite tests at `backend/test/scripts/test_binary_research_controls_migrate.py`.
- [x] Focused migration tests rerun: 6/6 passed, including idempotency, fail-closed partial schema, and rollback on injected SQL failure.
- [ ] Production SQLite remains unmodified; migration status must be refreshed and backup/quiescence plus current authorization verified before use. No deploy, service restart, or browser acceptance occurred.

#### Independent release preparation — 2026-10-22

- [x] At `main@8f1d830ddb479b7c0823cdf8e48aebde7f79cb4d`, isolated source builds: NestJS build PASS; Public Next.js 16.4.1 Webpack build and standalone preparation PASS with exact BUILD_ID; Public standalone asset tests 2/2; Admin TypeScript PASS and Vite client/SSR/Nitro build PASS. Local Public and Admin artifact smoke routes returned expected redirects and 200 responses. No source or live artifact changed.
- [x] Sentry build wiring used Admin's existing 1Password wrapper; three artifact bundles uploaded under release `8f1d830ddb479b7c0823cdf8e48aebde7f79cb4d`. Sentry confirms release exists, no deploys/commits, zero new issues. Upload warnings: 144 chunks had no source map reference. Public build had the existing optional MetaMask package-resolution warning and 27 traced files outside its root; source checkout Turbopack separately failed on the external shared-dependency symlink, so the supported Webpack build was used.
- [ ] Migration 0017 remains a separate `BLOCKED_WITH_EVIDENCE` subtask only: no protected/restorable backup destination is currently available (3.7 GiB free versus 11.9 GiB DB; GCS list denied; GCE disk-inspection scope absent). Keep unrelated source/build work progressing; never bypass the runner's backup/quiescence acknowledgment.
- [ ] Production deployment and service restarts have not been run in this source-preparation step; live markers remain the prior releases. Browser acceptance is owner-planned and not claimed here.

#### Retained-build release manifest — 2026-10-22

- [x] Rechecked current source `982ca778106b1a51682982c2efc2bbbf52ce9c77` (clean, equal to `origin/main`) and confirmed application files are unchanged from successful build source `8f1d830ddb479b7c0823cdf8e48aebde7f79cb4d`.
- [x] Recorded retained artifact identities, hashes, build/dependency notes, active service markers, API results and rollout order in `tasks/evidence/integrated-release-manifest-20261022.md`.
- [x] Sentry release `8f1d830...` exists, processing completed, with no deploys or matching issues. Client bundle: 64 mapped/1 unmatched; SSR 61 and Nitro 82 without maps. Public source-map upload was not run. The unmatched client chunk cannot be tied to an emitted asset from retained evidence; browser map coverage remains unverified.
- [ ] Migration 0017 alone remains blocked on a protected, restorable backup destination and safe quiescence. No services, live artifacts or promoted SQLite were changed. The current API returns 404 for all five new Public Settings endpoints, so integrated rollout remains pending.

#### Admin build/dependency rule correction — 2026-10-22

- [x] Re-read root, Codex overlay, Public, Backend and Admin instructions. Verified Public/Admin source symlinks and backend runtime symlink; left checkout `backend/node_modules` unchanged because that runtime rule does not govern it.
- [x] Confirmed Admin pnpm lock/shared tree alignment (`@tanstack/router-core@1.171.37`, `@tanstack/history@1.162.5`); pinned pnpm `12.14.0`, named `pnpm-lock.yaml` as the Worker-0 lock authority, and refreshed stale Public version guidance. No library dependencies were upgraded.
- [x] Recorded that the prior Admin build was diagnostic because it wrote to `Admin/.output`; updated Admin instructions with the canonical output environment variable and retained the limitation in the release manifest.
- [x] Diff reviewed and pushed: source commit `cbb52c196b94abe05f87bbf779f3b5b69152af62`, documentation/evidence commit `d5692a818b5ba3556693c085a1ff9d70dd805d1a`; local, tracking and remote main matched. No canonical production build, deployment, service restart, SQLite migration or browser acceptance occurred.

### Current integrated release execution — 2026-10-22 12:30 UTC

- [x] **Built/deployed:** committed application source `6507cf16a8cd863048b12aa56b23fd43435695ec` was built in the canonical Public `/srv/nexi/public/current` and Admin `/srv/nexi/admin/current` directories. Public Next.js Webpack, standalone asset preparation, Admin Vite client/SSR and Nitro completed successfully. Both frontend markers/build IDs match the source SHA. Backend source is unchanged since deployed marker `9473e1393ada0c7398ad1aca27e822b2d6d00975`; its build was reused.
- [x] **Migration/API:** the guarded migration runner returned `ALREADY_APPLIED schema_matches=yes` in read-only mode; no production database write was performed. API `/readyz` and all five Public Settings reads return HTTP 200. Admin unauthenticated API boundary returns 401.
- [x] **Runtime:** Public and Admin services are active with zero systemd restarts; Public `/` redirects to `/dashboard` and dashboard is 200; Admin `/` redirects to `/overview` and overview is 200. The service entrypoints use the canonical outputs.
- [x] **Sentry:** exact release `6507cf16a8cd863048b12aa56b23fd43435695ec` exists in `mellonelay/nexi`; Public and Admin artifact-bundle uploads completed through the existing secret wrapper. Sentry reports zero new issues and no matching production errors in the last 24 hours. No Sentry deploy record was found. Upload reports still include unmatched generated JavaScript chunks, so complete source-map association is unverified.
- [x] **Dependencies/cleanup:** Public and Admin source/runtime links resolve to their distinct shared stores; Backend runtime links to its own shared store. No cross-application dependency merge or package upgrade was made. Removed the ignored 1.1 GB `frontend/.next` duplicate and noncanonical `Admin/.output` diagnostic tree; retained rollback archives. The 726 MB checkout-only `backend/node_modules` tree was left intact because it differs from the runtime shared tree.
- [ ] **Owner browser acceptance:** not run in this Worker-0 execution. Keep the verified Public rollback archive `/srv/nexi/public/shared/rollback-public-db802761-20261022.tar.gz` (SHA-256 `45e833045018b8c2d3e3ad4d67591a527a5f75be0519542d83746138b647fa34`) and Admin rollback archive `/srv/nexi/admin/shared/rollback-admin-e2f7a65-20261022.tar.gz` (SHA-256 `a2bab873521f9d73a2ca99f6e299502430e0e65e8424af9f0535a50c593099fad`) until owner acceptance.
- **Warnings:** Public build emitted an unresolved MetaMask SDK import for `@react-native-async-storage/async-storage` and 27 standalone tracing notices; runtime smoke checks passed, but wallet connector/browser behavior was not tested. Admin pnpm emitted a non-fatal pre-script symlink/hoist verification warning; Vite client, SSR and Nitro still completed with exit 0.
- **Workflow receipts:** NEXI Work Kernel/Capability Router, `using-agent-skills`, Context Engineering, Ponytail and `shipping-and-launch` guided the release and minimal evidence update. SQL Expert migration, transaction/concurrency and database-administration skills were read; the observed `ALREADY_APPLIED` result meant no SQL mutation was needed. `git-workflow-and-versioning` guided the evidence-only commit. `worker0-protect unlock` was invoked before the document updates; protections will be refreshed after review.

### Approved Admin visual-contract correction — 2026-10-22

- [x] SOURCE_IMPLEMENTED — Eight workspace labels now occupy the primary navigation; the `/sandbox` link was removed from navigation while its guarded source route/deep link remains. Trading’s first contextual route is `Binary · Ongoing`; `Binary Settings` is a contextual tab; the old scenario form is titled `Sandbox Scenario Testing` rather than `Binary Trading Control`.
- [x] SOURCE_IMPLEMENTED — Binary positions now use a responsive table/inspector layout with row selection, filters and expiry readback. Account-default control remains in Client Detail; the separate position override remains limited to approved research-eligible OPEN positions. Provider state mapping now keeps `settling`/`settlement_delayed` out of the editable OPEN state and reads the API expiry field correctly.
- [x] STATICALLY_VALIDATED / TESTED — Admin TypeScript passed; focused changed-file ESLint and Prettier passed; provider/navigation/route contract suite passed 5/5; `git diff --check` passed. Graphify refreshed to 6,411 nodes / 17,666 edges. Fallow found no introduced dead code, duplication or styling findings; three introduced moderate CRAP/coverage findings remain on `PositionResearchSummary`, `PositionsPanel` and `ContextualRouteLink`; six dead-code findings are inherited.
- [x] INTEGRATED — Source commit `d163bfa85479fb7efb465a8a675141cdc4e50f17` is pushed to GitHub `main`; local, tracking and remote main match.
- [x] BUILT / DEPLOYED / RUNTIME_VERIFIED — Canonical command `VITE_SENTRY_ENVIRONMENT=production NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current ~/.local/bin/nexi-admin-with-secrets pnpm run build` passed Vite client, SSR and Nitro. `/srv/nexi/admin/current/NEXI_RELEASE_SHA` matches `d163bfa85479fb7efb465a8a675141cdc4e50f17`; `nexi-admin.service` active with zero restarts. Admin root redirects to `/overview`, overview returns 200, API `/readyz` returns 200 and unauthenticated `api.nexitrading.app/admin/me` returns 401. The temporary first HTTPS probe raced service startup; post-start probes succeeded. Retained rollback archive checksum: `a2bab873521f9d73a2ca99d5b89c99e40e0e65e8424af9f0535a50c593099fad`.
- [x] SENTRY — Release `d163bfa85479fb7efb465a8a675141cdc4e50f17` client/SSR/Nitro artifact bundles uploaded and processed; release issue search returned no issues. Some generated chunks had no source-map reference, so complete mapping is not claimed.
- [ ] BROWSER_VERIFIED / OWNER_ACCEPTED — Authenticated Admin browser control was unavailable (`127.0.0.1:5859` connection failure). No rendered desktop/mobile screenshot or authenticated visual acceptance is claimed; owner review remains next. Reference prototype screenshots: `/tmp/nexi-admin-visual-handoff-20261022/reference-desktop-1440.png` and `/tmp/nexi-admin-visual-handoff-20261022/reference-mobile-390.png`.

### Admin UI follow-on release — 2026-10-22

- [x] Committed and pushed Admin UI refinements as `8977545dfca13f83d6bd63b4bcd4fe069d3ce2c9`: actionable, permission-filtered Overview work queue; Binary Ongoing view defaults to open/settling positions; Messages conversation inbox and selected thread; accessible table filters.
- [x] Focused Admin typecheck, provider/UI suite (9/9), changed-file ESLint, Prettier, and `git diff --check` passed.
- [x] Canonical Admin Vite client, SSR, and Nitro build passed at `/srv/nexi/admin/current` using pnpm 12.14.0 and the existing shared store. Sentry client/SSR bundles uploaded for the exact source release. One script in each bundle lacked an auto-detected source-map reference; full mapping is not claimed.
- [x] Admin deployed: `/srv/nexi/admin/current/NEXI_RELEASE_SHA` matches `8977545dfca13f83d6bd63b4bcd4fe069d3ce2c9`; `nexi-admin.service` active, zero restarts; HTTPS `/overview` 200; built Messages asset served; unauthenticated `/admin/me` 401. Release-matched Sentry issue search returned none.
- [x] Retained and verified rollback artifact `/srv/nexi/admin/shared/rollback-admin-d163bfa-20261022.tar.gz` (SHA-256 `9a3390d37751853e3942dc8699dab6e1f5278b06143c3f5115ea034f8c2c6df6`).
- [ ] Authenticated rendered browser acceptance and owner acceptance remain open. No Backend/Public deployment or production SQLite migration was performed.


### Cross-surface source integration follow-up — 2026-10-23

- [x] Worker-0 `@nexi-graphify` MCP reused successfully (6,429 nodes / 17,747 edges); Communications, Binary, and Public Settings source connections were checked against direct provider/controller/consumer paths. Receipt: [admin-public-cross-surface-integration-20261023.md](evidence/admin-public-cross-surface-integration-20261023.md).
- [x] Focused Backend Messages/guard tests passed 11/11; Admin direct TypeScript and changed-file ESLint passed; Public Communications contract passed 1/1. Prior provider/Public/UI checks and unchanged Binary/settings proofs were reused.
- [x] Source commit `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` pushed. Canonical Backend build and Admin Vite client/SSR/Nitro build passed; unchanged Public artifact reused.
- [x] Backend/Admin deployed at `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`; health, Public Settings, Admin Messages page/bundle, and unauthenticated Messages permission boundaries verified. Rollback rehearsals passed; migration 0017 already applied and no DB mutation performed.
- [ ] Later browser phase: authenticated Messages thread/reply plus full Admin/Public acceptance. Sentry source-map association remains partial for generated chunks. Public feature flags remain excluded without an approved named consumer contract.


## 2026-10-23 11:48 UTC — Authenticated Public cache follow-up

- [x] P2.1 `SOURCE_IMPLEMENTED` / `TESTED`: fix authenticated ETag revalidation across Public Axios and the shared NestJS JWT guard. Focused Backend test 1/1, Public auth-session test 8/8, Backend/Public production-config type checks exit 0. Graphify refreshed.
- [ ] P2.1 `DEPLOYED` / post-release `BROWSER_VERIFIED`: existing 5858 Network evidence shows `/auth/me`, `/wallet/overview`, `/wallet/activity` 304 responses and a cached representation on deployed old code; current page reload produced no new auth/wallet API request. The local fix is committed in `88ede5f`; await a separately authorized coordinated release and capture a fresh app request before claiming browser acceptance.
- [ ] Continue only open Admin/Public/communications scenarios; retain existing authenticated tabs and do not request wallet signatures unless a real signature prompt is reached.


- [x] P2.1 reviewed authentication/cache repair committed to local `main` as `88ede5f`; no push or deployment. `origin/main` is unchanged at `8084d860d9672c4de5c3bdbee2b96513db4b2b14`.


## 2026-10-23 11:56 UTC — Browser fan-in correction

- [x] P2.2 browser evidence: AAPL stock profile, truthful About NEXI, and five Binary durations inspected on the existing 440×956 Public tab; no financial/wallet action. Admin `/binary` and eight-workspace nav read on the existing 1500×816 tab.
- [ ] P2.1 causal closure: 304s were observed on authenticated requests, but a cached JSON representation was present and the live wallet rendered normally. Do not assert 304 alone caused the earlier unavailable state. After a separately authorized release, verify the new no-cache/private-no-store behavior and real wallet state.
- [ ] P1.1 Admin mobile visual comparison and restricted-role denial remain open; no lower-role identity. P1.2 remains fixture-limited (no eligible position). P3.2 remains fixture/authority-limited (no controlled message thread).
- [ ] P2.6 Learn category remains active because the existing API/Admin UI supports list/create only. The next source slice, if selected, is a category status-update endpoint plus Admin control; no direct SQLite write.


- [x] P1.1 Admin mobile slice: 390×844 comparison against approved Trading reference; hamburger navigation exposes all eight workspaces, with Super Admin/API state confirmed. Live deployed `Binary Trading` heading truncates; current local `a1746f9` fix is tested but awaits release/post-release verification.

## 2026-10-23 12:06 UTC — Continuation boundary

- [x] Existing Admin mapping/mobile repair commit `a1746f94ab41d4dbc864677603701b0f8dc3d45d` and Public auth/cache commit `88ede5ff18e61e270c659a43b2dbbb21bee0a323` are local on `main`; neither was pushed or deployed in this continuation.
- [ ] Public auth/cache browser closure: retrieve a fresh authenticated API request after an authorized coordinated release; current existing page DOM and older 304/cache entries do not prove fresh account data or authentication.
- [ ] Refresh Worker-0 release/service identities before any release action. `ssh nexi-vps` did not resolve from the current host; this documentation commit does not authorize a production operation.
- [ ] Remaining acceptance: approved Admin Cloud Browser visual/functional pass, TEST_ONLY Learn category status path, controlled Messages thread, eligible Binary position, permitted lower-role identity, broader Public authenticated flows, and owner acceptance.

## 2026-10-23 12:12 UTC — Public Settings verification

- [x] P2.5/P2.7 partial: Profile rendered Identity verification/VIP/Referral; Security rendered Sessions/password/MFA controls; Notifications rendered four controls with 50px rows and no horizontal overflow at 440×956. Keyboard ArrowRight moved Notifications selection to About. No account or security mutation. Receipt: [browser progress](evidence/nexi-browser-acceptance-progress-20261023.md).
- [ ] Continue P2.5/P2.7 with KYC status semantics and remaining service/settings states; do not use wallet or security write controls without explicit authorization.

## 2026-10-23 12:14 UTC — Wallet and accessibility slice

- [x] P2.4 partial: Wallet showed five accounts and Activity History at 440×956 without a locked/unavailable/no-auth fallback. Five-item mobile dock links measured 81×44px with no horizontal overflow. Lighthouse accessibility snapshot scored 100; no wallet values/actions were inspected. Receipt: [browser progress](evidence/nexi-browser-acceptance-progress-20261023.md).
- [ ] P2.4 remains open for fresh wallet API/body proof, all five account read states, and read-only deposit/withdrawal/transfer/convert/Activity flows; no financial writes without explicit authorization.

## 2026-10-23 12:16 UTC — KYC profile structure

- [x] P2.5 rendered structure: Identity verification/status field and document controls present at 440×956; no document submitted. Receipt: [browser progress](evidence/nexi-browser-acceptance-progress-20261023.md).
- [ ] P2.5 status value, submission, review, and persisted readback remain unverified; use only an authorized controlled identity and document set.

## 2026-10-23 12:20 UTC — Spot book/trades evidence

- [x] P2.3 partial: live order-book status and empty Recent trades state observed at 440×956; orderbook/trades endpoints returned 304 and Socket.IO polling returned 200. No order submitted.
- [ ] P2.3 remains open for fresh trade/order-book payload proof and reconnect/event behavior; 304s and polling handshake alone do not prove freshness or realtime updates.

## 2026-10-23 12:22 UTC — Wallet refresh request

- [x] P2.1/P2.4 request path: existing app Refresh control triggered `/auth/refresh` 201 and auth/wallet reads 304; no account body values inspected.
- [ ] Cache cause and fresh wallet data remain open; the 304s may use cached representations. Verify the fixed source only after a separately authorized coordinated release.

## 2026-10-23 15:10 UTC — Next frontier after release checkpoint

- [x] Commit and preserve the reviewed application/evidence batch through `3bb57e02ea921531975124ce2c827382a9f1ec6b` on local `main` (nine commits, 21 tracked files); do not push unless separately requested.
- [x] Run the focused Backend 1/1, Public 8/8, and Admin 10/10 checks and one canonical release build per changed surface.
- [x] Deploy Backend → Public → Admin; verify source/build markers, active services, rollback artifacts, readiness/HTTPS routes, and exact-release Sentry search. Browser receipts verify the existing Public session's auth/wallet reads and Admin's authenticated eight-workspace shell.
- [ ] Resume P1 Admin acceptance with the approved mobile visual comparison after the Admin repair, route persistence/loading/error states, permitted lower-role denial, and eligible selected-position fixture if available.
- [ ] Resume P2 Public acceptance across remaining authenticated routes, wallet/provider matrix, safe read-only flows, KYC/status, market freshness and realtime reconnect. Current-session `/auth/me` 200 is a bounded existing-session result, not complete multi-wallet acceptance.
- [ ] Resolve P2.6 Learn-category lifecycle through a reviewed status endpoint and Admin control, or document the separately authorized data-operation dependency; do not write SQLite directly.
- [ ] Resume P3.2 only with an authorized controlled Messages conversation; verify Public/Admin same-thread send/reply/history/reconnect. Do not create or message a customer conversation.
- [x] Diagnose and repair the source-level NestJS Socket.IO adapter close mismatch causing shutdown disposal to skip gateway closure; regression test and typecheck pass. Live graceful shutdown still requires an authorized controlled maintenance window. Receipt: [Backend shutdown fix](evidence/nexi-backend-shutdown-fix-20261023.md).
- [ ] Obtain final owner acceptance. Keep all four economic gates `OWNER_ACCEPTED_UNTESTED`; no signatures, transfers, orders, settlement overrides, migrations, or financial operations were part of this release.

Detailed exact artifact/build/browser/Sentry/rollback evidence: [2026-10-23 coordinated release checkpoint](evidence/nexi-coordinated-release-checkpoint-20261023.md).

## 2026-10-23 15:28 UTC — Release closeout follow-through

- [x] Remove only this release's regenerable build caches: Public Webpack/type-build cache and Admin temporary SSR build workspace. Keep canonical outputs, older cache entries, dependencies, rollback archives, and unrelated temporary session evidence. Free space after cleanup: 4,676,288,512 bytes.
- [x] Recheck all three deployed markers, active services, API readiness, Public dashboard/wallet, and Admin Overview/Messages after cleanup; all returned expected identities/statuses.
- [x] Fetch `origin/main` before publication; no divergence, local `main` was ten commits ahead. Push was explicitly authorized by the owner for this closeout.
- [ ] Finish remaining authenticated Admin/Public owner acceptance, controlled Messages, Learn-category status path, and Backend graceful-shutdown investigation as listed above; this release closeout does not mark those items complete.

Evidence: [coordinated release checkpoint](evidence/nexi-coordinated-release-checkpoint-20261023.md).

### Backend Learn authorization / Outbox follow-through — 2026-10-23

- [x] Category creation now enforces Admin auth surface and `learn.publish`; category status, audit, and idempotent Outbox event now commit atomically.
- [x] Focused Learn tests 8/8; source-only TypeScript check passed; Fallow found 0 issues; `git diff --check` passed. Full proof: [backend Learn correction](evidence/nexi-backend-learn-authorization-outbox-20261023.md).
- [ ] Backend ESLint could not run because no Backend ESLint config is present. No build, deployment, runtime/browser check, or production DB mutation occurred.

## 2026-10-24 — Current integrated release status

- [x] P2.6 Learn-category lifecycle: fixed the Admin expected/current status inversion, deployed the Admin source repair, and used the authenticated Admin UI to set the approved test-only category to INACTIVE. Admin readback showed INACTIVE and the Public category endpoint returned an empty list. See [integrated release follow-through](evidence/nexi-integrated-release-followthrough-20261024.md).
- [x] Backend shutdown runtime check: controlled restart completed without the prior systemd timeout; shutdown hooks logged Socket.IO adapter closure, and `/ops/ready` returned 200 with database and Redis ready. Startup briefly returned 502 before binding; it recovered without another restart.
- [x] Source commit `b3103ad7b07937616815b487efa212b324bdbce2` is pushed and deployed to Admin. Backend remains at `20d10c4d85bb733ae4bba680ad919fc35b98e344`; Public remains on build `3bb57e02ea921531975124ce2c827382a9f1ec6b`. Exact service IDs, checks, Sentry and rollback details are in the 2026-10-24 receipt.
- [ ] Keep P1/P2/P3 owner acceptance open for controlled Messages, lower-role Admin permissions, eligible open Binary position, broader Public wallet/KYC/realtime cases, responsive reference comparisons, and final owner acceptance. Do not perform wallet signatures or economic actions. Preserve four `OWNER_ACCEPTED_UNTESTED` gates.

## 2026-10-24 — Backend workflow hardening

- [x] Specialist-first routing instructions added to `backend/AGENTS.md` and checked against the Learn-status and graceful-shutdown historical scenarios without reopening either repair.
- [x] Skill paths and backend lockfile versions checked. Standalone BullMQ skill absent; Vibe Workflow/Redis and current official package documentation are the routed fallback. No direct Capability Orchestrator/Coordinator MCP or Promptfoo tool is exposed; the Coordinator claim board list CLI worked.
- [x] Read-only scenario results and evidence limits recorded in [the routing receipt](evidence/backend-specialist-first-routing-20261024.md).
- [ ] No code tests/build/deploy were run because this is an instruction-only change. Whether instructions are obeyed in future tasks is not runtime-enforced or proven here.

## 2026-10-24 — P3.2 Support/chat source checkpoint (latest)

- [x] SOURCE_IMPLEMENTED / TESTED: Public Support contacts and help UI, recipient-free Public NEXI support chat, canonical Admin/Public conversation identity, explicit read receipts, Admin support contact settings, and private attachment upload/read source paths are integrated in the shared working tree.
- [x] Focused Backend communications/config/attachment tests, Admin support-contact source tests and typecheck, Public communications/UI contracts, Next route type generation + TypeScript, targeted ESLint, Graphify topology paths, Fallow scoped analysis, and `git diff --check` are recorded in [the source receipt](evidence/nexi-support-chat-source-implementation-20261024.md).
- [ ] Not committed, built, deployed, or browser-verified. P3.2 remains OPEN for an authorized controlled Public send → Admin reply → same Public thread history/read-state/reconnect acceptance. No real customer messages, production message writes, or financial operations were performed.
- [x] Targeted `viem` dependency resolver follow-up: pinned Node 24.21.0 resolved `ws@8.18.3` from canonical `viem`, `ws@8.21.0` from `engine.io`, and nested `ws@8.18.3` from `socket.io-adapter`. No source-reachable viem receiver was demonstrated; resolver output does not prove loaded runtime behavior. No package change; see `tasks/evidence/nexi-ws-viem-reachability-20261026.md`.


## 2026-10-27 — VPS tool and historical export hygiene

- [x] Remove stale BrowserStack, filesystem and Polypane shared-MCP registrations and retired owner-scoped binaries after checking active processes and current Chrome DevTools route.
- [x] Remove only two historical pre-cutover D1 exports (1,638,806,801 bytes), retaining import manifest and live SQLite/Valkey; record irrecoverable loss of these historical copies in `NEXI_CURRENT_STATE.md`.
- [x] Preserve active dependency stores, Codex session state and current browser-testing route; root free capacity increased to 5.5G (89% used). All three services remained active.
- [ ] Browser acceptance and remaining release verification remain separate; tool cleanup is not acceptance proof.

## 2026-10-30 — SentinelX final bounded source-readiness decision

At final intake, `HEAD`, local `origin/main`, and GitHub `main` matched `081a694516c4bd204ed651240ef38a7ef4e8f536`; worktree was clean. Source checks reconfirmed Admin auth one-time refresh/retry and mutation read-back, the Admin Margin failure message, Public market chart Live/Error/Closed mapping, and Communications Redis retry/shutdown logic. Previously recorded direct TypeScript-AST method/path correspondence (256 OpenAPI operations, 80 Public call sites, 52 Admin provider paths), updated response-contract/DTO work, relevant source traces and focused test receipts were reused within their original scopes. No newly confirmed material source mismatch emerged in these bounded consumer/provider paths; no application source change or new test was justified. Known Admin offset-pagination shift with concurrent inserts is a NONBLOCKING_LIMITATION. Live authenticated behavior, realtime event delivery, and browser/deployment evidence are RUNTIME_ONLY_UNKNOWN. Four financial gates retain OWNER_ACCEPTED_UNTESTED. Earlier [skip ci] commits do not prove CI passed.

Decision: `SOURCE_INTEGRATION_READY_FOR_BUILD = YES` for the defined reviewed source scope, candidate `081a694516c4bd204ed651240ef38a7ef4e8f536` (or a later documentation-only SHA after this receipt), subject to separate owner build/deploy approval. This is not universal field-by-field runtime API validation and is not deployment approval. No build, deployment, service restart, database migration, financial action, queue mutation, browser or broad scan was performed. Current source-edit ownership was not transferred by modifying historical Codex Coordinator claims; no Codex source-writing subprocess was observed, and the claims remain advisory active records.

## 2026-10-30 — deployed coordinated three-surface source candidate

Owner-authorized Backend → Public → Admin build and deployment of `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` completed. All three RELEASE_SHA markers match; Public BUILD_ID `uljjzCtkvCSVGUPLSIB3x`. Services active, NRestarts=0; /ops/live, /readyz, /dashboard and /overview HTTP 200; /readyz SQLite and Redis ready. Unauthenticated /auth/me, /admin/me, /wallet/activity each 401; Socket.IO polling 200. Admin Sentry upload 124 files; Sentry release-filtered error search returned no stored events at inspection. Current release was not browser/authenticated-functionally accepted. Public remote Sentry upload and event symbolication unknown. Regenerated Public webpack cache (~1.3GiB) and one task temporary readiness file removed; disk free ~2.7GiB. No migration, financial action, queue mutation, rollback archive, or GitHub CI run. Four owner-accepted financial gates stay OWNER_ACCEPTED_UNTESTED. Receipt: [three-surface release 2026-10-30](tasks/evidence/nexi-three-surface-release-20261030.md).
