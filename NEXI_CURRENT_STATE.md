# NEXI Current State

**As of:** 2026-10-01 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Durable source authority:** GitHub `main`; current production host/CORS/SIWE values below were read directly from the Cloudflare API on 2026-09-26. The Public domain source alignment is recorded in this revision; discover the exact current `main` SHA before consequential work.
**Current deployed Public implementation frontier:** `a924e0dc3bdb39f69aa0dd7c5baafc964ba24a62` (chart resize, closed drawer and short-height trading geometry). Documentation/governance-only commits may advance GitHub `main` without changing product deployment identity; always discover live `main` before consequential work.

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

Public deployment reconciled from fresh Worker-0 evidence on 2026-10-01; unchanged Admin/backend identities below retain their earlier provenance:

- Public source `a924e0dc3bdb39f69aa0dd7c5baafc964ba24a62` was fast-forward pushed and confirmed through the GitHub ref API.
- Public: `/srv/nexi/public/current -> /srv/nexi/public/releases/a924e0d-geometry-prod`.
- Public `NEXI_RELEASE_SHA = a924e0dc3bdb39f69aa0dd7c5baafc964ba24a62`; existing `nexi-public.service` active with process CWD in that release. Origin Spot HTML returned 200 with the verified BUILD_ID.
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

Live Cloudflare API read on 2026-09-26 verified:
- Proxied A records for `www` and `admin` point to `35.187.234.62`.
- Proxied originless A records for apex and legacy `app` point to `192.0.2.0`.
- An enabled zone redirect rule returns HTTP 308 from apex and legacy `app` to `https://www.nexitrading.app`, preserving path and query.
- `api.nexitrading.app` is a Cloudflare Worker Custom Domain attached to service `nexi-production`, environment `production`.
- Live Worker plain-text vars are `CORS_ORIGINS=https://www.nexitrading.app,https://admin.nexitrading.app`, `WALLET_AUTH_DOMAIN=www.nexitrading.app`, and `WALLET_AUTH_URI=https://www.nexitrading.app`.

Fresh preserved-Chrome Requestly passive capture on 2026-10-01: market prices 200; auth refresh 201; authenticated auth/me 304; Socket.IO polling 200 and WebSocket upgrade 101. Current browser evidence does not reproduce the historical CORS/401/503 failures. This is bounded Spot transport/session proof, not market-wide or real-device acceptance.


## Public frontend correction and preserved proof

The Public shell wallet-boundary defect was repaired at `04c8f5f...` and remains in the current `a924e0d...` Public source:
- non-protected Public market/product surfaces remain accessible without a NEXI wallet session;
- protected wallet/account/financial actions remain identity-gated;
- the global dashboard shell must not be re-wrapped in a wallet gate.

The current Public release also fixes standalone asset packaging: production HTML referenced missing JavaScript, CSS, fonts, and public assets because the standalone release omitted `.next/static` and `public`. The source build now copies both beside the standalone server and preserves the server entry/traced dependencies. The deployed release returned HTTP 200 for `/dashboard` and all 45 referenced static assets during the 2026-09-27 verification.

Canonical 53-asset source/backend parity and local asset-icon integrity were verified in the current Public generation. Preserve that model unless current contradictory evidence appears.
## Browser / rendered acceptance frontier

Production browser acceptance must target the **deployed Public generation** at `https://www.nexitrading.app` while it exercises the real Cloudflare backend at `https://api.nexitrading.app`.

Browser ownership:
- PRIMARY authenticated acceptance: preserved Worker-0 Chrome/MetaMask profile, with Playwright CLI + Chrome DevTools/CDP attached to the same NEXI tab.
- Requestly supplies passive HTTP evidence; React DevTools supplies component/state diagnostics where needed.
- Polypane is secondary responsive breadth. BrowserStack is secondary targeted real-device/cross-browser verification, primary only for that distinct claim.

Current deployed changed-behavior proof (Spot at `142a4aa`, unchanged and reused in `a924e0d`; Margin at `a924e0d`):
- Closed drawer is display:none with zero geometry across the tested mobile/landscape/tablet/desktop probes; corrected real pointer close succeeds.
- Chart container and rendered lightweight-chart dimensions track responsive transitions within 1 CSS px after settling.
- Bottom dock remains present on mobile, desktop sidebar hidden, and tested Spot page overflow is zero.
- Source-delivered CSS at `142a4aa` (no injected prototype styles): tested Spot 320/360/390/430 widths, short-height, 480/568/844 landscape, tablet and desktop-class rendered states; chart/canvas dimensions agree within 1 CSS px, pair/price do not overlap, and market panels switch exclusively below the desktop composition breakpoint. Observed desktop CSS widths reflect the preserved calibration, not nominal device pixels.
- Fresh boundary 2026-10-01T08:43:29.399Z: prices/klines and Socket.IO polling returned 200; no page errors were captured during these checks. This is bounded changed-behavior proof, not product-wide acceptance.
- Margin boundary 2026-10-01T09:11:54.818Z: new build delivered; refresh 201, me 200, prices/klines/polling 200, no console errors. Mobile coarse-pointer probes passed; plot reachable with 16px dock clearance via the shared MAIN scroll owner. Canceled navigation/third-party telemetry requests were retained separately from application failures.
- Owner re-authenticated the existing wallet; real app refresh/me requests prove a valid current session. No wallet setup or SIWE re-investigation is required absent fresh contradictory evidence.

## Open completion gates

- Overall authenticated frontend geometry acceptance remains incomplete. Deployed Spot landscape 844×390 plot start improved from y=440 to y=206; short-height trading composition and exclusive panel switching are verified. Margin portrait wrapper gap is repaired and runtime-verified at `a924e0d`: chart/root height equals its 300px wrapper; plotted region at 390×650 increased from 126.5px to 206.5px.
- Quotes, Asset Detail, Options and Wallet/sheet geometry still require affected-path acceptance; do not generalize Spot proof to all routes or states.
- Targeted real-device/cross-browser acceptance and WalletConnect production-visible UX remain unverified.
- Only the broad NON-CRYPTO stale/session-hours investigation is deferred. Crypto realtime, all 53 assets, chart intervals/continuity, Public/backend/Admin dependency-ready paths and frontend geometry remain in scope.
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
- Historical analysis/recovery material belongs under `docs/archive` or `docs/recovery`; it must not compete with current authority.

## Next dependency-ready direction

Continue the authenticated Quotes/discovery, Asset Detail, Options and Wallet/sheet geometry frontier, reusing the verified Spot/Margin changes and preserved session. Repair demonstrated defects on their existing canonical paths, verify only invalidated evidence, update durable state/ledger when proof changes, and defer owner manual testing until the automated pre-owner gates are satisfied.

`FULL_PRODUCTION_END_TO_END_ACCEPTED = NO`
