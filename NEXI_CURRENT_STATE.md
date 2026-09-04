# NEXI Final Information Reconciliation — 2026-09-05

Purpose: authoritative Job A data/knowledge reconciliation only. No application source mutation, build, test, deploy, schema, runtime, or production action is part of this report.

## Evidence precedence
1. Explicit current owner decisions and locked NEXI scope.
2. Current reconciled source authority: `Mellonelay/Nexi`, branch `reconcile/final-20260904`, commit `a37917fc2737cc50f6c73d323ca03ac8851bea71`, plus direct current evidence already produced against that tree.
3. Later Work receipts/harness and dated direct runtime/test evidence.
4. Older VM receipts and historical handovers.
5. Graphify/Fallow structural evidence.
6. Historical plans, repeated `CURRENT_STAGE` text, screenshots, and chat summaries.

Rule: later stronger evidence supersedes earlier claims at claim level. Historical evidence is preserved; it is not physically deleted.
## Current authority
- Durable repository: `Mellonelay/Nexi`.
- Current reconciled continuation branch: `reconcile/final-20260904`.
- Current reconciled commit: `a37917fc2737cc50f6c73d323ca03ac8851bea71`.
- Public app: `cloudflare-container-bootstrap/dexi-frontend` (Next.js).
- Admin app: `apps/admin`; root Admin-shaped `src` is duplicate/shadow, not a third product.
- NestJS = business authority; D1 = durable application/financial authority; Ledger = accounting truth; EventOutbox = durable publication boundary.
- Queues/Workflows = delivery/orchestration only. Aiven/Valkey = realtime/cache/Streams/Socket.IO/coordination only. Worker/Container = edge/runtime only.
- Production remains unauthorized.

