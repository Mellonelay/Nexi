- [x] SOURCE TESTED 2026-10-18 — Margin late CLOSE recovery: same close order/key, executed trade VWAP, scheduler, failure-atomic Ledger/Activity/Outbox and focused tests PASS. No deployed claim. Receipt: tasks/evidence/margin-late-close-recovery-20261018.md.
- [ ] BACKEND RELEASE GATE — Prove deployment/source identity and authenticated Margin repayment/close, plus other existing finite seven-domain runtime contracts; apply Loan migration 0016 only with current authorized backup/rollback evidence.
- [ ] OPERATIONAL GATE — Encrypted off-VPS backup + isolated restore not yet proven. Current 7 GB SQLite DB exceeds available free VPS space for a second full local copy.

- [x] TESTED 2026-10-18 — Atomic Margin late-entry fill projection and rollback, 23/23 focused tests + TypeScript check; pending late-close settlement. Receipt: tasks/evidence/margin-late-entry-atomic-20261018.md.
- [x] SOURCE TESTED 2026-10-18 — Governance command key altered-payload replay and concurrent loser approval/audit repaired on local SQLite; 2/2 focused tests + TypeScript check passed. Deployment, authenticated Admin and legacy Prisma alternative remain UNPROVEN. Receipt: tasks/evidence/governance-command-local-sqlite-20261018.md.
# NEXI Migration — Executable Frontier

## 2026-10-18 backend closeout handoff — owner stopped the campaign

- [x] TESTED — Final affected local-SQLite suite passed 14/14; focused deposit-address gateway test passed 1/1; `npx tsc --noEmit -p tsconfig.build.json` and `git diff --check` passed. The prior consolidated 9-suite / 106-test proof was reused for unchanged contracts; affected current paths were rechecked separately. Exact results: `tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md`.
- [x] IMPLEMENTED — Current batch includes Spot Activity/Outbox, stable replay and resting-price matching; Margin open projection/replay; Mining subscription intent replay; Binary settlement event and configuration replay binding; atomic deposit claim review/credit and strict deposit-address Outbox; Loan cumulative repayment CAS with migration; withdrawal additional-review/return; Admin command payload binding and conversion expiry guard.
- [ ] OPEN — Source is committed on canonical `main` at `a0a014f`, based on `e09a33172dc1d14f6d379bac8b969e20d22ac9ea`. No deployment, service restart, live database migration or financial write occurred. Owner directed stop after this reconciliation; no further campaign work is authorized in this task.
- [ ] BLOCKED_WITH_EVIDENCE — Current audit has confirmed unresolved Governance command payload collision and decision race, plus Margin partial-entry position projection and close-fill recovery gaps. Full authenticated Admin/API acceptance, other Margin debt/interest/liquidation, full Loan/Mining lifecycles, Binary provider/config integration, D1 delta watermark, durable workflow recovery and encrypted off-VPS restore remain unproven. CodeScene token remains expired (3/6 installation checks passed).
- [ ] NEXT — Next controller: conduct the owner's planned finite financial-command coverage and closure campaign. Apply migration `0016_loan_repayment_cas.sql` only as part of coordinated release. Do not deploy from this handoff.

## 2026-10-18 backend financial continuation

- [x] TESTED — Isolated local-SQLite proof covers same-user MAIN/BINARY/MARGIN wallet transfers, Binary reserve/WIN/LOSS settlement and withdrawal request/reserve/approve/settle/reject/refund. Exact Ledger, audit, Activity, AdminAuditLog, Outbox, replay and overdraft/collision rollback checks pass. Receipt: `tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md`.
- [x] IMPLEMENTED — Fixed Binary open-position SQL value count and added idempotent, state/receipt-guarded `BINARY_POSITION_SETTLED` EventOutbox insertion in the settlement batch. Strict insertion makes an occupied event key roll back the entire settlement batch. Focused local SQLite suite passes 5/5; Binary service suite passes 17/17, including exact-decimal LOSS payout calculation.
- [ ] OPEN — Authenticated live/API financial acceptance remains separate; use only an authorized test-balance identity or supported accounting-backed fixture. No live database write occurred in this proof.
- [ ] NEXT — Continue with deposit claim/review/credit or conversion on disposable state. Keep Binary provider/configuration and authenticated API acceptance, external withdrawal broadcast, and off-VPS backup destination/key-custody gates open.

Owner authority: latest 2026-10-17 directive/checkpoint. See plan.md. States are claim-scoped; test PASS is not deployed/runtime/owner acceptance. Entries above the dated 2026-10-17 live-authority checkpoint are retained historical checkpoints; use the newest dated checkpoint below as the active frontier. Name.com DNS/NS and trusted TLS are complete; the current blocker is financial authority mismatch and the still-populated Cloudflare D1/async resources, not DNS.

- [x] G0 worktree/dirty/source preservation — COMPLETED; owner RDC; proof evidence/g0-recovery.json; migration HEAD 9a41b2e, original d24862f and two pnpm files preserved.
- [x] G0 task controller — COMPLETED; owner parent/RDC; plan.md + todo.md created only after absence check; no prior tasks overwritten.
- [x] G0 recover exact 7/7 + 53/53 + build receipts — COMPLETED; owner RDC native history; prerequisite existing source; native PIDs 1630238 (7/7), 1630417 (53/53), 1631097 (build exit 0) recovered into evidence/recovered-native-proof.json; 7/7 + build become affected when Prisma initialization changes; no financial gateway source changed.
- [x] G0 live GitHub main + artifact provenance — COMPLETED at recovered checkpoint; main9a41b2e, gzipSHA256 and all92 typed data/key fingerprints verified in evidence/export-restored-content-reconciliation.json. Refresh remote ref before Git integration; no redundant export.
- [ ] G1 all 92 application tables schema/key/content — IN_PROGRESS; owner Data reconciliation via RDC/Cloudflare; prerequisite snapshot provenance; proof machine-readable manifests, no raw PII; next choose bounded streaming snapshot comparison and live source predicates.
- [ ] G1 exact financial data + market boundary/coverage — IN_PROGRESS; owner Data + NestJS/Ledger; proof deterministic content hashes, exact money/posting totals, no-gap source prefix; next inspect schema and existing reconciliation output.
- [ ] G2 each Prisma/bridge connection durability — IN_PROGRESS; owner NestJS/SQLite; proof PRAGMA tests; Prisma connection factory repaired and10 focused tests pass; production-source typecheck passed (PID1636645 exit0); runtime acceptance remains separate.
- [ ] G2 concurrency/BUSY/failure/restart/real-dataset smoke — IN_PROGRESS; owner Agent Skills/RDC; prerequisite current source + preserved tests; add only new risk tests and bind evidence.
- [x] G3 queue/DLQ + workflow inventory — COMPLETED for observed source inventory; owner Cloudflare; evidence/cloudflare-async-inventory.json plus read-only DLQ peek:2 retained messages (probe + LOAN_APPROVED). Refresh before cutover; no replay/ack/purge.
- [ ] G3 self-hosted Valkey/BullMQ durable coordinator — IN_PROGRESS; owner NestJS/RDC; prerequisite mapped contracts; proof retry/replay/duplicate/lost-queue/restart for withdrawal/mining/loan and notifications.
- [ ] G4 R2 private objects + other bindings — IN_PROGRESS; owner Cloudflare/RDC; proof secure object manifest/copy/hash/auth/restore + binding closure.
- [ ] G5 full isolated app/domain/browser parity + measured capacity — BLOCKED_WITH_EVIDENCE (G3/G4 runtime closure incomplete); owner runtime/DevTools; prerequisites G1-G4; proof domain acceptance + resource readings; no live financial writer.
- [ ] G5 independent encrypted backup restore — BLOCKED_WITH_EVIDENCE; destination not established in supplied material; prepare consistent local backup/restore tooling and determine authorized independent destination before final acceptance.
- [ ] G6 financial/public-endpoint cutover — PENDING_OWNER_ACTION; prerequisite G1-G5 + exact freeze/drain/hash/rollback-forward packet; obtain specific signoff, no switch yet.
- [x] G7 Name.com DNS/nameservers — COMPLETED by owner 2026-10-17; Name.com authoritative, A records to VPS, DNSSEC not enabled per owner; prior HTTPS/ACME proof retained. No nameserver action remains.
- [ ] G7 Cloudflare resource retirement — PENDING_OWNER_ACTION; each destructive action requires approval after backup/dependency/rollback-window closure.

## Current next action
Current: finish focused structural review, preserve tested journal/transport, integrate durable workflow and queue consumer paths using existing NestJS domain commands; then controlled isolated runtime. G1 archive-to-restore92/92 complete; current live market prefix/final freeze reconciliation remains open. The original recovery frontier is superseded by the timestamped evidence below.

## 2026-10-16 live evidence update
Remote refs/heads/main verified 9a41b2e; Node v22.23.2 / better-sqlite3 12.11.1 / SQLite 3.53.2. Cloudflare live settings confirm CORE_DB=522177fa-ac42-4d8f-a6a8-b34eed262f15 and 41 bindings, including 3 queues, 3 workflows, 2 R2 buckets. Native source-schema request is read-only.

## G1/G2/G3 newly observed evidence
- Local Prisma synchronous=NORMAL reproduced before repair (evidence/sqlite-pragmas-red.log). Connection factory now enforces/checks WAL/FULL/FK/busy timeout on every connection. Focused suite 10/10 PASS (evidence/sqlite-durability-green.log), including reconnect, FK rejection and SQLITE_BUSY rollback/recovery. Source changes remain opt-in and undeployed; typecheck pending after one-heavy-process reconciliation.
- Live schema matches restored schema exactly. 84/90 smaller table content hashes match current D1; changed tables are MarketAsset, MarketAssetCapability, MarketPair, MarketProviderConfig, MarketProviderSymbol, MarketQuoteLatest. This is additional drift beyond count differences; final snapshot/delta must preserve it. All financial/auth/domain tables in the 90-table comparison match by full normalized content. See evidence/small-table-content-reconciliation.json.
- Full gzip-to-restored typed key/content fingerprint scan active (RDC PID 1634203), bounded RAM; does not write restored file or create another full DB. See evidence/export-reconciliation.log and incremental JSON. Native source gzip CRC validation occurs only at full EOF.
- All 3 NEXI primary queues report backlog zero; domain-events DLQ reports 2 messages/604 bytes, other DLQs zero. No messages consumed. Withdrawal/mining workflow instance lists empty; loan list has 4 historical instances (2 complete, 2 errored), no running/waiting observed. Must refresh at cutover. See evidence/cloudflare-async-inventory.json.
- R2 API lists 3 deposit-proof objects and 0 KYC objects. Copy/content-hash still pending. No resource retirement performed.

