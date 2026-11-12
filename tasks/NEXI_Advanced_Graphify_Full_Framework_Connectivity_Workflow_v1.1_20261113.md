# NEXI — Advanced Graphify Full-Framework Connectivity Workflow

**Standalone research-backed operating specification | v1.1 (reviewed and expanded) | 13 November 2026**  
**Purpose:** Provide an executable, source-first method for determining whether all **expected** application-framework, API, queue, persistence, event, wallet, and UI contracts are structurally connected across NEXI Backend, Public, and Admin. **This document is instructions, not the audit's findings.**  
**Controller:** Normal ChatGPT in the NEXI Project → existing NEXI Normal Chat Kernel → SentinelX native VM execution → Knowledge v4 and existing custom local Graphify CLI/MCPC.  
**Phase:** `NEXI_REPOSITORY_SOURCE_FIRST`: read-only graph/source and Kernel/harness inspection permitted; **no NEXI application tests, lint/typecheck, builds, browser acceptance, restarts, deployments, migrations, external financial execution or financial-state mutation until owner-authorized source closure**.

> **Authority:** latest owner instruction → live VM/repository/affected `AGENTS.md` → current source and relevant proof receipts → matching local source graph → Knowledge v4/version-matched primary documentation → historical material. No Graphify Cloud or hosted trace, no competing graph producer, no second controller and no speculative rebuild of the existing graph.

## 0. Executive architecture decision

Run an **expected-contract-driven connectivity audit**, not a “show me all edges” exercise. The canonical local graph is the topology evidence; **current source independently defines intended producers, consumers, guards, payloads and invariants**. A connected import path is not necessarily a working API, and an absent static edge is not necessarily a broken integration.

**Four independent questions must be answered for every material contract:**

1. **Source/extraction coverage:** is the applicable owner declaration present and represented in Graphify, or does the extractor omit it?
2. **Static topology:** which exact source nodes, typed edges, directions, paths, branches, dependencies and reverse consumers support the relationship?
3. **Semantic compatibility:** do HTTP methods/paths/DTOs, schema fields, queue names/job payloads, socket events, permissions and financial state meanings agree in current source?
4. **Proof boundary:** what is *source-confirmed*, *unknown*, *not applicable*, or *deferred runtime verification*?

The audit stops at a **complete architecture contract matrix** with actionable, source-located gaps; it must not silently turn into an application-test or deployment campaign.

### 0.1 Audit-of-the-audit improvements (v1.1)

This revision reconciles previous research on Graphify query completeness, the historical Multi-View ZIP, Understand Anything domain maps, local Graphify v0.9.105 CLI/MCP semantics, NEXI custom extractor evidence and host-owned specialist workflows. It **does not** claim the framework audit has been executed. Specific corrections:

1. **Independent denominator and negative-space audit.** Enumerate expected contracts from current source/owner rules *before* using graph results to judge connectivity. Reconcile route/module/schema/event/queue inventories against graph extraction; maintain `EXPECTED_BUT_NOT_CAPTURED` separately.
2. **Typed directional path proof.** Audit each step's semantics, not mere shortest-path reachability. A stored graph declared `directed=false` can preserve logical relation direction in edge attributes; use official CLI/MCP directional interpretation and current source, never raw graph connectedness as proof.
3. **Producer–consumer cardinality and boundary checks.** One expected producer can have multiple legitimate consumers; a missing consumer, duplicate state writer, wrong queue receiver, or unexpectedly public handler requires separate tests of *source declarations* and authority, not just edge existence.
4. **Unknown and source-gap triage.** Unmatched HTTP endpoints, dynamic route patterns, inferred queue names, external providers, weak event candidates and stale graph records get explicit dispositions. Do not promote candidates to `PROVEN_SOURCE_GAP` without independent current-source evidence.
5. **Source classification compatible with the original 113 criteria.** The repository closure matrix retains `SOURCE_IMPLEMENTED`, `PROVEN_SOURCE_GAP`, `INSUFFICIENT_EVIDENCE`; this architecture audit uses its more precise `SOURCE_CONNECTED` substatus and maps it to source implementation *only when* the underlying criterion itself is satisfied. `NOT_APPLICABLE` is an audited exclusion, not a closure PASS.
6. **Actual specialist use, not decoration.** Vibe Coding Library `integration-map`, `ownership-invariant-map`, `traceability-map`; TanStack Start/Router/Query source and server-boundary guidance; Anti-Slop's decision/root-owner gates. All are subordinate to the NEXI Kernel and are not runtime proofs.
7. **Analysis versus mutation.** CLI query/explain/path/affected/god-nodes/diagnose and MCP reads may be used; exports/reflect/save-result, graph extract/rebuild, hooks, installs and runbook writes are separate, explicitly controlled artifact operations.

### 0.2 Architecture questions are NOT all answered by a connected component

Distinguish: **topological existence** (some path), **typed contract reachability** (a valid chain of relation meanings), **source implementation** (endpoint/DTO/DI/queue/event/state agrees), **operational behavior** (deferred). A shortest path, high-degree hub, Leiden community or undirected connection alone does not establish a business flow. A technically valid architecture may intentionally contain disconnected subsystems, external boundaries, and uncalled Admin-only endpoints.


## 1. Inputs, provenance and live baseline

### 1.1 Required read set (read once fully; cache fingerprint)

- Complete current `NEXI_NORMAL_CHAT_GRAPHIFY_VM_KERNEL_RUNBOOK_v3.4_20261111.md` (163 lines), plus latest project-owner decisions.
- Root and affected `AGENTS.md`; `tasks/todo.md`, `tasks/plan.md`, `tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md`; original 113 acceptance criteria for cross-reference **not** as the architecture inventory ceiling.
- VM Kernel's `SKILL.md`, `SOURCE_FIRST_GRAPH_ROUTING.md`, `SENTINELX_TOOL_ROUTER.md`, and relevant CLI contract; selected VM and ChatGPT skills read fully if actually used.
- `graphify-out/graph.json`, current `merged-graph-report.json`, source manifest, extractor fingerprints and exact source-tree comparison; current package manifests, Prisma schema, configuration and applicable source declarations.
- Knowledge v4 `FRAMEWORK_GUARDRAILS.md`, task-specific `03_FRAMEWORKS_AND_OFFICIAL_REFERENCES.md`, and relevant version-matched documents. Knowledge graph and code graph are separate data sources.

### 1.2 Baseline confirmed by **read-only SentinelX calls** on 13 November 2026

| Item | Confirmed observation | Caution |
|---|---|---|
| VM agent | SentinelX `0.23.59`, host `mellonelay` | Native host policy still controls commands and file visibility |
| Source checkout | `main@229c7d9a7e53`; 984 untracked paths in observed project snapshot | Tracked HEAD match does **not** cover relevant untracked/dirty files |
| CLI | `graphify 0.9.105` | Actual `--help` overrides web docs examples reviewed against 0.9.100 |
| Canonical graph | `/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json` | Do not confuse with per-surface or historical outputs |
| Source MCP | `@nexi-graphify-live` (10 tools) | Local stdio Graphify; use `/usr/local/bin/nexi-mcpc` |
| Reference MCP | `@nexi-knowledge` (10 tools), source version 0.9.103 in observed metadata | Separate Knowledge v4 graph; not product code topology |
| Graph hash | `beec00370f944bdcac17b78f8a0e9d31b0363283e7280fcb0cdf7d0a1f8cbd8c` | Revalidate if canonical artifact changes |
| Graph size | 12,076 nodes, 32,496 edges, 293 communities | These are captured records, not tested integration contracts |
| Extractor files | 621 code files detected/extracted by the three surface extracts: Backend 371, Public 142, Admin 108 (the separate report field `source_files_with_graph_nodes` has different counts; never merge them) | Compare manifest to current source and exclusions |
| HTTP evidence | 301 operations, 194 client-call edges, 286 handler edges; 167 exact joins | 102 Admin→Backend, 64 Public→Backend, 1 Public→Public |
| Unknowns | 68 unresolved NEXI semantic operations; 14 client-only and 119 handler-only operation IDs | Classification required; unknown ≠ bug |
| Graph integrity | Report says zero dangling edges, zero missing HTTP provenance | Graph structural health ≠ completeness |
| Installation footprint | `graphifyy` environment 1.7 GB; NEXI `graphify-out` 572 MB | Do not install duplicate runtimes or rebuild merely for exploration |

The report records 5,609 NEXI-specific nodes and numerous additional typed relationships. Existing full current report is the authoritative source for exact counts; values here are a snapshot.

