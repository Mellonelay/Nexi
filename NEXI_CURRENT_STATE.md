# NEXI Current State

**As of:** 2026-10-03 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Durable source authority:** GitHub `main`; current production host/CORS/SIWE values below were read directly from the Cloudflare API on 2026-09-26. The Public domain source alignment is recorded in this revision; discover the exact current `main` SHA before consequential work.
**Current deployed Public implementation frontier:** `be50529b789786fd83d808178f386b015f77b1f3` (Public responsive/mobile geometry closeout: narrow-mobile AppHeader one-row composition + corrected accessible menu name). Later documentation-only commits may advance GitHub `main` without changing this deployed implementation identity; always discover live `main` before consequential work.

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

Public deployment reconciled from fresh Worker-0 evidence on 2026-10-02; unchanged Admin/backend identities below retain their earlier provenance:

- Public implementation source `be50529b789786fd83d808178f386b015f77b1f3` was pushed to GitHub `main` before production promotion. A later documentation-only closeout commit may make GitHub `main` newer than the deployed implementation SHA.
- Public: `/srv/nexi/public/current -> /srv/nexi/public/releases/be50529-geometry-prod`.
- Public `NEXI_RELEASE_SHA = be50529b789786fd83d808178f386b015f77b1f3`; `nexi-public.service` is active with process CWD in `/srv/nexi/public/releases/be50529-geometry-prod`. Local origin and external `https://www.nexitrading.app/dashboard` both returned HTTP 200 after promotion from verified build `/srv/nexi/public/build-be50529-20261002-121819`.
- Public source/runtime framework: Next.js `16.3.5` + React `19.3.0`.
- Public standalone packaging now includes the root server entry plus traced dependencies, `.next/static`, and `public` beside the server. The deployed `/dashboard` returned HTTP 200 and all 45 referenced static assets returned HTTP 200 with expected MIME types during the 2026-09-27 deployment verification.
- Admin: `/srv/nexi/admin/current -> /srv/nexi/admin/releases/ed26973f-prod-node`.
- Admin `NEXI_RELEASE_SHA = ed26973fe0556a6d75943b3e296be0a899449d6d`; service active.
- No Admin source files changed between `ed26973...` and current `main` at `12cf799...`; the older Admin release marker does not currently imply an Admin source mismatch.
- Cloudflare backend deployment remains the `ed26973f` unified production promotion: deployment `15c716b8-8ae5-45ec-a9f2-b2d2f6f0c89d`, Worker version `bdadd96f-3696-474b-955d-de490a9a466d`.
- Current GitHub `main` contains later backend Sentry/ENOENT source changes after `ed26973...`; they are source-integrated but are not claimed deployed by this document.
- Remote backend health is current: `/health` = 200 and `/ops/ready` = 200 with `database=true`, `redis=true`.

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

The Public shell wallet-boundary defect was repaired at `04c8f5f...` and remains in the current `be50529...` Public source:
- non-protected Public market/product surfaces remain accessible without a NEXI wallet session;
- protected wallet/account/financial actions remain identity-gated;
- the global dashboard shell must not be re-wrapped in a wallet gate.

The current Public release also fixes standalone asset packaging: production HTML referenced missing JavaScript, CSS, fonts, and public assets because the standalone release omitted `.next/static` and `public`. The source build now copies both beside the standalone server and preserves the server entry/traced dependencies. The deployed release returned HTTP 200 for `/dashboard` and all 45 referenced static assets during the 2026-09-27 verification.

Canonical 53-asset registry/source coverage remains authoritative, and all 53 local asset-mark files are present. However, a 2026-10-03 source audit found that 36 of the 53 SVGs still contain text/placeholder-like marks rather than finished NEXI custom artwork. Therefore file-count/path coverage is proven, but full custom-icon visual acceptance is OPEN and must not be described as closed.
## Browser / rendered acceptance frontier

Production browser acceptance must target the **deployed Public generation** at `https://www.nexitrading.app` while it exercises the real Cloudflare backend at `https://api.nexitrading.app`.

Browser ownership:
- PRIMARY authenticated acceptance: preserved Worker-0 Chrome/MetaMask profile, with Playwright CLI + Chrome DevTools/CDP attached to the same NEXI tab.
- Requestly supplies passive HTTP evidence; React DevTools supplies component/state diagnostics where needed.
- Polypane is secondary responsive breadth. BrowserStack is secondary targeted real-device/cross-browser verification, primary only for that distinct claim.

