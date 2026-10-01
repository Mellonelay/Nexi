# NEXI Cloudflare Production Runtime Configuration Inventory

**Status:** Dated read-only production configuration snapshot; rediscover Cloudflare before operations
**Snapshot captured:** 2026-09-26 (UTC)
**GitHub/source HEAD at capture:** `696b6929e26dfc9bc71e2a5f229eceebe93fa1d6`
**Active Worker:** `nexi-production`
**Active Worker version:** `2ef838f5-f96a-4f48-99e2-db9d80dbc0b4`
**Active deployment:** `f41876b3-e8dd-4bf0-8043-61a81ecbb86f`
**Production API custom domain:** `api.nexitrading.app`

> Surviving Cloudflare resources containing `staging` are historical identifiers used by production. There is no active staging environment and no `staging.nexitrading.app` authority.

## Canonical host / DNS authority

| Type | Name | Content | Proxied | Role |
|---|---|---|---|---|
| `A` | `admin.nexitrading.app` | `35.187.234.62` | `true` | Admin origin |
| `A` | `app.nexitrading.app` | `192.0.2.0` | `true` | Legacy redirect host |
| `A` | `nexitrading.app` | `192.0.2.0` | `true` | Apex redirect host |
| `A` | `www.nexitrading.app` | `35.187.234.62` | `true` | Canonical Public origin |
| `AAAA` | `api.nexitrading.app` | `100::` | `true` | Worker custom domain |

- No wildcard DNS record is currently present.
- Canonical Public: `https://www.nexitrading.app`.
- Legacy `app.nexitrading.app` and apex are redirect/compatibility hosts, not Public authority.
- Admin: `https://admin.nexitrading.app`.
- API: `https://api.nexitrading.app`.

## Worker and Container identity

- Worker name: `nexi-production`
- Compatibility date: `2026-08-19`
- Compatibility flag: `nodejs_compat`
- Container application: `nexi-api-staging` (historical name, production resource)
- Container application ID: `a032bee7-a0c3-4185-84f9-8bc738892171`
- Container application state: `active`
- Container image: `registry.cloudflare.com/95f40eab0f2ba20aff96f8979e45ab71/nexi-api-staging@sha256:d6abb1500d6331403b39e7c9f7812e466074fddee08c93aa7ac788731ae5fadb`
- Container version: `76`
- Running instance: `nexi-api` / `fde387823556b436138bfeac1a031e123de318c86639a5114b2520a8a717298a` / `running` / `sin21` / version `76`

## Binding count by type

| Type | Count |
|---|---:|
| `analytics_engine` | 1 |
| `d1` | 1 |
| `durable_object_namespace` | 1 |
| `kv_namespace` | 1 |
| `plain_text` | 23 |
| `queue` | 3 |
| `r2_bucket` | 1 |
| `ratelimit` | 1 |
| `secret_text` | 5 |
| `secrets_store_secret` | 1 |
| `workflow` | 3 |
| **TOTAL** | **41** |

## All live Worker bindings

