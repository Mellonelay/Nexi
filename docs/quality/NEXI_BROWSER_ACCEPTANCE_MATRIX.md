# NEXI Completion and Browser Acceptance Matrix

**Status:** Current production browser-acceptance contract
**Authority reconciliation date:** 2026-10-25 (UTC); requirements lineage began 2026-09-25.
**Browser workflow owner:** paired Codex session using Chrome DevTools MCP with `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance`.
**Completion decision:** current owner directive and directly verified source, deployed runtime and browser evidence; the old ledger is historical.

**Release-time observation (2026-10-29):** Backend/Public/Admin release `7e434daab146fe9c297c04e46ba9d4a0ee81401d`; Public Next build ID `UuQn8Dl0W2IZdV4BFjvSA`. At the release/browser observation, free space was 2.1 GiB and services remained healthy. Chrome DevTools MCP connected to the existing profile without a browser restart. Public Dashboard and Margin read-only UI are partially browser-verified: dashboard market data loaded; Margin APIs returned 200 and the workspace showed no positions and a disabled order action, but it also showed `Market data error` / `Chart updates paused` despite successful market-data HTTP responses. No financial action occurred. Admin's stale Messages view had 401s; after cache-bypassing reload, `/admin/me` returned 401 and the sign-in form appeared. Admin acceptance requires owner sign-in. Other product journeys and owner acceptance remain open; do not reuse older browser observations as proof for this release.

**Scope note (2026-10-29):** The browser observations above are the recorded partial proof for this release. The current owner follow-up is documentation reconciliation and disk cleanup only; no additional browser acceptance is part of that task. The latest available disk reading is 2,409,308 KiB (2.30 GiB); see `tasks/evidence/nexi-doc-reconciliation-storage-cleanup-20261029.md`.

This document defines what browser evidence must prove. It does not own runtime architecture, completion status, or deployment authority.

For MCP setup, the session-observed tool catalog, Chrome DevTools workbench panels, and extension workflows, follow the [NEXI Chrome DevTools MCP guide](NEXI_CHROME_DEVTOOLS_MCP_GUIDE.md). The Chrome DevTools MCP registration enables extension tools with `--categoryExtensions`; restart Codex after changing that flag and verify actual tool exposure before use.

## Production target

Browser acceptance for NEXI completion must exercise:
- deployed Public: `https://www.nexitrading.app`;
- real backend: `https://api.nexitrading.app`;

A local standalone frontend, mock backend, disconnected fixture, or VM-local NestJS process cannot prove end-to-end production behavior.
## Acceptance owners

- Chrome DevTools MCP reads the active CDP port and WebSocket path from the existing profile's `DevToolsActivePort` file. Configure Codex with `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance`; do not hardcode its current port. This follows the [official Chrome DevTools MCP project](https://github.com/ChromeDevTools/chrome-devtools-mcp) connection modes. Port 5858 was a stale MCP target. Polypane/5859 is retired for this workflow.
- Reuse the owner's existing Chrome profile and whichever wallet the owner specifies. The current owner-reported Public wallet is already unlocked in MetaMask. If Public auth is needed, use NEXI's wallet chooser and complete only the expected SIWE sign-in message after checking its origin, account, domain/URI, chain, nonce and statement.
- Chrome DevTools MCP supports DOM, network, console, response-header and viewport diagnostics in the actual session.
- Use the existing Chrome profile through Chrome DevTools MCP for both the site and any MetaMask page already exposed in that browser. Use `list_pages`, `select_page`, and a fresh `take_snapshot` when MetaMask is listed. Do not switch to Playwright MCP or another browser-control tool, and do not navigate directly to a `chrome-extension://` URL. If the MetaMask approval is not exposed to the current DevTools session, stop at that prompt and record the browser-control boundary; never claim authentication completed.
- D1/Ledger correctness requires separate backend evidence; a browser screenshot does not prove accounting.

## Public coverage

