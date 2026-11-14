# NEXI Graphify native HTTP and typed-context repairs — 2026-11-15

## Authority and scope
Owner authorized native Graphify 0.9.108 Python source improvements, in the existing NEXI repository and installed `graphifyy[all]` Python package. Do not regenerate canonical source graph or run NEXI application tests/lint/build/browser acceptance/restarts/deployments or mutate financial state.

## Confirmed root causes and repairs
1. **Dropped dynamic outbound HTTP request evidence.** `graphify/http_relationships.py` recognized `fetch(url)` but skipped the entire call when `url` had no static source-supported route. Native HTTP extraction now emits a source-located `http_unresolved_call` node and `http_call_unresolved` edge with `AMBIGUOUS` confidence, dynamic-target reason and no fabricated destination/handler. Real Public source example: `frontend/app/api/market/klines/route.ts:19`.
2. **Wrong graph-context ownership.** Existing `graphify/build.py:_nexi_relation_variants` preserved multiple edge facts only if context was `nexi`, but the NEXI HTTP and React adapters correctly use `http` and `react_context`. Reproduced two distinct HTTP relations collapsing to one. Native `build.py`, `affected.py`, and `serve.py` now recognize the actual NEXI-owned contexts `nexi`, `http`, `react_context`, `css`; metadata and direction preserved across export, load, affected and query/path consumers.
3. **Filtered query erased HTTP relations.** Native `serve.py:_filter_graph_by_context` consulted only the primary edge's context, so an HTTP-only query could drop a valid HTTP fact or show unrelated framework facts. The native filter selects matching facts from `parallel_relations`, promotes a matching fact to the filtered view's primary relation, and excludes out-of-scope facts.

## Native files and durability
- Installed native Python modules modified: `graphify/http_relationships.py`, `graphify/build.py`, `graphify/affected.py`, `graphify/serve.py`.
- Version-controlled native HTTP owner: `tools/graphify/native/graphify/http_relationships.py`, installed by `tools/graphify/install_native.py`.
- Regenerated original-wheel 0.9.108 four-module patch: `tools/graphify/patches/graphifyy-0.9.108-nexi-typed-relation-evidence.patch`. Exact upstream wheel SHA256 `040c289663cec38ae39dd5e450d9810233e0b70535f2d0b76b1467150aca6cea`; no fuzzy patch offsets.
- Installer now validates SHA256 of the four installed native core modules when detecting an existing patch or applying a clean patch, not merely marker presence. Historical compatibility installer synchronized.

## Permitted isolated Graphify checks
- Using an existing Public source file and a file-node fixture, the HTTP extractor emitted `http_unresolved_call` and `http_call_unresolved` at **L19** without fabricating an HTTP destination.
- Distinct same-node-pair HTTP, React Context, and framework facts survived build, `to_json`, load, directed path, reverse `affected`, and query text.
- Explicit filtered-view fixture: `http` context query displayed only `http_calls @ L3`; `nexi` displayed only `references_imported_symbol @ L8` with no cross-context leakage.
- Four-core-module native patch applied with `--fuzz=0` to the exact pristine 0.9.108 wheel in a temporary directory, with matching postpatch source hashes.
- Owner-account native installer invoked successfully; canonical graph SHA256 remained `e3d2d3d04d20292bfbb4c1605319d2ceab61fa639ff1850acb17b5a00c6ca4dc`.

## Actual parallel lanes and specialist application
- **Concurrent read lanes:** SentinelX HTTP extraction inspection, NEXI framework/TS scanner inspection, native graph/consumer inspection, Exa TypeScript compiler research, Context7 TypeScript 6.0.2 docs. These ran using one `Promise.all` tool batch, followed by separate concurrent source/graph Knowledge MCPC read calls. **Writes were sequential**, with one owner; no extra worktrees or competing writers.
- **Research & Writing Copilot**: source verification against TypeScript Compiler API and actual Graphify 0.9.108 implementations; extracted observed source facts before modifications.
- **LLM & Agent Builder Copilot design-tool-contracts / choose-system-complexity**: retained existing static parser and TypeChecker, source-scoped unresolved records rather than false route joins or extra controllers.
- **Software & AI Copilot debug-failure**, **Caveman investigate-first/surgical-patch**, **Ponytail**, **Anti-Slop root-fix gate**: reproduced before patch, changed the causal native builder/filter instead of adding per-client hacks.
- **Data analyze-data-quality**: distinct graph source input grain, unique node identity, preserved relation direction, orphan/uncertain endpoint handling; these remain bounded engine-only integrity checks, not an application quality verdict.
- **Wolfram context** was consulted for directed multigraph implications; it did not supply evidence sufficient to replace Graphify's graph class, so no MultiDiGraph migration was introduced.
- **Knowledge v4 MCPC** `@nexi-knowledge` and source graph MCPC `@nexi-graphify-live` read to locate source context; existing canonical source graph is stale and not accepted as proof of current extractor behavior.

## Status
- TASK: Native HTTP evidence and typed source context integration.
- SOURCE: `SOURCE_IMPLEMENTED` for these bounded defects; global comprehensive source coverage remains `INSUFFICIENT_EVIDENCE`.
- PROOF: `ISOLATED_GRAPHIFY_ENGINE_VERIFIED`; NEXI application verification `DEFERRED_BY_OWNER_SOURCE_FIRST_RULE`.
- NEXT: source-symbol resolution and additional producer/consumer extraction gaps, graph-consumer completeness, canonical input inventory after eventual source closure. Do not mistake installed extractor coverage for production runtime correctness.

## Additional native HTTP parser and coverage-report integration

- **HTTP JavaScript grammar dispatch:** previous `http_relationships._parse` sent `.js`, `.jsx`, `.mjs`, `.cjs` through the TypeScript grammar. Updated the existing native HTTP module to use the already-installed `tree_sitter_javascript` grammar for JavaScript/JSX and the corresponding `tree_sitter_typescript` grammar for TypeScript/TSX. Isolated engine parser checks for `.js`, `.jsx`, `.ts`, `.tsx` returned parse trees without syntax errors; no new packages installed.
- **Native merge reporting:** `graphify/nexi_merge.py` now includes `http_call_unresolved` in HTTP provenance checks and reports `http_unresolved_call_nodes`, `http_unresolved_call_edges`, and `http_unresolved_source_files` independently of exact joins. Synthetic source-graph fixture returned (1 node, 1 edge, 1 source file, zero missing HTTP provenance). Real canonical graph remains unchanged.
- Only native Graphify source and the tracked installer were changed. Source input exhaustiveness and app runtime remain **unverified/deferred**.
