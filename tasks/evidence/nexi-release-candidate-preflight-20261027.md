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

## 2026-10-26 source-map instrumentation follow-up

- **IMPLEMENTED, NOT BUILT/DEPLOYED:** `backend/src/main.ts` imports `./instrument` before Nest/application modules. `backend/src/instrument.ts` now calls `process.setSourceMapsEnabled(true)` after importing Sentry and before `Sentry.init`, enabling Node stack-trace source-map support for application modules loaded afterward. Node 24.21.0 documents this API as experimental and says it only loads maps for modules loaded after activation; the non-experimental `node:module.setSourceMapsSupport()` is unavailable in the installed `@types/node@20.19.30`. The startup flag `--enable-source-maps` remains the preferred way to cover modules loaded before instrumentation and must be considered in the coordinated runtime configuration.
- The deployed Backend artifact and actual Sentry symbolication remain unverified for this source change. No build, service restart, deployment, upload, or event was performed.
- **Checks actually run:** NestJS Doctor 0.9.10, `--scope changed --base origin/main --verbose --no-telemetry`: 85/100, no issues found, 191 files scanned. The `$nestjs-code-audit` read-only collector on `src/instrument.ts` returned no review candidates. Its lint gate could not run because Backend ESLint configuration is absent; repository-wide `tsc --noEmit` failed on existing test-file/configuration diagnostics, not a reported `instrument.ts` error. React Doctor 0.9.18 previously scanned the four Public/Admin Sentry integration config files and found no issues; that is not a full frontend scan. The Vercel Next.js/React skill was read and applied to keep the frontend check limited to its actual Next.js/React surface.
- Graphify repository refresh completed after the source edit: 6,977 nodes, 18,451 edges, 292 communities. Nineteen SQL files contributed no symbols because `tree_sitter_sql` is not installed; no parser was installed.
- **Fresh bounded VM/Sentry check (2026-10-26):** all three systemd units reported active with zero restarts; Backend PID 3333918 was in `Dsl` (`folio_wait_bit_common`) during the process snapshot. A single local `/readyz` probe returned HTTP 200 in 0.316 s with SQLite and Redis ready. This is point-in-time evidence and does not establish sustained I/O recovery. RAM available was 3.9 GiB, swap free 3.2 GiB, root free 2.9 GiB; I/O PSI full avg10 was 20.55%. No build or restart was attempted.
- **Sentry authorization/capability check:** `sentry-cli 3.7.0 info` authenticated to `mellonelay/nexi` and reported only `org:ci`. Sentry's current scope documentation says `org:ci` supports CI release/source-map operations, while `sentry-cli` release management also requires `org:read`; that scope was not shown, so CLI release-management authorization is not established. The Sentry MCP can read the current user and releases, but its discovered release tools are `find_releases` and `get_release_details`; no release creation, commit association, artifact upload, finalize, or deploy operation was exposed. The current committed release query for `5f84560` returned no release, as expected for this uncommitted change set. Do not create an external release until the exact committed SHA and authorized lifecycle route are ready.
- **1Password CLI follow-up (2026-10-26 22:43 UTC):** per owner direction, checked the installed `op` CLI rather than 1Password MCP. `op` is v2.41.0 and supports `op run --environment <environment-id>`, but the CLI reports no accounts configured; `op signin` offered desktop app integration or manual account setup. I canceled before entering credentials. The current shell has neither `OP_*` nor `SENTRY_*` variables. The owner reports the Sentry CLI token is in a 1Password Environment, but this CLI session cannot access it until an authorized 1Password account/app integration or service-account route is available and the Environment ID is known. No token value was read, displayed, or written. Official CLI guide: https://developer.1password.com/docs/cli/secrets-scripts/.
- **Fallow 3.30.0:** `check_changed` against `origin/main` at Backend scope applied to one changed file and reported no import, cycle, boundary, or policy findings in the measured categories. Analysis was degraded because one 4.5 MB generated minified WASM JavaScript file was skipped and no rule packs are configured. It reported dependency candidates outside `instrument.ts`; none was removed because their references are not established by this changed-file run. This is bounded changed-code analysis, not dependency-cleanup approval.

