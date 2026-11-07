# NEXI End-to-End Browser Acceptance — 2026-11-04

**Nov 7 source/release supersession:** This register's Admin route-load evidence is dated to release `111a5010f04a6592c290b0b0bc93240ab0cec69b`. Current deployed Admin marker is `45a857de6a4d4101fc3f42738eb7d83f52bd62eb`; current Admin source on `main` is `27b78bb6f74a0ddb44e9121b15fdbb7c9f1c3c32`. Current inventory is 21 direct navigation destinations and 34 named page route files. Preserve the 32-route observations as historical evidence for their recorded SHA; they do not establish current-release coverage.
Task: NEXI_BROWSER_ACCEPTANCE_V2_20261104
Phase: A — observe and record before repairs. This register was prepared before page selection/snapshots/navigation after preflight-only page inventory. It is append-only; results are recorded independently from expectations.
Authorization: Current deployed Public/Admin read-only browser acceptance is authorized. No funding, trading, transfer, Binary config, settlement, approval, or other financial/Admin mutation is authorized without a specific test identity and boundary. No deployment or restart.

## Release and environment preflight (live)
- Repository HEAD / origin/main: 2a74ce1b60940221ddb53f95baf4ec04a1f6eac4 / same. Task plan and todo are the only tracked edits; historical untracked backups/artifacts remain untouched.
- Backend /srv/nexi/backend/RELEASE_SHA: 188fdba1b9e703f04f1c3fbe32186f7daa6dce22.
- Public /srv/nexi/public/current/RELEASE_SHA: 188fdba1b9e703f04f1c3fbe32186f7daa6dce22.
- Admin /srv/nexi/admin/current/RELEASE_SHA: 111a5010f04a6592c290b0b0bc93240ab0cec69b.
- https://api.nexitrading.app/readyz: READY; database=true; redis=true; financial authority=SQLite.
- Existing @nexi-chrome-readonly MCP 1.11.0 attaches to owner profile; configured CDP endpoint 127.0.0.1:9222; viewport emulation is disabled. Preflight-only list_pages found Public Spot pageId 2 and Admin Messages pageId 3, plus extension pages. No browser test action was taken yet.
- Existing public browser profile and signed-in states are retained; identity claims require direct browser evidence. Sentry live query not yet performed.

## Expected outcomes and evidence plan
No row below is PASS until direct UI action and its matching evidence are recorded. For each row, preserve surface release SHA, viewport, redacted identity class, expected/actual, relevant API status, screenshot/console/network evidence, and dependency. Read-only cases can proceed independently. Economic or privileged mutations remain BLOCKED unless an approved fixture/boundary is evidenced.

| ID | Journey / surface | Expected outcome (source-backed) | Required evidence | Initial status |
|---|---|---|---|---|
| A | Admin identity / /admin/me | Existing role and permission scope gate visible destinations; backend remains authorization authority. | Current page snapshot, /admin/me status/role redacted, visible route list, release SHA. | NOT_TESTED |
| B | Public identity / /auth/me | Existing session is scoped to the signed-in customer; five wallet scopes remain distinct. | Current UI identity masked; /auth/me status/account scope; no token/cookie reads. | NOT_TESTED |
| C | Admin funding | /wallets is read-only; eligible test-deposit credit requires authorized fixture, confirmation and backend audit/Ledger/Outbox readback. | Eligibility state and read-only routes; no mutation without approved identity/amount. | BLOCKED_PENDING_AUTHORIZED_FIXTURE |
| D | Wallet transfer | MAIN, SPOT, MARGIN, BINARY, FINANCE are distinct. Only an explicitly approved real UI transfer can prove paired durable postings. | Read-only wallet state and transfer eligibility; any operation needs separate approved amount/account boundary. | BLOCKED_PENDING_AUTHORIZATION |
| E | Spot trading | Reference Binance liquidity is distinct from NEXI executable orders; placement/fill/cancel requires an approved TEST account and stake. | Read-only orderbook/trades/status; no submit/cancel. | BLOCKED_PENDING_AUTHORIZATION |
| F | Binary configuration | Existing values are read-only; changed settings require approved isolated scope, before/after/audit/Public propagation and restore. | Current rendered settings and API readback only. | BLOCKED_PENDING_AUTHORIZATION |
| G | Binary position | Normal TEST lifecycle and settlement requires funded approved TEST identity and minimum stake. | Read-only eligibility/config; no position open or forced settlement. | BLOCKED_PENDING_AUTHORIZATION |
| H | Margin / Convert | Live eligibility, disabled reasons and quote terms can be observed; accepted quote/trade requires authorization and durable postings. | UI state and read-only requests; no accept/execute. | PARTIAL_READ_ONLY_ONLY |
| I | Realtime / mobile | Spot depth/trades, candles and truthful freshness must correspond to provider; dimensions are only claimed when observed. | Screenshot, actual viewport dimensions, request/WS evidence, console; physical notch not inferred. | NOT_TESTED |
| J | Other Public/Admin | Read-only route rendering, empty/error/denied states and operator-to-Public contract can be recorded. | Route snapshots and GET request statuses; no write controls activated. | NOT_TESTED |

