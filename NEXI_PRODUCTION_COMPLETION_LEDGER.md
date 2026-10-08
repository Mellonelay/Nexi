# NEXI Production Completion Ledger

**Authority date:** 2026-10-06 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Current source authority:** GitHub `main` (discover live; do not freeze this ledger to a historical SHA)
**Current product/runtime split:** verified pre-build source implementation frontier `9fa600243cf7e57bbb60b22413debc1c64f6c7c2` (Public `2d41d40...`, Binary `ff80eb3...`, Worker `9fa6002...`); deployed Public RELEASE_SHA remains `5aafc0ff74cd715a77de3bc22d96603dbc2c4943` in real `/srv/nexi/public/current`, active with dashboard HTTP 200. This documentation revision may be newer than the implementation frontier after Git fan-in. P04/53-icon/geometry scoped proof is retained; broader E2E/owner acceptance remains open. Admin/backend release identities retain dated provenance; Cloudflare health/readiness currently pass.
**Purpose:** the single final-production completion controller for NEXI. This is a finishing-state ledger, not a restart plan.

## 0. Active production closure controller — owner correction 2026-09-20

This section is the **active execution queue** and supersedes older statements that only wallet/SIWE and privileged Admin remain.


### 0.1 Whole-product completion order — owner decision 2026-10-03

**Owner objective:** finish the entire current production-completion program today without silently dropping any active row. “Today” is an execution priority, not permission to weaken evidence, fabricate a PASS, bypass identity/authorization, or replace the causal owner with a shortcut.

This file remains the **single writable completion controller**. Do not create another competing completion ledger. NEXI_CURRENT_STATE.md remains durable current truth; /home/mellonelay1999/.agents/BROWSER_FABRIC.md owns browser-tool responsibility only.

Execution order:
1. **Reconcile truth first.** Read this Section 0, NEXI_CURRENT_STATE.md, current GitHub main, live Worker-0/release state, and the current browser-fabric contract. Update stale row narratives before implementation.
2. **Public/frontend closure next.** The existing frontend Work session is the primary owner for the Public P-* rows and product-visible frontend changes. It must consume this ledger first, then close the current Public product/reference defects and the remaining Public E2E rows. The completed responsive/mobile geometry proof is reused and must not be restarted without contradictory evidence.
3. **Market/backend closure.** After the Public slice is closed or a demonstrated Public failure is routed to its backend causal owner, continue A-08 and the open M-* rows. The broad non-crypto stale/session-hours investigation remains deferred unless a fresh product-visible defect makes it causal.
4. **Identity + protected financial/trading closure.** Reuse the preserved authenticated wallet state. Close I-* and F-* through the canonical NestJS -> D1/Ledger/EventOutbox paths. A documentation or browser task does not itself authorize a financial transaction.
5. **Earn/Loans + communications/settings.** Close E-* and C-* with real Public -> backend -> durable read-back paths and truthful unavailable/error states.
6. **Admin closure.** Close AD-* through the separate Admin plane and canonical backend authority. Privileged mutations require the appropriate controlled Admin identity/authorization.
7. **Async/reliability closure.** Close R-* with affected-domain evidence for EventOutbox, Queue retry/delivery, Workflows, Valkey/Socket.IO recovery and duplicate/retry/concurrency safety.
8. **Final gates.** Reconcile Z-01/Z-02/Z-03 and only then perform Z-04 owner final acceptance.

**Frontend-session ownership boundary:** frontend owns Public source/render; backend/Admin own configuration/financial truth. Polypane-first product testing; Chrome5858 only distinct MetaMask/session proof. Never hardcode backend truth.

**Browser path for this slice:** Polypane31 FIRST via DevTools CLI/MCP5859, never Playwright. Reuse learning artifacts; Chrome5858 only distinct MetaMask/session proof. Canonical deterministic gates, GitHub main, exact-SHA deployment, then changed-behavior proof.

**Current Public product/reference defects that must be recorded before further frontend implementation:**
- P-01: 2026-10-04: all 53 production asset icons loaded and passed rendered identity/quality inspection in existing Polypane5859 at 320x568 (17 Crypto, 7 Metals, 9 Forex, 20 Stocks). Corrected Ethereum Classic/Solana captures were separately inspected. Receipt: /home/mellonelay1999/nexi-phase-receipts/p01-rendered-20261004/rendered-identity-receipt.json. This closes icon proof only; Quotes interaction/data/favorites E2E and owner acceptance remain open.
- P-02: rail repair deployed6f74ce6; complete trading E2E unproven.
- P-03: production still returns an empty Binary config while D1 has 85 enabled rows across five durations. Owner approval now selects `binance-spot` as crypto Binary settlement authority; source commit `ff80eb3...` enforces that provider, keeps non-crypto disabled, and leaves D1/Admin authoritative for enabled durations, payout and stake ranges. The 2026-10-04 no-approved-provider result is historical. P-03 remains OPEN_DEFECT until the Git-integrated candidate is promoted through the Cloudflare backend and live config/quote/settlement plus full Binary E2E are proven. Do not hardcode frontend durations/payouts.
- P-04: successful-empty validation and isolated activity-error repair COMPLETE at deployed changed-behavior scope. Broader Wallet acceptance remains open; real-account nonzero-balance isolation is unproven (final real refresh 401).
- P-13: responsive/mobile geometry sub-scope is completed at be50529...; only product/accessibility/provider-choice behavior not already proven remains open.

The accepted visual/reference family is Quotes Hub, Spot/Margin, Options/Binary, wallet chooser and Wallet, adapted to current NEXI runtime truth. Old V2/V3 authority and other superseded September assumptions must not be restored.

After this reconciliation the 62 active rows classify as: **8 COMPLETED, 4 PROVEN_UNCHANGED, 43 NEEDS_FRESH_PROOF, 3 OPEN_DEFECT, 3 AUTOMATION_IDENTITY_REQUIRED, 1 OWNER_FINAL_ACCEPTANCE.** These counts describe proof state, not implementation absence.


### Hard production rules

- GitHub `main` is durable source authority.
- Cloudflare Worker + Container + NestJS is the **only backend runtime/acceptance authority**. A VM-local backend must never count as production proof.
- Public must build/run only through `/srv/nexi/public`; Admin must build/run only through `/srv/nexi/admin`. Random session-local builds or dependency trees are not acceptance evidence.
- ChatGPT Project uploads, chat exports, handovers, and old receipts are historical/provenance sources only when they disagree with current VM/GitHub/Cloudflare evidence.
- `PROVEN + UNCHANGED = REUSE`; do not rebuild working domains merely to re-prove existence.
- The owner does **not** perform manual acceptance until every safely automatable production row below is completed with current evidence.
- Identity-dependent rows should use controlled test wallet/Admin identities when safe. If the owner explicitly defers an identity phase, mark it `OWNER_DEFERRED_IDENTITY`; do not pretend it is accepted.
- A Work session may not claim completion or jump to an unrelated domain until its selected row is updated with proof or explicitly blocked.
- When durable truth changes, update `NEXI_CURRENT_STATE.md`; when durable completion proof changes, update this ledger before reporting completion.
- No Git hook owns this ledger. The ledger itself is the production work queue and proof controller.
- `NEXI_PRODUCTION_COMPLETION_LEDGER.md` is the only writable/canonical completion controller. The DOCX is a generated/historical mirror and must never be edited as a competing authority.

### Status vocabulary for the active queue

- `COMPLETED` — current production evidence proves the row.
- `PROVEN_UNCHANGED` — prior production evidence is still applicable because the governing dependency did not change.
- `NEEDS_FRESH_PROOF` — implementation exists, but current end-to-end production proof is required before owner acceptance.
- `OPEN_DEFECT` — current production evidence shows a real defect.
- `AUTOMATION_IDENTITY_REQUIRED` — can be automated once a controlled identity/session is available.
- `OWNER_DEFERRED_IDENTITY` — explicitly deferred by the owner; not accepted.
- `BLOCKED_EXTERNAL` — blocked by a genuine external dependency with preserved evidence.
- `OWNER_FINAL_ACCEPTANCE` — final owner manual pass only after every required pre-owner row is green.

### Active production closure queue

