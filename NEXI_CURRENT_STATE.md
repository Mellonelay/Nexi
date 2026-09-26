# NEXI Current State

**As of:** 2026-09-26 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Durable source authority:** GitHub `main`; latest source read for this update surfaced `696b6929e26dfc9bc71e2a5f229eceebe93fa1d6`. Discover live again before consequential work.
**Current product implementation frontier:** `04c8f5f420d5e6b1cf7e0324b9c4a52535ee3152` (`fix(frontend): keep public dashboard accessible without wallet`). Documentation/governance-only commits may advance GitHub `main` without changing product deployment identity; always discover live `main` before consequential work.

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

Fresh Worker-0 evidence on 2026-09-25:

- Product implementation commit under this reconciliation is `04c8f5f420d5e6b1cf7e0324b9c4a52535ee3152`. GitHub `main` may be newer because of documentation/governance-only fan-in; discover live before work.
- Public: `/srv/nexi/public/current -> /srv/nexi/public/releases/04c8f5f4-prod`.
- Public `NEXI_RELEASE_SHA = 04c8f5f420d5e6b1cf7e0324b9c4a52535ee3152`; service active.
- Public source/runtime framework: Next.js `16.3.5` + React `19.3.0`.
- Admin: `/srv/nexi/admin/current -> /srv/nexi/admin/releases/ed26973f-prod-node`.
- Admin `NEXI_RELEASE_SHA = ed26973fe0556a6d75943b3e296be0a899449d6d`; service active.
- No Admin source files changed between `ed26973...` and current `04c8f5f...`; the older Admin release marker does not currently imply an Admin source mismatch.
- Cloudflare backend deployment remains the `ed26973f` unified production promotion: deployment `15c716b8-8ae5-45ec-a9f2-b2d2f6f0c89d`, Worker version `bdadd96f-3696-474b-955d-de490a9a466d`.
- Current GitHub `main` contains later backend Sentry/ENOENT source changes after `ed26973...`; they are source-integrated but are not claimed deployed by this document.
- Remote backend health is current: `/health` = 200 and `/ops/ready` = 200 with `database=true`, `redis=true`.

This is intentionally a split identity. Do not describe the whole product as one current unified deployment SHA when Public, Admin, and backend release identities differ.
## Current external reachability and host/CORS boundary

Last recorded external probes from 2026-09-25 reported `app` and apex dashboard reachable, Admin redirecting to sign-in, API health 200, and `www` returning 525. On 2026-09-26 the Cloudflare API confirmed:
- `www.nexitrading.app` is proxied to `35.187.234.62` (record modified 2026-09-26 05:43 UTC).
- Apex `nexitrading.app` still points to proxied `91.195.240.94`.
- Zone SSL mode is Full with active certificate.
- No zone dynamic redirect entrypoint or Page Rules are configured.
- The previous session reported an external `https://www.nexitrading.app/dashboard` HTTP/2 200 after correcting the `www` record; a fresh external GET in this update timed out at the execution proxy, so current page reachability was not independently reconfirmed.

BrowserStack DevTools evidence provided 2026-09-26 shows the Galaxy S24 page origin is `https://www.nexitrading.app`; API requests for auth refresh, Spot orderbook/trades, and Socket.IO polling fail CORS because responses do not allow that origin. Current GitHub `main` backend config and Cloudflare configuration inventory allow only `https://app.nexitrading.app` and `https://admin.nexitrading.app`; SIWE domain/URI remain `app.nexitrading.app`. A fresh production OPTIONS request from the canonical `app` origin returned 204 with `Access-Control-Allow-Origin`; the `www` Socket.IO OPTIONS request returned 400 without that header.

Assessment: P-02 has a demonstrated canonical-host/CORS mismatch when the browser page is served on `www`. Preserve `app.nexitrading.app` as wallet-signing authority; prefer redirecting `www` and apex to `app` rather than broadening the SIWE origin. Cloudflare routing has not been changed in this update; production routing change awaits explicit owner authorization.

