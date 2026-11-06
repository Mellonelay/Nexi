# Browser acceptance continuation — 2026-11-05

Existing Chrome DevTools MCP session: Public page 2, Admin page 3. Continue the historical Phase A register and source repair supplement; do not infer complete acceptance from route rendering.

## New observations

- Settings Security tab showed current and revoked sessions. Settings Notifications tab showed trade, wallet, security and product preference checkboxes checked. No preference change or session revoke was executed. Both click calls returned timeout errors, while subsequent fresh snapshots confirmed the intended tabs were selected. Inspect state before retrying.
- Admin read-only route job job_350ec6890618 exited 0: market feeds, assets, spot and exposure produced their respective headings. Initial health snapshot was premature; later settled snapshot displayed System Health with Admin API, SQLite and Aiven Valkey as OK, three healthy, zero degraded and no active incidents. UI status is not independent proof of service operation.
- Screenshot supplied by owner shows an accessibility scan with 54 issues, including 53 potential findings. Scan categories need individual validation before classifying application defects.
- Spot viewport screenshots captured earlier under /tmp/nexi-acceptance-public-spot-*.png; 320x480 wallet screenshot request timed out. Earlier measurements showed no horizontal document overflow in tested Spot viewports, and a 66px bottom dock at 320x480.
- Git HEAD and origin/main both fb48ccd70ceb6322c67d775f08cbc8a40accd9d0 at this check. Last observed deployed Public/Backend 188fdba1b9e703f04f1c3fbe32186f7daa6dce22; Admin 111a5010f04a6592c290b0b0bc93240ab0cec69b. Runtime markers require fresh verification before new release claims.

## Existing defects and limits

The previous source-repair supplement records source changes for chart indicator controls and stale-chart status, with browser regression pending deployment. BTC depth pause versus live trade freshness remains an observation needing correlation; do not call it a confirmed new source defect. Mobile pair label wrapping is a candidate pending design review.

All 32 Admin destinations have route-render coverage only, not complete operator workflows. The 113-row tracker has not been fully reconciled against this continuation. Financial actions need a designated test identity, eligible funding fixture and explicit amount/stake; shared Binary configuration needs an isolated approved scope; restricted-role denial needs an authorized restricted identity. Sentry project/release correlation and forced reconnect proof are incomplete. No economic or Admin configuration mutation, application source change, deploy or restart was performed during this continuation.

- At 320x480 a later click targeting Convert returned a timeout; fresh snapshot showed no Convert dialog and focus on View activity. This is an MCP interaction observation requiring further diagnosis, not proof of a product defect. No financial operation was performed.

## Offline startup and recovery — browser job job_43888aa601a9

At 390x844, Spot was navigated and network emulation set Offline during page load. Initial auth refresh, market and socket requests failed with ERR_INTERNET_DISCONNECTED. After network was restored, Socket.IO polling, BTC depth/trades and prices returned 200, yet the header showed Verify wallet and the 1m chart continued to show Market error after a subsequent snapshot. A normal reload restored the masked wallet identity and numeric candle values without a signature. This demonstrates a deployed-release recovery failure for this sequence; root cause and whether current undeployed source already repairs it remain unverified. No economic action was made. Fail affected acceptance rows NEXI-01-06, NEXI-11-07 and NEXI-14-06 for this scenario.

Canonical release markers were reread: Public/Backend 188fdba1b9e703f04f1c3fbe32186f7daa6dce22; Admin 111a5010f04a6592c290b0b0bc93240ab0cec69b. 113-row continuation register was created; NOT_TESTED rows include scenarios with partial evidence and are not completion claims.

## Margin read-only observation — 2026-11-04 18:21 UTC

Existing Chrome page 2, 390×844 mobile emulation, deployed Public marker last verified 188fdba1b9e703f04f1c3fbe32186f7daa6dce22: selected Margin tab inside Spot. BTC/USDT isolated margin workspace showed LONG/SHORT, 2x/3x/5x choices, available 0 USDT, locked 0 USDT, collateral input, mark price, maintenance ratio 0.5, disabled Open LONG 2x, and no loaded positions. No order submitted. This is partial UI evidence for NEXI-07-01/02/03; it does not establish backend risk parameters or funded workflows. A direct /dashboard/margin navigation returned route unavailable; source and UI place Margin within /dashboard/spot, so this is not classified as a defect.

## Notifications panel visibility — 2026-11-04 18:22 UTC

