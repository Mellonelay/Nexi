# NEXI Cloudflare Production Runtime Configuration Inventory

**Status:** CURRENT read-only production configuration reference
**As of:** 2026-09-17 (Myanmar time)
**GitHub/source HEAD at capture:** `dba195ed2bd9fb528b276afab70ed9a7f7b58e46`
**Active Worker version:** `be954c93-2661-4c6b-9943-eb038fd42820` (version number `130`)
**Production API route:** `api.nexitrading.app`

> Cloudflare resources still containing `staging` are historical names. They are the currently active production resources. Do not infer environment from the name suffix.

## Worker and Container identity

- Worker name: `nexi-staging`
- Production route: `api.nexitrading.app`
- Active deployment version ID: `be954c93-2661-4c6b-9943-eb038fd42820`
- Worker version number: `130`
- Compatibility date (live): `2026-08-19`
- Compatibility flags (live): `nodejs_compat`
- Container application: `nexi-api-staging`
- Container application ID: `a032bee7-a0c3-4185-84f9-8bc738892171`
- Container application state: `active`
- Container image: `registry.cloudflare.com/95f40eab0f2ba20aff96f8979e45ab71/nexi-api-staging@sha256:32d56199f37eeed20ed524f7242c120a6184a3a829172d686084d25de2d232c5`
- Container version: `58`
- Running instance name: `nexi-api`
- Running instance ID: `fde387823556b436138bfeac1a031e123de318c86639a5114b2520a8a717298a`
- Running instance state: `running`
- Running instance location: `sin21`
- Running instance version: `58`
- Screenshot-observed allocation: `1024 MiB memory`, `1/4 vCPU`, `4000 MB disk`

## Source Container settings

- Class name: `NexiApiContainer`
- Application name: `nexi-api-staging`
- Image/Dockerfile: `../backend/Dockerfile`
- Build context: `../backend`
- Instance type: `basic`
- Maximum concurrent instances: `1`
- SSH: `enabled=true`
- Authorized public-key entries: **4**
- Source compatibility date: `2026-08-19`
- D1 migrations directory: `../backend/prisma/migrations-d1`
- Observability: `enabled=true`
  - `mellonelay-codex-runtime`
  - `mellonelay-operator`
  - `nexi-cloudflare-staging-20260909`
  - `nexi-codex-staging-20260911`

## Binding count by type

| Type | Count |
|---|---:|
| `analytics_engine` | 1 |
| `d1` | 1 |
| `durable_object_namespace` | 1 |
| `kv_namespace` | 1 |
| `pipelines` | 2 |
| `plain_text` | 30 |
| `queue` | 3 |
| `r2_bucket` | 2 |
| `ratelimit` | 1 |
| `secret_text` | 4 |
| `secrets_store_secret` | 1 |
| `workflow` | 3 |
| **TOTAL** | **50** |

## All 50 live Worker bindings

