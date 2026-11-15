# NEXI — ACTIVE PROOF REUSE INDEX (2026-11-15)

Current checkout main `5b3edd99383e` (graph built at `0c2ce55f7f56`), Graphify 0.9.108 source SHA `d89d224547400ca9dccde3b46eef1c15249f8d663c61d238fb6ae85bc873f5ee`. Graph source snapshot predates the committed Communications replay change. Original documents are archived byte-for-byte at `tasks/evidence/archive/source-board-before-20261115/`.

## Rules
- `PROVEN + UNCHANGED = REUSE`; never reopen prior implementation for missing paperwork alone.
- Distinguish source implementation, structural analysis, past executed tests, dated production evidence and current deployment.
- Old 113 acceptance statuses are 16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED (Nov8); 113 source owner paths were indexed Nov13. 108 insufficient-evidence source items is a proof association gap, not 108 missing features.
- Existing financial/Backend/Public/Admin work across Oct–Nov is preserved in dated `tasks/evidence/` receipts. Historical Fallow 118 candidates included 7 verified removals and 111 retained/pending; no mass deletion.
- Nov13 NestJS Doctor 0 errors and scoped type/financial tests PASS at that revision are retained but not extrapolated to the current dirty checkout.
- Nov15 Fallow 3.42.0 read-only analysis: Backend Communications, Public Wallet and Admin provider reachable; no warning requiring removal. Graphify 0.9.108 is static navigation, Kernel v3.5 uses dynamic graph identity.

## Current work
- `backend/src/communications/communications.service.ts` has the source-only replay `auditId` correction committed as `5b3edd9`; existing `tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md` has its proof receipt.
- No application tests, lint, typecheck, builds, browser acceptance, service restarts or deployments were run for `5b3edd9` under the SOURCE-FIRST phase.

## Primary retained receipts
- `tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md`
- `tasks/evidence/NEXI_SOURCE_RECONCILIATION_20261113.md`
- `tasks/evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.csv`
- `tasks/evidence/NEXI_ADVANCED_GRAPHIFY_CONNECTIVITY_SOURCE_AUDIT_20261113.md`
- `tasks/evidence/NEXI_GRAPH_HTTP_OPERATION_RECONCILIATION_20261113.csv`
- `tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md`
- `frontend/DESIGN.md` and Nov8 Public mobile research.

The prior 871-line proof history is preserved unchanged in the archive. Do not substitute its older 'CURRENT' sections for live state.