Current deployed changed-behavior proof (Spot at `142a4aa`, reused through `be50529`; Margin repair introduced at `a924e0d` and unchanged through `be50529`):
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
- **Dashboard / asset identity:** exactly 53 local asset-mark files exist, but 36 are still text/placeholder-like SVGs; full NEXI custom-icon quality is not accepted.
- **Spot/Margin chart presentation:** MA/EMA/BOLL/RSI/MACD/VOL computation and overlays exist, but the accepted mobile reference intent for visible MA/EMA metric context is not fully represented in the current narrow/mobile presentation.
- **Options/Binary:** source already renders the backend-driven five-column duration selector with min/max, payout, stake and Long/Short. Fresh production GET /binary/config returned HTTP 200 with empty durations and configurations, so the missing five live boxes are a current product/configuration defect; do not hardcode a historical duration set in the frontend.
- **Wallet:** the shared AppHeader already renders wallet identity and app/dashboard/wallet/page.tsx renders another WalletConnectControl, creating redundant wallet/address identity in the Wallet composition.

The accepted September reference family remains Quotes Hub, Spot/Margin, Options/Binary, wallet chooser, and Wallet, adapted to current NEXI runtime truth. Old Sep-12/13 V2/V3 authority, app.nexitrading.app, VM-local backend acceptance, consumer STALE/provider-health wording, BrowserStack-first authenticated acceptance, and the Sep-15 narrow completion model remain superseded.

Owner-reported 2026-10-03 state: Polypane has now been wallet signed-in. Treat that as current owner state, while feature acceptance that depends on NEXI application authentication still uses the real /auth/me result plus rendered signed-in state when needed. Do not repeat wallet/profile/SIWE setup absent contradictory evidence.

## Open completion gates

- Public responsive/mobile geometry is **COMPLETED** at deployed implementation `be50529b789786fd83d808178f386b015f77b1f3` within the defined geometry scope. The final shared AppHeader repair keeps the normal mobile header at 56px including true 320×568, preserves the full wordmark from 360px upward, and exposes the mobile menu as `NEXI, Open application menu`. Existing Spot/Margin chart/drawer geometry proof remains reused unchanged.
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

The existing skill checkpoint now enforces project-owned phase reconciliation (`scripts/nexi_phase_checkpoint.py`). Active engineering `workCycle` and sealed phase receipts preserve prior proof; skill fingerprints persist outside `/tmp`. Eight focused checks and real wrapper transition/recovery checks passed. Parent semantic review remains required; this is not an automatic ChatGPT host hook or product acceptance. See `docs/operations/NEXI_PHASE_RECONCILIATION.md`. Public geometry remains completed; deployed implementation remains `be50529...`; full production end-to-end acceptance remains NO.

## Public convergence candidate checkpoint — 2026-10-03

The current dirty candidate replaces 36 placeholder asset SVGs, improves ADA contrast, exposes actual MA(20)/EMA(20)/EMA(50) values with existing chart-series colors, and removes the authenticated Wallet body identity duplicate. Additional bounded repairs normalize Mining boolean/numeric enabled flags and decimal limits, separate public Loans catalog loading from protected history, distinguish Support read failures from empty state, remove the Settings profile-read/session-event request loop, make Messages read-service status truthful, and format Asset Detail backend values. These changes are SOURCE_IMPLEMENTED, not deployed or production accepted. Canonical typegen/typecheck and 20 focused tests passed; the communications-contract test passed from its required repository context. Fallow returned WARN with zero introduced dead-code/complexity findings; the attributed socket-cleanup clone is pre-existing. Canonical production build PASSED at /srv/nexi/public/build-public-convergence-20261003-0510 using the existing NEXT_TURBOPACK_ROOT=/srv/nexi/public override. Git fan-in and production verification remain pending. The existing production release and geometry proof remain unchanged.

Binary is BLOCKED_WITH_EVIDENCE: real /binary/config returned 200 with empty arrays; BinaryService filters configuration through the market source policy, whose deployed ancestor and current source have settlement disabled/UNAPPROVED, binary=false and no supported durations. No later approved settlement policy was found in current authority. D1 remote inspection failed with Cloudflare 7403, so configuration-row presence/enabled state remains UNKNOWN. Do not invent settlement approval, durations or payouts.

Fresh Worker metadata identifies deployment f41876b3-e8dd-4bf0-8043-61a81ecbb86f, Worker version 2ef838f5-f96a-4f48-99e2-db9d80dbc0b4 (September-26 canonical-host migration). The NestJS container code generation remains recorded as ed26973f; Worker metadata alone does not establish a newer container implementation SHA. This supersedes bdadd96f as the current Worker UUID, while preserving its historical promotion provenance.
