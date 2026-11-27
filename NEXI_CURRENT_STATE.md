# NEXI — current source, verification and release checkpoint

**Reconciled:** 2026-11-27 (Myanmar). This is the maintained checkpoint; dated receipts remain historical and revision-bound.

| Layer | Current evidence |
|---|---|
| Git | Canonical VM checkout `/home/mellonelay1999/workspaces/Nexi`, branch `main`, HEAD `53c3b870d27af9619280e14526487beaf4b297f6`; GitHub `main` matched this SHA after push. No staged, unstaged or untracked files remain after deleting 193 generated timestamped `.bak` snapshots. The repository has 1,191 tracked files. |
| Public source | The four commits `a973ce6`, `2a4dc96`, `cf78171`, and `53c3b87` are on GitHub `main`. The frontend changes cover shared mobile UI, Wallet balances/activity/operations, market discovery, Spot/Margin, Options/Binary, and customer-facing copy; `frontend/AGENTS.md` and `frontend/DESIGN.md` record the current owner-selected Stitch authority and product invariants. Acceptance evidence in `cf78171` remains historical evidence, not current runtime proof. |
| Documentation | Root governance, the Public frontend contract/design authority, the documentation index, this checkpoint, and `tasks/todo.md` were checked against the current source/Git state. This reconciliation updates the two maintained status owners in place; dated evidence and architecture history remain unchanged. |
| Verification | GitHub's combined status for HEAD reports `React Doctor: success`. `git diff --check` passed for the four-commit range before push. No application test suite, production build, deployment, or post-deployment browser review was run for this reconciliation. These results do not establish product/runtime acceptance. |
| Graph | `@nexi-graphify-live` reports 3,625 nodes / 5,786 edges and was built at `4c986791ca18b28ae80d4b0c17d0c343f7665c0a`, behind current HEAD. Treat its relationships as stale candidates; no source-impact conclusion here relies on that graph. |
| Runtime and acceptance | Runtime services and the current deployed revision were not inspected in this Git/documentation cleanup. Existing deployment and acceptance receipts retain their recorded dates and are not presented as current. Public Cloud Browser/MobileViewer verification remains required after a separately authorized deployment. |
| GitHub security alerts | The GitHub push reported 20 open Dependabot alerts: 1 high, 18 moderate and 1 low. The high alert is in frontend `zod`; other alerts include `next`, `hono`, `minimatch`, `glob` and `uuid`. No dependency changes were included in these frontend commits; alert remediation remains separate work. |

**Next:** obtain release authorization before building/deploying; then verify the actual released Public site in the authenticated Cloud Browser and MobileViewer at phone sizes, and record the exact release SHA. Separately triage and remediate the open dependency alerts through the dependency workflow.

**Authority locations:** root/surface `AGENTS.md`, `docs/README.md`, `docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md`, `docs/architecture/NEXI_PRODUCT_OPERATING_MODEL.md`, `docs/contracts/NEXI_API_OPERATION_MAP.md`, `docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md`, `frontend/DESIGN.md`, and `tasks/todo.md`.
