# NEXI — Mobile Web3 DApp-Browser UI-First Acceptance Contract

**Created 2026-11-17. Status: PRE-DEPLOYMENT EXECUTION SPECIFICATION, NOT BROWSER TEST EVIDENCE.**
**Target:** next separately approved three-surface deployment. All new-release cases start PENDING.

> OWNER DEFINITION: NEXI Public is a mobile Next.js/React **web application intended primarily for mobile Web3 wallet DApp browsers** such as the Trust Wallet or MetaMask mobile in-app browser. It is not a native mobile app. Admin is a desktop-first TanStack/React operator console. Real wallet-browser UI behavior, not HTTP-only checks, governs customer acceptance.

## 1. Source authority and no-execution boundary

- Owner's latest instruction and current Git/AGENTS.md prevail. Inspect root, frontend, Admin, backend AGENTS.md, frontend/DESIGN.md, NEXI_CURRENT_STATE.md, NEXI_PROOF_REUSE_REGISTER.md, tasks/plan.md, tasks/todo.md, and current architecture/security/operations docs as needed.
- This document merges the exact original 113 canonical IDs and requirement wordings (15 domains, 72 P0, 41 P1), the 2026-11-08 interactive UI-first plan, the 2026-11-08 browser evidence/handover, the cross-surface/financial authority, and the current Web3 mobile-design contract. It does not overwrite existing acceptance criteria, CSV receipts, owner-accepted exceptions or historical evidence.
- The separately authorized next assignment must first build and deploy the completed current repository source using the four AGENTS.md build locations. **No build, deployment, service stop/start, migration, login, browser interaction or financial action is authorized by creation of this file.** On entry to browser acceptance, prove actual deployed Backend, Public and Admin build markers, Nginx readiness, Sentry release alignment, and connected browser capabilities. Repository HEAD is not deployed identity.
- Historical old-November artifacts are not current release. Cloudflare Worker/D1 are retired. NestJS owns decisions, Prisma 7/SQLite and LedgerAccount/LedgerPosting own monetary truth, EventOutbox/EventInbox/durable journals own event and job intent, BullMQ/Aiven Valkey transport work, Socket.IO projects post-commit state. Public/Admin do not own financial truth.
- Canonical requirement IDs/text/priority remain in docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md and docs/quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv. The rows appended in section 12 are copied programmatically from this authority and retain historic statuses **only as dated reference**, never as new-release PASS.

## 2. UI-FIRST acceptance rule

**OPERATE THE REAL PRODUCT.** On the actual web page, navigate, touch/click, choose, type, review, submit when authorized, wait for real feedback, navigate/reload, check persistence and compare the other signed-in surface. For finance, correlate the exact transaction with Backend durable business state and SQLite Ledger/Activity/Outbox. A page render, network/HTTP 200, DOM snapshot, successful API call, Graphify edge, static checker, Sentry status or isolated database row is insufficient to pass a customer journey. Likewise a green toast without a durable record is not financial success.

For every scenario: (1) capture before-state and intent; (2) perform authentic UI action; (3) observe the displayed feedback; (4) correlate the exact receipt/role/asset/account/status on Public and Admin; (5) refresh/reconnect; (6) document PASS/FAIL/BLOCKED/NOT_TESTED with screenshots, timestamps, version and cause hypothesis. Do not test solely by direct HTTP client requests. API/network/SQLite/Sentry/Graphify are root-cause tools and supporting proof, not substitutes.

**Status standard:** PASS only for demonstrated same-release expected UI outcome plus needed durable financial proof. FAIL only when an actually attempted required behavior contradicts expectation. BLOCKED(reason) means genuine missing access, authorization, supported real deposit rail, collateral proof or device. NOT_TESTED(reason) means action not performed. OWNER_ACCEPTED_UNTESTED is a legacy scoped owner exception, not a verified PASS. All new-release criteria initially PENDING; previous PASS/FAIL results never carry over as current release status.

## 3. Actual mobile Web3-browser environment and matrix

**Primary proof lane W1:** real Android phone opening https://www.nexitrading.app *inside a mobile wallet's DApp browser*, with a dedicated test wallet and genuine injected provider; record wallet application version, engine/WebView, device/OS, exact account masked, Ethereum chain 1, origin, CSS viewport, visual viewport, DPR, browser toolbar, keyboard and navigation. Design authority explicitly names MetaMask and Trust Wallet DApp browsers. Each named wallet is a **target**; do not assert support/pass unless tested on real installed device. Actual wallet approval/signing handoff must work.