## Admin destination contract baseline (31 role-filtered navigation destinations + contextual /sandbox)
The route labels, eight workspaces and permission values below come from Admin/src/admin/config/navigation.ts, the current route map and docs/admin/README.md. Mutating capabilities remain governed by NestJS; exact DTO/action is not claimed unless observed in page/provider and backend source. Retired /support is compatibility-only; hidden /reconciliation is not an active destination.

| Workspace / route | Source-backed purpose and expected safe browser evidence | RBAC permission | Mutation boundary |
|---|---|---|---|
| Overview /overview | Operational overview; verify landing/read/error states and cross-links. | overview.view | Read-only in this pass |
| Clients /users | Client directory/detail; confirm access-gated list and non-sensitive state. | users.view | No client changes |
| Clients /kyc | KYC review workflow; inspect status/denial and evidence controls without opening private evidence. | kyc.view | No review decision/upload |
| Clients /sessions | Session/security inspection for accounts. | sessions.view | No revoke |
| Trading /binary | Binary ongoing/settings context; inspect pair/position states. | binary.view | No config/settlement changes |
| Trading /settlements | History/settlement operations. | settlements.view | No settlement/override |
| Trading /spot | Spot/Margin operator view. | spot.view | No order or risk changes |
| Trading /exposure | Trading risk/exposure. | exposure.view | No risk changes |
| Trading /sandbox (contextual) | Isolated scenario controls; distinguish sandbox from customer trading. | sandbox-only/source policy; exact permission requires source/UI check | No scenario mutation |
| Wallet & Finance /wallets | Read-only wallet account view; not deposit credit authority. | wallets.view | Read-only by design |
| Wallet & Finance /networks | Deposit network/address settings. | networks.view | No configuration |
| Wallet & Finance /deposits | Deposit lifecycle/review; eligible credit is confirmation-governed. | deposits.view | No credit/review |
| Wallet & Finance /withdrawals | Withdrawal review/status. | withdrawals.view | No approval/rejection |
| Wallet & Finance /ledger | Durable accounting record view. | ledger.view | Read-only |
| Markets /assets | Configured asset catalog distinct from Public price instruments. | assets.view | No asset edits |
| Markets /market-feeds | Provider mappings/freshness/source policy. | feeds.view | No feed edits |
| Products /mining | Mining plan and lifecycle view. | mining.view | No plan/account mutation |
| Products /loans | Loan product and lifecycle view. | loans.view | No loan/repayment mutation |
| Communications /messages | Admin/customer conversation workflow; preserve private content. | messages.view | No send/attachment |
| Communications /notifications | Notification delivery/status. | notifications.view | No publish/read mutation |
| Communications /announcements | Public announcement content. | announcements.view | No publish/edit |
| Communications /learn | Learning content management. | learn.view | No content edit |
| Administration /frontend-control | Public app configuration surface. | frontend.view | No save |
| Administration /navigation | Public navigation config. | navigation.view | No save |
| Administration /localization | Localization controls. | localization.view | No save |
| Administration /feature-flags | Feature control state. | flags.view | No toggle |
| Administration /admins | Admin account management. | admins.view | No create/role change |
| Administration /roles | Role/permission governance. | roles.view | No permission change |
| Administration /approvals | Approval queue/details. | approvals.view | No approve/reject |
| Administration /audit | Audit evidence/log search. | audit.view | Read-only |
| Administration /health | Runtime health/system checks. | health.view | No operational action |
| Administration /maintenance | Maintenance controls/status. | maintenance.view | No mode change |