Public Spot Margin, 390×844, existing authenticated session: clicked Notifications, button reported expanded; subsequent standard and verbose accessibility snapshots did not expose the modal or its controls. DOM inspection showed role=dialog, data-state=open, text for All/Trading/Wallet/Account/System and empty state, but computed display:none and bounding rectangle 0×0. This is a deployed UI failure to expose the notification panel; exact deployed CSS and impact on other modal types require correlation. Current HEAD globals.css:218 applies .nexi-drawer:not([open]) { display:none }, while NotificationsPanel.tsx uses a non-dialog aside with data-state=open and class nexi-drawer. This is a source-supported candidate cause, not proof of deployed bundle identity. No read-state or preference was changed. Affects NEXI-09-01/02 and accessibility; full criteria remain unverified.

## Admin Binary ongoing read view — 2026-11-04 18:26 UTC

Reused authenticated Admin page 3, freshly navigated to /binary. Snapshot confirms Super Admin, Admin API connected, 56 configured pairs, backend-configured duration/payout/stake limits, Ongoing status filter, pair/client filters, Refresh view, and zero current ongoing results (filtered from 2 total). No position was selected and no actions were taken. This is read-only route/control evidence; it does not establish history, settlement, pair persistence, or any customer trade lifecycle.

## Binary configuration readback and Public comparison — 2026-11-04 18:30 UTC

On Admin page 3 at `/binary?view=pairs`, authenticated Super Admin and Admin API connected were visible. The table listed 56 pairs, paged 10 per view; BTCUSDT was Enabled with five durations 30/60/180/280/420 seconds, each payout 85%, min/max stake 1–1000. Read-only Inspect opened a detail dialog with those same values, settlement delay 0 ms and price source rule “Median of primary + fallback feeds; last-quote fallback if stale > 3s.” Exposure used/cap both showed UNAVAILABLE. Audit Timeline said “No audit events yet.” No edit/pause control was activated. Earlier Public Options read-only test showed the same five durations, 85% payout, and 1–1000 limits. These checks establish configuration readback and visible Public agreement for BTCUSDT only; they do not prove propagation after a change, full pair coverage, or audit generation. Register rows NEXI-05-01 and NEXI-13-02 marked PASS for this bounded contract; broader feature workflows remain independently classified. NEXI-11-03 records the screenshot-era seven-timeframe/pair-switch result.

## Wallet auth refresh and account-scope control outcome — 2026-11-04 18:34 UTC

On existing Public page 2 at 390×844, `/dashboard/wallet` initially showed Verify wallet, balances UNAVAILABLE, actions disabled, and wallet/activity unavailable messages. Network capture showed `POST /auth/refresh` status 201. After waiting five seconds without a signature or reload, the header showed the masked connected wallet; available/locked/total each showed 0.00 USDT; Deposit/Withdraw/Transfer/Convert enabled; and Activity History showed the legitimate empty state “No wallet activity yet.” This is a transient session-recovery observation; it does not prove all auth/session criteria.

Wallet account tabs Overview/Funding/Spot/Margin/Options/Finance were visible. A fresh-UID MCP click on Funding timed out (`element did not become interactive`), and read-only DOM geometry showed the tab was visible with pointer-events auto. No tab changed. Treat account-scope data as not tested and the click failure as a DevTools interaction limitation pending alternate input route, not a confirmed application defect. No wallet operation was submitted.

## Wallet account-scope UI traversal — 2026-11-04 18:36 UTC

Used keyboard navigation after the DevTools element-click operation timed out. Starting from Overview, selected Funding, Spot, Margin, Options, and Finance tabs; each changed the selected tab and corresponding heading (Funding assets, Spot assets, Margin assets, Options assets, Finance assets). Each view retained the authenticated wallet, USDT at zero, and the legitimate no-wallet-activity empty state. Other zero-balance assets in Overview showed “Account not opened” with em dashes, while USDT showed 0/0/0. No mutation performed. Register NEXI-02-01 PASS for account-scope display coherence only; balance refresh after mutation and actual transfer workflows remain blocked/not tested.

## Consolidated screenshot test ledger — four owner screenshots reviewed 2026-11-05

The following are prior execution observations transcribed from the four screenshots and retained as such; they are not rerun in this continuation. Screenshot references are the four owner-provided images from 2026-11-04/05. The full expected/actual criterion mapping still needs reconciliation against the 113 canonical rows.