| ID | Domain | Requirement / acceptance path | Current status | Completion evidence required |
|---|---|---|---|---|
| A-01 | Authority | GitHub `main` is durable source authority | `COMPLETED` | live Git comparison when relevant |
| A-02 | Authority | Cloudflare Worker -> Container -> NestJS is the only backend runtime authority | `COMPLETED` | current production runtime/health |
| A-03 | Public hosting | Public dependency/build/runtime owner is `/srv/nexi/public` | `COMPLETED` | symlink/process/release proof |
| A-04 | Admin hosting | Admin dependency/build/runtime owner is `/srv/nexi/admin` | `COMPLETED` | symlink/process/release proof |
| A-05 | DNS / edge | canonical `www` + Admin route to current Worker-0 origin `34.143.137.221`; legacy app + apex are proxied redirect hosts; API remains Worker custom domain | `COMPLETED` | Latest verified 2026-10-01: Worker-0 IP `34.143.137.221` matched Cloudflare `www` and `admin` A-record targets. Earlier 2026-09-26 edge probes remain historical proof for redirects/health. |
| A-06 | Public/Admin release | Canonical /srv/nexi hosting | `COMPLETED` | Public `/srv/nexi/public/current` is a real directory; service active; RELEASE_SHA `5aafc0ff74cd715a77de3bc22d96603dbc2c4943`, dashboard HTTP 200. Source implementation frontier is `9fa6002`; it is not deployed. Admin retains dated ed26973 proof. |
| A-07 | Backend baseline | Currently deployed Cloudflare backend health/readiness | `COMPLETED` | fresh `/ops/ready`: `status=ready`, `database=true`, `redis=true` after unified promotion |
| A-08 | Backend release | Deployed Cloudflare backend baseline is healthy, but current `main` contains post-`ed26973...` backend Sentry/ENOENT source changes not yet proven deployed | `NEEDS_FRESH_PROOF` | fresh Worker deployment `f41876b3-e8dd-4bf0-8043-61a81ecbb86f`, version `2ef838f5-f96a-4f48-99e2-db9d80dbc0b4`, `/ops/ready` 200; live Binary config empty; current source candidate is not proven deployed |
| M-01 | Market | Exactly 53 canonical NEXI assets remain authoritative | `PROVEN_UNCHANGED` | catalog/API count and identity |
| M-02 | Market | Every asset has explicit provider/source/trading-hours policy | `NEEDS_FRESH_PROOF` | 53-row provider/source classification |
| M-03 | Market | Market freshness is truthful and self-recovering; no silent frozen open-market asset | `OPEN_DEFECT` | open-market soak + forced disconnect/recovery + reasoned closed-market states |
| M-04 | Market | Provider event -> normalization -> D1 quote persistence keeps monotonic sequence | `NEEDS_FRESH_PROOF` | sustained D1/API evidence for affected classes |
| M-05 | Market | Klines `1m/5m/15m/30m/1h/4h/1d` | `PROVEN_UNCHANGED` | rerun only if market/Kline dependency changes |
| M-06 | Market | Realtime reconnect/resnapshot continues authoritative quotes/Klines | `PROVEN_UNCHANGED` | rerun after realtime dependency change |
| M-07 | Market | REST read-back recovery from D1 authority | `PROVEN_UNCHANGED` | rerun after read-path dependency change |
| M-08 | Market | Real depth + executed trades are current and source-backed | `NEEDS_FRESH_PROOF` | production depth/trades provenance |
| M-09 | Market | Long-running reliability/soak across provider thresholds and reconnects | `NEEDS_FRESH_PROOF` | timed evidence with zero unexplained open-market stale rows |
| P-01 | Public | Dashboard / Quotes Hub | `NEEDS_FRESH_PROOF` | 2026-10-04: all 53 production asset icons loaded and passed rendered identity/quality inspection in existing Polypane5859 at 320x568 (17 Crypto, 7 Metals, 9 Forex, 20 Stocks). Corrected Ethereum Classic/Solana captures were separately inspected. Receipt: /home/mellonelay1999/nexi-phase-receipts/p01-rendered-20261004/rendered-identity-receipt.json. This closes icon proof only; Quotes interaction/data/favorites E2E and owner acceptance remain open. |
| P-02 | Public | Spot Trading | `NEEDS_FRESH_PROOF` | 2026-10-05: scoped ripple CSS is deployed at 5aafc0f, but computed/pressed/reduced-motion rendered proof is still OPEN; existing Polypane Spot target is live; its authenticated page was not touched during the active payment flow. CSS is NOT_SCORED by CodeScene; prior zero-eligible safeguard does not establish CSS review.  2026-10-04 production BTC Spot chart renders actual MA(20), EMA(20), EMA(50), RSI(14), canvases and existing indicator/timeframe controls. Spot open orders/margin positions returned401; depth/trades revalidated304. No order or financial action performed. Full Spot/trading E2E remains unproven; owner correction implemented at source only: the six indicator controls now sit in a collapsed native disclosure by default; existing chart series and closed geometry are preserved. Focused ESLint and TypeScript checks passed; Fallow 3.30.0 found no dead-code/duplication/security findings but reported existing complexity and estimated-coverage warnings. CodeScene MCP 1.5.6 review: 10.0, no findings (baseline 10.0). Deployed proof remains open. Receipt: /home/mellonelay1999/nexi-phase-receipts/p01-rendered-20261004/spot-dom.json. |
| P-03 | Public | Options / Binary | `OPEN_DEFECT` | 2026-10-08: source `12e8dee` is pushed and deployed. Canonical pair availability, approved crypto binance-spot quotes and mapped noncrypto quotes are implemented; 339/339 tests and the Nest build pass. Migration 0011 is applied: D1 has 265 canonical configurations plus 15 preserved legacy rows. Worker version b0ae825f and Container version 78 (image 23b72ebe) are active. Live `/binary/config` returns 53 pairs across all five durations; readiness passes at 01:41:42Z. This verifies migration, image promotion and config visibility. Quote/open/expiry/WIN/LOSS/Ledger/outbox/history financial E2E remains unproven. |
| P-04 | Public | Wallet surface/access model | `NEEDS_FRESH_PROOF` | P04 activity repair COMPLETE at deployed changed-behavior scope, source/release 702ee5d. Tests 15/15, TypeScript, lint, 23 render-tree fixtures, canonical build/packaging and Wallet/test CodeHealth 10.0 PASS. Real cached [] rendered EMPTY in Polypane; controlled client-only nonzero wallet fixture plus activity 503 preserved figures and showed activity error. Fixture hook removed. Final real wallet/activity refresh 401; actual nonzero-balance isolation and broader Wallet obligations remain unproven. Receipts: 21809ab6... browser; 1d4b7d78... completion. |
| P-05 | Public | Earn / Mining | `NEEDS_FRESH_PROOF` | deployed end-to-end lifecycle proof |
| P-06 | Public | Loan | `NEEDS_FRESH_PROOF` | deployed end-to-end lifecycle proof |
| P-07 | Public | Support | `NEEDS_FRESH_PROOF` | deployed create/read/reply/state proof |
| P-08 | Public | Announcements | `NEEDS_FRESH_PROOF` | deployed authoritative content proof |
| P-09 | Public | Learn | `NEEDS_FRESH_PROOF` | deployed authoritative content proof |
| P-10 | Public | Messages | `NEEDS_FRESH_PROOF` | deployed messaging/read-state proof |
| P-11 | Public | Settings | `NEEDS_FRESH_PROOF` | deployed preferences/security/settings proof |
| P-12 | Public | Asset Detail + Active Pair continuity + charts | `NEEDS_FRESH_PROOF` | all required assets/timeframes through current backend |
| P-13 | Public | Mobile nav/geometry/accessibility + notification/deposit/provider-choice UX | `NEEDS_FRESH_PROOF` | Geometry/accessibility subphase **COMPLETED** at `be50529b789786fd83d808178f386b015f77b1f3`: authenticated deployed 8-fixture Dashboard matrix, 320/390/landscape 200% text stress, zero tested page/main overflow, narrow-mobile header repair, `NEXI, Open application menu` accessible name, bounded drawer/focus, safe-area propagation, reduced-height search/keyboard focus, and authenticated 320 Options/Wallet/Asset geometry. Remaining P-13 gaps are non-geometry notification/deposit/provider-choice UX and any distinct real-device/cross-browser claim. |
| I-01 | Identity | Wallet-only SIWE challenge/signature/replay/session | `NEEDS_FRESH_PROOF` | Preserved dedicated Worker-0 MetaMask test wallet completed NEXI SIWE on Ethereum chain 1 on 2026-10-02; application wallet verification succeeded and the authenticated browser session persisted through the final geometry acceptance. Replay-protection semantics were not re-exercised in this phase, so the full I-01 contract is not yet marked complete. |
| I-02 | Identity | Wallet balance + protected financial authorization | `AUTOMATION_IDENTITY_REQUIRED` | controlled test wallet/session or explicit owner deferral |
| I-03 | Identity | Privileged Admin auth/RBAC/action | `AUTOMATION_IDENTITY_REQUIRED` | controlled privileged Admin identity or explicit owner deferral |
| F-01 | Financial | Deposit lifecycle | `NEEDS_FRESH_PROOF` | D1/Ledger/activity/audit/outbox read-back |
| F-02 | Financial | Withdrawal lifecycle | `NEEDS_FRESH_PROOF` | authorization/reserve/review/audit/idempotency proof |
| F-03 | Financial | Internal transfer | `NEEDS_FRESH_PROOF` | atomic debit/credit + idempotency/audit proof |
| F-04 | Financial | Conversion | `NEEDS_FRESH_PROOF` | authoritative quote -> execution -> ledger proof |
| F-05 | Trading | Protected Spot/Margin execution and lifecycle | `NEEDS_FRESH_PROOF` | order/trade/ledger/audit/realtime proof |
| F-06 | Financial | Ledger + idempotency + Activity/audit + EventOutbox invariants | `NEEDS_FRESH_PROOF` | focused invariant tests + production-safe read-back |
| E-01 | Product | Earn / Mining backend + Public/Admin control path | `NEEDS_FRESH_PROOF` | complete lifecycle proof |
| E-02 | Product | Loans backend + Public/Admin control path | `NEEDS_FRESH_PROOF` | application/review/repayment/state proof |
| C-01 | Communications | Support | `NEEDS_FRESH_PROOF` | Public/Admin end-to-end proof |
| C-02 | Communications | Messages + notifications | `NEEDS_FRESH_PROOF` | delivery/read-state/retry proof |
| C-03 | Content | Announcements + Learn | `NEEDS_FRESH_PROOF` | Admin-authoritative content -> Public proof |
| C-04 | Settings | Profile/preferences/language/timezone/theme/notifications/security | `NEEDS_FRESH_PROOF` | persisted round-trip proof |
| AD-01 | Admin | User/KYC/referral/VIP controls | `NEEDS_FRESH_PROOF` | privileged workflow proof |
| AD-02 | Admin | Wallet/ledger/deposit/withdrawal controls | `NEEDS_FRESH_PROOF` | privileged workflow + audit proof |
| AD-03 | Admin | Market/provider controls | `NEEDS_FRESH_PROOF` | policy mutation/read-back without duplicate authority |
| AD-04 | Admin | Trading controls | `NEEDS_FRESH_PROOF` | privileged trading control/audit proof |
| AD-05 | Admin | Mining/loan controls | `NEEDS_FRESH_PROOF` | privileged lifecycle proof |
| AD-06 | Admin | Support/messages/content controls | `NEEDS_FRESH_PROOF` | Admin -> backend -> Public proof |
| AD-07 | Admin | Feature flags/maintenance/localization | `NEEDS_FRESH_PROOF` | persisted control + consumer effect proof |
| AD-08 | Admin | Audit/approvals/incidents | `NEEDS_FRESH_PROOF` | immutable audit + permission proof |
| R-01 | Async | EventOutbox durable publication boundary | `NEEDS_FRESH_PROOF` | durable enqueue/publish/read-back evidence |
| R-02 | Async | Queues retry/delivery semantics | `NEEDS_FRESH_PROOF` | 2026-10-08: dedicated DLQs and both existing-Worker consumers active; settings/IDs read back. Four synthetic nonfinancial pushes produced one RECEIVED D1 row per queue. Realtime gateway/outbox7/7 + Worker contracts5/5 pass. Downstream business processing and live failure-to-DLQ recovery remain unproven. |
| R-03 | Async | Workflows orchestration | `NEEDS_FRESH_PROOF` | workflow state/recovery proof |
| R-04 | Realtime | Valkey/Socket.IO delivery and recovery | `NEEDS_FRESH_PROOF` | reconnect/resnapshot/consumer continuity |
| R-05 | Reliability | Duplicate/retry/concurrency safety | `NEEDS_FRESH_PROOF` | focused adversarial tests |
| Z-01 | Gate | All non-owner-context rows above complete or proven unchanged | `OPEN_DEFECT` | zero unresolved required rows |
| Z-02 | Gate | Identity rows completed with controlled identities or explicitly owner-deferred | `AUTOMATION_IDENTITY_REQUIRED` | row-level proof/owner decision |
| Z-03 | Gate | NEXI_CURRENT_STATE.md + this ledger reconciled to latest durable truth | `COMPLETED` | Reconciled 2026-10-06: source implementation frontier9fa6002 versus deployed Public5aafc0f in real current directory; historical P04 release claims dated; owner-approved Binary source candidate separated from unproven Cloudflare deployment; all62 rows and existing scoped geometry/icon/P04 proof preserved. Product E2E/owner acceptance remain open. |
| Z-04 | Gate | Owner manual acceptance | `OWNER_FINAL_ACCEPTANCE` | only after Z-01/Z-02/Z-03 permit it |