### 2026-10-16T10:52Z route correction and additional proof
- [x] COMPLETED — Read-only detailed data comparison (`tasks/evidence/detailed-data-reconciliation.json`): five config tables differ only in updatedAt; MarketQuoteLatest has same53 keys with live quote/provider/state changes. LedgerAccount14 and LedgerPosting46 exact Decimal totals match by asset. This is a live-vs-historical comparison, not final cutover consistency.
- [x] COMPLETED — NEXI kernel/router re-entered after owner workflow correction; using-agent-skills + source-driven-development applied. Native Graphify EventOutboxService impact at9a41b2e and Context7 official BullMQ/Cloudflare recovery contracts captured in `tasks/evidence/route-contract-results-1052.json`. Brief builder returned partial; no acceptance authority delegated.
- [ ] IN_PROGRESS — RDC PID1634203 continues existing archive-to-restored fingerprints; only heavy workload. Next: finish all92-table content checks and gzip CRC, then typecheck the changed SQLite adapter. No production data/writer/DNS changes.

### 2026-10-16T11:00Z bounded-cycle checkpoint
- [x] COMPLETED — Ledger account/posting invariant:0 mismatches,0 orphan posting accounts (`ledger-account-posting-invariant.json`). Node3.53.2 read-only7-table real7.16GB dataset smoke:7000 indexed lookups in489ms; hot-key smoke only, not load benchmark (`real-dataset-node-read-smoke.json`). Snapshot directory700/database+archive600.
- [x] COMPLETED — Private R2 staging copy3 deposit objects6073bytes, KYC0; secondGET SHA256/metadata parity (`r2-copy-manifest.json`). Independent backup and app adapter remain unproven.
- [x] COMPLETED — Isolated Valkey8.0.1 from Debian packages extracted privately; no system package install or TCP listener;128MiB noeviction/AOF everysec/socket600. Native WAITAOF+SIGKILL restart recovered synthetic probe (`valkey-crash-recovery.json`); active PID1635337.
- [x] COMPLETED — Owner BullMQ pages read via Firecrawl; Exa upstream release discovery; Aiven live9.1.2/free-1/TLS/noeviction read-only inspection. Nest12.0.3+ioredis5.10.1; compatible published wrapper12.0.0/BullMQ6.3.15 candidates. V6 API changes recorded (`bullmq-current-contract-1100.json`); integration not installed or runtime-proven yet.
- [ ] IN_PROGRESS — Archive scan PID1634203/1634206; reuse. Detailed handoff `checkpoint-1100.json`. Next affected typecheck then durable async implementation. Owner cutover/DNS/deletion gates unchanged.

### G3 durable-journal increment — 2026-10-16T11:04Z
- [x] COMPLETED — New VPS-only additive LocalDurableJob schema and store reuse existing LocalSqliteBridgeService/BEGIN IMMEDIATE. Red5/5 unimplemented behavior failures followed by green5/5 (`durable-job-journal-red.log`, `durable-job-journal-green.log`, PID1635883 exit0). Proves idempotency/content conflict, restart persistence, cross-connection claim/stale-token fencing, retry deadlines and retained terminal failures. No application activation, transport integration or workflow completion claim.
- [ ] IN_PROGRESS — BullMQ6.3.15 + Nest wrapper12.0.0 integration candidates verified from official docs/npm peers. Next: exact6.x constructor types, isolated real queue recovery tests, then application opt-in seam. Live Cloudflare jobs remain untouched.

### G3 transport increment — 2026-10-16T11:12Z
- [x] COMPLETED — Pinned BullMQ6.3.15 + @nestjs/bullmq12.0.0; npm install9 packages exit0 (`bullmq-dependency-install.log`). Current Nest12.0.3/ioredis5.10.1 retained.
- [x] COMPLETED — DurableQueueTransport with SQLite acceptance before enqueue, generation-based job ids, original domain envelope validation, deployed Worker retry timing2^min(attempts,7) seconds (cap300), and failed-attempt retention. Real Nest BullModule/QueueEvents/Worker on private VPS Valkey:4/4 pass (`durable-queue-green.log`, PID1636408 exit0). Proves transport-job deletion recovery, exact initial2s retry boundary, invalid envelope rejection and completed-job deduplication; not full workflow or application activation.
- [ ] IN_PROGRESS — G1 archive scan still active at low CPU priority,~23MiB RSS,~8.6GiB free disk. Next full hash receipt; then affected typecheck/static review.

### Owner routing correction applied — 2026-10-16T11:17:43.369928+00:00
- [x] COMPLETED — Re-entered current Kernel/router and using-agent-skills lifecycle. Ponytail full selected (exact saved entry + mode read); reused bridge transaction and native SQLite constraints. Review checks existing Outbox/Inbox ownership before integration. No second parent or routine subagents. Three native tool lanes launched concurrently: A current source/tasks (PID1636586), B Graphify bounded ownership query at9a41b2e (partial retrieval, direct source completes Inbox/Outbox evidence), C data/proof recovery(PID1636604). Only parent/RDC mutates.
- [x] COMPLETED — G1 existing export restore fidelity:92/92 typed key+content fingerprints,11,802,372 rows; gzip CRC PASS; archiveSHA256 f65862bbd8359329e3b0db410e941462b8d77d0947024cc6205cb8a88ffa4661; artifacts unchanged;1537.15sec; finished11:11:02Z. Native receipt evidence/export-restored-content-reconciliation.json. Current production equality is NOT implied. Internal sqlite_sequence matches separately (Currency5, migrations15).
- [x] COMPLETED — Affected production-source TypeScript check: npx tsc --noEmit --incremental false --project tsconfig.build.json; PID1636645 exit0. Not a production build/deploy or runtime acceptance.
- [ ] IN_PROGRESS — Fallow changed-source review PID1636733 (read-only/no fixes); remote ref/original preservation refresh PID1636801. Recover handles; do not duplicate.

### Focused review closure in progress
- [x] COMPLETED — Explicit test:local-sqlite and test:local-async scripts added; queue integration file now explicit .integration.ts/config, no conditional describe.skip. Native4/4 pass (PID1636980). Coverage run15/15 pass (PID1637053), new measured coverage evidence, not redundant unchanged regression rerun.
- [x] COMPLETED — Live remote main remains9a41b2e; original checkout still only its two preserved pnpm untracked files (PID1636801 exit0).
- [ ] IN_PROGRESS — Fallow backend-scoped measured review; full-repo rerun included generated HTML coverage/report text and is not an application failure verdict. See implementation-review-decision.json; no suppressions/deletions applied.

### 2026-10-16T11:24:23.001949+00:00 checkpoint and review result
- [x] COMPLETED — Backend-scoped Fallow with four measured source coverage profiles:0 new dead-code findings,0 production complexity findings,0 duplication; full verdict still FAIL due10 inherited dependency findings +1 estimated test teardown complexity finding. No actual source suppressions or auto-fixes added. Native evidence/migration-fallow-backend-review.json; review limitation explicitly retained.
- [x] COMPLETED — Async explicit suite coverage4/4 pass (PID1637500); total focused SQLite/journal15 + async4; historical53 financial remain PROVEN_UNCHANGED. Checkpoint evidence/checkpoint-1124.json retains exact current source/handles/lane owners.
- [ ] IN_PROGRESS — Next smallest G3 frontier: durable workflow checkpoint/event/step persistence and domain-command replay, retaining exact Cloudflare semantics. No local workflow state tables exist in92-table source; add only required VPS metadata, no Ledger/Outbox replacement.

### 2026-10-16T11:39:42.513853+00:00 G3 workflow persistence/replay increment
- [x] COMPLETED — LocalWorkflowStore6/6 pass (PID1638041 exit0): identity, restart/saved results, early event buffering, event dedup/late-event rejection, atomic checkpoint+event+step rollback, stale lease fencing. New VPS-only3 metadata tables, same bridge; no application/production activation.
- [x] COMPLETED — Cross-midnight mining command replay reproduced2 failures/3 tests (PID1638332). Additive read-only canonical MiningRewardAccrual checkpoint and optional persisted payload guard; legacy daily Ledger mutation method unchanged. Native SQLite-backed orchestration5/5 pass (PID1638534 exit0), synthetic accrual records only; not full financial runtime proof. Coordinator must persist checkpoint before accrue.
- [x] COMPLETED — Live NEXI_CONFIG KV namespace keys0, no next page; no values or resource changes. Source consumer parity still required.
- [ ] IN_PROGRESS — Existing workflow-command regression PID1638646; native query/type review and coordinator wiring next. Source financial posting routines unchanged,53 prior tests retained only at their original claim scope.

### Workflow coordinator checkpoint 2026-10-16T11:49:43.884118+00:00
- [x] COMPLETED — Lane A/RDC: durable workflow store 6/6; mining replay 5/5; existing workflow command regression 5/5; loan/withdrawal/mining coordinator 6/6. Evidence: `tasks/evidence/local-workflow-store-green.log`, `mining-workflow-replay-green.log`, `workflow-command-regression.log`, `local-workflow-coordinator-green.log`. Source-only isolated synthetic proof; no deployment.
- [ ] IN_PROGRESS — Lane A/RDC: production-source typecheck PID1639475; recover exit, then mining crash-after-effect/before-checkpoint proof.
- [ ] IN_PROGRESS — Lane B: review replay, timeout and failed-instance recovery contracts. Lane C: acceptance frontier/backup continuity; full archive reconciliation remains completed and must not restart.

### G3 11:55Z evidence update
- [x] COMPLETED — Coordinator-source typecheck PID1639475 exit0 (27.22s), `workflow-coordinator-typecheck.log`.
- [x] COMPLETED — Native mining effect/checkpoint fault: SQLite trigger aborts workflow checkpoint after synthetic accrual commit; reopen all connections across midnight; zero duplicate effect calls;6/6 pass PID1639571 (`mining-workflow-native-crash.log`). Synthetic accrual rows, not real financial postings.
- [ ] IN_PROGRESS — Existing Inbox + loan-workflow queue consumption seam; explicit missing-module red then implementation, focused store/consumer tests PID1639803. Not activated.

