# Admin/Public integration release readiness — 2026-10-22

**State:** source-only verification and release preparation. This record is not deployment or browser acceptance authorization.

## Source and deployed identities

- Source at this task's intake: `c5ad539568700fe1ed786ae2ef75e9fa0dcc0baa` (`main`, equal to `origin/main`). Quotes last-visible-category source fix: `24cf931ced0535a6793253a8bf53e87bdaeff34f`, pushed to GitHub `main`.
- Last recorded deployed Admin release: `e2f7a65ea4ac870c6ea1ff6e299502430ecf5570`, built in `/srv/nexi/admin/current`. This source task does not change that runtime identity.
- Admin runtime must remain the real Nitro output at `/srv/nexi/admin/current`, with Admin dependencies in `/srv/nexi/admin/shared/node_modules`. Public and backend retain their separate canonical shared dependency stores. Do not merge these installations.

## Focused source verification for the Quotes fix

- Backend disposable-SQLite Admin write/Public readback integration: 3/3 passed, including malformed/all-hidden rejection and preservation of the saved one-category choice. AppController runtime tests: 7/7 passed. Public settings tests: 3/3 passed.
- Backend build-scope TypeScript, Admin TypeScript, Public TypeScript, changed-file Admin ESLint, and `git diff --check` passed. The root test-inclusive backend `tsc --noEmit` fails on unrelated existing test/Jest typing errors; only the build-scope typecheck is green.
- Fallow introduced-only gate passed with zero introduced dead-code, complexity, duplication, or styling findings; an inherited unused-file finding remains for the directly-run Public Node test file. Graphify refreshed to 6,286 nodes / 17,422 edges.
- These checks do not establish production build, deployment, runtime, browser behavior, Sentry release status, or owner acceptance.

## Required release dependencies

- **Admin:** use the current Admin lockfile and dedicated shared dependency store; verify TypeScript, changed-file lint, Vite client, SSR and Nitro output before replacing the canonical runtime. The app uses React 19, TanStack Router/Start/Query and the existing generated route tree. This task does not change routing or dependency versions.
- **Public:** use its current lockfile and `/srv/nexi/public/shared/node_modules`; rebuild only in `/srv/nexi/public/current` under the maintained Public deployment procedure.
- **Backend:** use NestJS and Prisma Client 7.3.0 against the canonical SQLite provider. Admin settings remain NestJS-authorized; Public reads remain allowlisted. Build and deploy backend changes only under a separate backend release authorization.
- Serialize production builds and service control. A successful source typecheck is not a production build or runtime proof.

## Binary SQLite migration gate

- `backend/prisma/migrations-d1/0017_binary_research_controls.sql` adds `User.binaryResearchDefault` (`NORMAL`), `Gate2BinaryPosition.researchDefault` (`NORMAL`), nullable `researchOverride`, and `researchControlVersion` (`0`). Those fields are present in `backend/prisma/schema.d1.prisma` and the generated Prisma client; the installed Prisma client and CLI are both 7.3.0.
- The migration was exercised against disposable in-memory SQLite: it applied to pre-change `User` and `Gate2BinaryPosition` tables and produced the expected defaults/nullability. Reapplying it failed with `duplicate column name: binaryResearchDefault`; it is a one-shot migration and must not be blindly retried.
- Existing position indexes cover `(userId,state,createdAt)` and `(pair,state,createdAt)`; the migration adds no queried/indexed field that requires a new index. Existing unique `(userId,idempotencyKey)` and source version comparisons/settlement fencing remain in place; prior P2 focused tests are reused because those sources are unchanged.
- **Before any future live migration:** verify each target column is absent or present as a complete matching set, verify the supported migration-history/runner procedure, take and verify the protected SQLite backup including WAL/SHM handling, and apply once in a controlled window. Do not infer live migration status from this disposable test. If the migration is applied, rollback should revert application code while retaining additive columns; do not drop columns or edit promoted financial rows as a rollback shortcut.

## Recovery, protected data, and observability

- The previously recorded verified Admin rollback artifact is `/srv/nexi/admin/shared/rollback-admin-a6b5c853-20261021.tar.gz`, SHA-256 `300795ebdda9d09bdca7d17a8197c53f75a00a7144982921cdc2148c0e0c2632`. Its archive integrity, disposable restoration/content comparison and live-target rsync dry run were recorded as passed. Retain it until the owner accepts a later Admin deployment.
- Preserve `/srv/nexi/admin/shared/node_modules`, `/srv/nexi/admin/logs`, all promoted SQLite database/WAL/SHM files, and separate app dependency stores. Do not point a rollback at a copied or alternate runtime tree.
- The last recorded Admin build lacked `SENTRY_AUTH_TOKEN`; no source maps or Sentry release were created, and Sentry lookups returned HTTP 502. This is historical release evidence, not a fresh check for this source task. After an authorized release, verify the exact Admin release identity, source-map upload association and release-matched critical issues through existing secret injection without printing credentials. Track backend Mining issue `NEXI-17` separately; this Admin-only task does not authorize a backend deployment.

## Owner browser acceptance checklist

Use the separate local ChatGPT Work browser session after a release is approved. Verify desktop and mobile layouts and:

- Quotes category order and visibility; the final visible category cannot be hidden and the Admin explanation is accessible.
- Quotes Hub shows only selected categories while retaining the existing 53-asset catalog.
- Translation override, absent-override fallback and settings persistence after refresh.
- Eight-workspace Admin navigation, contextual navigation and responsive layouts.
- Binary client default and eligible open-position controls, including permission/error states.
- Admin/Public Messages history, send/reply and permission/error states.
- Public route/maintenance behavior, banners and feature flags only after their exact product contracts are approved; they remain unsupported/unintegrated until then.
- Authenticated API protection and the intended actor/permission boundary.

No deployment, service restart, production migration, promoted-database write, Sentry release check, or browser verification was performed for this record.
