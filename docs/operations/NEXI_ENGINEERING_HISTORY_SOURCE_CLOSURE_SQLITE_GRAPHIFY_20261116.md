# NEXI — Engineering history, owner decisions and source-closure restart record

**Document class:** historical reconstruction / continuity, **not** an implementation plan, runtime acceptance certificate or release authorization.
**Prepared:** 2026-11-16 UTC. **Owner directive:** documentation-only. Backend, Admin and Public services must remain inactive. No application, SQLite, Graphify or deployment mutation was authorized by this history task.
**Authority:** latest owner instructions > live VM/Git/affected AGENTS > source, recorded receipts and audit > source-matched Graphify > Knowledge v4 > exported transcript and older recollections.
**Evidence vocabulary:** VERIFIED LIVE = inspected present state; VERIFIED RECEIPT = contemporaneous persisted source/tool artifact inspected; TRANSCRIPT-REPORTED = user/assistant statement in exported conversation, without independent claim of completion; HISTORICAL CONTEXT = dated SentinelX Context capsule; DECISION = explicit current or historical owner instruction; GAP = source/evidence needed to resolve a historical fact. A claim can have more than one qualifier.

## 1. Executive checkpoint and document boundaries

**The interrupted original objective was Backend-led NEXI application SOURCE CLOSURE**, including its necessary Public Next.js mobile dApp and Admin TanStack consumers. It was **not** to rebuild an application, rerun 113 browser cases, replace the financial database, reengineer the graph, or deploy. Source-first is a sequencing rule: complete evidence-proven application source and producer-to-consumer repairs before normal application tests/typechecks/builds/browser verification, application service start, deployment, and release. On 2026-11-15 the active task board had four *broad, unchecked workstreams*, not four identified defects. One scoped Learn original-key audit replay item was checked. Do not infer that INSUFFICIENT_EVIDENCE means implementation missing. [E2 E3 E4 E5]

**SQLite diversion outcome:** Owner separately authorized offline market-retention/database maintenance. A 34,550,140,928-byte SQLite database was compacted/promoted, and final main-file size in the 2026-11-16 runbook is **4,352,483,328 bytes** following additional offline retention and incremental-vacuum. The runbook records preservation of authoritative nonmarket rows, lineage, full pre-cutover integrity and FK checks, and narrower post-cleanup checks. **This does not mean the applications were activated, deployed or fully accepted.** [E6 E7]

**Graphify diversion outcome:** Owner abandoned the previous customized native Graphify engine, restored the upstream CLI/MCP 0.9.111, removed stale graph artifacts, and later authorized semantic enrichment of the *original* NEXI graph via a pinned free OpenRouter model. The current graph observed during this recovery is 8,772 nodes, 22,093 edges, 2,331 semantic nodes, built at Git HEAD 7a5aa7f, SHA-256 29221a113f166d2be0da6fe0be16932ce777c08a91a0a693ff26e68f67181f85. Its receipt says 46 semantic document source files; do not equate this with exhaustive correctness or runtime behavior. The *separate* Knowledge v4 graph remains an engineering reference index. [E8 E9]

**Current restoration boundary:** Resume, when the owner next instructs, from tasks/todo.md and tasks/plan.md, using the latest source HEAD and a *specific proven remaining Backend cause* plus its Public/Admin consumers. Do **not** resume feature implementation from this document. [E2 E3 E4]

## 2. Source inventory and chronology methodology

### 2.1 Original conversation and previous analysis
- **Original export:** ChatGPT-ChatGPT Project Toolcalls-20261115-2017.json. Inspected in the current session container at /mnt/data/ChatGPT-ChatGPT Project Toolcalls-20261115-2017.json. Metadata: created 2026-11-14 22:10:15, last updated 2026-11-15 20:03:58 and exported 2026-11-15 20:17:17 as displayed by the exporter. **100 messages: 50 Prompt and 50 Response**, from displayed 2026-11-14 22:13:22 to 2026-11-15 19:05:09. SHA-256 **41ef892596ce7cb5cf4a13a82fc44137b63940d0f3a9e0e3655149ba2aea4e29**. It begins after much earlier NEXI engineering. It contains assertions of earlier exported 103 messages, but that earlier raw transcript is **not** contained verbatim in these 100 messages; its recovery is represented by the earlier assistant digest and independently checked VM/source/Context records. [E1]
- **Subsequent current conversation:** owner corrections after the exported endpoint include SQLite official-document/physical recovery, Graphify cleanup and upstream restoration, free OpenRouter routing/semantic enrichment, and the present documentation-only directive. It is a separate chronological stream; do not assign exporter timestamps to these later turns. [E12]
- **Prior analysis:** the earlier response in export index 3 discusses recovered timeline; index 7 challenges native Graphify architecture; SentinelX source context sxc_9R5F4DM9 rev54 and sxc_7BTSSAAZ rev78 preserve independent earlier work. Reuse these instead of redigesting original full history. The source archive tasks/evidence/archive/source-board-before-20261115/ preserves pre-compaction task-board versions. [E1 E4 E10]
- **Timestamp normalization:** VM audit, Git author times and receipts are ISO UTC. Exported prompt times have no explicit numeric timezone offset; they are shown below as **export display time**, and are *not* assumed exact UTC. For orientation only, Asia/Yangon is UTC+06:30; conversion would be additive/subtractive only if the exporter used that locale. When chronology crosses streams, prefer Git/audit UTC evidence over this uncertain mapping.
- **SentinelX recent audit:** /var/lib/sentinelx/audit.jsonl was parsed line-by-line without changing it. At the 2026-11-16 07:16Z inspection it contained 5,008 JSONL records (no malformed lines), including 1,188 timestamped records within the previous 30 hours (window starting approximately 2026-11-15 01:16Z). Counts: exec 661, script_run 344, read 62, capabilities 43, edit 32, others. These are *tool invocations*, NOT 1,188 successful engineering changes. Individual line numbers below identify primary VM audit evidence. [E11]
- **SentinelX Context:** 18 saved contexts were listed. Particularly important: sxc_9R5F4DM9 rev54, sxc_7BTSSAAZ rev78, sxc_7T0HYMDV rev1, sxc_KRG9QF9T rev7, sxc_JBPAAEC2 rev5, plus the older acceptance/source-phase contexts. No saved context was created, reset or overwritten for this historical task. Context describes prior claims and must be reconciled with current source. [E10]
- **No new Graphify graph build:** Graph Mode used as a *documentation dependency graph*, not as an instruction to run Graphify extract or modify the source graph. The code graph is a static historical locator; its version and provenance must be captured rather than recreated for this task.