- [ ] BLOCKED_WITH_EVIDENCE — One checkpoint rollback assertion failed in combined consumer/store run, then isolated6/6, combined10/10,40-instance stress11/11 passed. Root cause not explained; retain production acceptance block (`workflow-recovery-review.json`). No assertion skipped or source workaround applied.

### 2026-10-16T11:56:41.693831+00:00 queue recovery proof
- [x] COMPLETED — Native BullMQ6/Nest12/private Valkey integration5/5, PID1640196 exit0; actual canonical EventInbox migration + financial gateway + existing EventOutboxService + LocalWorkflowStore/coordinator: failure after durable dispatch before acknowledgment recovers, one Inbox receipt, one accepted decision, loan completes. Synthetic command result only; not full financial runtime. `queue-inbox-workflow-recovery.log`.
- [ ] IN_PROGRESS — Focused affected workflow/consumer/mining bundle PID1640320 includes native step-insert fault and40-instance rollback stress. Prior unexplained assertion retained. Next source typecheck and review before inactive runtime driver.


### Workflow guarded-checkpoint repair — 2026-10-16 (current RDC checkpoint)
- [x] FOCUSED VERIFIED — Replaced checkpoint's cross-statement `changes()` dependency with a first-`UPDATE ... RETURNING` row guard inside the existing `BEGIN IMMEDIATE` bridge transaction. A rejected fence executes no dependent effects; exceptions in the event/step actions roll back the checkpoint. Direct synthetic NULL/trigger/crash scenarios included.
- [x] VERIFIED — Clean affected Jest run: 5 suites / 29 tests passed, exit 0. Receipt: `tasks/evidence/workflow-guarded-checkpoint-20261016.log`. Backend build-source TypeScript check exit 0: `tasks/evidence/workflow-guarded-typecheck-20261016.log`. No trace logging remains.
- [ ] PENDING — End-to-end local BullMQ consumer ACK-loss/restart and actual finance-command runtime acceptance, broader local-workflow acceptance. Existing Cloudflare D1 remains production authority. Do not claim full migration or trigger cutover.

### 2026-10-16 later session: VPS runtime and storage integration checkpoint
- [x] INTEGRATED IN ISOLATED WORKTREE — opt-in NestJS LocalAsyncModule and LocalAsyncRuntimeService linking durable journal, BullMQ6/private Valkey, existing EventInbox queue consumer and LocalWorkflowCoordinator to canonical WorkflowCommandsService; Cloudflare default preserved.
- [x] VERIFIED — 7 focused Jest suites / 34 tests passed with strengthened lease preconditions; native local runtime private-Valkey test 1/1 passed. Evidence tasks/evidence/local-async-combined-diagnostic-20261016.log and local-runtime-valkey-20261016.log. No full financial runtime acceptance claimed.
- [x] INTEGRATED IN ISOLATED WORKTREE — local Outbox-to-SQLite durable-journal publication; local queue publishing bypasses Cloudflare queue HTTP and external scheduler Redis lock. Existing Cloudflare default preserved. Local publication focused tests 2/2.
- [x] INTEGRATED IN ISOLATED WORKTREE — local KYC private object storage and local deposit-proof PUT + same existing financial ownership authorization and claim existence check. Focused storage suites 6/6; backend TypeScript source check passed. Local object storage OFF by default.
- [x] VERIFIED — legacy affected 3 Jest suites / 17 tests passed under original Jest config; previous ESM-only execution had missing Jest global and was test harness misrouting, not product regression.
- [x] STAGED ONLY — 3 R2 deposit proof objects, 6073 bytes copied to separate private object directory with original keys, sizes, content hashes and ETags verified. Receipt tasks/evidence/r2-private-local-copy-20261016.json. Not a live path or independent backup.
- [x] CAPABILITY INVOKED — NEXI Work Kernel, Agent Skills, Ponytail, Graphify static mapping and impact, Worker-0 NestJS review SKILL.md and Fallow CLI review. Graphify index at 9a41b2e excludes uncommitted local integration; Fallow broad review includes irrelevant generated coverage HTML and must be scoped.
- [ ] NEXT — verify full NestJS startup/runtime service injection and local queue subscriber with canonical actual financial commands, including withdrawal/mining/loan paths and cold restart/ACK loss.
- [ ] NEXT — reconcile all Cloudflare Worker bindings/routing/KV/analytics/cron/rate limiter and active Workflow instances with local replacements, on live source and platform.
- [ ] NEXT — local HTTP/browser API compatibility and financial Ledger/EventOutbox acceptance, durable data reconciliation, backup/restore, final traffic switch. Cloudflare authority remains LIVE until explicit cutover acceptance.
- [ ] OWNER ACTION — final DNS and nameserver cutover after VPS origin, TLS and application acceptance. Do not change nameservers or shut down Cloudflare prematurely.

### Paused at user-requested skills-library insert — 2026-10-16 14:30Z
- [x] SUPERSEDED — The earlier combined run recorded three failed store assertions and a diagnostic note, but its inferred `UPDATE RETURNING`/`changes()` explanation was incorrect and is not supported by that artifact. The later clean affected-workflow bundle passed 24/24 across store, coordinator, consumer and mining-replay suites (`tasks/evidence/workflow-recovery-clean-green.log`, PID1647929, exit0); the native trigger rollback and restart replay passed. Treat the earlier failure as non-reproduced, not as proof of a SQLite DDL/PRAGMA defect; preserve its log for provenance.
- [x] COMPLETED — Current user side task: installed BullMQ and Socket.IO skills under `/root/.codex/skills`; verified with Creator validator and both integrity scripts. Private local skill library Git commit f573560; not pushed to any GitHub repo.


