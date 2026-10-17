## Margin settlement continuity — 2026-10-18 source-only note

The canonical Spot matching gateway commits trade and linked Margin ENTRY effects atomically. The later Margin CLOSE recovery takes the persisted `SpotMarginPosition.closeOrderId` and accepted request key, selects only FILLED orders, and derives realized close mark from actual `Gate2SpotTrade` VWAP without allocating another order or requiring a fresh market quote. `MarginRecoveryScheduler` uses existing scheduler flag + Redis lock. The existing SQLite financial command gateway commits debt repayment, position CLOSED/LIQUIDATED, unified Activity and EventOutbox in one batch; disposable SQLite fault injection verified full rollback. This is **source and focused test proof only**, not deployed authenticated financial acceptance. No new financial authority owner.

# NEXI System Architecture — Current Responsibility Model

**Status:** source-oriented architecture reference. **Live deployment and acceptance require separate evidence.** Current owner decisions and canonical GitHub `main` outrank the historical July program/phase documents.

## The three product surfaces

**Public:** Next.js App Router under `cloudflare-container-bootstrap/dexi-frontend`, deployed through the canonical `/srv/nexi/public/current` directory. It is a UI/API consumer only.

**Backend/runtime:** Name.com public DNS now routes the three hostnames to the VPS. Existing Nginx serves Public/Admin and proxies API/WebSocket traffic to the canonical NestJS service at `/srv/nexi/backend/dist/src/main.js`, supervised by `nexi-api.service`. Cloudflare Worker/Container and async resources remain active, but are no longer described as the current public DNS route. Cloudflare D1 is retained historical parity/migration evidence; under the current owner override the promoted VPS SQLite database is financial authority. Current live settlement acceptance and historical delta proofs remain separate.

**Admin:** React/TanStack under `apps/admin`, deployed via its established canonical runtime. It is the governed control plane and invokes permissioned NestJS commands; it does not own financial transactions or become a second backend.

The current component map, data flows, replacement matrix and unclosed acceptance gates are in [NEXI VPS Backend Runtime](NEXI_VPS_BACKEND_RUNTIME.md). Current public traffic reaches the VPS. The promoted SQLite checkpoint contains LedgerAccount and LedgerPosting rows; do not confuse source-only repairs with deployed financial acceptance.

## Data and financial ownership

- SQLite + Prisma 7/better-sqlite3 = intended VPS durable application and financial relational store; Ledger postings = accounting truth. Promoted VPS SQLite checkpoint (2026-10-17): 14 LedgerAccount and 48 LedgerPosting rows were recorded; see [current state](../../NEXI_CURRENT_STATE.md).
- EventOutbox = durable publication; EventInbox = idempotent ingress; SQLite journal/workflow coordinator = durable acceptance/checkpoints; BullMQ retries and delivers transport work.
- Aiven Valkey = BullMQ transport, Socket.IO Redis Streams, cache and ephemeral coordination only.
- Private local VPS storage = target location for approved KYC/deposit-proof evidence; access remains behind NestJS authorization.
- Market/provider authority = normalized quote/klines/freshness/provenance; current catalog includes 53 identities across crypto, shares, forex and metals.
- Funding (`MAIN`), Spot, Margin, Options (`BINARY`) and Finance are distinct financial account scopes. Margin and Options expose USDT-only transferable user balances, not a license to conceal debts.
- No direct Public/Admin database writes, duplicate Ledger writers, fabricated wallet balances, arbitrary provider settlement or unverified market depth/trades.

## Core cross-surface flows

