# NEXI Financial and Security Invariants

Current source/owner contract, not a historical phase program. Exact implementation and deployed status must be verified against source and runtime.

## Financial ownership


Each movement requires correct wallet/account ownership, supported asset, available/locked checks, signed numeric precision, idempotency, origin/destination, attributable status and audit linkage. Retries cannot duplicate principal or payouts, and a failed paired transfer cannot leave a one-sided mutation.

**Current SQLite authority (owner decision 2026-10-20):** NestJS uses the promoted VPS SQLite database and existing Ledger/EventOutbox contracts. The 2026-10-17 empty-SQLite observation and `D1_RUNTIME_ENABLED`/return-to-D1 write-freeze language are superseded migration history, not active instructions. Source-only assurance must trace writes through the configured SQLite adapter, financial gateway, Ledger, EventOutbox and idempotency. No claims of full financial reconciliation, new write safety, live workflow completion or migration restoration follow from source inspection. Owner-closed business acceptance is not reopened; do not change production database, flags, or deployed services without a separate deployment decision.

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

Public uses wallet-only SIWE; Admin uses distinct RBAC and guarded privileged commands. KYC document storage is private and scoped to the owner/reviewer. Focused negative authorization, idempotency, insufficient funds, concurrency, recovery and Activity correlation tests prove only their scenarios. Backend runtime, Sentry release evidence, and authenticated rendered acceptance through Chrome DevTools MCP configured with `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance` are distinct. MetaMask or another owner-selected wallet prompt is approved only after checking the live origin, account, chain, message and SIWE intent; a prompt outside the current DevTools session is not claimed as completed.


## Financial command lifecycle and recovery contracts

**Policy owner:** NestJS domain services and the single coordinated SQLite gateway. The existing source interface `backend/src/ledger/ledger-authority.service.ts:45-70` delegates settle/paired transfers to `backend/src/d1/d1-financial-command.gateway.ts`; the latter's D1 name is historical. Prisma and `better-sqlite3` are **not** independent Ledgers. Financial state must not be mirrored into Admin, Socket.IO, Valkey or market-provider memory as an alternate writer.

### Invariants by operation

| Operation | Required economic invariant | Source entry points inspected | Negative and recovery proof still required |
|---|---|---|---|
| Five-account movement | Eligible same-owner accounts, identical asset, debit and credit paired once, unique original key | `financial-operations.service.ts:182-227`, `d1-financial-command.gateway.ts` | Concurrent spends, mismatch replay, account restrictions, posting IDs and exact balances |
| Customer recipient transfer | Distinct verified users, amount + asset preserved, one paired debit/credit | `financial-operations.service.ts:230-249` | Invalid recipient, ownership, reuse of original key and lost acknowledgement |
| Withdrawal | Sensitive-action authorization, fees and gross reservation recorded, approval/reject/release auditable | `financial-operations.controller.ts:74-92`, `financial-operations.service.ts:72-179` | Provider dispatch/finality, unknown broadcast, fee/net disclosure, reversal and duplicate admin action; source response `providerLive:false` is **not** on-chain completion |
| Deposit | Only supported network/address and verified proof may authorize actual credit | `financial-operations.service.ts:340-373` and Admin deposit/Wallet owners | Network finality, reorg/disputed proof, duplicate hash, invalidation and compensating credit |
| Convert | Quote identity is not posted balance; accepted non-expired quote locks exact terms, records both assets once | `financial-operations.service.ts:251-280`, gateway `acceptConversion` | Decimal precision, spread/commission interpretation, quote expiration, debit+credit and Activity association |
| Spot | Order reserve ≠ fill; partial fill, fee, cancel and remaining reserve must reconcile | `spot/spot.service.ts:27-70`, gateway Spot order/fill commands | Fill/cancel race, amount/price/fee units, no duplicate fill and open-order preservation |
| Binary | One accepted stake, immutable input terms, one outcome with attributable provider/config/version, one settlement posting | `binary/binary.service.ts:29-170`, gateway `settleBinaryPositionAtomic` | Delayed source, tie/refund policy, expiry data, replay, WIN/LOSS vs technical-error UI |
| Isolated Margin | Collateral reserve, borrowed principal, interest and liquidation effects are distinct accounts/claims | `spot/margin.service.ts:33-285`, gateway Margin commands | Risk price provenance, debt after close, liquidation replay, collateral release, pending position |
| Mining/Earn | Commitment is not spendable; rewards require earned/accrual records, plan terms and entitlement | `mining/mining.controller.ts`, `mining/mining.service.ts` | Active subscription vs Admin entitlement, rate units, accrual/redeem and cancel |
| Loans | Application ≠ disbursement; principal debt, collateral, interest and repayment separately attributable | `loans/loans.controller.ts`, `loans/loans.service.ts` | Blank collateral, loan rate period, approval authority, partial/default/recovery |
| Admin correction | Operator permission, actor, reason, original request identity, Audit and canonical Ledger correction | `admin/admin.controller.ts`, `admin/admin.service.ts`, `financial-operations.service.ts:392+` | Public POSTED vs Admin FAILED mismatch, replay/missing audit and double correction |
| Research controls | Only approved research accounts; immutable audit, idempotency and active-position version/expiry; isolated sandbox data | `admin/admin.service.ts:1966-2137`, `binary/binary.service.ts:64-170` | Non-research access denied, stale override rejected, simulation leak prevented |

