# NEXI Acceptance Successor Handover — 2026-11-22

**Phase:** HANDOVER_COMPLETE — ACCEPTANCE_PAUSED_PENDING_OWNER_DIRECTION<br>
**Campaign:** nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443<br>
**Repository:** /home/mellonelay1999/workspaces/Nexi<br>
**Handover prepared:** 2026-11-22 (UTC; no acceptance action performed during this handover)

## A. Executive continuity checkpoint

The active objective remains the release-specific, authenticated UI-first acceptance of the 113 canonical NEXI Public/Admin requirements against the reported queue-fix release. The owner has paused acceptance while discussing execution scope with the independent NEXI reviewer. This handover preserves current results and the next frontier; it does not complete the acceptance campaign or authorize resumption.

Current campaign classification is **24 PASS / 6 FAIL / 6 BLOCKED / 77 NOT_TESTED** (113 total). There are 18 recorded journeys; none is complete: J01–J02 and J04–J18 are partial, while J03 is blocked. Seven supplemental UX overlays UX-01–UX-07 are recorded, with partial work on six and UX-03 not tested. No campaign result was promoted based only on a partial journey.

Campaign files and evidence reviewed:

- Current tracker: tasks/evidence/nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443.csv
- Manifest: tasks/evidence/nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443_evidence/campaign.json
- Chronological event log: tasks/evidence/nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443_evidence/events.jsonl
- Screenshots: tasks/evidence/nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443_evidence/
- Canonical requirements: docs/quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv and docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md
- Execution contract: docs/quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md

Latest persisted campaign activity is dated 2026-11-22; manifest update time is 15:26:15 UTC. The last event is J09 settlement/history/activity readback, with a partial result for NEXI-05-08. The event log has 43 records. The evidence folder currently contains 72 image files. Sixty-five unique images are referenced by campaign records/manifest, all are present; 64 recorded SHA-256 references were checked and match.

The owner-imposed pause is explicit: do not start another journey, alter financial state, change source, run tests/builds, deploy, restart services, close Chrome, disconnect MetaMask, or sign out Admin. Do not treat prior testing authorization or historical financial actions as authorization for new campaign transactions. Wait for updated owner instructions before resuming acceptance.

## B. Source and release identity

Read-only live repository snapshot before adding this handover:

| Field | Observed value |
|---|---|
| Branch | main |
| HEAD | f3515cf76d46ff9814eb6402db41de5b5eafb7c7 |
| Ahead/behind | 22 ahead, 0 behind (project snapshot) |
| Tracked modified files | NEXI_CURRENT_STATE.md; backend/src/market/market-ingest.service.ts; docs/operations/NEXI_GRAPHIFY_CLOUD_CLI_MCPC_RUNBOOK_20261116.md; docs/quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md |
| Staged | 0 |
| Untracked before handover | Full git status --short --untracked-files=all showed 86 paths: 74 campaign evidence-folder files, the current tracker, and 11 preserved backup files. Project snapshot reported 13 untracked; this differs from full git status, so retain the full-status count as the exhaustive listing and record the tool discrepancy. |
| Node selector on host | v24.21.0 |
| Backend process | Node v24.22.0; /srv/nexi/backend/dist/src/main.js |
| Public process | Node v24.21.0; Next standalone server on port 3000 |
| Admin process | Node v24.21.0; /srv/nexi/admin/current/server/index.mjs on port 3001 |

Release identities recorded in campaign manifest:

- Backend release marker: nexi-backend-queuefix-6e1b37811bfc0443.
- Public release SHA: f3515cf76d46ff9814eb6402db41de5b5eafb7c7.
- Admin RELEASE_SHA: f3515cf76d46ff9814eb6402db41de5b5eafb7c7.
- Admin NEXI_RELEASE_SHA: 111a5010f04a6592c290b0b0bc93240ab0cec69b.

Different component release identifiers are recorded separately and are not silently treated as inconsistent. API, Public and Admin systemd units were read as active/running. The API service unit describes itself as staging/non-authoritative pending cutover acceptance. No service was changed.

The current NEXI_CURRENT_STATE.md records local Graphify 0.9.112, SHA-256 c748c739014d549b6cb43ff94c5efc7cfd8be5b9eea4f3273a6ad7700c1e4f51, built at HEAD. This graph predates the uncommitted market-ingest queue source patch and is not revision-complete for that file. No graph refresh was run.

Source and release evidence limitations:

