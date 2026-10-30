# NEXI OpenAPI response-contract closure — 2026-10-30

## Current continuation addendum

After the initial grouped response-schema generation, source review found and corrected additional contract details before closure: Admin login may omit `refresh_token` while refresh always returns it; Swagger metadata now describes that distinction. Four query DTO `limit` parameters (`/admin/audit`, `/admin/incidents`, `/admin/maintenance-windows`, `/market/klines`) now generate integer schemas to match `@IsInt()`. The Admin exposure consumer now displays unavailable utilization as `Unavailable`, not `0%`. Communications Admin moderation and notifications use deterministic `{createdAt,id}` ordering for offset pagination; concurrent insertions ahead of an offset can still shift pages, and pagination was not redesigned.

The canonical OpenAPI generator was run after those grouped Backend metadata edits. One final bounded JSON assertion found zero operations with schema-less 2xx responses, zero operation query parameters referencing generic `Object`, the expected login/refresh token requirement, and integer schemas on the four listed limits. The affected existing suites then passed once: `cd backend && NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand test/communications/communications.service.spec.ts` (22/22), and `cd Admin && node --test test/nexi-api-provider-reorder.test.mjs` (19/19). CodeScene's pre-commit safeguard flagged the Exposure component's complexity increase from the display condition; extracting `formatUtilisation()` resolved the regression, and the repeat safeguard passed with the file stable and aggregate complexity lower. No typecheck, lint, broader test suite, CI, build, runtime, deployment, or browser acceptance was run. The earlier 38 Backend tests and source-only typecheck are reused only for unchanged implementation. Current work remains uncommitted and undeployed.

## Scope and source frontier

This receipt records a source-only correction on `main`, starting from `3b5e2c2b88984c3010e60305af9acd157a5c345c`. The working tree was clean at intake. The source changes and regenerated contract are currently uncommitted; this receipt does not claim GitHub integration, deployment, runtime, or browser verification.

The current generated contract had 32 HTTP operations with a 2xx response but no response schema. The NestJS controllers and their services were inspected to document the actual returned shapes. Controller metadata was updated, then the canonical `backend/scripts/generate-openapi.js` generator was run after the grouped metadata updates to regenerate `docs/contracts/openapi.json`.

All 32 operations now have a schema on a successful response. This includes JSON response shapes and the KYC evidence endpoint's explicitly declared binary media types. The generated contract reports zero operations with a 2xx response and no schema. No handler business behavior or route/method was changed by this response-metadata batch.

The 32 operations are: `GET /health`; `GET /readyz`; `POST /feedback/upload`; `GET /referral/me`; `GET /referral/history`; `POST /referral/claim`; `GET /vip/me`; `GET /vip/levels`; `GET /wallet/me/ledger`; `GET /wallet/{userId}/ledger`; `POST /spot/margin/transfer`; `GET /admin/kyc/{userId}/evidence/{side}`; `POST /admin/market/assets/visibility`; `POST /admin/market/networks/visibility`; `POST /admin/deposit-claims/{id}/confirm`; `POST /admin/deposit-claims/{id}/credit`; `POST /admin/deposit-claims/{id}/reject`; `POST /admin/auth/login`; `POST /admin/auth/refresh`; `POST /admin/auth/logout`; `POST /admin/auth/logout-all`; `GET /admin/vip/levels`; `POST /admin/vip/levels`; `POST /admin/vip/assign`; `POST /financial/deposit-claims`; `PUT /storage/deposit-proof`; `GET /ops/ready`; `POST /_internal/workflows/{workflow}/{action}`; `GET /profile/me`; `PATCH /profile/me`; `GET /profile/preferences`; `PATCH /profile/preferences`.

## Changed files

- Backend Swagger response metadata: `backend/src/admin/admin-auth.controller.ts`, `backend/src/admin/admin.controller.ts`, `backend/src/app.controller.ts`, `backend/src/feedback/feedback.controller.ts`, `backend/src/financial/financial-operations.controller.ts`, `backend/src/financial/local-deposit-proof.controller.ts`, `backend/src/observability/health.controller.ts`, `backend/src/profile/profile.controller.ts`, `backend/src/referral-vip/referral-vip-admin.controller.ts`, `backend/src/referral-vip/referral-vip.controller.ts`, `backend/src/spot/margin.controller.ts`, `backend/src/wallet/wallet.controller.ts`, `backend/src/workflows/workflow-commands.controller.ts`.
- Generated API artifact: `docs/contracts/openapi.json`.
- Current capability authority: `.codex/AGENTS.md` and `docs/operations/NEXI_CAPABILITY_ROUTING.md` now describe only active skill and tool routes. Dated scanner evidence remains archival provenance.
- Current state/proof/task records: this receipt, `NEXI_CURRENT_STATE.md`, `NEXI_PROOF_REUSE_REGISTER.md`, `tasks/plan.md`, and `tasks/todo.md`.

## Evidence and limits

- Generator invoked: from `backend/`, `node scripts/generate-openapi.js`; it completed and wrote `docs/contracts/openapi.json`. This is contract generation, not a production build or test.
- Static artifact inspection: parsed generated JSON and counted successful operations without a schema: `0`.
- `git diff --check` completed without whitespace errors.
- No Jest/unit tests, typecheck, lint, build, database migration, service restart, deployment, production write, or browser acceptance was run. The owner requested deferring tests until the source corrections were complete; a later authorized verification phase may select only change-invalidated focused checks.
- Graphify MCP was invoked against the unchanged source index (built at the starting SHA); bounded controller-neighborhood evidence helped locate module/controller relationships. The graph does not encode HTTP payload semantics, so schemas were grounded in current handler/service source.
- Fallow MCP was invoked on the Backend controller targets. Its report was degraded because repository `node_modules` and Fallow policy packs were absent; it is limited structural evidence, not a correctness result.
- Official NestJS Operations documentation was consulted: https://docs.nestjs.com/openapi/operations . It supports explicit response schemas for generic/runtime response shapes. Current source behavior remains the contract authority.
- The retired scanner was not invoked; the existing old snapshot was not used as current evidence.

## Disposition

`CONFIRMED — FIXED` — generated OpenAPI's 32 missing success-response schemas are now represented from controller/service behavior. `STATICALLY_VALIDATED` — generated artifact has zero remaining 2xx operations without a schema. `NOT VERIFIED` — tests, type safety, deployed runtime, browser behavior, and GitHub integration. No production surface changed.

## Final source and Git status addendum

At final review `main` and `origin/main` still pointed to `3b5e2c2b88984c3010e60305af9acd157a5c345c`; the continuation remains uncommitted. The current push workflows include application build jobs, and no GitHub push or CI run was triggered. This receipt and the current-state/proof/task records now distinguish the earlier pushed `213ea47` batch from this local continuation. The source changes are not yet an integrated release candidate.