| # | Surface / test | Observed result | Evidence status / limitation |
|---:|---|---|---|
| 1 | Source and runtime identity | Checkout `2a74ce1` equaled `origin/main`; Backend/Public `188fdba`, Admin `111a501`; API READY, SQLite and Redis true. | PASS for that timestamp only; later source advanced to `fb48ccd`; deployed markers remained old at subsequent check.
| 2 | Public authenticated session | Initial `/auth/me` 401 followed by refresh 201 and `/auth/me` 200; masked connected wallet observed. | PASS for session recovery in observed run; not new SIWE acceptance.
| 3 | Admin authenticated session | Super Admin at 1365×723; `/admin/me` 200; eight workspace links visible. | PASS for identity/read-only shell only.
| 4 | Public Spot initial render | 440×956, DPR 3, no document overflow, BTC/USDT, 1m chart, zero-USDT disabled order form, wallet connected. | PASS for captured initial render; overlay discrepancy recorded as candidate at the time.
| 5 | Public Quotes Hub | Temporary Connect/loading state recovered without another signature; 17 crypto instruments displayed LIVE. | PASS for recovery and catalog rendering in that run.
| 6 | Public Wallet session | Quotes/Spot/Asset Detail/Options retained wallet indicator, while Wallet initially showed Connect and pending `/auth/me`, `/wallet/overview`, `/wallet/activity`; later Wallet settled to 0.00 USDT with legitimate empty activity. | Transient failure/recovery recorded; no signature or transaction.
| 7 | Public route sweep | Dashboard/Quotes, Options, Wallet, Earn, Loans, Support, Announcements, Learn, Messages, Settings rendered. | Route rendering only; loading catalogs required more time; Announcements/Learn empty states were legitimate.
| 8 | Spot timeframe controls | `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d` selected and matching chart label rendered. | PASS for UI selection/rendering; not backend finality.
| 9 | Spot pair switch | BTC/USDT→ETH/USDT updated chart, quote units, depth quantity and trade labels; ETH book/trades marked Live. | PASS for displayed pair coherence/reference feed only.
| 10 | Spot depth/trades freshness | BTC book said “Updates paused”; trades said “Stale”; Kline loaded. Admin quote feed reported live. | Observation requiring socket/request correlation; do not treat independent Admin quote as proof of depth-stream health.
| 11 | Options controls | Five expiries 30s/1m/3m/4m40s/7m, 85% displayed payout, 1–1000 USDT limits; Long/Short disabled at zero available USDT. | PASS for displayed controls; funded position blocked.
| 12 | Convert quote | `0.00001 BTC` quote returned `0.8066894 USDT` at `80668.94` with expiry. | Quote only; not accepted; no conversion or Ledger mutation.
| 13 | Asset Detail | 1h chart, CoinGecko-labeled profile metrics, live price source `binance-spot`. | PASS for route/data labels; not source-provider validation beyond displayed evidence.
| 14 | Public responsive Spot | Nine viewport sizes; no horizontal document overflow; BTC/USDT label wrapped at 320px. | PASS for measured overflow; wrapping visual candidate. Dock placement was separately observed once at 320×480 but unavailable in later emulation snapshots.
| 15 | Admin route sweep | All 32 destinations visited under Super Admin. Key finance/trading/approval/audit/asset/feed views rendered; communication pages were rechecked after async wait. | Route/read-view evidence only; no full write/RBAC workflows. Messages content appeared without heading in captured tree.
| 16 | Admin deposits/finance | Deposits showed 0 of 0; Ledger, Settlements, Approvals, Audit and Wallets rendered. | Funding mutation blocked by no eligible deposit; no finance changes made.
| 17 | Admin Binary pair configuration | Current continuation directly verified 56 pairs and BTCUSDT details: five durations/payout/limits; exposure values unavailable; audit timeline empty. | Read-only configuration view; no edit/pause; no change-propagation or audit event generated.
| 18 | Admin health | Settled UI displayed Admin API, SQLite and Aiven Valkey OK; 3 healthy, 0 degraded, no incidents. | UI health only; not independent service proof.
| 19 | Public Settings | Security tab showed current/revoked sessions; Notifications tab showed four preference groups checked. | Read only; no preference/session mutation. Earlier DevTools click timeout was followed by selected-state snapshots.
| 20 | Screenshot-provided accessibility scan | 54 issues, 53 potential findings. | Needs individual validation; not confirmed defects.
| 21 | Browser storage limitation | MCP screenshot could not save directly to repo because destination was outside configured workspace roots; screenshot result was returned. | Recorded limitation; no path guard bypass.

