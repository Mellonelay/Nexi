# NEXI — Current VPS Architecture

## Active topology
Name.com DNS routes Public, Admin and API hostnames to VPS Nginx, which serves Public Next.js, Admin, and the NestJS API/WebSocket service.

2026-10-25 canonical toolchain/runtime addendum: NEXI source is a **single Git checkout** (`/home/mellonelay1999/workspaces/Nexi`) with Backend NestJS/Prisma/SQLite, Public Next.js 16/React, Admin TanStack Start/Router/Query + Vite/Nitro. All three systemd services now resolve Node through `/opt/nexi/runtime/node-v24.21.0/bin/node`; Public's pinned npm launcher inherits a PATH with that binary first, and Admin retains the Nitro `server/index.mjs` entry. Three **different** dependency graphs remain in `/srv/nexi/{backend,public,admin}/shared/node_modules`, with source `node_modules` links. Canonical build/run artifacts only: Backend `/srv/nexi/backend/dist`; Public `/srv/nexi/public/current/.next`; Admin `/srv/nexi/admin/current`. No isolated worktrees/tests, source checkout builds, duplicate installs, or alternative release build roots. Framework knowledge plus expected product/financial design must be established before source edits; Graphify, Semgrep and CodeQL (when eligible) supplement, not replace, design-to-source comparison. See `tasks/plan.md` and surface-specific `AGENTS.md` for commands and proof scope.
Public source is frontend/ with runtime /srv/nexi/public/current; Admin source is Admin/ with runtime /srv/nexi/admin/current; backend source is backend/ with runtime /srv/nexi/backend.
NestJS owns business decisions. Promoted SQLite at /var/lib/nexi/sqlite/nexi-staging.sqlite is durable application and financial authority. LedgerAccount/LedgerPosting own accounting truth. EventOutbox and EventInbox own durable publication and deduplication.
SQLite local durable-job and workflow journals retain async state. Aiven Valkey is BullMQ transport, Socket.IO Redis Streams and cache, never financial truth. VPS private storage holds evidence. Sentry, systemd and journald provide runtime telemetry.

## Verification and limits
Historical 2026-10-19 observation: `nexi-api.service` was active and `https://api.nexitrading.app/readyz` returned READY with database=true, redis=true, authority=SQLite. On 2026-10-25, all three services were restarted under Node 24.21.0; the API returned READY with SQLite/Redis, and canonical Public/Admin HTTPS routes returned 200. Exact process, configuration, artifact and proof-limit details are in `tasks/evidence/nexi-final-vm-consolidation-20261025.md`. Readiness does not prove financial reconciliation, complete recovery or owner acceptance.
Source renames do not deploy frontend builds or alter running services. Maintain exactly one main checkout; production changes require separate authorization and verification.
Historical migration receipts and compatibility code are retained as evidence, not active platform authority.

## Trace collection

The VPS also runs Jaeger v2.23.0 as a loopback-only trace backend. OTLP HTTP/gRPC receivers accept traces on 127.0.0.1:4318 and 127.0.0.1:4317; Jaeger Query/UI listens on 127.0.0.1:16686 (gRPC 16685). Persistent Badger trace/archive stores are under /var/lib/nexi/jaeger, with configured span TTLs of 48 hours and 720 hours. This is observability storage, not application or financial authority.

The Node OTLP HTTP exporter/instrumentation package is staged under the operator's user data and has a route allowlist/privacy filter, but the live nexi-api.service process currently has no preload for it. A smoke trace proves the local collector/storage path; it does not prove API or browser traffic is currently instrumented. See the [dated Graphify and tracing reconciliation](NEXI_GRAPHIFY_COVERAGE_20261107.md) and the [VPS runbook](../operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md).
