> **Commit chronology:** Original study at `99ba702`, subsequent market source at `8d32b95a71ef`; [newest pre-build proof](../quality/NEXI_PREBUILD_ARCHITECTURE_SOURCE_PROOF_20261118.md).

# ADR-2026-11-18: NEXI market-data and backend resource architecture

**Status:** Market queue/Kline/Public recovery source decisions **partially implemented and committed** as `8d32b95a71ef`; further performance/retention/provider recommendations are conditional, and **no production build/deploy** is authorized by this ADR.
**Decision owner:** NEXI owner.
**Applies to:** Backend, Public, Admin, SQLite, BullMQ/Valkey, Socket.IO, provider ingestion, monitoring and release operations.
**Evidence:** Companion research at docs/research/NEXI_BACKEND_ARCHITECTURE_PERFORMANCE_RESOURCE_STUDY_20261118.md.
**Observed source revision:** 99ba7024a897181ca479cf37b31a24846019c0a6 (main; origin/main at capture).
**Scope of this ADR:** measurement, architecture and implementation plan only. No application source or runtime configuration changed in this study.

**2026-11-18 implementation delta (subsequent work):** The source changes now committed as `8d32b95a71ef` (still undeployed) separate bounded quote/Kline processing from best-effort reference events; adds saturation accounting, Kline same-timestamp revision ordering and Public Spot trade-gap recovery; and resolves the NestJS Socket.IO adapter helper collision. Focused tests/typechecks passed. These changes **do not appear in the November 17 live artifacts**. Use the [architecture reconciliation](NEXI_ARCHITECTURE_DOCUMENT_RECONCILIATION_20261118.md) and [current source review receipt](../quality/NEXI_MARKET_SOURCE_REPAIR_WORK_REVIEW_20261118.md), not this original roadmap as if no implementation had started.

**Current owner precedence:** The blanket source-first prohibition on tests/typechecks was retired. Use proportionate tests during authorized implementation; building to live canonical output paths, restarting, deploying, and economic database modifications still require separate authorization.

## Decision

Keep the current NestJS + Prisma/better-sqlite3 + SQLite WAL + SQLite-backed durable jobs + BullMQ/Valkey transport + Socket.IO architecture as the financial foundation. Evolve the market-data path into a measured, backpressured reference-data plane inside the existing application boundary. Keep SQLite financial write authority and Binary settlement policy unchanged.

Do not add a paid database, queue, market vendor or platform service in this phase. Do not migrate the Ledger, EventOutbox/EventInbox or durable job journal. Do not relax SQLite synchronous durability. Do not switch market/chart/reference providers into financial execution or settlement authority.

The decision is supported by actual evidence: all three NEXI application services were active at observation time; API readiness reported SQLite and Redis ready; host CPU and RAM had headroom in bounded snapshots; queue saturation and I/O pressure are the demonstrated constraints; and no measured workload has shown that a different storage engine or additional paid service is required. The current free-1 Valkey service and its security posture need owner review, but its queue role remains transport, while durable work is retained in SQLite.

## Current producer-to-consumer contracts

