# NEXI Cross-Surface Feature and Authority Map

**Use:** navigation from user/admin behavior to canonical implementation. Source mappings use repository `main`; actual deployed behavior requires independent proof. This is a cross-reference, **not** a second specification of financial or market rules.

## Runtime topology

```text
Public Next.js (user)                Admin React/TanStack (governed controls)
               \                      /
                 Cloudflare Worker edge/router
                              |
                   Cloudflare Container
                              |
                      NestJS domains
             +----------------+----------------+
             |                |                |
        D1 relational     Valkey cache/WS     R2 private objects
       Ledger + Outbox     realtime only      evidence/proofs
```

Cloudflare Worker routes/orchestrates; NestJS is domain decision authority. D1 owns durable state, Ledger accounting and EventOutbox; Queues/Workflows provide delivery/orchestration. Public and Admin never mutate D1 directly.

## Feature-to-owner matrix

| Capability | Public source route | Backend domain | Admin control | Durable/realtime boundary |
|---|---|---|---|---|
| SIWE/security | `/login`, `/signup`, Settings | `auth/`, `users/`, `profile/` | `users`, `sessions`, `roles` | D1 sessions/security events; wallet signature verification |
| KYC | Settings upload/status | `kyc/` | `kyc` | private R2 evidence, D1 status and Admin audit |
| 53-asset catalog | Dashboard, Asset Detail | `market/` | `assets`, `market-feeds` | provider-backed market data and quote freshness |
| Wallet accounts | Wallet Overview/Funding/Spot/Margin/Options/Finance | `wallet/`, `financial/`, `d1/` | `wallets`, `ledger`, `reconciliation` | D1 Ledger/Activity; five account scopes |
| Deposits/withdrawals | Wallet | `wallet/`, `financial/` | `deposits`, `withdrawals`, `networks` | D1 + private proofs + audit/event publication |
| Same-user and user-to-user transfer | Wallet transfer modal | `financial/`, `d1/` | `wallets`, `audit` | balanced ledger postings, Activity and idempotency |
| Convert | Wallet | `conversion/` | governed currency/config controls | backend quote+expiry, zero separate commission, Ledger |
| Spot | Spot trading surface | `spot/`, `d1/` | `spot`, `settlements` | Spot account, orders/fills, ledger and events |
| Margin | Spot/Margin trading surface | `spot/margin.*` | `exposure`, `spot` | USDT transferable account; real base-asset liabilities/repayments |
| Binary Options | `/dashboard/binary` | `binary/`, `settlement/`, `sandbox/` | `binary`, `settlements` | BINARY USDT reserve and WIN/LOSS settlement; isolated simulation |
| Mining/Earn | `/dashboard/mining` | `mining/`, `workflows/` | `mining` | Finance commitments, accruals and Activity |
| Loans | `/dashboard/loans` | `loans/`, `workflows/` | `loans`, `approvals` | Finance disbursement, obligations, repayment |
| VIP/referral | Settings/Profile | `referral-vip/` | `users`, `audit` | account attribution and reward history, Ledger rewards |
| Communications | Messages, Support, Learn, Announcements | `communications/`, `notification/` | `messages`, `support`, `learn`, `announcements`, `notifications` | D1 persistence, event delivery/read state |
| Frontend governance | Public routes/components | `admin/`, configuration services | `frontend-control`, `feature-flags`, `maintenance`, `navigation` | explicit audited configuration; Public readback |
| Monitoring | Browser instrumentation | `instrument.ts`, `observability/` | `src/sentry.ts` | Sentry telemetry only; D1 remains financial truth |

## Acceptance/evidence separation

Feature map presence proves **navigation only**. For every feature, record separately when asked: `SOURCE_IMPLEMENTED`, `TESTED`, `DEPLOYED`, `RUNTIME_VERIFIED`, `BROWSER_VERIFIED`, `OWNER_ACCEPTED`. Use actual source SHA and deployed artifact IDs. The final authenticated browser campaign uses Polypane + Chrome DevTools and authorized Coinbase Wallet with real SIWE, after the relevant deployments; it is not a prerequisite to static source closure.

## Ownership routing

Backend domain and contracts: [Backend](../backend/README.md). User behavior/design: [Frontend](../frontend/README.md). Admin permission/control: [Admin](../admin/README.md). Release/telemetry: [Sentry](../operations/NEXI_SENTRY_OBSERVABILITY.md). Older dated phase and production-program records are historical only.
