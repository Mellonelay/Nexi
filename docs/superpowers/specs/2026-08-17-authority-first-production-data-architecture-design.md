# Authority-First Production Data Architecture Design

**Status:** Design proposed for review  
**Date:** 2026-08-17  
**Scope:** NEXI PostgreSQL authority, durable event recovery, market evidence, Spot, Binary, Wallet/Ledger, and Spot Isolated Margin.

## Mission

Make NEXI production-shaped without creating a second source of truth. PostgreSQL remains the durable authority. Redis remains ephemeral. The public frontend and separate Admin Control Plane consume governed backend interfaces and never own financial truth.

The supplied production-architecture HTML is target input, not executable instruction or proof of deployment. The later-added isolated-margin domain is included explicitly in this design.

## Design decisions

1. **One PostgreSQL authority.** Retain the current Prisma schema and forward-only migration lineage. Do not create a parallel database or replace the current schema.
2. **Deep Financial Authority module.** Spot, Binary/Microtrade, Wallet/Ledger, Earn/Mining, Loans, deposits/withdrawals, transfers, and isolated Margin use a governed command seam.
3. **Deep Market Evidence module.** Catalog, provider capability, instrument mapping, quote snapshots/latest state, Klines, source provenance, freshness, and settlement eligibility remain backend-owned.
4. **Durable outbox for committed events.** A committed PostgreSQL mutation must have a recoverable publication record before Redis/Socket.IO projection. Redis failure must not lose durable intent.
5. **Explicit isolated Margin scope.** Only isolated LONG/SHORT positions with 2x, 3x, or 5x leverage. Cross margin, futures, perpetuals, portfolio margin, C2C, and copy trading remain excluded.
6. **Evidence is a first-class release input.** Source, tests, disposable database, staging runtime, browser, security, recovery, and release review remain separate states.

## Logical topology

```text
Public Frontend ───────┐
Admin Control Plane ────┼──> Authoritative NestJS Backend
Realtime clients ──────┘              │
                                      ▼
                              PostgreSQL authority
                                      │
                              durable event/outbox
                                      │
                              Redis projections/pub-sub
                                      │
                              Socket.IO recovery stream
```

R2 is limited to object/media storage. Container filesystems are not durable application state.

## Financial command contract

Every value-changing command must execute:

```text
authorization
→ runtime validation
→ ownership/environment checks
→ idempotency check
→ one PostgreSQL transaction
→ state transition
→ reserve/post/release through ledger authority
→ audit linkage
→ durable outbox event
→ Redis/Socket.IO publication
→ retry/recovery evidence
```

The interface includes ordering, error states, idempotency semantics, transaction scope, and recovery behavior—not only TypeScript parameters.

## Market evidence contract

Market data is divided into separate authorities:

- canonical asset/pair catalog;
- provider capability and instrument mapping;
- immutable quote snapshots;
- latest normalized quote projection;
- Kline history;
- order-book and trade-depth evidence;
- freshness and state classification;
- source/provenance and configuration version;
- Binary/Margin settlement eligibility.

`LIVE`, `STALE`, `REFERENCE_ONLY`, `UNAVAILABLE`, `ERROR`, and `BLOCKED_EXTERNAL_CREDENTIAL` must remain distinct. Provider adapter existence, HTTP 200, a positive number, or a catalog row cannot establish settlement authority.

## Domain mapping to current reuse candidates

| Authority | Existing source/model candidates | Design action |
|---|---|---|
| PostgreSQL adapter | `backend/src/prisma/prisma.service.ts` | Preserve Prisma 7 + `pg` adapter and transaction seam |
| Redis adapter | `backend/src/redis/redis.service.ts` | Preserve ephemeral-only contract |
| Market evidence | `MarketAuthorityService`, `MarketIngestService`, `MarketKlineService`, `MarketQuoteSnapshot`, `MarketQuoteLatest`, `MarketKline` | Deepen contract; do not duplicate market truth |
| Ledger | `LedgerAuthorityService`, `LedgerAccount`, `LedgerPosting`, `LedgerIdempotency`, `LedgerAuditEvent` | Centralize posting and reconciliation invariants |
| Spot | `SpotService`, `Gate2SpotOrder`, `Gate2SpotTrade` | Reuse matcher and reserve/release authority |
| Binary | `BinaryService`, `Gate2BinaryConfiguration`, `Gate2BinaryPosition` | Require recorded price, timestamp, provenance, duration, and version |
| Isolated Margin | `MarginService`, `SpotMarginAccount`, `SpotMarginPosition`, event/activity models | Preserve isolated-only lifecycle and leverage allowlist |
| Admin | Admin governance, approval, audit, incidents, maintenance, flags | Keep separate auth and reason/audit requirements |