## Current product scope
Public domains remain Dashboard/Quotes, Spot with isolated Margin, Options/Binary, Wallet, Earn/Mining, Loans, Support, Announcements, Learn, Messages/Notifications, Settings, plus Asset Detail/Profile/KYC/Referral/VIP/Security where applicable. Margin is LONG/SHORT at 2x/3x/5x. Cross margin, futures, perpetuals, portfolio margin, C2C, and copy trading remain excluded.
## Superseded historical claims
- Old VM/Windows split authority is superseded by the reconciled GitHub branch above.
- Old PostgreSQL/Neon-as-financial-authority statements are superseded by the locked D1 authority model; PostgreSQL/Prisma survives only as historical/compatibility evidence unless a current path proves otherwise.
- Old `CURRENT_STAGE.md` claim that `_internal/workflows/*` endpoints are missing is superseded: later source/OpenAPI inspection proved the workflow command endpoints exist and are registered.
- Old route/OpenAPI defect statements about the 10 missing active routes and 2 stale routes are superseded by later route-parity commits (`6753ed4`, `733d000`, `33ede8d`).
- Old Graphify statements saying only an archived/stale graph exists are superseded for CLI evidence by the final merged-tree refresh: about 9,398 nodes / 20,959 edges. The remote Graphify MCP service target still requires separate freshness confirmation.
- Old Fallow-current-source-unavailable statements are superseded by the final handoff-diff Fallow PASS; inherited whole-repo findings remain advisory evidence.
- Old Work network/Wrangler authentication blocker is superseded by later successful authenticated Wrangler/local-D1 execution.
- Old statements that Cloudflare deployment had not started are historical; staging was deployed later. They do not prove the current final branch is staging-accepted.
- Old Margin-excluded/unregistered wording is superseded; isolated Margin is active scope and registered.
- Historical commit `96f67e5` remains invalid/nonexistent and is not part of current authority.
## Final current-state matrix
| Domain | Current state | Reconciled conclusion |
|---|---|---|
| Source/workspace reconciliation | DONE | GitHub + Work + non-superseded VM source are consolidated in the clean continuation branch. |
| Architecture/authority model | DONE | Locked authority split above remains current. |
| API/OpenAPI/routing/identity | PARTIAL | Route parity substantially closed; complete current DTO/error/Public/Admin/identity acceptance matrix is not fully proven. |
| Market/provider/Kline | PARTIAL | 53-asset catalog, adapters, Kline path and substantial runtime history exist; current final-branch 53/53 provider/fallback/freshness and all required interval truth are not fully proven. |
| Realtime/Socket.IO recovery | PARTIAL | Multiple historical reconnect proofs exist; exact/current missed-event convergence/replay remains incomplete. |
| D1/schema authority | PARTIAL | D1 gateway, migrations and atomic slices are proven; full current all-domain D1 authority matrix remains incomplete. |
| Ledger/financial commands | PARTIAL | Concurrency/idempotency and representative C2/C3 evidence exist; all consequential domains are not yet proven against the final branch. |
| EventOutbox | PARTIAL | Durable outbox implementation and several domain paths are proven; universal command coverage is not. |
| Queue/Workflow | PARTIAL | Bindings, bridge and workflow command endpoints exist; complete retry/redelivery/dedup/runtime causality is not proven. |
| Aiven/Valkey | PARTIAL / REVERIFY | Historical PONG/Streams/Socket.IO evidence exists; current final-branch runtime must be reverified. |
| Public frontend | PARTIAL / ADVANCED | Visual/source foundations and many route/browser proofs are reusable; complete current canonical-client/authenticated acceptance is not final. |
| Admin | PARTIAL / ADVANCED | Separate `apps/admin`, live provider architecture, RBAC and many historical live slices exist; full current 34-destination parity is not final. |
| Cross-surface causality | PARTIAL | Representative Public withdrawal → Admin action → audit/outbox → Public read-back is proven; not every domain is. |
| Cloudflare Worker/Container | PARTIAL / ADVANCED | Staging and platform history is substantial; final merged branch has focused contract proof but not complete final staging acceptance. |
| Graphify | CURRENT CLI / MCP REVERIFY | Final merged graph is fresh for CLI evidence; remote MCP target freshness is separate. |
| Fallow | CURRENT DIFF PASS | Final handoff diff has zero introduced blocking categories; inherited whole-repo findings remain advisory. |
| Backend full regression | DONE_UNVERIFIED_ON_FINAL_SHA | Full suites passed on the later Work source; only focused 27-test authority set was rerun after the final six-file handoff change. |
| Admin build | PROVEN_UNCHANGED | Admin build passed before final handoff; final six-file handoff did not modify Admin. |
| Public build | DONE_UNVERIFIED_ON_FINAL_SHA | Historical/later Work builds passed; not rerun after the final merge/handoff SHA. |
| Sentry | OPEN | Research/CLI/privacy groundwork exists; current end-to-end runtime telemetry acceptance is not complete. |
| C4 platform causality | PARTIAL | Representative/local platform contract and C3 causality evidence exist; complete platform chain is not closed. |
| C5 deployed staging | PARTIAL | Historical staging is substantial; final reconciled branch has not completed the full staging acceptance matrix. |
| C6 browser/mobile/manual | PARTIAL | Many historical browser slices exist; final-source whole-product C6 acceptance is still open. |
| Production | NOT_STARTED / UNAUTHORIZED | No production acceptance or release approval. |
## Reconciled gate decision
The historical harness string `code_to_code_closure: PASS` is not accepted as the final current gate. It is superseded for current-state purposes by later direct evidence: the same harness remained `IN_PROGRESS`; the fail-closed re-audit still found unresolved authority/recovery rows; and the later merged-source inspection discovered a real D1-mode Prisma shadow lookup that had escaped that earlier PASS claim. That transfer defect was subsequently repaired, but the complete nine-domain authority matrix was not finished afterward.

Therefore the current authoritative state is:

`CODE_TO_CODE_CLOSED = NOT_YET_PROVEN`

This is not a restart. Previously proven, unchanged slices remain reusable. Only the unresolved current rows require future execution.

## Job A completion boundary
Job A is complete when future sessions use this report as the current information authority, preserve historical evidence only as provenance, and do not promote an older `NEXT`, `OPEN`, `PASS`, source-authority split, Graphify count, or runtime statement over this reconciliation without newer direct evidence.

The next engineering session must start from this reconciled information state and the current branch above. It must not redo VM/Work/GitHub archaeology or source reconciliation.
