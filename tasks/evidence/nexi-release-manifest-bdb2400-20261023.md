# NEXI release manifest — `bdb24005e3a50116a36e8b624a9957d25751e011`

**Prepared:** 2026-10-23 20:15 UTC

**Scope:** Backend + Admin source batch; Public source/artifact unchanged

**GitHub main:** `bdb24005e3a50116a36e8b624a9957d25751e011`

| Surface | Source SHA | Dependency/toolchain | Canonical build/output | Sentry identity and coverage | Status |
|---|---|---|---|---|---|
| Backend | `bdb24005e3a50116a36e8b624a9957d25751e011` | `backend/package.json` + `package-lock.json`; Node 24.21.0/npm 11.19.0; `/srv/nexi/backend/shared/node_modules` | Build at `/srv/nexi/backend`; `npm run build`; output `/srv/nexi/backend/dist` | Runtime `SENTRY_RELEASE` must be this exact SHA; inspect exact-release telemetry after restart | Authorized, preflight passed; build/deploy pending |
| Public | `bdb24005e3a50116a36e8b624a9957d25751e011` has no Public source changes since `3bb57e0` | `frontend/package.json` + lock; dedicated `/srv/nexi/public/shared/node_modules` | Reuse existing `/srv/nexi/public/current/.next` artifact, deployed build ID unchanged | No Public upload or build in this batch; prior source-map state remains separate | Reused; no deployment |
| Admin | `bdb24005e3a50116a36e8b624a9957d25751e011` | `Admin/package.json` + `pnpm-lock.yaml`; pinned pnpm 12.14.0; `/srv/nexi/admin/shared/node_modules` | Build from committed `Admin/`; output `/srv/nexi/admin/current`; use `~/.local/bin/nexi-admin-with-secrets` | Wrapper supplies exact build-time `VITE_SENTRY_RELEASE`; prior Admin artifact association was partial | Authorized, preflight passed; build/deploy pending |

## Deployment order and rollback

1. Backend first: current API supports existing Public/Admin while the new category API is added. No Prisma schema or migration change. Preserve and restore Backend `3bb57e0` rollback on failure.
2. Admin second: it consumes the new Backend Admin-only Learn category endpoints. Preserve and restore Admin `3bb57e0` rollback on failure.
3. Public remains on the existing compatible artifact because no Public source changed.

Fresh live-output rollback archives were created and restored to disposable directories before any output replacement:

- Backend: `/srv/nexi/backend/rollback/rollback-backend-3bb57e0-to-bdb2400-20261023.tar.gz`, SHA-256 `2d1c5267f18368a6439bdf38463a6ee6388865f5365a334443465ab22cb647dc`; archived release marker `3bb57e02ea921531975124ce2c827382a9f1ec6b`; gzip and empty `rsync -aHAXn --delete` restore comparison passed.
- Admin: `/srv/nexi/admin/shared/rollback-admin-3bb57e0-to-bdb2400-20261023.tar.gz`, SHA-256 `ba0f48c76bbd1f816724397224184efd26c2269c8255d80ad5250a59af3cdb5c`; archived release marker `3bb57e02ea921531975124ce2c827382a9f1ec6b`; gzip and empty `rsync -aHAXn --delete` restore comparison passed.

The older archives named in the prior release receipt contained `c74b3c0` markers, not the active `3bb57e0` release; they were not selected as rollback for this rollout. No promoted SQLite migration, direct database mutation, customer message, or financial operation is part of this release.

## Post-deployment fields

- Backend build/result: pending
- Admin build/Sentry upload result: pending
- Running release identities and service PIDs: pending
- API/Admin checks and shutdown observation: pending
- Exact-release Sentry result: pending
- Chrome 5858 authenticated browser result: pending