| # | Binding | Type | Live value/resource |
|---:|---|---|---|
| 1 | `CORE_DB` | `d1` | database `522177fa-ac42-4d8f-a6a8-b34eed262f15` |
| 2 | `CORS_ORIGINS` | `plain_text` | `https://app.nexitrading.app,https://admin.nexitrading.app` |
| 3 | `D1_BRIDGE_ENABLED` | `plain_text` | `true` |
| 4 | `D1_BRIDGE_HOST` | `plain_text` | `nexi-core-d1` |
| 5 | `D1_RUNTIME_ENABLED` | `plain_text` | `true` |
| 6 | `DEPOSIT_PROOFS` | `r2_bucket` | bucket `nexi-deposit-proofs-staging` |
| 7 | `DOMAIN_EVENTS_QUEUE` | `queue` | queue `nexi-domain-events-staging` |
| 8 | `INTEGRATION_JOBS_QUEUE` | `queue` | queue `nexi-integration-jobs-staging` |
| 9 | `JWT_SECRET` | `secret_text` | encrypted Worker secret (value omitted) |
| 10 | `LOAN_WORKFLOW` | `workflow` | workflow `nexi-loan-staging`, class `NexiLoanWorkflow` |
| 11 | `MARKET_ARCHIVE` | `r2_bucket` | bucket `nexi-market-archive-staging` |
| 12 | `MARKET_ARCHIVE_CHECKPOINT_CONFIRMED` | `plain_text` | `false` |
| 13 | `MARKET_ARCHIVE_PIPELINE_FORMAT` | `plain_text` | `structured` |
| 14 | `MARKET_ARCHIVE_PIPELINE_TOKEN` | `secret_text` | encrypted Worker secret (value omitted) |
| 15 | `MARKET_ARCHIVE_PIPELINE_URL` | `plain_text` | `https://de518faafc9c42f1bdeb344041249a49.ingest.cloudflare.com` |
| 16 | `MARKET_ARCHIVE_REQUIRED` | `plain_text` | `true` |
| 17 | `MARKET_ARCHIVE_RETENTION_ENABLED` | `plain_text` | `false` |
| 18 | `MARKET_ARCHIVE_STREAM` | `pipelines` | stream `177510a4918647fb8ccf7c5c796ff882` |
| 19 | `MARKET_BACKFILL_ON_STARTUP` | `plain_text` | `false` |
| 20 | `MARKET_PROVIDER_ENABLED` | `plain_text` | `true` |
| 21 | `MARKET_PROVIDER_NAME` | `plain_text` | `binance-spot` |
| 22 | `MARKET_PROVIDER_NAMES` | `plain_text` | `binance-spot` |
| 23 | `MARKET_PROVIDER_POLL_INTERVAL_MS` | `plain_text` | `5000` |
| 24 | `MARKET_PROVIDER_SYMBOLS` | `plain_text` | `canonical_crypto` |
| 25 | `MARKET_QUOTE_STALE_AFTER_MS` | `plain_text` | `30000` |
| 26 | `MARKET_STRUCTURED_STREAM` | `pipelines` | stream `de518faafc9c42f1bdeb344041249a49` |
| 27 | `MINING_WORKFLOW` | `workflow` | workflow `nexi-mining-staging`, class `NexiMiningWorkflow` |
| 28 | `NEXI_ANALYTICS` | `analytics_engine` | dataset `nexi_runtime_staging` |
| 29 | `NEXI_API_CONTAINER` | `durable_object_namespace` | class `NexiApiContainer`, namespace `01e64561d5874d4291994a3c4df769dd` |
| 30 | `NEXI_AUTH_RATE_LIMITER` | `ratelimit` | namespace `2026082801`, 30 requests/60s |
| 31 | `NEXI_B7_ENABLED` | `plain_text` | `false` |
| 32 | `NEXI_CONFIG` | `kv_namespace` | namespace `bc9f4b8c2cca4fbfac94e1ba47339fe1` |
| 33 | `NEXI_CONVERSION_QUOTE_TTL_MS` | `plain_text` | `30000` |
| 34 | `NEXI_HEALTH_URL` | `plain_text` | `https://api.nexitrading.app/readyz` |
| 35 | `NEXI_MARKET_STALE_AFTER_MS` | `plain_text` | `30000` |
| 36 | `NEXI_PLATFORM_VALIDATION` | `secrets_store_secret` | store `b4e4124ef4134d7a94e1e7f97e93b73c`, secret `NEXI_PLATFORM_VALIDATION` |
| 37 | `NEXI_SCHEDULER_ENABLED` | `plain_text` | `true` |
| 38 | `NODE_ENV` | `plain_text` | `production` |
| 39 | `NOTIFICATIONS_QUEUE` | `queue` | queue `nexi-notifications-staging` |
| 40 | `PORT` | `plain_text` | `3000` |
| 41 | `QUEUE_BRIDGE_HOST` | `plain_text` | `nexi.queue` |
| 42 | `REDIS_URL` | `secret_text` | encrypted Worker secret (value omitted) |
| 43 | `SENTRY_DSN` | `secret_text` | encrypted Worker secret (value omitted) |
| 44 | `SENTRY_ENVIRONMENT` | `plain_text` | `production` |
| 45 | `SENTRY_RELEASE` | `plain_text` | `3b173ea38da4c80193c5e0b552ae62fede22fab7` |
| 46 | `WALLET_AUTH_DOMAIN` | `plain_text` | `app.nexitrading.app` |
| 47 | `WALLET_AUTH_SUPPORTED_CHAIN_IDS` | `plain_text` | `1` |
| 48 | `WALLET_AUTH_URI` | `plain_text` | `https://app.nexitrading.app` |
| 49 | `WITHDRAWAL_WORKFLOW` | `workflow` | workflow `nexi-withdrawal-staging`, class `NexiWithdrawalWorkflow` |
| 50 | `WORKFLOW_BRIDGE_HOST` | `plain_text` | `nexi.workflow` |