Cover every applicable Public product path before owner manual acceptance:
Dashboard/Quotes Hub; Asset Detail; Spot/Margin; Options/Binary; Wallet; Earn/Mining; Loans; Support; Announcements; Learn; Messages; Settings.

Consumer market status vocabulary is `Live | Error | Closed`. Internal provider/recovery states may be richer but should not leak into ordinary consumer UI.
## Interaction and responsive coverage

For affected surfaces verify:
- 320 / 360 / ~390 / 412-430 mobile widths;
- representative tablet and desktop;
- short-height mobile where primary actions/dock interaction is material;
- no persistent horizontal page overflow;
- safe-area and dock clearance;
- loading / loaded / legitimate empty / error / retry / recovery states;
- keyboard/focus/semantic accessibility where applicable;
- no material framework overlay or relevant unexplained console/runtime error.

For trading paths verify Active Pair continuity, chart/timeframe behavior, Spot/Margin mode, Options/Binary state, order/depth/trades surfaces, reconnect/recovery where applicable, and truthful disabled/unavailable states.
## Identity-dependent coverage

Use controlled test identities where safe:
- controlled browser wallet for SIWE/session and protected wallet flows;
- controlled Admin identity for RBAC/protected Admin actions.

Do not weaken auth gates, use real funds, expose private keys, or fabricate balances/state to make browser tests pass. An owner deferral remains explicit and does not count as acceptance.

## Evidence record

Record only evidence needed to support the claim:
- deployed source/release identity;
- target URL + real backend target;
- verified Chrome DevTools MCP session, selected wallet connector (MetaMask when owner-selected), redacted account match and actual CSS viewport;
- tested flow and expected result;
- actual result;
- material network/console/runtime errors;
- screenshots/video when useful;
- defect classification;
- post-repair confirmation.

Browser evidence does not prove ledger correctness, financial invariants, authorization correctness, durable-state ownership, or accounting truth. Those require backend/domain evidence.

## Codex browser session recovery and DevTools workflow

The owner reports that the current Admin and Public sessions are already signed in. On 2026-10-25, the active Chrome profile was inspected: after a page reload, Admin showed the sign-in form with both saved fields populated; clicking **Sign in** returned to the Messages UI, and the sign-in gate disappeared. Chrome DevTools recorded `GET /admin/me` 200 and protected Admin Messages/moderation requests 200. On Public Wallet, the connected account control was visible; DevTools recorded `GET /auth/me`, `/wallet/overview`, and `/wallet/activity` as 200. No credential values were read and no new wallet signature was requested.

### Admin session

When `https://admin.nexitrading.app` shows the NEXI Admin **Sign in** form after a refresh, the owner reports the browser has saved the Admin username and password. Confirm the exact Admin origin, use the saved/autofilled fields, and click **Sign in**. The form uses browser username/current-password autocomplete and posts to `/admin/auth/login`; after reload, the Admin UI loads identity from `/admin/me`. In the 2026-10-25 recovery, `/admin/me` returned 200, and protected Messages and moderation reads returned 200. Do not read, copy, echo, or store the credentials or returned access/refresh tokens. If the saved fields are absent or the origin differs, stop and ask the owner; do not guess credentials.

### Public MetaMask SIWE session

Distinguish three states: MetaMask being unlocked is local wallet readiness; connecting gives NEXI permission to see the selected account; signing the SIWE message authenticates that account to NEXI. Do the following in the owner's existing Chrome profile on `https://www.nexitrading.app`:

