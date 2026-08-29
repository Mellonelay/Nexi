# NEXI File-by-File Execution Plan

**Status:** `FOUNDATION_AUDIT_COMPLETE_PENDING_HUMAN_GATES`  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Production program:** `docs/implementation/NEXI_PRODUCTION_ENGINEERING_PROGRAM_PACK.md`  
**Current-state authority:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Audit evidence:** `work/20260727-foundation-audit/FOUNDATION_AUDIT.md` and `DEPENDENCY_CANDIDATES.md`

This plan continues the completed charter and Phase 1 classification. It does not recreate the charter, restart discovery, move source, duplicate source, install packages, change lockfiles, deploy, publish, change credentials, or perform destructive cleanup.

## Active frontend interaction baton — 2026-07-27
The frontend sequencing decision is now `Quotes Hub → Asset Detail → Spot → Options/Binary`. This is an additive planning constraint over the existing file ledger; it does not authorize source movement or implementation.

- `/dashboard` remains the Quotes Hub and one of the 11 public primary destinations. Its category lists are scrollable and may contain many backend-authorized assets.
- Each current Quotes Hub row becomes a navigation action to the new child route `/dashboard/asset/[symbol]`; it no longer jumps directly to Spot.
- `/dashboard/asset/[symbol]` is a detail/context route, not a twelfth primary destination. It owns the chart-first market summary and explicit Spot/Binary handoffs.
- `ActivePairProvider` remains the shared owner but must evolve toward a catalog-resolved Active Instrument carrying asset identity, category, and capabilities. Spot and Binary consume the same selection.
- Binary user-facing actions are locked to `Long` and `Short`; the adapter preserves backend direction semantics (`Long` higher at expiry, `Short` lower at expiry) without exposing `Call`/`Put` copy.
- Spot/Margin uses one exchange-style chart-first page. Spot exposes
  Market/Limit/Stop Limit and progressive TP/SL; isolated Margin exposes
  LONG/SHORT at exactly 2x/3x/5x. Cross margin, futures, perpetuals,
  portfolio margin, C2C, and copy trading remain excluded.
- Wallet uses an exchange asset-center structure with portfolio, quick actions, assets, per-asset detail, networks, and history; it is not a trading-screen clone.
- Mobile navigation is locked to Dashboard, Spot, Options, Wallet, and Earn; the existing More/Trade presentation is removed from the target plan. The application menu is a left-side drawer opened by a top-left shell control, with the specified primary, communication/content, and account/system groups.
- Locale support is locked to English, 简体中文, 한국어, Русский, Español, and Bahasa Melayu, with profile persistence after authentication, local persistence before authentication, application-wide translation state, and stable asset/pair/financial notation.
- The next visual gate is Asset Detail design, Spot refinement, Binary refinement, and Wallet asset-center refinement, using the approved Deep Liquid Violet frame as the anchor. No alternate Dashboard generation is requested.

The exact current-to-target file map for this baton is in `docs/superpowers/plans/2026-07-27-nexi-asset-detail-trading-flow.md`; the inventory below remains the foundation audit and is not duplicated here.

## Ledger contract

Each row records the required current path, target path, action, rationale, dependencies, import/consumer impact, deployment impact, tests, rollback, and completion evidence. `PENDING APPROVAL` is an explicit stop point, not an implementation claim.

## Staged production workspace strategy

### Workspace and package-manager gate

The repository currently has three independent npm lockfiles plus a root utility manifest and no workspace declaration. The staged recommendation is one npm workspace rooted at the repository, using the existing npm lockfile family, with one root lockfile after an approved migration. This is a recommendation only: the package-manager/lockfile policy must be approved before any root manifest or lockfile mutation.

Migration order:

