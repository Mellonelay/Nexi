# NEXI Current State

**As of:** 2026-10-06 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Durable source authority:** GitHub `main`; current production host/CORS/SIWE values below were read directly from the Cloudflare API on 2026-09-26. The Public domain source alignment is recorded in this revision; discover the exact current `main` SHA before consequential work.
**Current deployed Public implementation frontier:** `5aafc0ff74cd715a77de3bc22d96603dbc2c4943`, active in the real `/srv/nexi/public/current` directory. The verified pre-build source implementation frontier is `9fa600243cf7e57bbb60b22413debc1c64f6c7c2` (Public `2d41d40...`, Binary `ff80eb3...`, Worker `9fa6002...`); it is not deployed. This documentation reconciliation may make GitHub `main` newer without changing that implementation frontier. P04 repair and 53-icon/geometry proof are retained within their original scope.

NEXI is in a **finishing / targeted-repair** phase. It is not in a rebuild or broad rediscovery phase.

## Authority and architecture

- ChatGPT is the parent/controller; RDC Worker 0 is the operator/evidence plane.
- Cloudflare Worker -> Cloudflare Container -> NestJS is the only backend runtime/acceptance authority.
- Worker 0 must not host or substitute a VM-local NestJS backend for production proof.
- NestJS owns business/domain logic.
- D1 owns durable application and financial relational truth.
- Ledger owns accounting truth; EventOutbox is the durable publication boundary.
- Aiven Valkey owns realtime/cache/Streams/ephemeral coordination only.
- Queues own delivery/retry; Workflows own orchestration.
- Public and Admin consume/control the same canonical backend authority.
- `PROVEN + UNCHANGED = REUSE`; do not reopen completed work without dependency drift or contradictory evidence.
## Current live source and deployment split

Public/backend reachability and source split reverified on 2026-10-06; Admin/backend release identities below retain dated provenance:
- The pre-build source implementation batch is integrated through `9fa600243cf7e57bbb60b22413debc1c64f6c7c2`; post-push verification confirmed GitHub `main` contains Public `2d41d40...`, Binary `ff80eb3...`, Worker `9fa6002...` and the state reconciliation commit. Discover live `HEAD`/`origin/main` before consequential work rather than treating this sentence as a permanent SHA lock.
- Public RELEASE_SHA remains `5aafc0ff74cd715a77de3bc22d96603dbc2c4943`; `/srv/nexi/public/current` is a real directory, not a release symlink. Public service is active; production `/dashboard` returned HTTP 200.
- Product source is committed in three reviewed pre-build commits: Public `2d41d40...`, Binary `ff80eb3...`, Worker `9fa6002...`. Only state/ledger/capability-routing reconciliation remains uncommitted at this checkpoint. No product build/deploy was performed.
- Wallet page/test and the 53 asset icon files are unchanged between deployed Public and current HEAD; retain their scoped prior proof. Broader Wallet/Quotes E2E remains open.
- Public source/runtime framework: Next.js `16.3.5` + React `19.3.0`.
- Public standalone packaging now includes the root server entry plus traced dependencies, `.next/static`, and `public` beside the server. The deployed `/dashboard` returned HTTP 200 and all 45 referenced static assets returned HTTP 200 with expected MIME types during the 2026-09-27 deployment verification.
- Admin: `/srv/nexi/admin/current -> /srv/nexi/admin/releases/ed26973f-prod-node`.
- Admin `NEXI_RELEASE_SHA = ed26973fe0556a6d75943b3e296be0a899449d6d`; service active.
- No Admin source files changed between `ed26973...` and the dated `12cf799...` main checkpoint; the older Admin release marker does not currently imply an Admin source mismatch.
- Cloudflare backend deployment remains the `ed26973f` unified production promotion: deployment `15c716b8-8ae5-45ec-a9f2-b2d2f6f0c89d`, Worker version `bdadd96f-3696-474b-955d-de490a9a466d`.
- Current GitHub `main` contains later backend Sentry/ENOENT source changes after `ed26973...`; they are source-integrated but are not claimed deployed by this document.
- Current Cloudflare backend reachability/readiness proof (2026-10-06; deployed source equivalence not established): `/health` = 200 and `/ops/ready` = 200 with `database=true`, `redis=true`.

