# NEXI architecture diagrams — source-reconciled 2026-11-17

The [current system architecture](NEXI_SYSTEM_ARCHITECTURE.md#canonical-producer-to-consumer-flow) owns the authoritative producer-to-consumer Mermaid diagram and its source-vs-runtime proof limits. The [cross-surface feature map](CROSS_SURFACE_FEATURE_MAP.md) owns domain-to-consumer routing. This page intentionally links those owners rather than maintaining a second diagram that can drift.

The historical stack is: Name.com DNS → VPS Nginx → Next.js Public / TanStack Admin / NestJS API → SQLite authoritative Ledger/Outbox/Inbox and job journals → BullMQ/Aiven Valkey transport plus Socket.IO realtime. Cloudflare D1 is retired, while old d1-prefixed module names remain in source.
