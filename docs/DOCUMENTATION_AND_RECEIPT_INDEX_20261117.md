# NEXI documentation and receipt locator — 2026-11-17

**2026-11-18 newer index:** This document is a November 17 **tracked Markdown snapshot**, not the current inventory. The six-directory 30-file SHA-256/content inventory and current market-candidate architecture reconciliation are at [NEXI Architecture Document Reconciliation](architecture/NEXI_ARCHITECTURE_DOCUMENT_RECONCILIATION_20261118.md). Preserve this original 160-tracked-Markdown/225-receipt historical count; do not interpret it as a present inventory.

**Snapshot only:** Current source repository HEAD at inventory 03cf396788d1897cd700a5edd5de55f065db6562, plus working-tree documentation changes. Paths are indexed from the tracked Markdown catalog. Historical records are not promoted to current verified application state.

**Primary entrypoints:** [Current architecture](architecture/NEXI_SYSTEM_ARCHITECTURE.md), [active source board](../tasks/todo.md), [current state](../NEXI_CURRENT_STATE.md), [source repair receipts](../tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md), [browser acceptance](quality/NEXI_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_20261108.md), [Graphify CLI/MCPC](operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md).

## Inventory counts

| Category | Existing tracked Markdown files |
|---|---:|
| Architecture | 7 |
| Operations and runbooks | 9 |
| Browser acceptance and quality | 5 |
| Other docs | 6 |
| Root and task instructions | 12 |
| Admin | 10 |
| Public | 7 |
| Backend | 2 |
| Dated source and acceptance receipts | 98 |
| Preserved archives | 4 |
| **Total** | **160** |

The separate receipt hash snapshot, tasks/evidence/NEXI_PROOF_REUSE_RECEIPT_INDEX_20261116.json, has 225 records. It is a **dated SHA ledger**; not all recorded files are Markdown and later edits do not invalidate its historic values. Do not overwrite it with current hashes.

## Reconciliation of historic receipt locations

- Three Nov12–13 acceptance owner/traceability files were moved byte-identically into docs/quality/acceptance-evidence/. The old paths in the November 16 index are historical aliases, **not lost evidence**.
- Two source receipt documents changed after that immutable inventory: NEXI_SOURCE_CLOSURE_MATRIX_20261109.md and NEXI_SOURCE_RECONCILIATION_20261113.md. Retain original SHA values as date-scoped, not current.
- The active source board uses evidence-proven contracts, not the original 113 browser criteria or the historical 5/108 association as source-gating counts.

## Every tracked Markdown document

### Architecture

- [docs/architecture/CROSS_SURFACE_FEATURE_MAP.md](../docs/architecture/CROSS_SURFACE_FEATURE_MAP.md)
- [docs/architecture/NEXI_ARCHITECTURE_DIAGRAMS.md](../docs/architecture/NEXI_ARCHITECTURE_DIAGRAMS.md)
- [docs/architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md](../docs/architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md)
- [docs/architecture/NEXI_DESIGN_TO_SOURCE_ASSURANCE_20261025.md](../docs/architecture/NEXI_DESIGN_TO_SOURCE_ASSURANCE_20261025.md)
- [docs/architecture/NEXI_SOURCE_ONLY_ASSURANCE_20261020.md](../docs/architecture/NEXI_SOURCE_ONLY_ASSURANCE_20261020.md)
- [docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md](../docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md)
- [docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md](../docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md)

### Operations and runbooks

- [docs/operations/NEXI_CAPABILITY_ROUTING.md](../docs/operations/NEXI_CAPABILITY_ROUTING.md)
- [docs/operations/NEXI_ENGINEERING_HISTORY_SOURCE_CLOSURE_SQLITE_GRAPHIFY_20261116.md](../docs/operations/NEXI_ENGINEERING_HISTORY_SOURCE_CLOSURE_SQLITE_GRAPHIFY_20261116.md)
- [docs/operations/NEXI_FALLOW_COMPLETE_CLI_ANALYSIS_MCP_RUNBOOK_20261116.md](../docs/operations/NEXI_FALLOW_COMPLETE_CLI_ANALYSIS_MCP_RUNBOOK_20261116.md)
- [docs/operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md](../docs/operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md)
- [docs/operations/NEXI_PLATFORM_USER_AND_ADMIN_OPERATIONS_GUIDE.md](../docs/operations/NEXI_PLATFORM_USER_AND_ADMIN_OPERATIONS_GUIDE.md)
- [docs/operations/NEXI_SENTRY_OBSERVABILITY.md](../docs/operations/NEXI_SENTRY_OBSERVABILITY.md)
- [docs/operations/NEXI_SQLITE_DATABASE_RUNBOOK.md](../docs/operations/NEXI_SQLITE_DATABASE_RUNBOOK.md)
- [docs/operations/NEXI_THREE_SURFACE_RELEASE_READINESS.md](../docs/operations/NEXI_THREE_SURFACE_RELEASE_READINESS.md)
- [docs/operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md](../docs/operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md)

### Browser acceptance and quality

- [docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md](../docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md)
- [docs/quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md](../docs/quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md)
- [docs/quality/NEXI_CHROME_DEVTOOLS_MCP_GUIDE.md](../docs/quality/NEXI_CHROME_DEVTOOLS_MCP_GUIDE.md)
- [docs/quality/NEXI_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_20261108.md](../docs/quality/NEXI_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_20261108.md)
- [docs/quality/acceptance-evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.md](../docs/quality/acceptance-evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.md)

