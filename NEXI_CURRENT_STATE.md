# NEXI Current State

**As of:** 2026-09-20 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Current source authority:** GitHub `main` (discover live; do not freeze this file to its own documentation commit SHA)
**Current deployed production Worker release:** `b5325e751415dfdb4cc5bc8d120fe43638643531`; the active Container/Worker stack includes the NestJS 12 backend, D1 sequence repair, retired market-archive path, Observe wiring, inactive-container fetch recovery, and the USD/RUB MOEX-first source policy.

NEXI remains in the **finishing / targeted-repair state**, not a rebuild phase.

## Backend execution-authority transition — 2026-09-17

- **Cloudflare Worker + Container is now the only active backend execution/runtime authority.**
- **GitHub `main` remains durable source authority.**
- Worker 0 / VM is an operator, recovery, source-analysis, frontend/Admin hosting, and tooling plane only; it must not host a competing NestJS backend runtime or provide backend acceptance truth.
- Final backend source-equality reconciliation is **PROVEN**: tracked backend source at GitHub `main@81baa15...` is unchanged from `3b173ea...`; the running Cloudflare Container package manifests exactly match Git, and 170/170 source-produced backend JavaScript build artifacts matched byte-for-byte. The only additional Container artifacts were 10 deterministic generated Prisma D1 client files created by the Container/Docker build path.
- Three VM-only asynchronous filesystem edits (`admin.service.ts`, `feedback.controller.ts`, `staging-fixture.ts`) had no GitHub/Cloudflare provenance or accepted runtime evidence. They were preserved as a recovery patch and removed from the active VM working tree rather than promoted into production authority.
- Current official Cloudflare documentation + current Wrangler/MCP help is a mandatory pre-mutation gate for every Cloudflare product/feature.
- Retired pre-D1 database implementation/history has been removed from active repository authority: the legacy migration tree, stale provider-specific Cloudflare docs/config descriptions, devcontainer client package, and active source/test wording are gone; current Cloudflare secrets/config expose only D1 as the durable database binding.
- Current operator workflow is documented in `NEXI_CLOUDFLARE_BACKEND_OPERATOR_RUNBOOK.md`; Container shell access uses Cloudflare's official Wrangler SSH path.
- Any legitimate future backend source repair performed through the Cloudflare execution plane must be verified there and reconciled to GitHub `main` immediately at task completion.

### Production resource identity / operator proof — 2026-09-17

- Historical Cloudflare identifiers `nexi-staging`, `nexi-api-staging`, `nexi-core-staging`, and related `*-staging` resource names are the resources currently serving NEXI production. **Name suffixes do not define the environment.** Production identity is established by the active `api.nexitrading.app` route, live deployment/runtime state, and `NODE_ENV=production`.
- Official Wrangler Container SSH was directly proven against the running `nexi-api` Container instance through the configured ED25519 operator key and OpenSSH ProxyCommand/`--stdio` path. The live Container reported `PID 1 = node dist/src/main.js`. Worker 0 remains only the operator transport; the process runs inside Cloudflare.
- Fresh production HTTP proof: `/health` = 200, `/healthz` = 200, `/readyz` = 200 with D1 database + Valkey/Redis readiness, `/market/provider-state` = 200, and `/market/prices` = 200.
- **Owner decision 2026-09-19:** the market R2/Data Catalog/Pipelines archive path is retired as unnecessary complexity. Live market authority remains provider adapters -> NestJS -> D1 quote/Kline persistence -> Aiven Valkey -> Socket.IO -> Public/Admin. Active Worker bindings no longer include market R2 or Pipelines; Cloudflare Pipelines list is empty and the retired archive secret is gone. `DEPOSIT_PROOFS` R2 remains in use. The retired `nexi-market-archive-staging` bucket was emptied through Cloudflare's R2 Empty Bucket job (21,711 objects deleted) and then deleted; `DEPOSIT_PROOFS` remains the only NEXI R2 bucket in the active product configuration.
- Live Worker observability uses `SENTRY_ENVIRONMENT=production`; the active Worker carries Sentry release `b5325e751415dfdb4cc5bc8d120fe43638643531`. NestJS Observe `0.1.10` is wired with service ID `nexi`, its credentials are Worker secrets forwarded into the Container, and production HTTP requests have been generated. Final Observe dashboard event visibility is an owner-side dashboard confirmation, not a source/runtime wiring blocker.
- A production-config dry-run with verified Wrangler `4.129.0` and `--containers-rollout none` passed after reconciliation. Its 46 visible non-secret bindings exactly matched the active Worker; the live secret bindings absent from dry-run display were expected secret bindings. The retired market archive token is no longer part of the target configuration.