Expected on every active route: direct current release identity; normal data, legitimate empty, loading, error and denied states must not be conflated. Underlying business/API authority is NestJS; SQLite/Prisma is durable state; Ledger/Outbox are financial evidence; BullMQ/Valkey are transport and not financial truth. Public counterparts and exact route DTOs are recorded only where source/API evidence is directly inspected.

## Run log
- 2026-11-04 preflight: service/release/readiness and existing Chrome MCP session discovery only. No page was selected, no screenshot/snapshot/route action performed, no mutation. This is not acceptance evidence.


## Browser run update — 2026-11-04 (read-only continuation)

Evidence applies to the release markers above. The Public release remained `188fdba1b9e703f04f1c3fbe32186f7daa6dce22`; Admin remained `111a5010f04a6592c290b0b0bc93240ab0cec69b`. Public browser viewport observed as 440×956 at DPR 3; Admin was 1365×723 at DPR 1. No browser emulation is exposed by this Chrome MCP session. No economic or privileged mutation was submitted.

| ID / area | Actual observation | Evidence / classification |
|---|---|---|
| A Admin identity | Admin Overview resolved from session-checking to authenticated Super Admin. Current page showed API/SQLite/Valkey health as OK and an empty operational queue. | `/admin/me` 200, `/admin/users` 200, `/admin/sessions` 200, `/admin/withdrawals` 200. Current desktop viewport 1365×723, no document-width overflow. PASS for identity/read-only landing only. No mutation authority inferred. |
| B Public identity | Existing browser profile showed an already connected wallet in some routes. Earlier route load observed `/auth/me` 401, refresh 201, then `/auth/me` 200; on Wallet, auth/wallet requests remained pending. The browser account is not established as an approved TEST identity, and five-account scopes were not proven. | PARTIAL; authentication readback is intermittent. No signature requested or wallet secrets read. |
| C funding | No eligible authorized TEST deposit/funding procedure was identified. | BLOCKED pending a named approved test identity, eligible fixture and amount. Admin /wallets is read-only by contract. No credit action. |
| D wallet transfer / Convert | Wallet route rendered six scope tabs but showed balances unavailable; Deposit/Withdraw/Transfer/Convert actions disabled and activity authority unavailable/loading. | BLOCKED for economic action; read-only UI proves unavailable state only. No transfer/quote acceptance/conversion. |
| E Spot | Spot rendered BTC/USDT with base/quote units, chart and order controls. Available balance was zero and order action disabled. Market depth and trades APIs returned 200; spot open orders, margin quote/positions and 1m Klines returned 200. | PARTIAL read-only. UI book/trades tab switching was not established because MCP click timed out; endpoint success does not prove rendered book/trade rows. No order placement/cancel. |
| F/G Options config and position | Public Options rendered five configured durations, payout and stake bounds; current positions/history APIs returned 200 and no test position was opened. | PARTIAL read-only; shared production config mutation/restoration and real position settlement are BLOCKED without an isolated approved scope and funded TEST identity. |
| H Margin / Convert | Spot Margin quote/positions read routes returned 200; Convert remained disabled on Wallet due unavailable wallet state. | PARTIAL read-only only. No accepted quote, margin position or postings. |
| I Realtime/mobile | Public viewport measured 440×956 at DPR 3; Dashboard, Asset Detail and Spot had no document-width overflow at that size. Kline/depth/trades/Socket.IO polling requests returned 200 on observed pages. Asset detail showed CoinGecko market information and a Binance source label. A 5m interval control became selected after keyboard navigation, but its response was not confirmed in the captured request list. | PARTIAL. No physical-device notch proof, no width matrix, chart gesture/reconnect acceptance, or persisted screenshot. MCP screenshot request returned inline only; saving to the repository path was rejected by configured workspace-root policy. No bypass attempted. |
| J other Public journeys | Mining rendered three products and explicit no-reward/no-position states; Loans rendered one product, eligibility unavailable, no loan records and no active repayment; Announcements and Learn rendered documented empty-content states; Support rendered help topics and account-scoped chat link. Messages was inspected only for page title/control labels to avoid reading private conversation content. | PARTIAL read-only. No product purchase, loan application, content write or message send. The guessed plural `/dashboard/announcements` route returned the application’s not-available page; source confirms canonical singular route `/dashboard/announcement`, which rendered normally. |
| Historical 32 Admin destinations | The 2026-11-01 browser receipt covers route-load checks for Admin release `111a5010f04a6592c290b0b0bc93240ab0cec69b`, at 1365×723 and 979×715. The Nov 4 run directly revalidated Admin identity/Overview only. | Route-load evidence only; not 32 complete functional journeys. The Nov 7 current release/source has 21 direct navigation destinations and 34 named page route files; prior route evidence is not current-release proof. |