### 1.3 Version-matched framework manifest baseline (declared dependencies)

| Surface | Manifest evidence (declared, not independently runtime-verified) |
|---|---|
| Backend | `@nestjs/common/core ^12.0.0`, Prisma CLI/client `7.10.1`, `@prisma/adapter-better-sqlite3 7.10.1`, `better-sqlite3 12.11.1`, BullMQ `6.3.15`, `@nestjs/bullmq 12.0.0` (devDependency), Socket.IO `^4.8.3`, `@socket.io/redis-streams-adapter ^0.3.0`, `ioredis ^5.10.1`, `viem 2.44.4`, SIWE parser 3.0.0, Sentry NestJS `11.0.0-rc.0`, TypeScript 6.0.2 |
| Public | Next.js `16.4.1`, React `19.3.0`, `@tanstack/react-query ^5.90.19`, Socket.IO client `^4.7.0`, wagmi `^2.19.5`, viem `^2.44.4`, RainbowKit `^2.2.10`, Lightweight Charts `^4.1.0`, Tailwind CSS `^3.3.0`, Sentry Next.js `10.75.2` |
| Admin | `@tanstack/react-router ^1.170.16`, `@tanstack/react-start ^1.168.26`, `@tanstack/react-query ^5.101.1`, Vite `^8.0.16`, Nitro `3.0.260603-beta`, React `^19.2.0`, Zod `^4.6.6`, Socket.IO client `^4.8.4`, Tailwind CSS `^4.2.1`, Sentry React/Start `10.73.0` |

**Critical version guard:** a current external Prisma transaction guide inspected during research described Prisma ORM **8** and a `db.transaction()` API, not NEXI's installed Prisma **7** client; **do not copy it into NEXI**. Verify actual Prisma 7 APIs and the existing adapter's code. Similarly, do not apply Next.js patterns to TanStack Start or vice versa.

## 2. Capability topology and task ownership

```text
Normal ChatGPT / NEXI Normal Chat Kernel (only coordinator)
  ├── SentinelX host authority and read-only VM commands
  │    ├── sx_kernel.py source-map → task-specific Knowledge v4 gate
  │    ├── @nexi-knowledge → framework reference graph (separate)
  │    ├── @nexi-graphify-live → canonical source graph (10 MCP tools)
  │    ├── graphify CLI 0.9.105 → query/explain/path/affected/diagnose/exports
  │    ├── source manifests, files, AGENTS and proof receipts
  │    └── optional existing source-only risk specialists (no app tests)
  ├── Context7 / official docs → versioned framework contracts, not source authority
  ├── Exa → primary-source research for ambiguous ecosystem behavior
  ├── Data → inspectable coverage model and evidence-validation methodology
  ├── API Documentation Checker → explicit OpenAPI/typed HTTP contract-document comparison
  └── Anti-Slop / Agent Skills / optional Reef → review method only; no new controller
```

**Tools are selected conditionally.** A plugin being mentioned, installed or read is not proof of invocation, and an invocation is not proof of a valid result. Record `SELECTED`, `INSTRUCTIONS_READ`, `TOOL_INVOKED`, `RESULT_USED` separately. No Work/Codex prompt delegation for this Normal Chat activity.

### 2.0 Plugin method mapping — applied relevance and limits

| Specialist | Method useful in THIS workflow | Exact boundary |
|---|---|---|
| Vibe Coding Library `integration-map` | For each integration: owner, adapter, configuration, producer/consumer, retries, failure and readback paths | Retrieved instruction workflow only; no repository audit or patch performed |
| Vibe `ownership-invariant-map` | Ledger single-writer, no duplicate financial effects, ownership of status/config/permissions | Use source and owner requirements as truth; avoid inferred business invariants |
| Vibe `traceability-map` | Link requirement → source owner → contract → consumers → existing acceptance criterion/closure receipt | 113 rows are supplementary, not the architecture universe |
| TanStack Start | Identify `createServerFn`, server routes, loaders and middleware; inspect CSRF same-origin boundaries and serialization | Version match lockfile; web docs can be newer than installed version |
| TanStack Router | File-based route tree, `beforeLoad`, loaders, parameter/search validation, direct-link and error boundaries | `beforeLoad` is not sufficient server-side authorization |
| TanStack Query | Query key scope, invalidation after mutation, SSR cache isolation and stale data | A query key match is not proof of correct backend state |
| Anti-Slop + Decision Guard | Reject vague graph completeness claims, extra graph producers, duplicated writers and proxy coverage metrics | Do not replace approved source architecture with new abstractions |
| Wayfinder | Decide only truly unresolved questions (expected connectivity semantics, ambiguous external owner) | No tracker or parallel campaign by default for this prepared audit |
| Reef | Later feedback loop for repeated, measured missed-edge classifications | Guidance only; no installed runtime or training asserted |
| Wolfram | Optional exact graph calculations if supplied with a well-defined graph and model | Does not have access to VM graph by default; results are not source evidence |
| MCP Conduct Register | Public HTTP/A2A MCP endpoint conduct, if a new third-party server is proposed | Not applicable to NEXI local stdio MCP correctness; do not gate current source graph on it |

### 2.1 Graphify Multi-View (legacy skill) placement

The historical Multi-View skill's **L0 Locate / L1 Impact / L2 Multi-View / L3 Omnipotent** stages are **analysis categories**, not Graphify graph-hop depths. The current runbook also uses L0/L1 as seed node and one-hop neighbor shorthand. These are two different conventions: **always name the stage or the graph-hop depth explicitly**. The useful Multi-View perspectives are `Base` (canonical graph), `Focus` (scoped native query), `Native` (NEXI custom framework relations already in canonical graph), and `Observation` (deferred external runtime evidence). Neither the old Worker-0 `graph-analyze` scripts nor a second Native/Focus graph is required. Full native CLI and local MCPC remain primary.

## 3. Command contract — source Graphify CLI (read-only inspection operations)

Set stable variables **once** in an authorized VM shell:

```bash
ROOT=/home/mellonelay1999/workspaces/Nexi
GRAPH="$ROOT/graphify-out/graph.json"
MCPC=/usr/local/bin/nexi-mcpc
SESSION=@nexi-graphify-live
KNOWLEDGE=@nexi-knowledge

# Version/tool capabilities, no graph mutation
graphify --version
graphify --help
"$MCPC" "$SESSION" tools-list --full
"$MCPC" "$KNOWLEDGE" tools-list
```

| CLI operation | Exact supported syntax / use | Boundaries |
|---|---|---|
| Natural-English scoped query | `graphify query 'NestJS dependency injection' --graph "$GRAPH" --depth 3 --budget 1800` | BFS neighborhood; candidate seeds may be irrelevant; CLI depth 1–6, default 2 unless `.graphifyrc` overrides |
| Depth-first contextual exploration | `graphify query 'Ledger outbox worker' --dfs --depth 4 --budget 2200 --graph "$GRAPH"` | DFS is traversal order, not deterministic causal proof |
| Exact seed | `graphify query 'binary settlement' --seed 'EXACT_NODE_ID' --depth 4 --budget 2400 --graph "$GRAPH"` | Use ID returned by query/get_node, not guessed names; `--seed` repeatable |
| Context filtering | `graphify query 'who references service' --context call --graph "$GRAPH"` | `--context` is **edge context**, not a relation-name filter; verify actual stored context |
| Explain exact symbol | `graphify explain 'EXACT_NODE_ID' --all --graph "$GRAPH"` | All **immediate** connections; default 20 most connected without `--all` |
| Directed trace | `graphify path 'EXACT_A' 'EXACT_B' --graph "$GRAPH"` | One shortest stored path, directed by default; not all valid paths |
| Undirected association | `graphify path 'EXACT_A' 'EXACT_B' --undirected --graph "$GRAPH"` | Connectivity only; never call causal invocation proof |
| Reverse impact | `graphify affected 'EXACT_NODE_ID' --depth 3 --relation calls --graph "$GRAPH"` | Upstream default relation set misses NEXI custom edges; `--relation` repeatable; use actual relation names |
| High-degree hubs | `graphify god-nodes --top 30 --json --graph "$GRAPH"` | Degree includes cross-cutting UI and package nodes; prioritize relevance |
| Graph edge diagnostics | `graphify diagnose multigraph --graph "$GRAPH" --json` | Detects parallel-edge collapse risk, not failed app contracts |
| Semantic community browsing | `graphify tree --graph "$GRAPH" --output /path/to/isolated/GRAPH_TREE.html` | **Writes a derived visualization**; requires separate read-only audit artifact approval |
| HTML architecture | `graphify export callflow-html --graph "$GRAPH" --output /path/to/isolated/callflow.html` | Writes derived file; cannot replace source proofs |
| GraphML export | `graphify export graphml --graph "$GRAPH"` | Generates file; inspect output destination before authorized execution |
| Wiki export | `graphify export wiki --graph "$GRAPH"` | Generates files and may be extensive; use only on demand |
| PR state | `graphify prs` | Requires actual PR question and repository context, not routine graph audit |

