# Authority-First Production Data Architecture Implementation Plan

> **For agentic workers:** Implement inline in the single native Codex parent. Do not use subagents, Coordinator, Git, worktrees, branches, commits, deployments, or production mutation.

**Goal:** Add durable PostgreSQL-backed event recovery and reconcile existing Market, Ledger, Spot, Binary, and isolated-Margin authorities without creating a second database.

**Architecture:** PostgreSQL remains the only durable source of truth. A transactional outbox records committed domain events atomically; a bounded publisher delivers them to Redis/Socket.IO with leases, retries, deduplication, and replay. Existing domain services remain the implementations behind governed seams.

**Tech Stack:** NestJS 10, TypeScript 5, Prisma 7, PostgreSQL, `pg`/`@prisma/adapter-pg`, Redis/ioredis, Socket.IO, Jest, Graphify, Codebase Memory MCP.

## Global Constraints

- PostgreSQL is durable authority; Redis is ephemeral transport/cache/coordination only.
- Financial commands require authorization, validation, idempotency, one PostgreSQL transaction, state transition, ledger linkage, audit linkage, publication, and recovery.
- Isolated Margin only: LONG/SHORT and 2x/3x/5x. No cross margin, futures, perpetuals, portfolio margin, C2C, or copy trading.
- No frontend, Admin UI, Redis key, provider response, or container filesystem owns financial truth.
- No reset, destructive SQL, migration recreation, `prisma db push` against shared authority, deployment, secrets, Cloudflare mutation, or production database mutation.
- Schema/migration changes require separate explicit current-turn approval before execution.
- Do not run Git commands or create commits.

## File map

Preserve/reuse: `backend/src/prisma/prisma.service.ts`, `backend/src/redis/redis.service.ts`, `backend/src/market/market-authority.service.ts`, `backend/src/market/market-ingest.service.ts`, `backend/src/market/market-kline.service.ts`, `backend/src/market/market.gateway.ts`, `backend/src/ledger/ledger-authority.service.ts`, `backend/src/spot/spot.service.ts`, `backend/src/binary/binary.service.ts`, `backend/src/spot/margin.service.ts`, and `backend/prisma/schema.prisma`.

Create if reconciliation proves absent: `backend/src/outbox/outbox.types.ts`, `outbox.service.ts`, `outbox.publisher.ts`, `outbox.module.ts`, `outbox.contract.spec.ts`, `outbox.integration.spec.ts`, and one additive Prisma migration.

Evidence directory: `work/20260817-authority-first-data-implementation/`.

## Task 1 — Read-only baseline

- [ ] Use Codebase Memory `search_graph`, `search_code`, `get_code_snippet`, and `query_graph` for `Outbox`, `Event`, `publish`, `idempotency`, `MarketAuthorityService.ingestQuote`, `SpotService.placeOrderInTransaction`, Binary settlement, Ledger, and Margin lifecycle.
- [ ] Use bounded Graphify queries for the same symbols; reuse the existing repository graph.
- [ ] Inspect the exact Prisma schema, migration head, Prisma config, and Redis/Prisma adapters.
- [ ] Run `npx prisma validate --schema backend/prisma/schema.prisma`.
- [ ] Create `work/20260817-authority-first-data-implementation/PRISMA_DRIFT_RECONCILIATION.md` with SOURCE, INDEX, SCHEMA, MIGRATION, REUSE, DRIFT, and BLOCKER sections.
- [ ] Do not connect to or mutate a database.

**Acceptance:** The receipt proves whether an outbox already exists, maps reuse candidates, and identifies the exact additive migration point without claiming runtime proof.

## Task 2 — Schema approval gate and additive outbox model

**Stop before schema changes. Obtain explicit current-turn approval for an additive disposable-first migration.**

- [ ] Confirm no existing equivalent model.
- [ ] Add the minimum `EventOutbox` model: event ID, aggregate type/ID, event type/version, idempotency key, correlation ID, payload/reference, delivery state, lease, attempts, retry/dead-letter metadata, and timestamps.
- [ ] Add uniqueness for event identity/idempotency and indexes for pending claims, leases, aggregate replay, and chronology based on actual queries.
- [ ] Generate one forward-only migration; never use `db push`.
- [ ] Run Prisma validate and generate only after approval.

**Acceptance:** Additive migration validates locally, has a compensating-record/rollback strategy, and touches no shared or production target.

## Task 3 — Transactional outbox seam

Create `backend/src/outbox/outbox.types.ts`, `outbox.service.ts`, `outbox.module.ts`, `outbox.contract.spec.ts`, and `outbox.integration.spec.ts`.