| # | Binding | Type | Live value/resource |
|---:|---|---|---|
| 1 | `CORE_DB` | `d1` | database `522177fa-ac42-4d8f-a6a8-b34eed262f15` |
| 2 | `CORS_ORIGINS` | `plain_text` | `https://www.nexitrading.app,https://admin.nexitrading.app` |
| 3 | `D1_BRIDGE_ENABLED` | `plain_text` | `true` |
| 4 | `D1_BRIDGE_HOST` | `plain_text` | `nexi-core-d1` |
| 5 | `D1_RUNTIME_ENABLED` | `plain_text` | `true` |
| 6 | `DEPOSIT_PROOFS` | `r2_bucket` | bucket `nexi-deposit-proofs-staging` |
| 7 | `DOMAIN_EVENTS_QUEUE` | `queue` | queue `nexi-domain-events-staging` |
| 8 | `INTEGRATION_JOBS_QUEUE` | `queue` | queue `nexi-integration-jobs-staging` |
| 9 | `JWT_SECRET` | `secret_text` | encrypted Worker secret (value omitted) |
| 10 | `LOAN_WORKFLOW` | `workflow` | workflow `nexi-loan-staging`, class `NexiLoanWorkflow` |
| 11 | `MARKET_BACKFILL_ON_STARTUP` | `plain_text` | `false` |
| 12 | `MARKET_PROVIDER_ENABLED` | `plain_text` | `true` |
| 13 | `MARKET_PROVIDER_NAME` | `plain_text` | `binance-spot` |
| 14 | `MARKET_PROVIDER_NAMES` | `plain_text` | `binance-spot` |
| 15 | `MARKET_PROVIDER_POLL_INTERVAL_MS` | `plain_text` | `5000` |
| 16 | `MARKET_PROVIDER_SYMBOLS` | `plain_text` | `canonical_crypto` |
| 17 | `MARKET_QUOTE_STALE_AFTER_MS` | `plain_text` | `30000` |
| 18 | `MINING_WORKFLOW` | `workflow` | workflow `nexi-mining-staging`, class `NexiMiningWorkflow` |
| 19 | `NEXI_ANALYTICS` | `analytics_engine` | dataset `nexi_runtime_staging` |
| 20 | `NEXI_API_CONTAINER` | `durable_object_namespace` | class `NexiApiContainer`, namespace `01e64561d5874d4291994a3c4df769dd` |
| 21 | `NEXI_AUTH_RATE_LIMITER` | `ratelimit` | namespace `2026082801`, `30` requests/`60s` |
| 22 | `NEXI_B7_ENABLED` | `plain_text` | `false` |
| 23 | `NEXI_CONFIG` | `kv_namespace` | namespace `bc9f4b8c2cca4fbfac94e1ba47339fe1` |
| 24 | `NEXI_CONVERSION_QUOTE_TTL_MS` | `plain_text` | `30000` |
| 25 | `NEXI_MARKET_STALE_AFTER_MS` | `plain_text` | `30000` |
| 26 | `NEXI_PLATFORM_VALIDATION` | `secrets_store_secret` | store `b4e4124ef4134d7a94e1e7f97e93b73c`, secret `NEXI_PLATFORM_VALIDATION` |
| 27 | `NEXI_SCHEDULER_ENABLED` | `plain_text` | `true` |
| 28 | `NODE_ENV` | `plain_text` | `production` |
| 29 | `NOTIFICATIONS_QUEUE` | `queue` | queue `nexi-notifications-staging` |
| 30 | `OBSERVE_APP_KEY` | `secret_text` | encrypted Worker secret (value omitted) |
| 31 | `OBSERVE_APP_SECRET` | `secret_text` | encrypted Worker secret (value omitted) |
| 32 | `PORT` | `plain_text` | `3000` |
| 33 | `QUEUE_BRIDGE_HOST` | `plain_text` | `nexi.queue` |
| 34 | `REDIS_URL` | `secret_text` | encrypted Worker secret (value omitted) |
| 35 | `SENTRY_DSN` | `secret_text` | encrypted Worker secret (value omitted) |
| 36 | `SENTRY_ENVIRONMENT` | `plain_text` | `production` |
| 37 | `SENTRY_RELEASE` | `plain_text` | `ed26973fe0556a6d75943b3e296be0a899449d6d` |
| 38 | `WALLET_AUTH_DOMAIN` | `plain_text` | `www.nexitrading.app` |
| 39 | `WALLET_AUTH_SUPPORTED_CHAIN_IDS` | `plain_text` | `1` |
| 40 | `WALLET_AUTH_URI` | `plain_text` | `https://www.nexitrading.app` |
| 41 | `WITHDRAWAL_WORKFLOW` | `workflow` | workflow `nexi-withdrawal-staging`, class `NexiWithdrawalWorkflow` |

