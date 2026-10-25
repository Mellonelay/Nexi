# NEXI Completion and Browser Acceptance Matrix

**Status:** Current production browser-acceptance contract
**Authority reconciliation date:** 2026-10-25 (UTC); requirements lineage began 2026-09-25.
**Browser workflow owner:** paired Codex session using Chrome DevTools MCP at `127.0.0.1:5858`.
**Completion decision:** current owner directive and directly verified source, deployed runtime and browser evidence; the old ledger is historical.

This document defines what browser evidence must prove. It does not own runtime architecture, completion status, or deployment authority.

## Production target

Browser acceptance for NEXI completion must exercise:
- deployed Public: `https://www.nexitrading.app`;
- real backend: `https://api.nexitrading.app`;

A local standalone frontend, mock backend, disconnected fixture, or VM-local NestJS process cannot prove end-to-end production behavior.
## Acceptance owners

- Chrome DevTools MCP on CDP port 5858 is the current live-browser route. Polypane/5859 is retired for this workflow.
- Recover the existing authenticated Coinbase Wallet and verify real SIWE signatures before protected Public flows.
- Chrome DevTools MCP supports DOM, network, console, response-header and viewport diagnostics in the actual session.
- The old standalone Chrome/MetaMask route and duplicated Playwright campaigns are historical, not current test authority.
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
- verified Polypane/DevTools session, Coinbase Wallet identity and actual CSS viewport;
- tested flow and expected result;
- actual result;
- material network/console/runtime errors;
- screenshots/video when useful;
- defect classification;
- post-repair confirmation.

Browser evidence does not prove ledger correctness, financial invariants, authorization correctness, durable-state ownership, or accounting truth. Those require backend/domain evidence.
## Current completion snapshot — 2026-10-25

At reconciliation start, documentation `main`/`origin/main` was `52985f50dcc38ec0e40446ace51928d8e9515a54`. The published application source and all three deployed application identities remain `ace72accfe815abf5ba20df26ee57c76898d0cab`; this acceptance update is documentation-only. These are separate source and deployed identities. The rows below reuse dated receipts at their stated scope; they are not a claim that every journey was re-executed in this snapshot.

| Domain | Status | Evidence boundary and exact next action |
|---|---|---|
| Authentication and wallet connection | NEEDS_TARGETED_PROOF | Prior SIWE/read and refresh proofs remain scoped. Current Public Messages `/auth/me` returned 401; owner must reauthenticate the existing customer session if protected browser checks continue. No signature was made. |
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
| Admin configuration | ACCEPTED | Support contact fixture was saved/read back/rendered, changed without deployment, rejected when invalid, and cleared. `frontend.edit` role mapping was checked; separate restricted-role live API denial was not exercised. Real values are a future Admin task. |
| Admin financial administration | NEEDS_TARGETED_PROOF | Super Admin Messages and bounded Admin workspace pages were observed. Lower-role denial and eligible Binary position inspection require an existing authorized lower-role identity/fixture. |
| Announcements | VERIFIED_UNCHANGED | TEST_ONLY announcement unpublish/readback and Public absence are recorded. No new publication mutation is needed. |
| Learn | VERIFIED_UNCHANGED | Admin ACTIVE→INACTIVE category update/readback and Public empty category result passed after deployed fix. No new data mutation is needed. |
| Support | ACCEPTED | Help content retained; active ticket flow absent. Contacts are empty after fixture cleanup; both icons hide while chat/help remain. |
| Messages | NEEDS_TARGETED_PROOF | Public→Admin→Public same-thread exchange, reload, attachment round-trip, and unauthenticated denial are browser-verified. Different-customer attachment denial, browser idempotent replay, and restricted-role live denial remain open. Public session currently needs owner reauthentication. |
| Notifications | VERIFIED_UNCHANGED | Existing four-control rendering and keyboard tab interaction at 440×956 are recorded. Delivery semantics/persistence are not established by that UI slice. |
| Public/Admin realtime | NEEDS_TARGETED_PROOF | Socket.IO polling returned 200; no pushed event or reconnect sequence was verified. Next: use an authorized controlled session and verify a durable change is observed after reconnect. |
| Responsive UI | NEEDS_TARGETED_PROOF | Multiple Public widths and Admin mobile navigation have bounded proof; this is not a full product/viewport sweep. Next: target only affected routes at the required widths and record actual viewport/overflow. |
| Operational readiness and release monitoring | RUNTIME_VERIFIED | Latest post-cleanup check: three services active, API READY with SQLite/Redis, Public Support and Admin Messages routes 200. Sentry issue listing for `ace72…` returned 403, so current error count is unknown; owner must grant issue-read access for that query. |
| Database recovery / independent restore | BLOCKED | On-host backup evidence exists; independent encrypted off-VPS full restore still lacks an approved destination and independent key custody. Next: owner supplies both, then run the authorized isolated restore procedure. |
| Dependency security | NEEDS_TARGETED_PROOF | Current production audits: Backend 14 high/0 critical; Public 17 high/1 critical/9 moderate; canonical Admin pnpm lock 1 high. Public critical is conditional on Sentry tunnel routing, absent in current source. Next: review current package paths/reachability and compatible fixes in bounded batches; do not bulk-upgrade. |
| Synthetic Support acceptance data | OWNER_DECISION_REQUIRED | Conversation `3ecc85a9-c243-4da3-bde0-a24bdf532e8f` and `nexi-support-acceptance-ace72ac.png` remain in production. Next: owner chooses retention or exact cleanup through supported Admin operations; no direct SQL deletion. |

`OWNER_ACCEPTED_UNTESTED` records an explicit decision to close a work gate, not a passed test. `NEEDS_TARGETED_PROOF`, `BLOCKED`, and `OWNER_DECISION_REQUIRED` rows name their next action above. `ACCEPTED` is limited to the stated technical feature scope. Final NEXI-wide owner acceptance remains open.

## Current handoff rule

Current owner acceptance and direct browser/runtime evidence own live pass/fail state; the retired ledger is historical only. This matrix intentionally does not duplicate transient results.