- The Backend market-reference queue batching correction is deployed, but queue saturation remains observable. API service logs at 17:30 UTC reported cumulative drops of 592,888 trade events and 37,220 depth events since process start. This is a live read-only log observation, not a controlled throughput comparison.
- The repo contains the modified queue source patch and other tracked/untracked work. Preserve all of it. This handover adds one new untracked document; no other Git state is changed.
- NEXI_CURRENT_STATE.md records prior Node 24.22 stability observation and deployment/build history. Those dated results were not re-run as part of this handover.
- The Public service log includes a 13:14 UTC Next.js Server Action error for a malformed reference value ("x"). It was not investigated in this handover and is not assigned as a campaign defect.
- No source-level root cause was established for the six acceptance failures.

## C. Browser continuity

A read-only Chrome DevTools MCP list_pages call succeeded during this handover. Current page listing at that point:

- Page 2: Admin, https://admin.nexitrading.app/settlements
- Page 4: Public, https://www.nexitrading.app/dashboard/wallet (selected)
- Page 3: MetaMask extension side panel
- Pages 5 and 6: Coinbase Wallet onboarding URLs
- Viewport reported by the browser tool: 390 × 844 CSS px, DPR 3, mobile/touch emulation.

These page IDs and URLs are volatile: rediscover them before use. The page listing confirms the DevTools MCP can currently enumerate tabs; it does not verify authentication or wallet connection.

Authentication last recorded by campaign evidence (manifest last updated 15:26:15 UTC): Admin was authenticated to the test profile and Public was authenticated to the dedicated test wallet. The current browser page listing did not re-check authentication. Do not report the sessions as currently authenticated without a fresh, non-mutating observation.

MetaMask presence is contradictory in live tool output: list_pages showed a MetaMask extension page and service worker, but list_extensions returned “No extensions installed.” Preserve the open pages and do not assume that wallet connection or extension availability is currently healthy. No wallet disconnect, sign-out, profile change, or navigation was performed.

Display and remote-control facts observed on the host:

- Xvfb and x11vnc processes were present; x11vnc targets display :98 and listens on port 5900.
- The persistent profile path from prior session context is /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance. This path was not visible in the current process arguments and is therefore last-known, not freshly verified.
- Chrome DevTools MCP was callable through @nexi-chrome-readonly. Its wrapper reported a loopback browserUrl but truncated the endpoint; the exact CDP port/address and Chrome process/startup owner were not recovered.
- NoVNC or SSH tunnel arrangement was not verified. Do not start, stop or reconfigure one.
- Keyboard focus/navigation followed by Enter is a recorded successful fallback when DevTools pointer clicks timed out. Prefer this only after fresh page discovery and only when the owner authorizes resumed testing.
- Current read-only browser checks did not interact with any tab, and no tab was closed or changed.

Last-observed authentication details and test identity are in campaign.json. Do not expose passwords, cookies, session tokens, seed phrases or private keys. The test wallet address is not reproduced here.

## D. Completed interactions

The table distinguishes committed non-financial UI state, previews/read-only observations, existing historical records, and actions that were deliberately not submitted. Evidence paths are relative to the campaign evidence folder unless noted.

