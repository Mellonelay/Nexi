# NEXI Project Overview

## Scope
Repository: `Mellonelay/Nexi`
Live analysis root: `/home/mellonelay1999/workspaces/Nexi`
Analyzed source frontier: `main@ed26973fe0556a6d75943b3e296be0a899449d6d`
Tracked files: 663
Primary purpose: crypto trading platform with Public, Admin, and Cloudflare-hosted backend/runtime surfaces.

## Primary Technology Stack
- Backend: NestJS 12, TypeScript 6, Prisma 7 D1 adapter.
- Durable application/financial database: Cloudflare D1.
- Accounting authority: Ledger services/tables.
- Edge/runtime: Cloudflare Worker + Cloudflare Container.
- Realtime/cache: Aiven Valkey/Redis + Socket.IO Redis adapter.
- Async: Cloudflare Queues and Workflows.
- Public: Next.js 14 / React 18.
- Admin: TanStack Start / React 19 / Vite 8.
- Observability: Sentry across backend, Worker, Public, Admin; Nest Observe in backend.
- Structural tooling: Graphify plus Fallow/DeepWiki support artifacts.

## Repository Shape
- `backend/`: NestJS business/domain authority.
- `cloudflare-container-bootstrap/`: Worker edge gateway, Container lifecycle, Cloudflare bindings.
- `cloudflare-container-bootstrap/dexi-frontend/`: Public trading frontend.
- `apps/admin/`: Admin control plane.
- `docs/`: architecture, contracts, frontend/backend, operations, security, recovery.
- `platform/`: platform synchronization targets.
- `scripts/`: validation and operational scripts.
- `graphify-out/`: current local structural graph artifacts.
## Backend Composition
`AppModule` wires auth, users, wallet, ledger, settlement, financial operations, market, spot, binary, conversion, mining, loans, KYC, communications, notifications, audit, risk, Admin, D1, workflows, profile, referral/VIP, Redis, and observability modules.

Backend bootstrap enables:
- Swagger/OpenAPI at `/docs` and `/docs-json`.
- global validation with whitelist + forbid-non-whitelisted.
- configured CORS.
- Socket.IO through Redis/Valkey adapter.
- shutdown hooks and runtime lifecycle coordination.
- Sentry global error filtering and Nest Observe instrumentation.

The D1 Prisma schema currently defines 88 models and 42 enums.

## User Surfaces
Public currently exposes 14 page routes, including dashboard, asset detail, spot, binary, wallet, mining, loans, announcements, learn, messages, support, settings, login, and signup.

Admin currently exposes 36 route modules spanning users, KYC, wallets, deposits, withdrawals, ledger, settlements, market feeds, spot, binary, mining, loans, support, messages, announcements, learn, notifications, feature flags, maintenance, localization, audit, approvals, roles, sessions, networks, reconciliation, exposure, health, and frontend control.

## Evidence Boundary
This document describes the codebase architecture at the analyzed source frontier. It does not claim that every route is currently runtime-verified or owner-accepted.


## Production Completion Controller

`NEXI_PRODUCTION_COMPLETION_LEDGER.md` is the canonical final-completion controller for this analysis.

The currently deployed unified source generation is `ed26973fe0556a6d75943b3e296be0a899449d6d` across GitHub main, Public release identity, Admin release identity, and the tagged Cloudflare Worker deployment.

Promotion itself is complete. Full NEXI completion is not: remaining Public/Admin/market/financial/async/realtime/identity rows retain their ledger status until current end-to-end evidence closes them.

Phase 2 therefore follows the active ledger queue rather than inventing a separate analysis checklist.