### Other docs

- [docs/README.md](../docs/README.md)
- [docs/admin/README.md](../docs/admin/README.md)
- [docs/backend/README.md](../docs/backend/README.md)
- [docs/design/README.md](../docs/design/README.md)
- [docs/frontend/README.md](../docs/frontend/README.md)
- [docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md](../docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md)

### Root and task instructions

- [.codex/AGENTS.md](../.codex/AGENTS.md)
- [AGENTS.md](../AGENTS.md)
- [NEXI_CURRENT_STATE.md](../NEXI_CURRENT_STATE.md)
- [NEXI_PROOF_REUSE_REGISTER.md](../NEXI_PROOF_REUSE_REGISTER.md)
- [tasks/NEXI_ARCHITECTURE_SOURCE_CLOSURE_WORKFLOW_TEMPLATE_20261112.md](../tasks/NEXI_ARCHITECTURE_SOURCE_CLOSURE_WORKFLOW_TEMPLATE_20261112.md)
- [tasks/NEXI_Advanced_Graphify_Full_Framework_Connectivity_Workflow_v1.1_20261113.md](../tasks/NEXI_Advanced_Graphify_Full_Framework_Connectivity_Workflow_v1.1_20261113.md)
- [tasks/NEXI_FINAL_CLOSURE_ROADMAP_20261026.md](../tasks/NEXI_FINAL_CLOSURE_ROADMAP_20261026.md)
- [tasks/NEXI_ONE_SHOT_FULL_SOURCE_AND_MOBILE_UI_CLOSURE_20261109.md](../tasks/NEXI_ONE_SHOT_FULL_SOURCE_AND_MOBILE_UI_CLOSURE_20261109.md)
- [tasks/NEXI_SENTINELX_CONTINUOUS_SOURCE_CLOSURE.md](../tasks/NEXI_SENTINELX_CONTINUOUS_SOURCE_CLOSURE.md)
- [tasks/NEXI_WORK_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_PROMPT_20261108.md](../tasks/NEXI_WORK_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_PROMPT_20261108.md)
- [tasks/plan.md](../tasks/plan.md)
- [tasks/todo.md](../tasks/todo.md)

### Admin

- [Admin/AGENTS.md](../Admin/AGENTS.md)
- [Admin/README.md](../Admin/README.md)
- [Admin/docs/ADMIN_IMPLEMENTATION_CONTRACT_MAP_A_F_2026-10-21.md](../Admin/docs/ADMIN_IMPLEMENTATION_CONTRACT_MAP_A_F_2026-10-21.md)
- [Admin/docs/ADMIN_VERIFIED_DIAGRAMS_AND_HANDOFF.md](../Admin/docs/ADMIN_VERIFIED_DIAGRAMS_AND_HANDOFF.md)
- [Admin/docs/CURRENT_STATUS.md](../Admin/docs/CURRENT_STATUS.md)
- [Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md](../Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md)
- [Admin/docs/OPERATOR_WORKSPACE_IMPLEMENTATION_MAP.md](../Admin/docs/OPERATOR_WORKSPACE_IMPLEMENTATION_MAP.md)
- [Admin/docs/TANSTACK_ARCHITECTURE_AND_ROUTE_MAP.md](../Admin/docs/TANSTACK_ARCHITECTURE_AND_ROUTE_MAP.md)
- [Admin/docs/WORK_SSH_NEXT_EXECUTION_HANDOFF_2026-10-21.md](../Admin/docs/WORK_SSH_NEXT_EXECUTION_HANDOFF_2026-10-21.md)
- [Admin/src/routes/README.md](../Admin/src/routes/README.md)

### Public

- [frontend/.agents/skills/next-dev-loop/SKILL.md](../frontend/.agents/skills/next-dev-loop/SKILL.md)
- [frontend/.agents/skills/ui-ux-pro-max/SKILL.md](../frontend/.agents/skills/ui-ux-pro-max/SKILL.md)
- [frontend/AGENTS.md](../frontend/AGENTS.md)
- [frontend/DESIGN.md](../frontend/DESIGN.md)
- [frontend/design-tokens/NEXI_FINAL_PPTX_REQUIREMENTS_INDEX.md](../frontend/design-tokens/NEXI_FINAL_PPTX_REQUIREMENTS_INDEX.md)
- [frontend/design-tokens/NEXI_FRONTEND_DESIGN_SYSTEM_GRAPH_MAP_V1.md](../frontend/design-tokens/NEXI_FRONTEND_DESIGN_SYSTEM_GRAPH_MAP_V1.md)
- [frontend/design-tokens/NEXI_OFFICE_AGENT_DESIGN_SYSTEM_V1.md](../frontend/design-tokens/NEXI_OFFICE_AGENT_DESIGN_SYSTEM_V1.md)

### Backend

- [backend/AGENTS.md](../backend/AGENTS.md)
- [backend/docs/NEXI_SQLITE_API_ROUTING_MAP.md](../backend/docs/NEXI_SQLITE_API_ROUTING_MAP.md)

### Dated source and acceptance receipts