1. Check the Public wallet control. A shortened account button with **Disconnect wallet** means the account is already connected and authenticated when `/auth/me` succeeds; do not click it because that logs out and disconnects. A **Verify wallet** button means a wallet is connected but the NEXI session needs verification. **Connect** means no wallet is currently connected.
2. If the button is **Verify wallet** or **Connect**, activate it. In **Choose an Ethereum wallet**, select **MetaMask** and verify that the wallet request identifies `www.nexitrading.app`. If the browser click targets another row or opens a different wallet, cancel that provider request and retry by keyboard-focus navigation. If MetaMask asks to connect, choose the owner's intended account and approve only the connection request. When the current connector is already MetaMask and connected, select its **Connected** row to continue verification. If the prompt is in the extension side panel, check the current Chrome DevTools MCP `list_pages` result; select the MetaMask page and take a fresh snapshot only when it is exposed there. If it is not exposed, stop and report that boundary rather than switching tools or claiming success.
3. MetaMask then displays the NEXI sign-in message. Check the site origin and message domain/URI are `www.nexitrading.app` / `https://www.nexitrading.app`, the account matches the intended MetaMask account, the chain is Ethereum Mainnet (chain ID 1), and the message has a fresh nonce/expiry and says NEXI sign-in. Approve only the message signature. This SIWE signature is an off-chain login; it is not a transaction and should not request gas, token approval, or funds.
4. The application calls `POST /auth/wallet/challenge`, asks the selected connector to sign the returned message, sends it to `POST /auth/wallet/verify`, stores the returned session, then loads `GET /auth/me`. Confirm `/auth/me` returns 200 and the wallet button changes to the shortened account with **Disconnect wallet**. If a prompt is rejected, the account/network changes, or verification fails, stop and report the visible error; do not retry blindly.

On 2026-10-26, this workflow was re-tested after the owner reported signing out. The page still had an active session, so the app's **Disconnect wallet** control was used first; after the MetaMask site connection and separate SIWE confirmation, `/auth/wallet/challenge` and `/auth/wallet/verify` returned 201, `/auth/me`, `/wallet/overview`, and `/wallet/activity` returned 200, and the account button showed the expected masked address. The live receipt records the exact scope and evidence: [Public MetaMask SIWE browser authentication](../../tasks/evidence/nexi-public-wallet-siwe-20261026.md).

Production client configuration selects Ethereum Mainnet; the server also enforces its configured wallet-auth chain/domain/URI policy.

Before approving the wallet message, check that the request came from `https://www.nexitrading.app`, names the expected account, has the matching NEXI domain and URI, the expected production chain, a fresh nonce/expiry, and a clear NEXI sign-in statement. The supplied screenshot shows MetaMask's “Sign-in request” for `www.nexitrading.app`, “Sign in to NEXI”, and “Estimated changes: No changes”; recheck the live prompt each time because that display does not make an unexpected request safe. SIWE authenticates an Ethereum account to an off-chain service by signing a standard message with session details and replay protection ([EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)); MetaMask documents `personal_sign` as simple message signing commonly used by SIWE ([MetaMask sign-data guide](https://docs.metamask.io/metamask-connect/evm/guides/sign-data/)). NEXI source calls the wallet's `signMessage` method and sends the resulting signature to its authentication endpoint. This is not an on-chain transaction, order, deposit, withdrawal, transfer, or token allowance. Still inspect the actual prompt: reject transactions, spending/approval requests, unrelated typed-data, mismatched domain/account/chain, or any unexpected message. Authentication is not side-effect-free: on first use, the server can create the Public wallet user/account state and establish a session. Treat it as an explicitly authorized identity action and never as evidence that a financial workflow passed.

### Chrome DevTools and installed extensions