## Plain-text environment variables

Count: **23**

| Variable | Live value |
|---|---|
| `CORS_ORIGINS` | `https://www.nexitrading.app,https://admin.nexitrading.app` |
| `D1_BRIDGE_ENABLED` | `true` |
| `D1_BRIDGE_HOST` | `nexi-core-d1` |
| `D1_RUNTIME_ENABLED` | `true` |
| `MARKET_BACKFILL_ON_STARTUP` | `false` |
| `MARKET_PROVIDER_ENABLED` | `true` |
| `MARKET_PROVIDER_NAME` | `binance-spot` |
| `MARKET_PROVIDER_NAMES` | `binance-spot` |
| `MARKET_PROVIDER_POLL_INTERVAL_MS` | `5000` |
| `MARKET_PROVIDER_SYMBOLS` | `canonical_crypto` |
| `MARKET_QUOTE_STALE_AFTER_MS` | `30000` |
| `NEXI_B7_ENABLED` | `false` |
| `NEXI_CONVERSION_QUOTE_TTL_MS` | `30000` |
| `NEXI_MARKET_STALE_AFTER_MS` | `30000` |
| `NEXI_SCHEDULER_ENABLED` | `true` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `QUEUE_BRIDGE_HOST` | `nexi.queue` |
| `SENTRY_ENVIRONMENT` | `production` |
| `SENTRY_RELEASE` | `ed26973fe0556a6d75943b3e296be0a899449d6d` |
| `WALLET_AUTH_DOMAIN` | `www.nexitrading.app` |
| `WALLET_AUTH_SUPPORTED_CHAIN_IDS` | `1` |
| `WALLET_AUTH_URI` | `https://www.nexitrading.app` |

## Worker secrets

Count: **5**. Names only; values are intentionally not recorded.

- `JWT_SECRET`
- `OBSERVE_APP_KEY`
- `OBSERVE_APP_SECRET`
- `REDIS_URL`
- `SENTRY_DSN`

## Source configuration alignment

- Source Worker name: `nexi-production`.
- Source custom domain: `api.nexitrading.app`.
- Source canonical Public CORS/SIWE origin: `https://www.nexitrading.app`.
- Source required secret set matches the five live secret bindings listed above.
- Source contains no active market-archive Pipeline bindings or `MARKET_ARCHIVE_PIPELINE_TOKEN` requirement.
- `SENTRY_RELEASE` is deployment identity, not durable source authority; this source snapshot is aligned to deployed backend generation `ed26973fe0556a6d75943b3e296be0a899449d6d` and must be set to the exact revision on a future deployment.

## Current official Cloudflare references

- Wrangler commands: `https://developers.cloudflare.com/workers/wrangler/commands`
- Versions and deployments: `https://developers.cloudflare.com/workers/versions-and-deployments/`
- Wrangler configuration and bindings: `https://developers.cloudflare.com/workers/wrangler/configuration`
- DNS: `https://developers.cloudflare.com/dns/`
- Rules / redirects: `https://developers.cloudflare.com/rules/`
- Containers: `https://developers.cloudflare.com/containers/`

## Appendix A — Backend authority-convergence provenance

This appendix preserves durable evidence from the 2026-09-17 transition so later sessions do not have to reconstruct it from chat history. It is evidence/provenance, not a second runtime authority.

### Authority cleanup commit

Commit `7a47e77b3dbae9b4e4679d96aaad325ed44eeb43` (`authority: make Cloudflare backend runtime canonical`) changed exactly **56 tracked paths**, with **628 insertions** and **5,642 deletions**.