| Flow | Producer | Authority / durable owner | Transport and consumer | Contract to preserve |
|---|---|---|---|---|
| Economic command | Public wallet/trading/finance client or authorized Admin action | NestJS domain policy and SQLite command gateway; LedgerAccount/LedgerPosting plus transaction journal | EventOutbox/EventInbox and LocalDurableJob in SQLite; BullMQ on Valkey wakes workers; REST reads and Socket.IO project results | Idempotent original intent, transactional balance and posting invariants, audit, replay safety; delivery is at least once and cannot create a second financial effect. |
| Reference quote | Binance, BiQuote, MOEX, Yahoo and currently active market adapters | Provider normalization, freshness/source policy, MarketQuoteLatest and bounded MarketQuoteSnapshot in SQLite | Redis pub/sub/Streams to NestJS MarketGateway; REST snapshot and Socket.IO market events to Public/Admin | Carry provider, observedAt/receivedAt, price type, market/session state and sequence. Stale, closed and unavailable are explicit states. Display price is not settlement authority. |
| Candle/Kline | Provider history and provider stream/1m aggregation | MarketKline in SQLite keyed by pair/interval/openTime | REST chart history and Socket.IO Kline event to Public/Admin | Preserve UTC open/close time, open-candle versus closed-candle state, dedupe and gap recovery for seven supported intervals. |
| Trade/depth reference | Provider trade/depth streams | Current implementation keeps these as best-effort reference events; no financial posting authority | Bounded in-memory event queue and Redis publish to realtime subscribers | Count every coalesce/drop by event type/provider. Never describe this stream as durable or as exchange execution evidence. |
| Async business event | Committed SQLite Outbox | EventOutbox/EventInbox and local durable-job/workflow journal | BullMQ/Valkey transport; one worker per configured queue | SQLite decides accepted/pending/retry/completed state. Valkey failure may delay work but must not discard intent. |
| Socket projection | Backend post-commit events | Durable database/read model remains authoritative | Socket.IO Redis Streams and Public/Admin clients | Sequence checks, reconnect, snapshot resync, and no UI success claim without REST/persisted receipt. |

The current API Module layout and producer/consumer boundaries are documented in source. Historical D1-prefixed names do not mean Cloudflare D1 is active. The system architecture note dated 2026-11-17 is reference, not current runtime proof.

## Target architecture

### Financial path

Keep the financial command path exactly on its current durable authority:

1. Authenticate/authorize through NestJS guards and validated DTOs.
2. Execute the one domain-owned SQLite transaction through the established command gateway/worker bridge.
3. Commit business state, Ledger postings, audit/receipt and Outbox intent atomically where required.
4. Dispatch the committed intent through the SQLite job journal and BullMQ/Valkey wakeup transport.
5. Project results through REST and Socket.IO; consumers reconcile against durable IDs/receipts.

Market optimization must not add a second financial database writer, depend on cache state for balances, alter SIWE chain 1, or substitute a reference feed for Binary settlement.

### Market reference path

1. Keep one adapter connection per active provider and use provider streaming where supported; use bounded batched REST for bootstrap/recovery, not per-symbol polling loops.
2. Normalize symbol, provider instrument, quote type, observed time, receive time, session state and source before authority selection.
3. Split the in-process event handling into explicit bounded lanes: latest quote/ticker, closed/open Kline, and best-effort trade/depth. Preserve latest ticker state through keyed coalescing. Do not put chart Kline or required quote updates behind a queue policy that silently drops old events.
4. Count accepted, coalesced, rejected, stale, delayed, dropped and retried events by bounded dimensions (provider, symbol from the fixed 53-symbol set, event class). Do not tag user IDs, wallet addresses, full payloads, credentials or arbitrary labels.
5. Keep SQLite snapshots at the existing approved 72-hour raw quote horizon and keep the latest quote lineage. Keep candles durable until the owner approves a historical horizon. Measure writes per event first; any future sampling/throttling must state how latest lineage and candle close semantics remain correct.
6. Keep public fan-out through the existing Socket.IO/Redis Streams layer with sequence-gap metrics and REST snapshot recovery. Separate reference-data health from API liveness and financial readiness.
7. Continue source-policy filtering: current startup-reported adapters are Binance Spot, MOEX, BiQuote, Yahoo and Gate. Current source policy and DB mappings are not equivalent to “live and fresh”; maintain a current capability report for the supported 53 instruments.

### Runtime and resource boundaries

- Preserve the one canonical repository and the existing API/Public/Admin service locations.
- Preserve current dependency stores and the existing Aiven Valkey service until a measured alternative is approved.
- Harden Aiven access controls separately through owner-authorized policy: current service metadata shows unrestricted source IP filters, a broad default ACL, a single free-1 1-vCPU/1-GiB node and no HA. Credentials remain secret; no credentials were read.
- Maintain the current source-defined main+WAL size alert bands (12/15/18 GB) until a new production retention/capacity model is measured.
- Do not move market data into Valkey as sole truth; Valkey remains transient cache/transport. Do not add a second store unless the conditional gate below is met.

