# NEXI — Mobile Web3 DApp-Browser UI-First Acceptance Contract

**Created 2026-11-17; execution contract reconciled 2026-11-22. Status: PRE-DEPLOYMENT EXECUTION SPECIFICATION, NOT BROWSER TEST EVIDENCE.**
**Target:** next separately authorized, release-identified authenticated UI campaign. All 113 current-campaign criteria and supplemental scenarios start NOT_TESTED; historical results do not carry over.

> OWNER DEFINITION: NEXI Public is a mobile Next.js/React **web application intended primarily for mobile Web3 wallet DApp browsers** such as the Trust Wallet or MetaMask mobile in-app browser. It is not a native mobile app. Admin is a desktop-first TanStack/React operator console. Real wallet-browser UI behavior, not HTTP-only checks, governs customer acceptance.

## 1. Source authority and no-execution boundary

- Owner's latest instruction and current Git/AGENTS.md prevail. Inspect root, frontend, Admin, backend AGENTS.md, frontend/DESIGN.md, NEXI_CURRENT_STATE.md, tasks/todo.md, and current architecture/security/operations docs as needed.
- This document merges the exact original 113 canonical IDs and requirement wordings (15 domains, 72 P0, 41 P1), the 2026-11-08 interactive UI-first plan, the 2026-11-08 browser evidence/handover, the cross-surface/financial authority, and the current Web3 mobile-design contract. It does not overwrite existing acceptance criteria, CSV receipts, owner-accepted exceptions or historical evidence.
- The next separately authorized assignment must establish the intended coordinated Backend/Public/Admin release candidate and, if necessary, build/deploy using applicable AGENTS.md rules. **This document change does not authorize any build, deployment, service stop/start, migration, browser interaction or financial action.** On entry to browser acceptance, verify actual component build markers, corresponding source identities, Nginx readiness, Sentry alignment and genuine connected browser capability. Repository HEAD is not deployed identity; different surface artifact SHAs may legitimately belong to one coordinated release.
- Historical old-November artifacts are not current release. Cloudflare Worker/D1 are retired. NestJS owns decisions, Prisma 7/SQLite and LedgerAccount/LedgerPosting own monetary truth, EventOutbox/EventInbox/durable journals own event and job intent, BullMQ/Aiven Valkey transport work, Socket.IO projects post-commit state. Public/Admin do not own financial truth.
- Canonical requirement IDs/text/priority remain in docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md and docs/quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv. No duplicated rows are maintained here. Historical receipts stay dated reference only; maintain separate current-campaign evidence and result dispositions.

## 2. UI-FIRST acceptance rule

**OPERATE THE REAL PRODUCT.** On the actual web page, navigate, touch/click, choose, type, review, submit when authorized, wait for real feedback, navigate/reload, check persistence and compare the other signed-in surface. For finance, correlate the exact transaction with Backend durable business state and SQLite Ledger/Activity/Outbox. A page render, network/HTTP 200, DOM snapshot, successful API call, Graphify edge, static checker, Sentry status or isolated database row is insufficient to pass a customer journey. Likewise a green toast without a durable record is not financial success.

For every scenario: (1) capture before-state and intent; (2) perform authentic UI action; (3) observe the displayed feedback; (4) correlate the exact receipt/role/asset/account/status on Public and Admin; (5) refresh/reconnect; (6) document PASS/FAIL/BLOCKED/NOT_TESTED with screenshots, timestamps, version and cause hypothesis. Do not test solely by direct HTTP client requests. API/network/SQLite/Sentry/Graphify are root-cause tools and supporting proof, not substitutes.

**Status standard:** PASS only for demonstrated same-release expected UI outcome plus needed durable financial proof. FAIL only when an actually attempted required behavior contradicts expectation. BLOCKED(reason) means genuine missing access, authorization, supported real deposit rail, collateral proof or device. NOT_TESTED(reason) means action not performed. OWNER_ACCEPTED_UNTESTED is a legacy scoped owner exception, not a verified PASS. **Reset all 113 new-campaign results to NOT_TESTED** before testing; previous PASS/FAIL never carries forward. New results require fresh release-specific evidence.

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