1. Freeze and baseline current roots; preserve each current lockfile as rollback evidence.
2. Define package names, TypeScript references/paths, scripts, environment ownership, and CI gates without moving source.
3. Add workspace manifests and internal package boundaries in a separately approved change; generate a new root lockfile only then.
4. Extract shared contracts/foundation first; make current backend/frontend consumers compile against them.
5. Move `backend` to `apps/api`, the public Next app to `apps/web`, and the embedded Admin surface to `apps/admin` only after import, Prisma, Docker, Cloudflare, environment, test, and rollback evidence is green.
6. Remove/deprecate independent roots only after staged builds, runtime checks, browser checks, and rollback rehearsal pass.

### Target workspace ownership

| Target | Initial source of truth | Staged strategy | Required gate |
|---|---|---|---|
| `apps/web` | `cloudflare-container-bootstrap/dexi-frontend` | Keep current frontend in place; later move the complete public Next app. Preserve the 11 public routes and shared ActivePair state. | Frontend build, import map, env/API map, Docker context, route/browser matrix, rollback. |
| `apps/admin` | `cloudflare-container-bootstrap/dexi-frontend/app/dashboard/admin` | Create a separate role-gated Next app by extraction; do not duplicate the embedded route as a second canonical implementation. Keep the old route as reference until replacement is verified. | RBAC/session boundary, API permissions, browser evidence, audit/reason envelope, rollback. |
| `apps/api` | `backend` | Keep the Nest/Prisma API current root; later move the whole API with its Prisma schema and tests. | API build/test, Prisma migration proof, Docker health, env contract, runtime/API/WS evidence, rollback. |
| `packages/contracts` | `backend/src/contracts`, `backend/test/contracts` | Extract stable DTOs, runtime validation, error/idempotency/auth metadata and compatibility tests. API remains consumer until package proof is green. | Contract build, API/frontend consumers, compatibility tests, versioning/rollback. |
| `packages/domain` | `backend/src/authority` plus domain boundaries | Establish domain types/invariants and pure logic; do not move empty module boundaries without tested providers. | Domain tests, ledger/market invariants, import-cycle check, API integration. |
| `packages/config` | `backend/prisma.config.ts` and env/config usage | Centralize typed environment/config schemas without copying secrets. Separate public build-time values from server-only values. | Env schema tests, startup failure tests, container/runtime verification. |
| `packages/ui` | Shared pieces under `cloudflare-container-bootstrap/dexi-frontend/app/components` | Extract only components proven to be shared by public web/Admin; keep visual authority and responsive/a11y tests. | Component build, visual/a11y/browser matrix, no server-only imports. |
| `packages/auth` | `backend/src/auth` plus frontend auth consumers | Define shared auth contracts and client/server boundary; never share public/Admin credentials or sessions without explicit policy. | Identity/RBAC tests, session isolation, security review, browser role checks. |
| `packages/observability` | Existing backend logging/health/telemetry touchpoints and platform adapters | Define correlation, redaction, health, metrics, traces and audit interfaces; Cloudflare remains an adapter. | Log/metric/trace assertions, redaction tests, runtime evidence. |
| `packages/testing` | `backend/test/contracts/contract-test-helpers.ts` and shared test utilities | Extract deterministic fixtures, contract helpers and test builders after package ownership is stable. | Unit/contract/integration consumers and reproducible clean-install test. |

## File-by-file execution ledger

### Root and workspace files