## 2026-10-26 commit and post-push reconciliation

- The source-map correction and the five-file evidence/frontier set were committed as `5fa0784a95800e918f0fbfab20d373947d325e52` (`fix: enable backend source map support`) and pushed to `origin/main`. The remote was at parent `5f84560bd72391b8050bf643426362e796ce9496` before push and accepted the fast-forward. The working tree was clean immediately after the commit.
- CodeScene `pre_commit_code_health_safeguard` passed, checking five modified files including one code-health-eligible file. Staged and complete diffs passed `git diff --check`; no token-like value was staged.
- Read-only Sentry `find_releases` for the exact pushed SHA returned no release. Current Sentry tool discovery includes `find_releases` and `get_release_details` as read-only release operations and did not expose release creation, source-map upload, finalization, or deployment. `sentry-cli 3.7.0 info` continues to report only `org:ci`.
- These Git/Sentry checks do not make the commit a built artifact or release. No application build, Sentry lifecycle mutation, deployment, restart, or browser test occurred.

## 2026-10-26 22:47 UTC live runtime and artifact identity

- Source `main`/`origin/main` was `1bc3a63941615fa1f3b8a593980dc3e192f7af9a`; working tree was clean at the check. All three systemd services were active/running with zero restarts. Each application Node process resolved to `/opt/nexi/runtime/node-v24.21.0/bin/node`; Public runs Next.js 16.4.1 under pinned Node 24.
- Local Backend `/readyz` returned `READY`, SQLite and Redis true, HTTP 200 in 0.082 seconds.
- Current deployed artifact/runtime release identities remain mismatched: Backend marker `e356a00885da9517fe8c32df12dde3e6a3e49688`, process `SENTRY_RELEASE=ace72accfe815abf5ba20df26ee57c76898d0cab`; Public marker `3bb57e02ea921531975124ce2c827382a9f1ec6b`, `.next/BUILD_ID` and server/client Sentry release `ace72accfe815abf5ba20df26ee57c76898d0cab`; Admin marker `ace72accfe815abf5ba20df26ee57c76898d0cab`, process `VITE_SENTRY_RELEASE=3bb57e02ea921531975124ce2c827382a9f1ec6b`.
- Capacity at this sample: 2.9 GiB free disk, 3.9 GiB available RAM, 3.1 GiB free swap; I/O PSI `some avg10=22.65%`, `full avg10=6.42%`. Canonical artifact sizes were not measured, so build headroom is still unestablished. No build, restart, deployment, or browser check was performed.

## 2026-10-26 22:49 UTC targeted build-capacity check

- Existing canonical deployed outputs: Backend `/srv/nexi/backend/dist` 21 MiB; Public `/srv/nexi/public/current/.next` 181 MiB; Admin `/srv/nexi/admin/current` 8.3 MiB. Measured with low-priority targeted `du`; no broad filesystem scan or cleanup.
- The prior accepted coordinated release receipt reports that its Public build generated approximately 1,011 MiB under `.next/cache/webpack` plus an 803,938-byte `.tsbuildinfo`, which was later removed as that release's regenerable cache. The Admin release generated about 2.9 MiB of temporary SSR cache. This is historical peak evidence, not a guaranteed bound for the current source/dependency graph.
- At this check, root free space was 2.9 GiB, RAM available 3.9 GiB, swap free 3.1 GiB, I/O PSI `some avg10=23.89%` / `full avg10=20.95%`. All services remained active with zero restarts; local `/readyz` returned HTTP 200 in 0.121 seconds with SQLite and Redis ready.
- A single Public build's known prior cache peak would leave roughly 1.9 GiB from the current free-space figure before additional outputs or temporary needs, but current I/O pressure is elevated and the prior peak is not a sufficient upper bound. Build headroom is therefore **not cleared**; no build, install, restart, or deployment was attempted.


## 2026-10-26 23:16 UTC — Public dependency-store correction

