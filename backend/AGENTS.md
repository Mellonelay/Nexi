## CANONICAL BACKEND BUILD — 2026-10-22

Build/deploy only from committed source in the canonical `main` checkout. `/srv/nexi/backend` is the single runtime/build working tree, `/srv/nexi/backend/dist` is the service output, and `/srv/nexi/backend/node_modules` must remain a symlink to `/srv/nexi/backend/shared/node_modules`. Use `backend/package.json` plus `backend/package-lock.json`; build with the existing Node 24 runtime and `npm run build` from `/srv/nexi/backend`. Do not install a second dependency tree or replace the symlink. Before an in-place build, verify the live release and recovery copy, stop only `nexi-api.service`, sync the committed backend source while preserving `shared/`, `node_modules`, and the verified rollback artifact, build once, set the release marker to the exact built source SHA, restart the API, then verify SQLite/Redis readiness, API contracts, PID/restart stability, and release identity.

If the backend shared store lacks locked build-time packages, first archive and verify that store, then stage the committed backend `package.json` and `package-lock.json` in `/srv/nexi/backend/shared` and run `npm ci --legacy-peer-deps --include=dev --no-audit --no-fund` there with Node 24 and npm 10.9.8. Never install from the source checkout. The legacy peer flag is required by the current lockfile's peer graph. Run the canonical build with `NODE_OPTIONS=--max-old-space-size=4096`; 2 GiB was insufficient on Worker-0. Nest CLI must copy `src/prisma/d1-client/**/*` into the emitted `dist/src/prisma/d1-client` tree. After building, verify that tree and load its entry from the compiled backend before restarting the service.

## CURRENT VPS BUILD AND SHARED DEPENDENCY PATHS — 2026-10-20

Current source: /home/mellonelay1999/workspaces/Nexi (single main checkout). Source paths are frontend/ (Public Next.js), Admin/ (Admin React/TanStack/Nitro), backend/ (NestJS/Prisma 7). Live deployed bytes and source SHA must be verified independently.

Public: /srv/nexi/public/current is the single real production build and runtime directory; /srv/nexi/public/current/.next is generated output. Its current/node_modules is a symlink to /srv/nexi/public/shared/node_modules. nexi-public.service runs npm start from /srv/nexi/public/current. The cache subdirectory .next/cache can be regenerated and was selectively cleared; never delete other .next assets during cleanup.

Admin: /srv/nexi/admin/current is the single real Nitro output/runtime tree (not a symlink), with server/index.mjs and public/ assets. Its independent install/store is /srv/nexi/admin/shared/node_modules. The Admin standalone runtime does not need a node_modules symlink inside current; do not add one without demonstrated need. nexi-admin.service runs node /srv/nexi/admin/current/server/index.mjs. Preserve existing no extra build/release directories policy.

Backend: /srv/nexi/backend is the live service working directory, with built code at /srv/nexi/backend/dist/src/main.js. Its runtime node_modules is a symlink to /srv/nexi/backend/shared/node_modules (moved, not duplicated). This runtime statement does not require the canonical source checkout's backend/node_modules to be a symlink; preserve its current ownership unless a separate dependency-reconstruction task verifies and authorizes a change. nexi-api.service runs the installed Node 24.21.0 entry. Module resolution for NestJS, Prisma and better-sqlite3, native SQLite smoke, and API readyz returned successful evidence after this runtime relocation.

Sharing boundary: These are THREE separate app-specific physical node_modules stores in stable shared/ locations, NOT a single cross-application node_modules directory or content-addressable dedup store. Backend relocation by itself saves no physical bytes. Do not blindly merge incompatible Next/Nitro/NestJS versions, Prisma native dependencies or lockfiles. Any cross-project dedup or package-manager change needs its own scoped dependency/ABI/rollback verification.

Storage: Root filesystem measured about 6.1 GiB available (88% used) after bounded cache cleanup on 2026-10-20; remeasure before assuming freshness. Preserve all live SQLite database/WAL/SHM files, financial data, backups, evidence, active Polypane mounts and runtime artifacts. Never blanket-clear /tmp or delete running-session files. Existing Public .next/cache was cleared; caches may regenerate. Prior npm cache had already been cleared by another operation. Permission-denied temp entries were not forcibly removed. Build, install, restart, push or deployment remain separately authorized actions.

This current owner-verified map supersedes older conflicting path or sharing claims below. For protected docs use worker0-protect unlock, bounded change, diff verification, refresh-lock, and status.

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
