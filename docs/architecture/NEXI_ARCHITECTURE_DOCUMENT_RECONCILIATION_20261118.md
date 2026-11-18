> **Revision anchor:** [Committed market/Admin source and focused proof](../quality/NEXI_PREBUILD_ARCHITECTURE_SOURCE_PROOF_20261118.md), not deployed.

# NEXI Architecture and Market Contract Reconciliation — 2026-11-18

**Purpose:** Architecture navigation originally surveyed at `main@99ba7024a897` with 11 uncommitted market changes. Those changes are now **source-committed** in `8d32b95a71ef` plus Admin fixes `ed9fbf5be171`. This is a source-candidate assessment; it is **not** a new production release, architecture certification, exhaustive runtime test, or authorization to mutate financial data. The original research/acceptance historical evidence remains intact.

**2026-11-18 semantic continuation:** See [the full 30-document architecture understanding, source trace and contradiction record](NEXI_DEEP_ARCHITECTURE_SEMANTIC_RECONCILIATION_20261118.md) for detailed meaning beyond this first-pass inventory. This entrypoint remains the provenance index; the semantic continuation contains current owner mapping and bounded source corroboration. Neither alone certifies every financial invariant or deployed behavior.

**Latest owner authority:** [NEXI current source architecture authority](NEXI_CURRENT_SOURCE_ARCHITECTURE_AUTHORITY_20261118.md) supersedes contradictory historical Binary/Admin proposed-state claims; direct current source also implements research candle projection and Public chart validation.

## Document authority and proof semantics

Current owner/project instructions > current applicable source and `AGENTS.md` where not superseded > live Git, actual source, tests and deployed receipt > revision-compatible Graphify/Archkeel > dated document conclusions. The retired NEXI Kernel workflow and blanket source-first test prohibition in older docs do **not** govern current verification. Canonical one-checkout/three-independent-package-stores and explicit production activation/financial-operation approval remain applicable.

**Evidence tiers:** `DOCUMENTED_TARGET` (ADR), `SOURCE_IMPLEMENTED` (current diff), `STATIC_TESTED` (focused local tests/type checks), `CONTRACT_TESTED_AGAINST_OLD_RELEASE` (Postman current production), `DEPLOYED` (only verified artifact SHA), `RUNTIME_VERIFIED` (release-scoped observation). A prior tier never automatically implies the next.

## Current architecture — reconciled

- **Financial authority:** NestJS 12 policy, SQLite via Prisma 7/better-sqlite3 and native gateway, LedgerAccount/LedgerPosting, atomic journal and Outbox/Inbox. BullMQ 6/Aiven Valkey is delivery/wakeup; Socket.IO Redis Streams and Pub/Sub are transport/projection. No alternative financial writer or market-source settlement authority.
- **Market quote/price:** adapter/router and provider mapping → MarketIngestService → MarketAuthorityService → SQLite MarketQuoteLatest/MarketQuoteSnapshot → Redis market events → MarketGateway → Public/Admin readbacks. Reference prices are not trade execution or Binary settlement facts.
- **Candle:** provider/derived bars → MarketKlineService → SQLite `MarketKline` unique (pairId, interval, openTime) → REST/socket → Public seven intervals 1m/5m/15m/30m/1h/4h/1d. 53 assets are a catalog, not proof that all 371 pair×interval live histories work.
- **Best-effort reference depth/trades:** separate bounded reference queue and Pub/Sub; **not durable**, no exact tape-completeness guarantee. Binance depth20 snapshots are replacement snapshots, not Binance diff-depth sequence deltas; do not infer a mandatory contiguous increment.
- **Public Spot:** bigint suffix trade IDs, gap tracking, throttle-aware trailing REST refresh, explicit STALE until observed range filled. REST `GET /market/trades` defaults 50, max 100; no arbitrary historical `fromId` route is established.
- **Admin:** TanStack Start/Router operator consumer; no change established necessary for the market event repair. Existing Admin operator docs are dated design/source maps, not November 18 deployed parity evidence.
- **Runtime:** November 17 receipts: Backend built `247a38a4b7a950083cbb14dfc18ea651b5d0677d`; Public/Admin `4a47810565814248365bcf8221d81cbd02146959`. The November 18 source candidate is **not built or deployed**. Sentry release-scoped old-artifact traces cannot prove candidate performance.

## Market repair reconciliation (observed source and test receipts)

