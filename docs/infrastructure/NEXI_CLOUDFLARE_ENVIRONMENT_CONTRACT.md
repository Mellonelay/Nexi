# NEXI Cloudflare Environment Contract

**Authority date:** 2026-10-17
**Status:** Remaining Cloudflare resource and configuration contract; this is not the current public DNS routing contract.

Name.com DNS now routes `www`, `api`, and `admin` to the VPS. Cloudflare Worker cron/queue/workflow resources and D1 remain active. D1 is still populated and remains the current financial data authority; the VPS SQLite core financial tables sampled on 2026-10-17 are empty. NestJS on the VPS is the public API process, but its local SQLite writes are not production-ready until controlled reconciliation and owner-approved writer cutover. GitHub `main` is durable source authority; Ledger is accounting truth; EventOutbox is the durable publication boundary; Aiven Valkey is realtime/cache/Streams only.

## Canonical production host contract

- Public frontend: `https://www.nexitrading.app`.
- Backend API: `https://api.nexitrading.app` (Name.com public DNS to VPS Nginx/NestJS; trusted Let's Encrypt TLS verified in prior live checks).
- Admin frontend: `https://admin.nexitrading.app`.
- Apex `nexitrading.app` and legacy `app.nexitrading.app` redirect to the canonical Public host with HTTP 308; neither is an alternate frontend authority.
- Worker CORS allows exactly the Public and Admin origins. SIWE domain/URI use the canonical Public host.
- Worker: nexi-production.
- Container application: nexi-api-staging (historical identifier for the production Container).
- Worker CORS origins are exactly https://www.nexitrading.app,https://admin.nexitrading.app; SIWE uses domain www.nexitrading.app and URI https://www.nexitrading.app.
- The remaining Worker/Container/D1/Queue/Workflow bindings below describe active Cloudflare resources, not the current public API route. Keep them synchronized with `platform/cloudflare-targets.json`, Wrangler configuration and platform validators until each resource is safely retired.

## Required platform bindings / runtime inputs

- `CORE_DB` — Cloudflare D1 binding.
- `NEXI_API_CONTAINER` — Cloudflare Container/Durable Object binding used for backend execution.
- Queue bindings — delivery/retry only.
- Workflow bindings — orchestration only.
- R2 bindings: verify current private DEPOSIT_PROOFS and KYC_EVIDENCE resources and access rules at the deployed Worker revision.
- `REDIS_URL` — Aiven Valkey endpoint/secret; never durable financial truth.
- Secret inventory is version-sensitive: inspect live binding names without disclosing values. Cloudflare Observability remains disabled; Sentry SDK telemetry is retained.
- Non-secret runtime values such as `NODE_ENV`, `PORT`, CORS, provider enablement, scheduler controls, and feature flags remain explicit Wrangler configuration.

Within the remaining Cloudflare Worker runtime contract, D1 is the database binding and schema evolution uses `backend/prisma/migrations-d1` through current Wrangler D1 migration semantics. The separate VPS target uses local SQLite as documented in `docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md`; it is not synchronized with D1 in the 2026-10-17 evidence. Application startup must not perform schema mutation.

Before any Cloudflare change, follow `docs/infrastructure/NEXI_CLOUDFLARE_BACKEND_OPERATOR_RUNBOOK.md` and the current official Cloudflare documentation gate.
