# NEXI VPS Runtime


Name.com DNS routes Public, Admin and API hostnames to VPS Nginx, which serves Public Next.js, Admin, and the NestJS API/WebSocket service.
Public source is frontend/ with runtime /srv/nexi/public/current; Admin source is Admin/ with runtime /srv/nexi/admin/current; backend source is backend/ with runtime /srv/nexi/backend.
NestJS owns business decisions. Promoted SQLite at /var/lib/nexi/sqlite/nexi-staging.sqlite is durable application and financial authority. LedgerAccount/LedgerPosting own accounting truth. EventOutbox and EventInbox own durable publication and deduplication.
SQLite local durable-job and workflow journals retain async state. Aiven Valkey is BullMQ transport, Socket.IO Redis Streams and cache, never financial truth. VPS private storage holds evidence. Sentry, systemd and journald provide runtime telemetry.

## Verification and limits
2026-10-19: nexi-api.service active; https://api.nexitrading.app/readyz returned READY with database=true, redis=true, authority=SQLite. Readiness does not prove financial reconciliation, complete recovery or acceptance.
Source renames do not deploy frontend builds or alter running services. Maintain exactly one main checkout; production changes require separate authorization and verification.
Historical migration receipts and compatibility code are retained as evidence, not active platform authority.
