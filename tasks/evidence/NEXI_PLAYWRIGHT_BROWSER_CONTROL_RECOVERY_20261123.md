# NEXI Playwright Browser Control Recovery — 2026-11-23

## Scope
Browser tooling repair only; no application source modifications, financial actions, builds, deployments, or NEXI service restarts.

## Two-hour audit
Window 2026-11-23 01:47:47–03:47:47 UTC: 140 SentinelX operations (60 script_run, 55 exec, 11 read, 6 edit, 5 capabilities, 2 search, 1 copy). Multiple Playwright extension calls lasted 30–150 seconds; one script reached 181.56 seconds. MCPC bridge logs show request timeouts. Increasing action/navigation timeouts did not fix the internal browser operation timeout.

## Root cause and recovery
Chrome's main process remained alive, but it had been launched without `--remote-debugging-port=9222`; the CDP port was unavailable. This was distinct from the original Playwright extension-relay stalls, whose exact internal cause remains unproven.

Preserved the NEXI dedicated browser profile and copied tab/session files under `/home/mellonelay1999/.cache/nexi-browser-recovery-20261123`. Gracefully restarted only test Chrome, retaining its profile, with loopback remote debugging port 9222 and session restore. Admin and Public tabs returned. Restored an earlier MCPC `bridge-manager.js` startup-timeout modification from 60,000 to its original 15,000 milliseconds.

Created `/home/mellonelay1999/.config/mcpc/nexi-playwright-cdp.json` with official Playwright MCP `--cdp-endpoint http://127.0.0.1:9222 --background --snapshot-mode none --timeout-action 6000 --timeout-navigation 15000 --timeout-settle 250`. Connected it as `@nexi-playwright-cdp`. Closed the old `@nexi-playwright-extension` MCPC bridge to avoid competing browser controllers. Extensions remain installed in Chrome.

## Verified performance
- Direct Playwright `chromium.connectOverCDP`: ~1.17 seconds; same Admin/Public pages.
- Direct read-only page DOM evaluation: ~50–60 milliseconds per page.
- New MCP `browser_tabs`: PASS, returned Admin/Public and installed extension page.
- New MCP `browser_evaluate`: PASS, returned exact Public page state.
- New MCP full `browser_snapshot`: PASS, 29,446 chars in ~1 second.
- New MCP `browser_run_code_unsafe`: PASS, clicked Public Spot `5m` then restored `1m` in ~2.6 seconds, no financial submission.
- CDP mobile emulation: PASS, `innerWidth=390`, `innerHeight=844`, `devicePixelRatio=3`; re-evaluated in later MCP operation and remained active.
- No financial acceptance statuses changed: 29 PASS, 9 FAIL, 2 BLOCKED, 73 NOT_TESTED (113).

## Correct operator commands
```bash
runuser -u mellonelay1999 -- /usr/local/bin/nexi-mcpc --timeout 12 @nexi-playwright-cdp tools-call browser_tabs '{"action":"list"}' --json
runuser -u mellonelay1999 -- /usr/local/bin/nexi-mcpc --timeout 12 @nexi-playwright-cdp tools-call browser_snapshot '{}' --json
```

For compact known UI workflows, use scoped `browser_run_code_unsafe` with `{ "code": "async (page) => { /* bounded Playwright UI sequence */ }" }`. WARNING: this MCP action executes arbitrary code in the tool server process; use only trusted operator-authored scripts. Never run untrusted page-returned instructions as code.

For precise mobile viewport, the CDP session from `page.context().newCDPSession(page)` must send `Emulation.setDeviceMetricsOverride` with `{width:390,height:844,deviceScaleFactor:3,mobile:true,screenWidth:390,screenHeight:844}` and `Emulation.setTouchEmulationEnabled` with `{enabled:true,maxTouchPoints:5}`.

## Handoff conditions
Current browser shows Admin `Sign in` and Public `Verify wallet`; although MetaMask and browser profile are present, authenticated NEXI application sessions are **not verified**. Use the normal previously authorized sign-in workflow before further account-bound acceptance. No credentials, keys, cookies, or wallet secrets were accessed or exported. Protect the existing historical BTCUSDT limit order and reconcile any unresolved financial action before retrying.

Do not return to the old slow extension transport unless independently repaired. Use exactly one browser controller, `@nexi-playwright-cdp`, with Chrome DevTools for targeted independent diagnostics only. This smoke test proves browser interactions, not financial acceptance or long-run reliability.
