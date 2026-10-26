# CURRENT OWNER OVERRIDE — 2026-10-25 CANONICAL NODE 24 AND SINGLE-BUILD RULE

One canonical Git checkout only: `/home/mellonelay1999/workspaces/Nexi`. Exactly one physical dependency store per application, `/srv/nexi/backend/shared/node_modules`, `/srv/nexi/public/shared/node_modules`, and `/srv/nexi/admin/shared/node_modules`, with source symlinks. Exactly one output path per application: `/srv/nexi/backend/dist`, `/srv/nexi/public/current/.next`, and `/srv/nexi/admin/current`. No isolated/worktree/clone builds or tests, no workspace `dist`/`.next`/`.output`, no automatic `npm ci`, `npm install`, pnpm install, dev build, Node reinstall, or duplicate build cache. Use framework-local verification and existing installed package scripts from canonical paths; run only change-invalidated focused tests. All three systemd services now use `/opt/nexi/runtime/node-v24.21.0/bin/node`; Public uses the pinned npm launcher and PATH so its child resolves the same Node, while Admin retains `/srv/nexi/admin/current/server/index.mjs`. On 2026-10-25 after the authorized maintenance restart, all three processes were observed using that executable; API `/readyz` returned READY with SQLite and Redis true, Public `www.nexitrading.app/dashboard` and Admin `/overview` returned HTTP 200. The source checkout SHA and existing deployed artifact SHA remain distinct; see `tasks/evidence/nexi-final-vm-consolidation-20261025.md`. Before editing source, derive expected framework/architecture/financial behavior, trace Backend–Public–Admin contracts, compare expected versus current source, and only then apply a minimal correction. Graphify, CodeQL and tests are supporting evidence, not substitutes for semantic correctness. Reuse accepted receipts and four owner-accepted-untested financial gates. Refer to current `tasks/plan.md`, `tasks/todo.md` and proof reuse register; superseded old checklist rows and Cloudflare/Polypane routes are historical.

# CURRENT PAIRED CODEX CLI OWNER ROUTE — 2026-10-23

For NEXI work from the paired Worker-0 Codex CLI, this Codex session is the single lifecycle parent and operates in the verified local shell. Do not route through ChatGPT Work, RDC, or SSH-to-self. Use NEXI Work Kernel for lifecycle, Agent Skills for phase methods, and Capability Router for discovery. Codex Tasks/Coordinator may provide separate task windows only when a same-checkout Worker-0 environment and exact task identity are verified; no subagents by default, no overlapping writers, and one owner for Git, production, services, financial/database state, and shared generated outputs. Browser acceptance uses the owner's existing Chrome profile through Chrome DevTools MCP configured with `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance`; 5858 was a stale MCP target and Polypane/5859 is retired for this workflow. The MCP reads the profile's `DevToolsActivePort` file; Chrome's `chrome://inspect/#devices` target-discovery entries are not MCP configuration. The promoted VPS SQLite/NestJS/Ledger/Outbox architecture remains current; Cloudflare app runtime and historical ledgers are retired.

For tool execution, preserve the native handle type (`functions.exec` cell ID, shell session ID, MCP task ID, or Codex task/thread ID) and inspect the original result before retrying. Await independent reads; serialize dependent and shared mutations. Discover the live tool schema/version before calls that depend on it. Hook registration is not proof of execution or interception; claim enforcement only after observing the effective hook run and its result. Apply owner, platform, tool, and domain authorization separately.

## CodeScene MCP quality checks

When CodeScene MCP is enabled and authenticated, run `pre_commit_code_health_safeguard` on the changed or staged files before creating or recommending a commit. Before opening or updating a pull request, run `analyze_change_set` against the exact base ref. If either reports regression, inspect affected files with `code_health_review`; fix in-scope issues or report the unresolved findings. For an explicitly requested maintainability refactor, use `code_health_review` before and after significant steps. Keep checks scoped to relevant changes, do not impose a fixed 10.0 target or other arbitrary score gate, and treat Code Health as maintainability evidence rather than proof of correctness, security, tests, or runtime behavior. If MCP authentication or connectivity prevents a check, report it as not run.