| Journey / criterion | Actual action and observed result | Evidence | Classification | Remaining proof |
|---|---|---|---|---|
| J01 / NEXI-01-05 | Recovered the expired Public session through the normal off-chain SIWE “Verify Wallet” flow on Ethereum chain 1; MetaMask displayed “No changes.” Same wallet returned; Spot/Margin, Options and Finance navigation did not ask for another signature. | nexi-public-finance-after-siwe-recovery-390x844.png | NEXI-01-05 PASS; J01 partial | Account switching, explicit disconnect, remaining onboarding fields, expiry/reconnect matrix. |
| J02 / NEXI-11-01, 11-05 | Used Public Quotes search, categories and asset detail; navigated relevant Admin Clients, Binary Settings, Mining and Loans areas. | public-quotes-search-btc-mobile.png; public-quotes-metals-filtered-mobile.png; public-quotes-forex-mobile.png; public-btc-asset-detail-15m-mobile.png; public-options-btc-mobile.png | Partial journey; criterion-level PASSes recorded | Remaining routes/workspaces, full chart and real-device coverage. |
| J03 / funding credit | No Admin balance adjustment was submitted. No campaign-scoped amount/account/reason was present in the campaign checkpoint. | Admin profile/read-only evidence only | BLOCKED | Owner must specify current execution scope before any credit or other mutation. |
| J04 / NEXI-02-03 | Read Funding, Spot, Margin, Options and Finance balances and compared aggregate wallet view. USDT values reconciled; estimated BTC valuation produced small rounding drift. | nexi-wallet-funding-account-full.png; nexi-wallet-spot-account-full.png; nexi-wallet-margin-account-full.png; nexi-wallet-options-account-full.png; nexi-wallet-finance-account-full.png | PASS for NEXI-02-03; J04 partial | Refresh after a successful financial mutation remains untested. |
| J05 / NEXI-03-01, 03-02 | Public USDT networks ERC20/Solana/TRC20 matched enabled Admin entries. Public destination displayed TEST_ONLY/PRE-LIVE and warned against real funds; no deposit or claim submitted. | nexi-public-usdt-deposit-warning-390x844.png; nexi-admin-deposit-network-catalog-1365x723.png | 03-01 PASS; 03-02 FAIL; J05 partial | No real deposit/claim; destination correctness and live deposit lifecycle unresolved. |
| J06 / NEXI-03-05 | Read withdrawal terms, network, min/max, fee and additional-fee semantics. Entered a test-only invalid address and 1 USDT preview; required security password stayed empty; no request submitted. Admin queue examples were historical and not the current wallet. | nexi-public-withdrawal-usdt-preview-390x844.png; nexi-admin-withdrawal-review-queue-1365x723.png | 03-05 PASS; J06 partial | No same-customer request, review, approval/rejection, retry or broadcast. |
| J07 / NEXI-04-03 | Drafted 1001 USDT Funding→Spot against a displayed 1000 USDT balance. Confirm became enabled with no local insufficiency message. Confirm was not pressed; no server request was sent. | nexi-public-transfer-overbalance-draft-390x844.png | BLOCKED at server rejection probe | Transfer submission and durable source/destination readback require current bounded authorization. |
| J08 / NEXI-04-08 | Requested a 1 USDT→BTC quote; POST /financial/conversion/quote returned 201 and UI showed quote/expiry. Accept quote was not pressed. | public-conversion-quote-390x844.png | BLOCKED at financial acceptance | No conversion, Ledger posting or readback. |
| J09 / NEXI-05-01, 05-03, 05-08 | Exercised duration/stake controls and insufficient-balance funding path. Separately read an existing 1 USDT BTCUSDT LONG settlement: Public History showed LOSS, Admin settlement showed LOSS for matching position, and Public Activity showed Completed with two postings. No new trade or transfer was made. | public-options-btc-mobile.png; public-options-stake-validation-390x844.png; nexi-public-options-insufficient-funds-transfer-path-390x844.png; public-options-settlement-activity-readback-fullpage.png; admin-options-settlement-investigation-1365x723.png | 05-03 PASS; 05-01 FAIL; 05-08 remains NOT_TESTED as a compound criterion; J09 partial | Effective Admin values/source and result card plus matching notification are not proven. Existing historical trade is not a campaign-created trade. |
| J10 / NEXI-06-02, 06-03, 06-04, 06-06, 06-07 | Refreshed/read the pre-existing BTCUSDT open order and matching Admin row. Drafted small Buy/Sell values. A 0.1 BTC Sell Limit against 0.00014 BTC available reached a Review dialog with Confirm enabled and no warning; Confirm was not pressed. Read existing fill history showing UNKNOWN while Activity showed Completed. | nexi-public-spot-open-order-refresh-390x844.png; nexi-admin-spot-open-orders-1365x723.png; nexi-public-spot-sell-draft-balance-cost-390x844.png; nexi-public-spot-sell-overbalance-review-390x844.png; nexi-public-spot-trade-unknown-390x844.png; nexi-public-wallet-activity-390x844.png | 06-02/06-06 PASS; 06-03/06-07 FAIL; 06-04 BLOCKED; J10 partial | No new order placement/cancellation; backend rejection, fill/fee lifecycle and state corrections untested. Existing order preserved. |
| J11 / NEXI-07-01, 07-02, 07-04, 07-06 | Read existing LONG 2x PENDING margin position and Admin leverage/maintenance settings; these matched. No open, close, repay or liquidation action performed. | nexi-public-margin-state-390x844.png; nexi-admin-margin-controls-1365x723.png | 07-01/07-02/07-06 PASS; 07-04 BLOCKED; J11 partial | No borrowable total reconciliation or financial lifecycle. Existing position preserved. |
| J12 / NEXI-08-02 | Read Admin/Public Mining plans and current Public lifecycle state: locked principal 0, one completed 10 USDT subscription, reward 0.35, three products. No purchase/redemption. | nexi-public-mining-terms-390x844.png; nexi-admin-mining-terms-1365x723.png; public-mining-readback-current-390x844.png | 08-02 PASS; J12 partial | Admin customer-specific lifecycle reconciliation, purchase/redemption and full plan lifecycle. |
| J13 / NEXI-08-04 | Read loan terms and synthetic/test-only Admin fixtures; entered 100 USDT in a Public loan preview and observed displayed estimates, then left blank collateral/reference and did not submit. | public-loan-repayment-preview-mobile.png; nexi-public-loans-products-390x844-full.png; nexi-admin-loans-products-applications-1365x723.png | 08-04 BLOCKED; J13 partial | Application, collateral, Admin review, disbursement, interest and repayment lifecycle not performed. |
| J14 / NEXI-09-02, 09-05 | Marked one actual notification read through the UI; POST returned 201, unread-count GET returned 200; reload retained count 17 from 18. Used Wallet and Trading filters. | public-notifications-center-mobile.png; public-notification-trading-filter-390x844.png | 09-02/09-05 PASS; J14 partial | Producer coverage and Admin correspondence. This is the only logged user-facing read-state mutation; no financial state changed. |
| J15 / NEXI-12-02 | Matched Admin profile to Public wallet; read KYC labels and current/revoked session list. Changed language English→Español, reloaded, restored English and reloaded. No KYC/security mutation. | nexi-admin-test-wallet-kyc-readonly-1365x723.png; nexi-public-security-sessions-390x844.png; nexi-public-language-preference-restored-390x844.png | 12-02 PASS; J15 partial | KYC lifecycle/exact label mapping, timezone/currency/notification preferences. |
| J16 / governance | Read Admin deposit network catalog and compared Public network options. Read selected Admin product/governance pages only. No settings changed. | nexi-admin-deposit-network-catalog-1365x723.png; related Admin screenshots listed above | Partial | Other Admin governance controls and broader configuration propagation. |
| J17 / reconnect | Prior evidence records offline→online recovery. In this campaign a route transition briefly showed chooser/loading state; same wallet, notifications and Mining data returned without a new signature. | public-margin-offline-stale-state.png; public-margin-online-recovered.png; public-mining-readback-current-390x844.png | Partial/observed | Full reconnection, duplicate-submission and background/foreground matrix. |
| J18 / release | Read release/process identities and active services; no settlement or economic transaction was made. | campaign.json; current NEXI_CURRENT_STATE.md and live service-status output | Partial | No economic acceptance proof. |