| Contract | Source owner | Candidate state | Verification boundary |
|---|---|---|---|
| Separate SQLite-bound ticker/Kline and trade/depth reference lanes | `backend/src/market/market-ingest.service.ts` | Implemented: durable event queue 256 normal / 1,024 closed-candle reserve; 8 workers; reference 256 / 4 workers; saturation counts/logs | Bounded queues still allow losses beyond capacity; counts in memory, not evidence of production rate |
| Ticker coalesce + depth replace | same | Implemented by kind/symbol/provider | Trade/depth intentionally lossy; absence of reference replay |
| Shutdown drain | same, `OnModuleDestroy` | 5-second bounded best-effort drain with discarded-closed-Kline logging | Not a delivery guarantee under blocked persistence or unhandled termination |
| Kline same-timestamp revisions | `backend/src/market/market-kline.service.ts` | Implemented per normalized candle key; next persisted receivedAt sequence | Millisecond-derived sequence is not a universal distributed monotonic sequence; no production contention proof |
| BigInt trade IDs, gap recovery | `frontend/app/lib/market-stream.ts`, `frontend/app/dashboard/spot/page.tsx` | Implemented trailing REST refresh, STALE when incomplete | REST latest 50 / max 100 may never recover older gaps |
| Socket.IO adapter shutdown name collision | `backend/src/prisma/redis-io.adapter.ts` | Renamed helper `closeRedisClient` to avoid inherited adapter conflict | Backend TypeScript check passed; deployed runtime not tested |
| API query metadata | `backend/src/market/market-public.controller.ts`, `docs/contracts/openapi.json` | Optional symbol/pair/limit aligned for recent trades/depth | OpenAPI syntax lint is not a full semantic contract test |

Previously established receipts: **33/33 Backend market unit tests**, **17/17 Public market-stream tests**, production-source Backend TypeScript and Public TypeScript passed. Postman read-only collection had four HTTP 200 requests and 12/12 assertions against the **old deployed release**, not the candidate. Fallow boundary scan passed with incomplete rule/module coverage.

**Archkeel correction:** the earlier `UNKNOWN/exit 2` due to source symlinks was an analyzer snapshot-path failure, not an NEXI module defect. The `nexi-archkeel` CLI now stages app-specific dependency copies under `~/.cache/nexi-archkeel/{backend,public,admin}` for analysis, and scoped TypeScript smoke scans passed on each surface. **No approved architecture target contract or full Backend dependency graph PASS has been established.** Probe drafts under cache are not adopted architecture policy; full-Backend scan exceeded budget. Do not infer application-wide PASS.

## Evidence conflicts and decisions

1. **P1 — superseded lifecycle rule.** Root/application AGENTS and dated ADR/architecture/research sections contain former source-first verification ordering. The current owner has retired the blanket ban; retain historical passages only with visible current override.
2. **P1 — research vs candidate identity.** The 2026-11-18 research and ADR were written **before** the source repairs. Their 256-event combined queue, one-lane worker and older version snapshots describe measured earlier state. Label them as baseline; append candidate delta, never erase earlier measurements.
3. **P1 — Archkeel snapshot failure vs subsequent repair.** The market handover recorded the former unresolved symlink failure. Update its current status without erasing the original dated scanner outcome or claiming complete rule verification.
4. **P1 — graph freshness.** `graphify-out/graph.json` currently reports `built_at_commit=03cf396788d1897cd700a5edd5de55f065db6562`, 8,602 nodes and 20,904 edges; source after market and Admin commits `ed9fbf5be171` (market `8d32b95a71ef`). Graphify 0.9.111 is a bounded **stale locator**, not a patch-aware proof.
5. **P1 — OpenAPI authority.** `docs/contracts/openapi.json` has 253 paths, OpenAPI 3.0.0; `NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md` includes 223 historic paths and retired ticket routes. Use current controller+OpenAPI, not the October inventory.
6. **P1 — Admin historical route counts.** Old Admin docs quote 33 sidebar / 34 routes or pre-release scaffold status. The later 21 primary navigation destinations / 34 page files are a 2026-11-07 source snapshot, not independently counted for this November 18 candidate. No Admin market-feed edit is implied.
7. **P1 — unknowns still open.** No measured production rate denominator, long-running 1×/2×/5× queue replay, market-data p95/p99, causal SQLite-retention pressure attribution, financial latency A/B comparison, source-candidate Sentry runtime, or full 53×7 provider history coverage.
8. **P2 — derived units and provider licensing.** Research's 72-hour quote snapshots and theoretical 100,859 continuous candle rows/day are estimates/policy references, not observed row growth. Preserve BiQuote/MOEX provenance/market-session rules and owner approval for new licensed fallbacks.
9. **P2 — browser acceptance out of scope.** The original 113 criteria and 16/24/8/65 historical counts remain preserved; they do not gate this market-document reconciliation and are not a current-release result.

