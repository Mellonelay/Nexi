# NEXI Architecture Analysis

## Authority Model
The current code and project rules establish these primary owners:
- NestJS: business/domain/API authority.
- D1: durable application and financial state.
- Ledger: accounting truth.
- EventOutbox: durable publication boundary.
- Aiven Valkey: realtime/cache/coordination only.
- Queues: delivery and retry.
- Workflows: orchestration.
- Cloudflare Worker: edge gateway and platform routing.
- Public/Admin: consumer and control surfaces.

This is a layered system, not a peer-to-peer set of services.

## Runtime Flow
```text
Public / Admin
      |
      v
api.nexitrading.app
      |
Cloudflare Worker
      |
Cloudflare Container
      |
NestJS 12
  |       |        |
 D1    Valkey   Queue/Workflow
  |                 |
Ledger/EventOutbox  async consumers
      |
Socket.IO / REST read-back
      |
Public / Admin state
```
## Cloudflare Boundary
The Worker is explicitly coded as an edge gateway. It starts/wakes the canonical `nexi-api` Container and forwards HTTP/WebSocket traffic to NestJS. Its source comments prohibit Worker-generated market or financial truth.

The Worker also contains bounded ingress/signature logic for Queue and Workflow bridges, Container lifecycle handling, and platform bindings.

## Backend Boundary
NestJS is a modular monolith inside the Cloudflare Container. The root module composes domain modules rather than distributing business authority into the Worker.

Important cross-domain seams:
- auth guards and JWT/SIWE identity.
- D1 Prisma service and D1 financial command gateway.
- ledger + settlement + financial operations.
- market providers + D1 quote/Kline persistence.
- EventOutbox + Queues/Workflows.
- Redis/Valkey Socket.IO distribution.
- Admin modules consuming the same backend authority.

## Public Boundary
The Public app is a Next.js 14 application. The dashboard layout owns global navigation, header, mobile bottom navigation, wallet access gating, route-history tracking, and page content.

The deployed product surface is mobile-first trading-oriented and includes market discovery, trading, wallet, earn/mining, loans, communications/content, and settings.
## Admin Boundary
The Admin application uses TanStack Start/Router and React Query. Its route tree is generated from route modules and its data layer is expected to call canonical backend/Admin APIs rather than become a second business authority.

## Structural Evidence
The local Graphify graph currently contains 7,676 nodes. A Phase-1 architecture query surfaced the expected Cloudflare, Container, D1, EventOutbox, financial gateway, ledger, wallet, auth, Admin, and queue/workflow nodes.

Graph evidence is used for topology and navigation only; direct source and runtime evidence remain stronger for implementation and behavior claims.

## Phase-1 Risks / Follow-up Targets
- Verify full Public -> backend -> durable state -> realtime/read-back paths by feature, rather than treating route existence as completion.
- Verify Admin controls map to canonical backend owners and do not duplicate authority.
- Separate deployed/healthy from visually correct and owner-accepted Public/Admin behavior.
- Keep market freshness/recovery and identity-protected financial/Admin paths as explicit runtime acceptance concerns.
