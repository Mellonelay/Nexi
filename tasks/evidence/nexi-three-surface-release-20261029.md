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
- Before browser verification, removed regenerated `/srv/nexi/public/current/.next/cache/webpack` (about 1.3 GiB) and this session's `/tmp/nexi-api-readyz.json`; preserved historical `/tmp/nexi-ready-body`. Free space rose from 103 MiB to 1.4 GiB. All three services remained active with zero restarts and the four HTTPS endpoints still returned 200.
- **`BROWSER_VERIFIED`: not established.** Chrome DevTools MCP `list_pages` timed out twice after 60 seconds. Existing Chrome/profile was running and port 9222 was listening, but `/json/version` and `/json/list` returned 404. No browser page was inspected or changed; no alternate controller was used. Resume after repairing the existing MCP/CDP connection.
- `OWNER_ACCEPTED`: not established. Four previously closed financial requirements remain `OWNER_ACCEPTED_UNTESTED`.
- Disk reached 100% reported use during builds. The owner directed that engineering-tool/recovery cleanup be deferred; this receipt does not claim storage recovery or rollback readiness.
