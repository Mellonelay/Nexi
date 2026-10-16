# NEXI Current State — Compact Authority Capsule

**Reconciled:** 2026-10-16 (VPS backend integration checkpoint).
**Source snapshot:** `Mellonelay/Nexi`, canonical `main` at the recovered migration base `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f` before the current integration changes; verify `git status`/HEAD before any further work. Migration source has been applied to this canonical checkout and the Node 24 build passed. Do not treat this source/build proof as production cutover.
**Provenance:** earlier history and receipts remain in Git; dated checkpoints are evidence only and must be checked against current runtime.

## Architecture that remains in force

- ChatGPT Work parent → RDC/Worker-0 operator; GitHub `main` owns durable source. Target backend is the VPS NestJS service at `/srv/nexi/backend`, supervised by `nexi-api.service`; Cloudflare Worker/Container/D1 remains live production until an owner-approved cutover.
- Public Next.js and Admin React/TanStack remain existing canonical frontends; Nginx is the intended host/API/WebSocket router.
- Target data path is SQLite + Prisma/better-sqlite3; Ledger is accounting truth; EventOutbox/EventInbox are durable delivery boundaries. SQLite journal/coordinator own durable job/workflow state, BullMQ transports work over Aiven Valkey. Aiven Valkey also supports Socket.IO Redis Streams, cache and ephemeral coordination only.
- Private local VPS storage replaces R2 for KYC/deposit evidence. Sentry SDK remains; `@nestjs/observe` is removed.
- Canonical Public source/build remains `cloudflare-container-bootstrap/dexi-frontend` → `/srv/nexi/public/current`; Admin source/runtime remain `apps/admin` → `/srv/nexi/admin/current`. Do not create alternate frontend build trees.

## Owner-approved product and UI changes to preserve

- Wallet: Funding (`MAIN`), Spot, Margin, Options (`BINARY`), Finance; same-user cross-wallet transfers plus another-NEXI-user transfers, account-scoped Ledger/Activity and USDT-equivalent Overview without double-counting.
- Margin/Options user-facing transferable asset: USDT only; preserve legitimate Margin base-asset debts and loan obligations. Each Wallet account has a compact Available/Locked/Total display.
- Markets: 53 catalog identities (17 crypto, 20 shares, 9 forex, 7 metals), distinct from wallet-supported deposit assets. Trade charts retain genuine provider price data. Binary controlled WIN/LOSS may not alter real market feeds.
- SIWE wallet-only authentication; Public browser campaign uses Polypane and Chrome DevTools with authorized Coinbase Wallet. Old MetaMask test-session assumptions are stale.
- Public Quiet Refraction, responsive/mobile wallet-browser geometry and final authenticated browser acceptance are distinct from source tests.
- Admin is an audited, permissioned control plane; financial controls act through NestJS, never independent authority.
- Sentry SDK telemetry is the intended observability path. **Cloudflare Observability stays disabled.** Backend/Public/Admin artifact SHA, embedded runtime releases and Sentry release lifecycle require separate direct proof.

## Current completion/evidence frontier

Canonical main source includes the migration changes on top of `9a41b2e`; the integration commit is now local on `main`, with GitHub synchronization pending. Fresh `npm ci` from the canonical npm lock completed, then `npm run build` passed with Node `v24.21.0`. The built `dist/src/main.js` SHA-256 exactly matches `/srv/nexi/backend/dist/src/main.js`; `nexi-api.service` is active and enabled. Prior loopback health/readiness, Swagger, market and Socket.IO checks remain applicable; Lane C directly observed Aiven connections. The promoted Graphify graph is at the pre-integration commit, so it is navigation evidence only for that revision. Public API TLS, authorized authenticated financial acceptance, final live D1 delta, independent encrypted backup/restore and owner cutover remain unproven. Keep `IMPLEMENTED`, `TESTED`, `INTEGRATED`, `RUNTIME_VERIFIED`, `PRODUCTION_CUTOVER` and `OWNER_ACCEPTED` separate.

## Active navigation and execution

Start at [docs/README.md](docs/README.md), then the owning [Backend](docs/backend/README.md), [Frontend](docs/frontend/README.md), [Admin](docs/admin/README.md), [cross-surface map](docs/architecture/CROSS_SURFACE_FEATURE_MAP.md) or [Sentry operations](docs/operations/NEXI_SENTRY_OBSERVABILITY.md). `AGENTS.md` remains binding repo law, subject to current owner decisions. **The historical production-completion ledger and dated `tasks/` plans are not active gating authorities.**

Next frontier: finish canonical main-tree review, commit and GitHub synchronization, then close the remaining non-authoritative VPS acceptance gaps: API TLS, authorized authenticated test identity, end-to-end market/financial/WebSocket recovery, independent encrypted off-VPS backup/restore, and current live D1 delta/cutover readiness. Production D1/Cloudflare, public DNS and nameservers remain unchanged; the owner performs the Name.com nameserver change.


## Public haptics and dependency pre-deploy checkpoint — 2026-10-14

- Public source fix is on GitHub main at `a74c568196f75f444dca57568806a69491c33c7f`: vibration calls are gated until user activation, with reduced-motion handling and focused tests; Next.js and eslint-config-next are pinned to 16.4.0, with lockfile safe fixes applied.
- Worker-0 direct runtime proof: `nexi-public.service` is active, working directory is the canonical `/srv/nexi/public/current`, and its current `.next/BUILD_ID` is `7fbde5ca82287902cb351546ccae1b632f1aae44`. The Public source commit is not deployed; no build or production deployment occurred in this checkpoint.
- Public production dependency audit against the updated lockfile: 0 critical, 12 high, 22 moderate. All 12 high findings remain in Wagmi v2 connector transitives; the safe audit fix requires Wagmi 3.7.7, while installed RainbowKit 2.2.11 declares a Wagmi 2 peer range. Do not force this major migration without a compatible RainbowKit and wallet-acceptance update.
- Next.js official status on this date announced an October 14 security release for upstream vulnerabilities; npm registry still reported `latest=16.4.0` when checked. Do not deploy until the announced vendor patch is published, lockfile is updated, and the exact dependency set passes focused checks.
- Existing Polypane/Chrome DevTools evidence shows the Public wallet chooser, not a verified authenticated session; the chooser's Coinbase option was disabled and protected requests returned 401. Authenticated SIWE/Mainnet acceptance remains blocked until the existing Coinbase Wallet session is connected and signed in.
- Focused source tests, lint, typecheck, and diff checks passed in the prior verified run; these do not establish tests against a fresh install of the current lockfile or production runtime acceptance.