Actions never submitted: Admin balance adjustment; deposit or deposit claim; withdrawal; internal transfer; conversion acceptance; Binary Long/Short position; new/cancelled Spot order; margin open/close/repay/liquidation; Mining purchase/redemption; Loan application/approval/rejection; KYC; Admin configuration edits. Existing trade/order/subscription/settlement records described above are readbacks, not newly created campaign actions.

## E. Acceptance matrix

The current campaign tracker has all 113 canonical IDs exactly once and carries current_release_status values. The status counts in the tracker agree with both campaign.json count objects and sum to 113. The campaign tracker SHA-256 matches campaign.json.

- PASS (24): NEXI-01-05, NEXI-02-01, NEXI-02-03, NEXI-03-01, NEXI-03-05, NEXI-05-03, NEXI-06-02, NEXI-06-06, NEXI-06-08, NEXI-07-01, NEXI-07-02, NEXI-07-06, NEXI-08-02, NEXI-09-01, NEXI-09-02, NEXI-09-05, NEXI-10-01, NEXI-11-01, NEXI-11-03, NEXI-11-04, NEXI-11-05, NEXI-12-02, NEXI-13-01, NEXI-15-04.
- FAIL (6): NEXI-03-02, NEXI-05-01, NEXI-06-03, NEXI-06-07, NEXI-12-01, NEXI-14-02.
- BLOCKED (6): NEXI-04-03, NEXI-04-08, NEXI-05-02, NEXI-06-04, NEXI-07-04, NEXI-08-04.
- NOT_TESTED (77): See all IDs and frozen criterion text in the current tracker. Important remaining items include account switching/disconnect and full SIWE setup (01-01..04, 01-06..08); post-mutation refresh and broader activity (02-04..08); deposit/withdrawal lifecycle (03-03..04, 03-06..08); successful transfer/recipient/activity (04-01..02, 04-04..07); full Binary configuration, position and result/notification lifecycle (05-04..10, including 05-08); Spot commit/fill/fee lifecycle (06-01, 06-05); margin borrowable/repayment (07-03, 07-05, 07-07); loan lifecycle (08-01, 08-03, 08-05..07); remaining notification/message, market, profile, Admin and platform criteria.

