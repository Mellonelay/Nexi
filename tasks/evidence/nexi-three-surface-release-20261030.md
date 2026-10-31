# NEXI Three-Surface Release — 2026-10-30

## Authorization and identity
Owner explicitly authorized production build, service restarts and deferred rollback preparation for this release. Target source/docs SHA: `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b`; previous deployed SHA: `7e434daab146fe9c297c04e46ba9d4a0ee81401d`. All three final RELEASE_SHA markers equal target SHA. No application source edit, database migration, financial operation or live queue mutation.

## Actual builds and deployment
- Backend: canonical /srv/nexi/backend, pinned Node 24.21.0, `npm run build` (Nest), exit 0, service restarted; /readyz initially transient HTTP 502 during startup, then local and external HTTP 200 and database=true, redis=true, authority=SQLite.
- Public: canonical /srv/nexi/public/current, `next build --webpack` once followed by `prepare-standalone-assets.mjs`, service restarted; `.next/BUILD_ID=uljjzCtkvCSVGUPLSIB3x`, /dashboard HTTP 200. Host transport lost the completion notification mid-build, but original script/process finished; no duplicate build launched.
- Admin: canonical Admin checkout to /srv/nexi/admin/current via pinned corepack pnpm 12.14.0 and approved 1Password build wrapper, Vite/Nitro built, service restarted; /overview HTTP 200. Sentry plugin successfully uploaded 124 files under bundle 02d5dc83-8a83-5610-8992-6c433831b00f; upload processing and event-level source-map verification remain unknown.
- All services systemd active with NRestarts=0. Nginx-served /ops/live, /readyz, /dashboard, /overview returned HTTP 200. No current-release journal error-severity lines observed in bounded window after Admin start.
- Unauthenticated /auth/me, /admin/me, /wallet/activity each HTTP 401; Socket.IO polling HTTP 200 establishes transport reachability only. No authenticated Public/Admin login, wallet signature, financial action, browser or realtime end-to-end acceptance performed.
- Sentry query `release:a72c3127ffc448215cc7a724c4f5f6ca6e593b1b environment:production` over last 24h returned no stored error events. This does not establish ingestion completeness or no runtime errors; Public remote artifact upload and event-level symbolication were not established.
- After completed Public build, removed only its regenerated /srv/nexi/public/current/.next/cache/webpack (~1.3GiB) and the task-created /tmp/nexi-readiness-probe file. Root available capacity recovered to approximately 2.7GiB (95% used). Dependencies, SQLite/WAL, rollout history, artifacts, and backups preserved.
- Four financial gates remain OWNER_ACCEPTED_UNTESTED; production browser/authenticated integration and owner final acceptance remain open. Old CI was skipped via [skip ci]; no CI pass claim. Rollback preparation was explicitly owner-deferred; no rollback archive created.

## 2026-10-31 — Sentry follow-up

Sentry release `a72c3127ffc448215cc7a724c4f5f6ca6e593b1b` and production deployment `175136980` are associated. The current production workflow `6146426` and five-minute error monitor `10813107` are enabled and linked. The exact-release error search covered 24 hours and returned no errors; this is bounded query coverage, not exhaustive historical issue classification. Production spans were observed. Email is configured for issue owners with active-member fallback, but recipient delivery is unverified. Three-surface event-level symbolication remains unverified. See `nexi-sentry-detection-20261031.md`.
