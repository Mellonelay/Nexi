# NEXI engineering rules — current

Last reconciled: 2026-11-19 (Singapore). This file contains **standing engineering rules only**; it is not a rolling Git, service or test-status report.

## Authority and scope
1. Latest explicit NEXI owner instructions and current execution authorization.
2. Applicable current repository and surface-specific AGENTS.md rules.
3. Actual source, Git, environment and executed evidence.
4. Dated receipts and research as historical evidence; official framework documentation for external semantics.

**Retired:** mandatory Normal Chat/Work Kernel routing, older source-first/no-tests-before-source-closure prohibition, Cloudflare Worker/D1 as active financial runtime, and fixed historical graph versions/paths. Do not resurrect old instructions from Git history, tasks/evidence or archived handovers. Testing appropriate to an approved task is allowed; production builds, service changes, financial/data writes, migrations and deployment require their own authorization.

## Three surfaces and owners
- Canonical checkout: /home/mellonelay1999/workspaces/Nexi, one coordinated Git/source writer. Preserve unrelated tracked and untracked changes.
- Backend: backend/, NestJS 12, Prisma 7 + native SQLite. Accounting truth is SQLite LedgerAccount/LedgerPosting with idempotent financial commands and durable audit/Activity/EventOutbox/Inbox. Redis/Aiven Valkey, BullMQ and Socket.IO are transport/projections, not financial authority.
- Public: frontend/, Next.js 16 / React, mobile-first web application in actual Web3 wallet DApp browsers. Its visual source is frontend/DESIGN.md; wallet authentication is Ethereum mainnet SIWE chain ID 1.
- Admin: Admin/, React/TanStack Router/Start and Vite/Nitro. Backend guards/DTOs/services own policy, mutations, settlement and persisted configuration. Admin route/UI presence alone does not establish live support.
- Single Node executable: /opt/nexi/runtime/node-v24.21.0/bin/node. Distinct dependency stores are /srv/nexi/backend/shared/node_modules, /srv/nexi/public/shared/node_modules, /srv/nexi/admin/shared/node_modules; corresponding checkout node_modules paths are symlinks. Never merge, replace or reinstall these stores as incidental setup.
- Canonical outputs are /srv/nexi/backend/dist, /srv/nexi/public/current and /srv/nexi/admin/current. Do not create shadow release/build roots.

## Method
Use SentinelX for authorized VM work. Read current Git state and only the relevant source and prior immutable receipt. Trace producer -> NestJS policy -> SQLite transaction/ledger/outbox -> Public/Admin readback for consequential changes. Use Graphify for revision-matched topology, Fallow/CodeScene for bounded static quality, and version-matched framework sources when needed. A scanner result is not proof of runtime behavior. One financial/Git/build writer; parallelize independent read-only investigation only.

Do not weaken an accepted security, ownership, idempotency, settlement or audit invariant to satisfy outdated tests. Preserve open orders, financial balances, wallet sessions and other owner state. Never synthesize financial success or prices.

Proof classes are separate: SOURCE_IMPLEMENTED, FOCUSED_TESTED, BROAD_TESTED, INTEGRATED, BUILT, DEPLOYED, RUNTIME_VERIFIED, BROWSER_VERIFIED, OWNER_ACCEPTED. Report the actual revision, test scope and deployment identity before upgrading status. Reuse previous PASS only if its causal source and environment remain equivalent.

## Documentation discipline
- docs/README.md: single documentation/authority index.
- docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md: maintained cross-surface architecture.
- docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md: financial invariants.
- frontend/DESIGN.md: Public visual contract.
- Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md and original PNG: Admin operator and approved design reference.
- docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md: original 113 criteria; docs/quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md: execution procedure.
- NEXI_CURRENT_STATE.md: **one** bounded current execution/proof checkpoint; tasks/todo.md: **one** current work queue. Detailed dated execution receipts stay in tasks/evidence, not in active instructions.

**Never append another dated 'CURRENT OWNER OVERRIDE' section or create a competing architecture/status/handover document.** Update the existing owner in place; preserve previous versions through Git history. Documentation consolidation does not change runtime, permissions or financial authorization.