| Current path | Target path | Action | Rationale / dependencies | Import and deployment impact | Tests / rollback / completion evidence |
|---|---|---|---|---|---|
| `package.json` | Root workspace `package.json` | `MODIFY` later | Current root has no name/workspaces/scripts and mixed utility dependencies. Requires approved npm workspace and lockfile policy. | Becomes workspace authority; existing root consumers must be traced before dependencies are removed or relocated. No deploy until all workspace builds are green. | Parse manifest; clean install; all package builds/tests. Roll back to current manifest plus preserved independent locks. Complete only with one reproducible workspace install and evidence index entry. |
| `backend/package.json` | `apps/api/package.json` plus workspace references | `MODIFY` then `MOVE` later | Current Nest/Prisma manifest is executable but has missing direct `@jest/globals`, runtime `@prisma/client` classification, wildcard `@nestjs/mapped-types`, embedded Jest config, and missing e2e config. | Changes API package scripts, runtime dependency closure, Docker copy paths, Prisma seed path, and CI commands. | Current backend tests/build are baselines. Later clean workspace install/test/build and API runtime health. Roll back by restoring current backend root and lock. |
| `cloudflare-container-bootstrap/package.json` | Infrastructure adapter manifest, initially unchanged | `KEEP` then `MODIFY` only if adapter boundary changes | Wrangler/container dependency is infrastructure, not domain authority; `@upstash/redis` is declared but not observed in current worker imports. | Preserve Wrangler entrypoints and binding ownership; later Docker/CI contexts must use target web/API paths explicitly. | Wrangler config validation and container build in an isolated approved stage. Roll back current adapter manifest/lock. |
| `cloudflare-container-bootstrap/dexi-frontend/package.json` | `apps/web/package.json` | `KEEP` then `MOVE` later | Current Next 14 app is the public frontend baseline. Existing dependency set covers observed imports. | Next build context, public env, routes, and lockfile path change at move. | Current frontend build passed. Later clean workspace build, route/browser/a11y evidence. Roll back to nested frontend package and lock. |
| `backend/package-lock.json` | Root workspace lockfile after policy approval | `KEEP` as rollback evidence; `DEPRECATE` later | Independent npm v3 lock currently resolves backend. Do not rewrite now. | API reproducibility depends on preserving this until root lock is validated. | Hash/retain current file; compare clean workspace resolution. Roll back by restoring independent API root. |
| `cloudflare-container-bootstrap/package-lock.json` | Root workspace lockfile after policy approval | `KEEP` as rollback evidence; `DEPRECATE` later | Independent npm v3 Cloudflare lock. | Adapter install/release reproducibility must remain available through migration. | Preserve and compare adapter install/build. Roll back current bootstrap root. |
| `cloudflare-container-bootstrap/dexi-frontend/package-lock.json` | Root workspace lockfile after policy approval | `KEEP` as rollback evidence; `DEPRECATE` later | Independent npm v3 frontend lock. | Frontend build reproducibility must remain available until `apps/web` proof. | Preserve and compare Next build. Roll back nested frontend root. |
| Workspace files: none found | Root workspace declaration plus package manifests | `REPLACE` later from absence | No current workspace file exists. | Adds package resolution and script ownership; requires import-cycle and clean-install proof. | Static schema validation plus clean install/build/test. Rollback is no workspace mutation until approval. |

### Public frontend, Admin, and frontend configuration