**Invariant status:** these are maintained requirements plus selected inspected implementations. This table is **not** an assertion that every gateway's SQLite statement sequence, unique index, concurrent lock path or failure compensation has passed testing. Exact source, durable WAL/journal state and controlled negative tests are mandatory before an operation's global correctness is claimed.

### Amounts, status and uncertainty

- All persisted financial identities must carry **asset, account scope, decimal precision, actual amount, unit and operation reference**. Source DTOs for some Spot routes expect decimal strings while other boundaries may transform numeric inputs. Never silently coerce large/precise financial strings to JavaScript floating-point numbers; check the actual route serializer and DTO before documenting wire-level compatibility.
- Available, locked, committed, borrowed, equity and estimated USDT valuation are different facts. A response's `total = available + locked` does **not** represent all Finance commitments or outstanding debt. A market catalog instrument is not necessarily a supported custody, deposit or transfer asset.
- Acceptance, processing delay, economic WIN/LOSS, final posted transfer, rejected command and client-unknown acknowledgment are different states. Do not invent wire enum strings from conceptual architecture diagrams. Show an operation ID and refresh durable readback when the HTTP response is lost. Do not repeat as a new key.
- If work becomes uncertain after durable commit, use original idempotency key, operation/position/order ID, Ledger and journal to reconcile. Only an explicit new authorized command may create a compensating reversal. A worker retry may replay a durable event, **never the original economic side effect**.
- Provider/market input must be distinguished by **source, timestamp, asset/pair, freshness, sequence and approval policy**. Binary normal settlement may use an approved quote; isolated research simulation has the `nexi-sandbox-simulation` source and must remain excluded from normal reference feeds.
- Every material Admin write must have authenticated operator authority, target, permission, reason, old/new effective state where relevant, durable audit ID and a same-source Public readback. UI access or a success toast is not evidence of backend permission.

### Coordinated transaction and post-commit obligations

1. Authenticate principal and scope; validate original key, asset/amount, configured limits and action-specific identity.
2. Resolve durable replay **before** deriving fresh dynamic terms that could change the meaning of the original intent.
3. Use the existing command gateway to commit the domain state and appropriate balanced Ledger/journal/audit/Activity/Outbox records as one coordinated economic effect; trace the actual SQL/Prisma transaction boundary for each operation.
4. Return stable operation and posting IDs, correct business status and whether the request was a replay. If a response is lost, re-query the original key or record.
5. Dispatch durable Outbox after commit. At-least-once queue and Inbox/consumer dedupe must not create a second financial mutation. Socket.IO is an advisory invalidation; Public/Admin reload persisted REST state.
6. Investigate interrupted commands using source/deployment identity, original intent and persistent IDs before any repair. Prefer auditable compensation over deleting or rewriting history.

Specific inspected evidence: `backend/src/financial/financial-operations.service.ts:182-280`; `backend/src/events/event-outbox.service.ts:68-112` (stable Outbox-row journal identity); `backend/src/spot/spot.service.ts:27-53` (immutable replay check); `backend/src/binary/binary.service.ts:132-170` (provider/sandbox source, payout, atomic settlement). See [architecture sequences](../architecture/NEXI_SYSTEM_ARCHITECTURE.md#real-source-traced-financial-sequences) for producer/consumer boundaries and [current state](../../NEXI_CURRENT_STATE.md) for dated test and deployment limitations.

### Verification classes and unresolved product decisions

**Necessary proof** for each feature: owner-approved product terms; controller DTO/guards; source gateway/table/unique key; successful and negative/replay tests at an exact SHA; actual deployed artifact identity; authenticated customer action; original-id SQLite Ledger/Activity/Outbox; Admin audit/readback; refresh/reconnect; explicit owner disposition. Focused suite success cannot override the recorded broad Backend failures or native SQLite teardown abort.

**Open decisions, not implementation assumptions:** exact loan/Mining interest and reward rate unit/time basis, external withdrawal provider/rail completion behavior, some VIP benefit financial semantics, tie/refund and delayed-quote policy where not encoded in current contract. Do not copy generic exchange conventions into NEXI policy until approved.
