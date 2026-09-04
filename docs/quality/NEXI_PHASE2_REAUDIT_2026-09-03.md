# NEXI Phase 2 Re-Audit — 2026-09-03

STATUS: PARTIAL — `CODE_TO_CODE_CLOSED` is not proven.

This is a fail-closed cross-check against the locked Phase 2 specification. Historical handovers and prior PASS strings are evidence only; current source, fresh commands, and read-only platform checks are authoritative.

## Authority and Evidence

- Repository: `/workspace/scratch/bb7c11818f19/Dexi_Style`
- Revision: `c74dbbd1bac72988a4d841953b718295141c569c`
- Worktree: intentionally dirty; existing user/generated files were preserved.
- OpenAPI artifact: `docs/contracts/openapi.json` — 190 paths, 74 schemas.
- D1 migration input: `backend/prisma/migrations-d1` — 5 migration files.
- Fresh backend verification: 68 suites passed, 2 skipped; 259 tests passed, 5 skipped. The added Kline producer/gateway/contract slice is separately 3 suites and 8 tests passed.
- Fresh Public market-state verification: 6/6 Node tests passed.
- Graphify MCP: callable; 9,747 nodes, 21,228 edges, 0 reported communities, 96% extracted, 4% inferred. The MCP graph recognizes the new backend Kline symbols, but its affected-slice query does not yet expose the latest Public consumer edges; no source revision/freshness proof or whole-repository reconciliation ledger exists.
- Local Graphify artifact: stale relative to the current revision and uses `links`, not `edges`; it cannot be treated as the final directed graph proof.
- Fallow: prior local 3.22.0/type-aware protocol 7 evidence found 115 dead files, 145 dead exports, 27 unused dependencies, one unresolved import, one auth/users/wallet cycle, and incomplete symbol-impact diagnostics. These are triage evidence, not deletion authority.
- Cloudflare read-only state: `api.nexitrading.app` custom domain is enabled for `nexi-staging`; deployed CORS/SIWE values are aligned to `app.nexitrading.app` and `admin.nexitrading.app`; bindings were present. No deployment was performed in this re-audit.
- Aiven read-only lookup: no Redis/Valkey service was returned, so the required named-service wiring and runtime evidence remain unverified.
- Sentry MCP/CLI: no callable current CLI was found in this workspace; historical authentication evidence is not fresh runtime proof.
- DeepWiki: attempted first for repository knowledge, but the private/unindexed repository was unavailable. Context7 and official Cloudflare documentation were available for platform semantics.
- API Documentation Checker: invoked, but the supplied artifact/index was rejected as out of scope; OpenAPI parity therefore remains unproven.

## Block Matrix

