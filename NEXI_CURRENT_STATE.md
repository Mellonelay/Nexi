# NEXI — current source, verification and release checkpoint

**Observed on the VM 2026-11-18 UTC / 2026-11-19 Singapore.** Revalidate volatile facts before acting. This document is the sole maintained *current state*, not a historical timeline.

| Layer | Evidence / status |
|---|---|
| Git | Main HEAD ed2496efaa63 at audit entry; clean tracked checkout then, 6 local commits ahead of remote main 99ba7024a897. Documentation consolidation will leave a new uncommitted docs-only diff. |
| Source | Market ingest/Kline/Public stream repair 8d32b95 and Admin payload correction ed9fbf5 committed locally. Current source Binary/Admin research controls and isolated candle validation inspected; prior October missing-control claims superseded. |
| Focused checks | Historical receipt: Backend 12 suites 74/74 PASS; Public 62/62; Admin 36/36; all three TypeScript checks PASS. These results apply only to their exact source/test environments. |
| Backend-wide gate | Recorded completed broad Jest: 107/127 suites PASS, 713/753 tests PASS, 20 failing suites/40 failing tests. Later broader run aborted in native better-sqlite3 Statement destructor/Node cleanup hook; no complete totals. Classification requires source-versus-fixture and native teardown investigation. |
| Deployment | API, Public and Admin services were read-only observed active, started 2026-11-17. No proof the later six local commits were built or deployed; running API still logged reference-market saturation. |
| Graph | Checkout graphify-out/graph.json built_at_commit 03cf396, older than local source. Graph/MCP is structural, not same-revision proof. |
| Architecture | SQLite financial authority and distinct three-app dependency stores retained; 2026-11-19 document-authority consolidation in working tree does not certify all API operation or financial invariants. |
| Customer acceptance | 113 owner criteria; Nov8 historical baseline 16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED. No current candidate's 113 real mobile wallet/browser checks completed. |

**Current block:** resolve Backend broad test/native abort and actual contract differences; validate complete source/cross-surface behavior before an expressly authorized build/deploy and mobile DApp browser acceptance.

**Authoritative locations:** root/surface AGENTS.md (standing rules), docs/README.md (document index), docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md (maintained architecture), docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md (invariants), tasks/todo.md (active bounded queue). Historic receipts are in tasks/evidence and Git history; do not append another current-status chronology.
