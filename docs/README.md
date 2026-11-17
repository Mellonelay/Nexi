# NEXI Documentation

## Current authority

- Current source authority: repository [AGENTS.md](../AGENTS.md), surface-specific [frontend](../frontend/AGENTS.md), [backend](../backend/AGENTS.md), and [Admin](../Admin/AGENTS.md) guidance, plus the relevant current architecture and domain contracts.
- Current verified VM/source/deployment checkpoint: [NEXI_CURRENT_STATE.md](../NEXI_CURRENT_STATE.md). It distinguishes GitHub source HEAD from each deployed surface marker and records the date and scope of runtime checks.
- Current local Graphify source/semantic/knowledge graph operation: [Graphify CLI/MCPC runbook](operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md). The local source graph is at graphify-out/graph.json and is accessed through @nexi-graphify-live; engineering Knowledge v4 is a separate graph. Graph edges describe analyzed source; they do not prove runtime behavior.
- Full dated [documentation and receipt inventory](DOCUMENTATION_AND_RECEIPT_INDEX_20261117.md): indexed files, historic receipt hashes, relocation map and current-vs-dated status.
- Current architecture: [system](architecture/NEXI_SYSTEM_ARCHITECTURE.md), [VPS runtime](architecture/NEXI_VPS_BACKEND_RUNTIME.md), [diagrams](architecture/NEXI_ARCHITECTURE_DIAGRAMS.md), and [cross-surface feature map](architecture/CROSS_SURFACE_FEATURE_MAP.md).
- Surface references: [Public](frontend/README.md), [Admin](admin/README.md), and [Backend](backend/README.md).
- Operations: [capability routing](operations/NEXI_CAPABILITY_ROUTING.md), [SQLite/BullMQ/Valkey runbook](operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md), [Sentry](operations/NEXI_SENTRY_OBSERVABILITY.md), and [financial integrity](security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md).

## Dated evidence

The [backend API/SQLite source map](architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md) and [source-only assurance](architecture/NEXI_SOURCE_ONLY_ASSURANCE_20261020.md) are historical snapshots. The [cross-surface contract reconciliation dated 2026-10-29](../tasks/evidence/nexi-cross-surface-contract-reconciliation-20261029.md) is also a dated comparison, not the current source authority. Use current checked-in contracts and source for present implementation; use release markers and runtime checks for deployed behavior.

## Phase boundary, current 2026-11-17

The 113 canonical criteria and their dated source-association records belong to later browser acceptance under docs/quality/ and docs/quality/acceptance-evidence/. They do not form a source-implementation backlog. SOURCE_OPEN refers only to remaining demonstrated or unreconciled source integration, particularly the Admin mutation replay frontier. Application tests/builds/browser/deploy remain deferred.