Qualification: a PASS is criterion-scoped; it does not mean its broader journey passed. NEXI-01-05 passed after session recovery, while compound NEXI-01-06 remains NOT_TESTED. NEXI-05-08 has matching History/Admin settlement/Activity evidence, but its required result-card/notification component was not observed and it remains NOT_TESTED. NEXI-13-02 remains NOT_TESTED although the deposit asset/network subset matched. Backend rejection was not observed for NEXI-06-03 because the review Confirm was intentionally not activated. No source root cause is established for any fail.

Evidence-record caution: one J05 event detail lists NEXI-02-03 PASS while describing deposit network matching. NEXI-02-03 is the wallet balance consistency criterion; its PASS is independently supported by the J04 five-account reconciliation. Preserve the historical event log unchanged; use the tracker and correctly scoped J04 evidence for this criterion.

## F. All 18 journeys

All journey descriptions below are a resumable summary of manifest.journey_coverage and matching events. Evidence names are relative to the campaign evidence folder. None is a fully completed journey.

| Journey | Status and completed work | Unperformed steps / auth or financial boundary | Dependency and evidence | Smallest next useful action after owner direction |
|---|---|---|---|---|
| J01 Wallet onboarding | PARTIAL. Dedicated wallet authenticated on Ethereum mainnet; expired NEXI session recovered with normal off-chain SIWE; no repeated signature during ordinary product navigation. NEXI-01-05 PASS. | Account switching, explicit disconnect, wrong-network/rejected signature and remaining onboarding initialization not tested. Do not sign during handover. | Current browser auth must be rechecked. nexi-public-finance-after-siwe-recovery-390x844.png | Reconfirm current authorized wallet session without altering it; then select only the owner-approved auth subscenario. |
| J02 Navigation/mobile shell | PARTIAL. Public routes, Quotes search/categories/asset detail and selected Admin navigation used. NEXI-11-01/11-05 PASS. | Remaining routes, charts, message/help states and real device behavior. | Current 390×844 Chromium emulation only; screenshots in D. | Choose the next non-financial route/viewport gap. |
| J03 Admin credit | BLOCKED. No Admin credit submitted; no campaign-scoped credit amount recorded. | Exact account/scope/amount/reason and one-time submit require explicit current authorization. | Current Admin profile evidence; preserve identity from manifest. | Wait for owner to specify scope; do not infer from older conversations. |
| J04 Wallet accounts | PARTIAL. Read all five account views and aggregate; NEXI-02-03 PASS with estimated BTC valuation rounding. | Refresh-after-mutation and broader activity linkage. | Five nexi-wallet-*-account-full.png screenshots. | Continue only with a permitted read-only comparison or owner-approved transaction. |
| J05 Deposit | PARTIAL. Public/Admin asset-network subset matches; TEST_ONLY/PRE-LIVE destination warning observed; NEXI-03-02 FAIL. | No deposit/claim; never use a real rail based on these test-only values. | Public/Admin network screenshots and event J05. | No next financial action until owner provides safe scope and product destination is corrected. |
| J06 Withdrawal | PARTIAL. Network/fee/limits/amount semantics and below-min/invalid inputs inspected; NEXI-03-05 PASS. | No request, review, approval, retry or broadcast. | Password field remained empty; queue examples were not current-user records. | Continue with read-only UI checks; any submit requires new authorization and exact bounded destination/scope. |
| J07 Transfer | PARTIAL; NEXI-04-03 BLOCKED. Overbalance draft left Confirm enabled. | No transfer request or server rejection/readback. | Funding displayed 1000 USDT; 1001 draft; evidence nexi-public-transfer-overbalance-draft-390x844.png. | Wait for exact transfer amount/source/destination and test authority. |
| J08 Convert | PARTIAL/BLOCKED; quote 1 USDT→BTC returned 201 and expiry. | Accept, conversion posting and Ledger readback not performed. | public-conversion-quote-390x844.png. | Wait for specific conversion authorization; quote preview alone is not transaction acceptance. |
| J09 Binary | PARTIAL. Five duration controls and stake validation exercised; insufficient funds path is PASS. Existing historical 1 USDT LONG LOSS matches Admin settlement and Completed Activity. | No direction/trade submitted; result card/notification absent; Admin global settings mismatch NEXI-05-01 FAIL; NEXI-05-08 remains NOT_TESTED. | Public/Admin settlement screenshots plus event records; no replay of historical trade. | First reconcile policy as a read-only source/config question after owner directs resumption; no trade until separately scoped. |
| J10 Spot | PARTIAL. Existing BTCUSDT open order survives reload and matches Admin; draft previews inspected. NEXI-06-03 and 06-07 FAIL; 06-04 BLOCKED. | No new order, fill, cancellation, server rejection or fee lifecycle. Existing open order must remain. | Order ID in campaign evidence: 1a95a4af-f902-46aa-8da7-6defa9cf8634. | Preserve the order; choose a non-mutating UI check or obtain explicit bounded order authorization. |
| J11 Margin | PARTIAL. Public isolated margin/risk and Admin config match; NEXI-07-01/02/06 PASS. Existing LONG 2x PENDING position untouched. | New open/close/repay/liquidation is blocked; borrowable amount not fully reconciled. | nexi-public-margin-state-390x844.png; nexi-admin-margin-controls-1365x723.png. | No financial position action without fresh amount/scope authorization. |
| J12 Mining | PARTIAL. Admin/Public plan terms match, NEXI-08-02 PASS; current readback has one completed 10 USDT subscription and 0.35 reward, locked principal 0. | Purchase/redemption and customer-specific Admin lifecycle not exercised. | Mining screenshots and final readback event. | Reconcile customer record read-only if authorized; no subscription mutation. |
| J13 Loans | PARTIAL. Plan terms match; read-only Admin fixtures; Public 100 USDT preview only. | No application, collateral, approval/rejection, disbursement, interest or repayment. NEXI-08-04 BLOCKED. | Public loan preview and Admin products/applications screenshots. | Continue only with scoped non-mutating review or explicitly authorized application lifecycle. |
| J14 Notifications/messages | PARTIAL. One notification read persisted after reload; NEXI-09-02/09-05 PASS; Wallet/Trading filters seen. | Producers and Admin correspondence, remaining messaging/help criteria. | public-notification-trading-filter-390x844.png; POST read 201, unread GET 200, count 18→17. | Use read-only comparison for an untested notification producer if authorized. |
| J15 Profile/security | PARTIAL. Identity/session UI and language persistence verified; language restored to English. NEXI-12-02 PASS; Last Login 1970 remains NEXI-12-01 FAIL. | KYC lifecycle/exact label mapping, timezone/currency/notification preferences. No revocation or KYC action. | Profile, sessions and language screenshots. | Read-only mapping of labels or preferences; no KYC/security state change. |
| J16 Admin governance | PARTIAL. Read Admin network catalog and selected Products/Loans/Margin/Binary/Clients controls; no configuration changed. | Remaining governance/settings and full consumer propagation. | Admin screenshots in D; distinguish current-user records from synthetic/test-only rows. | Select an independent read-only Admin workspace after updated owner scope. |
| J17 Reconnect | PARTIAL. Previously recorded offline→online recovery; during current campaign route briefly showed chooser/loading before the same wallet/data returned without a new signature. | Full app lifecycle, background/foreground, duplicate-submission matrix. | Existing offline/online screenshots and current Mining evidence. | Discover live page IDs; observe only after owner resumes, with no duplicate POST replay. |
| J18 Release/economic proof | PARTIAL. Component releases/processes and active services recorded. | No settlement/economic acceptance transaction performed. | Manifest plus active service status. | Keep deployment identity matched to future acceptance evidence; do not deploy or restart. |

