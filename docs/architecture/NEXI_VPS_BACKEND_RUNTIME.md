# NEXI VPS Backend Runtime

**Status date:** 2026-10-16
**Scope:** canonical VPS backend target and currently verified non-authoritative runtime. This describes the intended post-migration topology while distinguishing it from production cutover. Cloudflare production remains live until the owner-approved financial and traffic cutover and later retirement gates.

## Runtime authority and service map

| Component | Responsibility | Authority and boundary |
|---|---|---|
| Public Next.js | User interface and API client | Uses the canonical Public build/runtime at `/srv/nexi/public`; no financial database writes |
| Admin React/TanStack | Permissioned governance interface | Uses canonical Admin runtime at `/srv/nexi/admin`; actions call NestJS and preserve authorization/audit checks |
| Nginx | TLS termination, host routing, HTTP and WebSocket reverse proxy | Routes `www`, `admin`, and `api` hostnames to existing services; API public TLS vhost still requires trusted certificate verification |
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
| systemd | Process supervision and restart | Owns API lifecycle and boot policy; service is loopback-only until API TLS/routing acceptance is complete |

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
| Worker public/API routing | Existing Nginx + Public/Admin services + NestJS | API process is healthy on loopback; trusted public API TLS/routing remains unresolved |
| D1 + Prisma D1 adapter | SQLite + Prisma better-sqlite3 adapter + local transaction gateway | Historical 92-table / 11,802,372-row snapshot reconciliation is complete; it is not a current production delta or cutover proof |
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

- Canonical source is the NEXI GitHub `main` checkout at `/home/mellonelay1999/workspaces/Nexi`; the migration branch remains preserved as evidence.
- The VPS runs Node 24.21.0 and an active NestJS systemd process from `/srv/nexi/backend/dist/src/main.js`.
- Loopback health/readiness, Swagger JSON, public market reads and Socket.IO handshake checks have passed in the current evidence set.
- Aiven Valkey connectivity is observed; API sockets to the endpoint were established and the queue counts were read-only/empty at the recorded check.
- Public and Admin remain active on the VPS. Name.com is authoritative per owner action; public A records for the hostnames point to 34.143.137.221. The VPS serves the forced-IP routes, while D1 remains the production financial writer until explicit owner-approved cutover. Cloudflare resources remain deployed.
- Existing historical migration proofs are retained. Canonical main build and loopback API readiness are proven. Public TLS now uses the issued Let's Encrypt SAN certificate for www/api/admin; strict HTTPS checks returned verify=0 for each hostname, HTTP redirects to HTTPS, and the ACME challenge path remains reachable. Certbot HTTP-01 staging succeeded. Authenticated financial acceptance, full Socket.IO recovery, independent off-VPS encrypted backup/restore and current D1 delta remain separate proof items.
- Owner switched the domain to Name.com nameservers. Current DNS checks return 34.143.137.221 for www and api; earlier independent resolution confirmed admin as well. DNSSEC is not enabled per owner report. The owner created GCP ingress TCP/80 for the NEXI VM tag; HTTP-01 succeeded. Certbot timer is enabled, the NEXI-scoped Nginx reload deploy hook was tested, and certbot renew --dry-run succeeded. Do not change DNS, switch financial writers, or delete Cloudflare resources.

## Operational references

- [Backend source and domain map](../backend/README.md)
- [System architecture](NEXI_SYSTEM_ARCHITECTURE.md)
- [Architecture diagrams](NEXI_ARCHITECTURE_DIAGRAMS.md)
- [Capability routing](../operations/NEXI_CAPABILITY_ROUTING.md)
- [Sentry operations](../operations/NEXI_SENTRY_OBSERVABILITY.md)
- [VPS API Nginx and systemd templates](../../deploy/vps/)