This is intentionally a split identity. Do not describe the whole product as one current unified deployment SHA when Public, Admin, and backend release identities differ.
## Current external reachability and canonical-host contract

Owner decision on 2026-09-26: Public frontend uses `https://www.nexitrading.app`; backend API uses `https://api.nexitrading.app`; Admin uses `https://admin.nexitrading.app`. Do not redirect Public traffic back to `app` or apex.

Latest origin supersession: on 2026-10-01 Worker-0 IP and Cloudflare `www`/`admin` A-record targets were verified at `34.143.137.221`. The dated 2026-09-26 snapshot below is retained as historical context only.

Live Cloudflare API read on 2026-09-26 verified:
- Proxied A records for `www` and `admin` point to `35.187.234.62`.
- Proxied originless A records for apex and legacy `app` point to `192.0.2.0`.
- An enabled zone redirect rule returns HTTP 308 from apex and legacy `app` to `https://www.nexitrading.app`, preserving path and query.
- `api.nexitrading.app` is a Cloudflare Worker Custom Domain attached to service `nexi-production`, environment `production`.
- Live Worker plain-text vars are `CORS_ORIGINS=https://www.nexitrading.app,https://admin.nexitrading.app`, `WALLET_AUTH_DOMAIN=www.nexitrading.app`, and `WALLET_AUTH_URI=https://www.nexitrading.app`.

Fresh preserved-Chrome Requestly passive capture on 2026-10-01: market prices 200; auth refresh 201; authenticated auth/me 304; Socket.IO polling 200 and WebSocket upgrade 101. Current browser evidence does not reproduce the historical CORS/401/503 failures. This is bounded Spot transport/session proof, not market-wide or real-device acceptance.


## Public frontend correction and preserved proof

The Public shell wallet-boundary defect was repaired at `04c8f5f...` and remains unchanged in the freshly verified `6f74ce6...` Public source:
- non-protected Public market/product surfaces remain accessible without a NEXI wallet session;
- protected wallet/account/financial actions remain identity-gated;
- the global dashboard shell must not be re-wrapped in a wallet gate.

The current Public release also fixes standalone asset packaging: production HTML referenced missing JavaScript, CSS, fonts, and public assets because the standalone release omitted `.next/static` and `public`. The source build now copies both beside the standalone server and preserves the server entry/traced dependencies. The deployed release returned HTTP 200 for `/dashboard` and all 45 referenced static assets during the 2026-09-27 verification.

2026-10-04: all 53 production asset icons loaded and passed rendered identity/quality inspection in existing Polypane5859 at 320x568 (17 Crypto, 7 Metals, 9 Forex, 20 Stocks). Corrected Ethereum Classic/Solana captures were separately inspected. Receipt: /home/mellonelay1999/nexi-phase-receipts/p01-rendered-20261004/rendered-identity-receipt.json. This closes icon proof only; Quotes interaction/data/favorites E2E and owner acceptance remain open.
## Browser / rendered acceptance frontier

Production browser acceptance must target the **deployed Public generation** at `https://www.nexitrading.app` while it exercises the real Cloudflare backend at `https://api.nexitrading.app`.

Browser ownership:
- PRIMARY frontend/product/reference acceptance: Polypane FIRST via explicit DevTools CLI/MCP5859. Never Playwright for Polypane. Chrome5858 only for distinct MetaMask/session proof.
- Requestly supplies passive HTTP evidence; React DevTools supplies component/state diagnostics where needed.
- BrowserStack supports distinct real-device/cross-browser claims. Authentication is proved per browser/pane.

