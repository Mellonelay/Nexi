# NEXI Work Authoritative Operating Contract

## Authority
GitHub `main` is the durable NEXI source authority. Cloudflare Worker + Container is the only active backend execution/runtime authority. Worker 0 is an operator/recovery/tooling plane; after the 2026-09-17 convergence it must never be used as a parallel backend runtime authority.

- ChatGPT remains the parent/controller.
- Backend runtime inspection, debugging, verification, and authorized backend operation target the live Cloudflare backend (`api.nexitrading.app`) and its Worker/Container/D1/platform resources.
- Cloudflare resource identifiers that still contain `staging` are historical names, not environment authority. The current production backend is identified by the active `api.nexitrading.app` route, live deployment/runtime evidence, and `NODE_ENV=production`; do not redirect work to a separate staging workflow merely because a resource name contains `staging`.
- Worker 0 may run Git, Wrangler, Cloudflare MCP, Graphify/static tools, frontend/Admin hosting, and the officially supported Wrangler Container SSH path; a local NestJS/VM backend is not acceptance or runtime truth.
- Any legitimate backend source edit performed through the Cloudflare execution plane must be reconciled to GitHub `main` immediately when the bounded task finishes.
- Historical Windows trees, Codespaces, old VM workspaces, branches, stashes, and receipts are reference/evidence only unless fresh verification proves they contain unique accepted work.

Current owner/product decisions and the live Cloudflare runtime outrank stale receipts or chat summaries about backend state. Source implementation truth remains GitHub `main`; runtime truth must be proved on Cloudflare.

## Canonical architecture
Public Frontend / Admin -> Cloudflare Worker -> canonical Cloudflare Container -> NestJS.
NestJS owns business/domain decisions.
D1 owns durable application + financial relational truth.
Aiven Valkey owns cache, Streams, Socket.IO, and ephemeral coordination.
R2 is retained only for active domain objects such as deposit proofs. The market R2/Data Catalog/Pipelines archive path was retired by owner decision on 2026-09-19.
Queue/Workflow/Worker/Container orchestrate; they never own financial truth.

Do not restore any retired database authority. Do not introduce a second Admin plane, second financial authority, direct frontend D1 access, Worker financial logic, or custom VM lifecycle engine.
## Capability routing
Worker-0 global execution law is `/home/mellonelay1999/RDC_ONBOARDING.md` with global capability/router/hook catalogs under `/home/mellonelay1999/.agents/`. The ChatGPT Work parent owns NEXI Work Control Plane reasoning, Agent Skills method selection, Selective Intelligence, Ponytail/Karpathy discipline, phase routing and fan-in. Worker-0 executes/evidences through Fabric/RDC and its local tools. Get-Fable and Riqor runtimes were removed by owner decision on 2026-09-30 and must not be routed to or reinstalled. The Graphify multiview + Fallow + CodeScene + DeepWiki combination remains the structural/static/semantic intelligence stack. NEXI files below are project overlays, not duplicate global authorities.

Classify the complete owner request before choosing skills or tools. Use `docs/operations/NEXI_CAPABILITY_ROUTING.md` as the project routing owner, `/home/mellonelay1999/RDC_ONBOARDING.md` for Worker-0 mechanics, and `/home/mellonelay1999/.agents/GLOBAL_CAPABILITY_INDEX.md` as the lightweight capability directory. Read only the specialist reference needed for the task.

Before the first execution call of each new substantive NEXI task, emit the compact `ROUTING` declaration required by the project router, then execute immediately. That startup route is not a permanent lease: when the engineering phase, failure mode, causal owner, or proof target changes, the ChatGPT Work parent must re-enter NEXI Work Control Plane + `using-agent-skills`, select the method for the CURRENT phase, and continue. Reuse unchanged skill/tool/onboarding contracts from the session cache instead of rereading them mechanically.