**W2:** second distinct supported DApp-browser provider for regression and differences in injection, toolbar, reload, background/foreground, keyboard.
**W3:** Chrome DevTools/Playwright mobile-emulated Chromium geometry. Useful for responsive interactions but **not proof of the real wallet app or its injected provider**.
**W4:** ordinary mobile browser with/without provider: offer clear compatible connection options and truthful error state; do not assume injected provider is present.
**W5:** authorized desktop Admin browser and desktop wallet regression.

Viewport coverage: 320x480, 320x568, 360x640, 390x844, 412x932, 430x932, 440x956 CSS px; small-height, landscape, text zoom and tablet as relevant. Admin: about 979x715 and 1365x723. Real DApp-browser chrome can reduce visual viewport even when layout viewport stays fixed. Measure both, not only user-agent or screenshot dimensions. Validate safe-area, bottom-dock clearance, touch targets about 44x44px, contrast, focus, accessible names, no unintentional page-wide horizontal scroll, chart and dialogs, scroll locking, visible pricing/fees, and full important monetary values. A horizontally scrollable bounded chart/timeframe rail can be intentional.

When wallet toolbar/soft keyboard occupies part of the screen: input and form remain usable, sheets/menus clamp to visual viewport, CTA can be reached, focused-input dock may hide without discarding draft state, and navigation returns to the same journey. All five labeled mobile bottom-nav destinations remain logically available. At 200% zoom ensure legibility; at 400% consider reflow and no concealed financial action. Mobile desktop-size viewport screenshots do not establish real-phone Web3 compatibility.

**Wallet/EIP checks:** EIP-1193 provider request/connect/disconnect, accountsChanged, chainChanged, error states including unauthorized 4100 where supported, wrong chain and offline; EIP-6963 multiple provider discovery only when implemented by NEXI; ERC-4361 SIWE message domain/origin/nonce/session, one appropriate signature, correct customer identity, chain ID 1 (Ethereum mainnet), wrong-network guidance, rejection recovery, switching accounts, wallet background/foreground, reconnect/refresh, expiration and protected action gating. Distinguish wallet connected from authenticated application session. Never expose seed words/private keys, use personal wallet or bypass the wallet UI. Reject Sepolia for NEXI auth. Repeat signatures only when legitimate security/session conditions demand them.

**Visual design:** frontend/DESIGN.md owns currently approved NEXI-specific hierarchy, five visual reference screens, typography, headers, dock, Quotes, Spot/Margin, Options, Wallet, sheets and states. Do not resurrect rejected generated concepts. Options durations display strictly 30s, 60s, 180s, 280s, 420s; send exact numeric seconds to Backend. Keep price chart stable and dominant where applicable; body/touch/font scaling realistic on actual DApp browser.

## 4. Browser tooling and browser-session preservation

- Future Work must verify its **actual available** Cloud Browser/computer-use capabilities first. Cloud Browser can provide interactive UI clicks but should not claim VM Chrome DevTools, wallet app injection or emulated CSS viewport without proof.
- The NEXI VM has previously used Chrome DevTools MCP and a persistent Chrome profile for authorized wallet acceptance; those historical tabs/profile IDs are **not live-session authority**. Discover and reuse existing signed-in Public/Admin pages if actually available; don't close/create substitute tabs as a setup reflex. Browser auth expiry/reconnection must be recorded separately from feature failures.
- Real Android DApp-browser evidence requires a genuinely available real mobile device/manual-owner or authorized remote-device lane. No amount of mocked injected provider state converts a desktop browser into authentic wallet-app acceptance.
- BrowserStack, Playwright, CDP, DevTools, browser console, network and DOM inspection are supplementary. Do not claim a tool did a click it didn't do or that screenshots came from a real phone unless documented.
- Attach release, account, viewport, capability and screenshot provenance to every observation. If real phone access is missing, mark REAL_DAPP_BROWSER_NOT_TESTED, keep independent desktop/UI journeys moving.

## 5. Prerequisites and explicit transaction safety

Use one designated owner-authorized test customer/wallet on chain 1, an already permitted Admin identity, and only bounded specific test-amount operations. Real Admin adjustments, Options/Spot/Margin trades, Mining subscriptions, Loan approvals, Withdrawals, KYC, messaging and configuration are production-state changes; preserve immutable intent/idempotency and capture exact resulting reference. Do not fabricate funds or blockchain deposit evidence, send external withdrawals to uncontrolled destinations, write Ledger/SQLite directly, repeat uncertain POST requests, replay historical losses or cancel the preserved BTCUSDT open limit order 1a95a4af-f902-46aa-8da7-6defa9cf8634.

