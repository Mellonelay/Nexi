# NEXI — Component, Integration and Product Correctness Verification (2026-11-19)

**Purpose:** Preserve actual validation results at the committed 2026-11-18 market/Admin/document baseline, before any new production build or deployment. Source HEAD immediately preceding this evidence change: `925bf02`. The source release contains market commit `8d32b95`, Admin correction `ed9fbf5`, architecture reconciliation `9b0ef48`, and documentation chronology `925bf02`; it is **not** the deployed November 17 release. This evidence is additive to [the earlier 118-test pre-build proof](NEXI_PREBUILD_ARCHITECTURE_SOURCE_PROOF_20261118.md).

## Exact scope and verified outcome

| Proof dimension | Validation | Result | Meaning |
|---|---|---|---|
| Component + selected integration | Backend Jest **explicit** `--runTestsByPath` across 12 named market, Kline, Binary, Admin RBAC/configuration, wallet auth/JWT, financial boundary and C3 Public↔Backend↔Admin test files | **12/12 suites PASS; 74/74 tests PASS** | Scoped source/DI/readback fixtures passed. Not every Backend suite or live financial transaction. |
| Component + frontend contract | Public Node `--experimental-strip-types --test` on 10 files (market, Binary sandbox chart, SIWE, authentication, trading state, config/navigation and connector behavior) | **62/62 tests PASS** | Bounded modules and UI-support contracts, not browser rendered interactions. |
| Admin component/API-contract | Six Admin Node test files (navigation, accessibility, API provider/feature flags, messages and support settings) | **36/36 tests PASS** | Scoped provider/controller payload and presentation behavior; not production operator interaction. |
| Type safety | Backend `tsc --noEmit -p tsconfig.build.json`; Public `tsc --noEmit -p tsconfig.json --incremental false`; Admin `tsc --noEmit --incremental false` | **All three PASS** | TypeScript consistency only. |
| Documentation/contract structure | Parsed 34 Markdown/JSON/CSV files in six architecture/research/quality/contract/Admin/Backend trees, scanned local Markdown links, verified key source-path anchors | **0 broken links; 0 structural parse errors** | Does not certify every end-to-end semantic claim. |
| Product/economic correctness | Production wallet/DApp browser and real Admin workflows; all 113 acceptance criteria; balance/Ledger/Activity/Outbox reconciliation; post-deploy stress | **NOT VERIFIED this campaign** | Requires separately authorized same-release interaction and financial controls. |

### Exact Backend test files

`test/market/market-ingest.kline.spec.ts`, `test/market/market-kline.service.spec.ts`, `test/market/market-gateway.ordering.spec.ts`, `test/gate2/binary.service.spec.ts`, `test/admin/admin-binary-configuration.spec.ts`, `test/admin/admin-rbac.spec.ts`, `test/auth/wallet-auth.service.spec.ts`, `src/auth/jwt.strategy.spec.ts`, `test/integration/public-market-kline.http.spec.ts`, `test/integration/public-financial.http.spec.ts`, `test/integration/c3-financial-causality.http.spec.ts`, `test/contracts/financial-module-boundary.spec.ts`.

Command shape: `NODE_OPTIONS=--experimental-vm-modules node node_modules/jest/bin/jest.js --runInBand --silent --runTestsByPath <12 exact paths>`. The actual final run: **74 tests PASS** (12 suites). The C3 test uses a deterministic in-process financial state and replaces selected auth guards; it proves the bounded Public→Backend→Admin request/decision/readback path, **not** real production ledger writes or HTTP guard enforcement.

## High-confidence test contract corrections (no application behavior change)

1. `frontend/app/lib/trading-states.test.mjs`: Normalize supported `unknown` to `UNKNOWN` rather than fabricated `FAILED`. Assert an actually unsupported value falls back to `FAILED`. Current `trading-states.ts` explicitly includes `UNKNOWN` as an order state; that is the approved uncertain-submission contract. Focused **4/4 PASS**.
2. `backend/src/auth/jwt.strategy.spec.ts`: Updated wallet-native null-email acceptance fixture to include durable `sid`, a mock active session and current user; added rejection of sid-less JWT. Existing `jwt.strategy.ts` correctly rejects tokens without a revocable session; **never weaken this security invariant for old tests**. Focused **3/3 PASS**.
3. `backend/test/integration/c3-financial-causality.http.spec.ts`: Updated NestJS isolated test module to provide mock `RedisRateLimitService` and `CommunicationsService` required by its current decorators/controller constructor. Full test **1/1 PASS**. No application controller/business logic changed.