Modified current authority/operator/source files:
- `.devcontainer/scripts/setup.sh`
- `AGENTS.md`
- `NEXI_CURRENT_STATE.md`
- `NEXI_PRODUCTION_COMPLETION_LEDGER.md`
- `apps/admin/AGENTS.md`
- `backend/AGENTS.md`
- `backend/Dockerfile`
- `backend/prisma.config.ts`
- `backend/src/d1/d1-worker-bridge.service.ts`
- `backend/src/market/market-ingest.service.ts`
- `backend/src/market/market-seeder.service.ts`
- `backend/test/d1/d1-financial-command.gateway.spec.ts`
- `docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md`
- `docs/backend/NEXI_MARKET_PROVIDER_AND_SETTLEMENT_AUTHORITY.md`
- `docs/infrastructure/NEXI_CLOUDFLARE_ENVIRONMENT_CONTRACT.md`
- `docs/operations/NEXI_G1_CONTRACT_SPINE_CURRENT.md`
New files added by that convergence commit:
- `docs/infrastructure/NEXI_CLOUDFLARE_BACKEND_OPERATOR_RUNBOOK.md`
- `docs/operations/NEXI_CAPABILITY_ROUTING.md`
- `/home/mellonelay1999/.agents/GLOBAL_CAPABILITY_INDEX.md`
- `/home/mellonelay1999/.agents/GLOBAL_CLI_CATALOG.md`
- `/home/mellonelay1999/.agents/GLOBAL_MCP_CATALOG.md`

Stale current-looking authority/architecture files removed:
- `CLOUDFLARE_DOC_ALIGNMENT.md`
- `CLOUDFLARE_SECRET_MAPPING.md`
- `NEXI_CLOUDFLARE_BACKEND_ARCHITECTURE_DECISION_20260823.md`
- `docs/backend/NEXI_BACKEND_AUTHORITY_PROGRAM.md`
- `docs/backend/NEXI_BACKEND_RUNTIME_REQUIREMENTS.md`
- `docs/implementation/NEXI_FILE_BY_FILE_EXECUTION_PLAN.md`
- `docs/implementation/NEXI_MASTER_IMPLEMENTATION_ROADMAP.md`
- `docs/implementation/NEXI_PARALLEL_FRONTEND_BACKEND_CLOUDFLARE_EXECUTION_PLAN.md`
- `docs/infrastructure/NEXI_LOCAL_DEVELOPMENT_AND_SERVICES.md`
- `docs/infrastructure/NEXI_PLATFORM_AND_ENVIRONMENT_PROGRAM.md`
- `docs/operations/NEXI_PREPRODUCTION_RECOVERY_RUNBOOK.md`
- `docs/operations/SG_EDGE_01_RUNTIME_WORKER_CONTRACT.md`
- `docs/superpowers/plans/2026-08-17-authority-first-production-data-architecture.md`
- `docs/superpowers/specs/2026-08-17-authority-first-production-data-architecture-design.md`

These deletions removed stale executable-looking authority, not Git history; every deleted file remains recoverable from the parent commit.
### Retired non-D1 Prisma migration tree

The old `backend/prisma/migrations/` tree was removed from active authority. Exact removed migration files:
- `20260120000053_init/migration.sql`
- `20260801223000_add_auth_sessions/migration.sql`
- `20260802050000_reconcile_current_source_baseline/migration.sql`
- `20260802123000_gate1_core_domains/migration.sql`
- `20260802150000_gate2_financial_authority/migration.sql`
- `20260802170000_gate2_correction_authority/migration.sql`
- `20260802193000_b7_decimal_authority/migration.sql`
- `20260802210000_b8_communications_content/migration.sql`
- `20260802223000_b9_admin_governance/migration.sql`
- `20260803010000_admin_role_authority/migration.sql`
- `20260804010000_b9_incidents_maintenance/migration.sql`
- `20260805100000_wallet_native_identity/migration.sql`
- `20260806143000_approach_a_market_activity_learn/migration.sql`
- `20260806220000_reconcile_isolated_margin_schema/migration.sql`
- `20260810120000_reconcile_binary_duration_allowlist/migration.sql`
- `20260810130000_add_reward_repayment_lineage/migration.sql`
- `20260817153000_add_event_outbox/migration.sql`
- `20260818090000_add_market_depth_trade_provider_registry_and_user_preferences/migration.sql`
- `20260819120000_add_manual_deposit_claims/migration.sql`
- `20260825160000_align_binary_durations/migration.sql`
- `20260825170000_binary_win_loss_public_user_code/migration.sql`
Active migration/schema authority remains:
- `backend/prisma/migrations-d1/`
- `backend/prisma/schema.d1.prisma`

