# NEXI VPS SQLite, NestJS, BullMQ and Valkey operations

## Current authority
Public Next.js and Admin → VPS Nginx → NestJS service `nexi-api.service`. Promoted SQLite at `/var/lib/nexi/sqlite/nexi-staging.sqlite` is the durable application and financial database. Prisma 7 with better-sqlite3 is the backend database integration. LedgerAccount/LedgerPosting own accounting truth; EventOutbox and EventInbox own durable publication and consumer deduplication. SQLite job/workflow journals persist asynchronous state. Aiven Valkey is Redis-compatible queue, stream and cache transport, not financial truth.

## SQLite operational rules

**Maintained operational procedure:** [NEXI SQLite Database Runbook](NEXI_SQLITE_DATABASE_RUNBOOK.md) covers the 72-hour market quote policy, WAL/locks, bounded deletion, page statistics, physical compaction, maintenance shutdown and restoration, and the 2026-11-15 owner-scoped backup waiver. The brief rules below remain architectural guardrails, not a current maintenance receipt.

- Use `sqlite3` CLI for bounded, read-only investigation when possible: `sqlite3 'file:/var/lib/nexi/sqlite/nexi-staging.sqlite?mode=ro' 'PRAGMA database_list; PRAGMA journal_mode; PRAGMA foreign_keys;'`. The connection PRAGMAs may differ between CLI and the application; inspect actual application initialization.
- Keep WAL, SHM and hot journal files with their database. Never unlink or copy them independently as cache cleanup. Do not use `:memory:` for financial truth; it is connection-local and ephemeral.
- Preserve application-configured WAL/FULL durability, busy timeout and foreign-key enforcement. SQLite permits many readers but coordinates a single writer; serialize financial commands and retain transaction, ledger, idempotency and outbox boundaries.
- Use supported SQLite backup APIs or a consistent offline snapshot. Do not assume copying a live DB file alone is a valid recovery point. Verify backup and restore separately; never operate destructive `VACUUM`, `REINDEX`, `PRAGMA writable_schema`, migrations or WAL checkpoint commands on live financial state as routine cleanup.
- Do not infer end-to-end financial correctness from a `readyz` response.

## BullMQ / Aiven Valkey
- NestJS owns job producers and processors. BullMQ workers execute jobs through the Redis-compatible Aiven Valkey connection; register processors with the project's installed NestJS/BullMQ integration and verify actual versions before changing decorator or module APIs.
- Treat jobs as **at least once** processing: retries, stalls and worker restarts can lead to repeated attempts. Use durable idempotency keys and domain-command deduplication in SQLite; never rely on queue acknowledgement as the accounting commit.
- Persist financial intent and EventOutbox within the same SQLite transaction before asynchronous delivery. Worker handlers should invoke existing domain services, not write authoritative balances to Valkey.
- Use bounded retries/backoff and explicitly inspect failed jobs, stalled-job recovery, concurrency, graceful worker shutdown, and job retention. Never clear a live queue or delete Redis keys merely to clean caches.
- Socket.IO Redis Streams are delivery/realtime infrastructure; consumers reconcile from durable SQLite state.

## VPS deployment and observability
- Source checkout: `/home/mellonelay1999/workspaces/Nexi` on `main`, one worktree only.
- Backend runtime: `/srv/nexi/backend`; service `nexi-api.service`. Public runtime `/srv/nexi/public/current`; Admin runtime `/srv/nexi/admin/current`.
- Verify deployed process and source identity independently. `systemctl status nexi-api.service`, `journalctl -u nexi-api.service` and HTTPS `/readyz` establish limited operational evidence. Sentry provides the separate application error-monitoring integration.
- **Jaeger local trace backend (observed 2026-11-07):** `nexi-jaeger.service` is active and runs Jaeger `v2.23.0` from `/opt/nexi/jaeger/2.23.0/jaeger`, with live config `/etc/nexi-jaeger/config.yaml`. OTLP gRPC/HTTP receivers bind only to loopback at `127.0.0.1:4317` / `127.0.0.1:4318`; Query/UI binds to `127.0.0.1:16685` gRPC / `127.0.0.1:16686` HTTP. Badger stores persistent traces at `/var/lib/nexi/jaeger/traces/{keys,values}` (48h span TTL) and archive data at `/var/lib/nexi/jaeger/archive/{keys,values}` (720h span TTL). Do not substitute the older duplicate config under `~/.local/share/nexi-jaeger`; it points to different data paths and is not the service config.
- **Trace-flow boundary:** Jaeger `/api/v3/services` returned `jaeger` and `nexi-otel-smoke`; a recent two-span smoke trace was queryable. The Node OpenTelemetry SDK and OTLP HTTP exporter are installed under `~/.local/share/nexi-otel-node`, including a route-allowlisted privacy-filtering exporter, but the current API process only exposes `NODE_OPTIONS=--enable-source-maps` and does not preload `register.cjs`. Therefore collector/storage acceptance is confirmed, while trace emission from the running API/Admin/Public applications is not established. Do not state that production request tracing is active until the API process has an authorized instrumentation hookup and a trace from that service is observed.
- No source edit automatically deploys. Serialize Git, SQLite/schema, service restarts and release operations. Preserve existing financial recovery assets. The owner's November 15, 2026 waiver of a **new** backup applies only to explicitly eligible expired raw market quote maintenance; it is not permission to remove financial or settlement evidence.