- [tasks/evidence/09_PUBLIC_UI_CROSS_SURFACE_INTEGRATION_20261108.md](../tasks/evidence/09_PUBLIC_UI_CROSS_SURFACE_INTEGRATION_20261108.md)
- [tasks/evidence/NEXI_ARCHITECTURE_CLOSURE_INCREMENTAL_20261112.md](../tasks/evidence/NEXI_ARCHITECTURE_CLOSURE_INCREMENTAL_20261112.md)
- [tasks/evidence/NEXI_FINAL_SOURCE_CLOSURE_20261116.md](../tasks/evidence/NEXI_FINAL_SOURCE_CLOSURE_20261116.md)
- [tasks/evidence/NEXI_GRAPHIFY_TOOLKIT_UPDATE_20261114.md](../tasks/evidence/NEXI_GRAPHIFY_TOOLKIT_UPDATE_20261114.md)
- [tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md](../tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md)
- [tasks/evidence/NEXI_PUBLIC_MOBILE_FIRST_UI_RESEARCH_20261108.md](../tasks/evidence/NEXI_PUBLIC_MOBILE_FIRST_UI_RESEARCH_20261108.md)
- [tasks/evidence/NEXI_PUBLIC_PROVEN_EXCHANGE_UI_COMPONENT_STANDARD_20261108.md](../tasks/evidence/NEXI_PUBLIC_PROVEN_EXCHANGE_UI_COMPONENT_STANDARD_20261108.md)
- [tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md](../tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md)
- [tasks/evidence/NEXI_SOURCE_RECONCILIATION_20261113.md](../tasks/evidence/NEXI_SOURCE_RECONCILIATION_20261113.md)
- [tasks/evidence/NEXI_SUPERSEDED_SOURCE_WORKFLOW_SECTIONS_20261112.md](../tasks/evidence/NEXI_SUPERSEDED_SOURCE_WORKFLOW_SECTIONS_20261112.md)
- [tasks/evidence/admin-async-replay-auth-review-20261016.md](../tasks/evidence/admin-async-replay-auth-review-20261016.md)
- [tasks/evidence/admin-integrated-release-history-20261023.md](../tasks/evidence/admin-integrated-release-history-20261023.md)
- [tasks/evidence/admin-integration-release-readiness-20261022.md](../tasks/evidence/admin-integration-release-readiness-20261022.md)
- [tasks/evidence/admin-public-cross-surface-integration-20261023.md](../tasks/evidence/admin-public-cross-surface-integration-20261023.md)
- [tasks/evidence/authenticated-financial-acceptance-frontier-20261018.md](../tasks/evidence/authenticated-financial-acceptance-frontier-20261018.md)
- [tasks/evidence/authenticated-financial-campaign-siwe-20261018.md](../tasks/evidence/authenticated-financial-campaign-siwe-20261018.md)
- [tasks/evidence/backend-release-frontier-20261018.md](../tasks/evidence/backend-release-frontier-20261018.md)
- [tasks/evidence/backend-specialist-first-routing-20261024.md](../tasks/evidence/backend-specialist-first-routing-20261024.md)
- [tasks/evidence/binary-inactive-pair-settlement-20261018.md](../tasks/evidence/binary-inactive-pair-settlement-20261018.md)
- [tasks/evidence/bullmq-failed-job-replay-contract-20261016.md](../tasks/evidence/bullmq-failed-job-replay-contract-20261016.md)
- [tasks/evidence/canonical-main-integration-20261016.md](../tasks/evidence/canonical-main-integration-20261016.md)
- [tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md](../tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md)
- [tasks/evidence/financial-auth-surface-release-20261018.md](../tasks/evidence/financial-auth-surface-release-20261018.md)
- [tasks/evidence/financial-domain-surface-closure-20261018.md](../tasks/evidence/financial-domain-surface-closure-20261018.md)
- [tasks/evidence/four-lifecycle-authenticated-run-20261019.md](../tasks/evidence/four-lifecycle-authenticated-run-20261019.md)
- [tasks/evidence/governance-command-local-sqlite-20261018.md](../tasks/evidence/governance-command-local-sqlite-20261018.md)
- [tasks/evidence/integrated-release-manifest-20261022.md](../tasks/evidence/integrated-release-manifest-20261022.md)
- [tasks/evidence/loan-cas-exact-backfill-20261018.md](../tasks/evidence/loan-cas-exact-backfill-20261018.md)
- [tasks/evidence/loan-repayment-paid-replay-20261018.md](../tasks/evidence/loan-repayment-paid-replay-20261018.md)
- [tasks/evidence/margin-close-guard-local-sqlite-20261018.md](../tasks/evidence/margin-close-guard-local-sqlite-20261018.md)
- [tasks/evidence/margin-close-request-binding-20261018.md](../tasks/evidence/margin-close-request-binding-20261018.md)
- [tasks/evidence/margin-late-close-recovery-20261018.md](../tasks/evidence/margin-late-close-recovery-20261018.md)
- [tasks/evidence/margin-late-entry-atomic-20261018.md](../tasks/evidence/margin-late-entry-atomic-20261018.md)
- [tasks/evidence/market-provider-runtime-20261017.md](../tasks/evidence/market-provider-runtime-20261017.md)
- [tasks/evidence/nestjs-doctor-diagnostic-classification-20261019.md](../tasks/evidence/nestjs-doctor-diagnostic-classification-20261019.md)
- [tasks/evidence/nexi-admin-binary-research-source-closure-20261026.md](../tasks/evidence/nexi-admin-binary-research-source-closure-20261026.md)
- [tasks/evidence/nexi-admin-tanstack-deployment-triage-20261026.md](../tasks/evidence/nexi-admin-tanstack-deployment-triage-20261026.md)
- [tasks/evidence/nexi-api-readiness-io-stall-20261026.md](../tasks/evidence/nexi-api-readiness-io-stall-20261026.md)
- [tasks/evidence/nexi-backend-component-assurance-20261019.md](../tasks/evidence/nexi-backend-component-assurance-20261019.md)
- [tasks/evidence/nexi-backend-dev-advisory-reachability-20261027.md](../tasks/evidence/nexi-backend-dev-advisory-reachability-20261027.md)
- [tasks/evidence/nexi-backend-learn-authorization-outbox-20261023.md](../tasks/evidence/nexi-backend-learn-authorization-outbox-20261023.md)
- [tasks/evidence/nexi-backend-shutdown-fix-20261023.md](../tasks/evidence/nexi-backend-shutdown-fix-20261023.md)
- [tasks/evidence/nexi-browser-acceptance-continuation-20261105.md](../tasks/evidence/nexi-browser-acceptance-continuation-20261105.md)
- [tasks/evidence/nexi-browser-acceptance-progress-20261023.md](../tasks/evidence/nexi-browser-acceptance-progress-20261023.md)
- [tasks/evidence/nexi-browser-acceptance-v2-20261104.md](../tasks/evidence/nexi-browser-acceptance-v2-20261104.md)
- [tasks/evidence/nexi-browser-acceptance-v2-source-repair-20261104.md](../tasks/evidence/nexi-browser-acceptance-v2-source-repair-20261104.md)
- [tasks/evidence/nexi-cache-prune-20261026.md](../tasks/evidence/nexi-cache-prune-20261026.md)
- [tasks/evidence/nexi-capability-routing-cleanup-20261030.md](../tasks/evidence/nexi-capability-routing-cleanup-20261030.md)
- [tasks/evidence/nexi-codex-hook-state-20261025.md](../tasks/evidence/nexi-codex-hook-state-20261025.md)
- [tasks/evidence/nexi-communications-auth-surface-20261026.md](../tasks/evidence/nexi-communications-auth-surface-20261026.md)
- [tasks/evidence/nexi-conversion-kyc-auth-surface-20261026.md](../tasks/evidence/nexi-conversion-kyc-auth-surface-20261026.md)
- [tasks/evidence/nexi-coordinated-release-checkpoint-20261023.md](../tasks/evidence/nexi-coordinated-release-checkpoint-20261023.md)
- [tasks/evidence/nexi-cross-surface-contract-reconciliation-20261029.md](../tasks/evidence/nexi-cross-surface-contract-reconciliation-20261029.md)
- [tasks/evidence/nexi-dependency-store-alignment-20261101.md](../tasks/evidence/nexi-dependency-store-alignment-20261101.md)
- [tasks/evidence/nexi-doc-reconciliation-storage-cleanup-20261029.md](../tasks/evidence/nexi-doc-reconciliation-storage-cleanup-20261029.md)
- [tasks/evidence/nexi-documentation-reconciliation-20261104.md](../tasks/evidence/nexi-documentation-reconciliation-20261104.md)
- [tasks/evidence/nexi-final-closure-continuation-20261026.md](../tasks/evidence/nexi-final-closure-continuation-20261026.md)
- [tasks/evidence/nexi-final-completion-source-20261023.md](../tasks/evidence/nexi-final-completion-source-20261023.md)
- [tasks/evidence/nexi-final-product-acceptance-20261031.md](../tasks/evidence/nexi-final-product-acceptance-20261031.md)
- [tasks/evidence/nexi-final-vm-consolidation-20261025.md](../tasks/evidence/nexi-final-vm-consolidation-20261025.md)
- [tasks/evidence/nexi-five-batch-source-reconciliation-20261101.md](../tasks/evidence/nexi-five-batch-source-reconciliation-20261101.md)
- [tasks/evidence/nexi-graphify-valkey-doctor-audit-20261103.md](../tasks/evidence/nexi-graphify-valkey-doctor-audit-20261103.md)
- [tasks/evidence/nexi-integrated-release-followthrough-20261024.md](../tasks/evidence/nexi-integrated-release-followthrough-20261024.md)
- [tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md](../tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md)
- [tasks/evidence/nexi-market-candle-source-closure-20261103.md](../tasks/evidence/nexi-market-candle-source-closure-20261103.md)
- [tasks/evidence/nexi-mindmap-v3-reference-20261023.md](../tasks/evidence/nexi-mindmap-v3-reference-20261023.md)
- [tasks/evidence/nexi-openapi-response-closure-20261030.md](../tasks/evidence/nexi-openapi-response-closure-20261030.md)
- [tasks/evidence/nexi-post-release-reconciliation-20261027.md](../tasks/evidence/nexi-post-release-reconciliation-20261027.md)
- [tasks/evidence/nexi-prebrowser-source-closure-20261027.md](../tasks/evidence/nexi-prebrowser-source-closure-20261027.md)
- [tasks/evidence/nexi-production-browser-acceptance-20261101.md](../tasks/evidence/nexi-production-browser-acceptance-20261101.md)
- [tasks/evidence/nexi-public-wallet-siwe-20261026.md](../tasks/evidence/nexi-public-wallet-siwe-20261026.md)
- [tasks/evidence/nexi-receipt-chronology-20261019.md](../tasks/evidence/nexi-receipt-chronology-20261019.md)
- [tasks/evidence/nexi-release-candidate-preflight-20261027.md](../tasks/evidence/nexi-release-candidate-preflight-20261027.md)
- [tasks/evidence/nexi-release-manifest-bdb2400-20261023.md](../tasks/evidence/nexi-release-manifest-bdb2400-20261023.md)
- [tasks/evidence/nexi-s5-public-reachability-20261026.md](../tasks/evidence/nexi-s5-public-reachability-20261026.md)
- [tasks/evidence/nexi-security-dependency-triage-20261025.md](../tasks/evidence/nexi-security-dependency-triage-20261025.md)
- [tasks/evidence/nexi-security-source-reachability-20261025.md](../tasks/evidence/nexi-security-source-reachability-20261025.md)
- [tasks/evidence/nexi-sentinelx-workflow-recovery-20261101.md](../tasks/evidence/nexi-sentinelx-workflow-recovery-20261101.md)
- [tasks/evidence/nexi-sentry-detection-20261031.md](../tasks/evidence/nexi-sentry-detection-20261031.md)
- [tasks/evidence/nexi-source-contract-reconciliation-20261026.md](../tasks/evidence/nexi-source-contract-reconciliation-20261026.md)
- [tasks/evidence/nexi-source-integration-assurance-20261029.md](../tasks/evidence/nexi-source-integration-assurance-20261029.md)
- [tasks/evidence/nexi-source-integration-handoff-20261030.md](../tasks/evidence/nexi-source-integration-handoff-20261030.md)
- [tasks/evidence/nexi-source-security-checkpoint-20261028.md](../tasks/evidence/nexi-source-security-checkpoint-20261028.md)
- [tasks/evidence/nexi-source-security-final-20261028.md](../tasks/evidence/nexi-source-security-final-20261028.md)
- [tasks/evidence/nexi-source-security-inventory-20261028.md](../tasks/evidence/nexi-source-security-inventory-20261028.md)
- [tasks/evidence/nexi-successor-execution-roadmap-20261023.md](../tasks/evidence/nexi-successor-execution-roadmap-20261023.md)
- [tasks/evidence/nexi-successor-proof-frontier-20261023.md](../tasks/evidence/nexi-successor-proof-frontier-20261023.md)
- [tasks/evidence/nexi-support-chat-source-implementation-20261024.md](../tasks/evidence/nexi-support-chat-source-implementation-20261024.md)
- [tasks/evidence/nexi-three-surface-release-20261029.md](../tasks/evidence/nexi-three-surface-release-20261029.md)
- [tasks/evidence/nexi-three-surface-release-20261030.md](../tasks/evidence/nexi-three-surface-release-20261030.md)
- [tasks/evidence/nexi-ws-viem-reachability-20261026.md](../tasks/evidence/nexi-ws-viem-reachability-20261026.md)
- [tasks/evidence/rdc-runtime-reconciliation-20261018.md](../tasks/evidence/rdc-runtime-reconciliation-20261018.md)
- [tasks/evidence/runtime-checkpoint-20261016.md](../tasks/evidence/runtime-checkpoint-20261016.md)
- [tasks/evidence/storage-maintenance-20261023.md](../tasks/evidence/storage-maintenance-20261023.md)
- [tasks/evidence/vps-financial-write-path-risk-20261017.md](../tasks/evidence/vps-financial-write-path-risk-20261017.md)
- [tasks/evidence/vps-observe-removal-20261016.md](../tasks/evidence/vps-observe-removal-20261016.md)
- [tasks/evidence/vps-runtime-candidate-20261016.md](../tasks/evidence/vps-runtime-candidate-20261016.md)
- [tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md](../tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md)

