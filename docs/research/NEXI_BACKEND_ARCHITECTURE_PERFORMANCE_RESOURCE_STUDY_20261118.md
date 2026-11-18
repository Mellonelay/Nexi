> **Post-study source revision:** Research measurements and `99ba702` source snapshots below are historical. Subsequent market source `8d32b95a71ef` and Admin correction `ed9fbf5be171` are **committed but not deployed**. [Verification boundary](../quality/NEXI_PREBUILD_ARCHITECTURE_SOURCE_PROOF_20261118.md).

> **2026-11-18 current-source alignment:** Read this file with the [owner-approved current-source architecture authority](../architecture/NEXI_CURRENT_SOURCE_ARCHITECTURE_AUTHORITY_20261118.md) and 30-document semantic reconciliation. Current Binary/Admin implementation—including the simulated-candle Public chart path—is authoritative; dated pre-repair market measurements remain historical. Source implementation, deployed runtime and customer/economic acceptance are separate claims.

# NEXI Backend Architecture, Performance and Resource Study

**Study date:** 2026-11-18
**Repository:** /home/mellonelay1999/workspaces/Nexi
**Observed HEAD:** 99ba7024a897181ca479cf37b31a24846019c0a6
**Branch:** main; HEAD matched origin/main at capture. Tracked worktree was clean; 188 untracked items were present and preserved.
**Scope:** read-only source/runtime/provider assessment. Only this research document and its companion ADR are authorized outputs. No application source, runtime setting, service, database, provider route, dependency store, or customer state was changed. No app tests, lint, typecheck, build, browser acceptance, migration, VACUUM, backfill, load test, service restart, or deployment was run.


**2026-11-18 subsequent candidate reconciliation:** Research-time measurements, queue behavior, package versions and no-test/no-source-change statements below describe the **earlier study**, not the now-modified repository. Work subsequently separated reference and SQLite-bound processing, improved Kline revision ordering and Public trade-gap recovery; the source-review pass added optional trades/depth OpenAPI metadata. At `main@99ba7024a897`, 11 tracked edits remain uncommitted and undeployed. Focused receipts are 33 Backend tests, 17 Public tests and both TypeScript checks PASS; no production performance A/B or new-release Sentry proof exists. See [architecture reconciliation](../architecture/NEXI_ARCHITECTURE_DOCUMENT_RECONCILIATION_20261118.md). The owner's newer instructions retired the blanket source-first test ban; historical methodology remains a dated research record.

## Executive assessment

NEXI has a sound financial core: NestJS owns domain policy; SQLite is the durable financial authority; ledger postings, idempotency, Inbox/Outbox and local durable-job state are persisted before transport; Valkey/BullMQ and Socket.IO are subordinate delivery/projection mechanisms. The code also has useful safety controls: SQLite WAL with FULL synchronous durability, a five-second busy timeout, foreign keys, explicit SIWE chain 1 policy, permission guards, API DTO validation, a bounded market-ingestion queue, quote freshness/provenance rules, and source-defined Binance-only Binary settlement.

The demonstrated operating pressure is concentrated in reference-market ingestion and SQLite I/O, not general CPU or RAM exhaustion. A five-second host CPU sample was 11.47%; one 12-second sample was 14.12%. Available host memory was 5.94 GiB in the earlier snapshot; API cgroup memory varied between 0.91 GiB and 1.44 GiB during the snapshots, with a 1.45 GiB cgroup peak. The root disk was 49% used, with about 29.8 GiB available. By contrast, I/O PSI was 13.32% over its rolling 60-second window and 13.31% over five minutes in the later read. One five-second block-device sample recorded about 9.4 MB of writes. The exact storage/latency attribution is not available, but this is material enough to instrument.

The clearest source-plus-runtime issue is that the in-memory market event queue (256 entries, eight handlers) is currently saturating and drops trade/depth messages. The journal contains roughly 1,190 throttled saturation warnings over the inspected horizon; the warning is rate-limited, so it is a lower bound on affected minutes, not a message-drop count. A separate logging anomaly exists: the retention scheduler is defined once per minute and the live catch-up flag was absent, yet approximately 1,690 deletion log records appeared across 1,251 unique minutes, with up to two in a minute. The records report batches of 1,000 or 2,500 rows. This needs per-run identity/metrics before the batch total is treated as a one-to-one scheduler execution count or a stable deletion rate.

The 4.35 GB SQLite file is in WAL mode with a 16.9 MB WAL and approximately 151,000 free pages (about 0.62 GB / 14.2% of allocated pages). Incremental auto-vacuum is enabled. The existing retention path deletes at most 2,500 expired raw quote snapshots per batch and then may invoke incremental_vacuum(256), up to 1 MiB of page reclamation per completed run. This is a visible source-level write workload sharing SQLite’s single-writer serialization with financial commands and market candles; the available evidence does not establish that vacuum is the cause of the observed pressure.

**Recommendation:** retain the optimized current NestJS + Prisma/SQLite + SQLite-backed durable jobs + Valkey transport + Socket.IO design now. First add bounded, cardinality-safe observability and correct the market-ingestion pressure with coalescing/backpressure and provider coverage controls. Keep financial intent, Ledger, Outbox/Inbox and settlement evidence on SQLite. Do not migrate to a new database/service until measurements after those changes show the remaining write budget cannot be met. Use provider history for bounded display/history hydration only where the per-symbol terms and freshness rules are satisfied; never use it to replace Binance Binary settlement authority.

## Evidence classes and current identity

- **Directly observed:** SentinelX read-only host queries, cgroup/proc snapshots, live SQLite read-only connection, current Git, active systemd status, HTTP GETs, current public provider GETs, Aiven service metadata, or source contents at current HEAD.
- **Source-derived:** behavior explicitly implemented in current tracked source; it is not a runtime measurement.
- **Historical:** timestamped prior evidence or telemetry that is not current enough to treat as current runtime truth.
- **Estimate/model:** arithmetic with stated assumptions; not a benchmark or observed customer load.
- **Unknown:** capability or workload not measurable with the exposed interfaces.

The prior architecture note NEXI_SYSTEM_ARCHITECTURE.md is dated 2026-11-17 and records an older graph/source checkpoint. Its component boundaries are useful background, but the source and measurements here were checked against current HEAD. The source-closure decision recorded in NEXI_CURRENT_STATE.md is the 2026-11-17 decision at a71270f; this study does not reopen that source frontier. Current HEAD contains later commits, including 247a38f and 4a47810, and the latest commit is documentation-only. No tracked changes were present at the study snapshot.

## Measured operating baseline

Snapshot times were approximately 2026-11-18 05:21–05:51 UTC. These are bounded point observations; they are not capacity tests or latency distributions.