Historical unchanged geometry proof (Spot at `142a4aa`, reused through `be50529`; Margin repair introduced at `a924e0d` and unchanged through `be50529`):
- Closed drawer is display:none with zero geometry across the tested mobile/landscape/tablet/desktop probes; corrected real pointer close succeeds.
- Chart container and rendered lightweight-chart dimensions track responsive transitions within 1 CSS px after settling.
- Bottom dock remains present on mobile, desktop sidebar hidden, and tested Spot page overflow is zero.
- Source-delivered CSS at `142a4aa` (no injected prototype styles): tested Spot 320/360/390/430 widths, short-height, 480/568/844 landscape, tablet and desktop-class rendered states; chart/canvas dimensions agree within 1 CSS px, pair/price do not overlap, and market panels switch exclusively below the desktop composition breakpoint. Observed desktop CSS widths reflect the preserved calibration, not nominal device pixels.
- Fresh boundary 2026-10-01T08:43:29.399Z: prices/klines and Socket.IO polling returned 200; no page errors were captured during these checks. This is bounded changed-behavior proof, not product-wide acceptance.
- Margin boundary 2026-10-01T09:11:54.818Z: new build delivered; refresh 201, me 200, prices/klines/polling 200, no console errors. Mobile coarse-pointer probes passed; plot reachable with 16px dock clearance via the shared MAIN scroll owner. Canceled navigation/third-party telemetry requests were retained separately from application failures.
- Owner re-authenticated the existing wallet; real app refresh/me requests prove a valid current session. No wallet setup or SIWE re-investigation is required absent fresh contradictory evidence.

## Public product/reference convergence frontier — 2026-10-03

The responsive/mobile geometry phase remains **COMPLETED**. The next Public frontend work is a bounded product/reference-convergence and full E2E pass, not another geometry redesign.

Current demonstrated gaps:
- **Dashboard / asset identity:** 2026-10-04: all 53 production asset icons loaded and passed rendered identity/quality inspection in existing Polypane5859 at 320x568 (17 Crypto, 7 Metals, 9 Forex, 20 Stocks). Corrected Ethereum Classic/Solana captures were separately inspected. Receipt: /home/mellonelay1999/nexi-phase-receipts/p01-rendered-20261004/rendered-identity-receipt.json. This closes icon proof only; Quotes interaction/data/favorites E2E and owner acceptance remain open.
- **Spot/Margin chart presentation:** current source candidate removes duplicated pair/interval labels within the chart and places the Spot six-control rail below the plotted region. OHLC/MA/EMA/RSI/MACD values, overlay calculations/series, resize behavior and existing chart dimensions remain. Source checks do not establish rendered convergence; P-02 and full trading E2E remain open.
- **Options/Binary:** the 2026-10-04 production baseline remains `/binary/config = {durations:[],configurations:[]}` while remote D1 contains 85 enabled rows across five durations. The owner has now approved `binance-spot` as the crypto Binary settlement authority, and source commit `ff80eb3...` enforces that provider for entry/settlement while keeping non-crypto disabled and D1/Admin authoritative for enabled durations, payout and stake ranges. The 2026-10-04 no-approved-provider finding is historical. Current blockers are Cloudflare backend promotion/equivalence, live config/quote/settlement proof and full Binary E2E; do not hardcode frontend durations or payouts. Historical receipt: /home/mellonelay1999/nexi-phase-receipts/p03-binary-configuration-read-20261004.json.
- **Wallet:** shared-header identity and the scoped successful-empty/activity-isolation repair remain proven unchanged. Real nonzero-balance isolation and broader Wallet acceptance remain open; do not reopen the completed repair.

The accepted September reference family remains Quotes Hub, Spot/Margin, Options/Binary, wallet chooser, and Wallet, adapted to current NEXI runtime truth. Old Sep-12/13 V2/V3 authority, app.nexitrading.app, VM-local backend acceptance, consumer STALE/provider-health wording, BrowserStack-first authenticated acceptance, and the Sep-15 narrow completion model remain superseded.

Owner-reported 2026-10-03 state: Polypane has now been wallet signed-in. Treat that as current owner state, while feature acceptance that depends on NEXI application authentication still uses the real /auth/me result plus rendered signed-in state when needed. Do not repeat wallet/profile/SIWE setup absent contradictory evidence.

## Open completion gates