Before execution, compile the entire owner message into one bounded contract: required actions, evidence, sequencing, preserved state, explicit non-goals, mutation/production authority, completion conditions, and required durable-state updates. A later requirement in the same owner message is not optional; every required item must finish as `PROVEN_COMPLETE` or `BLOCKED_WITH_EVIDENCE`.

Dynamic model: `OWNER MESSAGE -> COMPLETE TASK CONTRACT -> CURRENT AUTHORITY -> CORRECTION/DRIFT WHEN NEEDED -> TASK CLASS -> ONE PRIMARY RESPONSIBILITY OWNER -> 0..N NON-OVERLAPPING SPECIALISTS -> FASTEST PRECISE TOOL/MCP/CLI -> EXECUTE -> FOCUSED VERIFY -> PARENT FAN-IN -> DURABLE STATE RECONCILIATION WHEN REQUIRED -> REPORT`.

`@skill`/plugin mentions are capability hints, not a mandatory pre-execution reading queue. A mentioned capability may be PRIMARY, SUPPORTING, or AVAILABLE-BUT-NOT-NEEDED. Load or rediscover a skill only when its operating contract can materially change execution or verification; reuse already-proven routing while unchanged.

No historical controller skill has universal primacy. Use a task-specific skill only when its trigger matches current owner intent. Historical Astra binding/controller artifacts are lineage, not active routing authority. Tool availability never expands mutation or production authority.

## Bounded authority maintenance
Durable-state reconciliation is part of completion, but it is proportional rather than mechanical.
- Update `NEXI_CURRENT_STATE.md` when a bounded task materially changes current durable NEXI truth: source frontier, deployed baseline, active phase, canonical ownership/routing, or immediate unresolved gates.
- Update `NEXI_PRODUCTION_COMPLETION_LEDGER.md` only when the task establishes, changes, revokes, or supersedes durable completion evidence.
- Harmless commands, transient process/session state, one-off timestamps, exploratory notes, and ephemeral diagnostics do not belong in permanent authority.

When reconciliation is required, do it before the completion receipt rather than deferring it to a cleanup session. The bounded loop is:
`IMPLEMENT/REPAIR -> FOCUSED VERIFY -> PROPORTIONAL CURRENT-STATE/LEDGER RECONCILIATION -> CONSISTENCY CHECK -> REPORT`.
If source authority advances without deployment, record the new GitHub source SHA separately from the still-deployed production baseline. Never imply that undeployed source is production-proven.

## Worker-0 Public/Admin hosting and dependency ownership
On Worker 0, always use the dedicated hosting/runtime seams instead of creating session-local frontend/admin dependency trees:
- Public source: `/home/mellonelay1999/workspaces/Nexi/cloudflare-container-bootstrap/dexi-frontend`
- Public canonical dependencies: `/srv/nexi/public/shared/node_modules`
- Public runtime: `/srv/nexi/public/current` -> immutable release under `/srv/nexi/public/releases/`
- Admin source: `/home/mellonelay1999/workspaces/Nexi/apps/admin`
- Admin canonical dependencies: `/srv/nexi/admin/shared/node_modules`
- Admin runtime: `/srv/nexi/admin/current` -> immutable release under `/srv/nexi/admin/releases/`

Both source `node_modules` paths must be symlinks to their dedicated `/srv/nexi/.../shared/node_modules` owners. Do not run `npm ci` directly inside either source tree on Worker 0 because npm may replace the symlink with a new local tree. If dependency reconstruction is required, stage the current source `package.json` + `package-lock.json` into the corresponding `/srv/nexi/<surface>/shared` install context, rebuild there, then restore/verify the source symlink. Package manifests/lockfiles remain source authority; `node_modules`, `.next`, `.output`, and traced release runtime dependencies are generated state.

Historical immutable releases are rollback/deployment artifacts, not dependency duplicates. Do not delete them as part of dependency cleanup without an explicit retention decision.

