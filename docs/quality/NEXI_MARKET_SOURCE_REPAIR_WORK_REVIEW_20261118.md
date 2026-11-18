> **Later release-source checkpoint:** This report records the original **pre-commit** candidate at `99ba702`. It was committed as market `8d32b95a71ef`, with subsequent Admin correction `ed9fbf5be171`. **No production build or deployment** followed. Current [pre-build verification](NEXI_PREBUILD_ARCHITECTURE_SOURCE_PROOF_20261118.md) includes 118 focused passing tests and all three TypeScript checks. Historical uncommitted statements below refer to the original review time.

> **2026-11-18 current-source alignment:** Read this file with the [owner-approved current-source architecture authority](../architecture/NEXI_CURRENT_SOURCE_ARCHITECTURE_AUTHORITY_20261118.md) and 30-document semantic reconciliation. Current Binary/Admin implementation—including the simulated-candle Public chart path—is authoritative; dated pre-repair market measurements remain historical. Source implementation, deployed runtime and customer/economic acceptance are separate claims.

# NEXI market-data source candidate — Work review index (2026-11-18)

**Scope:** Source candidate and read-only verification only. No source commit, production build, restart, deployment, financial mutation or SQLite database change in this review.
**Repo:** `/home/mellonelay1999/workspaces/Nexi`, `main`, HEAD `99ba7024a897181ca479cf37b31a24846019c0a6`. Existing untracked assets and dependency stores preserved.
**Authority:** Current owner decision/project instructions override historical root/backend `AGENTS.md` clauses that prohibit all testing until source closure. The existing November 17 release is not evidence that these November 18 source changes are running.

## Source repair candidate
Eleven modified tracked files remain uncommitted:
- `backend/src/market/market-ingest.service.ts`: separated bounded durable and best-effort reference queues; coalescing, drop counters, startup/shutdown drain attempt.
- `backend/src/market/market-kline.service.ts`: same-timestamp revised Klines, per-candle ordering/sequence persistence.
- `backend/src/market/market-public.controller.ts`: explicit optional query metadata on trades/depth.
- `backend/src/prisma/redis-io.adapter.ts`: renamed conflicting NestJS Socket.IO adapter helper.
- `backend/test/market/market-ingest.kline.spec.ts`: durability, saturation, shutdown behavior.
- `backend/test/market/market-kline.service.spec.ts`: equal-timestamp candle revisions.
- `backend/test/market/market-gateway.ordering.spec.ts`: ordering behavior.
- `frontend/app/dashboard/spot/page.tsx`: BigInt trade IDs, gap/REST recovery timer, stale indication.
- `frontend/app/lib/market-stream.ts`: trade-ID sequence and explicit gap-completeness predicate.
- `frontend/app/lib/market-stream.test.mjs`: stream and gap recovery regression tests.
- `docs/contracts/openapi.json`: corrected optional symbol/pair/limit query metadata for trades/depth only.

A separately existing **untracked** artifact is `docs/contracts/postman/NEXI_MARKET_READONLY.postman_collection.json`, a read-only four-GET regression collection. Its four request URLs were corrected to the Postman CLI-compatible string form.