## Plain-text environment variables

Count: **30**

| Variable | Live value |
|---|---|
| `CORS_ORIGINS` | `https://app.nexitrading.app,https://admin.nexitrading.app` |
| `D1_BRIDGE_ENABLED` | `true` |
| `D1_BRIDGE_HOST` | `nexi-core-d1` |
| `D1_RUNTIME_ENABLED` | `true` |
| `MARKET_ARCHIVE_CHECKPOINT_CONFIRMED` | `false` |
| `MARKET_ARCHIVE_PIPELINE_FORMAT` | `structured` |
| `MARKET_ARCHIVE_PIPELINE_URL` | `https://de518faafc9c42f1bdeb344041249a49.ingest.cloudflare.com` |
| `MARKET_ARCHIVE_REQUIRED` | `true` |
| `MARKET_ARCHIVE_RETENTION_ENABLED` | `false` |
| `MARKET_BACKFILL_ON_STARTUP` | `false` |
| `MARKET_PROVIDER_ENABLED` | `true` |
| `MARKET_PROVIDER_NAME` | `binance-spot` |
| `MARKET_PROVIDER_NAMES` | `binance-spot` |
| `MARKET_PROVIDER_POLL_INTERVAL_MS` | `5000` |
| `MARKET_PROVIDER_SYMBOLS` | `canonical_crypto` |
| `MARKET_QUOTE_STALE_AFTER_MS` | `30000` |
| `NEXI_B7_ENABLED` | `false` |
| `NEXI_CONVERSION_QUOTE_TTL_MS` | `30000` |
| `NEXI_HEALTH_URL` | `https://api.nexitrading.app/readyz` |
| `NEXI_MARKET_STALE_AFTER_MS` | `30000` |
| `NEXI_SCHEDULER_ENABLED` | `true` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `QUEUE_BRIDGE_HOST` | `nexi.queue` |
| `SENTRY_ENVIRONMENT` | `production` |
| `SENTRY_RELEASE` | `3b173ea38da4c80193c5e0b552ae62fede22fab7` |
| `WALLET_AUTH_DOMAIN` | `app.nexitrading.app` |
| `WALLET_AUTH_SUPPORTED_CHAIN_IDS` | `1` |
| `WALLET_AUTH_URI` | `https://app.nexitrading.app` |
| `WORKFLOW_BRIDGE_HOST` | `nexi.workflow` |

## Worker secrets

Count: **4**. Names only; values are intentionally not recorded.

- `JWT_SECRET`
- `MARKET_ARCHIVE_PIPELINE_TOKEN`
- `REDIS_URL`
- `SENTRY_DSN`

## Resource bindings by responsibility

### D1 — 1
- `CORE_DB` → database `522177fa-ac42-4d8f-a6a8-b34eed262f15`

### R2 — 2
- `DEPOSIT_PROOFS` → bucket `nexi-deposit-proofs-staging`
- `MARKET_ARCHIVE` → bucket `nexi-market-archive-staging`

### Queues — 3
- `DOMAIN_EVENTS_QUEUE` → queue `nexi-domain-events-staging`
- `INTEGRATION_JOBS_QUEUE` → queue `nexi-integration-jobs-staging`
- `NOTIFICATIONS_QUEUE` → queue `nexi-notifications-staging`

### Workflows — 3
- `LOAN_WORKFLOW` → workflow `nexi-loan-staging`, class `NexiLoanWorkflow`
- `MINING_WORKFLOW` → workflow `nexi-mining-staging`, class `NexiMiningWorkflow`
- `WITHDRAWAL_WORKFLOW` → workflow `nexi-withdrawal-staging`, class `NexiWithdrawalWorkflow`

### Pipelines — 2
- `MARKET_ARCHIVE_STREAM` → stream `177510a4918647fb8ccf7c5c796ff882`
- `MARKET_STRUCTURED_STREAM` → stream `de518faafc9c42f1bdeb344041249a49`

### KV — 1
- `NEXI_CONFIG` → namespace `bc9f4b8c2cca4fbfac94e1ba47339fe1`

### Analytics Engine — 1
- `NEXI_ANALYTICS` → dataset `nexi_runtime_staging`