## G. Supplemental UI/UX overlays

Seven overlays are recorded in campaign.json:

- UX-01: PARTIAL. Chrome mobile emulation at 320×480, 320×568, 360×640, 390×844, 412×932, 430×932 and 440×956. No page-wide horizontal overflow observed. A BTC/USDT label wraps at 320×480; not classified as a canonical failure. Real Android DApp browser, soft keyboard, safe-area and browser chrome behavior remain untested.
- UX-02: PARTIAL. Spot draft/review and invalid quantity inspected; no order submitted.
- UX-03: NOT_TESTED. Research Force WIN/LOSS and simulated chart workflow not exercised.
- UX-04: PARTIAL. Deposit destination and validation preflight inspected; no deposit proof/claim submitted.
- UX-05: PARTIAL. Admin Loans and Public Mining views inspected; lifecycle remains incomplete.
- UX-06: PARTIAL. Notifications/history and offline→online recovery inspected; wallet-signature/account-change matrix remains untested.
- UX-07: PARTIAL. Selected Admin workspaces and user/KYC/network views inspected; sorting/filtering and authorized review controls incomplete.

This was desktop Chromium with mobile emulation. It is not evidence from an Android phone using MetaMask or Trust Wallet’s DApp browser. Admin evidence used desktop viewports; campaign screenshots include 1365×723 and 979×715 examples. Real device, toolbar/visual viewport, soft keyboard, touch geometry, chart resize and Web3-provider behavior remain separate acceptance work. No separate full chart interaction result was established in this campaign.