- **Source authority:** committed `frontend/package.json` and `frontend/package-lock.json` resolve `@sentry/nextjs@10.75.2`; neither file has a working-tree diff. Before repair, `/srv/nexi/public/shared/package-lock.json` and the installed tree resolved 10.73.0. Both `frontend/node_modules` and `/srv/nexi/public/current/node_modules` point to the canonical `/srv/nexi/public/shared/node_modules`.
- **Recovery and install:** preserved the prior shared install manifests at `/srv/nexi/public/shared/deps-store-pre-sentry-10.73.0-20261026/`; SHA-256 matched the prior shared manifest and lockfile. Staged the committed Public manifest/lockfile into the canonical shared install context and ran pinned Node 24/npm 11.19.0 `npm ci --no-audit --no-fund` there. It completed successfully (`added 1110 packages in 5m`). No new `node_modules` store or build directory was created. npm reported seven lifecycle scripts not covered by `allowScripts`; the local `@sentry/cli` 2.58.6 executable ran successfully.
- **Runtime recovery:** stopped only `nexi-public.service` for the shared-store replacement, then started it. The immediate route probe returned a transient 502 before the Next server child appeared; after the process was running, `/dashboard` returned HTTP 200 in 0.148 seconds. Service was active with `NRestarts=0`; no other service was stopped.
- **Result:** `npm ls @sentry/nextjs` shows only 10.75.2 in the installed Public dependency tree; the previously installed 10.73.0 is absent from that tree. No npm cache cleanup was performed, so cached tarballs were not targeted. This corrects the Public store mismatch only; it does not build or deploy the Public artifact or verify Sentry source-map upload.
- **Capacity observation during install:** after npm removed the old tree, root free space was 4.6 GiB; I/O PSI `full avg10` peaked at 71.51% in that sample. No build was started.

## 2026-10-26 23:29 UTC — Owner-authorized release attempt stopped before build

- **Git:** `main`, `origin/main`, and `HEAD` are `20ba4da6cc34fd8f355324bbf2ab401db2665ef0`; working tree was clean before this handoff update.
- **Resource/process sample:** RAM 7.8 GiB total / 3.6 GiB available; swap 4 GiB / 2.9 GiB free; root disk 51 GiB / 2.7 GiB free; CPU PSI `some avg10=4.01%`; I/O PSI `some avg10=28.80%`, `full avg10=21.93%`. No prior build process was present (the matching process was the sampling shell). Backend, Public, and Admin were active on pinned Node 24.21.0 with zero restarts. Worker-0 protection was 70 locked, 0 unlocked, 0 missing.
- **Concrete stop condition:** the canonical build/release contract requires a tested surface-specific rollback before replacing a live output. No Backend rollback artifact exists in `/srv/nexi/backend/shared`. The prior bounded inventory/content comparison found none of four Backend or three Public archives exactly matched current live outputs; see `tasks/evidence/nexi-final-closure-continuation-20261026.md` lines 79–80. Current owner direction forbids creating/deleting rollback archives and retains `ROLLBACK_PREPARATION = OWNER_DEFERRED`. Therefore the first in-place build/replacement was not started. Existing outputs and all services were preserved.
- **Not performed:** no build, deploy, restart, Sentry mutation/source-map upload, migration, financial mutation, cleanup, archive operation, or browser test. The Public shared Sentry dependency is already corrected to 10.75.2 as recorded above. Resume only with an existing tested recovery path or a changed owner constraint; do not repeat the prior archive comparison or completed source reviews.

## 2026-10-27 coordinated build, deploy, and reconciliation

Owner authorization superseded the prior 2026-10-26 23:29 pause. The release proceeded without inspecting, comparing, creating, or deleting rollback artifacts. `ROLLBACK_PREPARATION = OWNER_DEFERRED` remains an open recovery limitation.

### Builds and deployment