### 2.2 Evidence graph / dependencies
Owner source-first authority → earlier Backend and cross-surface corrections → source snapshot and proof register → **market SQLite storage interruption** → owner-controlled offline recovery → **Graphify capacity cleanup and changed engine decision** → upstream source-graph restoration → free-provider semantic enrichment → **current history consolidation** → [STOP] → next owner-controlled Backend source slice.

Two distinct branch points matter:
1. SQLITE: market quote-retention failure caused physical storage pressure; maintaining the main database was explicitly authorized as a narrow exception to ordinary source-first sequencing. The SQLite operation did not authorize release.
2. GRAPHIFY: removal of the installed customized Graphify implementation during storage reclamation did not remove the NEXI application source. The owner subsequently chose an upstream-only standard Graphify graph and ordered historical custom graphs removed. That choice supersedes earlier native Python/HTTP/Prisma customization aspirations.

This is the smallest Graph Mode fan-out/join model: export + context; audit + SQLite; Git + source/task docs; Graphify receipt + Knowledge → one chronological join → review and publish this document. All branches were read-only.

## 3. Chronological engineering history

| UTC date / export display time | Owner decision / actual event | Execution and proof classification | Impact / next frontier |
|---|---|---|---|
| 2026-10 to early Nov (historical Context/receipts) | Build NEXI trading platform with NestJS/Prisma7 SQLite, Ledger/Outbox, BullMQ/Aiven Valkey, Socket.IO, Next.js Public, TanStack Admin and Ethereum chain-1 SIWE; Cloudflare Worker/D1 retirement. | HISTORICAL CONTEXT; dated acceptance and source receipts, not current deployed verification. | Durable financial single writer, idempotency, statuses and mobile dApp become owner contracts. [E4 E5 E10] |
| 2026-11-01 to 2026-11-08 | Owner used browser/transaction acceptance to identify contradictions and explicitly demanded real Admin/Public flows; previous sessions eventually hit limits. | Historic acceptance baseline: **113** cases = 16 PASS, 24 FAIL, 8 BLOCKED, 65 NOT_TESTED in Nov8 tracker. Not equivalent to 113 missing source implementations. Earlier dated regression receipts belong to their own source SHA. | Preserve historical failures as requirement leads, not an automatic 113-item reimplementation queue. [E5 E10] |
| 2026-11-09 to 2026-11-13 | Owner strengthened **source-first**; actual Backend/Public/Admin source-contract repair before app checks and release. Graphify L0/L1 and Knowledge v4 only for locating source ownership. | HISTORICAL CONTEXT from sxc_9R5F4DM9: Communications announcements/Learn, notifications and moderation, auth MFA, immutable audit intents, maintenance and Admin Spot pair contracts; Binary, Margin, Mining and Loans source corrections. | Significant implemented slices already existed; subsequent work must reuse them. [E4 E10] |
| 2026-11-13 22:28:32Z | Cross-surface checkpoint committed as a7782d1. | VERIFIED GIT: 64-file source/evidence commit; SentinelX Context describes bounded source predicates and source-first no-app-test rule; owner-directed push had independent remote confirmation then. | Do not revisit that batch absent changed source/evidence. [E4 E13] |
| 2026-11-14 00:55Z–04:18Z | Source changes for Public mobile wallet/browser and short-height responsive trading/chart controls. | VERIFIED GIT commits 5542aab, 69a3521, 9093929, cf57c80, 3b35d1d and 00be8e9. | UX integration must be source-checked against latest frontend, not assumed broken or perfect from historical acceptance. [E13] |
| 2026-11-14 18:13Z–20:41Z | Improve *custom native* Graphify 0.9.108 Python engine: typed relationships, Prisma/framework extraction, multi-surface merge, CSS, HTTP directed evidence and impact traversal. | VERIFIED GIT commits 180c6fa, 038fbfb, 2a216c3, f9a02cb, 443cadb, 1fd344d, 700d54d, ec59228, f390fc0, 8be654e, 5c5ab3f, 75c250f, 0c2ce55. Isolated checks were reported; **full source coverage not established**. | This customized architecture is historical because owner later rejected it in favor of upstream. [E10 E13] |
| Export Nov14 22:13–22:56 display time | Owner requested inventory of normal ChatGPT Project tools and complete earlier history; challenged abbreviated recovery and required Graph Mode. | TRANSCRIPT: indices 0–7. The assistant's index 3 digest reconstructed old source frontier but acknowledged missing full original transcript. | Established continuity expectations; no license to fabricate original 103 messages. [E1] |
| Export Nov14 23:26–Nov15 03:27 display time | Owner escalated Graphify to full native engine mapping, compiler and HTTP/Prisma/Socket.IO/BullMQ integration, then at index 38 **stopped further native customization** and requested clean standard version/stale-graph cleanup. | TRANSCRIPT indices 8–39. Several native fixes were implemented/committed, but **all-contract completeness remained unproven**. Later owner decision superseded the native-engine project. | Graphify serves source closure; graph development is not itself the NEXI application end goal. [E1 E10 E13] |
| Export Nov15 11:15–13:39 display time | Owner redirected to original source-first engineering; rejected expanding the backlog based on uncertain 113/301 counts; required stale board cleanup and actual current source evidence. | TRANSCRIPT indices 40–71; VERIFIED GIT 5b3edd9, 686337e, 70d3f1e, 32a444e, b9570bb, 97125c9, 6c62272, e9efff5. The active four-workstream board was created. | Exact source-closure frontier frozen before SQLite diversion: see section 4. [E1 E2 E3 E13] |
| 2026-11-15 05:44Z | Learn create/update original-key replay audit receipt implemented. | VERIFIED GIT 5b3edd9 and source matrix. Backend Communications returns deterministic auditId for first write and consistent replay, Admin provider consumes it. Source-only receipt; app runtime not revalidated for this patch. | Narrow Learn contract checked, not entire Communications platform release. [E2 E4 E13] |
| 2026-11-15 06:30Z–07:03Z | Admin audit response contracts and help/messages ownership, proof-reuse register updated. | VERIFIED GIT b9570bb, 97125c9, 6c62272, e9efff5. | Actual persisted audit IDs must not be substituted with resource IDs; already repaired source is to be reused. [E2 E5 E13] |
| Export Nov15 13:58 display time | Owner deliberately changed subject: **Recover Market Database Retention Decision & Verify Current SQLite State**. | DECISION transcript index 72: protect 72h snapshots and MarketQuoteLatest lineage; determine why SQLite grew; use official docs and measured storage. | This is the precise diversion from the unfinished source closure. [E1] |
| Export Nov15 15:15–17:47 display time | Owner explicitly authorized SQLite raw-snapshot cleanup, accelerated execution, then requested a stop/reconciliation and formal maintenance runbook. | DECISION indices 78, 84, 86, 88. Initial 7,000 deleted snapshot rows were reported in index 93; later ledger superseded this cumulative count. | Original raw DB file did NOT shrink; low disk and slow random IO blocked naive deletion/VACUUM. [E1 E6] |
| 2026-11-15 11:39:54Z | SQLite operational runbook and VPS service guidance committed. | VERIFIED GIT 3adf29f. | Runbook distinguished logical DELETE, freelist, WAL and physical shrink, native CLI 3.40.1 vs SQLite versions, and backup/capacity requirements. [E6 E13] |
| Export Nov15 17:46 display time | Owner specifically said no backup was required for expired market quotes due to storage constraints. | DECISION index 92. Narrow permission for deletion of eligible market historical data, not consent to destroy financial Ledger or candle history. | Continue offline, respect lineage and integrity boundaries. [E1] |
| Export Nov15 18:55–19:05 display time | Owner rejected prior running service/scheduler-first approach, required direct offline SQLite maintenance and full official SQLite study. | DECISION indices 94, 96, 98. Assistant index 99 was documentation/research progress, *not* proof of recovery. | Services stopped; official SQLite dbstat, B-tree, VACUUM, CLI and recovery mechanisms investigated. [E1 E6] |
| 2026-11-15 daytime/early evening UTC | Original 34.55-GB DB showed auto_vacuum=NONE, 4-KiB pages, 8,435,093 pages, tiny freelist, and root filesystem ~1.6 GB free. Indexed deletes were very slow; COUNT and some scans timed out. | VERIFIED RUNBOOK + audit: 9,000 committed deleted rows in one phase, another 1,000 offline; after first 9k main file unchanged, freelist 1,161 pages; later freelist 1,295. Cumulative counts refer to different phases and should not be conflated. | Native DBSTAT and Python read-only B-tree page sampling showed **32,258,756,608 bytes / 93.3679%** in MarketQuoteSnapshot family and **2,282,135,552 / 6.6053%** in MarketKline family. [E6 E11] |
| 2026-11-15 19–20Z | Capacity reclamation: Graphify 0.9.108 uninstalled and its MCP processes stopped; swapfile and unused virtualenv/APT/journals cleaned. | VERIFIED RUNBOOK: 1,772,474,368 + 4,294,946,816 + 847,904,768 = **6,915,325,952 bytes** measured released. At 20:06Z root free was ~8.50 GB. It was intentional capacity cleanup; **not proof that SQLite shrank**. | Graphify removal became a later independent restoration problem. The 4-GB swapfile remains intentionally disabled; memory tradeoff noted. [E6 E11] |
| 2026-11-15 21:51:10Z | Bounded retention source fixes and 20GB standard committed. | VERIFIED GIT commit **7a5aa7f2c3a3c46768b3b56bc53b1cc50e02ad76**, six changed files: MarketAuthorityService, quote-retention scheduler and related specs, SQLite/VPS runbooks. Source state does **not** prove runtime enablement. | Current live Git HEAD in this recovery. [E6 E13] |
| 2026-11-15 late UTC into 2026-11-16 early UTC | Owner-authorized compact database constructed, validated and atomically promoted using renameat2(RENAME_EXCHANGE); initial exchange verification issues were diagnosed, not ignored. | VERIFIED RUNBOOK + on-VM recovery receipt. Original 34,550,140,928 bytes → compact promoted 4,398,145,536 bytes; final after offline retention/incremental vacuum **4,352,483,328 bytes**. Pre-cutover full integrity_check ok and foreign_key_check none, schema count 105 tables/310 indexes/3 triggers, 102 authoritative nonmarket tables hash+count equal, 53 latest pairs, 3,663,056 preserved Klines. | Significant physical storage recovery achieved without restarting apps. No live ingestion or application acceptance performed. [E6 E7 E11] |
| 2026-11-16 offline post-promotion | Additional expired raw quote cleanup and vacuum; retention configuration repaired but applications remained stopped. | VERIFIED RUNBOOK: 5,000 measured deletes plus 83,201 additional confirmed deletes; main file ~4.352GB, freelist zero after incremental vacuum; foreign_key_check MarketQuoteSnapshot no violations; quick_check MarketQuoteSnapshot ok. The runbook records two focused source regression suites totaling 20 PASS at their date; these are **not** production/browser acceptance. | NEXI_SCHEDULER_ENABLED=true, NEXI_MARKET_QUOTE_RETENTION_ENABLED=true, catch-up unset/disabled; future runtime still unverified. **No Kline pruning authorized**. [E6 E7] |
| 2026-11-15/16 after database stabilization | Owner decided to abandon NEXI-customized Graphify and restore current upstream Graphify CLI/MCPC, remove old graph archives, and build fresh current-repo graph. | VERIFIED RECEIPT: upstream **0.9.111** code-only extraction, 6,441 nodes / 19,384 edges / 230 communities at HEAD 7a5aa7f; old source graph directories removed, separate Knowledge v4 preserved. | Historical custom Graphify Git paths are now deleted or staged deleted in working tree; do not reintroduce them based on old docs. [E8 E9 E13] |
| 2026-11-16 source graph semantic decision | Owner clarified Graphify 'knowledge graph' means **code + docs + semantic relationships in the original source graph**. Required OpenRouter free inference, not paid OpenAI API. | VERIFIED RECEIPT: existing environment key identified as OpenRouter credential; default OpenAI direct auth failed; compatible endpoint and free model trial succeeded. Random model openrouter/free caused truncated responses. Pinned free variant nvidia/nemotron-3.5-super-vl:free, bounded extraction/output settings, candidate validation and promotion. No key displayed in history. | Semantic source graph and reference Knowledge graph are separate responsibilities. [E8 E9 E12] |
| 2026-11-16 05:57:03Z | Combined semantic source graph became current original-path graph. | VERIFIED LIVE + JSON receipt: 8,772 nodes, 22,093 edges, 2,331 semantic nodes, 46 semantic document files, 679 code source files; 6,441 old nodes and 19,384 old edges retained, with stated post-cluster reconciliation (1 node, 41 edges). No dangling edges. Candidate extraction log had 8,860 nodes/22,284 edges before reconciliation. | This is static mapping, not code truth. Provenance/coverage limits and staging-to-promoted differences must not be silently discarded. [E8 E9] |
| 2026-11-16 knowledge refresh | Owner required the existing engineering knowledge library to be understandable and to include NestJS reference and **Next.js React mobile wallet-browser dApp standard**. | VERIFIED previous SentinelX tool receipts: copied owner Nestjs-llms.txt byte-identically into v4.0/20_FRAMEWORKS, added Web3 mobile browser standard in v4.0/10_PUBLIC_UI, updated routing, rebuilt separate reference graph. Latest observed reference index build after free-model update had 1,977 nodes and 4,166 edges. | Canonical library root v4.0, generated active MCP graph graphify-out; old semantic/ path is not canonical reference authority. [E9 E12] |
| 2026-11-16 present directive | Stop engineering; document the complete timeline, resume-point and owner decisions. | **THIS DOCUMENT ONLY**, no SQLite, app services, Graphify source/config, application code or new graph build. | Await explicit separate instruction before resuming Backend source closure. [E12] |