**J04 — Wallet/asset/portfolio:** From authenticated Public tap Funding, Spot, Margin, Options, Finance, asset rows and the Deposit/Withdraw/Transfer/Convert controls. Verify available/locked/committed/total, estimated USDT portfolio versus native balances/custody, readable **full monetary precision without ellipsis or clipping** at narrow/short real wallet-browser viewports, actual enabled/deposit asset catalog, loading/empty/error feedback, touch accessibility and scroll/keyboard behavior. Distinguish 53 market instruments from custody/deposit-enabled assets and accurately label zero balance. Following any authorized action, refresh both scopes and Activity. November 8 clipped values in phone screenshots are historical regression examples, not confirmed current defects. Criteria 02-01..08, 11-02, 14-01/04/05.

**J05 — NEXI manual deposit proof/claim (preserve approved product model):** Authenticated Public customer opens Wallet → Deposit, selects a currently enabled asset (USDT or USDC only if configured), selects the supported network (ERC20 only when actually configured for that asset), checks warnings/limits/confirmation information, QR code and copyable deposit address. Confirm that QR, address, asset and network agree; test unsupported/mismatched choices and empty destination. On a separately authorized controlled deposit rail, customer transfers externally, returns to the UI, enters the claimed amount, optionally transaction hash, uploads the screenshot (supported image formats), reviews and submits exactly once. Check validation, pending identity/status, reload/reconnect and ambiguous or duplicate submission recovery. Authorized Admin selects the exact claim/customer/network/asset, privately opens the uploaded proof, reviews and records a permissioned approve/reject decision with reason/audit; reconcile any **independently verified and authorized** Funding credit against Ledger, Activity, Admin and Public. Screenshot and self-reported amount are claims, never proof of an actual transfer or permission for automatic credit. **No new automatic custody/chain provider integration is required by this acceptance contract.** If no controlled rail is available, perform all safe UI cases and mark actual funding/credit proof BLOCKED with reason, never fabricate a chain deposit. Criteria 03-01..04, 03-07..08, 13-02/04/05, 14-01/04, 15-01.

**J06 — Withdrawals:** choose network, address, amount, show fees/limits/net, validate blank or wrong destination, confirm only permitted request, verify Admin review status, Public history and Ledger; external execution requires distinct controlled destination approval. Criteria 03-05..08, 13-04..05.

**J07 — Transfers:** real Funding to Spot/Options/Margin/Finance and permitted recipient-mode UI; insufficient funds produces actionable guidance; authorized small transfer once and verify both balance scopes and Activity after no reload, reload and reconnect. Criteria 04-01..07, 15-01.

**J08 — Convert:** select actually owned source asset, target, amount, quote rate/spread/expiry, review and one authorized acceptance, verify source/destination balances, history, exact-user Admin Ledger/Activity. Prior 0.00001 BTC->USDT quote showed failure/no confirmed posting; don't retry old intent. Criteria 04-08, 15-01.

**J09 — Binary/Options full lifecycle and protected research controls:** In authenticated Public, select actual pair, exact 30/60/180/280/420-second duration (especially 60 seconds), LONG/CALL or SHORT/PUT, Admin-controlled payout/limits and stake. Click review, test insufficient funds/recovery and submit one bounded authorized intent. Verify authoritative entry price/time, OPEN, countdown, expiry, SETTLING/SETTLEMENT_DELAYED if appropriate, final economic WIN/LOSS, payout, Ledger, History, Activity, notifications and matching Admin position. **Economic outcomes are WIN/LOSS only, with equal entry/expiry = LOSS; technical ERROR or delayed settlement is not DRAW/REFUND or automatic LOSS.** Independently test normal provider-backed trading and the **existing research-only Admin Force WIN / Force LOSS behavior without altering it**: role/permission, default or position override, exact direction/duration/version, and selected-position simulated chart candles moving over time toward the planned result, including 60-second expiry. Capture timed video and observed displayed candles, not only a final API value; verify chart provenance explicitly labels sandbox/research, isolation from the real market feed and other users/pairs, return to live chart, reconnect/reload and result consistency. Never synthesize real market quotes or change the forced-result economic control. Regression examples from November 8 are historical only and cannot be replayed. Criteria 05-01..10, 11-03/04/07, 13-02/04/05, 14-01/04/06, 15-01.

