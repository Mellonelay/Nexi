# NEXI Current State

**As of:** 2026-09-26 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Durable source authority:** GitHub `main`; current production host/CORS/SIWE values below were read directly from the Cloudflare API on 2026-09-26. The Public domain source alignment is recorded in this revision; discover the exact current `main` SHA before consequential work.
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
## Current external reachability and canonical-host contract

Owner decision on 2026-09-26: Public frontend uses `https://www.nexitrading.app`; backend API uses `https://api.nexitrading.app`; Admin uses `https://admin.nexitrading.app`. Do not redirect Public traffic back to `app` or apex.

Live Cloudflare API read on 2026-09-26 verified:
- Proxied A records for `www` and `admin` point to `35.187.234.62`.
- Proxied originless A records for apex and legacy `app` point to `192.0.2.0`.
- An enabled zone redirect rule returns HTTP 308 from apex and legacy `app` to `https://www.nexitrading.app`, preserving path and query.
- `api.nexitrading.app` is a Cloudflare Worker Custom Domain attached to service `nexi-production`, environment `production`.
- Live Worker plain-text vars are `CORS_ORIGINS=https://www.nexitrading.app,https://admin.nexitrading.app`, `WALLET_AUTH_DOMAIN=www.nexitrading.app`, and `WALLET_AUTH_URI=https://www.nexitrading.app`.

BrowserStack DevTools screenshots from 2026-09-26 show failed CORS responses for API calls made while the Public page was loaded from `www`. Those captures prove the failure at capture time. The live Cloudflare values now match the owner-selected hosts, but no post-configuration OPTIONS response or fresh BrowserStack network trace has been captured in this work. Therefore the host/CORS configuration is aligned, while browser/runtime behavior still needs fresh proof.

## Public frontend correction and preserved proof

The Public shell wallet-boundary defect was repaired and deployed at `04c8f5f...`:
- non-protected Public market/product surfaces remain accessible without a NEXI wallet session;
- protected wallet/account/financial actions remain identity-gated;
- the global dashboard shell must not be re-wrapped in a wallet gate.

Canonical 53-asset source/backend parity and local asset-icon integrity were verified in the current Public generation. Preserve that model unless current contradictory evidence appears.
## Browser / rendered acceptance frontier

Production browser acceptance must target the **deployed Public generation** at `https://www.nexitrading.app` while it exercises the real Cloudflare backend at `https://api.nexitrading.app`.

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
- The screenshot captures show API CORS failures from `www.nexitrading.app`. Live Worker CORS and SIWE values now match `www` and Admin, but behavior after that configuration change remains unverified; no successful wallet provider/signature/session flow is proven.
- WalletConnect was not visible in earlier production chooser captures.

P-02 remains `NEEDS_FRESH_PROOF` until the current `www` page passes authenticated API preflight/request and Socket.IO checks, then the Galaxy Spot page is retested against the real backend. The available evidence identifies a host/CORS failure in the captured browser run; it does not prove a backend-wide market outage.
## Open completion gates

- Overall Public browser acceptance is incomplete.
- Galaxy S24 Spot acceptance is failed/open at the current evidence frontier.
- Polypane production responsive acceptance is incomplete.
- WalletConnect production-visible UX is unverified.
- Canonical-host DNS and redirect configuration now match the owner decision. External route responses and post-configuration CORS/browser behavior still need fresh proof.
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