- Public responsive/mobile geometry is **COMPLETED**, introduced at `be50529b789786fd83d808178f386b015f77b1f3` and reused unchanged through the verified `6f74ce6...` release within the defined geometry scope. The final shared AppHeader repair keeps the normal mobile header at 56px including true 320×568, preserves the full wordmark from 360px upward, and exposes the mobile menu as `NEXI, Open application menu`. Existing Spot/Margin chart/drawer geometry proof remains reused unchanged.
- Fresh authenticated deployed proof covers Dashboard/Quotes, Asset Detail, Options and Wallet geometry plus shared header/drawer behavior. Tested 320/360/390/430 widths, short-height 360×640, landscape 568×320, tablet 768×1024, 200% text stress, safe-area propagation and reduced-height search/keyboard behavior show zero tested document/main horizontal overflow and bounded controls. BrowserStack real-device/cross-browser claims remain separate.
- Targeted real-device/cross-browser acceptance and WalletConnect production-visible UX remain separate product-acceptance work; they are not asserted by the completed geometry phase.
- Only the broad NON-CRYPTO stale/session-hours investigation is deferred. Crypto realtime, all 53 assets, chart intervals/continuity and Public/backend/Admin dependency-ready product paths remain in scope; the bounded Public responsive/mobile geometry phase is closed unless contradictory evidence appears.
- Current-main backend changes after `ed26973...` are not claimed deployed.
- Full Sentry release-lifecycle/source-map/runtime proof remains incomplete.
- Other Public/Admin/financial/async/realtime rows remain controlled by the completion ledger. No financial or privileged Admin action is authorized by frontend acceptance.
- Controlled Admin identity acceptance and owner final acceptance remain open.

## Documentation and continuity

- `NEXI_PRODUCTION_COMPLETION_LEDGER.md` is the sole writable completion controller.
- `NEXI_CURRENT_STATE.md` is current durable truth, not a chronological diary.
- Root `AGENTS.md` owns NEXI execution/governance instructions.
- `docs/operations/NEXI_CAPABILITY_ROUTING.md` is the NEXI routing overlay.
- `/home/mellonelay1999/.agents/BROWSER_FABRIC.md` owns browser-tool responsibility and production browser workflow.
- Public-local `AGENTS.md` and `DESIGN.md` govern the canonical Public frontend.
- Historical analysis/recovery material belongs under `docs/archive`; it must not compete with current authority.

## Next dependency-ready direction

Do not reopen the completed Public geometry phase without fresh contradictory evidence. Preserve the be50529... deployed proof. The active owner-selected frontier is now Public product/reference convergence plus full Public E2E closure under the production completion ledger; after those Public rows close, continue the remaining backend/market, identity/financial, communications, Admin, async/reliability and final-gate rows without skipping them.

`FULL_PRODUCTION_END_TO_END_ACCEPTED = NO`

## Public responsive/mobile geometry closure — 2026-10-02

Fresh deployed evidence for implementation `be50529b789786fd83d808178f386b015f77b1f3`:

- canonical production build `/srv/nexi/public/build-be50529-20261002-121819` -> release `/srv/nexi/public/releases/be50529-geometry-prod`; service active; local and external dashboard HTTP 200;
- focused changed-scope tests, ESLint, TypeScript and Fallow checks passed before promotion;
- preserved Worker-0 Chrome/MetaMask NEXI session was re-verified through SIWE on Ethereum chain 1 with **No changes**; no financial transaction occurred;
- authenticated Dashboard geometry passed 320×568, 360×800, 390×844, 430×932, 360×640, 568×320, 768×1024 and the calibrated desktop-class probe with zero tested document/main horizontal overflow and in-bounds header controls;
- 200% text stress at 320×568, 390×844 and 568×320 reflowed vertically without horizontal overflow or header-control escape;
- 320 drawer opened within the viewport with `overflow-y:auto` and focus on `Close application menu`;
- safe-area emulation produced `env(safe-area-inset-bottom)=34px` and 54px computed drawer bottom padding;
- reduced-height 390×544 search state exposed/focused the market search input inside the viewport with zero page overflow;
- authenticated Options and Wallet route checks at 320×568 retained the wallet session, 56px header and zero page/main overflow; Asset Detail was separately measured at authenticated 320×568 with the same geometry result.