No economic action, funding, Binary config change, message send, session revoke, preference change, deployment, service restart, or source fix occurred during the screenshot-covered run. Later receipts record the offline-start chart/session recovery failure and the Notifications dialog `display:none` failure discovered in the resumed run.


## Checkpoint: 2026-11-05 browser acceptance continuation (run_9cd0a505d0d7499fa99d)

**Scope and identity.** Existing authenticated Chrome DevTools MCP 1.12.0 session @nexi-chrome-readonly; Public and Admin pages reused. Source HEAD/origin fb48ccd70ceb6322c67d775f08cbc8a40accd9d0. Deployed markers observed once this checkpoint: Backend/Public 188fdba1b9e703f04f1c3fbe32186f7daa6dce22, Admin 111a5010f04a6592c290b0b0bc93240ab0cec69b. These differ from source and are identity markers only; no deployment attempted. Public viewport 390×844 mobile emulation. Observations below are this run, not prior screenshot narration.

| Criterion | Action actually performed and observed | Status/result and limitation |
|---|---|---|
| NEXI-02-08 | Refreshed Public Wallet through keyboard after DevTools click timeout; observed temporary UNAVAILABLE/disabled state, then authenticated masked wallet and 0.00 USDT balances/actions restored after 5s without reload/signature. One console 401 resource error; endpoint not established. | NOT_TESTED; partial transient recovery only, no stale-value invariant proof. |
| NEXI-03-02 | Opened Public USDT Deposit dialog; network choices ERC20/SOLANA/TRC20, TEST_ONLY address, minimum 1 USDT, 2 confirmations, TEST_ONLY_PRELIVE_20261008 notice. Admin /networks displayed 0 networks/0 enabled; /deposits displayed 0 rows after the route settled. | BLOCKED: no real configured address/network or approved deposit fixture to validate; no address copied or claim submitted. See Evolver candidate nexi-browser-deposit-test-only-config-mismatch-20261105. |
| NEXI-03-05 | Opened Withdraw dialog; saw Network, Destination address, Amount, Security password fields and Confirm withdrawal button. No values entered. | NOT_TESTED; fees, limits and expected amount not visible before form entry. |
| NEXI-04-02, NEXI-04-07 | Opened Transfer dialog; inspected between-wallet destinations/assets and switched by keyboard to another-user form. Recipient ID/Amount required and transfer button disabled while blank. | NOT_TESTED; no transfer submitted, complete criteria unproven. |
| NEXI-03-06 | Read Admin Withdrawals table: two historical test-only USDT/TRC20 entries (1 amount, 0.1 fee; APPROVED and REJECTED); identifiers redacted from evidence. | BLOCKED; historic test rows do not establish approved test identity or authorize action. No row action used. |
| NEXI-05-03, NEXI-05-09, NEXI-14-02 | Public Options settled to connected masked wallet; 5 durations, 85%, 1–1000, 0 USDT, Long/Short disabled. Entered stake 0 then cleared; invalid state was visible, no trade. | NOT_TESTED for full criteria; partial UI validation only, zero funds prevented workflow. |
| NEXI-06-01, NEXI-06-02, NEXI-06-03, NEXI-06-06 | Public Spot: BTC/USDT, market/limit/stop-limit, 1m, empty open orders. Limit amount 0.0001 BTC preview showed total 8.05 USDT, fee —, available 0; Review buy order enabled. Cleared input; did not click review/submit. | NOT_TESTED; preview only, fee absent and balance unavailable; no order created. |
| NEXI-08-02 | Public Earn/Mining settled: Whale/Pro/Basic plans and limits; 0 locked principal/subscriptions/rewards; no accruals/positions returned. Admin /mining read-only showed plan definitions and historic subscription rows. | No status change; no evidence of subscription/reward workflow or full parity. No admin action. |
| NEXI-13-02 | Compared criterion scope against current Admin /networks 0/0 and Public deposit TEST_ONLY data; prior BTCUSDT pair match remains a subcase only. | Downgraded PASS→NOT_TESTED: criterion includes product, asset and network propagation; complete cross-domain evidence absent. No defect asserted. |
| NEXI-15-05 | Sentry exact-release error queries returned 0 for Backend/Public release 188fdba… and Admin 111a501… in selected project; project mapping/ingestion completeness not established. Follow-up tool discovery said Sentry MCP tool removed. | NOT_TESTED; not evidence of telemetry delivery or absence of errors across all projects. |

