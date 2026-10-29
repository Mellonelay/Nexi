# NEXI Three-Surface Release Receipt — 2026-10-29

## Release identity

- Candidate Git source at build time: `7e434daab146fe9c297c04e46ba9d4a0ee81401d`; `main` and `origin/main` matched and the checkout was clean.
- Application source content matched the previously tested PR #93 merge `975a3fc89172d13758957ef5910166042ae890bc`; `7e434da` added documentation only.
- Owner explicitly authorized stopping all three active services, building and deploying, and overriding the ordinary capacity/rollback-readiness gates for this release. No migration or financial operation was authorized or performed.
- `ROLLBACK_PREPARATION=OWNER_DEFERRED` remains unresolved. Rollback artifacts were not inspected, replaced, or deleted.

## Builds and artifacts

| Surface | Canonical build | Artifact/source identity | Result |
|---|---|---|---|
| Backend | `/srv/nexi/backend`, Node 24.21.0/npm 11.19.0, `npm run build` | `RELEASE_SHA=7e434daab146fe9c297c04e46ba9d4a0ee81401d` | `nest build` passed. Shared dependencies reconciled to Prisma client, adapter, and CLI 7.10.1. Native better-sqlite3 in-memory smoke returned SQLite 3.53.2; `prisma -v` loaded the configured schema and engine. |
| Public | `/srv/nexi/public/current`, Next 16.4.1, `next build --webpack` plus `prepare-standalone-assets.mjs` | `RELEASE_SHA=7e434daab146fe9c297c04e46ba9d4a0ee81401d`; `.next/BUILD_ID=UuQn8Dl0W2IZdV4BFjvSA` | Build, TypeScript, static generation, and standalone preparation passed. Warnings: optional MetaMask async-storage peer and 27 traced files outside the configured tracing root. |
| Admin | Checkout `Admin/`, pinned pnpm 12.14.0, Vite 8.3.4 → `/srv/nexi/admin/current` | `RELEASE_SHA` and `NEXI_RELEASE_SHA=7e434daab146fe9c297c04e46ba9d4a0ee81401d` | Vite/Nitro build passed with Zod 4.6.7. Sentry CLI 2.58.6 install hook was approved in the staged shared install context. Build warnings included a missing source-map reference for at least one emitted chunk. |

No Prisma schema or migration changed. No live financial data, ledger, queue, or SQLite mutation was performed.

## Runtime verification

- `nexi-api.service`, `nexi-public.service`, and `nexi-admin.service` are active; each reports `NRestarts=0` and runs `/opt/nexi/runtime/node-v24.21.0/bin/node`.
- Process environments and artifact markers match the release SHA. Public's build ID is recorded above.
- HTTPS `https://api.nexitrading.app/ops/live`, `/readyz`, `https://www.nexitrading.app/dashboard`, and `https://admin.nexitrading.app/overview` returned 200. Backend readiness reports `status=READY`, `database=true`, `redis=true`, `authority=SQLite`.
- During the first Backend start, the old Prisma 7.3.0 store emitted a market catalog helper error. The service was stopped, dependencies were reconciled to the committed 7.10.1 lock, rebuilt, and restarted. The subsequent process logged successful Nest startup and is currently ready; the initial warning belongs to the replaced process.

## Sentry

- Sentry release created and associated with repository commits; release finalized and a `production` deployment recorded for the exact SHA.
- Admin client and server artifact-bundle uploads reported success. Public generated JavaScript has Sentry debug IDs in 67 files; Admin in 62 files. Public's Sentry build integration is configured in source and ran through the authenticated build wrapper, but the plugin is silent and remote artifact lookup remains unverified with the current session.
- `sentry-cli issues list` returned HTTP 403 with the available `org:ci` credential. Fresh issue/event-group status is `ACCESS_BLOCKED`; event ingestion and line-level symbolication are `UNKNOWN`. No fake production event was sent.

## Proof boundary and remaining work

- `TESTED`: Backend build and disposable native SQLite smoke. Reused exact source CI at `975a3fc`; no full regression or historical financial campaign was repeated.
- `DEPLOYED` and `RUNTIME_VERIFIED`: all three services and endpoint checks above.
- Before browser verification, removed regenerated `/srv/nexi/public/current/.next/cache/webpack`, this session's readiness-response file, a stale temporary Admin dependency tree, an obsolete temporary Chrome profile, Node/Jest caches, pnpm registry metadata, an unused older CodeScene bundle and one exact duplicate CodeQL SARIF directory. Free space is 2.1 GiB. The active signed-in profile, canonical dependency store, current CodeScene MCP, distinct CodeQL evidence, app data and rollback artifacts were preserved.
- **`BROWSER_VERIFIED`: partial.** Chrome DevTools MCP initially timed out but later connected to the existing Chrome/profile; no browser process restart was needed. Public Dashboard rendered live Quotes Hub data and Margin UI rendered with zero positions and a disabled open-order action. Read-only `/auth/me`, open-orders, margin quote/positions, wallet overview, market prices, klines and orderbook requests returned 200. At 424×715 there was no horizontal overflow. Margin showed `Market data error` and `Chart updates paused` despite successful market-data responses; freshness/realtime is unresolved. No financial action occurred.
- Admin's pre-reload Messages view displayed stale Super Admin/conversation content while API requests returned 401. After cache-bypassing reload, `/admin/me` returned 401 and the sign-in form appeared. Owner sign-in is required to continue Admin acceptance; no stored password was used.
- On the Public route session, `/auth/wallet/challenge` and `/auth/wallet/verify` returned 201, followed by `/auth/me` 200. No wallet popup was operated or signature explicitly approved through DevTools; owner approval of any signature is not claimed. This was not a financial operation.
- `OWNER_ACCEPTED`: not established. Four previously closed financial requirements remain `OWNER_ACCEPTED_UNTESTED`.
- Disk reached 100% reported use during builds; bounded cache cleanup has since raised free space to 2.1 GiB. This is not rollback validation or long-term capacity assurance. `ROLLBACK_PREPARATION=OWNER_DEFERRED`; rollback artifacts remain untouched.

## CLI and MCP connectivity check — 2026-10-29

- CLI version probes succeeded for Codex 0.164.0, GitHub CLI 2.23.0, mcpc 0.7.0, Node 22.23.2, npm 10.9.8, pinned pnpm 12.14.0, Nest CLI 12.0.3, Prisma 7.10.1, Next.js 16.4.1, Vite 8.3.4, Sentry CLI 3.7.0, Graphify 0.9.92, and Fallow 3.30.0. GitHub auth/API and `sentry-cli info` connected successfully. Sentry issue listing remains `ACCESS_BLOCKED` (403) with the current `org:ci` token.
- `mcpc` reported live pings for Evolver, Fallow, CodeScene, Graphify and Context7. The four non-Evolver sessions were closed as requested; subsequent `mcpc --json` showed only `@nexi-evolver`, whose ping/discovery succeeded. Those servers do not implement the legacy `tasks/list` method. The separate Codex-hosted Fallow MCP process is not an mcpc session.
- Sentry MCP tool-catalog search succeeded. Chrome DevTools MCP eventually connected to the existing profile. An initial Admin Vite version probe triggered pnpm's automatic dependency check and warned that the workspace hoist path is not a real directory; rerunning with `--config.verify-deps-before-run=false` reported Vite 8.3.4. No source or dependency mutation resulted from that probe.