**CLI status codes:** `query`, `path`, `explain` return code 0 for an answer, 3 for ambiguous identity, and 4 for no match. Do not collapse ambiguous and absent into “disconnected.” **Different output bounds:** a query may traverse hundreds of nodes yet render only dozens; capture reached, displayed and truncated counts. Do not raise budget to all 12,076 nodes by default—scope or seed first.

**Not routine read-only commands:** `extract`, `update`, `watch`, `merge-graphs`, `cluster-only`, `label`, `global add/remove`, `hook install`, `save-result`, `reflect`, provider management, exports and graph producers. They may alter canonical or derived files, config or memory. No `pip install`, no Graphify Cloud, no Neo4j/FalkorDB push, no new MCP session. A separate authorized maintenance task is required if graph/source mismatch is proven.

## 4. Local MCPC — exactly ten source graph tools

### 4.1 Existing session contract and command syntax

```bash
MCPC=/usr/local/bin/nexi-mcpc
"$MCPC" @nexi-graphify-live tools-list
"$MCPC" @nexi-graphify-live tools-list --full
"$MCPC" @nexi-graphify-live tools-get query_graph
"$MCPC" @nexi-graphify-live tools-call graph_stats '{}'
"$MCPC" @nexi-knowledge tools-call graph_stats '{}'
```

The source MCP and Knowledge MCP have similar tool names but **different graph contents**. The following are the **live source MCP schemas**, observed using `tools-list --full`, not invented shell flags:

| Tool | Required fields | Useful optional fields | Purpose/limit |
|---|---|---|---|
| `query_graph` | `question:string` | `mode:bfs|dfs` (default bfs), `depth:1..6` (default 3), `token_budget` (default 2000), `context_filter:string[]`, `project_path` | Scoped discovery; result truncation possible; no exact `--seed` parameter |
| `get_node` | one of `label`, `node_id` | `project_path` | Resolve source ID, label, file and metadata; disambiguate before conclusions |
| `get_neighbors` | one of `label`, `node_id` | `relation_filter:string`, `token_budget` (default 2000), `project_path` | Immediate neighbors; typed relation filter; not transitive impact |
| `get_community` | `community_id:integer` | `token_budget`, `project_path` | Community inspection; a cluster is not business boundary proof |
| `god_nodes` | none | `top_n`, `exclude_hubs_percentile`, `project_path` | Centrality by degree; not rank of defect severity |
| `graph_stats` | none | `project_path` | Nodes, edges, communities and rounded provenance ratios |
| `shortest_path` | `source`, `target` | `max_hops` (default 8), `undirected` (default false), `project_path` | One directed/undirected path; max_hops bounded |
| `list_prs` | none | `base`, `repo`, `project_path` | Conditional PR discovery, not needed for full repo source audit |
| `get_pr_impact` | `pr_number:integer` | `repo`, `project_path` | Actual PR impact only |
| `triage_prs` | none | `base`, `repo`, `project_path` | Conditional PR review queue |

### 4.2 Copyable MCPC examples

```bash
MCPC=/usr/local/bin/nexi-mcpc

# Knowledge v4: different graph, reference rules only
"$MCPC" @nexi-knowledge tools-call query_graph \
  '{"question":"NestJS provider module export Prisma 7 SQLite Ledger idempotency","mode":"bfs","depth":2,"token_budget":1000}'

# Natural-English source graph discovery
"$MCPC" @nexi-graphify-live tools-call query_graph \
  '{"question":"Admin HTTP calls to NestJS financial controller","mode":"bfs","depth":3,"token_budget":1800}'

# Known exact node from recorded historical graph: revalidate live before using
"$MCPC" @nexi-graphify-live tools-call get_node \
  '{"node_id":"backend::src_binary_binary_service_binaryservice"}'
"$MCPC" @nexi-graphify-live tools-call get_neighbors \
  '{"node_id":"backend::src_binary_binary_service_binaryservice","token_budget":2500}'

# Typed edge example: include filter only if relation is verified in current graph
"$MCPC" @nexi-graphify-live tools-call get_neighbors \
  '{"node_id":"backend::src_binary_binary_service_binaryservice","relation_filter":"calls","token_budget":1200}'

# Replace EXPLICIT_SOURCE_ID and EXPLICIT_TARGET_ID with returned source IDs.
"$MCPC" @nexi-graphify-live tools-call shortest_path \
  '{"source":"EXPLICIT_SOURCE_ID","target":"EXPLICIT_TARGET_ID","max_hops":8,"undirected":false}'

"$MCPC" @nexi-graphify-live tools-call god_nodes '{"top_n":25}'
"$MCPC" @nexi-graphify-live tools-call get_community '{"community_id":0,"token_budget":1000}'
```

For a non-default graph, `project_path` must be a **permitted absolute project directory** containing `graphify-out/graph.json`. Do not pass the raw graph filename as a project path or redirect the canonical session to Knowledge v4 accidentally. There is **no official MCP `affected` or `--seed` parity**; use the installed CLI for those responsibilities.

## 4A. Advanced CLI/MCP selection matrix and actual edge semantics

**Always use existing `graphify` CLI or `/usr/local/bin/nexi-mcpc`; never treat historical `/graphify` slash skills or `worker0-*` wrappers as native commands.** Before new command flags: check the installed `graphify --help` and local `tools-get`. CLI and MCP use different default depths (`query` 2 unless `.graphifyrc`, MCP `query_graph` 3), and MCP cannot express a CLI exact `--seed` or CLI `affected` operation.

| Goal | Correct existing interface | Evidence requirement |
|---|---|---|
| Broad subsystem discovery | CLI `query` or MCP `query_graph` | Record seed labels, reached/displayed/truncated and graph identity |
| Exact owner | MCP `get_node` or CLI `explain --all` | ID, file:line, declared role, current source confirmation |
| Focused neighborhood | CLI `query --seed ID --depth N` or MCP `get_neighbors` | Edge directions, stored relation, provenance, all material consumers |
| Actual direction between two nodes | CLI `path A B --graph ...` or MCP `shortest_path` | A path is one path only; inspect each typed hop and possible alternative branches |
| Reverse dependencies | CLI `affected ID --depth N [--relation R...]` | Explicit relation inventory; builtin defaults are not exhaustive for custom relations |
| Structural hubs | CLI `god-nodes --json` / MCP `god_nodes` | Centrality is not proof of correctness, importance or defect severity |
| Community boundaries | MCP `get_community`, existing graph community labels | Communities are clustering outputs, not framework modules or security zones |
| Parallel-edge / self-loop risk | CLI `diagnose multigraph --json` | Diagnose and adjudicate; never auto-patch or simplify to undirected graph |
| PR review only | `graphify prs`, MCP `list_prs/get_pr_impact/triage_prs` | Optional, does not answer source-wide correctness alone |
| Visualization appendix | `export callflow-html`, `tree`, `export graphml/wiki` | Output-producing commands; separate destination and permission; visualization truncation ≠ full graph |

**Filtering precision:** `query --context` / MCP `query_graph.context_filter` is an *edge-context* filter, while `affected --relation` / MCP `get_neighbors.relation_filter` uses relation names; they are not interchangeable. For heterogeneous paths (e.g. `http_calls` → `http_handled_by` → `resolves_injected_provider` → `writes_model`), a single-relation reverse query can suppress required segments. Use segmented paths and confirm each role from source. `get_neighbors` may include both directions; inspect incoming/outgoing explicitly.

**Graph reachability traps:** The canonical merged graph's serialized `directed` flag and logical edge provenance/direction can differ. The `graphify path` help explicitly says directed search is default even when JSON `directed` flag says otherwise. Do not load it into plain undirected NetworkX and infer consumers, or compute source correctness from connected-component counts. `--undirected` is for discovery only.