## Architecture alternatives

| Candidate | Decision |
|---|---|
| Optimized current NestJS/SQLite/BullMQ/Valkey/Socket.IO | Adopt now. It preserves the existing financial model and creates no new service cost. First action is observability and market-ingestion pressure control. |
| Existing stack with separated hot market processing, coalescing and controlled SQLite writes | Preferred target evolution. It isolates the demonstrated market queue problem and keeps financial contracts. A separate process can improve event-loop and CPU isolation but will not remove SQLite writer contention while sharing the same database file. |
| Provider-assisted historical market data | Use only as a licensed, provenance-carrying history/bootstrap source with local cache. Retain local current chart data and robust behavior while providers are unavailable. Never use it for Binary settlement. |
| New time-series storage or market-data service | Deferred. Requires sustained evidence that optimized market writes still breach measured SQLite latency/backlog budgets, plus owner authorization for service, cost, security, backups and migration. |

## Quantified capacity models

Current direct measurements and assumptions are in the companion study. Two explicit envelopes guide future sizing:

1. Continuous candle upper model: 53 pairs × (1440 + 288 + 96 + 48 + 24 + 6 + 1) = 100,859 rows/day for seven intervals. At an assumed 128–512 effective bytes/row including indexes, this is about 0.39–1.55 GB/30 days, 1.16–4.65 GB/90 days and 4.71–18.85 GB/365 days. This is a theoretical all-hours upper model; actual market sessions reduce it, while real row/index size must be measured.
2. Raw quote snapshot model: with a 72-hour horizon and 1 KiB effective row size, 0.01 / 0.1 / 1.0 snapshots/sec/instrument gives about 0.14 / 1.41 / 14.07 GB for 53 instruments. The current event rate and effective row size are unknown. The database’s 4.35 GB total cannot be allocated to the market tables without table-size evidence.

No total 30/90/365-day database projection or full monthly operating cost is asserted. Current Aiven Valkey metadata shows $0 plan price. VPS, network egress, Sentry and other charges were not available.

## Prioritized implementation roadmap

This is the original proposed roadmap, not a current unimplemented to-do list. Reuse confirmed market candidate repairs and existing tests. The retired blanket source-first prohibition on tests/typechecks no longer applies; deploy/build/service/financial operations remain separately approval-gated.

