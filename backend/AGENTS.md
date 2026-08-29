# NEXI Backend Instructions

These rules extend `/root/workspaces/nexi-authoritative-20260823/AGENTS.md` and govern the authoritative NestJS backend.

## Current backend authority
- NestJS is the business/domain authority.
- D1 is the canonical durable application and financial relational authority.
- Aiven Valkey is cache, Redis Streams, Socket.IO, and ephemeral coordination only.
- PostgreSQL/Neon code may remain only as explicitly classified disabled/compatibility/fallback legacy until retirement; it is not canonical staging authority.
- Worker, Queue, Workflow, KV, R2, and Durable Objects do not own financial truth.

## Current implementation objective
Finish the remaining D1 application/financial cutover, EventOutbox coverage, Workflow-facing NestJS commands, Admin/API contract parity, realtime recovery/contracts, and active Prisma/PostgreSQL bypass classification without rebuilding working domains.

Do not restart broad architecture discovery or restore old Gate/B1-B10 assumptions as current authority.
Current source/runtime and the root `AGENTS.md` control the execution model.

## Backend rules
Preserve NestJS module ownership, authorization, ownership checks, DTO validation, exact monetary precision, idempotency, ledger invariants, audit/activity linkage, EventOutbox semantics, public/Admin separation, and safe retry/recovery.
Do not mutate scalar wallet balances as financial authority when canonical ledger/reservation/posting methods exist.
Do not invent economic behavior, lifecycle states, settlement rules, or acceptance data.
## D1 and Prisma handling
For D1 operator/schema verification use only project-local Wrangler from `../cloudflare-container-bootstrap`.
Do not use sqlite3/direct SQLite files as D1 authority.
Inside application code, use the existing D1 Prisma adapter/gateway/private bridge patterns; do not shell out to Wrangler at runtime.

Classify residual Prisma/PostgreSQL paths before changing them:
- `D1_COMPATIBILITY`
- `NON_FINANCIAL_LEGACY`
- `MIGRATION_ONLY`
- `TEST_ONLY`
- `DISABLED`
- `ACTUAL_RUNTIME_BYPASS`

Fix active canonical runtime bypasses. Do not blindly delete compatibility branches before callers/contracts are proven.

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
- Implement the NestJS `_internal/workflows/*` command surface required by Withdrawal, Mining, and Loan Cloudflare Workflows.
- Complete consequential EventOutbox coverage without duplicating financial authority.
- Finish Admin live API parity against canonical `/admin/*`; preserve the existing Admin application rather than rebuilding it.
- Finish realtime recovery/reconnect/dedupe/event contracts over Aiven Streams + Socket.IO.
- Complete/freeze OpenAPI request, response, auth/RBAC, errors, idempotency, pagination/filtering, lifecycle states, Admin, communications, financial, and realtime contracts.
- Feed API Documentation Checker/API Impact Mapper actual generated OpenAPI/controller/DTO changes when those tools are used; never progress summaries.

## Validation
Use focused TypeScript/tests first. The known VM heap constraint on the full NestJS host build is not permission to call work complete and is not a reason to stop independent implementation.
The canonical Docker/Container build is the final integration build path for the backend/platform join.

Do not deploy production. Do not mutate Cloudflare/platform-owned files from the application lane unless the current task explicitly owns that boundary.
Do not sync individual backend edits to Windows while implementation is active.

Report only meaningful milestones or genuine blockers.