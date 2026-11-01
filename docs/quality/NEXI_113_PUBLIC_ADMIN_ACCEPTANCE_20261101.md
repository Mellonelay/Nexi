# NEXI Public + Admin combined acceptance — 113 canonical requirements

**Prepared:** 2026-11-01. **Source revision:** `8ec200b1914d585d6189cf6ea37b5eac2f8158a9` at intake. **Status:** requirement/source-map checklist; **not** 113/113 browser verified.

## Governing distinctions

The 113 original owner requirements are reproduced verbatim from Engineering Reference v4.0 `01_CHECKLIST_TRACEABILITY.md`: **15 domains; 72 P0 + 41 P1**. The original `Check-list.txt` is its normative upstream. No item may be declared passed solely because source exists, a static check ran, or an old version passed.

**Public** testing is mobile-first: widths 320, 360, ~390, 412–430, short-height, bottom dock, safe areas, trading chart and touch interactions, plus tablet/desktop coverage. **Admin** testing is desktop-first: eight operator workspaces, contextual tabs, 31 current sidebar destinations plus contextual /sandbox (32 functional), direct URLs, refresh/back/forward, role-aware actions, data states and persisted readback; narrow Admin accessibility is secondary. The Admin route overlay below is supplemental, **not additional items in the canonical 113 count**.

All rows start unchecked for the **new source release**. Existing accepted but untested financial exceptions remain `OWNER_ACCEPTED_UNTESTED` with their prior scope. No production financial, authentication, message-send or browser actions were performed here.

## Verified source and observed release markers

| Surface | Marker observed from VM | Current source equals marker? |
| --- | --- | --- |
| Backend | `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` | No |
| Public | `285738c9a0b9f423377067d2d1b2200c43c06473` | No |
| Admin | `285738c9a0b9f423377067d2d1b2200c43c06473` | No |

**Release conflict:** The dated October 31 Admin Stage B browser receipt says Admin deployed release `737355124993705935f9aa56f743a9f1f61a2bf4`, whereas the current VM Admin marker reads `285738c9a0b9f423377067d2d1b2200c43c06473`. Verify actual running process/artifact identity before attributing the old Admin browser pass to today's deployment. Preserve the historical receipt unchanged.

**Provenance:** October 21 Admin TanStack route map; October 24 ticket retirement/Messages decision in the 377-message MindMap AI chronology; October 31 Codex support compatibility browser receipt; Library/Nexi 314-message successor chronology; 2026-11-01 navigation/route source. Historical conversations are decision evidence, not current runtime proof.

**Proof fields:** `SOURCE_OWNER_LOCATED` is a navigation hint only; `SOURCE_IMPLEMENTED`, `STATIC_TESTED`, `DEPLOYED`, `BROWSER_VERIFIED`, `ECONOMIC_VERIFIED` and `OWNER_ACCEPTED` require their own receipts. Current-release status defaults to `PENDING`.

## Canonical 113 acceptance checklist