Older dated Work/RDC/Polypane routing clauses below are historical and superseded where they conflict with this override.


## CANONICAL WORKER-0 BUILD AND RELEASE CONTRACT — 2026-10-23

Use the single checkout `/home/mellonelay1999/workspaces/Nexi` on `main`; release only a reviewed, committed source SHA. Do not create worktrees, cloned/staging checkouts, candidate roots, duplicate build outputs, or additional release directories. Build/deploy one surface at a time in compatible order Backend → Public → Admin, after each source and focused checks are ready; confirm Backend remains compatible with clients before advancing. Source SHA, built artifact identity, and running service identity are separate facts and must be recorded and verified independently.

The three dependency stores are physically separate and belong to exactly one app each: Backend `/srv/nexi/backend/shared/node_modules`, Public `/srv/nexi/public/shared/node_modules`, and Admin `/srv/nexi/admin/shared/node_modules`. Never merge them, deduplicate them across apps, or use one app's lockfile to populate another app's store. `frontend/node_modules` and `Admin/node_modules` are source symlinks to their respective stores. `/srv/nexi/backend/node_modules` is the Backend runtime symlink to its store; the canonical checkout's `backend/node_modules` is now a symlink to the same Backend shared store after the owner-authorized 2026-10-25 consolidation. Preserve it; never reinstall into or replace the source link. Public runtime `/srv/nexi/public/current/node_modules` links to Public's store. Admin's built Nitro runtime does not need a `node_modules` link inside `current`.

| Surface | Dependency authority and toolchain | Build working directory and exact command | Only output/runtime path | Service |
| --- | --- | --- | --- | --- |
| Backend | `backend/package.json` + `backend/package-lock.json`; Node 24.21.0 and npm 11.19.0 | `/srv/nexi/backend`; `PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH NODE_OPTIONS=--max-old-space-size=4096 npm run build` | `/srv/nexi/backend/dist` (`dist/src/main.js`) | `nexi-api.service` |
| Public | `frontend/package.json` + `frontend/package-lock.json`; Node must meet `engines.node` (`>=20.9.0`); use the runtime's installed Node/npm | `/srv/nexi/public/current`; `./node_modules/.bin/next build --webpack && node scripts/prepare-standalone-assets.mjs` | `/srv/nexi/public/current/.next` | `nexi-public.service` |
| Admin | `Admin/package.json` + `Admin/pnpm-lock.yaml` only; run `corepack pnpm@12.14.0` (do not use an unpinned global pnpm) | canonical checkout `Admin/`; `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current corepack pnpm@12.14.0 --config.verify-deps-before-run=false run build` | `/srv/nexi/admin/current` (real directory; Nitro server at `server/index.mjs`, assets at `public/`) | `nexi-admin.service` |

Do not reinstall dependencies for a normal build. Before running, verify the relevant manifest/lockfile pair, runtime tool versions, expected `node_modules` symlink targets, and required locked build-time packages. If the dependency set changed or the dedicated store is incomplete, rebuild only that app's store from its current committed manifest and lockfile in its dedicated shared install context; never install from Public/Admin source checkouts or mutate a live shared store. Before replacing a store, verify its recovery copy and stop only its owning service. For Backend, preserve its Node 24/npm 11.19.0 and `--legacy-peer-deps` install requirement. For Public, use `npm ci --no-audit --no-fund` with the staged Public manifest and lockfile. For Admin, stage `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and the lockfile-referenced `patches/` in the dedicated Admin shared install context and use the pinned pnpm with `install --frozen-lockfile`; do not let pnpm replace the source `Admin/node_modules` symlink. Verify store restoration and source/runtime links after any reconstruction. These are recovery actions, not routine build steps.