### Execution order

1. Preserve all `COMPLETED` / `PROVEN_UNCHANGED` rows and start from the freshest demonstrated failure or missing proof.
2. Preserve canonical Public `www`, API `api`, Admin `admin`. Public responsive/mobile geometry is COMPLETED in Section 29; reuse its deployed proof and do not reopen the former landscape/Quotes slice without fresh contradictory evidence. Resume the next owner-selected unresolved product/platform row; do not repeat wallet/SIWE setup.
3. Close the remaining Public/Admin/backend/financial/async/realtime/communications rows in dependency order, using the deployed production surfaces rather than a local backend substitute.
4. Exercise identity-dependent rows with controlled test wallet/Admin identities when safe; an owner deferral remains explicit and never counts as acceptance.
5. Reconcile this ledger and `NEXI_CURRENT_STATE.md` after each durable proof change.
6. Complete Polypane-first changed-behavior proof via5859; Chrome5858 only distinct MetaMask/session proof. Owner final acceptance later.

### Tool routing for the current frontier

- Market/backend: direct NestJS source + real Cloudflare Worker/Container/D1/Valkey runtime evidence; add Graphify/Fallow/CodeScene/Nest Observe only for their distinct proof classes. A current consumer failure may trigger this lane, but a historical stale count alone does not.
- Public/Admin: canonical /srv/nexi hosting. Polypane FIRST via DevTools5859; Chrome5858 only distinct MetaMask/session proof.
- Get-Fable and Riqor CLI/plugin/owned-hook runtimes were removed by owner decision on 2026-09-30; do not invoke or reinstall them. This file remains the only completion controller; no tool/skill may upgrade a row beyond its actual evidence.


## Historical targeted production verification — 2026-09-26 06:10 UTC

This dated snapshot is not current tool/auth/browser state. Later authenticated and geometry receipts in Section 29 and NEXI_CURRENT_STATE.md supersede affected observations; broader product/session guarantees remain separate queue items.

This is an evidence update only; it does not upgrade any product acceptance row without the row's required proof.

- **TLS / edge (A-05):** A-05 remains COMPLETED. Canonical Public is https://www.nexitrading.app; app and apex redirect to www; Admin is https://admin.nexitrading.app; API is https://api.nexitrading.app. Cloudflare API showed no wildcard record. Worker-0 HTTPS probes at 2026-09-26 22:21 UTC returned www 200, app/apex 308, Admin 307, and API health 200.
- **Backend / market:** Cloudflare-served `/health`, `/healthz`, and `/readyz` returned 200; readiness reported D1 and Redis ready. `/market/assets` and `/market/prices` each returned 53 canonical instruments. Quote states were time-varying (21 LIVE, 31 closed/unavailable, one transient stale quote; that quote recovered to LIVE on the next D1 read). BTC/ETH samples were current. These bounded snapshots do not close M-03 or M-09 soak/freshness requirements.
- **Public Spot (P-02):** The canonical route is `/dashboard/spot` and its HTML returned 200; `/spot` is not a valid route (404). The response contained SSR loading placeholders, which do not verify hydrated browser behavior. The BrowserStack Galaxy S24 capture showed `MARKET ERROR` alongside failed API/CORS requests; at that time the Live tool surface exposed no session DOM, network logs, or controls, and RDC DevTools had no connected Chrome. Later Cloudflare configuration evidence shows CORS/SIWE origins aligned to canonical `www` and Admin. No post-change preflight or BrowserStack trace is captured here, so P-02 is `NEEDS_FRESH_PROOF`; do not treat the capture-time failure as current or as proof of a backend-wide market outage.
- **Wallet identity (I-01):** SIWE code review confirms successful first login can create a persistent D1 user, while BrowserStack session control and an approved pre-existing test identity were unavailable. No MetaMask wallet was created/imported, no signature was sent, and no production account was created. I-01 remains `AUTOMATION_IDENTITY_REQUIRED`.

`A-05_TLS_EDGE = COMPLETED`

`P-02_GALAXY_SPOT = NEEDS_FRESH_PROOF`

`M-03_MARKET_FRESHNESS = OPEN_DEFECT`

`I-01_SIWE = AUTOMATION_IDENTITY_REQUIRED`

## 1. Finishing-state rule

NEXI entered this reconciliation at the finishing stage. The governing problem was **existing functionality that was not working correctly in the current product/runtime**, combined with stale documents and phase controllers that repeatedly caused already-completed work to be reopened.

Therefore:

- **PROVEN + UNCHANGED = REUSE.**
- **OWNER-SUPERSEDED = DO NOT REOPEN.**
- Current source/runtime evidence outranks stale plans, handovers, branch notes, and old phase controllers.
- When a feature already exists but fails in the current product, trace and repair the **existing canonical path**. Do not create a parallel implementation or restart the domain.
- Do not repeat broad Graphify scans, whole-suite tests, infrastructure discovery, or browser matrices unless a relevant dependency changed or current evidence contradicts prior proof.
- Production deployment is already complete; production is not awaiting authorization.
- The historical 27-row matrix, `CODE_TO_CODE_CLOSED`, A25/A26/A27, and staging-first sequencing are not active completion controllers.

## 2. Canonical authority model

| Layer | Current authority |
|---|---|
| Owner/product decisions | Explicit current owner decisions |
| Implementation truth | Current `Mellonelay/Nexi` `main` |
| Business authority | NestJS |
| Durable application/financial authority | D1 |
| Accounting truth | Ledger/invariants |
| Durable publication boundary | EventOutbox |
| Realtime/cache/Streams | Aiven Valkey; never financial truth |
| Async delivery | Queues |
| Long-running orchestration | Workflows |
| Edge/platform routing | Cloudflare Worker |
| Business runtime | Cloudflare Container + NestJS |
| Consumer/control surfaces | Public + Admin |
| Public visual/UX authority | Public-local `DESIGN.md`: current owner corrections -> five recent accepted reference screens -> later NEXI-specific implementation decisions; Sep-12/13 V2/V3 are historical when they conflict |

## 3. Status vocabulary

- `PROVEN_PRODUCTION` — directly proven in the deployed production release/runtime named by this ledger.
- `PROVEN_SOURCE` — proven at current GitHub/source level by applicable deterministic checks, but not claimed deployed/runtime-proven.
- `PROVEN_UNCHANGED` — previously accepted evidence remains reusable because the governing source/dependency has not materially changed.
- `MANUAL_OWNER_ACCEPTANCE_REQUIRED` — requires a real owner wallet/session or privileged Admin context unavailable to automated acceptance.
- `TARGETED_RUNTIME_REPAIR_ONLY` — implementation exists; if current runtime/manual use exposes a defect, repair the existing canonical path only.
- `OPEN_REAL_DEFECT` — a current defect is directly observed and not yet repaired.
- `SUPERSEDED` — historical requirement/controller explicitly displaced by newer authority.
- `NOT_APPLICABLE` — evidence-backed exclusion from current product scope.

## 4. Historical production baseline — provenance only

> **HISTORICAL:** Section 0 plus `NEXI_CURRENT_STATE.md` are the current execution decision inputs. Rows below preserve earlier evidence for provenance and reuse only; they must not override Section 0 or current state when source/deployment/browser evidence has advanced.

| Requirement | Current authority path | Source status | Runtime status | Evidence / release | Dependency drift | Remaining gap | Final verdict |
|---|---|---|---|---|---|---|---|
| Source convergence | GitHub `main` | Complete | N/A | `5c01b715985fec51c79699fcf5b7319e3435ac0e`; current Public source typecheck + 67/67 source tests + realtime state/monotonic-sequence regression proof + canonical Public/Admin package builds | None known | Current source is not yet promoted/deployed | `PROVEN_SOURCE` |
| Production deployment | Worker + Container + Public + Admin | Complete for deployed baseline | Complete | `3b173ea38da4c80193c5e0b552ae62fede22fab7` production baseline | Newer Public source `5c01b715...` exists | Promote/deploy and runtime-verify newer source only with current owner authorization | `PROVEN_PRODUCTION` |
| Backend health/readiness | Worker -> Container -> NestJS -> D1/Valkey | Complete | `/health`, `/healthz`, `/readyz` healthy | final production deployment | None known | None | `PROVEN_PRODUCTION` |
| Public bounded browser acceptance | Public production app | Complete | Desktop + mobile bounded unauthenticated acceptance passed | production Playwright/Chromium | None known | Authenticated flows separate | `PROVEN_PRODUCTION` |
| Admin bounded browser acceptance | Admin production app | Complete | Overview/users/market-feeds settle correctly to sign-in boundary; checked session no console errors/warnings | production browser acceptance | None known | Privileged actions need real Admin context | `PROVEN_PRODUCTION` |
| Required Klines | Provider -> normalize -> D1 -> API/realtime -> Public/Admin | Complete | `1m/5m/15m/30m/1h/4h/1d`; higher TFs proven `LIVE` | `3b173ea...` production | None known | None | `PROVEN_PRODUCTION` |
| Realtime reconnect/resnapshot | provider/D1 -> Valkey/Socket.IO -> client | Complete | Forced transport loss -> reconnect -> second authoritative snapshot -> ticks/Klines continue | production runtime receipt | None known | None | `PROVEN_PRODUCTION` |
| REST read-back recovery | D1 canonical market read path | Complete | Independent 5m read-back `LIVE`, 40 candles | production runtime receipt | None known | None | `PROVEN_PRODUCTION` |
| Authenticated wallet/SIWE/balance | Public -> auth -> session -> D1/Ledger | Exists | Requires real wallet signature/session | current production auth boundary | Real identity context unavailable to automation | Owner device acceptance | `MANUAL_OWNER_ACCEPTANCE_REQUIRED` |
| Privileged Admin RBAC/action | Admin -> auth/RBAC -> canonical backend -> D1/audit | Exists | Requires authorized privileged Admin context | current production Admin boundary | Privileged context unavailable to automation | Owner Admin acceptance | `MANUAL_OWNER_ACCEPTANCE_REQUIRED` |