1. **Wallet authentication:** authorized wallet/nonce/signature SIWE → NestJS session policies → scoped Public reads; Admin identity/RBAC remains separately protected.
2. **Wallet transfer:** Public request → NestJS validation/authorization → atomic SQLite financial gateway → balanced Ledger + Activity + EventOutbox → Public readback.
3. **Spot/Margin:** Public chart and order UI → NestJS trading authority → real provider/fill/position records and correct isolated wallet scope → Activity/realtime consumers.
4. **Binary:** Public Options account → approved USDT reserve → configured expiry/outcome and isolated sandbox scenarios → WIN/LOSS settlement → Activity/Wallet readback.
5. **Deposits/KYC:** Public user-authorized claims/upload → NestJS state machines/private VPS storage → permissioned Admin review → durable SQLite status and publication.
6. **Mining/Loans:** Public Finance interactions → NestJS subscription/loan workflows → SQLite commitments, liabilities and Ledger/Activity → Admin governance.
7. **Communications:** Admin moderation/publishing → NestJS durable state → events/notifications → Public Learn, messages, announcements, support.

## Design, delivery and verification

Public design follows current `DESIGN.md`, Quiet Refraction, mobile geometry and accessible trading/chart controls. The final authenticated acceptance uses Polypane, Chrome DevTools and an authorized Coinbase Wallet, only after source closure and the intended deployment.

Each deployed surface has independently verifiable build/source and Sentry release IDs. Use Sentry SDK telemetry; **Cloudflare Observability remains disabled**. Read production state directly rather than treating an environment marker, old ledger or passing test as deployment proof.

## Documentation ownership

- [Backend domains and persistence](../backend/README.md)
- [Public routes and UI](../frontend/README.md)
- [Admin controls and RBAC](../admin/README.md)
- [Architecture and routing diagrams](NEXI_ARCHITECTURE_DIAGRAMS.md)
- [Cross-surface ownership matrix](CROSS_SURFACE_FEATURE_MAP.md)
- [Sentry observability](../operations/NEXI_SENTRY_OBSERVABILITY.md)
- [Documentation policy](../README.md)

The July 2026 architecture/program documents and former completion ledger are historical evidence, not active feature or completion definitions. Preserve old text through Git history and dated archive while maintaining this file as the current architecture entry.

## 2026-10-18 financial-command closure matrix (latest source checkpoint)

Current main: `577f5c1ae69071648cee1c2c8e00480792efd186`. Promoted VPS SQLite/Prisma and LedgerPosting are durable financial/accounting authority; EventOutbox is the durable publication boundary. Historical statements below describing empty VPS SQLite financial tables or Cloudflare D1 as current financial writer are superseded by the promoted October 17 SQLite checkpoint (14 LedgerAccount, 48 LedgerPosting). This source repair is **not yet deployed or authenticated accepted**.

| Domain | Proven unchanged / source tested | Remaining unproven |
|---|---|---|
| Five wallet scopes / transfer | SQLite exact debit/credit, owner/scope/asset checks, idempotency, Activity and Outbox | Deployed authenticated API journeys |
| Spot | Resting-price matching, paired Ledger postings, trade history and Outbox | Full deployed order lifecycle |
| Margin | Close-request CAS and replay; late **entry** fills update linked position within same Spot trade transaction; two partial fills and forced rollback tested, 23/23 focused tests | Late **close** fill, repayment/liquidation, interest, deployed reconciliation |
| Binary | Local reserve, WIN/LOSS settlement, Activity and Outbox rollback, focused service tests | Persisted provider/config and expiry runtime |
| Withdrawal/deposit | Local review/reserve/approve/reject/refund and proof byte roundtrip evidence | Authenticated Admin review/actual broadcast |
| Mining | Local subscription, accrual/release and replay checkpoint tests | Real workflow recovery and payout acceptance |
| Loans | Local cumulative repayment CAS and workflow tests | Migration 0016 live application, repayment acceptance |

Evidence: `NEXI_PROOF_REUSE_REGISTER.md`, `tasks/evidence/margin-late-entry-atomic-20261018.md`, `tasks/todo.md`. Prior valid proof is reused; no new requirements from exploratory scans. Graphify's cloud graph at `36d5332` is stale; direct source and focused tests control conclusions. No worktrees, direct main commits only. This section supersedes conflicting historical status assertions below.