If amount/recipient/collateral/network permission is absent, block **only that action** with exact reason; test other independent UI controls and available non-mutating journeys. Funding/ledger and market references must use same customer/asset/scope; historical profile 757621 is distinct from earlier profile 138324. Never mix profiles or the 1-USDT current-profile Options loss with a separate older 1,000-USDT trade.

## 6. The required execution order (UI actions first)

**J01 — DApp wallet onboarding / SIWE:** Enter Public in actual wallet browser, choose provider, connect, see correct address, sign SIWE, arrive at account and Profile. Reject signature, switch account/chain, disconnect, refresh, background and return, observe customer-oriented recovery; no repeated prompts for ordinary Spot/Options/Margin/Finance actions. Criteria 01-01..08, 12-01..02, 14-06.

**J02 — Navigation and mobile shell:** tap five dock routes, asset search/category, Quotes Hub, market detail, charts, wallet, Spot/Margin, Options, Earn/Mining, Loans, Messages, Help, notifications, Profile; check back/forward, keyboard, bottom sheet, safe area, short-height and toast state. Criteria 09-01, 11-01, 11-07, 14-01..07.

**J03 — Admin credit via UI (when approved):** Admin Clients selects exact authorized test customer, Adjust balance modal chooses actual asset/account scope, amount and reason, reviews and submits ONCE; inspect Admin result/audit/ledger and Public balance/activity after reload. Prior 5,000-USDT credit had Public Completed/Ledger POSTED while Admin audit showed FAILED; no blind retry. Criteria 02-01..06, 13-04..05, 15-01.

**J04 — Wallet/asset/portfolio:** tap Funding, Spot, Margin, Options, Finance and asset rows; confirm available/locked/committed/total, estimated USDT portfolio versus cash/custody, full precision and current enabled/deposit catalog. Distinguish 53 tradeable/market instruments from asset custody and deposit networks. Criteria 02-01..08, 11-02, 14-04.

**J05 — Deposits:** choose current asset/network, address/confirmation/minimum, inspect proof upload/validation/status; follow actual Admin approval only when authorized test rail exists. Never treat a TEST_ONLY address, screenshot or simulated receipt as real blockchain credit. Criteria 03-01..04, 03-07..08, 13-02.

**J06 — Withdrawals:** choose network, address, amount, show fees/limits/net, validate blank or wrong destination, confirm only permitted request, verify Admin review status, Public history and Ledger; external execution requires distinct controlled destination approval. Criteria 03-05..08, 13-04..05.

**J07 — Transfers:** real Funding to Spot/Options/Margin/Finance and permitted recipient-mode UI; insufficient funds produces actionable guidance; authorized small transfer once and verify both balance scopes and Activity after no reload, reload and reconnect. Criteria 04-01..07, 15-01.

**J08 — Convert:** select actually owned source asset, target, amount, quote rate/spread/expiry, review and one authorized acceptance, verify source/destination balances, history, exact-user Admin Ledger/Activity. Prior 0.00001 BTC->USDT quote showed failure/no confirmed posting; don't retry old intent. Criteria 04-08, 15-01.

**J09 — Binary/Options full lifecycle:** choose pair, 30/60/180/280/420-second durations, direction, payout/limits, stake and insufficient-funds state, read confirm, submit bounded test once, see actual OPEN position, correct countdown and expiration, settlement WIN/LOSS/DRAW/REFUND/FAILED, payout, Ledger and Admin settled row, history and notifications. Check stale status after refresh and screenshot; don't infer success from toast. Criteria 05-01..10, 13-05, 15-01.

**J10 — Spot and markets:** select pair/timeframe/indicators, inspect reference orderbook versus NEXI executable liquidity, submit authorized minimum MARKET/LIMIT, see exact order placement/fill/reject/cancel, reserve/release, fees, cost, history/Activity and Admin; preserve already-open order. Criteria 06-01..08, 11-01..07, 15-01.

**J11 — Isolated Margin:** choose long/short, leverage 2x/3x/5x as configured, collateral/borrow, review and permitted open; verify PENDING/OPEN semantics, liability, reserved/locked balances, risk ratio, close/repay/liquidation controls and Activity where authorized. Prior LONG 2x 10-USDT collateral PENDING and GATE2_SPOT_ORDER_RESERVE label must be rechecked on new release. Criteria 07-01..07, 15-01.

**J12 — Mining/Earn:** select each available plan, verify rates with units/period, term/min/max, eligibility and Admin settings, authorized subscription, principal lock, rewards, redeem/expiry and negative cases. Prior current-profile 10 USDT active subscription versus Admin entitlement NO is historical. Criteria 08-01..03, 08-05..07, 13-02.

