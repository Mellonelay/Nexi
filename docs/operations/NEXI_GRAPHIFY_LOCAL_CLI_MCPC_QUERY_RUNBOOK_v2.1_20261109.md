# NEXI — Graphify Local CLI + MCPC Query-First Engineering Runbook v2.1

**Date:** 2026-11-09\
**Audience:** NEXI engineering agents using the existing VPS graph\
**Scope:** Open-source **Graphify CLI** and the already-connected **local Graphify MCP via `nexi-mcpc` only**. No hosted MCP instructions, no new graph extraction, no installation steps, no replacement graph manager.

## 1. Purpose and current authority

**Query the existing NEXI unified graph. Do not generate it again during normal source work.** The earlier v2.0 file begins with a dated **“SUPERSEDED FOR NEXI LOCAL EXECUTION”** banner that points to another runbook. That banner concerns *which written instructions were current at that time*; it does **not** establish that the already-generated NEXI graph is invalid. This v2.1 is a corrected, query-focused operational reference; it does not erase the earlier document or change the graph owner.

Source and authority order: current owner decisions and repository `AGENTS.md` → current implementation and scoped proof → relevant graph nodes/edges → inference. Graphify is **static dependency evidence** and a locator. It cannot, by itself, prove runtime execution, a registered NestJS route, Redis/Valkey delivery, authorization correctness, SQLite transaction outcomes, or browser behavior. A source edit made after graph construction can invalidate some graph relationships; read the current source for final authority.

The standing NEXI source-only campaign prohibits tests/builds/deployments until the **entire source batch** closes. Read-only Graphify queries are permitted; **do not run `extract`, `update`, `watch`, `merge-graphs`, `cluster-only`, `label`, or graph/export-writing operations** as part of this runbook. Do not change or restart the healthy MCP session. Use one source/edit owner; Graphify never owns financial writes.

## 2. Verified execution identity — 2026-11-09

| Item | Live observation | How to use it |
|---|---|---|
| Repository | `/home/mellonelay1999/workspaces/Nexi`, `main`, HEAD observed `2fbc1538ea45` | Checkout identity is volatile; graph is not necessarily at HEAD. |
| Graphify CLI | `/home/mellonelay1999/.local/bin/graphify`, **0.9.103** | Local commands are executable on the VM as `mellonelay1999`. |
| MCPC client | `/usr/local/bin/nexi-mcpc` | Its named sessions belong to the `mellonelay1999` HOME. |
| **Local MCP session** | **`@nexi-graphify-live`**, Graphify server 0.9.103, **10 tools** | Use this exact existing local session; no `@nexi-graphify-local` fallback. |
| MCP graph target | `/home/mellonelay1999/.local/share/graphify-nexi/graphify-http-extractor/20261107/unified-http-graph.json` | Verified symbolic link to the merged graph below. |
| **Canonical current graph for these examples** | **`/srv/nexi/graphify-live/20261107/merged-graph.json`** | Use `--graph` explicitly for CLI to query the **same** graph as MCP. |
| Live graph stats | **5,953 nodes; 17,481 edges; 208 communities; 94% EXTRACTED, 6% INFERRED, 0% AMBIGUOUS** | Historical snapshot, not immutable proof or an acceptance gate. |
| Repo default graph | `/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json` (a separate ~614 KB file at inspection) | **Do not silently use this**: CLI without `--graph` does not select the MCP's merged graph. |

**Shell prefix:** The examples assume an authorized VM shell belonging to `mellonelay1999`. If the calling transport is root, use the owner's HOME via `sudo -u mellonelay1999 -H`; do not copy session names into a different HOME. Run graph-related commands from the repository root for consistent relative paths. `graphify` and `nexi-mcpc` are different clients with different flags and schemas.

```bash
# In an authorized shell as mellonelay1999 (setup only; no graph writes):
cd /home/mellonelay1999/workspaces/Nexi
G=/srv/nexi/graphify-live/20261107/merged-graph.json
GRAPHIFY=/home/mellonelay1999/.local/bin/graphify
MCPC=/usr/local/bin/nexi-mcpc
SESSION=@nexi-graphify-live

"$GRAPHIFY" --version
"$MCPC" "$SESSION" tools-list
"$MCPC" "$SESSION" tools-call graph_stats '{}'
```