### Wallet authentication and user onboarding (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-01-01** | One successful SIWE sign-in establishes or retrieves the correct NEXI user | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-01-02** | UUID, public user code, referral attribution, VIP/default profile and preferences initialize correctly | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-01-03** | All supported internal financial account destinations are usable without manual account creation | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-01-04** | Returning customers retain their existing accounts, balances, referrals and settings | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-01-05** | No additional wallet signature is requested merely to access Spot, Binary, Margin or Finance | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-01-06** | Session expiration, reconnect, account switching and wallet disconnect behave correctly | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-01-07** | Public exploration works as intended without authentication; protected actions require a session | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-01-08** | Wallet-provider selection, wrong-network handling and rejected signatures provide clear recovery | `backend/src/auth/wallet-auth.service.ts`, `frontend/app/lib/wallet-siwe.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Wallet accounts, balances and activity (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-02-01** | Funding (MAIN), Spot, Margin, Options (BINARY) and Finance display coherently | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-02-02** | Zero-balance accounts are not described as unsupported or unverified wallets | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-02-03** | Available, locked, committed and total balances are consistent across all screens | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-02-04** | Balances refresh after every successful financial mutation | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-02-05** | Activity includes the correct type, amount, asset, status, time and transaction reference | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-02-06** | Internal transfers appear coherently in source and destination account views | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-02-07** | Asset support and product-specific restrictions remain enforced without unnecessary account screens | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-02-08** | Refresh, reconnection and navigation do not present stale balances as current | `backend/src/wallet/wallet.service.ts`, `backend/src/wallet/wallet.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Deposits and withdrawals (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-03-01** | Supported assets and networks come from current Admin/Backend configuration | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-03-02** | Deposit addresses, network selection and confirmation instructions are correct | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-03-03** | Deposit pending, confirmed, failed and review states are understandable | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-03-04** | Deposit credit updates the right Funding account, Activity and eligible notifications | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-03-05** | Withdrawals clearly show network, fees, limits, destination and expected amount | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-03-06** | Approval, rejection, confirmation and retry states remain consistent | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-03-07** | Missing configuration and unsupported networks fail safely with useful guidance | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-03-08** | No duplicate credit, debit or withdrawal occurs on retries | `backend/src/d1/deposit-commands.ts`, `backend/src/financial/local-deposit-proof.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Internal transfers and conversion (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-04-01** | Funding ↔ Spot, Margin, Options and Finance transfers work for permitted asset/scope pairs | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-04-02** | Users never need to manually open an internal account before transferring | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-04-03** | Insufficient transfer balance produces a specific actionable error | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-04-04** | Successful transfer shows asset, amount, source and destination | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-04-05** | Source and destination balances update without page reload | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-04-06** | Activity and notification records reflect the transfer consistently | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-04-07** | User-to-user transfers resolve the correct recipient and confirm success | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-04-08** | Conversion quotes, expiry, spread, acceptance and Ledger postings agree | `backend/src/wallet/wallet.service.ts`, `backend/src/ledger/ledger-authority.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Binary / Options trading (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-05-01** | Preserve current Admin-controlled pair, duration, payout, stake-limit and enablement configuration | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-02** | Authenticated customers can enter stake and choose Long/Short without unnecessary wallet verification | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-03** | Insufficient Options funds produce an actionable dialog and funding/transfer path | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-04** | The entered pair, duration, direction and stake survive the funding journey where appropriate | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-05** | Funded orders show accurate review, reserve stake and create one position | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-06** | Countdown, entry price, expiry and live position status remain coherent | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-07** | WIN/LOSS settlement uses authoritative Backend values and updates balances | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-08** | Result cards, history, Activity and notifications reflect the final outcome | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-09** | Disabled pair, invalid stake, stale quote, settlement delay and reconnect have clear behavior | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-05-10** | Idempotency and Ledger reservation safeguards are never removed | `backend/src/binary/binary.service.ts`, `backend/src/binary/binary-settlement.scheduler.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Spot trading (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-06-01** | Market, limit and supported stop-order behavior follows current Backend contracts | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-02** | Available base/quote balance and estimated cost are clear | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-03** | Insufficient funds, invalid quantity, minimum order and stale-price errors are useful | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-04** | Order review, confirmation, placement and cancellation work coherently | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-05** | Partial fills, fees, reserves and remaining balances reconcile | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-06** | Open orders and trade history refresh correctly | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-07** | Accepted/rejected/filled/cancelled states trigger appropriate Activity and notifications | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-08** | Spot controls do not request repeated wallet verification from authenticated users | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Margin trading (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-07-01** | Preserve isolated-margin model, collateral, borrowing and risk controls | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-02** | Margin account readiness is transparent to the customer | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-03** | Transferable USDT, collateral, borrowable amount and liabilities remain separate | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-04** | Position opening, closing, interest, repayment and liquidation show correct states | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-05** | Insufficient collateral and unsupported operations provide actionable guidance | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-06** | Risk parameters match current Backend/Admin configuration | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-07** | Position, repayment and liquidation Activity/notifications are consistent | `docs/backend/README.md`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Finance, Earn / Mining and Loans (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-08-01** | Finance balances and committed funds are distinguished correctly | `docs/backend/README.md`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-02** | Available products, rates, durations, restrictions and limits come from Backend/Admin | `docs/backend/README.md`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-03** | Earn allocation, accrual, maturity, redemption and failure states are clear | `docs/backend/README.md`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-04** | Loan applications, collateral, disbursements, interest, repayment and overdue states are consistent | `docs/backend/README.md`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-05** | Funds, liabilities and locked commitments never appear as spendable balance | `docs/backend/README.md`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-06** | Activity and notifications reflect meaningful lifecycle changes | `docs/backend/README.md`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-07** | Empty product states are distinguished from failures and unconfigured products | `docs/backend/README.md`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Notifications system (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-09-01** | Existing notification center and five categories remain intact | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-09-02** | Authenticated customer-specific notification loading and read state work | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-09-03** | Trade, transfer, deposit, withdrawal, conversion and account event producer coverage is traced | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-09-04** | Only genuine committed events create durable notifications | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-09-05** | Unread counts, mark-read behavior and category filtering remain correct | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-09-06** | Realtime delivery, reconnect, deduplication and REST resnapshot work on the VPS | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-09-07** | Notifications contain relevant amounts/statuses without exposing sensitive data | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-09-08** | Settings/preferences and Admin-governed notifications behave according to current contracts | `frontend/app/components/NotificationsPanel.tsx`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Messages and customer support (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-10-01** | Preserve Nexi Customer Service and the approved customer-to-Admin conversation model | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-10-02** | Send, read, delivered and failed states use authoritative records | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-10-03** | Emoji, attachments, conversation history and unread state work | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-10-04** | Admin replies reach the correct customer without wrong-recipient routing | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-10-05** | Realtime delivery and reconnection resync from durable storage | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-10-06** | Support and Messages remain distinct according to current owner decisions | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-10-07** | Telegram/email support settings remain Admin-controlled where applicable | `backend/src/communications/communications.controller.ts`, `backend/src/communications/communications.gateway.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Dashboard, markets and charts (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-11-01** | Quotes Hub, asset search, categories and navigation work | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-11-02** | Canonical asset icons, names, tickers and supported pairs remain consistent | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-11-03** | Live prices, candlesticks, timeframe switching and chart state remain coherent | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-11-04** | Stale/unavailable market feeds are not represented as live | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-11-05** | Selected asset/pair follows the customer across relevant trading surfaces | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-11-06** | Orderbook and trades show authentic source data, not fabricated activity | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-11-07** | Loading, empty, error and reconnect states recover correctly | `backend/src/market/market-kline.service.ts`, `backend/src/market/market-kline.contract.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Profile, settings, referral and security (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-12-01** | User profile, code, referral information, preferences and session identity remain stable | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-12-02** | Security and session management behave correctly without redundant wallet prompts | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-12-03** | KYC states, uploads and approval status are reflected accurately | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-12-04** | Language, timezone, currency presentation and notification preferences persist | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-12-05** | Security-sensitive operations retain appropriate independent authorization | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-12-06** | Settings actions show clear success/failure and refresh persisted state | `backend/src/referral-vip/referral-vip.service.ts`, `backend/src/referral-vip/referral-vip.controller.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Admin-to-Public consistency (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-13-01** | Preserve the approved eight-workspace Admin information architecture | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-13-02** | Admin-configured trading/product/asset/network rules propagate correctly to Public | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-13-03** | Enabled/disabled features and risk controls are never replaced by frontend constants | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-13-04** | Admin approval and financial actions retain RBAC, audit and idempotency | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-13-05** | Public statuses match authoritative Admin/Backend decisions | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-13-06** | Notifications and messages integrate with the current Admin workflows | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-13-07** | Existing source and deployed UI fixes are reused unless invalidated | `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin-rbac.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Interaction quality, mobile and recovery (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-14-01** | Every important action has meaningful loading, success, empty and failure feedback | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-14-02** | Disabled controls explain their reason or offer a valid recovery path | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-14-03** | Dialogs preserve customer input and avoid trapping the customer | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-14-04** | Mobile layouts, bottom navigation, safe areas and short-height screens remain usable | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-14-05** | Accessibility, labels, focus, keyboard and touch targets work | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-14-06** | Network interruptions, refresh and session recovery avoid duplicated actions | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-14-07** | No unnecessary authentication, account-creation or technical debugging instructions appear in customer UI | `frontend/app/components/NotificationsPanel.tsx`, `Admin/src/routes/support.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### End-to-end financial and release proof (P0)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-15-01** | Each critical journey is reconciled across Public → Backend → SQLite Ledger → Activity/Outbox → realtime/readback | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-15-02** | Existing passing tests and owner-accepted financial exceptions are preserved unless source changes invalidate them | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-15-03** | Negative authorization, concurrency, insufficient funds and idempotency remain covered | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-15-04** | Production service/deployment identity is established before new acceptance claims | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-15-05** | Sentry release/error/notification behavior is verified against the current deployment | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-15-06** | Authenticated customer and Admin browser acceptance is distinct from route-load and HTTP 200 checks | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-15-07** | Only confirmed gaps receive source changes; focused regression tests prove those changes | `backend/src/ledger/ledger-authority.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |

