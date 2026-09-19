# NEXI Final Session Handover — 2026-09-19

## Authority and start rule
Read `/home/mellonelay1999/RDC_ONBOARDING.md` first, then repository `AGENTS.md`, then `NEXI_WORKER0_CAPABILITY_INDEX.md` only as needed.

Authority remains: current owner decision > current runtime/tests > current source > direct platform state > deterministic graph/static/telemetry > inference > historical handovers. GitHub `main` is durable source authority. Cloudflare Worker + Container is backend runtime authority. Worker 0 is an operator/tooling plane only.

`PROVEN + UNCHANGED = REUSE`. Do not restart completed work.

## Current durable frontier
At handover preparation, `origin/main` was `7dc728504f4826ef3458ac26e7af6e046f7c449d`. The durable state file records deployed production Worker release `b5325e751415dfdb4cc5bc8d120fe43638643531`, Container application version 63, one running `nexi-api` instance, and healthy production readiness.

Remaining owner-context gates are narrow:
1. authenticated Wallet/SIWE/balance + protected financial interaction;
2. privileged Admin RBAC/action.

Do not reopen broad backend, market, Public/Admin, Kline, reconnect/resnapshot, REST recovery, dependency-ownership, or Cloudflare convergence work without contradictory current evidence.

## Completed backend / market / Cloudflare work
Already on GitHub main; do not repeat:
- `d236a90` — Binance silent ticker recovery/watchdog.
- `58c272b` — provider startup after D1 policy reconciliation.
- `af8604f` / merge `e686d47` — NestJS 12 migration.
- `7934f29` — Sentry release alignment.
- `686fa57` — Cloudflare inactive-container cold-start/fetch delegation repair.
- `87546e1` — D1 quote sequence drift repair for the 13-symbol snapshot/latest collision.
- `6c4fcd4` — unused Cloudflare runtime variables removed.
- `7be22cf` — market archive Pipeline/R2 path retired and NestJS Observe wiring added.
- `f76db5c` — inactive Container fetch recovery.
- `3b859cb`, `47516d3` — durable state reconciliation.
- `b5325e7` — USD/RUB MOEX-first source policy.
- `7dc7285` — durable state/ledger records archive retirement and live baseline.

Canonical market path:
`provider adapters -> NestJS MarketIngest/authority -> D1 quote/Kline persistence -> Aiven Valkey -> Socket.IO -> Public/Admin`.

Depth/trade reference events remain realtime events; they no longer require market archive persistence.

## Market archive retirement — completed, do not recreate
Owner decision: market R2/Data Catalog/Pipelines archive was unnecessary complexity and is retired.

Verified:
- `nexi-market-archive-staging` was emptied and deleted.
- Durable state records 21,711 archive objects deleted before bucket deletion.
- Current `wrangler pipelines list` returns no pipelines.
- NEXI product R2 retained: `nexi-deposit-proofs-staging` / `DEPOSIT_PROOFS`.
- Other account-level `mellonelay-*` R2 buckets are not NEXI market archive resources and were not deleted.
- Active Worker secrets contain JWT, Redis, Sentry and Observe credentials; retired market archive token is absent.
- Active Worker bindings no longer include market archive R2 or Pipeline bindings.

Do not restore `MarketArchiveService`, `MarketReferencePersistenceService`, `MARKET_ARCHIVE`, `MARKET_ARCHIVE_STREAM`, `MARKET_STRUCTURED_STREAM`, archive Pipeline URLs/tokens, or `nexi.r2` / `nexi.pipeline` Worker bridges unless the owner explicitly reverses this decision.

## NestJS Observe — application wiring complete
Verified during the Observe pass:
- Nest CLI 12.0.3.
- `@nestjs/core` 12.0.3.
- `@nestjs/observe` 0.1.10.
- `backend/src/observe.ts` owns `createObserveModule()`.
- `AppModule` uses `ObserveModule.forRoot(... serviceId: "nexi")`.
- `main.ts` passes `ObserveInstrument` into `NestFactory.create`.
- Worker Container env forwarding includes `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET`.
- Both Observe application credentials exist as Cloudflare Worker secrets.
- Focused market tests passed 13/13 after Observe/archive cleanup.
- Nest build passed.

The Observe application credentials are already configured. Do not ask the owner to recreate them.

The separate `nest-observe` RDC MCP route exists. MCP URL/token are a separate credential class from SDK app credentials; discover current callability before claiming the MCP is authenticated.

## Worker-0 capability system — completed
Do not reinstall this system merely because a later session cannot remember it.

Control model:
`ChatGPT parent -> parallel RDC start_process lanes -> independent reads/evidence -> isolated worktrees for disjoint writes -> parent fan-in -> Riqor completion gate`.

Fast kernel:
`RECOVER LIVE STATE -> CLASSIFY TASK -> LOCATE EXACT OWNER -> PARALLEL READ/EVIDENCE -> FAN-IN -> SERIALIZE SHARED MUTATION -> FOCUSED VERIFY -> RUNTIME/RENDER VERIFY -> TARGETED BLAST RADIUS -> RIQOR COMPLETION GATE -> REPORT`.

