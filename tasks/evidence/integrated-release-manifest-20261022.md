# NEXI Integrated Release Manifest — 2026-10-22

## Source and retained builds

- GitHub `main` and canonical checkout: `982ca778106b1a51682982c2efc2bbbf52ce9c77`; worktree clean at verification.
- Application source used to build: `8f1d830ddb479b7c0823cdf8e48aebde7f79cb4d`. The delta from that commit to current `main` changes only task/release documentation; `Admin/`, `frontend/`, and `backend/` are identical.
- Backend: `/home/mellonelay1999/workspaces/Nexi/backend/dist/src/main.js`; `npm run build` (`nest build`) passed. NestJS 12 / Prisma Client and CLI 7.3.0; backend service runtime is Node 24.21.0. Build entry SHA-256 `95f8934947e2a4bb7df6e7beacc5ea57e20ede1de78930bd5c899a2d71997608`.
- Public: `/home/mellonelay1999/workspaces/Nexi/frontend/.next`; Next.js 16.4.1 / React 19.3 Webpack production build and `node scripts/prepare-standalone-assets.mjs` passed; standalone asset checks 2/2. `BUILD_ID` is the exact application source SHA above. Standalone entry SHA-256 `14dbfa86c554b1c78059ae9f583f2e21e880467e78b62fa2265761a7753ab4dc`. Uses `/srv/nexi/public/shared/node_modules`.
- Admin: `/home/mellonelay1999/workspaces/Nexi/Admin/.output`; React 19 / TanStack Router + Start + Query, Vite 8, Nitro 3 beta; TypeScript passed and `pnpm run build` completed Vite client, SSR and Nitro. Nitro entry SHA-256 `473746eb95b59f4fda8930ba1f9a92d28335e860bf33c2fbac7fe73f613bc672`. Uses `/srv/nexi/admin/shared/node_modules`. The pnpm pre-script emitted the known workspace-hoist/symlink verification warning; this was not a frozen-install proof.
- The source build shell used Node 22.23.2; the live API service runs Node 24.21.0. Existing Public/Admin runtime Node executables were identified, but their version strings were not separately checked.
- Prior focused local smoke checks passed: Admin `/` → `/overview` (307), `/overview` (200); Public `/` → `/dashboard` (307), `/dashboard` (200). Temporary local smoke processes were stopped.

## Live baseline (read-only verification)

- `nexi-api.service`: active, PID 2069734, 0 restarts; current marker `a6b5c8535d4384d309b05f2102846a8717319acf`.
- `nexi-public.service`: active, PID 2187369, 0 restarts; current build marker `db802761a97eee1b9739e146a8cf95d2cd83bed8`.
- `nexi-admin.service`: active, PID 2334611, 0 restarts; current marker `e2f7a65ea4ac870c6ea1ff6e299502430ecf5570`.
- HTTPS Public and Admin roots return 307 to their dashboards. API `/readyz` returns 200; unauthenticated `/admin/me` returns 401. All five new Public configuration endpoints (navigation, routes, banners, Quotes categories, localization) return 404 on the current live API.
- No production service, runtime artifact, or promoted SQLite state was modified during this validation.

## Dependency and rollout order

1. Guarded Binary migration `0017` on promoted SQLite must be backed up to a protected, restorable destination and run in a quiesced window using `backend/scripts/binary_research_controls_migrate.py`.
2. Deploy the matching NestJS source/build and verify database compatibility, readiness, authenticated contracts, and Public settings readback.
3. Deploy Public Next.js and verify its settings API consumers against that backend.
4. Deploy Admin Nitro last and verify the API/provider contract.

The production migration is the only identified data-protection dependency. The promoted database was previously measured at about 11.9 GB, while current filesystem headroom is about 2.6 GiB; existing GCS list and GCE disk-inspection attempts were denied. No backup acknowledgment was fabricated and no migration was run. An existing Admin rollback archive was previously checksum/restoration verified at `/srv/nexi/admin/shared/rollback-admin-e2f7a65-20261022.tar.gz` (SHA-256 `a2bab873521f9d73a2ca99d5b89c99e40e0e65e8424af9f0535a50c593099fad`). Backend/Public rollback artifacts have not been freshly validated for this release.