## Fast execution routing
Use direct source when the affected file/symbol is already known.
Use Graphify for topology, ownership, dependency paths, and blast radius.
Use Codebase Memory or bounded `rg`/`fd` for exact symbols/callers/snippets.
Use Forensic Graphify only for unclear structural failures, drift, hidden paths, or competing hypotheses.
Use current official docs/Context7 only when external framework/provider semantics are uncertain.
Use Cloudflare docs + project-local Wrangler for Cloudflare-sensitive work.
Use API contract tools only against real controller/DTO/OpenAPI artifacts, not progress summaries.

Default loop:
`LOCATE IF NEEDED -> READ EXACT SOURCE -> IMPLEMENT -> FOCUSED VERIFY -> REPAIR ONCE -> CONTINUE`.

Do not pause between dependency-ready tasks merely to report progress.
Do not run every skill/tool mechanically.

## Worker-0 capability knowledge
Do not duplicate the Worker-0 tool inventory here. Route through `/home/mellonelay1999/.agents/GLOBAL_CAPABILITY_INDEX.md`; use `/home/mellonelay1999/.agents/GLOBAL_MCP_CATALOG.md`, `/home/mellonelay1999/.agents/GLOBAL_CLI_CATALOG.md`, `/home/mellonelay1999/.agents/BROWSER_FABRIC.md`, and the Graphify/DeepWiki complete guides only when that capability is relevant. Discover mutable versions/auth/schema/health live.

## D1 operator policy
All D1 operator inspection/migration/verification must use project-local Wrangler from `cloudflare-container-bootstrap`.
Preferred form: `npx --no-install wrangler ...`.
Current canonical Wrangler is `4.127.1`; verify version before consequential operator work.
Do not use dashboard SQL, direct REST, sqlite3, or another DB client as D1 operator authority.
Runtime application access remains through the official D1 Workers binding/private bridge.
Use migrations for schema changes. Use bounded remote Wrangler queries/PRAGMAs for inspection.

## Graphify policy
Installed VM Graphify CLI is command authority; use `graphify --help` before assuming syntax.
Graphify is navigation evidence, never behavioral proof.

Freshness:
- `graphify check-update .` reports pending semantic-update state only.
- If graph-dependent reasoning follows meaningful source edits newer than `graphify-out/graph.json`, refresh with `graphify update . --no-cluster` first.
- Use full `graphify update .` / reclustering only after coherent architecture batches where communities matter.

Fast analysis:
- `affected` -> blast radius.
- `path` -> concrete relationship chain.
- `explain` -> node + neighbor context.
- bounded `query` -> unresolved broad relationship question.
- `god-nodes` -> shared/high-risk hub review only.
- `diagnose multigraph` -> suspicious graph ambiguity.

After high-impact changes, refresh once and rerun only the relevant impact/path checks, then verify source/tests/runtime.
## Cloudflare policy
Before any Cloudflare implementation, configuration change, deployment, configuration-driven debugging, or operator mutation, read the relevant **current official Cloudflare documentation first**. Then inspect the current Wrangler/MCP help or schema for the exact product/command and reconcile it with current NEXI configuration. This gate applies repository-wide to Workers, Wrangler, Containers, D1, Queues, Workflows, R2, Pipelines, Durable Objects, bindings, secrets, routes/domains, versions/deployments/rollback, observability/logging, networking, and later Cloudflare products.

Use `docs/infrastructure/NEXI_CLOUDFLARE_BACKEND_OPERATOR_RUNBOOK.md` as the current NEXI Cloudflare operator reference. For backend runtime work, Cloudflare is the only execution authority. Prefer read-only platform inspection first; use the officially documented Wrangler Container SSH mechanism when shell access is required. Do not use a VM-local backend as a substitute. If a legitimate source repair is made through the Cloudflare execution plane, verify it there and reconcile the exact source change to GitHub `main` before task completion.