`PUBLIC_RESPONSIVE_MOBILE_GEOMETRY_PHASE = COMPLETED`

This does not upgrade unrelated market/backend/Admin/financial/product-lifecycle rows or owner final acceptance.

## Work continuity control — 2026-10-02

The existing skill checkpoint now enforces project-owned phase reconciliation (`scripts/nexi_phase_checkpoint.py`). Active engineering `workCycle` and sealed phase receipts preserve prior proof; skill fingerprints persist outside `/tmp`. Eight focused checks and real wrapper transition/recovery checks passed. Parent semantic review remains required; this is not an automatic ChatGPT host hook or product acceptance. See `docs/operations/NEXI_PHASE_RECONCILIATION.md`. Public geometry remains completed; geometry proof remains tied to `be50529...`; current Public is `5aafc0f` in `/srv/nexi/public/current`; full production end-to-end acceptance remains NO.

## Public convergence candidate checkpoint — 2026-10-03

Historical superseded convergence candidate (2026-10-03): replaced 36 placeholder asset SVGs, improves ADA contrast, exposes actual MA(20)/EMA(20)/EMA(50) values with existing chart-series colors, and removes the authenticated Wallet body identity duplicate. Additional bounded repairs normalize Mining boolean/numeric enabled flags and decimal limits, separate public Loans catalog loading from protected history, distinguish Support read failures from empty state, remove the Settings profile-read/session-event request loop, make Messages read-service status truthful, and format Asset Detail backend values. These changes were integrated and deployed in the superseded `8dc1bec-public-convergence-prod` generation; current Public is `5aafc0f` in `/srv/nexi/public/current`. Full route/icon/lifecycle acceptance remains open. Canonical typegen/typecheck and 20 focused tests passed; the communications-contract test passed from its required repository context. Fallow returned WARN with zero introduced dead-code/complexity findings; the attributed socket-cleanup clone is pre-existing. Canonical production build PASSED at /srv/nexi/public/build-public-convergence-20261003-0510 using the existing NEXT_TURBOPACK_ROOT=/srv/nexi/public override. Git fan-in and deployment occurred at `8dc1bec`; current Public supersedes that release. Retained candidate gates do not establish full product acceptance. Closed geometry proof remains unchanged.

2026-10-04 P03 BLOCKED_WITH_EVIDENCE: actual Polypane GET /binary/config revalidated HTTP304 and retained body {durations:[],configurations:[]}; live duration/stake controls remain unavailable. Remote production D1 read succeeded (Wrangler4.127.1, rowsWritten0): 85 enabled rows for 17 pairs, 14 current canonical crypto pairs; MASK/STEEM/SUSHI have no enabled rows and AVAX/LINK/MATIC are noncanonical configured pairs. The prior Cloudflare7403/UNKNOWN finding is superseded. The BinaryService source inspected on 2026-10-04 filtered rows through market policy binary=false and supportedBinaryDurations=[]; settlement remains disabled/UNAPPROVED, with no approved provider authority found. Admin configuration updates do not confer settlement approval. Backend deployed-source equivalence was not newly proven. Owner-approved provider/pair settlement policy is required before enabling financial behavior; do not hardcode durations/payouts or mutate Admin/D1 merely to populate controls. Receipt: /home/mellonelay1999/nexi-phase-receipts/p03-binary-configuration-read-20261004.json. Quote/submit/countdown/settlement E2E remains open.

Fresh Worker metadata identifies deployment f41876b3-e8dd-4bf0-8043-61a81ecbb86f, Worker version 2ef838f5-f96a-4f48-99e2-db9d80dbc0b4 (September-26 canonical-host migration). The NestJS container code generation remains recorded as ed26973f; Worker metadata alone does not establish a newer container implementation SHA. This supersedes bdadd96f as the current Worker UUID, while preserving its historical promotion provenance.

Historical superseded generation — Git fan-in checkpoint: verified candidate and three preserved local checkpoints are durable at GitHub main `8dc1bec8646aa777795ceb1bb8c24e1ddad1435e`. Canonical build is verified; production still be50529 until promotion and browser proof.