### 3.1 Source-closure implementation batches to reuse

**Communication/notifications:** announcement and Learn create/update/publish, immutable original idempotency intent, moderated messaging, user/Admin notifications, Learn original-key auditId replay and readback. The present task does not reprove every route or staged network behavior. [E4 E5]

**Financial and market:** source repairs documented across Ledger/Outbox idempotency; Admin audit original-key and real audit receipt; Admin system and feature flags; market network/provider status; maintenance schedule/cancel and Spot pair maintenance; Spot cancellation reason replay. Backend financial writer remains NestJS/Prisma7 SQLite, not Cloudflare/D1 runtime. [E4 E5]

**Trading/loans/mining:** Binary delayed-settlement event and audit replay consistency; Margin close CLOSING replay semantics; Mining immutable plan snapshot, CAS on subscribe and per-subscription scheduler failure isolation; Loan Admin plan exact decimal transport and min/max validation; Admin/Public integration. Historical source predicates passed for scoped changes, overall terminal settlement/economic equivalence not certified. [E4 E5]

**Public and Admin consumers:** mobile wallet/browser and chart geometry source commits, Admin audit + currency/network/deposit-address receipt projection, Help/Messages ownership. These are prior source changes; current UI behavior is not accepted by inference. [E4 E5 E13]

