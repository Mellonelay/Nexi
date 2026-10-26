# NEXI three-surface Sentry and release preparation

**Current status (2026-10-27): coordinated release directed by owner; not yet executed.** The owner has directed one coordinated release after source corrections and technical preflight. Do not ask for duplicate authorization for this same release campaign. Source SHA and running artifact identity must never be treated as equal without a deployment receipt.

The release preflight remains open: Public's canonical Sentry dependency store does not match its manifest/lock; deployed artifact and runtime Sentry release identifiers disagree; Sentry write scopes and source-map upload are unverified; and current disk/I/O conditions do not support a safe build. `ROLLBACK_PREPARATION = OWNER_DEFERRED`: the owner will handle backup capacity and rollback preparation after engineering. This is a disclosed recovery limitation, not passed rollback evidence. Do not create rollback archives or perform storage cleanup under this campaign.

## Release contracts

- Backend NestJS uses `backend/src/instrument.ts`: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`. Set `SENTRY_RELEASE` to the exact immutable SHA of the built backend artifact in its environment before controlled backend rollout.
- Public Next.js uses `frontend/sentry.server.config.ts`, `frontend/sentry.edge.config.ts`, `frontend/instrumentation-client.ts`, and `frontend/next.config.js`. Align `SENTRY_RELEASE` with `NEXT_PUBLIC_SENTRY_RELEASE` for the **same Public build**, and ensure `SENTRY_ENVIRONMENT` aligns with `NEXT_PUBLIC_SENTRY_ENVIRONMENT`. Build IDs, `NEXI_BUILD_ID` and source maps must refer to that artifact.
- Admin uses `Admin/src/sentry.ts` and `Admin/vite.config.ts`: `VITE_SENTRY_RELEASE` and `VITE_SENTRY_ENVIRONMENT` are **build-time** Vite values; `NEXI_RELEASE_SHA` is recorded by deployment tooling. Align them with the built Admin SHA before publishing the build. Never silently substitute backend release for another surface's earlier artifact.
- Sentry is an observation and release-correlation surface, not proof that a domain is financially correct. Ignore old-release grouped issues when evaluating a new release unless their events match the current deployed SHA.

## Last observed deployed config (historical, not target)

At campaign inspection on 2026-10-20: backend environment carried `bae05aad3dcbae762427199f08a3ab7c9e01d9f5`; Admin environment carried `7fbde5ca82287902cb351546ccae1b632f1aae44`; Public environment file access was restricted. These belong to earlier deployed artifacts. **Do not overwrite running release variables now.**

## Coordinated release workflow under the current owner directive

1. Commit and freeze the coherent Git source identity; resolve source and dependency blockers. Record the owner-deferred rollback limitation; do not create archives under this campaign. Never run three large builds simultaneously on the 8 GiB VPS.
2. Backend: build once, inject backend release identity, deploy serialized, confirm service/readiness, release SHA and fresh release-scoped Sentry events. Confirm old Public/Admin remain API-compatible while backend updates.
3. Public: inject matching server/client Sentry release and build identity; build/deploy once, confirm public route/API, Sentry release and no current-release regression.
4. Admin: inject Vite build-time Sentry release; build/deploy once, confirm Admin login/API, Sentry release and no current-release regression.
5. Preserve old deployed releases and rollback. Report strongest proven state separately: SOURCE_VALIDATED / BUILT / DEPLOYED / RUNTIME_VERIFIED / OWNER_ACCEPTED.

No SQLite migration, financial tests, or queue execution is part of this release procedure. Deployment is in scope under the current owner directive after the technical preflight is satisfied.
