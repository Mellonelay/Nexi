# NEXI Current State — Compact Authority Capsule

**Reconciled:** 2026-10-14 (Public haptics/dependency pre-deploy checkpoint).
**Source snapshot observed:** `Mellonelay/Nexi`, `main = origin/main = a74c568196f75f444dca57568806a69491c33c7f` before this state update. Public runtime remains separately identified below. **Inspect HEAD live before future work.**
**Provenance:** full preceding state narrative is recoverable from Git at `git show 7fbde5c:NEXI_CURRENT_STATE.md`. Its dated receipts are not current runtime state.

## Architecture that remains in force

- ChatGPT Work controller → RDC Worker-0 operator; GitHub main owns durable source; Cloudflare Worker + Container owns backend runtime.
- Public Next.js and Admin React/TanStack consume the same NestJS domain authority through Cloudflare edge routing.
- D1 is durable application/financial truth; Ledger is accounting truth; EventOutbox publication boundary. Valkey is realtime/cache only. Queues deliver; Workflows orchestrate. R2 is used for approved private domain objects.
- Canonical Public source: `cloudflare-container-bootstrap/dexi-frontend`; canonical build/runtime: `/srv/nexi/public/current`. Admin source: `apps/admin`, runtime: `/srv/nexi/admin/current`. Do not create alternative Public build trees.

## Owner-approved product and UI changes to preserve

- Wallet: Funding (`MAIN`), Spot, Margin, Options (`BINARY`), Finance; same-user cross-wallet transfers plus another-NEXI-user transfers, account-scoped Ledger/Activity and USDT-equivalent Overview without double-counting.
- Margin/Options user-facing transferable asset: USDT only; preserve legitimate Margin base-asset debts and loan obligations. Each Wallet account has a compact Available/Locked/Total display.
- Markets: 53 catalog identities (17 crypto, 20 shares, 9 forex, 7 metals), distinct from wallet-supported deposit assets. Trade charts retain genuine provider price data. Binary controlled WIN/LOSS may not alter real market feeds.
- SIWE wallet-only authentication; Public browser campaign uses Polypane and Chrome DevTools with authorized Coinbase Wallet. Old MetaMask test-session assumptions are stale.
- Public Quiet Refraction, responsive/mobile wallet-browser geometry and final authenticated browser acceptance are distinct from source tests.
- Admin is an audited, permissioned control plane; financial controls act through NestJS/D1, never independent authority.
- Sentry SDK telemetry is the intended observability path. **Cloudflare Observability stays disabled.** Backend/Public/Admin artifact SHA, embedded runtime releases and Sentry release lifecycle require separate direct proof.

## Current completion/evidence frontier

Source files and paths above were inspected for the documentation migration at snapshot `7fbde5c`; Graphify's promoted index matched that SHA (7,058 nodes, 17,236 edges) and was used for mapping only. Previous implementation, focused tests and Sentry completion belong to their individual session receipts. **This documentation pass has not independently asserted their current deployment or authenticated browser acceptance.**

For current runtime, verify the exact Worker/Container version and D1 bindings on Cloudflare, active Public/Admin build IDs on Worker-0, and Sentry ingestion/release directly. Keep `IMPLEMENTED`, `TESTED`, `DEPLOYED`, `RUNTIME_VERIFIED` and `OWNER_ACCEPTED` separate.

## Active navigation and execution

Start at [docs/README.md](docs/README.md), then the owning [Backend](docs/backend/README.md), [Frontend](docs/frontend/README.md), [Admin](docs/admin/README.md), [cross-surface map](docs/architecture/CROSS_SURFACE_FEATURE_MAP.md) or [Sentry operations](docs/operations/NEXI_SENTRY_OBSERVABILITY.md). `AGENTS.md` remains binding repo law, subject to current owner decisions. **The historical production-completion ledger and dated `tasks/` plans are not active gating authorities.**

Next frontier: reconcile current live deployments and final user-facing acceptance only when explicitly in scope. For documentation changes, run link/ownership checks; do not re-test, rebuild or deploy product code.


## Public haptics and dependency pre-deploy checkpoint — 2026-10-14

- Public source fix is on GitHub main at `a74c568196f75f444dca57568806a69491c33c7f`: vibration calls are gated until user activation, with reduced-motion handling and focused tests; Next.js and eslint-config-next are pinned to 16.4.0, with lockfile safe fixes applied.
- Worker-0 direct runtime proof: `nexi-public.service` is active, working directory is the canonical `/srv/nexi/public/current`, and its current `.next/BUILD_ID` is `7fbde5ca82287902cb351546ccae1b632f1aae44`. The Public source commit is not deployed; no build or production deployment occurred in this checkpoint.
- Public production dependency audit against the updated lockfile: 0 critical, 12 high, 22 moderate. All 12 high findings remain in Wagmi v2 connector transitives; the safe audit fix requires Wagmi 3.7.7, while installed RainbowKit 2.2.11 declares a Wagmi 2 peer range. Do not force this major migration without a compatible RainbowKit and wallet-acceptance update.
- Next.js official status on this date announced an October 14 security release for upstream vulnerabilities; npm registry still reported `latest=16.4.0` when checked. Do not deploy until the announced vendor patch is published, lockfile is updated, and the exact dependency set passes focused checks.
- Existing Polypane/Chrome DevTools evidence shows the Public wallet chooser, not a verified authenticated session; the chooser's Coinbase option was disabled and protected requests returned 401. Authenticated SIWE/Mainnet acceptance remains blocked until the existing Coinbase Wallet session is connected and signed in.
- Focused source tests, lint, typecheck, and diff checks passed in the prior verified run; these do not establish tests against a fresh install of the current lockfile or production runtime acceptance.
