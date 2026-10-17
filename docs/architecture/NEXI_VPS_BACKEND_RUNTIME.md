# NEXI VPS Backend Runtime

**Status date:** 2026-10-17 (SQLite promotion checkpoint)
**Scope:** canonical VPS backend runtime after the owner switched Name.com DNS. Public hostnames resolve to the VPS and trusted HTTPS is verified. The restored SQLite database plus the recorded final D1 import is now at the active service path and the NestJS process reports SQLite readiness. This proves runtime activation and selected imported state, not complete reconciliation of every post-export D1 update/delete or a transaction-consistent final cutover watermark.

## Runtime authority and service map

| Component | Responsibility | Authority and boundary |
|---|---|---|
| Public Next.js | User interface and API client | Uses the canonical Public build/runtime at `/srv/nexi/public`; no financial database writes |
| Admin React/TanStack | Permissioned governance interface | Uses canonical Admin runtime at `/srv/nexi/admin`; actions call NestJS and preserve authorization/audit checks |
| Nginx | TLS termination, host routing, HTTP and WebSocket reverse proxy | Public `www`, `admin`, and `api` hostnames route to existing VPS services; prior live checks verified Let's Encrypt trust and Socket.IO WebSocket upgrade |
| NestJS API | Sole domain and business-decision authority | Canonical source `backend/`; systemd service `nexi-api.service`; loopback API currently observed at `127.0.0.1:3002` |
| Prisma 7 + better-sqlite3 | Application data access | SQLite database on persistent VPS storage; WAL, FULL durability, foreign keys, busy timeout and the existing atomic financial gateway |
| Ledger and Activity | Financial accounting and user-visible movement history | Ledger postings remain accounting truth; all financial mutations run through existing NestJS commands and atomic SQLite transactions |
| EventOutbox / EventInbox | Durable publication and idempotent ingress boundaries | Committed with the owning SQLite transaction; neither queue transport nor Valkey replaces these records |
| Local durable job/workflow journal | Delivery acceptance, workflow state, retry and recovery | SQLite-backed coordinator/journal; existing domain workflow commands remain the only source of business effects |
| BullMQ 6 | Queue wake-up, bounded work execution, retry and scheduling | Uses Aiven Valkey for transport; queue jobs may be rebuilt from durable SQLite state |
| Aiven Valkey | Redis-compatible queue/realtime transport | TLS connections from the API have been observed. Used by BullMQ and the existing Socket.IO Redis Streams adapter, plus cache/ephemeral coordination; never financial truth |
| Socket.IO 4 | Application realtime API | Existing Nest gateway and Redis Streams adapter provide cross-process fanout and recoverable stream behavior; verify end-to-end reconnect/recovery separately |
| Local protected object storage | KYC and deposit-proof files | Private directories under `/var/lib/nexi/storage`; application authorization and metadata remain enforced by NestJS |
| Market providers | External quote, candle and stream inputs | Binance remains the crypto source; BiQuote's SignalR adapter and REST fallback serve supported non-crypto instruments, with existing approved fallbacks retained |
| Sentry | Runtime error and performance telemetry | SDK integration is retained; a tagged staging event was delivered. This does not by itself prove automatic exception capture from every runtime path |
| systemd | Process supervision and restart | Owns API lifecycle and boot policy; NestJS listens on loopback behind public Nginx TLS termination |

## Request and data flows

### Public and Admin API requests

1. Browser clients connect to their canonical Public or Admin frontend.
2. Nginx terminates HTTPS and routes API requests to NestJS; WebSocket upgrade headers must be preserved for Socket.IO.
3. NestJS controllers apply DTO validation, authentication, ownership and role/permission guards before invoking domain services.
4. Domain services read and write through Prisma and the SQLite transaction gateway. No frontend, queue worker, or market adapter writes Ledger rows independently.
5. The response is returned to the client. Durable events are published only from committed EventOutbox rows.

### Financial command and event flow

1. NestJS validates an authenticated command and its idempotency key.
2. One SQLite transaction applies the domain mutation, balanced Ledger postings, related Activity, and any EventOutbox record.
3. The durable workflow/job coordinator records accepted work in SQLite before enqueueing a BullMQ wake-up.
4. BullMQ workers use bounded retries and invoke the existing NestJS command/workflow owners. EventInbox deduplicates external or replayed deliveries.
5. If Valkey loses a transient job, the SQLite journal and outbox remain authoritative and can re-enqueue work.
6. Realtime notifications are emitted after durable state commits. Socket.IO Redis Streams distributes events; it never carries financial state.

### Market data and realtime flow

1. Provider adapters normalize timestamps, symbols, bid/ask/mid, freshness and provenance.
2. NestJS market ingestion validates provider data and updates the existing quote/candle/cache paths.
3. Durable historical/settlement records use SQLite where required; volatile tick state stays out of Ledger.
4. Socket.IO publishes the accepted market view through the Redis Streams adapter.
5. Binary settlement continues to use the owner-approved settlement source and must not switch implicitly because a display/chart provider changes.

### Private evidence storage

1. Authenticated upload routes validate evidence metadata and authorization.
2. KYC and deposit-proof bytes are written to private VPS storage, never a public web root.
3. SQLite stores domain metadata/state and the stable object key; Admin review remains permissioned.
4. Backup/restore must cover SQLite and object files consistently. Off-VPS encrypted backup and tested restore are not yet verified.

## Cloudflare-to-VPS mapping