**J13 — Loans:** eligible/ineligible selection, product/rate period, quote principal/interest/repayment and collateral reference; ensure Submit unavailable or meaningful validation with missing approved collateral/eligibility; approved authorized application/decision/disbursement/repay only when prerequisite exists. Bare 0.1 rate and enabled blank collateral are prior regressions. Criteria 08-02, 08-04..07, 13-05.

**J14 — Notification and communications:** tap bell, filter five categories, mark read, unread count/persistence, event delivery/duplicate suppression; Messages customer/Admin conversation, emoji/attachment send and reply if authorized, support/help/topics and Admin-governed contacts distinct, reconnect and failed-send feedback. Criteria 09-01..08, 10-01..07, 13-06.

**J15 — Profile, KYC, referrals and settings:** profile and ID, referral/VIP, KYC upload/status, session management, security/preferences/locale/notification settings; edit authorized fields and read after refresh, preserve wallet identity. Criteria 12-01..06, 01-02/04/06.

**J16 — Admin governance:** visit every intended Admin UI route, click filters/search/rows/modal/actions, verify RBAC/saved config and Public consumer. Do not count route HTTP 200 or screenshot alone. Criteria 13-01..07 and separate Admin route overlay below.

**J17 — Recovery and consistency:** offline/online, socket disconnect, tab background/foreground, DApp wallet signing return, stale quote, reconnect and reload; status/balances accurate without duplicate trade/fund action, 1m/5m/15m/30m/1h/4h/1d indicators preserve settings. Criteria 01-06, 02-08, 05-06/09, 09-06, 11-03/04/07, 14-06.

**J18 — Release/economic proof:** same deployed SHA per surface, service readiness, current Sentry releases/sourcemaps if present, user-led UI journey linked to exact Backend response/SQLite Ledger/Outbox/Admin audit and realtime or REST resnapshot; all 113 dispositions, no unaccepted P0 misleading economic result. Criteria 15-01..07.

The sequence is a practical operator dependency order, not a claim that one step passes every mapped criterion. Every original criterion requires its own justified pass/fail/blocked status; market/financial criteria may need multiple sub-scenarios.

## 7. Admin operator route overlay (not additional 113 items)

Historical source map says 8 workspaces, 21 direct navigation destinations, 13 route-only (34 named page routes). Re-verify against the newly deployed Admin source/UI. Workspaces:
- Overview: /overview.
- Clients: /users, /kyc.
- Trading: /binary, /settlements, /spot.
- Wallet & Finance: /networks, /deposits, /withdrawals, /ledger.
- Markets: /assets, /market-feeds.
- Products: /mining, /loans.
- Communications: /messages, /notifications, /announcements, /learn.
- Administration & Settings: /frontend-control, /admins, /maintenance.

Route-only: /approvals, /audit, /exposure, /feature-flags, /health, /localization, /navigation, /reconciliation, /roles, /sandbox, /sessions, /support, /wallets.
Special dispositions: /reconciliation hidden/unsupported; /sandbox contextual; /support compatibility-only because tickets workflow retired. Confirm live role/deep-link/refresh/back/forward behavior without inventing a retired ticket business workflow. Check table data, search, selected account, saved settings, desktop widths and keyboard. No hardcoded assumption every source route is a visible sidebar destination.

## 8. Historical regression seeds, never current-release PASS or FAIL

**November 8 handover: 16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED.** The correction moved 04-03, 04-05, 04-06 and 15-01 from wrongly BLOCKED to NOT_TESTED; they were not performed. These statuses are baseline context only, with account/profile and prior release provenance preserved in original CSV/receipt.

- Options: 1 USDT LONG displayed Settlement failure while Public Activity and Admin Ledger showed POSTED LOSS; separate older trade Public SHORT/Admin LONG conflict; stale countdown/status. Do not replay old position.
- Admin: 5,000 USDT funding posted and Public Completed while Admin audit reported FAILED; no uncertain retry.
- Spot: order value versus fill (10.825628585772 versus 10.6189445362), accepted-versus-CANCELED and reserve/release activity conflicts; preserve open BTCUSDT limit order 1a95a4af-f902-46aa-8da7-6defa9cf8634.
- Margin: LONG 2x with 10 USDT collateral PENDING; reserve mislabeled SPOT; liabilities and status unclear.
- Wallet/mobile: monetary values truncated; wallet/card/search/category overflow; market versus custody asset confusion; zero-account text misleading.
- Mining: 10 USDT active subscription versus Admin entitlement NO; 0.005/0.010/0.015 bare rates and reward empty/loading language.
- Loans: eligibility Unavailable while product Available; 0.1 bare rate; Submit enabled without collateral reference.
- Convert: BTC->USDT acceptance/quote failed to produce confirmed matching Activity/Ledger; no retry.
- Withdrawals: unclear network/fees/limits/eligibility at some stages; no fabricated external transfer.
- Notifications, Support/Messages, reconnect: bell inaccessible, contact settings contradiction, wallet/chart stale states; Admin Ledger detail sometimes showed dashes instead of monetary fields.