### Preserved archives

- [tasks/evidence/archive/source-board-before-20261115/NEXI_CURRENT_STATE.md](../tasks/evidence/archive/source-board-before-20261115/NEXI_CURRENT_STATE.md)
- [tasks/evidence/archive/source-board-before-20261115/NEXI_PROOF_REUSE_REGISTER.md](../tasks/evidence/archive/source-board-before-20261115/NEXI_PROOF_REUSE_REGISTER.md)
- [tasks/evidence/archive/source-board-before-20261115/tasks__plan.md](../tasks/evidence/archive/source-board-before-20261115/tasks__plan.md)
- [tasks/evidence/archive/source-board-before-20261115/tasks__todo.md](../tasks/evidence/archive/source-board-before-20261115/tasks__todo.md)

## November 16 receipt index path reconciliation

| Recorded path | Current path / disposition |
|---|---|
| tasks/evidence/09_PUBLIC_UI_CROSS_SURFACE_INTEGRATION_20261108.md | Present; matches original recorded SHA |
| tasks/evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.csv | Moved unchanged: docs/quality/acceptance-evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.csv |
| tasks/evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.md | Moved unchanged: docs/quality/acceptance-evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.md |
| tasks/evidence/NEXI_ARCHITECTURE_CLOSURE_INCREMENTAL_20261112.md | Present; matches original recorded SHA |
| tasks/evidence/NEXI_FALLOW_PENDING_CONSUMER_REUSE_20261112.csv | Present; matches original recorded SHA |
| tasks/evidence/NEXI_FRAMEWORK_SOURCE_DECLARATIONS_20261113.csv | Present; matches original recorded SHA |
| tasks/evidence/NEXI_GRAPHIFY_TOOLKIT_UPDATE_20261114.md | Present; matches original recorded SHA |
| tasks/evidence/NEXI_GRAPH_HTTP_OPERATION_RECONCILIATION_20261113.csv | Present; matches original recorded SHA |
| tasks/evidence/NEXI_GRAPH_UNRESOLVED_SEMANTICS_20261113.csv | Present; matches original recorded SHA |
| tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md | Present; matches original recorded SHA |
| tasks/evidence/NEXI_NOV8_FAIL_SOURCE_REUSE_RECONCILIATION_20261112.csv | Present; matches original recorded SHA |
| tasks/evidence/NEXI_PUBLIC_MOBILE_FIRST_UI_RESEARCH_20261108.md | Present; matches original recorded SHA |
| tasks/evidence/NEXI_PUBLIC_PROVEN_EXCHANGE_UI_COMPONENT_STANDARD_20261108.md | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md | Updated after indexed SHA (historic hash retained) |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261113-141421-372878 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261114-031943-895468 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261114-034300-946968 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261115-045721-339484 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261115-062755-828402 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261115-063414-853097 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261115-063613-134004 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261115-090906-845812 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-110155-650139 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-110612-369503 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-111532-360655 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-111656-826410 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-111709-274746 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-111934-906645 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-112322-034947 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-112511-795696 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-112703-561878 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-114652-209252 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-114657-744640 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-123144-988293 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-123916-009525 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-124352-268370 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md.bak.20261116-125308-344865 | Present; matches original recorded SHA |
| tasks/evidence/NEXI_SOURCE_RECONCILIATION_20261113.md | Updated after indexed SHA (historic hash retained) |
| tasks/evidence/NEXI_SOURCE_TRACEABILITY_113_20261112.csv | Moved unchanged: docs/quality/acceptance-evidence/NEXI_SOURCE_TRACEABILITY_113_20261112.csv |
| tasks/evidence/NEXI_SUPERSEDED_SOURCE_WORKFLOW_SECTIONS_20261112.md | Present; matches original recorded SHA |
| tasks/evidence/admin-async-replay-auth-review-20261016.md | Present; matches original recorded SHA |
| tasks/evidence/admin-integrated-release-history-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/admin-integration-release-readiness-20261022.md | Present; matches original recorded SHA |
| tasks/evidence/admin-public-cross-surface-integration-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/archive/source-board-before-20261115/ARCHIVE_MANIFEST.json | Present; matches original recorded SHA |
| tasks/evidence/archive/source-board-before-20261115/NEXI_CURRENT_STATE.md | Present; matches original recorded SHA |
| tasks/evidence/archive/source-board-before-20261115/NEXI_PROOF_REUSE_REGISTER.md | Present; matches original recorded SHA |
| tasks/evidence/archive/source-board-before-20261115/tasks__plan.md | Present; matches original recorded SHA |
| tasks/evidence/archive/source-board-before-20261115/tasks__todo.md | Present; matches original recorded SHA |
| tasks/evidence/async-measured-coverage.log | Present; matches original recorded SHA |
| tasks/evidence/authenticated-financial-acceptance-frontier-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/authenticated-financial-campaign-siwe-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/backend-release-frontier-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/backend-specialist-first-routing-20261024.md | Present; matches original recorded SHA |
| tasks/evidence/binary-inactive-pair-settlement-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/bullmq-current-contract-1100.json | Present; matches original recorded SHA |
| tasks/evidence/bullmq-dependency-install.log | Present; matches original recorded SHA |
| tasks/evidence/bullmq-failed-job-replay-contract-20261016.md | Present; matches original recorded SHA |
| tasks/evidence/canonical-main-integration-20261016.md | Present; matches original recorded SHA |
| tasks/evidence/checkpoint-1100.json | Present; matches original recorded SHA |
| tasks/evidence/checkpoint-1124.json | Present; matches original recorded SHA |
| tasks/evidence/checkpoint-1149.json | Present; matches original recorded SHA |
| tasks/evidence/cloudflare-async-inventory.json | Present; matches original recorded SHA |
| tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md | Present; matches original recorded SHA |
| tasks/evidence/cloudflare-queue-workflow-runtime-inventory-20261016.json | Present; matches original recorded SHA |
| tasks/evidence/d1-sqlite-application-column-schema-check-20261017.json | Present; matches original recorded SHA |
| tasks/evidence/d1-sqlite-nonmarket-content-check-20261017.json | Present; matches original recorded SHA |
| tasks/evidence/d1-sqlite-selected-domain-content-check-20261017.json | Present; matches original recorded SHA |
| tasks/evidence/deployed-queue-class-parity-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/detailed-data-reconciliation.json | Present; matches original recorded SHA |
| tasks/evidence/durable-job-journal-green.log | Present; matches original recorded SHA |
| tasks/evidence/durable-job-journal-red.log | Present; matches original recorded SHA |
| tasks/evidence/durable-queue-green.log | Present; matches original recorded SHA |
| tasks/evidence/export-reconciliation.log | Present; matches original recorded SHA |
| tasks/evidence/export-restored-content-reconciliation.json | Present; matches original recorded SHA |
| tasks/evidence/financial-auth-surface-release-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/financial-domain-surface-closure-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/four-lifecycle-authenticated-http-20261019.json | Present; matches original recorded SHA |
| tasks/evidence/four-lifecycle-authenticated-run-20261019.md | Present; matches original recorded SHA |
| tasks/evidence/g0-recovery.json | Present; matches original recorded SHA |
| tasks/evidence/governance-command-local-sqlite-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/graphify-runtime-import-update-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/implementation-review-decision.json | Present; matches original recorded SHA |
| tasks/evidence/integrated-release-manifest-20261022.md | Present; matches original recorded SHA |
| tasks/evidence/kv-current-inventory.json | Present; matches original recorded SHA |
| tasks/evidence/ledger-account-posting-invariant.json | Present; matches original recorded SHA |
| tasks/evidence/legacy-affected-standard-jest-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/loan-cas-exact-backfill-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/loan-repayment-paid-replay-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/local-async-combined-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-async-combined-diagnostic-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-async-combined-typecheck-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-async-module-gate-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-async-storage-regression-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-kyc-storage-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-object-acceptance-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-outbox-runtime-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-queue-consumer-green.log | Present; matches original recorded SHA |
| tasks/evidence/local-runtime-valkey-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/local-table-inventory.json | Present; matches original recorded SHA |
| tasks/evidence/local-workflow-coordinator-green.log | Present; matches original recorded SHA |
| tasks/evidence/local-workflow-store-green.log | Present; matches original recorded SHA |
| tasks/evidence/margin-close-guard-local-sqlite-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/margin-close-request-binding-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/margin-late-close-recovery-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/margin-late-entry-atomic-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/market-provider-runtime-20261017.md | Present; matches original recorded SHA |
| tasks/evidence/migration-fallow-backend-review.json | Present; matches original recorded SHA |
| tasks/evidence/migration-fallow-measured-review.json | Present; matches original recorded SHA |
| tasks/evidence/migration-fallow-review.json | Present; matches original recorded SHA |
| tasks/evidence/migration-measured-coverage.json | Present; matches original recorded SHA |
| tasks/evidence/migration-typecheck.log | Present; matches original recorded SHA |
| tasks/evidence/mining-workflow-native-crash.log | Present; matches original recorded SHA |
| tasks/evidence/mining-workflow-replay-green.log | Present; matches original recorded SHA |
| tasks/evidence/nestjs-doctor-diagnostic-classification-20261019.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-admin-binary-research-source-closure-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-admin-tanstack-deployment-triage-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-api-readiness-io-stall-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-backend-component-assurance-20261019.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-backend-dev-advisory-reachability-20261027.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-backend-learn-authorization-outbox-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-backend-shutdown-fix-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-browser-acceptance-113-continuation-20261105.csv | Present; matches original recorded SHA |
| tasks/evidence/nexi-browser-acceptance-continuation-20261105.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-browser-acceptance-progress-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-browser-acceptance-v2-20261104.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-browser-acceptance-v2-source-repair-20261104.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-cache-prune-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-capability-routing-cleanup-20261030.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-codeql-open-alert-ledger-20261028.csv | Present; matches original recorded SHA |
| tasks/evidence/nexi-codex-hook-state-20261025.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-communications-auth-surface-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-conversion-kyc-auth-surface-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-coordinated-release-checkpoint-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-cross-surface-contract-reconciliation-20261029.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-dependabot-open-ledger-20261028.csv | Present; matches original recorded SHA |
| tasks/evidence/nexi-dependency-store-alignment-20261101.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-doc-reconciliation-storage-cleanup-20261029.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-documentation-reconciliation-20261104.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-fallow-candidate-ledger-20261028.csv | Present; matches original recorded SHA |
| tasks/evidence/nexi-final-closure-continuation-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-final-completion-source-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-final-product-acceptance-20261031.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-final-vm-consolidation-20261025.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-five-batch-source-reconciliation-20261101.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-graphify-valkey-doctor-audit-20261103.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-integrated-release-followthrough-20261024.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-market-candle-source-closure-20261103.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-mindmap-v3-reference-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-openapi-response-closure-20261030.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-post-release-reconciliation-20261027.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-prebrowser-source-closure-20261027.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-production-browser-acceptance-20261101/public-spot-chart-320x480.png | Present; matches original recorded SHA |
| tasks/evidence/nexi-production-browser-acceptance-20261101/public-spot-chart-320x568.png | Present; matches original recorded SHA |
| tasks/evidence/nexi-production-browser-acceptance-20261101/public-spot-chart-360x640.png | Present; matches original recorded SHA |
| tasks/evidence/nexi-production-browser-acceptance-20261101/public-spot-chart-390x844.png | Present; matches original recorded SHA |
| tasks/evidence/nexi-production-browser-acceptance-20261101/public-spot-chart-430x932.png | Present; matches original recorded SHA |
| tasks/evidence/nexi-production-browser-acceptance-20261101.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-public-wallet-siwe-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-receipt-chronology-20261019.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-release-candidate-preflight-20261027.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-release-manifest-bdb2400-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-s5-public-reachability-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-security-dependency-triage-20261025.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-security-source-reachability-20261025.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-sentinelx-workflow-recovery-20261101.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-sentry-detection-20261031.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-source-contract-reconciliation-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-source-integration-assurance-20261029.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-source-integration-handoff-20261030.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-source-security-checkpoint-20261028.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-source-security-final-20261028.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-source-security-inventory-20261028.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-successor-execution-roadmap-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-successor-proof-frontier-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-support-chat-source-implementation-20261024.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-three-surface-release-20261029.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-three-surface-release-20261030.md | Present; matches original recorded SHA |
| tasks/evidence/nexi-ws-viem-reachability-20261026.md | Present; matches original recorded SHA |
| tasks/evidence/queue-inbox-workflow-recovery.log | Present; matches original recorded SHA |
| tasks/evidence/r2-copy-manifest.json | Present; matches original recorded SHA |
| tasks/evidence/r2-private-local-copy-20261016.json | Present; matches original recorded SHA |
| tasks/evidence/rdc-runtime-reconciliation-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/real-dataset-node-read-smoke.json | Present; matches original recorded SHA |
| tasks/evidence/recovered-native-proof.json | Present; matches original recorded SHA |
| tasks/evidence/route-contract-results-1052.json | Present; matches original recorded SHA |
| tasks/evidence/runtime-checkpoint-20261016.md | Present; matches original recorded SHA |
| tasks/evidence/small-table-content-reconciliation.json | Present; matches original recorded SHA |
| tasks/evidence/small-table-reconciliation.log | Present; matches original recorded SHA |
| tasks/evidence/source-schema-raw.json | Present; matches original recorded SHA |
| tasks/evidence/sqlite-durability-green.log | Present; matches original recorded SHA |
| tasks/evidence/sqlite-internal-sequence-reconciliation.json | Present; matches original recorded SHA |
| tasks/evidence/sqlite-measured-coverage.log | Present; matches original recorded SHA |
| tasks/evidence/sqlite-pragmas-red.log | Present; matches original recorded SHA |
| tasks/evidence/storage-maintenance-20261023.md | Present; matches original recorded SHA |
| tasks/evidence/valkey-crash-recovery.json | Present; matches original recorded SHA |
| tasks/evidence/valkey-stage-runtime.json | Present; matches original recorded SHA |
| tasks/evidence/vps-financial-write-path-risk-20261017.md | Present; matches original recorded SHA |
| tasks/evidence/vps-observe-removal-20261016.md | Present; matches original recorded SHA |
| tasks/evidence/vps-runtime-binding-check-20261017.json | Present; matches original recorded SHA |
| tasks/evidence/vps-runtime-candidate-20261016.md | Present; matches original recorded SHA |
| tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md | Present; matches original recorded SHA |
| tasks/evidence/workflow-checkpoint-combined-repro.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-checkpoint-diagnostic.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-checkpoint-regression.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-checkpoint-stress-repro.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-command-regression.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-commands-real-runtime-final.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-commands-real-runtime-green.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-commands-real-runtime-red.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-coordinator-typecheck.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-guarded-checkpoint-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-guarded-typecheck-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-order-coordinator-consumer-store.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-order-diagnostic.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-queue-source-typecheck.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-recovery-affected-suites.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-recovery-clean-green.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-recovery-confirmation.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-recovery-final-bundle.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-recovery-review.json | Present; matches original recorded SHA |
| tasks/evidence/workflow-runtime-typecheck-20261016.log | Present; matches original recorded SHA |
| tasks/evidence/workflow-store-final-repro.log | Present; matches original recorded SHA |
| tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json | Present; matches original recorded SHA |