| Block | Status | Current evidence | Required closure still missing | Classification |
|---|---|---|---|---|
| 1. Contract, routing, schema, identity | PARTIAL | OpenAPI artifact, controllers, DTOs, SIWE/JWT/RBAC code, D1 gateway, userCode paths, and auth tests exist. Admin production fallback now targets `https://api.nexitrading.app` while local development remains localhost. | Generated active OpenAPI vs Public/Admin parity, complete route/DTO/error matrix, all migrations, SIWE replay/rotation/revocation runtime proof, Admin separation/RBAC coverage, and removal/isolation of active Prisma fallback paths are not reconciled. | `OPENAPI_DRIFT`, `SCHEMA_MISMATCH`, `IDENTITY_MISMATCH`, `LEGACY_SHADOW` |
| 2. Market, providers, Kline, realtime, frontend state | PARTIAL — Kline slice repaired | Canonical source catalog contains 53 assets: 17 crypto, 20 stocks, 9 forex, 7 metals. REST Kline path and provider mappings exist. New source path is Provider Kline → D1/Prisma-selected persistence → Redis `market:klines:v1` → Socket.IO `market_kline` → Public hook/worker/chart state, with sequence deduplication and REST baseline. | Live 53/53 provider capability/fallback/freshness proof, all required interval/provider semantics, durable D1-only proof, depth/trade truth, reconnect/resubscribe/missed-event recovery, and deployed runtime evidence remain open. Exact replay is explicitly deferred by the current realtime contract. | `PROVIDER_GAP`, `REALTIME_GAP`, `RECOVERY_GAP`, `RUNTIME_REQUIRED` |
| 3. Durable business and financial authority | PARTIAL | D1 financial gateway, ledger, Activity/audit, idempotency/outbox code, concurrency/partial-failure tests, and fresh full backend tests exist. | Real deployed D1 financial command proof, all wallet/spot/margin/binary/earn/mining/loan command rows, settlement/deposit retry proof, and proof that no reachable Prisma/Postgres branch is financial authority remain open. | `IDENTITY_MISMATCH`, `SHADOW_AUTHORITY`, `RUNTIME_REQUIRED`, `ASYNC_GAP` |
| 4. Complete Public/Admin and cross-surface sync | PARTIAL | Separate `apps/admin` provider plane exists; live provider is now the safe default and mock is explicit. Public/Admin route and backend code exists. | Every required destination/domain row, real provider parity, opposite-surface read-back for all important flows, realtime reflected state, and duplicate root `src` vs `apps/admin` authority reconciliation remain open. | `ADMIN_DRIFT`, `PUBLIC_DRIFT`, `LEGACY_SHADOW`, `MISSING_LINK` |
| 5. Async, failure, recovery | PARTIAL | EventOutbox, queue/workflow bindings, Valkey/Socket.IO source, and selected failure tests exist. | Atomic business-write + ledger/activity/audit + outbox proof for every command, actual Queue consumer/redelivery/DLQ matrix, workflow retry/resume, Aiven Valkey runtime, D1/provider/Socket reconnect recovery, and REST convergence are not fully proven. | `ASYNC_GAP`, `RECOVERY_GAP`, `RUNTIME_REQUIRED` |
| 6. Graphify/Fallow final reconciliation | PARTIAL | Graphify MCP traversal, God-node output, targeted Kline path, and Fallow static/type-aware evidence were collected. | Fresh directed whole-repository graph, repository/surface/folder/domain coverage ledgers, directional projections, SCC/orphan/shadow/anti-node analysis, graph diff, reverse affected paths, and final acceptance overlay are absent. | `UNKNOWN`, `MISSING_LINK`, `SHADOW_AUTHORITY` |

## Re-applied Source Repair

The verified Block 2 defect was repaired in one vertical slice:

```text
ProviderKlineEvent
→ MarketKlineService persistence
→ Redis market:klines:v1
→ MarketGateway market_kline
→ Public useRealtimeMarket / worker
→ chart candle replacement
```

Changed source/test surfaces:

- `backend/src/market/market.types.ts`
- `backend/src/market/market-ingest.service.ts`
- `backend/src/market/market.gateway.ts`
- `backend/test/market/market-ingest.kline.spec.ts`
- `backend/test/market/market-gateway.ordering.spec.ts`
- `cloudflare-container-bootstrap/dexi-frontend/app/lib/market-stream.ts`
- `cloudflare-container-bootstrap/dexi-frontend/app/hooks/useRealtimeMarket.ts`
- `cloudflare-container-bootstrap/dexi-frontend/public/market-stream-worker.js`
- `cloudflare-container-bootstrap/dexi-frontend/app/lib/market-stream.test.mjs`

Also retained the previously verified domain/config alignment changes in:

- `cloudflare-container-bootstrap/wrangler.jsonc`
- `apps/admin/src/admin/data/context.tsx`

No secrets, deletion, migration, commit, push, or Cloudflare deployment was performed during this re-audit.

## Gate Decision

`CODE_TO_CODE_CLOSED = BLOCKED`.

The gate cannot be claimed because critical rows still have `PARTIAL_PATH`, `MISSING_LINK`, `CONTRACT_MISMATCH`, `PROVIDER_GAP`, `ASYNC_GAP`, `RECOVERY_GAP`, `SHADOW_AUTHORITY`, `UNKNOWN`, or equivalent evidence states. The repository harness also remains `IN_PROGRESS`, with withdrawal/deposit runtime proof, C5 staging proof, and C6 browser acceptance outstanding.

`C4A/C4/C5/C6` remain deferred or partial per the locked sequence. Browser/mobile acceptance must not start until source synchronization and the final directed Graphify reconciliation are proven.

## Next Execution Order

1. Build the source-derived contract/identity matrix and repair Block 1 shared roots.
2. Reconcile provider capability and all seven acceptance intervals; add runtime/provider truth evidence.
3. Close D1/ledger/idempotency/outbox rows domain by domain, with no Prisma financial authority.
4. Reconcile every Public/Admin destination and opposite-surface read-back.
5. Prove async failure/recovery and Aiven Valkey semantics.
6. Produce the fresh directed Graphify/Fallow whole-repository reconciliation and only then evaluate `CODE_TO_CODE_CLOSED`.
