# NEXI Public + Admin — original 113 acceptance requirements

**Canonical owner requirements, originally recorded 2026-11-01.** Exactly 113 IDs across 15 domains (72 P0, 41 P1). The criterion IDs and text are frozen; this document is **not** the current deployed PASS/FAIL ledger. Execute them using [the current mobile Web3 UI-first procedure](NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md). Dated status history remains in [original CSV](NEXI_113_ACCEPTANCE_TRACKER_20261101.csv) and in tasks/evidence; a green source test is not a customer acceptance PASS.

**Source-owner pointers updated 2026-11-19:** The former broad \`docs/backend/README.md\` anchors under Spot/Margin/Finance now reference current Backend source candidate owners. This does not change any criterion text, establish implementation for an individual requirement, or upgrade browser status.

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
| [ ] **NEXI-06-01** | Market, limit and supported stop-order behavior follows current Backend contracts | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-02** | Available base/quote balance and estimated cost are clear | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-03** | Insufficient funds, invalid quantity, minimum order and stale-price errors are useful | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-04** | Order review, confirmation, placement and cancellation work coherently | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-05** | Partial fills, fees, reserves and remaining balances reconcile | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-06** | Open orders and trade history refresh correctly | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-07** | Accepted/rejected/filled/cancelled states trigger appropriate Activity and notifications | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-06-08** | Spot controls do not request repeated wallet verification from authenticated users | `backend/src/spot/spot.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Margin trading (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-07-01** | Preserve isolated-margin model, collateral, borrowing and risk controls | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-02** | Margin account readiness is transparent to the customer | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-03** | Transferable USDT, collateral, borrowable amount and liabilities remain separate | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-04** | Position opening, closing, interest, repayment and liquidation show correct states | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-05** | Insufficient collateral and unsupported operations provide actionable guidance | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-06** | Risk parameters match current Backend/Admin configuration | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-07-07** | Position, repayment and liquidation Activity/notifications are consistent | `backend/src/spot/margin.service.ts`, `frontend/app/dashboard/spot/page.tsx` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
### Finance, Earn / Mining and Loans (P1)

| ID | Owner criterion (verbatim) | Source navigation candidates | Current-release proof |
| --- | --- | --- | --- |
| [ ] **NEXI-08-01** | Finance balances and committed funds are distinguished correctly | `backend/src/financial/financial-operations.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-02** | Available products, rates, durations, restrictions and limits come from Backend/Admin | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-03** | Earn allocation, accrual, maturity, redemption and failure states are clear | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-04** | Loan applications, collateral, disbursements, interest, repayment and overdue states are consistent | `backend/src/loans/loans.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-05** | Funds, liabilities and locked commitments never appear as spendable balance | `backend/src/financial/financial-operations.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-06** | Activity and notifications reflect meaningful lifecycle changes | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
| [ ] **NEXI-08-07** | Empty product states are distinguished from failures and unconfigured products | `backend/src/mining/mining.service.ts`, `backend/src/events/event-outbox.service.ts` | **PENDING** — source semantics, deployed/browser evidence scoped separately |
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
