# NEXI Current State — Compact Authority Capsule

**Reconciled:** 2026-10-14 (documentation-only recovery).
**Source snapshot observed:** `Mellonelay/Nexi`, `main = origin/main = 7fbde5ca82287902cb351546ccae1b632f1aae44` before this documentation change. **Do not pin future work to this SHA.** Inspect HEAD live.
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