## Reconciled current architecture and document conflicts

| Observation | Controlling interpretation | Action |
|---|---|---|
| Oct 2020/Oct 20 generated OpenAPI map lists tickets and old routes | Date-stamped historical endpoint inventory, not current controllers | Preserve; point current architecture to live controllers |
| Oct/Nov7 Graphify coverage document linked from ten active docs but absent in checkout | 2026-11-16 local Graphify CLI/MCPC runbook and live graph.json supersede the old pointer | Correct ten live links; preserve explicit historical wording |
| Nov16 Graphify semantic graph snapshot 8,772/22,093 vs current graph.json 8,602/20,904 at HEAD 03cf396 | Different build receipts, versions/commits and dirty tree; neither proves live behavior | Date both; do not fabricate equivalence or silently rebuild |
| Admin Oct21 33-sidebar and Nov7 21-direct-destination history | Current navigation AST shows eight NAV_GROUPS and 21 item destinations; visibility is role-filtered | Date current source map; preserve historical counts |
| Old 113/108 source-association rows | Acceptance-stage evidence locators, NOT current source bugs or gates | Keep under docs/quality/acceptance-evidence |
| d1-prefixed Backend modules | Retained source compatibility names; Prisma7/local SQLite is active designed authority | Explain names; do not remove based on filename |
| October readiness and Jaeger collector smoke | Dated runtime evidence; NOT current application release or tracing proof | Date/label and defer app verification |
| 225 immutable November 16 receipt hashes | 3 byte-identical moves; 2 changed files later; historic hash is not supposed to change | Preserve original index, resolve paths here |
| Earlier 4 broad source workstreams / 49 Admin callers | Workstreams and callsite inventory, not counts of proven defects; exact backend receipts still need source evidence | Keep SOURCE_OPEN until scoped contract closure |