## Authoritative references
- SQLite CLI: https://sqlite.org/cli.html
- SQLite in-memory databases: https://sqlite.org/inmemorydb.html
- SQLite atomic commit (rollback-journal discussion; WAL differs): https://sqlite.org/atomiccommit.html
- BullMQ introduction: https://docs.bullmq.io/guide/introduction
- BullMQ workers: https://docs.bullmq.io/guide/workers/
- BullMQ NestJS: https://docs.bullmq.io/guide/nestjs/
- BullMQ API: https://docs.bullmq.io/api/index.html

## Source-derived API mapping

For all current OpenAPI routes, method operationIds, source controller decorators, module registrations and DTO import references see [NEXI backend map](../architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md) and `backend/docs/NEXI_SQLITE_API_ROUTING_MAP.md`. Generated from the checked source; no claim of route-to-service join completeness beyond listed imports.

## NEXI release schema migration sequence (0016–0020)

Use the canonical release migrator from the repository root: `python3 backend/scripts/nexi_sqlite_release_migrate.py --db <absolute-sqlite-path>`. Default mode is read-only and reports the ordered 0016–0020 plan. It checks the existing loan CAS and Binary research migrators first, then preflights 0018 loan currency, 0019 operator-alert tables/indexes, and 0020 VIP/referral tables and UserVipState columns. In apply mode it runs 0016 and 0017 through their guarded transaction scripts, applies 0018–0020 additively under `BEGIN IMMEDIATE`, verifies the resulting schema, and records the exact five migration IDs/names in `d1_migrations`. A partial or conflicting schema/history fails closed; the operation is safe to rerun after an interrupted additive sequence.

Applying requires a quiesced service and independently verified consistent backup: append `--apply --acknowledge-quiesced-and-backed-up` only after that gate is satisfied. Preserve WAL/SHM, use SQLite's supported backup API or a verified offline snapshot, and check free space on the actual destination before beginning. Do not run the apply command during source preparation.

Observed 2026-11-06 on `/var/lib/nexi/sqlite/nexi-staging.sqlite` (read-only): journal ends at 0015; physical 0016 loan CAS and 0017 Binary research schema are present; `LoanPlan.currency` from 0018 and 0019/0020 objects are absent. The new migrator dry-run reported 18 additive statements and made no changes. Reinspect live schema/history immediately before any future apply; this snapshot is not a standing runtime guarantee.

For exact static request/context joins and their remaining gaps, see the [Graphify coverage snapshot](NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md). The graph is source topology, separate from Jaeger runtime traces.

## Verified package and managed-service versions — 2026-11-15

This document is the **single NEXI VPS operations entrypoint** for NestJS/BullMQ/ioredis/Aiven Valkey, with [NEXI_SQLITE_DATABASE_RUNBOOK.md](NEXI_SQLITE_DATABASE_RUNBOOK.md) as its only SQLite deep-dive. Do not create a parallel queue/Redis runbook. The names `D1WorkerBridgeService` and `d1_migrations` in legacy source do not establish a Cloudflare/D1 runtime.