These shell variables are convenient **local shell aliases**, not Graphify options, environment configuration, or MCP registration. If the graph target changes, inspect the live session binding first and adjust `G` to the verified resolved target. Do not rebuild a different artifact to make the examples work. To read the session schema, use `"$MCPC" "$SESSION" tools-get <tool>`. The `--json` flag is supported by MCPC for machine-readable responses.

## 3. Investigation decision table: pick the smallest query

| Engineering question | CLI command | Local MCP tool | Meaning / next source step |
|---|---|---|---|
| Which module implements a feature? | `query` (BFS, low depth/budget) | `query_graph` (`mode:bfs`) | Find real nodes and source line anchors. |
| Which call chain leads from handler to owner? | `query --dfs --context call` | `query_graph` (`mode:dfs`, `context_filter:["call"]`) | Scope to one chain, then check source. |
| What is this exact symbol? | `explain` | `get_node` | Inspect ID, path, source, community, evidence. |
| Who calls this, what does it call? | `query --seed ... --context call` / `explain` | `get_neighbors` with `relation_filter:"calls"` | Inspect **incoming vs outgoing** separately. |
| Are A and B connected by a stored relationship? | `path` | `shortest_path` | **Directed** by default. Inspect every hop. |
| What breaks if I change this owner? | `affected --depth N [--relation calls]` | Bounded reverse `get_neighbors` plus `shortest_path` | CLI `affected` is the direct reverse-impact operation; MCP has **no `affected` tool**. |
| Which area owns the symbol? | `god-nodes` plus `query` | `get_community`, `god_nodes` | Community is a structural cluster, **not** authoritative code ownership. |
| What graph is selected? | `--graph "$G"` for each query | `graph_stats` on bound session | Use same artifact for comparable CLI/MCP answers. |
| Is a PR already touching this scope? | `graphify prs` (optional) | `list_prs`, `get_pr_impact`, `triage_prs` | GitHub-connected advisory context; not the source-only closure gate. |
| Might edge folding explain lost relationships? | `diagnose multigraph --graph "$G" --json` | No equivalent among the 10 tools | Read-only *post-build* collision diagnostic; not proof of extraction loss. |

There is **no local CLI subcommand named `graphify trace` or `graphify call`**, and the local MCP does **not** expose hosted-only `graphify_trace`, `graphify_callers`, `graphify_callees`, or `graphify_impact`. **Call tracing** is performed with `query --context call`, `explain`, `get_neighbors`, and `path`. **Impact** uses CLI `affected` (reverse traversal) and exact MCP neighbor/path queries. Do not invent a missing CLI or MCP tool.

## 4. Graphify CLI — exact query/trace/path/explain commands

All commands below are **read-only**. Examples use the existing merged graph and either verified symbol names or clearly identified prompts. The CLI 0.9.103 `--help` on the NEXI VM is the installed flag authority.

### 4.1 Broad, then targeted queries

```bash
# BFS (default): locate relevant nodes; restrict output.
"$GRAPHIFY" query "binary position settlement" --depth 1 --budget 700 --graph "$G"

# DFS: investigate a deeper causal chain, without an entire architecture dump.
"$GRAPHIFY" query "wallet session recovery" --dfs --depth 2 --budget 900 --graph "$G"

# Known-node seed + call-context restriction. THIS command was actually executed:
"$GRAPHIFY" query "Admin ledger projection" \
  --seed 'mapLedgerPosting()' --context call --depth 1 --budget 420 --graph "$G"

# Multiple seeds and relation contexts are supported. Use real returned labels/IDs.
"$GRAPHIFY" query "ledger activity and audit" \
  --seed 'mapLedgerPosting()' --seed '.listLedger()' \
  --context call --budget 700 --graph "$G"
```

`query` defaults to BFS and a nominal depth 2 on this installed CLI (`.graphifyrc` may override defaults); `--dfs` selects DFS; `--depth N` accepts 1–6; `--budget N` controls output; `--seed X` and `--context C` can be repeated. **CLI `--context call` is singular**; MCP `context_filter` is an array with `"call"`. An overly broad query can report hundreds of nodes and truncate; **narrow first**, raise the budget only when the missing nodes are necessary.