Global docs under `~/.agents/`:
- `WORKER0_KERNEL.md`
- `WORKER0_PARALLEL_LANES.md`
- `GLOBAL_CAPABILITY_INDEX.md`
- `GLOBAL_SKILL_ROUTER.md`
- `GLOBAL_HOOK_CONTRACT.md`
- `GLOBAL_MCP_CATALOG.md`
- `GLOBAL_CLI_CATALOG.md`

Graph escalation:
`L0 LOCATE -> L1 IMPACT -> L2 MULTI-VIEW -> L3 OMNIPOTENT`.

Global `graphify-multiview` exists at `~/.agents/skills/graphify-multiview` and is linked into Codex/Kilo. It supports Base, Focus, optional Native/Observation views, provenance-aware evidence and deterministic Omnipotent NetworkX analysis.

Dedicated advanced graph Python environment: `~/.local/share/worker0-graph/.venv`.
Verified modules: NetworkX 3.6.1, NumPy 2.4.6, SciPy 1.17.1, pandas 3.0.6, matplotlib 3.11.2, neo4j 6.3.1, pydot 4.0.1, PyGraphviz 2.0.2, lxml 6.1.3. System Graphviz/libgraphviz-dev are installed. Graphify remains isolated in its uv tool environment and has `graspologic_native`.

Riqor `doctor --json`: `ok: true`, package 0.2.6, runtime payload verified, Codex CLI available, 0 critical security findings. Only reported external issue: low Worker-0 disk space.

Get-Fable 1.9.1 is installed. Its 30-node lifecycle graph is present. `get-fable status` reports Codex and Kilo integrations installed; project-local Fable state is inactive, which is not an installation failure. Git hooks exist in NEXI and compose lifecycle/freshness behavior.

Do not run `agent-kernel sync` casually: it previously regenerated disabled Claude/Gemini host adapters. Those adapters were intentionally removed.

## Capability-system Git fan-in
Already on GitHub main:
- `deb947faf6b9c294b91b5f5bdeecd70190486feb` — globalize Worker-0 capability routing.

That commit removed obsolete repo-local router/Claude/devcontainer adapter material and updated NEXI capability/router/Graphify documentation. Host-level assets under `~/.agents`, `~/.codex`, `~/.kilo`, and `~/.local/share/worker0-graph` stay host-level; do not duplicate them into NEXI.

This final fan-in also preserves NestJS-specific routing refinements in `NEXI_WORKER0_CAPABILITY_INDEX.md` and `NEXI_WORKER0_CLI_CATALOG.md`.

## Evidence / telemetry used
This handover was reconciled from current Git/GitHub state, current Cloudflare Wrangler reads, Worker-0 runtime/capability state, Riqor doctor/status, Get-Fable status/graph, installed skill/runtime paths, Git reflog/commit history, current authority documents, and active-session execution receipts.

Important limitation: current NEXI has no `.riqor/EVIDENCE.md` ledger. No project Riqor evidence ledger was invented. Riqor doctor proves harness health, not product runtime acceptance.

The main VM working tree contains unrelated active product/source changes and was deliberately not reset, cleaned, committed, or overwritten.

## Final cleanup completed
Owner explicitly requested full archive/old-data cleanup after the source fan-in.

Completed:
- all completed NEXI temporary Git worktrees used by the NestJS 12, Cloudflare cleanup, market archive cleanup, final verification and handover lanes were removed;
- their completed local branches were removed after the commits were safely on GitHub main;
- all remaining `/tmp/nexi-*` scratch/build/log/recovery artifacts were deleted, including the large temporary dependency and stale-recovery trees;
- obsolete Public immutable releases were removed while preserving the exact `/srv/nexi/public/current` target `3b173ea-prod`;
- obsolete Admin immutable releases were removed while preserving the exact `/srv/nexi/admin/current` target `3b173ea-prod-node`;
- root filesystem headroom improved to about 6.0 GiB free / 85% used after final cleanup;
- the main NEXI VM working tree was NOT reset because it still contains unrelated unique product/source work from another active session.

Cloudflare market archive data is already gone. Do not perform another destructive Cloudflare archive pass. Do not delete the current Public/Admin release targets as cleanup.

## Next-session start packet
1. Recover live Git/Cloudflare state; newer evidence outranks this handover.
2. Read `RDC_ONBOARDING.md`, repo `AGENTS.md`, then only the narrow capability reference needed.
3. Fetch GitHub main and use it as durable source authority.
4. Cloudflare Worker + Container is backend runtime authority; never use a VM-local NestJS process as acceptance proof.
5. Reuse completed NestJS 12, D1 sequence, market archive retirement, Observe wiring, capability routing, and Cloudflare convergence.
6. Do not recreate market archive Pipelines/R2/Data Catalog.
7. Do not reinstall Graphify multi-view, Graphviz/PyGraphviz, Riqor, Get-Fable, NestJS skills, Cloudflare skills, or Worker-0 routing unless current verification proves missing/broken.
8. Continue from current owner objective. At this handover, the durable ledger says the remaining full-production acceptance gates are authenticated Wallet/SIWE/protected financial interaction and privileged Admin RBAC/action.