For a production replacement, first verify current live release/artifact identity, surface-specific tested rollback, available capacity, and current owner authorization. Preserve the required rollback artifact before overwriting the canonical output. Stop only the target service, synchronize only its committed source when that surface's runbook requires synchronization (Backend and Public runtime trees are source/build working trees; Admin builds from the checkout into its output directory), preserve all dependency links, durable data, logs, and rollback files, and run exactly one final build at the canonical path above. Set the release marker/Sentry release to the exact built SHA using the surface's existing secret configuration; never print credentials. Restart only that surface, then verify process stability, exact artifact/source identity, service health, HTTPS/API/auth boundaries and release-scoped observability before proceeding to another surface. Restore the verified surface rollback if its defined health checks fail. SQLite migrations and financial writes are separate guarded operations and are never implied by a build or deployment authorization.

## CURRENT VPS BUILD AND SHARED DEPENDENCY PATHS — 2026-10-20

Current source: /home/mellonelay1999/workspaces/Nexi (single main checkout). Source paths are frontend/ (Public Next.js), Admin/ (Admin React/TanStack/Nitro), backend/ (NestJS/Prisma 7). Live deployed bytes and source SHA must be verified independently.

Public: /srv/nexi/public/current is the single real production build and runtime directory; /srv/nexi/public/current/.next is generated output. Its current/node_modules is a symlink to /srv/nexi/public/shared/node_modules. nexi-public.service runs npm start from /srv/nexi/public/current. The cache subdirectory .next/cache can be regenerated and was selectively cleared; never delete other .next assets during cleanup.

Admin: /srv/nexi/admin/current is the single real Nitro output/runtime tree (not a symlink), with server/index.mjs and public/ assets. Its independent install/store is /srv/nexi/admin/shared/node_modules. The Admin standalone runtime does not need a node_modules symlink inside current; do not add one without demonstrated need. nexi-admin.service runs node /srv/nexi/admin/current/server/index.mjs. Preserve existing no extra build/release directories policy.

Backend: /srv/nexi/backend is the live service working directory, with built code at /srv/nexi/backend/dist/src/main.js. Its node_modules is now a symlink to /srv/nexi/backend/shared/node_modules (moved, not duplicated). nexi-api.service runs the installed Node 24.21.0 entry. Module resolution for NestJS, Prisma and better-sqlite3, native SQLite smoke, and API readyz returned successful evidence after this relocation.

Sharing boundary: These are THREE separate app-specific physical node_modules stores in stable shared/ locations, NOT a single cross-application node_modules directory or content-addressable dedup store. Backend relocation by itself saves no physical bytes. Do not blindly merge incompatible Next/Nitro/NestJS versions, Prisma native dependencies or lockfiles. Any cross-project dedup or package-manager change needs its own scoped dependency/ABI/rollback verification.

Storage: Root filesystem measured about 6.1 GiB available (88% used) after bounded cache cleanup on 2026-10-20; remeasure before assuming freshness. Preserve all live SQLite database/WAL/SHM files, financial data, backups, evidence, the existing authorized Chrome browser session, and runtime artifacts. Never blanket-clear /tmp or delete running-session files. Existing Public .next/cache was cleared; caches may regenerate. Prior npm cache had already been cleared by another operation. Permission-denied temp entries were not forcibly removed. Build, install, restart, push or deployment remain separately authorized actions.

This current owner-verified map supersedes older conflicting path or sharing claims below. For protected docs use worker0-protect unlock, bounded change, diff verification, refresh-lock, and status.

---
# HISTORICAL WORK/CODEX/HOOKS ROUTE — superseded for paired Codex CLI 2026-10-23

These are the rules for EVERY agent operating in the NEXI repository. They are separate from user-global Codex instructions in ~/.codex/AGENTS.md and the project-specific Codex overlay in .codex/AGENTS.md. Newer owner decisions supersede contradictory dated clauses below.

**Parent/controller:** ChatGPT Work -> NEXI Work Control Plane -> Work Kernel -> Capability Router -> Addy Agent Skills using-agent-skills -> selected specialist and actual execution. Work maintains phase/session capability caching, task/owner decisions, verification and serialized fan-in. Direct Remote SSH is the preferred authorized Worker-0 transport when the active Work session actually exposes it; the native Linux shell/CLI/mcpc performs assigned work, never becomes a second lifecycle controller. RDC is recovery/bounded fallback, no duplicate writes.