Historical superseded generation — Deployment checkpoint 2026-10-03: Public current -> /srv/nexi/public/releases/8dc1bec-public-convergence-prod, NEXI_RELEASE_SHA=8dc1bec8646aa777795ceb1bb8c24e1ddad1435e, service active; local origin and external Dashboard HTTP 200. This supersedes be50529 as current implementation while retaining its completed geometry proof. Authenticated changed-behavior acceptance remains pending; no full Public or platform completion claim.

Historical superseded generation — Changed-behavior failure 2026-10-03: deployed 8dc1bec metric values exist, but generic scroll snapping combined with reordered MA/EMA spans selects a non-leading start position and hides MA/EMA values on initial mobile render. P-02 presentation remains OPEN_DEFECT. Repair scope is the metric rail only; engine and completed geometry primitives remain unchanged. Chrome was recovered using the same existing profile after its former process disappeared; real refresh201/auth-me200 resumed. Polypane protected route currently renders Verify wallet; pane labels/old owner sign-in are not fresh application authentication proof.

## Historical P04 completion — 2026-10-04

P04 slice status: COMPLETE at deployed changed-behavior scope. Polypane owns frontend/product/reference verification; use explicit DevTools CLI on 5859, not Playwright. Chrome 5858 is not running and was not used. Geometry remains CLOSED.

At the 2026-10-04 proof checkpoint, HEAD, origin/main, GitHub main, deployed source, and release marker were `702ee5d83c82e2708fced19b0f424ff5d285e40a`. Public current symlink and active process CWD are `/srv/nexi/public/releases/702ee5d-public-wallet-empty-prod`; `nexi-public.service` is active.

Only a successful explicit [] or {activities:[]} renders EMPTY. Missing/non-array collections, malformed rows, and rows without real ledger identity do not render empty. Valid ledger-backed rows preserve identity. Wallet and activity reads are independent. Focused tests 15/15, TypeScript, focused lint, 23 before/after render-tree comparisons, canonical production build, and standalone packaging passed. CodeScene health: Wallet 10.0/10, focused test 10.0/10; safeguard passed with two eligible files.

Polypane production page 6 at 500x768 showed the real cached activity body [] (HTTP 304) as “No wallet activity yet”; the accompanying wallet body was {} (HTTP 304), so this account had no nonzero balances. In a controlled client-only test, page 6 intercepted both wallet endpoints without sending requests to the backend: /wallet/me returned a labeled test fixture (total 8450.25, available 7920.25, locked 530.00, BTC 0.5 available/0.6 total), while /wallet/activity returned controlled 503. The page retained the visible wallet figures, rendered “Activity authority unavailable,” and did not render EMPTY or the wallet error state. The XHR methods were restored and the test hook removed. The subsequent real refresh returned 401 for both endpoints; page 6 showed wallet and activity errors, and its console recorded 401 resource errors plus an uncaught promise on the refresh/XHR path. The 500px real-balance production proof is limited to a client fixture; no actual nonzero balance existed. The 320px Polypane pane continued to show the cached real EMPTY state. No SIWE request was signed and no backend data was changed.

Final bounded structural review used only the exact P04 changed files and direct Wallet owner. Local Graphify 0.9.72 `graphify-out/graph.json` is built at `702ee5d83c82e2708fced19b0f424ff5d285e40a` (7,607 nodes/17,060 links). It identifies `app/dashboard/wallet/page.tsx` as the causal owner: `useWalletAuthority()` calls `loadWalletData()`, which calls `readAuthority()`; the `readActivities()` edge is inferred. The exact P04 commit changes only that page and `tests/wallet-activity-response.test.mjs`. Fallow 3.30.0, rooted at the Public app, reports 12 page imports, one importer, six estimated-zero-coverage complexity/CRAP findings, and zero duplication for the inspected page/test. It cannot statically connect the `.mjs` test: focused inspection marks it unreachable, and `fallow review --base HEAD^` classifies it unused with an incomplete-import-graph caveat while reporting seven changed files although Git shows two. Treat those as analyzer coverage/scope limitations, not a test failure; focused tests passed 15/15. No architecture zones or rule packs are configured. Wallet actions, backend ledger, auth/provider, chart indicators, icons, and geometry are unchanged.