## 5. Public product completion requirements

These are **surviving product requirements**, not instructions to rebuild already-existing domains.

| Domain / requirement | Canonical acceptance path | Current treatment |
|---|---|---|
| Exactly 11 primary Public destinations | Dashboard/Quotes, Spot, Options/Binary, Wallet, Earn/Mining, Loans, Support, Announcements, Learn, Messages, Settings | Preserve. `PROVEN_UNCHANGED` unless a current runtime observation contradicts it. |
| Asset Detail | Quotes -> Asset Detail -> same canonical asset/pair | Preserve nested route; not a 12th destination. |
| Active Asset / Active Pair | Quotes Hub -> Asset Detail -> Spot/Margin -> Options/Binary | Preserve one canonical owner; no silent reset. `TARGETED_RUNTIME_REPAIR_ONLY` if current use exposes drift. |
| Canonical asset identity | 53 NEXI-controlled local assets/icons | Preserve exactly 53 unless a newer explicit owner decision changes it. Provider branding must not replace NEXI identity. |
| Public visual system | Deep Liquid Violet + restrained glass + Geist/Geist Mono | Follow Public-local `DESIGN.md` and the five recent accepted references (Quotes Hub, Spot/Margin, Options/Binary, wallet chooser, Wallet). Older Sep-12/13 V2/V3 and rejected generated concepts are historical where they conflict. |
| Mobile persistent navigation | Dashboard / Spot / Options / Wallet / Earn | Preserve exactly. |
| Mobile geometry | 320/360/~390/412-430/tablet/desktop + short-height viewport; safe-area/bottom-nav clearance | Preserve; repair systemic shared geometry only if a current defect is observed. |
| Accessibility | focus, semantics, labels, keyboard where applicable, contrast, reduced motion, touch targets, text scaling | Surviving acceptance requirement. Do not reopen unrelated components without a changed primitive/observed defect. |
| Wallet browser access model | non-protected Public product surfaces remain accessible without a NEXI wallet session; wallet/account/financial actions are protected | Current owner/source correction deployed at `04c8f5f...`. Do not restore the superseded global full-screen wallet gate. |
| Explicit wallet provider choice | provider discovery separate from SIWE/auth; no silent first-injected fallback | Preserve. BrowserStack production chooser currently shows Coinbase + injected/browser wallet; WalletConnect visibility remains unverified and must be tested with a controlled test identity/extension path before owner acceptance. |
| Notification center | `All`, `Trading`, `Wallet`, `Account`, `System`; truthful loading/empty/error/retry/read states | Sep 12 requirement, implemented against real backend types. Repair only if current production use exposes a defect. |
| Deposit UX | Deposit -> Select asset -> Deposit details; backend/Admin-configured asset/network/address/QR/instructions; amount/proof/submit preserved | Sep 12 requirement, implemented. Financial authority remains backend/D1; no frontend-owned config. |

## 6. Identity, account, security

| Requirement | Required path / invariant | Current treatment |
|---|---|---|
| Wallet-only SIWE | challenge -> exact signature verification -> replay prevention -> WalletIdentity -> AuthSession | Existing canonical path. Use the preserved controlled Chrome/MetaMask identity for primary authenticated production proof; owner manual acceptance remains the final gate, not the first proof step. |
| One verified wallet = one NEXI account | wallet identity resolves one canonical user | Preserve. |
| Stable six-digit public NEXI ID | public `userCode`; internal D1 `User.id` opaque | Preserve. |
| Profile/KYC | submitted authoritative profile/KYC state -> Admin review/audit | Existing domain; do not rebuild. Targeted repair only on current failure evidence. |
| Referral | deterministic referral identity/attribution; self-referral prevention; one-time attribution; rewards lifecycle | Existing domain; preserve canonical D1/backend authority. |
| VIP | levels/thresholds/benefits/progress; Admin governed configuration/assignment/audit | Existing domain; preserve canonical authority. |
| Withdrawal PIN | separate sensitive-action step-up; set/change/reset; hash only; attempts/lockout | Surviving requirement from acceptance lineage. Not a login credential. |
| Session/security | access/refresh rotation, revoke/logout, security events, Admin governance | Existing canonical auth/security path. |

## 7. Markets and trading

| Domain | Surviving requirement | Current treatment |
|---|---|---|
| Market catalog | 53 canonical instruments; provider capability/mapping reflects callable truth | Market/Kline production proof current. Other provider capabilities remain truthful-by-capability; no catalog-membership assumption. |
| Quotes | real authoritative source/freshness/price/stats; bid/ask only if genuine | No synthetic healthy/fresh state. |
| Klines | exact required intervals `1m/5m/15m/30m/1h/4h/1d` | `PROVEN_PRODUCTION`. |
| Depth | show genuine L2 only | Never equate bid/ask with depth. |
| Trades | show genuine executed provider trades only | Never label ticks as trades. |
| Spot | order validation/reservation/lifecycle/fills/fees/ledger/outbox/realtime/history | Existing domain. Do not rebuild; targeted repair only if a current path fails. |
| Margin | isolated only; LONG/SHORT; exactly 2x/3x/5x; collateral/risk/interest/close/liquidation + ledger/Admin visibility | Existing domain. Cross/futures/perpetual/portfolio margin remain excluded. |
| Options/Binary | same Active Pair; backend-configured enabled durations from the canonical configuration authority; authoritative payout/countdown/settlement/refund/cancel/unavailable states | Existing domain. Do not hardcode a historical duration set when current configuration is empty or differs. |
| Binary sandbox | overrides isolated, permissioned, audited, never silently affect normal users | Preserve governance isolation. |

## 8. Wallet and financial authority

Every consequential financial command must preserve authorization, validation, idempotency, atomic domain + ledger semantics, Activity/audit linkage, EventOutbox, and safe retry/recovery.

| Lifecycle | Required end-to-end authority | Current treatment |
|---|---|---|
| Wallet balances/history | subject-owned API -> canonical D1/Ledger -> Public/Admin | Existing. Never derive financial truth in UI. |
| Deposit | Admin/backend destination config -> Public intent/proof -> D1 claim -> review/credit -> ledger/activity/audit/outbox | Existing and Sep 12 UX repair implemented. Authenticated production action remains within owner wallet gate. |
| Withdrawal | asset/network/address/amount -> policy/PIN -> idempotency -> ledger reservation -> Admin review/settlement/release -> audit/outbox | Existing canonical path. |
| Internal transfer | public six-digit recipient -> server-side opaque user resolution -> ledger transfer -> receipt/activity | Existing canonical path. |
| Conversion | authoritative quote/expiry -> accept -> ledger conversion -> receipt/activity | Existing canonical path; UI must not invent quote. |
| Reconciliation | detect/inspect/recover mismatches and failed async delivery | Surviving production requirement. |

## 9. Earn / Mining and Loans

| Domain | Required lifecycle | Current treatment |
|---|---|---|
| Mining/Earn | plan -> subscribe/purchase -> ledger debit -> accrual -> settlement/completion -> history -> Admin control -> Workflow/outbox | Existing domain. Preserve; targeted repair only if current production use proves a defect. |
| Loans | plan -> eligibility/application -> approval/rejection -> disbursement -> repayment/overdue/default -> history -> Admin governance -> Workflow/outbox | Existing domain. Preserve; targeted repair only if current production use proves a defect. |

## 10. Communications, content, settings

| Domain | Required lifecycle | Current treatment |
|---|---|---|
| Support | persistent ticket root + replies/timeline + assignment/status/read state/closure + attachments where supported + realtime | Required product contract. Existing path; targeted repair only on current defect. |
| Messages | persistent conversations + sequence/delivery/read/moderation/reconnect | Required product contract. |
| Notifications | authoritative targeting/delivery/read state + truthful UI states | Required; Sep 12 category/state repair implemented. |
| Announcements | Admin create/edit/schedule/publish/unpublish/target/localize/pin/display -> Public consumption | Required product contract. |
| Learn | Admin category/content/revision/tag/media/publication/localization -> Public browse/detail | Required product contract. |
| Settings | profile/preferences/language/timezone/theme/notifications/security/wallet identity | Required product contract. |

## 11. Admin control plane

Admin is a governance/operations surface over canonical backend authority, never a second business implementation.

Required continuing coverage:

- Admin authentication, RBAC, protected routes, roles/permissions.
- User/Profile/KYC/Referral/VIP visibility and governed mutation.
- Wallet, balances, ledger, deposits, withdrawals, transfers/conversions, reconciliation.
- Asset/provider/mapping/capability/freshness administration.
- Spot/Margin/Binary operations and settlement/exposure visibility.
- Mining/Loan administration.
- Support/Messages/Notifications/Announcements/Learn administration.
- Feature flags, frontend control, maintenance, localization, health/readiness, audit/approvals/incidents.
- Consequential actions preserve actor/role/environment/target/reason/confirmation/audit/correlation/idempotency/approval semantics as appropriate.

Current final privileged action proof remains `MANUAL_OWNER_ACCEPTANCE_REQUIRED`; this does **not** authorize rebuilding Admin.

## 12. Async, realtime, recovery