**Status reconciliation.** Previous ledger: PASS 9 / FAIL 4 / BLOCKED 30 / NOT_TESTED 70 (113). Changes only: NEXI-03-02 NOT_TESTED→BLOCKED (current config/test fixture unavailable); NEXI-13-02 PASS→NOT_TESTED (prior pair subcase does not prove full criterion). New totals: PASS 8 / FAIL 4 / BLOCKED 31 / NOT_TESTED 70 = 113. Every other row retains its prior status. The past interim total discrepancy is not resolved by this checkpoint and is not retroactively explained.

**Evolver.** vnext_status reported v0.5.0-candidate and production verifier unconfigured; full-scope preflight abstained. Candidate-only searches found the two prior advisory candidates but their procedure scope/controller did not match this Codex/Chrome run; neither was applied. New advisory candidates recorded unverified/non-deterministic: nexi-browser-deposit-test-only-config-mismatch-20261105 and nexi-chrome-click-timeout-state-check-20261105. The latter records the safe response to click timeouts: inspect a fresh UI snapshot before retrying. Candidate status does not mean verified or accepted.

**Safety boundary and next proof.** No address copied, funding/withdrawal/transfer/trade/subscription performed, Admin data mutated, or source/service/deployment changed. Remaining authorization-dependent workflows require an approved test identity, bounded operation and explicit authorization. The next action for NEXI-03-02 is to obtain a real non-test configured network/address plus an approved fixture, then validate its public instructions read-only before any separately authorized claim. Continue remaining NOT_TESTED criteria only where evidence and environment permit.

## Consolidated browser acceptance checkpoint — 2026-11-05

**Scope.** One resumed pass on the existing authenticated Chrome session (Public page 2, mobile 390×844; Admin page 3, desktop) plus a separate anonymous Public Spot context, which was closed afterward. Repo HEAD and `origin/main` both `fb48ccd70ceb6322c67d775f08cbc8a40accd9d0`. API `/readyz` returned READY with database and Redis true and SQLite authority; this does not identify the currently deployed app bundles. Last observed Public/Backend and Admin release markers remain the historical values recorded above and were not freshly verified in this pass. No source, service, deployment, or business data was changed.

**New criterion result.** `NEXI-08-07` FAIL: authenticated Mining summary returned HTTP 200 with zero values; positions and rewards requests returned HTTP 200 with empty arrays, while the UI combined “No positions/reward accruals returned” with “Try again shortly.” The explicit successful-empty response is therefore also presented as a retry/failure state. Unconfigured-product handling was not tested. This is a UI acceptance finding only; no source repair or repeat test was performed.

**Partial evidence retained without a pass.** `NEXI-01-07`: isolated anonymous Spot rendered market/chart/reference data; wallet status said unavailable and order submission remained disabled after a draft amount, but no protected request was submitted, so backend session enforcement is unproven. `NEXI-14-02`: a zero Mining amount left Review subscription disabled without an inline reason; minimum stake was visible on the underlying plan card and wallet balance was zero, so this does not establish a criterion-wide defect. No subscription was confirmed. `NEXI-14-05`: snapshot audits covered only Public Mining on mobile and Admin Mining on desktop; both accessibility category scores were 100. Browser console noted one Public and six Admin fields without id/name. Focus, keyboard, touch targets and broader route coverage remain untested. These rows remain NOT_TESTED.

**Run limits / concrete dependencies.** The customer session showed 0 USDT and the Admin session was Super Admin. No approved funded test identity, explicit bounded transaction fixture, restricted-role identity, or authorization to execute an economic action was available. Therefore deposit confirmation, withdrawal, transfer, trade, subscription/reward accrual, role-denial and mutation-propagation end-to-end outcomes remain unverified. API READY and rendered Admin health indicators are not substitutes for those proofs.

**Credential handling note.** During DevTools inspection, a network response displayed session authorization material in tool output. It is omitted from this receipt and was not copied into project artifacts. No session revocation or rotation was performed during acceptance.

**Tracker reconciliation.** Only `NEXI-08-07` changed NOT_TESTED→FAIL. The other three rows above retain NOT_TESTED with more specific partial evidence. The reconciled 113-row totals are PASS 8 / FAIL 5 / BLOCKED 31 / NOT_TESTED 69. This is not a completed end-to-end acceptance campaign.