**Continuity:** use tasks/todo.md AND tasks/plan.md for the active frontier, NEXI_CURRENT_STATE.md and NEXI_PROOF_REUSE_REGISTER.md for state/proof. Inspect HEAD, deployment identity, dirty files and active handles before changes. Historical unchecked task rows are not authorization to redo owner-accepted backend work. No new worktrees or financial/SQLite/deploy writer.

**Skills and hooks:** use installed protected 25-workflow Agent Skills vendor source via using-agent-skills, phase-fit methods, Ponytail/Karpathy minimal code discipline; Graphify Agent Workflows only for topology/impact, Fallow for TS/JS risk. The actual hook config lives in user ~/.codex/hooks.json (Addy SessionStart) and repository .codex/hooks.json (Graphify PreToolUse/Bash; Worker-0 harness UserPromptSubmit). Desktop UI shows plugin-managed Ponytail and Capability Orchestrator hooks; inspect current enablement/effects, never duplicate/reset them. Hook enabled != skill invoked/test passed.

**Historical browser routing (retired 2026-10-25):** Public was routed through Polypane/CDP 5859 and Admin through ChatGPT Work Cloud Browser. This is archival context only. The active paired Worker-0 Codex route is Chrome DevTools MCP with `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance`; follow `.codex/AGENTS.md` for current session recovery and authentication steps.

**Global documentation:** for approved protected edits run worker0-protect unlock, verify diff and status, then worker0-protect refresh-lock and recheck locks. Do NOT run Agent Kernel proposal/compile/sync/publish to maintain these rules; retired generated instructions must not overwrite this owner decision.

---
# CURRENT OWNER OVERRIDE — 2026-10-17 (supersedes contradictory older sections)

**Authority precedence:** CURRENT OWNER DECISION WINS over all repository/agent/hook/skill rules, subject to platform permissions and protection of actual durable state. Newer direct runtime/test evidence outranks historical notes. Hooks and scripts cannot silently veto explicit owner decisions.