**Prior tests note:** some dated test and typecheck receipts existed before the later strict source-first campaign, and the SQLite special maintenance reported 20 focused source tests. Do not claim zero historical tests; the strict policy is **do not run new application verification prematurely**. Older tests do not certify the current HEAD or deployed services. [E5 E6]

## 4. Exact source-closure checkpoint and what is unfinished

### 4.1 The original source checkpoint at diversion

The Nov15 active documents tasks/todo.md, tasks/plan.md, NEXI_CURRENT_STATE.md and NEXI_PROOF_REUSE_REGISTER.md refer to **5b3edd9** (Learn auditId replay) as their last focused application source checkpoint, with further Admin/source/docs commits recorded. Those documents contain dated Graphify hashes and an old 1.7-GiB disk report; those exact values are **historical** after SQLite storage recovery, engine replacement and HEAD 7a5aa7f. [E2 E3 E4 E5 E13]

The active board has:
1. Backend NestJS/SQLite Ledger/Outbox authoritative status, auth/idempotency, audit and cross-surface integrations — only evidence-proven gaps.
2. Public Next.js mobile-first dApp source against actual frontend/DESIGN.md and owner Web3 browser standards.
3. Reconcile each current domain/consumer source: SOURCE_IMPLEMENTED, PROVEN_SOURCE_GAP or INSUFFICIENT_EVIDENCE; do not equate missing Graphify edge with a missing feature.
4. Final source-only closure disposition and later separately authorized application verification/release.