| Area | Direct observation | Interpretation / limit |
|---|---|---|
| Host CPU | 14.12% over one 12 s window; 11.47% over one 5 s window. Load average was about 0.40 / 0.53 / 0.50 in the earlier snapshot. | Low at those instants; does not establish peak or sustained CPU headroom. |
| Host memory | Total 8,336,912,384 B (7.76 GiB); available 6,372,220,928 B (5.94 GiB); swap 4 GiB total, 1.28 GiB used in the earlier snapshot. | Other host processes share RAM/swap. Swap use is not attributed to NEXI. |
| App cgroups | API memory.current later 979,353,600 B (0.91 GiB), peak 1,552,457,728 B (1.45 GiB); Public 129,187,840 B (123 MiB); Admin 33,656,832 B (32 MiB). Main process RSS was about 455 MiB API, 53 MiB Public, 64 MiB Admin. | cgroup memory includes more than main-process RSS and varies between snapshots. Heap, GC pause and event-loop delay were not exposed. |
| Processes | nexi-api, nexi-public and nexi-admin were active/running. API is Node 24.21.0 with /srv/nexi/backend/dist/src/main.js; Admin runs /srv/nexi/admin/current/server/index.mjs; Public is the existing Next server. Start timestamps were 2026-11-17 ~16:28–16:31 UTC. | Active at capture, not a long-term stability guarantee. |
| Filesystem | Root filesystem total 65.27 GB decimal, ~30.5 GB used and ~32.0 GB available; df reported 49% used. | About 29.8 GiB remains available. No disk growth time series was available. |
| Block I/O | Five-second /dev/sda sample: about 9.4 MB written, 825 completed writes, about 728 ms device busy time. The API cgroup cumulative stats showed about 83.6 GB written and 6.94 million write I/Os since its unit start. | Host virtual block-device sample and cgroup counters are not physical-media IOPS or write amplification. API cumulative writes include all API cgroup descendants/files and cannot be equated to SQLite pages. |
| I/O pressure | PSI some: avg10 7.98%, avg60 13.32%, avg300 13.31%; full: avg10 7.86%, avg60 12.49%, avg300 12.51%. | Sustained kernel-observed I/O stalls in the measured host windows. Attribution by process/file is missing. |
| SQLite file | /var/lib/nexi/sqlite/nexi-staging.sqlite; about 4.35 GB; WAL about 16.9 MB; SHM 65,536 B. Read-only PRAGMAs: WAL, page_size 4,096, page_count about 1,061,909, freelist about 150,965, auto_vacuum=INCREMENTAL. | Main size moved by about one page between reads during live writes. Freelist pages are reusable/reclaimable capacity, not proof all are market snapshots. |
| Retention | Source: 72 h; excludes each MarketQuoteLatest sequence; 2,500 rows per batch; catch-up up to four batches/eight seconds only with the flag enabled; environment flags for scheduler/retention were true, catch-up flag absent. | Logs reported removals of 1,000 or 2,500 rows and two entries in some minutes. Log/run attribution is unresolved. No production cleanup was triggered by this study. |
| Logs | About 4,772 API journal lines in the inspected horizon; about 1,189 once-per-minute-throttled queue saturation warnings; 1,076 mentioned trade and 113 depth. About 1,691 retention log lines reported 880 × 1,000 and 811 × 2,500 rows. | Retention total is a sum of log claims, about 2,907,500 rows, not an independently counted unique-row delta; it conflicts with one scheduler per minute and no catch-up flag. Do not use it as an ingestion-rate benchmark. |
| HTTP | One local GET each: /ops/live 200 (~15 ms TTFB), /readyz 200 (~83 ms), Public /dashboard 200 (~7 ms), Admin /overview 200 (~57 ms). One external HTTPS GET each returned 200, TTFB approximately 104–172 ms. | Single samples, no concurrency, p95/p99 or error-rate inference. /readyz body directly reported SQLite and Redis ready and authority SQLite. |
| Aiven Valkey | nexi-staging-valkey RUNNING, plan free-1, price shown as $0, one 1-vCPU / 1-GiB node, Valkey 9.1.2, TLS required, no HA/server group. Configuration reports 0.0.0.0/0 and ::/0 IP filters and default user ACL +@all / all keys. | This is current configuration metadata, not proof of compromise. It is a security and availability concern for the owner to resolve. Aiven metric tool returned data timestamped 2026-10-18 (about a month old), so its CPU/memory/disk series were not used as current measurements. |
| Sentry/tracing | Backend instrument.ts initializes Sentry before Nest, tracesSampleRate=0.05 and disables request bodies, headers, cookies, user info and database query data. Sentry metrics are emitted by some schedulers. A Jaeger process was seen in the host process snapshot. | No current Sentry/Jaeger event, exporter, end-to-end trace, or usage-cost read was performed. Backend source inspected here contains Sentry initialization, not verified Jaeger/OpenTelemetry export. |
| Dependency versions | Installed server package versions resolved under the application dependency root: Nest core/platform-express 12.0.3; schedule 12.0.2; @nestjs/bullmq 12.0.0; BullMQ 6.3.15; Prisma/client 7.10.1; better-sqlite3 12.11.1; Socket.IO 4.8.3; Redis Streams adapter 0.3.0. | Versions are runtime dependency metadata; no package upgrade was made. |

### Database and persistence findings

The database has 4 KiB pages and uses WAL. SQLite’s documented WAL behavior allows concurrent readers and a writer but still permits only one writer at a time; long readers can delay checkpoint progress. The source configures synchronous=FULL, foreign_keys=ON and busy_timeout=5000 on each Prisma adapter connection and validates WAL mode. The local SQLite command bridge uses explicit atomic batching and BEGIN IMMEDIATE in the current owner path. This is a deliberate correctness choice; do not relax durability or add a competing financial writer.

Observed schema contains LedgerAccount/LedgerPosting, EventOutbox/EventInbox, LocalDurableJob and replay/workflow journal tables. Relevant indexes exist for ledger idempotency/account chronology, outbox state/availability and idempotency, quote latest, quote snapshot sequence/receivedAt, and Kline pair/interval/openTime and interval/openTime. Kline storage is unique by pair/interval/openTime. No table-size attribution was run: DBSTAT over the roughly 1.06 million pages was intentionally not scanned. Per-table bytes, Kline row counts, WAL checkpoint age, query-plan use frequency, write-transaction latency and lock-wait histograms remain unknown.

The retention scheduler is explicit and bounded, but the same database file contains financial writes, market snapshots, Klines and local durable queue state. Each completed snapshot cleanup may also request up to 256 incremental-vacuum pages. A data-preserving next step is to measure delete count, vacuum duration/pages reclaimed, WAL checkpoint progress, SQLITE_BUSY/LOCKED counts and financial transaction latency together. Do not execute VACUUM or change retention during that measurement.

### Current application and supporting service topology

- Backend: one NestJS 12 process (API port 3002) owns API policy and DB access; SQLite authority is the current live file above.
- Public: Next.js mobile WebApp on the existing local port 3000, routed through the existing HTTPS domain.
- Admin: TanStack/Vite/Nitro desktop console on local port 3001, routed through the existing HTTPS domain.
- Nginx/systemd: service status and one bounded set of local/external GETs were checked. Per-route request counts, Nginx worker capacity and access-log storage/latency overhead were not available.
- Valkey: a single Aiven free-1 service is currently RUNNING. Runtime readiness returned Redis=true. The application uses Valkey-compatible Redis connections for asynchronous queue wakeups, Socket.IO Streams and pub/sub/locks. A local Valkey process on the VM was not established as NEXI’s configured endpoint.
- Background jobs: the live API process had NEXI_SQLITE_LOCAL_ENABLED=true and NEXI_LOCAL_ASYNC_ENABLED=true. SQLite journals own durable job state; BullMQ/Valkey is wake-up/dispatch transport. The process source configures three queues, one worker each at concurrency 1 and a one-second durable poll cycle.
- Realtime: Socket.IO uses the Redis Streams adapter, stream maxLen 10,000 and connection-state recovery up to 120 seconds. MarketGateway consumes quote/Kline/reference channels, rejects non-increasing per-symbol sequences and emits to connected clients. Per-client counts, fan-out rate and reconnection success are not instrumented in the evidence reviewed.
- Provider startup logs from the running API process report active providers: Binance Spot, MOEX, BiQuote, Yahoo and Gate. Database configuration lists nine active provider records, but runtime startup did not report OKX, Bitget, HTX or Bybit as active. Treat DB ACTIVE as configuration, not as proof an adapter is currently running.

## Market data: actual pipeline and bottleneck

Current path is provider adapter → provider router and source policy → normalized event → MarketIngestService bounded in-memory queue → authority/freshness checks → latest quote/snapshot and Kline persistence through the SQLite owner → Redis pub/sub/Streams → Socket.IO gateway → Public/Admin REST/socket consumers.

MarketIngestService sets eight concurrent consumers. The in-memory queue is capped at 256; ticker/depth events can be coalesced by kind/symbol/provider. When full it drops an older trade/depth event first, otherwise falls back to the oldest item; the warning is throttled to once per minute. This is an explicitly lossy reference-data queue, not the durable financial job journal. Current warning evidence establishes recurring pressure but not the queue’s current depth, exact lost count, per-provider rate, per-event age or the event-loop time spent processing.

Quote snapshots are raw, non-authoritative market evidence with a 72-hour cleanup policy; latest quote lineage is retained. Klines are persistent and keyed/deduplicated by instrument, interval and open time. Seven chart intervals are 1m, 5m, 15m, 30m, 1h, 4h and 1d. The router can use closed 1m bars to derive coarser bars. No Kline expiration policy was found in the inspected current market path; that is an unresolved storage-horizon decision, not an authorization to delete history. Trade/depth schemas exist, but the inspected ingestion path treats live trade/depth as realtime reference events rather than financial evidence.

The provider registry and database must be read together. Static source policy names candidates; DB mappings/statuses narrow them; provider startup logs show which adapters report active; a public probe confirms provider response/freshness only for the requested instruments and moment. These are different proof levels.

### Complete 53-pair capability matrix

Live probe captured 2026-11-18 around 05:40 UTC. Provider values were not copied into this report. Binance’s public exchangeInfo batch request returned all 17 configured crypto symbols in TRADING status. BiQuote’s single batched latest request returned all 31 enabled mappings. Its 8 configured FX and 7 metal symbols reported open/fresh; its 16 returned stock symbols reported marketState=closed and stale=true at the capture time. That is an expected closed-session state for the capture, not a failure or a fresh quote. No live OHLC availability was probed for 53 × 7 intervals. The listed fallbacks are current source/DB configuration, not all runtime-verified.

