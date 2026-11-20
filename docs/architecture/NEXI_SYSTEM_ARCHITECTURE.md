# NEXI — maintained three-surface architecture

**Reconciled 2026-11-20 (Myanmar).** Owner decisions and actual source govern; this is a maintained architecture map, **not** a statement that every current source behavior is tested or deployed. Detailed historical maps are recoverable from Git. Before calling an API/SQLite/graph relationship current, check its source SHA and applicable source/contract.

## Specification navigation

- [Product operating model and 18 journeys](NEXI_PRODUCT_OPERATING_MODEL.md) owns feature behavior, user and operator entry points, expected outcomes, failure paths and recovery; its [implementation and correctness matrix](NEXI_PRODUCT_OPERATING_MODEL.md#nexi-product-implementation-and-correctness-matrix) is the cross-journey evidence index.
- [API operation and consumer map](../contracts/NEXI_API_OPERATION_MAP.md) owns the current static reconciliation of every documented operation to source wiring, guards, input types, delegate and literal client evidence.
- [Financial invariants and persisted lifecycles](../security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md#persisted-lifecycles-and-reconciliation-anchors) owns economic policy, traceable compensation and authoritative persisted state.
- [Acceptance tracker](../quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv) links each original criterion to its domain, journey and API/evidence locator alongside existing evidence and disposition. [The frozen criteria](../quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md) control wording.

Fallow 3.42.0 reported zero import-cycle or cross-surface boundary findings with the repository configuration. The checkout intentionally lacks a root node_modules; the Backend/Public/Admin workspaces instead link to separate verified shared stores under `/srv/nexi`. Root-scoped Fallow resolver warnings are tooling context, not evidence of broken dependencies; changed-code findings require independent source impact evidence. The Graphify source shortest path via FinancialHttpModule, FinancialOperationsController and FinancialOperationsService agrees with inspected module/handler source. Graphify reverse impact for MarketKlineQueryService points to the Kline controller and module. These results describe source structure.

### Blueprint requirement coverage

| Blueprint scope | Maintained specification and proof boundary |
|---|---|
| Parts I–II, architecture authority and correctness, §§1–8 | This architecture owns context, containers, components, deployment, security boundaries and six correctness layers. Current state owns dated source, test and release identities. |
| Part III, financial workflow method, §§9–12 | The source-traced sequences and financial invariants explain authenticated intent, atomic transfers, reserve/debit/credit, errors, replay and application versus declared schema relationships. Product domains define UI behavior. |
| Part IV, 15 product domains, §§13–27 | The product operating model gives each domain an outcome, UI/owner source, command or read boundary, state and recovery. Actual feature availability and deployment are evidence-qualified. |
| Part V, product contracts, §§28–34 | The API map covers all 279 documented operations and static AppModule ownership. Public design and Admin guide retain their own authority. Financial states, declared FKs, durable job recovery and runtime boundaries are described here and in the financial invariants. |
| Part VI, requirements, journeys and evidence, §§35–39 | The 18 journeys describe operation and recovery. The 113 tracked IDs have exact requirement wording and separate domain, journey and API/evidence locators. No status advances without the relevant proof. |
| Appendices A–D | The documentation index lists authority owners. Provenance appears in the graph and API sections. The UI-first guide preserves historical regression seeds and proof ownership. Unresolved decisions and candidate runtime discontinuities stay visible. |

## Deployment and ownership
| Surface | Source | Runtime owner | Responsibility |
|---|---|---|---|
| Customer | `frontend/` Next.js 16/React 19 App Router | `/srv/nexi/public/current` / `nexi-public.service` | Mobile-first Web3 DApp-browser UI, SIWE, markets/charts, wallet, trading, Finance and messaging |
| Operator | `Admin/` React/TanStack Router/Start, Vite/Nitro | `/srv/nexi/admin/current` / `nexi-admin.service` | Permission-aware desktop administration and authenticated API consumption |
| API | `backend/` NestJS 12, Prisma 7, native SQLite | `/srv/nexi/backend/dist` / `nexi-api.service` | Domain authority, transaction policy, Ledger/audit/outbox, REST and realtime |

Name.com DNS and VPS Nginx route `www.nexitrading.app`, `admin.nexitrading.app`, and `api.nexitrading.app`. Financial truth is the promoted SQLite database at `/var/lib/nexi/sqlite/nexi-staging.sqlite` (historical filename, **not disposable**). `D1PrismaService`, `d1_*` source identifiers and `d1_migrations` preserve compatibility names; Cloudflare Worker/D1 are **not** NEXI's live application/financial runtime.

Prisma 7 and the native `better-sqlite3` gateway address the **same** durable store. `LedgerAccount`/`LedgerPosting`, business-state tables, user Activity and `EventOutbox`/`EventInbox` supply authoritative accounting, readback and durable intent. `LocalDurableJob*` and `LocalWorkflow*` persist dispatch/recovery state; these are workflow records, not a separate accounting Journal. BullMQ 6 / Aiven Valkey transports work and Socket.IO projects events; neither creates financial truth or guarantees exactly-once delivery. KYC/proof files require private access and verified provenance.

```mermaid
flowchart TD
 P[Public Next.js] --> N[VPS Nginx]
 A[Admin TanStack] --> N
 N --> API[NestJS auth / DTO / domain policies]
 API --> TX[Prisma + native SQLite transaction gateway]
 TX --> DB[(SQLite: business state + Ledger)]
 TX --> O[Audit / Activity / Outbox / Inbox / workflow journal]
 O --> Q[BullMQ / Valkey: retries and transport]
 API --> WS[Socket.IO post-commit projection]
 WS --> P
 WS --> A
 API --> RD[Authenticated REST/readback]
 RD --> P
 RD --> A
```

## Canonical producer -> consumer and financial invariant
1. Public wallet/customer or permissioned Admin submits an immutable intent and explicit original-request identity.
2. NestJS authenticates, authorizes and validates state/configuration, balances, ownership, asset/precision and replay/mismatch guards.
3. Coordinated SQLite write commits domain record, balanced Ledger effect, durable audit/Activity/Outbox as applicable; failures are not success-shaped.
4. Worker delivery is at least once; retry checks durable original intent/Inbox and must not double-post. Socket updates are advisory; clients reconcile persisted REST/readbacks.
5. Public and Admin present one truthful status for the same command, account, amount, asset, direction and receipt. An HTTP 200, UI toast, structural graph path or single Ledger row does not establish whole-user-flow correctness.

## Source-domain ownership
| Capability | NestJS owner | Public / Admin consumer |
|---|---|---|
| SIWE, account/session and permissions | `auth/`, `users/`, `profile/`, `referral-vip/` | login/settings; Admin users/sessions |
| Market catalog, 53 identities, quote/Klines | `market/` | Quotes/Asset Detail/Spot/Options; Admin assets/market-feeds |
| Wallet, deposit, withdrawal, transfer and Convert | `wallet/`, `financial/`, `conversion/`, `ledger/`, `d1/` | Wallet/Activity; Admin networks/deposits/withdrawals/ledger |
| Spot and isolated Margin | `spot/`, local financial command gateway | Spot/Margin/orders; Admin spot/exposure |
| Options/Binary and controlled research | `binary/`, `admin/`, `sandbox/`, settlement gateway | Options chart/positions; Admin research/default/override/settlements |
| Mining, Loans, referral/VIP | `mining/`, `loans/`, `referral-vip/`, `workflows/` | Finance; Admin product settings and audit |
| Messaging, notifications, Learn and support | `communications/`, `events/` | Customer panels; Admin messages/content/notifications |

Five customer-facing wallet scopes are Funding/MAIN, Spot, Margin, Options/BINARY and Finance. Options and user-transferable Margin cash are USDT-only, but liabilities and held assets are distinct; Finance commitments are not freely available. The 53 market symbols are **not** 53 custodial/deposit assets.

## Owner-approved Binary research architecture
Eight logical Admin workspaces and account-level research default + active position-specific override exist in the source. NestJS `AdminService.persistBinaryResearchControl` guards eligible research accounts, actor/reason, original request key, audit receipt and position version/expiry. `BinaryService.buildSandboxSimulation` generates isolated deterministic candle projection; `frontend/app/lib/binary-sandbox-chart.ts` validates the simulation and aggregates a chart. Do not conflate simulation with shared provider prices or create a second settlement/financial writer. Verify the exact current source and real Admin/Public same-release state before making a runtime PASS claim. Original owner design: `Admin/docs/NEXI Admin — Unified Navigation and Binary Control Architecture-2026-10-21-144002.png`.

## Current market architecture and proof limits
The market source separates bounded ticker/Kline processing from best-effort trade/depth. [MarketIngestService](../../backend/src/market/market-ingest.service.ts) uses a 256-entry reference queue and a ticker/Kline lane that can grow to 1,024 entries for closed Klines after replaceable data is exhausted. Its saturation counters and shutdown path explicitly allow drops, including closed Klines. MarketKline is unique on (pairId, interval, openTime), and pairId references MarketPair. [BinaryService](../../backend/src/binary/binary.service.ts) separately resolves an eligible expiry source or delays settlement, and persists price provenance. Research simulation has its own scoped path. Runtime saturation, recovery, freshness and financial-resource interference require deployed measurements. See the [market ADR](ADR-2026-11-18-NEXI-MARKET-DATA-RESOURCE-ARCHITECTURE.md).

## Proof and current status
The [current state](../../NEXI_CURRENT_STATE.md) records the Backend-wide receipt: 136 suites, 819 passed tests and zero skips on test-only Node 24.22.0. It supersedes the earlier broad failure and native cleanup abort for that test environment. All three services were observed active since November 17. Candidate artifact identity and authenticated mobile Web3/Admin acceptance remain open.

Reference owners: [root AGENTS](../../AGENTS.md), [financial invariants](../security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md), [source OpenAPI](../contracts/openapi.json), [operator guide](../../Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md), [Public design](../../frontend/DESIGN.md), [operations](../operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md).


## Architecture and product operating specification

**Evidence boundary.** The original source walkthrough was recorded at 9c1bab8af977. Selected implementation, schema and graph relationships were reconciled at c7f64d8608af9c5a718826bccfa8aecac271a547. The OpenAPI artifact still contains 253 paths and 279 operations. Source and schema establish selected contracts and constraints. The [113 frozen requirements](../quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md) retain their original wording. Their ID mapping here serves as navigation. The observed November 17 service artifacts have separate release provenance.

### Six-layer correctness contract

| Layer | Specification owner | Necessary evidence | Current assessment |
|---|---|---|---|
| 1. Component | Controllers/DTO validators, domain helpers, React components | Source rule and focused behavior tests at matching SHA | **PARTIAL**: dated focused Backend 74, Public 62, Admin 36 passing; not comprehensive |
| 2. Integration | REST/Socket producers and authenticated Public/Admin consumers | Request/response compatibility, role/identity, state propagation, replay | **PARTIAL**: 279 operations mapped to static wiring and source contracts. DTO discrepancies and runtime gaps are recorded in the [operation map](../contracts/NEXI_API_OPERATION_MAP.md). |
| 3. Business/financial | [Financial integrity](../security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md) and SQLite domain commands | Balanced postings, reserves, idempotency, atomic durable state, cross-account readback | **SOURCE CONFIRMED for selected paths**; broad negative/concurrency verification incomplete |
| 4. UI/UX | [Public design](../../frontend/DESIGN.md) and [Admin operator guide](../../Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md) | Rendered mobile Web3 DApp browser and authenticated Admin sessions, keyboard/viewport/error states | **UNKNOWN on candidate release**; static source and emulator are not real-wallet acceptance |
| 5. End-to-end product | [113 frozen criteria](../quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md), [18 journeys](../quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md) | Before → UI action → durable domain state/Ledger → Activity/Admin → reload/recovery, same identity | **NOT CUSTOMER ACCEPTED for candidate release** |
| 6. Operational/release | [Current state](../../NEXI_CURRENT_STATE.md), [VPS runbook](../operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md) | Broad tests, native SQLite lifecycle, release hashes, Sentry, rollback and runtime reconciliation | **PARTIAL**: the Backend-wide receipt passes on test-only Node 24.22.0. Candidate artifact identity and release acceptance remain open. |

Specification correctness asks whether the behavior is owner-approved. Implementation correctness asks what verified source and matching tests establish. Observed correctness asks what the identified deployed release and authenticated customer or operator actually experienced.

A feature is evaluated independently as **SPECIFIED** (owner rule), **SOURCE_CONFIRMED** (verified code at named SHA), **TEST_CONFIRMED** (executed matching test), **RUNTIME_CONFIRMED** (observed deployed identity), or **CUSTOMER_ACCEPTED** (authenticated same-release journey). **CONFLICT**, **PARTIAL**, and **UNKNOWN** remain visible; these architecture labels do not replace the frozen acceptance tracker dispositions.

### C4 — system context and trust boundaries

```mermaid
flowchart LR
  Customer["Customer in Web3 DApp browser"] --> Public["NEXI Public"]
  Wallet["Ethereum mainnet wallet / SIWE signer"] <--> Customer
  Operator["Authorized Admin operator"] --> Admin["NEXI Admin"]
  Public --> Platform["NEXI platform boundary"]
  Admin --> Platform
  Providers["External market/quote providers"] --> Platform
  Chain["External chain / rail evidence"] -.-> Platform
  Platform --> Observer["Sentry / operational monitoring"]
```

Customer wallet signature authenticates an identity/session; it is **not** itself an on-chain transfer or economic posting. Customer authentication and the privileged Admin operator principal are distinct. Provider prices are reference inputs with provenance; they do not directly grant wallet spending authority. External rail settlement requires separate supported custody/chain proof.

### C4 — containers, owned state and post-commit readback

```mermaid
flowchart TB
  Browser["Web3 browser: Next.js Public"] --> Nginx["VPS Nginx HTTPS"]
  Operator["Operator browser: TanStack Admin"] --> Nginx
  Nginx --> API["NestJS REST controllers + Socket.IO"]
  API --> Auth["Guards, DTOs, role/ownership policy"]
  Auth --> Domains["Financial / Binary / Spot / Margin / Loans / Mining / Wallet"]
  Domains --> Gateway["One coordinated Prisma 7 + native SQLite financial gateway"]
  Gateway --> SQLite[("Durable SQLite: domain records, Ledger, Activity, Audit, Outbox/Inbox, workflow state")]
  SQLite --> Dispatch["Outbox dispatcher / workflow recovery journal"]
  Dispatch --> Queue["BullMQ 6 / Aiven Valkey transport"]
  Queue --> Worker["Idempotent domain workers"]
  Worker --> API
  API --> Readback["Scoped persisted REST read models"]
  Readback --> Nginx
  API -. "advisory post-commit" .-> Socket["Socket.IO"]
  Socket -.-> Browser
  Socket -.-> Operator
  Market["External market sources"] --> Ingest["Market provider adapters + bounded ingest"]
  Ingest --> API
```

The directional arrows represent architectural interactions, not a proof that all source consumers have been integration-tested. In particular the market ingestion buffers are **in-memory**, with best-effort shutdown grace, and are not crash-durable queues. Financial commands must not rely on Socket delivery or Valkey acknowledgment for authoritative completion.

### Deployment ownership and release identity

```mermaid
flowchart LR
  DNS["DNS"] --> NG["Nginx on VPS"]
  NG --> PUB["nexi-public.service /srv/nexi/public/current"]
  NG --> ADM["nexi-admin.service /srv/nexi/admin/current"]
  NG --> BACK["nexi-api.service /srv/nexi/backend/dist"]
  BACK --> DB[("/var/lib/nexi/sqlite/nexi-staging.sqlite — protected durable DB")]
  BACK --> VK["Aiven Valkey"]
  BACK -.-> S["Sentry / traces"]
```

Runtime source revision, installed package tree, built artifact, service process command, deployed release/Sentry identifier and acceptance screenshots are **separate identities**. Backend, Public and Admin each retain their own shared dependency store. The historical `/srv/nexi/backend/current` symlink was observed dangling in an earlier read-only audit, while the API service ran from `/srv/nexi/backend/dist/src/main.js`; the symlink alone does not prove downtime. Never infer new source deployment from the Git HEAD.

### C4 — Backend components and trust transitions

```mermaid
flowchart TD
  P["Public wallet session"] --> H["Public HTTP guard and DTO boundary"]
  A["Admin operator session"] --> R["Admin auth surface, role and permission checks"]
  H --> D["NestJS domain modules"]
  R --> D
  D --> F["Financial services and native SQLite command gateway"]
  D --> M["Market authority, Klines and provider routing"]
  F --> S[("SQLite domain and Ledger; workflow journal")]
  F --> E["Committed outbox and durable job handoff"]
  E --> W["BullMQ workers and Inbox"]
  W --> N["Scoped Socket.IO or notification projection"]
  D --> Q["Authenticated REST read models"]
  S --> Q
```

Public wallet and Admin requests have independent principals. The [bootstrap](../../backend/src/main.ts) configures credentialed CORS from runtime origins, DTO transformation, field whitelisting and rejection of unknown fields. [Auth surface guard](../../backend/src/auth/auth-surface.guard.ts) and [Admin permission guard](../../backend/src/admin/admin-permission.guard.ts) enforce surface/permission metadata. [Communications gateway](../../backend/src/communications/communications.gateway.ts) joins authenticated user/session rooms and separately permissioned Admin rooms. Private KYC/proof paths are scoped. Worker events never grant authority to submit a monetary command. Shared market ingestion and settlement price authority use separate contracts. The [operation map](../contracts/NEXI_API_OPERATION_MAP.md) identifies registered source handlers and explicit guard metadata.

### Backend component ownership — real entry points

| Component | Current source entry point | Boundary and selected confirmed behavior |
|---|---|---|
| Identity | `backend/src/auth/auth.controller.ts`, `auth/wallet-auth.service.ts`, `auth/auth-session.service.ts` | SIWE challenge/verify and session policies; verify actual nonce, origin, chain and expiration per route |
| Wallet and ledger read | `backend/src/wallet/wallet.controller.ts`, `wallet/wallet.service.ts`, `ledger/ledger-authority.service.ts` | User/account scoped read models and paired posting gateway |
| Financial operations | `backend/src/financial/financial-operations.controller.ts:40-225`, `financial-operations.service.ts:72-280` | Sensitive-action withdrawal guard; account-transfer and Convert quote/accept commands |
| SQLite authority | `backend/src/d1/d1-financial-command.gateway.ts`, `d1/local-sqlite-bridge.service.ts` | `pairedTransfer`, reserve/settle and Ledger/Idempotency records; legacy “D1” is a source name, not Cloudflare |
| Spot | `backend/src/spot/spot.controller.ts:20-145`, `spot/spot.service.ts:27-70` | Original `idempotencyKey` replay and immutable order terms, internal matching and cancel |
| Isolated Margin | `backend/src/spot/margin.controller.ts:31-180`, `spot/margin.service.ts:33-285` | Margin account transfer, position, cancel-pending, close/liquidation handlers |
| Binary | `backend/src/binary/binary.controller.ts:15-90`, `binary/binary.service.ts:29-170` | Open/settle, delayed quote, isolated sandbox/provider provenance, atomic settle gateway |
| Research governance | `backend/src/admin/admin.controller.ts`, `admin/admin.service.ts:1966-2137` | Research-account allowlist, original key, actor/reason, durable audit, active position/version guard |
| Mining and Loans | `backend/src/mining/mining.controller.ts`, `loans/loans.controller.ts` | Plan/subscription/redemption; application/approval/repay, separately guarded Admin paths |
| Messaging | `backend/src/communications/communications.controller.ts:79-175` | Canonical `/communications/support/messages`; obsolete recipient-selected POST intentionally returns 410 |
| Market data | `backend/src/market/market-public.controller.ts`, `market-kline.controller.ts`, `market-ingest.service.ts` | Prices, assets, Klines, depth/trades and reference ingestion; no implied execution or settlement price |
| Events | `backend/src/events/event-outbox.service.ts:53-112` | Claims committed Outbox rows and attempts publication; stable row identity on retry |

FinancialHttpModule imports AuthModule and FinancialOperationsModule. FinancialOperationsModule imports LedgerModule and D1PrismaModule and exports the policy service. AdminModule imports that policy module for privileged operations. LocalAsyncModule imports EventsModule and WorkflowCommandsModule for event and workflow handling. MarketModule imports BinaryModule. A static walk from AppModule found 30 reachable local module declarations and 103 explicit local module import edges without a cycle. ContractModule was the only local declaration outside that traversal. This check covers explicit module imports. Runtime provider resolution and dynamic dependencies remain separate.

### Real source-traced financial sequences

**Same-user Funding → Spot account transfer** (source-confirmed command path):

```mermaid
sequenceDiagram
  actor U as Customer
  participant P as Public Wallet
  participant C as FinancialOperationsController
  participant S as FinancialOperationsService
  participant G as SQLite command gateway
  participant L as Ledger and durable records
  participant A as Admin operator
  participant R as Wallet and Admin read APIs
  U->>P: Review same-owner amount, asset, source/destination
  P->>C: POST /financial/account-transfers + idempotencyKey
  C->>S: JWT owner / validated DTO
  S->>S: Validate five scopes, distinct accounts, decimal, asset support
  S->>G: pairedTransfer(debitAccountId, creditAccountId, original key)
  G->>L: Coordinated source/debit and destination/credit effects
  G-->>S: Posting IDs and replay status
  S->>G: Read source/destination balances
  S-->>P: transfer, balances, postings, replayed
  P->>R: Refresh wallet and Activity by original intent
  A->>R: Read ledger independently through the guarded Admin API
  Note over P,A: On lost response, query the original intent before retrying
```

**CONFIRMED.** [FinancialOperationsController](../../backend/src/financial/financial-operations.controller.ts) requires JWT and the Public auth surface, taking the owner from the authenticated request. The [service](../../backend/src/financial/financial-operations.service.ts) checks both scopes and decimal amount and resolves eligible accounts for that owner. [The gateway](../../backend/src/d1/d1-financial-command.gateway.ts) checks the replayed posting identity and immutable terms, fences balance changes, and submits both posting legs, audit, Activity and the transfer outbox event in one [native SQLite immediate transaction](../../backend/src/d1/local-sqlite-bridge.service.ts). The service returns posting IDs and balance strings. Its total is available plus locked for this response. [TransferModal](../../frontend/app/dashboard/wallet/components/TransferModal.tsx) checks the returned terms and receipt and, after an ambiguous response, looks up same-owner completion in Activity by the original key. [Admin Ledger](../../Admin/src/admin/data/nexi-api-provider.ts) is a separate guarded readback. Customer-to-customer transfers additionally persist a Gate2InternalTransfer record and recipient audit.

**Customer-to-customer transfer** is a **different** command: `POST /financial/transfers` → `FinancialOperationsService.transfer:230-249` resolves a recipient user/code, prohibits self-transfer, checks replay ownership/terms and executes `pairedTransfer`. Distinct user identity, recipient visibility and audit require independent negative tests.

**Convert** is explicitly two-phase: `POST /financial/conversion/quote` → `createConversionQuote:251-266`; `POST /financial/conversion/accept` → `acceptConversion:269-280` with quote ownership, accepted-key replay, OPEN/expiry validation and gateway `acceptConversion`. Quote presence alone is **not** an accepted economic exchange. Source-supported pair enumeration `getConversionPairs:285-338` evaluates configured vs market-quoted rates. Confirm accepted two-asset Ledger/Activity deltas independently; zero separate commission does not imply zero spread.

**Withdrawal**: `POST /financial/withdrawals` → controller `verifySensitiveAction` at `financial-operations.controller.ts:74-92`, service `requestWithdrawal:72-90` validates the positive decimal amount, original key, immutable asset/network/destination/fee replay, and calls gateway `reserveWithdrawal`. Admin review/approve/reject/release reside in `financial-operations.service.ts:92-179`. The inspected service responses explicitly contain `providerLive:false`; **do not represent external broadcast as completed** without a separate supported provider receipt and settlement state.

**Deposit**: supported asset/network, owner-controlled deposit/proof intent, proof submission and approval must be distinguished from an actual on-chain-confirmed credit. Entry points `financial-operations.service.ts:340-373`, `wallet/wallet.controller.ts` and Admin deposit review. On-chain automation, supported rails, confirmation count and reversal policy require explicit rail-specific evidence, not a generic architecture diagram.

**Spot**: `POST /spot/order` → `SpotService.placeOrder:27-57`; it queries the original order by key **before** re-evaluating a changing market protection price. Mismatched replay terms reject. Source `matchOrders:65-71` uses the internal gateway, `cancelOrder:59-63` calls durable cancel. The open order, partial-fill, fees and reserve-release state machine must be derived from `d1-financial-command.gateway.ts`, not from external Binance matching semantics. UI distinguishes requested notional from executed cost, fee asset, locked remainder and terminal fill/cancel; the historical amount discrepancy is an investigation seed, not a current FAIL.

**Binary**: `POST /binary/position` → `BinaryService.openPosition:29-33`; `POST /binary/settle` → `settlePositionOnD1:64-101` resolves config and approved provider quote or delays settlement. A research-scoped position may instead use isolated directives. `persistSettlement:132-170` records `expiryProvider`, `expirySource`, observed/received timestamps, sequence, stake, payout and expected research version into `settleBinaryPositionAtomic`; it emits a post-settlement notification only if not replayed. Admin research controls at `admin.service.ts:1966-2137` enforce eligible accounts, audit receipts and version/expiry. `frontend/app/lib/binary-sandbox-chart.ts:48-75` validates `nexi-sandbox-simulation` and direction/outcome consistency. **Product contract:** posted WIN/LOSS vs technical settlement delay/error are separate; never re-label a posted LOSS as a failed payout. Sandbox candle display must not overwrite common market price history.

**Margin**: `/spot/margin/positions` and `/spot/margin/transfer` → `MarginService`. Track collateral, borrowed liability, position equity and liquidation separately; an accepted Spot reserve is not automatically margin collateral. Current source has pending cancellation and close paths; interest unit, risk configuration and live liquidation evidence must be checked against actual product terms.

**Mining and Loans**: `/mining/subscribe|redeem|cancel` and `/loans/apply|repay` are backend-owned commands with distinct Admin plan/approval endpoints. A subscription entitlement is not unrestricted spendable cash; loan principal is a liability. Mining `dailyYield` is an Admin-configured fractional daily rate; historical examples do not define mandatory economics. Inspected LoanService applies its configured `interestRate` once to principal for `durationDays`. Customer-facing Loan rate description and collateral valuation require evidence, not assumptions from blueprint examples.

### State ownership and recovery — conceptual, not new API enums

| Domain | Typical lifecycle / ambiguity | Required source-of-truth and recovery |
|---|---|---|
| Deposit | Proof submitted → verified/approved → credited or rejected; chain-finality distinct | Network/proof record + canonical credit posting; unknown finality must not produce success toast |
| Withdrawal | Requested/reserved → review/approval/rejection → external completion or release | Withdrawal record, fee and reserve postings, audit and provider receipt; false success if `providerLive:false` |
| Internal transfer | Draft → accepted → posted, rejected, or client-unknown | Same key + debit/credit posting IDs; query original after timeout |
| Convert | Quote OPEN → accepted/expired/rejected → posted conversion | Quote ID, acceptance key, rate/amounts and paired per-asset postings |
| Spot | OPEN ↔ PARTIALLY_FILLED → FILLED or CANCELED/REJECTED | Order/fill identities, actual price/qty/fees and only residual reserve released |
| Binary | OPEN → expiry processing/delayed → settled WIN/LOSS (equal price LOSS), with distinct retryable delay or technical ERROR and no DRAW/refund outcome | Immutable entry/expiry source, config, ledger result and Public/Admin state alignment |
| Margin | Pending/collateralized → open/closing/liquidating → closed/liquidated or recoverable pending | Position, debt, collateral, Ledger postings and Activity/workflow evidence; never erase outstanding liability |
| Mining | Entitlement → subscribe/commit → accrual/maturity/redemption/cancellation | Subscription, principal commitment, earned reward and admin-configured terms |
| Loan | Application → review/approved/rejected → disbursed → accrual/repay/default | Loan and collateral IDs, principal liability, interest basis and repayment postings |
| Events/notifications | Outbox persisted → claim/attempt → publish/retry/dead letter → consumer replay | Durable Outbox/Inbox, scoped read model and resnapshot; delivery not finality |

These state words are an **architectural vocabulary**. Only current DTOs, model definitions and gateway transitions establish wire enum names. For timeout-after-commit, display **outcome unknown pending original-ID readback**, not retry-as-new. For failure-after-post, use a distinctly auditable compensating posting rather than removing history.

### Data authority and invariants

```mermaid
flowchart LR
  User["Customer identity"] --> Account["LedgerAccount: owner, scope, asset"]
  Account --> Posting["LedgerPosting: reference + deltas"]
  Command["Original financial intent / idempotency"] --> Posting
  Command --> Domain["Order / position / transfer / conversion / loan / withdrawal"]
  Domain --> Journal["Workflow/dispatch recovery records / Activity"]
  Domain --> Outbox["EventOutbox"]
  Outbox --> Inbox["EventInbox / at-least-once consumer"]
  Domain --> Audit["AdminAuditLog when privileged"]
```

The diagram shows application associations. The [schema-backed relationships](#schema-backed-sqlite-entity-relationships-and-exact-state-vocabulary) below give the SQL foreign-key and unique-key boundaries. Policy remains with [financial integrity](../security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md).

### API contract and consumer reconciliation

The [operation map](../contracts/NEXI_API_OPERATION_MAP.md) matches the 253-path/279-operation artifact to 279 handlers reachable from AppModule, and records the exact inputs, guard decorations, delegates and literal client candidates. Four decorated legacy /lever routes belong to an unwired ContractModule. The previous GET /auth/profile match came from a comment. The map records the currency, Mining and Loan decimal schema discrepancies and distinguishes 410 compatibility routes from active product endpoints.

| Route contract (documented) | Controller/service source | Consumer / amount and failure policy |
|---|---|---|
| `POST /auth/wallet/challenge`, `/verify` | `auth/auth.controller.ts`, wallet auth | Public login/provider; chain 1, nonce/expiry and session re-read |
| `POST /financial/account-transfers` | `financial-operations.controller.ts:95-137` → service 182-227 | Public wallet; decimal string amounts, original key, posting IDs |
| `POST /financial/transfers` | controller 140-147 → service 230-249 | Recipient ID/code, ownership and immutable transfer terms |
| `GET /financial/withdrawal-capabilities`, `POST /financial/withdrawals` | controller 66-92 → service 72-90 | Network/fee/limits and sensitive-action authorization; provider-live status |
| `POST /financial/conversion/quote`, `/accept` | financial controller → service 251-280 | Quote vs posted state, expiry and key replay |
| `POST /spot/order`, `/cancel`, `GET /spot/orders/by-intent` | `spot.controller.ts`, `spot.service.ts:27-99` | Price, size, fill, reservation, replay/readback |
| `POST /binary/position`, `/settle`, `GET /binary/positions/*` | `binary.controller.ts`, `binary.service.ts` | Settlement provenance and economic-vs-processing status |
| `GET /market/prices|klines|depth|trades` | market public/Kline controllers, market services | Provider timestamp/freshness; reference data, not guaranteed liquidity |
| `POST /communications/support/messages` | `communications.controller.ts:102-113` | Persisted customer→operator support conversation |
| `POST /communications/messages` | `communications.controller.ts:150-159` | **Intentionally retired**, authenticated 410 Gone, not active messaging |
| `POST /loans/apply|repay`, `POST /mining/subscribe|redeem` | loan/mining controllers and services | Collateral/term/entitlement, liability and Activity receipts |
| `PATCH /admin/... research controls` | `admin.controller.ts` → `admin.service.ts:1966-2137` | Privileged Admin provider, actor/reason/idempotency/audit/version |

Primary Admin API consumer: `Admin/src/admin/data/nexi-api-provider.ts` (backend gateway, not an authority). Primary Public routes reside under `frontend/app/dashboard/`; `frontend/DESIGN.md` controls interaction and the provider/client call site must be checked for every changed route. The spot service’s decimal-string inputs and DTO transformation at other gateways must **not** be treated as automatically equivalent numerical contracts. Contract drift review needs method/path, decorator guards, input DTO, serializer/error, OpenAPI operation, typed consumer, unit/precision, replay semantics, and response state.

### Fifteen-domain product coverage map

| Domain / acceptance IDs | Customer or operator journey | Source owner + consumer and proof focus |
|---|---|---|
| 01 `NEXI-01-01…08` | Web3 connect → challenge → SIWE → onboarding; expired/changed wallet recovery | `auth/`, Public login/settings, Admin identity; actual DApp browser/session/chain 1 |
| 02 `NEXI-02-01…08` | Five accounts, exact available/locked/committed balances and Activity | `wallet/`, `ledger/`, Public Wallet, Admin ledger; readback vs postings |
| 03 `NEXI-03-01…08` | Network-supported deposit/proof; withdrawal review/approval/status | `financial/`, `wallet/`, Admin deposits/withdrawals; chain proof and fee/reserve |
| 04 `NEXI-04-01…08` | Same-owner and recipient transfer; quote→Convert acceptance | `financial/`, `conversion/`, SQLite gateway, Public Wallet; paired posting and original key |
| 05 `NEXI-05-01…10` | Binary side/duration/stake, expiry and outcome; research account isolation | `binary/`, `admin/`, sandbox, Public Binary, Admin settlement; accepted config/provider provenance |
| 06 `NEXI-06-01…08` | Spot market/limit, open/partial fill/cancel, fee and Activity | `spot/`, gateway, Public Spot, Admin Spot; quantity vs actual fill and reserves |
| 07 `NEXI-07-01…07` | Margin funding, leverage/collateral, risk/close/liquidation | `spot/margin.*`, Public Spot/Margin, Admin exposure; debt/collateral and recovery |
| 08 `NEXI-08-01…07` | Mining/Earn plan subscription, entitlement; Loan application/repayment | `mining/`, `loans/`, Admin plans and Finance; rate units/liabilities |
| 09 `NEXI-09-01…08` | Unread bell/panel, persisted notifications, reconnect | `events/`, `communications/`, Public notifications, Admin notifications; durable event ID |
| 10 `NEXI-10-01…07` | Customer support conversation and Admin reply | `communications/`, Public Messages/Support, Admin Messages; scoped message ID/attachment |
| 11 `NEXI-11-01…07` | 53 symbol catalog, Klines, chart intervals/indicators and stale state | `market/`, Public charts, Admin feeds; reference provenance, bounded queues |
| 12 `NEXI-12-01…06` | Profile, SIWE session/security, KYC, referrals/VIP | `profile/`, `auth/`, `kyc/`, `referral-vip/`; owner/reviewer controls |
| 13 `NEXI-13-01…07` | Eight Admin workspaces, guarded config, Public propagation | `admin/`, `Admin/src/admin/data/nexi-api-provider.ts`, Public product consumers; audit/version |
| 14 `NEXI-14-01…07` | 320–440px mobile Web3 use, keyboard, safe area, full values, recovery | [DESIGN](../../frontend/DESIGN.md), Public components and five-tab dock; rendered wallet browser |
| 15 `NEXI-15-01…07` | One customer command reconciled across all surfaces and release | Ledger/Outbox, Public/Admin, Sentry/version; exact receipt, broad gate and owner acceptance |

**Requirement traceability.** The [frozen criteria](../quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md) own verbatim wording. Each [tracker row](../quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv) carries domain and journey navigation, source:line owner/handler anchors, any located Public/Admin consumer link, proof receipt/environment references, and the untouched existing status. These anchors help locate relevant implementation; they do not exhaustively prove the full semantic breadth of a criterion. Missing consumer mappings remain explicit UNKNOWN, and a source location never upgrades status to proof. The historical November 8 16/24/8/65 snapshot is separate from later dated tracker states.

### Eighteen UI-first acceptance journeys — proof ownership

See the [complete journey contracts](NEXI_PRODUCT_OPERATING_MODEL.md#journey-specifications) and the separate [execution procedure](../quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md). The table below is a short proof navigation index.

| Journey | Expected cross-surface evidence |
|---|---|
| J01 SIWE onboarding | Live wallet provider, challenge, signature, session/account IDs, reconnect |
| J02 Mobile shell | Five labeled routes, safe-area/keyboard/short viewport, accessible focus |
| J03 Admin credit | Authorized operator, exact reason/receipt, SQLite postings and Public refresh; financial action separately authorized |
| J04 Wallet portfolio | All five scopes, full precision, asset catalog vs custodial balances |
| J05 Deposit | Actual supported network/proof state, verified credit and Admin review |
| J06 Withdrawal | Fee/gross/net, sensitive-action authorization, approval and provider settlement truth |
| J07 Internal transfer | Original key, two posting IDs, before/after balances and Activity |
| J08 Convert | Quote ID/expiry, acceptance key, posted cross-asset totals |
| J09 Binary | Direction/stake/duration, provider/config/version, one settlement posting and status |
| J10 Spot | Order vs fills, remaining reserve, fee asset and cancel race |
| J11 Margin | Collateral, debt, risk/close/repay, liquidation receipt |
| J12 Mining | Entitlement/plan terms, committed stake, reward history |
| J13 Loans | Collateral identity, rate period, approval/disbursement/repay |
| J14 Notifications/messages | Persisted unread/read state, correct recipient and reconnect |
| J15 Profile/security | Customer identity, KYC scope, session, referral settings |
| J16 Admin governance | RBAC, permission-negative tests, config version/audit, Public propagation |
| J17 Failure/recovery | Network/quote/wallet change, original ID recovery, zero double posting |
| J18 Release and economic proof | Same deployed source/build/Sentry identity, Ledger and UI receipts, owner disposition |

All J01–J18 are **planned acceptance journeys** until independently executed and evidenced on the intended release. Never report an authenticated UI or financial result from a route-list, test name, successful HTTP status or static diagram.

### Public and Admin interaction responsibilities

For **Public**, `frontend/DESIGN.md` is the visual authority: mobile-first Web3 DApp browser, five labeled bottom navigation destinations, 320–440 CSS pixel widths, safe-area/short viewport, full tabular monetary values and distinct loading, empty, pending/unknown, rejected and posted states. Chart source supports seven `1m/5m/15m/30m/1h/4h/1d` intervals; owner-required indicators MA/EMA/BOLL/RSI/MACD/VOL are subject to actual component/runtime verification. A 53-symbol market feed is not a 53-deposit-network entitlement. SIWE source is not an authorization for a separate on-chain movement. WCAG 2.2 requirements and optional 44px touch design targets must not be confused.

For **Admin**, preserve the eight approved workspaces: Overview; Clients; Trading; Wallet & Finance; Markets; Products; Communications; Administration & Settings. `Admin/src/admin/config/navigation.ts` controls visible navigation; contextual/hidden route files remain valid when registered. `Admin/src/admin/data/nexi-api-provider.ts` consumes guarded backend policy; UI hiding is not RBAC. Admin financial controls require actor, reason, action/target, idempotency, audit and independent Public/SQLite readback. The already implemented Binary research default/position override is **not** a feature gap just because an old design mentions it as proposed. See [operator guide](../../Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md).

### Asynchronous failure and bounded recovery

```mermaid
sequenceDiagram
  participant F as Domain financial command
  participant D as SQLite transaction
  participant O as Durable EventOutbox
  participant W as Dispatcher / Valkey worker
  participant C as Public/Admin consumer
  F->>D: Validate original intent and commit authoritative mutation
  D->>O: Persist event intent as part of coordinated operation
  D-->>F: Stable operation/receipt
  O->>W: Record durable job keyed by outbox row ID
  alt Worker or transport fails
    Note over O,W: Outbox retry before handoff, job retry after handoff
  else Transport succeeded
    W-->>C: Advisory event / invalidate read model
    Note over C: Refresh persisted state through authenticated REST
  end
  Note over O,W: Duplicate delivery must not replay financial mutation
```

**CONFIRMED in source.** [EventOutboxService](../../backend/src/events/event-outbox.service.ts) claims persisted rows and, in local async mode, records a local workflow/dispatch journal entry keyed by the outbox row ID before lease-guarded publish marking. The published marker acknowledges the journal handoff in that mode. [LocalAsyncRuntimeService](../../backend/src/jobs/local-async-runtime.service.ts) requires the additive job/workflow tables and canonical Inbox before startup. [LocalQueueConsumer](../../backend/src/jobs/local-queue.consumer.ts) records Inbox ingress before workflow dispatch. SQLite persists recovery state and BullMQ/Valkey handles delivery. [The market hook](../../frontend/app/hooks/useRealtimeMarket.ts) handles reconnect with snapshot and stream recovery.

### API and architecture open evidence register

- **UNKNOWN:** complete serialization, dynamic consumer and deployed guard/DTO/response parity. Static route wiring covers all 279 documented operations, with three request-schema discrepancies confirmed.
- **EXPLICITLY NOT PROVEN:** end-to-end financial integrity for every deposit rail, withdrawal provider, Spot fill, Margin liquidation, Binary outcome, Finance yield or Admin adjustment; selected source anchors do not substitute for controlled durable receipts.
- **CONFIRMED TEST RECEIPT:** The later Backend-wide VM receipt records 136 passing suite executions and 819 passing tests on test-only Node 24.22.0, scoped to the recorded source and test environment. The earlier native abort and 40 failed tests remain historical.
- **UNKNOWN RELEASE PROVENANCE:** The three November 17 service startups and output directories were observed. Candidate source SHA, artifact hashes and Sentry release identity have yet to be reconciled.
- **GRAPH COVERAGE:** The source Graphify session returns the source graph at c7f64d8. The independently selected merged graph extends navigation into SQLite schema metadata. See [cross-layer provenance](#cross-layer-provenance-and-schema-coverage).
- **SETTLED VS UNPROVEN:** Binary has WIN/LOSS only with equal price LOSS and no DRAW/refund outcome; Admin Mining `dailyYield` is fractional per day in current source. LoanService applies `interestRate` once per selected plan term; customer-facing rate wording, collateral valuation, unapproved VIP benefit semantics and external rail/finality remain separately identified evidence or policy gaps. Blueprint proposals cannot override approved rules.
- **CONFLICT MANAGEMENT:** Historical Admin route counts, proposed Binary features, old source-first instructions and Cloudflare runtime notes are superseded where current source/owner rules disagree. Do not reinstate archived docs or rewrite the 113 requirement wording.

**Next proof to upgrade statuses:** record exact source SHA, controller/DTO/guard and consumer callsite, financial table/posting/event IDs, focused/broad test file and result, deployed service artifact/Sentry release, authenticated Public/Admin before/action/after and owner approval for each consequential capability. Until this chain exists, status remains PARTIAL/UNKNOWN as appropriate.


### Frozen 113-ID coverage index — navigation candidates, not implementation certification

Each ID below is extracted from the maintained **verbatim** owner-criteria document without copying its wording. The index provides broad domain navigation. The dated tracker adds source:line owner/handler anchors for 184 route occurrences and any located Public/Admin consumer line, plus explicit UI/evidence source lines for the 13 criteria without API route locators. These are navigation and source-candidate references, not exhaustive criterion-specific proof: one criterion can span multiple pages, mutations, and readbacks. Twenty-six route references lack a mapped Public/Admin consumer and remain consumer-UNKNOWN. No source location proves acceptance. Current tracker row status counts are 5 PASS, 1 BLOCKED, and 107 NOT_TESTED; linked historical receipts/environments were not revalidated in this documentation campaign. See the canonical [113 wording and source candidates](../quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md) and [dated tracker](../quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv).

| Frozen ID | Existing source navigation candidates (paths verified) | API/UI investigation family | Same-release proof |
|---|---|---|---|
| NEXI-01-01 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-01-02 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-01-03 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-01-04 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-01-05 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-01-06 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-01-07 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-01-08 | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | SIWE /auth/wallet/challenge and /auth/wallet/verify | UNVERIFIED |
| NEXI-02-01 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-02-02 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-02-03 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-02-04 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-02-05 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-02-06 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-02-07 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-02-08 | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | Wallet /wallet/overview and /wallet/activity | UNVERIFIED |
| NEXI-03-01 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-03-02 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-03-03 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-03-04 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-03-05 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-03-06 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-03-07 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-03-08 | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | Financial /financial/withdrawals and Wallet deposit proof | UNVERIFIED |
| NEXI-04-01 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-04-02 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-04-03 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-04-04 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-04-05 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-04-06 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-04-07 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-04-08 | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | Financial /financial/account-transfers and /financial/conversion/accept | UNVERIFIED |
| NEXI-05-01 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-02 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-03 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-04 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-05 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-06 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-07 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-08 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-09 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-05-10 | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | Binary /binary/position and /binary/settle | UNVERIFIED |
| NEXI-06-01 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-06-02 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-06-03 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-06-04 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-06-05 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-06-06 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-06-07 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-06-08 | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Spot /spot/order and /spot/cancel | UNVERIFIED |
| NEXI-07-01 | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Margin /spot/margin/positions | UNVERIFIED |
| NEXI-07-02 | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Margin /spot/margin/positions | UNVERIFIED |
| NEXI-07-03 | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Margin /spot/margin/positions | UNVERIFIED |
| NEXI-07-04 | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Margin /spot/margin/positions | UNVERIFIED |
| NEXI-07-05 | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Margin /spot/margin/positions | UNVERIFIED |
| NEXI-07-06 | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Margin /spot/margin/positions | UNVERIFIED |
| NEXI-07-07 | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | Margin /spot/margin/positions | UNVERIFIED |
| NEXI-08-01 | `backend/src/financial/financial-operations.service.ts`, `backend/src/events/event-outbox.service.ts` | Mining /mining/subscribe and Loans /loans/apply | UNVERIFIED |
| NEXI-08-02 | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | Mining /mining/subscribe and Loans /loans/apply | UNVERIFIED |
| NEXI-08-03 | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | Mining /mining/subscribe and Loans /loans/apply | UNVERIFIED |
| NEXI-08-04 | `backend/src/loans/loans.service.ts`, `backend/src/events/event-outbox.service.ts` | Mining /mining/subscribe and Loans /loans/apply | UNVERIFIED |
| NEXI-08-05 | `backend/src/financial/financial-operations.service.ts`, `backend/src/events/event-outbox.service.ts` | Mining /mining/subscribe and Loans /loans/apply | UNVERIFIED |
| NEXI-08-06 | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | Mining /mining/subscribe and Loans /loans/apply | UNVERIFIED |
| NEXI-08-07 | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | Mining /mining/subscribe and Loans /loans/apply | UNVERIFIED |
| NEXI-09-01 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-09-02 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-09-03 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-09-04 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-09-05 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-09-06 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-09-07 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-09-08 | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | Communications and EventOutbox readback | UNVERIFIED |
| NEXI-10-01 | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | Communications /communications/support/messages | UNVERIFIED |
| NEXI-10-02 | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | Communications /communications/support/messages | UNVERIFIED |
| NEXI-10-03 | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | Communications /communications/support/messages | UNVERIFIED |
| NEXI-10-04 | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | Communications /communications/support/messages | UNVERIFIED |
| NEXI-10-05 | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | Communications /communications/support/messages | UNVERIFIED |
| NEXI-10-06 | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | Communications /communications/support/messages | UNVERIFIED |
| NEXI-10-07 | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | Communications /communications/support/messages | UNVERIFIED |
| NEXI-11-01 | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | Market /market/prices, /market/klines, /market/trades | UNVERIFIED |
| NEXI-11-02 | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | Market /market/prices, /market/klines, /market/trades | UNVERIFIED |
| NEXI-11-03 | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | Market /market/prices, /market/klines, /market/trades | UNVERIFIED |
| NEXI-11-04 | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | Market /market/prices, /market/klines, /market/trades | UNVERIFIED |
| NEXI-11-05 | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | Market /market/prices, /market/klines, /market/trades | UNVERIFIED |
| NEXI-11-06 | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | Market /market/prices, /market/klines, /market/trades | UNVERIFIED |
| NEXI-11-07 | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | Market /market/prices, /market/klines, /market/trades | UNVERIFIED |
| NEXI-12-01 | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | Auth/Profile/KYC/Referral /profile/me | UNVERIFIED |
| NEXI-12-02 | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | Auth/Profile/KYC/Referral /profile/me | UNVERIFIED |
| NEXI-12-03 | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | Auth/Profile/KYC/Referral /profile/me | UNVERIFIED |
| NEXI-12-04 | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | Auth/Profile/KYC/Referral /profile/me | UNVERIFIED |
| NEXI-12-05 | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | Auth/Profile/KYC/Referral /profile/me | UNVERIFIED |
| NEXI-12-06 | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | Auth/Profile/KYC/Referral /profile/me | UNVERIFIED |
| NEXI-13-01 | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | Admin /admin (permissioned contracts) | UNVERIFIED |
| NEXI-13-02 | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | Admin /admin (permissioned contracts) | UNVERIFIED |
| NEXI-13-03 | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | Admin /admin (permissioned contracts) | UNVERIFIED |
| NEXI-13-04 | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | Admin /admin (permissioned contracts) | UNVERIFIED |
| NEXI-13-05 | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | Admin /admin (permissioned contracts) | UNVERIFIED |
| NEXI-13-06 | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | Admin /admin (permissioned contracts) | UNVERIFIED |
| NEXI-13-07 | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | Admin /admin (permissioned contracts) | UNVERIFIED |
| NEXI-14-01 | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | Public frontend/DESIGN.md (rendered mobile interactions) | UNVERIFIED |
| NEXI-14-02 | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | Public frontend/DESIGN.md (rendered mobile interactions) | UNVERIFIED |
| NEXI-14-03 | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | Public frontend/DESIGN.md (rendered mobile interactions) | UNVERIFIED |
| NEXI-14-04 | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | Public frontend/DESIGN.md (rendered mobile interactions) | UNVERIFIED |
| NEXI-14-05 | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | Public frontend/DESIGN.md (rendered mobile interactions) | UNVERIFIED |
| NEXI-14-06 | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | Public frontend/DESIGN.md (rendered mobile interactions) | UNVERIFIED |
| NEXI-14-07 | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | Public frontend/DESIGN.md (rendered mobile interactions) | UNVERIFIED |
| NEXI-15-01 | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | Cross-surface financial and release proof | UNVERIFIED |
| NEXI-15-02 | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | Cross-surface financial and release proof | UNVERIFIED |
| NEXI-15-03 | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | Cross-surface financial and release proof | UNVERIFIED |
| NEXI-15-04 | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | Cross-surface financial and release proof | UNVERIFIED |
| NEXI-15-05 | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | Cross-surface financial and release proof | UNVERIFIED |
| NEXI-15-06 | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | Cross-surface financial and release proof | UNVERIFIED |
| NEXI-15-07 | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | Cross-surface financial and release proof | UNVERIFIED |


### Schema-backed SQLite entity relationships and exact state vocabulary

The source Prisma schema, [schema.d1.prisma](../../backend/prisma/schema.d1.prisma), declares 98 models. The generated client is another view of that source schema. This diagram is a selected financial/async slice with 20 displayed relationship edges; it is **not a complete ERD**. Read-only live-schema metadata reports 87 declared foreign-key constraints. The full schema tables and each edge must be consulted for complete entity coverage. Application correlations appear below separately.

```mermaid
erDiagram
    User ||--o{ LedgerAccount : owns
    LedgerAccount ||--o{ LedgerPosting : contains
    LedgerAccount ||--o{ LedgerAuditEvent : records
    LedgerPosting o|--o{ LedgerAuditEvent : referenced_by
    User ||--o{ Gate2SpotOrder : places
    Gate2SpotOrder ||--o{ Gate2SpotTrade : buyer_order
    Gate2SpotOrder ||--o{ Gate2SpotTrade : seller_order
    User ||--o{ Gate2BinaryPosition : opens
    User ||--o{ Gate2Withdrawal : requests
    User ||--o{ Gate2ConversionQuote : quotes
    User ||--o{ Gate2Deposit : receives
    User ||--o{ SpotMarginAccount : owns
    SpotMarginAccount ||--o{ SpotMarginPosition : contains
    User ||--o{ MiningSubscription : subscribes
    MiningPlan ||--o{ MiningSubscription : configures
    User ||--o{ LoanApplication : applies
    User ||--o{ Activity : sees
    LocalDurableJob ||--o{ LocalDurableJobReplayHistory : journals
    LocalWorkflowInstance ||--o{ LocalWorkflowEvent : receives
    LocalWorkflowInstance ||--o{ LocalWorkflowStep : checkpoints
```

**Literal schema constraints with financial significance:**

| Model | Identity/constraints | Semantic consequence |
|---|---|---|
| `LedgerAccount` | `@@unique([userId, asset, scope])`; `available` and `locked` stored as decimal strings | One account per owner/asset/scope; never infer debt or Finance entitlement from these two fields alone |
| `LedgerPosting` | `@@unique([accountId,idempotencyKey])`; posting references/correlation/economic group, available/locked deltas as strings | Stable per-account duplicate guard; operation-wide pairing must still be validated in gateway transaction |
| `LedgerIdempotency` | `idempotencyKey @unique`, optional debit/credit posting IDs | Original command identity relates both posting legs; uniqueness alone does not prove all failure paths atomic |
| `EventOutbox` | `idempotencyKey @unique`, indexed state/availability, lease token, attempts, published timestamp | Delivery/retry control; no economic authority |
| `EventInbox` | `messageId @id`, `@@unique([queue,idempotencyKey])` | Scoped event dedupe distinct from original financial intent replay |
| `Gate2SpotOrder` | `@@unique([userId,idempotencyKey])`, reserve asset/scope/amount, filled/remaining | An order's execution identity is not the same as requested amount |
| `Gate2SpotTrade` | `idempotencyKey @unique`, buyer and seller order FK, price/amount/two fee fields | Durable internal matching entity; compare fees/fills to Ledger rather than external reference tape |
| `Gate2BinaryPosition` | `@@unique([userId,idempotencyKey])`, `settlementReceiptId @unique`, config/control versions and entry/expiry provenance | Durable one-position/receipt identity with auditable source and sandbox control separation |
| `Gate2BinaryConfiguration` | `@@unique([pair,durationSeconds,version])` | Versioned accepted payout/stake/duration policy; a changed Admin default does not rewrite historical position terms |
| `Gate2Withdrawal` | `requestKey @unique`, `reserveKey @unique`, fee/reserved amount, optional tx hash/provider state | Request reservation and external settlement are different facts |
| `Gate2ConversionQuote` | `quoteKey @unique`, nullable unique `acceptanceKey`; rate, input/output, provider, version/expiry | Quote and execution identities are separate |
| `Gate2InternalTransfer` | `idempotencyKey @unique`, `debitPostingId`, `creditPostingId`, two distinct user associations | Recipient transfer must resolve both posting legs |
| `Gate2Deposit` | `observationKey @unique`, `@@unique([network,txHash,address])`, confirmations and optional credit posting | A chain observation and a credited account are separate states |
| `SpotMarginPosition` | `openIdempotencyKey @unique`, optional unique entry/close order IDs; collateral/debt/interest and event relations | Position can have independent order, collateral and debt state |
| `MiningSubscription` | Plan FK and owner FK, amount/reward decimal strings, start/end and status | Customer subscription depends on a configured plan; plan visibility alone is not entitlement |
| `Activity` | `idempotencyKey @unique`, `ledgerCorrelationId`, optional `ledgerPostingId` | Activity projection must correlate with durable economic state; absent join is not a new Ledger writer |
| `AdminGovernanceCommand` | `idempotencyKey @unique`, actor/reason, approval/execution timestamps | A privileged action's auditable workflow can outlive HTTP acknowledgement |

**CONFIRMED in live schema metadata.** LedgerAccount.userId and LedgerPosting.accountId are restricted foreign keys. Activity.userId is declared, while Activity.ledgerPostingId and ledgerCorrelationId are application correlations. LedgerIdempotency posting IDs and Gate2InternalTransfer posting IDs are also application correlations. Gate2InternalTransfer has separate sender and recipient FKs to User. EventOutbox and EventInbox have separate unique identities and no declared FK between them.

#### Cross-layer provenance and schema coverage

| Graphify 0.9.112 artifact | Nodes / relationships | SHA-256 |
|---|---:|---|
| graphify-out/graph.json (source, c7f64d8) | 7,318 / 20,379 | 5af8994d65ca94ddd14365fc4c3d8791d2197ff4084ad7dd95cc6fa11c03ac2a |
| graphify-out/sqlite-schema-graph.json (schema) | 1,621 / 2,355 | c0dafa1e93f86540a993aa7d3fa046a953e5384f8791d1b2aa15c36c905b21be |
| graphify-out/merged-source-sqlite-graph.json (explicit CLI input) | 8,939 / 22,832 | e898bd3598860bc40adae6092a496e2c9464cbf218fd05d48738d86349a99a84 |

The merge receipt is graphify-out/merged-source-sqlite-graph-receipt.json. Read-only SQLite metadata reproduced 104 tables, 1,116 columns, 310 indexes including autoindexes, 87 declared foreign-key constraints and 3 triggers. Table, column and index identity sets matched the schema graph. The merged graph has zero missing edge endpoints and 98 distinct exact migration-to-table name joins. The graph is undirected. Column, DTO and transaction behavior require independent source and schema evidence.

The explicit merged-graph shortest path from the LedgerPosting migration node to the live LedgerPosting table is one EXACT_NAME_MATCH_ONLY edge. Its separate FK node shows accountId referencing LedgerAccount.id, independently confirmed through SQLite. A reverse-impact traversal of FinancialOperationsService identifies FinancialOperationsController, AdminService, LocalDepositProofController, WorkflowCommandsService and ReferralVipService among its consumers. Check actual callsites before inferring command behavior. @nexi-graphify-live queried the source-only artifact. @nexi-knowledge provided separate transaction, idempotency and outbox references.

Five unmatched live tables come from additive SQL outside the migration-name join: [local-durable-job.schema.sql](../../backend/src/jobs/local-durable-job.schema.sql) defines LocalDurableJob and LocalDurableJobReplayHistory, and [local-workflow.schema.sql](../../backend/src/jobs/local-workflow.schema.sql) defines LocalWorkflowInstance, LocalWorkflowStep and LocalWorkflowEvent. Their uniqueness keys bind job identity to (queue, logicalKey), replay history to (journalId, generation), and workflow steps and events to (instanceId, name) and (instanceId, eventKey), respectively. The sixth, d1_migrations, is bookkeeping read by the [SQLite release migration tool](../../backend/scripts/nexi_sqlite_release_migrate.py). Source and schema establish these ownership links independently of graph coverage. The source graph extracted all five standalone definitions. An enriched derivative, graphify-out/merged-source-sqlite-workflow-enriched-20261119.json, retains the 98 original joins and adds five verified DDL correspondence edges for 22,837 relationships. Each added edge compares normalized table DDL, columns, foreign keys and index keys against read-only live metadata. Its sibling receipt records the source locations and original and derived hashes. The migration bookkeeping table remains without a DDL edge.

**Source enum sets** (exact schema members, not all transition edges proven):

| Enum | Source-defined members |
|---|---|
| `LedgerAccountScope` | `MAIN`, `SPOT`, `MARGIN`, `BINARY`, `FINANCE` |
| `Gate2SpotOrderStatus` | `OPEN`, `PARTIALLY_FILLED`, `FILLED`, `CANCELED`, `REJECTED` |
| `Gate2BinaryState` | `ACTIVE`, `SETTLING`, `SETTLEMENT_DELAYED`, `WIN`, `LOSS`, `ERROR` |
| `Gate2WithdrawalState` | `PENDING_REVIEW`, `ADDITIONAL_REVIEW`, `REJECTED`, `APPROVED`, `SETTLED`, `FAILED` |
| `Gate2ConversionQuoteState` | `OPEN`, `ACCEPTED`, `EXPIRED`, `REJECTED` |
| `Gate2DepositState` | `OBSERVED`, `CONFIRMING`, `CREDITED`, `REJECTED`, `UNAVAILABLE` |
| `LoanStatus` | `PENDING`, `APPROVED`, `REJECTED`, `ACTIVE`, `PAID`, `OVERDUE`, `DEFAULTED` |
| `MiningStatus` | `ACTIVE`, `COMPLETED`, `CANCELLED` |

A generic architecture term such as `UNKNOWN`, `POSTED` or `REFUNDED` does **not** automatically exist as a given model's wire/state enum. For example, Binary has an explicit `SETTLEMENT_DELAYED` processing state while economic `LOSS` is terminal; Spot has `PARTIALLY_FILLED` while its settlement/pricing evidence lives in trades and postings. Derive allowable transitions from the owner service/gateway and forbid UI conflation.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> PARTIALLY_FILLED: matched portion / remaining reservation
  OPEN --> FILLED: full execution
  PARTIALLY_FILLED --> FILLED: remaining execution
  OPEN --> CANCELED: cancel accepted before fill
  PARTIALLY_FILLED --> CANCELED: cancel remainder, preserve prior fills
  OPEN --> REJECTED: policy or acceptance rejection
  CANCELED --> [*]
  FILLED --> [*]
  REJECTED --> [*]
```

*Spot diagram is the **intended lifecycle interpretation** of the exact schema statuses, not an assertion that every edge above has independent gateway transaction and race-condition test proof.*

```mermaid
stateDiagram-v2
  [*] --> ACTIVE
  ACTIVE --> SETTLING: expiry processing
  SETTLING --> SETTLEMENT_DELAYED: approved source temporarily unavailable
  SETTLEMENT_DELAYED --> SETTLING: recover eligible source
  SETTLING --> WIN: source-grounded settlement and posting
  SETTLING --> LOSS: source-grounded settlement and posting
  SETTLING --> ERROR: explicit processing failure path
  WIN --> [*]
  LOSS --> [*]
  ERROR --> [*]
```

*Binary diagram is an **illustrative transition investigation map** using real enum members. Whether a particular recovery/error edge is supported must be verified against `binary.service.ts` and atomic gateway state checks. A `LOSS` state with successful economic posting must never be rendered as `ERROR` merely because an unrelated display request failed.*


### Verified Public/Admin callsites — producer-to-consumer source joins

The following are **literal same-checkout endpoint callsites** located in the current frontend trees. Their presence establishes a source-level producer/consumer edge, **not** correct HTTP authorization, serialized DTO behavior, successfully persisted state or a deployed response.

| Customer/Admin action | Public callsite (exact source line) | NestJS owner | Admin counterpart and readback |
|---|---|---|---|
| SIWE challenge / verify | `frontend/app/lib/wallet-auth.ts:75,80` | `auth/auth.controller.ts` | Admin authentication remains separate; do not reuse Public session |
| Internal five-scope transfer | `frontend/app/dashboard/wallet/components/TransferModal.tsx:168` | `financial-operations.controller.ts:95-137` / service 182-227 | Ledger and funding audit in Admin provider, not a second transfer writer |
| Recipient transfer and original-intent recovery | `TransferModal.tsx:93,184` | Financial controller / service 230-249 | User identity and paired postings via Admin finance/ledger |
| Convert quote, accept and Activity receipt | `frontend/app/dashboard/wallet/components/ConvertModal.tsx:178,212,115` | Financial service 251-280 and gateway | Ledger two-asset/posting correlation; quote alone is not success |
| Withdrawal retry-by-key and submit | `frontend/app/dashboard/wallet/components/WithdrawModal.tsx:113,154` | Financial controller 74-92, service 72-179 | `Admin/src/admin/data/nexi-api-provider.ts` withdrawal/review commands; provider settlement must be independently evidenced |
| Spot submit and retrieve original intent | `frontend/app/dashboard/spot/page.tsx:866,904` | `spot.controller.ts` / `spot.service.ts:27-57` | `nexi-api-provider.ts:1320` Admin order list |
| Spot cancel and eventual readback | `frontend/app/dashboard/spot/page.tsx:1423,1460` | `spot.service.ts:59-63` + gateway | `nexi-api-provider.ts:1365` privileged cancellation |
| Binary position history/current | `frontend/app/dashboard/binary/page.tsx:348-349,476-477` | `binary.controller.ts`, service | `nexi-api-provider.ts:1452,1496,1505,1936` Admin positions/settlement/research control; normal customer UI does not directly call `/binary/settle` in this literal scan |
| Loan application | `frontend/app/dashboard/loans/page.tsx:284` | `loans/loans.controller.ts` and service | Admin application review / plan management, guarded backend |
| Mining subscription | `frontend/app/dashboard/mining/page.tsx:49` (configured endpoint or default) | `mining/mining.controller.ts` and service | Admin plan/entitlement and Activity; verify configured runtime override |
| Customer support message | `frontend/app/dashboard/messages/page.tsx:262,317` | `communications.controller.ts:92-113` | Admin operator messages and recipient authorization |
| Kline fetch | `frontend/app/hooks/useRealtimeMarket.ts:43` → `frontend/app/api/market/klines/route.ts:52` | Market Kline endpoint/router | Admin feeds govern provider/config; market websocket stream and backend settlement source require separate checks |
| Wallet overview and Activity | `frontend/app/dashboard/wallet/page.tsx:284` | `wallet/wallet.controller.ts` | Persisted customer-scoped balance/read model, not optimistic local order state |
| Transfer/Finance Activity verification | `TransferModal.tsx:77`, `mining/page.tsx:164,282` | `wallet/activity` consumer and durable event source | Confirm matching source account, asset, original key and receipt ID |

**Source-to-runtime boundary:** Public `/api/market/klines` is a local Next.js route/proxy and should not be assumed identical to direct browser access to NestJS `/market/klines`. Similarly Admin provider endpoints are `/admin/*` policy routes rather than interchangeable with protected customer `/spot/*` or `/binary/*` routes. A correctly spelled path is not sufficient without matching principal, surface guard, amount/status serialization, owner record and error treatment. Frontend environment overrides such as the mining subscribe endpoint require runtime configuration evidence before declaring which URL was actually called.

## Runtime and source authority reconciliation (2026-11-19)

**CONFIRMED — Nest wiring and policy boundary.** The active root imports feature modules explicitly in backend/src/app.module.ts; ContractModule is not reachable from AppModule and its legacy /lever handlers are not part of the registered operation inventory. Backend bootstrap installs a global ValidationPipe with whitelist, forbidNonWhitelisted, transform and implicit conversion. Controllers attach guards and delegate business transitions to services. A representative account transfer passes authenticated user identity from FinancialOperationsController to FinancialOperationsService and then pairedTransfer. These establish source wiring, not runtime admission or financial transaction proof.

**CONFIRMED — error contract limit.** The source registers Sentry and ENOENT filters. The ENOENT filter emits {statusCode:404,message:"Not Found"}; other exceptions are rethrown. No common response serializer/error envelope was found in the reviewed source. Deployed error shape and actual exception behavior remain UNKNOWN; API consumers must not assume a universal envelope from OpenAPI alone.

**CONFLICT — API service unit label.** Current owner architecture and root/backend instructions declare the promoted VPS SQLite system authoritative. deploy/vps/nexi-api.service:1-2 still labels the unit “non-authoritative staging until cutover acceptance,” while its ExecStart points at /srv/nexi/backend/dist/src/main.js. Static source cannot establish which unit/artifact is running or resolve the stale label. Record release/environment identity as UNKNOWN; do not reinterpret this text as proof of an active D1 deployment or as proof that cutover occurred.

**CONFIRMED — source-selected SQLite; runtime identity unknown.** D1WorkerBridgeModule binds the D1WorkerBridgeService token to LocalSqliteBridgeService unconditionally (backend/src/d1/d1-worker-bridge.module.ts:6-14); D1PrismaModule provides the Prisma service/gateway (backend/src/d1/d1-prisma.module.ts:6-10), and both read the configured local SQLite path. Startup validation requires NEXI_SQLITE_LOCAL_ENABLED=true and an absolute NEXI_LOCAL_SQLITE_PATH (backend/src/runtime/runtime.config.ts:53-58). LocalSqliteBridgeService executes each bounded batch in one IMMEDIATE SQLite transaction (backend/src/d1/local-sqlite-bridge.service.ts:91-105); this does not make separate gateway calls or a whole customer journey one transaction. D1-prefixed tokens and stale comments in D1FinancialCommandGateway do not establish remote D1 execution. Deployed environment, artifact identity, active database file and observed runtime behavior remain UNKNOWN.

**CONFIRMED — transport and recovery boundaries.** Local asynchronous runtime is gated by configuration/schema readiness. It records durable job acceptance in SQLite before BullMQ enqueue, uses leases/fencing and retries, while domain idempotency remains the financial writer’s responsibility. EventInbox records ingress before dispatch. BullMQ/Valkey delivery is at least once. Socket.IO market clients receive snapshot-on-connect, monotonic quote/Kline sequence filtering and bounded Redis-stream recovery; exact missed-event replay is deferred by the realtime contract. Socket.IO is a projection and must be reconciled through REST.

**CONFIRMED / ASSESSMENT — market and operational limitations.** Market ingest has bounded queues and coalescing. Closed Klines may be dropped at saturation or bounded shutdown; source does not establish automatic backfill. Best-effort trades/depth can be dropped. These paths can share SQLite write pressure with financial workloads. /ops/ready checks SQLite and Redis only; it does not prove queue backlog, provider freshness, market subscriber health or economic correctness. These are source observations and operational risk assessments, not live service findings. Sentry source configuration is conditional on DSN and release/environment; current deployed release and live traces are UNKNOWN.

**Admin authority reconciliation.** Admin effective permissions are loaded from the backend and enforced by Nest guards. The local Content Manager role omits flags.edit while backend RBAC grants it; the operator guide’s “view only” statement therefore conflicts with live-source role assignment. This is a role documentation/configuration discrepancy, not evidence of a guard bypass. Admin direct audited ledger corrections use their own permission and do not automatically enter the separate governance approval queue; governance self-approval is rejected.

For feature-level UI, API, transaction, state and recovery contracts see the [product operating model](NEXI_PRODUCT_OPERATING_MODEL.md); exact handler and caller evidence remains in the [API map](../contracts/NEXI_API_OPERATION_MAP.md). Runtime acceptance is deliberately not inferred from static graphs or source.

## Read-only live schema inventory

On 2026-11-19, the SQLite file /var/lib/nexi/sqlite/nexi-staging.sqlite was opened with a read-only SQLite connection. The query read sqlite_master and PRAGMA table_info, index_list and foreign_key_list only; it did not select customer or financial rows and did not write the database. The observed schema inventory was 104 non-internal tables, 1,116 columns, 310 indexes including 110 SQLite autoindexes (200 explicit SQL indexes), 87 declared foreign-key constraints and 3 triggers. These counts describe that file at inspection time, not the deployed service’s selected file or runtime state. The graph’s six tables without exact migration-to-live table-name links include five local workflow/durable-job objects now represented by verified DDL correspondences and d1_migrations bookkeeping.

The Python SQLite binding used for this read-only metadata inspection reported SQLite 3.40.1. Financial bridge source declares a minimum SQLite version of 3.51.3. This is **UNKNOWN / potential environment mismatch**, not proof of the Node better-sqlite3 runtime version: Python and Node may link different SQLite libraries. Confirm backend runtime library and active database identity before claiming the configured minimum is met. No financial rows were exported or added to any graph.


## Complete declared SQLite foreign-key inventory — schema graph snapshot

Source: `graphify-out/sqlite-schema-graph.json` (SHA-256 `c0dafa1e93f86540a993aa7d3fa046a953e5384f8791d1b2aa15c36c905b21be`); its root node is marked `LIVE_READ_ONLY_SCHEMA`, schema hash `f6d0a913720226eca6b625f2af39b5561d8db25bb95d086911ac8d8371440989`. The artifact represents 104 tables and 87 declared FK constraints. The rows below document declared schema constraints only; they do not establish application-level ownership, runtime adapter selection, transaction atomicity, migration parity, or financial behavior. Composite key columns are listed in ordinal order.

| Declaring table | Column(s) | Referenced table | Column(s) | ON DELETE | ON UPDATE |
|---|---|---|---|---|---|
| `Activity` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `AdminGovernanceApproval` | `commandId` | `AdminGovernanceCommand` | `id` | `CASCADE` | `CASCADE` |
| `AdminRoleAssignment` | `userId` | `User` | `id` | `CASCADE` | `CASCADE` |
| `Affiliate` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `AuthSession` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `BinaryOptionPosition` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `BinaryOptionResult` | `positionId` | `BinaryOptionPosition` | `id` | `RESTRICT` | `CASCADE` |
| `ContractPosition` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `ConversionTransaction` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `DepositAddress` | `currencyId` | `Currency` | `id` | `RESTRICT` | `CASCADE` |
| `DepositAddress` | `walletNetworkId` | `WalletNetwork` | `id` | `RESTRICT` | `CASCADE` |
| `DepositClaim` | `depositAddressId` | `DepositAddress` | `id` | `SET NULL` | `CASCADE` |
| `DepositClaim` | `reviewedBy` | `User` | `id` | `SET NULL` | `CASCADE` |
| `DepositClaim` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2BinaryPosition` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2ConversionQuote` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2Deposit` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2InternalTransfer` | `fromUserId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2InternalTransfer` | `toUserId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2OperationAudit` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2SpotOrder` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2SpotTrade` | `buyerOrderId` | `Gate2SpotOrder` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2SpotTrade` | `sellerOrderId` | `Gate2SpotOrder` | `id` | `RESTRICT` | `CASCADE` |
| `Gate2Withdrawal` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `KYC` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `LearnArticleRevision` | `articleId` | `LearnContent` | `id` | `CASCADE` | `CASCADE` |
| `LearnArticleTag` | `articleId` | `LearnContent` | `id` | `CASCADE` | `CASCADE` |
| `LearnArticleTag` | `tagId` | `LearnTag` | `id` | `CASCADE` | `CASCADE` |
| `LearnContent` | `categoryId` | `LearnCategory` | `id` | `SET NULL` | `CASCADE` |
| `LearnMediaAsset` | `articleId` | `LearnContent` | `id` | `CASCADE` | `CASCADE` |
| `LearnMediaAsset` | `revisionId` | `LearnArticleRevision` | `id` | `CASCADE` | `CASCADE` |
| `Ledger` | `walletId` | `Wallet` | `id` | `RESTRICT` | `CASCADE` |
| `LedgerAccount` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `LedgerAuditEvent` | `accountId` | `LedgerAccount` | `id` | `RESTRICT` | `CASCADE` |
| `LedgerAuditEvent` | `postingId` | `LedgerPosting` | `id` | `SET NULL` | `CASCADE` |
| `LedgerPosting` | `accountId` | `LedgerAccount` | `id` | `RESTRICT` | `CASCADE` |
| `LoanApplication` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `LoanRepayment` | `activityId` | `Activity` | `id` | `SET NULL` | `CASCADE` |
| `LoanRepayment` | `ledgerPostingId` | `LedgerPosting` | `id` | `SET NULL` | `CASCADE` |
| `LoanRepayment` | `loanId` | `LoanApplication` | `id` | `RESTRICT` | `CASCADE` |
| `LocalDurableJobReplayHistory` | `journalId` | `LocalDurableJob` | `id` | `RESTRICT` | `NO ACTION` |
| `LocalWorkflowEvent` | `instanceId` | `LocalWorkflowInstance` | `id` | `NO ACTION` | `NO ACTION` |
| `LocalWorkflowStep` | `instanceId` | `LocalWorkflowInstance` | `id` | `NO ACTION` | `NO ACTION` |
| `MarketAssetCapability` | `assetId` | `MarketAsset` | `id` | `RESTRICT` | `CASCADE` |
| `MarketAssetCapability` | `networkId` | `MarketNetwork` | `id` | `SET NULL` | `CASCADE` |
| `MarketDepthLevel` | `snapshotId` | `MarketDepthSnapshot` | `id` | `CASCADE` | `CASCADE` |
| `MarketDepthSnapshot` | `pairId` | `MarketPair` | `id` | `RESTRICT` | `CASCADE` |
| `MarketKline` | `pairId` | `MarketPair` | `id` | `RESTRICT` | `CASCADE` |
| `MarketNetwork` | `assetId` | `MarketAsset` | `id` | `RESTRICT` | `CASCADE` |
| `MarketPair` | `baseAssetId` | `MarketAsset` | `id` | `RESTRICT` | `CASCADE` |
| `MarketPair` | `quoteAssetId` | `MarketAsset` | `id` | `RESTRICT` | `CASCADE` |
| `MarketProviderSymbol` | `pairId` | `MarketPair` | `id` | `RESTRICT` | `CASCADE` |
| `MarketProviderSymbol` | `providerId` | `MarketProviderConfig` | `id` | `RESTRICT` | `CASCADE` |
| `MarketQuoteLatest` | `pairId` | `MarketPair` | `id` | `RESTRICT` | `CASCADE` |
| `MarketQuoteSnapshot` | `pairId` | `MarketPair` | `id` | `RESTRICT` | `CASCADE` |
| `MarketTrade` | `pairId` | `MarketPair` | `id` | `RESTRICT` | `CASCADE` |
| `MessageModerationCase` | `conversationId` | `MessageConversation` | `id` | `CASCADE` | `CASCADE` |
| `MiningRewardAccrual` | `activityId` | `Activity` | `id` | `RESTRICT` | `CASCADE` |
| `MiningRewardAccrual` | `ledgerPostingId` | `LedgerPosting` | `id` | `RESTRICT` | `CASCADE` |
| `MiningRewardAccrual` | `subscriptionId` | `MiningSubscription` | `id` | `CASCADE` | `CASCADE` |
| `MiningRewardAccrual` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `MiningSubscription` | `planId` | `MiningPlan` | `id` | `RESTRICT` | `CASCADE` |
| `MiningSubscription` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `ReferralAttributionEvent` | `referredUserId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `ReferralAttributionEvent` | `referrerUserId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `ReferralRewardEvent` | `ledgerPostingId` | `LedgerPosting` | `id` | `RESTRICT` | `CASCADE` |
| `ReferralRewardEvent` | `referredUserId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `ReferralRewardEvent` | `referrerUserId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `Reward` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `SpotMarginAccount` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `SpotMarginActivity` | `accountId` | `SpotMarginAccount` | `id` | `SET NULL` | `CASCADE` |
| `SpotMarginActivity` | `positionId` | `SpotMarginPosition` | `id` | `SET NULL` | `CASCADE` |
| `SpotMarginActivity` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `SpotMarginPosition` | `accountId` | `SpotMarginAccount` | `id` | `RESTRICT` | `CASCADE` |
| `SpotMarginPositionEvent` | `positionId` | `SpotMarginPosition` | `id` | `RESTRICT` | `CASCADE` |
| `SpotOrder` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `SpotTrade` | `orderId` | `SpotOrder` | `id` | `RESTRICT` | `CASCADE` |
| `SpotTrade` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `SupportTicketReply` | `ticketId` | `SupportTicket` | `id` | `CASCADE` | `CASCADE` |
| `UserMfa` | `userId` | `User` | `id` | `CASCADE` | `CASCADE` |
| `UserPreference` | `userId` | `User` | `id` | `CASCADE` | `CASCADE` |
| `UserVipState` | `userId` | `User` | `id` | `CASCADE` | `CASCADE` |
| `UserVipState` | `vipLevelId` | `VipLevel` | `id` | `RESTRICT` | `CASCADE` |
| `Wallet` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |
| `WalletIdentity` | `userId` | `User` | `id` | `CASCADE` | `CASCADE` |
| `WalletNetwork` | `currencyId` | `Currency` | `id` | `RESTRICT` | `CASCADE` |
| `WithdrawalRequest` | `userId` | `User` | `id` | `RESTRICT` | `CASCADE` |

Inventory row count: 87.