Do not blindly retry a failing Wrangler command: read the real error, consult current official docs/help, identify the causal owner, then retry only when justified. Capability discovery never grants unrelated mutation authority. Unrelated production mutation still requires explicit current owner approval.

## Financial and event invariants
Consequential financial commands must preserve authorization, validation, idempotency, atomic domain + ledger semantics, audit/activity linkage, EventOutbox publication, and safe retry/recovery.
Queues and Workflows coordinate downstream work; they do not re-own or blindly replay originating financial commands.
Do not fabricate balances, prices, settlement, runtime success, or acceptance data.

## Simultaneous-work discipline
Re-read files before consequential edits.
Avoid broad formatting or unrelated rewrites.
Format only files changed in the current batch.
Do not overwrite parallel work or another active lane; GitHub `main` remains the durable source frontier and any parallel lane must be reconciled before fan-in.

## Verification and reporting
Keep `IMPLEMENTED`, `STATICALLY_VALIDATED`, `TESTED`, `INTEGRATED`, and `RUNTIME_VERIFIED` distinct.
A passing focused compile does not prove runtime. A graph path does not prove behavior. A Cloudflare resource existing does not prove integration.
Before a completion claim, verify the exact changed boundary with fresh evidence appropriate to that layer.
Report compactly: outcome, decisive evidence, changed files/resources, remaining unverified surfaces, production-changed status, next dependency-ready action.
## Historical artifact policy
Windows `work/` receipts and VM backup artifacts are evidence/history only, not current execution authority. Consult them only when the current baton, fresh source/runtime evidence, or the owner explicitly requires them. Never let an old receipt or prompt override current GitHub source or Cloudflare runtime evidence.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Production closure controller — hard rule

On a fresh NEXI Work session, after continuity loss, or when the relevant durable frontier may have changed, read the live VM `NEXI_CURRENT_STATE.md` and relevant `NEXI_PRODUCTION_COMPLETION_LEDGER.md` rows and cache their identity/freshness. Reuse that proof while unchanged; do not reread the full files before every bounded action. ChatGPT Project uploads, chat exports, handovers, and historical receipts are provenance only when they conflict with current VM/GitHub/Cloudflare evidence.

The active queue is Section 0 of `NEXI_PRODUCTION_COMPLETION_LEDGER.md`. Select an open row, preserve every `PROVEN + UNCHANGED` dependency, execute the smallest dependency-closed repair/proof, then update the row before moving to unrelated work. A session may not claim completion while its selected row lacks current proof or while durable truth changed without reconciling `NEXI_CURRENT_STATE.md` and the ledger.

Owner manual testing is a final acceptance gate, never a substitute for automatable verification. Use controlled test wallet/Admin identities when safe; otherwise record an explicit owner deferral. Cloudflare Worker + Container remains the only backend runtime authority, and Public/Admin Worker-0 builds/runtimes remain restricted to their canonical `/srv/nexi/public` and `/srv/nexi/admin` seams.

For market work, do not optimize for a cosmetic `LIVE` count. Open-market assets must remain fresh or self-recover automatically; legitimate closed-market states must carry a truthful reason; silent frozen prices, fabricated freshness, and manual recovery as normal operation are defects.

## Durable phase checkpoint — 2026-10-02

For NEXI engineering work, use the existing `worker0-skill-checkpoint` at each real phase boundary and before completion. Its project-owned gate requires the preceding phase's saved proof plus explicit reconciliation of `NEXI_CURRENT_STATE.md` and `NEXI_PRODUCTION_COMPLETION_LEDGER.md`. Follow `docs/operations/NEXI_PHASE_RECONCILIATION.md`; recover `workCycle` from the current capsule before acting. The routing helper is advisory: using-agent-skills and the parent choose the actual causal method; a keyword-selected unrelated skill is not invocation proof. Preserve completed product evidence and separate local/GitHub source from deployed source. Do not bypass a blocked checkpoint or create a second completion ledger.