P01 53-icon identity/quality proof is preserved unchanged; remaining P01 Quotes interactions/data/favorites, P02 rendered feedback/full E2E, P03 backend promotion/runtime configuration and settlement proof, and OWNER_FINAL_ACCEPTANCE remain open. Compact Worker 0 continuity is saved; no writable Workspace Memory persistence capability was exposed. Attached bootstrap/catalog copies include stale Chrome-primary wording; current owner routing remains Polypane first.


### Destination frontier 2026-10-04

2026-10-04 production BTC Spot chart renders actual MA(20), EMA(20), EMA(50), RSI(14), canvases and existing indicator/timeframe controls. Spot open orders/margin positions returned401; depth/trades revalidated304. No order or financial action performed. Full Spot/trading E2E remains unproven; indicator authority and closed geometry preserved. Receipt: /home/mellonelay1999/nexi-phase-receipts/p01-rendered-20261004/spot-dom.json.

Native Workspace Memory has no exposed writable capability in this destination; verified continuity is saved and reread in the Worker-0 checkpoint. P01 icon scope passed; P03 owner approval is Git-integrated in the verified source implementation frontier. The next causal gate is Cloudflare backend promotion/equivalence and live Binary acceptance. OWNER_FINAL_ACCEPTANCE remains OPEN.

## Cross-session memory routing — 2026-10-05

Added the Worker-0 companion skill `~/.agents/skills/nexi-workspace-memory/SKILL.md` and linked it from the Worker-0 Kernel, global capability/router docs, and project capability router. It separates ChatGPT Workspace Memory, Agent Kernel governance, Worker-0 operational checkpoint, Graphify repository structure/Work Memory, GitHub source, and historical chat exports. Live checks found no `~/.memory` or repo `.memory` index on Worker-0; Graphify MCP recall reports `unsupported`. No Workspace Memory or Graphify Work Memory write is claimed; use the verified Worker-0 checkpoint for operational continuity.

## Bounded Public continuation — 2026-10-05

Live source and active Public release agree at `5aafc0f`. The sole source delta from P04/icon proof baseline `702ee5d` is scoped Spot ripple CSS; Wallet implementation/tests and local asset icon files are unchanged. Reuse the 53-icon rendered receipt; do not repeat icon setup or reopen geometry. P04 scoped activity repair remains proven, while the latest recorded real refresh is 401 and real-account nonzero-balance isolation remains unproven.

Original 12-slide `Nexi Design System (final).pptx` was read directly: shell/raised glass, crisp unblurred execution surfaces, and visual press/ripple feedback are specified; no device-vibration implementation or Liquid Glass requirement is established. Current source already contains the three surface tiers and visual feedback rules. P02 deployed ripple application/reduced-motion proof remains open: the running Polypane 31 endpoint is reachable, but its current app target shows only “Font”, with no NEXI pane targets. No new feature source, build, deployment, financial action or geometry change was made. Next dependency-ready Public proof is P01 Quotes interactions/data/favorites, with P02 existing scoped visual-feedback proof retained as an open required path after usable Polypane panes are restored.

## Worker-0 DeepWiki / mcpc operational state — 2026-10-06

Worker-0 DeepWiki is closed out and ready for normal use. MCP client authority is mcpc 0.7.0 with @nexi-deepwiki; rdc-mcp deepwiki remains compatibility syntax only. The canonical supported surface is 64 tools; live discovery returns one additional deprecated compatibility alias, get_architecture_summary. The 64-tool receipt is stored at ~/.local/share/nexi-mcp/audits/deepwiki-64-tools-20261006/.

Runtime is FastEmbed 0.8.1 + ONNX Runtime 1.30.0 with multi-qa-MiniLM-L6-cos-v1 AVX2 INT8 and LanceDB 0.39.0 exact-flat search. Canonical index schema v3 contains 340 files / 4,159 chunks and records source commit a1014882819dd0d077a8838220295614108a1442 with dirty-worktree provenance. Canonical wiki generation completed successfully with 250 file-doc items, 6 module items, 6 codemaps and 277 Markdown pages.