| Component | Source of version | Observed version |
| --- | --- | --- |
| SQLite shell | VM `/usr/local/bin/sqlite3 --version` | **3.54.1** |
| SQLite embedded library | Historical backend better-sqlite3 runtime `sqlite_version()` | **3.53.2 previously**; refresh only when inspecting that process |
| better-sqlite3 package | Backend `package.json` | **12.11.1** |
| Prisma / Prisma Client | Backend `package.json` | **7.10.1** |
| BullMQ | Backend runtime `node_modules/bullmq/package.json` | **6.3.15** |
| NestJS BullMQ integration | Backend runtime `node_modules/@nestjs/bullmq/package.json` | **12.0.0** |
| ioredis | Backend runtime `node_modules/ioredis/package.json` | **5.10.1** |
| Valkey managed engine | Aiven `nexi-infra-staging / nexi-staging-valkey`, managed service metadata | **9.1.2** running, configured major **9.1** |

**Deployment boundary:** installed package versions are *not* proof the inactive `nexi-api.service` currently runs that code. No application build, service restart, queue mutation, or Aiven configuration update was performed for this reference refresh.

## BullMQ 6: queue semantics, connection ownership, and source contract

The installed **BullMQ 6** uses the newer queue-backend architecture; see the official [v6 changelog](https://docs.bullmq.io/changelog). Avoid copying legacy Bull/BullMQ v1/v5 assumptions: v6 removed legacy repeatable-job APIs in favor of job schedulers and changed some exposed Redis backend internals. In particular, `QueueScheduler` is **not required** for stalled/delayed job management since BullMQ 2; pages for pre-v2 `QueueScheduler` are historical and their advice is not applicable. See [stalled jobs](https://docs.bullmq.io/guide/jobs/stalled), [job schedulers](https://docs.bullmq.io/guide/job-schedulers), [workers](https://docs.bullmq.io/guide/workers), and the [API reference](https://api.bullmq.io/).

**Actual source:** `backend/src/jobs/local-async-runtime.service.ts` holds `resolveValkeyConnectionOptions`, `LocalAsyncRuntimeService`, and `QUEUE_NAMES=['domain-events','notifications','integration-jobs']`. The service activates only if `NEXI_LOCAL_ASYNC_ENABLED=true` and `NEXI_SQLITE_LOCAL_ENABLED=true`, with an installed expected SQLite schema. **The presence of this code does not establish either flag is live.** It creates a distinct producer connection (`maxRetriesPerRequest=1`, `enableOfflineQueue=false`) and worker connection (`maxRetriesPerRequest=null`) because HTTP-path producers should fail promptly but workers must survive transient Redis/Valkey disconnects; see [BullMQ connections](https://docs.bullmq.io/guide/connections) and [production](https://docs.bullmq.io/guide/going-to-production). Each queue has a dedicated `Worker` with `concurrency:1`, plus a periodic dispatch cycle and graceful `worker.close()` / `queue.close()` on module shutdown. The durable store and replay history are in SQLite; jobs refer to a persisted `journalId`. Do **not** infer global once-only processing from one worker's concurrency setting.

**Semantics / failures:**
- BullMQ processing is **at least once**, not exactly once. Worker crash, lock expiry, event-loop starvation, reconnection or stalled recovery can cause the same job to be reprocessed. Queue job IDs are only deduplication while a corresponding Redis job still exists; completed-job removal allows reusing an ID. Treat unique durable SQLite command/journal/Inbox keys as authoritative for preventing duplicate effects, especially financial commands. [Stalled](https://docs.bullmq.io/guide/jobs/stalled), [job IDs](https://docs.bullmq.io/guide/jobs/job-ids), [idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs).
- Retry/backoff policies, max stalled counts, retention `removeOnComplete`/`removeOnFail`, paused/waiting/active/delayed/failed states, `QueueEvents`, and job schedulers must be explicitly inspected in current source before assuming they are enabled. Queue cleanup, `obliterate`, broad `clean`, Redis `FLUSH*`, and ad-hoc retry/replay are **not** documentation cleanup.
- Track both queue errors and durable state: producer/worker reconnects, delayed/stalled events, active/waiting/failed job counts, retry exhaustion, durable pending journal age, outbox/inbox deduplication, Valkey memory pressure, and latency. Failed transport may be recoverable from SQLite even if the corresponding Redis job no longer exists; reconcile through the existing owner service, not new financial writers.
- Graceful shutdown ([official guidance](https://docs.bullmq.io/guide/workers/graceful-shutdown)) waits for active jobs; an abruptly killed worker can later produce stalled recovery. Do not treat successful `systemctl stop` or `readyz` as proof all durable jobs completed. Preserve actual running service state and source-first owner testing boundary.

### Connection configuration, TLS, and secrets

Source `resolveValkeyConnectionOptions()` reads `NEXI_VALKEY_URL` (`redis://` or `rediss://`) or an absolute `NEXI_VALKEY_SOCKET`. For Aiven use certificate-validated **`rediss://`** with TLS SNI and `rejectUnauthorized:true`; plain `redis://` does **not** meet the managed service's TLS requirement. URL query/fragment fields are rejected by that helper; configure only supported options, with credentials passed through secure environment configuration. Never print a password/connection URI in logs, runbooks, or ChatGPT output. The legacy `REDIS_URL` read by `backend/src/runtime/runtime.config.ts` is a separate source contract; verify the actual consumer before equating it with `NEXI_VALKEY_URL`.

Valkey queue correctness requires [`maxmemory-policy=noeviction`](https://docs.bullmq.io/guide/going-to-production): eviction can remove BullMQ's state/lock keys without the application's knowledge. A `noeviction` policy does **not** provide infinite capacity; when memory is exhausted, writes can fail. Use explicit per-key TTLs only for independently disposable caches, never blindly expire BullMQ internal keys or durable financial records.

## Aiven Valkey 9.1.2 — confirmed service, limits, and risks

**Read-only Aiven service inspection (2026-11-15):**
- Project/service: `nexi-infra-staging / nexi-staging-valkey`. `RUNNING`, **Valkey 9.1.2**, plan **free-1**, single 1,024-MiB node, `disk_space_mb=0` as returned metadata. This field **does not prove** total physical storage capacity or that snapshotting is disabled; obtain Aiven plan documentation for actual durability/limits.
- `valkey_ssl=true`, service component reports TLS; `valkey_maxmemory_policy=noeviction`; `frequent_snapshots=true` and recent managed backup **records** exist. Backup records do not prove a successful restore, an AOF policy, an RPO/RTO, or durable financial truth. NEXI's SQLite ledger and journals remain authoritative.
- Aiven user configuration currently allows IP ranges **`0.0.0.0/0` and `::/0`**. **Security finding**: broad network allowlisting even though TLS is required. Narrow to proven authorized egress ranges or approved private connectivity **in a separately approved configuration change**; validate that existing workers can reconnect before changing, especially on free-tier plan. Do not silently mutate service access. ACL default user permits all key/channel categories; plan least-privilege ACLs if compatible with BullMQ's Lua/scripts and prefix ownership.
- Service reports pending maintenance actions, including an update from 9.1.2 toward 9.1.3; a pending Aiven maintenance item is **not** evidence that version 9.1.3 is installed. Refresh `aiven_service_get` before version claims.

### Valkey vs Redis: compatibility, persistence, monitoring

- [Valkey docs](https://valkey.io/docs/), [persistence](https://valkey.io/topics/persistence/), [eviction](https://valkey.io/topics/lru-cache/), [security](https://valkey.io/topics/security/), [TLS](https://valkey.io/topics/tls/), [latency monitoring](https://valkey.io/topics/latency-monitor/), [commands](https://valkey.io/commands/): Valkey is Redis-protocol-compatible for the configured supported command subset, but exact module, scripting, Pub/Sub/Streams behavior and managed-service limits must be checked against the live **9.1.2** service and BullMQ 6 integration. Compatibility as a family is not a substitute for application acceptance.
- Native persistence modes: **RDB** snapshots (point-in-time), **AOF** write log, combined persistence, or none. Aiven's managed backup policy is distinct from Valkey's server-side AOF configuration; do not assert that AOF is enabled without the actual effective `INFO persistence`/managed settings. Memory, network loss and managed failover can interrupt queue transport; SQLite outbox/inbox must cover retries.
- Relevant **read-only** operating signals (only over an authenticated, authorized TLS connection with secret-safe output): `PING`, `INFO server`, `INFO persistence`, `INFO memory`, `INFO stats`, `INFO clients`, `INFO replication`, `INFO keyspace`, `SLOWLOG LEN`, `LATENCY LATEST`, and BullMQ queue getters. Some commands may be disabled by Aiven ACLs; record denial, do not weaken access controls. Avoid `KEYS *` on production, unbounded `SCAN`, `MONITOR`, `FLUSHDB`, `FLUSHALL`, `CONFIG SET`, ACL/security changes or queue mutation as part of documentation work.
- Capacity guardrails: inspect managed free-tier limits, memory usage/fragmentation, `used_memory`, evictions/rejected commands, Aiven metrics, latency, blocked clients, connect failures and pending queue backlog. `noeviction` prevents arbitrary queue-key removal but makes **OOM write failures** an explicit production risk. Aiven backups and queue transport should never substitute for SQLite financial recovery.
- Separate the roles: **BullMQ/Valkey = transport and wakeups**, **Socket.IO/Redis streams = ephemeral delivery**, **SQLite Ledger/Outbox/Inbox = durable truth**. Preserving queue keys and IDs matters; never use Redis as a second financial balance writer.

### Source-first acceptance and operational check boundary

**Allowed now:** review static installed package versions and source queue options, read Aiven metadata, inspect source references, update the runbooks, and verify the Git documentation diff. **Deferred until source closure/owner permission:** NEXI application tests/builds, queue enqueue/dequeue probes, Redis mutating commands, service restarts, deployed smoke acceptance, financial replays and migrations. A `RUNNING` Aiven service does not prove NEXI transport is connected; a `readyz` response does not prove ledger/notification processing.

**Release acceptance eventually needs** independently observed backend release/config flags, authenticated TLS connection, queue-worker availability, reconnection/lock recovery, outbox/inbox idempotency, delayed/failed job semantics, Aiven storage/backup fit and documented recovery; record test evidence before declaring any of these proven. Do not make a runtime pass claim from this source-only runbook refresh.


## 2026-11-16 — SQLite 20 GB operational boundary

The existing companion `NEXI_SQLITE_DATABASE_RUNBOOK.md` is authoritative for full SQLite 3.54.1 storage recovery receipts and market retention. SQLite promoted offline: old main 34,550,140,928 bytes, new main 4,398,145,536 bytes, independently measured **34,552,397,824 bytes physical filesystem free gain**; original 34.55 GB file released after schema, key, integrity and financial-table reconciliation. Services `nexi-api.service`, `nexi-public.service` and `nexi-admin.service` remain **inactive**; no builds, service restarts or Aiven/BullMQ mutations.

Operating budget is **20,000,000,000 bytes for SQLite main+WAL**. Advisory 12/15/18 GB warning/maintenance/critical thresholds must not reject ledger payments or other financial writes. Use low-cost filesystem `stat` and SQLite `PRAGMA page_count/freelist_count` for monitoring; use owner-approved 72-hour raw quote retention and bounded `PRAGMA incremental_vacuum(256)` only with new INCREMENTAL-mode DB. Never delete historical MarketKline records without explicit owner approval. The market source patch and config flag need separate source verification and later deployment; source status is not runtime proof. The disk swap and Graphify uninstall from prior owner-directed cleanup are separate restoration tasks; do not reinstall or restart them during SQLite-only work.


### 2026-11-16 — final 72-hour quote cleanup and monitoring (source-only changes)

Completed database promotion from 34,550,140,928 to **4,352,483,328 bytes** after additional owner-authorized offline cleanup of 83,201 rows and SQLite incremental vacuum. Actual cutover physically reclaimed **34,552,397,824 bytes** at its measured baseline; extra post-cutover vacuum reduced the main file by another ~45.7 MB. Normal retention flag is now true in the inactive backend's `/etc/nexi/backend.env`; optional burst catch-up remains disabled. Combined main+WAL operating budget is 20 billion decimal bytes, with advisory logging thresholds 12/15/18 GB and no financial writer shutdown. Source and tests changed; current deployed runtime was **not** restarted or rebuilt. Refer to the companion SQLite runbook for exact authoritative receipts, timings, and integrity-verification limitations.


Post-cleanup final data proof: `MarketQuoteSnapshot` family 2,121,777,152 bytes; `MarketKline` family 2,221,518,848 bytes; main database 4,352,483,328 bytes. Quoted-table foreign-key check returned empty and targeted SQLite quick_check returned `ok`. Full post-cleanup global integrity scan timed out on low-throughput disk; pre-cutover full candidate integrity scan passed. Detailed receipts and exact proof scope are in the SQLite companion runbook.
