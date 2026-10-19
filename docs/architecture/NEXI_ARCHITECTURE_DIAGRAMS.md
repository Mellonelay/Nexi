# NEXI Architecture Diagram

Name.com DNS → VPS Nginx → Public Next.js / Admin / NestJS API → promoted SQLite, Ledger, EventOutbox, EventInbox and durable async journals. NestJS uses Aiven Valkey for queue/realtime transport and Sentry for telemetry.
