# NEXI Parallel Frontend, Backend, and Cloudflare Execution Plan

**Status:** ACTIVE EXECUTION COORDINATION AUTHORITY  
**Date:** 2026-07-29  
**Canonical authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Operating authority:** `docs/MELLONELAY_FULL_STACK_UTILIZATION_OPERATING_MANUAL.md`

This document fills the concurrency and Cloudflare sequencing gap. It does not replace the charter, backend B0-B10 program, Admin A0-A9 program, contracts, security, quality, or release documents.

## Verified program coverage

The repository already defines the complete product roadmap from Phase 0 through Phase 19, plus frontend F0-F10, backend B0-B10, and Admin A0-A9. The missing layer was exact parallel ownership, heavy-command serialization, contract handoff, and an explicit Cloudflare adapter lane.

## Three-surface rule

1. Public web owns presentation and user workflow composition.
2. NestJS backend owns authoritative domain logic, PostgreSQL data, Redis coordination, jobs, APIs, and WebSockets.
3. Admin is a separate role-gated application consuming governed Admin APIs.

Cloudflare Worker, Durable Object, and Container are the selected ingress and deployment path for the backend and web artifacts. They are infrastructure adapters, not a fourth product surface and not domain authority.
## Parallel ownership

### Lane WEB — ChatGPT/RDC/Figma

Write scope:
- `cloudflare-container-bootstrap/dexi-frontend/**`
- the connected NEXI Figma Draft file
- frontend-specific evidence under `work/20260729-*frontend*`

Read-only elsewhere. This lane must not edit `backend/**`, Prisma, Cloudflare Worker source/config, Admin extraction, or shared contract authority while the API lane is active.

### Lane API — Codex CLI parent

Write scope:
- `backend/**`
- `docs/backend/**`
- `docs/contracts/**`
- backend-specific evidence under `work/20260729-parallel-execution/backend/**`

Conditional scope after explicit phase handoff:
- `cloudflare-container-bootstrap/src/**`
- Cloudflare Docker, Nginx, and Wrangler files, but never during B0-B9 implementation and never without migration-lineage proof.

The API lane must not edit `dexi-frontend/**`, Figma, frontend visual documents, or the public navigation contract.
### Lane ADMIN — later dedicated writer

Admin remains serialized until B1 identity/RBAC, shared contracts, and A0 boundaries are stable. The embedded public `/dashboard/admin` is reference-only; it must not become a second canonical Admin implementation.

## Shared-file and process locks

- Only one actor may change root manifests, workspace files, root lockfiles, or `graphify-out/**` at a time.
- Do not run two `npm install` operations concurrently.
- Do not run frontend and backend production builds concurrently.
- Frontend runtime uses port 3100.
- Local API target uses port 3001; container API may remain port 3000.
- Future Admin target uses port 3200.
- Wrangler local target uses port 8787.
- Chrome CDP uses port 9222.
- PostgreSQL and Redis retain 5432 and 6379 when runtime proof begins.

Before a heavy build, the actor records `BUILD_OWNER`, command, start time, and expected completion under `work/20260729-parallel-execution/BUILD_LOCK.md`. Remove or close the lock after recording the result.

## Contract handoff

Codex owns contract definitions during the parallel backend phase. It writes stable payload decisions and compatibility notes to `work/20260729-parallel-execution/CONTRACT_HANDOFF.md`. The frontend lane reads that file and adapts clients without inventing endpoint shapes.
## Backend implementation sequence

Follow the existing backend program without skipping authority dependencies:

- B0: runtime foundation, typed environment, configurable ports, health/readiness, error/correlation model, PostgreSQL/Redis lifecycle, WebSocket lifecycle, graceful shutdown, and non-mutating lint/test baselines.
- B1: separate public/Admin identity, sessions, guards, ownership, RBAC, revocation, rate limits, and negative authorization tests.
- B2: assets, networks, pairs, capabilities, normalized quote provenance and freshness.
- B3: ledger, wallet domains, postings, idempotency, reconciliation, audit linkage.
- B4: Spot validation, reserve/fill/cancel/fees/history through ledger authority.
- B5: Binary config, positions, exposure, price capture, expiry and idempotent settlement.
- B6: deposits and withdrawals with review and traceable network evidence.
- B7: mining, rewards, loans and repayment through ledger authority.
- B8: support, messages, content, notifications and delivery/read state.
- B9: governed Admin queries/commands, feature configuration, approvals, sandbox APIs and audit.
- B10: load, abuse, recovery, backup/restore, observability, runbooks and release hardening.

The first parallel Codex slice is B0 plus a contract/current-state ledger. It must not start financial mutations, schema migration, Cloudflare reconciliation, or Admin extraction.
## Cloudflare adapter sequence

Cloudflare work begins only after local backend authority and contracts are proven.

- C0: read-only reconciliation of local Worker/DO/container configuration against current production metadata and migration lineage.
- C1: decide public, Admin, API and sandbox host/routing boundaries; keep domain logic in NestJS.
- C2: define local, test, sandbox, staging and production Wrangler environments and binding ownership without secrets.
- C3: establish deterministic web/API/Admin image and build contexts; deprecate unsafe unified-image behavior.
- C4: implement edge routing, WebSocket upgrades, CORS/origin rules, correlation forwarding and no-store policy for dynamic APIs.
- C5: wire Worker, container, API, database, Redis, market and job health/readiness plus structured operational evidence.
- C6: validate secret scopes, network egress, rate limits, origin protection, environment separation and sandbox isolation.
- C7: run `wrangler check`, generated binding/type checks, local integration and approved dry-run packaging. No deploy.
- C8: create deployment artifact manifest, environment diff, migration plan, previous-known-good identity, rollback procedure and post-deploy smoke plan.

No Wrangler migration block, Durable Object class, binding, image, secret, DNS, or deployment may change until C0 proves the current lineage and the user explicitly approves the consequential phase.
## Resource policy for the current Windows host

Measured capacity on 2026-07-29: 15.61 GB RAM, 5.62 GB free, and 12 logical CPUs before the second implementation lane begins.

Safe concurrently:
- one frontend development/production server;
- one Codex CLI parent editing/testing backend source;
- one browser used for current verification;
- ordinary focused tests and type checks.

Serialize:
- frontend and backend production builds;
- dependency installation;
- Prisma generation/migration tests;
- Docker/Cloudflare container builds;
- full Playwright matrices;
- Graphify updates.

Do not run Docker Desktop, PostgreSQL, Redis, Wrangler local containers, both Brave and Chrome heavy sessions, and simultaneous web/API builds during the same memory peak. Runtime integration is a later scheduled gate.

## Completion and handoff

Every slice reports changed files, tests, runtime evidence, residual risk and rollback. Backend contracts become frontend inputs only after Codex marks them `STABLE_FOR_CONSUMER`. Cloudflare remains deferred until backend B0-B9 evidence is sufficient and the C0 reconciliation is complete.

`PARALLEL_PLAN_STATUS=READY`
`DEPLOYMENT_AUTHORIZED=NO`
`SCHEMA_MIGRATION_AUTHORIZED=NO`
`CLOUDFLARE_MUTATION_AUTHORIZED=NO`