# NEXI backend current release frontier — 2026-10-18

**Canonical source:** GitHub/VPS `main` `5da98843ed391abe1fbdea11354a0e1a682bff80`. Exactly one worktree. No new infrastructure, alternative database or Cloudflare action.

**Source and focused acceptance:**

- Loan terminal `PAID` exact-key repayment replay fixed at commit `07aaf0b`. RED failure reproduced then targeted green SQLite 1/1; typecheck exit 0.
- Margin existing `CLOSING` order replay now validates original persisted request key, close-order ID, and voluntary-close vs liquidation mode. Commit `5da9884`; Margin 11/11 and gateway disposable-SQLite 2/2, typecheck exit 0.
- Previously proved Margin late-entry and late-close atomic Ledger/Activity/EventOutbox semantics, Binary existing-position settlement on disabled pairs, Governance/Admin replay and wallet tests remain reused unchanged.
- Current regression: financial disposable SQLite 19/19 PASS, Margin+Binary services 28/28 PASS. Affected NestJS source build `npm run build` exit 0 under Node 24.21.0. Local Graphify shared MCP reports 8,182 nodes, 19,372 edges, built at exact `5da9884`, and Fallow backend import-zone check returned no violation.
- Workflow coordinator isolated suite 6/6 PASS. A combined workflow-store/coordinator test run reported three expectation failures in workflow-store fault-injection assertions; its isolated prior pass is not a valid replacement for joint clean proof. This test interaction remains **UNRESOLVED**, not a confirmed live workflow defect.

**Running VPS reality:** Existing `nexi-api` and Nginx active. HTTP `/readyz` reports SQLite and Valkey ready. The running compiled `/srv/nexi/backend/dist/src/d1/d1-financial-command.gateway.js` has SHA-256 `ca55bd370309fe090794e93777eb444ec96584f918e5477f3067f372c9edddeb`, which does not match the newly compiled source file. This is **source-only**, not a deployed acceptance claim.

**Specific remaining release compatibility:** Current authoritative promoted SQLite has 5 LoanApplication rows, one historical LoanRepayment and no `totalRepaidDecimal` field. Existing Loan 0016 **application-schema compatibility** and controlled historical backfill are not yet applied; this does not reopen the completed VPS platform migration. No live financial writes, service restart, or new Cloudflare resource occurred in this verification.

**Other genuine gates:** Authenticated financial/Admin operations and controlled settlement, affected workflow recovery test interference, independent off-host recovery, exact deployed artifact and owner acceptance. Keep seven-domain existing proof; do not repeat market freshness, D1 migration or completed historical reconciliation.
