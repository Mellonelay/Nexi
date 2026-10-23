## CANONICAL BACKEND BUILD — 2026-10-23

Follow the root `AGENTS.md` **Canonical Worker-0 Build and Release Contract** for the shared release sequence. Backend dependency authority is `backend/package.json` plus `backend/package-lock.json`; `/srv/nexi/backend` is its only runtime/build working tree, `/srv/nexi/backend/dist` its build output, and `nexi-api.service` its service. `/srv/nexi/backend/node_modules` must remain a symlink to `/srv/nexi/backend/shared/node_modules`. The canonical checkout's `backend/node_modules` is a separate install; do not relink, replace, or install into it for a Worker-0 release.

Use the service runtime Node `/opt/nexi/runtime/node-v24.21.0/bin/node` and its npm `11.19.0`; verify with `PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH node --version` and `npm --version`. Do not use the interactive shell default, which may select another Node/npm. Do not reinstall for a normal build. If the dedicated Backend store needs reconstruction, first verify its recovery copy and stop only `nexi-api.service`; stage only the committed Backend `package.json` and `package-lock.json` in `/srv/nexi/backend/shared`, then run there with the service runtime on PATH:

```bash
PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH npm ci --legacy-peer-deps --include=dev --no-audit --no-fund
```

Never run `npm ci` in the canonical source checkout or runtime root because that can replace the runtime dependency symlink. For release, verify committed source SHA, active artifact and rollback; stop only `nexi-api.service`; sync committed Backend source into `/srv/nexi/backend` while preserving `shared/`, `node_modules`, durable SQLite files and rollback data; then build once from `/srv/nexi/backend`:

```bash
PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

Before restart, verify `dist/src/main.js`, the copied `dist/src/prisma/d1-client/**/*` runtime assets and load their entry. Set the release marker to the exact built source SHA, restart only the API, then verify SQLite/Valkey readiness, affected API contracts, process/restart stability and release identity. Database migrations and financial writes are separate guarded operations; a build/deployment does not imply them.

---
# CURRENT BACKEND OWNER OVERRIDE (2026-10-17)


# NEXI Backend Instructions

These rules extend the repository root `AGENTS.md` and govern the authoritative NestJS backend in the current synchronized NEXI checkout.

## Current backend authority
- GitHub `main` is durable backend source authority; the canonical backend source is `backend/` and the VPS runtime is `/srv/nexi/backend` under `nexi-api.service`.
- NestJS is the sole business/domain authority.
- SQLite + Prisma 7/better-sqlite3 is the promoted current durable application database. Ledger remains accounting truth; EventOutbox/EventInbox preserve durable publication/idempotent ingress.
- Aiven Valkey is the selected Redis-compatible service for BullMQ and Socket.IO Redis Streams, plus cache/ephemeral coordination; it is never financial truth.
- SQLite journal/workflow state is durable; BullMQ transports work. Private local storage holds KYC/deposit evidence.

## Current implementation objective
Complete the VPS NestJS runtime and parity acceptance while reusing existing domain modules, focused migration proofs and the canonical Public/Admin services. Do not redesign working domains or activate a second financial writer.

Do not restart broad architecture discovery or restore old Gate/B1-B10 assumptions as current authority.
Current source/runtime and the root `AGENTS.md` control the execution model.

## Backend rules
Preserve NestJS module ownership, authorization, ownership checks, DTO validation, exact monetary precision, idempotency, ledger invariants, audit/activity linkage, EventOutbox semantics, public/Admin separation, and safe retry/recovery.
Do not mutate scalar wallet balances as financial authority when canonical ledger/reservation/posting methods exist.
Do not invent economic behavior, lifecycle states, settlement rules, or acceptance data.
## SQLite and Prisma handling
The VPS target uses the existing Prisma better-sqlite3 adapter and local financial command gateway. Preserve per-connection WAL/FULL durability, foreign keys, busy timeout, atomic transaction and exact decimal/idempotency behavior. Keep Ledger, EventOutbox, EventInbox and durable workflow/job rows in the same SQLite authority where required.

## High-impact change workflow
Before changing high-centrality nodes such as `D1FinancialCommandGateway`, `AdminService`, `EventOutboxService`, realtime gateways, or shared financial services:
1. refresh Graphify first if current source is newer than the graph;
2. run bounded `affected` and/or `path`/`explain` analysis;
3. inspect exact current source;
4. make the smallest coherent change;
5. run focused validation;
6. refresh graph once after the batch and recheck relevant impact/path only.

Graphify is not proof. Direct source and focused tests/runtime decide correctness.
## Remaining join requirements
- Preserve the NestJS durable workflow command surface for Withdrawal, Mining and Loan as local SQLite-coordinated workflows; keep business effects in the existing domain command services.
- Complete consequential EventOutbox coverage without duplicating financial authority.
- Finish Admin live API parity against canonical `/admin/*`; preserve the existing Admin application rather than rebuilding it.
- Finish realtime recovery/reconnect/dedupe/event contracts over Aiven Streams + Socket.IO.
- Complete/freeze OpenAPI request, response, auth/RBAC, errors, idempotency, pagination/filtering, lifecycle states, Admin, communications, financial, and realtime contracts.
- Feed API Documentation Checker/API Impact Mapper actual generated OpenAPI/controller/DTO changes when those tools are used; never progress summaries.

## Validation


Report only meaningful milestones or genuine blockers.
## Current authority addendum — 2026-10-18

Root `AGENTS.md` and latest owner decisions override historical D1/current-empty-DB claims further down this file. Promoted VPS SQLite is durable financial authority; no D1 duplicate writer. The new source-only Margin late-entry atomic fill patch at `577f5c1` has 23/23 focused test evidence, but late Margin CLOSE recovery and deployed acceptance are unproven. See `docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md` (finite financial-command matrix) and `NEXI_PROOF_REUSE_REGISTER.md`. Use direct Worker-0 CLI/MCP, bounded Graphify/Fallow impact and focused tests. One main worktree, no Codex delegation, no parallel shared Git/financial mutations.

## Current SQLite and BullMQ operational contract
Current NEXI VPS authority (2026-10-19): Name.com DNS -> VPS Nginx -> Public Next.js / Admin / NestJS nexi-api.service -> promoted SQLite /var/lib/nexi/sqlite/nexi-staging.sqlite. NestJS owns domain logic; LedgerAccount/LedgerPosting accounting; EventOutbox/EventInbox and SQLite job/workflow journals durability. Aiven Valkey carries BullMQ, Socket.IO Redis Streams and cache, never financial truth. Sentry and journald provide telemetry. Read docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md and docs/operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md. Preserve SQLite WAL/SHM, backups, migrations and durable history.

## API and SQLite source map

Use `backend/docs/NEXI_SQLITE_API_ROUTING_MAP.md` and `docs/architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md` for source-derived controllers, route prefixes, DTO imports and OpenAPI operations. NestJS owns authorization/business logic; promoted SQLite owns durable data; Ledger/Outbox/Inbox and job/workflow journals are SQLite-backed; Valkey/BullMQ is transport only. Reuse proven tests and do not rerun acceptance without owner authorization.