| Current path | Target path | Action | Rationale / dependencies | Import and deployment impact | Tests / rollback / completion evidence |
|---|---|---|---|---|---|
| `cloudflare-container-bootstrap/dexi-frontend/app` | `apps/web/app` | `MOVE` later | Current public Next source; no source move in foundation stage. | All `@/*` paths, route handlers, public assets, Docker context, API URL, and Cloudflare image inputs change. | Current `npm run build` passed with 19 routes. Later route/browser/console/network/responsive/a11y evidence. Rollback retains nested source until replacement is proven. |
| `cloudflare-container-bootstrap/dexi-frontend/app/dashboard/admin` | `apps/admin/app` | `EXTRACT` later | Current Admin is embedded in public app; target requires a separate role-gated Admin site. | New auth/session/API base URL and deployment surface; old route cannot remain a second canonical control plane. | RBAC/permission/negative tests, Admin browser matrix, audit/reason evidence. Rollback keeps reference route disabled/deprecated only after replacement proof. |
| `cloudflare-container-bootstrap/dexi-frontend/app/components` | `packages/ui/src` and/or `apps/web` | `REVIEW` then `EXTRACT` | Shared UI ownership must be proven; keep server/client boundaries and Deep Liquid Violet authority. | Import aliases and bundle ownership change; Admin may consume only approved client-safe components. | Component/type/build/visual/a11y tests. Rollback retains app-local component imports until consumers pass. |
| `cloudflare-container-bootstrap/dexi-frontend/app/lib/api.ts` | `packages/contracts` types plus `apps/web` API client | `MODIFY` later | Public API client must consume versioned contracts and explicit LIVE/STALE/UNAVAILABLE states; no invented prices. | API base URL, DTO imports, auth handling, and runtime validation change. | Contract tests, mocked state tests, browser network evidence. Rollback current client path. |
| `cloudflare-container-bootstrap/dexi-frontend/app/hooks` | `apps/web/hooks` plus approved shared query package | `REVIEW` then `EXTRACT` | Query/market hooks hold shared ActivePair and market-state behavior. | Consumers include dashboard/Spot/Binary; import graph must avoid Admin coupling. | Unit/contract/browser interaction tests and ActivePair synchronization evidence. |
| `cloudflare-container-bootstrap/dexi-frontend/postcss.config.js` | `apps/web/postcss.config.js` and Admin equivalent if needed | `KEEP` then `MOVE` | Existing Tailwind/PostCSS build input. | Build contexts and CSS pipeline move with app. | Clean web/Admin builds; rollback nested config. |
| `cloudflare-container-bootstrap/dexi-frontend/tailwind.config.ts` | `packages/ui` design config plus app configs | `REVIEW` then `EXTRACT` | Visual tokens require shared ownership without making the UI package server-dependent. | Content globs and generated CSS paths change. | CSS/build/visual/a11y checks; rollback current frontend config. |
| `cloudflare-container-bootstrap/dexi-frontend/next-env.d.ts` | `apps/web/next-env.d.ts` generated artifact | `MOVE` later / regenerate | Next-generated TypeScript references must be regenerated at the target app and not hand-edited. | TypeScript includes change with the Next app root. | Clean Next build regenerates it; rollback by restoring target app source and regenerating. |
| `cloudflare-container-bootstrap/dexi-frontend/tsconfig.json` | `apps/web/tsconfig.json` | `MOVE` later, then `MODIFY` | Strict Next/bundler config with `@/*` root alias. | Alias and `.next/types` paths change; must add internal workspace package references. | `tsc --noEmit`, Next build, import-cycle check. Rollback nested config. |
| `cloudflare-container-bootstrap/dexi-frontend/tsconfig.tsbuildinfo` | No target artifact | `REMOVE LATER` | Generated cache, not hand-authored configuration. | Must not become a committed/migrated authority. | Clean build without relying on cache; rollback is regeneration. |
| `cloudflare-container-bootstrap/dexi-frontend/Dockerfile` | `apps/web/Dockerfile` or approved deployment Docker context | `MOVE` later | Standalone Next image currently builds nested source and defaults API URL to localhost. | Build context, public env, image artifact and health behavior change. | Container build/start/health and browser proof; rollback current Dockerfile. |
| `cloudflare-container-bootstrap/dexi-frontend/.dockerignore` | `apps/web/.dockerignore` | `MOVE` later | Preserve generated/dependency/env exclusions in new context. | Prevents accidental secret/build-context inclusion. | Docker context inspection and image build; rollback current ignore file. |
| Frontend Next config: absent | `apps/web/next.config.*`, Admin equivalent if needed | `REPLACE` from absence later | No explicit Next config currently exists; target needs reviewed runtime headers, API/WebSocket behavior, and deployment settings. | New config can alter routing/security/cache; requires security review. | Config parse, build, browser/network/security checks. Rollback by no config/current behavior. |
| Frontend ESLint config: absent | Shared root ESLint config plus app overrides | `REPLACE` from absence later | `next lint` is interactive today; non-interactive CI gate is missing. | Adds static gate but may surface existing violations. | Non-interactive lint with no writes, CI reproducibility. Rollback by retaining current unconfigured state only during migration. |

### Backend, contracts, persistence, and tests