### Additional live state and proof limits
- Current unit is `nexi-api.service` (active), not `nexi-backend.service` (not a configured active unit). Public, Admin and local Valkey services are active. The public API `/readyz` returned HTTP 200 / READY when rechecked. No restart was performed.
- Sentry read-only query for production errors on release `188fdba1b9e703f04f1c3fbe32186f7daa6dce22` over 24h returned no results. This is bounded event evidence, not proof of no defect or symbolication.
- Page-element click operations on product/book controls timed out as MCP interaction errors; these are tool limitations, not confirmed application defects. Screenshot persistence to a path outside the Chrome MCP configured workspace roots was denied; inline screenshot delivery is not a durable evidence artifact.
- A possible chart technical-indicator rail/design mismatch remains a visual-review candidate only. No new screenshot artifact supports a definitive visual defect classification; retain as NEEDS_VISUAL_REVIEW, not a confirmed application defect.
- No test wallet identity, eligible deposit fixture, approved funding amount/stake, isolated Binary config scope, or owner-approved message test conversation was established. Economic/Admin write portions remain BLOCKED, while independent read-only journeys above were continued.

## Acceptance status at this checkpoint
Phase A is **not complete**: available authenticated test identity and governed financial fixtures are missing; Public book/trades visual rows, remaining responsive widths and chart gesture/reconnect states lack durable screenshot/runtime proof; numerous Admin routes have only reused route-load evidence. No source repairs were started because the required observe-first sweep is still open and no confirmed P0/P1 defect has been established from this run. Next permitted browser work is continued read-only route/state and request inspection where non-sensitive; do not perform writes without their specific safety gate.


## Browser run update — 2026-11-04 (market and Admin read-only continuation)

- Public Spot tabs were changed with keyboard navigation because the MCP click action consistently timed out. The Order book displayed Binance Spot reference liquidity (explicitly “not executable NEXI liquidity”) with bid/ask units USDT and quantity in BTC. Recent Trades displayed the same pair’s price (USDT), amount (BTC), time, and populated rows under a “Live reference trades” status. Public market depth/trades REST reads returned 200.
- Order book status displayed “Updates paused · last received depth.” A separate unauthenticated read-only request to `/market/depth?symbol=BTCUSDT&limit=20` returned HTTP 200, state LIVE, provider binance-spot, source rest, 20 bid and 20 ask levels, and a current observedAt timestamp. Visible book rows differed between snapshots while the status remained paused. These observations do **not** establish Socket.IO depth freshness or prove a product defect: this Chrome MCP exposes no WebSocket-frame inspection tool, and REST snapshot freshness is a different signal. Retain as NEEDS_REALTIME_SOURCE_CORRELATION.
- Public Margin tab opened read-only via keyboard. It showed isolated margin, zero available/locked collateral, no positions, and the open-position control disabled. No position opened.
- Admin Price Data Sources was inspected under the authenticated server-confirmed session. The page displayed 270 configured feeds, 45 LIVE and 204 DOWN. BTCUSDT’s Binance Spot feed was labelled LIVE with sub-second quote age at capture. This provider quote status is not evidence of depth socket freshness and should not override the Public book’s separate paused status.
- Additional Admin read-only pages on the exact Admin release SHA rendered with the API-connected server-confirmed Super Admin status: Deposits (0 rows; no eligible funding fixture), Wallets, Ledger, Approvals, Audit Logs, Assets, Spot Administration, Trade Settlements and Binary Trading. Only headings, role/API status and coarse row counts were retained; no customer record fields or ledger values were copied. No action controls were activated. Binary navigation hit the MCP’s 10-second navigation timeout, then the same page rendered and exposed its title through the read-only DOM check; classify as a tool navigation delay, not an app failure.
- The 2026-11-01 receipt confirms its then-counted 32 Admin destinations were visited at 1365×723 and 979×715 for the *same exact Admin release SHA* `111a5010f04a6592c290b0b0bc93240ab0cec69b`. That is route/UI-only evidence; it does not prove full route workflows and is not current-release evidence after the Nov 7 Admin marker change. Historical Public viewport captures at older Public release SHA are not reused for current Public acceptance.
- Current Sentry search used the connected Sentry integration, filtering production error events to current Backend/Public release `188fdba1b9e703f04f1c3fbe32186f7daa6dce22` over the last 24h; no matching events were returned. This is bounded event search only.