Exact chronology and distinct profile IDs belong in tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md and tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md. Never mix their participants or infer the defect persists in the next source release.

## 9. Evidence record and acceptance gate

Per attempt, capture:
run_id, scenario_id, original criterion ID, P0/P1, UTC time, all three deployed release SHAs, UI route, actual DApp browser/desktop/emulator type, wallet application/version/provider, device/OS, viewport CSS/visual dimensions, DPR/touch, masked wallet + profile/role, expected UI, exact click/tap/type/select/submit/wait sequence, screenshot/video, observed UI and feedback, business request/idempotency ref, sanitized network/Sentry when diagnostic, Public/Admin readback, exact SQLite Ledger/Outbox correlation when financial, PASS/FAIL/BLOCKED/NOT_TESTED and reason, likely causal owner, duplicate defect cluster, next dependency. Do not save seed phrases, full tokens or personal wallet data.

**PASS rule:** real same-release customer/operator UI interaction **plus** required outcome/persistence. A financial PASS must reconcile actual account/scope/asset/amount/direction and exactly one authoritative durable write. A UI toast without valid durable effect is FAIL/INSUFFICIENT_EVIDENCE, not PASS. A posted Ledger row plus misleading UI is also FAIL for customer-facing criterion. For critical negative states, demonstrate that UI blocks unsafe request and displays actionable error; corroborate server denial when relevant.

**Closure:** 113 unique criteria accounted for with statuses and exact evidence; 21+13 Admin route dispositions; real mobile wallet DApp-browser device evidence (or explicit REAL_DAPP_BROWSER_NOT_TESTED); screenshots for action/outcome, not only static home pages; all permitted economic journeys attempted, rest BLOCKED with specific prerequisites. No unaccepted P0 customer/financial errors. Reporting 113 rows is not equivalent to passing 113 tests.

**Test-first repair campaign:** Phase A runs on a fixed deployed release: exercise ALL feasible UI journeys, collect evidence and deduplicate root causes; do not edit source or restart services mid-run. Phase B separately authorizes one consolidated source repair at actual causal owners, bounded verification, new coordinated release, regression of affected UI journeys. Fallow, CodeScene, Doctors, Graphify, API/network tests remain supporting investigation tools, not customer acceptance.

## 10. Provenance and external technology references

Internal source authority:
- docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md and docs/quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv — original criteria, 113 IDs, 72 P0/41 P1.
- docs/quality/NEXI_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_20261108.md — operate real product, 21+13 Admin, two-phase interaction/evidence.
- tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md — 16/24/8/65 historic status and exact failures.
- tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md — chronological browser/owner screenshots and screen recording observations.
- tasks/evidence/nexi-browser-acceptance-113-continuation-20261105.csv — 113 historical statuses and evidence.
- frontend/DESIGN.md — mobile Web3 wallet DApp browser runtime, actual viewport, touch/dock/keyboard contract, visual authority.
- docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md and CROSS_SURFACE_FEATURE_MAP.md — producer/consumer and Ledger authority; four AGENTS.md — exact source/release behavior.

Standards/reference (not NEXI implementation proof):
- https://eips.ethereum.org/EIPS/eip-1193 — provider request/accounts/chain/disconnect rules.
- https://eips.ethereum.org/EIPS/eip-6963 — multi-provider discovery if implemented.
- https://eips.ethereum.org/EIPS/eip-4361 — SIWE origin/session structure.
- https://playwright.dev/docs/emulation — mobile device emulation (not real wallet app).
- https://nextjs.org/docs/app — Next.js App Router.

## 11. Canonical 113 requirement coverage: original text retained

The following text was extracted automatically from the canonical owner checklist. Historic Nov 8 is **not** the new-release status. Every new-release status is PENDING.