### Re-entry checkpoint 2026-10-16T14:52:20Z — recovered execution lanes
- [x] PROVEN_UNCHANGED — Focused affected workflow recovery bundle remains green at 24/24 (PID1647929, `workflow-recovery-clean-green.log`); earlier combined failure is superseded above. No test rerun.
- [x] PROVEN_UNCHANGED — Production-source TypeScript check completed exit0 (RDC PID1648000, `workflow-queue-source-typecheck.log`; empty output is expected for a clean tsc run).
- [x] PROVEN_UNCHANGED — Explicit local BullMQ/Valkey runtime acceptance already passed 1/1 in `local-runtime-valkey-20261016.log`; temporary SQLite + private Unix-socket Valkey, but the callback and event are synthetic and the service is constructed directly, so this is not full Nest DI, EventInbox or financial-command runtime acceptance.
- [x] VERIFIED — Worktree remains `migration/sqlite-local-bridge` at HEAD `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; all migration changes are uncommitted in the isolated worktree. Original checkout and Cloudflare production were not changed.
- [x] VERIFIED — Runtime-resolved dependencies are BullMQ 6.3.15 and ioredis 5.10.1. Official BullMQ v6 docs confirm constructor connection options and graceful Worker/Queue close; existing local code uses Queue retries=1, Worker retries=null, an absolute Unix socket, and closes workers/queues on module destroy. No connection-contract mismatch found.
- [ ] IN_PROGRESS — First unresolved G3 acceptance: join real LocalAsyncRuntimeService, canonical EventInbox/EventOutbox consumer, and WorkflowCommandsService in a disposable local database test; exercise representative withdrawal/mining/loan effects and cold restart/ACK loss without touching production. Existing split proofs do not yet establish this combined path.
- [ ] IN_PROGRESS — Lane B: verify source queue mapping and consumer ownership against deployed Worker code; Cloudflare service inventory/cutover remains open. Lane C: retain G1 final live data delta, independent encrypted backup/restore, and G4/G5 gaps as pending; do not repeat completed snapshot reconciliation.

### 2026-10-16T15:09Z — G3 Nest/runtime integration checkpoint

- [x] COMPLETED — Reproduced and fixed Nest DI token erasure in `LocalAsyncRuntimeService`; changed only `import type { D1WorkerBridgeService }` to a runtime class import. Red receipt: `tasks/evidence/workflow-commands-real-runtime-red.log`. The new regression test fails before the fix and passes after it.
- [x] COMPLETED — Real isolated local runtime integration: `workflow-commands.integration.ts`, 5/5 in `tasks/evidence/workflow-commands-real-runtime-final.log`; financial command effects, canonical Inbox/Outbox, ACK-loss after durable dispatch, and cold Nest restart. Temp SQLite + private Unix-socket Valkey; no production DB.
- [x] COMPLETED — Changed backend source `tsc --noEmit --incremental false --project tsconfig.build.json`, exit 0; receipt `tasks/evidence/workflow-runtime-typecheck-20261016.log`.
- [x] COMPLETED — Scoped Fallow review and post-change Graphify no-cluster refresh/path. Fallow: one changed source file, 8-file impact cone; review findings kept as structural prompts, not behavior proof. Graphify: 7,862 nodes / 19,027 edges and bridge-injection path; `tasks/evidence/graphify-runtime-import-update-20261016.log`.
- [x] PROVEN_UNCHANGED — Existing historical 24/24 workflow recovery suite, 7/7 SQLite bridge suite and 53/53 financial regression suite not rerun; source/output scope did not invalidate their prior claims. Current new integration adds stronger local scope only.
- [ ] IN_PROGRESS — Lane B/C read-only parity check: fetch current official Cloudflare Queue/Workflow docs, inspect active Worker queue handlers and live workflow instances/DLQ policy; compare message routes and persistence behavior with `LocalQueueConsumer` before changing handlers.
- [ ] PENDING — After parity evidence, continue the next smallest durable workflow/queue gap; preserve D1 as production truth and the isolated runtime opt-in until owner-approved cutover.


### 2026-10-16T15:35Z — deployed queue parity and runtime acceptance
- [x] COMPLETED — Lane B/read-only: Cloudflare API inventory of current nexi-production bindings, all three NEXI Queue consumers/DLQs/backlogs, deployed handler logic, and Workflow instance statuses. Evidence: tasks/evidence/cloudflare-queue-workflow-runtime-inventory-20261016.json. No payloads or secret values saved; no writes performed.
- [x] COMPLETED — Lane A/RDC: actual Nest LocalAsyncModule, local SQLite, private Valkey, canonical EventInbox/EventOutbox and WorkflowCommands integration passes 6/6 in 18.663s; includes all three queue classes, financial withdrawal settlement once, mining accrual, overdue-loan event, loan approval and cold restart after simulated journal ACK loss. Evidence: tasks/evidence/deployed-queue-class-parity-20261016.log (RDC PID1652071, exit0). This is isolated test evidence, not production deployment/cutover.
- [x] VERIFIED — Local durable store prior test coverage retained: idempotent receipt, SQLite reconnect, dual-connection lease fencing, due-time retry, terminal FAILED row with bounded lastError, queue partitioning/input bounds (prior evidence unchanged; not rerun).
- [x] VERIFIED — Cloudflare configured max_retries=5 means six delivery attempts including first delivery; local journal default maxAttempts=6. Worker per-message retry uses capped exponential delay; local journal uses same exponential seconds converted to milliseconds, capped at 300 seconds. Cloudflare global retry_delay=15s is overridden by explicit Worker retry for handler failures. Exact local replay from terminal FAILED remains unimplemented/unverified.
- [x] COMPLETED — Lane A/RDC: implemented terminal FAILED-job inspection and explicit replay generation with attempt/error history, conditional replay, distinct BullMQ job IDs, and payload-free dispatch. Focused test/type evidence: tasks/evidence/bullmq-failed-job-replay-contract-20261016.md. No production activation.
- [x] COMPLETED WITH SCOPE LIMIT — Lane B: official BullMQ v6, NestJS, and ioredis contracts reviewed against installed versions and local producer/worker settings; direct code review complete. Fallow included 96 changed files, generated coverage, and dependency-index warnings, so it is a structural signal rather than a scoped clean verdict. Evidence: tasks/evidence/bullmq-failed-job-replay-contract-20261016.md.
- [ ] PENDING — Lane C: G4 actual Cloudflare service consumer closure, G1 controlled final live delta, off-VPS encrypted backup/restore, G5 application/runtime acceptance, G6/G7 owner gates remain pending; historical export/reconciliation is not to be restarted.


### 2026-10-16 — BullMQ failed-job replay and connection contract

- [x] COMPLETED — Supersedes the prior IN_PROGRESS failed-job recovery item: implemented terminal FAILED-job inspection and explicit replay generation with attempt/error history, conditional replay, distinct BullMQ job IDs, and payload-free dispatch. Focused test/type evidence: tasks/evidence/bullmq-failed-job-replay-contract-20261016.md. No production activation.
- [x] COMPLETED WITH SCOPE LIMIT — Supplied official BullMQ v6, NestJS, ioredis reconnect/production docs read and checked against installed versions and local producer/worker configuration; direct code review complete. Fallow reviewed 96 branch files and generated coverage with dependency-index warnings; it is a structural signal, not a scoped clean verdict. Evidence above.
- [x] VERIFIED — Runtime/transport 8/8, journal store 6/6, backend source typecheck exit 0, git diff --check exit 0. The retained old BullMQ job remains available and a replay dispatches under a distinct generation ID.
- [ ] PENDING — Map current admin governance/auth before adding an operator-facing inspection/replay control. This slice exposes no public HTTP replay endpoint.
- [ ] PENDING — Continue G3 broader workflow/job acceptance, G4/G5 Cloudflare dependency closure and application parity, G1 controlled final delta, off-VPS encrypted backup/restore, and owner-gated G6/G7. Production D1/Cloudflare remains authoritative.


### 2026-10-16 — admin governance prerequisite for queue replay

- [x] VERIFIED — Admin route gate and RBAC location mapped: AdminController uses JWT, ADMIN auth-surface, Role.ADMIN, and per-route AdminPermissionGuard. Guard resolves role through D1FinancialCommandGateway.getAdminIdentity. Current permission keys contain no async-job controls.
- [x] VERIFIED — Canonical AdminAuditLog is present. Existing generic service audit writes can be separate from mutations; an operational replay route must atomically record actor/reason/idempotency and replay lineage/audit in the SQLite bridge transaction before exposure.
- [x] DEFERRED_SCOPE — Owner correction 2026-10-16: defer Admin async-job inspection/replay endpoint; it is not required to complete Cloudflare exit. Do not add its routes, permissions, schemas, governance controls, or interface-specific test system.
- [x] DEFERRED_SCOPE — No admin replay route is being added; no separate AdminPermissionGuard runtime work is needed for the migration.


### Owner scope correction — 2026-10-16

- [x] DEFERRED_SCOPE — Admin async-job inspection/replay endpoint, its permission/audit work, and endpoint-specific schemas/tests are not required for Cloudflare removal. Preserve existing journal replay implementation and its completed proof; do not expand it.
- [x] ROUTED — Continue migration on VPS application startup, mandatory Cloudflare dependency replacements, object/config/routing closure, and final acceptance. Keep Cloudflare production authority until gated cutover.


### 2026-10-16 — VPS runtime candidate checkpoint

- [x] COMPLETED — Worker-0/RDC: staged the built migration candidate in `/srv/nexi/backend/releases/20261016T1658Z-9a41b2e3-dirty`; current symlink points to candidate. Candidate `dist/src/main.js` checksum matches the branch build. Container image comparison confirms Cloudflare Container digest `sha256:a960be…d1037` is a separate artifact; VM had no backend image at recovery. Receipt: `tasks/evidence/vps-runtime-candidate-20261016.md`.
- [x] COMPLETED — Worker-0/RDC: created/started local Valkey service with AOF, loopback TCP, private Unix socket and `noeviction`; both endpoints PONG. Existing Public/Admin services are active and untouched.
- [x] COMPLETED — Worker-0/RDC: bootstrapped empty non-authoritative local SQLite staging DB from 15 existing D1 migrations and two VPS-only durable runtime schemas; 96 tables, integrity ok, no FK errors. No historical snapshot or customer/financial data copied.
- [x] COMPLETED — Worker-0/RDC: installed protected backend env and API systemd unit; unit validation passes. API unit is disabled/inactive. Nginx API config is staged in sites-available but not enabled; current Nginx config test passes.
- [ ] BLOCKED_WITH_EVIDENCE — API startup/readiness and route checks require an authorized `JWT_SECRET` and final market/provider runtime inputs. No secret was fabricated or read from Cloudflare. Evidence above.
- [ ] BLOCKED_WITH_EVIDENCE — API TLS vhost enablement requires certificate files and a validated TLS configuration. Current certificate paths are missing; keep site disabled and production routing unchanged.
- [ ] IN_PROGRESS — Continue G3/G4 mandatory Cloudflare dependency closure and G5 VPS application acceptance after startup prerequisites. G1 controlled final live delta, independent encrypted backup/restore, G6 financial cutover and G7 DNS/resource retirement remain open; do not repeat historical snapshot reconciliation.


### 2026-10-16 — production package and local runtime proof

- [x] COMPLETED — Diagnosed and fixed release packaging: production `@prisma/client` (exact 7.3.0) now includes runtime utils; generated D1 client copied according to existing backend Dockerfile. Regression test red/green; fresh production-only release installed. Evidence: `tasks/evidence/vps-runtime-candidate-20261016.md`.
- [x] VERIFIED — Actual candidate D1PrismaService opens staging SQLite: ready true, SQLite 3.53.2, 96 tables, WAL/FULL/FK/busy-timeout PRAGMAs correct. One disposable BullMQ job completes against local Valkey via Unix socket and is removed.
- [x] VERIFIED — Current symlink updated to `20261016T1735Z-9a41b2e3-prisma-runtimefix`; prior release retained; API still disabled/inactive.
- [ ] BLOCKED_WITH_EVIDENCE — API startup/readiness remains pending an authorized `JWT_SECRET` and confirmed market/provider inputs. API TLS vhost remains disabled pending certificate. No Cloudflare/DNS/financial authority changed.
- [ ] IN_PROGRESS — Lane B confirms live KV and Analytics handlers remain deployed; zero KV keys and no NestJS callers are evidence only. Rule out private Container callers and define local health telemetry continuity before dependency retirement. Reuse the prior R2 copy proof; do not recopy.


### 2026-10-16 — readiness authority release update
- [x] COMPLETED — Packaged the already-built SQLite readiness-authority fix in versioned release `20261016T1810Z-9a41b2e3-readinessfix`; actual Prisma + ReadinessService smoke reports READY/SQLite against empty staging DB. Evidence: `tasks/evidence/vps-runtime-candidate-20261016.md`.
- [x] VERIFIED — `/srv/nexi/backend/current` points to that release; API service remains inactive, Valkey and Nginx remain active.
- [ ] BLOCKED_WITH_EVIDENCE — Full API HTTP/readiness and route checks still require authorized `JWT_SECRET` and confirmed provider settings; TLS vhost awaits certificate. Do not activate or expose API yet.


### 2026-10-16T18:45Z — NestJS Observe removal and runtime confirmation
- [x] COMPLETED — Removed `@nestjs/observe` imports, module registration, startup instrumentation, source file, focused test, package declaration and lock entries. Search of active source/compiled output/manifest/locks returns no references. Sentry import and environment remain. No Cloudflare secrets/resources were changed.
- [x] VERIFIED — Branch build `npm run build` exit 0; Fallow scoped dead-code check reports 0 issues and scoped complexity check reports 0 findings in `src/app.module.ts` and `src/main.ts` (generated-file/boundary configuration diagnostics are unrelated).
- [x] VERIFIED — Worker-0 installed new compiled `app.module.js`/`main.js` to `/srv/nexi/backend`, removed Observe compiled files and active module directory, and preserved rollback copy plus old release. Cold restart succeeded with Observe absent. `/healthz` UP; `/readyz` READY with SQLite and Redis true; `/market/prices` HTTP 200; Socket.IO polling handshake and WebSocket connect pass. No Observe telemetry or 401/429 errors in inspected restart logs. Service remains loopback-only and boot-disabled; Nginx/TLS/DNS/Cloudflare unchanged.
- [x] PROVEN_UNCHANGED — Existing SQLite/BullMQ financial/workflow proofs were not rerun; Observe removal does not touch their source paths. Earlier Aiven BullMQ job proof remains unchanged.
- [ ] IN_PROGRESS — Resolve migration-worktree install drift before the final canonical build: npm lock resolves Nest 12.0.3 while pnpm lock resolves 12.1.3; installed worktree Prisma CLI/client are 7.10.0 while manifest pins client/adapter 7.3.0. Confirm authoritative package manager and lock-aligned node_modules without upgrading dependencies.
- [ ] IN_PROGRESS — Continue G4/G5 mandatory Cloudflare dependency closure, app parity and recovery backup. Historical D1 snapshot reconciliation remains closed; final live delta and owner-gated cutover/DNS/retirement remain pending.


### 2026-10-16T20:01Z — live runtime correction and active frontier
- [x] PROVEN_COMPLETE — Reused the existing API runtime without restart: systemd API active at `/srv/nexi/backend/dist/src/main.js`; health/readiness/market/OpenAPI checks returned 200; OpenAPI has 221 paths; Socket.IO Engine.IO v4 polling handshake opened successfully. Evidence: `tasks/evidence/runtime-checkpoint-20261016.md`.
- [x] PROVEN_COMPLETE — Aiven Valkey endpoint is the active API process's Redis target: sanitized in-memory TLS PING=PONG and 16 established sockets from API PID to the Aiven-resolved address. Current API connection to local Valkey was not observed. Keep the local test service while tests may use it.
- [x] PROVEN_UNCHANGED — Runtime package versions align with the canonical `/srv/nexi/backend/package-lock.json`; tracked npm lock declarations match the source manifest. The 12.0.3 vs 12.1.3 Nest resolution differs only within `^12.0.0`; do not reinstall/upgrade based on that alone. Untracked pnpm lock preserved.
- [x] SUPERSEDED — Earlier todo statements that API was inactive / that self-hosted Valkey is the target are historical and no longer current. API is active but remains loopback/non-authoritative; Aiven is final, local Valkey test-only. API boot enablement is disabled and remains a pending runtime-operability item after the readiness/configuration decision.
- [ ] IN_PROGRESS — Lane B: finish exact Cloudflare-only dependency closure against current Worker/Container evidence; do not repeat D1 historical reconciliation.
- [ ] IN_PROGRESS — Lane A: identify and close first confirmed mandatory integration gap from Lane B/runtime evidence. Do not rebuild until source/lock frontier and disk headroom justify it.
- [ ] IN_PROGRESS — Lane C: complete acceptance gaps (authenticated finance path, Socket.IO upgrade/event behavior, Nginx/TLS API vhost, backup/restore); only run checks that can safely remain non-authoritative.
- [ ] PENDING — Final live D1 delta and independent off-VPS encrypted backup/restore.
- [ ] PENDING_OWNER_ACTION — Financial writer cutover, Name.com DNS/nameserver change, Cloudflare retirement.


### 2026-10-16T20:03Z — boot supervision and Nginx candidate
- [x] COMPLETED — Enabled the existing API unit for boot. It stayed active on the same PID and `/healthz` remained HTTP 200; no restart or traffic cutover occurred.
- [x] COMPLETED — Removed the duplicate WebSocket upgrade `map` from the disabled API vhost draft; active Nginx configuration passes `nginx -t`.
- [ ] BLOCKED_WITH_EVIDENCE — API vhost activation awaits the candidate's browser-trusted Let's Encrypt fullchain/private-key files. Candidate remains disabled, DNS unchanged; the active Nginx config test does not parse this disabled draft.


### 2026-10-16T20:06Z — async runtime and market backpressure evidence
- [x] PROVEN_COMPLETE — Active service has local SQLite and local-async flags enabled; source selects Aiven `NEXI_VALKEY_URL` before Unix-socket fallback. Aiven-backed, read-only BullMQ counts succeeded for all three queues; all zero, no job/state writes. Evidence: `tasks/evidence/runtime-checkpoint-20261016.md`.
- [ ] IN_PROGRESS — Market acceptance: active Binance-only staging provider emits recurring bounded-ingest saturation warnings; confirm representative-load quote/kline freshness and required depth/trade realtime behavior. Source explicitly sheds volatile reference events while prioritizing durable quote/kline work; no change made pending proof.


### 2026-10-16T20:17Z — live image/binding evidence

- [x] VERIFIED — Current Cloudflare Worker version/deployment and immutable Container image digest were read without mutation; config and one running instance match digest `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`. Worker still has fetch/queue/scheduled handlers and live Cloudflare bindings. Evidence: current RDC/Wrangler and Cloudflare API observations; see this checkpoint and prior binding inventory.
- [x] VERIFIED — VM `cf` v1.0.0-beta.12 SSH invocation reached the Container's Dropbear banner but timed out after 18 seconds with raw SSH negotiation bytes. Do not infer in-container runtime or image/source parity from that output.
- [ ] IN_PROGRESS — Obtain image-internal Node/package/entrypoint evidence via a supported non-mutating route, or keep the comparison explicitly unverified; compare against the active VPS backend before any production switch.
- [ ] IN_PROGRESS — Continue only the live dependency closure needed for VPS parity: identify remaining actual Container/Worker callers for D1, Queues/Workflows, R2, KV, DO, limiter, cron, Analytics and secrets; preserve all Cloudflare production resources until gated cutover.
- [ ] PENDING — API public TLS route/certificate, authenticated API/WebSocket event acceptance, representative market-load acceptance, final live D1 delta, independent encrypted backup/restore, and owner-controlled financial cutover/DNS/resource-retirement gates remain open. Historical D1 reconciliation remains closed and must not be repeated.


### 2026-10-16T20:22Z — endpoint/image CLI follow-up

- [x] VERIFIED — Public Cloudflare API `/healthz` returned HTTP 200; this confirms current public health only, not VPS cutover/parity.
- [x] VERIFIED — `cf containers images list` shows registry tag `de16e62e` for `nexi-api-staging`, corresponding by label to current Worker version ID. The CLI provides no inspect operation; Docker on the VM has no local matching image. No image was pulled or modified.
- [ ] BLOCKED_WITH_EVIDENCE — Obtain image-internal runtime/provenance from a supported Cloudflare image/SSH route, or retain as unverified. Keep production Cloudflare, D1, DNS and public routing unchanged.

- [x] VERIFIED — Checked this `cf` CLI's own SSH syntax and tried both its documented direct command form and a harmless echo; neither produced usable in-container output (the echo form timed out during SSH negotiation).


### 2026-10-16T20:24Z — Container runtime comparison

- [x] VERIFIED — Authorized read-only SSH works with PTY plus the matching Worker-0 key. Node v24.21.0 / ABI 137; PID 1 is `node dist/src/main.js`, cwd `/app`, executable `/usr/local/bin/node`; compiled `/app/dist/src` exists.
- [x] VERIFIED — In-image package and lock hashes match deployed release commit `7fbde5ca82287902cb351546ccae1b632f1aae44`. Installed Nest core/platform/websockets 12.0.3, Observe 0.1.10, Prisma D1 adapter 7.3.0, ioredis 5.10.1, Socket.IO 4.8.3, Streams adapter 0.3.0. No Prisma SQLite client/adapter, better-sqlite3, BullMQ or @nestjs/bullmq.
- [x] SUPERSEDED — Earlier SSH/image-inspection blocker is closed. This Cloudflare image is the D1/Observe runtime, not the VPS SQLite/BullMQ runtime. No Cloudflare production changes.
- [ ] IN_PROGRESS — Continue actual Cloudflare consumer replacement and VPS acceptance: trusted TLS vhost, authenticated API/WebSocket, representative market load, final live D1 delta, independent encrypted backup/restore.
- [ ] PENDING_OWNER_ACTION — Financial writer cutover, DNS/nameserver change and destructive Cloudflare retirement remain separate gates.
- [x] Confirm authorized Wrangler SSH path against the active Cloudflare container — `wrangler 4.129.0` connected; remote Node `v24.21.0`, matching prior `cf` evidence; temporary agent socket cleanup verified; read-only. Evidence: `tasks/evidence/runtime-checkpoint-20261016.md`.


## Latest owner-controlled frontier — 2026-10-16 20:52 UTC (authoritative over earlier duplicated notes)

- [x] VERIFIED — Node 24.21.0 deployed to isolated API service and nexi-api.service is enabled/active; loopback health/readiness reports SQLite + Redis healthy. Public/Admin PIDs and Cloudflare production unchanged. Evidence: tasks/evidence/runtime-checkpoint-20261016.md.
- [x] COMPLETED — Migration worktree dependency installation aligned with tracked backend/package-lock.json via npm 10.9.8 under Node24; 926 packages. Untracked backend/pnpm-lock.yaml preserved, not used as authority.
- [x] VERIFIED — Installed package versions/native SQLite, focused SQLite 16/16, async/workflow 14/14 using local isolated Valkey, backend build exit 0. No historical financial suite or export rerun.
- [x] VERIFIED — Sentry received one explicitly tagged, non-PII vps-staging acceptance event (issue NEXI-X); this proves SDK delivery, not in-process auto-capture from NestJS.
- [x] PROVEN_UNCHANGED — Active VPS local-mode selectors choose SQLite, local jobs and local evidence storage. Cloudflare code paths are conditional compatibility fallbacks; no active call confirmed. Keep migration source and existing controls.
- [ ] BLOCKED_WITH_EVIDENCE — Public trusted TLS API vhost awaits owner DNS sequencing/certificate issuance; Cloudflare nameservers remain authoritative, candidate API vhost is disabled, and Cloudflare Origin CA is not browser-trusted.
- [ ] BLOCKED_WITH_EVIDENCE — Authenticated REST/financial acceptance lacks a documented authorized non-financial test identity; no financial command was issued.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore destination and job are not established. Historical snapshot restore is not independent DR.
- [ ] PENDING — Final live D1 delta/reconciliation and exact cutover freeze/drain/rollback-forward packet; historical 92-table/11,802,372-row reconciliation stays closed.
- [ ] BLOCKED_WITH_EVIDENCE — Exact running Cloudflare container image runtime parity remains unverified because Wrangler/CF SSH has only reached SSH protocol negotiation, no remote command output.
- [ ] PENDING_OWNER_ACTION — Production financial writer switch, Name.com nameserver change (owner performs), and destructive Cloudflare retirement.


## Canonical-main integration and documentation checkpoint — 2026-10-16 21:29 UTC

- [x] INTEGRATED — Migration source patch applied and committed locally on canonical `main`, based on `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; GitHub synchronization is pending. Migration worktree kept intact. Existing untracked `apps/admin/pnpm-lock.yaml` and `apps/admin/pnpm-workspace.yaml` were preserved.
- [x] VERIFIED — Canonical npm `package.json` and `package-lock.json` match deployed backend package/lock hashes. Fresh `npm ci` completed (923 packages); Node v24.21.0, npm 11.19.0. `npm ls --depth=0` exits 0, Native SQLite loads, and `npm run build` exits 0. Receipt: `tasks/evidence/canonical-main-integration-20261016.md`.
- [x] VERIFIED — Native SQLite load returned SQLite 3.53.2; `@prisma/adapter-better-sqlite3` resolved 7.3.0. Canonical built `dist/src/main.js` and active `/srv/nexi/backend/dist/src/main.js` have the same SHA-256. Existing systemd API is active and enabled; no restart was made.
- [x] REVIEWED — Fallow 3.30.0 scoped to the 24 changed backend production TS files (24 paths, tests/generated/deps/manifests excluded): no unresolved imports/cycles/boundary violations. Six unused-member candidates were checked; internal calls and test-only replay surfaces were retained. Policy detector did not run (no rule packs configured). This is static evidence, not type/runtime proof.
- [x] VERIFIED — Local Graphify refresh on canonical integrated source: 7,962 nodes / 19,141 edges. Focused extracted path recorded in `tasks/evidence/canonical-main-integration-20261016.md`; hosted graph is pre-integration.
- [x] UPDATED — Added `docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md` with component map, data flow, Cloudflare-to-VPS replacement matrix and exact remaining acceptance/owner gates. Updated backend, system architecture, cross-surface map, diagrams, docs index, Sentry operations, capability routing, root/backend instructions and current-state docs to describe VPS target while recording Cloudflare as still-live production. Relative-link/fence check passed 11 docs with zero issues.
- [x] COMPLETED — 11-doc relative-link/fence check returned zero issues; staged diff/secret checks passed; source and docs committed and pushed. the later GitHub `index.popsql` update was fast-forwarded and the reconciliation checkpoint was pushed. Original untracked Admin pnpm files remain untouched.
- [x] SUPERSEDED — Nginx API trusted TLS is closed in the 2026-10-17 Public DNS/TLS checkpoint below. Still open: authenticated financial REST acceptance identity; end-to-end market + Socket.IO recovery acceptance; independent encrypted off-VPS backup/restore; current live D1 delta and cutover protocol.
- [ ] PENDING_OWNER_ACTION — Final financial writer/traffic cutover and destructive Cloudflare resource retirement. Name.com nameserver change is complete. Do not mutate production Cloudflare/DNS/writer.