## Expanded-run failure evidence (DO NOT CONCEAL)

An initial *overbroad* Backend Jest command unintentionally selected **106 suites / 626 tests**, despite its intended narrower scope. Reported **73 passing and 33 failing suites; 513 passing / 113 failing tests**. The output contains repeated **`better-sqlite3` missing native `.node` binding** errors from the existing external shared dependency store `/srv/nexi/backend/shared/node_modules`, along with outdated constructor mocks, missing gateway methods, and older assertions. This is a real **global verification failure / environment and fixture triage backlog**, not evidence that all 113 failures are distinct production defects. Do not represent the global Backend suite as PASS, and do not rebuild production/shared dependencies without a scoped owner-approved environment procedure.

A 12-suite explicitly selected Backend run initially had **11 PASS and 1 failing C3 harness**, before adding its missing NestJS providers. The **same 12-suite set was rerun and passed 74/74**, after the harness correction. The expanded Public set initially failed one outdated `UNKNOWN`→`FAILED` expectation; it was rerun in full and passed 62/62. Admin's expanded set passed 36/36 without modification. Compiler checks passed all three applications.

Recorded host logs/selection evidence: `~/.cache/nexi-archkeel/validation-20261119/{backend-focused-expanded,public-unit,admin-unit,backend-exact,public-exact}.log` and `summary.json` / `exact-summary.json`. The final 12-suite Backend output was confirmed via a fresh SentinelX invocation; its summary is this report. Shared native binding errors can be resolved in a disposable test runtime, then the *correctly scoped* full Backend suite should be rerun and remaining real defects traced to their owners, not patched by weakening production financial/security policy.

## Git cleanup and architecture policy

- The 397 prior untracked `.bak.*` backup artifacts were already removed with manifest under `~/.cache/nexi-archkeel/cleanup-backups-20261118.json`. The last **ignored** `.codex/skills/graphify/SKILL.md.bak` was separately confirmed untracked and removed. Post-delete scan: **0 backup artifacts; 0 untracked files**.
- Current source/docs authority follows the owner-approved Binary/Admin code. Binary research account/position controls, deterministic sandbox candle generation, Public validation and separate atomic financial settlement are source-implemented; old "missing/proposed" docs are superseded as current requirements.
- Archkeel 4.0.1 isolated Backend/Public/Admin scoped smoke checks worked; full target-contract certification remains UNKNOWN and is not a prerequisite to describing actual current source correctly. Fallow's existing zone checks do not prove every domain invariant.
- The November 17 deployed artifacts were not replaced. This task made no application-service restart, production DB write, external transfer, canonical build or deployment.

## Remaining correctness / release dependencies

1. **Backend-wide gate:** Re-establish hermetic native `better-sqlite3` binding for the correct Node ABI *outside production shared stores*, rerun full suite with correct selectors, and triage legitimate failures from outdated test fixtures versus source defects.
2. **Integration gate:** Source↔OpenAPI↔Admin/Public producer-to-consumer parity across all 279 operations is not established by 12 Backend suites or four read-only Postman endpoints. Verify guarded REST, contracts and durable financial readbacks in controlled tests.
3. **Product gate:** Run actual 113 scenario acceptance and real injected-wallet mobile/desktop browser checks against specific release artifacts. Approved bounded economic tests must reconcile single-command idempotency, balances, Ledger/Audit/Outbox/Activity. Do not infer PASS from source tests.
4. **Market runtime gate:** Measure reference drop counts, closed-Kline pressure, SQLite financial latency and provider historical coverage under safely isolated replay before any performance improvement claim.
5. **Release gate:** Current local commits do not imply Git remote synchronization, build or deployment. Push/release only in separately authorized release lifecycle.

**Overall verdict:** `COMPONENT_FOCUSED_PASS | INTEGRATION_SCOPED_PASS | GLOBAL_BACKEND_GATE_FAIL | PRODUCT_ACCEPTANCE_NOT_VERIFIED | SOURCE_NOT_DEPLOYED`.
