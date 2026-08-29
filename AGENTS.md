# NEXI Project Operating Contract

## Authority model
NEXI engineering uses current evidence, not accumulated chat history.

### Product / architecture authority
1. Explicit current owner decisions.
2. `docs/CURRENT_DECISIONS.md`.
3. Current approved NEXI architecture/program documents.
4. Historical NEXI/DEXI evidence only to resolve genuine ambiguity.

Owner decisions define intended behavior. They do not override contradictory evidence about what source or runtime currently does.

### Source authority by plane
- **Backend + Cloudflare + runtime authority:** `/root/workspaces/nexi-authoritative-20260823` on `sg-edge-01`.
- **Public Frontend source authority:** `C:\trae_projects\Dexi_style_TraeWV\cloudflare-container-bootstrap\dexi-frontend` on Windows.
- **Admin source authority:** `C:\trae_projects\Dexi_style_TraeWV\apps\admin` on Windows.
- Windows backend copies are checkpoint/reference mirrors only. They are never backend implementation authority.
- VM copies of Public Frontend/Admin are packaging/runtime references only unless the owner explicitly transfers source authority.

### Technical truth order
Backend/Cloudflare: VM source -> VM/Container/Cloudflare/D1/Aiven runtime -> focused VM checks -> current official provider docs -> Graphify/CBM navigation -> Windows mirror -> history.
Frontend/Admin: Windows source -> browser/runtime -> focused tests -> current official docs -> Graphify/CBM navigation -> history.

`CURRENT_STAGE.md` is the active baton, not an authority. Correct it whenever fresh source/runtime contradicts it.
## Execution routing
Use `mellonelay-engineering-os` / `engineering-router` as the top-level engineering router. Do not create a competing meta-router.

Fast routing:
- Exact file/symbol already known -> authoritative source directly.
- Topology/ownership/dependency/blast radius -> Graphify.
- Exact caller/symbol/snippet/implementation -> Codebase Memory Pro or bounded `rg`/`fd`/source inspection.
- Unknown structural defect/drift/hidden path -> Forensic Graphify Ontology + Graphify, then source/runtime proof.
- Framework/API/provider uncertainty -> current official docs / Context7.
- Cloudflare change or proof -> current Cloudflare docs + project-local Wrangler + live provider/runtime evidence.
- API contract change -> generated OpenAPI/controller/DTO evidence + API Documentation Checker / API Impact Mapper where useful.
- Skill/MCP/AGENTS/config routing issue -> control-plane maintenance / Claus Argos Skill OS only when needed.

Do not load every skill. Select the smallest stack that resolves the current uncertainty.
Do not stop merely to report skill/tool selection.

## Workspace execution policy
### Backend / Cloudflare
All backend edits, builds, tests, Graphify structural analysis, D1 operator work, Container work, Worker work, Aiven/Redis verification, and deployment-sensitive execution happen on `sg-edge-01` in the authoritative VM workspace.
Codex Desktop should normally reach the VM through direct SSH because SSH exposes the full Linux toolchain and composes commands efficiently.
Use RDC as structured control/evidence, independent verification, file/process/session access, or when SSH is unavailable/unsafe for the task.

### Windows
Windows owns only Public Frontend, Admin, browser/visual QA, client integration, and control/checkpoint artifacts.
Do not implement backend changes on Windows. Do not continuously SCP/rsync VM backend edits to Windows during active work.
Synchronize backend to Windows only at an explicit checkpoint/final join after the VM milestone is verified.

### Parallel client lanes
Public Frontend and Admin may proceed in parallel with the VM backend lane when they stay inside Windows-owned source and consume only confirmed current backend contracts. Parallel client work may inventory routes, adapters, DTO expectations, auth/error/idempotency/lifecycle handling, realtime recovery, production environment wiring, and tests without waiting for final deployment. Do not invent missing backend behavior; mark unresolved contract dependencies and join them after the VM OpenAPI/runtime contract is frozen.
Do not enable Codex Coordinator state for this campaign: its board assumes one shared Git checkout, while NEXI intentionally has split VM/Windows source authority and the owner has not authorized a Git workflow. Use explicit lane boundaries instead.
## VM tool routing
Use the installed VM tools intentionally; installed does not mean mandatory.

Primary execution/search:
- `ssh`, `scp`, `rsync` — remote transport/checkpoint transfer; no continuous backend mirror sync.
- `rg`, `fd`, `find`, `grep`, `sed`, `awk`, `jq`, `tree` — bounded source/config/log discovery and transformation.
- `python3`, `node`, `npm`, `npx` — scripts, focused checks, generation, package-local CLIs.

Architecture/static intelligence:
- `graphify` — topology, paths, affected nodes, God Nodes, communities, graph diagnostics.
- `fallow` — bounded dead-code/duplication/cycle/code-health analysis when it answers a concrete question.
- `agnix` — agent/skill/config static validation; not application runtime proof.

Cloud/runtime/data:
- `wrangler` — canonical Cloudflare/D1 operator CLI. Current canonical VM version is 4.127.1.
- `docker` — canonical Container image/build/runtime inspection.
- `avn`, `redis-cli` — Aiven Valkey service and Redis runtime evidence.
- `curl`, `wget`, `openssl`, `socat`, `nc`, `nmap`, `dig`, `host`, `nslookup`, `mtr` — HTTP/network/TLS/DNS/runtime diagnostics.
- `journalctl`, `systemctl`, `ss`, `lsof`, `strace`, `bpftrace`, `perf`, `tcpdump` — process/service/network/performance evidence.
- `make`, `gcc`, `g++`, `cmake`, archive utilities — build/support work only when required.