## Durable event/outbox design

The outbox is an internal persistence seam, not a second source of truth. An outbox record references the authoritative domain mutation and contains:

- event ID and idempotency key;
- aggregate type and ID;
- event type and schema version;
- correlation/request ID;
- payload or payload reference;
- created, published, retry, and dead-letter timestamps;
- bounded attempt count and last error classification.

The transaction writes the domain mutation and outbox record atomically. A publisher claims records with bounded leases, publishes to Redis, records acknowledgement, and retries safely. Consumers deduplicate by event ID and recover from a PostgreSQL snapshot plus sequence cursor. No outbox event may create value independently of its originating ledger/domain transaction.

## Database and migration lifecycle

```text
source/schema review
→ read-only migration/drift report
→ disposable PostgreSQL validation
→ focused transaction/idempotency/concurrency tests
→ staging migration with receipt
→ readiness and reconciliation
→ browser/realtime acceptance
→ independent release review
→ explicit production approval and rollback plan
```

Forbidden without separate approval: reset, destructive SQL, `db push` against shared authority, migration recreation, production credentials, production migration, deployment, or Cloudflare mutation.

## Observable acceptance criteria

### Architecture and source

- Current Graphify and Codebase Memory maps identify the three surfaces and backend authority paths.
- No public frontend or Admin module directly owns financial truth.
- Margin is represented as a first-class isolated domain.

### PostgreSQL and Prisma

- `prisma validate` passes.
- Migration lineage is forward-only and drift is reported before application.
- Critical unique constraints and indexes cover ownership, idempotency, pair/state/time, sequence, and audit linkage.
- Critical queries have query-plan evidence before partitioning or speculative indexes.

### Financial integrity

- Repeated idempotency keys cause one effective mutation.
- Concurrent reserve/release, Spot matching, Binary settlement, and Margin transitions preserve ledger reconciliation.
- Margin accepts only isolated LONG/SHORT with 2x/3x/5x.
- Admin corrections are ledger-backed, reason-required, and audited.

### Event recovery

- PostgreSQL commit succeeds even when Redis is unavailable.
- Outbox retry is idempotent and bounded.
- Reconnect receives snapshot plus ordered events without duplicate application.
- Dead-lettered events have an inspectable recovery path.

### Runtime and release

- `/ops/ready` proves PostgreSQL and Redis dependency readiness.
- Market truth states remain explicit through REST, Redis, Socket.IO, and frontend.
- Browser acceptance verifies loading/live/stale/unavailable/error behavior.
- Backup/restore, rollback, and independent release review are evidenced.

## Rollback and failure policy

- Before schema mutation, capture migration status and disposable baseline.
- Use expand-migrate-contract for additive changes.
- Keep new readers backward-compatible until backfill and verification complete.
- Pause publication or feature flags rather than mutate financial history destructively.
- Roll back application versions separately from database migrations; use compensating migrations or records for irreversible data changes.

## Out of scope

- live production database creation or migration;
- new Prisma Postgres managed database;
- microservice extraction;
- speculative tenant tables;
- partitioning without growth/query evidence;
- Cross margin, futures, perpetuals, portfolio margin, C2C, or copy trading.

## Review state

`DESIGN_WRITTEN` / `SOURCE_REUSE_MAPPED` / `HTML_AND_REPOSITORY_INDEXED` / `IMPLEMENTATION_NOT_STARTED` / `USER_REVIEW_REQUIRED`
