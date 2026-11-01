# NEXI Production Browser Acceptance — 2026-11-01

## Target and environment

- Expected and observed source/deployed release: `111a5010f04a6592c290b0b0bc93240ab0cec69b`.
- Chrome: PID `598842`, executable `/opt/google/chrome/chrome`, existing profile `/home/mellonelay1999/.local/share/nexi-admin-browser-acceptance`, graphical display `:98`.
- CDP: `127.0.0.1:9222` listening. Chrome DevTools MCP attached through the existing configured CDP endpoint; `list_pages` succeeded.
- Authenticated Public and Super Admin sessions were observed in the existing profile. No credentials, tokens, cookies or wallet internals are included here.
- Public and Admin browser dimensions observed: Public `440x956`; Admin `1364x778`.

## Browser journeys observed

Public pages rendered during the route sweep: `/dashboard` (Quotes Hub), `/dashboard/spot`, `/dashboard/binary`, `/dashboard/wallet`, `/dashboard/mining`, `/dashboard/loans`, `/dashboard/support`, `/dashboard/messages`, `/dashboard/announcement`, `/dashboard/learn`, and `/dashboard/settings`. `/dashboard/quotes` and `/dashboard/notifications` are not standalone routes; the Quotes Hub is `/dashboard` and notifications are accessed from the header panel.

Admin authenticated route sweep covered 32 destinations: `/overview`, `/health`, `/users`, `/kyc`, `/sessions`, `/binary`, `/spot`, `/settlements`, `/exposure`, contextual `/sandbox`, `/wallets`, `/networks`, `/deposits`, `/withdrawals`, `/ledger`, `/assets`, `/market-feeds`, `/mining`, `/loans`, `/messages`, `/notifications`, `/announcements`, `/learn`, `/frontend-control`, `/navigation`, `/localization`, `/feature-flags`, `/admins`, `/roles`, `/approvals`, `/audit`, and `/maintenance`. Admin session and assets requests succeeded; assets showed 55 ACTIVE+visible entries.

Read-only network observations included successful Public price, klines, Spot orderbook/trades, Margin quote/positions, wallet overview, `/auth/me`, and Socket.IO requests. Public price response contained 53 records (21 LIVE, 32 UNAVAILABLE). No order, transfer, wallet signature, Admin mutation, approval, message, or publication was attempted.

## Evidence-backed PASS rows

- `NEXI-05-03`: Binary insufficient-funds notice was visible and directed the user to Wallet → Transfer.
- `NEXI-10-06`: Support and Messages were separate accessible Public and Admin destinations.
- `NEXI-13-01`: Admin information architecture rendered the eight-workspace navigation and all 32 destinations.
- `NEXI-15-04`: Backend, Public and Admin release markers/build identity matched the expected SHA before browser testing; health checks were available.
- `NEXI-15-05`: Exact-release production Sentry query was performed. It found unresolved issue `NEXI-1C`, “Failed to connect to MetaMask,” with two events and zero users affected; this issue was not reproduced in the current browser.

The tracker leaves all other criteria `NOT_TESTED`. Pages and data were inspected, but route loading and read-only observation do not prove the full criterion workflows. No functional failure was confirmed.

## Diagnostics and limitations

- No document-width overflow was observed at the tested dimensions. Exact widths 320, 360, 390 and 430 px, short-height mobile, tablet, and requested Admin sizes 1365×723 and 979×715 were not available/verified through the current browser emulation setup.
- Browser console included CSP eval/form-field messages, CORB, and MetaMask ObjectMultiplex/listener warnings; no first-party functional exception was reproduced.
- Public showed 53 market records while Admin showed 55 configured assets. Their semantics were not reconciled, so this is an open investigation, not a confirmed defect.
- `/dashboard/binary` displayed the insufficient-funds recovery notice; no position was opened.
- Four owner-accepted financial gates remain NOT_TESTED and were not reopened.

## Tracker interpretation

113 criteria reconciled: 5 PASS, 0 FAIL, 0 BLOCKED, 108 NOT_TESTED. BLOCKED is reserved for a criterion with a specific externally unavailable dependency; the evidence available here did not support assigning that status at row level. The 108 NOT_TESTED rows require criterion-specific actions and evidence before acceptance.

## Continuation addendum — 2026-11-01

### Release and browser state

- Rechecked source `HEAD`, Backend, Public and Admin release markers, and Public `BUILD_ID`; all equal `111a5010f04a6592c290b0b0bc93240ab0cec69b`. API `/readyz` returned HTTP 200 with SQLite and Redis ready.
- Chrome remained PID `598842` on the existing profile. `127.0.0.1:9222` remained listening and Chrome DevTools MCP `list_pages` continued to return the same Public and Admin targets.
- At the end of this continuation, Admin remained authenticated as Super Admin. Public displayed `Connect` after the route reload sweep; no wallet reauthentication or signature was attempted. Cause is unisolated, so `NEXI-01-06` is `BLOCKED` pending an authorized session recovery and repeat.

### Responsive and interaction evidence