**Current package manifest declarations:** Backend NestJS 12, Prisma 7.10.1, BullMQ 6.3.15, Socket.IO 4.x; Public Next.js 16.4.1 / React 19.3.0; Admin TanStack Router + Query / Vite 8 / Nitro. A manifest declaration is not a deployed binary version.

**Source-only diagnostics:** Local Graphify source graph at HEAD 03cf396 (8,602 nodes / 20,904 edges), source Fallow guard exit 0 for four modified Backend files, Git diff whitespace integrity exit 0. None of these are application tests; no 113-case browser acceptance is implied. The source test bodies changed in the previous integration patch are not executed by this documentation reconciliation.

**Untracked safety:** Many existing untracked VM entries include earlier backups/evidence; this index does not authorize deleting them or bulk-staging them. Preserve user data, old source archives, SQLite/WAL and the original 225-record receipt ledger.

## Evidence interpretation

- SOURCE_ONLY: source paths, symbols, diff and static guards exist; no app execution proof.
- HISTORICAL_RECEIPT: dated Git/test/browser/VM evidence applies to its own SHA and operating state.
- DEFERRED_BY_OWNER_SOURCE_FIRST_RULE: application tests, lint/typechecks, builds, browser, restarts and deployment are not part of this documentation update.
- RUNTIME_UNKNOWN: active service/queue/market/financial outcomes must not be inferred from code, dated receipts, or Graphify edges.
- Current authoritative documentation should be edited in place; preserve archived originals unchanged.