- [ ] Define `OutboxEventEnvelope` with event ID, aggregate, event type/version, correlation ID, payload, and idempotency semantics.
- [ ] Implement `append(tx, envelope)`, `claimBatch(now, limit, leaseSeconds)`, `ack(eventId, leaseToken)`, and `retry(eventId, leaseToken, classification)`.
- [ ] Test atomic domain/outbox commit, duplicate rejection, lease ownership, acknowledgement, bounded retry, and dead-letter transition.
- [ ] Use explicit Prisma transaction clients; do not create hidden database clients.

**Acceptance:** Domain mutation and outbox event commit atomically; duplicate append/ack/retry is safe.

## Task 4 — Publisher and realtime recovery

Create `backend/src/outbox/outbox.publisher.ts`; modify the module and Redis seam only when required; modify `market.gateway.ts` only for event ID/sequence recovery metadata.

- [ ] Implement one bounded publisher loop with shutdown, batch size, lease duration, and retry limits.
- [ ] Publish event ID and schema version for consumer deduplication.
- [ ] Acknowledge only after Redis succeeds; record retry/dead-letter state without changing domain truth.
- [ ] Test PostgreSQL commit followed by Redis outage, later retry, reconnect snapshot, ordered replay, and duplicate suppression.

**Acceptance:** Redis failure leaves recoverable persisted-not-published evidence; replay does not duplicate application or value.

## Task 5 — Market Evidence integration

Modify `backend/src/market/market-authority.service.ts` only inside the existing quote transaction; touch ingest/Kline/gateway only when the contract requires it.

- [ ] Test accepted quote creates one durable event.
- [ ] Test older/duplicate quote creates no effective new event.
- [ ] Append the event after snapshot/latest writes in the same transaction.
- [ ] Preserve provider mapping, source lineage, freshness, Kline ordering, and current Redis projection behavior.

**Acceptance:** PostgreSQL quote records and durable event agree; Redis remains a projection.

## Task 6 — Financial-domain integration

Reuse the existing transaction seams in `ledger-authority.service.ts`, `spot.service.ts`, `binary.service.ts`, and `margin.service.ts`.

- [ ] Map each transaction before editing; never append after commit.
- [ ] Add one-event-per-idempotency tests for Spot acceptance/cancellation, Binary open/settlement, and Margin open/close/liquidation.
- [ ] Verify Margin ownership, isolated account, LONG/SHORT, and 2x/3x/5x invariants.
- [ ] Verify ledger posting and outbox creation fail together.
- [ ] Preserve existing state machines and compensating records.

**Acceptance:** No financial mutation commits without recoverable event evidence; no event creates value independently.

## Task 7 — Disposable recovery verification

Create `DISPOSABLE_POSTGRES_OUTBOX_RECEIPT.json` and `RUNTIME_OUTBOX_RECOVERY_RECEIPT.json` under `work/20260817-authority-first-data-implementation/`.

- [ ] Confirm disposable/non-production target without printing secrets.
- [ ] Apply the forward-only migration to that disposable target.
- [ ] Run transaction, idempotency, concurrency, Redis-outage, replay, deduplication, and cleanup tests.
- [ ] Capture migration, readiness, recovery, and rollback state.

**Acceptance:** Receipts prove failure recovery, not merely build success.

## Task 8 — Runtime and release evidence gate

Create `FINAL_AUTHORITY_FIRST_GATE_RECEIPT.md`; update current status and roadmap only after evidence reconciliation.

- [ ] Verify `/ops/ready`, PostgreSQL, and Redis separately.
- [ ] Verify market truth through REST, Redis, Socket.IO, and browser.
- [ ] Verify authenticated Spot, Binary, Wallet/Ledger, and isolated Margin only through real test-created records.
- [ ] Verify reconnect/replay and loading/live/stale/unavailable/error states.
- [ ] Re-run bounded Graphify and Codebase Memory after source changes.
- [ ] Classify each layer as IMPLEMENTED, TESTED, INTEGRATED, RUNTIME_VERIFIED, BROWSER_VERIFIED, SECURITY_REVIEWED, or BLOCKED/DEFERRED.

**Acceptance:** Completion is claimed only for layers with direct evidence.

## Verification commands

Run only after the relevant approval and setup: `npx prisma validate --schema backend/prisma/schema.prisma`; `npx prisma generate --schema backend/prisma/schema.prisma`; focused Jest; `npx tsc --noEmit`; `npm run build`; `graphify update .`; `graphify check-update .`.

## Plan self-review

- Spec coverage maps to Tasks 1–8: authority topology, outbox, market evidence, financial invariants, Margin scope, migrations, recovery, rollback, runtime, browser, and release evidence.
- No placeholder markers remain.
- Existing Prisma, Redis, Market, Ledger, Spot, Binary, and Margin seams are reused.
- Schema mutation has an explicit approval gate; production mutation remains forbidden.

**Plan state:** `PLAN_WRITTEN` / `USER_DESIGN_APPROVED` / `IMPLEMENTATION_NOT_STARTED` / `SCHEMA_APPROVAL_REQUIRED`