The verified ledger query returned:

```text
NODE mapLedgerPosting() [src=src/admin/types/index.ts loc=L539]
EDGE .listLedger() --calls [EXTRACTED context=call]--> mapLedgerPosting() at=src/admin/data/nexi-api-provider.ts:L1498
EDGE mapLedgerPosting() --calls [EXTRACTED context=call]--> mapLedgerScope() at=src/admin/types/index.ts:L544
```

Those line numbers describe the **existing indexed graph**, not guaranteed unchanged post-edit source positions.

### 4.2 Exact node explanation and identity

```bash
"$GRAPHIFY" explain 'mapLedgerPosting()' --graph "$G"
"$GRAPHIFY" explain 'mapLedgerPosting()' --all --graph "$G"   # expanded neighbors; use sparingly
```

`explain` defaults to up to 20 notable neighbors; `--all` can be large. Prefer an exact full node ID if a short label is ambiguous. The live MCP resolved `mapLedgerPosting()` to `admin::src_admin_types_index_mapledgerposting` at `src/admin/types/index.ts:L539`.

### 4.3 Path and direction

```bash
"$GRAPHIFY" path 'admin::src_admin_data_nexi_api_provider_nexiadminapiprovider_listledger' \
  'admin::src_admin_types_index_mapledgerposting' --graph "$G"
"$GRAPHIFY" path 'admin::src_admin_types_index_mapledgerposting' \
  'admin::src_admin_data_nexi_api_provider_nexiadminapiprovider_listledger' \
  --undirected --graph "$G"
```

`path` is directed by default; `--undirected` is for *connectivity discovery only*, not a claim that calls can be made in either direction. For every hop, inspect relation, direction, provenance and source. The shortest path is **not** necessarily the runtime execution path or every possible path.

### 4.4 Reverse impact / blast radius

```bash
"$GRAPHIFY" affected 'mapLedgerPosting()' --depth 1 --relation calls --graph "$G"
"$GRAPHIFY" affected 'mapLedgerPosting()' --depth 2 --graph "$G"
```

`affected` traverses **incoming dependencies in reverse**. Start depth 1; expand to depth 2–3 only for the affected boundary. `--relation R` is repeatable; its value is an edge **relation** (e.g. `calls`), not necessarily the `query --context` value (`call`). Include only files or consumers actually returned; account separately for dynamic imports, decorators, framework DI, generated clients and external consumers not in the graph.

### 4.5 Architectural hubs and a read-only edge diagnostic

```bash
"$GRAPHIFY" god-nodes --top 12 --graph "$G"
"$GRAPHIFY" god-nodes --top 12 --json --graph "$G"
"$GRAPHIFY" diagnose multigraph --graph "$G" --json --max-examples 5
```

Hub degree is prioritization evidence, not an ownership assertion. `diagnose multigraph` assesses same-endpoint edge-collapse *risk in the stored output*, not whether upstream parsing failed.

### 4.6 CLI flags, outputs, exit codes

| Command | Verified relevant flags | Default or note |
|---|---|---|
| `query` | `--dfs`, repeatable `--seed`, repeatable `--context`, `--budget`, `--depth`, `--graph` | BFS, depth normally 2, budget 2000; explicit values override project config. |
| `explain` | `--all`, `--graph` | Limited neighbor listing otherwise. |
| `path` | `--directed`, `--undirected`, `--graph` | Directed by default. |
| `affected` | repeatable `--relation`, `--depth`, `--graph` | Reverse traversal; depth 2 default. |
| `god-nodes` | `--top`, `--json`, `--graph` | 10 hubs default. |
| `diagnose multigraph` | `--graph`, `--json`, `--max-examples`, `--directed`, `--undirected` | Diagnostic only; not a graph build. |

`query`, `path`, `explain` return **0** on answer, **3** for ambiguous name, **4** if no matching node. A missing node or path means **not found in this indexed graph**, not “code does not exist” or “runtime cannot reach it.” On `3`, use candidate full ID or `<source-path>::<symbol>`; on `4`, use `god-nodes`, inspect actual returned node names, or inspect the current source. Distinguish an ambiguous result *inside* an MCP successful transport call from an authenticated error.

