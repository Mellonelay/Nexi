# Backend engineering contract

Inherits ../AGENTS.md. Current owner/source/runtime evidence overrides dated tasks/evidence and retired source-first instructions.

- Source: backend/src; manifest/lock authority: backend/package.json and backend/package-lock.json. Node: /opt/nexi/runtime/node-v24.21.0/bin/node. Dependencies remain the symlink to /srv/nexi/backend/shared/node_modules; output /srv/nexi/backend/dist; service nexi-api.service. No incidental install or production build.
- NestJS controllers/guards/DTOs authenticate and validate; services own domain rules. Prisma 7 and the local SQLite command gateway address one authoritative store, not independent financial writers. Historical d1-prefixed names are compatibility labels, not Cloudflare/D1 deployment.
- Financial commands must be authorization- and asset-scoped, idempotent, precise, atomic or recoverably coordinated across business state, Ledger, audit/Activity and EventOutbox. BullMQ/Valkey/Socket.IO cannot authorize monetary effects. Preserve transaction/compensation and readback semantics.
- Binary/Admin approved research controls are isolated from genuine market reference prices. Research account and position mutations require guarded audit/idempotency and correct active-state/version rules. Public candle projection is not a financial writer.
- Market reference trades/depth are best-effort, separate from the settlement source; closed Kline retention and persistent snapshots are source-dependent. In-memory queues with bounded shutdown grace are not crash-durable guarantees.
- Prisma/SQLite native module lifetime matters: the November 19 broad-Jest run aborted in better-sqlite3 Statement destructor. Preserve the exact failure evidence and investigate test/database teardown, ABI and environment in a bounded test-only lane; never weaken financial/auth source logic or alter production shared dependencies just to make Jest green.
- Reuse source-correct tests and receipts at their SHA. Current OpenAPI is docs/contracts/openapi.json; inspect controller/DTO and generation provenance before editing contract output. Build, migrations, financial writes and service operations require their own approval.