Superseded historical rows remain above for provenance. Do not revive old statements that the API is inactive, Node is v22, self-hosted Valkey is the final target, Container image parity is unknown (in-container inspection is recorded above), or the main source remains isolated on a migration branch.

## 2026-10-17 TODO — Public DNS/TLS routed to VPS

- [x] VERIFIED — Name.com DNS sends www/api/admin to 34.143.137.221. Owner-created GCP ingress ALLOW TCP/80 rule is enabled for tag singbox-chatgpt-24443; screenshot and live Nginx/ACME results agree.
- [x] COMPLETED — HTTP-01 staging and production issuance succeeded; SAN certificate installed for all three hostnames, expires 2027-01-15. Active Nginx configs updated with backups; nginx -t/reload passed.
- [x] VERIFIED — HTTP redirects with 301 to HTTPS for all three hosts; ACME challenge remains reachable on HTTP. Strict HTTPS returns Public/Admin 200 final routes, API readiness 200, market prices 200, Socket.IO polling handshake and actual WSS connect; TLS verify result 0 and VPS remote IP.
- [x] VERIFIED — Certbot timer, NEXI-only Nginx deploy hook, manual hook invocation and certbot renew --dry-run all passed.
- [ ] OPEN — Find authorized test identity for financial API acceptance; do not create financial test balances without the established owner-approved path.
- [ ] OPEN — Establish an authorized independent encrypted off-VPS backup destination and verify restore.
- [ ] OPEN — Reconcile final live D1 delta and prepare controlled freeze/drain/one-writer cutover. Production cutover still requires owner approval.
- [ ] OPEN — Retire Cloudflare resources only after dependency closure, backup/retention and approved cutover. No resources retired.


