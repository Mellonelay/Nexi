# Graphify Contract

Graphify is the default codebase intelligence substrate for established projects.

## Authority

Graphify provides structural evidence, relationships, communities, paths, inferred/extracted edges, and impact guidance. It does not override direct source, tests, or runtime evidence.

Evidence order:

```text
runtime/tests > source/config/schema > EXTRACTED graph edges > INFERRED/AMBIGUOUS graph edges > historical summaries
```

## Startup

1. Locate project root and graph output.
2. Check freshness; prefer incremental update (`--update`) over full rebuild.
3. If live development needs continuous sync and environment supports it, `--watch` may be used.
4. Ask a bounded natural-language query linked to the actual task.

## Query choice

- BFS/query: broad orientation and subsystem discovery.
- DFS/query `--dfs`: trace a specific path.
- `path` / MCP `shortest_path`: exact connection between two concepts.
- `explain` / MCP `get_node`: inspect one node/concept.
- MCP `get_neighbors`: direct dependencies or callers/callees.
- communities / `get_community`: bounded subsystem membership/ownership.
- God Nodes: high-centrality architecture hubs; use when hub analysis matters.
- cluster-only: re-partition an existing graph without re-extraction.
- `--resolution`: tune community granularity.
- `--exclude-hubs`: reduce utility super-hub distortion.
- `--mode deep`: richer extraction for genuine forensic/unknown architecture work.
- `--directed`: preserve source→target semantics where direction matters.

## Context budgets

Use Graphify query/MCP token budgets. Prefer small slices per worker.

Example:

```yaml
question: "Worker to service to D1 withdrawal authority path"
mode: dfs
depth: 4
token_budget: 900
```

Escalate only if the answer is insufficient.

## Cross-repo

For systems split across repositories, use multi-repo build/merge capabilities so the router can reason over cross-repo paths and communities. Verify critical cross-repo links in source/config.

## PR and parallel-work impact

Use Graphify PR impact/conflict capabilities when available to detect overlapping communities and merge-order risk. Community overlap is a coordination signal, not an absolute correctness proof.

## After changes

If architecture, imports, service boundaries, API paths, schema relationships, or runtime wiring changed:

1. refresh graph incrementally;
2. re-check the affected path/community;
3. compare against pre-change assumptions;
4. invalidate only evidence dependent on changed topology.

Do not rebuild/recluster mechanically after cosmetic or irrelevant changes.

## Exports and memory

Wiki, callflow HTML, SVG, GraphML, Neo4j/FalkorDB, Obsidian, and hook outputs are optional artifacts. Use them only when they materially help continuity, visualization, team sharing, or downstream analysis.
