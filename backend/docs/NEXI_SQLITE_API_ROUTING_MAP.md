# NEXI SQLite backend routing map

The full source-derived 223-path API and controller mapping is [here](../../docs/architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md).

## Architecture diagram

```mermaid
flowchart TB
 Client[Public Next.js and Admin] --> Nginx[VPS Nginx]
 Nginx --> Router[NestJS Router]
 Router --> Guard[Guards and DTO validation]
 Guard --> Ctr[25 Controller files]
 Ctr --> Domain[Domain services and workflows]
 Domain --> SQLBridge[Local SQLite bridge / Prisma adapter]
 SQLBridge --> SQLite[(Promoted SQLite)]
 Domain --> Financial[Financial command gateway]
 Financial --> SQLite
 SQLite --> Ledger[Ledger postings]
 SQLite --> Outbox[EventOutbox and EventInbox]
 SQLite --> Journal[Durable jobs and workflow journals]
 Outbox --> Sched[Outbox scheduler and local async runtime]
 Journal --> Sched
 Sched --> Bull[BullMQ Queue and Worker]
 Bull --> Valkey[Aiven Valkey Redis transport]
 Bull --> Consumers[Domain consumers with idempotency]
 Consumers --> Financial
 Domain --> Socket[Socket.IO realtime]
 Socket --> Valkey
 Domain --> Sentry[Sentry observability]
```


See `backend/src/app.module.ts`, `backend/prisma/schema.d1.prisma` and checked `docs/contracts/openapi.json` for exact authority.