1. Verify `codex mcp get chrome-devtools` shows `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance`; the explicit profile path makes autoConnect read that profile's active `DevToolsActivePort` endpoint instead of Chrome's default profile. Chrome's `chrome://inspect/#devices` target-discovery entries (including `localhost:9222` and `localhost:9229`) do not configure the MCP client and should not be changed to 5858. If the registration changes, restart Codex to reload its MCP subprocess. Then call `list_pages`, confirm the existing signed-in page titles/origins, and `select_page` for the exact Public or Admin origin. Preserve the existing profile and unrelated tabs.
2. Use `take_snapshot` and `take_screenshot` before the action. For session recovery, inspect the visible gate/form and accessible button names; do not use page scripts to bypass the UI.
3. In **Network**, enable **Preserve log**, filter Fetch/XHR, perform only the requested sign-in, and record the relevant endpoint, method, status and timing. `list_network_requests` is enough for routine sequence/status proof; use `get_network_request` only for a specific failure after confirming sensitive request/response fields will not be copied. For Public, inspect challenge → verify → `/auth/me` order. For Admin, inspect `/admin/auth/login` then `/admin/me`. Redact credentials and sensitive payloads; status/route evidence is sufficient.
4. Use `list_console_messages`/`get_console_message` for relevant errors, `get_css_styles` for a specific visual issue, `lighthouse_audit` for scoped accessibility/performance checks, and `performance_start_trace`/`performance_stop_trace` only when timing/rendering is in scope. Use already-installed React Developer Tools **Components/Profiler** or Accessibility Toolkit panels when they answer the specific UI question. Open the MetaMask extension panel only to handle/inspect the owner-approved NEXI prompt; do not inspect account secrets or change accounts/network without authorization.
5. Verify the resulting signed-in UI and the relevant identity endpoint, then record the origin, viewport, endpoint/status sequence, console findings, and whether the evidence is owner-reported, browser-observed, or source-derived. Do not expose cookies, local/session-storage values, auth headers, credentials, wallet signatures, seed phrases, or private keys. Do not install or disable extensions as part of routine testing.
## Current completion snapshot — 2026-10-25

At reconciliation start, documentation `main`/`origin/main` was `52985f50dcc38ec0e40446ace51928d8e9515a54`. The published application source and all three deployed application identities remain `ace72accfe815abf5ba20df26ee57c76898d0cab`; this acceptance update is documentation-only. These are separate source and deployed identities. The rows below reuse dated receipts at their stated scope; they are not a claim that every journey was re-executed in this snapshot.

