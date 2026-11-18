> **2026-11-18 current-source alignment:** Read this file with the [owner-approved current-source architecture authority](NEXI_CURRENT_SOURCE_ARCHITECTURE_AUTHORITY_20261118.md) and 30-document semantic reconciliation. Current Binary/Admin implementation—including the simulated-candle Public chart path—is authoritative; dated pre-repair market measurements remain historical. Source implementation, deployed runtime and customer/economic acceptance are separate claims.

# NEXI architecture diagrams — source-reconciled 2026-11-17

For the November 18 source candidate and documentation/proof chronology, see the [current architecture reconciliation](NEXI_ARCHITECTURE_DOCUMENT_RECONCILIATION_20261118.md). The November 17 system diagram remains a topology reference, not a depiction of newly deployed market repairs.

The [current system architecture](NEXI_SYSTEM_ARCHITECTURE.md#canonical-producer-to-consumer-flow) owns the authoritative producer-to-consumer Mermaid diagram and its source-vs-runtime proof limits. The [cross-surface feature map](CROSS_SURFACE_FEATURE_MAP.md) owns domain-to-consumer routing. This page intentionally links those owners rather than maintaining a second diagram that can drift.

The historical stack is: Name.com DNS → VPS Nginx → Next.js Public / TanStack Admin / NestJS API → SQLite authoritative Ledger/Outbox/Inbox and job journals → BullMQ/Aiven Valkey transport plus Socket.IO realtime. Cloudflare D1 is retired, while old d1-prefixed module names remain in source.