**Crucial numbers:** Earlier 113-item November browser evidence = 16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED. The Nov13 113-row source-evidence mapping = **5 SOURCE_IMPLEMENTED and 108 INSUFFICIENT_EVIDENCE**, which is *proof coverage*, not 108 absent features. A 301-operation graph reconciliation and 68 source-graph semantic claims are separate inventories. The owner explicitly rejected treating any of them as an automatic work backlog. [E1 E2 E3 E5]

### 4.2 First future Backend source-closure action — owner-controlled

**Do not start it now.** Upon the next authorized engineering turn:
- Re-read only current tasks/todo.md, tasks/plan.md, the relevant row(s) in tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md, current affected AGENTS files and source revision. Determine writer/dirty path ownership and whether historical source proof remains valid.
- Select **one causal Backend contract** whose direct present source demonstrably contradicts the accepted behavior and whose producer→consumer chain can be traced; source-first priority among remaining groups is financial settlement/status, original-key replay/audit, auth wallet recovery, or critical market state. Do not assume a specific bug merely from the prior FAIL list.
- Use @nexi-knowledge for relevant file:line constraints, then existing @nexi-graphify-live L0 exact owner / L1 dependents, then read current Backend guards, DTO, SQLite writer, EventOutbox/Inbox, Public and Admin consumer source. Graphify’s 46-document semantic enrichment is a **locator**, not implementation or runtime proof.
- Apply the smallest complete source patch if and only if a **PROVEN_SOURCE_GAP** exists, record exact source evidence/provenance and all required consumers. If no gap, classify SOURCE_IMPLEMENTED or INSUFFICIENT_EVIDENCE without inventing work.
- No application lint/typecheck/tests/build/browser/services/deploy unless owner later lifts the source-first phase. No economic/network withdrawal activation or new SQLite maintenance without a separate scope.
- Update existing matrix; not a new parallel matrix or speculative graph architecture project. One source writer by default, up to three independent read lanes when ownership/capacity warrants.

**Precise frontier in one sentence:** **Resume the still-unclosed Backend financial/contract source integration campaign immediately after the Nov15 Learn original-key audit-replay and Admin audit receipt source commits, using the four remaining broad workstreams and the current 7a5aa7f worktree; identify the next *proven* Backend cause from live source before editing.** The materials do not establish a single already approved next offending function, so claiming one would fabricate a defect. [E2 E3 E4]

### 4.3 Application and data state not proven by this history

- Full Backend/Public/Admin source closure: **OPEN**; prior scoped changes were completed, but later source changes and current integrated proof have not closed the whole app.
- External withdrawals: documented DETERMINISTIC_TEST_NON_LIVE; owner authorization needed for external execution.
- Backend deployed financial semantics: **UNKNOWN / DEFERRED**; no services were restarted for SQLite recovery.
- Post-2026-11-16 SQLite full-database integrity check after final 83,201 deletes: **NOT ESTABLISHED** by final narrow checks; full pre-cutover integrity check and narrower final checks are documented. No new full scan authorized here.
- Actual periodic quote-retention runtime performance: **UNKNOWN** until an owner-authorized activation/verification phase despite current true retention flag and bounded scheduler source.
- Physical off-host disaster-recovery copy: **not established**. Atomic compacted promotion is not itself an independently recoverable backup.
- MarketKline long-term retention boundedness: **OPEN POLICY**, no candle-pruning authorization. 240 historical 8h rows remain; live supported chart intervals remain seven.
- Current Graphify graph semantic correctness/completeness: static candidate promotion receipt exists, but no claim that all HTTP/Prisma/Socket.IO relationships were recovered perfectly. Some semantic cache inputs were out of scope; .graphifyignore skips selected historical or sensitive paths. Keep explicit EXTRACTED vs INFERRED provenance.

## 5. SQLite engineering detail and decision accounting

