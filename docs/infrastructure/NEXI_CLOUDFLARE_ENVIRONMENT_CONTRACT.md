# NEXI Cloudflare Container Environment Contract

**Status:** source contract; no deployment or secret mutation

The API Container runs one NestJS process on `0.0.0.0:3000`. The Worker only
forwards requests to the `NEXI_API_CONTAINER` binding. PostgreSQL and Redis are
external services; neither is replaced by Durable Object storage.

## Required injected values

| Variable | Secret | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | Must be `production` in the production image. |
| `PORT` | No | Must be `3000` for the API Container. |
| `DATABASE_POOL_MAX` | No | Bounded PostgreSQL application pool size; source default is `4`, maximum `10`. |
| `CORS_ORIGINS` | No | Explicit comma-separated public/Admin origins; no wildcard with credentials. |
| `DATABASE_URL` | Yes | TLS PostgreSQL connection string for the environment. |
| `REDIS_URL` | Yes | TLS Redis connection string/namespace for the environment. |
| `JWT_SECRET` | Yes | Backend authentication signing secret. |
| `MARKET_PROVIDER_ENABLED` | No | Explicit provider activation gate; default `false`. |
| `MARKET_PROVIDER_NAMES` | No | Explicit comma-separated provider allowlist. |
| `MARKET_PROVIDER_SYMBOLS` | No | Explicit canonical symbol/category selection. |
| `MARKET_PROVIDER_NAME` | No | Primary provider name used by the runtime router. |
| `MARKET_PROVIDER_WS_URL` | Conditional | Provider WebSocket endpoint override when the selected adapter needs one. |
| `MARKET_PROVIDER_HTTP_URL` | Conditional | Provider REST endpoint override when the selected adapter needs one. |
| `MARKET_PROVIDER_POLL_INTERVAL_MS` | No | Polling adapter interval when a polling provider is enabled. |
| `MARKET_QUOTE_STALE_AFTER_MS` | No | Market quote freshness threshold for public market reads. |
| `NEXI_MARKET_STALE_AFTER_MS` | No | Trading/Options/Margin market freshness threshold. |
| `NEXI_CONVERSION_QUOTE_TTL_MS` | No | Conversion quote validity window. |
| `MARKET_BACKFILL_ON_STARTUP` | No | Explicit startup backfill gate; default `false` in staging. |
| `NEXI_SCHEDULER_ENABLED` | No | Must be `true` only for the elected scheduler instance. |
| `NEXI_B7_ENABLED` | No | Enables the governed Mining reward job when the scheduler is elected. |
| `MARKET_ARCHIVE_PIPELINE_URL` | Conditional | Authenticated Cloudflare Pipelines HTTP stream endpoint for normalized trade/depth archive events. |
| `MARKET_ARCHIVE_PIPELINE_TOKEN` | Conditional secret | Bearer credential for the archive stream; never print, commit, or bake into an image. |
| `MARKET_ARCHIVE_REQUIRED` | No | Must be `true` before relational retention cleanup is enabled; archive failures then fail closed. |
| `MARKET_REFERENCE_RETENTION_SECONDS` | No | Bounded relational hot-window retention for provider trade/depth/quote history. |

Provider credential variables remain provider-specific secrets and must be
injected only when that provider is approved and enabled. Never copy `.env`
files, credentials, JWT keys, database URLs, or Cloudflare tokens into an
image or Wrangler configuration.

The Worker-to-Container adapter forwards the provider endpoint, credential,
symbol, polling, freshness, conversion, sandbox, and pool variables listed in
the source contract. Provider credentials and `NEXI_SANDBOX_ACCOUNT_IDS` remain
deployment-time secret inputs; no values are stored here. `DIRECT_URL` is a
Prisma migration/introspection input and is intentionally not required by the
long-running API process; migration execution remains a separately reviewed
operation.

## Startup and job contract

- Container startup runs `node dist/src/main.js`; it never runs Prisma schema
  mutation commands.
- Forward-only `prisma migrate deploy` is a separately reviewed operation.
- Mining's daily cron is disabled unless `NEXI_SCHEDULER_ENABLED=true` and
  `NEXI_B7_ENABLED=true`; Redis `SET NX EX` ownership plus compare-and-delete
  release prevents concurrent elected instances from processing the same run.
- A missing PostgreSQL or Redis dependency must remain a readiness failure, not
  a synthetic fallback.

## Edge contract

- `/healthz` is edge liveness only.
- `/ops/*`, REST routes, Engine.IO polling, and Socket.IO WebSocket upgrades are
  forwarded unchanged through `container.fetch(request)`.
- The Worker creates no market, binary, wallet, ledger, or realtime payload.
