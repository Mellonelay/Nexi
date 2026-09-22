# NEXI Cloudflare Environment Contract

**Authority date:** 2026-09-17

Cloudflare Worker + Container is the backend execution/runtime authority. GitHub `main` is durable source authority. D1 is durable application/financial relational truth; Ledger is accounting truth; EventOutbox is the durable publication boundary; Aiven Valkey is realtime/cache/Streams only.

## Required platform bindings / runtime inputs

- `CORE_DB` — Cloudflare D1 binding.
- `NEXI_API_CONTAINER` — Cloudflare Container/Durable Object binding used for backend execution.
- Queue bindings — delivery/retry only.
- Workflow bindings — orchestration only.
- R2/Pipelines bindings — approved object/archive/analytics paths only.
- `REDIS_URL` — Aiven Valkey endpoint/secret; never durable financial truth.
- `JWT_SECRET` and other authentication/provider secrets — Cloudflare secret/secrets-store inputs, never committed.
- Non-secret runtime values such as `NODE_ENV`, `PORT`, CORS, provider enablement, scheduler controls, and feature flags remain explicit Wrangler configuration.

There is no alternate durable database URL or migration target in the active backend contract. D1 schema evolution uses `backend/prisma/migrations-d1` through current Wrangler D1 migration semantics. Application startup must not perform schema mutation.

Before any Cloudflare change, follow `docs/infrastructure/NEXI_CLOUDFLARE_BACKEND_OPERATOR_RUNBOOK.md` and the current official Cloudflare documentation gate.