- **Execution:** The owner activated ChatGPT Desktop/Codex Remote SSH against the existing Worker-0 VPS. The one active execution agent must use its **native local Linux shell** for filesystem, CLI, Git, `mcpc`, Graphify and Fallow operations. RDC is fallback/recovery for a distinct ChatGPT cloud session, not a mandatory intermediary or concurrent writer. Historical directives declaring Codex retired or RDC-exclusive are superseded.
- **Git topology:** Exactly **one canonical checkout** at `/home/mellonelay1999/workspaces/Nexi`, on `main`. **Never create Git worktrees**, alternate migration checkouts, feature-branch workspaces or cloned writers. Edit the canonical checkout; commit approved changes **directly to main** after focused verification. Coordinate with the active executor before shared writes, commit or push. Preserve unrelated dirty files and never discard another session's work.
- **Proof reuse:** Read `NEXI_PROOF_REUSE_REGISTER.md`, `NEXI_CURRENT_STATE.md`, and task-relevant latest `tasks/todo.md` / `tasks/plan.md` once at entry or meaningful phase/authority change. Newer receipts supersede older checklist entries. `PROVEN + UNCHANGED = REUSE`; verify only invalidated contracts. Do not repeat migration, market or auth tests without contradictory evidence.
- **Market owner decision:** The MOEX closed-session repair and validated Binance snapshots are accepted within their proven scope. Closed/stale/nonfresh noncrypto instruments are acceptable when truthfully labeled. Do not launch another mandatory BiQuote weekday/Gate freshness campaign or invent reference trades/depth for unsupported providers. Focus remaining backend work on financial operations, workflow recovery and operational closure.
- **Parallel execution:** Owner authorizes the Codex Desktop direct-SSH lane and a separate ChatGPT Cloud Work/RDC lane concurrently for distinct bounded responsibilities. Assign non-overlapping file/operation ownership before writes; read-only discovery can run independently. Only one owner at a time may mutate a shared source, Ledger/SQLite, dependencies, deployed services or Git index/commit/push. Do not use RDC to duplicate an operation already running via SSH; never create another worktree. Cloud Work does not inherit Desktop SSH transport automatically.
- **Skills, one controller:** Invoke installed `nexi-work-kernel` for lifecycle; `nexi-capability-router` for discovery; bundled Addy Osmani `agent-skills/using-agent-skills` for task-fit Define/Plan/Build/Verify/Review/Ship method. Use `graphify-agent-workflows` with Graphify CLI/Multi-View for nontrivial causal paths/ownership/blast radius, `fallow` for distinct TS/JS structure/changed-code risk, and Ponytail for minimal/YAGNI-oriented implementation/review when relevant. Context7/current official docs only when external semantics are uncertain. `MENTIONED -> DISCOVERED -> READ -> INVOKED -> RESULT USED`; hook installed/enabled is not invocation proof. One mutation owner; distinct read-only support only; serialize Git, database, service, financial and deploy mutation.
- **Codex overlay:** Read `.codex/AGENTS.md` for NEXI Remote SSH skill-combination details. Global `~/.codex/AGENTS.md` is generated by Agent Kernel; do not edit it directly.
- **Hooks:** Project `.codex/hooks.json` currently registers `graphify hook-check` at `PreToolUse` for Bash and `~/.agents/skills/worker0-skill-harness/scripts/hook.py` at `UserPromptSubmit`. User-level `~/.codex/hooks.json` registers bundled Agent Skills at `SessionStart`. ChatGPT Desktop shows Ponytail `SessionStart`, `UserPromptSubmit`, `SubagentStart` hooks enabled through its plugin, plus a separate Impeccable plugin; inspect live UI/config for effective merged hooks. Avoid treating 600-second hook timeouts as compulsory waits; diagnose slow hooks instead of looping or duplicating tools. Do not replace plugin-owned or generated hooks merely to document them.
- **Verification:** Distinguish source implementation, tests, integration, real runtime, deployed identity and owner acceptance. Continue backend-first; Coinbase/browser frontend comes after coherent backend closure. Never fabricate financial operations, deposits, withdrawals or settlement proof.

---
# NEXI Work Authoritative Operating Contract

## Authority
GitHub `main` is the durable NEXI source authority. Name.com public DNS routes the three hostnames to the existing VPS NestJS service. On 2026-10-17, the existing restored SQLite candidate plus the recorded final D1 import was promoted to `/var/lib/nexi/sqlite/nexi-staging.sqlite`; the active API now reports SQLite readiness. This supersedes earlier statements that the VPS financial tables were empty or that no promotion occurred. The import does not prove later D1 updates/deletes are reconciled or establish a final live watermark. The owner-selected single direct-SSH executor operates the VPS; existing Public/Admin service owners remain unchanged.

- ChatGPT remains the parent/controller.
- VPS backend implementation, runtime, and acceptance work target `/home/mellonelay1999/workspaces/Nexi`, `/srv/nexi/backend`, and the existing `nexi-api.service`; distinguish live SQLite runtime readiness from full data reconciliation and final cutover evidence.
- Public and Admin keep their canonical sources and runtime directories. Existing Nginx is the API/host/WebSocket router; direct checks and Certbot dry-run verified trusted HTTPS and renewal. The promoted SQLite DB is live; final D1 update/delete reconciliation and independent recovery remain open.
- The owner-selected direct-SSH Worker-0 executor may build and operate the authorized VPS backend. Never run a second financial writer or point a non-authoritative service at production financial state.
- Historical trees, branches, and receipts are evidence only unless fresh verification proves unique accepted work.


## Canonical architecture
Public/Admin -> existing Nginx hosts -> Next.js frontends and the canonical NestJS VPS API.
NestJS owns business/domain decisions. SQLite + Prisma/better-sqlite3 is the target durable application store; Ledger is accounting truth and EventOutbox is the durable publication boundary.
Aiven Valkey serves BullMQ transport, Socket.IO Redis Streams, cache and ephemeral coordination; it never owns financial truth. SQLite job/workflow journals remain durable. Local protected storage replaces private R2 object storage for KYC/deposit evidence.

