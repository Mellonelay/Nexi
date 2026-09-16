# NEXI Backend Instructions

These rules extend the repository root `AGENTS.md` and govern the authoritative NestJS backend in the current synchronized NEXI checkout.

## Current backend authority
- Cloudflare Worker + Container is the only active backend execution/runtime authority; do not start or use a Worker-0/VM NestJS backend as backend truth or acceptance evidence.
- GitHub `main` is durable backend source authority. Legitimate live/container source repairs must be reconciled to `main` immediately when the bounded task finishes.
- NestJS is the business/domain authority.
- D1 is the canonical durable application and financial relational authority.
- Aiven Valkey is cache, Redis Streams, Socket.IO, and ephemeral coordination only.
- Worker, Queue, Workflow, KV, R2, and Durable Objects do not own financial truth.

## Current implementation objective
Finish EventOutbox coverage, Workflow-facing NestJS commands, Admin/API contract parity, and realtime recovery/contracts without rebuilding working domains. D1 is the only durable application/financial database path.

Do not restart broad architecture discovery or restore old Gate/B1-B10 assumptions as current authority.
Current source/runtime and the root `AGENTS.md` control the execution model.

## Backend rules
Preserve NestJS module ownership, authorization, ownership checks, DTO validation, exact monetary precision, idempotency, ledger invariants, audit/activity linkage, EventOutbox semantics, public/Admin separation, and safe retry/recovery.
Do not mutate scalar wallet balances as financial authority when canonical ledger/reservation/posting methods exist.
Do not invent economic behavior, lifecycle states, settlement rules, or acceptance data.
## D1 and Prisma handling
Before any D1/Cloudflare operation, read the relevant current official Cloudflare documentation and inspect current Wrangler help. Use the verified Wrangler/Cloudflare operator path against the remote Cloudflare resource; do not use sqlite3/direct SQLite files or a VM-local database as D1 authority.
Inside application code, use the existing D1 Prisma adapter/gateway/private bridge patterns; do not shell out to Wrangler at runtime.

No retired database fallback/compatibility path is allowed in active backend source. Prisma usage is permitted only through the current D1 adapter/client path.

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
Use focused TypeScript/tests for source correctness, then prove applicable runtime behavior against the Cloudflare-authoritative backend. A VM build/test is never backend runtime proof. The Cloudflare Container image/runtime is the canonical backend integration/runtime path.

Do not perform unrelated production mutation. Cloudflare/platform mutation requires the current task to own that boundary and to pass the official-documentation gate. Do not create a second backend runtime on Worker 0.

Report only meaningful milestones or genuine blockers.