## Pre-build status and next proof

**STATUS = DOCUMENT_INVENTORY_AND_PRIORITY_ALIGNMENT_COMPLETE; FULL_ARCHITECTURE_CERTIFICATION_PENDING; RELEASE_NOT_AUTHORIZED.**
Before a build/release decision, complete and evidence the architecture target-contract approval (Archkeel PASS/FAIL/UNKNOWN by *declared* policy), bounded workload replay/SQLite financial interference checks on isolated data, producer/consumer review of market diff, source/lockfile integrity, and an actual artifact/release strategy. Distinguish optional future phases in ADR from currently implemented work; do not expand the market patch into unrelated Admin/financial changes without proof. Builds at the canonical live output paths replace running artifacts; **no build/restart/deployment is performed here**.

## Requested-document inventory (every byte inventoried, references classified)

The following covers every eligible Markdown, CSV and JSON source found under the six named trees at initial inventory time. **The hashes in this table are pre-reconciliation source hashes**; post-edit hashes and changed-file deltas are in `~/.cache/nexi-archkeel/architecture-postreconciliation-20261118.json`. One additional diagram PNG is reviewed below. The pre-edit inventory records SHA-256, byte/line counts and heading positions in `~/.cache/nexi-archkeel/architecture-inventory-20261118.json`. Structured/semantic checks focus on relevant current claims; historical acceptance content is retained without rewriting its original criteria.

| File | Classification | Lines | SHA-256 prefix |
|---|---|---:|---|
| `docs/quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 114 | `0003d8962b11` |
| `docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 301 | `d96a796a8e7d` |
| `docs/quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 176 | `0c33563e02b8` |
| `docs/quality/NEXI_CHROME_DEVTOOLS_MCP_GUIDE.md` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 91 | `4446000fd075` |
| `docs/quality/NEXI_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_20261108.md` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 94 | `f87faf5a8d0e` |
| `docs/quality/NEXI_MARKET_SOURCE_REPAIR_WORK_REVIEW_20261118.md` | ACTIVE_CANDIDATE_RECEIPT | 59 | `1bb7c665fa97` |
| `docs/quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 363 | `406a3a8dba74` |
| `docs/quality/acceptance-evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.csv` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 114 | `1b09a780f67d` |
| `docs/quality/acceptance-evidence/NEXI_113_SOURCE_OWNER_GRAPH_COVERAGE_20261113.md` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 44 | `cf5309df1914` |
| `docs/quality/acceptance-evidence/NEXI_SOURCE_TRACEABILITY_113_20261112.csv` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 114 | `1fbe7899cfe1` |
| `docs/quality/acceptance-evidence/README.md` | DEFERRED_ACCEPTANCE_OR_HISTORICAL_EVIDENCE | 11 | `7a44075497b6` |
| `docs/contracts/openapi.json` | ACTIVE_API_CONTRACT | 16656 | `43a2da21dc11` |
| `docs/contracts/postman/NEXI_MARKET_READONLY.postman_collection.json` | ACTIVE_API_CONTRACT | 100 | `1f001b9749cc` |
| `docs/architecture/ADR-2026-11-18-NEXI-MARKET-DATA-RESOURCE-ARCHITECTURE.md` | RECOMMENDED_TARGET_WITH_CANDIDATE_ADDENDUM | 135 | `75e9980c6705` |
| `docs/architecture/CROSS_SURFACE_FEATURE_MAP.md` | ACTIVE_OWNER_MAP | 56 | `82110bdc4e61` |
| `docs/architecture/NEXI_ARCHITECTURE_DIAGRAMS.md` | ACTIVE_DIAGRAM_INDEX | 5 | `eed532781f3e` |
| `docs/architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md` | HISTORICAL_API_SNAPSHOT | 360 | `9df15ee072b0` |
| `docs/architecture/NEXI_DESIGN_TO_SOURCE_ASSURANCE_20261025.md` | DATED_SOURCE_REFERENCE | 40 | `634aa6c5e9bc` |
| `docs/architecture/NEXI_SOURCE_ONLY_ASSURANCE_20261020.md` | DATED_SOURCE_REFERENCE | 41 | `4fa374728fed` |
| `docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md` | ACTIVE_ARCHITECTURE_MAP_WITH_NEWER_OVERLAY | 77 | `a44bfc6a14b6` |
| `docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md` | HISTORICAL_RUNTIME_SNAPSHOT | 14 | `f981a430b3ee` |
| `docs/research/NEXI_BACKEND_ARCHITECTURE_PERFORMANCE_RESOURCE_STUDY_20261118.md` | DATED_RESEARCH_BASELINE_WITH_CANDIDATE_ADDENDUM | 418 | `2a53fe0ae2ca` |
| `backend/docs/NEXI_SQLITE_API_ROUTING_MAP.md` | DATED_SOURCE_REFERENCE | 33 | `4874216bb368` |
| `Admin/docs/ADMIN_IMPLEMENTATION_CONTRACT_MAP_A_F_2026-10-21.md` | HISTORICAL_OR_SOURCE_REFERENCE_CHECK_DATE | 104 | `0e58af18f84e` |
| `Admin/docs/ADMIN_VERIFIED_DIAGRAMS_AND_HANDOFF.md` | HISTORICAL_OR_SOURCE_REFERENCE_CHECK_DATE | 111 | `aa6a54550803` |
| `Admin/docs/CURRENT_STATUS.md` | HISTORICAL_OR_SOURCE_REFERENCE_CHECK_DATE | 277 | `521c8555719e` |
| `Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md` | HISTORICAL_OR_SOURCE_REFERENCE_CHECK_DATE | 146 | `6c7d2138c36a` |
| `Admin/docs/OPERATOR_WORKSPACE_IMPLEMENTATION_MAP.md` | HISTORICAL_OR_SOURCE_REFERENCE_CHECK_DATE | 107 | `8cb732dba5e4` |
| `Admin/docs/TANSTACK_ARCHITECTURE_AND_ROUTE_MAP.md` | HISTORICAL_OR_SOURCE_REFERENCE_CHECK_DATE | 115 | `b13361197c62` |
| `Admin/docs/WORK_SSH_NEXT_EXECUTION_HANDOFF_2026-10-21.md` | HISTORICAL_OR_SOURCE_REFERENCE_CHECK_DATE | 83 | `31a84f429617` |





