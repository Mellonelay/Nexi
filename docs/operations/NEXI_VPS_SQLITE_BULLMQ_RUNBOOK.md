# NEXI VPS SQLite, NestJS, BullMQ and Valkey operations

## Current authority
Public Next.js and Admin → VPS Nginx → NestJS service `nexi-api.service`. Promoted SQLite at `/var/lib/nexi/sqlite/nexi-staging.sqlite` is the durable application and financial database. Prisma 7 with better-sqlite3 is the backend database integration. LedgerAccount/LedgerPosting own accounting truth; EventOutbox and EventInbox own durable publication and consumer deduplication. SQLite job/workflow journals persist asynchronous state. Aiven Valkey is Redis-compatible queue, stream and cache transport, not financial truth.

## SQLite operational rules
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
- Verify deployed process and source identity independently. `systemctl status nexi-api.service`, `journalctl -u nexi-api.service` and HTTPS `/readyz` establish limited operational evidence. Sentry provides application error/trace context.
- No source edit automatically deploys. Serialize Git, SQLite/schema, service restarts and release operations. Preserve financial backups and prior rollback artifacts.

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