### Durable Object — 1
- `NEXI_API_CONTAINER` → class `NexiApiContainer`, namespace `01e64561d5874d4291994a3c4df769dd`

### Rate limiter — 1
- `NEXI_AUTH_RATE_LIMITER` → namespace `2026082801`, 30 requests/60s

### Secrets Store — 1
- `NEXI_PLATFORM_VALIDATION` → store `b4e4124ef4134d7a94e1e7f97e93b73c`, secret `NEXI_PLATFORM_VALIDATION`

### Live Pipeline resources
- `nexi_market_structured_pipeline` — status `running`, pipeline ID `01ed90d5639c480cbdff269c96b9b58f`
- `nexi_market_archive_pipeline` — status `running`, pipeline ID `8584d00ea2184962beb6d035b22d11af`

## Complete source `wrangler.jsonc` settings

These are source configuration fields, including settings that do not appear as live Worker bindings. Secret values are not present here.

- `name`: `nexi-staging`
- `main`: `src/index.js`
- `compatibility_date`: `2026-08-19`
- `account_id`: `95f40eab0f2ba20aff96f8979e45ab71`
- `compatibility_flags`: `nodejs_compat`
- `observability.enabled`: `True`

### Routes
- pattern `api.nexitrading.app`; `custom_domain=True`

### Declared required Worker secrets
- `REDIS_URL`
- `JWT_SECRET`
- `SENTRY_DSN`
- `MARKET_ARCHIVE_PIPELINE_TOKEN`

### R2 bucket configuration
- binding `DEPOSIT_PROOFS` → bucket `nexi-deposit-proofs-staging`; preview `nexi-deposit-proofs-staging`
- binding `MARKET_ARCHIVE` → bucket `nexi-market-archive-staging`; preview `not set`

### D1 configuration
- binding `CORE_DB` → database `nexi-core-staging` / ID `522177fa-ac42-4d8f-a6a8-b34eed262f15`
  - preview database ID: `522177fa-ac42-4d8f-a6a8-b34eed262f15`
  - migrations directory: `../backend/prisma/migrations-d1`
  - migrations pattern: `../backend/prisma/migrations-d1/**/*.sql`

### Container application configuration
- `nexi-api-staging` / class `NexiApiContainer`
  - image: `../backend/Dockerfile`
  - build context: `../backend`
  - instance type: `basic`
  - max instances: `1`
  - SSH enabled: `True`
  - authorized key entries: **4**
    - `mellonelay-codex-runtime` (public key material intentionally omitted from this inventory prose)
    - `mellonelay-operator` (public key material intentionally omitted from this inventory prose)
    - `nexi-cloudflare-staging-20260909` (public key material intentionally omitted from this inventory prose)
    - `nexi-codex-staging-20260911` (public key material intentionally omitted from this inventory prose)

### Durable Object binding configuration
- binding `NEXI_API_CONTAINER` → class `NexiApiContainer`

### Durable Object migrations
- tag `v2-api-container`; new SQLite classes: `NexiApiContainer`

### Analytics Engine
- binding `NEXI_ANALYTICS` → dataset `nexi_runtime_staging`

### KV namespaces
- binding `NEXI_CONFIG` → namespace ID `bc9f4b8c2cca4fbfac94e1ba47339fe1`

### Queue producer configuration
- binding `DOMAIN_EVENTS_QUEUE` → queue `nexi-domain-events-staging`
- binding `NOTIFICATIONS_QUEUE` → queue `nexi-notifications-staging`
- binding `INTEGRATION_JOBS_QUEUE` → queue `nexi-integration-jobs-staging`

### Queue consumer configuration
- queue `nexi-domain-events-staging`
  - max batch size: `10`
  - max batch timeout: `5` seconds
  - max retries: `5`
  - retry delay: `15` seconds
  - dead-letter queue: `nexi-domain-events-staging-dlq`

### Pipeline binding configuration
- binding `MARKET_STRUCTURED_STREAM` → stream `de518faafc9c42f1bdeb344041249a49`
- binding `MARKET_ARCHIVE_STREAM` → stream `177510a4918647fb8ccf7c5c796ff882`

