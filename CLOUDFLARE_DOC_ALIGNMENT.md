# NEXI Cloudflare Documentation Alignment

Date: 2026-08-21
Status: Phase 1 complete; source and account reconciliation remain required before any Cloudflare mutation.

## Authority and boundary

- Windows repository `C:\trae_projects\Dexi_style_TraeWV` is the implementation source of truth.
- `/root/workspaces/nexi/wrangler.jsonc` on `sg-edge-01` is a stale test-runtime configuration and is not the deployment source.
- Cloudflare Worker is an edge transport boundary only. NestJS remains the authority for authentication, wallets, ledger, Spot/Margin, Options/Binary, market state, Admin, and audit.
- PostgreSQL remains the durable financial authority. Redis remains ephemeral coordination/realtime infrastructure. Durable Objects are runtime/container infrastructure, not application financial storage.

## Workers decisions

Current source entrypoint: `cloudflare-container-bootstrap/src/index.js`.

Current source config: `cloudflare-container-bootstrap/wrangler.jsonc`.

The Worker uses `nodejs_compat`, an account-scoped configuration, an R2 binding, a Container declaration, and a Durable Object binding/migration. Its default path forwards HTTP requests and Socket.IO upgrade requests to the Container. `/healthz` is an edge-only health response; `/ops/live` and `/ops/ready` remain backend/container health evidence.

Documentation alignment:

- Wrangler configuration is the source for bindings and compatibility settings.
- Secrets must be uploaded/configured separately and must not be placed in `vars` or source.
- Per-environment configuration is required for staging versus production separation.
- `observability.enabled` is now present in the reconciled staging source config.
- A custom route/domain is not currently present in the Windows config; staging can use a generated Worker URL until a route is explicitly selected.
- `wrangler deploy --dry-run` validates the package but does not prove a live Worker, Container, database, Redis, or WebSocket path.
- Versioned deployment/rollback exists, but rollback must be validated as a staging procedure before production use.

## Containers decisions

Current source class: `NexiApiContainer` in `cloudflare-container-bootstrap/src/index.js`.

Current contract:

- Container default port: `3000`.
- Container health probe: `localhost/ops/live`.
- Sleep policy: `10m`.
- Dockerfile: `backend/Dockerfile`.
- Runtime command: `node dist/src/main.js`.
- Docker image exposes port `3000`.
- Startup does not run destructive Prisma commands; migrations are a separately reviewed operation.

Cloudflare Container configuration requires a Container class, a `containers` entry, a matching Durable Object binding, and a migration for the class. Current Context7/Workers SDK fixtures confirm this relationship. Docker must be available for Dockerfile-based container rollout. A dry run or Worker-only rollout does not prove the container image was deployed.

The current source uses `getContainer(env.NEXI_API_CONTAINER, "nexi-api").fetch(request)`. This preserves the request and WebSocket upgrade boundary; the backend Socket.IO gateway remains responsible for protocol behavior, authentication, subscriptions, ordering, and recovery.

## R2 decisions

Current binding: `DEPOSIT_PROOFS`.

Current bucket: `nexi-deposit-proofs-staging`.

The Worker performs a bounded, authenticated upload authorization check through NestJS, then writes the request body to R2 and stores only the object reference in PostgreSQL through the backend claim flow. The bucket must remain private. Admin/user retrieval must use an authorized backend path or signed access mechanism; public writable access is not acceptable.

The current 10 MiB and image MIME checks are source-level controls. Staging must verify request-size behavior, authorization, object existence, and claim idempotency without exposing proof objects publicly.

## Durable Object decisions

`NEXI_API_CONTAINER` is the required Container/DO binding for the Cloudflare Container runtime. It is not a replacement for PostgreSQL, Redis, the ledger, or market persistence. No separate application Durable Object is justified by current source evidence. A later realtime coordination Durable Object would require an explicit product/runtime decision; current backend Redis and Socket.IO remain the realtime path.

## Database integration

- Production authority: external managed PostgreSQL, not D1 and not the VM's temporary PostgreSQL service.
- Prisma schema and forward migrations remain the backend database interface.
- The Container receives `DATABASE_URL` as an environment secret/variable at deployment time; values must never be committed or printed.
- Container startup must not run `db push`, reset, or destructive migration commands.
- A real staging database provider/hostname and connection policy are not evidenced in the current Windows source or Cloudflare account inventory. This is a deployment blocker until supplied/configured.
- Connection pooling must be validated for the selected external PostgreSQL provider and Container concurrency. Hyperdrive is not currently configured; whether to use direct pooled PostgreSQL or Hyperdrive requires a provider-specific decision before production.

## Redis integration

- Production Redis must be external and supplied through `REDIS_URL`.
- `redis://127.0.0.1:6379` on `sg-edge-01` is VM validation infrastructure only and must not be used by the Cloudflare Container.
- Redis is ephemeral coordination/cache/realtime transport, never balance, ledger, or settlement authority.
- Staging must verify connect timeout, retry/backoff, degraded behavior, and Socket.IO publication/recovery against the selected provider.
- A production Redis provider/endpoint is not evidenced in current source/account inventory. This is a deployment blocker until supplied/configured.

## WebSocket and realtime decisions

The intended path is:

`Browser → Worker upgrade → Container.fetch(request) → NestJS Socket.IO gateway → Redis/provider projections → frontend`.

The Worker contains no synthetic market or financial response generation. Current source/static evidence supports transparent forwarding. Runtime proof is still required for Socket.IO handshake, event delivery, reconnect, ordering, deduplication, and the documented snapshot-based recovery contract. Exact missed-event replay is not currently proven and must not be claimed.

## Secrets and environment contract

Required backend values include `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGINS`, and any approved provider credentials. Non-secret operational values include `NODE_ENV`, `PORT`, market-provider enablement, scheduler election, and feature flags. Cloudflare secrets should be configured with Wrangler secret operations or an approved secret store; never place credential values in `wrangler.jsonc`, source, logs, or this document.

The reconciled source now declares the named staging Worker, required secret names, and non-secret runtime variables. Secret values remain deployment-time inputs and are intentionally absent from source.

## Known risks and blockers

1. The Windows config name is currently `dexi-style-container-bootstrap`, not a canonical NEXI staging identity.
2. No staging custom domain/route has been selected; `nexi-test-runtime` is explicitly historical and must not be reused.
3. External PostgreSQL provider/connection and migration target are not evidenced.
5. External Redis provider/connection is not evidenced.
6. Container rollout requires Linux/Docker-capable execution; Windows ARM64 is not the final Wrangler execution host.
7. WebSocket and application runtime acceptance remain unverified.
8. Existing `nexi-test-runtime`, old VM artifacts, and the staging R2 bucket must be preserved until a new staging deployment is independently verified.

## Phase decision

Documentation alignment: PASS for the architecture and source pattern.

Implementation readiness: PARTIAL. The source contains a plausible Worker → Container → NestJS boundary and staging R2 binding, but deployment must not proceed until canonical staging identity, external PostgreSQL, external Redis, required secrets, environment separation, and runtime acceptance prerequisites are reconciled.

## Official references consulted

- [Cloudflare Worker configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Cloudflare Container get started](https://developers.cloudflare.com/containers/get-started/)
- [Cloudflare Container deployment](https://developers.cloudflare.com/containers/deploy/)
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/get-started/workers-api/)
- [Cloudflare R2 upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/)
- [Cloudflare Workers rollback and deployment commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/)
- Context7 library: `/cloudflare/workers-sdk` (current container fixtures and deployment caveats)