### 2026-10-17 live authority recheck — Wrangler + active VPS
- [x] PROVEN — At the live-authority recheck, canonical source was `/home/mellonelay1999/workspaces/Nexi`, branch `main`, HEAD and `origin/main` both `bbc849b16291b034b596b80f77790d13112f4cb2`; docs/evidence reconciliation is now committed and pushed as `89244628428176cc81239321291799333866caef`. Preserved untracked Admin pnpm files remain untouched.
- [x] PROVEN_UNCHANGED — Name.com public DNS and trusted HTTPS checkpoint reused from prior direct checks; no DNS/TLS mutations in this pass.
- [x] COMPLETED — D1 operational counts revalidated with project-local Wrangler 4.127.1 (required operator path), read-only SELECTs only. Evidence: `tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json`. Reused prior 92-table historical restore reconciliation; no export/replay.
- [x] COMPLETED — Active service config/source confirms local SQLite adapter is selected and the financial command gateway is enabled; active DB core rows are zero across the sampled financial/auth set. D1 still contains users, wallets, ledger postings/idempotency/audit, outbox/inbox, loan/mining records. No financial command was issued.
- [ ] BLOCKED_WITH_EVIDENCE — Live production API/data authority mismatch: DNS sends public hostnames to VPS; active VPS financial DB has zero core records while Cloudflare D1 has existing records; local financial gateway config is enabled. No writer switch or record copy performed. Evidence above. Next: owner-controlled decision for protecting active public financial command paths, followed by controlled final delta/cutover packet. Do not proceed with financial tests against production.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore unavailable: prior read-only lane found no configured authorized destination; Google bucket listing denied for active VM identity. Next: owner supplies approved destination and least-privilege credentials; encryption key remains separate.
- [ ] PENDING_OWNER_ACTION — Authenticated API/financial acceptance needs an authorized test identity; no credentials or synthetic financial state will be created.
- [ ] BLOCKED_WITH_EVIDENCE — Cloudflare retirement remains blocked: active one-minute Worker cron/queue handlers, D1 authority, backup and cutover gates. Wrangler read-only review confirmed the two errored loan instances were invalid-`loanId` test/probe triggers with no steps; see `tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md`. No resources stopped/deleted.
- [ ] PENDING_OWNER_ACTION — Final D1-to-SQLite financial writer cutover and destructive Cloudflare retirement remain separate owner approval gates; manual Name.com DNS action already completed by owner.