### Updated row dispositions
| ID | Current disposition |
|---|---|
| A | PASS for Admin identity and Overview/read-only access; route functionality is separate. |
| B | PARTIAL; customer auth occasionally returns after refresh, but no designated TEST identity or five-scope customer readback was established. |
| C | BLOCKED: Admin Deposits shows no rows; no eligible authorized TEST deposit/credit amount. |
| D | BLOCKED: Public Wallet balances/activity unavailable; no approved transfer amount/account boundary. |
| E | PARTIAL read-only: book and trades UI rows/units/source labels observed; book currently states updates paused; actual order placement/cancel blocked by zero available USDT and missing TEST authorization. |
| F | BLOCKED for shared config mutation; current Public Options config rendered read-only. No isolated approved pair/config boundary. |
| G | BLOCKED: no authorized funded TEST account/stake; no position or settlement attempted. |
| H | PARTIAL read-only: Margin empty/disabled state observed; Convert remains unavailable. No economic action. |
| I | PARTIAL: one current Public viewport 440×956 measured, Admin sizes reused for same release. No current-release mobile width matrix or physical-device safe-area proof; no durable screenshot artifact or WS-frame proof. |
| J | PARTIAL: current Public product/support/content/settings/message metadata and Admin read-only routes observed; complete route-level acceptance is not implied. |


## Visual and keyboard follow-up — 2026-11-04

- Chrome screenshot capture succeeded inline (current Public Spot and isolated Margin views). The DevTools MCP path write to the repository had already been denied by its configured-root guard; these inline images were not persisted as repo artifacts. Spot CSS viewport remained 440×956 at DPR 3, document width 440; the five-link dock DOM element occupied the viewport bottom at 68 CSS px. This is browser-emulated/current-session evidence only, not a physical safe-area or notch test.
- Public Spot chart a11y snapshot shows timeframe and Chart/Order book/Trades tabs plus chart metrics, but no indicator toggle controls. Current source sets `showIndicatorControls={false}` in the Spot chart wrapper. `frontend/DESIGN.md` section “Indicators” requires controls on Spot and Asset Detail in the compact rail below the plot. The live UI/source mismatch is therefore **confirmed defect NEXI-PUB-CHART-INDICATOR-CONTROLS (P2)**. No repair was made during Phase A. The visible metric legend (RSI/MA/EMA/MACD values) is not itself the missing control rail.
- The exposed browser MCP has no viewport resize/emulation, touch gesture, WebSocket frame, or console/network replay tool; its actionable input includes element click/drag and keyboard. Keyboard successfully selected Spot Order book and Recent trades, Margin, and Settings tabs. The click timeout did not prevent keyboard acceptance.
- Settings Profile, Security, Notifications and About panels were navigated by keyboard. Security showed session controls; the enabled Revoke control was left untouched. No profile save, KYC submission, MFA change, notification preference change, session revocation or identity value was recorded. About route rendered its published information sections.
- Current Public console contained 7 Chrome DevTools entries: CSP eval issue, MetaMask/ObjectMultiplex listener warnings, a form-field id/name issue affecting three inputs, and CORB for `cca-lite.coinbase.com/amp`. The latter is a third-party Coinbase metrics resource. Current Admin console contained 6 entries: same extension/CSP class and one form-field id/name issue. No uncaught first-party application exception was listed. The form-field issue is recorded as a low-severity browser accessibility/autofill candidate, not a functional failure; input labels were present. No synthetic error was triggered.