**J10 — Spot and markets:** select pair/timeframe/indicators, inspect reference orderbook versus NEXI executable liquidity, submit authorized minimum MARKET/LIMIT, see exact order placement/fill/reject/cancel, reserve/release, fees, cost, history/Activity and Admin; preserve already-open order. Criteria 06-01..08, 11-01..07, 15-01.

**J11 — Isolated Margin:** choose long/short, leverage 2x/3x/5x as configured, collateral/borrow, review and permitted open; verify PENDING/OPEN semantics, liability, reserved/locked balances, risk ratio, close/repay/liquidation controls and Activity where authorized. Prior LONG 2x 10-USDT collateral PENDING and GATE2_SPOT_ORDER_RESERVE label must be rechecked on new release. Criteria 07-01..07, 15-01.

**J12 — Mining/Earn:** select each available plan, verify rates with units/period, term/min/max, eligibility and Admin settings, authorized subscription, principal lock, rewards, redeem/expiry and negative cases. Prior current-profile 10 USDT active subscription versus Admin entitlement NO is historical. Criteria 08-01..03, 08-05..07, 13-02.

**J13 — Loans:** eligible/ineligible selection, product/rate period, quote principal/interest/repayment and collateral reference; ensure Submit unavailable or meaningful validation with missing approved collateral/eligibility; approved authorized application/decision/disbursement/repay only when prerequisite exists. Bare 0.1 rate and enabled blank collateral are prior regressions. Criteria 08-02, 08-04..07, 13-05.

**J14 — Notification and communications:** tap bell, filter five categories, mark read, unread count/persistence, event delivery/duplicate suppression; Messages customer/Admin conversation, emoji/attachment send and reply if authorized, support/help/topics and Admin-governed contacts distinct, reconnect and failed-send feedback. Criteria 09-01..08, 10-01..07, 13-06.

**J15 — Profile, KYC, referrals and settings:** profile and ID, referral/VIP, KYC upload/status, session management, security/preferences/locale/notification settings; edit authorized fields and read after refresh, preserve wallet identity. Criteria 12-01..06, 01-02/04/06.

**J16 — Admin governance:** Operate the approved **eight-workspace** desktop Admin UI, click intended navigation destinations and permitted deep links; use filters, search, sort, rows, detail drawers, modals, configurations and actions with permissioned operator identity. Verify actual saves and Public consumers, denied-state RBAC, reasons/audit, exact customer/asset/plan/network identity, and no cluttering retired development-stage workflows. A route HTTP 200 or screenshot alone is not a PASS. Criteria 13-01..07 and separate Admin route overlay below.

**J17 — Recovery and consistency:** offline/online, socket disconnect, tab background/foreground, DApp wallet signing return, stale quote, reconnect and reload; status/balances accurate without duplicate trade/fund action, 1m/5m/15m/30m/1h/4h/1d indicators preserve settings. Criteria 01-06, 02-08, 05-06/09, 09-06, 11-03/04/07, 14-06.

**J18 — Release/economic proof:** Identify the coordinated deployed release for each Backend/Public/Admin component and its corresponding source/build marker (component SHAs need not be literally identical); inspect service readiness and current Sentry releases/sourcemaps if present. Tie authenticated user-led clicks to exact Backend response, SQLite Ledger/Outbox/Admin audit and realtime or REST readback. Record **fresh dispositions for all 113 criteria and each separate UX overlay**, with no inherited PASS/FAIL and no unaccepted P0 misleading economic result. Criteria 15-01..07.

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