**Why SQLite maintenance began:** raw MarketQuoteSnapshot retention source was designed for 72h with MarketQuoteLatest pair/sequence protection, but effective /etc/nexi/backend.env initially had NEXI_MARKET_QUOTE_RETENTION_ENABLED=false while scheduler main switch was true. Data grew from August through November, reaching a 34.55-GB main file. A naïve COUNT and batch DELETE on highly fragmented B-tree indexes caused I/O and long stalls; root filesystem lacked room for standard VACUUM. [E6]

**Investigations and rejected/failed routes:** read-only dbstat and Python page interior traversal, attempted large indexed COUNT timeouts, slow 1k deletes, in-place VACUUM infeasible with 1.6-GB free, isolated scheduler deployment/restart rejected by owner, direct SQLite 3.40.1 CLI initially used then separate SQLite 3.54.1 official archive study. SQLite CLI dot-command syntax, native file format, PRAGMA page/freelist, WAL/journals, safe deletion, checkpoint and VACUUM semantics were reconciled into the maintained runbook. Owner-supplied sqlite-doc-3540100.zip passed ZIP integrity (1,048 entries, 847 HTML docs), with studied RBU/VACUUM strategies; RBU is documented candidate technology, not proof it was deployed. [E1 E6 E14]

**Recovery control points:** source lineage protection → offline exclusive writer → root capacity gain by targeted cleanup → compact candidate on bounded storage → schema/data/integrity proof → atomic exchange → final 72h retention cleanup and incremental vacuum. The earlier no-backup owner decision was specific to market-quote history under acute capacity pressure. The runbook explicitly requires off-host backup before production cutovers; this history makes no new backup. [E6 E7]

**Final measured SQLite result:** 34,550,140,928 → 4,352,483,328 main bytes. 53 latest-quote pairs and 3,663,056 MarketKline rows retained. Snapshot+5 indexes final B-tree allocation 2,121,777,152 bytes; Kline+5 indexes 2,221,518,848 bytes; remainder 9,187,328. 20-GB main+WAL advisory with thresholds 12/15/18 GB does not reject financial writes. Retention True, catch-up disabled; no app service activation. [E6 E7]

**Outcome distinctions:** logical deletion completed only in reported scopes; reclaimable freelist distinct from physical file shrink; physical shrink completed on compact promotion and incremental vacuum; entire historical data policy and future runtime growth still require monitoring/owner decisions. [E6]

## 6. Graphify, OpenRouter and engineering-knowledge history

### 6.1 Engine choices (supersession register)
- Custom Graphify 0.9.108 native code project (typed collision, CSS, Prisma, HTTP compiler and multi-surface graph) was **implemented in part and committed**; never proven complete across NEXI.
- 2026-11-15 storage intervention uninstalled the custom tool and stopped old MCP connections. The graph software removal was a deliberate space-reclamation action; it was not a backend repository implementation repair.
- Owner then **explicitly superseded** custom engine continuation: restore standard updated upstream Graphify; remove obsolete source graphs; no Graphify Cloud platform trace as substitute for live source.
- Standard 0.9.111 successfully extracted a clean code-only graph (6,441 nodes/19,384 edges, 230 communities) at HEAD 7a5aa7f. Separate Knowledge v4 reference graph remained intact.
- Owner later **explicitly upgraded** the original graph's target to **combined code + document semantic**, not a permanently separate competing graph. Current receipt: 8,772/22,093. Do not imply the earlier 6,441/19,384 figure is still the entire graph; it is its code-only baseline. [E8 E9]

### 6.2 OpenRouter decisions and evidence
- Protected owner-user environment.d had an existing OPENAI_API_KEY-named variable containing an OpenRouter-format key. The direct OpenAI endpoint returned 401; OpenRouter-compatible https://openrouter.ai/api/v1 worked. Do not copy secret content into documents.
- Random openrouter/free routing initially produced output truncation and slow recursive retries; explicit user corrected account free-tier assumption and supplied official routing guidance.
- Selected pinned free model nvidia/nemotron-3.5-super-vl:free, OpenAI-compatible API protocol (Graphify backend openai does NOT imply paid OpenAI), bounded document chunking, controlled model output and adaptive splits; no paid-model fallback. The app-attribution headers are optional and were not required for successful local extraction; chain-of-thought reasoning_details is a multi-turn chat preservation mechanism, not a JSON extraction requirement.
- Current semantic rebuild receipt lists 2,331 semantic nodes from 46 doc source files; extract candidate before post-cluster reconciliation was 8,860 nodes/22,284 edges, compared to current active graph 8,772/22,093. Preserve both figures and the reconciliation receipt. Local Graphify's dollar estimate is not proof of an OpenRouter invoice. [E8 E9 E12]

### 6.3 Two graphs and directories — do not confuse
| Responsibility | Active path and role |
|---|---|
| NEXI source + semantic graph | /home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json — @nexi-graphify-live; exact current source file/typed links, static only |
| Engineering Knowledge v4 documents | /srv/nexi/engineering-knowledge/20261110/v4.0/ — canonical reference documents |
| Engineering Knowledge v4 active generated graph | /srv/nexi/engineering-knowledge/20261110/graphify-out/graph.json — @nexi-knowledge; subordinate engineering references |
| Knowledge directory orientation | /srv/nexi/engineering-knowledge/20261110/README_CURRENT.md, 00_START_HERE.md under v4.0 |
| Owner-supplied NestJS docs copy | v4.0/20_FRAMEWORKS/03_NESTJS_LLM_REFERENCE_20261116.txt |
| Public mobile Web3 dApp standard | v4.0/10_PUBLIC_UI/06_NEXTJS_WEB3_DAPP_MOBILE_BROWSER_STANDARD_20261116.md |
| Graphify runbook | docs/operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md |