| Existing Cloudflare capability | VPS target | Current status |
|---|---|---|
| Worker public/API routing | Name.com DNS + existing Nginx + Public/Admin services + NestJS | Owner switched DNS; current checks route the three public hostnames to VPS IP 34.143.137.221 with trusted HTTPS. Cloudflare account resources still exist; Worker custom-domain status must be checked independently |
| D1 + Prisma D1 adapter | SQLite + Prisma better-sqlite3 adapter + local transaction gateway | Historical 92-table / 11,802,372-row snapshot reused; existing final export manifest records 1,754 imported rows, 3 deferred market tables and 0 FK violations. Promoted file is `/var/lib/nexi/sqlite/nexi-staging.sqlite`; exact LedgerAccount/LedgerPosting reconciliation passes (14 accounts / 48 postings). Later updates/deletes and final live watermark remain unproven; preserve original export/manifest and rollback DB |
| Queues and DLQ | Durable SQLite journal + BullMQ + Aiven Valkey | Focused transport, workflow, replay and Nest integration proofs are recorded; live outstanding Cloudflare work still needs final controlled reconciliation |
| Workflows | SQLite workflow coordinator/checkpoints + BullMQ steps | Withdrawal, mining and loan paths have focused replay/recovery evidence; current in-flight instance synchronization remains a cutover task |
| R2 | Private local storage under `/var/lib/nexi/storage` | KYC/deposit-proof implementation and staged copy evidence exist; final object manifest/backup and source retirement are pending |
| KV / system configuration | Existing NestJS configuration and SQLite-backed system config where used | Confirm actual live binding consumers and the runtime configuration inventory before retirement |
| Durable Objects / Containers | NestJS services, SQLite serialization and Aiven coordination only where source proves needed | Close against actual active Worker callers; do not invent replacements for unused bindings |
| Cron triggers | Existing Nest scheduler + BullMQ repeat/scheduled jobs where required | Verify each active scheduled handler and timing against deployed Worker configuration |
| Rate limiting | Existing NestJS guards/limiter and Nginx controls | Confirm configured limits and shared behavior before public routing |
| Analytics Engine | Sentry plus existing application metrics/logs only for required operational signals | No replacement business analytics dependency is approved; map actual consumers before retirement |
| Secrets Store | Protected systemd environment file and VPS secret handling | Credentials must be provisioned without copying unverified production secrets into reports or source |
| Worker event delivery | EventOutbox + BullMQ consumers + Socket.IO | Durable boundaries are implemented; final live delivery/in-flight work reconciliation is pending |

## Current verified state and acceptance boundary

- Application source baseline was verified in `/home/mellonelay1999/workspaces/Nexi` on `main` at `1962dc73efda25d4562ddd52a63fb6e477f1c52f`. The documentation/evidence checkpoint is pushed as `d6b6ac2012a683b334eae1750028b80135c63f42`; it did not change the backend application or deployed artifact. Preserve the two untracked Admin pnpm files.
- The VPS runs Node 24.21.0 and active `nexi-api.service` from `/srv/nexi/backend/dist/src/main.js`, bound to `127.0.0.1:3002`; Nginx is the public TLS/WebSocket edge.
- Previously verified: Name.com DNS for all three hostnames to `34.143.137.221`; trusted Let's Encrypt certificates; public API readiness, Public/Admin routes, market reads, Socket.IO polling/WebSocket, and Certbot renewal dry-run. Reuse these proofs unless affected by a change.
- On 2026-10-17, project-local Wrangler 4.127.1 read-only SELECTs confirmed D1 still contains users/wallets, ledger postings/idempotency/audit, outbox/inbox, loan and mining rows. The active `/var/lib/nexi/sqlite/nexi-staging.sqlite` has zero rows across the same checked core tables. It is a separate 96-table file (322,699,264 bytes at inspection) opened by the live service; the restored 7,164,264,448-byte historical SQLite artifact under `/home/mellonelay1999/nexi-migration-snapshots/` is not the runtime database. Five local journal/workflow tables exist only in the active file and are empty; the restored artifact has the D1 migration ledger. The archive-to-restore receipt covers 92 tables / 11,802,372 rows and is not current-D1 or cutover equality. No financial command or data copy was issued. Latest read-only D1 timestamp maxima were LedgerPosting/audit/idempotency 2026-10-17 00:00:04 and EventInbox 00:00:19; this is not a transaction-consistent delta watermark. See `tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json`.
- The historical 92-table / 11,802,372-row snapshot reconciliation is retained and was not repeated. It is not proof of this live delta. Authenticated financial acceptance, live D1 delta, one-writer cutover, independent encrypted off-VPS backup/restore and owner acceptance remain incomplete.
- Name.com DNSSEC is not enabled per owner report. TCP/80 ingress, HTTP-01 issuance, Certbot timer, scoped Nginx deploy hook and renewal dry-run were previously verified. No nameserver change is pending; do not switch financial writers or delete Cloudflare resources without the separate owner gates.
- Cloudflare Worker cron/queue consumers and account resources remain active; queue backlogs were previously zero. Wrangler describes of the two errored loan workflow IDs show immediate invalid-`loanId` probe failures with no steps, not business workflow failures (see `tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md`). D1 remains populated; DNS routing to the VPS does not itself synchronize data or retire Cloudflare execution.

## Operational references

- [Backend source and domain map](../backend/README.md)
- [System architecture](NEXI_SYSTEM_ARCHITECTURE.md)
- [Architecture diagrams](NEXI_ARCHITECTURE_DIAGRAMS.md)
- [Capability routing](../operations/NEXI_CAPABILITY_ROUTING.md)
- [Sentry operations](../operations/NEXI_SENTRY_OBSERVABILITY.md)
- [VPS API Nginx and systemd templates](../../deploy/vps/)
