# NEXI Backend Instructions

These rules extend the repository root `AGENTS.md` and govern the authoritative NestJS backend in the current synchronized NEXI checkout.

## Current backend authority
- GitHub `main` is durable backend source authority; the canonical backend source is `backend/` and the VPS runtime is `/srv/nexi/backend` under `nexi-api.service`.
- NestJS is the sole business/domain authority.
- SQLite + Prisma 7/better-sqlite3 is the target durable application database. Ledger remains accounting truth; EventOutbox/EventInbox preserve durable publication/idempotent ingress.
- Aiven Valkey is the selected Redis-compatible service for BullMQ and Socket.IO Redis Streams, plus cache/ephemeral coordination; it is never financial truth.
- SQLite journal/workflow state is durable; BullMQ transports work. Private local storage holds KYC/deposit evidence.
- Cloudflare production remains live until separately approved/reconciled cutover; its bindings are parity evidence, not the target runtime architecture.

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
Cloudflare D1 reads/inspection while it remains production must use project-local Wrangler and current official docs. Do not shell out to Wrangler at runtime or treat SQLite staging as current production equality.

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
Use focused TypeScript/tests for source correctness and prove runtime behavior against the running non-authoritative VPS service where applicable. Keep build, test, staging-runtime, production-deployment and owner-accepted-cutover evidence separate. Never point the staging API at production D1 or claim migration completion from a VM build alone.

Do not perform unrelated production mutation. Cloudflare/platform mutation requires the current task to own that boundary and to pass the official-documentation gate. Do not create a second backend runtime on Worker 0.

Report only meaningful milestones or genuine blockers.