## Current proven state

- Public source convergence frontier: **COMPLETE, verified, and pushed** at `5c01b715985fec51c79699fcf5b7319e3435ac0e`; not yet promoted to production. The bounded repair preserves backend market state and monotonic per-symbol realtime sequences without creating a second market owner.
- Production Worker deployment baseline: **COMPLETE** at `b5325e751415dfdb4cc5bc8d120fe43638643531`; active Container application is version 63 with one running `nexi-api` instance and healthy readiness.
- Backend/Cloudflare readiness and health: **PROVEN PRODUCTION** for the deployed baseline; fresh `/ops/live` and `/ops/ready` both return 200 with database=true and redis=true.
- Public/Admin bounded unauthenticated production browser acceptance: **COMPLETE** for the deployed baseline.
- Required Klines `1m/5m/15m/30m/1h/4h/1d`: **PROVEN PRODUCTION**.
- Production realtime reconnect/resnapshot and REST read-back recovery: **PROVEN**.
- Sep 12 wallet-browser/provider/drawer/notification/deposit repairs: **reuse unless current evidence contradicts them**.
- Worker-0 dependency ownership: **RECONCILED**. Public source `node_modules` -> `/srv/nexi/public/shared/node_modules`; Admin source `node_modules` -> `/srv/nexi/admin/shared/node_modules`.
- Public direct dependencies: **40/40 validated** against lockfile/current install.
- Admin direct dependencies: **70/70 validated** against lockfile/current install; Admin `npm run typecheck`: **PASS** after dependency re-homing.
- Canonical `/srv/nexi` package-build verification for the current frontier: Public Next 14.0.4 production build **PASS** from `/srv/nexi/public/build-20260917-145740` using `/srv/nexi/public/shared/node_modules`; Admin production build **PASS** from `/srv/nexi/admin/build-20260917-145740` using `/srv/nexi/admin/shared/node_modules`. Public rebuildable `.next/cache` was removed after the successful build and is not part of the immutable release payload.
- Runtime resolution confirms Public `next` and Admin `@tanstack/react-start` resolve from their dedicated `/srv/nexi/.../shared/node_modules` owners.
- Stale source build outputs `.next` and Admin `.output`: **REMOVED as rebuildable generated state**.
- Historical Public/Admin release retention cleanup: **COMPLETE by owner decision 2026-09-19**. Obsolete immutable releases were removed while preserving the exact active `/srv/nexi/public/current -> .../3b173ea-prod` and `/srv/nexi/admin/current -> .../3b173ea-prod-node` targets.
- Worker-0 storage recovery: **COMPLETE**. Final task-worktree, `/tmp/nexi-*`, obsolete release, and scratch cleanup left about `6.0G` free / `85%` used while preserving canonical source, shared dependencies, active releases, Graphify, DeepWiki, and host capability state.
- Parent/Worker-0 routing is **REALIGNED**: compile the complete owner message first; treat `@skill` mentions as capability hints; select one primary responsibility owner plus only material non-overlapping specialists; reuse proven capability routing; use the fastest precise tool/MCP/CLI; recover/reconnect live Worker-0 work before respawning; keep production authority unchanged by tool availability.
- Worker-0 capability knowledge system: **IMPLEMENTED + VERIFIED**. `RDC_ONBOARDING.md` now routes to the lightweight capability index, MCP/CLI catalogs, browser fabric, and canonical Graphify/DeepWiki guides. Durable capability ownership is documented while mutable version/auth/schema/health/index state remains live-discovered. Current-source BrowserStack manual acceptance has started on the isolated Public preview; owner visual acceptance remains pending and is separate from backend authority convergence.

## Fresh live runtime re-audit — 2026-09-19 19:24 UTC