## Sentry

- Admin Sentry release `8f1d830ddb479b7c0823cdf8e48aebde7f79cb4d` exists in organization `mellonelay`, project `nexi`; the build used the existing 1Password wrapper without displaying credentials. Three artifact bundles uploaded and server-side processing completed. Sentry release details show no deploys and no new issues; release-scoped issue search returned no matches.
- Build upload report: client bundle reported 64 source-map-linked scripts and 1 JavaScript chunk without a map reference; SSR reported 61 scripts without maps; Nitro reported 82 scripts without maps. Thus 143 warnings concern server/SSR output and 1 concerns a client script. The log does not map that client script to a named emitted asset, so complete browser source-map coverage is **unverified**; no source-map repair is justified from the available retained evidence. Admin emitted maps were deleted after upload by the configured plugin.
- Public release/source-map upload was not performed. Its source build completed with release/environment variables configured; that is not upload evidence.
- Backend release `NEXI-17` is a separate backend runtime issue and has not been verified against a new deployed backend release.

## Acceptance boundary

- `TESTED`: retained focused source/build/local-smoke evidence above, scoped to the recorded source.
- `STATICALLY_VALIDATED`: source-to-build identity and artifact existence checked; no new source changed.
- `DEPLOYED` / `RUNTIME_VERIFIED`: **not achieved for source `8f1d830`**. Current live service markers still identify older builds.
- `BROWSER_VERIFIED` / `OWNER_ACCEPTED`: not claimed.
- Migration `0017`: `BLOCKED_WITH_EVIDENCE` pending a protected, restorable recovery destination and controlled quiescence.

## Follow-up — Admin source maps and build-path correction (2026-10-22)

- Source commit `cbb52c196b94abe05f87bbf779f3b5b69152af62` adds Nitro source-map generation and post-upload map cleanup to `Admin/vite.config.ts`; it was pushed to `main` in the subsequent documentation/evidence commit `d5692a818b5ba3556693c085a1ff9d70dd805d1a`.
- `pnpm exec tsc --noEmit --incremental false` passed. The existing 1Password wrapper ran `pnpm run build` through Vite client, SSR and Nitro successfully for this source, and uploaded three bundles under the matching Sentry release. This was **not a canonical release build**: `NEXI_ADMIN_OUTPUT_DIR` was omitted, so output went to `Admin/.output` instead of `/srv/nexi/admin/current`. Do not deploy or identify this artifact as canonical.
- Diagnostic Nitro entry SHA-256: `9cd2bd52f2a6970b7288188dbe8dfe5db13a1cf100244dabf378d3cd3ce52575`. The source-tree output has no remaining `.map` files after upload. The build also created/updated `Admin/node_modules/.nitro/vite/` inside the symlinked shared Admin dependency store (59 maps, 121 files, 2.9 MB); it is retained and must not be removed by broad cleanup.
- Sentry release `cbb52c196b94abe05f87bbf779f3b5b69152af62` exists; three bundles completed processing, release has no deploys/commits, and the new-issue lookup returned zero. Map associations were partial and unmatched-script warnings remained; full symbolication is unverified. No Sentry credential was printed.
- Dependency path check: `Admin/node_modules` resolves to `/srv/nexi/admin/shared/node_modules`; installed `@tanstack/router-core@1.171.37` and `@tanstack/history@1.162.5` match `Admin/pnpm-lock.yaml`. The checked-in Admin npm lock resolves older TanStack versions and Bun lock is also non-authoritative; `Admin/package.json` now pins pnpm `12.14.0`, and Admin instructions name `pnpm-lock.yaml` as the Worker-0 authority. Public source dependency link resolves to `/srv/nexi/public/shared/node_modules`. `/srv/nexi/backend/node_modules` resolves to `/srv/nexi/backend/shared/node_modules`; the checkout's physical `backend/node_modules` is outside that runtime symlink claim and was left untouched.
- Current Admin build instructions now require `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current pnpm run build` for the one canonical Worker-0 production build, only after source readiness and applicable release authorization. The Public stack note was corrected to the versions in its current manifest/lockfile.
- No service, live runtime directory or promoted SQLite was changed. The canonical Admin build, deployment, runtime revision, authenticated API behavior and browser acceptance remain unverified. The five Public Settings API paths still require a compatible backend release; migration 0017 remains its own protected-backup/quiescence dependency.