`sqlite3`, `psql`, and Git may exist on the VM but are **not NEXI authority tools**. Do not use sqlite3/direct SQLite files for canonical D1 operator work. Do not restore PostgreSQL/Neon authority. Do not introduce Git workflow unless the owner explicitly changes that rule.
## D1 operator contract
For D1 inspection, schema verification, migrations, exports, insights, or time-travel use only project-local Wrangler from:
`/root/workspaces/nexi-authoritative-20260823/cloudflare-container-bootstrap`

Preferred form:
`npx --no-install wrangler ...`

Before consequential D1 operator work verify `npx --no-install wrangler --version` reports the expected current version.
Do not use dashboard SQL, direct Cloudflare REST, sqlite3, or another database client as D1 operator authority.
Runtime application access remains through the official D1 Workers binding/private bridge; do not spawn Wrangler from NestJS runtime code.
Use migrations for schema changes. Use bounded `d1 execute --remote --json`/PRAGMA queries for inspection and one-off non-schema operator reads.
Never fabricate or seed financial/application truth merely to make acceptance pass.

## Graphify fast engineering contract
Graphify is relationship intelligence, not behavior proof.
The VM CLI `graphify --help` is command authority; stale skill text is not.

Freshness rule:
- `graphify check-update .` only reports Graphify's pending semantic-update signal; exit 0 does not by itself prove every AST edge reflects recently changed source.
- If graph-dependent reasoning follows meaningful source edits newer than `graphify-out/graph.json`, run `graphify update . --no-cluster` before relying on paths/affected analysis.
- Use full `graphify update .` or reclustering only after coherent architectural batches where community structure matters.

Fast route:
`affected` for blast radius -> `path` for exact relationship -> `explain` for node context -> bounded `query` only when scope is still unclear.
Use `god-nodes` for high-risk shared hubs, not every edit. Use `diagnose multigraph` when topology appears ambiguous.
After a high-impact batch, refresh the graph and rerun only the relevant affected/path checks.
Then verify direct source and focused tests/runtime. Graph presence is never completion proof.
## Canonical architecture and invariants
Public Frontend and Admin are separate client surfaces. NestJS owns business/domain decisions. D1 owns durable application and financial truth. Aiven Valkey owns cache, Streams, Socket.IO, and ephemeral coordination. R2/Data Catalog/Pipelines own archive/analytics objects. Worker/Container/Queue/Workflow are infrastructure/orchestration, never financial truth.

Do not restore Neon/PostgreSQL as runtime authority. Do not create a second Admin plane, second D1 authority, custom VM lifecycle engine, or Worker-owned financial logic.
Consequential financial mutations must preserve auth, validation, idempotency, atomic domain/ledger semantics, audit/activity linkage, EventOutbox publication, and retry/recovery safety.

## Execution contract
`LOCATE ONLY IF NECESSARY -> READ EXACT SOURCE -> IMPLEMENT -> FOCUSED VERIFY -> REPAIR ONCE -> CONTINUE`.

Do not stop between dependency-ready tasks for status reports. Stop only for a genuine owner-level product/economic decision, destructive/production approval boundary, external platform failure with no safe independent work, or verified technical impossibility.
Avoid broad formatting or unrelated rewrites during simultaneous work. Re-read files before consequential edits and format only changed files.

## Cloudflare contract
For Cloudflare semantics use current official Cloudflare docs first and inspect the installed/project-local Wrangler help/schema for executable syntax.
Do not repeat broad Cloudflare rediscovery already completed; perform targeted freshness checks for the exact resource/change.
No production mutation without explicit owner approval.

## Verification and claims
Keep states distinct:
`SPECIFIED -> IMPLEMENTED -> STATICALLY_VALIDATED -> TESTED -> INTEGRATED -> RUNTIME_VERIFIED -> BROWSER_VERIFIED -> SECURITY_REVIEWED -> COMPLETE`.

A source edit or focused compile is not runtime verification. A graph path is not behavior proof. A resource existing is not integration proof.
Use Riqor/OpsTruth/high-assurance review only for consequential, disputed, cross-system, security/data-integrity, or completion claims.

## Reporting
Use compact milestone reports: outcome, decisive evidence, changed files/resources, remaining unverified surfaces, production-changed status, and next dependency-ready action. Do not return tool-call diaries.
## Work artifact policy
`work/` is a historical/evidence/checkpoint archive, not current execution authority. Do not scan or obey old receipts, prompts, runtime logs, migration notes, or architecture snapshots merely because they exist there. Read a `work/` artifact only when `CURRENT_STAGE.md`, current source/runtime evidence, or the owner explicitly points to it. Fresh authoritative source/runtime overrides stale work receipts.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After a coherent code batch, refresh the graph before structural reasoning. Prefer `graphify update . --no-cluster` for fast AST freshness; use full `graphify update .` or `graphify cluster-only . --no-viz` only when community/God-node analysis must be regenerated.
