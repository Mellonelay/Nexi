# NEXI Graphify Complete Reading and Usage Guide

This is the NEXI project overlay for the global `graphify-multiview` skill installed at `~/.agents/skills/graphify-multiview`.

Graphify is structural intelligence, not runtime proof.

## Escalation levels
- L0 LOCATE: `query`, `path`, `explain`, exact source.
- L1 IMPACT: `affected`, callers/neighbors, blast radius.
- L2 MULTI-VIEW: whole-repo base graph + bounded task-corpus focus graph + optional NestJS/native graph + optional runtime observation graph.
- L3 OMNIPOTENT: explicit whole-system integrity analysis only.

The historical later dual graph is:
`WHOLE-REPO BASE GRAPH + BOUNDED TASK-CORPUS FOCUS GRAPH`.
Do not rewrite that history as simply static + runtime. Native/runtime views are later optional extensions.

## NEXI focus corpus
For a feature path, include only the applicable specification, Public source, Admin source, NestJS controller/service/DTO/contracts, architecture decisions, and supporting docs.
Use deeper semantic extraction on this bounded corpus rather than the entire repository by default.

## Omnipotent layer
Deterministic order:
raw integrity -> degree/in/out -> PageRank/reverse PageRank -> betweenness -> communities -> bridges/articulation -> forward/reverse reachability -> SCC/WCC -> cycles -> orphans -> duplicate/shadow-authority candidates -> anti-node expectations -> causal/leverage/collision candidates -> blast radius -> repair priority.

Permanent constraints:
- HIGH CENTRALITY != DEFECT.
- GRAPH EDGE != RUNTIME PROOF.
- MISSING GRAPH EDGE != PROVEN BUG.
- generated files/utilities can rank highly and must not become repair targets from centrality alone.

Worker-0 helper: `worker0-graph-analyze <graphify-out/graph.json>`.
It produces structural candidates only; confirm them against direct source and runtime evidence.

## Freshness
The Worker-0 post-commit helper writes `.git/worker0-graphify-stale.json` after structural commits.
Before graph-dependent reasoning, inspect the marker and graph freshness, then prefer `graphify update . --no-cluster` or the smallest supported incremental refresh.
Recluster only when community structure matters. Remove the stale marker only after successful refresh.

## MCP
Use `rdc-mcp graphify list` or Codex/Kilo Graphify MCP only when structured graph calls are the best owner.
The MCP must point at the current project graph. Registration alone is not proof of callability or freshness.

## Proof fan-in
Graphify finding -> direct source -> focused deterministic checks -> runtime/render proof when the claim requires it -> Riqor freshness/completion gate.