- Options: 1 USDT LONG displayed Settlement failure while Public Activity and Admin Ledger showed POSTED LOSS; a **separate historical 1,000-USDT SHORT recording** showed a settlement-error presentation; another older trade had Public SHORT/Admin LONG disagreement; stale countdown/status also appeared. Keep trade/profile provenance distinct. Do not replay any old position. Preserve research Force WIN/LOSS and simulated chart movement and retest on new authorized positions.
- Admin: 5,000 USDT funding posted and Public Completed while Admin audit reported FAILED; no uncertain retry.
- Spot: order value versus fill (10.825628585772 versus 10.6189445362), accepted-versus-CANCELED and reserve/release activity conflicts; preserve open BTCUSDT limit order 1a95a4af-f902-46aa-8da7-6defa9cf8634.
- Margin: LONG 2x with 10 USDT collateral PENDING; reserve mislabeled SPOT; liabilities and status unclear.
- Wallet/mobile: historical screenshots showed clipped `5,000.00...` and related values; wallet/card/search/category overflow, market versus custody asset confusion and zero-account text were reported. Several source components were subsequently changed to address clipping, but real latest-release mobile rendering remains unproven. Retest instead of treating these old reports as current defects.
- Mining: 10 USDT active subscription versus Admin entitlement NO; 0.005/0.010/0.015 bare rates and reward empty/loading language.
- Loans: eligibility Unavailable while product Available; 0.1 bare rate; Submit enabled without collateral reference.
- Convert: BTC->USDT acceptance/quote failed to produce confirmed matching Activity/Ledger; no retry.
- Withdrawals: unclear network/fees/limits/eligibility at some stages; no fabricated external transfer.
- Notifications, Support/Messages, reconnect: bell inaccessible, contact settings contradiction, wallet/chart stale states; Admin Ledger detail sometimes showed dashes instead of monetary fields.

Exact chronology and distinct profile IDs belong in tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md and tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md. Never mix their participants or infer the defect persists in the next source release.

## 9. Fresh UX and behavior coverage overlay — linked to the original 113

The original 113 criteria began with earlier November browser findings; the November 8 phone screenshots/videos and subsequent owner conversations added behavioral and visual cases that cannot be considered passed by checking only an API or a document. **Keep all 113 IDs and wordings unchanged**, test all again with fresh evidence, and record the overlays below as distinct scenario IDs linked to existing criteria. Do not count an overlay as another canonical 113 row. If a truly missing business rule requires a new requirement, seek a scoped decision and amend the canonical owner deliberately; do not silently invent a product policy.

| Scenario | What the authenticated operator/customer actually does | Existing criteria / journey |
| --- | --- | --- |
| UX-01 Mobile wallet & shell | Tap the five mobile dock destinations, wallet scopes, asset rows, filters/search, chart controls and action sheets; see complete exact money, responsive lists, no clipped value or trapped form behind keyboard, adequate touch/focus, useful loading/empty/error/disabled state; use narrow/short real wallet-browser viewports. | 02, 11, 14; J02/J04/J17 |
| UX-02 Exchange-standard controls | In actual Public UI inspect Spot MARKET/LIMIT orders and lifecycle, Margin collateral/risk/PENDING/OPEN/close/repay, Convert quotes and expiry, Transfers and Withdrawal network/fee/net/limits; preserve approved economics and record unsupported operations truthfully. | 03/04/06/07/11/14/15; J06–J11 |
| UX-03 NEXI Options research | Authenticated and appropriately authorized Admin research Force WIN/LOSS, pair/side/60s duration, **visible simulated chart movement during the position**, outcome and expiry, scenario identification, cross-surface readback, honest sandbox vs live market labeling and isolation, reload/reconnect. Also test ordinary provider positions independently. **Never redesign or remove existing force controls or chart behavior.** | 05/11/13/14/15; J09/J17 |
| UX-04 Manual deposit proof | Select configured asset/network, verify QR/address/copy/limits, enter amount, upload screenshot and submit one claim; verify pending/ambiguous result, Admin private evidence review and only authorized verified Ledger posting. No screenshot-only funding. | 03/13/14/15; J05/J16 |
| UX-05 Finance and product terms | Wallet balance scopes, seven Admin-configurable Mining plans **including disabled**, daily fractional yield display, subscriptions/reward/entitlement; Loans configured rate/term/collateral, Admin decision, VIP/referrals and Public readback. | 02/08/12/13/14/15; J04/J12/J13/J15/J16 |
| UX-06 Notifications and recovery | Tap bell/categories, unread state and customer Messages vs Help; reconnect, SIWE account/chain changes, background/foreground, reload and preservation of original financial intent without duplicate posting. | 01/09/10/12/14/15; J01/J14/J17 |
| UX-07 Desktop Admin usability | Click eight-workspace nav and allowed deep links; filter/search/sort tables, inspect records/drawers, approve/reject via permitted UI, audit/reason and Public effects; no unnecessary old development-stage UI. | 13/14/15; J03/J16 |