## 5. Local MCP via `nexi-mcpc` — discover, then invoke

**Use only the active local session `@nexi-graphify-live`.** No hosted Graphify API, hosted graph actions or hosted-specific tool names in this runbook.

```bash
"$MCPC" "$SESSION"                         # session overview
"$MCPC" "$SESSION" tools-list              # names
"$MCPC" "$SESSION" tools-get query_graph    # exact live inputs before first use
"$MCPC" "$SESSION" tools-get get_neighbors
"$MCPC" "$SESSION" tools-get shortest_path
"$MCPC" "$SESSION" tools-call graph_stats '{}'
```

`nexi-mcpc` accepts `tools-call <name> '<JSON object>'` and `--json` for structured output. Put JSON in **single quotes** in an ordinary shell; do not turn a JSON array into a quoted string. Its optional `project_path` means **a directory containing `graphify-out/graph.json`**, not a file path. For this NEXI session, **omit `project_path`** to keep the pre-bound unified merged graph; passing the repo root could silently switch to the distinct default graph.

### 5.1 The ten local MCP tools and exact inputs

| Tool | Required | Optional fields | Primary use |
|---|---|---|---|
| `query_graph` | `question: string` | `mode:"bfs"|"dfs"`, `depth:1..6`, `token_budget`, `context_filter:string[]`, `project_path` | Subsystem or causal chain. |
| `get_node` | `label` **or** `node_id` | `project_path` | Exact node details and stable ID. |
| `get_neighbors` | `label` **or** `node_id` | `relation_filter:string`, `token_budget`, `project_path` | Incoming/outgoing edge details. |
| `shortest_path` | `source:string`, `target:string` | `max_hops` (default 8), `undirected:boolean` (default false), `project_path` | Relationship/path proof. |
| `get_community` | `community_id:int` | `token_budget`, `project_path` | Structural grouping. |
| `god_nodes` | none | `top_n`, `exclude_hubs_percentile`, `project_path` | Important hubs. |
| `graph_stats` | none | `project_path` | Graph identity/shape. |
| `list_prs` | none | `base`, `repo`, `project_path` | Optional GitHub PR surface. |
| `get_pr_impact` | `pr_number:int` | `repo`, `project_path` | PR graph impact; no merge action. |
| `triage_prs` | none | `base`, `repo`, `project_path` | Optional PR priority. |

**Confirmed schema nuance:** `query_graph` `context_filter:["call"]` filters by **context**, whereas `get_neighbors` `relation_filter:"calls"` filters by **relation**. Preserve singular/plural distinction. Both `get_node` and `get_neighbors` accept `node_id` as an alternative to `label` on the installed 0.9.103 server; the published docs sometimes show only `label`.

### 5.2 Copyable bounded local MCP calls

```bash
# Statistics and broad exploration
"$MCPC" "$SESSION" tools-call graph_stats '{}'
"$MCPC" "$SESSION" tools-call query_graph \
  '{"question":"NEXI admin audit ledger","mode":"bfs","depth":1,"token_budget":700}'

# Targeted DFS through call-context edges
"$MCPC" "$SESSION" tools-call query_graph \
  '{"question":"wallet session refresh","mode":"dfs","depth":2,"token_budget":800,"context_filter":["call"]}'

# Node details, neighbors, and callers/callees (inspect direction in result)
"$MCPC" "$SESSION" tools-call get_node '{"node_id":"admin::src_admin_types_index_mapledgerposting"}'
"$MCPC" "$SESSION" tools-call get_neighbors \
  '{"node_id":"admin::src_admin_types_index_mapledgerposting","relation_filter":"calls","token_budget":700}'

# Directed path through exact symbols. If a name is ambiguous, use node IDs.
"$MCPC" "$SESSION" tools-call shortest_path \
  '{"source":"admin::src_admin_data_nexi_api_provider_nexiadminapiprovider_listledger","target":"admin::src_admin_types_index_mapledgerposting","max_hops":4,"undirected":false}'

# Graph area (choose an ID that actually appeared in previous results)
"$MCPC" "$SESSION" tools-call get_community '{"community_id":0,"token_budget":600}'
"$MCPC" "$SESSION" tools-call god_nodes '{"top_n":10}'
```