### Admin 32-destination completeness reconciliation
The 2026-11-01 route receipt states that all 32 destinations below rendered on Admin release `111a5010f04a6592c290b0b0bc93240ab0cec69b` at 1365×723 and 979×715, without document overflow or observed API 4xx/5xx. That marker matched the release being tested at the time; it was superseded by the Nov 7 Admin marker `45a857de6a4d4101fc3f42738eb7d83f52bd62eb`. Status here is route-load evidence only unless explicitly marked CURRENT_READ below; all functional workflows remain NOT_TESTED, and mutating commands remain blocked. The current source has 21 direct navigation destinations and 34 named page route files; see the route map for current dispositions.

| Destination | Route status at current Admin SHA | Workflow status |
|---|---|---|
| Overview | CURRENT_READ, identity/API confirmed | Full operational workflow NOT_TESTED |
| Health | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Dependency diagnosis NOT_TESTED |
| Users | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Client search/change NOT_TESTED |
| KYC | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Evidence/decision BLOCKED; no review action |
| Sessions | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Revoke BLOCKED/not attempted |
| Binary | CURRENT_READ; page rendered after MCP navigation timeout | Config/position mutations BLOCKED |
| Spot | CURRENT_READ | Orders/risk changes NOT_TESTED/BLOCKED |
| Settlements | CURRENT_READ | Settlement action BLOCKED |
| Exposure | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Risk workflow NOT_TESTED |
| Sandbox | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Scenario execution BLOCKED/not attempted |
| Wallets | CURRENT_READ; read-only rows rendered | Full wallet research workflow NOT_TESTED |
| Networks | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Config changes BLOCKED |
| Deposits | CURRENT_READ; 0 rows, no eligible fixture | Credit/review BLOCKED |
| Withdrawals | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Approval/rejection BLOCKED |
| Ledger | CURRENT_READ; read-only rows rendered | Economic correlation NOT_TESTED; no records copied |
| Assets | CURRENT_READ; list rendered | Asset changes BLOCKED |
| Market Feeds | CURRENT_READ; provider status rendered | Failover/config change BLOCKED |
| Mining | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Plan/account mutation NOT_TESTED |
| Loans | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Application decision BLOCKED |
| Messages | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Send/reply BLOCKED; no private body read |
| Notifications | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Publish/read mutation NOT_TESTED |
| Announcements | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Publish/edit BLOCKED |
| Learn | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Content mutation BLOCKED |
| Frontend Control | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Config change BLOCKED |
| Navigation | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Config change BLOCKED |
| Localization | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Config change BLOCKED |
| Feature Flags | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Toggle BLOCKED |
| Admins | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Role/status change BLOCKED |
| Roles | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Permission change BLOCKED |
| Approvals | CURRENT_READ; queue view rendered | Approve/reject BLOCKED |
| Audit | CURRENT_READ; log view rendered | Record-level evidence review NOT_TESTED; values redacted |
| Maintenance | REUSED_ROUTE_LOAD_PASS (2026-11-01 exact SHA) | Window change BLOCKED |

The historical route receipt also records no API 4xx/5xx on those route loads; current direct reads confirmed server-authenticated Admin UI/API status on the listed CURRENT_READ routes. This does not prove current underlying data values for routes not re-read today.


## Wallet, chart interval and defect ledger update — 2026-11-04

