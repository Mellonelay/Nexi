# NEXI Graphify — Native deduplication typed endpoint integrity (2026-11-15)

**Scope:** Graphify 0.9.108 native Python engine only; NEXI application source, canonical graph, app builds/tests/browser acceptance and deployments excluded by owner SOURCE-FIRST rule.

## Confirmed source defect
Upstream native `graphify/dedup.py:deduplicate_entities` remaps ordinary `edge["source"]` and `edge["target"]` after deduplication but previously left `edge["_src"]`, `edge["_tgt"]`, and `edge["parallel_relations"][*]` unchanged. NEXI's native `build.py`, `serve.py`, `affected.py`, and `nexi_merge.py` use these fields as typed source direction evidence. An isolated input with two exact-match concept nodes `token-a` and `token-b` reproduced `token-b→token-a` survivor mapping while preserving the deleted `token-b` in both primary and nested direction fields.

## Minimal native repair
- Directly modified installed `graphify/dedup.py`: after canonical endpoint rewrites, remap both primary `_src/_tgt` and every dictionary entry in `parallel_relations` using the same dedup survivor map. Preserve other attributes and upstream dedup behavior.
- Added explicit `NEXI_DEDUP_TYPED_REMAP_V1` marker.
- Extended maintained `tools/graphify/install_native.py` and exact-version `tools/graphify/patches/graphifyy-0.9.108-nexi-typed-relation-evidence.patch` to include `dedup.py` as a fifth native core module. SHA256 guards now include the fifth file; legacy installer synced.
- No new abstraction, graph model, dependency or competing extraction pipeline introduced.

## Focused native proof
- After fix, exact concept dedup collapsed `token-b` into `token-a` and rewrote nested facts `consumer→token-a reads_model`, `token-a→consumer writes_model`; deleted node ID no longer appeared in typed fact endpoints.
- `build_from_json(...,dedup=False)` preserved both remapped relations; directed reverse `affected_nodes` found `consumer` for `reads_model`.
- Exact Graphify 0.9.108 upstream wheel was patched in scratch with `--fuzz=0`, dry-run then actual patch, and all five resulting native module SHAs matched installed Python modules. No real NEXI source graph was rebuilt.

## Parallel tool execution and applied methodologies
- Independent concurrent lanes: SentinelX isolated dedup fixture, SentinelX read-only consumer call-site/source contract inventory, Context7 NetworkX relabeling semantics, Exa official Graphify source investigation. No subagent claiming.
- Research & Writing Copilot source verification: compared observed installed Graphify implementation with official NetworkX documentation before concluding.
- LLM & Agent Builder Copilot tool contracts, Software & AI Copilot debug-failure, Caveman investigate-first and surgical-patch, Anti-Slop and Ponytail: remap nested evidence at the existing upstream dedup owner instead of adding a second graph representation or downstream patches.
- API Documentation Checker intentionally not used for this internal Graphify dedup defect: it compares explicitly provided API documentation, not Python graph internals.

## State
TASK | `SOURCE_IMPLEMENTED` for typed dedup endpoint integrity, not global NEXI source mapping.
PROOF CLASS | `ISOLATED_GRAPHIFY_ENGINE_VERIFIED`.
NEXT | Native downstream semantic completeness, producer-to-consumer extraction/source coverage, final source-first closure; full canonical graph/real application verification remains deferred.

## Native source coverage report fact-grain correction

Reproduced downstream loss after dedup: a serialized simple graph carried `http_calls` and `references_imported_symbol` on the same packed edge. Previous `graphify/nexi_merge.py:report_graph` counted only the primary `nexi` relation and reported **zero** HTTP clients. Native report now expands existing typed `parallel_relations` as individual source facts with their real direction, evidence and surface, retaining separate physical `edges` and `source_relation_facts` counts. It also avoids repeated O(N) node scans through an ID lookup. Isolated source fixture: **2 physical edges / 3 typed facts / 1 HTTP caller / 1 handler / 1 exact join / 1 NEXI reference**. No canonical graph rebuild or application execution.