Knowledge v4's semantic/ older experiment is not the active MCP index. Owner requires Next.js React dApp inside wallet browsers first (EIP-1193, EIP-6963, SIWE EIP-4361 chain 1, fallback/deeplinks, mobile safe areas/reconnect). Generic finance UI inspirations are secondary. This is documentation of desired contracts, not a claim that every browser workflow was tested. [E9 E12]

## 7. Owner decision and supersession register

| ID | Explicit decision | Supersedes / must not be misconstrued as |
|---|---|---|
| D01 | Source code and cross-surface contracts first, before NEXI app verification/release. | Older browser-first and general autonomous build/test instructions. |
| D02 | Use existing repairs and exact source evidence; 113 acceptance and 301 HTTP counts are *not* an automatic repair backlog. | Stale task-board OPEN/FAIL counts treated as missing implementations. |
| D03 | One authoritative NestJS/Prisma SQLite Ledger writer; SIWE chain 1; no fabricated funds or external withdrawal execution without separate approval. | Retired Cloudflare/D1 economic state and speculative alternate writers. |
| D04 | Nov15 direct offline SQLite market quote maintenance authorized; preserve latest price lineage and all MarketKline data. | Initial app source-first phase only for this narrow maintenance; did not authorize an app deployment or broad DB truncation. |
| D05 | During scarce disk, omit new backup for eligible expired quote deletion. | Did not certify off-host recoverability or authorize deletion of financial/account records. |
| D06 | Keep application services stopped during SQLite repair and after; no ingestion/service activation. | Initial assistant approach that stopped/started API during first 7k deletes; corrected by later owner. |
| D07 | Reclaim graph/swap/obsolete cache capacity to enable SQLite recovery, then abandon native custom Graphify in favor of updated upstream. | Earlier goal to keep adding NEXI-specific Python engine patches. |
| D08 | Use the original source Graphify graph as combined code + semantic target; keep @nexi-knowledge a separate reference graph. | Permanent parallel code-only versus semantic source graphs or merging reference corpus into source truth. |
| D09 | OpenRouter free only, with fixed free model if that makes structured extraction reliable; no paid fallback. | Using OpenAI's paid endpoint or inferring a free-tier limit without account evidence. |
| D10 | NEXI Public is Next.js React mobile Web3 **wallet-browser dApp**; actual source/framework authority first. | Generic bank dashboard or React Native-first design assumptions. |
| D11 | **Current directive: history/documentation only; then stop.** | Any queued app source implementation, SQLite maintenance, Graphify configuration update, graph rebuild, or service start. |

**Unapproved proposals not elevated to decisions:** indefinite graph-native feature expansion; arbitrary mandatory Cloud Graphify indexing; new financial writers; blanket reimplementation of 113 cases; normal app-test/restart phase before source closure; destructive Kline TTL; periodic auto-execution agent without authorization; paid model fallback; new direct global credential export. Explicit decisions above prevail. [E1 E2 E3 E6 E8 E12]

## 8. Current Git, sources, services and evidence limitations

### 8.1 Verified live repo identity
- Repository: /home/mellonelay1999/workspaces/Nexi, main, HEAD **7a5aa7f2c3a3c46768b3b56bc53b1cc50e02ad76**, committed 2026-11-15 21:51:10Z.
- Source checkpoint includes a7782d1, 00be8e9, 5b3edd9, audit updates and 7a5aa7f. No new commit is created by this history document.
- **Dirty working tree exists.** Observed modified .graphifyignore and AGENTS.md, deleted old Graphify native engine/docs/evidence paths, many pre-existing .bak files and untracked operations runbook. These were **not** cleaned or recreated by this task. Future source writer must preserve them and consult current owner instruction and Git status, not infer that HEAD includes every uncommitted file.
- The compacted older active board contains stale checkpoint/hash/low-disk facts written before current 7a5aa7f and upstream 0.9.111. Do not edit it under the present documentation-only instruction. Use live state where facts changed.
- Root AGENTS.md now points to v3.5 Kernel; v3.4 is retained for historical context. The active Kernel/graph location must be checked on the next owner-authorized source task.

### 8.2 Evidence limitations that remain genuine
1. The earlier underlying **103-message original engineering export** mentioned by the 100-message 2026-11-15 export is not available as a separate complete raw transcript in this recovered input. The prior assistant's history analysis and Context/VM receipts mitigate but do not provide verbatim coverage; no invented quotes or timestamps from those missing messages.
2. Export-local times lack explicit offset. Cross-stream join only when Git/audit corroborates; exact offset is an assumption.
3. SentinelX audit confirms actions and return codes but payload matching alone does not establish semantic success; use recovery receipts, commits and current source for causal claims. The recent ~30h audit was reviewed using bounded, secret-safe grouped extraction, not quoted wholesale.
4. Git HEAD, tracked changes, and untracked files have changed since the active board's 5b3edd9 checkpoint. Prior source proof is revision-scoped; renewed full-source closure is not yet certified.
5. No current runtime acceptance, deployment version, withdrawal external execution or complete post-cleanup database-wide integrity scan has been established.
6. Graphify semantic node coverage and code source-file counts are static extraction figures, not proof all contracts exist or all missing edges indicate gaps.
7. The actual next *specific Backend defect* was not selected at the SQLite diversion. Do not invent a function-level start point or recode a previously implemented change.
8. Detailed historical statements before 2026-11-13 rely partly on older summary/Context rather than independently replayed all original ChatGPT turns. Recheck only if later ownership/source conflict demands it.