## Verified checks (18 November, against this source candidate)
- Backend NestJS test command (from `backend/`): `NODE_OPTIONS=--experimental-vm-modules node node_modules/jest/bin/jest.js --runInBand test/market/market-ingest.kline.spec.ts test/market/market-kline.service.spec.ts test/market/market-gateway.ordering.spec.ts` — **3 suites, 33/33 PASS**.
- Backend production-source TypeScript: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json` — **PASS**. Do not confuse with broad `tsconfig.json` which includes historically failing unrelated test types.
- Public stream tests (from `frontend/`): `node --experimental-strip-types --test app/lib/market-stream.test.mjs` — **17/17 PASS**.
- Public TypeScript: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — **PASS**.
- `git diff --check` — **PASS**.
- Authenticated Postman CLI: `postman spec lint docs/contracts/openapi.json --issueType syntax --no-report-events -o json` — **zero syntax violations**. Not equivalent to complete semantic/API coverage.
- Authenticated Postman CLI, NEXI Market API collection — **4 GET requests, HTTP 200 each, 12/12 assertions PASS**. Both local artifact and cloud collection passed. **This probes the previously deployed production release, not the undeployed source candidate.** Cloud run: https://go.postman.co/workspace/24368e0a-01c6-40f7-9575-e4d6a660e826/run/48954859-f13f6517-12d7-4cf0-bd07-ec0c6059f39a . Workspace `24368e0a-01c6-40f7-9575-e4d6a660e826`, collection UID `48954859-b68a9dfe-eaea-4a60-9128-5ac0260e6a84`.
- Fallow 3.42.0 root architecture audit — **PASS (limited)**, zero detected boundary violations; root `node_modules` missing, rule packs not configured, so import/policy coverage degraded. Backend-scoped audit also **PASS (limited)**; generated minified files skipped and configured boundary zones match no files under backend-only root. Do not claim comprehensive architectural enforcement.
- Archkeel 4.0.1 `init --language typescript --source src/market --namespace market --tsconfig tsconfig.json --json` — **UNKNOWN / exit 2**. The TypeScript isolated snapshot rejects symlinked external `node_modules` and reports unresolved imports (`@nestjs/common`, `@nestjs/swagger`, `class-validator`). This is not a verified code-boundary defect. Do not replace NEXI's three separate shared dependency stores or fabricate an Archkeel green run.

  **Later scanner repair:** `nexi-archkeel` stages lockfile-pinned, independent Backend/Public/Admin analysis dependencies inside `~/.cache/nexi-archkeel`. Scoped smoke scans passed on all three applications; the Public two-file market scan also passed. This resolves the *original external symlink resolver failure* for the analysis snapshots, **not** a full Backend architecture traversal or approved target contract. Full Backend scan exceeded its budget; candidate-wide architecture compliance remains UNKNOWN. The dated exit-2 evidence above remains preserved. See [reconciliation](../architecture/NEXI_ARCHITECTURE_DOCUMENT_RECONCILIATION_20261118.md).

- AI Delivery Evidence Checker inspected **supplied evidence only** and marked it partially supported; it does not inspect the VM or certify correctness.
- Canonical Node executable: `/opt/nexi/runtime/node-v24.21.0/bin/node` (v24.21.0); npm 11.19.0; per-app dependency stores preserved. Postman CLI 1.91.0 authenticated as VM account `mellonelay1999`, not root.

## Review priority and limitations
1. Inspect `git diff` for the eleven source/contract files; preserve prior Work repairs, do not duplicate them.
2. Verify shutdown grace semantics under a blocked provider persist: 5-second grace is bounded, not an absolute zero-loss guarantee; `onModuleDestroy` permits draining queued work but cannot guarantee completion under permanent downstream stalls.
3. Inspect Public trade-gap recovery with REST's **latest 50 / max 100** trade behavior: a large/unavailable gap must remain STALE; do not assert arbitrary `fromId` history support. Real Binance trade/depth are reference-only, not financial execution.
4. Align OpenAPI generated metadata with controller; the generator changes unrelated output if run wholesale — keep current targeted contract patch unless its global generator drift is separately justified.
5. Architecture-policy gate remains **incomplete**: Archkeel scoped dependency-resolution now works, but full target-contract compliance is unproven; Fallow rule/zone coverage is limited. Use exact-source/manual boundary review as evidence, not a false passing automated policy check.
6. No steady-state load benchmark, long-run SQLite throughput/queue-loss comparison, runtime Sentry verification for this candidate, or deployed behavior proof exists. Production deployment/restart requires separate owner authorization.

## Authoritative document map for Work review
All paths relative to `/home/mellonelay1999/workspaces/Nexi`:
- `AGENTS.md`; `backend/AGENTS.md`; `frontend/AGENTS.md`; `Admin/AGENTS.md` — repository structure and canonical runtime instructions; **dated blanket test prohibition is superseded by current owner instructions**.
- `tasks/todo.md`; `tasks/plan.md`; `NEXI_CURRENT_STATE.md`; `NEXI_PROOF_REUSE_REGISTER.md` — active task and proof continuity; check revision/date.
- `docs/research/NEXI_BACKEND_ARCHITECTURE_PERFORMANCE_RESOURCE_STUDY_20261118.md` — measured saturation/SQLite resource research, estimates and unknowns.
- `docs/architecture/ADR-2026-11-18-NEXI-MARKET-DATA-RESOURCE-ARCHITECTURE.md` — recommended target; historical source-first/implementation language needs reconciliation.
- `docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md`; `docs/architecture/NEXI_ARCHITECTURE_DIAGRAMS.md` — broader application boundaries and topology.
- `docs/contracts/openapi.json` — tracked API contract (253 route paths at observed snapshot).
- `docs/contracts/postman/NEXI_MARKET_READONLY.postman_collection.json` — local read-only regression collection; cloud equivalent in personal Postman workspace above.
- `docs/quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md` — separate 113-case downstream mobile acceptance contract, **not part of current market source proof**.
- `docs/operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md` — current graph locator/Knowledge MCP route; graph topology is not runtime proof.
- `tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md`; `tasks/evidence/NEXI_SOURCE_RECONCILIATION_20261113.md` — historical prior repairs and source proof receipts.
- `backend/docs/`; `Admin/docs/` — domain architecture and surface-specific details when a contract crosses those owners.

## Boundaries
Backend NestJS and Prisma/SQLite remain the financial/settlement authority. Valkey/BullMQ/Socket.IO are transport and projections. No settlement provider, journal, Ledger, Outbox/Inbox, retention policy, database, production service or release artifact was changed by this campaign. **Status: source candidate verified by focused tests and contracts, not production released.**