**Ambiguity witnessed live:** `shortest_path` for `.listAdminAudit()` returned two candidates: `backend::src_admin_admin_service_adminservice_listadminaudit` and `backend::src_admin_admin_controller_admincontroller_listadminaudit`. That was **a tool execution with an ambiguous query result**, not a valid path. Resolve which function is intended from source and retry with its exact node ID. Both node IDs in the `listLedger` → `mapLedgerPosting` path example were **resolved live**, and the directed CLI and MCP paths each returned one EXTRACTED `calls` edge. For other nodes, use `get_node`/`query_graph` to obtain actual IDs rather than constructing them.

### 5.3 Optional PR data — only when the task is about PRs

```bash
"$MCPC" "$SESSION" tools-call list_prs '{"repo":"Mellonelay/Nexi","base":"main"}'
"$MCPC" "$SESSION" tools-call get_pr_impact '{"pr_number":85,"repo":"Mellonelay/Nexi"}'
"$MCPC" "$SESSION" tools-call triage_prs '{"repo":"Mellonelay/Nexi","base":"main"}'
```

The PR number above is a **syntax example**, not a claim PR #85 is open now. These tools may depend on GitHub CLI authentication/network; a failed PR lookup is **not** graph or source failure. The current source-only campaign does not require PR polling on each slice.

## 6. Advanced query workflows — actual NEXI engineering patterns

### A. Defect → causal owner → consumers

1. Use `query`/`query_graph` BFS depth 1 to locate a symptom's producer or client mapper.
2. Use `get_node` or `explain` for the exact ID and source line; **do not operate on a similarly named neighbor**.
3. Use `query --seed NODE --context call` or `get_neighbors` filtered to `calls`; separate incoming callers from outgoing callees.
4. Use **directed** `path` / `shortest_path` to connect the client/controller/service/SQLite boundary, if present.
5. Use CLI `affected` depth 1–2 to list possible consumers before changing the owner.
6. Inspect **current** source declarations, auth guards, SQL and TS contracts. Report `SOURCE_CONFIRMED`, `GRAPH_INFERRED`, or `UNKNOWN` per edge. Graphify alone does not authorize a fix.

### B. Cross-surface Admin ↔ Backend ↔ Public

- Query **one** exact API surface, e.g. `listAdminAudit`, `mapLedgerPosting`, a single controller or client endpoint.
- Prefer exact `calls` edges and source file+line anchors; pair independent route HTTP strings manually in source when the graph lacks framework-generated edges.
- For the 2026-11-08 graph, `mapLedgerPosting()` is a verified anchor; `listLedger()` calls it. The read model may differ from the storage model: graph edges cannot certify amounts, signed deltas or accounting correctness.
- Compare **source revision** after the graph build to current files; changes made in a dirty worktree are not automatically reflected in a previously generated graph.

### C. Financial command / Ledger / Outbox

- Begin with an exact financial controller/service/gateway symbol.
- Follow `calls` edges to LedgerAccount/LedgerPosting, EventOutbox/Inbox and the transaction implementation only where resolved.
- The static graph cannot prove atomicity, idempotency replay, matching user ownership, exact decimal semantics or confirmed economic events. Those require source contracts and **later authorized proof**. Do not replay financial operations to check a graph.

### D. Options / Spot / Margin

- Compare frontend state normalization → API endpoint → backend persisted status; query exact symbols and use `affected` for the state helper's consumers.
- An OPEN/PENDING/LOSS state shown by a UI may be a presentation bug; do not re-run settlement or account mutation to compensate for a display issue.
- Use caller/callee **direction** and provenance tags. A source-level `calls` edge does not demonstrate authenticated browser acceptance.

### E. Realtime, jobs and reconnect

- Query a concrete Socket.IO gateway, `.emit` or `.on` handler, worker method, BullMQ processor or stream adapter.
- Treat string event names, DI registration and runtime queue subscriptions as **dynamic gaps**; inspect literal names in current source.
- Never infer that every Valkey hop is part of a single ordered call path. The graph locates source owners; runtime sequencing requires separate evidence after the source-completion barrier.