| Requirement | Current treatment |
|---|---|
| EventOutbox is durable domain publication boundary | Preserve. Do not revive historical claims that a missing historical Queue edge is automatically a current defect. |
| Queue consumers are retry-safe where applicable | Preserve existing canonical consumers. |
| Workflows orchestrate long-running lifecycle without owning financial truth | Preserve. |
| Socket.IO/Valkey realtime | Production reconnect/resnapshot proven for market lane. Reuse unless relevant realtime code/config changes. |
| REST/read-back recovery | Production market recovery proven. Other domains use canonical durable read-back as applicable. |
| Duplicate/retry/concurrency safety | Required where consequential; inspect only the affected domain if a current failure exposes risk. |
| Exact missed-event replay as universal release gate | `SUPERSEDED`; must not silently return as a blocking requirement. |

## 13. Platform / operations

Current platform contracts remain:

- Worker routing/bindings/CORS/SIWE-domain policy.
- Container runs NestJS business authority.
- D1 durable state/migrations.
- Aiven Valkey realtime/cache/Streams.
- R2 only for current domain objects where configured; `DEPOSIT_PROOFS` remains active. The former market archive R2 bucket was emptied and deleted on 2026-09-19 after the owner retired that path.
- Market Pipelines/Data Catalog archive/history path is **RETIRED** by owner decision on 2026-09-19. Backend archive callers and Worker bindings were removed, Pipelines list is empty, the archive secret is removed, and the old archive bucket is deleted.
- Queues/Workflows/KV/Analytics/Secrets/DO only where the current runtime/config requires them.
- Health/readiness/observability/audit/reconciliation/rollback evidence.

Do not rediscover/recreate infrastructure merely because an old document names an earlier topology or resource name.

## 14. Explicit superseded/non-blocking historical controllers

The following are **not active gates** and must not be allowed to restart the project:

- historical 27-row Code-to-Code matrix as final controller;
- `CODE_TO_CODE_CLOSED` as final completion definition;
- A25/A26/A27 unless new current-source regression proves one;
- staging as a mandatory next phase;
- “production unauthorized”;
- broad Graphify whole-repo rebuild before every change;
- exact missed-event replay as a universal release requirement;
- retired pre-D1 database authority;
- stale Stitch visual authority;
- stale `More` mobile navigation;
- old Git SHAs/worktrees/VM/Codespace handovers as present-state authority.

## 15. Historical completion decision — superseded baseline

The narrow two-gate assessment below is retained for provenance. Section 0's full production queue and later dated receipts control current completion; the old source/deployment SHAs are not today's frontier.

### Already closed and reusable

- Current GitHub/source convergence at `81baa15...`: `PROVEN_SOURCE`.
- Deployed production baseline at `3b173ea...`: `PROVEN_PRODUCTION`.
- Production health/readiness: `PROVEN_PRODUCTION`.
- Required Klines: `PROVEN_PRODUCTION`.
- Market realtime reconnect/resnapshot: `PROVEN_PRODUCTION`.
- Market REST recovery: `PROVEN_PRODUCTION`.
- Bounded unauthenticated Public/Admin browser acceptance: `PROVEN_PRODUCTION`.
- Sep 12 frontend repair source/deployment: `PROVEN_UNCHANGED` unless a current manual observation contradicts it.

### Remaining final acceptance gates

1. **Authenticated wallet/SIWE/balance and protected financial interaction** — `MANUAL_OWNER_ACCEPTANCE_REQUIRED`.
2. **Privileged Admin RBAC/action** — `MANUAL_OWNER_ACCEPTANCE_REQUIRED`.

### Repair policy after this ledger

If the owner encounters a feature that **already exists but does not work**:

1. Record the exact current production symptom.
2. Trace only that path: UI/Admin -> client/provider -> route/event -> auth/RBAC -> DTO/controller -> service/domain -> D1/Ledger -> audit/activity -> EventOutbox/async -> realtime -> consumer/read-back.
3. Reuse every unchanged proven segment.
4. Repair the smallest dependency-closed causal seam.
5. Run focused deterministic validation and a bounded blast-radius check.
6. Update this ledger only for the affected requirement.

Do **not** reopen unrelated domains or restart broad acceptance.

## 16. Historical September runtime verdict — superseded snapshot

The baseline below preserves the September re-audit. Later corrections in Sections 25–29 and NEXI_CURRENT_STATE.md control present state; these counts, host errors, and identity classifications must not be read as fresh observations:

```text
SOURCE_CONVERGENCE = COMPLETE_AT_GITHUB_MAIN
BACKEND_CLOUDFLARE_RUNTIME = RUNTIME_VERIFIED
CLOUDFLARE_HEALTH_READINESS = PASS
MARKET_ASSET_ROWS = 53
MARKET_LIVE = 36
MARKET_STALE = 17
MARKET_UNAVAILABLE = 0
MARKET_ARCHIVE_R2 = RETIRED_AND_CLEARED
MARKET_PIPELINES = EMPTY
PUBLIC_ADMIN_HOST_OWNERSHIP = DEDICATED_SRV_NEXI_CONFIRMED
PUBLIC_ADMIN_EXTERNAL_RUNTIME = CLOUDFLARE_307_VERIFIED
MARKET_FULL_FRESHNESS = NOT_COMPLETE

AUTHENTICATED_WALLET_SIWE_BALANCE = MANUAL_OWNER_ACCEPTANCE_REQUIRED
PRIVILEGED_ADMIN_RBAC_ACTIONS = MANUAL_OWNER_ACCEPTANCE_REQUIRED

FULL_PRODUCTION_END_TO_END_ACCEPTED = NO
```

Historical assessment (retained for provenance, not current runtime): the `NO` was not only the two identity-dependent gates. The then-current direct probes showed that both external Public/Admin domains returned HTTP 522 and that 16 of 53 market assets were stale. That generation's backend/archive evidence did not close its runtime gaps. Current full-product acceptance remains governed by Section 0; later receipts determine which historical gaps are superseded.

## 17. Source register used for this reconciliation

- `NEXI-FULL-PRODUCTION-ACCEPTANCE-SPEC-2026-08-30` — broad full-production requirement lineage.
- `NEXI_COMPLETE_PRODUCTION_ACCEPTANCE_GITHUB_CURRENT_2026-09-02` — later GitHub-current full-production reconciliation.
- `NEXI Frontend Manual Acceptance Findings — 2026-09-12` — newer owner-observed product requirements and bounded repairs.
- `NEXI_DEEP_LIQUID_VIOLET_FRONTEND_ACCEPTANCE_SPEC_V3` — Sep 13 Public frontend authority; explicitly supersedes V2.
- `NEXI Engineering Work Ledger — Single Session Authority` — Sep 14/15 current operational state and VM cleanup checkpoint.
- GitHub `Mellonelay/Nexi` current `main@81baa15f82901f26405cfd378f7e0f5fe31b693e`; deployed production baseline remains `3b173ea38da4c80193c5e0b552ae62fede22fab7`.

Older handovers, branch notes, recovery artifacts, matrices and historical execution plans may be deleted after confirming they carry no unique surviving requirement not represented here.

## 18. Dependency/runtime ownership completion — 2026-09-16

The dependency phase corrected an earlier broader hypothesis. The recurring risk was real—new sessions had repeatedly reconstructed frontend/admin environments in the wrong places—but current filesystem/package evidence shows the remaining ownership problem is now bounded and reconciled.

### Canonical Worker-0 dependency owners

- Public source: `cloudflare-container-bootstrap/dexi-frontend`.
- Public dependency owner: `/srv/nexi/public/shared/node_modules`.
- Public source `node_modules` is a symlink to that shared owner.
- Admin source: `apps/admin`.
- Admin dependency owner: `/srv/nexi/admin/shared/node_modules`.
- Admin source `node_modules` is a symlink to that shared owner.
- Current immutable production runtimes remain `/srv/nexi/public/current` and `/srv/nexi/admin/current`; their traced runtime dependency trees are deployment artifacts, not development dependency owners.

### Proof

- Public direct dependencies/devDependencies: `40/40` present and matching the current lockfile install.
- Admin direct dependencies/devDependencies: `70/70` present and matching the current lockfile install.
- Admin `npm run typecheck`: **PASS** after re-homing dependencies to `/srv/nexi/admin/shared/node_modules`.
- Runtime resolution proves Public `next` resolves from `/srv/nexi/public/shared/node_modules` and Admin `@tanstack/react-start` resolves from `/srv/nexi/admin/shared/node_modules`.
- Stale source `.next` and Admin `.output` were removed as rebuildable generated state.
- No active process used the Admin source `node_modules` during re-homing.
- Admin dependency tree was moved atomically to `/srv/nexi/admin/shared/node_modules`; the source path now resolves there.
- `/srv/nexi/admin/build-3b173ea/node_modules` still resolves through the source symlink to the canonical shared Admin dependency tree.

### What remains separate

Historical `/srv/nexi/.../releases` still consume substantial disk. They are immutable rollback/deployment artifacts, not duplicate dependency installs. Retention/deletion requires a separate explicit production-retention decision and is not part of dependency correctness.

`DEPENDENCY_PHASE = COMPLETE` for ownership/reuse correctness on Worker 0.

## 19. Proportional bounded authority fan-in

Durable-state reconciliation is part of completion, but it is proportional rather than mechanical.

- Update `NEXI_CURRENT_STATE.md` when a bounded task materially changes current durable NEXI truth: source frontier, deployed baseline, active phase, canonical ownership/routing, or immediate unresolved gates.
- Update this ledger only when durable completion evidence is established, changed, revoked, or superseded.
- Do not add transient process/session state, one-off timestamps, exploratory output, or ephemeral diagnostics to either authority file.

When reconciliation is required:
`EXECUTE/REPAIR -> FOCUSED VERIFY -> PROPORTIONAL CURRENT-STATE/LEDGER UPDATE -> CHECK SOURCE SHA VS DEPLOYED BASELINE -> REPORT`.

The update must record only the state invalidated or newly proven by the bounded work and must not reopen unrelated rows. If source advances without deployment, record the new GitHub source SHA separately from the still-deployed production baseline.

## 20. Worker-0 capability knowledge system — 2026-09-16

A durable capability directory now separates Worker-0 operating mechanics, task routing, MCP capability ownership, CLI/operator ownership, browser fabric, Graphify structural intelligence, and DeepWiki semantic intelligence.