| Pair | Class | Current primary / configured fallback | Probe result |
|---|---|---|---|
| ADAUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| BCHUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| BTCUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| DOGEUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| DOTUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| ETCUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| ETHUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| FILUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| LTCUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| MASKUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| SOLUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| STEEMUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| SUNUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| SUSHIUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| TRXUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| USDCUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| XRPUSDT | Crypto | Binance Spot; no other active crypto mapping in the DB | Binance TRADING |
| AUDUSD | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| EURUSD | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| GBPUSD | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| USDCHF | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| USDCNH | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| USDHKD | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| USDJPY | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| USDRUB | FX | MOEX primary; Yahoo fallback; BiQuote mapping is DB-disabled but router source code has a separate session-oracle inclusion | No direct MOEX/BiQuote probe |
| USDTHB | FX | BiQuote primary; Yahoo fallback; static exchange candidates are filtered by source coverage | BiQuote open/fresh |
| XAGUSD | Metal | BiQuote primary; Yahoo and source-covered exchange candidates | BiQuote open/fresh |
| XALUSD | Metal | BiQuote primary; Yahoo and source-covered exchange candidates | BiQuote open/fresh |
| XAUUSD | Metal | BiQuote primary; Yahoo and source-covered exchange candidates | BiQuote open/fresh |
| XCUUSD | Metal | BiQuote primary; Yahoo and source-covered exchange candidates | BiQuote open/fresh |
| XPDUSD | Metal | BiQuote primary; Yahoo and source-covered exchange candidates | BiQuote open/fresh |
| XPTUSD | Metal | BiQuote primary; Yahoo and source-covered exchange candidates | BiQuote open/fresh |
| XZNUSD | Metal | BiQuote primary; Yahoo and source-covered exchange candidates | BiQuote open/fresh |
| AAPLUSDT | Stock | BiQuote primary; Yahoo/Gate fallback; Gate is mapped for stocks | BiQuote closed/stale at capture |
| AMDUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| AMZNUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| AXPUSDT | Stock | Gate primary; Yahoo fallback; BiQuote disabled in DB | No direct provider probe |
| BAUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| DISUSDT | Stock | Gate primary; Yahoo fallback; BiQuote disabled in DB | No direct provider probe |
| GOOGUSDT | Stock | BiQuote primary (provider symbol GOOGL); Yahoo/Gate fallback | BiQuote closed/stale at capture |
| JNJUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| KOUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| MCDUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| METAUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| MSFTUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| NFLXUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| NKEUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| NVDAUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| SONYUSDT | Stock | Gate primary; Yahoo fallback; BiQuote disabled in DB | No direct provider probe |
| TSLAUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| UBERUSDT | Stock | Gate primary; Yahoo fallback; BiQuote disabled in DB | No direct provider probe |
| WFCUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |
| WMTUSDT | Stock | BiQuote primary; Yahoo/Gate fallback | BiQuote closed/stale at capture |

The database records 53 ACTIVE MarketPair rows (17 crypto, 9 FX, 7 metals, 20 stocks) and 55 MarketAsset rows. The two counts are different schema entities; 55 asset records does not mean 55 tradable pairs. Keep the canonical 53-pair catalog unchanged while documenting the distinction.

The 16 enabled BiQuote stock symbols are served with provider aliases where required (GOOGUSDT uses GOOGL). Four stock mappings (AXP, DIS, SONY, UBER) and USDRUB are disabled in MarketProviderSymbol. Current source policy marks the four stocks as not BiQuote quote-covered and selects Gate as primary. Source code includes USDRUB in a special BiQuote session-oracle selection despite the DB-disabled mapping; this source/config distinction needs a narrowly targeted regression contract before future routing changes.

#### Provider contract and licensing

- Binance public exchangeInfo verified current listing status for the 17 NEXI crypto spot pairs. Binance provider is the explicit settlement authority for eligible Binary crypto instruments in source policy. This live listing probe is not a statement about commercial redistribution rights.
- BiQuote docs/terms claim public REST, batched latest quotes, a SignalR tick hub, 15,000 requests/minute/IP at time of docs, and OHLC rolling windows up to 300 M1, 288 M5, 192 M15/M30, 168 H1, 180 H4 and 500 D1 bars. Docs say use is allowed in a product, including commercial display/storage, subject to terms, but do not resell/redistribute raw feed or represent it as exchange-licensed or guaranteed tradable data. The provider may change rate limits. Data includes Yahoo bootstrap, tick aggregation and MT5 feeds; it is reference/display data.
- Live BiQuote quote probe confirmed current response/freshness for 31 mapped symbols only. It did not verify 31×7 OHLC history, data gaps, session reopen freshness, sustained uptime, or provider SLA.
- Current runtime startup log reported Binance, MOEX, BiQuote, Yahoo and Gate active. OKX, Bitget, HTX and Bybit were not in the startup active list even though their DB rows are marked ACTIVE. Do not count them as effective fallbacks today. CoinGecko/CoinMarketCap are static crypto candidates but not active DB mappings/runtime startup providers.
- Static provider registry contains additional candidate names (OANDA, Fawaz Currency, Metals API, Metalprice, Alltick, Massive, Finnhub, Alpha Vantage and others). They are not the five startup-reported active adapters. Their source presence is not proof of credentials, live coverage, license, maintenance state or routability.
- Binary settlement remains separate from chart/reference prices: source policy uses Binance Spot, last-trade price, observed at/after expiry, max staleness 30 seconds, with retry outage policy. No other source should silently substitute.

## NestJS and ecosystem assessment

Installed versions are exact above. Official NestJS v12.0.3 docs and the attached official documentation index were used to compare behavior. Current docs describe NodeAdapter recommendations starting in v12.3; current installed 12.0.3 is below that feature floor, and there is no measured adapter bottleneck. Do not upgrade or migrate adapters on the basis of a synthetic hello-world benchmark.

| Area / capability | Classification | Evidence and recommendation |
|---|---|---|
| Domain modules and DI | EXISTING_AND_EFFECTIVE | AppModule composes domain modules for auth, market, ledger, financial operations, settlement, admin, communications, jobs and observability. Domain providers use Nest DI and lifecycle hooks. Preserve module owners; no request-scope overhead was found in the inspected path. |
| HTTP adapter | EXISTING_BUT_UNDERUTILIZED | NestExpressApplication / ExpressAdapter is in use. At the observed workload it is not a demonstrated bottleneck. Do not switch to Fastify or NodeAdapter until a production-shaped benchmark at current version proves controller/database time is not dominant. NodeAdapter recommendation in docs is v12.3+, not the installed v12.0.3. |
| DTO validation | EXISTING_AND_EFFECTIVE | Global ValidationPipe uses whitelist, forbidNonWhitelisted, transform and implicit conversion. Keep this default; audit high-volume DTO transform cost only after endpoint timing exists. |
| OpenAPI | EXISTING_AND_EFFECTIVE | Swagger document is built at bootstrap and serves docs/docs-json. Regenerate/compare contracts only in an authorized source phase. |
| Configuration | EXISTING_AND_EFFECTIVE | Global ConfigModule validates runtime environment before feature modules. Preserve fail-closed checks on SQLite path and provider settings. |
| Provider lifecycle | EXISTING_AND_EFFECTIVE | RuntimeLifecycleService and Nest OnModuleInit/OnModuleDestroy start/stop providers and Redis resources. Startup-reported active list is useful but lacks continuous freshness/connection gauges. |
| Auth, SIWE, Admin RBAC | EXISTING_AND_EFFECTIVE | Source enforces Ethereum mainnet chain id 1, challenge domain/URI/nonce/time match, JWT/surface/role/permission guards and an auth rate limiter backed by Redis. Do not generalize reference-price or cache shortcuts into auth/economic writes. |
| Global throttling | EXISTING_BUT_UNDERUTILIZED | Specific authentication endpoints use AuthRateLimitGuard; no global Nest throttler was found in the inspected bootstrap. Decide other route limits from measured endpoint risk and traffic, not blanket limits. |
| Scheduling | EXISTING_AND_EFFECTIVE | @nestjs/schedule drives settlement, outbox, retention and operator tasks. Some schedulers have Redis leases. Add scheduler-run IDs, durations, counts and duplicate-run metrics; retention log/schedule counts currently do not reconcile. |
| Background queues | EXISTING_AND_EFFECTIVE | BullMQ 6.3.15 direct Queue/Worker clients are in LocalAsyncRuntimeService; three workers, concurrency 1. SQLite LocalDurableJob/Outbox is authoritative, Valkey wakes workers. @nestjs/bullmq 12.0.0 is installed but not used; a Nest decorator wrapper gives no demonstrated improvement to durable semantics. Retain custom transport ownership. |
| Health/readiness | EXISTING_BUT_UNDERUTILIZED | Custom /ops/live and /readyz work; current ready response reports SQLite=true and Redis=true. Readiness does not surface market queue saturation, provider freshness, worker poll health, Outbox age or Socket.IO delivery health. Add separate diagnostic metrics rather than making market-provider outage fail financial API liveness. |
| SQLite and Prisma | EXISTING_AND_EFFECTIVE | Prisma 7.10.1 uses better-sqlite3 12.11.1, with explicit durability settings; dedicated worker bridge owns atomic batches. Retention/market writes use the same SQLite file and therefore share the single-writer limit. Measure before moving market data. |
| Realtime gateway | EXISTING_BUT_UNDERUTILIZED | Socket.IO 4.8.3 with Redis Streams adapter 0.3.0, 120-second recovery, stream maxLen 10,000, monotonic sequence filtering and REST snapshot on connect. Global emit/fan-out and per-client reconnect metrics are absent; add metrics and verify catch-up semantics. |
| Provider retries/circuit behavior | INSUFFICIENT_EVIDENCE | Adapter source has timeouts/retry policies in several providers, but no consolidated runtime failure-rate, open-circuit, reconnect or provider-gap telemetry was available. Do not infer a system-wide circuit breaker. |
| Compression/response serialization | INSUFFICIENT_EVIDENCE | No global compression or response serializer was configured in main.ts. Nginx may compress; active Nginx behavior was not measured. Check response bytes/CPU before adding middleware. |
| Sentry/telemetry | EXISTING_BUT_UNDERUTILIZED | Sentry traces are sampled at 5%, sensitive request data is disabled/scrubbed, and selected scheduler metrics exist. There is no verified event-loop delay/GC/SQLite writer/queue-saturation dashboard or NEXI-to-Jaeger export. Preserve privacy filtering and add bounded custom metrics. |
| Microservice transports / GraphQL | NOT_NEEDED | NEXI’s single-vhost Nest API, SQLite authority and current asynchronous transport do not show a workload requiring a second Nest transport or GraphQL. Avoid adding framework surface without a product/API need. |

