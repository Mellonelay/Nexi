# NEXI Cloudflare Environment Contract

**Authority date:** 2026-09-26

Cloudflare Worker + Container is the backend execution/runtime authority. GitHub `main` is durable source authority. D1 is durable application/financial relational truth; Ledger is accounting truth; EventOutbox is the durable publication boundary; Aiven Valkey is realtime/cache/Streams only.

## Canonical production host contract

- Public frontend: `https://www.nexitrading.app`.
- Backend API: `https://api.nexitrading.app` (Cloudflare Worker Custom Domain).
- Admin frontend: `https://admin.nexitrading.app`.
- Apex `nexitrading.app` and legacy `app.nexitrading.app` redirect to the canonical Public host with HTTP 308; neither is an alternate frontend authority.
- Worker CORS allows exactly the Public and Admin origins. SIWE domain/URI use the canonical Public host.
- Worker: nexi-production.
- Container application: nexi-api-staging (historical identifier for the production Container).
- Worker CORS origins are exactly https://www.nexitrading.app,https://admin.nexitrading.app; SIWE uses domain www.nexitrading.app and URI https://www.nexitrading.app.
- Keep this contract synchronized with `platform/cloudflare-targets.json`, Wrangler production vars, Public build environment, and the platform sync validator.

## Required platform bindings / runtime inputs

- `CORE_DB` — Cloudflare D1 binding.
- `NEXI_API_CONTAINER` — Cloudflare Container/Durable Object binding used for backend execution.
- Queue bindings — delivery/retry only.
- Workflow bindings — orchestration only.
- R2 bindings: verify current private DEPOSIT_PROOFS and KYC_EVIDENCE resources and access rules at the deployed Worker revision.
- `REDIS_URL` — Aiven Valkey endpoint/secret; never durable financial truth.
- Secret inventory is version-sensitive: inspect live binding names without disclosing values. Cloudflare Observability remains disabled; Sentry SDK telemetry is retained.
- Non-secret runtime values such as `NODE_ENV`, `PORT`, CORS, provider enablement, scheduler controls, and feature flags remain explicit Wrangler configuration.

There is no alternate durable database URL or migration target in the active backend contract. D1 schema evolution uses `backend/prisma/migrations-d1` through current Wrangler D1 migration semantics. Application startup must not perform schema mutation.

Before any Cloudflare change, follow `docs/infrastructure/NEXI_CLOUDFLARE_BACKEND_OPERATOR_RUNBOOK.md` and the current official Cloudflare documentation gate.
