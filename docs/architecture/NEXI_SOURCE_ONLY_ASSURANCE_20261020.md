# NEXI source-only integration assurance — 20 October 2026

**Scope and owner authority.** No backend financial acceptance tests, SQLite operations, queue execution, service restart or deployment were performed. Reuse prior proof from `NEXI_PROOF_REUSE_REGISTER.md` where source and runtime responsibility are unchanged. The four business acceptance workflows remain `CLOSED_BY_OWNER_ACCEPTANCE` (untested outcomes are not marked passed); this is their **source-contract review only**.

**Review base:** GitHub `main` `c3a0738b735b516f717bea6393e35252633f490c` before the current corrections. Live VPS runtime remains an independent identity. Graphify's local `@nexi-graphify` `shortest_path` gave FinancialOperationsController → financial-operations.controller.ts → financial-operations.service.ts → D1FinancialCommandGateway (3 extracted structural hops). This is a static path, not runtime proof.

## Phase 1: reused and inspected implementation boundaries

| Boundary | Source ownership and direct evidence | Source review decision |
| --- | --- | --- |
| SQLite / Prisma | `backend/src/d1/d1-prisma.service.ts` selects PrismaBetterSqlite3; `local-sqlite-bridge.service.ts` provides local SQLite batch/transaction boundary; gateway uses BEGIN IMMEDIATE and financial command idempotency | Existing SQLite promotion proof reused; do not rerun DB integrity test. SQLite is current application authority; legacy D1-prefixed class names are compatibility identifiers |
| NestJS and authentication | `app.module.ts` registers active controllers/modules; AuthSurfaceGuard + JwtAuthGuard distinguish Public and Admin endpoints | Source path preserved; no new authentication acceptance |
| Ledger / EventOutbox / Activity | `d1-financial-command.gateway.ts` owns financial command and accounting/event statements; `events/event-outbox.service.ts` owns inbox/outbox; `event-outbox.scheduler.ts` publishes under scheduler flag | Source wiring present. Per-operation accounting equality was owner-accepted untested; do not assert economic reconciliation |
| Durable jobs / BullMQ / Aiven Valkey | `jobs/local-async-runtime.service.ts` gates SQLite-local mode, checks persisted job/workflow/Inbox tables, configures BullMQ Queue/Worker on Valkey, creates LocalDurableJobStore and LocalWorkflowCoordinator, and drains in-flight cycles on destroy | Persistent job state remains SQLite, queues provide wakeups. Existing isolated retry proof reused; no new recovery or shutdown claim |

## Four owner-closed economic workflow source-only contracts

| Business flow | Reviewed source chain | What remains outside source proof |
| --- | --- | --- |
| Mining maturity/accrual/redeem | `mining/mining.controller.ts` guards Public subscribe/redeem/cancel, DTOs validate plan/amount/idempotency; MiningService and D1FinancialCommandGateway handle commands; `jobs/local-workflow.coordinator.ts` has a mining workflow owner | No renewed maturity accrual or wallet settlement run |
| Loan collateral/apply/Admin decision/repay | `loans/loans.controller.ts` binds ApplyLoanDto, LoanRepaymentDto and Admin guarded decisions to LoanService; gateway owns loan financial commands, local workflow coordinator has loan lifecycle | Collateral object existence and actual Admin economic approval remain owner-closed untested |
| Withdrawal network/security/Admin settlement | `financial/financial-operations.controller.ts` uses Gate2WithdrawalDto, JWT/AuthSurface guards and `verifySensitiveAction` before FinancialOperationsService; fee/capability/limits and reserve/approve/settle use gateway | External withdrawal provider remains disabled by source; no real broadcast/settlement claim |
| Ledger/Activity/EventOutbox per-operation equality | Wallet Activity/ledger reads use the NestJS wallet controller; financial commands flow through gateway to SQLite/Outbox and async publication owners | Economic-group reconciliation was owner-accepted without new proof; not represented as passed |

## Phase 3: Public and Admin contract alignment

- Public `frontend/app/lib/api.ts` calls current NestJS HTTPS endpoint by default; bearer token refresh uses `/auth/refresh`. Wallet transfer form `frontend/app/dashboard/wallet/components/TransferModal.tsx` sends `sourceScope,destinationScope,asset,amount,idempotencyKey` matching `WalletAccountTransferDto` on `POST /financial/account-transfers`.
- Public withdrawal form includes network, address, amount, security password, optional MFA and idempotency key as `Gate2WithdrawalDto` requires. Public loan application uses `planId,amount,duration,collateralImg,collateral,idempotencyKey` matching `ApplyLoanDto`. Mining request DTOs match controller payload names.
- Admin `Admin/src/admin/data/context.tsx` instantiates NexiAdminApiProvider, and `Admin/src/routes/__root.tsx` supplies it. `nexi-api-provider.ts` uses bearer tokens and current NestJS `/admin/*` and `/communications/admin/*` routes. Its unsupported operations explicitly reject rather than fabricate financial state.
- NestJS preview-based `npm run generate:openapi` regenerated `docs/contracts/openapi.json` to **223 paths / 245 HTTP operations**. `/wallet/overview`, `/financial/account-transfers`, wallet-network and deposit-proof endpoints now appear. Four `/lever/*` methods in `ContractController` are **not** in active Swagger because `ContractModule` is not registered by `AppModule`; do not make frontend depend on them.

## Remaining distinctions (not new test tasks)

- Graphify/Fallow prove structural properties only; prior test receipts remain separately scoped. Fallow production-mode analysis identified existing complexity hotspots (including the financial gateway) and is **not** authorization for unrelated refactoring.
- Current running backend deployment identity is separate from this source campaign. An unchanged READY response does not certify the edited artifact.
- Independent off-VPS restore and historical shutdown/recovery claims remain exactly as recorded in the proof register; owner scope excludes retesting them now.
- Sentry release and environment must be embedded/verified for each actual artifact before separate sequential deployment; see `docs/operations/NEXI_THREE_SURFACE_RELEASE_READINESS.md`.

## Source contract generation reproducibility

A preview-only NestJS Swagger generation against the checked source produced 223 paths and 245 HTTP operations and exactly reproduced the expected OpenAPI JSON SHA-256 `822bbf6f78f7b8c9fa9a892f83eefc2617da74ce168c40650d78691f81d42661`. The generated route table contains all 245 HTTP operations. This checks static source documentation consistency; it is not a request/financial behavior test or deployed runtime proof.