Do not restore any retired database authority. Do not introduce a second Admin plane, second financial writer, direct frontend database access, or a second reverse proxy.
## Capability routing
Worker-0 global execution law is `/home/mellonelay1999/RDC_ONBOARDING.md` with global capability/router/hook catalogs under `/home/mellonelay1999/.agents/`. The ChatGPT Work parent owns NEXI Work Control Plane reasoning, Agent Skills method selection, Selective Intelligence, Ponytail/Karpathy discipline, phase routing and fan-in. Worker-0 executes/evidences through the native SSH shell and currently callable specialist MCP/CLI tools; retired Fabric is not a current execution owner. Get-Fable and Riqor runtimes were removed by owner decision on 2026-09-30 and must not be routed to or reinstalled. Graphify provides topology, Fallow provides static analysis, DeepWiki provides optional semantics; CodeScene is not a mandatory authority. NEXI files below are project overlays, not duplicate global authorities.

Classify the complete owner request before choosing skills or tools. Use `docs/operations/NEXI_CAPABILITY_ROUTING.md` as the project routing owner, `/home/mellonelay1999/RDC_ONBOARDING.md` for Worker-0 mechanics, and `/home/mellonelay1999/.agents/GLOBAL_CAPABILITY_INDEX.md` as the lightweight capability directory. Read only the specialist reference needed for the task.

Before the first execution call of each new substantive NEXI task, emit the compact `ROUTING` declaration required by the project router, then execute immediately. That startup route is not a permanent lease: when the engineering phase, failure mode, causal owner, or proof target changes, the ChatGPT Work parent must re-enter NEXI Work Control Plane + `using-agent-skills`, select the method for the CURRENT phase, and continue. Reuse unchanged skill/tool/onboarding contracts from the session cache instead of rereading them mechanically.

Before execution, compile the entire owner message into one bounded contract: required actions, evidence, sequencing, preserved state, explicit non-goals, mutation/production authority, completion conditions, and required durable-state updates. A later requirement in the same owner message is not optional; every required item must finish as `PROVEN_COMPLETE` or `BLOCKED_WITH_EVIDENCE`.

Dynamic model: `OWNER MESSAGE -> COMPLETE TASK CONTRACT -> CURRENT AUTHORITY -> CORRECTION/DRIFT WHEN NEEDED -> TASK CLASS -> ONE PRIMARY RESPONSIBILITY OWNER -> 0..N NON-OVERLAPPING SPECIALISTS -> FASTEST PRECISE TOOL/MCP/CLI -> EXECUTE -> FOCUSED VERIFY -> PARENT FAN-IN -> DURABLE STATE RECONCILIATION WHEN REQUIRED -> REPORT`.

`@skill`/plugin mentions are capability hints, not a mandatory pre-execution reading queue. A mentioned capability may be PRIMARY, SUPPORTING, or AVAILABLE-BUT-NOT-NEEDED. Load or rediscover a skill only when its operating contract can materially change execution or verification; reuse already-proven routing while unchanged.

No historical controller skill has universal primacy. Use a task-specific skill only when its trigger matches current owner intent. Historical Astra binding/controller artifacts are lineage, not active routing authority. Tool availability never expands mutation or production authority.

## Bounded authority maintenance
Durable-state reconciliation is part of completion, but it is proportional rather than mechanical.
- Update `NEXI_CURRENT_STATE.md` when a bounded task materially changes current durable NEXI truth: source frontier, deployed baseline, active phase, canonical ownership/routing, or immediate unresolved gates.
- The retired completion ledger is available in Git history only and is not an active completion gate.
- Harmless commands, transient process/session state, one-off timestamps, exploratory notes, and ephemeral diagnostics do not belong in permanent authority.

When reconciliation is required, do it before the completion receipt rather than deferring it to a cleanup session. The bounded loop is:
`IMPLEMENT/REPAIR -> FOCUSED VERIFY -> PROPORTIONAL CURRENT-STATE/LEDGER RECONCILIATION -> CONSISTENCY CHECK -> REPORT`.
If source authority advances without deployment, record the new GitHub source SHA separately from the still-deployed production baseline. Never imply that undeployed source is production-proven.