The D1 migration set previously verified contained `0001` through `0007`, and remote D1 reported `No migrations to apply` during convergence.

### Source-equality and validation evidence

The one-time backend convergence proved:
- GitHub `main@81baa15f82901f26405cfd378f7e0f5fe31b693e` matched `origin/main` at recovery.
- Backend tracked source from deployed baseline `3b173ea...` through `81baa15...` had no committed backend diff.
- Running Cloudflare Container `/app/package.json` and `/app/package-lock.json` hashes matched GitHub backend manifests.
- A clean GitHub-source build produced **170 backend JavaScript artifacts** and all **170/170** matched the running Cloudflare Container byte-for-byte.
- The Container had 10 additional deterministic generated Prisma D1-client JavaScript artifacts from the image build/generation path.
- Three VM-only asynchronous source edits lacked GitHub/Cloudflare provenance and runtime proof, so they were not promoted into authority.

Focused validation after the authority cleanup:
- backend build: **PASS**
- D1 financial-command test: **17/17 PASS**
- `git diff --check`: **PASS**
- active Cloudflare config: `CORE_DB` D1 binding, `D1_RUNTIME_ENABLED=true`, `D1_BRIDGE_ENABLED=true`
- backend datastore adapter: `@prisma/adapter-d1`
### Prisma `postgres` package clarification

`backend/package-lock.json` still contains `postgres@3.4.7`, but `npm explain postgres` established that it is transitive under the Prisma CLI:

```text
prisma@7.3.0
└── postgres@3.4.7
```

NEXI does not import that package as its datastore adapter. Its presence in the lockfile is not PostgreSQL application/financial authority and was not removed blindly.

### Graph/static evidence

Graphify was refreshed after the authority cleanup. The first post-cleanup rebuild produced **7,604 nodes / 16,314 edges**. A later current graph after the production-resource documentation updates contained **7,694 nodes** and showed the expected structural path around `NexiApiContainer`, D1 financial command authority, Ledger, EventOutbox, Queue/Workflow, Public/Admin, and `MarketArchiveService -> MarketReferencePersistenceService -> Pipeline`.

Graph evidence is structural/topological only; it is not runtime proof.

## Appendix B — Runtime/operator proof preserved from the transition

Verified operator/tooling state during the transition included Wrangler `4.129.0`, Graphify `0.9.62`, Git/GitHub CLI, Aiven CLI, Redis CLI, Sentry tooling, and `rsync`. Mutable versions must still be rediscovered live before consequential use.

Cloudflare Container SSH was proven with the existing `nexi-codex-staging-20260911` identity through Wrangler/OpenSSH ProxyCommand. Direct live observation returned:

```text
hostname = cloudchamber
cwd = /
Node = v24.21.0
PID 1 = node dist/src/main.js
```
Fresh production HTTP checks returned:
- `/health` → `200`
- `/healthz` → `200`
- `/readyz` → `200`, with D1 database and Redis/Valkey readiness
- `/market/provider-state` → `200`
- `/market/prices` → `200`

The correct Container lookup sequence was also established:
1. `wrangler containers list ...` → obtain Container application ID.
2. `wrangler containers instances <APPLICATION_ID> ...` → obtain running instance ID.
3. `wrangler containers ssh <INSTANCE_ID> ...` → connect to the exact running instance.

`wrangler containers instances` expects the application ID, not the display name. Application ID and instance ID are distinct identifiers.

### Wrangler execution guard learned during validation