## Public frontend correction and preserved proof

The Public shell wallet-boundary defect was repaired and deployed at `04c8f5f...`:
- non-protected Public market/product surfaces remain accessible without a NEXI wallet session;
- protected wallet/account/financial actions remain identity-gated;
- the global dashboard shell must not be re-wrapped in a wallet gate.

Canonical 53-asset source/backend parity and local asset-icon integrity were verified in the current Public generation. Preserve that model unless current contradictory evidence appears.
## Browser / rendered acceptance frontier

Production browser acceptance must target the **deployed Public generation** at `https://app.nexitrading.app` while it exercises the real Cloudflare backend at `https://api.nexitrading.app`.

Browser ownership:
- BrowserStack = real-browser / real-device acceptance.
- Polypane = responsive / multi-viewport acceptance.
- Playwright and Chrome DevTools are supporting automation/diagnostic tools, not additional mandatory acceptance owners.

Current BrowserStack focused evidence for release `04c8f5f4`:
- Windows 11 Chrome: Spot remained loading, no explicit MARKET ERROR in that capture.
- Galaxy S24 Chrome: Spot showed `MARKET ERROR` and remained loading.
- iPhone 15 Pro Max Safari: Spot rendered live market values in that capture.
- Binary and Asset Detail rendered live market data in the same focused runs.
- Wallet chooser showed Coinbase Wallet and Injected/browser-wallet choices; a supplied Galaxy capture showed “Wallet verification failed.”
- New DevTools screenshot evidence shows failed API calls from origin `www.nexitrading.app`, which does not match the current backend CORS allowlist. This explains the failed Spot/auth requests for that host; it does not yet prove a successful wallet provider/signature/session flow.
- WalletConnect was not visible in earlier production chooser captures.

P-02 remains open until the canonical host path is corrected and the Galaxy browser is retested against the real backend. The current evidence identifies host/CORS mismatch rather than a backend-wide market outage.
## Open completion gates

- Overall Public browser acceptance is incomplete.
- Galaxy S24 Spot acceptance is failed/open at the current evidence frontier.
- Polypane production responsive acceptance is incomplete.
- WalletConnect production-visible UX is unverified.
- `www` TLS DNS mispoint was corrected, but canonical-host routing remains unresolved: `www` serves a frontend origin excluded from CORS/SIWE config and apex still points at the old IP; redirect policy approval and fresh edge verification remain open.
- Current-main backend changes after `ed26973...` are not claimed deployed.
- Full Sentry release-lifecycle/source-map/runtime proof remains incomplete.
- Remaining Public/Admin/financial/async/realtime/identity rows are controlled by `NEXI_PRODUCTION_COMPLETION_LEDGER.md`.
- Controlled test wallet/Admin identities should be used for safely automatable identity-dependent acceptance where possible.
- Owner manual acceptance remains the final gate only after automatable closure.

## Documentation and continuity

- `NEXI_PRODUCTION_COMPLETION_LEDGER.md` is the sole writable completion controller.
- `NEXI_CURRENT_STATE.md` is current durable truth, not a chronological diary.
- Root `AGENTS.md` owns NEXI execution/governance instructions.
- `docs/operations/NEXI_CAPABILITY_ROUTING.md` is the NEXI routing overlay.
- `/home/mellonelay1999/.agents/BROWSER_FABRIC.md` owns browser-tool responsibility and production browser workflow.
- Public-local `AGENTS.md` and `DESIGN.md` govern the canonical Public frontend.
- Historical analysis/recovery material belongs under `docs/archive` or `docs/recovery`; it must not compete with current authority.

## Next dependency-ready direction

Finish authority/document realignment, then continue from the current production acceptance failures and open ledger rows. Repair demonstrated defects on their existing canonical paths, verify only invalidated evidence, update durable state/ledger when proof changes, and defer owner manual testing until the automated pre-owner gates are satisfied.

`FULL_PRODUCTION_END_TO_END_ACCEPTED = NO`