### Wallet authentication and user onboarding (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-01-01 | One successful SIWE sign-in establishes or retrieves the correct NEXI user | NOT_TESTED | PENDING |
| NEXI-01-02 | UUID, public user code, referral attribution, VIP/default profile and preferences initialize correctly | NOT_TESTED | PENDING |
| NEXI-01-03 | All supported internal financial account destinations are usable without manual account creation | NOT_TESTED | PENDING |
| NEXI-01-04 | Returning customers retain their existing accounts, balances, referrals and settings | NOT_TESTED | PENDING |
| NEXI-01-05 | No additional wallet signature is requested merely to access Spot, Binary, Margin or Finance | NOT_TESTED | PENDING |
| NEXI-01-06 | Session expiration, reconnect, account switching and wallet disconnect behave correctly | FAIL | PENDING |
| NEXI-01-07 | Public exploration works as intended without authentication; protected actions require a session | NOT_TESTED | PENDING |
| NEXI-01-08 | Wallet-provider selection, wrong-network handling and rejected signatures provide clear recovery | NOT_TESTED | PENDING |


### Wallet accounts, balances and activity (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-02-01 | Funding (MAIN), Spot, Margin, Options (BINARY) and Finance display coherently | PASS | PENDING |
| NEXI-02-02 | Zero-balance accounts are not described as unsupported or unverified wallets | FAIL | PENDING |
| NEXI-02-03 | Available, locked, committed and total balances are consistent across all screens | PASS | PENDING |
| NEXI-02-04 | Balances refresh after every successful financial mutation | PASS | PENDING |
| NEXI-02-05 | Activity includes the correct type, amount, asset, status, time and transaction reference | FAIL | PENDING |
| NEXI-02-06 | Internal transfers appear coherently in source and destination account views | PASS | PENDING |
| NEXI-02-07 | Asset support and product-specific restrictions remain enforced without unnecessary account screens | FAIL | PENDING |
| NEXI-02-08 | Refresh, reconnection and navigation do not present stale balances as current | NOT_TESTED | PENDING |


### Deposits and withdrawals (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-03-01 | Supported assets and networks come from current Admin/Backend configuration | NOT_TESTED | PENDING |
| NEXI-03-02 | Deposit addresses, network selection and confirmation instructions are correct | BLOCKED | PENDING |
| NEXI-03-03 | Deposit pending, confirmed, failed and review states are understandable | NOT_TESTED | PENDING |
| NEXI-03-04 | Deposit credit updates the right Funding account, Activity and eligible notifications | BLOCKED | PENDING |
| NEXI-03-05 | Withdrawals clearly show network, fees, limits, destination and expected amount | FAIL | PENDING |
| NEXI-03-06 | Approval, rejection, confirmation and retry states remain consistent | BLOCKED | PENDING |
| NEXI-03-07 | Missing configuration and unsupported networks fail safely with useful guidance | NOT_TESTED | PENDING |
| NEXI-03-08 | No duplicate credit, debit or withdrawal occurs on retries | BLOCKED | PENDING |


### Internal transfers and conversion (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-04-01 | Funding ↔ Spot, Margin, Options and Finance transfers work for permitted asset/scope pairs | PASS | PENDING |
| NEXI-04-02 | Users never need to manually open an internal account before transferring | NOT_TESTED | PENDING |
| NEXI-04-03 | Insufficient transfer balance produces a specific actionable error | NOT_TESTED | PENDING |
| NEXI-04-04 | Successful transfer shows asset, amount, source and destination | PASS | PENDING |
| NEXI-04-05 | Source and destination balances update without page reload | NOT_TESTED | PENDING |
| NEXI-04-06 | Activity and notification records reflect the transfer consistently | NOT_TESTED | PENDING |
| NEXI-04-07 | User-to-user transfers resolve the correct recipient and confirm success | BLOCKED | PENDING |
| NEXI-04-08 | Conversion quotes, expiry, spread, acceptance and Ledger postings agree | FAIL | PENDING |


### Binary / Options trading (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-05-01 | Preserve current Admin-controlled pair, duration, payout, stake-limit and enablement configuration | PASS | PENDING |
| NEXI-05-02 | Authenticated customers can enter stake and choose Long/Short without unnecessary wallet verification | PASS | PENDING |
| NEXI-05-03 | Insufficient Options funds produce an actionable dialog and funding/transfer path | FAIL | PENDING |
| NEXI-05-04 | The entered pair, duration, direction and stake survive the funding journey where appropriate | FAIL | PENDING |
| NEXI-05-05 | Funded orders show accurate review, reserve stake and create one position | FAIL | PENDING |
| NEXI-05-06 | Countdown, entry price, expiry and live position status remain coherent | FAIL | PENDING |
| NEXI-05-07 | WIN/LOSS settlement uses authoritative Backend values and updates balances | FAIL | PENDING |
| NEXI-05-08 | Result cards, history, Activity and notifications reflect the final outcome | FAIL | PENDING |
| NEXI-05-09 | Disabled pair, invalid stake, stale quote, settlement delay and reconnect have clear behavior | NOT_TESTED | PENDING |
| NEXI-05-10 | Idempotency and Ledger reservation safeguards are never removed | NOT_TESTED | PENDING |