## Admin desktop acceptance overlay (supplementary, not counted among 113)

**2026-11-01 current-source correction:** `Admin/src/admin/config/navigation.ts` defines 31 role-filtered sidebar destinations. The contextual `/sandbox` is a 32nd functional operator destination. Retired `/support` and hidden `/reconciliation` are separate compatibility/unavailable checks. The October 21 33-sidebar snapshot was superseded by the October 24 owner decision to retire tickets and use Messages for customer–Admin chat; historical route files remain. Neither historical maps nor a named route file count proves current navigation or browser acceptance. The 113 criteria are preserved verbatim.

**Owner supersession details (October 24):** Ticket create/reply/lifecycle is retired. Public Support retains help topics and Admin-controlled Telegram/email contact settings; Messages owns authenticated customer–Admin conversations, history and authorized attachments. The `/support` compatibility URL and hidden `/reconciliation` are separate checks, not active ticket/reconciliation business workflows.

The source-authored operator workspace inventory is drawn from `Admin/docs/OPERATOR_WORKSPACE_IMPLEMENTATION_MAP.md` and `Admin/docs/TANSTACK_ARCHITECTURE_AND_ROUTE_MAP.md`. The October 31 receipt confirms only eight-workspace navigation at 979×715, not 32 functional-route action/readback passes.