**Reference behavior:** For ordinary exchange wallet/trading UX, use established industry interaction patterns, NEXI `frontend/DESIGN.md`, the Admin operator guide, and accessibility/Next.js/Web3 standards as professional engineering references. The owner need not separately specify each routine control, readable balance, form-validation message or mobile layout. References do **not** override owner-approved Options/research economics, introduce new custody/withdrawal rails, or authorize fee/eligibility changes. Mark a genuinely unresolved financial/product decision UNKNOWN and test other independent behaviors.

**Execution distinction:** Primary evidence is a real signed-in Public/Admin page with clicks/taps/typing/review/authorized submission and observed outcome. Login/SIWE is verified separately, after which sessions may be reused only when role, chain and user identity are checked. Chrome/Playwright/CDP automation and static/contract checks are supporting lanes; a wallet-browser emulation is not real Android wallet DApp-browser proof. An overlay is PASS only when its own expected, user-visible behavior and required persistence are observed on the same release; don't inherit historical verdicts.

## 10. Evidence record and acceptance gate

Per attempt, capture:
run_id, scenario_id, original criterion ID, P0/P1, UTC time, all three deployed release SHAs, UI route, actual DApp browser/desktop/emulator type, wallet application/version/provider, device/OS, viewport CSS/visual dimensions, DPR/touch, masked wallet + profile/role, expected UI, exact click/tap/type/select/submit/wait sequence, screenshot/video, observed UI and feedback, business request/idempotency ref, sanitized network/Sentry when diagnostic, Public/Admin readback, exact SQLite Ledger/Outbox correlation when financial, PASS/FAIL/BLOCKED/NOT_TESTED and reason, likely causal owner, duplicate defect cluster, next dependency. Do not save seed phrases, full tokens or personal wallet data.

**PASS rule:** real same-release customer/operator UI interaction **plus** required outcome/persistence. A financial PASS must reconcile actual account/scope/asset/amount/direction and exactly one authoritative durable write. A UI toast without valid durable effect is FAIL/INSUFFICIENT_EVIDENCE, not PASS. A posted Ledger row plus misleading UI is also FAIL for customer-facing criterion. For critical negative states, demonstrate that UI blocks unsafe request and displays actionable error; corroborate server denial when relevant.

**Closure:** 113 unique criteria freshly accounted for with statuses and exact evidence, **plus UX-01..UX-07 scenario dispositions**; 21+13 Admin route dispositions; real mobile wallet DApp-browser device evidence (or explicit REAL_DAPP_BROWSER_NOT_TESTED); screenshots for action/outcome, not only static home pages; all permitted economic journeys attempted, rest BLOCKED with specific prerequisites. No unaccepted P0 customer/financial errors. Reporting 113 rows is not equivalent to passing 113 tests.

**Test-first repair campaign:** Phase A runs on a fixed deployed release: exercise ALL feasible authenticated UI journeys **and linked UX overlays**, collect evidence and deduplicate root causes; do not edit source or restart services mid-run. Phase B separately authorizes one consolidated source repair at actual causal owners, bounded verification, new coordinated release, regression of affected UI journeys. Fallow, CodeScene, Doctors, Graphify, API/network tests remain supporting investigation tools, not customer acceptance.

## 11. Canonical requirement and history ownership

Use [the original 113 criteria](NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md) and [original dated tracker](NEXI_113_ACCEPTANCE_TRACKER_20261101.csv); do **not** duplicate 113 rows here. The 113 original criteria/IDs/wordings remain unchanged. Historical 16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED browser evidence is retained under tasks/evidence/nexi-browser-acceptance-113-continuation-20261105.csv. Original detailed browser chronology is in tasks/evidence/NEXI_INTERACTIVE_ACCEPTANCE_HANDOVER_20261108.md and tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md. Source fixes and current release statuses must be classified separately.

Standards for later authorized work: https://eips.ethereum.org/EIPS/eip-1193 ; https://eips.ethereum.org/EIPS/eip-4361 ; https://eips.ethereum.org/EIPS/eip-6963 ; https://playwright.dev/docs/emulation ; https://nextjs.org/docs/app .

**This is an acceptance procedure, not proof that any test, transaction, release or mobile wallet action was executed.**