- After auth refresh completed, Public Wallet resolved to a coherent zero-balance state. `/auth/me`, `/wallet/overview`, and `/wallet/activity` returned 200. The UI showed the six separate Overview/Funding/Spot/Margin/Options/Finance account scopes, an explicit empty Activity History, a Tether/USDT icon, zero USDT, and BTC/ETH/SOL/TRX labelled “Account not opened.” The wallet action buttons were available, but no action was activated. The earlier “balances unavailable/pending” observation was transient and is superseded by this later loaded state.
- Opening Convert displayed its form without submitting a quote. `GET /financial/conversion/pairs` returned 200. The source and destination asset options were disabled in the rendered form; no amount, quote, accept or conversion was sent. With zero balance/no designated TEST identity, economic eligibility and execution remain unproven.
- Public BTC/USDT Spot Kline UI was keyboard-driven through 1m, 5m, 15m, 30m, 1h, 4h and 1d. Network list showed each corresponding `/api/market/klines` request returned HTTP 200. At 1d, the page remained in “Market error / The chart could not be loaded” after a 12-second recovery wait. A read-only response check returned `dataState=STALE`, 91 candles, finite numeric times, strictly increasing timestamps and valid OHLC for all 91; thus the stale response had usable historical rows, but the chart surface represented the condition as a generic error. Current source `marketChartDisplayStatus` maps STALE to ERROR. Record confirmed current-release defect **NEXI-PUB-CHART-STALE-STATUS (P2)**: preserve/show stale chart data with an explicit stale status instead of conflating it with an error. No source repair was made during Phase A.
- Interval request status proof does not prove candle finality or provider lineage; no WebSocket frames are exposed by the MCP. Browser Kline provenance/finality remains open proof.

### Confirmed defect register (Phase A; no fixes yet)
| ID | Severity | Reproduction / evidence | Causal owner | Impact / status |
|---|---|---|---|---|
| NEXI-PUB-CHART-INDICATOR-CONTROLS | P2 | Public Spot chart has no indicator toggle controls in current accessibility/UI snapshot. Current source sets `showIndicatorControls={false}` in Spot wrapper; frontend design requires the indicator rail on Spot and Asset Detail. | Public chart integration | Confirmed source/UI design-contract gap; queued for one repair batch after Phase A. |
| NEXI-PUB-CHART-STALE-STATUS | P2 | BTC/USDT 1d Kline request 200, `dataState=STALE`, 91 ordered valid OHLC rows; UI persists with generic Market error and source maps STALE to ERROR. | Public market status mapping / chart | Confirmed stale/error conflation; queued for the same repair batch after Phase A. |
| NEXI-PUB-FORM-AUTOFILL-ATTRIBUTES | P3 candidate | DevTools issue flags three Public inputs without id/name; fields retain accessible labels. No functional failure shown. | Public form inputs | Candidate for scope review; not yet a confirmed acceptance failure. |

No source files were changed for these findings. Phase A stays open until remaining feasible non-mutating evidence is reconciled; the blocked economic/security actions, unsupported viewport sizes, physical-device checks, screenshot artifact persistence and WebSocket-frame proof remain explicitly separate.


## Phase A gate closure — 2026-11-04 (feasible read-only sweep)

All accessible non-mutating journeys in the Nov 4 browser/identity were exercised and recorded: Public dashboard, Asset Detail, Spot chart/depth/trades, Margin, Options, Wallet accounts and Convert eligibility, Mining, Loans, Support, Announcements, Learn, Settings/Profile/Security/Notifications/About, notification panel empty state and Messages metadata; Admin identity, Overview, Market Feeds, Deposits, Wallets, Ledger, Approvals, Audit, Assets, Spot, Settlements and Binary. The exact-SHA 2026-11-01 Admin receipt supplies historical route-load states for the 32 destinations in that release only. It does not supply current-release route coverage. No notification was opened/read; the panel displayed the explicit empty state. No message body was opened.

The seven Spot timeframes each generated HTTP 200 Kline requests. After a browser reload, authenticated customer state recovered without signature and Socket.IO polling handshakes remained HTTP 200; the 1d chart continued to present Market error while its same-origin Kline response remained STALE with valid historical OHLC. This proves normal reload/session/socket transport recovery only; no forced network disconnect or WebSocket frame inspection was possible.

Phase A is complete **for feasible read-only browser acceptance under this MCP/profile**. This is not complete functional acceptance: financial/Admin writes remain BLOCKED by missing designated TEST identity, deposit fixture, amount/stake and isolated configuration bounds; lower-role denial has no restricted identity; viewport matrix and gesture/device-safe-area proof are BLOCKED by lack of viewport/touch controls; durable screenshot persistence outside the configured MCP roots was denied; WebSocket message/freshness frames are not exposed. No app source changes occurred in Phase A. Proceed to one grouped source repair batch for the two confirmed P2 defects above; the P3 autofill finding remains a candidate, not included absent stronger impact evidence.