**Optional formal analysis:** SCC/WCC, articulation points, exact all-path enumeration, cut sets, PageRank or alternative-route coverage are not dedicated native Graphify v0.9.105 CLI or local MCP commands. If explicitly required, report the supported-command gap and seek a separately scoped method; never manufacture an `omnipotent` subcommand. Historic Multi-View L0 Locate/L1 Impact/L2 Multi-View/L3 Omnipotent are reasoning stages; `--depth N` is independent graph-hop depth.

## 5. Framework and external contract knowledge — source-first checklist

For every framework family below, independently enumerate expected source contracts from the manifest, code/config and owner-defined requirements. Graphify can prove extracted topology but not complete intended semantics. Primary reference links are in §13.

### 5.1 Backend: NestJS 12 DI, module, guard, controller and scheduling

**Expected chain:** root `AppModule` imports → feature module registration → controllers/providers/exports/imports → DI tokens/factories → guards/permissions/pipes/DTOs → service invocation → durable ownership → response/outbox/event. Inspect `@Module` arrays, module imports/exports, `@Inject()` tokens, factory registrations, middleware/guards, interceptors, scheduler/worker registration and provider lifetimes. A TypeScript `imports` edge is not Nest DI registration evidence. Controllers and providers can exist as source without being reachable from the application module. `@nestjs/schedule` needs module registration and scheduler ownership rather than a mere cron decorator.

**Graph relations:** `declares_module`, `nest_imports_module`, `module_declares`, `declares_nest_metadata`, `references_provider_token`, `resolves_injected_provider`, `factory_injects_token`, `references_resolved_symbol`. **Unknowns:** dynamic modules, conditional DI, reflection, string tokens, factories, runtime config.

**Recommended evidence:** `APP_MODULE | FEATURE_MODULE | PROVIDER/TOKEN | CONSUMER | SOURCE:LINE | RELATION | EXPECTED EXPORT | RESOLVED/UNKNOWN`.

### 5.2 Public: Next.js 16 App Router, React 19 and route/data security

**Expected chain:** App Router page/layout/route handler → server/client boundary → user/auth-specific loader or API client → DTO/guard → Backend handler → response mapping → React render/state/query invalidation. Check `use client`, server-only code, Next route handlers, env variable exposure, fetch/cache directives, private-account caching isolation, `@tanstack/react-query` key/invalidation and mobile navigation/layout. Route filenames do not prove rendered components' effect; private wallet/financial responses require user-scoped cache and explicit authorization.

**Graph relations:** `declares_next_route`, `references_import_source`, `references_resolved_symbol`, `renders_external_component_package`, `http_calls` plus HTTP normalized operation relationships.

**Source-only mobile constraints:** 320/360/390/412/430 CSS px target geometry, safe-area navigation, WCAG 2.2 reflow/resize, financial values without truncation; visual verification deferred. Preserve seven market timeframes and chart indicators MA/EMA/BOLL/RSI/MACD/VOL as app contract if present in current owner scope.

### 5.3 Admin: TanStack Router + TanStack Start + Vite 8 + Nitro 3 beta

**Expected chain:** file route or route tree → `beforeLoad`, loader, client component or mutation → **server function versus server route** → validation/authorization and API client → Backend handler → response serializer → Admin state/query invalidation. TanStack Start's official docs clarify that loaders may run on server **and client**; sensitive persistence must live behind `createServerFn` or dedicated server-only modules. Server functions are application RPC, server routes are externally callable HTTP endpoints. Do not assume `beforeLoad` UX protection replaces server authorization. Audit Vite/Nitro server entry points and deployment adapter config as source-only interface declarations.

**Graph relations:** `declares_tanstack_route`, import/symbol relations, normalized HTTP calls/handlers, Admin→Backend exact joins; inspect dynamic loader/server function paths that static HTTP matching may not model.

**Package caveat:** Vite, TanStack Start and Nitro versions in manifest may be pre-release or semver ranges; verify actual lockfile-resolved versions before relying on a particular APIs. Avoid Next.js-specific instructions.

### 5.3A Additional TanStack server-boundary source checks (current official guidance, version-guarded)

TanStack Start's documented `createServerFn` exposes a same-origin application RPC boundary; *server routes* are the separately accessible HTTP endpoint mechanism. Inspect `src/start.ts`, `createCsrfMiddleware` behavior, server-function validators, handler auth, file-based `server.handlers`, serialization of identities/status/decimal fields and server-only imports. Do not automatically assume that the absence of a `src/start.ts` file removes CSRF protection; first determine whether framework defaults apply. Conversely, a declared custom `src/start.ts` requires explicit inspection of middleware composition. Audit whether SSR `loader` can execute on both client/server and whether authorization is performed at the real effect owner. This information comes from current TanStack docs and must be checked against NEXI's pinned dependency version and actual code before reporting a gap.

Query keys must include all data-defining identity/market/timeframe inputs; mutations must have the correct invalidation/refetch path; WebSocket reconnection should reconcile with durable state. UI route guards do not replace server guards. Generated `routeTree.gen.ts` is a derived artifact, not a recommended manual-edit source.

### 5.4 HTTP and API contract boundary

An expected edge is keyed by `surface + method + normalized_path + request/response schema + auth policy + status/error semantics`, **not a path string alone**. Build a source-derived inventory from Backend controllers and Public/Admin clients, then compare actual decorated methods and route composition, base prefix, query/path/body validation, DTOs, serialization, error codes, finance enums and admin/public access permissions. Classify exact vs inferred route joins separately.

**Graph evidence:** `http_calls`, `http_handled_by`, `http_route_delegation`, and source's operation nodes. Only 167 exact joins at the observed checkpoint. **14 client-only and 119 handler-only are investigation queues**, not automatic bugs. External-provider clients, intentionally private Admin endpoints, unused feature handlers, dynamic routes and bootstrap routes can be legitimate.

**API Documentation Checker plugin:** use it only after collecting an actual explicit OpenAPI/schema/interface contract and relevant written documentation; run `extract_api_contract`, `check_api_documentation_coverage`, or `compare_api_contract_versions` against explicit endpoint/method/field details. A prose-only sample was tried in this research and correctly returned `not_evaluated`/0 items: do not count that as proof of coverage. The plugin does not inspect runtime services or replace graph/source analysis.

### 5.5 Prisma 7 + better-sqlite3 / SQLite durability

**Expected chain:** authoritative financial policy/service → transaction boundary → Prisma models and adapter → LedgerAccount/LedgerPosting + EventOutbox/EventInbox + durable journal state. Audit `schema.prisma` model relations/uniques, migration history **read-only**, adapter initialization, source reads/writes, numeric precision/rounding, idempotency keys, status transitions, durable outbox ownership, transaction ownership and restoration/replay semantics. There must be one authorized financial writer, not parallel DB mutation from UI, job transport or Admin controllers.

**Relations:** `declares_sql_table`, `maps_to_table`, `declares_field`, `prisma_relation_target`, `reads_model`, `writes_model`, `reads_table`, `writes_table`. **Caveat:** `reads_model`/`writes_model` are structural statements; they do not prove transactional atomicity. Use current Prisma **7.10.1** actual client usage; newer docs are not a license to rewrite APIs.

### 5.6 BullMQ 6, Aiven Valkey, durable queues and journal

**Expected chain:** durable outbox/journal transaction → queue transport producer → matching queue name → BullMQ worker/processor → job-name/payload validation → idempotent effect owner → state/readback/outbox disposition. Inspect retries, stalled-job replay, job identity, concurrency, dead-letter-like terminal path where implemented, inbox deduplication and failure semantics. BullMQ docs state workers may retry stalled jobs; **the effect must remain idempotent**. Queue transport is not financial truth.

**Relations:** `declares_producer_queue`, `declares_worker_queue`, `enqueues_job_name`, `journals_for_queue_name`, `bull_source_declares_matching_queue_prefix`, `transport_declares_queue_candidate`, `refers_to_queue_name`, `references_stream`. `queue_candidate` edges need corroboration by actual source naming/registration.

### 5.7 Socket.IO 4, Redis Streams adapter, UI realtime and reconciliation

**Expected chain:** state owner/provider → event producer → namespace/room/auth → event name/schema/version → Redis Streams adapter or configured transport → Public/Admin listener → cache invalidation/REST resnapshot/reconnect behavior. Source-level emitter/listener names can match while namespaces, rooms or authentication prevent delivery. Socket event candidates are not guaranteed executed subscriptions. Direct WS clients, SignalR packages and legacy code should be inventoried and classified as actual, historical or unused.

**Relations:** `emits_event`, `listens_for_event`, `socket_event_candidate`, `references_stream`, `declares_provider_target`. Classify a missing `emit`→`listen` path by source context, not simply graph disconnectedness.