### Spot trading (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-06-01 | Market, limit and supported stop-order behavior follows current Backend contracts | NOT_TESTED | PENDING |
| NEXI-06-02 | Available base/quote balance and estimated cost are clear | PASS | PENDING |
| NEXI-06-03 | Insufficient funds, invalid quantity, minimum order and stale-price errors are useful | NOT_TESTED | PENDING |
| NEXI-06-04 | Order review, confirmation, placement and cancellation work coherently | FAIL | PENDING |
| NEXI-06-05 | Partial fills, fees, reserves and remaining balances reconcile | NOT_TESTED | PENDING |
| NEXI-06-06 | Open orders and trade history refresh correctly | NOT_TESTED | PENDING |
| NEXI-06-07 | Accepted/rejected/filled/cancelled states trigger appropriate Activity and notifications | FAIL | PENDING |
| NEXI-06-08 | Spot controls do not request repeated wallet verification from authenticated users | NOT_TESTED | PENDING |


### Margin trading (P1)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-07-01 | Preserve isolated-margin model, collateral, borrowing and risk controls | NOT_TESTED | PENDING |
| NEXI-07-02 | Margin account readiness is transparent to the customer | NOT_TESTED | PENDING |
| NEXI-07-03 | Transferable USDT, collateral, borrowable amount and liabilities remain separate | NOT_TESTED | PENDING |
| NEXI-07-04 | Position opening, closing, interest, repayment and liquidation show correct states | FAIL | PENDING |
| NEXI-07-05 | Insufficient collateral and unsupported operations provide actionable guidance | NOT_TESTED | PENDING |
| NEXI-07-06 | Risk parameters match current Backend/Admin configuration | PASS | PENDING |
| NEXI-07-07 | Position, repayment and liquidation Activity/notifications are consistent | FAIL | PENDING |


### Finance, Earn / Mining and Loans (P1)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-08-01 | Finance balances and committed funds are distinguished correctly | NOT_TESTED | PENDING |
| NEXI-08-02 | Available products, rates, durations, restrictions and limits come from Backend/Admin | NOT_TESTED | PENDING |
| NEXI-08-03 | Earn allocation, accrual, maturity, redemption and failure states are clear | FAIL | PENDING |
| NEXI-08-04 | Loan applications, collateral, disbursements, interest, repayment and overdue states are consistent | BLOCKED | PENDING |
| NEXI-08-05 | Funds, liabilities and locked commitments never appear as spendable balance | NOT_TESTED | PENDING |
| NEXI-08-06 | Activity and notifications reflect meaningful lifecycle changes | BLOCKED | PENDING |
| NEXI-08-07 | Empty product states are distinguished from failures and unconfigured products | FAIL | PENDING |


### Notifications system (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-09-01 | Existing notification center and five categories remain intact | FAIL | PENDING |
| NEXI-09-02 | Authenticated customer-specific notification loading and read state work | NOT_TESTED | PENDING |
| NEXI-09-03 | Trade, transfer, deposit, withdrawal, conversion and account event producer coverage is traced | NOT_TESTED | PENDING |
| NEXI-09-04 | Only genuine committed events create durable notifications | NOT_TESTED | PENDING |
| NEXI-09-05 | Unread counts, mark-read behavior and category filtering remain correct | NOT_TESTED | PENDING |
| NEXI-09-06 | Realtime delivery, reconnect, deduplication and REST resnapshot work on the VPS | NOT_TESTED | PENDING |
| NEXI-09-07 | Notifications contain relevant amounts/statuses without exposing sensitive data | NOT_TESTED | PENDING |
| NEXI-09-08 | Settings/preferences and Admin-governed notifications behave according to current contracts | NOT_TESTED | PENDING |


### Messages and customer support (P1)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-10-01 | Preserve Nexi Customer Service and the approved customer-to-Admin conversation model | PASS | PENDING |
| NEXI-10-02 | Send, read, delivered and failed states use authoritative records | NOT_TESTED | PENDING |
| NEXI-10-03 | Emoji, attachments, conversation history and unread state work | NOT_TESTED | PENDING |
| NEXI-10-04 | Admin replies reach the correct customer without wrong-recipient routing | PASS | PENDING |
| NEXI-10-05 | Realtime delivery and reconnection resync from durable storage | NOT_TESTED | PENDING |
| NEXI-10-06 | Support and Messages remain distinct according to current owner decisions | PASS | PENDING |
| NEXI-10-07 | Telegram/email support settings remain Admin-controlled where applicable | NOT_TESTED | PENDING |