Official references consulted: [NestJS performance and adapters](https://docs.nestjs.com/techniques/performance), [validation](https://docs.nestjs.com/techniques/validation), [queues](https://docs.nestjs.com/techniques/queues), [scheduling](https://docs.nestjs.com/techniques/task-scheduling), [gateways](https://docs.nestjs.com/websockets/gateways), [Termin(us) health checks](https://docs.nestjs.com/recipes/terminus), [Prisma SQLite](https://www.prisma.io/docs/orm/overview/databases/sqlite), [BullMQ workers](https://docs.bullmq.io/guide/workers), [BullMQ retries](https://docs.bullmq.io/guide/retrying-failing-jobs).

## Storage scenarios and cost model

These are explicitly modeled rows/bytes, not measured database growth.

**Continuous-candle row model:** if each of the 53 pairs produced one candle for every interval continuously, the theoretical maximum is 100,859 Kline rows/day across 1m, 5m, 15m, 30m, 1h, 4h and 1d. Real FX/stock/metal calendars reduce this. At 30/90/365 days that is 3.03M / 9.08M / 36.81M rows. With an assumed effective 128 / 256 / 512 bytes per row including index overhead:

| Horizon | Rows at theoretical continuous maximum | 128 B/row | 256 B/row | 512 B/row |
|---|---:|---:|---:|---:|
| 30 days | 3,025,770 | 0.39 GB | 0.77 GB | 1.55 GB |
| 90 days | 9,077,310 | 1.16 GB | 2.32 GB | 4.65 GB |
| 365 days | 36,813,535 | 4.71 GB | 9.42 GB | 18.85 GB |

Assumptions: all instruments produce a candle for every interval; no market closures or missing data; effective row+indexes between 128 and 512 bytes; decimal GB. Actual row bytes, write rate, Kline count and table allocation were not measured. Do not use these values to delete or migrate Klines.

**72-hour quote snapshot scenario:** snapshots are time-bounded, so their raw component should approach a rolling 72-hour envelope after backlog convergence. At 53 instruments, an assumed 1 KiB effective row+index footprint gives about 0.14 / 1.41 / 14.07 GB for 0.01 / 0.1 / 1 accepted snapshot per second per instrument over 72 hours. This sensitivity model shows why accepted snapshot rate and row footprint must be measured; neither is currently available. Financial data, latest quote lineage and persistent Klines are outside that raw-snapshot envelope.

**Total DB projection for 30/90/365 days is UNKNOWN.** The current 4.35 GB file is a single point and the report cannot separate market snapshots, Klines, financial journals and reusable pages without a safer table-size profile. Permanent financial/event growth is not measured. No linear extrapolation of 4.35 GB is justified.

**Costs observed:** Aiven Valkey plan metadata showed $0 for free-1. The VPS monthly invoice, egress, Sentry billing/usage, domain/Nginx and other infrastructure charges were not exposed; total monthly operating cost is UNKNOWN. The alternative of a paid time-series database has no defensible price until provider/plan/retention/region and required capacity are selected. No paid dependency is recommended in this study.

## Architecture alternatives and scenario comparison

| Architecture | Correctness / customer behavior | Resources and storage | Reliability / complexity / cost | Assessment |
|---|---|---|---|---|
| 1. Optimize existing NestJS + Prisma/SQLite + BullMQ/Valkey + Socket.IO | Keeps current financial single authority and existing APIs; lowest migration risk. Market events still share SQLite and the in-memory queue until tuned. | No new service. Raw snapshots remain 72 h; Kline growth follows actual retention. First quantify write counts and cap market write rate. | Existing Valkey free-1 is one node with no HA; data remains in SQLite journals. New recurring service cost $0. Engineering effort low-to-medium. | Immediate baseline option and the recommended first phase. |
| 2. Separate hot market processing/cache/aggregation from financial command handling on the existing host | Can isolate provider CPU/event-loop work, coalesce latest quotes and prevent lossy microstructure bursts from competing with durable financial commands. REST and Socket contracts remain stable. | No paid service, but extra worker memory/CPU. If it still writes all events into the same SQLite file, SQLite writer contention remains. Coalescing interval and durable candle rules determine actual write reduction. | Adds a process and lifecycle/metrics ownership, but preserves VM and financial state. No cost increase assumed. | Preferred target evolution after instrumentation; logical/process separation is justified by actual drop warnings, while database split is not yet justified. |
| 3. Provider-assisted historical market data | Can hydrate bounded chart history and reduce repeated local polling. Provider outages, symbol/session semantics and source revisions must be shown to clients. Must not replace Binary settlement source. | Could lower local history only if owner approves a retention horizon and reconstruction contract. BiQuote publishes rolling limits, not an archive SLA. Raw data cannot be redistributed under its terms. | BiQuote documents free product display/storage subject to terms; upstream may change. Binance terms need separate commercial-use review. External availability adds risk. | Use as a bounded reference/history supplement; maintain local current Klines and provenance. It does not by itself solve the local writer queue. |
| 4. Hybrid with separate market store (for example, a dedicated time-series database) | Strong hot/cold split and more independent market write throughput; financial DB remains SQLite. Requires cross-store freshness/provenance and recovery guarantees. | Additional storage/CPU/network; cost is unknown and non-zero likely. Removes market writes from SQLite only if producer/consumer boundaries truly separate. | New backup, security, monitoring, migrations and failure modes. Not authorized as a new service now. | Defer until post-optimization metrics demonstrate SQLite market writes breach the budgets below for two representative windows. |

### Workload scenarios (no invented customer load)

- **Observed baseline:** 53 active pairs, 5 startup-reported provider adapters, API readiness SQLite+Redis true, current CPU samples 11–14%, current DB 4.35 GB, recurrent capped-queue warnings, elevated rolling I/O PSI. No customer concurrency or requests/s observed.
- **Elevated 2× market input scenario (assumption only):** if provider events arrive at twice the current rate while handler capacity remains fixed, a 256-item queue reaches saturation sooner; source can coalesce ticker/depth but may discard trade/depth and, in the fallback branch, oldest queue work. Required proof is accepted events/sec and processed events/sec per provider/event type plus queue high-water and drop counters. Do not call 2× a production benchmark.
- **Valkey interruption:** SQLite durable jobs and Outbox records remain the source of truth; producers can leave work pending for the one-second dispatcher to redispatch after connectivity returns. Readiness becomes false because Redis is a required dependency. Socket.IO and market publish may pause; clients should recover with a REST snapshot. Connection recovery is bounded at 120 seconds and stream retention at 10,000; beyond recovery, sequence gap/resnapshot is necessary.
- **SQLite writer slowdown:** retention deletes, market snapshot/Kline writes and financial commands serialize at the SQLite writer. A long reader can hold WAL checkpoint progress. Recovery must be measured without lowering synchronous durability or replaying economic transactions.
- **Market session/provider outage:** display quotes should carry open/closed/stale/fresh state. Historical/reference fallback may be used only where the symbol/provider mapping and license allow. Binary settlement remains Binance Spot with current source policy; fail closed/retry according to its settlement contract.

## Initial performance budgets (provisional, to calibrate)

These are recommended observability gates, not current SLAs and not measured results. Record baselines for at least two representative weeks and calibrate with isolated, production-shaped workloads before setting alerts that page operators.

| Signal | Initial budget / guard | Reason |
|---|---|---|
| Market queue | High-water below 128/256 for sustained normal periods; 0 silent drops for quote/Kline events; explicit counted coalesces and trade/depth loss; oldest required event age <2 s. | Current queue logs demonstrate overflow but not loss counts. Lossy microstructure must be distinguishable from chart quote/candle continuity. |
| Provider freshness | Crypto UI reference quote p95 age ≤2 s while provider session is live; closed-session instruments must explicitly report closed and stale. Binary settlement source remains current 30 s source limit. | Based on current source policy; UI threshold is provisional. |
| API latency/error | Read endpoints p95 ≤200 ms and p99 ≤500 ms under agreed load, excluding provider wait; 5xx <0.1%. | Single GET samples are lower than these but cannot establish distribution. |
| SQLite writer | Financial command p95 ≤50 ms, p99 ≤100 ms; SQLITE_BUSY/LOCKED=0 in steady state; measure separate market/retention waits. | Preserve FULL durability and expose contention instead of hiding it with longer timeouts. |
| WAL/checkpoints | Alert on WAL growth and checkpoint age; initial target WAL <256 MiB p95 and no checkpoint backlog beyond 5 minutes, to be validated against real write rate. | Current WAL 16.9 MB is a point snapshot only. |
| Storage | Keep existing main+WAL 12/15/18 GB warning/maintenance/critical thresholds; filesystem warning at <15 GiB free. | Current source already defines 12/15/18 GB advisory thresholds; root has about 29.8 GiB free. |
| Host resources | Under agreed peak replay, CPU <70% sustained, available RAM >1.5 GiB, and no rising OOM/swap trend. Treat I/O PSI avg60 >5% for 15 min as an investigation trigger, not a deployment failure alone. | Current samples show low CPU, ample memory, but rolling I/O PSI above this proposed threshold. |
| Durable queue | Oldest unprocessed durable event <5 s under normal load; queue age and retry/failure counts by queue; no financial event silently discarded. | SQLite journals are durable; queue lengths and oldest age are presently unknown. |
| Socket.IO | Track active connections, emitted events, publish failures, sequence gaps, reconnect-to-snapshot success and p95 recovery time. Initial goal p95 recovery <5 s; never count emit() success as financial commit proof. | Current recovery is bounded but client outcomes are not observed. |

## Skill and capability application evidence

| SKILL / capability | PURPOSE | ACTION PERFORMED | EVIDENCE | FINDING |
|---|---|---|---|---|
| NEXI Work Entry | Establish authority, scope and execution routing | Read and applied the Work operating/runbook path; used SentinelX native read-only host operations, not a VM Kernel route | Attached NEXI Work Engineering Operating Runbook and Tool Catalog; SentinelX scripts/read/exec results | Work reasoning/controller instructions were used; no Work app-specific operation beyond currently exposed skills/tools is claimed. |
| NEXI Work Backend + NestJS review | Trace backend module, runtime, data, security and queue ownership | Inspected active source, installed dependency metadata, SQLite service, outbox, local async runtime, adapter and readiness source | backend/src/main.ts, app.module.ts, d1/d1-prisma.service.ts, jobs/local-async-runtime.service.ts, events/*, market/*; current installed versions | Core financial/persistence ownership is coherent; market pressure and observability gaps are demonstrated. |
| NEXI SQLite Engineering | Preserve WAL, durability, financial evidence and storage boundaries | Read-only PRAGMA/schema/index snapshot; compared it to retention and Prisma source | SQLite readonly connection: WAL, 4096-byte page, incremental auto-vacuum, freelist; official SQLite WAL/PRAGMA/backup references | No database mutation performed. The large freelist and retention vacuum behavior require measurement, not VACUUM. |
| NEXI BullMQ/Valkey + Socket.IO | Evaluate durable transport, Redis usage and realtime recovery | Inspected custom SQLite journal + BullMQ workers and Redis Streams gateway; queried Aiven plan/service metadata | LocalAsyncRuntimeService: 3 queues, concurrency 1; Aiven service RUNNING free-1; Socket adapter maxLen 10,000/recovery 120 s | SQLite owns durable state; Valkey is a shared single-node transport, with security/availability limits. |
| NEXI Graphify | Locate producer/consumer owners without treating graph as runtime proof | Used bounded local graph and Knowledge v4 locators, then verified exact current source | Market ingest, provider router, Kline and gateway source cross-check | Graph was used as a locator; no graph-only conclusion is presented. |
| Data Analytics index | Route the Data work | Read the index and selected analysis, validation, business analysis and report methods | Loaded data-analytics:index and applied specialists listed below | Appropriate available Data analytical skills applied. |
| Data Analytics analyze-data-quality | Separate grain, freshness, coverage and missing evidence | Reconciled 53 MarketPair rows vs 55 MarketAsset rows, time-window logs, stale provider values and storage unknowns | Read-only SQLite grouped queries, log aggregates, BiQuote freshness status, Aiven stale metric timestamps | Measurement limits are explicit; no inference from missing metrics. |
| Data Analytics validate-data | Check metric scope and comparability | Verified current Git/source identity, metric window and units; treated cgroup I/O as logical counters, not physical write amplification | Git HEAD/status, cgroup/proc samples, SQLite PRAGMAs, Aiven metric timestamps | Confirmed, historical, modeled and unknown values are separated. |
| Data Analytics product-business-analysis | Compare designs and prioritize value/risk/cost | Compared four architectures against financial authority, customer behavior, resource load, risk and known pricing | Four-option matrix and explicit conditional recommendation | Optimize existing system first; defer a paid store. |
| Data Analytics build-report | Produce a decision-ready research report | Structured evidence, recommendations, assumptions and roadmap in this document and the companion ADR | Two requested docs saved to repo | Research is inspectable and implementation-ready, with unresolved owner decisions isolated. |
| Vibe Coding Library performance-budget-audit | Tie budgets to measurements and avoid unsupported thresholds | Loaded and applied the performance budget audit workflow | Workflow selected from reliability catalog; provisional budgets tie to observed baselines and state their calibration requirement | Budgets are proposed gates, not claimed current SLAs. |
| Context7 | Verify installed framework-version capabilities | Resolved NestJS, Prisma and BullMQ docs; queried Nest v12.0.3, Prisma 7.10.1 and BullMQ 6.3.11 indexed docs against installed versions | Context7 sources; installed server package versions independently read | Nest NodeAdapter docs apply from v12.3, above the installed v12.0.3. |
| Exa | Primary-source research | Searched official SQLite, NestJS and BiQuote documentation/terms | sqlite.org, docs.nestjs.com, biquote.io terms/docs result URLs | Used for documented WAL, framework capability and BiQuote terms, not runtime proof. |
| Firecrawl | Secondary discovery | Searched BiQuote documentation and located the provider reference page | Firecrawl result linked Context7 BiQuote content; Exa official BiQuote page/terms used for factual claims | Search was used as a locator; the captured provider docs and official terms support the claims. |
| Binance MCP | Public market capability query | Invoked exchangeInfo query, which failed with transport closed; then queried the official public exchangeInfo endpoint through SentinelX with a bounded, read-only request | Binance API returned HTTP 200 and 17/17 configured crypto symbols TRADING | Direct API result was used; Binance MCP success is not claimed. |
| Wolfram | Independent scenario calculation | Invoked WolframAlpha, which returned an internal tool error; scenario arithmetic in the report was computed from explicit formulas | Tool error; transparent formulas for candle and snapshot scenarios | Wolfram result was unavailable; no Wolfram output is represented as evidence. |
| Production Data Engineering Copilot | Route nontrivial data-platform work | This earlier coverage statement was incomplete; the executor-owned catalog was paginated and its router plus task-relevant specialists were read and applied in the corrected follow-up below. | Full executor catalog: 18 PDEC skills exposed; current source/log/runtime evidence used | Prior “not exposed” conclusion is superseded. |

## Unmeasured risks / evidence still needed

1. Per-process event-loop delay, heap/GC, request throughput/latency histograms, provider bytes, CPU profiles and Nginx request counts.
2. Current provider quote/Kline success/error/freshness by the full 53 × seven-interval matrix outside this one snapshot. In particular, stock quotes must be probed during their open session.
3. Queue depth/high-water/drop count and event age by type/provider; market processing capacity and dropped trades/depth per second.
4. Socket connection count, emitted/fan-out volume, client reconnect success, sequence gaps and recovery snapshot cost.
5. Current Valkey used memory, command rate, queue depth, per-queue job latency/retries and connection count. Aiven’s available VM metric history was stale; its connector did not expose current Redis queue counters here.
6. SQLite table bytes, market snapshot/Kline/financial row counts, exact disk write attribution, checkpoint age, busy latency, and Kline growth rate. No full-page DBSTAT scan or production load test was run.
7. Sentry release telemetry, actual Jaeger/OTel export, monthly Sentry cost and VPS invoice/egress.
8. Full commercial/provider rights for Binance data and any unconfigured fallback vendor; API reachability is not a redistribution license.
9. Cause of retention log count exceeding one per minute; scheduler run identity is absent in the examined log lines.

## Source and reference index

Current source owners inspected:

- backend/src/main.ts; backend/src/app.module.ts; backend/src/runtime/runtime-lifecycle.service.ts; backend/src/observability/instrument.ts and readiness.service.ts
- backend/src/d1/d1-prisma.service.ts; backend/src/d1/local-sqlite-bridge.service.ts; backend/src/d1/d1-financial-command.gateway.ts
- backend/src/events/event-outbox.service.ts; backend/src/events/event-outbox.scheduler.ts; backend/src/jobs/local-async-runtime.service.ts; backend/src/jobs/durable-queue.transport.ts; backend/src/jobs/local-durable-job.store.ts
- backend/src/market/market-ingest.service.ts; market-provider-router.service.ts; market-source-registry.ts; market-quote-retention.scheduler.ts; market-kline.service.ts; market.gateway.ts; prisma/redis-io.adapter.ts
- backend/package.json and live SQLite schema/indexes.

Official external references:

- SQLite WAL, checkpoint, PRAGMA and online backup: https://sqlite.org/wal.html, https://sqlite.org/pragma.html, https://sqlite.org/backup.html, https://sqlite.org/dbstat.html
- NestJS 12 documentation: https://docs.nestjs.com/techniques/performance, https://docs.nestjs.com/techniques/validation, https://docs.nestjs.com/techniques/queues, https://docs.nestjs.com/techniques/task-scheduling, https://docs.nestjs.com/websockets/gateways, https://docs.nestjs.com/recipes/terminus
- Prisma 7 SQLite: https://www.prisma.io/docs/orm/overview/databases/sqlite
- BullMQ: https://docs.bullmq.io/guide/workers, https://docs.bullmq.io/guide/retrying-failing-jobs, https://docs.bullmq.io/guide/connections
- BiQuote docs and terms: https://biquote.io/docs/, https://biquote.io/terms.html
- Binance Spot exchangeInfo: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-endpoints#exchange-information

The next implementation assignment can proceed from the phased roadmap and companion architecture decision without reopening the source closure, re-running broad static analyses, or rediscovering the provider/queue/storage contracts recorded here.

## Follow-up specialist pass — live delta (2026-11-18 07:12 UTC)

This bounded continuation reuses the study above and refreshes only volatile/runtime evidence. It does not reopen source closure or change the architecture decision.

### Fresh read-only measurements

| Signal | Direct observation | Interpretation |
|---|---|---|
| Source identity | HEAD 99ba7024a897181ca479cf37b31a24846019c0a6, branch main; tracked worktree clean | Matches the earlier study checkpoint; no application source was changed. |
| Services | nexi-api, nexi-public, nexi-admin active; local valkey.service inactive | Do not infer Valkey outage from the local unit: current Aiven metadata says managed nexi-staging-valkey is RUNNING. |
| API readiness | Local /ops/live = 200; /readyz = 200 with database=true, redis=true, authority=SQLite | Bounded readiness result, not a queue-depth or sustained-availability test. |
| Host | 7.76 GiB RAM; 5.99 GiB available; 1.29 GiB swap used; root filesystem 49% used, 29.78 GiB available | Host is not near memory or disk exhaustion at this instant. Swap attribution remains unknown. |
| CPU and I/O pressure | One 3-second CPU delta: 16.86% busy. I/O PSI at sample end: avg10 5.33%, avg60 7.21%, avg300 8.12%; prior same-day bounded read had avg60 13.32%, avg300 13.31%. | Recent rolling pressure is lower than that earlier observation; short samples do not establish peak utilization or resolve I/O attribution. |
| App cgroups | API memory.current 1.07 GiB, peak 1.45 GiB; Public 139.5 MiB; Admin 34.3 MiB. API cumulative cgroup I/O: 93.76 GB written / 7,782,731 write I/Os. | Cumulative logical cgroup counters since service start, not physical-device write amplification or SQLite-only writes. |
| SQLite | Main file 4,349,173,760 B; WAL 16,867,312 B; WAL mode, 4,096-byte pages, 1,061,810 pages, 166,526 freelist pages; incremental auto-vacuum mode. | Freelist is 650.49 MiB (15.68% of pages), about 60.79 MiB / 15,561 pages above the earlier 150,965-page sample. This indicates reusable pages, not proven reclaimable file size or a proven retention defect. No VACUUM/checkpoint was run. |
| Provider cross-check | Binance MCP single-symbol exchangeInfo for BTCUSDT returned TRADING. Its 17-symbol array call failed with duplicate-values error; prior official REST batch evidence remains 17/17 TRADING. | One-symbol MCP success is new evidence; batch MCP failure is a connector request issue, not an exchange result or NEXI source defect. |
| Managed Valkey | Aiven service detail returned state RUNNING, free-1, one node, 1 vCPU / 1,024 MB, Valkey 9.1.2, TLS required. | Verifies service control-plane state only; current queue depth, memory use, latency, failover and client connection health are not exposed by this result. API readiness independently reported Redis true. |

### Skill/tool application delta

| SKILL / TOOL | PURPOSE | ACTION PERFORMED | EVIDENCE | FINDING |
|---|---|---|---|---|
| NEXI Work Entry + SentinelX | Apply NEXI Work route and obtain permitted live evidence | Read current capability summary/state; ran bounded Python 3 read-only script using argument-array subprocess calls, timeouts, proc/cgroup/disk/Git reads, read-only SQLite PRAGMAs and two local GET probes | SentinelX 0.23.59 on host mellonelay; script output and API responses above | Used SentinelX directly; no VM Kernel/CLI was used. |
| Data Analytics index | Route analysis to relevant methods | Selected quality, validation, business prioritization and report methods | Data Analytics index instructions read; current repo/runtime observations used | Specialized subset matched this evidence task; unrelated skills were not invoked indiscriminately. |
| Data Analytics analyze-data-quality | Assess grain, freshness and conflicting sources | Compared timestamped samples and units; separated live service metadata from local systemd unit state; compared SQLite page counts | SentinelX host/cgroup/SQLite snapshot; Aiven service response; previous same-day sample | Lower I/O PSI is a fresh point-in-time delta; freelist growth is real, but causation and compaction benefit remain unproven. |
| Data Analytics validate-data | Validate consistency across evidence sources | Cross-checked Aiven RUNNING against API readiness redis=true and local Valkey unit inactive; checked current Git identity and tracked state | Aiven detail, /readyz, Git status and HEAD | Remote managed Valkey is available at control plane; no evidence supports declaring it down. |
| Data Analytics product-business-analysis | Prioritize engineering action by demonstrated value/risk | Re-ranked observed pressure against resource headroom and known market-event drops | Fresh host snapshot plus source/log evidence in this report | Keep ingestion-loss/backpressure observability and SQLite write attribution first; do not migrate databases or add paid services from this evidence alone. |
| Data Analytics build-report | Preserve an inspectable decision record | Appended this timestamped delta and capability limits to the existing study | This section in the canonical report | Architecture recommendation is unchanged; evidence freshness and limits are explicit. |
| Binance | Validate configured market symbol via exchange capability | Queried BTCUSDT exchangeInfo successfully; also attempted configured-symbol batch | BTCUSDT TRADING; 17-symbol MCP call rejected as duplicate values | Single-symbol connector works; batch source result continues to come from prior direct official REST check. |
| Exa / Firecrawl | Locate primary provider documentation | Exa searched official CoinGecko, CoinMarketCap and Binance docs; Firecrawl search returned no web pages | https://docs.coingecko.com/docs/data-delivery-methods; https://docs.coingecko.com/docs/keyless-public-api; https://coinmarketcap.com/api/pricing/ | CoinGecko documents REST plus WebSocket/Webhooks; WebSocket requires Basic or above, and keyless API is not recommended for production and requires attribution. CoinMarketCap advertises plan-dependent commercial use, history and WebSocket; terms need owner review before adoption. Neither provider is proven as an NEXI runtime source. |
| Production Data Engineering Copilot | Analyze provider ingestion, persistence, retention and reliability | Read the data-engineering route; applied plan-data-platform, design-streaming, debug-data-pipeline, review-data-model, observe-data-platform, design-data-quality and design-orchestration to live NEXI evidence | 18 package names enumerated; current code paths, exact 15-minute journal counts, one-hour error scan, SQLite and cgroup samples | The queue-pressure symptom is proven; whether offered event bursts, SQLite, or Redis latency dominates remains unmeasured. |
| Data Analytics | Define, diagnose and validate metrics; prioritize and report | Read the index; applied analyze-data-quality, metric-diagnostics, validate-data, product-business-analysis, design-kpis and build-report | Executor catalog exposes all 16 Data skills; matched window definitions, log throttling, units, scope and recalculated row/page arithmetic | Queue warning count is a lower bound on evictions; retention work hit its cap in every observed minute; root cause is not proven. |
| Wayfinder / Stock Market Summary | Specialist routing | Checked current callable tool and skill names | No matching callable tool/package in this session | Not invoked; not needed to measure NEXI VM or establish provider contracts. |
| CoinGecko / CoinMarketCap | Provider research | Used official documentation via Exa; did not query user-facing coin prices | URLs and findings above | Market-price tools would not establish NEXI pipeline coverage, licensing, latency or VM workload; no price claims are made. |
| Wolfram | Independent calculation | Attempted Wolfram Language evaluation of freelist byte/percentage arithmetic | Tool returned internal error | No Wolfram result is claimed; arithmetic is reproduced directly from observed page counts/page size. |

### Delta conclusion and remaining measurement gaps

The follow-up supports the earlier recommendation to keep the current SQLite/Valkey/NestJS architecture while addressing measured reference-market queue loss and instrumenting SQLite/queue costs before considering separation or paid storage. Current RAM/disk headroom is comfortable at this sample; I/O pressure remains intermittent and nonzero. The free-page increase warrants a retention/checkpoint attribution study in an isolated/authorized future phase, not production VACUUM or a claim that the database is corrupt.

Still unmeasured: current Aiven Valkey queue depth/memory/latency and client connections; event-loop/GC latency; per-endpoint p50/p95/p99; Socket.IO client/fan-out rates; SQLite write wait/transaction latency and table-level byte ownership; current market ingestion event rates/drop counters; sustained CPU/I/O distributions. These remain explicit evidence needs, not inferred defects. No source, service, database contents, provider routing, retention setting or infrastructure was changed in this follow-up.

## Specialist diagnostic pass — NEXI source and runtime evidence through 2026-11-18 07:28:44 UTC

### Capability correction

The previous follow-up incorrectly said the Production Data Engineering Copilot and several Data skills were unavailable. I had checked only the first catalog surface/page. The executor catalog is paginated; a complete pass exposed all 18 Production Data Engineering Copilot skills and all 16 Data Analytics skills. This section and the corrected rows above supersede those earlier availability statements. I read the router and the applicable specialist instructions; unrelated Spark, Fabric, warehouse, CDC, market-sizing and publishing skills were not applied to this read-only SQLite/realtime task.

### Metric diagnosis — observed, not inferred

The fixed API journal window 07:12:07–07:27:08 UTC contained 14 “queue saturated” warning records: 12 logged evictions were trades and 2 were depth events. Each record represents at least one actual eviction. The service throttles this warning to at most one per 60 seconds, so 14 is a lower bound on evicted messages, not the drop count or a rate. No per-event offered, coalesced, dequeued, evicted, queue-depth, or queue-age counter exists in the inspected path.

In the same 15-minute window the retention scheduler emitted 15 runs, each reporting exactly 2,500 expired snapshots removed: 37,500 rows total, or 41.7 rows/second of observed deletion throughput. The scheduler runs once per minute, its configured batch ceiling is 2,500, and the process had no catch-up flag set, so its current configured ceiling is 150,000 rows/hour. Repeated full batches prove the ceiling was reached each observed run; they do not prove that an eligible backlog remained after each run. The prior broad-period “duplicate logging anomaly” is not supported for this current window: it has exactly one 2,500-row record per minute. Older duplicate-minute records still need run identity before they can be attributed.

The current one-hour API journal scan found zero logged Market provider payload rejection, SQLITE_BUSY/database-locked, quote-sequence uniqueness, retention-failure, or incremental-vacuum-deferred messages. This is “no matching log record in this window,” not a guarantee those events never occur.

A separate 20-second sample (07:28:24–07:28:44 UTC) measured host CPU busy at 13.9%, API cgroup logical writes at 1.35 MB/s and 105.9 write I/Os/s, API memory.current at 1,171,169,280 bytes, and I/O PSI avg60/avg300 at 6.44%/7.99%. These counters describe a short separate interval and are not aligned with the 15-minute queue window. They show activity and nonzero I/O pressure, but do not identify SQLite as the queue’s cause or represent physical-device write amplification.

At the 07:12 UTC SQLite snapshot, the 4 KiB-page DB had 1,061,810 pages and 166,526 freelist pages (650.49 MiB; 15.68%). The earlier same-day sample had 150,965 freelist pages (about 618.35 MiB; 14.22%), a rise of 15,561 pages / 60.79 MiB / 1.46 percentage points. Page count was approximately flat and slightly lower, so freelist growth is not equivalent to file growth. The retention code requests incremental_vacuum(256) after a successful delete: at one run/minute that caps potential page movement at 1 MiB/tick or 60 MiB/hour, only if free pages are reclaimable at the file end and each call succeeds. At 150,000 deleted rows/hour, 419 bytes/row is the arithmetic break-even against that upper bound; row/index footprint, tail-page availability, and actual reclaimed pages were not measured. Do not infer a retention defect or run VACUUM from this model.

### Producer-to-consumer contract and impact

1. Binance Spot source code constructs four streams per configured symbol: ticker, one-minute Kline, depth20 at 1,000 ms, and trade. For the 17 configured crypto symbols this is 68 configured stream subscriptions when enabled; trade rate is market-dependent and no offered-message rate was measured.
2. MarketIngestService places adapter events in a 256-item in-memory queue with eight active drain workers. It coalesces queued ticker/depth updates by symbol/provider, prioritizes ticker/Kline when dequeuing, and on saturation discards the earliest trade/depth first. If no such event exists, its fallback removes the oldest item of any kind. The recent warning sample only reported trade/depth eviction; it did not prove that durable ticker/Kline events were lost.
3. Accepted ticker quotes call MarketAuthorityService, which transactionally creates MarketQuoteSnapshot (raw provider lineage) and upserts MarketQuoteLatest (one normalized projection per pair). Provider Klines upsert MarketKline at unique key (pairId, interval, openTime). Quote/Kline persistence precedes Redis publication. The quote transaction contains an empty conditional block beside a comment about serializing pair sequence allocation; no application-level per-pair serializer was found. A one-hour log scan found no sequence/SQLite error, so this is a concurrency verification target, not a demonstrated runtime failure.
4. Trade/depth are explicitly realtime-only: they are not persisted in SQLite or the durable job journal. They publish on Redis Pub/Sub, then MarketGateway subscribes and emits Socket.IO events. The separate Socket.IO Redis Streams adapter does not make the upstream market Pub/Sub input replayable.
5. Public Spot listens for market.reference.trade/depth. It fetches REST trades on mount/connect, deduplicates received trade IDs, and refreshes on socket reconnect; there is no same-connection gap backfill in the inspected hook. Its “LIVE” state is based on a recent trade timestamp, so it can remain LIVE while individual events were dropped and the trade tape has holes until a reconnect/refresh. The depth handler accepts any greater updateId and replaces bid/ask arrays; it does not check for missing update-ID ranges or request a gap repair. This affects reference UI completeness/freshness, not the SQLite Ledger or Binary settlement authority. The provider’s exact depth recovery contract and how quickly a subsequent event repairs a gap require a bounded source-doc/fixture check.
6. MarketQuoteLatest/MarketQuoteSnapshot/MarketKline data remain separate from financial authority: Ledger, durable journals and Binance-only Binary settlement policy are unchanged. Redis unavailability can leave persisted quote data unpublished to an active socket; reference-event replay is not provided by the SQLite financial outbox.

**Leading diagnosis:** queue overflow is proven and intentionally sheds reference trade/depth first. The evidence does not distinguish high offered trade/depth bursts from time spent by eight workers on SQLite quote/Kline writes, Redis publish latency, or interference from the per-minute retention DELETE. The retention job and quote transactions share the same SQLite file’s single-writer serialization point; 20-second cgroup write activity makes I/O worth measuring but does not prove contention. No one-hour SQLite lock/sequence failure was logged. The next decisive evidence is per-stage offered/accepted/coalesced/evicted counts, queue age, handler latency by kind, transaction wait/commit latency, Redis publish latency, and retention eligible-backlog age/batch duration. Do not raise worker count, batch size, or catch-up mode before those measurements; that could intensify contention.

### Architecture decision and implementation gates

Retain the present SQLite financial authority, NestJS policy, Valkey transport, and Socket.IO boundary now. The measured constraint is market-feed backpressure, not a demonstrated RAM/disk ceiling, database corruption, or financial write failure. Moving only the ingestion process while sharing the same SQLite file would not remove its single-writer contention; it may isolate event-loop work, but that benefit is unmeasured. A new time-series database or paid provider is not justified yet. A dedicated nonfinancial market store is a later option only if instrumentation and an isolated replay/concurrency test show that market writes materially delay financial transactions after batching/coalescing and retention scheduling are tuned.

| Phase | Exact work | Acceptance evidence / rollback gate |
|---|---|---|
| 0 — Instrument | Add bounded-cardinality counters by provider and event kind for received, coalesced, persisted, rejected, evicted and published events; queue depth/high-water/oldest age; per-kind processing latency; SQLite transaction wait/commit and SQLITE_BUSY; retention eligible count/oldest age/delete duration/vacuum pages; Redis publish/subscriber reconnect delay; Socket.IO fan-out and client freshness. Do not label metrics by trade ID or unbounded symbol. | Compare offered vs admitted counts over matched 15-minute windows. Alert immediately on durable ticker/Kline eviction or financial write failure; record reference trade/depth loss rate explicitly. Keep the existing data and flags unchanged while measuring. |
| 1 — Close customer-facing gaps | For Spot trades, detect trade-ID gaps and retrieve the missing bounded range from the provider where supported; keep dedupe and event-time ordering. For depth, define snapshot/delta semantics and detect/recover sequence gaps or mark stale until a complete refresh. | Isolated fixtures for duplicate, out-of-order and missing events; assert REST recovery, no duplicate rows, visible stale state and bounded recovery time. Never use reference prices for execution or settlement. |
| 2 — Test SQLite contention off production | On a disposable copy with synthetic provider events, interleave same-pair quote updates, Kline upserts, full retention batches and a representative financial transaction. Measure p50/p95/p99 lock wait/transaction time, busy errors, queue age, and snapshot/Kline reconciliation. | Pass only if accepted quotes retain unique monotonic pair sequences, Kline unique keys reconcile, financial write invariants hold, and market load does not breach owner-approved financial latency limits. Keep the copy isolated; no production replay. |
| 3 — Tune only the measured owner | If event bursts dominate, split ephemeral reference lanes from durable ticker/Kline work and preserve explicit loss counters. If SQLite contention dominates, first batch/coalesce nonfinancial writes with bounded transaction duration and a financial-latency guard; consider separate market storage only after that fails. If retention backlog grows, size bounded catch-up from measured eligible backlog and writer latency. | Re-run the same workload and compare exact windows. Roll back if quote freshness, chart reconciliation, financial transaction latency, or completeness degrades. No new paid service without owner authorization. |
| 4 — Validate provider/history coverage | Reconcile all 53 pairs × 7 intervals by provider, session state, freshness, licensing and exact source; probe only supported batched endpoints. Maintain provenance. | Missing/closed-session assets are explicit; provider history may hydrate charts only where licensed and complete. Binance Spot remains the sole Binary settlement authority. |

### SLI definitions to implement before numeric SLO approval

| Measure | Definition and scope | Current evidence / target handling |
|---|---|---|
| Reference drop rate | Capacity-evicted trade/depth events ÷ provider trade/depth events offered, by provider and event kind over a matched interval | Current numerator is only lower-bounded by 14 warning records in 15 minutes; denominator and exact numerator are absent. Do not publish a percentage yet. |
| Durable quote/Kline loss | Accepted source events not committed under the applicable row key ÷ eligible accepted events; separate stale/rejected inputs from capacity loss | No durable loss was shown by this warning sample. Instrument exact accepted/persisted outcomes; target zero unexplained loss. |
| Quote/Kline freshness | p50/p95/p99 of now − provider observedAt, by asset class and open/closed session; use configured stale cutoff | No distribution was collected. Threshold is owner/product policy, not a value to invent. |
| Retention lag | Oldest eligible nonlatest snapshot age beyond the 72-hour cutoff; count eligible before/after each run | 15/15 runs removed 2,500; residual eligible backlog is unknown. Do not call this failed cleanup. |
| Financial interference | API financial transaction wait/commit p95 and SQLITE_BUSY/LOCKED errors during market/retention work | No matching lock/error logs in one hour; latency distribution unavailable. Preserve existing financial durability. |
| Client reference-feed health | Trade-ID gap count, depth update lag/gap count, and time since complete refresh per active Spot session | Current client can remain LIVE during missing events; add explicit continuity evidence before claiming a complete tape. |

### Updated skill-application evidence

| SKILL | PURPOSE | ACTION PERFORMED | EVIDENCE | FINDING |
|---|---|---|---|---|
| Production Data Engineering Copilot: data-engineering | Route the platform study | Read router; selected only relevant specialists | All 18 PDEC skills enumerated from executor catalog | Correct route was platform design + stream/pipeline diagnosis + quality/observability, not Spark/Fabric/warehouse. |
| PDEC: plan-data-platform | Compare viable architectures | Applied correctness/latency/replay/cost/maintainer gates to four options | Current free Aiven Valkey, SQLite authority, workload and service measurements | Keep current financial core; no measured migration trigger. |
| PDEC: design-streaming | Diagnose stream state and loss | Classified the in-memory adapter queue, Pub/Sub and Socket.IO as different delivery/replay boundaries | MarketIngestService, MarketGateway, Redis adapter and Public Spot source | Queue is intentionally lossy for trade/depth; Socket.IO Streams does not replay upstream Pub/Sub input. |
| PDEC: debug-data-pipeline | Find the first evidenced divergence | Compared source config → bounded queue → durable writes → Pub/Sub → socket clients and matched log scope | 14 throttled queue warnings, 15 full retention batches, current consumer paths | Queue overflow is proven; cause before the queue is unresolved without offered/processed rates and stage latency. |
| PDEC: review-data-model | Validate row grain and uniqueness | Checked snapshot/latest/Kline ownership, keys and transaction boundary | Prisma schema: snapshot unique(pairId,sequence); latest unique(pairId); Kline unique(pairId,interval,openTime) | Market-history and latest projection grains are explicit; no user Ledger model is substituted. |
| PDEC: design-data-quality | Define conservation/freshness checks | Separated accepted, coalesced, evicted, persisted and published outcomes | Current logs lack these denominators/outcomes | Define contracts before tuning; do not convert throttled warnings into a loss rate. |
| PDEC: observe-data-platform | Turn evidence into telemetry | Defined queue, database, retention, Pub/Sub and client SLIs with recovery actions | Current metrics/gaps listed above | SLO targets need owner agreement and baseline distributions. |
| PDEC: design-orchestration | Analyze scheduled retention safely | Applied schedule, cap, catch-up and idempotent deletion semantics | Once/minute schedule; 2,500 batch; catch-up flag absent; latest sequence exclusion | Current bounded run is active; measure residual backlog before enabling catch-up. |
| Data Analytics: index | Route analytics | Read index and used its focused analysis/report route | Current evidence is host, logs, source and database measurements | Chose metric diagnosis, quality, validation, KPI and report methods. |
| Data: analyze-data-quality | Test trustworthiness and grain | Aligned source, time window, counter semantics and provider/session coverage | Journal, cgroup, PRAGMA, Aiven, Binance and provider results | Missing queue denominators are unknown, not zero. |
| Data: metric-diagnostics | Diagnose what changed and why | Quantified 14 warnings, 15 × 2,500 rows and compared same-day PSI snapshots | Fixed journal window and cgroup/proc samples | Queue is pressured; lower PSI than earlier samples does not establish a cause or resolution. |
| Data: validate-data | Reconcile evidence | Cross-checked service state, API readiness, Aiven state, source identity and metric arithmetic | SentinelX, Aiven service detail, Git HEAD/status, direct source reads | Local Valkey unit inactive coexists with remote Aiven RUNNING and API Redis readiness. |
| Data: product-business-analysis | Rank practical options | Weighed customer-visible trade tape completeness against financial integrity, migration risk and cost | Public Spot event handling; unchanged financial authority; current free plan | First fix observability and reference-feed recovery; defer DB migration and spend. |
| Data: design-kpis | Specify controllable measures | Defined event loss, quote freshness, retention lag and financial-interference measures | SLI table above | Do not set unsupported numeric SLOs. |
| Data: build-report | Preserve reviewed findings | Updated the existing Markdown study and skill evidence rather than starting duplicate reports | Canonical study path and revision | Study remains the inspectable source for a future implementation assignment. |
| NEXI Work Graphify | Locate owners and impacts | Queried local CLI; checked graph build commit; used result only as a locator and verified current source | Graphify 0.9.111; graph built_at_commit 03cf396..., HEAD 99ba702...; source grep verified gateway/Public Spot consumers | Graph is stale for current HEAD; static call traversal missed dynamic Pub/Sub edges. Direct source wins. |

### Owner decisions needed before an implementation assignment

1. Define acceptable completeness for the Spot reference trade tape: can it be explicitly best-effort with visible gap/stale behavior, or must it reconcile provider trade IDs during an active session?
2. Approve numeric freshness, retention-lag and financial transaction latency SLOs after baseline distributions are captured; the current samples cannot set them.
3. Review Aiven’s unrestricted IP filters, broad default ACL, single-node/no-HA plan with the service owner. This study made no security or service change.
4. Keep the current 72-hour raw quote retention and provider/settlement authority unchanged unless a separate owner decision explicitly revises them.

This update is architecture analysis only. No application source, retention flag, service, database contents, provider route, dependency store or infrastructure changed; no tests, builds, load tests, VACUUM, restart or deployment ran. The local Graphify CLI was used only as a stale source locator through SentinelX; no Graphify Cloud call or VM Kernel / sx_kernel.py invocation was made.


## Execution and evidence errata

- The statement in the preceding delta that “no VM Kernel/CLI was used” was imprecise. **No VM Kernel / `sx_kernel.py` was invoked**, in accordance with the owner instruction. The local Graphify CLI **was** invoked through SentinelX as a bounded source locator; it reported a graph built at `03cf396788d1897cd700a5edd5de55f065db6562`, behind current HEAD `99ba7024a897181ca479cf37b31a24846019c0a6`. Direct source inspection, not that stale graph, supports the producer/consumer findings.
- Corrected a transcription artifact in the market-persistence paragraph: `MarketQuoteLatest/MarketQuoteSnapshot/MarketKline`.
- A later SentinelX repository snapshot confirmed the same HEAD and no staged or unstaged tracked changes; it counted 190 untracked items. The opening count of 188 is retained as the earlier timestamped snapshot, not current state. No unrelated untracked items were opened, changed or removed.
- Research methods actually applied include queue/retention window reconciliation, metric-definition and denominator checks, schema grain/key review, producer-to-consumer tracing, operational SLI design, and architecture option ranking. No implementation, test, build, browser campaign, service action or database write was performed.