### 5.8 SIWE, Ethereum mainnet, wallet/session policy

**Expected chain:** dedicated wallet's connect/challenge → nonce/domain/URI/expiry/chain validation → signature verification → account/session issuance → guard identity → wallet/portfolio action eligibility → logout/session recovery and invalidation. NEXI authority is **chain ID 1**; historical Sepolia workflows are retired. Cross-check wagmi/viem/RainbowKit Public wiring against Backend SIWE/parser/guard logic and Admin read policies. Graph imports do not prove signatures, replay defense or session correctness. Actual wallet browser verification is deferred.

### 5.9 Nginx/VPS, process boundaries and external adapters

**Expected chain:** hostname/path routing configuration → service listener/base prefix → Backend/Public/Admin entry points; environment variable source and secrets boundaries, WebSocket upgrade forwarding, CORS/cookies, Sentry release attribution, provider market feed dependency and retries. Treat current config files as source; do not probe live endpoints or restart services in this stage. Retired Cloudflare Worker/D1 names in source require classification by actual call path, not assumptions from filenames. The graph is a source relationship graph, not an automatic proof of Nginx runtime routes or external API availability.

### 5.10 Functional domains and authoritative state

A **domain flow** has more than import relationships. Independently enumerate each owner's expected entry, guard, policy, state transition, durable effect, event and readbacks:

| Domain | Essential cross-framework questions |
|---|---|
| SIWE/auth | Nonce/domain/chain challenge → verify → session guard → public/admin identity; invalidation, replay, rejected chain |
| Wallet/portfolio | Authorized balance source → Ledger/read model → Public UI; no inconsistent front-end derived accounting |
| Deposits / withdrawals / transfers | Eligibility/configuration → approved mutation → Ledger/outbox → activity/fees/status → Admin/Public readbacks; no external execution during audit |
| Binary/options | Admin duration/payout/min/max config → Public 5-duration boxes → open position → expiry scheduling → settlement provider → Ledger terminal outcome → Admin/Public/realtime state |
| Spot | Market pricing/order lifecycle → reserves/notional/fill meaning → Ledger postings → order list and history |
| Margin | Collateral/reserve/position/liquidation source → jobs and policy → durable accounting → UI interpretation |
| Convert | Quote/expiry/execute idempotency → atomic Ledger and activity → Public/Admin history |
| Mining | Plan/rate/unit/entitlement → subscription activation → durable crediting → Admin/Public agreement |
| Loans | Eligibility/collateral reference/rate unit → approval/repayment schedule → Ledger postings/status → UI |
| VIP/referral/settings | Admin governance/persistence → Public configuration and protected account views; no stale contradictory defaults |
| Markets/charts | Provider/normalization → price and kline intervals → realtime feed → UI controls, freshness, fallbacks |

Owner-specified options (five durations 30/60/180/280/420 seconds, 53 canonical instruments, seven intervals) are historical recorded contractual expectations; confirm current owner/current source before labeling a deviation a source gap.

## 6. Custom relationship families to include explicitly

The custom extractor emits many relation families outside Graphify's default call/import model. The current report has these **observed edge counts**, which are *not* a complete traversal specification:

| Family | Actual relation names and observed counts |
|---|---|
| Module/DI | `declares_module` 30; `module_declares` 281; `nest_imports_module` 104; `declares_nest_metadata` 336; `references_provider_token` 817; `resolves_injected_provider` 164; `factory_injects_token` 1 |
| Source/import | `references_import_source` 148; `references_imported_symbol` 1469; `references_resolved_symbol` 889; `declares_source_symbol` 117 |
| Relational storage | `declares_sql_table` 103; `maps_to_table` 98; `declares_field` 1237; `prisma_relation_target` 170; `reads_model` 129; `writes_model` 64; `reads_table` 2; `writes_table` 345 |
| Queue/journal | `declares_producer_queue` 6; `declares_worker_queue` 3; `enqueues_job_name` 1; `journals_for_queue_name` 7; `bull_source_declares_matching_queue_prefix` 3; `transport_declares_queue_candidate` 3; `refers_to_queue_name` 1 |
| Events/stream | `emits_event` 7; `listens_for_event` 25; `socket_event_candidate` 6; `references_stream` 3 |
| Routing/UI | `declares_next_route` 24; `declares_tanstack_route` 35; `renders_external_component_package` 234; HTTP operation/call/handler edges from normalized route extraction |
| Topology scaffolding | `contains_nexi_operation` 2553; `has_nexi_operation` 3583; `configures_reference` 4; `declares_infrastructure` 4 |

**Interpretation:** relation names matter, but *edge direction and meaning must be checked*. E.g. `contains_nexi_operation` is containment, not a network call; `writes_model` is a declared writer site, not proof of transaction commit; `socket_event_candidate` is a candidate, not a confirmed delivered message. The reporter's `nexi_unresolved_operations=68` needs explicit taxonomy and a source-grounded outcome per record.

## 6A. Expected-contract completeness and anti-circular proof

A **graph-derived contract list cannot be the denominator for graph coverage**. Build an independent inventory from: `package.json`/lockfile resolved version; current route trees and backend decorated controllers; actual callsites; `@Module` registration/DI exports; Prisma schema and writer callsites; worker/queue declarations and job names; socket emit/listen names and namespaces; state transition definitions; Nginx/VPS routes; owner rules. Categorize by `(contract kind, producer, consumer, identifier, version/state semantics)`. Merge true duplicates with stable IDs; preserve separate security roles, methods and state transitions even if they share a URL.

**Reconciliation worksheet:**

| Universe | Denominator definition | Required mismatch classes |
|---|---|---|
| Framework packages/config | All applicable declared framework/adapter/integration configurations | package absent, unresolved/unused, version mismatch, historical naming |
| Source declarations | Every expected, applicable owner-declared route/provider/job/event/model/state change | expected-but-not-extracted, extracted-without-current-source, dynamic-only |
| Cross-surface HTTP | Every in-scope source-declared client call or required consumer-to-handler pair | exact, inferred-only, client-only, handler-only/intentional, external, unknown |
| Durable financial effects | Every required value-changing command and terminal transition | single-writer, transaction, outbox/inbox, idempotency, precision, reversal semantics |
| Realtime/event/queue | Every required producer/consumer **contract** (not mere event name strings) | wrong queue/name/schema/namespace, missing handler, replay/consumer group ambiguity |
| UI readback | Every required Admin/Public state/projection dependency | stale fallback, wrong status mapping, invalidation/reconnect omission, intentionally read-only |

Use an explicit confidence ledger: `EXPECTED_SOURCE_DECLARATION`, `GRAPH_EXTRACTED_EDGE`, `GRAPH_INFERRED_EDGE`, `CURRENT_SOURCE_CORROBORATION`, `OWNER_REQUIREMENT`, `EXTERNAL/UNKNOWN`. A graph edge with `EXTRACTED` confidence can be verified as **declared source topology**, but not as a successful executed effect. Record null/missing counts separately from zero. A contract with absent graph edges but correct current source may be an **EXTRACTOR_COVERAGE_GAP** and not an application source defect.

### 6A.1 Coverage calculations and category gates

Let `E` be explicitly enumerated applicable expected contracts; partition each unique contract into `C=SOURCE_CONNECTED`, `G=PROVEN_SOURCE_GAP`, `U=INSUFFICIENT_EVIDENCE`; exclude owner-confirmed N/A from `E`. Require `|E|=C+G+U` exactly and list actual contract IDs. Source-connected fraction is `C/|E|` only if `|E|>0`; if `|E|=0`, report **not measurable**, never 100%. Also report `G/|E|` and `U/|E|`. Separate **graph capture coverage** from **source contract agreement** (a source-connected contract may rely on direct source proof despite an extractor gap). Do not aggregate unlike frameworks without keeping per-framework denominators; do not interpret this as operational or test pass rate.

For original 113 source-closure criteria, map applicable `SOURCE_CONNECTED` evidence to the existing `SOURCE_IMPLEMENTED` disposition only after all criterion clauses are evidenced. A current audit `SOURCE_CONNECTED` row can be one dependency of a criterion, not proof of the criterion as a whole. `DEFERRED_BY_OWNER_SOURCE_FIRST_RULE` is a separate verification-phase flag, not an alternative to a missing source disposition.

### 6A.2 Graph coverage escalation decision

