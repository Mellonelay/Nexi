# NEXI Advanced Graphify v1.1 — Source-only connectivity audit checkpoint
Date: 2026-11-13 (UTC); source reference: `229c7d9a7e53c3e81ad42953e26bd9eddc6667fe`.
Current local HEAD after documentation preservation: `69c0012a137c911ed0a670e92fbc6bcff4c239f7` (documentation-only change).
Status: PARTIAL SOURCE CONNECTIVITY AUDIT; **NOT full framework closure**.
Runtime proof: DEFERRED_BY_OWNER_SOURCE_FIRST_RULE (no NEXI application tests, builds, browser or deployments).

## Authority and provenance
- Instructions: `tasks/NEXI_Advanced_Graphify_Full_Framework_Connectivity_Workflow_v1.1_20261113.md` fully read, 648 lines, SHA256 `6e571ca80753f6d8dcaf876525b8ce14c00768a500d6ab0d2bb8c51663da3a1a`.
- Current root/affected `AGENTS.md`, source-first v3.4 Kernel runbook, source evidence and Knowledge v4 govern; 113 browser criteria are supplementary, never expected-framework-contract denominator.
- Graph: `graphify-out/graph.json`, SHA256 `beec00370f944bdcac17b78f8a0e9d31b0363283e7280fcb0cdf7d0a1f8cbd8c`. Built for application source HEAD `229c7d9`.
- The 621/621 source files in `graphify-out/2026-11-13-source-229c7d9/source-manifest.json` matched live SHA256 (Backend 371, Public 142, Admin 108); newly committed files are only task documentation.
- Graphify v0.9.105 native local CLI/MCPC; separate Knowledge v4 MCP. `diagnose multigraph` returned 12,076 nodes, 32,496 edges, 293 communities; zero dangling edges, zero collapsed same-endpoint edges, 7 self-loops. Structural health is not functional correctness.

## Source-derived declaration inventory (independent from graph)
File: `NEXI_FRAMEWORK_SOURCE_DECLARATIONS_20261113.csv`. 519 anchored **declaration candidates**, not 519 complete end-to-end contracts:
- 283 active NestJS HTTP decorators; all 283 normalized method/path entries have an HTTP operation node in current graph. One commented `// @Get('profile')` was excluded after independent code inspection.
- 30 NestJS module decorators; independently discovered 25 controller classes were all listed in root/feature module `controllers` arrays. This is registration-source proof only; not live DI resolution proof.
- 35 TanStack route declarations, 21 Next app router file candidates, 98 Prisma model declarations from `backend/prisma/schema.d1.prisma`.
- Other candidates: 11 direct `fetch` sites, 5 Socket.IO gateway declarations, 9 event-emission candidates, 3 subscriber decorators, 1 queue constructor candidate. These are purposefully NOT complete framework-specific enumerations.
- `backend/src/jobs/local-async-runtime.service.ts:17,271-291` declares the same three names (`domain-events`, `notifications`, `integration-jobs`) for producer queues and worker registrations. `backend/src/jobs/durable-queue.transport.ts:20-60` retains a SQLite journal and retry semantics. This proves declared topology, not successful background processing.
- `backend/prisma/schema.d1.prisma:1148-1163,1249-1270` declares LedgerAccount uniqueness by user/asset/scope and LedgerPosting uniqueness by account/idempotencyKey. This is schema declaration evidence, not atomicity/replay proof.

## HTTP graph reconciliation
File: `NEXI_GRAPH_HTTP_OPERATION_RECONCILIATION_20261113.csv`. Exactly 301 canonical operation nodes:
- 167 with both extracted client-call and handler edges (topology only; DTO/guard/response semantics still require source adjudication).
- 119 with handler-side graph edges but no extracted client edge (not necessarily a defect; may be intentionally external, optional, Admin-only or direct URL access).
- 15 with a client edge and no extracted handler. All 15 were checked against relevant current-source locations and separately classified:
  - 10 `CROSS_REPO_OR_EXTERNAL`: 5 Binance calls, 2 MOEX operations, BiQuote metadata and latest calls, configured queue-bridge fallback.
  - 3 `DYNAMIC_PATH`: Admin governance command approve/reject, Admin withdrawal approve/reject, Public mining redeem/cancel. Matching source handlers verified at `backend/src/admin/admin.controller.ts:459-475,1047-1064` and `backend/src/mining/mining.controller.ts:98-116`.
  - 1 `PROXY_OR_ALIAS`: `frontend/app/hooks/useMarketData.ts:32` calls `/api/market/prices`; `frontend/app/api/market/prices/route.ts:1` reexports the Next GET proxy from `frontend/app/api/prices/route.ts:13-33`.
  - 1 `EXTRACTOR_UNSUPPORTED`: Admin audit query-string template `Admin/src/admin/data/nexi-api-provider.ts:1659` was captured as a malformed graph path; its true client target is `/admin/audit` with optional query parameters.
