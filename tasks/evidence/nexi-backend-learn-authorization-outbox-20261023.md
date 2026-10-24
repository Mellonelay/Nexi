# Backend Learn authorization and Outbox correction — 2026-10-23

**Source:** `bdb24005e3a50116a36e8b624a9957d25751e011` plus the uncommitted changes listed below.
**Scope:** Admin Learn category creation authorization and atomic status-change Outbox persistence. No schema, migration, live database, deployment, or service change.

## Changes

- `backend/src/communications/communications.controller.ts`: category creation now requires JWT, Admin auth surface, ADMIN role, and `learn.publish`, matching the Admin category-management contract.
- `backend/src/communications/communications.service.ts`: category status, audit record, and idempotent `EventOutbox` upsert now share one Prisma transaction. An Outbox failure rejects the transaction instead of returning an error after the category/audit have committed.
- `backend/test/communications/learn-lifecycle.spec.ts`: covers category-create guard metadata, transactional Outbox upsert/idempotency, and Outbox failure propagation.

## Skills and tools applied

- Read `using-agent-skills`, Context Engineering, TDD, debugging/error recovery, Ponytail, NestJS Code Audit, NestJS Professional Software Engineering, NestJS Architecture Principles, NestJS OOP Design Patterns, NestJS Features & Performance, Vibe Backend, Vibe SQL, Vibe shared workflow, SQL Expert transaction/concurrency, and the NestJS security reference.
- NestJS Code Audit collector invoked against `backend/src/communications`. Its allow-listed lint invocation was invalid for the collector's selected path; its whole-backend TypeScript invocation reported existing test/config errors outside this source change. Direct source-only typecheck below is authoritative for this diff.
- Vibe Coding MCP workflow searches returned zero matching workflows (server reported Vibe library 1.5.1 / instructions 1.4.1, while installed local skills are 1.3.0); no Vibe workflow is claimed as loaded. Local Vibe Backend/SQL instructions were read and applied.
- Context7 resolved Prisma documentation and returned the interactive transaction contract: an error thrown in the transaction callback rolls back the transaction. The returned page was Prisma v6 documentation, so this is supporting API guidance, not a v7-specific claim.
- Graphify file-neighbor calls mapped the controller/service boundary at indexed commit `bdb2400`; graph snapshot predates this patch and was used only for topology, not as proof of the new behavior.
- Fallow 3.30.0 scoped analysis of the three changed backend files: 0 findings.

## Verification

- `cd backend && NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand test/communications/learn-lifecycle.spec.ts` — PASS, 1 suite / 8 tests.
- `cd backend && ./node_modules/.bin/tsc -p tsconfig.build.json --noEmit --pretty false` — PASS, exit 0.
- `git diff --check` — PASS.
- Changed-file ESLint — NOT RUN successfully: backend has no ESLint configuration; the attempted direct invocation exited 2. No full lint pass is claimed.
- No production build, deployment, runtime/browser acceptance, SQLite mutation, or financial operation was performed.

## Remaining proof

The change is source-implemented and focused-tested, not committed, built into a production artifact, deployed, or runtime/browser-verified. The global Backend audit collector still reports unrelated existing test TypeScript errors and is not a source-only typecheck. Existing dirty `.codex/AGENTS.md` and untracked `tasks/evidence/nexi-release-manifest-bdb2400-20261023.md` were preserved and not included in this change.
