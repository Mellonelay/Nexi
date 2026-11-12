# NEXI incremental architecture-wide source checkpoint (November 12, 2026)

This is a bounded owner inventory, not 10 completed domain contracts. Source HEAD 0c7a6d4; eight preexisting dirty governance files preserved. The canonical Graphify source graph matches HEAD; one new Public Binary source edit is dirty and not represented in the committed graph.

## Existing owner-to-consumer anchors (source presence, not complete integration proof)

| Domain | Producer | Public | Admin | Disposition |
|---|---|---|---|---|
| Identity/auth | backend/src/auth/wallet-auth.service.ts | frontend/app/lib/wallet-auth.ts | Admin/src/routes/users.tsx | INSUFFICIENT_EVIDENCE (anchors present) |
| Wallet/Ledger | backend/src/d1/d1-financial-command.gateway.ts | frontend/app/dashboard/wallet/page.tsx | Admin/src/routes/ledger.tsx | INSUFFICIENT_EVIDENCE (anchors present) |
| Markets/Spot | backend/src/spot/spot.service.ts | frontend/app/dashboard/spot/page.tsx | Admin/src/routes/spot.tsx | INSUFFICIENT_EVIDENCE (anchors present) |
| Margin | backend/src/spot/margin.service.ts | frontend/app/dashboard/spot/page.tsx | Admin/src/routes/ledger.tsx | INSUFFICIENT_EVIDENCE (anchors present) |
| Binary | backend/src/binary/binary.service.ts | frontend/app/dashboard/binary/page.tsx | Admin/src/routes/binary.tsx | INSUFFICIENT_EVIDENCE (anchors present) |
| Transfer/Convert | backend/src/financial/financial-operations.service.ts | frontend/app/dashboard/wallet/components/ConvertModal.tsx | Admin/src/routes/ledger.tsx | INSUFFICIENT_EVIDENCE (anchors present) |
| Mining/Loans | backend/src/mining/mining.service.ts | frontend/app/dashboard/mining/page.tsx | Admin/src/routes/loans.tsx | INSUFFICIENT_EVIDENCE (anchors present) |
| Communications/Admin | backend/src/communications/communications.service.ts | frontend/app/components/NotificationsPanel.tsx | Admin/src/admin/data/nexi-api-provider.ts | INSUFFICIENT_EVIDENCE (anchors present) |
| Transport/recovery | backend/src/jobs/local-async-runtime.service.ts | frontend/app/hooks/useRealtimeMarket.ts | Admin/src/admin/data/nexi-api-provider.ts | INSUFFICIENT_EVIDENCE (anchors present) |
| Public mobile UI | frontend/app/components/PagePrimitives.tsx | frontend/app/components/BottomNav.tsx | Admin/src/admin/components/shell/AdminShell.tsx | INSUFFICIENT_EVIDENCE (anchors present) |

## Protected evidence

- GitHub November 1-12: 66 dated records; 63 current-main ancestors, three distinct November 1 historical roots; root initial snapshot is baseline, not newly added feature code. Detailed timeline is cached under the VM .agents directory.
- Reuse original October-November source receipts and dated focused tests at their historical revisions; no new application verification.
- Nov8 browser states remain 16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED. The 24 FAIL IDs and subsequent source path candidates are in NEXI_NOV8_FAIL_SOURCE_REUSE_RECONCILIATION_20261112.csv. Subsequent commits do not imply browser success.
- Oct28 Fallow ledger 118 dispositions preserved, seven completed removals; 33 consumer and external API pending reviews are recorded in NEXI_FALLOW_PENDING_CONSUMER_REUSE_20261112.csv. None are approved for deletion.
- Nov12 criterion coverage remains 5 SOURCE_IMPLEMENTED and 108 INSUFFICIENT_EVIDENCE; no new source gap proved by tracker absence.

## Source repair completed this continuation

- Public Binary Page now renders expired OPEN positions as Settling and Result pending; header and details/dialog use the same derived label. It does not modify Backend authoritative state, Ledger, Outbox, expiry, Admin or funds.
- Knowledge v4: NEXI_PUBLIC_PROVEN_EXCHANGE_UI_COMPONENT_STANDARD_20261108.md:34 and 09_PUBLIC_UI_CROSS_SURFACE_INTEGRATION_20261108.md:27. At countdown expiry display pending, not an invented settlement.
- Graphify exact L0/L1: frontend::app_dashboard_binary_page_positionlist calls binaryStateLabel and is called by BinaryPage (EXTRACTED); backend::src_binary_binary_service_binaryservice_settlepositionond1 returns delayed on missing quote/configuration. Current dirty source inspected directly.
- Fallow inspect_target: Next.js framework entry point is recognized; zero file-scoped dead-code issues, but missing node_modules degrades some dependency inferences. CodeScene identified page complexity and gateway Code Health 1.25; neither warrants source deletion.
- Scoped SOURCE_IMPLEMENTED for truthful expired-position presentation only; full NEXI-05-06 remains INSUFFICIENT_EVIDENCE. Source hygiene diff --check only, no app tests/lint/typecheck/build/browser/restart/deployment.

## Next source dependencies

- Reconcile all required UI contracts against DESIGN.md and Nov8 sources, retaining existing BottomNav and Wallet precision improvements.
- Reconcile Binary durable terminal settlement/reconnect and historical observed failure IDs against current source and actual group receipts.
- Investigate pending Fallow candidates only with real consumer/redundancy/change-risk evidence, not blanket cleanup.
- Complete source-only integration before any application verification or release.


## Current Fallow and CodeScene static-analysis provenance

- Fallow native signed CLI 3.42.0 was invoked read-only for the one bounded repo architecture and dead-code source baseline. Native JSON receipts were saved outside the checkout under /home/mellonelay1999/.agents/NEXI_FALLOW342_ARCH_20261112.json and NEXI_FALLOW342_DEAD_20261112.json.
- CLI 3.42 architecture: one source import cycle AuthModule -> ReferralVipModule -> FinancialOperationsModule -> AuthModule; zero reported cross-surface boundary violations. Current source wraps the three module associations in NestJS forwardRef(). The NestJS circular dependency documentation supports forwardRef for reciprocal module references, so cycle existence alone is not proof of wrong provider wiring. Prior Nov6 dependency-cycle repair was preserved, no new structural refactor justified without a concrete owner/consumer failure.
- CLI 3.42 dead-code baseline: 138 candidate issues: 41 unused files, 51 unused exports, 13 unused types, 30 unused class members, 2 duplicate exports and 1 circular dependency. The CLI exited 1 due configured finding-severity gate; that is not an application test failure. Missing repository-root node_modules degrades dependency inferences, and no rule packs were configured. Zero policy violations means policy was not measured, not source-wide compliance proof.
- Fallow MCP aggregate analyze returned metadata version 3.30.0 with 96 issues while the signed CLI and scoped inspect_target engine reported 3.42.0; retain the provenance mismatch instead of comparing counts as directly equivalent. No MCP restart, reinstall, retuning, auto-fix or batch deletion was performed.
- CodeScene 1.5.20 MCP review of the edited Public Binary route returned Code Health 4.82, primarily complexity/nested-branching candidates; financial gateway file score 1.25. These are maintainability indicators, not financial settlement contradiction evidence. No complexity-led refactor was performed.
- Historical Fallow 118-item ledger remains the protected review baseline: 7 previously verified removals, 31 pending consumers, 2 pending public APIs, other candidates intentionally retained. New scanner counts cannot automatically reopen accepted retention decisions.