1. Does the current manifest include the exact source file? If no: extraction coverage unknown; check ignore/generated/external boundaries.
2. Is the expected symbol/operation represented in the canonical merged graph? If no: source confirmed + graph absent => record extractor gap, not app bug.
3. Is the relation direction/identity unambiguous? If no: use exact ID, source location, alternate caller/consumer and relation-specific query.
4. Is the source contract semantically complete end-to-end? If no: classify source defect **only** with current producer and consumer evidence.
5. Does proving it require actual request/job/database/wallet behavior? If yes: source status remains as supported and runtime status is deferred; do not execute the app.

## 7. Full architecture audit procedure — step-by-step

### Phase A — Authority and non-mutating preflight

**Input:** owner objective “fully map whether every framework is correctly connected”; no app edits or app verification. **Actions:** verify runbook authority, `AGENTS.md`, HEAD/current writers, source files from canonical manifests, graph checksum/freshness and current tool schemas. Read scope/reconciliation evidence to avoid repeating existing closure. Query Kernel `source-map` for exact architectural families; this is a Knowledge-first reference gate, not permission to begin application tests.

```bash
ROOT=/home/mellonelay1999/workspaces/Nexi
K=/home/mellonelay1999/.local/share/sentinelx-vm-kernel/sx_kernel.py
/usr/bin/python3 "$K" source-map --question \
 'NestJS Public Next.js Admin TanStack Prisma SQLite BullMQ Valkey Socket.IO producer consumer framework contracts'
```

**Gate:** if graph checksum/manifest does not reflect relevant current source, classify `GRAPH_STALE_FOR_SCOPE`; use graph only to locate, inspect current source directly and request separate graph-maintenance approval if necessary. Do not regenerate by default. **Deliver:** baseline/fingerprint table and source coverage boundary.

### Phase B — Independently enumerate expected contracts

From actual root/module/route/schema/client/queue/handler declarations, construct a **source-derived** ledger. Enumerate all known route bindings (client and handler), providers and module exports, Prisma model read/write sites, queue names/worker registrations, Socket.IO event emission/listeners, wallet/auth interfaces, state transitions and deployment proxies. Include intentional external/standalone endpoints and feature flags so that “no connection” can be `NOT_APPLICABLE` rather than a false defect. Reconcile expected inventory against source manifest/graph operations; do **not** derive the denominator from graph edges alone.

**Deliver:** row IDs, owner, producers, consumers, auth, schema, contract kind, expected boundary and source file:line.

### Phase C — Graph-wide structural survey

Use **read-only** `graph_stats`, `god_nodes`, `get_community`, CLI `god-nodes`, and `diagnose multigraph`. Review canonical report and all 68 unresolved records by mechanism. Identify hubs, disconnected/isolated regions and possible duplicate names; do not assume one global connected component is desirable. Graphify CLI/MCPC do **not** provide a dedicated official command for exact SCC/WCC, articulation points or PageRank; label these `NOT_AVAILABLE_IN_CLI_MCPC` under the “CLI/MCPC only” restriction instead of fabricating functionality. `diagnose multigraph` covers one specific integrity question; does not replace exhaustive graph-theory algorithms.

**Deliver:** graph health, capture families, source manifest coverage, limited hub/community catalogue and unresolved queue.

### Phase D — Graphify Multi-View analysis by expected contract

1. **Locate:** natural-English query for one named architectural contract. Check actual seeds and header; if loose, refine keywords or CLI `--seed` known exact ID.
2. **Identity:** `get_node` or CLI `explain` until the producer and consumer are unambiguous, with source path and location.
3. **Impact:** `get_neighbors`/`explain --all`, `affected` with applicable stored relations; identify incoming and outgoing typed edges separately.
4. **Multi-hop:** use bounded query depth 2–6, `shortest_path`/CLI `path` for concrete pairs; where a chain mixes relation types, trace successive source-to-target segments with correct filters rather than demanding one relation for the entire path.
5. **Native framework view:** correlate framework-specific NEXI relations with actual Nest/Prisma/queue/TanStack/Next/Socket source registration rather than generating another graph.
6. **Whole-graph perspective when needed:** inspect multiple communities/hubs/diagnostics to find unexpected dependencies; avoid invented full-network computations. Observation/runtime perspective deferred.
7. **Source adjudication:** verify every consequential edge/payload/guard/transaction/authorization in current source and identify dynamic/unextracted behavior. Record contradictory evidence.

**Deliver:** per-contract chain of `(node_id, relation, direction, confidence, source:line)` plus all required semantic fields and classification.

### Phase E — Dynamic and unknown boundary reconciliation

Classify every unresolved operation into exactly one of: `DYNAMIC_PATH`, `ENV_OR_FEATURE_FLAG`, `CROSS_REPO_OR_EXTERNAL`, `PROXY_OR_ALIAS`, `CLIENT_ONLY_VALID`, `HANDLER_ONLY_VALID`, `EXTRACTOR_UNSUPPORTED`, `STALE_GRAPH`, `SOURCE_CONTRACT_MISMATCH`, `UNCONFIRMED`. Use live source/manifest to confirm; never assign a defect merely because `path` says no route. Validate method/path alias and literal normalized prefix, DTO/schema and status meanings. The 14 client-only, 119 handler-only and 68 semantic unknown measures are starting source-extraction findings; these categories may overlap and must not be blindly summed into a defect count.

### Phase F — Risk-focused causal review

For source-confirmed mismatches, trace **producer owner before consumers**. Check duplicate financial writer risk, idempotency collisions, orphan queue producers/workers, route authorization gaps, wrong readback semantics, event names without proper namespace or listener, unavailable source-only providers and unrelated UI fallbacks. Apply Anti-Slop/root-fix review to avoid patching every page separately. The audit **reports** a repair frontier and does not perform source repairs unless separately authorized.

### Phase G — Complete the coverage matrix and sign-off

For every expected contract, produce a single row and evidence. Do not close a row without inspected owner source and matching consumer evidence. Cross-reference matching 113 acceptance rows as supplementary identifiers; retain uncovered framework-specific work even without an acceptance ID.

**Disposition taxonomy (architecture audit):**

- `SOURCE_CONNECTED`: Source declares an intended producer-to-consumer contract and the required relevant edges/semantics can be corroborated.
- `PROVEN_SOURCE_GAP`: Direct current-source evidence proves a missing, conflicting or unguarded contract. Provide exact files/lines and why the contract is required.
- `INSUFFICIENT_EVIDENCE`: Dynamic or external dependency, stale graph, unreviewed path or undetermined ownership; specify next source evidence.
- `NOT_APPLICABLE`: Independent intentional architecture boundary, validated with owner/source requirements.
- `DEFERRED_BY_OWNER_SOURCE_FIRST_RULE`: Runtime delivery/execution/acceptance cannot be asserted in current phase. Can coexist with source-connected status.

**Source coverage metric (optional, only after actual audit):** `source_connected / (source_connected + proven_gap + insufficient_evidence)` for the **explicitly enumerated applicable contracts**; preserve each category separately and do not count `NOT_APPLICABLE` or runtime-deferred work as source failures. Never present this as runtime test pass rate. Numerators/denominators must be auditable; no synthetic coverage percentages.

## 8. Evidence schema and file outputs

### 8.1 Minimum record (CSV/JSON or human-readable matrix)

```text
contract_id
owner_defined_requirement / source_definition
source_root, framework, domain, surface, contract_kind
producer_node_id + file:line
consumer_node_id(s) + file:line
expected_role + required_direction + authorization/identity
actual graph_edge_relation(s) + source/target + provenance
query_method + exact CLI/MCPC args + budget/depth + reached/displayed/truncated
current source corroboration + source hash or revision
dynamic_or_external_unknowns
contract_semantics: method/path, DTO, event/queue name, status, amount/precision, etc.
architecture_disposition + reasoning + next_source_proof
app_verification=DEFERRED_BY_OWNER_SOURCE_FIRST_RULE
```

### 8.2 Recommended output files (when future audit authorized)

- `NEXI_FRAMEWORK_INVENTORY_<date>.md`: independent framework/version inventory and source-root reference map.
- `NEXI_EXPECTED_CONTRACTS_<date>.csv`: canonical expected producer-to-consumer contract denominator.
- `NEXI_GRAPH_RELATION_COVERAGE_<date>.md`: relation families, graph health, extraction and source-manifest mismatches.
- `NEXI_CONNECTIVITY_MATRIX_<date>.csv`: all contract rows and dispositions, traceable source identifiers.
- `NEXI_SOURCE_GAPS_<date>.md`: only proven source discrepancies, grouped by causal owner and impact.
- `NEXI_UNKNOWN_BOUNDARIES_<date>.md`: unresolved dynamic/static/external cases and precise next evidence.
- `NEXI_AUDIT_HANDOFF_<date>.md`: graph hash/HEAD, completed evidence, blockers, owners, next source frontier.