| Domain | Status | Evidence boundary and exact next action |
|---|---|---|
| Authentication and wallet connection | VERIFIED | On 2026-10-25, after saved-form Admin sign-in, `/admin/me` and protected Admin Messages/moderation reads returned 200. A fresh live Public MetaMask flow approved the NEXI site connection and expected SIWE message; `/auth/wallet/challenge` and `/auth/wallet/verify` returned 201 and `/auth/me` returned 200. This verifies the connection/sign-in path and session read only; it does not close unrelated product-flow rows. |
| Dashboard and quotes | VERIFIED_UNCHANGED | Reuse the recorded Dashboard search/responsive and quote rendering slices. Recheck only if source or release identity changes. |
| Market ingestion, charts and asset detail | NEEDS_TARGETED_PROOF | Existing BTC, XAUUSD, GBPUSD and AAPL browser slices are partial; freshness/reconnect and remaining asset classes are not established. Next: one bounded current runtime freshness/reconnect check for the affected market path; do not reopen accepted closed-market behavior. |
| Spot | NEEDS_TARGETED_PROOF | Browser showed book/trades empty state and unavailable balance; no order was placed. Next: use an already authorized controlled identity for the remaining order journey, or record the identity blocker. |
| Margin | NEEDS_TARGETED_PROOF | Source and disposable-SQLite recovery tests are reusable; no complete current authenticated browser lifecycle is recorded. Next: targeted authorized test identity/position proof; no real funds. |
| Binary | VERIFIED_UNCHANGED | Existing focused tests and bounded authenticated runtime open/settle/history receipt remain valid for their scope. Eligible-position Admin inspector is still unproven; next requires an eligible controlled fixture. |
| Wallet deposit | VERIFIED_UNCHANGED | Existing route/auth and source tests remain scoped; no current deposit lifecycle or settlement claim. Next: only if owner requires live economic acceptance, use a sanctioned test identity and reconcile Ledger/Activity/Outbox. |
| Wallet withdrawal | OWNER_ACCEPTED_UNTESTED | Explicit owner closure applies to the four backend gates, not a passed test. Security/network/request/Admin settlement remains untested; reopen only on owner direction or contradictory evidence. |
| Transfer | VERIFIED_UNCHANGED | Reuse existing focused source/disposable-SQLite evidence only. No new live transfer was run; live economic proof requires an authorized controlled identity and before/after Ledger/Activity/Outbox reconciliation. |
| Convert | VERIFIED_UNCHANGED | Existing quote/accept/idempotency source and local acceptance receipts remain scoped. No new live conversion was run; any live economic proof needs explicit owner scope and controlled identity. |
| Mining / Earn | OWNER_ACCEPTED_UNTESTED | Mining plan/fund/subscribe/replay/cancel had bounded live HTTP proof; maturity/accrual/redeem remains explicitly owner-accepted but untested. Reopen only on owner direction or contradictory evidence. |
| Loans | OWNER_ACCEPTED_UNTESTED | Plan-list proof exists; real collateral, Admin approval and repayment remain explicitly owner-accepted but untested. Reopen only on owner direction or contradictory evidence. |
| Ledger | OWNER_ACCEPTED_UNTESTED | Ledger/accounting acceptance remains explicitly owner-accepted but untested; no ledger or financial tests were rerun in this continuation. Reopen only on owner direction or contradictory evidence. |
| Admin configuration | ACCEPTED | Support contact fixture was saved/read back/rendered, changed without deployment, rejected when invalid, and cleared. `frontend.edit` role mapping was checked; separate restricted-role live API denial was not exercised. Real values are a future Admin task. |
| Admin financial administration | NEEDS_TARGETED_PROOF | Super Admin Messages and bounded Admin workspace pages were observed. Lower-role denial and eligible Binary position inspection require an existing authorized lower-role identity/fixture. |
| Announcements | VERIFIED_UNCHANGED | TEST_ONLY announcement unpublish/readback and Public absence are recorded. No new publication mutation is needed. |
| Learn | VERIFIED_UNCHANGED | Admin ACTIVE→INACTIVE category update/readback and Public empty category result passed after deployed fix. No new data mutation is needed. |
| Support | ACCEPTED | Help content retained; active ticket flow absent. Contacts are empty after fixture cleanup; both icons hide while chat/help remain. |
| Messages | NEEDS_TARGETED_PROOF | Public→Admin→Public same-thread exchange, reload, attachment round-trip, and unauthenticated denial are browser-verified. Different-customer attachment denial, browser idempotent replay, and restricted-role live denial remain open. The last recorded Public session needed reauthentication; the owner now reports both sessions signed in, but this documentation update did not verify the live browser. |
| Notifications | VERIFIED_UNCHANGED | Existing four-control rendering and keyboard tab interaction at 440×956 are recorded. Delivery semantics/persistence are not established by that UI slice. |
| Public/Admin realtime | NEEDS_TARGETED_PROOF | Socket.IO polling returned 200; no pushed event or reconnect sequence was verified. Next: use an authorized controlled session and verify a durable change is observed after reconnect. |
| Responsive UI | NEEDS_TARGETED_PROOF | Multiple Public widths and Admin mobile navigation have bounded proof; this is not a full product/viewport sweep. Next: target only affected routes at the required widths and record actual viewport/overflow. |
| Operational readiness and release monitoring | RUNTIME_VERIFIED | Latest post-cleanup check: three services active, API READY with SQLite/Redis, Public Support and Admin Messages routes 200. Sentry issue listing for `ace72…` returned 403, so current error count is unknown; owner must grant issue-read access for that query. |
| Database recovery / independent restore | BLOCKED | On-host backup evidence exists; independent encrypted off-VPS full restore still lacks an approved destination and independent key custody. Next: owner supplies both, then run the authorized isolated restore procedure. |
| Dependency security | SOURCE_FIXES_PENDING_RELEASE | Fresh source-lock `npm audit --omit=dev` results: Backend 7 findings (2 high, 4 moderate, 1 low); Public 21 (12 high, 9 moderate); neither has a critical finding. Source locks now select Multer 2.5.0 and Sentry 10.75.2. Deployed shared stores remain Multer 2.4.0 and Sentry 10.73.0, so the fixes are not deployed. Admin lock is at TanStack React Start 1.169.1, start-server-core 1.169.42, Seroval 1.6.9; current artifact evidence shows its server-function error handler matches the patched package implementation. The October 25 third-party scan had an unverified SHA and stale package versions; it is not current release proof. Residual source audit chains remain under review; see `tasks/evidence/nexi-security-dependency-triage-20261025.md`. |
| Synthetic Support acceptance data | OWNER_DECISION_REQUIRED | Conversation `3ecc85a9-c243-4da3-bde0-a24bdf532e8f` and `nexi-support-acceptance-ace72ac.png` remain in production. Next: owner chooses retention or exact cleanup through supported Admin operations; no direct SQL deletion. |