- Graph report's previously published 14 client-only operation-ID count uses a different scope/canonical grouping from the 15 direct graph client-only edge-node classes. Do not equate these denominators without inspecting the extractor implementation.
- Graph report also records 68 unresolved NEXI semantic operations; report does not provide individual adjudications. These remain an explicit source/graph reconciliation frontier, not 68 established application defects.

## Exact graph owner/source checks
- Kernel `source-map` invoked, Knowledge v4 returned task-specific reference; source graph and separate knowledge graph stats verified.
- Exact L0: `backend::src_loans_loans_service_loanservice` at `backend/src/loans/loans.service.ts:14`. L1 incoming module/controller/workflow/Admin references confirmed using `get_neighbors`; both EXTRACTED and INFERRED relation provenance kept separate.
- `backend/src/loans/loans.controller.ts:31-73` and `backend/src/loans/loans.service.ts:62-128` implement authenticated loan application and store collateral reference string. No authoritative approved-document lookup was shown by this source slice. Class: `INSUFFICIENT_EVIDENCE / NEEDS_OWNER_POLICY`; do not invent financial eligibility rules.
- `Admin/src/start.ts` explicitly registers `createCsrfMiddleware` for TanStack server functions in custom `createStart` middleware, matching current official TanStack source guidance. Class: `SOURCE_DECLARED_SECURITY_MIDDLEWARE`; not proof of deployed CSRF behavior.
- Backend `LoansController` exposes `GET /loans/applications/by-intent` at `backend/src/loans/loans.controller.ts`, but checked-in `docs/contracts/openapi.json` does not list this operation (236 documented paths at inspection). Class: `PROVEN_DOCUMENTATION_GAP`, **not missing application endpoint**.

## Specialist methods and limitations
- NEXI Normal Chat Kernel, SentinelX, Kernel source-map, Graphify CLI/MCP, source review, Agent Skills, Caveman/Ponytail and Vibe `integration-map`/`ownership-invariant-map`/`traceability-map` methods invoked/read and used for source-owner boundaries.
- Official TanStack docs and Context7 retrieved; compared against actual `Admin/src/start.ts`.
- Knowledge for Agents search returned only a non-applicable Git bundle case, not a reusable NEXI-specific fix.
- API Documentation Checker attempt failed/returned zero extracted endpoints on supplied fragments; direct source and checked-in OpenAPI JSON supersede that non-result. No API Impact Mapper change claim: application API was not modified.
- No Wayfinder or SQL Expert tool was exposed; no Supabase/Postgres query substituted for NEXI SQLite. Existing code and Prisma schema were read without database writes or migration.
- No extra Graphify producer, graph regeneration, Cloud trace, installation, service call or financial mutation.

## Unclosed audit frontiers
1. Complete **source-derived expected-contract** enumeration across all Backend/Public/Admin framework boundaries, not just 519 declarations; include guards/DTOs, server-function boundaries, state transitions, queues/events, and infrastructure.
2. Source-adjudicate the 167 dual-sided HTTP operations (method/path alone is not semantic agreement) and the 119 handler-only cases by explicit source/owner need; classify all 68 unresolved semantic operations, with independent source anchors.
3. Trace all material financial writer entrypoints and Ledger/Outbox/Inbox atomicity, precise retry/idempotency semantics, and Admin/Public readbacks; source graph edges alone cannot establish these.
4. Cover full Public mobile research contract against current source (existing Wallet corrections preserved); finish full socket listener/reconnect mapping and Nginx/VPS source boundary.
5. Keep only current-source-proven defects as repair candidates; source-first runtime verification remains deferred. No completeness percentage or global connectedness verdict justified yet.

**Audit verdict:** This is a completed first bounded structural/source reconciliation slice, **not** execution of every Phase B–G contract and not full source closure. No evidence promotes an uninspected contract to SOURCE_CONNECTED or an unmatched graph edge to PROVEN_SOURCE_GAP.
