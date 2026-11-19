# NEXI — current source, verification and release checkpoint

**Observed on the VM 2026-11-18 UTC / 2026-11-19 Singapore.** Revalidate volatile facts before acting. This document is the sole maintained *current state*, not a historical timeline.

| Layer | Evidence / status |
|---|---|
| Git | At architecture-review entry, main HEAD was `9c1bab8af977` (documentation-consolidation commit), seven local commits ahead of last verified remote main `99ba7024a897`; five already-modified owner instruction/index files were preserved outside the architecture edit. This row is a dated checkpoint, not an assertion of the current remote tip or deployed build. |
| Source | Market ingest/Kline/Public stream repair 8d32b95 and Admin payload correction ed9fbf5 committed locally. Current source Binary/Admin research controls and isolated candle validation inspected; prior October missing-control claims superseded. |
| Focused checks | Historical receipt: Backend 12 suites 74/74 PASS; Public 62/62; Admin 36/36; all three TypeScript checks PASS. These results apply only to their exact source/test environments. |
| Backend-wide gate | PASS on VM on 2026-11-19 at `fb89eee87693` plus the preserved uncommitted repairs. `npm run test:all` with test-only Node 24.22.0 passed 125 standard and 11 local SQLite suites, 811 tests, zero skipped or native aborts. Backend TypeScript no-emit also passed. The prior Node 24.21.0 cleanup-hook abort is tracked upstream; the configured service runtime and shared dependencies were not changed. VM receipt: `/root/.cache/nexi-backend-verify/20261119T094902Z-all/summary.json`. |
| Deployment | API, Public and Admin services were read-only observed active, started 2026-11-17. No proof the later six local commits were built or deployed; running API still logged reference-market saturation. |
| Graph | Checkout graphify-out/graph.json built_at_commit 03cf396, older than local source. Graph/MCP is structural, not same-revision proof. |
| Architecture | Maintained architecture and financial-integrity owners now contain the source-referenced six-layer operating model, C4/sequence/state views, 15 domain coverage and a unique 113-ID navigation index at source `9c1bab8af977`; a static controller-decorator comparison matched all 279 documented OpenAPI operations and identified five additional decorated routes. This is documentation/static-source evidence only: no whole-product financial or same-release acceptance certification. |
| Customer acceptance | 113 owner criteria; Nov8 historical baseline 16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED. No current candidate's 113 real mobile wallet/browser checks completed. |

**Current frontier:** validate remaining source and cross-surface contracts, then obtain separate authorization for production runtime alignment, build/deploy and mobile DApp browser acceptance.

**Authoritative locations:** root/surface AGENTS.md (standing rules), docs/README.md (document index), docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md (maintained architecture), docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md (invariants), tasks/todo.md (active bounded queue). Historic receipts are in tasks/evidence and Git history; do not append another current-status chronology.
