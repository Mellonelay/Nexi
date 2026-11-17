# NEXI Three-Surface Production Deployment Receipt

Date: 2026-11-17 (UTC)
Repository: /home/mellonelay1999/workspaces/Nexi
Outcome: COMPLETE

## Source and build identity

Final local HEAD: `4a47810565814248365bcf8221d81cbd02146959`.
`origin/main` remained at `a71270f77c842db3c96e47f985836b4686e718c7`; the local deployment commits were not pushed.

- Backend was built from `247a38a4b7a950083cbb14dfc18ea651b5d0677d`. This commit restored the missing admin message route helper and fixed two TypeScript contract errors found by the canonical build. Backend source is unchanged between that SHA and final HEAD.
- Public and Admin were built from `4a47810565814248365bcf8221d81cbd02146959`, which includes the minimal Public route-state type correction discovered by its build.
- Backend artifact: `/srv/nexi/backend/dist/src/main.js`, SHA-256 `6f952e2ecb6acfe7a9b6535ecfb85fc703d13d848c3d2bc5cdf687fad1b041f1`; `RELEASE_SHA=247a38a4b7a950083cbb14dfc18ea651b5d0677d`.
- Public canonical artifact: `/srv/nexi/public/current/.next/standalone/server.js`, SHA-256 `28d96221eb6fe6c64c951e268332cf0d4dbc2db4a4791531e356d409efbdf35d`; Next build ID `8vCjVvKh7X-igg-NATF75`; `RELEASE_SHA=4a47810565814248365bcf8221d81cbd02146959`.
- Admin Nitro artifact: `/srv/nexi/admin/current/server/index.mjs`, SHA-256 `2e33865ec10758f25d54bb0faff0f638ecfdb7369457138a635dff4425f0a1c1`; `RELEASE_SHA=4a47810565814248365bcf8221d81cbd02146959`.

Canonical builds completed serially Backend → Public → Admin. The first Backend and Public attempts exposed the source errors described above; after minimal committed fixes, each completed build succeeded. Admin's first attempt uploaded client maps but hit root-owned generated Nitro cache permissions; only that generated cache directory's ownership was corrected, and the canonical retry completed. Its release marker was then written through the authorized SentinelX edit operation.

## Services and smoke checks

Final read-only check: `nexi-api.service`, `nexi-public.service`, and `nexi-admin.service` were all `active`, with `NRestarts=0`. Main PIDs observed: API 3501914, Public 3502024, Admin 3501610.

Production routing remains on the established local processes: Public → `127.0.0.1:3000`, Admin → `127.0.0.1:3001`, API → `127.0.0.1:3002`. Historical “staging” upstream labels were retained. API `/ops/live` and `/readyz`, Public `/dashboard`, and Admin `/overview` returned HTTPS 200. API readiness reported database and Redis healthy. Per-process release values were aligned with the built artifacts.

The service policy was narrowly updated to add `stop` for API and Admin; unrelated policy entries were preserved. A fresh SentinelX capability response confirmed the effective policy before lifecycle operations.

## Sentry

- Backend release `247a38a4b7a950083cbb14dfc18ea651b5d0677d`: commits associated, release finalized, production deployment `NEXI Backend 2026-11-17` recorded.
- Public/Admin release `4a47810565814248365bcf8221d81cbd02146959`: commits associated, release finalized, combined production deployment `NEXI Public and Admin 2026-11-17` recorded.
- Public source maps uploaded successfully: bundles `0d5812a2-2a03-5a81-a0e2-a4fbe79d6438` and `81a49759-7339-51d9-892e-aaa3c6deb6fa`.
- Admin client bundle `2f982a7e-5010-5472-a971-ff395f0cb461` was uploaded during the first attempt and present on retry; SSR bundle `352270dc-fbd7-580c-a300-fa191788e9c9` and Nitro bundle `dd1292ff-c0dc-5c10-9dce-efc95a41becb` uploaded on the successful retry. Some Admin chunks had no detectable source-map reference, so complete symbolication is not established.
- Backend emitted 194 source-map files and runs with Node source-map support, but no Backend Sentry artifact upload integration was configured in the established workflow; upload is not evidenced.
- Release-scoped 24-hour Sentry queries returned zero errors for both releases. Trace queries returned 1,320 Backend spans and 260 spans for the shared Public/Admin release. No synthetic events were generated. Public/Admin traces are not separable by surface under the shared release.

## Integrity and scope

Pinned pnpm 12.14.0 Admin lock compatibility check succeeded with frozen lockfile dry-run; it reported the lockfile up to date and made no dependency installation. Existing application-specific dependency-store links were retained. No DB migration, direct financial-data change, Ledger operation, replay, or dependency reinstall was performed. The configured SQLite file remains present and API readiness is healthy. No rollback archive or replacement deployment machinery was created.

Tracked Git worktree is clean. There are 272 untracked repository entries; they were preserved. The 113-case UI/browser acceptance campaign was not run and remains a separate assignment.

## Final volatile-state recheck

At receipt preparation, final HEAD remained `4a47810565814248365bcf8221d81cbd02146959`; all three services were active with zero restarts, and the four HTTPS smoke checks above returned 200.

Evidence path: `/home/mellonelay1999/workspaces/Nexi/tasks/evidence/NEXI_THREE_SURFACE_DEPLOYMENT_20261117.md`
