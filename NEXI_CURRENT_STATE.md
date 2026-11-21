# NEXI — current source, verification and release checkpoint

**Reconciled on the VM 2026-11-21 (Myanmar).** This page is the maintained current checkpoint. Git and graph identities are volatile; re-read them before relying on them.

| Layer | Current evidence |
|---|---|
| Git | Repository /home/mellonelay1999/workspaces/Nexi, branch main. Documentation reconciliation started from HEAD 4aa0ec6e255a3718fdf2425430959a02e4a8b9de and updates ten maintained tracked documents; the six generated backups were compared and removed. The resulting local commit is reported separately; nothing is pushed or deployed. |
| Source | Recent committed integration includes the Admin private deposit-claim proof preview, Wallet Activity correlation identity, API operation-map update, and prior Mining/Loan/VIP and market repairs. Current contracts are described in the linked API map and product model; historical feature receipts remain tied to their recorded revisions. |
| API | Checked-in OpenAPI: 254 paths, 280 unique operation IDs and 109 schemas. Operation map: 208 Public/Admin caller candidates located, 11 retired, 2 internal and 59 caller-unlocated. These are static source classifications, not proof of runtime admission or usage. |
| Verification | Historical receipts include 136 Backend suites / 819 tests on test-only Node 24.22.0 and prior Public/Admin checks. They do not establish verification of the current 4aa0ec6 source candidate. No current-candidate application tests or build were run in this reconciliation. |
| Graph | Read-only live check on 2026-11-21: Graphify 0.9.112, 10,636 nodes / 25,363 edges / 357 communities, SHA-256 4fd8d9c9b94a9723c50b0d52003c912f50b3f8aff2a877a918fbe87a2216fa49, built at 9be7cfb63707f72c81f3b44911247eca57d384f7. It was already stale against HEAD 4aa0ec6e255a3718fdf2425430959a02e4a8b9de before this docs-only commit, and remains stale afterward. No extraction or refresh was run during this documentation pass. Graph edges are source-navigation evidence, not runtime proof. |
| Product and acceptance | The maintained model preserves 15 product domains, 18 journeys and all 113 frozen acceptance IDs. Last recorded tracker counts are 5 PASS / 1 BLOCKED / 107 NOT_TESTED; not advanced here. No deployed mobile Web3 acceptance was performed on this candidate. |
| Deposit/withdrawal scope | Source supports destination/proof claims, manual Admin review/credit, and withdrawal request/reservation/review. Production blockchain observation or broadcasting is not implemented, but no external provider/custody integration is established as a product requirement or release dependency. Do not invent one. |
| Deployment | No deployment, service restart, production artifact replacement or production financial mutation occurred. |

**Next engineering stage:** After source/document reconciliation and graph refresh, perform the separately authorized current-candidate verification. Preserve revision-matched receipts and keep browser acceptance tied to the actual deployed candidate.

**Authority locations:** root/surface AGENTS.md, docs/README.md, docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md, docs/architecture/NEXI_PRODUCT_OPERATING_MODEL.md, docs/contracts/NEXI_API_OPERATION_MAP.md, docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md and tasks/todo.md. Dated receipts remain under tasks/evidence and in Git history; they are historical evidence, not current status.
