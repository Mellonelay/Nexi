# NEXI Admin: Current Control Plane and Feature Map

**Canonical source:** `apps/admin/` (React/TanStack/Vite deployment path). Admin is a **governed consumer** of the NestJS backend, never an alternate financial owner.

## Controls by current route

| Routes under `apps/admin/src/routes/` | Administrative responsibility |
|---|---|
| `overview`, `health`, `exposure` | Operational/account-wide health, risk and exposure signals |
| `admins`, `roles`, `sessions`, `audit`, `approvals` | Admin identity, RBAC, privileged sessions, approval chains and immutable audit context |
| `users`, `kyc` | Account lookup/status and private evidence-review control |
| `assets`, `networks`, `market-feeds` | Market instrument/provider catalog, wallet currency/network configuration, freshness/source policy |
| `wallets`, `ledger`, `reconciliation` | Governed financial oversight, corrections and reconciliation; NestJS + D1 Ledger remain authoritative |
| `deposits`, `withdrawals`, `settlements` | Claim/review/approval or rejection, verification and settlement status |
| `spot`, `binary` | Trade configuration; Binary fixed supported durations and editable enablement/payout/stake bounds where implemented |
| `mining`, `loans` | Plan governance, accrual/repayment lifecycle and backend-confirmed positions |
| `frontend-control`, `feature-flags`, `maintenance`, `navigation`, `localization` | Public-facing controls with explicit propagation rules and audit |
| `support`, `messages`, `notifications`, `announcements`, `learn` | Support/communications queues, moderation, publication and notification management |
| `sandbox` | Authorized isolated test scenarios; never counterfeit financial state or pollute live market data |

All rows map to source route files, **not** automatic claims of complete runtime acceptance. Inspect each route/component and backend DTO before asserting a specific control exists or works.

## Authority and access model

- UI navigation: `apps/admin/src/admin/config/navigation.ts`; role and permission declarations under `apps/admin/src/admin/config/`.
- Backend consumer: `apps/admin/src/admin/data/nexi-api-provider.ts`, related types/provider files.
- Admin auth/authorization: NestJS guards, explicit role permissions and user/account isolation. Admin UI hiding alone is never sufficient.
- Mutations must be validated/audited, carry correct actor and reason, and preserve idempotency/financial integrity where relevant.
- Admin config propagates to Public through the single backend read contract, not duplicated hard-coded state.
- All KYC evidence remains in private R2 with backend-controlled access.

## Release and verification

Admin runtime/source SHA and embedded `VITE_SENTRY_RELEASE` must match the actual Admin artifact; verify separately from Public and Backend. Sentry SDK errors/logs/tracing, privacy-safe Replay/profiling, source maps and production release association follow [Sentry operations](../operations/NEXI_SENTRY_OBSERVABILITY.md).

Use actual Admin RBAC negative tests and live readback before claiming a privileged control accepted. See [Backend](../backend/README.md) and [cross-surface map](../architecture/CROSS_SURFACE_FEATURE_MAP.md).