| Phase | Priority / effort | Exact owners and work | Dependencies / acceptance proof |
|---|---|---|---|
| 0. Establish measurement contracts | P0 / M | Backend: backend/src/observability, backend/src/market, backend/src/jobs, backend/src/events, backend/src/d1. Add bounded gauges/histograms for API routes, event-loop delay, heap/GC, SQLite write/busy/transaction time, WAL/checkpoints, retention batches/vacuum, provider event receive/process/age/drop, durable queue age/retries, Valkey operations and Socket.IO active connections/fan-out/reconnect gaps. Add a protected metrics/read model and Sentry tags without high-cardinality or sensitive data. | Source review across Backend plus Public/Admin consumer contract for diagnostic status before tests. Verify metrics against synthetic fixed scenarios, confirm no wallet/payload/credential labels, and compare metrics counters to logs. |
| 1. Close provider coverage contracts | P0 / M | Backend market source registry, router, provider adapters and MarketProviderSymbol mapping; Public chart/price state consumers; Admin market/provider controls if the source contract exposes them. Define active vs eligible vs fallback vs observed-fresh. Reconcile BiQuote USDRUB special inclusion, four disabled stock maps, inactive exchange adapters and crypto fallback candidates. | One table-driven coverage contract for all 53 instruments, every provider symbol, seven intervals, freshness/session state and license/provenance. External probes are bounded and use public read-only endpoints. No provider becomes Binary settlement authority. |
| 2. Remove silent market queue loss | P0 / M | Backend market-ingest.service.ts, market-provider-router.service.ts, provider adapters, market-kline.service.ts and realtime contract. Use keyed coalescing for latest quotes, priority/reserved capacity for Kline/required quote events, counted best-effort trade/depth, and reconnect/gap hydration. Keep current API and Socket event contract compatible; change Public/Admin consumers only if the payload contract changes. | Isolated queue tests with recorded source rates and 1×/2×/5× event fixtures after all source consumers are updated. Pass: no uncounted drops, bounded queue memory, explicit expected coalescing, all closed Klines idempotently persisted. |
| 3. Reduce SQLite I/O without changing financial authority | P0 / M | Backend market snapshot/Kline persistence, retention scheduler, SQLite bridge and query owners. Attribute DBSTAT table bytes on an isolated copy, sample PRAGMA wal_checkpoint status read-only where safe, record query plans for current hot reads, and measure write paths. Retain 72-hour raw snapshots and latest lineage. Revisit whether incremental_vacuum(256) should be decoupled from each retention batch; do not change before evidence. | No financial migrations or deletions in this research stage. In implementation, any schema/retention change needs owner-approved migration, SQLite online backup plan and financial invariants. Pass: measured writer p95/p99, zero unexplained BUSY/LOCKED, WAL checkpoint within budget, no loss in financial/readback fixtures. |
| 4. Bound historical storage and provider hydration | P1 / M | Backend Kline/query owners and Public chart consumer; Admin only for operator visibility. Keep locally persisted bars and freshness/provenance. Add provider-assisted backfill/cache only within licensed range and persist gaps/idempotency. Ask owner for chart-history horizon before any Kline deletion/expiry. | Per-instrument × timeframe provider probe in controlled environment, closed/open candle tests, provider-down fallback, historical gap test. No history is deleted until duration is explicitly approved. |
| 5. Harden supporting infrastructure and telemetry | P1 / M | Owner-controlled Aiven policy; Backend RedisService/RedisIoAdapter; Sentry/Jaeger exporter configuration; Nginx/systemd runbooks. Scope Valkey ingress to VM egress and least-privilege users/commands/keys; decide free-plan availability risk; establish current Valkey queue/memory metrics and Sentry/Jaeger trace linkage. | Owner authorization for any Aiven ACL/IP/plan or secret change. Validate reconnect, retained SQLite jobs, backup restore and app readiness in isolated environment. Never print secrets. |
| 6. Evaluate separate market store only if needed | P2 / L | Architecture owner and Backend data owner. Only after phases 0–5, compare separately provisioned store vs current SQLite using measured production-shaped traces and cost. Keep finance on SQLite. | Gate: for two representative 7-day windows after optimization, market write latency or backlog violates accepted budgets and is causally attributable to SQLite serialization. Owner authorizes service/cost/backup/security/migration before implementation. |
| 7. Verify/release by authorized workflow | P1 / M | Backend → Public → Admin, then authorized production release. Source closure precedes all app verification. Follow current AGENTS.md build/release contracts. | Isolated correctness/performance tests, financial invariants, source/artifact identity, API health, market provider status, Sentry release and operator smoke. UI-first 113-case acceptance remains a separate assignment; do not claim it here. |

### Public/Admin impact boundaries

No customer-facing trading or wallet API change is required to add internal resource metrics. Public should only change if the market state/recovery contract needs an explicit event such as STALE, CLOSED, GAP or RESNAPSHOT; keep the mobile wallet, trading, seven chart intervals and all financial workflows intact. Admin should only add provider/operator visibility if required by an accepted Backend diagnostic contract; do not create a new provider mutation surface or alter RBAC. All market surfaces remain consumers of the same Backend read model and source policy.

## Verification plan for a later authorized implementation