| Current path | Target path | Action | Rationale / dependencies | Import and deployment impact | Tests / rollback / completion evidence |
|---|---|---|---|---|---|
| `backend/src` | `apps/api/src` | `MOVE` later | Current Nest API source contains domain boundaries plus scaffolds; target API owns authority. | All relative imports, Nest source root, Docker COPY paths, runtime entrypoint and observability wiring change. | Current 13-suite/25-test and build baseline; later clean workspace, API, WS, DB, auth, financial, recovery tests. Rollback current backend root. |
| `backend/src/contracts` | `packages/contracts/src` | `EXTRACT` later | Shared contract authority must be explicit; current contract source is not automatically canonical until normalized. | API/frontend/Admin consumers change from local imports to versioned package exports. | Contract compile/consumer/compatibility tests and evidence index. Rollback current local contracts. |
| `backend/src/authority` | `apps/api/src/authority` plus `packages/domain` interfaces | `REVIEW` then `EXTRACT` | Authority boundaries seed target domain ownership; pure invariants may be shared, runtime providers remain API-owned. | Prevent direct balance rewrites and preserve ledger authority. | Domain invariants, API integration, transaction/idempotency and audit tests. Rollback current authority modules. |
| `backend/prisma/schema.prisma` | `apps/api/prisma/schema.prisma` | `MOVE` later | Current schema is API persistence authority. | Prisma config, migrations, Docker image and environment paths change; no `db push --accept-data-loss` in production. | Schema validation, reviewed migrations, backup/rollback rehearsal, integration tests. Rollback current Prisma root and migration artifact. |
| `backend/prisma.config.ts` | `apps/api/prisma.config.ts` plus `packages/config` inputs | `MOVE` later then `MODIFY` | Current config has a local fallback DATABASE_URL and must become typed/explicit by environment. | Startup/config failure behavior and image build change. | Env schema tests, clean startup failure tests, migration/runtime proof. Rollback current config. |
| `backend/prisma/seed.ts` | `apps/api/prisma/seed.ts` | `MOVE` later | Current default seed entry. | Seed script path and workspace command change. | Non-production-only seed test; rollback current seed. |
| `backend/prisma/seed-real.ts` | `apps/api/prisma/seed-real.ts` | `MOVE` later | Real-data seed must remain explicit and protected. | Data exposure and environment risk; never run by default. | Manual approved sandbox evidence only; rollback via data recovery plan, not reset. |
| `backend/package.json#jest` | `apps/api/jest.config.*` or approved root config | `EXTRACT` later | Embedded Jest config works for current tests but is not a shared workspace contract. | Test discovery/coverage paths change. | Same 13-suite/25-test baseline plus clean workspace run. Rollback embedded config. |
| `backend/test` | `apps/api/test` plus `packages/testing` helpers | `MOVE` later then `EXTRACT` | Current contract/architecture tests are useful baseline; helper ownership must be shared deliberately. | Test imports and coverage paths change. | Current pass baseline, contract/integration/DB/WS/recovery tests. Rollback current test root. |
| `backend/test-wallet.ts` | Isolated API/ledger test tooling | `KEEP MANUAL-ONLY` then `DEPRECATE` | Directly creates users, wallets, balances, and ledger entries; it is not a safe production test or default CI path. | Requires isolated database and explicit test data cleanup/recovery. | Do not run in foundation audit; replace with transactional isolated integration tests before any approved execution. Rollback is non-execution/current file retention. |
| `backend/test/jest-e2e.json` | `apps/api/test/jest-e2e.json` | `REPLACE` from absence | Current `test:e2e` script points to a missing file. | Enables deterministic e2e gate only after DB/API harness exists. | Add config, run e2e in isolated environment, record evidence. Until then remain incomplete. |
| Backend ESLint config: absent | Root/API ESLint config | `REPLACE` from absence later | Current lint command cannot run and includes `--fix`. | CI/static gate becomes non-mutating and reproducible. | `eslint --no-fix` baseline then ratchet; rollback no-config state only before gate. |
| `backend/tsconfig.json` | `apps/api/tsconfig.json` plus workspace references | `MOVE` later then `MODIFY` | Current NodeNext build is non-strict in important areas and emits `dist`. | Internal package resolution and output paths change; strictness ratchet must be staged. | `tsc`/Nest build and tests; rollback current config. |
| `backend/nest-cli.json` | `apps/api/nest-cli.json` | `MOVE` later then `MODIFY` | Current Nest source root is `src` and compiler deletes `dist` before build. | Source-root and output behavior must remain aligned after API move. | Nest build and clean-output check; rollback current CLI config. |
| `backend/Dockerfile` | `apps/api/Dockerfile` | `MOVE` later then `MODIFY` | Current image builds API but runs `prisma db push --accept-data-loss`, which is not an approved production migration strategy. | Image path, startup, migration, health and runtime dependency closure change. | Container build/start/health, reviewed migrations, rollback rehearsal. No production use until changed and reviewed. |
| `backend/.dockerignore` | `apps/api/.dockerignore` | `MOVE` later | Preserve `.env` exclusion and generated-file exclusions. | Prevents secret inclusion in API image. | Context inspection/image build; rollback current ignore. |
| `backend/.env` | Local-only `.env` / committed `.env.example` | `KEEP` local; `REPLACE` template later | Contains sensitive values; never migrate or copy into images. | Config ownership moves to typed environment templates and deployment secret stores. | Key-name/schema checks only; no value output. Rollback local file unchanged. |

