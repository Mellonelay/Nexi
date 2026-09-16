# NEXI Current State

**As of:** 2026-09-17 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Current source authority:** GitHub `main` (discover live; backend equality baseline below was proven from `81baa15f82901f26405cfd378f7e0f5fe31b693e`)
**Current deployed production baseline:** `3b173ea38da4c80193c5e0b552ae62fede22fab7`

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

## Current proven state

- Frontend source convergence: **COMPLETE and pushed** at `81baa15...`; not yet deployed.
- Production deployment baseline: **COMPLETE** at `3b173ea...`.
- Backend/Cloudflare readiness and health: **PROVEN PRODUCTION** for the deployed baseline.
- Public/Admin bounded unauthenticated production browser acceptance: **COMPLETE** for the deployed baseline.
- Required Klines `1m/5m/15m/30m/1h/4h/1d`: **PROVEN PRODUCTION**.
- Production realtime reconnect/resnapshot and REST read-back recovery: **PROVEN**.
- Sep 12 wallet-browser/provider/drawer/notification/deposit repairs: **reuse unless current evidence contradicts them**.
- Worker-0 dependency ownership: **RECONCILED**. Public source `node_modules` -> `/srv/nexi/public/shared/node_modules`; Admin source `node_modules` -> `/srv/nexi/admin/shared/node_modules`.
- Public direct dependencies: **40/40 validated** against lockfile/current install.
- Admin direct dependencies: **70/70 validated** against lockfile/current install; Admin `npm run typecheck`: **PASS** after dependency re-homing.
- Runtime resolution confirms Public `next` and Admin `@tanstack/react-start` resolve from their dedicated `/srv/nexi/.../shared/node_modules` owners.
- Stale source build outputs `.next` and Admin `.output`: **REMOVED as rebuildable generated state**.
- Large remaining disk use under historical `/srv/nexi/.../releases` is a **release-retention/rollback policy issue**, not a dependency-correctness defect.
- Worker-0 storage recovery: **COMPLETE FOR PRE-BROWSER HEADROOM**. Root filesystem improved from `94% used / 2.1G free` to `90% used / 3.1G free` by removing proven rebuildable npm/apt cache material and inactive npx sandboxes; canonical source, shared dependencies, active production releases, Graphify, and DeepWiki were preserved. Remaining large reclaimable space is retention-sensitive historical Public/Admin releases and requires a separate owner retention decision.
- Parent/Worker-0 routing is **REALIGNED**: compile the complete owner message first; treat `@skill` mentions as capability hints; select one primary responsibility owner plus only material non-overlapping specialists; reuse proven capability routing; use the fastest precise tool/MCP/CLI; recover/reconnect live Worker-0 work before respawning; keep production authority unchanged by tool availability.
- Worker-0 capability knowledge system: **IMPLEMENTED + VERIFIED**. `RDC_ONBOARDING.md` now routes to the lightweight capability index, MCP/CLI catalogs, browser fabric, and canonical Graphify/DeepWiki guides. Durable capability ownership is documented while mutable version/auth/schema/health/index state remains live-discovered. Current-source BrowserStack manual acceptance has started on the isolated Public preview; owner visual acceptance remains pending and is separate from backend authority convergence.

## Remaining owner-context gates

1. Authenticated wallet/SIWE/balance + protected financial interaction: `MANUAL_OWNER_ACCEPTANCE_REQUIRED`.
2. Privileged Admin RBAC/action: `MANUAL_OWNER_ACCEPTANCE_REQUIRED`.

`FULL_PRODUCTION_END_TO_END_ACCEPTED = NO` only because those two identity-dependent gates remain.

## Governing rules

`PROVEN + UNCHANGED = REUSE`

If existing functionality fails, repair the existing canonical path only. Do not restart completed domains, restore superseded controllers, create parallel authority, or rerun broad acceptance without change-driven evidence.

When a bounded task materially changes durable truth, reconcile authority before reporting completion: update `NEXI_CURRENT_STATE.md` for current truth, and update `NEXI_PRODUCTION_COMPLETION_LEDGER.md` only when durable completion evidence changed. Do not memorialize transient commands/processes.

On Worker 0, Public/Admin source work must reuse their dedicated `/srv/nexi/public` and `/srv/nexi/admin` dependency/runtime seams. Do not create session-local frontend/admin dependency trees.

## Completion controller

The only final completion controller is `NEXI_PRODUCTION_COMPLETION_LEDGER.md`.
Historical 27-row matrices, `CODE_TO_CODE_CLOSED`, A25/A26/A27, staging-first sequencing, recovery handovers, old SHAs, old worktrees and old VM/Codespace status files are not current authority.