| Operator workspace | Required destination URLs | Current-release browser status |
| --- | --- | --- |
| Overview | `/overview` | PENDING |
| Clients | `/users`, `/kyc`, `/sessions` | PENDING |
| Trading | `/spot`, `/binary`, `/settlements`, `/exposure`, `/sandbox` | PENDING |
| Wallet & Finance | `/wallets`, `/networks`, `/ledger`, `/deposits`, `/withdrawals` | PENDING |
| Markets | `/assets`, `/market-feeds` | PENDING |
| Products | `/mining`, `/loans` | PENDING |
| Communications | `/messages`, `/announcements`, `/learn`, `/notifications` | PENDING |
| Administration & Settings | `/admins`, `/roles`, `/approvals`, `/audit`, `/frontend-control`, `/navigation`, `/localization`, `/feature-flags`, `/health`, `/maintenance` | PENDING |

**Compatibility-only:** `/support` remains a retired-ticket page linking to `/messages`, not a functional ticket workflow. **Hidden:** `/reconciliation` has no verified durable backend authority. Both are excluded from the **32 functional destinations**; 34 named route files exist excluding index/root.

### Common Admin desktop proof

- [ ] Verify eight workspace entrypoints plus 31 sidebar destinations and contextual `/sandbox` (32 functional), permitted-role direct URL, refresh, back/forward and active contextual tab.
- [ ] At ~979×715 and 1365×723 inspect density, tables, filters, selected-client detail, modal controls, desktop overflow and keyboard focus; a narrow viewport requires accessible fallback rather than Public-style mobile-first parity.
- [ ] Verify authenticated role-sensitive actions against NestJS RBAC including a denied restricted-role request only with an existing authorized restricted identity.
- [ ] Trace Admin provider → NestJS DTO/endpoint → durable readback → Public presentation for asset/network, Binary, Mining, Loan and notification/content configuration.
- [ ] For Messages, controlled Admin reply → customer thread, attachment and realtime reconnect requires explicit controlled-conversation authorization; never use an existing synthetic thread as permission to send.
- [ ] Avoid equating UI visibility or route 200 with business mutation, financial approval, persistence, or browser acceptance.