| Surface | Source SHA | Canonical build/deploy identity | Runtime verification |
|---|---|---|---|
| Backend | `20ba4da6cc34fd8f355324bbf2ab401db2665ef0` | `/srv/nexi/backend/RELEASE_SHA` matches; canonical `npm run build` succeeded with Node 24.21.0/npm 11.19.0 | `nexi-api.service` active, 0 restarts; `/ops/live` and `/readyz` returned 200 with SQLite and Redis ready. Node runs with `--enable-source-maps`. |
| Public | `943ebda18d9060fd817074a1bbb2ce4fe7d26a59` | `.next/BUILD_ID` and `/srv/nexi/public/current/RELEASE_SHA` match; canonical Next 16.4.1 Webpack build and standalone asset preparation succeeded | `nexi-public.service` active, 0 restarts; local `/dashboard` returned 200; process environment has matching `SENTRY_RELEASE` and `NEXT_PUBLIC_SENTRY_RELEASE`. |
| Admin | `943ebda18d9060fd817074a1bbb2ce4fe7d26a59` | `/srv/nexi/admin/current/RELEASE_SHA` matches; canonical Admin pnpm 12.14.0/Vite 8.3.4 build succeeded | `nexi-admin.service` active, 0 restarts; local `/overview` returned 200; release SHA appears in 62 built JS assets. |

Backend used the pinned Node 24.21.0 build and existing shared dependency store. Public's initial build failed because the unconfigured Base Account connector imported optional x402 modules absent from the accepted dependency graph. The bounded source correction in `frontend/next.config.js` aliases `@base-org/account` to `false`; Coinbase and injected wallet connectors remain configured. The corrected build succeeded. Public warnings: unresolved optional `@react-native-async-storage/async-storage` imported by MetaMask SDK; 27 standalone trace paths outside `outputFileTracingRoot`. Admin's first build command was run from the repository root and failed to resolve Vite; rerunning from `Admin/` with the pinned package manager succeeded. No migrations, financial mutations, or browser tests ran.

### Sentry

- Backend release `20ba4da6cc34fd8f355324bbf2ab401db2665ef0` was finalized and deployed to `production` as `NEXI Backend production`.
- Public/Admin release `943ebda18d9060fd817074a1bbb2ce4fe7d26a59` was finalized and deployed to `production` as `NEXI Public and Admin production`.
- A provisional short release `943ebda` was accidentally created during identity correction and then deleted; it was never finalized or deployed. The full 40-character SHA is the only deployed Public/Admin release.
- `set-commits --auto` was invoked for both releases. Sentry's release details show Backend commits; the Public/Admin release had no commit list at the time queried (its commit was local and had not yet been pushed). Re-associate after push and verify.
- Admin's Vite Sentry integration confirmed upload: 124 source files, bundle ID `0cc61521-aa24-5edc-a835-81471125ec31`, release SHA above. Processing was pending when the build ended.
- Public build-time release/environment values were explicitly set to the full SHA and `production`; the SHA is present in 11 `.next` files. The configured Next Sentry integration uses hidden maps and delete-after-upload; no maps remain under `.next/static`. Its successful upload is not independently confirmed through a Sentry artifact-bundle inventory. The classic release-files API returned 0 files for both deployed releases and does not provide artifact-bundle listing.
- Backend generated 193 `.map` files; Node native `--enable-source-maps` is active. Separate Backend Sentry map upload and event-level symbolication were not verified.
- Sentry returned no production errors and no error/warning logs for either full release in the queried 24-hour window. No matching event was available to verify ingestion or symbolication.

### Route and runtime limitations

The VM could not resolve `nexitrading.app` during the HTTPS probe. The owner directive named `/health/live`, which is not the Backend route; the registered `HealthController` path is `/ops/live`, and that liveness route returned HTTP 200. Direct local checks passed: Backend `/readyz` HTTP 200; Public `/dashboard` HTTP 200 on port 3000; Admin `/overview` HTTP 200 on port 3001. A first Admin probe used Backend port 3002 and returned 404; the correct Admin port was then verified. All three systemd services were active with `NRestarts=0` on Node 24.21.0.

The new source commit is `943ebda18d9060fd817074a1bbb2ce4fe7d26a59`; documentation reconciliation and final Git integration follow this receipt update. Worker-0 protection and final `HEAD`/`origin/main` are recorded in the final handoff. No rollback archive validation or storage cleanup was performed. The four financial gates remain `OWNER_ACCEPTED_UNTESTED`; browser acceptance remains for the next session.