## H. Known defects

All six remain FAIL, with no source repair or source-root-cause attribution in this campaign:

| Criterion | Confirmed observed defect | Evidence / limits |
|---|---|---|
| NEXI-03-02 | Deposit destination is marked TEST_ONLY/PRE-LIVE and warns not to send real funds; destination/confirmation behavior therefore fails the requirement. | Public deposit warning and Admin destination inspection; no real deposit/claim. |
| NEXI-05-01 | Admin says no global Binary policy is saved and has blank payout/stake controls while Public displays five durations, 85% payout and 1–1000 USDT limits; Admin says shared global settings control them. | Current Admin/Public policy screenshots. Effective Backend default/legacy source is unknown; no settings changed. |
| NEXI-06-03 | Sell Limit draft 0.1 BTC versus 0.00014 BTC available reached Review with Confirm enabled and no insufficiency message. | Review screenshot. Confirm not pressed; Backend rejection untested. |
| NEXI-06-07 | Existing BTCUSDT fill is shown as UNKNOWN in Public trade history while related Wallet Activity is Completed. | Trade and Activity screenshots. Source root cause unknown; no state correction. |
| NEXI-12-01 | Admin Last Login shows 1/1/1970 despite a current non-revoked session created and used on 2026-11-22. | Admin test-wallet profile screenshot. Source root cause unknown. |
| NEXI-14-02 | At zero transfer amount, Confirm is disabled without a visible explanation/recovery path. | public-transfer-zero-validation.png. No transfer submitted. |

Do not silently correct these classifications or treat this report as source investigation.

## I. BLOCKED and authorization-sensitive work

| Criterion | Not performed | Why status is BLOCKED |
|---|---|---|
| NEXI-04-03 | Did not submit the overbalance 1001 USDT Funding→Spot request against 1000 USDT available. | UI draft shows enabled Confirm/no message, but server response and readback require an exact campaign-scoped transfer authorization. |
| NEXI-04-08 | Did not accept the 1 USDT→BTC quote or inspect a resulting Ledger posting. | Quote preview succeeded; no bounded conversion was authorized. |
| NEXI-05-02 | Did not select Long/Short or submit a Binary position. | Direction may create a real position; no bounded trade authorization recorded. |
| NEXI-06-04 | Did not Confirm a Spot order, cancel an order or create a fill. | Final commit changes financial state; no campaign-bounded trade action was authorized. Existing open order preserved. |
| NEXI-07-04 | Did not open/close/repay/liquidate a margin position. | These actions alter financial position state; no bounded action authorized. Existing pending position preserved. |
| NEXI-08-04 | Did not submit a loan application or act on collateral/review/disbursement. | Loan lifecycle was not approved for this campaign; collateral and review actions can affect financial/account state. |

The UI itself was available for several blocked scenarios; the blocker was the unapproved/unspecified commit scope, not necessarily unavailable product behavior. Preserve BLOCKED; do not relabel as FAIL or PASS to improve totals. The owner intends to discuss/refine scope before resumption. This is not a permanent decision that all financial testing is forbidden.

## J. Technical incidents and recovery

- Chrome DevTools MCP pointer-click calls have timed out in this campaign. The recorded safe fallback was keyboard focus/navigation plus Enter; this worked for visible UI actions. Do not translate a tool timeout into an application failure.
- J17 records transient Public route hydration/chooser/loading state followed by return of the original wallet, authenticated notifications and Mining data without a new signature. It was not a persistent authentication failure.
- Browser diagnostics recorded three Admin 401 requests during earlier initialization (GET /admin/me and Mining plan/subscription routes); subsequent authenticated Admin identity and data loaded. Exact original timestamps/body were not preserved; treat as transient observation, not a persistent defect.
- Public diagnostics recorded no 4xx/5xx in the saved request summary; a CORB notice targeted Coinbase Wallet telemetry and extension warnings/form-label issues were candidates, not established NEXI defects.
- Tool recovery during handover: the first SentinelX capabilities request by host ID failed internally; retry using host label mellonelay returned capability state. A root AGENTS.md read also failed internally, then a bounded read-only script successfully read the file. tasks/evidence/AGENTS.md was confirmed absent. These were tooling/path issues; no NEXI application failure.
- An unrelated annotations-extensibility plugin detour occurred in the preceding exchange: its skill was read and found irrelevant to the NEXI handover; no NEXI files or state changed.
- To resume safely, use current SentinelX host mellonelay, verify current branch/HEAD/dirty state, read this handover and current campaign artifacts, and rediscover live Chrome pages. Do not repeat previously completed journeys or page IDs from this file. Do not issue a repeated financial POST after an uncertain result; reconcile the existing receipt first.