## Document/source evidence reconciliation

| Source | Current use |
| --- | --- |
| `docs/quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `tasks/evidence/nexi-final-product-acceptance-20261031.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `tasks/evidence/nexi-five-batch-source-reconciliation-20261101.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `Admin/docs/OPERATOR_WORKSPACE_IMPLEMENTATION_MAP.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `Admin/docs/TANSTACK_ARCHITECTURE_AND_ROUTE_MAP.md` | October 21 historical route snapshot; November 1 source correction at top governs current count |
| `Admin/docs/ADMIN_IMPLEMENTATION_CONTRACT_MAP_A_F_2026-10-21.md` | Historical design/hand-off snapshot; verify against current source |
| `Admin/docs/ADMIN_VERIFIED_DIAGRAMS_AND_HANDOFF.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `Admin/docs/CURRENT_STATUS.md` | Historical design/hand-off snapshot; verify against current source |
| `Admin/docs/WORK_SSH_NEXT_EXECUTION_HANDOFF_2026-10-21.md` | Historical design/hand-off snapshot; verify against current source |
| `NEXI_CURRENT_STATE.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `NEXI_PROOF_REUSE_REGISTER.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `tasks/plan.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `tasks/todo.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `frontend/AGENTS.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `frontend/DESIGN.md` | Scoped current contract/receipt; preserve date, SHA and proof class |
| `Admin/AGENTS.md` | Scoped current contract/receipt; preserve date, SHA and proof class |

**Source locator correction:** Engineering References v4.0 names `frontend/app/dashboard/margin/page.tsx` for Margin; current source implements Spot/Margin in `frontend/app/dashboard/spot/page.tsx`. Only the locator was corrected; original acceptance criteria remain unchanged.

## Known dependencies and unresolved evidence

1. Current source changes are not yet deployed under matching Backend/Public/Admin artifact identifiers. The Admin Stage B dated receipt and current Admin marker conflict.
2. Public Binary default internal USDT accounts exist in newer source, but funded BINARY placement/settlement browser and economic proof remains permission- and deployment-dependent.
3. Older Public Margin browser notes `Market data error`/`Chart updates paused` despite HTTP 200. Verify data freshness, candle/chart status on the actual new release; do not assume old result persists or was fixed.
4. Admin restricted-role negative authorization proof requires an existing authorized restricted identity. Desktop operator actions are not established by eight-workspace navigation.
5. Public ↔ Admin controlled Messages read/write/push/reconnect remains unverified for current release; avoid unauthorized sends.
6. Preserve four explicit `OWNER_ACCEPTED_UNTESTED` financial gates; do not reopen them as mandatory live economic probes without fresh approval.
7. Sentry release-specific ingestion, minute-scale alert delivery and event symbolication remain independently unproven by a zero-event result.

## Next acceptance procedure

1. Map each requirement to its actual current source owner, verify implementation semantics and classify true gaps separately from runtime proof gaps.
2. Run one focused, change-invalidated test/static fan-in on confirmed repairs, preserving old verified unchanged evidence.
3. After distinct owner authorization, one Backend → Public → Admin coordinated build/deploy, with matching SHA markers, service/process health and rollback evidence.
4. Execute the 113 requirement checks plus Admin desktop overlay against actual current release with authorized identities; record PASS/FAIL/BLOCKED, route, viewport, timestamp, release SHA and sanitized evidence in the CSV tracker. Do not convert a source check to a browser PASS.