## Worker-0 Public/Admin hosting and dependency ownership
On Worker 0, always use the dedicated hosting/runtime seams instead of creating session-local frontend/admin dependency trees:
- Public source: `/home/mellonelay1999/workspaces/Nexi/frontend`
- Public canonical dependencies: `/srv/nexi/public/shared/node_modules`
- Public canonical build/runtime directory: `/srv/nexi/public/current`
- Admin source: `/home/mellonelay1999/workspaces/Nexi/Admin`
- Admin canonical dependencies: `/srv/nexi/admin/shared/node_modules`
- Admin runtime remains governed by its current task-specific authority.

CURRENT OWNER BUILD RULE FOR PUBLIC: `/srv/nexi/public/current` is the only generated Public build/runtime directory. It is a real directory, not a symlink. Do not create `/srv/nexi/public/build-*`, `/srv/nexi/public/releases/*`, candidate release trees, temporary build roots, copied build outputs, rollback release copies, or alternate Public build directories. Finish all source repairs and focused source checks first. Only when the owner-selected Public source frontier is ready for final integration may the parent stop `nexi-public.service`, synchronize the verified canonical Public source into `/srv/nexi/public/current`, run the one final production build in that same directory, restart the service, and verify the deployed behavior. No iterative build/deploy loop while source defects remain open.

Both source `node_modules` paths must be symlinks to their dedicated `/srv/nexi/.../shared/node_modules` owners. Do not run `npm ci` directly inside either source tree on Worker 0 because npm may replace the symlink with a new local tree. If dependency reconstruction is required, stage the current source `package.json` + `package-lock.json` into the corresponding `/srv/nexi/<surface>/shared` install context, rebuild there, then restore/verify the source symlink. Package manifests/lockfiles remain source authority; `node_modules`, `.next`, and `.output` are generated state.

## Fast execution routing
Use direct source when the affected file/symbol is already known.
Use Graphify for topology, ownership, dependency paths, and blast radius.
Use Codebase Memory or bounded `rg`/`fd` for exact symbols/callers/snippets.
Use Forensic Graphify only for unclear structural failures, drift, hidden paths, or competing hypotheses.
Use current official docs/Context7 only when external framework/provider semantics are uncertain.
Use API contract tools only against real controller/DTO/OpenAPI artifacts, not progress summaries.

Default loop:
`LOCATE IF NEEDED -> READ EXACT SOURCE -> IMPLEMENT -> FOCUSED VERIFY -> REPAIR ONCE -> CONTINUE`.

Do not pause between dependency-ready tasks merely to report progress.
Do not run every skill/tool mechanically.

## Worker-0 capability knowledge
Do not duplicate the Worker-0 tool inventory here. Route through `/home/mellonelay1999/.agents/GLOBAL_CAPABILITY_INDEX.md`; use `/home/mellonelay1999/.agents/GLOBAL_MCP_CATALOG.md`, `/home/mellonelay1999/.agents/GLOBAL_CLI_CATALOG.md`, `/home/mellonelay1999/.agents/BROWSER_FABRIC.md`, and the Graphify/DeepWiki complete guides only when that capability is relevant. Discover mutable versions/auth/schema/health live.

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
Before a completion claim, verify the exact changed boundary with fresh evidence appropriate to that layer.
Report compactly: outcome, decisive evidence, changed files/resources, remaining unverified surfaces, production-changed status, next dependency-ready action.
## Historical artifact policy

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## HISTORICAL NEXI WORK CONTROLLER — superseded for paired Codex CLI 2026-10-23