## Independent evidence-check disposition

The AI Delivery Evidence Checker was invoked against the supplied three reconciliation criteria, source/delivery summaries and scoped test receipts. It returned **`needs_more_evidence` (`level_1`)**: inventory/hash coverage and focused reconciliation are demonstrable, but a **claim-by-claim exhaustive semantic review of every historical acceptance row, code-to-ADR assertion, and a complete approved Archkeel policy scan** are not established. This checker analyzes supplied evidence only; it did **not** inspect the VM or rerun tests. Do not turn its verdict into a claim that product source has failed, nor represent the current documentation pass as architecture certification.

**Release-boundary interpretation:** The present requested phase can finish with documentation synchronized for the known market candidate while retaining these explicit review gaps. The owner may approve a bounded source-candidate review/replay campaign separately, and any production build/release still requires separate authorization.

## Original Admin design image reviewed

- `Admin/docs/NEXI Admin — Unified Navigation and Binary Control Architecture-2026-10-21-144002.png` — 1,114,344 bytes, SHA-256 `5951d977a6a9eeb1860e8d5ef3caebedfe1b98106bf931bf3b5c91b7e9ce619d`. The diagram depicts **eight Admin workspaces**, with Markets → Canonical Market Feeds → Normal Settlement, while account/position-specific Binary research controls converge on one NestJS simulation authority. SQLite Trade Policy/Audit, simulated chart projection, and Binary Settlement/Ledger are separately depicted; the latter leads to Public results/Activity. This is **owner design intent**, not source/API proof of per-position simulation controls. Its canonical financial boundaries do **not** authorize reference feeds to become live settlement authority. The Admin source-mapping documents already distinguish design from implementation.

## Further current authoritative inputs outside the six trees

`AGENTS.md`, each application `AGENTS.md`, `NEXI_CURRENT_STATE.md`, `NEXI_PROOF_REUSE_REGISTER.md`, `tasks/todo.md`, `tasks/plan.md`, `tasks/evidence/NEXI_THREE_SURFACE_DEPLOYMENT_20261117.md` and the source ownership paths above govern replay/release decisions. Existing Nov 17 acceptance is a separate future slice.

**Integrity:** This document is an additive reconciliation overlay. Earlier historical dates and evidence remain historical; no release-state or source-implementation proof is created by editing documentation.
