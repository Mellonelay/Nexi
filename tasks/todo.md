# NEXI — active engineering queue

**Snapshot:** Reconciled 2026-11-27 (Myanmar) at source revision `53c3b870d27af9619280e14526487beaf4b297f6`. Deployment identity remains separate from Git/source identity.

- [x] **Public frontend source and visual-document reconciliation:** coordinated mobile-first corrections are committed on `main` and pushed to GitHub. The current owner-selected Stitch direction and mandatory financial/security invariants are recorded in `frontend/AGENTS.md` and `frontend/DESIGN.md`.
- [x] **Repository reconciliation:** VM `main` and GitHub `main` match at `53c3b87`; all 193 generated timestamped SentinelX `.bak` files were deleted; the VM working tree is clean.
- [ ] **Dependency security:** review and resolve GitHub's 20 open Dependabot alerts (1 high, 18 moderate, 1 low). The highest-severity alert is in frontend `zod`; alerts also include `next`, `hono`, `minimatch`, `glob` and `uuid`. Keep package/lockfile updates scoped, inspect impact, and run the relevant checks before committing.
- [ ] **Current-candidate verification:** run the authorized Public/frontend checks against the exact source candidate; the current GitHub React Doctor status is successful, but no application test suite or production build was run in the latest reconciliation.
- [ ] **Release after owner authorization:** use the canonical VM build/deployment workflow and record exact source and deployment identities. No new deployment is authorized by this checkpoint update.
- [ ] **Rendered Public verification:** after deployment, inspect the actual release in the authenticated Cloud Browser and MobileViewer at iPhone 15 393×852, including full Wallet and relevant route content. Record browser/render evidence and remaining defects.
- [ ] **Product acceptance:** continue the existing 113-case mobile Web3 DApp browser and Admin UI-first plan after deployment authorization. Historical PASS/BLOCKED/NOT_TESTED statuses remain bound to their original evidence and must not be promoted without current proof.

- [x] **Backend-wide Jest reliability (historical receipt):** 136 suites / 819 tests passed with zero skips on test-only Node 24.22.0 at the source revision recorded in historical evidence. This does not prove the current candidate.
- [x] **Earlier source/document integration:** committed API, Admin deposit-proof consumer and Wallet Activity correlation work remains preserved. Do not reopen settled functionality without contradictory current evidence.

**Operating note:** update these maintained owners in place. Dated receipts under `tasks/evidence` remain historical; do not create a competing active handover or treat historical prompts as a new defect list.