### Cloudflare/container and operational files

| Current path | Target path | Action | Rationale / dependencies | Import and deployment impact | Tests / rollback / completion evidence |
|---|---|---|---|---|---|
| `cloudflare-container-bootstrap/src/index.js` | Infrastructure Cloudflare adapter path; app routes remain API-owned | `KEEP` then `MODIFY` later | Worker currently contains health, synthetic binary config/tick and WebSocket behavior; it must not become financial/domain authority. | Binding names, container delegation, API routes and runtime evidence need reconciliation. | Wrangler static validation plus live/read-only runtime and browser/network proof; rollback current worker source/config. |
| `cloudflare-container-bootstrap/wrangler.jsonc` | Approved infrastructure config | `KEEP` then `MODIFY` later | Current container/DO image and migration identity are deployment-sensitive. | Image, class, binding, migration, account and environment changes require deployment approval. | Parse/static validation, isolated dry-run if approved, live deployment proof only under separate approval. Rollback prior config/image/migration plan. |
| `cloudflare-container-bootstrap/wrangler.worker-only.jsonc` | Approved worker-only environment config | `KEEP` then `MODIFY` later | Separate worker variant must not be conflated with container runtime. | Route/binding/runtime behavior changes by environment. | Static config and environment-specific runtime checks; rollback current worker-only config. |
| `cloudflare-container-bootstrap/Dockerfile` | Approved web/container image context | `MOVE` later | Current Dockerfile builds nested public frontend only. | Context changes when web moves; container image identity and health change. | Build/start/health/browser checks; rollback current image source. |
| `cloudflare-container-bootstrap/Dockerfile.unified` | Deprecated or redesigned multi-surface image path | `REVIEW` then `DEPRECATE` or `MODIFY` | It combines API/web, installs PM2 globally, exposes two ports, and copies `backend/.env`. | High deployment and secret risk; conflicts with three deployable surfaces. | Security/container review, no production use until fixed; rollback current file without promoting it. |
| `cloudflare-container-bootstrap/nginx.conf` | Approved edge adapter config | `KEEP` then `MODIFY` | Proxy/Socket.IO/health behavior is infrastructure; current bot redirect/stealth behavior needs explicit security/product approval. | Headers, routing, caching, WebSocket and health evidence change. | Config/security review, container/browser/network checks; rollback current config. |
| `cloudflare-container-bootstrap/server.js` | Test/bootstrap-only adapter | `KEEP` or `DEPRECATE` | Port-8080 JSON bootstrap is not API authority. | Do not advertise as backend runtime. | Explicit smoke test only; rollback by retaining current file. |
| `cloudflare-container-bootstrap/docker-wrangler-wrapper.sh` | Windows-native operational replacement or isolated tooling | `REVIEW` then `DEPRECATE` | Uses WSL path assumptions while current platform policy is Windows ARM64 without WSL2. | May fail local operator workflows; no production dependency should rely on it. | Windows-native command checks; rollback current wrapper. |
| `backend/scripts/reset-db.ts` | Isolated test tooling only | `DEPRECATE` / manual-only | Destructive reset is not part of production execution. | Must never be CI/default/startup dependency. | Static review and explicit sandbox-only test; no execution in this foundation task. |
| `backend/scripts/seed-real.ts` | Isolated approved data tooling | `KEEP` manual-only | External/real data mutation risk. | Must be environment-gated and audited. | Approved sandbox evidence only; rollback through recovery plan. |
| `backend/scripts/dexixz_api_dump.py` | Research/data tooling outside workspace runtime | `KEEP` isolated | Not a production application dependency. | No deployment impact if excluded from images. | Static ownership check; no execution required. |
| `backend/scripts/dexixz_client.py` | Research/data tooling outside workspace runtime | `KEEP` isolated | Not a production application dependency. | No deployment impact if excluded from images. | Static ownership check; no execution required. |
| `.codex/scripts/nexi-env-start.ps1` | Codex/project operations | `KEEP OUTSIDE PRODUCT` | Local diagnostic; not an app package. | No product deployment impact. | File/config presence only; rollback current script. |
| `.codex/scripts/nexi-normalize-skills.ps1` | Codex/project operations | `KEEP MANUAL-ONLY` | Moves files into quarantine and is outside this task. | No product deployment impact; must not be invoked by foundation audit. | Not run; completion evidence is explicit non-execution. |
| `.codex/scripts/superpowers-verify.ps1` | Codex/project operations | `KEEP OUTSIDE PRODUCT` | Harness verification wrapper. | No product runtime impact. | Separate harness verification evidence only. |
| `.codex/scripts/verify-superpowers-codex-port.ps1` | Codex/project operations | `KEEP OUTSIDE PRODUCT` | Writes governance evidence, not product artifacts. | No product deployment impact. | Separate report if intentionally run; not product completion evidence. |
| CI files: none found | Root CI workflow and staged gates | `REPLACE` from absence later | Required quality gates have no current automation. | Adds clean install, format/lint/type/unit/integration/contract/migration/build/browser/security/artifact/release gates. | CI runs from clean workspace; rollback is retaining local-only baseline until approved. |