## 9. Evidence register — exact sources and durable pointers

[E1] Exported conversation, ChatGPT-ChatGPT Project Toolcalls-20261115-2017.json, 100 messages / 50 prompt-response pairs, SHA-256 41ef892596ce7cb5cf4a13a82fc44137b63940d0f3a9e0e3655149ba2aea4e29; exporter displayed 2026-11-14 22:13 through 2026-11-15 19:05. Local session asset /mnt/data; exporter canonical conversation URL recorded in JSON metadata. Exact message indices used in sections 3/7.

[E2] Repo tasks/todo.md; tracked active Nov15 source-first board with scoped Learn item checked, four broad unchecked workstreams, 113-row source proof distinctions and withdrawal nonlive constraint.

[E3] Repo tasks/plan.md; exact current source frontier, source-only mode, one coordinated writer and later verification gate.

[E4] SentinelX saved context sentinelx_context_sxc_9R5F4DM9 rev54; former full source campaign, a7782d1 source checkpoint, details of Binary/Margin/Mining/Loan/Admin repairs. Context may be stale.

[E5] Repo NEXI_CURRENT_STATE.md, NEXI_PROOF_REUSE_REGISTER.md, tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md, tasks/evidence/archive/source-board-before-20261115/, acceptance tracker tasks/evidence/nexi-browser-acceptance-113-continuation-20261105.csv. Source and historical verification are distinct.

[E6] Repo docs/operations/NEXI_SQLITE_DATABASE_RUNBOOK.md, especially sections 15–16 and the later 2026-11-16 appendices; docs/operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md; commit 3adf29f and 7a5aa7f. These are contemporaneous operational receipts, not active monitoring.

[E7] /var/lib/nexi/sqlite/.nexi-sqlite-recovery-20261116.json (confirmed present, 865 bytes); /var/lib/nexi/sqlite/.nexi-sqlite-20261116-retention-offline.json (confirmed present, 2,777 bytes). These files were not modified.

[E8] Repo graphify-out/NEXI_UPSTREAM_REBUILD_RECEIPT_20261116.json and graphify-out/NEXI_SEMANTIC_REBUILD_RECEIPT_20261116.json; latest active graph observed 2026-11-16 at 8,772 nodes/22,093 edges and source Git 7a5aa7f. The JSON receipt cites 0 dangling edges and pinned free model, and distinguishes pre-cluster candidate.

[E9] Repo docs/operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md; /srv/nexi/engineering-knowledge/20261110/README_CURRENT.md and v4.0/ references; @nexi-graphify-live and @nexi-knowledge are distinct local MCP sessions.

[E10] SentinelX contexts sxc_7BTSSAAZ rev78 (v3.4 Kernel runbook full read), sxc_7T0HYMDV rev1 (custom native Graphify work), sxc_KRG9QF9T rev7 (Public mobile), sxc_JBPAAEC2 rev5 (SIWE chain), sxc_JM4DMNEB rev16 (five-batch source history); context listing and retrieval performed 2026-11-16.

[E11] /var/lib/sentinelx/audit.jsonl: at inspection 5,008 well-formed JSONL records, recent 1,188/30h. Relevant line anchors include 4054–4076 (SQLite investigation), 4497–4544 (compaction/capacity), 4593–4640 (recovery/retention), 4696–4798 (Graphify/knowledge), and 4921–5003 (semantic configuration and extraction). Line ranges are *activity locators*; do not infer every operation succeeded from a matching keyword. SentinelX audit is host-local, not a consumer-facing application log.

[E12] Current owner messages and assistant tool result history after the export; latest user instruction expressly forbids any app/SQLite/Graphify action apart from documenting history.

[E13] Live Git log on 2026-11-16 at main 7a5aa7f: dated commits a7782d1 (64-file cross-surface source), 5542aab/00be8e9 (Public mobile), 180c6fa through 0c2ce55 (custom Graphify), 5b3edd9 (Learn), b9570bb/97125c9 (Admin audit), 6326913 (quote retention source), 3adf29f (SQLite runbook), 7a5aa7f (retention/20GB fix).

[E14] Owner-provided SQLite official archive sqlite-doc-3540100.zip and research note NEXI_SQLITE_3541_ARCHIVE_STORAGE_RESEARCH.md; official SQLite material is research context, not direct proof of VM state.

## 10. Handoff capsule — stop state

**TASK:** Create this historical record only. **SOURCE WRITER:** none for NEXI application. **CURRENT GIT:** main@7a5aa7f; existing dirty tree must be preserved. **CURRENT GRAPH:** upstream Graphify 0.9.111 combined source/semantic at graphify-out/graph.json (8,772 nodes / 22,093 edges), distinct Knowledge v4 graph. **SQLITE:** compacted ~4.35GB, recovery receipts recorded, source scheduler and live config mentioned in dated runbook; do not touch now. **SERVICES:** nexi-api, nexi-admin, nexi-public were verified inactive at time of history write. **KNOWN OPEN:** source-wide final disposition, exact next proven Backend source defect, deferred application acceptance/release, long-term Kline policy, independent off-host DR. **NEXT AUTHORITY:** wait for owner's next instruction, then resume from active task board and source proof, not from any historical speculative plan.

**Stop condition satisfied when this file is present, non-empty, source-reference sections verified, and all three services remain inactive. No graph generation, DB maintenance, source edits, or deployment is part of this document's preparation.**