Canonical references:
- `/home/mellonelay1999/RDC_ONBOARDING.md` — Worker-0 operating mechanics and startup.
- `/home/mellonelay1999/.agents/GLOBAL_CAPABILITY_INDEX.md` — lightweight task-to-capability router.
- `/home/mellonelay1999/.agents/GLOBAL_MCP_CATALOG.md` — MCP service ownership + live schema discovery.
- `/home/mellonelay1999/.agents/GLOBAL_CLI_CATALOG.md` — CLI/operator ownership + live status discovery.
- `/home/mellonelay1999/.agents/BROWSER_FABRIC.md` — Playwright/Polypane/Chrome DevTools/BrowserStack/Ponytail responsibilities.
- `/home/mellonelay1999/.agents/GRAPHIFY_COMPLETE_READING_AND_USAGE_GUIDE.md` — complete graph capability + change-driven refresh lifecycle.
- `NEXI_DEEPWIKI_COMPLETE_USAGE_GUIDE.md` — semantic/RAG capability + incremental index lifecycle.

The system preserves `DISCOVER STATE; DO NOT MEMORIALIZE STATE`: mutable versions, auth, process IDs, live graph/index counts, and transient health are not permanent authority. New Worker flow is `onboarding -> capability index -> relevant specialist reference -> live status if needed -> execute`.

`WORKER0_CAPABILITY_KNOWLEDGE_SYSTEM = VERIFIED_DOCUMENTATION`. This does not change production runtime state and is not browser acceptance.

## 21. Cloudflare backend execution-authority convergence — 2026-09-17

Current owner authority changed the backend execution model. GitHub `main` remains durable source authority; Cloudflare Worker + Container is the only active backend execution/runtime authority. Worker 0 is no longer an acceptable parallel backend runtime after the one-time convergence.

### Final source-equality proof

- GitHub `main@81baa15f...` and `origin/main` were equal with no unpushed commits at recovery.
- Backend tracked source from `3b173ea...` through `81baa15f...` has no committed diff.
- The current Cloudflare deployment uses the NEXI Worker/Container stack and a running `nexi-api-staging` Container application.
- Cloudflare Container `/app/package.json` and `/app/package-lock.json` hashes exactly matched GitHub backend manifests.
- A clean temporary build from GitHub `HEAD` produced 170 backend JavaScript artifacts; all 170 hashes matched the running Cloudflare Container byte-for-byte. The Container additionally contains 10 generated Prisma D1-client JavaScript artifacts produced by the image build/generation path.
- Three VM-only source edits changed only async filesystem implementation details and were absent from both GitHub and Cloudflare. No accepted requirement, commit provenance, or runtime evidence justified promoting them. They were preserved in `/tmp` recovery evidence and the transitional VM backend source working tree was restored to GitHub `HEAD`; no VM backend runtime is authoritative.

`BACKEND_SOURCE_EQUALITY_GITHUB_CLOUDFLARE = PROVEN`

`VM_PARALLEL_BACKEND_AUTHORITY = RETIRED`

`RETIRED_PRE_D1_DATABASE_AUTHORITY = REMOVED_FROM_ACTIVE_REPOSITORY`

Fresh proof: current Cloudflare secret names contain no alternate database URL; `wrangler.jsonc` binds `CORE_DB` to D1 and points only to `backend/prisma/migrations-d1`; remote D1 migration status reports no pending migration. Backend package dependencies contain `@prisma/adapter-d1` and no retired provider adapter.

### Permanent operating rule

Before any Cloudflare mutation or configuration-driven debugging, read the relevant current official Cloudflare documentation, inspect current Wrangler/MCP help/schema, reconcile with NEXI config, then operate and verify. Backend runtime claims must be proven against Cloudflare, not a VM-local NestJS process. Any legitimate source repair performed through the Cloudflare execution plane must be reconciled to GitHub `main` when the bounded task finishes.

This transition does **not** retroactively convert earlier source/static evidence into runtime proof. `PROOF SCOPE >= CLAIM SCOPE` remains mandatory.
## 22. Production resource identity + Wrangler SSH proof — 2026-09-17

Cloudflare resource names retain historical `staging` suffixes, but those names are not environment authority. The currently active production backend is the Worker/Container stack serving `api.nexitrading.app` with `NODE_ENV=production`. Later sessions must discover live deployment/runtime state rather than infer a staging environment from resource naming.

Fresh read-only/runtime evidence remains authoritative for the production custom domain and Wrangler SSH operator path. The 2026-09-19 platform reconciliation supersedes the historical version/binding snapshot in this section:
- active Worker release is `b5325e751415dfdb4cc5bc8d120fe43638643531`;
- active Container application is version 63 with one running `nexi-api` instance in Singapore;
- `/ops/live` returns 200 and `/ops/ready` returns 200 with database=true and redis=true;
- active providers include MOEX, Binance Spot, BiQuote, Gate, and Yahoo; market truth continues to mark stale/closed-market observations as STALE rather than fabricate freshness;
- active Worker secrets include JWT, Redis, Sentry, and NestJS Observe app credentials;
- market R2/Pipelines archive bindings and callers are removed; Pipelines list is empty; the retired archive bucket was emptied (21,711 objects) and deleted; `DEPOSIT_PROOFS` R2 remains active;
- Cloudflare observability query for Worker errors over the fresh verification window returned no error events.

`PRODUCTION_RESOURCE_NAME_SUFFIX_IS_NOT_ENVIRONMENT_AUTHORITY = PROVEN`

`CLOUDFLARE_CONTAINER_SSH_OPERATOR_PATH = PROVEN`

`MARKET_ARCHIVE_PIPELINES_AND_R2 = RETIRED_AND_DELETED`

This section does not claim that every configured Cloudflare feature is permanently required. Optional-feature retention/retirement remains decided from current callers, bindings, runtime evidence, and owner intent.
## 23. Public/Admin deployable-source frontier — 2026-09-17

The bounded Public convergence repair is durable source at GitHub `main@5c01b715985fec51c79699fcf5b7319e3435ac0e`. Current source verification established Public typecheck PASS, 67/67 source tests PASS, and the repaired market catalog/realtime path preserves backend data-state semantics and monotonic per-symbol sequence ordering. Targeted static/graph fan-in found maintainability debt but no demonstrated release-blocking duplicate authority or circular dependency in the changed scope.

Canonical package builds were produced through the dedicated runtime/build ownership surfaces rather than arbitrary repository dependency trees: Public built successfully from `/srv/nexi/public/build-20260917-145740` using `/srv/nexi/public/shared/node_modules`; Admin built successfully from `/srv/nexi/admin/build-20260917-145740` using `/srv/nexi/admin/shared/node_modules`. The Public `.next/cache` generated during packaging was removed as rebuildable cache and is not part of the release payload. Existing current/rollback releases and shared dependency owners were preserved.

This proves a **deployable source/package frontier**, not production promotion. Production Public/Admin remain on the previously proven deployed baseline until explicit promotion/deployment authorization, after which runtime verification must be fresh.

`PUBLIC_ADMIN_DEPLOYABLE_SOURCE_FRONTIER = PROVEN_SOURCE`

`PUBLIC_ADMIN_NEW_FRONTIER_DEPLOYED = NO`

## 24. Fresh live runtime re-audit — 2026-09-19 19:24 UTC

This section records fresh runtime evidence and supersedes older broad acceptance claims wherever they conflict.

### Dedicated Public/Admin hosting

- Public active process CWD: `/srv/nexi/public/releases/3b173ea-prod`.
- Admin active process CWD: `/srv/nexi/admin/releases/3b173ea-prod-node`.
- `/srv/nexi/public/current` and `/srv/nexi/admin/current` resolve to those dedicated release trees.
- Shared dependency owners remain `/srv/nexi/public/shared/node_modules` and `/srv/nexi/admin/shared/node_modules`.
- No active Public/Admin process was found running from the Git checkout.

### Cloudflare/backend

- Wrangler authentication is valid for the NEXI Cloudflare account.
- Container application `nexi-api-staging`: active, one live instance.
- `/healthz`: HTTP 200.
- `/ops/live`: HTTP 200.
- `/ops/ready`: HTTP 200 with `database=true`, `redis=true`.
- `/market/prices`: HTTP 200.
- `/market/provider-state`: HTTP 200.
- Cloudflare backend status: **RUNTIME_VERIFIED**.

### Market freshness

- `/market/prices` returned 53 distinct assets.
- Current states: **37 LIVE**, **16 STALE**, **0 UNAVAILABLE**.
- The previous 13-symbol D1 sequence-collision defect is not reproduced by this live API response; all 53 rows have sequences and the affected symbols are advancing.
- The market is therefore operational but **not fully fresh for all 53 assets**.
- Current stale set: `AUDUSD, EURUSD, GBPUSD, USDCHF, USDCNH, USDHKD, USDJPY, USDRUB, USDTHB, XAGUSD, XALUSD, XAUUSD, XCUUSD, XPDUSD, XPTUSD, XZNUSD`.
- Runtime-active providers: MOEX, Binance Spot, BiQuote, Gate, Yahoo. Optional providers OKX, Bitget, HTX and Bybit reported `runtimeActive=false`.

### Market archive retirement

- R2 bucket query filtered by `market`: zero buckets.
- Complete R2 bucket list contains no market-archive bucket; `nexi-deposit-proofs-staging` remains the product R2 bucket.
- `wrangler pipelines list`: **No pipelines found**.
- Market archive R2/Pipelines path: **RETIRED/CLEARED**, with `DEPOSIT_PROOFS` retained.

### Public/Admin external reachability

- `https://app.nexitrading.app/`: HTTP 522.
- `https://admin.nexitrading.app/`: HTTP 522.
- Direct local Nginx/host probes route to Public port 3000 and Admin port 3001 and return 307 redirects.
- This isolates the current frontend failure to the Cloudflare edge-to-origin/DNS reachability path or equivalent external routing seam; it is not evidence that the dedicated host processes are absent.
- Public/Admin external production status: **NOT RUNTIME_VERIFIED; CURRENTLY 522**.

### Current completion interpretation

The backend is live and healthy, archive retirement is verified, and Public/Admin host ownership is correct. Full NEXI completion cannot be claimed because:

1. Section 24 recorded external 522; the latest check proves the new origin responds 307 while Cloudflare DNS remains on the old origin.
2. Section 24 recorded 16 stale; the latest check records 17 stale because freshness is time-dependent.
3. Authenticated wallet/SIWE/protected-financial acceptance remains owner-gated.
4. Privileged Admin RBAC/action acceptance remains owner-gated.

## 25. Live correction — 2026-09-19 19:47 UTC

This supersedes the Section 24 snapshot where it differs.

### VM origin and Cloudflare DNS

