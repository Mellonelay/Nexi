# NEXI Migration — Executable Frontier

Owner authority: current 2026-10-16 directive. See plan.md. States are claim-scoped; test PASS is not deployed/runtime/owner acceptance.

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
- [ ] G7 Name.com DNS/nameservers — PENDING_OWNER_ACTION; owner manually confirms/performs unless expressly delegated; prepare full record sheet/DNSSEC/ACME after G5.
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

- [x] INTEGRATED — Migration source patch applied to canonical `main` at recovered base `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; changes remain uncommitted. Migration worktree kept intact. Existing untracked `apps/admin/pnpm-lock.yaml` and `apps/admin/pnpm-workspace.yaml` were preserved.
- [x] VERIFIED — Canonical npm `package.json` and `package-lock.json` match deployed backend package/lock hashes. Fresh `npm ci` completed (923 packages); Node v24.21.0, npm 11.19.0. `npm ls --depth=0` exits 0, Native SQLite loads, and `npm run build` exits 0. Receipt: `tasks/evidence/canonical-main-integration-20261016.md`.
- [x] VERIFIED — Native SQLite load returned SQLite 3.53.2; `@prisma/adapter-better-sqlite3` resolved 7.3.0. Canonical built `dist/src/main.js` and active `/srv/nexi/backend/dist/src/main.js` have the same SHA-256. Existing systemd API is active and enabled; no restart was made.
- [x] REVIEWED — Fallow 3.30.0 scoped to the 24 changed backend production TS files (24 paths, tests/generated/deps/manifests excluded): no unresolved imports/cycles/boundary violations. Six unused-member candidates were checked; internal calls and test-only replay surfaces were retained. Policy detector did not run (no rule packs configured). This is static evidence, not type/runtime proof.
- [x] VERIFIED — Local Graphify refresh on canonical integrated source: 7,962 nodes / 19,141 edges. Focused extracted path recorded in `tasks/evidence/canonical-main-integration-20261016.md`; hosted graph is pre-integration.
- [x] UPDATED — Added `docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md` with component map, data flow, Cloudflare-to-VPS replacement matrix and exact remaining acceptance/owner gates. Updated backend, system architecture, cross-surface map, diagrams, docs index, Sentry operations, capability routing, root/backend instructions and current-state docs to describe VPS target while recording Cloudflare as still-live production. Relative-link/fence check passed 11 docs with zero issues.
- [ ] IN_PROGRESS — Focused docs/source consistency and relative-link checks, then main-tree staged review, commit and GitHub push; preserve unrelated user files and do not force push.
- [ ] BLOCKED_WITH_EVIDENCE — Nginx API trusted TLS; authenticated financial REST acceptance identity; end-to-end market + Socket.IO recovery acceptance; independent encrypted off-VPS backup/restore; current live D1 delta and cutover protocol remain open.
- [ ] PENDING_OWNER_ACTION — Final financial writer/traffic cutover, manual Name.com nameserver change, destructive Cloudflare resource retirement. Do not mutate production Cloudflare/DNS/writer.

Superseded historical rows remain above for provenance. Do not revive old statements that the API is inactive, Node is v22, self-hosted Valkey is the final target, Container image parity is unknown (in-container inspection is recorded above), or the main source remains isolated on a migration branch.
