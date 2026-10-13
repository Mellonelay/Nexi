# NEXI System Architecture — Current Responsibility Model

**Status:** source-oriented architecture reference. **Live deployment and acceptance require separate evidence.** Current owner decisions and canonical GitHub `main` outrank the historical July program/phase documents.

## The three product surfaces

**Public:** Next.js App Router under `cloudflare-container-bootstrap/dexi-frontend`, deployed through the canonical `/srv/nexi/public/current` directory. It is a UI/API consumer only.

**Backend:** Cloudflare Worker edge/routing → Cloudflare Container → NestJS domain modules in `backend/src`. NestJS owns domain and business authorization. Cloudflare Queues/Workflows handle delivery and orchestration, not financial data authority.

**Admin:** React/TanStack under `apps/admin`, deployed via its established canonical runtime. It is the governed control plane and invokes permissioned backend commands; it does not own financial transactions or become a second backend.

## Data and financial ownership

- D1 = durable application and financial relational state; Ledger posting boundary = accounting truth.
- EventOutbox = durable publication; Queues retry/deliver; Workflows orchestrate.
- Valkey = realtime/cache/Streams/Socket.IO and ephemeral coordination only.
- R2 = private eligible domain-object storage, including KYC evidence/proof where configured.
- Market/provider authority = normalized quote/klines/freshness/provenance; current catalog includes 53 identities across crypto, shares, forex and metals.
- Funding (`MAIN`), Spot, Margin, Options (`BINARY`) and Finance are distinct financial account scopes. Margin and Options expose USDT-only transferable user balances, not a license to conceal debts.
- No direct Public/Admin D1 writes, duplicate Ledger writers, fabricated wallet balances, arbitrary provider settlement or unverified market depth/trades.

## Core cross-surface flows

1. **Wallet authentication:** authorized wallet/nonce/signature SIWE → NestJS session policies → scoped Public reads; Admin identity/RBAC remains separately protected.
2. **Wallet transfer:** Public request → NestJS validation/authorization → D1 financial gateway → balanced Ledger + Activity + EventOutbox → Public readback.
3. **Spot/Margin:** Public chart and order UI → NestJS trading authority → real provider/fill/position records and correct isolated wallet scope → Activity/realtime consumers.
4. **Binary:** Public Options account → approved USDT reserve → configured expiry/outcome and isolated sandbox scenarios → WIN/LOSS settlement → Activity/Wallet readback.
5. **Deposits/KYC:** Public user-authorized claims/upload → NestJS state machines/private R2 → permissioned Admin review → durable status and publication.
6. **Mining/Loans:** Public Finance interactions → NestJS subscription/loan workflows → D1 commitments, liabilities and Ledger/Activity → Admin governance.
7. **Communications:** Admin moderation/publishing → NestJS durable state → events/notifications → Public Learn, messages, announcements, support.

## Design, delivery and verification

Public design follows current `DESIGN.md`, Quiet Refraction, mobile geometry and accessible trading/chart controls. The final authenticated acceptance uses Polypane, Chrome DevTools and an authorized Coinbase Wallet, only after source closure and the intended deployment.

Each deployed surface has independently verifiable build/source and Sentry release IDs. Use Sentry SDK telemetry; **Cloudflare Observability remains disabled**. Read production state directly rather than treating an environment marker, old ledger or passing test as deployment proof.

## Documentation ownership

- [Backend domains and persistence](../backend/README.md)
- [Public routes and UI](../frontend/README.md)
- [Admin controls and RBAC](../admin/README.md)
- [Cross-surface ownership matrix](CROSS_SURFACE_FEATURE_MAP.md)
- [Sentry observability](../operations/NEXI_SENTRY_OBSERVABILITY.md)
- [Documentation policy](../README.md)

The July 2026 architecture/program documents and former completion ledger are historical evidence, not active feature or completion definitions. Preserve old text through Git history and dated archive while maintaining this file as the current architecture entry.
