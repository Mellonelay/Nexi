# NEXI original 113 — current owner-path, Graphify and receipt locator

Source-only inventory. It does **not** upgrade an acceptance criterion because a source file or Graphify symbol exists. Criterion remains a multi-subcontract claim requiring producer–consumer source proof.

- Source Git HEAD at mapping: 950dc6ce85b2561149b486a1521214b9ba7beeaf
- Graph as read: 9b4ca1ab7c8a009188a49571a395615fee57b998dafbbf92bc1cc730764edef5 (may be older than HEAD until custom refresh)
- Criteria: 113
- Source dispositions: {'INSUFFICIENT_EVIDENCE': 108, 'SOURCE_IMPLEMENTED': 5}
- Explicit matrix-ID lines present: 23 / 113
- Owner anchors missing or moved: 0 criteria (need manual cause review, not automatically a defect)
- No indexed exact source anchor in graph: 0 criteria (not automatically a missing contract)
- Per-criterion direct source candidates and last-changing-commit candidates in NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.csv

## Historical and source evidence boundaries

- Original source_owners reflect November 1 acceptance-era candidate anchors, not necessarily the latest responsible owner. Explicitly preserve renamed-owner uncertainty.
- The matrix is an append-only source receipt series; same-ID mentions are useful locators but are not automatically full criterion proof.
- No application tests, runtime checks, browser acceptance, financial mutations, migrations or builds were done. Historical PASS/FAIL classifications remain unchanged.
- The 108 insufficient-evidence classifications cannot be treated as 108 unimplemented features. No automated source-status promotion was performed.

## Source-owner concentration

- 45 criteria: backend/src/ledger/ledger-authority.service.ts
- 22 criteria: docs/backend/README.md
- 22 criteria: backend/src/events/event-outbox.service.ts
- 16 criteria: backend/src/wallet/wallet.service.ts
- 16 criteria: backend/src/wallet/wallet.controller.ts
- 15 criteria: frontend/app/dashboard/spot/page.tsx
- 15 criteria: frontend/app/components/NotificationsPanel.tsx
- 14 criteria: frontend/app/lib/wallet-siwe.ts
- 14 criteria: backend/src/referral-vip/referral-vip.service.ts
- 14 criteria: Admin/src/routes/messages.tsx
- 14 criteria: Admin/src/admin/data/nexi-api-provider.ts
- 10 criteria: backend/src/binary/binary.service.ts
- 10 criteria: backend/src/binary/binary-settlement.scheduler.ts
- 10 criteria: backend/src/admin/binary-configuration.utils.ts
- 10 criteria: frontend/app/dashboard/binary/page.tsx
- 8 criteria: backend/src/auth/wallet-auth.service.ts
- 8 criteria: backend/src/d1/deposit-commands.ts
- 8 criteria: backend/src/financial/local-deposit-proof.controller.ts
- 8 criteria: frontend/app/dashboard/wallet/components/deposit-proof-intent.ts
- 8 criteria: Admin/src/routes/notifications.tsx

## Owner-anchor questions worth focused investigation