- Public route shells were observed at 320×568 and 430×932 for `/dashboard`, `/dashboard/spot`, `/dashboard/binary`, `/dashboard/wallet`, `/dashboard/mining`, `/dashboard/loans`, `/dashboard/support`, `/dashboard/messages`, `/dashboard/announcement`, `/dashboard/learn`, and `/dashboard/settings`. No document-level horizontal overflow or API 4xx/5xx response was observed. Several data panels were still showing loading states in the capture window, so these route observations do not promote their full workflows to PASS.
- Public Spot chart was rendered at 320×568, 360×640, 390×844, 430×932, and short-height 320×480. No document-level horizontal overflow was observed. At 320 px the timeframe list is a horizontally scrollable strip (332 px scroll width in a 262 px client area); keyboard focus reached 1m through 1d, and the 44×44 px timeframe targets remained reachable. The bottom dock occupied the bottom 66 px in the tested layouts. Physical safe-area behavior on real notched devices was not verified.
- Changed the chart interval from 1m to 5m and 1d, observed corresponding chart labels, and confirmed `klines` responses for 1m, 5m and 1d returned HTTP 200. Restored 1m. The DevTools MCP `click` call reported an interaction timeout even though the selected interval changed and the matching request completed; state and Network evidence were used to verify the action.
- Cropped chart screenshots are stored in `tasks/evidence/nexi-production-browser-acceptance-20261101/` for each tested mobile dimension. The MCP screenshot file writer rejected repository paths outside its configured workspace roots; the existing CDP connection captured the crops without adding tabs or exposing wallet identity.
- Admin’s 32 destinations were visited at both 1365×723 and 979×715. No document-level horizontal overflow or API 4xx/5xx responses were observed. Full navigations briefly showed session-checking states; longer stable checks at 979×715 confirmed authenticated `Trade Settlements` and `Trading Risk` pages, their controls, and successful `/admin/me`, settlements, Spot pairs and Binary config responses. This is route/UI coverage; no Admin mutation or approval was attempted.

### Accessibility, performance and diagnostics

- Lighthouse snapshot audits: Public mobile Accessibility 100, Best Practices 100, SEO 80 (only failure: missing meta description), Agentic Browsing 100; Admin desktop Accessibility, Best Practices, SEO and Agentic Browsing all 100.
- Accessibility-tree snapshots exposed names for Public chart/timeframe, order and navigation controls and Admin workspace links and message fields. Keyboard focus traversed the Public chart tabs and the Admin workspace links. Sampled text contrast ratios were at least 5.48:1 for solid-color Public chart tabs and 4.92:1 for the sampled Admin selected workspace link; gradient-backed Public samples were excluded from manual color calculation. Physical safe-area and full-app contrast testing remain unverified.
- Performance trace on Public Spot reported CLS 0.01 (worst cluster 0.0113). Its 13 ms forced-reflow frame was attributed to the installed React DevTools extension’s `installHook.js`; the trace estimated no savings. Extension code accounted for 33 ms of main-thread time in the third-party insight. No first-party performance defect was established.
- Console contained MetaMask extension `MaxListenersExceededWarning` and `ObjectMultiplex` warnings; no first-party console exception was observed. The exact-release Sentry query (`mellonelay/nexi`, production, 24h) still returned unresolved `NEXI-1C`, “Failed to connect to MetaMask,” on `/dashboard/binary`, two events and zero users, last seen about one hour before the query. It was not reproduced. [Sentry issue](https://mellonelay.sentry.io/issues/NEXI-1C).
- BrowserStack accessibility scan-start and Playwright are not callable/installed in this session; no package was installed. Chrome DevTools MCP has no exposed viewport-emulation method (`categoryEmulation=false`), so viewport overrides used the existing Chrome CDP target. No BrowserStack scan or Playwright run is claimed.

### Asset-set reconciliation

The observed Public `/api/market/prices` response contained 53 market instruments: 20 stock instruments, 17 crypto instruments, 9 FX pairs and 7 metal instruments. Admin `/admin/market/assets` returned 55 configured assets: 20 stocks, 25 crypto-category assets, 3 FX base assets and 7 metal assets. These endpoints describe different entities: Public returns priced instruments/pairs with canonical instrument metadata; Admin returns configured assets and capabilities. The 20 stock and 17 crypto market bases map by canonical asset ID. The 9 FX instruments are pairs built from the 3 Admin FX bases plus their currency quote assets; the 7 metal instruments map to Admin metal assets, including `XAL`→Aluminum, `XCU`→Copper and `XZN`→Zinc. The remaining crypto-category Admin symbols are quote units (including USD/USDT and FX quote currencies), not additional Public price instruments. No unexplained 53-versus-55 asset mismatch remains from these readbacks.

### Tracker reconciliation

- `NEXI-11-03` is now `PASS`: responsive Spot chart rendered and interval changes 1m/5m/1d returned successful kline reads.
- `NEXI-15-05` is now `NOT_TESTED`: the Sentry query verified release-scoped error findings but did not verify notification behavior, which is part of this criterion.
- `NEXI-01-06` is `BLOCKED`: the existing Public connected state was absent after the route reload sweep, and further verification requires authorized recovery. No signature was requested or executed.
- Final 113-row totals: **5 PASS, 0 FAIL, 1 BLOCKED, 107 NOT_TESTED**. The four owner-accepted financial gates remain NOT_TESTED. No source or deployment changes were made.
