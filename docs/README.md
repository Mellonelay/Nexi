# NEXI documentation — one entry point

This page is the **only maintained documentation index**. It does not supersede the current owner's decisions or the actual source. Dated logs, plans, proposals and test receipts are evidence at their own revision, not simultaneous authority.

| Purpose | Maintained owner |
|---|---|
| Engineering constraints and approved boundaries | [Repository AGENTS](../AGENTS.md) and relevant Backend/Public/Admin AGENTS.md |
| Current source, Git, deployment and verification status | [NEXI_CURRENT_STATE.md](../NEXI_CURRENT_STATE.md) |
| Active engineering tasks | [tasks/todo.md](../tasks/todo.md) |
| Three-surface source architecture and ownership | [System architecture](architecture/NEXI_SYSTEM_ARCHITECTURE.md) |
| Financial security and accounting invariants | [Financial integrity](security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md) |
| API contract | [OpenAPI](contracts/openapi.json) (generated artifact; check controller+DTO and generation) |
| Current market architecture decision | [Market-data ADR](architecture/ADR-2026-11-18-NEXI-MARKET-DATA-RESOURCE-ARCHITECTURE.md) (implemented/conditional parts distinguished) |
| Public mobile-first design | [frontend/DESIGN.md](../frontend/DESIGN.md) |
| Admin operator behavior | [Admin operator guide](../Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md) and the original owner PNG there |
| Original, immutable 113 acceptance requirement wording | [113 criteria](quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md); [dated tracker](quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv) |
| Future real mobile DApp-browser acceptance procedure | [Mobile Web3 acceptance](quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md) |
| Last historical component/global test evidence | [Component correctness report](quality/NEXI_COMPONENT_INTEGRATION_PRODUCT_CORRECTNESS_REVIEW_20261119.md); live failure artifacts under the VM's validation cache |
| Production platform/release controls | [VPS/SQLite/BullMQ](operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md), [SQLite maintenance](operations/NEXI_SQLITE_DATABASE_RUNBOOK.md), [Sentry](operations/NEXI_SENTRY_OBSERVABILITY.md) |
| Tool route, bounded source traversal | [Capability routing](operations/NEXI_CAPABILITY_ROUTING.md), [Graphify quick reference](operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md) |

**History without duplicate working-tree authorities:** Older Admin draft maps, previous architecture reconciliations, workflow prompts, browser plans, and bulk CLI/documentation captures were removed from the active documentation tree after provenance/ownership review. Their exact bytes remain recoverable from the commit immediately preceding this documentation cleanup (e.g. \`git show ed2496efaa63:<original-path>\`). Original dated receipts remain under \`tasks/evidence/\`; do not rewrite them as if they were current execution instructions.

**Hygiene rule:** update these existing owners **in place**. Never append dated “CURRENT” headers or make a new handover authority for every session. A new ADR is warranted only for a genuinely new owner-approved architectural decision; new evidence receipts should be scoped and immutable. Always distinguish implemented source, passing tests, deployed artifacts and real customer acceptance.