### 2026-10-17 write-path reachability review — source-only, no requests
- [x] VERIFIED — Active service env: local SQLite=true, D1 runtime/bridge compatibility flags=true, NEXI_SCHEDULER_ENABLED=false, NEXI_LOCAL_ASYNC_ENABLED=true; no secrets captured. Local SQLite adapter and local bridge are selected by source.
- [x] VERIFIED — Authenticated financial mutation paths can write through the local gateway to the empty VPS DB. Representative route families include withdrawals/transfers/conversion, loans, binary, spot/margin, mining and deposit claims. JWT-protected /lever/* endpoints include direct Prisma writes outside the gateway. No write requests were sent.
- [x] VERIFIED — Turning off D1_RUNTIME_ENABLED alone does not establish a complete write freeze. Schedulers are disabled but async workers are enabled. D1 bridge reachability from VPS remains unverified, so do not flip adapter mode blindly. Detailed source handoff: tasks/evidence/vps-financial-write-path-risk-20261017.md.
- [ ] PENDING_OWNER_ACTION — Choose coordinated temporary production write freeze/maintenance covering HTTP and local async consumers, or authorize a verified D1-backed route after its transport is proven. Preserve read-only/auth behavior and verify bounded effects. Then continue controlled D1 delta and separate writer-cutover gate.


### 2026-10-17 Cloudflare loan workflow error classification
- [x] VERIFIED — Wrangler 4.127.1 read-only descriptions show both errored loan workflow IDs were explicit proof probes failing immediately on invalid `loanId`; no steps executed. No payload was retained and no instance was mutated. Evidence: `tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md`.
- [ ] BLOCKED_WITH_EVIDENCE — Remaining Cloudflare retirement gates are active Worker cron/queue consumers, D1 authority mismatch, missing approved off-VPS encrypted backup destination, and owner-controlled financial write protection/cutover.

### 2026-10-17 SQLite artifact vs live runtime recovery

- [x] COMPLETED — Recover canonical main 1962dc73efda25d4562ddd52a63fb6e477f1c52f and preserve two untracked Admin pnpm files plus the isolated migration worktree; no checkout/reset or cleanup performed.
- [x] VERIFIED — Live service PID 1680547, systemd working directory /srv/nexi/backend, Node 24.21.0, configured SQLite path /var/lib/nexi/sqlite/nexi-staging.sqlite; process has DB/WAL/SHM descriptors. This is inode 421320, distinct from the historical restore. Evidence: tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json.
- [x] VERIFIED — Root cause of empty core tables: service targets a separate 96-table staging DB; restored 92-table full-data artifact was never installed at the service path. Five runtime-only journal/workflow tables exist and all five have count 0; restored artifact has d1_migrations instead. This disproves the same-DB/stale-read/path-alias hypothesis; do not infer current D1 equality.
- [x] PROVEN_UNCHANGED — Reused 2026-10-16 export/restored receipt: 92/92 typed key+content fingerprints and 11,802,372 source rows; archive gzip SHA-256 rechecked to the recorded digest. No repeat export or row reconciliation.
- [x] VERIFIED — Current D1 CORE_DB ID confirmed from wrangler.jsonc and read-only Wrangler query; latest observed financial posting/audit/idempotency 2026-10-17 00:00:04; outbox 00:00:13; inbox 00:00:19. Query wrote 0 rows. This is not a frozen export watermark.
- [x] PROVEN_UNCHANGED — Reused the owner-reported historical export/restored SQLite integrity and foreign-key pass; a redundant current rerun was stopped after 17m14s / 3,185,134,762 bytes read without output. No new pass is claimed, and no duplicate scan is running.
- [ ] BLOCKED_WITH_EVIDENCE — Full data artifact has not been promoted; live NestJS holds active WAL descriptors, final D1 delta not reconciled, transaction-consistent cutover watermark unavailable, and the owner-controlled write freeze/writer switch is not approved. No source database writes, service restarts, or data promotion occurred; only local consistent snapshot/restore-test files were created.
- [ ] BLOCKED_WITH_EVIDENCE — No approved/mounted off-VPS backup destination was found (findmnt/rclone listremotes returned none); filesystem had about 5.3 GB free after the local snapshot and cannot hold another full 6.67 GB restore. Obtain a user-approved no-extra-paid destination before modifying the candidate or cutover.
- [ ] NEXT — Reuse the owner-reported historical integrity proof; prepare the exact controlled freeze/drain, current-D1 delta, additive VPS schema and rollback-forward packet. Request owner action only once the cutover packet and required write-protection scope are concrete.

- [x] COMPLETED — Current-state, runtime architecture, plan, todo and machine-readable D1/artifact evidence updated; docs-only commit `d6b6ac2012a683b334eae1750028b80135c63f42` pushed to `origin/main`. No application build/deploy, DB, service, DNS or Cloudflare mutation.


### 2026-10-17 local snapshot and startup-schema checkpoint
- [x] VERIFIED — SQLite one-step online backup captured the active staging DB at /home/mellonelay1999/nexi-migration-snapshots/nexi-active-vps-staging-20261017-onestep.sqlite (329,150,464 bytes; SHA-256 ac5aa8d23094d04bab0392185caabd237b6a953927401cacfb68cd7dc4c849ce; mode 0600). integrity_check=ok, foreign-key violations 0, page_count 80359 × page_size 4096, WAL mode, SQLite CLI 3.40.1. A temporary restore copy passed the same integrity/FK checks and zero User/Wallet/LedgerPosting counts; exact temp file removed afterward. This is local rollback evidence only, not off-VPS DR.
- [x] VERIFIED — API remained active at PID 1680547. Source file inode remained 421320. This work issued no source DB writes or service restart; normal application writes continued. No data promotion was performed. Snapshot source core counts remain empty; full historical candidate remains separate.
- [x] VERIFIED — Direct startup source requires LocalDurableJob, LocalDurableJobReplayHistory, LocalWorkflowInstance, LocalWorkflowEvent, LocalWorkflowStep, and EventInbox plus replay columns before enabling local async workers. Candidate lacks five Local* tables; the exact additive SQL already exists in backend/src/jobs/*.schema.sql. No schema was applied.
- [x] PROVEN_UNCHANGED — Historical owner-reported integrity/FK result reused. A redundant reread was stopped without a result after 17m14s / 3.19GB read; no fresh pass is claimed.
- [ ] BLOCKED_WITH_EVIDENCE — No authorized independent off-VPS backup target exists; local snapshot does not satisfy disaster recovery.
- [ ] PENDING_OWNER_ACTION — Provide/authorize a no-extra-paid off-VPS destination and an acceptable bounded financial write-protection window; final D1 delta and single-writer cutover remain separately gated.


### 2026-10-17 — current SQLite promotion frontier (supersedes prior unpromoted/empty-runtime rows)
- [x] COMPLETED — Reused and atomically promoted existing restored candidate to `/var/lib/nexi/sqlite/nexi-staging.sqlite`; existing pre-promotion DB retained at `/var/lib/nexi/sqlite/nexi-staging.pre-promotion-20261017.sqlite`. No new export or duplicate 7 GB restore.
- [x] VERIFIED — API active, Node 24.21.0, canonical file/WAL/SHM open; `/readyz` database+Redis healthy; trusted HTTPS, Public/Admin pages, API/market routes, Socket.IO polling/WSS and Certbot renewal dry-run passed.
- [x] VERIFIED — Existing final export manifest records source `nexi-core-staging`, SHA-256 `4eea2b5e3ebcd591d771cad064a005ffce4744bcf80996597fb2c23fc15d478b`, 92 schema tables, 1,754 imported rows, three deferred market tables and 0 import FK violations.
- [x] VERIFIED — Exact decimal LedgerAccount/LedgerPosting reconciliation: 14 accounts, 48 postings, zero mismatches; 46 idempotency rows have zero dangling posting references. Source authority is LedgerAccount/LedgerPosting, not the legacy Ledger table.
- [ ] PENDING — Prove whether any post-export D1 updates/deletes remain and establish a defensible final data watermark; the current import manifest does not answer this.
- [ ] PENDING — Complete authenticated application acceptance using an authorized test identity; do not fabricate financial data.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore: no authorized destination found. Existing local exports and rollback DB are not independent DR.
- [x] COMPLETED — Updated current-state/runtime/operating/task docs; removed confirmed orphan sidecars and the superseded 329,150,464-byte empty-core staging snapshot after confirming the newer rollback DB is intact. Historical/final exports, manifest and rollback DB are preserved.
- [ ] PENDING — Cloudflare resource inventory/retirement remains separate; no Cloudflare resource was deleted.
- [ ] PENDING_OWNER_ACTION — Any explicit final production financial authority declaration and destructive Cloudflare retirement remain separate from this SQLite file promotion.


### 2026-10-17 continuation frontier — current live evidence
- [x] COMPLETED — Existing scheduler enabled in backend.env; API restarted once and recovered. SQLite and local async remain active; retention is off.
- [x] VERIFIED — Post-restart public/API/Admin HTTPS, trusted certificate status, readiness and Socket.IO polling handshake; relevant systemd services active. No authenticated financial write performed.
- [x] VERIFIED — Current bounded core counts and EventOutbox status recorded in tasks/plan.md; reuse prior Ledger decimal proof. No full DB scan or export repeated.
- [ ] BLOCKED_WITH_EVIDENCE — Final D1 delta / updates / deletes / watermark not proven against promoted SQLite. Historical reconciliation is not a final-live proof.
- [ ] PENDING_OWNER_ACTION — Authorized non-production identity needed for authenticated end-to-end route acceptance; no credentials or synthetic financial state created.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup/restore lacks an authorized destination. Current local rollback/export files are not offsite DR.
- [ ] PENDING — Verify BullMQ job execution (Aiven TCP only is insufficient), provider recovery, and Sentry automatic fault capture. Market feed presently unavailable; keep it lower priority than financial/data closure.
- [ ] PENDING — Verify actual Cloudflare resource/billing inventory. Owner reports Workers/Containers retired; this is not evidence that D1/Queues/Workflows/R2/KV/DO/Analytics/Secrets were retired.
- [ ] PRESERVED — Existing modified Wrangler config and untracked Admin pnpm files remain untouched; classify before any cleanup.


### 2026-10-17 Cloudflare closure evidence (read-only account listing)
- [x] VERIFIED — Cloudflare MCP account listing: 0 Container applications; 3 account Worker scripts and none named nexi-production. This is scoped resource inventory, not proof account-level billing stopped.
- [x] VERIFIED — NEXI D1, 6 queues/DLQs (zero configured consumers), 3 workflows, 2 R2 evidence buckets, and nexi-config-staging KV still exist. Queue depth, live workflow instances and evidence object retention remain unknown.
- [ ] BLOCKED_WITH_EVIDENCE — Preserve remaining D1/queues/workflows/evidence until their contents, pending work, retention and final financial delta are reconciled. No deletion or account-wide cleanup performed.


### 2026-10-17 selected data parity checkpoint
- [x] VERIFIED — 38 selected non-market domain tables matched D1 to active SQLite by both row count and canonical content SHA-256; receipt: `tasks/evidence/d1-sqlite-selected-domain-content-check-20261017.json`. Query was read-only (D1 rows_written=0).
- [ ] BLOCKED_WITH_EVIDENCE — This bounded match is not a frozen global snapshot and does not cover every non-market table or establish a final D1 watermark. Do not describe it as whole-database equality.


### 2026-10-17 expanded D1-to-SQLite non-market reconciliation
- [x] VERIFIED — 89 common non-market tables compared, 1,754 rows on each side; 84 tables have exact row-content SHA-256 and counts. Receipt: `tasks/evidence/d1-sqlite-nonmarket-content-check-20261017.json`. No writes or export/import.
- [ ] DEFERRED — Five same-count content mismatches are market catalog/config (`MarketAsset`, `MarketAssetCapability`, `MarketPair`, `MarketProviderConfig`, `MarketProviderSymbol`); market-history tables were excluded. Revisit only after financial/domain acceptance.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted backup/restore and authorized authenticated acceptance remain unresolved. This sequential read is not a final cutover watermark.


### 2026-10-17 runtime source/storage proof
- [x] PROVEN_UNCHANGED — Deployed backend source commit has no backend path differences through code checkpoint 8570a39; current documentation commits do not require build/redeploy. Runtime entry, binary hash and Node 24.21.0 recorded in plan.
- [x] VERIFIED — Local object storage enabled at /var/lib/nexi/storage; KYC/deposit dirs 0750, DB 0600, env 0640; systemd service identity matches owner. Object-copy completeness remains separate and unproven.


### 2026-10-17 package and canonical DB identity
- [x] VERIFIED — backend `package-lock.json` declarations/lock/installed versions match for NestJS 12, Prisma 7.3, better-sqlite3, BullMQ 6, ioredis, Socket.IO 4 and Redis Streams adapter.
- [x] VERIFIED — systemd Node and Prisma CLI under service PATH are v24.21.0; native better-sqlite3 loaded on Node ABI 137 with SQLite 3.53.2. Interactive shell default Node 22 is not the API runtime.
- [x] VERIFIED — configured canonical SQLite file matches active API process open DB/WAL/SHM descriptors.
- [x] PROVEN_UNCHANGED — no package changes/reinstall/rebuild required; this evidence-only update does not change backend source.


### 2026-10-17 REST contract surface
- [x] VERIFIED — Live `/docs-json` returns OpenAPI 3.0.0 with 221 paths and expected Auth/Wallet/Transfer/Withdrawal/Convert/Spot/Margin/Binary/Mining/Loan/Admin route families.
- [ ] PENDING — Contract path presence does not replace authenticated API/business-flow acceptance.


### 2026-10-17 final runtime continuation (market + auth + async + Sentry)
- [x] FIXED — MarketQuoteLatest sequence seed now continues from indexed historical max; commit 41837777432f5926ffd2c0a0e7ae390a61284010 is built, deployed, and pushed to main.
- [x] VERIFIED — Live market projection recovered (0 active pairs with history but no latest row); no post-start uniqueness warnings; /market/prices 200.
- [x] VERIFIED — Disposable SIWE challenge/login, authenticated wallet/profile/activity reads, logout; no Ledger or EventOutbox count change.
- [x] VERIFIED — Isolated Aiven TLS/BullMQ job completed after exactly one controlled retry; temporary prefix removed.
- [x] VERIFIED — Backend Sentry release now equals deployed code SHA; release finalized/deployed, 20 backend-path commits associated, and an info event was received under the exact release.
- [ ] BLOCKED_WITH_EVIDENCE — Successful authenticated financial/Admin workflows with test balances need an authorized Admin test credential or a supported existing fixture route. No synthetic balance was written directly to SQLite.
- [ ] BLOCKED_WITH_EVIDENCE — Independent encrypted off-VPS backup and restore still lacks an authorized destination and independent key-custody location; local snapshots are not DR.
- [ ] PENDING — Authenticated Socket.IO event delivery/recovery, private-object upload/read round trip, natural backend exception attribution/source-map resolution, and deferred market catalog/config mismatch acceptance remain unproven. Reuse existing transport/market evidence; do not re-export or rerun historical reconciliation.
- [ ] PRESERVED — Existing dirty Wrangler file and untracked Admin pnpm files untouched. No cleanup or destructive Cloudflare operation performed.


### 2026-10-17 authenticated local storage and realtime
- [x] VERIFIED — SIWE test identity authenticated the deposit-proof intent/authorize/upload routes; returned 201/201/200, verified stored bytes, then removed the exact test object and empty directory.
- [x] VERIFIED — Authenticated Socket.IO WebSocket connected to /communications; snapshot acknowledged; session logged out.
- [x] VERIFIED — SQLite financial posting/idempotency/outbox/inbox counts unchanged; API readiness and four systemd services remained healthy.
- [ ] PENDING — Cross-instance Socket.IO reconnect/event replay remains unproven; no second backend instance was started.


### 2026-10-17 resumed backend market frontier

- [x] PROVEN_UNCHANGED — Five historical market catalog/config D1/SQLite content mismatches reduce to `updatedAt` differences only; counts and primary-key sets match. Sequential evidence is not a final global watermark.
- [x] VERIFIED — Public Binance BTC/ETH/ADA quotes, BTC depth/trades, and a Margin quote were current at observation. Internal Spot orderbook/trades were separately empty; no provider liquidity was presented as internal execution state.
- [ ] IN_PROGRESS — USD/RUB stale-session classification: MOEX reports `TRADINGSTATUS=N` while the live API used a stale Yahoo daily quote and reported `sessionState=OPEN`. Local adapter repair requests/handles MOEX trading status; focused Node 24 test passed 17/17. Build, deployment, and actual post-deploy runtime proof remain pending.
- [ ] IN_PROGRESS — Market reference event backpressure: queue saturation drops provider trade events; REST snapshots are available, but client sequence-gap detection and recovery/replay after pressure remain unproven. These are reference events, not durable financial postings.
- [ ] PENDING — After the coherent backend repair set is closed, perform one build/deployment and verify deployed quote/session state, market event recovery, and source/runtime identity.
- [ ] BLOCKED_WITH_EVIDENCE — Authenticated financial/Admin end-to-end acceptance still needs an authorized test balance identity or supported fixture route; independent encrypted off-VPS backup/restore still needs an authorized destination and key-custody path.
- [ ] PRESERVED — No frontend edits, API restart, deployment, Git integration, D1 write, or financial operation occurred in this slice; pre-existing Wrangler/Admin changes and migration worktree remain untouched.

Receipt: `tasks/evidence/market-provider-runtime-20261017.md`.

### 2026-10-17 market repair execution workflow update

- [x] VERIFIED — BiQuote source coverage distinguished: 36/36 catalog representations, 35/36 returned candidate quotes, 31 configured in NEXI; AXP has no BiQuote tick/history/OHLC but is returned by NEXI's Gate fallback.
- [x] TESTED — MOEX `TRADINGSTATUS` follows MOEX Currency53 codes; N/C/B closed, T/S active, unknown ignored. Focused Node 24 Jest: 18/18 passed.
- [x] RUNTIME_VERIFIED — After a logged queue-drop at 15:52:04 UTC, fresh readiness/prices/depth/trades REST reads at 15:53 UTC all passed; Binance depth was 20×20 and 50 trades spanned 15:52:48–15:53:14 UTC.
- [ ] IN_PROGRESS — Build/deploy the tested backend correction once source review is closed; validate exact deployed artifact and USD/RUB session response.
- [ ] PENDING — Continue queue/reconnect verification from snapshot read-back; exact reference event replay is not provided by current contract and is not yet proven.
- [ ] BLOCKED_WITH_EVIDENCE — Financial/Admin end-to-end writes require an authorized test-balance identity or supported fixture; encrypted off-VPS restore requires authorized destination and key custody.

Execution order and release gates are specified in `tasks/plan.md` under “Active execution workflow (reconciled 2026-10-17)”.

### 2026-10-17 MOEX release result

- [x] DEPLOYED — Commit `44d7a0a47b82b226f7895230e38e644c2951ba0a` pushed to `origin/main`; backend build exited 0. Compiled MOEX JS SHA-256: `d7acabdd9015d5a65a2dfbad4a77f4d938ac5a4d7cb3639dc6bdcf53c473e285`.
- [x] RUNTIME_VERIFIED — API readiness healthy; `/market/prices` now reports USD/RUB `UNAVAILABLE/CLOSED/MARKET_CLOSED` from MOEX. BTC remains live; depth 20×20; 50 current trades; Socket.IO delivered a valid 53-symbol snapshot with matching USD/RUB/BTC states.
- [x] PRESERVED — Only the compiled MOEX adapter JS and source map were deployed. Generated D1 Prisma client and other runtime files remain intact; rollback copies are under `/srv/nexi/backend/rollback/moex-usdrub-20261017/`.
- [ ] PENDING — Resume remaining authorized backend acceptance. Exact Socket.IO event replay/client auto-refetch remains unproven; authenticated financial/Admin workflows and independent encrypted off-VPS restore remain blocked by the documented owner dependencies.
- [!] OBSERVATION — Graceful stop reached the configured 30-second timeout once; first bounded readiness window was too short and rollback restored prior files. Second rollout with 90-second readiness window succeeded. Current service is healthy, PID 1788896, `NRestarts=0`.

### 2026-10-17 Sentry release alignment and post-restart proof

- [x] DEPLOYED — Runtime `SENTRY_RELEASE` now matches backend source SHA `44d7a0a47b82b226f7895230e38e644c2951ba0a`; Sentry release has one associated commit and a production deploy record.
- [x] SOURCE_MAP_UPLOADED — Changed MOEX adapter map uploaded with debug ID `cf0666cc-ba41-4515-afa3-5dfbcadf2ef3`; deployed JS resolves to it and `node --check` passed. This is map resolution, not event-based stack-frame mapping.
- [x] RUNTIME_VERIFIED — Service restarted to PID 1790362, `NRestarts=0`; readiness recovered with SQLite+Redis. USD/RUB remains truthfully closed; Binance quote, 20x20 depth, and current trades verified. Full evidence in `tasks/evidence/market-provider-runtime-20261017.md`.
- [x] VERIFIED — Controlled production `level=info` event `554d7ce8b68a405ea37ff993342f4b47` flushed and appeared under the exact release. It is grouped with two prior controlled checks as `NEXI-Y`; all are informational, without exception type/value. No production error-level event or matching application log was found.
- [ ] IN_PROGRESS — Adapter source-map pair/debug-ID resolves, but event-based original-file/line mapping remains unverified because the safe info event stack points to the inline evaluator. Sentry API release status remains `open` despite release timestamp/deploy record.
- [ ] BLOCKED_WITH_EVIDENCE — Authenticated financial mutations require an authorized test-balance identity or supported fixture; independent encrypted backup/restore requires approved off-VPS destination and key custody. Continue independent backend gates while blocked.

### 2026-10-17 BiQuote coverage recheck and market next action

- [x] VERIFIED — Full BiQuote symbol catalog read returned 2,061 entries and represented all 36 NEXI non-crypto assets (20 stocks, 9 FX, 7 metals), using explicit aliases for Disney, Uber, Sony and American Express.
- [x] VERIFIED — Latest quote probe returned closed/stale retained quotes for the 31 currently BiQuote-configured symbols; also returned quotes for `DISUSDT`, `UBERUSDT`, `SONYUSDT`, and `USDRUB_HKN`. American Express is listed but has no quote, tick history, or OHLC bars. Exact `USDRUB` has only historical data through 2025-06-20; NEXI's MOEX primary repair is still pending deploy.
- [x] VERIFIED — Live NEXI `/market/prices` returned Gate quotes for AXP/DIS/UBER/SONY; those symbols are not absent from the overall NEXI market response. No Biquote config, source mapping, or frontend change was made from catalog discovery alone.
- [ ] IN_PROGRESS — Finish the already-tested MOEX closed-session repair; then prove queue-pressure recovery using the actual backend REST snapshots and the reconnect/re-anchor behavior already present in the source frontend. Keep the frontend unchanged in this backend phase.
- [ ] PENDING — One coordinated build/deploy after the market repair set is closed; verify deployed USD/RUB state, reference endpoint recovery, runtime identity, then continue outstanding authenticated financial/workflow and backup gates.

Receipt: `tasks/evidence/market-provider-runtime-20261017.md`.

## Latest source frontier — 2026-10-18

- [x] Governance idempotency/approval race; Admin fallback, focused local proof
- [x] Margin close request CAS and changed-order replay
- [x] Margin late ENTRY partial fills, 23/23 tests with rollback proof (`577f5c1`)
- [ ] Margin late CLOSE settlement and repayment/liquidation recovery
- [ ] Loan 0016 migration controlled application and proof
- [ ] Authenticated financial/Admin, durable workflow recovery, off-VPS encrypted backup/restore, deployed artifact
- [ ] One coordinated release after affected source closure; no BiQuote market freshness rework