**Maintenance runtime update — 2026-10-25:** After authorized systemd alignment, all three active service processes resolve to `/opt/nexi/runtime/node-v24.21.0/bin/node` with zero restarts. `https://api.nexitrading.app/readyz` returned READY (SQLite and Redis true), Public `https://www.nexitrading.app/dashboard` returned 200, and Admin `https://admin.nexitrading.app/overview` returned 200. Existing Chrome DevTools evidence showed Public `/auth/me`, `/wallet/overview`, `/wallet/activity`, and Socket.IO/config requests reaching the canonical API with 200 responses. Admin Messages reached its protected API routes but returned 401 in the observed browser session; authenticated Admin behavior is therefore not established by this maintenance check. This updates service/runtime health only and does not close product acceptance rows. See `tasks/evidence/nexi-final-vm-consolidation-20261025.md`.

**Browser session recovery update — 2026-10-25:** Following the owner’s clarification that both profiles were signed in, the Admin saved Sign in form was submitted on the exact Admin origin. The Messages UI rendered; `GET /admin/me` and protected Admin Messages/moderation reads returned 200. Public Wallet displayed the connected account control; DevTools recorded `GET /auth/me`, `/wallet/overview`, and `/wallet/activity` as 200. The earlier 401 observation describes the prior expired session and is superseded for the endpoints checked here. No credential values were read and no wallet signature was requested. The Public DevTools console also showed one untriaged promise error; it was not tied to authentication in this bounded pass.

**MetaMask/SIWE workflow check — 2026-10-25:** After the owner signed out, the live Public page showed **Connect**. The NEXI wallet chooser listed MetaMask and Coinbase Wallet. The initial mouse click hit the Coinbase row unexpectedly; its unopened connection was cancelled without approval. Retried using keyboard focus, selected MetaMask, and inspected its requests. MetaMask first asked to connect Account 1 to `www.nexitrading.app`; that connection was approved. It then showed a distinct SIWE **Sign-in request** for `www.nexitrading.app`, URL `https://www.nexitrading.app`, Ethereum/chain ID 1, Account 1, message “Sign in to NEXI,” and “Estimated changes: No changes.” The message was confirmed. Network evidence: `/auth/wallet/challenge` 201, `/auth/wallet/verify` 201, then `/auth/me` 200; the page displayed the shortened connected account with **Disconnect wallet**. No transaction, funds transfer, approval, or other financial action occurred. The focused `wallet-siwe.test.mjs` suite also passed all five checks under pinned Node 24.21.0, including challenge → selected-account signing → verification order, chain/account mismatch rejection, rejected-signature handling, and backend verification failure.

`OWNER_ACCEPTED_UNTESTED` records an explicit decision to close a work gate, not a passed test. `NEEDS_TARGETED_PROOF`, `BLOCKED`, and `OWNER_DECISION_REQUIRED` rows name their next action above. `ACCEPTED` is limited to the stated technical feature scope. Final NEXI-wide owner acceptance remains open.