### F. Graph quality and missing edges

- `query` result `TRUNCATED`: reduce `--depth` / token budget scope with `--seed` or `--context` **before increasing budget**.
- No path: verify correct artifact, direction, candidate ID and dynamic boundary; try `--undirected` **only for topology discovery**, then check the source.
- `INFERRED`: a deterministic resolution *may* be correct, but inspect its exact source. `AMBIGUOUS` or missing: retain uncertainty.
- `get_community` and `god_nodes`: use as location hints, **not** proof of module owner or deployment topology.
- `diagnose multigraph`: no guaranteed upstream-deduplication verdict; stored graph may omit edges before serialization.

## 7. Static evidence and operator-report contract

For each material investigation, record compactly:

```text
QUESTION: one defect/contract
GRAPH: resolved file path + observation date + graph identity
CLI/MCP: exact command/tool, arguments, result or truncation
NODE: exact ID, source file and indexed line
PATH: hop sequence, direction and relation
PROVENANCE: EXTRACTED | INFERRED | AMBIGUOUS | NOT_IN_GRAPH
SOURCE: live file/contract read, changed-since-index caveat
IMPACT: affected consumers and unresolved dynamic boundaries
DECISION: smallest causal source owner, or UNKNOWN with next read
PROOF: SOURCE_INSPECTED / SOURCE_IMPLEMENTED (not TESTED or RUNTIME_VERIFIED)
```

**Important:** A successful MCP transport call can return a warning, an ambiguous node, an empty path, a truncated traversal or stale source lines. Do **not** convert `ok:true` into a claim the investigated system behavior is proven.

## 8. Query-only restrictions and optional commands outside normal flow

The installed CLI also advertises `extract`, `update`, `watch`, `cluster-only`, `label`, `merge-graphs`, `export`, `tree`, `save-result`, `reflect`, `hook`, `install`, `uninstall`, and others. **They are not needed to consume the already generated graph and are deliberately not operational procedures in this runbook.** Some write graph artifacts, agent rules, hooks, or memory. Use a separate authorized graph-maintenance procedure if the owner decides a graph refresh is necessary. Never call a graph rebuild as a routine precondition of `query`/`path`/`explain`.

## 9. Source references used to produce this runbook

**Current local evidence (2026-11-09):** Graphify 0.9.103 `--help`, `nexi-mcpc --help`, `@nexi-graphify-live tools-list`, exact `tools-get` schemas for all 10 local tools, `graph_stats`, `get_node`, a bounded CLI call query, and a deliberately attempted ambiguous `shortest_path`. The existing symlink and graph locations were inspected on the NEXI VM. **No graph rebuild or test** was run.

Official Graphify source contracts (read as **documentation**, not executable authority):

- [Open-source query flags, `query`, `path`, `explain`](https://docs.graphify.com/open-source/features/querying)
- [Open-source CLI command and flag reference](https://docs.graphify.com/open-source/configuration/cli#path)
- [Local MCP tool reference](https://docs.graphify.com/open-source/features/mcp-tools)
- [Provenance and confidence tags](https://docs.graphify.com/concepts/provenance)
- [How dependencies are found](https://docs.graphify.com/concepts/how-graphify-finds-dependencies)
- [Stored outputs and graph-file identity](https://docs.graphify.com/concepts/outputs)
- [Deduplication and symbol resolution](https://docs.graphify.com/open-source/features/deduplication)
- [Community detection](https://docs.graphify.com/open-source/features/community-detection)
- [Follow calls — conceptual background; hosted features are NOT local CLI tool names](https://docs.graphify.com/concepts/follow-calls)
- [Check impact — conceptual background; use local CLI `affected`](https://docs.graphify.com/concepts/check-impact)
- [Graph exploration — conceptual background, not an instruction to use hosted Graphify](https://docs.graphify.com/platform/graphs)
- [Blast radius glossary](https://graphify.com/glossary/blast-radius)
- [Traversal glossary](https://graphify.com/glossary/traversal)

**Version rule:** installed CLI/MCP schemas win over example command syntax when a vendor page describes a different version. If installation, session target or schema changes, reread only the invalidated command/schema and record the updated identity.
