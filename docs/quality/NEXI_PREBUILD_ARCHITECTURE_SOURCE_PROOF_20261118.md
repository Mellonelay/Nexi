# NEXI — Committed Source and Pre-build Architecture Proof (2026-11-18)

**Authority:** Current owner-approved NEXI Binary/Admin design, repository source, and latest Project Instructions. Historical design maps and retired source-first kernel restrictions are superseded; retain their provenance.

## Immutable source revisions
- **Market repair and contracts:** `8d32b95a71ef0880b6e63feb46b1ff10b438fc18` — Backend bounded market queue/reference separation, Kline same-timestamp revision ordering, Socket.IO adapter correction, Public Spot gap recovery, OpenAPI and read-only Postman regression collection.
- **Admin/API consistency:** `ed9fbf5be171629cb82b55fd8eb530049dcd1686` — Admin feature flag toggle now uses the existing Backend-compatible payload builder (`env` to API `environment`, with reason); current Binary/Admin test mock contracts and up-to-date component/view assertions.
- **Original Work checkpoint:** `99ba7024a897181ca479cf37b31a24846019c0a6`. It was uncommitted **then**, but not after the commits above. This is a chronological record, not the present source identity.
- **Deployment boundary:** The existing 2026-11-17 production release has **not** been replaced by either commit. A Git commit is neither a build nor a deployment.

## Actual focused verification — current committed code
Tests ran immediately before commit without code changes between checks and commits; exact command output is retained at `~/.cache/nexi-archkeel/final-validation-20261118/` on the VM.

| Evidence area | Command | Observed |
|---|---|---|
| Backend market, Binary, Admin config, ingest shutdown | `NODE_OPTIONS=--experimental-vm-modules node node_modules/jest/bin/jest.js --runInBand` with eight named market/gate2/admin/runtime spec files | **8 suites, 62/62 PASS** |
| Public market stream and Binary chart | `node --experimental-strip-types --test app/lib/market-stream.test.mjs app/lib/binary-sandbox-chart.test.mjs` | **23/23 PASS** |
| Admin navigation, provider and feature flags | `node --experimental-strip-types --test test/admin-navigation.test.mjs test/frontend-control-accessibility.test.mjs test/nexi-api-provider-reorder.test.mjs test/feature-flag-update.test.mjs` | **33/33 PASS** |
| TypeScript | Backend `tsc --noEmit -p tsconfig.build.json`; Public `tsc --noEmit -p tsconfig.json`; Admin `tsc --noEmit --incremental false` | **All PASS** |
| OpenAPI source contract | Parsed `docs/contracts/openapi.json`, 253 paths / 279 operations; trades/depth symbol,pair,limit optional | **PASS structural/schema inspection**, not full runtime semantic proof |
| Postman | Read-only four-GET / 12-assertion collection previously executed against November 17 deployed API | **Historical baseline PASS**, *not* new source/runtime proof |
| Git | `git diff --cached --check` and pre-commit staged-whitespace hook | **Both source commits passed** |

**Total focused checks:** 118 tests PASS (62 Backend + 23 Public + 33 Admin). The Backend Binary/Admin fixtures and Admin provider expectations were synchronized with the approved current-source behavior, not redesigned as alternative Binary policy.

## Three distinct correctness dimensions

- **Component:** source-specific unit contracts, controllers, sandbox candle validation, and TypeScript semantics established for the tested slices.
- **Integration:** source-to-consumer API/DTO and focused contract tests established for market/Admin/Binary slices. No systematic replay of every REST operation or complete Graphify source graph refresh was performed.
- **Product:** same-release mobile wallet, Admin operator journey, 113 criteria, financial posting/readback and production market-load invariants **remain unverified by this campaign**; no claim of complete product correctness.

## Architecture policy and operational controls

NestJS/Prisma/SQLite remains the only financial authority; LedgerPosting/Audit/Outbox are not replaceable with Valkey, BullMQ or Socket.IO. Admin authority requires Backend RBAC, idempotency and audit. Current Binary research controls and deterministic simulation candles/validation are implemented as approved; earlier October `missing/proposed` descriptions are historical. Market depth/trades are best-effort reference inputs and cannot become financial settlement truth.

**Archkeel 4.0.1:** three isolated local-dependency snapshots exist and scoped smoke scans passed, but full Backend/Public/Admin initialization **timed out on all three** in the latest attempt. No complete approved target architecture contract or global PASS exists. Do not block documentary authority on this tool or weaken rules to force PASS. Graphify and Fallow remain supplemental source locators/policy evidence with recorded staleness/coverage limits.

## Repository cleanup

397 purely untracked `.bak.*` backups (35,613,476 bytes) were deleted with metadata-only manifest `~/.cache/nexi-archkeel/cleanup-backups-20261118.json`. The accidental untracked `backend/pnpm-lock.yaml` was removed; the tracked Backend `package-lock.json`, package manifests and three application dependency stores were preserved. No customer data, production database, service or release artifact was touched.

## Remaining release proof (not claimed complete)

Full-source architecture rule enforcement, isolated replay/load and SQLite financial interference measurement, updated artifact-scoped Sentry/source maps, historical Kline/provider coverage, all 113 real-product acceptance criteria, and canonical production build/deployment remain separate tasks and permissions.

**Status:** `SOURCE_COMMITTED + FOCUSED_TESTS_PASS + DOCUMENTATION_RECONCILED; PRODUCTION_UNDEPLOYED; PRODUCT_ACCEPTANCE_PENDING`.