## Current handoff rule

Current owner acceptance and direct browser/runtime evidence own live pass/fail state; the retired ledger is historical only. This matrix intentionally does not duplicate transient results.

## Production-hardening continuation — 2026-10-25

Live recheck at source `92ca9b8d489f0e199a9cf3756e58a374ec54da0b` found `origin/main` equal to `HEAD`; `.codex/AGENTS.md` remains an unrelated owner edit. Backend, Public, and Admin services were active; `https://api.nexitrading.app/readyz` returned `READY` with SQLite and Redis true. Root filesystem had 2,369,769,472 bytes available (96% used). Runtime artifact markers for all three apps remained `ace72accfe815abf5ba20df26ee57c76898d0cab`; this does not identify the newer documentation source commit as deployed.

The authenticated Public browser session was unavailable: `/dashboard/messages` showed sign-in required and `/auth/me` returned 401. No credentials or signature were used. Consequently the remaining browser checks are still open: cross-customer attachment denial, browser idempotent retry, restricted-role Admin save denial, and pushed-event/reconnect behavior. An authenticated customer session and an existing restricted Admin test identity are required; no identity was invented or elevated. The synthetic conversation `3ecc85a9-c243-4da3-bde0-a24bdf532e8f` and attachment `nexi-support-acceptance-ace72ac.png` remain untouched pending owner disposition.

Dependency reachability review confirmed Backend lock findings `body-parser@2.3.0` (GHSA-27r3-jxmh-p828), `engine.io@6.6.5` (GHSA-r635-g3xr-vw7x and GHSA-2gc4-cqfq-p2gv), and `socket.io-parser@4.2.5` (GHSA-2m8v-j782-fhvr) are on unauthenticated HTTP/realtime ingress. The official advisories identify patched releases `body-parser@2.4.0`, `engine.io@6.6.10+`, and `socket.io-parser@4.2.7+`. A lock-only update trial with the canonical Node 24/npm 11 toolchain selected those versions but rewrote 875 lines, including unrelated optional/dev metadata. That generated lock diff was discarded because it was not a reviewable minimal correction; no package or runtime dependency was changed. Do not treat the trial as a repair. Next action: prepare a narrowly reviewed, lockfile-consistent dependency resolution, test it with the Backend runtime toolchain, then release only Backend if its committed lock and build verify. Public's critical Sentry advisory requires `tunnelRoute`, which is absent; current connector/source paths did not establish affected Zod, Axios, or redirect options as reachable. Admin's sole canonical-lock high finding is Zod's large-array parser path; the inspected route accepts a small enum query, so no upgrade is justified without compatibility proof. These are bounded reachability findings, not a zero-vulnerability conclusion.

Backup review found only an older host-local logical SQL archive (`pre0016-sqlite.sql.zst`); the prior dated receipt records archive integrity and a limited Loan-table restore only. No automated NEXI backup schedule, off-site target, independent encryption-key custody, or full isolated restore of the active SQLite database with WAL-consistent state and `/var/lib/nexi/storage` objects was evidenced. The active DB is about 13.5 GiB, larger than current free space, so no local copy was attempted. Exact next action: owner selects an approved off-site destination, RPO/RTO/retention, and an independently custodied key; then implement monitored encrypted backup and prove full DB-plus-object restore in an approved isolated target.

Sentry issue listing remains blocked by HTTP 403 for the current `org:ci` token. Official Sentry API permission documentation identifies `event:read` as the minimum read scope for listing organization issues; the token also needs membership/access to the NEXI project. No further endpoint probing or credential reuse was attempted. The owner must grant that scope or provide an authorized read-only token.

The four Mining, Loan, Withdrawal, and Ledger gates remain `OWNER_ACCEPTED_UNTESTED`; no associated tests or financial operations were reopened. No app source correction was committed or released in this continuation.