- Current VM origin IP supplied and verified by direct origin routing: `35.187.234.62`.
- Direct HTTPS requests to `35.187.234.62` with the Public/Admin hostnames returned `307` for both applications.
- Cloudflare DNS API still reports:
  - `app.nexitrading.app A 35.240.167.7 proxied=true`
  - `admin.nexitrading.app A 35.240.167.7 proxied=true`
- Therefore the dedicated Public/Admin host is responding, but Cloudflare DNS is still aimed at the old origin.

### Market freshness correction

- Fresh `/market/prices` response at 2026-09-19 19:47 UTC: 53 assets, 36 LIVE, 17 STALE, 0 UNAVAILABLE.
- `STEEMUSDT` newly appears in the stale set in this snapshot.
- The earlier 13 and 16 counts were time-dependent snapshots from earlier observations; they are not contradictory fixed totals.
- Current market status remains operational but not fully fresh.

### Corrected status

`PUBLIC_ADMIN_DEDICATED_HOST = VERIFIED`

`PUBLIC_ADMIN_ORIGIN_IP = 35.187.234.62`

`PUBLIC_ADMIN_CLOUDFLARE_DNS = STALE_35.240.167.7`

`MARKET_ASSET_ROWS = 53`

`MARKET_LIVE = 36`

`MARKET_STALE = 17`

`MARKET_UNAVAILABLE = 0`

`FULL_PRODUCTION_END_TO_END_ACCEPTED = NO`

## 26. Live correction — 2026-09-20

This supersedes the DNS/origin status recorded in Sections 24 and 25.

### Cloudflare DNS and external reachability

- Current VM origin IP: `35.187.234.62`.
- Cloudflare DNS for both `app.nexitrading.app` and `admin.nexitrading.app` now targets `35.187.234.62` with proxying enabled.
- Fresh external HTTPS checks return `307` through Cloudflare for both domains.
- The stale-origin DNS defect is closed. A-05 remains `COMPLETED`.
- Public/Admin external reachability is no longer the active blocker; A-06 (promotion of the newer Public source frontier) and market/full-product closure remain open.

`PUBLIC_ADMIN_CLOUDFLARE_DNS = CONVERGED_35.187.234.62`

`PUBLIC_ADMIN_EXTERNAL_RUNTIME = CLOUDFLARE_307_VERIFIED`

`FULL_PRODUCTION_END_TO_END_ACCEPTED = NO`

## 27. Unified source integration + CI reconciliation — 2026-09-21

This section records durable source/CI truth only. It does not promote runtime rows.

- Worker-0 `main`, `origin/main`, and GitHub `main` are synchronized at `a489b02b323fa8a9de8cfb329c60cf9b523706c8` with a clean worktree.
- The integrated ancestry contains the accepted market/non-market merge, durable communications/content completion, and the bounded Binance shutdown test-contract repair.
- GitHub Actions run `35558996698` for that exact push SHA is green across backend, frontend, Admin, Graphify, and Cloudflare dry-run jobs.
- Local fresh evidence for the CI repair: exact backend market CI selection 3/3 suites, 27/27 tests PASS; backend Nest build PASS.
- Fallow changed-scope audit for the one-file CI correction: PASS with 0 introduced dead code, 0 introduced complexity, 0 introduced duplication, and 0 introduced styling findings.
- The previous CI failure was a stale WebSocket test fixture; production adapter behavior was not changed to satisfy the legacy test.
- No newer source from this frontier has been promoted to Public/Admin production releases or the Cloudflare Worker/Container runtime. Therefore A-06 and A-08 remain `OPEN_DEFECT`, and all runtime/product rows requiring deployed proof remain unchanged.

`SOURCE_INTEGRATION = COMPLETE_AT_GITHUB_MAIN`

`SOURCE_CI = GREEN_AT_A489B02`

`CURRENT_UNIFIED_SOURCE_DEPLOYED = NO`


## 28. Unified production promotion reconciliation — 2026-09-22

This section supersedes older statements that the unified source frontier remained unpromoted.

Fresh direct evidence:

- GitHub/Worker-0 source: `main == origin/main == ed26973fe0556a6d75943b3e296be0a899449d6d`.
- Public current release: `/srv/nexi/public/releases/ed26973f-prod`; `NEXI_RELEASE_SHA` equals the full `ed26973...` source SHA.
- Admin current release: `/srv/nexi/admin/releases/ed26973f-prod-node`; `NEXI_RELEASE_SHA` equals the full `ed26973...` source SHA.
- Cloudflare Worker `nexi-production` current deployment: `bdadd96f-3696-474b-955d-de490a9a466d`, tagged `ed26973f`.
- Remote D1 migration status: `No migrations to apply`; migration `0008_communications_content_completion` was already applied during promotion.
- Fresh backend readiness: `/ops/ready` reports `status=ready`, `database=true`, `redis=true`.

Therefore the earlier A-06/A-08 OPEN_DEFECT statements are superseded by this newer evidence:

`A-06_PUBLIC_ADMIN_PROMOTION = COMPLETED`

`A-08_BACKEND_PROMOTION = COMPLETED`

`UNIFIED_SOURCE_GENERATION_DEPLOYED = ed26973fe0556a6d75943b3e296be0a899449d6d`

This promotion proof does **not** upgrade the remaining Public, Admin, market, financial, async, realtime, identity, or owner-acceptance rows beyond their own evidence. `Z-01` remains open until the required non-owner-context rows are closed with current end-to-end production proof.

## 29. Public responsive/mobile geometry closure — 2026-10-02

This section closes the bounded **Public geometry phase** only. It does not mark the broader Public product rows complete.

Evidence:

- implementation/release: `be50529b789786fd83d808178f386b015f77b1f3` -> `/srv/nexi/public/releases/be50529-geometry-prod` from verified build `/srv/nexi/public/build-be50529-20261002-121819`; active service and external dashboard 200;
- focused changed-scope test/lint/type/Fallow gates passed before promotion;
- preserved authenticated Worker-0 Chrome/MetaMask session re-verified through a NEXI SIWE sign-in request on chain 1 showing **No changes**;
- authenticated Dashboard geometry passed 320×568, 360×800, 390×844, 430×932, 360×640, 568×320, 768×1024 and the calibrated desktop-class probe with zero tested document/main horizontal overflow;
- at 320×568 the header is 56px, the narrow brand trigger is 40×44, and the accessible name is `NEXI, Open application menu`; at 360px+ the full wordmark remains;
- 200% text stress at 320/390/568-landscape reflows vertically without horizontal overflow or controls escaping the header;
- drawer bounds/focus, 34px safe-area propagation, and reduced-height search/keyboard focus passed in scope;
- authenticated 320 geometry passed Options, Wallet and Asset Detail;
- BrowserStack Testing Toolkit and DevTools AI remain secondary evidence. The DevTools AI 122px docked viewport is not a target fixture and is excluded from 320px geometry acceptance.

`PUBLIC_RESPONSIVE_MOBILE_GEOMETRY_PHASE = COMPLETED`

Rows P-01/P-03/P-04/P-12/P-13 retain their broader product/lifecycle statuses where their acceptance paths extend beyond geometry. `FULL_PRODUCTION_END_TO_END_ACCEPTED` remains `NO`.

## Work-control reconciliation — 2026-10-02

The NEXI checkpoint requires prior-phase evidence and explicit reconciliation of this ledger and current state before a phase transition or final completion report. The parent updates the exact selected queue row when durable completion evidence changes; justified unchanged phases do not churn product statuses. Eight focused gate checks and a real wrapper blocked-transition/recovery check passed. This control change closes no additional product row, promotes no source, and grants no deployment/push authority. Public geometry proof and broader open queue requirements remain unchanged. Protocol: `docs/operations/NEXI_PHASE_RECONCILIATION.md`.

## Public convergence candidate evidence checkpoint — 2026-10-03

Historical superseded convergence candidate (2026-10-03): replaced 36 placeholder asset SVGs, improves ADA contrast, exposes actual MA(20)/EMA(20)/EMA(50) values with existing chart-series colors, and removes the authenticated Wallet body identity duplicate. Additional bounded repairs normalize Mining boolean/numeric enabled flags and decimal limits, separate public Loans catalog loading from protected history, distinguish Support read failures from empty state, remove the Settings profile-read/session-event request loop, make Messages read-service status truthful, and format Asset Detail backend values. These changes were integrated/deployed at superseded8dc1bec and are included in the later deployed Public5aafc0f; full product acceptance remains open. Canonical typegen/typecheck and 20 focused tests passed; the communications-contract test passed from its required repository context. Fallow returned WARN with zero introduced dead-code/complexity findings; the attributed socket-cleanup clone is pre-existing. Canonical production build PASSED at /srv/nexi/public/build-public-convergence-20261003-0510 using the existing NEXT_TURBOPACK_ROOT=/srv/nexi/public override. Git fan-in/deployment occurred at8dc1bec; current Public supersedes that release. Full production product verification remains pending; closed geometry proof is reused.

2026-10-04 P03 BLOCKED_WITH_EVIDENCE: actual Polypane GET /binary/config revalidated HTTP304 and retained body {durations:[],configurations:[]}; live duration/stake controls remain unavailable. Remote production D1 read succeeded (Wrangler4.127.1, rowsWritten0): 85 enabled rows for 17 pairs, 14 current canonical crypto pairs; MASK/STEEM/SUSHI have no enabled rows and AVAX/LINK/MATIC are noncanonical configured pairs. The prior Cloudflare7403/UNKNOWN finding is superseded. The BinaryService source inspected on 2026-10-04 filtered rows through market policy binary=false and supportedBinaryDurations=[]; settlement remains disabled/UNAPPROVED, with no approved provider authority found. Admin configuration updates do not confer settlement approval. Backend deployed-source equivalence was not newly proven. Owner-approved provider/pair settlement policy is required before enabling financial behavior; do not hardcode durations/payouts or mutate Admin/D1 merely to populate controls. Receipt: /home/mellonelay1999/nexi-phase-receipts/p03-binary-configuration-read-20261004.json. Quote/submit/countdown/settlement E2E remains open.

Fresh Worker metadata identifies deployment f41876b3-e8dd-4bf0-8043-61a81ecbb86f, Worker version 2ef838f5-f96a-4f48-99e2-db9d80dbc0b4 (September-26 canonical-host migration). The NestJS container code generation remains recorded as ed26973f; Worker metadata alone does not establish a newer container implementation SHA. This supersedes bdadd96f as the current Worker UUID, while preserving its historical promotion provenance.

