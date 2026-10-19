# NEXI Backend: Current Source and Domain Map


## Runtime and authority


## Domain feature inventory

| Domain | Main source owner(s) | Contract / persistence / invariants |
|---|---|---|
| Identity and SIWE | `auth/`, `users/`, `profile/` | Wallet-only SIWE, session/JWT policies, ownership checks, logout/security controls; no standalone password recovery |
| User verification | `kyc/`, local evidence-storage adapter | Authenticated document upload/submit; private VPS evidence storage; Admin review and permission boundary |
| Assets and market | `market/` | 53 market identities (17 crypto, 20 shares, 9 forex, 7 metals); provider normalization, quote freshness/provenance, klines, realtime streams, category-sensitive metadata |
| Wallet and transfers | `wallet/`, `financial/` | Funding (`MAIN`), Spot, Margin, Options (`BINARY`), Finance; account-scoped available/locked/total; authenticated same-user cross-account transfers; separate NEXI-user transfers |
| Accounting | `ledger/`, local SQLite financial-command gateway, `events/` | Balanced debits/credits, reserves/releases, idempotency, durable Activity and EventOutbox correlation; no financial truth in Valkey |
| Deposit/withdrawal | `wallet/`, `financial/`, `d1/` | Currency/network/address/QR, claims/proofs, approval or rejection, verification, settlement and Activity |
| Convert | `conversion/`, `financial/` | Backend quotes and expiry, source/destination eligibility, **zero separate commission**, atomic financial postings |
| Spot | `spot/spot.*`, `d1/` | Orders, fills, fees, cancellations, isolated Spot account balance and trade reporting |
| Margin | `spot/margin.*`, `d1/` | USDT-only user-facing transferable Margin wallet; independent base-asset positions, borrowing, collateral, interest, repayments and liquidation remain real liabilities |
| Binary Options | `binary/`, `settlement/`, `sandbox/`, `d1/` | USDT only in `BINARY`; Admin-configured durations/limits/payout, entry/expiry, controlled WIN/LOSS, legitimate ledger settlement; simulation must never pollute real chart prices |
| Finance products | `mining/`, `loans/`, `workflows/`, `d1/` | Plan/configuration, subscriptions/accrual, disbursement/repayment, commitments, loan obligations and accurate Activity |
| VIP/referral | `referral-vip/` | Tier/benefits, invitation and attribution, account-scoped referral history, reward history and genuine ledger rewards |
| Communications | `communications/`, `notification/`, `feedback/` | Support, messages, notification/read status, announcements, Learn publish/moderation; audit and async delivery |
| Governance and risk | `admin/`, `risk/`, `audit/`, `authority/` | Admin role/permission checks, actor/reason/audit, authorized configuration and security decisions |
| Runtime and observability | `runtime/`, `observability/`, `instrument.ts` | Readiness, lifecycle, Sentry errors/logs/traces/application metrics/Cron; verify deployed release independently |

## Five account model

Funding can hold supported funding assets; Spot holds supported trading assets; Margin and Options expose **USDT-only transferable balances** to the user; Finance represents available cash separately from mining commitments and loan obligations. Internal transfers between supported wallet pairs conserve the same asset; they do not silently convert or unlock restricted funds. Transfers to another NEXI account remain a separate action.

Every movement that affects financial state must be traceable through Ledger, Activity and (where published) EventOutbox: deposits/withdrawals, converts, wallet movements, Spot/Margin operations, Binary reserves/results, Mining, Loans, referral rewards and governed adjustments. Do not infer Activity completeness merely because a table exists.

## Interfaces and tests

- Controllers/DTOs and `docs/contracts/openapi.json` map endpoint names; check generation provenance before claiming API completeness.
- `backend/test/` and colocated specs are focused source proof, not real-wallet UI proof.
- Graphify can locate structural dependencies and affected paths; use direct source and real runtime for correctness claims.

See [VPS backend runtime map](../architecture/NEXI_VPS_BACKEND_RUNTIME.md), [system architecture](../architecture/NEXI_SYSTEM_ARCHITECTURE.md), [cross-surface map](../architecture/CROSS_SURFACE_FEATURE_MAP.md), [financial integrity](../security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md), and [Sentry operations](../operations/NEXI_SENTRY_OBSERVABILITY.md).

## Financial operation and market contracts

Financial commands require authenticated ownership, scoped account authorization, available/locked restrictions, asset eligibility, idempotency, and atomic or recoverably coordinated Ledger movements. Ledger postings, user-readable Activity and durable EventOutbox publication are distinct evidence targets; no client-constructed balance or synthetic transaction is authoritative.

Spot must reserve and release appropriate native assets, handle partial fills and fees, and settle through Spot balances. Margin presents USDT-only transferable cash but must maintain real borrowed-asset liabilities, repayment, interest and liquidation accounting. Binary Options reserves trade amounts exclusively from the BINARY USDT balance and records WIN/LOSS settlement without modifying other users' market-price feeds. Finance cash, Mining commitments and Loan debts are separate states.

All product movements—deposit, withdrawal, Convert, between-my-wallets transfer, another-user transfer, Spot/Margin, Binary, Mining/Earn, Loans, referral credit, authorized correction—require correctly correlated Activity. Quote metadata, reference display price, Kline/chart source and settlement-price authority are distinct market-provider roles. Provider fallback is not permission to change a trade's recorded settlement source. Source proof is not authenticated runtime proof.