Current direct evidence supersedes older acceptance statements wherever they differ:

- Public/Admin are hosted from the dedicated /srv/nexi tree:
  - Public: /srv/nexi/public/current -> /srv/nexi/public/releases/3b173ea-prod
  - Admin: /srv/nexi/admin/current -> /srv/nexi/admin/releases/3b173ea-prod-node
  - active Public/Admin process CWDs match those release trees.
- Cloudflare backend is currently healthy:
  - /healthz 200
  - /ops/live 200
  - /ops/ready 200 with database=true and redis=true
  - /market/prices 200
  - /market/provider-state 200
- Market runtime currently returns 53 assets: 37 LIVE, 16 STALE, 0 UNAVAILABLE. The old 13-symbol D1 sequence-collision failure is not reproduced in the current response; all rows have sequences.
- Market archive retirement is verified: zero R2 buckets matching market, no Pipelines, and DEPOSIT_PROOFS remains.
- External app.nexitrading.app and admin.nexitrading.app currently return HTTP 522. Local Nginx and the dedicated Public/Admin processes respond with 307, so the remaining frontend defect is in the external Cloudflare edge/origin reachability seam, not host ownership.
- Therefore the current state is: backend runtime healthy; archive retired; market partially fresh; Public/Admin externally unavailable at the tested domains.

## Remaining production closure gates

1. Market reliability/freshness must be proven truthful and self-recovering for all 53 canonical assets; legitimate closed-market staleness must have an explicit reason, while open-market silent staleness is a defect.
2. Current Public source frontier must be promoted through the canonical `/srv/nexi/public` release path and re-verified against the Cloudflare backend.
3. All safely automatable Public/Admin/backend/async/financial product rows in `NEXI_PRODUCTION_COMPLETION_LEDGER.md` must have current end-to-end proof or applicable `PROVEN_UNCHANGED` evidence.
4. Wallet/SIWE/protected-financial and privileged Admin paths must use controlled test identities when safe, or be explicitly deferred by the owner.
5. Owner manual acceptance is the final gate only after the above automation gates are satisfied.

`FULL_PRODUCTION_END_TO_END_ACCEPTED = NO` because automated production closure is still incomplete; it is not blocked only by the two identity-dependent gates.

## Governing rules

`PROVEN + UNCHANGED = REUSE`

If existing functionality fails, repair the existing canonical path only. Do not restart completed domains, restore superseded controllers, create parallel authority, or rerun broad acceptance without change-driven evidence.

When a bounded task materially changes durable truth, reconcile authority before reporting completion: update `NEXI_CURRENT_STATE.md` for current truth, and update `NEXI_PRODUCTION_COMPLETION_LEDGER.md` only when durable completion evidence changed. Do not memorialize transient commands/processes.

On Worker 0, Public/Admin source work must reuse their dedicated `/srv/nexi/public` and `/srv/nexi/admin` dependency/runtime seams. Do not create session-local frontend/admin dependency trees.

## Completion controller

The only final completion controller is `NEXI_PRODUCTION_COMPLETION_LEDGER.md`.
Historical 27-row matrices, `CODE_TO_CODE_CLOSED`, A25/A26/A27, staging-first sequencing, recovery handovers, old SHAs, old worktrees and old VM/Codespace status files are not current authority.

## Live correction — updated 2026-09-20

- The current VM origin IP is `35.187.234.62`.
- Cloudflare DNS is now converged: both `app.nexitrading.app` and `admin.nexitrading.app` are proxied A records targeting `35.187.234.62`.
- Fresh external HTTPS verification returns `307` through Cloudflare for both domains. The stale-DNS defect is closed.
- Last recorded `/market/prices` snapshot remains 53 assets, 36 LIVE, 17 STALE, 0 UNAVAILABLE, with `STEEMUSDT` newly stale at that observation time.
- The earlier 13/16/17 stale counts are time snapshots, not a fixed invariant. The unresolved problem is market reliability: every open-market asset must remain fresh or self-recover automatically; legitimate closed-market states must be explicit and truthful.
- Current interpretation: dedicated host ownership and DNS are correct; Cloudflare backend is reachable; market reliability and full automated product closure remain incomplete.