These are **proposed names**, not pre-existing or generated VM files. Do not overwrite current `tasks` receipts without authorizing the audit artifact destination.

## 9. Why a graph path alone can be misleading

- **Graph capture:** missing source, static analyzer blind spots, non-import dynamic registration and feature flags can eliminate real connections from graph evidence.
- **Seed selection:** plain-English queries match node tokens/labels/attributes; they are not exhaustive LLM semantic execution of the entire system.
- **Traversal:** BFS/DFS depth and graph direction determine the reached subgraph; no one query necessarily reaches all components.
- **Output:** budgets truncate display; explicitly state reached vs displayed counts; do not treat omitted rows as missing edges.
- **Direction:** graph neighbors may show incoming and outgoing relationships together; directed `path` and exact relation direction needed for caller/consumer assertions.
- **Shortest path:** one shortest relation sequence is not all possible fallback, retry or authorization paths; business flow may branch.
- **Provenance:** EXTRACTED means source-declared, not live; INFERRED means resolver candidate, not proof; AMBIGUOUS requires disambiguation. The recorded canonical artifact has graph `directed=false` and diagnostic reported 7 self-loops; logical dependency direction may be carried in edge attributes and CLI path handling. Do not naïvely use undirected NetworkX reachability as causal proof.
- **Multi-edges:** `diagnose multigraph` read-only result in a previous inspection reported zero same-endpoint collapses and 7 self-loops; self-loops need semantic adjudication, not automatic patching.
- **Queue and sockets:** static emitter/worker edges do not prove authorization, processing, delivery, retries, reconnection or reads after commit.
- **Finance:** matching Ledger imports does not prove a transaction, exactly-once effect, precision, missing posting or status correctness.
- **Admin/Public:** two client modules can target a similarly named backend route but disagree on method/DTO/auth; source contract comparison is necessary.
- **Derived exports:** graph.html visualization may limit displayed nodes; not equal to entire JSON.

## 10. Failure/recovery decision table

| Symptom | Correct response | Prohibited shortcut |
|---|---|---|
| `graphify query` empty (exit 4) | Exact label/ID from source or another query; inspect coverage | Declare service unconnected |
| Ambiguous name (exit 3) | Select source-qualified ID and get_node | Pick first match |
| Query truncated | Narrow seed, increase bounded budget, record reached/displayed | Ignore unprinted relevant nodes |
| CLI and MCPC disagree | Check selected graph project, depth, version/config and shell identity | Assume both are same endpoint |
| Custom reverse impact missing | Inspect real relation taxonomy and use explicit `--relation` as appropriate | Only default `affected`, then claim independent consumer |
| Missing exact HTTP join | Compare method/path/prefix/client, classify dynamic/external/intentional | Directly treat 14 client-only or 119 handler-only as bugs |
| Graph HEAD matches but source untracked | Compare scope-specific manifest and current files | Assert complete graph freshness |
| Source path uses legacy D1/Cloudflare name | Trace current producer/consumer/runtime configuration | Restore deprecated infrastructure based on name |
| Different docs API from installed version | Prefer current manifest/lockfile and version-specific primary docs | Copy Prisma ORM 8 API into Prisma 7 repository |
| Question exceeds graph's capabilities | Mark unknown or separately approved external analysis | Invent native Graphify SCC/PageRank command |
| Unexpected need for app verification | Explicitly defer runtime evidence by owner phase rule | Run tests, build, browser, service restart or live financial operation |

## 11. Knowledge, external research and plugin selection

| Owner | When to call | What to record / boundary |
|---|---|---|
| `@nexi-knowledge` | Each genuinely new source/architecture contract via Kernel `source-map`; full reference when needed | Exact file:line, framework version, verified guidance, applicability to current source |
| `@nexi-graphify-live` | Primary topology discovery and exact symbol relationship inspection | Actual node ID, edge, confidence, tool schema, budget/depth, graph identity |
| SentinelX | Authorized read-only VM file/source/graph/Kernel calls | Host capabilities, current checkout and real tool result; not proof of app runtime |
| Context7 | Framework/API syntax/version uncertainty | Resolved library ID, version, source snippets and differences from actual NEXI deps |
| Exa/web research | Current official docs, GitHub source, unclear extractor methods/limitations | Direct URL, author/version/date if available; independent source vs suggestion |
| Data (`build-report` / `validate-data`) | Inspectable coverage counts, classification logic and report evidence | Denominators, duplicates, missingness, category consistency; no invented coverage percentages |
| API Documentation Checker | Concrete supplied OpenAPI, DTO or explicit HTTP contract and documentation | Items explicitly covered/partial/missing; it does not infer dynamic routes or test APIs |
| Agent Skills / Anti-Slop | Architecture evidence boundaries and causal-owner review | Skill was read/applied, exact method and results; no automatic controller change |
| Reef | Only future recurring feedback-driven optimization of this audit harness | Separate approved Serve→Observe→Grow→Commit system; **not** required for one-off audit |
| Wolfram / MCP Conduct Register | Only for a genuine graph-theory computation or public MCP server conduct question | Not a replacement for NEXI Graphify graph nor local stdio correctness audit |

**API Documentation Checker applicability observation:** A supplied prose TanStack Start `GET /hello` example (from official documentation) was compared against a prose restatement, and the tool returned `not_evaluated` with `0` extracted items. This is not an API coverage pass. Future use requires a concrete sufficiently structured explicit API contract and docs.

## 12. Ready-to-use investigation questions

These natural-language questions are *starting prompts*, not claims that a graph already contains full answers. Choose one question family at a time and scope by actual node ID; repeat until the independent contract inventory is exhausted.

### Backend modules/DI
- Which root and feature modules register each financial controller and settlement provider, and which module exports each injected provider?
- Which provider tokens resolve to multiple candidate implementations, and which are supplied only by a dynamic or factory module?
- Are every scheduler/processor and their imports reachable through the intended application module registrations?
- Which modules consume Ledger/policy ownership, and which code paths directly instantiate or duplicate it?

### HTTP and UI
- For each Admin financial API call, what is the exact method/path/guard/DTO/controller/service and response mapper?
- Which Public wallet and order pages invoke operations whose methods/DTOs are absent or mismatched in Backend?
- Which Next route handlers are server-only, and which user-specific fetches could leak across shared cache keys?
- Which TanStack loaders or server functions cross a server boundary, and are auth inputs validated server-side?
- Which HTTP operations are client-only/handler-only by design versus dynamic normalization or missing implementation?

### Durable finance
- Which services can write `LedgerPosting`, and which are the authorized single-writer entry points?
- For every balance mutation, is the durable Ledger and Outbox updated under the same intended atomic boundary?
- Which event replay or BullMQ retry paths can re-enter a financial write, and what source idempotency key prevents duplicate effects?
- Do Admin and Public readbacks share status and precision semantics for pending, posted, failed and reversed outcomes?

### Queues, events, realtime
- Which BullMQ producers declare queue X and which workers bind the same queue and job name?
- Which journal entries correspond to enqueued jobs, what durable retry/recovery path exists, and which worker owns effects?
- For every emitted Socket.IO event, which namespace, rooms and client handlers consume it and trigger durable resnapshot?
- Are any Redis/Valkey streams referred to by source without matched producer, consumer or clear transport ownership?

### Wallet, markets and business flows
- How does Ethereum-mainnet SIWE challenge and verify lead to session guards and wallet permissions?
- What is the complete binary expiry → scheduler → settlement → Ledger → Outbox → readback chain?
- Which market provider supplies price/klines and where are fallbacks, freshness and timeframe parameters normalized?
- For each mining, loan, convert, spot and margin action, which service declares state transitions and which UI consumers use their status?

### Graph completeness
- Which current source declarations are missing from `graphify-out/graph.json` according to the extraction manifest?
- Which 68 unresolved semantic operations reflect dynamic identities versus detectable source contracts?
- Which high-degree hubs/communities are intentional shared infrastructure and which risk hidden coupling?
- Are all expected contracts adjudicated, including negative cases, or is the denominator only what Graphify happened to discover?

## 12A. Specialized external methodology and plugin audit outcomes