Historical superseded generation — Git fan-in checkpoint: verified candidate and three preserved local checkpoints are durable at GitHub main `8dc1bec8646aa777795ceb1bb8c24e1ddad1435e`. Canonical build is verified; production still be50529 until promotion and browser proof.

Historical superseded generation — Deployment checkpoint 2026-10-03: Public current -> /srv/nexi/public/releases/8dc1bec-public-convergence-prod, NEXI_RELEASE_SHA=8dc1bec8646aa777795ceb1bb8c24e1ddad1435e, service active; local origin and external Dashboard HTTP 200. This supersedes be50529 as current implementation while retaining its completed geometry proof. Authenticated changed-behavior acceptance remains pending; no full Public or platform completion claim.

Historical superseded generation — Changed-behavior failure 2026-10-03: deployed 8dc1bec metric values exist, but generic scroll snapping combined with reordered MA/EMA spans selects a non-leading start position and hides MA/EMA values on initial mobile render. P-02 presentation remains OPEN_DEFECT. Repair scope is the metric rail only; engine and completed geometry primitives remain unchanged. Chrome was recovered using the same existing profile after its former process disappeared; real refresh201/auth-me200 resumed. Polypane protected route currently renders Verify wallet; pane labels/old owner sign-in are not fresh application authentication proof.

## P04 — Wallet successful-empty activity — 2026-10-04

**Historical status (2026-10-04): COMPLETE at the deployed P04 slice scope.** At that proof checkpoint, exact SHA `702ee5d83c82e2708fced19b0f424ff5d285e40a` matches local HEAD, origin/main, GitHub main, deployed source and release marker. Release `702ee5d-public-wallet-empty-prod` was active at that dated checkpoint; `nexi-public.service` process CWD resolves to that release.

The Wallet owner renders EMPTY only for a successful explicit [] or {activities:[]}. Missing/non-array collections and malformed/non-ledger rows remain errors; valid ledger-backed rows preserve real identity. Activity and balance readers own separate failure states, consistent with Public DESIGN.md sections 15/19 and separate backend readers.

Focused tests 15/15, TypeScript, focused lint, 23 existing render-tree comparisons, canonical Next production build, and standalone packaging passed. CodeScene health is 10.0/10 for Wallet and its changed test; safeguard passed with two eligible files.

**Polypane runtime proof:** real cached activity response [] (HTTP 304) rendered “No wallet activity yet”; real wallet response {} (HTTP 304) contained no nonzero balances. A client-only, page-local XHR test intercepted both wallet endpoints without contacting the backend: a labeled /wallet/me 200 fixture rendered total 8450.25, available 7920.25, locked 530.00, and BTC 0.5/0.6 while a controlled /wallet/activity 503 rendered “Activity authority unavailable”. The page did not show EMPTY or the wallet error. The original XHR methods were restored and the test hook removed. A subsequent real refresh returned 401 from both wallet endpoints as the application session expired; page 6 displayed both errors and its console showed 401 resource errors and an uncaught promise on the refresh/XHR path. Thus UI isolation is proven with controlled client data, while a real account nonzero-balance failure proof is unavailable because the actual wallet had no nonzero balance. No backend data changed, no fresh SIWE was signed, and the unmodified 320px pane continued to show the real cached empty state.

**Bounded Graphify + Fallow:** local Graphify 0.9.72 graph is built at exact P04 SHA `702ee5d83c82e2708fced19b0f424ff5d285e40a` (7,607 nodes/17,060 links). The causal owner is `app/dashboard/wallet/page.tsx`: `useWalletAuthority()` calls `loadWalletData()`, which calls `readAuthority()`; the `readActivities()` edge is inferred. Git confirms the P04 commit changes this page and `tests/wallet-activity-response.test.mjs`. Fallow 3.30.0 was scoped to the Public app: page inspect reports 12 imports, one importer, six estimated-zero-coverage complexity/CRAP findings, and zero duplication; the focused test inspect reports one import, no importer, and zero duplication. Fallow cannot resolve the `.mjs` test into its static module graph; its base review calls the test unreachable with an incomplete-import-graph caveat and reports seven changed files although Git shows two. This is an analyzer coverage/scope limitation; the focused test passed 15/15. Architecture zones/rule packs are not configured. Wallet actions, backend ledger, auth/provider, charts, icons, and geometry are unchanged.

P01 icon identity/quality was subsequently proven on 2026-10-04; remaining Quotes E2E, P03 runtime configuration/settlement, and OWNER_FINAL_ACCEPTANCE remain open. Geometry remains closed. No writable ChatGPT Workspace Memory capability was exposed; compact Worker 0 continuity is saved.

## Current P02/P03 source candidate — 2026-10-06

P02: shared chart source removes repeated pair/timeframe identity and keeps the existing numeric metrics/engine/overlays. Spot controls remain below the plot; Binary retains overlays without adding the Spot control rail. Rendered changed-behavior proof remains open.

P03: owner-authorized `binance-spot` crypto settlement policy and approved-entry-provider enforcement are Git-integrated in source commit `ff80eb300b3c813f788665ea864b7f7baa27a29a`. Fresh read-only Cloudflare D1 evidence on 2026-10-06 confirms all 85 enabled configuration rows and 17 LIVE `binance-spot` `MarketQuoteLatest` rows with zero rows written. D1/Admin configuration remains enabled-duration/payout/stake authority; Options five boxes are configuration-driven and preserve Long/Short, review, active countdown and History/WIN/LOSS. Earlier no-approved-provider statements describe the 2026-10-04 baseline and do not override this owner/source candidate. Cloudflare source/runtime equivalence and full Binary E2E remain unproven. No production financial action or new product build/deploy occurred. Row classifications/counts are unchanged.

## Pre-build engineering review and source repairs — 2026-10-06

Source-only batch: removed chart pair/timeframe duplication while preserving numeric metrics, engine and overlays; kept Options configuration-driven with mobile stake ranges and selected-state accessibility; aligned Spot/Options header and bottom navigation with existing DESIGN.md glass tokens; repaired reduced-motion feedback and opaque high-contrast/transparency fallbacks. UI/UX Pro Max is advisory; no Apple Liquid Glass redesign or geometry reopening.

Worker private gateway JSON parsing now enforces its existing 256 KiB limit while reading bytes and cancels oversized streams. Five behavioral regressions cover boundaries, misleading/missing lengths, UTF-8 and failures. Other body-reading paths are outside this bounded repair. Source SENTRY_RELEASE was corrected to the exact existing live 40-character Git SHA; no backend deployment occurred.

Focused proof: Worker suite 15/15; backend suites 12/12 including production-mode configuration policy preserving D1 payout/min/max and the five approved durations; frontend chart/Options checks, TypeScript, design conformance and CSS parsing passed. Focused frontend lint has zero errors and four existing effect warnings. CodeScene staged safeguards passed for the Public, Binary and Worker commits after bounded complexity repairs. Pre-build source Git integration is implemented locally through `9fa6002...`; no production build or deployment is claimed.

Live truth: Cloudflare Worker deployment f41876b3-e8dd-4bf0-8043-61a81ecbb86f remains active; readiness is healthy. Fresh read-only Cloudflare D1 evidence on 2026-10-06 confirms 85 enabled Binary rows across the five durations (17 each; payout 0.85, stake 1–1000) and 17 LIVE `binance-spot` rows in `MarketQuoteLatest`; the query wrote zero rows. Actual Polypane public GET /binary/config returned HTTP 200 with zero configurations/durations. The Git-integrated source implementation frontier passes the production-policy regression, but deployed backend equivalence and configuration/settlement acceptance remain open. Public remains `5aafc0ff74cd715a77de3bc22d96603dbc2c4943` in `/srv/nexi/public/current`; source implementation is integrated through `9fa600243cf7e57bbb60b22413debc1c64f6c7c2`, with this documentation revision following those implementation commits. Remote GitHub fan-in is verified. The completed source batch now requires backend promotion planning, then the owner-authorized production promotion/build path and changed-behavior production proof. No full product acceptance or ledger-row upgrade.


## D1 read optimization and current Cloudflare blockers — 2026-10-06

Remote D1 is `nexi-core-staging` (`522177fa-ac42-4d8f-a6a8-b34eed262f15`), the `CORE_DB` binding used by the production Worker; its historical resource name does not indicate environment. Migration `0009_market_read_indexes` is applied and present at GitHub `main` commit `3f9f366`, with this ledger entry recording the applied change. It records the existing `MarketQuoteSnapshot_pairId_numericSequence_idx` expression index and creates `MarketKline_interval_openTime_pairId_symbol_close_idx`. This checkpoint reconciles the applied change in the current-state ledger.

Before the Kline index, the 1-hour D1 Insights sample reported 7,609 average rows read for the multi-pair prices query and a temporary B-tree sort. After the index, the production-shaped query returned 848 rows with 901 D1 rows read in a one-shot Wrangler execution. `EXPLAIN QUERY PLAN` now uses the new index and no longer reports `USE TEMP B-TREE FOR ORDER BY`; the ORM projection still includes `id`, so the plan is not reported as covering. This is an observed per-query reduction, not a settled monthly bill projection. The added index increased D1 size from about 4.24 GB to 4.38 GB (about 139 MB); ongoing Kline writes now maintain another index. Five-minute Insights returned no samples, so recheck a clean post-index window before projecting total account savings. The quote UPSERT remains at about 2 average rows read.

Cost inventory: no Logpush jobs exist and Worker `logpush=false`. Worker Logs and traces are still persisted at 100% sampling in Wrangler configuration; Container logs are enabled. The single running `nexi-api` instance (`fde387...`) is the Container backing `nexi-production`, so it was not stopped; no separate PoC application was listed. `/health` and `/ops/ready` return 200; `/market/prices` returns 53 items. `/binary/config` still returns empty arrays, an unrelated open production defect.

Builder check: installed `cf` is `1.0.0-beta.12`; `cf containers build` requires a Docker binary, and SSH only provides runtime access. No Workers Builds configuration is associated with `nexi-production`. No Worker/Container deployment, observability change, secrets change, or container stop occurred. Remote production promotion remains blocked until a Docker-compatible image builder or an authorized remote Workers Builds path is available.