NEXI tasks in ChatGPT Work follow NEXI Work Control Plane -> NEXI Work Kernel -> Capability Router and selected Agent Skills. Maintain Work phase/session capability cache, authority, proof reuse and relevant knowledge contracts. Native shell, Codex SSH, RDC and mcpc are execution capabilities, not lifecycle owners. Chat-side Capability Cache v1.4.0 cannot authorize or execute Work tasks. Agent Kernel and its global generated Codex AGENTS.md are retired as NEXI controllers; never use agent-kernel CLI to publish NEXI rules. Use worker0-protect unlock/refresh-lock for authorized VM documentation edits. Browser-routing references below are archival and non-operative; use the current paired Codex route in `.codex/AGENTS.md`.

## HISTORICAL BROWSER ROUTING — superseded for paired Codex CLI 2026-10-23

The former Public Polypane/CDP 5859 route and stale MCP target 5858 are retired. Current paired Codex browser verification uses Chrome DevTools MCP with `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance` for both Public and Admin, preserving the existing Chrome profile and recording each surface's own origin, authentication state, and evidence. Follow `.codex/AGENTS.md`.

The former ChatGPT Work Cloud Browser-only Admin rule is retired. The current paired Codex session may use the owner's existing authenticated Chrome profile through the Chrome DevTools MCP profile-aware connection under the bounded sign-in procedure in `.codex/AGENTS.md`; never read or report credentials, cookies, tokens, or wallet internals.

Keep release, browser/session, URL, authenticated state and observed rendered/network result separately for each surface. Wallet signatures and financial operations need task-specific owner authorization. Supersedes incompatible historical browser notes below; see ~/.agents/BROWSER_FABRIC.md and ~/RDC_ONBOARDING.md.

## Historical browser execution — superseded for paired Codex CLI 2026-10-23

This browser-routing note is historical. Use the current Chrome DevTools MCP route `--autoConnect --userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance` and the current owner-approved wallet procedure in `.codex/AGENTS.md`; do not assume a particular wallet is already connected.

## Production closure controller — hard rule


The current owner directive selects the active work. The completion ledger is historical evidence only; a stale queue row, receipt, phase capsule, or checkpoint cannot block an explicit current owner instruction. Preserve proven completed work and update current-state records proportionally after material source/runtime changes. Never claim verification that has not been performed.

Owner manual testing is a final acceptance gate, never a substitute for automatable verification. Use only authorized controlled wallet/Admin identities; otherwise record the exact owner dependency. Public DNS already routes traffic to the VPS. The active VPS SQLite database contains the reused historical snapshot plus the recorded final import and has passed the focused LedgerAccount/LedgerPosting exact-decimal check; full later-delta reconciliation and independent encrypted off-VPS restore remain unproven. Keep Public/Admin builds in their canonical `/srv/nexi/public` and `/srv/nexi/admin` locations.

For market work, do not optimize for a cosmetic `LIVE` count. Open-market assets must remain fresh or self-recover automatically; legitimate closed-market states must carry a truthful reason; silent frozen prices, fabricated freshness, and manual recovery as normal operation are defects.

## Durable phase checkpoint — 2026-10-02

Do not make a durable phase checkpoint, stale workCycle capsule, or phase-reconciliation receipt a prerequisite for executing a current owner directive. Use live repository and runtime evidence to preserve completed work; update durable state proportionally after material changes. Do not create a second completion ledger.

## Maintainability and focused verification

Use relevant direct source, affected tests, Fallow and Graphify when they materially establish correctness or changed-code risk. CodeScene scoring and historic phase-score targets are NOT mandatory gates under the owner's current direction. Preserve non-regressing application behavior and financial invariants, but do not stop at retired tool/score checkpoints. Older CodeScene docs remain provenance only.

## 2026-10-19 owner source-directory and platform retirement

## Codex task-boundary board

- This repository uses the opt-in Codex task-boundary board in `.codex/coordination/project.yaml`.
- Before substantial writes, load the installed `codex-coordinator` skill, list active claims from the primary worktree, and publish only this task's bounded claim.
- Native Codex tasks remain the execution, messaging, and transcript authority; an explicitly requested goal Coordinator is on demand, with no heartbeat or mandatory pull-request workflow.
- Reject cross-project notices and never store transcripts, reasoning, prompts, or tool output in Coordinator state.
