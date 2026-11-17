# NEXI three-surface production deployment — preflight blocked

Date: 2026-11-17
Result: BLOCKED before build or deployment
Canonical checkout: `/home/mellonelay1999/workspaces/Nexi`

## Source identity

- `main` HEAD: `ce8de785dcb0c252720457a7bae53b9afd989eb4`
- `origin/main`: `a71270f77c842db3c96e47f985836b4686e718c7`
- HEAD is one commit ahead. `git diff --stat origin/main..HEAD` reports five documentation/evidence files only (41 insertions, 2 deletions); no application source delta.
- SentinelX project snapshot before this receipt: zero staged and zero unstaged tracked changes; 186 pre-existing untracked files. All were preserved.
- `NEXI_CURRENT_STATE.md` records `SOURCE_CLOSED` at `a71270f`. This is source-phase evidence only.

## Read-only deployment baseline

- `nexi-api.service`, `nexi-public.service`, and `nexi-admin.service` were active. Current HTTPS probes returned 200 for API `/readyz`, Public `/dashboard`, and Admin `/overview`.
- The active Nginx configuration routes `www.nexitrading.app` to upstream `nexi_public_staging` (127.0.0.1:3000), `admin.nexitrading.app` to `nexi_admin_staging` (127.0.0.1:3001), and API to 127.0.0.1:3002. The API unit describes itself as “non-authoritative staging until cutover acceptance”; Public/Admin units are also named staging.
- Available resources: 31 GiB disk free; 5.5 GiB memory available. Node 24.21.0 and npm 11.19.0 are installed. No project dependency install was run.
- Canonical dependency symlinks point to their existing per-app stores. Backend source/runtime package and lockfile hashes match; Public source/runtime package and lockfile hashes match.
- Admin source lock hash is `16a96717d8b881f5f94cc9d9ef9e6f5ab525a6bf7cc477371392873f09e8ffb1`; installed shared-store `.pnpm/lock.yaml` hash is `2235e85dcf5d2b06bde6db8b529e2e211b964e7e4d4094a4e08779dfb2187d6a`. The canonical Admin instructions require matching the committed lock to the existing store before using the verify-deps exception.
- Existing artifact markers are Backend `45a857de6a4d4101fc3f42738eb7d83f52bd62eb`, Public `27b78bb6f74a0ddb44e9121b15fdbb7c9f1c3c32` (Build ID `lP_EqHXKk1pMVBRUIxhJj`), Admin `45a857de6a4d4101fc3f42738eb7d83f52bd62eb`. Admin runtime `NEXI_RELEASE_SHA` is `d31bc13488d42cbd1c81698cfdd2a637bd9adac5`, which does not match its artifact marker.
- API service logs included MarketIngestService warnings about saturated provider queues and dropped depth events. This is a pre-deploy observation; no causal diagnosis was performed.

## Release gates

1. Target identity needs reconciliation: production HTTPS names currently route to explicitly staging-named upstreams/services. No routing/config change was made.
2. The canonical Backend and Admin procedures require stopping their services before replacing active outputs. Current SentinelX service policy exposes status/start/restart for those units, but not stop. Public stop is exposed. No alternate stop path was attempted.
3. `sentry-cli info` returned unauthenticated. `op whoami` found no account; `nexi-admin-with-secrets sentry-cli info` returned “Missing 1Password bootstrap or reference config.” No credentials were read or exposed. The Sentry tool-catalog search endpoint returned that it was removed. Authenticated Sentry error searches for the existing Backend/Admin and Public production releases returned zero errors in the last 24 hours; this does not prove release association, upload, or source-map symbolication for the target build.
4. The Admin installed pnpm lock snapshot differs from the committed source lock. No dependency-store mutation was attempted.

## Actions taken / not taken

Read-only Git, service, resource, dependency-link, manifest, route, HTTPS and Sentry checks only. No application build, artifact replacement, service stop/restart, database migration, financial operation, deployment, or acceptance campaign was performed. The prior release artifacts and all untracked files remain untouched.