1. Establish source IDs and keep one canonical checkout. Apply focused tests/typechecks to authorized changes; separately gate canonical builds and production release.
2. On an isolated production-shaped copy, replay captured provider event distributions and load variants at measured 1×, 2× and 5× rates. These are test scenarios, not production load.
3. Assert bounded memory, event-loop delay, queue high-water/drop/coalesce counts, quote freshness, Kline open/closed semantics, gap recovery, symbol/provider identity and response latency.
4. Run SQLite tests on isolated copies with financial fixtures: double-entry balance, Ledger immutability, idempotent command replay, Outbox atomicity, Inbox dedupe, local job retry/replay, and settlement timestamp/source/staleness. Do not use live financial data.
5. Inject failures only in isolated environment: Binance/BiQuote outage, stale/closed provider, out-of-order sequence, Valkey outage/reconnect, SQLite BUSY/read checkpoint delay, worker process restart and Socket.IO stream overflow. Verify data source and recovery; no duplicate postings.
6. Compare same-VM before/after data with the budget table in the research study. Use at least two sustained windows for capacity claims. No production load test.
7. Deployment requires separate owner authorization: preserve current DB and dependencies, build serially per AGENTS.md, verify artifact identity/health, monitor Sentry, and use a reversible rollout. Run the separate mobile UI-first campaign only under its own assignment.

## Rollback and failure containment

- Roll back market normalization/fallback code when a provider-symbol identity, price type, market-session state, or sequence changes unexpectedly.
- Disable a reference provider or return STALE/UNAVAILABLE when freshness fails; never substitute a provider into Binary settlement.
- Keep financial writes and Outbox on the same transaction gateway. If Ledger, balance or idempotency invariants fail, stop the rollout and preserve evidence; do not replay customer transactions.
- Retain current 72-hour quote policy until replacement is proven; no Kline history purge until the owner sets retention.
- On Valkey failure, leave durable work in SQLite and resume dispatch idempotently after recovery. On Socket outage, force consumer REST snapshot recovery.
- Trigger database rollback only through the established verified SQLite backup/recovery procedure, never by copying the live database file casually or using VACUUM as rollback.
- If resource thresholds worsen, revert only the changed market processing setting/code; do not reduce SQLite synchronous safety or mutate financial records.

## Owner decisions required before consequential changes

1. What historical chart lookback duration must remain locally available for each of the seven intervals? Current Klines are protected; this study proposes no deletion.
2. May source-approved commercial reference providers (especially BiQuote) be used for chart/history fallback under their terms, and must any additional provider be license-reviewed before enabling it? No provider becomes settlement authority.
3. Should the free-1, single-node Valkey configuration be hardened in-place (IP allowlist/least-privilege ACL) and/or upgraded for availability? Current config allows all source IPs with broad default ACL; an upgrade may add cost.
4. What target market load and customer concurrency should acceptance budgets represent? No production concurrency is measured.
5. If measured SQLite limits remain exceeded after optimization, is a separate market data store and recurring service cost authorized? No new service is authorized by this study.

## Decision consequences

- **Immediate benefit:** no new recurring infrastructure cost is required for instrumentation, queue policy and provider-map reconciliation. Improvements to drop rates, SQLite write rate and storage cannot yet be quantified without the missing counters; success is measured against the baselines in the research doc.
- **Expected storage behavior:** raw snapshots remain bounded by the existing 72-hour policy only after delete throughput catches up and latest lineage remains. Persistent Kline and durable financial evidence continue to grow according to actual workload and owner retention policy.
- **Trade-offs:** coalescing latest quotes lowers writes but reduces raw reference-observation detail; separating market compute improves CPU/event-loop isolation but not shared-file writer contention; external history lowers local reads but increases provider and licensing dependence.
- **Not recommended now:** Nest adapter migration, framework/library upgrade, new paid database/service, weakening durability, market-data-as-financial-authority, deleting historical candles, or broad source redesign.

This ADR is a recommendation based on current measured evidence. It is not authorization to change Aiven policy, source, persistence, providers, services or production release.