### Dashboard, markets and charts (P1)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-11-01 | Quotes Hub, asset search, categories and navigation work | PASS | PENDING |
| NEXI-11-02 | Canonical asset icons, names, tickers and supported pairs remain consistent | NOT_TESTED | PENDING |
| NEXI-11-03 | Live prices, candlesticks, timeframe switching and chart state remain coherent | FAIL | PENDING |
| NEXI-11-04 | Stale/unavailable market feeds are not represented as live | NOT_TESTED | PENDING |
| NEXI-11-05 | Selected asset/pair follows the customer across relevant trading surfaces | NOT_TESTED | PENDING |
| NEXI-11-06 | Orderbook and trades show authentic source data, not fabricated activity | PASS | PENDING |
| NEXI-11-07 | Loading, empty, error and reconnect states recover correctly | FAIL | PENDING |


### Profile, settings, referral and security (P1)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-12-01 | User profile, code, referral information, preferences and session identity remain stable | NOT_TESTED | PENDING |
| NEXI-12-02 | Security and session management behave correctly without redundant wallet prompts | NOT_TESTED | PENDING |
| NEXI-12-03 | KYC states, uploads and approval status are reflected accurately | NOT_TESTED | PENDING |
| NEXI-12-04 | Language, timezone, currency presentation and notification preferences persist | NOT_TESTED | PENDING |
| NEXI-12-05 | Security-sensitive operations retain appropriate independent authorization | NOT_TESTED | PENDING |
| NEXI-12-06 | Settings actions show clear success/failure and refresh persisted state | NOT_TESTED | PENDING |


### Admin-to-Public consistency (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-13-01 | Preserve the approved eight-workspace Admin information architecture | NOT_TESTED | PENDING |
| NEXI-13-02 | Admin-configured trading/product/asset/network rules propagate correctly to Public | NOT_TESTED | PENDING |
| NEXI-13-03 | Enabled/disabled features and risk controls are never replaced by frontend constants | NOT_TESTED | PENDING |
| NEXI-13-04 | Admin approval and financial actions retain RBAC, audit and idempotency | BLOCKED | PENDING |
| NEXI-13-05 | Public statuses match authoritative Admin/Backend decisions | FAIL | PENDING |
| NEXI-13-06 | Notifications and messages integrate with the current Admin workflows | NOT_TESTED | PENDING |
| NEXI-13-07 | Existing source and deployed UI fixes are reused unless invalidated | NOT_TESTED | PENDING |


### Interaction quality, mobile and recovery (P1)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-14-01 | Every important action has meaningful loading, success, empty and failure feedback | NOT_TESTED | PENDING |
| NEXI-14-02 | Disabled controls explain their reason or offer a valid recovery path | NOT_TESTED | PENDING |
| NEXI-14-03 | Dialogs preserve customer input and avoid trapping the customer | NOT_TESTED | PENDING |
| NEXI-14-04 | Mobile layouts, bottom navigation, safe areas and short-height screens remain usable | FAIL | PENDING |
| NEXI-14-05 | Accessibility, labels, focus, keyboard and touch targets work | NOT_TESTED | PENDING |
| NEXI-14-06 | Network interruptions, refresh and session recovery avoid duplicated actions | FAIL | PENDING |
| NEXI-14-07 | No unnecessary authentication, account-creation or technical debugging instructions appear in customer UI | NOT_TESTED | PENDING |


### End-to-end financial and release proof (P0)

| ID | Original owner criterion (verbatim) | Historical Nov 8 | New release |
| --- | --- | --- | --- |
| NEXI-15-01 | Each critical journey is reconciled across Public → Backend → SQLite Ledger → Activity/Outbox → realtime/readback | NOT_TESTED | PENDING |
| NEXI-15-02 | Existing passing tests and owner-accepted financial exceptions are preserved unless source changes invalidate them | NOT_TESTED | PENDING |
| NEXI-15-03 | Negative authorization, concurrency, insufficient funds and idempotency remain covered | NOT_TESTED | PENDING |
| NEXI-15-04 | Production service/deployment identity is established before new acceptance claims | PASS | PENDING |
| NEXI-15-05 | Sentry release/error/notification behavior is verified against the current deployment | NOT_TESTED | PENDING |
| NEXI-15-06 | Authenticated customer and Admin browser acceptance is distinct from route-load and HTTP 200 checks | NOT_TESTED | PENDING |
| NEXI-15-07 | Only confirmed gaps receive source changes; focused regression tests prove those changes | NOT_TESTED | PENDING |

**Creation is documentation-only. No application tests, browser visits, financial writes, builds, service restarts or deployment executed to create this file.**