## Approval-gated dependency list

The only current-source-backed package actions are listed below. This list is not an install command and must be approved before any manifest or lockfile edit.

| Package/action | Current evidence | Proposed change | Status |
|---|---|---|---|
| `@jest/globals` | Direct test import; missing direct backend declaration; current lock/install contains it transitively. | Add to backend dev dependencies at a reviewed Jest-compatible version. | `PENDING APPROVAL` |
| `@prisma/client` | Backend runtime imports; declared in backend dev dependencies. | Reclassify under backend production dependencies before API production packaging. | `PENDING APPROVAL` |
| `pm2` | Globally installed in unified Dockerfile, absent from manifests. | Decide deterministic supervisor strategy or deprecate unified image. | `PENDING ARCHITECTURE/DEPLOYMENT DECISION` |
| Internal packages | All seven target package directories absent. | Create only after package ownership/import maps and workspace policy are approved. | `PENDING WORKSPACE APPROVAL` |

No other external package is justified by the current direct import scan. Runtime validation, observability, Admin, and UI libraries not already evidenced are intentionally deferred rather than guessed.

## Current verification record

| Check | Result | Evidence / limitation |
|---|---|---|
| Direct manifest/config/script inventory | Pass | `work/20260727-foundation-audit/FOUNDATION_AUDIT.md`; no workspace or CI files found. |
| Backend unit/contract baseline | Pass | `npm test -- --runInBand`: 13 suites and 25 tests passed; ts-jest emitted TS151002 warnings. |
| Backend build baseline | Pass | `npm run build` exited 0. |
| Frontend production build baseline | Pass | `npm run build` exited 0; 19 generated routes; Browserslist staleness and two client-side-rendering deopt warnings remain. |
| Backend lint | Blocked | No ESLint config; read-only invocation exited 1. The package script includes `--fix`. |
| Frontend lint | Blocked/unconfigured | `next lint` opens first-run ESLint configuration prompt. |
| Browser/runtime baseline | Unverified | No browser interaction, live API/WS, Cloudflare, container, deployment, or health evidence was performed. |
| Codebase Memory Pro | Unavailable for exact trace | Returned project not found/not indexed; no reindex started. |
| Graphify | Unavailable for indexed context | No project graph present; no update/reindex started. |