## Current deployment receipt — 2026-10-22 12:30 UTC

This section supersedes the earlier pre-deployment baseline above. The build input was committed `main@6507cf16a8cd863048b12aa56b23fd43435695ec`; subsequent task-record commits are documentation-only.

- **Backend:** reused unchanged deployed artifact `/srv/nexi/backend/dist/src/main.js`, marker `9473e1393ada0c7398ad1aca27e822b2d6d00975`. `backend/` source has no diff from that deployed marker. API service active, 0 restarts, `/readyz` HTTP 200. No rebuild or restart.
- **Public:** canonical `/srv/nexi/public/current/.next`, Next.js 16.4.1 Webpack build and standalone asset preparation passed. `RELEASE_SHA` and `.next/BUILD_ID` both equal `6507cf16a8cd863048b12aa56b23fd43435695ec`. `nexi-public.service` active, 0 restarts; root 307 to `/dashboard`, dashboard 200. The five API config endpoints (navigation, routes, banners, quotes-categories, localization) each return 200. `current/node_modules` remains linked to `/srv/nexi/public/shared/node_modules`.
- **Admin:** canonical `/srv/nexi/admin/current`; TypeScript ran through the build script and Vite client, SSR and Nitro completed. `NEXI_RELEASE_SHA` equals `6507cf16a8cd863048b12aa56b23fd43435695ec`; `server/index.mjs` exists. `nexi-admin.service` active, 0 restarts; root 307 to `/overview`, overview 200; unauthenticated `/admin/me` returns 401. `Admin/node_modules` remains linked to `/srv/nexi/admin/shared/node_modules`.
- **Binary migration:** read-only guarded-runner result `ALREADY_APPLIED schema_matches=yes`; no migration was applied by this release task and no SQLite write occurred. The earlier `DRY_RUN/READY` state in the baseline is superseded.
- **Sentry:** release `6507cf16a8cd863048b12aa56b23fd43435695ec` created in `mellonelay/nexi`; Public and Admin upload logs report artifact-bundle upload and processing completed. Release details show 0 new issues and no deploy record; exact-release production error search for 24h returned no events. Upload output still had unmatched generated JS chunks; complete source-map association is not claimed.
- **Build notices:** Public emitted a missing `@react-native-async-storage/async-storage` resolution from the MetaMask SDK browser bundle and 27 tracing notices for external shared-store paths. The production server ran and the dashboard/API checks passed; wallet connector behavior remains browser-unverified. Admin pnpm printed a non-fatal pre-script dependency-verification warning because the required `node_modules` path is a shared-store symlink; the command continued and the complete Vite/SSR/Nitro build returned exit 0 without replacing the symlink.
- **Storage/dependencies:** the ignored 1.1 GB source-tree `frontend/.next` duplicate and noncanonical `Admin/.output` diagnostic tree were removed after confirming the canonical runtime and rollback were separate. Public, Admin and Backend retain their three separate application-specific shared dependency stores. Checkout-only Backend `node_modules` was not removed. Verified rollback archives remain retained: Public `/srv/nexi/public/shared/rollback-public-db802761-20261022.tar.gz` SHA-256 `45e833045018b8c2d3e3ad4d67591a527a5f75be0519542d83746138b647fa34`; Admin `/srv/nexi/admin/shared/rollback-admin-e2f7a65-20261022.tar.gz` SHA-256 `a2bab873521f9d73a2ca99f6e299502430e0e65e8424af9f0535a50c593099fad`.
- **Acceptance:** deployed and runtime-verified for Public/Admin; backend runtime reused and verified. No browser acceptance or owner acceptance is claimed.