**Vibe Coding Library (actual retrieval performed for this revision):** `integration-map`, `ownership-invariant-map`, and `traceability-map` workflows version 1.6.1. Their useful operating contract is: identify rule/source owner, map direct producers/consumers and failure boundaries, distinguish evidence from hypotheses and keep the user's requested scope. These workflows are *instructions only*; do not claim their retrieval ran a repository audit or app checks. Link their output schemas into Phase B and Phase G; no new controller or tracker is needed.

**TanStack official plugin (actual docs read):** `tanstack_docs` for Start server functions, including same-origin request origin/CSRF handling and explicit custom `src/start.ts` middleware. Use for the Admin source-boundary checklist and reject a generic `beforeLoad`-equals-auth assumption. No application commands or builds were invoked.

**MCP Conduct Register (actual conditions read):** examines public MCP HTTP endpoint conformance/disclosures/determinism, not the correctness of a locally connected Graphify stdio source graph. Keep it *out of the mandatory audit execution path*; add only if an authorized new public server enters scope.

**Wolfram (context retrieval performed):** general mathematical tooling does not substitute for direct NEXI graph or source evidence. Do not claim that a Wolfram computation analyzed the 12,076-node graph; no graph was supplied to Wolfram. Use optional formal definitions only when exact bounded graph data are available and need an independently calculated result.

**Wayfinder (instructions read):** planning/decision ticket map is not required for this already-scoped standalone preparation. Its research preference for primary-source evidence improves reference selection; do not initialize issue trackers or delegate background engineering work in Normal Chat.

**Reef (instructions read):** its repeated-feedback improvement loop is not needed for a one-time source-connectivity audit; do not assume a Reef runtime is present. Could be considered in a separate owner-approved future harness-improvement initiative with measured false positive/negative classifications.

**Anti-Slop and decision guard (instructions read):** use directly observed graph metrics and current source before building derived coverage metrics, forbid duplicate graph producers or extra financial writers, and reject completion claims unsupported by exact evidence. Do not turn audit findings into unrequested patches.

## 13. Source and reference bibliography

### Primary NEXI documents and live evidence

- Attached complete `NEXI_NORMAL_CHAT_GRAPHIFY_VM_KERNEL_RUNBOOK_v3.4_20261111(1).md`, lines 1–163; source-first authority and CLI/MCPC routing.
- Attached `NEXI_GRAPHIFY_CLI_LOCAL_MCP_UTILIZATION_GUIDE_20261110.md`, 175 lines; CLI and local MCP usage.
- Attached `NEXI_Graphify_Query_Completeness_Runbook_Gap_Audit_20261113.md`, 173 lines; earlier command/coverage assessment (not current source authority).
- Attached `graphify-multiview.zip`; 13 ZIP entries, historic L0 Locate/L1 Impact/L2 Multi-View/L3 Omnipotent stages, not a substitute for canonical CLI.
- Live SentinelX reads: CLI `graphify --version` / `--help`, full local MCPC schema, `@nexi-knowledge graph_stats`, source manifests and Backend/Public/Admin `package.json`, Kernel source-map; all read-only.

### Graphify official / GitHub

- CLI: https://docs.graphify.com/open-source/configuration/cli
- Query semantics: https://docs.graphify.com/open-source/features/querying
- Local MCP tools: https://docs.graphify.com/open-source/features/mcp-tools
- Official agent skill: https://github.com/Graphify-Labs/graphify/blob/v8/graphify/skill-agents.md
- Source implementation: https://github.com/Graphify-Labs/graphify/blob/v0.9.105/graphify/serve.py
- Understand Anything: https://github.com/Egonex-AI/Understand-Anything/tree/main/understand-anything-plugin
- Vibe Coding Library Integration Map: https://arty-kk.github.io/vibe-coding/workflows/integration-map/
- Vibe Ownership & Invariant Map: https://arty-kk.github.io/vibe-coding/workflows/ownership-invariant-map/
- Vibe Traceability Map: https://arty-kk.github.io/vibe-coding/workflows/traceability-map/
- Third-party Graphify skill: https://github.com/reason-machines/trending-skills/blob/main/skills/graphify-knowledge-graph/SKILL.md

### Framework contracts (official, current pages; verify version applicability)

- NestJS modules: https://docs.nestjs.com/modules
- NestJS providers: https://docs.nestjs.com/providers
- NestJS guards: https://docs.nestjs.com/guards
- NestJS queues: https://docs.nestjs.com/techniques/queues
- NestJS + Prisma: https://docs.nestjs.com/data/prisma
- Prisma ORM versioned docs: https://www.prisma.io/docs/orm/prisma-client/queries/transactions — **current page may be Prisma 8, not NEXI 7; use only as conceptual reference until verified against installed version**
- SQLite: https://www.sqlite.org/lang_transaction.html
- BullMQ workers: https://docs.bullmq.io/guide/workers
- BullMQ idempotent jobs: https://docs.bullmq.io/patterns/idempotent-jobs
- Redis streams/Valkey-compatible concept: https://redis.io/docs/latest/develop/data-types/streams/
- Socket.IO 4 server API: https://socket.io/docs/v4/server-api/
- Next.js App Router docs: https://nextjs.org/docs/app
- TanStack Start server functions: https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- TanStack Start server-functions docs checked via official TanStack plugin (including CSRF and origin): https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- TanStack Start server routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- TanStack Router: https://tanstack.com/router/latest/docs/framework/react/overview
- TanStack Start hosting and Nitro integration: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- Vite: https://vite.dev/guide/
- SIWE EIP-4361: https://eips.ethereum.org/EIPS/eip-4361
- viem: https://viem.sh/docs/getting-started
- Sentry NestJS SDK: https://docs.sentry.io/platforms/javascript/guides/nestjs/
- W3C WCAG 2.2 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html

## 14. Definition of complete *documentation* vs complete *architecture audit*

This **document** is complete when it names the authority, exact command and MCP contracts, framework checklist, expected-contract method, classification schema, evidence requirements, failure handling and links. It does not need to run NEXI application behavior or change any VM files.

The later **architecture audit** is complete only when all source-derived expected applicable contracts have a reasoned row (`SOURCE_CONNECTED`, `PROVEN_SOURCE_GAP`, `INSUFFICIENT_EVIDENCE`, or `NOT_APPLICABLE`) with source provenance, unresolved exceptions and deferred runtime claims explicitly identified. Do not label the whole system “fully connected” while material rows remain unknown, and do not conflate SOURCE_CONNECTED with `TESTED` or `RUNTIME_VERIFIED`.

**Status of this preparation:** Research, live tool/schema and manifest inspections completed; representative API Documentation Checker invocation produced `not_evaluated`; no production change, source repair, graph rebuild, application test, build, browser acceptance, restart or deployment performed.


## 15. v1.0 → v1.1 review ledger (document changes, not application findings)

| Audit observation | v1.1 response | Validation level |
|---|---|---|
| Original was strong on graph command inventory but weaker on proving the expected-contract denominator | Added §6A independent source/owner enumeration, exclusion ledger, exact partition rules, graph-vs-source coverage | Document methodology reviewed; not measured against repo |
| Multiple meanings of L0/L1 risked turning heuristic into limitation | Explicit Multi-View analysis levels vs hop depth; advanced typed traversal decision | Current skill/runbook compared |
| `SOURCE_CONNECTED` might be confused with repository's `SOURCE_IMPLEMENTED` | Added explicit row-to-criterion mapping and separate app deferred flag | Disposition method reviewed |
| Graph defaults and typed relations could silently omit consumers | Added §4A per-tool semantics and `--context` vs `--relation` difference; reject undirected causal inference | Installed CLI and MCP schema previously confirmed |
| Missing exact HTTP joins might become false source defects | Added extractor-gap classification and operation-universe reconciliation | Report counts previously confirmed; not audited individually |
| Financial, queue and event edges lacked cardinality rules | Added producer/consumer identity, singleton writer, replay and semantics checks | Source-only requirements; no runtime tests |
| TanStack security boundary could be too generic | Added explicit Start server-function/route, CSRF, serializer and Query invalidation checks | Current TanStack official docs retrieved; lockfile version match still required |
| Too many plugins could become an alternative controller | Added Vibe's 3 map recipes as conditional specialist methods, demoted Conduct/Wolfram/Reef to correct boundaries | Retrieval/instructions only, no repository changes |
| Package/docs may drift | Preserved warning that recent Prisma 8 API is not valid Prisma 7 proof | Current manifest + web version conflict |

**Document audit disposition:** `REVISED_DOCUMENT_ONLY`. This revision did not execute the full framework audit, application tests, code changes, graph regeneration or VM runbook edits. The next operator must verify volatile source/graph/tool identities before implementing the audit.