### Workflow binding configuration
- binding `WITHDRAWAL_WORKFLOW` → workflow `nexi-withdrawal-staging` / class `NexiWithdrawalWorkflow`
- binding `MINING_WORKFLOW` → workflow `nexi-mining-staging` / class `NexiMiningWorkflow`
- binding `LOAN_WORKFLOW` → workflow `nexi-loan-staging` / class `NexiLoanWorkflow`

### Secrets Store binding
- binding `NEXI_PLATFORM_VALIDATION` → store `b4e4124ef4134d7a94e1e7f97e93b73c` / secret name `NEXI_PLATFORM_VALIDATION`

### Rate limiter
- binding `NEXI_AUTH_RATE_LIMITER` → namespace `2026082801`; limit `30` per `60` seconds


## Correct read-only command map

Use the explicitly verified `wrangler` executable. If the repository-local Wrangler binary is absent, do **not** use bare `npx wrangler`, because npm can fetch a different version.

| Inspect | Correct command |
|---|---|
| Wrangler version | `wrangler --version` |
| Account/auth | `wrangler whoami` |
| Active deployment | `wrangler deployments status --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Deployment history | `wrangler deployments list --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Worker version list | `wrangler versions list --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Exact version + complete bindings | `wrangler versions view <VERSION_ID> --json --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Worker secret names | `wrangler secret list --config cloudflare-container-bootstrap/wrangler.jsonc` |
| D1 inventory | `wrangler d1 list --config cloudflare-container-bootstrap/wrangler.jsonc` |
| D1 migration status | `wrangler d1 migrations list nexi-core-staging --remote --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Queue inventory | `wrangler queues list --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Workflow inventory | `wrangler workflows list --config cloudflare-container-bootstrap/wrangler.jsonc` |
| R2 bucket inventory | `wrangler r2 bucket list --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Pipeline inventory | `wrangler pipelines list --config cloudflare-container-bootstrap/wrangler.jsonc --json` |
| Pipeline detail | `wrangler pipelines get <PIPELINE_NAME_OR_ID> --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Container applications | `wrangler containers list --config cloudflare-container-bootstrap/wrangler.jsonc --json` |
| Container instances | `wrangler containers instances <APPLICATION_ID> --config cloudflare-container-bootstrap/wrangler.jsonc --json` |
| Container detail | `wrangler containers info <APPLICATION_ID> --config cloudflare-container-bootstrap/wrangler.jsonc --json` |
| Container SSH | `wrangler containers ssh <INSTANCE_ID> --config cloudflare-container-bootstrap/wrangler.jsonc` |
| Live Worker logs | `wrangler tail --config cloudflare-container-bootstrap/wrangler.jsonc` |

### OpenSSH through Wrangler
```bash
ssh -i ~/.ssh/nexi-codex-staging-20260911 -o IdentitiesOnly=yes \
  -o ProxyCommand='wrangler containers ssh %h --config cloudflare-container-bootstrap/wrangler.jsonc --stdio' \
  cloudchamber@<INSTANCE_ID>
```

## Mutation boundary

This inventory phase is read-only. Do not treat `deploy`, `rollback`, secret writes/deletes, D1 writes or migration application, Queue purge/config changes, Workflow trigger/terminate, R2 writes/deletes, Pipeline create/update/delete, or commands executed inside the live Container as inspection. Those actions can mutate production and require a separate current owner authorization and a fresh product-specific docs/help check.

## Verification and completeness

- Live active version reports **50 total bindings**. The table above contains exactly 50 rows.
- Binding-type subtotal: **50**, equal to live total.
- Plain-text environment variables: **30**.
- Worker secrets: **4** names, no secret values stored.
- Container authorized public keys in source configuration: **4**.
- Pipeline resources returned live: **2**.
- The screenshot values for Container allocation agree with the observed production Container identity used here.
- No runtime configuration was changed to create this document.

## Current official Cloudflare references

- Wrangler commands: `https://developers.cloudflare.com/workers/wrangler/commands`
- Versions and deployments: `https://developers.cloudflare.com/workers/versions-and-deployments/`
- Wrangler configuration and bindings: `https://developers.cloudflare.com/workers/wrangler/configuration`
- Containers commands: `https://developers.cloudflare.com/workers/wrangler/commands/containers/`
- Container SSH: `https://developers.cloudflare.com/containers/ssh/`
- Use the current product command/reference page for D1, Queues, Workflows, R2, Pipelines, secrets, and tail immediately before any mutation.
