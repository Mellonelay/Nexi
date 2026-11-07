# NEXI Documentation

## Current authority

- Current source authority: repository [AGENTS.md](../AGENTS.md), surface-specific [frontend](../frontend/AGENTS.md), [backend](../backend/AGENTS.md), and [Admin](../Admin/AGENTS.md) guidance, plus the relevant current architecture and domain contracts.
- Current verified VM/source/deployment checkpoint: [NEXI_CURRENT_STATE.md](../NEXI_CURRENT_STATE.md). It distinguishes GitHub source HEAD from each deployed surface marker and records the date and scope of runtime checks.
- Current static cross-surface topology: [Graphify coverage snapshot](architecture/NEXI_GRAPHIFY_COVERAGE_20261107.md). Its canonical merged graph is `/srv/nexi/graphify-live/20261107/merged-graph.json`, served by the existing `@nexi-graphify-live` MCP session. Graph edges describe analyzed source; they do not prove runtime behavior.
- Current architecture: [system](architecture/NEXI_SYSTEM_ARCHITECTURE.md), [VPS runtime](architecture/NEXI_VPS_BACKEND_RUNTIME.md), [diagrams](architecture/NEXI_ARCHITECTURE_DIAGRAMS.md), and [cross-surface feature map](architecture/CROSS_SURFACE_FEATURE_MAP.md).
- Surface references: [Public](frontend/README.md), [Admin](admin/README.md), and [Backend](backend/README.md).
- Operations: [capability routing](operations/NEXI_CAPABILITY_ROUTING.md), [SQLite/BullMQ/Valkey runbook](operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md), [Sentry](operations/NEXI_SENTRY_OBSERVABILITY.md), and [financial integrity](security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md).

## Dated evidence

The [backend API/SQLite source map](architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md) and [source-only assurance](architecture/NEXI_SOURCE_ONLY_ASSURANCE_20261020.md) are historical snapshots. The [cross-surface contract reconciliation dated 2026-10-29](../tasks/evidence/nexi-cross-surface-contract-reconciliation-20261029.md) is also a dated comparison, not the current source authority. Use current checked-in contracts and source for present implementation; use release markers and runtime checks for deployed behavior.