## Completion and rollback gates

This foundation plan is complete as a plan when the audit and baselines above are accepted. It is not implementation completion. Before any source move or package mutation, require:

1. Human approval of npm workspace/lockfile policy and the candidate dependency list.
2. An import/package/ownership map for each target package.
3. A reviewed Prisma migration and rollback strategy; never promote `db push --accept-data-loss` as production migration policy.
4. Separate API, web, Admin, Cloudflare/container, contracts, and browser/runtime acceptance commands.
5. Non-mutating lint/CI configuration and a missing e2e configuration decision.
6. Fresh clean-install, type, unit, integration, contract, build, container, runtime, browser, security, review, and claim-verification evidence.

Until those gates pass, the exact rollback is to leave all current roots and lockfiles in place and use this ledger as the migration boundary.

## Consolidated frontend + Stitch visual pack addendum — 2026-07-27

This addendum continues the existing frontend plan; it does not restart discovery, repeat the foundation audit, or authorize source movement. The visual phase produced a same-project Stitch pack for the interaction chain `Quotes Hub → Asset Detail → Spot / Options-Binary`, plus Wallet and navigation/localization states.

| Work packet | Existing authority / target | Action now | Dependencies and import impact | Deployment impact | Tests / rollback / completion evidence |
|---|---|---|---|---|---|
| Dashboard navigation states | Existing approved Dashboard; future shell components in `apps/web` | VISUALIZE ONLY | Source currently lacks the final drawer/locale shell; no imports changed | None; no source or runtime files changed | Full-resolution Stitch inspection; rollback by retaining current source and visual registry |
| Asset Detail | Future `/dashboard/asset/[symbol]`, shared `ActiveInstrument` | VISUALIZE ONLY | Existing Dashboard rows still route directly to Spot; implementation must later add child route/state without changing backend authority | None | Accepted mobile/desktop Stitch frames; user review is the gate |
| Spot | Existing Spot page and target professional execution layout | VISUALIZE ONLY | Shared instrument state and normalized market/order contracts remain prerequisites | None | Accepted mobile/desktop frames; no package or manifest mutation |
| Options/Binary | Existing Binary page; target Long/Short contract | VISUALIZE ONLY | Existing source still exposes CALL/PUT backend values; later adapter maps LONG→UP and SHORT→DOWN | None | Accepted mobile/desktop frames; no source mutation |
| Wallet | Existing Wallet page; target asset-center flow | VISUALIZE ONLY | Existing source contains a Safe Vault/APR visual claim that must not be carried into implementation without authoritative data | None | Accepted mobile/desktop frames with safe placeholders and complete domain tabs |
| Reference registry/catalog | `docs/design/reference/README.md`, `docs/frontend/NEXI_STITCH_VISUAL_SCREEN_CATALOG.md` | EXPORT + DOCUMENT | Repository-local visual references only; no application imports | None | SHA-256 recorded; source/runtime status kept separate |
| Fidelity ledger | `work/20260727-nexi-stitch-visual-pack/NEXI_STITCH_FIDELITY_LEDGER.md` | RECORD EVIDENCE | Child and provider limitations remain explicit | None | Valid bounded evidence ledger; risk child incomplete and no runtime/browser claim |

Exported visual artifacts are the named `NEXI_*_APPROVED_TARGET.png` files under `docs/design/reference/`. They are APPROVED TARGET concepts for user review, not implementation completion or production truth. No application source, manifest, dependency, lockfile, runtime configuration, deployment, credential, or production state was changed in this visual phase.