LLM synthesis uses the existing OpenRouter OpenAI-compatible configuration with model openrouter/free only. Request timeout is 30 seconds, SDK retries are disabled, and the Local DeepWiki retry layer owns bounded retry. Routine refresh is incremental; full rebuild is recovery-only. DeepWiki sessions should be closed after semantic work. Stale build directories, temp files, audit logs, Python caches, installer caches, and the retired custom DeepWiki transport were removed. The Hugging Face model artifact cache is intentionally retained.

## Current preserved source frontier — 2026-10-06

The owner-approved `binance-spot` crypto Binary settlement policy is Git-integrated in source commit `ff80eb300b3c813f788665ea864b7f7baa27a29a`. Entry quotes fail closed for other providers; non-crypto remains disabled. D1/Admin configuration owns enabled durations, each payout and stake range; frontend boxes remain configuration-driven. The current target is 30/60/180/280/420 seconds, never a hardcoded artwork list. Cloudflare deployment equivalence, config/quote/settlement runtime proof and complete Binary E2E are not established. The earlier no-approved-provider narrative is historical and superseded at owner/source-candidate scope only.

Public build authority is one final in-place build in `/srv/nexi/public/current` after the full source frontier and focused gates are ready. No alternate build/release trees, rollback copies or iterative build/deploy loops. Polypane5859 owns visual/responsive proof; preserved Chrome5858 is only for distinct wallet/session proof. The recovery checkpoint's stale explanatory workCycle was closed as superseded without claiming task completion, and routing resumed the P02/P03 source slice.

## Pre-build engineering review and source repairs — 2026-10-06

Source-only batch: removed chart pair/timeframe duplication while preserving numeric metrics, engine and overlays; kept Options configuration-driven with mobile stake ranges and selected-state accessibility; aligned Spot/Options header and bottom navigation with existing DESIGN.md glass tokens; repaired reduced-motion feedback and opaque high-contrast/transparency fallbacks. UI/UX Pro Max is advisory; no Apple Liquid Glass redesign or geometry reopening.

Worker private gateway JSON parsing now enforces its existing 256 KiB limit while reading bytes and cancels oversized streams. Five behavioral regressions cover boundaries, misleading/missing lengths, UTF-8 and failures. Other body-reading paths are outside this bounded repair. Source SENTRY_RELEASE was corrected to the exact existing live 40-character Git SHA; no backend deployment occurred.

Focused proof: Worker suite 15/15; backend suites 12/12 including production-mode configuration policy preserving D1 payout/min/max and the five approved durations; frontend chart/Options checks, TypeScript, design conformance and CSS parsing passed. Focused frontend lint has zero errors and four existing effect warnings. CodeScene staged safeguards passed for the Public, Binary and Worker commits after bounded complexity repairs; the final Binary helper centralizes approved quote selection and the Worker envelope validator reuses a shared record predicate. Source Git fan-in is implemented locally through `9fa6002...`; production build/deployment is not claimed.

Live truth: Cloudflare Worker deployment f41876b3-e8dd-4bf0-8043-61a81ecbb86f remains active; readiness is healthy. Fresh read-only Cloudflare D1 evidence on 2026-10-06 confirms 85 enabled Binary rows across the five durations (17 each; payout 0.85, stake 1–1000) and 17 LIVE `binance-spot` rows in `MarketQuoteLatest`; the query wrote zero rows. Actual Polypane public GET /binary/config returned HTTP 200 with zero configurations/durations. The Git-integrated source implementation frontier passes the production-policy regression, but deployed backend equivalence and configuration/settlement acceptance remain open. Public remains `5aafc0ff74cd715a77de3bc22d96603dbc2c4943` in `/srv/nexi/public/current`; source implementation is integrated through `9fa600243cf7e57bbb60b22413debc1c64f6c7c2`, with this documentation revision following those implementation commits. Remote GitHub fan-in is verified. The completed source batch now requires backend promotion planning, then the owner-authorized production promotion/build path and changed-behavior production proof. No full product acceptance or ledger-row upgrade.
