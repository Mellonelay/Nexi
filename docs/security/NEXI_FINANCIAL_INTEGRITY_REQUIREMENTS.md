# NEXI Financial and Security Invariants

Current source/owner contract, not a historical phase program. Exact implementation and deployed status must be verified against source and runtime.

## Financial ownership

NestJS owns business decisions; D1 owns durable application and financial truth; Ledger balanced postings own accounting truth; EventOutbox owns durable publication. Valkey is cache/realtime, and Queues/Workflows deliver or orchestrate without creating financial authority. No direct Public/Admin financial database writes.

Each movement requires correct wallet/account ownership, supported asset, available/locked checks, signed numeric precision, idempotency, origin/destination, attributable status and audit linkage. Retries cannot duplicate principal or payouts, and a failed paired transfer cannot leave a one-sided mutation.

## Five account model

Funding (MAIN), Spot, Margin, Options (BINARY) and Finance are independent accounts. A supported same-user transfer moves the same asset atomically between any eligible pair. Separate NEXI-user transfers remain intact. Options and transferable user-facing Margin balances are USDT-only; Margin may have legitimate non-USDT trading liabilities. Mining commitments and Loan obligations cannot be treated as freely transferable funds.

## Product rules

- Spot: reserve before accepting orders; partial fills, fees, cancellations and leftover reserves reconcile.
- Margin: collateral, loans, position/liquidation, interest and repayment are auditable; borrowed funds do not masquerade as unrestricted available balances.
- Binary: reserve in the Options account precedes trade opening; recorded entry/expiry provenance, duration and configuration determine deterministic WIN/LOSS and payout. Controlled sandbox prices cannot contaminate shared live market feeds.
- Deposit and withdrawal: address/network confirmation, proof, approval/rejection and credit/debit status must be traceable.
- Convert: zero separate commission, without assuming zero spread; accepted quote and expiry govern posted amounts.
- Mining/Earn, Loans and referral: genuine commitments, disbursements, liabilities and earned credits produce correlated accounting and Activity.

## Authorization and verification

Public uses wallet-only SIWE; Admin uses distinct RBAC and guarded privileged commands. KYC document storage is private and scoped to the owner/reviewer. Focused negative authorization, idempotency, insufficient funds, concurrency, recovery and Activity correlation tests prove only their scenarios. Backend runtime, Sentry release evidence, and Polypane/Chrome DevTools/Coinbase Wallet UI acceptance are distinct.