## K. Unresolved engineering dependencies

Only these materially affect future acceptance:

1. Market-reference queue saturation persists after the deployed batching correction. Cumulative drop counters were observed in API logs; test load was not controlled and no comparative performance claim is established. Current source has a dirty backend queue patch.
2. The active Graphify graph is 0.9.112 at HEAD but predates the uncommitted queue patch. It is a source-navigation aid, not runtime proof.
3. Current browser connectivity is established through DevTools MCP page enumeration, but exact CDP endpoint/profile/startup owner and authentication cannot be claimed as live-verified. MetaMask page presence conflicts with the extension inventory.
4. Real Android MetaMask/Trust Wallet DApp-browser coverage remains separate from Chromium mobile emulation.
5. Financial commit scenarios remain incomplete pending updated owner scope: Admin credit, transfer rejection, conversion, Binary direction, Spot order commit, Margin lifecycle and Loan lifecycle.
6. Service processes are active, but no acceptance service restarts/build/deploy occurred. Backend is v24.22.0 and the other services v24.21.0. The API queue warning remains current runtime evidence.

## Evidence verification performed

Read-only checks completed for handover:

- Current tracker: 113 rows, all canonical IDs exactly once; ID set matches the canonical CSV exactly.
- Status totals: tracker and campaign manifest both report 24/6/6/77; totals sum to 113.
- Tracker SHA-256: 2445728018b0fca3608d92e17c51abb1283e5f19e6edd50424a8676a2cfd4eee; matches campaign.json.
- events.jsonl: 43 valid JSON lines, no malformed lines.
- Evidence: 72 image files physically present; 65 unique images referenced; no referenced image missing; all 64 stored SHA-256 references match.
- Current Git state was read before this handover document was added. No campaign file or historical event was edited.
- Handover references the actual VM repository-relative paths listed in section A.

## SUCCESSOR SESSION — EXACT RESUMPTION INSTRUCTIONS

~~~text
You are the next ChatGPT Work session for the NEXI acceptance campaign. Start by reading:

/home/mellonelay1999/workspaces/Nexi/tasks/evidence/NEXI_ACCEPTANCE_SUCCESSOR_HANDOVER_20261122.md

Then read, from the same repository:

1. tasks/evidence/nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443_evidence/campaign.json
2. tasks/evidence/nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443.csv
3. The final/recent records in tasks/evidence/nexi-acceptance-20261122-backend-queuefix-6e1b37811bfc0443_evidence/events.jsonl
4. Only as needed, the canonical requirements and execution contract named in the handover.

Use SentinelX for the NEXI VM. Read current root/surface AGENTS.md as relevant, then verify current branch, HEAD and complete dirty/untracked state. Preserve all existing source changes, backups, acceptance evidence and browser tabs. Do not commit, push, clean, reset, test, build, deploy, restart, or alter source as part of bootstrap.

The last verified acceptance counts were 24 PASS / 6 FAIL / 6 BLOCKED / 77 NOT_TESTED, 113 total. Recompute from the current tracker and manifest, reconcile any intervening events, and retain the current classifications unless new verified campaign evidence changes them. Reuse existing evidence; never promote a partial journey to PASS.

Before discussing browser work, verify that the existing Chrome DevTools MCP still connects and discover page IDs and URLs afresh. Page IDs and auth states in the handover are volatile. Preserve Admin and Public sessions, do not close tabs, sign out, disconnect MetaMask, or change the persistent profile. Do not assume MetaMask is usable from the extension-page listing; resolve the current inventory conflict read-only.

The current acceptance phase is HANDOVER_COMPLETE — ACCEPTANCE_PAUSED_PENDING_OWNER_DIRECTION. The owner is discussing scope with the independent NEXI reviewer. Complete bootstrap and report the reconciled state, but DO NOT resume testing, start journeys, perform browser interactions, make financial changes, repair code, run tests/builds, deploy, or restart services until the owner provides updated instructions. Prior session authorization does not substitute for current transaction scope.

Do not treat any historical transaction as newly created by this campaign. Keep the existing BTCUSDT open order intact. No deposit claim, withdrawal, internal transfer, conversion, Binary position, Spot order, Margin lifecycle, Mining subscription, Loan lifecycle, KYC change or Admin policy edit is authorized by this handover.

At bootstrap completion, report: current Git state; campaign count reconciliation; service/release facts that remain current; live browser connection result without changing pages; remaining genuine gaps; and that acceptance remains paused pending owner direction.
~~~