A bare `npx wrangler` call fetched Wrangler `4.133.0` when the repository-local binary was absent. That introduced an unintended operator-version change and failed on missing local dependencies. The durable rule is therefore:
- use `npx --no-install wrangler` only when the repo-local binary is present;
- otherwise use the explicitly verified installed `wrangler` binary; or
- use a deliberately version-pinned isolated validation environment.

A later read-only dry-run with verified Wrangler `4.129.0` and `--containers-rollout none` passed. It reported **46 non-secret bindings**, matching the live Worker exactly; the four live-only names were the expected secret bindings omitted from dry-run display.

No deploy, rollback, secret mutation, D1 write/migration, Queue purge/config change, Workflow trigger/termination, R2 mutation, Pipeline mutation, or Container restart was performed as part of these proofs.
## Appendix C — Knowledge-source chronology and authority classification

Three files were fully reread during the transition to preserve useful lineage without letting older state override current truth:

- `NEXI_PRODUCTION_COMPLETION_LEDGER.docx` — Sep-15 historical snapshot. It already established NestJS business authority, D1 durable application/financial truth, Ledger accounting truth, EventOutbox publication boundary, Aiven Valkey realtime/cache, Cloudflare Worker edge, and Cloudflare Container + NestJS business runtime. It is historical evidence, not the current controller.
- `NEXI_PRODUCTION_COMPLETION_LEDGER.md` — Sep-17 current completion controller. It adds the Cloudflare-only backend runtime model, source-vs-deployment distinction, one-time GitHub/Cloudflare equality proof, and VM runtime retirement.
- `NEXI_ASTRA_FRONTEND_BINDING_MANIFEST.md` — explicitly marked `HISTORICAL FRONTEND-BINDING LINEAGE — NOT ACTIVE ROUTING AUTHORITY`. It remains useful for frontend topology/contracts: 11 Public routes, shared API client, Active Pair ownership, market/realtime hooks, Spot/Margin, Options/Binary, Wallet/SIWE, 53 canonical assets, five mobile tabs, two-stage Deposit, responsive targets, and browser responsibility split.

The Sep-15 DOCX proves the D1/Cloudflare production model pre-dated the Sep-17 authority transition. The Sep-17 Markdown ledger outranks it for present state.

## Appendix D — Commit chain for this bounded transition

- `7a47e77b3dbae9b4e4679d96aaad325ed44eeb43` — authority cleanup: Cloudflare backend runtime canonical, legacy non-D1 authority removed.
- `dba195ed2bd9fb528b276afab70ed9a7f7b58e46` — production Cloudflare resource identity, Sentry production environment alignment, Pipelines/live-runtime evidence, Wrangler guard.
- `7a0f66831bed4bf7f6a147a9e52a62ccb4eb5ed9` — complete read-only production Cloudflare configuration inventory and operator-runbook pointer.

The current GitHub source frontier must always be discovered live rather than inferred from these historical transition commits.

### Scope protection

Unrelated frontend/recovery working-tree changes were deliberately excluded from the authority/configuration commits. Their transient dirty-file list is not frozen into this current-state document because `DISCOVER STATE; DO NOT MEMORIALIZE STATE` applies; use live `git status` if that state matters.
### Change-size interpretation for `7a47e77`

The large deletion count was primarily stale documentation and the retired non-D1 migration tree, not a backend domain rewrite. In particular, `docs/implementation/NEXI_MASTER_IMPLEMENTATION_ROADMAP.md` contributed about 2,197 deleted lines and the retired Cloudflare architecture decision contributed about 328 deleted lines.

The backend source edits in `backend/Dockerfile`, `backend/prisma.config.ts`, `backend/src/d1/d1-worker-bridge.service.ts`, `backend/src/market/market-ingest.service.ts`, `backend/src/market/market-seeder.service.ts`, and `backend/test/d1/d1-financial-command.gateway.spec.ts` were bounded terminology/authority cleanups rather than domain reimplementation.
