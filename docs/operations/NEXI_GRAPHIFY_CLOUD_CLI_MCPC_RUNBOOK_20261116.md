# NEXI — Graphify Cloud_CLI_MCPC: Full Operations, Commands and Advanced Query Combinations

**Operational purpose:** Navigate NEXI's enriched source graph using the **local Graphify CLI and existing local Graphify MCPC**. Hosted Graphify Cloud is a separate product reference and is not the NEXI enriched-graph query route. This is a runnable engineering manual, not a list of marketing features. This document does not authorize graph rebuild/promotion, NEXI application builds, tests, starts, deployment, financial mutation, Cloud uploads or indexing.

**Historical installation snapshot captured 2026-11-16:** owner-user Graphify v0.9.111, Python 3.12, local source graph at /home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json, CLI /home/mellonelay1999/.local/bin/graphify, MCPC /usr/local/bin/nexi-mcpc, source session @nexi-graphify-live and separate engineering knowledge session @nexi-knowledge. Verify current versions and connections before use. Graph statistics are recorded in the build-receipt section after a successful refresh; **never infer current coverage from a historical node count**.

## HISTORICAL VERIFIED STATE — 2026-11-16

This dated section records the verified state on 2026-11-16 only. It is superseded by the revision-aware VM workflow below and must not be used as current source or model configuration. NEXI uses **LOCAL** Graphify CLI/MCPC only; not hosted Graphify Cloud tracing.

| Resource | Canonical location | Verified state |
|---|---|---|
| Source + semantic graph | /home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json / @nexi-graphify-live | 8,772 nodes, 22,093 edges, 469 communities; 2,331 semantic-origin nodes; 46 represented document source files |
| Source commit | 7a5aa7f2c3a3c46768b3b56bc53b1cc50e02ad76 | Current HEAD matches graph built_at_commit; **dirty worktree requires direct source check** |
| Graph integrity | SHA-256 29221a113f166d2be0da6fe0be16932ce777c08a91a0a693ff26e68f67181f85 | Unique node IDs, zero invalid edge endpoints |
| Original code-only graph | Historical 6,441 nodes / 19,384 edges | Final semantic rebuild receipt says all previous nodes and edge tuples retained after one node and 41 edges were restored post-cluster |
| Reference graph | /srv/nexi/engineering-knowledge/20261110/graphify-out/graph.json / @nexi-knowledge | 1,977 nodes, 4,166 edges, 156 indexed reference files; independent of source graph |
| Reference entrypoint | /srv/nexi/engineering-knowledge/20261110/README_CURRENT.md | Single canonical v4.0/ reference corpus; graphify-out/ generated MCP index; semantic/ historical |
| NestJS framework reference | v4.0/20_FRAMEWORKS/03_NESTJS_LLM_REFERENCE_20261116.txt | Byte-identical owner original Nestjs-llms.txt |
| Public Web3/mobile | v4.0/10_PUBLIC_UI/06_NEXTJS_WEB3_DAPP_MOBILE_BROWSER_STANDARD_20261116.md | Next.js React mobile wallet browser, EIP-1193/6963, Ethereum mainnet SIWE, deep-link/reconnect/safe area |
| Backend/Admin/Public services | nexi-api, nexi-admin, nexi-public | All inactive during latest read-only inspection; application tests/build/deploy remain deferred |

**Verified model-launcher snapshot at capture (historical):** /home/mellonelay1999/.local/bin/graphify-nexi-semantic (owner mode 0700) loads the existing protected OpenRouter credential. Endpoint https://openrouter.ai/api/v1, Graphify compatible backend openai (API protocol, not direct OpenAI billing), pinned zero-priced model nvidia/nemotron-3.5-super-vl:free, GRAPHIFY_MAX_OUTPUT_TOKENS=32768, --max-workers 2, --max-concurrency 4, --token-budget 4000, --api-timeout 240, standard semantic mode and no paid fallback. The previous openrouter/free random router was an earlier *working but unreliable for structured extraction* experiment, not the present launcher. Semantic extraction already requests JSON-only in the upstream Graphify system prompt. Reasoning history, streaming and optional app-attribution headers were not required for this graph build.

**Intermediate → final reconciliation:** the extractor logged 8,860 nodes / 22,284 edges before clustering, versus the current canonical 8,772 / 22,093 after final processing. The receipt records preserved old graph nodes and edge tuples (one node / 41 edges restored). Temporary candidate graph no longer exists; final graph and MCP agree. Graphify token cost is an estimate, not evidence of paid-model charges.

**Scope and unknowns:** the extraction selected 654 supported code files, 47 documents and one image under updated .graphifyignore; after preserving original nodes the final receipt lists 679 code source files and 46 represented document source files. One selected document is not conclusively represented. The old code-only scan detected 688 code files; current narrow scan is not identical coverage on its own. 124 code files yielded no symbols, and upstream Graphify cannot directly guarantee .prisma AST extraction or dynamic HTTP/Socket.IO/BullMQ joins. Semantic claims are static evidence, never runtime proof. Out-of-scope semantic-cache warnings are excluded material. Preserve existing dirty application/source changes and owner SOURCE-FIRST gate: no app tests, builds, browser acceptance, service restart, deploy or financial mutations.

**Evidence:** graphify-out/NEXI_SEMANTIC_REBUILD_RECEIPT_20261116.json, current graph sha256, Graphify CLI v0.9.111, and both live MCP graph_stats calls. Appendix E/F are historical code-only and initial-credential checkpoints. All dated provider/model statements below are historical snapshots, not current configuration or credential evidence.

## CURRENT VM UNIFIED-GRAPH WORKFLOW — 2026-11-22

**Scope for NEXI enriched-graph investigation:** Use the local Graphify CLI against the unified artifact and the existing local `@nexi-graphify-live` MCPC session. Do not substitute hosted Graphify or another graph. The NEXI graph-enrichment refresh pipeline remains the distinct, revision-aware path for any future authorized rebuild or activation; ordinary discovery must not rebuild the graph.

The authoritative local source graph is `/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json`, served by the existing `@nexi-graphify-live` local MCPC session. `/usr/local/bin/nexi-mcpc` invokes it; its server executable is `/home/mellonelay1999/.local/bin/graphify-mcp`. The separate `@nexi-knowledge` graph stores reference material and is not this enriched source graph.

**Live verification on 2026-11-22 (read-only):** Graphify CLI and local MCPC both report version `0.9.112`. The local MCPC `graph_stats` returned 9,743 nodes, 24,368 edges, 245 communities, 94% EXTRACTED, 6% INFERRED and 0% AMBIGUOUS. It says the graph was built at `6b3d04868caa37d32540bd2fb76dce8f19516ea6`, while repository HEAD is `f3515cf76d46`; the MCPC explicitly reports that the graph may be stale. The active graph path and counts differ from a separately supplied 2026-11-20 architecture snapshot (12,145 nodes, 27,200 relationships, 446 communities, revision `c7f64d8608af9c5a718826bccfa8aecac271a547`). Do not silently reconcile these snapshots or claim the live graph matches HEAD; compare graph identity, hash and refresh receipts before using it as complete current coverage.

**Enrichment confirmed in the loaded graph:** a bounded MCPC query surfaced SQLite schema nodes. An unqualified `get_node("LedgerPosting")` was ambiguous between a migration declaration and the SQLite table. Exact lookup by `sqlite:table:LedgerPosting` resolved the table. `get_neighbors` with relation filter `PRISMA_MODEL_MAPS_TO_SQLITE_TABLE` returned `Prisma:LedgerPosting --PRISMA_MODEL_MAPS_TO_SQLITE_TABLE [EXTRACTED]--> LedgerPosting`, sourced at `backend/prisma/schema.d1.prisma:L1249`. The CLI `path` command reproduced that one-hop extracted mapping when given the exact SQLite table ID. This confirms the SQLite enrichment relation is present; it does not prove every layer in the separately reported 12,145-node graph is present.

A read-only `graphify diagnose multigraph --json` on the loaded graph reported 24,368 raw edges, 647 directed and 731 undirected same-endpoint collapse-risk counts, 615 same-endpoint groups and 214 relation-variant groups. Examples include distinct `PRISMA_READS` and `PRISMA_WRITES` relations for the same endpoint pair. Its simulated post-build simple Graph contained 9,571 nodes and 23,632 edges. Treat this as a **potential relation-collapse diagnostic**, not proof that the persisted JSON has already discarded those raw edge records. Preserve relation identity/provenance and inspect consumer behavior before any graph rewrite or export that could collapse edges.

The Graphify runtime inspection changed no graph, server, application source or runtime configuration; this runbook records the read-only evidence and was updated as requested. Verify versions, live graph statistics and revision correspondence before every consequential graph task. A stale graph remains useful only as a qualified navigation candidate; confirm current source before relying on it. Do not rebuild to answer a query.

The former `--pristine` recipe is revision-pinned and does not apply to a new HEAD. If an authorized enriched-graph refresh is later requested, build a fresh source baseline from the exact clean commit with Graphify CLI `--code-only` into a revision-specific candidate directory and preserve its manifest/hash. If semantic extraction is included, build a separate candidate at the same HEAD with an explicitly configured provider; do not reuse another revision or silently fall back to a paid model. The existing refresh driver accepts `--source-baseline` and `--semantic-candidate` and validates receipts against HEAD.

The NEXI refresh driver at `/srv/nexi/graph-enrichment/refresh.py` uses `--source-baseline PATH --semantic-candidate PATH --with-semantics --with-sqlite` for check-only validation. Review its coverage and identity report, including TypeScript AST, HTTP, framework, queue, realtime, outbox and read-only SQLite schema layers. Add `--activate` only after validation and separate authorization. Do not use bare `graphify update` against the active enriched artifact: it may replace custom enrichment layers. Do not create a duplicate Graphify server.

After any authorized promotion, verify local MCPC `graph_stats`, exact built commit, graph SHA and counts against the refresh receipt. Use bounded queries with exact node IDs when names collide, directed paths for execution flow, and neighborhood/reverse-impact queries for consumers. Label EXTRACTED versus INFERRED results. Confirm consequential paths in current source; a missing edge does not prove missing source behavior, and static edges do not prove runtime behavior.

## 1. Choose the lowest-cost correct graph workflow

| Question | First operation | Next operation | Fallback and evidence |
|---|---|---|---|
| Exact error string or known file | rg/search and source read | Inspect caller or DTO only if needed | Do not insert Graphify ceremony |
| Unknown implementation owner | CLI query with exact code vocabulary **or** MCP query_graph | explain/get_node; nearest neighbors | Read current matching source |
| Caller/callee chain | query --context call **or** MCP query_graph with context_filter | path/shortest_path; confirm direction and confidence | Trace actual code and dynamic registrations |
| Change blast radius | CLI affected with an observed relation | Local MCPC get_neighbors + bounded query_graph | Inspect consumers/source; local MCPC has no dedicated tests_for tool; graph may omit dynamic edges |
| Entire subsystem | god-nodes, report, get_community | Bounded seeded BFS | Inspect selected actual files |
| Cross-repository | CLI global or merge-graphs (only when the task is actually multi-repository) | Scoped local CLI/MCPC query/path | Validate every input graph revision and identity joins; one NEXI checkout normally uses its single enriched graph |
| Repeated verified discovery | Local CLI save-result + reflect | Re-query the same source-linked nodes after the graph changes | Prior result never overrides current code; current CLI does not advertise reflect --if-stale |
| PR-review or potential test scope | Local MCPC list_prs/get_pr_impact/triage_prs | Inspect changed-file diff and graph-linked context | The local MCPC has no tests_for/review_status tool; no test execution without separate owner authority |
| Documentation, prose and diagrams | Local MCPC get_section or CLI section when the heading is indexed | CLI export wiki/callflow-html for generated navigation artifacts | Exports write files and remain derived views; check graph freshness/provenance; code-only graphs omit semantic document coverage |

**One primary interface per investigation.** Under the current owner instruction, NEXI enriched-graph queries use only the local Graphify CLI and existing `@nexi-graphify-live` MCPC. Hosted Graphify is a separate product reference; `@nexi-knowledge` is a separate reference corpus. Do not silently switch datasets or assume their IDs match. The local MCP may hold an older snapshot; working-tree changes are never certified by a graph built from an older checkout. No path means "no represented path," not independence. A prominent node is not necessarily the causal owner.

### Graph concepts: what to inspect

- **Node:** entity (file, symbol, table or document) with identifier, kind, source and location. Prefer exact ID over an ambiguous label.
- **Edge:** typed claim between two nodes; inspect direction, relation, context, source location and EXTRACTED/INFERRED/AMBIGUOUS provenance. Confidence applies to evidence for that edge, not full runtime correctness.
- **Code graph:** source-derived classes, functions, imports, calls and dependencies, subject to language and static-analysis limits.
- **Knowledge graph:** broader entity/relation representation, potentially including documents, decisions, media and references. Knowledge v4 and source graph must remain separate.
- **Traversal/hop:** following one edge; BFS gives nearby coverage, DFS follows deeper chains, path searches two endpoints, affected reverses dependencies.
- **Community:** structurally dense group useful for source orientation, never an authoritative team or financial owner.
- **God node:** high-degree hub; useful navigation clue, but generic helpers can create noise.
- **Provenance:** EXTRACTED = parsed source claim, INFERRED = resolver/semantic candidate, AMBIGUOUS = unresolved. Distinguish them in every consequential trace.
- **Index completeness:** count tracked supported files, detected scanned files, graph source references, excluded paths and known blind spots; node count alone is not coverage proof.

References: https://graphify.com/glossary/node ; https://graphify.com/glossary/code-graph ; https://graphify.com/glossary/knowledge-graph ; https://graphify.com/glossary/traversal ; https://graphify.com/glossary/community ; https://graphify.com/concepts .

## 2. Actual NEXI runtime and read-only preflight

~~~bash
cd /home/mellonelay1999/workspaces/Nexi
export GRAPHIFY=/home/mellonelay1999/.local/bin/graphify
export GRAPH=/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json
export MCPC=/usr/local/bin/nexi-mcpc
"$GRAPHIFY" --version
"$GRAPHIFY" --help
git rev-parse HEAD
git status --short
stat -c '%n %s bytes %y' "$GRAPH"
sha256sum "$GRAPH"
systemctl is-active nexi-api.service nexi-admin.service nexi-public.service || :
"$MCPC" @nexi-graphify-live tools-list
"$MCPC" @nexi-knowledge tools-list
"$MCPC" @nexi-graphify-live tools-get query_graph
"$MCPC" @nexi-graphify-live tools-call graph_stats '{}'
"$MCPC" @nexi-knowledge tools-call graph_stats '{}'
~~~

**Preflight interpretation:** Graphify CLI installation, graph file existence, MCPC session registration, tool schema discovery, graph response and graph/source-revision correspondence are **separate** checks. A running MCP client process is not proof of graph freshness. Cloud OAuth/queryability does not establish local graph health. Never start application services merely to read graph files.

**Source graph:** /home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json. **Knowledge graph:** /srv/nexi/engineering-knowledge/20261110/graphify-out/graph.json. An MCP call to either session only queries its selected graph, unless project_path is explicitly supplied and authorized. Knowledge-first references are retrieved for a new contract; source navigation follows exact L0 owner and bounded L1 consumers, then source inspection. This is the previously useful "omnipotent" combination **method**, not a custom engine or a guarantee of exhaustive mappings.

## 3. Build, update, scope, and validate a whole-checkout code graph

~~~bash
cd /home/mellonelay1999/workspaces/Nexi
# Before changing an existing graph: inspect graphify-out, Git state and exclusions.
cat .graphifyignore
cat .graphifyrc

# Explicit full source AST refresh, no external LLM or cloud upload.
"$GRAPHIFY" extract . --code-only --max-workers 2

# Later changed-code refresh without rebuilding unrelated documents.
"$GRAPHIFY" update .
# Only after deliberate scope reduction/deleted code, if normal update refuses a smaller graph:
"$GRAPHIFY" update . --force

# Independent re-clustering of the graph, without model-based community labeling:
"$GRAPHIFY" cluster-only . --no-label --no-viz
~~~

**NEXI scope rule:** Include supported application code across backend/, frontend/, Admin/, scripts/ and relevant infrastructure tools; retain tests as source graph candidates. Exclude node_modules, framework build outputs, generated clients, caches, Graphify outputs, backups, duplicate rollback/archives, temporary artifacts, plugin environments, secrets and unrelated third-party vendors. Keep documentation available as authority even if code-only build excludes its semantic extraction. Do not use --no-gitignore casually. Inspect source-manifest.json/detect inventory after rebuilding. Untracked source may be parsed if not ignored; verify actual manifest rather than assuming Git-tracked-only coverage.

**Important:** "--code-only" deliberately omits document/PDF/image semantic extraction. It can cover the code in the checkout, but cannot truthfully be called a complete code+documentation+media graph. Full semantic extraction is a separately scoped operation requiring explicit provider selection, cost and credential controls. Never silently use a paid model. Static graph extraction cannot promise complete producer/consumer HTTP, Socket.IO, Prisma, BullMQ or dynamic-reflection edges.

Other build operations:
- graphify watch PATH: long-running filesystem watcher (must be deliberately supervised, not launched as a short background job).
- graphify extract PATH --backend B --model M --mode deep: semantic/LLM extraction (requires approved provider and budget).
- graphify extract PATH --out DIR: explicit destination; --no-cluster skips clustering; --force reprocesses rather than using cache.
- graphify check-update PATH: check whether semantic re-extraction is pending.
- graphify cluster-only PATH: recompute graph communities/report without rereading corpus; --no-label prevents LLM naming.
- graphify label PATH: model-based community naming; --missing-only avoids overwriting useful names.
- graphify provider list/show/add/remove: manage configured model providers; changes to providers are not part of routine graph query.
- graphify add URL: fetch remote content and update corpus; requires source/content authorization.
- graphify clone URL: clones remote Git repository; separate operation from graph reads.
- graphify install/uninstall, agent-specific install and graphify hook install: mutate assistant/git configuration; **not** needed for read-only CLI/MCP usage.

## 4. All principal CLI query commands and advanced combinations

Every example is a shell command for the **standard installed CLI**, not a ChatGPT chat message or the slash command /graphify. Substitute exact source nodes returned by the graph. Current project .graphifyrc defaults: query_budget=4000, query_depth=2; explicit --budget and --depth override these.

### A — L0 source owner and narrow L1 neighborhood

~~~bash
"$GRAPHIFY" query 'MarketAuthorityService MarketQuoteLatest' --budget 1200 --depth 1 --graph "$GRAPH"
"$GRAPHIFY" explain 'MarketAuthorityService' --graph "$GRAPH"
"$GRAPHIFY" query 'market quote storage' --seed 'MarketAuthorityService' --budget 1200 --depth 2 --graph "$GRAPH"
~~~

L0 = exact definition/source owner, L1 = immediate relations. Resolve symbol ambiguity using the returned node ID or file::symbol qualifier. Follow with the current source file. Do **not** expand every owner to depth 6 by default.

### B — caller chain and directional reachability

~~~bash
"$GRAPHIFY" query 'MarketAuthorityService' --context call --budget 1500 --graph "$GRAPH"
"$GRAPHIFY" query 'quote ingress' --dfs --seed 'MarketAuthorityService' --budget 1600 --graph "$GRAPH"
"$GRAPHIFY" path 'ResolvedSourceNode' 'ResolvedTargetNode' --graph "$GRAPH"
"$GRAPHIFY" path 'ResolvedSourceNode' 'ResolvedTargetNode' --undirected --graph "$GRAPH"
~~~

Directed paths support a potential execution/dependency direction; --undirected shows connectivity only, not execution flow. Use exact resolvable source/target node IDs and inspect each hop's provenance. --context is repeatable; valid context values depend on graph evidence (commonly call, field). CLI query --dfs is a traversal style, not a substitute for an exact path query.

### C — reverse impact, direct vs transitive consumers

~~~bash
"$GRAPHIFY" affected 'ResolvedOwnerNode' --depth 1 --graph "$GRAPH"
"$GRAPHIFY" affected 'ResolvedOwnerNode' --depth 3 --relation calls --graph "$GRAPH"
"$GRAPHIFY" explain 'ResolvedDependentNode' --all --graph "$GRAPH"
~~~

Check that the relationship name actually exists in the graph: CLI affected --relation filters edge **relation** labels (for example "calls"), while query --context filters **context** labels (for example "call"). Those strings are not interchangeable. An empty filtered result requires trying the unfiltered query and direct source inspection.

### D — hubs, communities, schema and structure diagnostics

~~~bash
"$GRAPHIFY" god-nodes --top 20 --json --graph "$GRAPH"
"$GRAPHIFY" diagnose multigraph --json --graph "$GRAPH"
"$GRAPHIFY" section 'docs/operations/NEXI_SQLITE_DATABASE_RUNBOOK.md#Overview' --graph "$GRAPH"
~~~

"section" is only meaningful when the graph contains indexed Markdown sections and the requested heading exists; code-only extraction may not provide it. "diagnose multigraph" identifies same-endpoint relation-collapse risk, not complete static source coverage. "god-nodes" highlights connectivity, not authoritative ownership.

**Live diagnostic, 2026-11-22:** on the active graph, `diagnose multigraph --json` found 24,368 raw edges, 647 directed and 731 undirected same-endpoint collapse-risk counts, 615 same-endpoint groups, and 214 relation-variant groups. It listed `PRISMA_READS` and `PRISMA_WRITES` sharing endpoint pairs. Its simulated simple Graph had 9,571 nodes and 23,632 edges. This is a risk finding, not proof that raw edge records were deleted from graph.json; the diagnostic notes a normal post-build graph cannot recover raw producer edges.

### E — ambiguity, vocabulary and low-noise graph queries

Upstream Graphify query matches existing labels/IDs; a natural-language sentence can seed irrelevant generic words. Prefer actual class/function names from source or graph results. A third-party Graphify query reference recommends deriving a vocabulary from graph node labels, then selecting only matching terms before traversal. **Cache it per graph SHA** rather than reading a very large graph on every query. The method is optional routing assistance, not a built-in synonym or embedding index. Never invent graph labels, claim "no match" proves absence, or regenerate vocabulary for unchanged graph versions. Large multi-token queries can contaminate traversal with unrelated communities.

On the live CLI v0.9.112, `graphify query --help` advertises `--no-doc-demotion` although the root help omits it. The local MCPC exposes the equivalent `demote_docs` boolean (default true); set it false only for a docs-first query. Check the installed subcommand help before relying on a flag missing from the root reference.

Exit codes for query/path/explain: 0 answer, 3 ambiguous with candidates, 4 no matching node. React to 3 with qualified ID; to 4 with current-source search/alternative real labels; to truncated output with narrower seeds or justified larger budget. Never increase token budget indefinitely.

### F — multiple repositories and combined graphs

~~~bash
"$GRAPHIFY" merge-graphs backend-graph.json public-graph.json admin-graph.json --out combined.json
"$GRAPHIFY" global add graphify-out/graph.json --as nexi
"$GRAPHIFY" global list
"$GRAPHIFY" global path
# Removing a tag mutates global graph; requires specific authorization:
# "$GRAPHIFY" global remove nexi
~~~

Merge-graphs combines existing graphs; it cannot manufacture cross-repo relationships missing from the extractors. Use exact node/edge identity and revision checks. Graphify Cloud's hosted "Combine graphs" is a different operation, requiring two or more indexed repos and a promoted combined graph. A single NEXI mono-repository does not need artificial splitting.

### G — exports, memory, feedback and PR workflows

~~~bash
"$GRAPHIFY" export html --graph "$GRAPH"
"$GRAPHIFY" export callflow-html --graph "$GRAPH" --max-sections 8
"$GRAPHIFY" export wiki --graph "$GRAPH"
"$GRAPHIFY" export obsidian --graph "$GRAPH"
"$GRAPHIFY" export graphml --graph "$GRAPH"
"$GRAPHIFY" export svg --graph "$GRAPH"
"$GRAPHIFY" export neo4j --graph "$GRAPH"
"$GRAPHIFY" export falkordb --graph "$GRAPH"
"$GRAPHIFY" tree --graph "$GRAPH"
"$GRAPHIFY" benchmark "$GRAPH"

# Save only source-checked conclusions:
"$GRAPHIFY" save-result --question 'Verified source owner question' --answer 'Verified source claim' --nodes ResolvedNode --outcome useful
"$GRAPHIFY" reflect --graph "$GRAPH"
"$GRAPHIFY" prs
~~~

Exports write artifacts; Neo4j/FalkorDB --push uses external DB and distinct permission/secrets. Benchmark compares graph retrieval with a naive full-corpus read unless a fair real-task baseline is measured. "save-result" outcomes useful, dead_end, corrected; "reflect" produces lessons with decay/corroboration, not a new authoritative code contract. PR dashboard requires GitHub access. The supplied query-navigation instructions mention `reflect --if-stale`, but live CLI v0.9.112 help does not advertise that option; use only the installed version's supported `reflect` arguments.

### G1 — Enriched-graph debugging: multigraph, wiki, call-flow, and sections

Use this sequence when debugging NEXI from the enriched local graph. Keep the graph as the primary map, but verify consequential paths against source. Do not rebuild or activate a graph just to clear a documentation-only HEAD mismatch.

~~~bash
cd /home/mellonelay1999/workspaces/Nexi
GRAPHIFY=/home/mellonelay1999/.local/share/uv/tools/graphifyy/bin/graphify
GRAPH=$PWD/graphify-out/graph.json
MCPC=/usr/local/bin/nexi-mcpc

# Establish graph identity/freshness before interpreting any result.
git status --short
git rev-parse HEAD
sha256sum "$GRAPH"
"$MCPC" @nexi-graphify-live tools-call graph_stats '{}' --json

# Check for edge multiplicity before exporting to simple-graph consumers.
"$GRAPHIFY" diagnose multigraph --graph "$GRAPH" --json

# Focused source navigation and direction-aware impact.
"$GRAPHIFY" query "ExactServiceOrQuestion" --graph "$GRAPH" --context call --depth 2 --budget 2000
"$GRAPHIFY" explain "ExactNodeID" --graph "$GRAPH"
"$GRAPHIFY" path "ExactSourceID" "ExactTargetID" --graph "$GRAPH"
"$GRAPHIFY" affected "ExactNodeID" --relation calls --depth 2 --graph "$GRAPH"

# Derived browsing views. Use a fresh output directory/name; wiki export owns/prunes its wiki directory.
test ! -e "$PWD/graphify-out/wiki" && "$GRAPHIFY" export wiki --graph "$GRAPH"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
test ! -e "$PWD/graphify-out/NEXI_CALLFLOW_$STAMP.html" && "$GRAPHIFY" export callflow-html --graph "$GRAPH" --output "$PWD/graphify-out/NEXI_CALLFLOW_$STAMP.html" --lang en --max-sections 8
test ! -e "$PWD/graphify-out/NEXI_TREE_$STAMP.html" && "$GRAPHIFY" tree --graph "$GRAPH" --output "$PWD/graphify-out/NEXI_TREE_$STAMP.html"

# Section retrieval: pass an exact indexed heading or source-path::heading.
"$GRAPHIFY" section "path/to/runbook.md#Exact heading" --graph "$GRAPH" --max-chars 5000
"$MCPC" @nexi-graphify-live tools-get get_section
"$MCPC" @nexi-graphify-live tools-call get_section '{"label":"path/to/runbook.md::Exact heading","max_chars":5000}' --json
~~~

Interpretation and safe-use rules:

- `diagnose multigraph` compares raw edge multiplicity with a simple-graph projection. It reports a consumer-collapse risk; it does not prove the stored JSON or every graph reader has lost edges. Inspect the actual consumer and confirm representative relation variants with local MCPC `get_neighbors` before drawing that conclusion.
- In the observed Graphify 0.9.112 local server, `graphify/serve.py::_read_graph` detects parallel links and promotes the NetworkX object to a MultiGraph. A live `get_neighbors` call retained repeated `PRISMA_READS` and `PRISMA_WRITES` links for the same endpoints. Treat this as verified for that installed reader/version and sample, not every external consumer.
- Current sample diagnostic (graph SHA and revision must be rechecked before reuse): 9,743 nodes, 24,368 raw edges, 647 directed same-endpoint collapses, 731 undirected collapses, 214 relation-variant groups, 9 self-loops, 0 exact duplicate edges. This is a shape diagnostic, not an accuracy score.
- The wiki exporter has no explicit output-path flag in this CLI version; it writes to `graphify-out/wiki/` and manages/prunes that generated directory. Inspect it first and preserve existing user content. Wiki pages and HTML/tree views are derived navigation aids, not independent source truth. They may reflect stale documentation/extraction inputs.
- Call-flow HTML supports an explicit `--output`, so write to a new, ignored `graphify-out/` filename. Large-graph warnings or community-sidecar staleness should be recorded; do not run `cluster-only` or another writer unless graph maintenance is separately authorized.
- Use exact node IDs after keyword discovery. A broad `graphify section "Binary"` failed in the observed 0.9.112 environment with a missing-node `KeyError`; local MCP `get_section` also returned no match for a runbook added after the graph baseline. Retry once with an exact indexed path/heading or node ID. If it remains absent, read the current runbook directly and mark the graph lookup unavailable/stale; do not regenerate the graph just to index new documentation.
- A graph commit older than HEAD is not automatically unusable. Compare changed paths and extraction relevance. Documentation-only changes can leave source relationships applicable while making documentation-section/wiki content stale. Record this distinction explicitly.
- Never interpret a missing path as proof of independence, an undirected path as execution direction, or a graph relationship as runtime proof. Use Fallow/source/runtime evidence only when the task requires those distinct questions.

**Observed 2026-11-22 on the live local NEXI graph:** Graphify CLI and local `@nexi-graphify-live` were both 0.9.112; graph stats reported 9,743 nodes / 24,368 edges / 245 communities, built at `6b3d04868caa37d32540bd2fb76dce8f19516ea6`, while repository HEAD was `f3515cf76d46` and MCP warned it may be stale. Read-only `export wiki` wrote 255 articles; `export callflow-html` wrote 17 sections, 16 Mermaid diagrams, and 15 call tables to `graphify-out/NEXI_CALLFLOW_20261122.html`; `tree` wrote `graphify-out/NEXI_TREE_20261122.html` (480,224 bytes). Export warned that `.graphify_analysis.json` was stale and communities were reconstructed in memory; no sidecar refresh or graph rebuild was run. The current runbook was not indexed in that graph revision. These are dated observations, not permanent defaults.

**Not enabled by this runbook:** automatic Git hooks, OpenClaw/Codex/Claude integration installers, Cloud indexing, database pushes, or persistent watcher. Follow the actual CLI --help appendix for complete installed command/flag coverage; a CLI option appearing in help is not an instruction to execute it.

## 5. Local MCP/MCPC: exact eleven-tool command cookbook

Select the session first, then use the same local MCP tool contracts; avoid automatically querying both graphs. The eleven tools are source-independent, but graph content is not.

~~~bash
export MCPC=/usr/local/bin/nexi-mcpc
"$MCPC" @nexi-graphify-live tools-list
"$MCPC" @nexi-graphify-live tools-list --full
"$MCPC" @nexi-graphify-live tools-get query_graph
"$MCPC" @nexi-graphify-live tools-call graph_stats '{}'
"$MCPC" @nexi-graphify-live tools-call god_nodes '{"top_n":10}'
"$MCPC" @nexi-graphify-live tools-call query_graph '{"question":"MarketAuthorityService MarketQuoteLatest","mode":"bfs","depth":2,"token_budget":1200}'
"$MCPC" @nexi-graphify-live tools-call query_graph '{"question":"MarketAuthorityService","mode":"dfs","depth":3,"context_filter":["call"],"token_budget":1500}'
"$MCPC" @nexi-graphify-live tools-call get_node '{"label":"ResolvedNodeID"}'
"$MCPC" @nexi-graphify-live tools-call get_neighbors '{"label":"ResolvedNodeID","token_budget":1200}'
"$MCPC" @nexi-graphify-live tools-call get_neighbors '{"label":"ResolvedNodeID","relation_filter":"calls","token_budget":1200}'
"$MCPC" @nexi-graphify-live tools-call shortest_path '{"source":"ResolvedSourceID","target":"ResolvedTargetID","max_hops":8,"undirected":false}'
"$MCPC" @nexi-graphify-live tools-call get_community '{"community_id":0,"token_budget":1500}'
"$MCPC" @nexi-graphify-live tools-call get_section '{"label":"docs/operations/<file>.md::Heading","max_chars":4000}'
~~~

**Local MCP tools and their complete argument sets (live Graphify MCP v0.9.112; `tools-list --full` captured 2026-11-22):**
- query_graph: **question** string; mode bfs|dfs (bfs); depth integer 1–6 (3); token_budget (2000); context_filter array[string]; demote_docs boolean (true); project_path optional absolute project directory. Set demote_docs=false for a genuinely docs-first corpus.
- get_node: label or node_id; optional project_path. Use the exact graph identifier from query_graph, not a guessed name.
- get_section: label/node_id heading, node ID, `path/file.md::Heading`, or whole Markdown page; max_chars (8000); project_path. Returns the underlying source text and subsections when resolvable; verify the source location and current file.
- get_neighbors: label or node_id; relation_filter string; token_budget (2000); project_path. No proof an edge represents real runtime traffic.
- graph_stats: optional project_path. Counts are not coverage percentage.
- god_nodes: top_n (10); exclude_hubs_percentile 0–100; project_path. Useful for architecture orientation.
- shortest_path: source, target; max_hops (8); undirected (false); project_path. Returned path confidence is the weakest hop.
- get_community: community_id integer 0-indexed; token_budget (2000); project_path.
- list_prs: base, repo, project_path; requires GitHub integration and project context; read-only PR data.
- get_pr_impact: **pr_number** integer, repo, project_path; graph-derived PR blast radius.
- triage_prs: base, repo, project_path; actionable PR ordering, not PR execution.

~~~bash
# PR tools: require a real authorized repository and PR, not placeholders.
"$MCPC" @nexi-graphify-live tools-get list_prs
"$MCPC" @nexi-graphify-live tools-call list_prs '{"repo":"Mellonelay/Nexi"}'
"$MCPC" @nexi-graphify-live tools-get get_pr_impact
# Substitute actual PR number before invoking:
# "$MCPC" @nexi-graphify-live tools-call get_pr_impact '{"repo":"Mellonelay/Nexi","pr_number":123}'
"$MCPC" @nexi-graphify-live tools-call triage_prs '{"repo":"Mellonelay/Nexi"}'
~~~

**Same tools, independent reference data:**

~~~bash
"$MCPC" @nexi-knowledge tools-list
"$MCPC" @nexi-knowledge tools-call graph_stats '{}'
"$MCPC" @nexi-knowledge tools-call query_graph '{"question":"Graphify source provenance query workflow","mode":"bfs","depth":2,"token_budget":1400,"demote_docs":false}'
~~~

Graphify-mcp accepts project_path for a different authorized graph. Avoid using cross-graph project_path as a hidden replacement for the two named sessions. MCPC session server may cache a graph; verify its graph_stats after a build, and reconnect/reopen the MCP session only when stale. Do not restart NEXI application services to refresh MCP.

### MCP combination recipes

1. **Locate a feature:** graph_stats → query_graph BFS/keywords → get_node exact ID → get_neighbors → read source. Stop when relevant source is located.
2. **Trace dependencies:** query_graph DFS with context_filter → shortest_path directed → check weakest confidence and all exact file lines; fallback to source search.
3. **Impact audit:** get_neighbors direct/inbound + query_graph depth=2 + exact source consumers. Local MCP has no dedicated "affected" tool: use CLI affected when reverse traversal is the actual question.
4. **Large-system navigation:** god_nodes → get_community → bounded query_graph from a discovered real symbol; avoid including every community in the prompt.
5. **Cross-check knowledge:** @nexi-knowledge with demote_docs=false → @nexi-graphify-live for code owner → actual file and revision verification.
6. **Review scope:** list_prs → get_pr_impact → triage_prs; no PR mutation, CI execution or Git checkout implied.
7. **Quality/failure:** check graph_stats / exact source revision, identify truncation and ambiguous nodes, compare with rg and current source; report missing/unsupported edges as coverage gaps.

## 6. Hosted Graphify Cloud: separate product reference (not the NEXI enriched-graph route)

Hosted MCP **https://api.graphify.com/mcp** is Streamable HTTP with OAuth and workspace permission. It is **not** local graphify-mcp or nexi-mcpc, and owner direction for the NEXI enriched graph selects only the local CLI and local MCPC. Keep the material below as a separate product reference; do not substitute a hosted index or repository group for the local unified artifact. NEXI Cloud indexing and repository sync are not authorized by this runbook.

**Core Cloud tool combos:**
- **Find source:** list_repositories → graph_stats (commit/freshness) → graphify_rank_files or graphify_find → graphify_node → current source.
- **Call chain:** graphify_find → graphify_callers and graphify_trace → check call sites and inferred edges → current source.
- **Change impact and tests:** graphify_impact (and risk when available) → graphify_file_neighbors → graphify_tests_for → current source + test files. Discovery of a test is not execution.
- **Imports/consumers:** graphify_imports_exports → graphify_file_neighbors → inspect producer/consumer contracts.
- **Hosted memory:** recall → source check → remember candidate/review when authorized; Cloud memory does not update Knowledge v4.
- **Workspace:** list_workspaces; set_workspace changes session/default state and needs appropriate authority. review_status reads available review; run_repository_starter_task is a stateful task handoff.
- **Combined hosted graphs:** Graphs → Combine graphs → await promoted group → list_repositories kind=workspace → tools target group's repository_id. Requires suitable plan and multiple actual repos.
- **ChatGPT/Codex:** ChatGPT's connected Graphify plugin is hosted; Codex remote configuration uses graphify MCP OAuth, not local CLI install. Verify live tool registry schemas.

Hosted Cloud plans, document coverage and repository freshness may differ from local graph. Do not mix Cloud node IDs with local MCP node IDs without confirming identity. Docs: https://docs.graphify.com/platform/graphs ; https://docs.graphify.com/platform/trace ; https://docs.graphify.com/platform/graphify-mcp ; https://docs.graphify.com/integrations/chatgpt ; https://docs.graphify.com/platform/verify-connection .

## 7. NEXI operational playbooks (source-first, task-specific)

### Wallet/SIWE
Start exact source/auth symbols; trace controllers → guards → service → Prisma session/challenge; reverse trace Public wallet consumers and Admin session views. Confirm Ethereum chain 1 and current source. Graph paths are not proof of a successful signature.

### Market quote and charts
Locate MarketAuthorityService, MarketQuoteSnapshot, MarketQuoteLatest, MarketKline, ingest and retention handlers. Traverse provider normalize/ingest → latest/candle consumers → Public quote streaming/chart, then direct DTO/event/Prisma source. Graphify's absence of an SQL/HTTP edge does not mean no dependency. Use file-level grep for dynamic route strings and Socket.IO event names.

### Financial settlement and Ledger
Find Options/Binary settlement owner; inspect inbound callers, duration config, SQL transaction and LedgerAccount/LedgerPosting single-writer path, Admin readbacks and Public status. Dynamic financial operations and idempotency are verified in source; never reconstruct financial truth from a graph edge.

### BullMQ/Valkey/Redis and durable jobs
Find queue producer and worker, BullMQ transport, Redis integration, outbox/inbox persistence, retries and idempotency. Static graph cannot certify queue connectivity or successful job processing. Do not start queue workers to query Graphify.

### Cross-surface DTO, route and realtime contracts
Locate exact declaration and importers; compare Backend controller/service, Public fetch or stream and Admin client. Standard Graphify may not link string-based HTTP paths, Socket.IO event topics, Prisma generated-client calls or implicit dependency-injection edges. Record such gaps and inspect those consumers directly; do not pretend the retired native extractor semantics ship with upstream Graphify.

### Git and PR risk
Graph owner impact → relevant source diff → local PR tools or Cloud review status → candidate tests; report source-only evidence until application verification is separately authorized.

## 8. Source quality, practical performance, and failure handling

**Measure, do not assume:** report indexed supported files and source references by Backend/Public/Admin, actual graph nodes/edges/communities, directedness, extracted/inferred confidence, graph hash, manifest root and source revision. Compare graph-assisted vs direct rg/read on representative NEXI tasks only if such a benchmark is separately authorized. Vendor benchmark is generally against a naive full-corpus baseline, not a fair agent with targeted grep.

**Known failure modes:** namespace/re-export/dynamic call edges missing; inner functions/registries unresolved; bare-word seeding crosses unrelated domains; truncation hides relevant nodes; ambiguous labels; stale source graph; CLI and MCP default depths differ; CLI memory/reflection is not MCP memory; Cloud and local graphs do not sync automatically. Use exact IDs, bounded seeds, correct relation/context filters, current source and fallback grep. Graphify query/path/explain errors 3 and 4 are expected evidence of ambiguity or missing matches.

**Independent community evidence:** Some case studies show material token savings; other controlled comparisons on JavaScript and large monorepos found Graphify slower or incomplete relative to rg+Read. Do not advertise a universal speedup. References: https://github.com/alikula37/graphify-in-action ; https://github.com/ipunithgowda/graphify-notes ; https://github.com/thelunarcompany/lunar/blob/9307edc0d3f0bd488ae7532bb9ea160e3192aa8b/readme-files/GRAPHIFY.md ; https://www.quangrau.com/blog/graphify-benchmark-gonnacrash/ ; https://github.com/Graphify-Labs/graphify/issues/985 ; https://github.com/Graphify-Labs/graphify/issues/3768 ; https://github.com/Graphify-Labs/graphify/issues/3810 .

**Advanced query-source references:** https://github.com/Graphify-Labs/graphify/blob/v8/graphify/skills/windows/references/query.md (vocabulary expansion; costly if repeatedly regenerated) ; https://github.com/Graphify-Labs/graphify/blob/v8/graphify/skill.md (agent skill/CLI split) ; https://github.com/reason-machines/trending-skills/blob/main/skills/graphify-knowledge-graph/SKILL.md (third-party techniques, verify against installed release); https://docs.graphify.com/open-source/configuration/cli#query ; https://docs.graphify.com/open-source/features/querying .

**Completion criteria for any Graphify task:** correct dataset, accepted command/tool, actual result, source location, provenance, source/graph revision, bounded evidence, no failed commands misrepresented as successful, and explicit unknowns. Application/runtime results require separate authorization.

---
## Appendix A — Detailed hosted and local feature inventory

The following inventory is retained as a secondary reference for all hosted and local feature families. Commands and current operating recipes above are authoritative.

### A.1 Verified installation, versions, and the three surfaces

| Surface | Current entry | Authentication / authority | Actual proof |
|---|---|---|---|
| Cloud (hosted Platform) | https://app.graphify.com ; hosted MCP `https://api.graphify.com/mcp` | OAuth, workspace membership, repository index state and plan. No pasted API key for hosted MCP. | ChatGPT Graphify plugin `list_repositories` and `graph_stats` returned indexed `Mellonelay/Nexi`, 6,054 nodes / 18,283 edges / 322 communities at commit `00be8e97a1317a354e9427a5e37ebe854c4b5e7e`, indexed 2026-11-14. |
| Local CLI | `/home/mellonelay1999/.local/bin/graphify` | OS owner permissions; graphs on disk. `graphifyy[all]` installed at v0.9.111. | `graphify --version` and local command help; actual graph revision is independent of package. |
| Local MCP through MCPC | `graphify-mcp`; `/usr/local/bin/nexi-mcpc` aliases | Local process filesystem permissions; no Cloud OAuth. | `@nexi-graphify-live` and `@nexi-knowledge`; each exposes 11 local tools. |

**Critical freshness difference:** the Cloud indexed commit `00be8e9` does *not* match VM repository HEAD `7a5aa7f` at this task's starting checkpoint. Cloud is authenticated and indexed, but its findings may be stale. Check `graph_stats.result.freshness` for every consequential conclusion. Cloud plan limitations can exclude non-README documentation from an index. The local source graph and local Knowledge v4 graph have different purposes and never automatically synchronize with Cloud.

**Release source:** https://github.com/Graphify-Labs/graphify/releases/tag/v0.9.111 and https://pypi.org/project/graphifyy/ . v0.9.111 raises the minimum Python to 3.11 and refreshes dependency/security pins, without changing the AST cache schema. It is distinct from v0.9.109 and does not imply any native NEXI patch.

### A.2 Hosted Cloud Console: all 32 documented Platform pages

**Getting started and workspace:** Overview, How Graphify works, Quickstart, Console tour, Repositories and builds, Keeping the graph fresh, Workspaces and members, Contributors, Profile, Graphify-vs-local comparison. The user signs in, grants GitHub/GitLab source permissions, explicitly enables repository indexing, observes build progress/commit, chooses an authorized workspace and opens repository graphs. Repositories and builds are *hosted* operations; none is triggered by viewing this runbook. A plan may limit indexed repositories/nodes and feature access.

**Explore the graph and Ask:** Graphs (single-repository and combined cross-repo canvas, communities, node/edge inspector, incoming/outgoing relationships, reverse dependents, path views, up to 100 repositories per graph where plan permits), Ask (source-located answers), Trace (caller/callee path techniques), Index freshness, Wiki (generated articles), Insights (source analysis), and the distinction between EXTRACTED, INFERRED and AMBIGUOUS provenance. Graph color, community membership and proximity are structural visualization signals, not source ownership or a proven runtime call.

**Reviews and automated verification:** Pull request reviews, review findings and verdicts, colliding PRs, formal verification and how to read a verification check, test impact analysis. Formal verification is scoped and advisory, not full application proof. CI-impact requires separately authorized CI token/Buildkite integration and can fall back to full suite; no PR or CI action authorized here.

**Learning, memory and connectors:** Graphify Memory supports recalled source-linked workspace facts and reviewed publication/candidates; Learning adjusts future review findings; Connectors/Integrations connect source providers, Google Drive and agents; permissions are workspace- and provider-specific. No implicit synchronization into NEXI Knowledge v4 or other app memory.

**Security, plans and operation:** Connections, Graphify MCP, Check connection, Workspaces/roles, Pricing, Security/data handling, Rate limits, Troubleshooting, Support FAQs and supported output. OAuth login, repository indexing permission, tool invocation and a returned matching commit are separate evidence stages. Hosted Graphify MCP tools are queried via current `tools/list` and may evolve independently of local MCP.

**Hosted client connection:** https://api.graphify.com/mcp is Streamable HTTP + OAuth. ChatGPT Graphify plugin connects to that hosted endpoint and uses the authenticated Graphify workspace. It does *not* install, update, or invoke local MCPC. Official: https://docs.graphify.com/integrations/chatgpt and https://docs.graphify.com/platform/verify-connection .

#### A.2.1 Actual 21 hosted Graphify plugin tools currently exposed

| Hosted tool | Use / key contract |
|---|---|
| `list_repositories` | Authorized repository ids, names, readiness and queryability. |
| `graph_stats` | Versioned indexed node/edge/community statistics, indexed SHA and freshness. |
| `search` → `fetch` | Search fragments in code symbol labels, then fetch the exact returned id. |
| `graphify_find` | Symbol name fragment, return definition candidates. |
| `graphify_node` | Full selected symbol definition and immediate graph neighbors; names may be ambiguous. |
| `query_graph` | Natural-language question, budget and seeds, source-located definitions. |
| `graphify_trace` | Directed source-to-target call paths; strict or inferred depending on parameter. |
| `graphify_callers` | Inbound callers; absence may mean partial graph coverage. |
| `graphify_impact` | Bounded direct callers/callees; optional test-link risk ranking. |
| `graphify_file_neighbors` | File-to-file dependencies and dependents. |
| `graphify_imports_exports` | Import/export graph edges for repo-relative file. |
| `graphify_tests_for` | Graph-linked test candidates; not a verified test run. |
| `graphify_rank_files` | Rank source files for a natural-language question. |
| `graphify_help` | Setup, tool routing, repository rules, plan and troubleshooting. |
| `recall` | Source-linked workspace memory (published vs unverified candidate distinction). |
| `remember` | Store a workspace note/candidate; may require review before publication. |
| `list_workspaces` | See workspace memberships and current workspace. |
| `set_workspace` | Change session/default workspace; state mutation, use only if owner-authorized. |
| `review_status` | Inspect review status and findings; does not run review. |
| `run_repository_starter_task` | Explicit existing repository task handoff by unchanged ID. |

The `search`/`fetch` pair counts as two tools; total **21**, verified through this ChatGPT runtime tool registry. A tool being listed does *not* mean it was invoked. Current results are repository/commit scoped. Refer to each advertised tool's actual schema rather than making up arguments or assuming local MCP aliases support hosted functions.

### A.3 Open-source CLI: all 31 documented topics

**Installation, activation, self-host:** Upstream PyPI `graphifyy`; `uv` or `pipx`; independent `graphify` CLI and `graphify-mcp` executable. Runtime here uses Python 3.12. Standard extras: `[all]` installed, including MCP, watch, language/SQL, optional document/media, SVG and semantic dependencies. Installing extras does not configure Cloud authentication, API keys, database access or external services. Optional local `graphify-mcp` HTTP team hosting and Docker are distinct from hosted Graphify Cloud.

**Code extraction and graphs:** Supported languages, Tree-sitter and language-specific parsers; AST nodes for modules/files/classes/functions/imports/calls, resolved/inferred edges, source anchors and coverage notes. Optional semantic text/document/media extraction depends on backend and source rights; code-only is deterministic and needs no LLM. Database/package graphs and read-only Postgres introspection have distinct credential requirements. Query omissions and dynamic-call gaps are not automatically app defects.

**Incremental refresh and coverage:** `extract` for full graph build, `update` for changed source, `watch` and Git hooks for automated refresh; `.graphifyignore`, `.graphifyrc`, environment variables, size caps and provider configuration control scope. Git hooks and agents may mutate tracked files. A graph built from a previous source revision is not automatically current; compare manifest and changed sources.

**Queries and structure:** `query` BFS vs `--dfs`, `--seed`, `--context`, `--budget` and `--depth`; `explain` for a node; `path` directed by default with optional undirected; `affected` reverse impact; `god-nodes` and communities; deduplication/symbol resolution and provenance. Empty/ambiguous matching is not proof of absence. Query/schema behavior comes from installed release.

**Advanced capabilities:** `cluster-only`; PR risk/collisions/triage via `prs` where Git auth is available; multi-repo graph merging; `save-result`/`reflect` work memory; token benchmark and honest cost accounting; `graphify add URL` ingest; exports to HTML, tree, Wiki, Obsidian, SVG, GraphML, Neo4j, FalkorDB and callflow HTML. Export outputs are representations, not new execution evidence; HTML node limits do not truncate underlying graph JSON.

**Source docs, troubleshooting and integrations:** Installation, CLI quickstart, skill quickstart, local development, headless extraction, troubleshooting, and agent registration/vibe coding. File/watcher integrations, hooks and model/provider configuration require explicit permission; do not install global hooks simply to query a graph.

#### A.3.1 Standard CLI command examples

`graphify --version`; `graphify --help`; `graphify query 'where is the market quote authority?' --graph GRAPH --budget 1200 --depth 2`; `graphify query 'trace the financial handler' --dfs --graph GRAPH`; `graphify explain NODE --graph GRAPH`; `graphify path A B --graph GRAPH`; `graphify affected NODE --depth 2 --graph GRAPH`; `graphify god-nodes --top 10 --json --graph GRAPH`; `graphify diagnose multigraph --json --graph GRAPH`.

**Artifact-writing, use only with explicit ownership:** `graphify extract PATH --code-only`; `graphify update PATH`; `graphify watch PATH`; `graphify cluster-only PATH`; `graphify add URL`; `graphify merge-graphs`; `graphify export ...`; `graphify hook install`; `graphify install --platform agents`; `graphify save-result`; `graphify reflect`. Confirm exact syntax in installed `graphify --help` and official https://docs.graphify.com/open-source/configuration/cli .

#### A.3.2 Local MCP/MCPC actual eleven tools

| Local MCP tool | Intent and important distinction |
|---|---|
| `query_graph` | Bounded BFS/DFS graph question, token budget; unlike hosted query_graph schema. |
| `get_node` | Source-located exact graph node details. |
| `get_neighbors` | Bounded incoming/outgoing relations with optional relation filter. |
| `get_community` | Community group, not authoritative module owner. |
| `god_nodes` | Most connected graph hubs. |
| `graph_stats` | Nodes/edges/communities for the selected graph. |
| `shortest_path` | Directional paths; labels must resolve. |
| `list_prs` | Optional git provider status. |
| `get_pr_impact` | PR blast radius with configured repo/credentials. |
| `triage_prs` | PR prioritization when integration exists. |

Live sessions: `nexi-mcpc @nexi-graphify-live tools-list` and `nexi-mcpc @nexi-knowledge tools-list`. Read schemas using `tools-get NAME`; call with `tools-call NAME '{...}'`. The first graph at `/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json` is source structure; the second graph at `/srv/nexi/engineering-knowledge/20261110/graphify-out/graph.json` is reference knowledge. Querying one cannot substitute for the other. Local MCPC process metadata can differ from the updated on-disk CLI version until process reconnect; verify each independently.

### A.4 Ecosystem integrations (17 official pages)

| Group | Scope |
|---|---|
| ChatGPT / Codex / Dots | Hosted Graphify plugin, OAuth, hosted workspace; Codex local skill is separate. |
| Claude AI and Claude Code | Hosted MCP directory/config; local skill routes separately. |
| Cursor, Gemini CLI, VS Code / Copilot, JetBrains | MCP client integrations and provider-specific setup. |
| Hermes, OpenClaw and other agents | Agent-specific connection and authentication instructions. |
| GitHub and GitLab | Authorized repository access, indexing and PR-related integrations. |
| Google Drive | Authorized folders/docs indexing; access controls distinct from code repo. |
| Buildkite | CI test-impact selection, scoped CI bearer token and full-suite fallback. |
| Vercel | Marketplace connector, project tokens/environment variables and MCP/SDK. |
| Integrations overview | Agent/client compatibility and cross-provider navigation. |

The official 17-page integration inventory is in the Knowledge v4 index. Cloud connectors are optional, not automatically enabled by installing upstream `graphifyy`.

### A.5 Concepts, agents, memory, tutorials, changelogs

The official corpus additionally contains 12 concepts (architecture, dependency resolution, provenance, calls, impact, formal verification, output files and PR collision/review); 4 agent guides (tool selection, headless bots, prompts and connectivity); 23 practical cookbooks (source navigation, reviewing/verification, team/agent workflows); 4 changelog pages; the platform-agent setup guidance, indexing entry and MCP documentation. These sections explain how to interpret graph results, choose high-confidence source anchors, manage agent access, and avoid fabricated trace or completeness claims. No graph operation substitutes for reading current source or verifying runtime behavior.

### A.6 Security and operational verification

1. **Cloud:** use `list_repositories` and `graph_stats`, confirm workspace, indexed status, latest commit and coverage; source/upload/index/review writes need separate authorization. Host Graphify plugin may be connected while the local MCP server is not.
2. **Local CLI:** verify owner user's Graphify version and tool environment, exact command flags, local graph file provenance and source checkout HEAD; do not assume package upgrade refreshes old graph.
3. **Local MCPC:** list both session tools and check `graph_stats` on their specific graph paths; reconnect sessions after upgrades only if needed, without restarting Backend/Admin/Public.
4. **Sources of truth:** repo code and current NEXI owner decisions outrank stale hosted or local graph edges. `EXTRACTED` denotes static code evidence; `INFERRED` denotes candidates; none proves transaction behavior or Socket.IO delivery.
5. **Coverage:** allow missing/ambiguous edges and partial language support; document known gaps instead of claiming whole-repo mapping. All three surfaces provide complementary context, not one universal perfect graph.

### A.7 Primary official references and complete topic inventory

Full official documentation captured from https://docs.graphify.com/llms-full.txt on 2026-11-16; individual source-attributed Markdown files and SHA-256 entries in Knowledge v4 `30_GRAPHIFY/official-pages/` and `GRAPHIFY_OFFICIAL_DOCUMENTATION_CORPUS_20261116.json`. Human index: `GRAPHIFY_OFFICIAL_126_TOPIC_INDEX_20261116.md`. **126 pages**: 32 platform, 31 open source, 17 integrations, 12 concepts, 23 cookbooks, 4 agents, 4 changelog and 3 additional foundational pages. Official links in each index entry. No third-party blog is needed to establish official product capabilities.

Key navigational pages: https://docs.graphify.com/platform/graphs ; https://docs.graphify.com/platform/connections ; https://docs.graphify.com/platform/verify-connection ; https://docs.graphify.com/platform/trace ; https://docs.graphify.com/platform/repositories ; https://docs.graphify.com/integrations/chatgpt ; https://docs.graphify.com/open-source/features/querying ; https://docs.graphify.com/open-source/features/mcp-tools ; https://docs.graphify.com/open-source/configuration/cli .

**Retired workflow:** the former NEXI native Python Graphify customization is not a supported component. Historical evidence may remain in immutable Git and security audit history, but live code, active guidance and installed upstream package should not depend on those modifications. Do not reapply patches or use retired relation types as upstream contracts.


## Appendix B — Complete installed upstream CLI reference

Captured from the live NEXI VM on 2026-11-22. Graphify CLI reports `0.9.112`. This is the installed root `graphify --help` output and enumerates all command families, flags, output formats, and agent-integration subcommands. It is an inventory only: installing, uninstalling, watching, extracting, updating, exporting, pushing to a database, or changing providers/hooks requires a separately scoped task and authorization.

~~~text
Usage: graphify <command>

Commands:
  install [--platform P]  copy skill to platform config dir (claude|codex|opencode|kilo|aider|copilot|claw|droid|trae|trae-cn|hermes|kiro|pi|codebuddy|antigravity|antigravity-windows|windows|kimi|amp|agents|devin|gemini|cursor)
  uninstall               remove graphify from all detected platforms in one shot
    --purge                 also delete graphify-out/ directory
  path "A" "B"            shortest path between two nodes in graph.json
    --graph <path>          path to graph.json (default graphify-out/graph.json)
    --directed              force a directed search (the default;
                            the JSON 'directed' flag is NOT consulted)
    --undirected            ignore edge direction
  explain "X"             plain-language explanation of a node and its neighbors
    --all                   list every connection (default: the 20 most connected)
    --graph <path>          path to graph.json (default graphify-out/graph.json)
  section "X"             print the text of a Markdown section (heading and subsections)
                            "docs/api.md#X" picks X in one file when several share it
    --max-chars N           cap on printed characters (default 8000)
    --graph <path>          path to graph.json (default graphify-out/graph.json)
  diagnose multigraph    report same-endpoint edge collapse risk in graph.json
    --graph <path>          path to graph/extraction JSON
                            (default graphify-out/graph.json)
    --json                  emit machine-readable JSON
    --max-examples N        max same-endpoint examples to print (default 5)
    --directed              force directed post-build simulation
    --undirected            force undirected post-build simulation
                            (default follows JSON directed flag;
                             raw extraction with no flag defaults directed)
    --extract-path PATH     extractor source for suppression scan
  clone <github-url>      clone a GitHub repo locally and print its path for /graphify
  merge-driver <base> <current> <other>  git merge driver: union-merge two graph.json files (set up via hook install)
  merge-graphs <g1> <g2>  merge two or more graph.json files into one cross-repo graph
    --out <path>            output path (default: graphify-out/merged-graph.json)
    --previous <path>       restore the previous merged clustering's community ids
                            (by node id) instead of each input's own per-source ids,
                            so a later cluster-only run reuses labels correctly
    --branch <branch>       checkout a specific branch (default: repo default)
    --out <dir>             clone to a custom directory (default: ~/.graphify/repos/<owner>/<repo>)
  add <url>               fetch a URL and save it to ./raw, then update the graph
    --author "Name"         tag the author of the content
    --contributor "Name"    tag who added it to the corpus
    --dir <path>            target directory (default: ./raw)
  watch <path>            watch a folder and rebuild the graph on code changes
  update <path>           re-extract code files and update the graph (no LLM needed)
    --force                 overwrite graph.json even if the rebuild has fewer nodes
                            (also: GRAPHIFY_FORCE=1 env var; use after refactors that delete code)
    --no-cluster            skip clustering, write raw extraction only
  cluster-only <path>     rerun clustering on an existing graph.json and regenerate report
    --no-viz                skip graph.html generation (useful for >5000 node graphs / CI)
    --graph <path>          path to graph.json (default <path>/graphify-out/graph.json)
    --no-label              keep 'Community N' placeholders (skip LLM community naming)
    --backend=<name>        backend to use for community naming (default: auto-detect)
    --model=<name>          model to use for community naming (claude-cli also reads GRAPHIFY_CLAUDE_CLI_MODEL)
    --max-concurrency=N     parallel community-labeling LLM calls (default 4; forced to 1 for ollama/claude-cli)
    --batch-size=N          communities per labeling LLM call (default 100, sized for ~16k context; use 40 for 8k)
  label <path>            (re)name communities with the configured LLM backend, regenerate report
    --missing-only         keep existing labels and only name missing/placeholder communities
    --backend=<name>        backend to use (default: auto-detect from API keys)
    --model=<name>          model to use for community naming (claude-cli also reads GRAPHIFY_CLAUDE_CLI_MODEL)
    --max-concurrency=N     parallel labeling LLM calls (default 4; forced to 1 for ollama/claude-cli)
    --batch-size=N          communities per labeling LLM call (default 100)
  query "<question>"       BFS traversal of graph.json for a question
    --dfs                   use depth-first instead of breadth-first
    --context C             explicit edge-context filter (repeatable)
    --seed X                start at node X (id, label or file path; repeatable)
                            instead of the question's keyword matches
    --budget N, --budget=N  cap output at N tokens (default 2000)
    --depth N, --depth=N    traversal depth 1-6 (default 2)
                            absent options use the selected graph project's .graphifyrc
                            query_budget / query_depth. Explicit options override project values.
    --graph <path>          path to graph.json (default graphify-out/graph.json)
  query, path and explain exit 0 with an answer, 3 when a name is ambiguous
  (the candidates are listed), 4 when no node matches
  affected "X"             reverse traversal to find nodes impacted by X
    --relation R            edge relation to traverse in reverse (repeatable)
    --depth N               reverse traversal depth (default 2)
    --graph <path>          path to graph.json (default graphify-out/graph.json)
  god-nodes               list the most connected nodes (architectural hubs)
    --top N                 how many to show (default 10)
    --graph <path>          path to graph.json (default graphify-out/graph.json)
    --json                  emit JSON instead of text
  prs                     PR dashboard: CI state, review status, worktree mapping
  save-result             save a Q&A result to graphify-out/memory/ for graph feedback loop
    --question Q            the question asked
    --answer A              the answer to save
    --type T                query type: query|path_query|explain (default: query)
    --nodes N1 N2 ...       source node labels cited in the answer
    --outcome O             work-memory signal: useful|dead_end|corrected
    --correction TEXT       what the right answer was (pairs with --outcome corrected)
    --memory-dir DIR        memory directory (default: graphify-out/memory)
  reflect                 aggregate graphify-out/memory/ outcomes into a deterministic lessons doc
    --memory-dir DIR        memory directory (default: graphify-out/memory)
    --out FILE              output path (default: graphify-out/reflections/LESSONS.md)
    --graph PATH            graph.json, for community grouping + dropping stale nodes (optional)
    --analysis PATH         .graphify_analysis.json (optional, auto-detected next to --graph)
    --labels PATH           .graphify_labels.json (optional, auto-detected next to --graph)
    --half-life-days N      signal weight halves every N days (default 30)
    --min-corroboration N   distinct useful results to prefer a node (default 2)
  check-update <path>     check needs_update flag and notify if semantic re-extraction is pending (cron-safe)
  tree                    emit a D3 v7 collapsible-tree HTML for graph.json
    --graph PATH            path to graph.json (default graphify-out/graph.json)
    --output HTML           output path (default graphify-out/GRAPH_TREE.html)
    --root PATH             filesystem root for the hierarchy
    --max-children N        cap children per node (default 200)
    --top-k-edges N         per-symbol outbound edges in inspector (default 12)
    --label NAME            project label in header
  extract <path>          headless full extraction (AST + semantic LLM) for CI/scripts
    --backend B             gemini|kimi|claude|openai|deepseek|ollama (default: whichever API key is set)
                            openai also reaches self-hosted OpenAI-compatible servers (llama.cpp,
                            vLLM, LM Studio): set OPENAI_BASE_URL (e.g. http://localhost:8080/v1)
                            and OPENAI_MODEL to the model name your server serves
                            claude also reaches custom Anthropic-compatible endpoints (LiteLLM
                            proxy, gateways): set ANTHROPIC_BASE_URL and ANTHROPIC_MODEL
                            GRAPHIFY_CLAUDE_PROMPT_CACHE=0 disables Claude system-prompt caching
                            (default: enabled; set 1 to explicitly enable)
    --model M               override backend default model
    --mode deep             aggressive INFERRED-edge semantic extraction
    --force                 full re-scan and re-dispatch: skip the incremental
                            manifest gate and semantic cache reads (env: GRAPHIFY_FORCE=1)
    --max-workers N         AST extraction subprocess count (default: cpu_count)
    --token-budget N        per-chunk token cap for semantic extraction (default: 60000)
    --max-concurrency N     parallel semantic chunks in flight (default: 4; set 1 for local LLMs)
    --api-timeout S         per-request timeout in seconds for the LLM client (default: 600)
    --out DIR, --output DIR output dir (default: <path>); writes <DIR>/graphify-out/
    --google-workspace      export .gdoc/.gsheet/.gslides shortcuts via gws before extraction
    --no-gitignore         ignore .gitignore and .git/info/exclude (prioritizes .graphifyignore)
    --no-cluster            skip clustering, write raw extraction only
    --code-only             index code (local AST, no API key) and skip doc/paper/image files
    --postgres DSN          extract schema from a live PostgreSQL database
                            maps tables, views, functions + FK relationships;
                            column-level detail is not represented in the graph
    --cargo                 extract crate→crate deps from Cargo.toml
    --global                also merge the resulting graph into the global graph
    --as <tag>              repo tag for --global (default: target directory name)
  provider [list|show|add|remove]  manage custom LLM providers
  global add <graph.json>  add/update a project graph in the global graph (~/.graphify/global-graph.json)
    --as <tag>               repo tag (default: parent directory name)
  global remove <tag>      remove a repo's nodes from the global graph
  global list              list repos in the global graph
  global path              print path to the global graph file
  benchmark [graph.json]  measure token reduction vs naive full-corpus approach
  export html             emit interactive graph.html [--graph PATH] [--labels PATH] [--node-limit N, default 5000] [--no-viz]
  export callflow-html    emit Mermaid-based architecture/call-flow HTML
                          [GRAPH|DIR] [--graph PATH] [--labels PATH] [--report PATH] [--sections PATH] [--output HTML]
                          [--lang auto|zh-CN|en] [--max-sections N] [--diagram-scale N]
  export obsidian         emit Obsidian vault notes + canvas [--graph PATH] [--labels PATH] [--dir PATH]
  export wiki             emit wiki markdown articles [--graph PATH] [--labels PATH]
  export svg              emit graph.svg [--graph PATH] [--labels PATH]
  export graphml          emit GraphML [--graph PATH]
  export neo4j            emit Cypher or push to Neo4j [--graph PATH] [--push URI] [--user U] [--password P]
                          (or set NEO4J_PASSWORD instead of --password to keep it off argv)
  export falkordb         emit Cypher or push to FalkorDB [--graph PATH] [--push URI] [--user U] [--password P]
                          (or set FALKORDB_PASSWORD instead of --password to keep it off argv)
  hook install            install post-commit/post-checkout/post-merge/post-rewrite git hooks (all platforms)
  hook uninstall          remove git hooks
  hook status             check if git hooks are installed
  gemini install          write GEMINI.md section + BeforeTool hook (Gemini CLI)
  gemini uninstall        remove GEMINI.md section + BeforeTool hook
  cursor install          write .cursor/rules/graphify.mdc (Cursor)
  cursor uninstall        remove .cursor/rules/graphify.mdc
  claude install          write graphify section to CLAUDE.md (or the AGENTS.md Claude Code reads) + PreToolUse hook
  claude uninstall        remove graphify section from CLAUDE.md + PreToolUse hook
  codebuddy install       write graphify section to CODEBUDDY.md + PreToolUse hook (CodeBuddy)
  codebuddy uninstall     remove graphify section from CODEBUDDY.md + PreToolUse hook
  codex install           write graphify section to AGENTS.md (Codex)
  codex uninstall         remove graphify section from AGENTS.md
  opencode install        write graphify section to AGENTS.md + tool.execute.before plugin (OpenCode)
  opencode uninstall      remove graphify section from AGENTS.md + plugin
  kilo install            install native Kilo skill + command + AGENTS.md + .kilo plugin
  kilo uninstall          remove native Kilo skill + command + AGENTS.md + .kilo plugin
  aider install           write graphify section to AGENTS.md (Aider)
  aider uninstall         remove graphify section from AGENTS.md
  amp install             copy graphify skill + write AGENTS.md section (Amp)
  amp uninstall           remove graphify skill + AGENTS.md section (Amp)
  copilot install         copy graphify skill to ~/.copilot/skills (GitHub Copilot CLI)
  copilot uninstall       remove graphify skill from ~/.copilot/skills
  vscode install          configure VS Code Copilot Chat (skill + .github/copilot-instructions.md)
  vscode uninstall        remove VS Code Copilot Chat configuration
  claw install            write graphify section to AGENTS.md (OpenClaw)
  claw uninstall          remove graphify section from AGENTS.md
  droid install           write graphify section to AGENTS.md (Factory Droid)
  droid uninstall        remove graphify section from AGENTS.md
  trae install            write graphify section to AGENTS.md (Trae)
  trae uninstall         remove graphify section from AGENTS.md
  trae-cn install         write graphify section to AGENTS.md (Trae CN)
  trae-cn uninstall      remove graphify section from AGENTS.md
  antigravity install     write .agents/rules + .agents/workflows + skill (Google Antigravity)
  antigravity uninstall   remove .agents/rules, .agents/workflows, and skill
  hermes install          write skill to ~/.hermes/skills/graphify/ (Hermes)
  hermes uninstall        remove skill from ~/.hermes/skills/graphify/
  kiro install            write skill to .kiro/skills/graphify/ + steering file (Kiro IDE/CLI)
  kiro uninstall          remove skill + steering file
  pi install              write skill to ~/.pi/agent/skills/graphify/ (Pi coding agent)
  pi uninstall            remove skill from ~/.pi/agent/skills/graphify/
  pi guard install        register the native Pi guard extension via `pi install`
  pi guard uninstall      unregister it via `pi remove`
  pi guard path           print the guard package path (e.g. for `omp plugin install`)
  devin install           write skill to ~/.config/devin/skills/graphify/ (Devin CLI)
  devin uninstall         remove skill from ~/.config/devin/skills/graphify/

Prefer a hosted version? Graphify Cloud has a free plan, no card required:
https://app.graphify.com/signup?utm_source=cli&utm_medium=terminal&utm_campaign=oss&utm_content=help

~~~

The installed `graphify query --help` additionally prints:
`Usage: graphify query "<question>" [--dfs] [--no-doc-demotion] [--context C] [--seed X] [--budget N] [--depth N] [--graph path]`.
The root help omits `--no-doc-demotion`; use the command-specific help as the stronger flag check. The installed help does not advertise `reflect --if-stale`, so do not use that flag based only on a skill or another version's instructions.

## Appendix C — All eleven live local MCPC schemas

The following is captured from the locally registered @nexi-graphify-live session and rechecked with `tools-list --full` on 2026-11-22 against Graphify MCP v0.9.112. Re-read tools-get after a version or session change. The same ten tool names are also registered for @nexi-knowledge, but use separate graph data.

### C.1 query_graph

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `query_graph`

Input:
* `question`: string [required] - Natural language question or keyword search
* `mode`: "bfs" | "dfs" (default: "bfs") - bfs=broad context, dfs=trace a specific path
* `depth`: integer (default: 3) - Traversal depth (1-6)
* `token_budget`: integer (default: 2000) - Max output tokens
* `context_filter`: array<string> - Optional explicit edge-context filter, e.g. ['call', 'field']
* `demote_docs`: boolean (default: true) - Rank source code above docs/config (default). Set false for a docs-first corpus so documents are not soft-demoted.
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Search the knowledge graph using BFS or DFS. Returns relevant nodes and edges as text context.
````

Call example:
* `mcpc @nexi-graphify-live tools-call query_graph question:='"something"' mode:='"bfs"' depth:=3`
~~~

### C.2 get_node

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `get_node`

Input:
* `label`: string - Node label or ID to look up
* `node_id`: string - Alias for label (node id)
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Get full details for a specific node by label or ID.
````

Call example:
* `mcpc @nexi-graphify-live tools-call get_node label:='"something"' node_id:='"something"' project_path:='"something"'`
~~~

### C.3 get_neighbors

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `get_neighbors`

Input:
* `label`: string
* `node_id`: string - Alias for label (node id)
* `relation_filter`: string - Optional: filter by relation type
* `token_budget`: integer (default: 2000) - Max output tokens
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Get all direct neighbors of a node with edge details.
````

Call example:
* `mcpc @nexi-graphify-live tools-call get_neighbors label:='"something"' node_id:='"something"' relation_filter:='"something"'`
~~~

### C.4 get_community

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `get_community`

Input:
* `community_id`: integer [required] - Community ID (0-indexed by size)
* `token_budget`: integer (default: 2000) - Max output tokens
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Get all nodes in a community by community ID.
````

Call example:
* `mcpc @nexi-graphify-live tools-call get_community community_id:=1 token_budget:=2000 project_path:='"something"'`
~~~

### C.5 god_nodes

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `god_nodes`

Input:
* `top_n`: integer (default: 10)
* `exclude_hubs_percentile`: number - Suppress nodes whose degree exceeds this percentile (0-100) of the degree distribution, matching cluster()'s hub exclusion
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Return the most connected nodes - the core abstractions of the knowledge graph.
````

Call example:
* `mcpc @nexi-graphify-live tools-call god_nodes top_n:=10 exclude_hubs_percentile:=1 project_path:='"something"'`
~~~

### C.6 graph_stats

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `graph_stats`

Input:
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Return summary statistics: node count, edge count, communities, confidence breakdown.
````

Call example:
* `mcpc @nexi-graphify-live tools-call graph_stats project_path:='"something"'`
~~~

### C.7 shortest_path

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `shortest_path`

Input:
* `source`: string [required] - Source concept label or keyword
* `target`: string [required] - Target concept label or keyword
* `max_hops`: integer (default: 8) - Maximum hops to consider
* `undirected`: boolean (default: false) - Ignore stored edge direction when searching
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Find the shortest path between two concepts in the knowledge graph. Follows stored edge direction by default; set undirected=true to ignore it. Ends with the path's confidence, which is that of its weakest hop.
````

Call example:
* `mcpc @nexi-graphify-live tools-call shortest_path source:='"something"' target:='"something"' max_hops:=8`
~~~

### C.8 list_prs

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `list_prs`

Input:
* `base`: string - Base branch to filter PRs by (auto-detected if omitted)
* `repo`: string - GitHub repo (owner/repo). Defaults to current repo.
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
List open GitHub PRs with CI status, review state, and graph impact (which communities each PR touches, blast radius). Use this before starting work to check if a PR already covers the area you're about to change.
````

Call example:
* `mcpc @nexi-graphify-live tools-call list_prs base:='"something"' repo:='"something"' project_path:='"something"'`
~~~

### C.9 get_pr_impact

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `get_pr_impact`

Input:
* `pr_number`: integer [required] - PR number to analyse
* `repo`: string - GitHub repo (owner/repo). Defaults to current repo.
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Get detailed graph impact for a specific PR: which files it changes, which knowledge-graph communities are affected, and how many nodes are touched. Use this to assess merge risk or check for overlap with your current work.
````

Call example:
* `mcpc @nexi-graphify-live tools-call get_pr_impact pr_number:=1 repo:='"something"' project_path:='"something"'`
~~~

### C.10 triage_prs

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `triage_prs`

Input:
* `base`: string - Base branch to filter PRs by (auto-detected if omitted)
* `repo`: string - GitHub repo (owner/repo). Defaults to current repo.
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Return all actionable open PRs (correct base, not stale) with full graph impact data so you can reason about review priority, merge order, and conflict risk. Call this when the user asks 'what PRs should I review?' or 'what's ready to merge?'
````

Call example:
* `mcpc @nexi-graphify-live tools-call triage_prs base:='"something"' repo:='"something"' project_path:='"something"'`
~~~


### C.11 get_section

~~~text
[@nexi-graphify-live → /home/mellonelay1999/.local/bin/graphify-mcp /home/mellonelay1999/workspaces/Ne…]

Tool: `get_section`

Input:
* `label`: string - Heading label, node ID, or 'path/file.md::Heading' when several files share the heading
* `node_id`: string - Alias for label (node id)
* `max_chars`: integer (default: 8000) - Cap on returned characters
* `project_path`: string - Absolute path to a project directory containing graphify-out/graph.json. Optional — defaults to the graph this server was started with.

Description:
````
Return the text of a Markdown section (a heading node, with its subsections) or a whole Markdown page, read from the source file. Use it instead of opening the .md file after query_graph or get_node lands on a heading.
````

Call example:
* `mcpc @nexi-graphify-live tools-call get_section label:='"something"' node_id:='"something"' max_chars:=8000`
~~~

This tool is exposed by local MCP, but section resolution is not verified for NEXI's current graphs. Direct calls for frontend/DESIGN.md and a semantic concept label returned 'Key ... not found' even though source graph queries found the concept. Semantic entities are not necessarily literal Markdown headings. Use current source-file reading for authoritative passages; recheck exact get_section lookup/schema before relying on it. The code-only limitation applied only to historical Appendix E.

## Appendix E — HISTORICAL code-only upstream source graph (superseded)

**Measured operational receipt (2026-11-16):** Standard Graphify 0.9.111, fresh code-only extraction, 688 code files detected, 649 files represented by source-linked nodes, 6,441 nodes, 19,384 edges and 230 communities. Source SHA: 7a5aa7f2c3a3. Graph SHA-256: 5f2b139bcc5a94503d55f5a1a1246467859cd227080d8e2f4a426e3023321c02. The output is the actual current `/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json`.

**Full old-graph removal:** Both attempts to reuse the older multi-repo graph failed closed due to stale semantic/source nodes. A clean build into an empty output directory succeeded. Its JSON node-ID uniqueness, endpoints, counts, and commit were checked; the previous graphify-out directory (52,743,811 file-content bytes) was deleted and replaced by the clean standard upstream artifacts. Source MCPC session was restarted and graph_stats verified 6,441/19,384/230, 95% EXTRACTED and 5% INFERRED. A query located MarketAuthorityService at backend/src/market/market-authority.service.ts:L101.

**MCPC correction:** Both source and preserved Knowledge v4 MCP sessions were restarted on Graphify v0.9.111 and now expose **11 local tools**, not ten. The newly exposed get_section is included in Appendix C.11. The reference Knowledge graph itself was **not** deleted or merged: 1,774 nodes / 1,646 edges / 169 communities.

**LLM connection:** OPENAI_API_KEY is defined in the owner-user protected environment configuration; its live authentication could not be verified. It was **not copied or exposed**. Semantic model extraction was therefore **not executed**. Code-only Graphify skipped 156 documents and six images; 124 supported code files yielded no symbols. The upstream detector also does not recognize .prisma. These are explicit coverage limitations. Standard static extraction cannot guarantee every HTTP, Socket.IO, Prisma and BullMQ producer-consumer link.

The application services remain inactive. No NEXI application tests, builds, deployment or financial writes occurred. Machine receipt: `/home/mellonelay1999/workspaces/Nexi/graphify-out/NEXI_UPSTREAM_REBUILD_RECEIPT_20261116.json`.



## Appendix F — HISTORICAL legacy purge / initial credential discovery (superseded)

**Verified cleanup:** The previous repository graphify-out directory was removed in full and replaced by the clean standard graph. A separate legacy source-graph archive at `/srv/nexi/graphify-live` was also deleted on 2026-11-16 (29,200,789 bytes of regular file content, including 10 historical graph.json/merged-graph.json paths). The active source MCP points only to `/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json`. The Knowledge v4 graph at `/srv/nexi/engineering-knowledge/20261110/graphify-out/graph.json` was preserved by design and must not be confused with legacy source nodes. No Graphify global graph exists: `graphify global list` returned empty.

**Protected model configuration:** A nonempty `OPENAI_API_KEY` configuration entry was found in `/home/mellonelay1999/.config/environment.d/nexi-deepwiki.conf` (file mode 0600). This confirms existence only. An attempted authenticated provider check was blocked; no successful OpenAI API request or Graphify semantic extraction was established. Never copy the secret into the repository, runbook, Git commit, logged CLI argv or MCP arguments. Before a separately authorized semantic extraction, verify the provider and budget through a supported credential route. Continue using the validated code-only graph until provider authentication is proven.

**Graph completion boundaries:** The new graph is complete as an executed **standard code-only extraction** of the selected 688 eligible code files, not an exhaustive graph of every NEXI source, schema, Markdown and asset. The authoritative Prisma `.prisma` file is outside this release's detector; document semantic ingestion is not connected. Do not claim complete end-to-end cross-surface relationship coverage or app runtime correctness.



## Appendix G — Free OpenRouter Graphify semantic extraction

**LATEST VERIFIED MODEL CONFIGURATION (2026-11-16):** The free router openrouter/free was functional but routed variably and caused truncated structured extraction. Official OpenRouter supports pinned :free models. The existing protected launcher now selects nvidia/nemotron-3.5-super-vl:free at OPENAI_BASE_URL=https://openrouter.ai/api/v1, with Graphify backend openai (wire protocol only), GRAPHIFY_MAX_OUTPUT_TOKENS=32768, semantic token budget 4000, concurrency 4, and request timeout 240 seconds. No paid fallback. Graphify's semantic extraction system prompt already requires JSON-only output; independent extraction calls do not need conversation reasoning_details, streamed chat, or public app-attribution headers. The full NEXI graph build is not yet verified complete. Earlier references to openrouter/free below document the prior routing configuration, not the current pinned model.

**Routing correction 2026-11-16:** OpenRouter free-model quotas differ by lifetime purchased credits. Official tiers: 20 RPM / 50 RPD below the higher tier, and 20 RPM / 1,000 RPD with at least 10 credits purchased, subject to the documented rounding allowance. Verify the VM credential itself at GET https://openrouter.ai/api/v1/key and inspect free_model_daily_requests.used, .limit and .remaining without logging the secret. The connected OpenRouter app balance does not establish the VM key entitlement. openrouter/free routes to free models only unless explicit paid fallbacks are added; none are configured. Graphify output truncation on large files is not evidence of a free quota limit. Sources: https://openrouter.ai/docs/api_reference/limits and https://openrouter.ai/docs/cookbook/get-started/free-models-router-playground .




**Verified configured VM OpenRouter credential (2026-11-16):** GET https://openrouter.ai/api/v1/key returned is_free_tier=false, free_model_daily_requests.used=7, limit=1000, remaining=993. These values are a point-in-time receipt, NOT a permanently reserved quota. Official OpenRouter policy: credits purchased >= $10 enable a 1,000/day free-variant allowance (20/minute); failed requests may count. Present balance does not determine lifetime purchase eligibility. The configured model remains openrouter/free without paid fallback. Recheck the key's quota before subsequent runs; connected plugin account and VM key may differ.

**Owner decision 2026-11-16:** Semantic extraction must use OpenRouter's zero-priced free router, model openrouter/free and OpenAI-compatible API base https://openrouter.ai/api/v1. No paid-model fallback, no use of direct OpenAI API. The standard local AST code extractor continues to run without an LLM.

The protected owner-user configuration at /home/mellonelay1999/.config/environment.d/nexi-deepwiki.conf defines OPENAI_API_KEY containing an OpenRouter-style key. Direct OpenAI endpoint returned HTTP 401, OpenRouter with a paid model returned HTTP 402, and **OpenRouter with model openrouter/free succeeded** on a one-document semantic trial (3 nodes, 3 edges). Backend name openai means API protocol, not OpenAI billing. Graphify's local dollar estimate is not an actual invoice; check account usage separately.

The persistent owner-user launcher /home/mellonelay1999/.local/bin/graphify-nexi-semantic (mode 0700) loads the protected key for the child process only and forces the free router. Example commands:

~~~bash
sudo -u mellonelay1999 /home/mellonelay1999/.local/bin/graphify-nexi-semantic --help
sudo -u mellonelay1999 /home/mellonelay1999/.local/bin/graphify-nexi-semantic --out /tmp/nexi-semantic-candidate
~~~

Historical launcher snapshot (superseded): model=openrouter/free, standard semantic mode, max-workers=2, max-concurrency=1, token-budget=8000, api-timeout=75. The 2026-11-16 launcher and model settings in this appendix are historical and do not establish today’s Graphify backend, model, credentials, or launcher behavior. It rejects backend/model overrides, --code-only, --force and --global. Run in a candidate output directory. Validate completeness, node/edge consistency, source revision, semantic provenance and missing documents before replacing the active NEXI graph; reconnect @nexi-graphify-live only after verified promotion.

Historical OpenRouter free-model quota observations from 2026-11-16 are time-sensitive and must be rechecked against current provider documentation and account state before planning an extraction. Free routing may choose different models for different chunks, and adaptive truncation retry can increase API calls. Do not retry indefinitely, automatically use paid models, leak keys, or promote a partial semantic graph.

Official sources: https://openrouter.ai/collections/free-models/ ; https://github.com/OpenRouterTeam/docs/blob/main/guides/routing/routers/free-router.mdx ; https://docs.graphify.com/open-source/configuration/llm-providers .


**FINAL VERIFIED RESULT 2026-11-16 (supersedes preceding in-progress statements):** Original canonical NEXI graph at /home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json upgraded successfully with upstream Graphify 0.9.111, using the pinned zero-priced OpenRouter model nvidia/nemotron-3.5-super-vl:free and standard semantic extraction. Atomic graph promotion and @nexi-graphify-live MCP restart were performed; graph_stats returned 8,772 nodes, 22,093 edges, 469 communities, and matching HEAD 7a5aa7f2c3a3c46768b3b56bc53b1cc50e02ad76. Semantic-origin nodes: 2,331; documents represented: 46. Every former 6,441 node and every former edge relation endpoint tuple was preserved; one code node and 41 old edges were explicitly restored after clustering dedup. Exact graph SHA-256: 29221a113f166d2be0da6fe0be16932ce777c08a91a0a693ff26e68f67181f85. See graphify-out/NEXI_SEMANTIC_REBUILD_RECEIPT_20261116.json for provenance and build caveats. The generated report and manifests are in graphify-out. This is static semantic/source evidence only, not a claim of application execution; Backend/Public/Admin remain inactive. Some documents outside model scope were safely excluded, with semantic-cache out-of-scope warnings; no sensitive files sent through Graphify's configured safety filter.


## Appendix H — Gemini deep semantic refresh (2026-11-21)

**Owner-authorized current result:** The unified graph was refreshed from repository HEAD `6b3d04868caa37d32540bd2fb76dce8f19516ea6` using the NEXI enrichment pipeline. The active graph is `graphify-out/graph.json`; its SHA-256 is `f8d65063d27fd0695aa59eb0ff4fc14a48e7e51da399af1f40d2c12825110ec4`. The existing `@nexi-graphify-live` MCP reports 9,743 nodes, 24,368 edges, 245 communities, 94% EXTRACTED / 6% INFERRED / 0% AMBIGUOUS, and confirms that the graph commit matches HEAD.

**Credential and model selection:** The owner replaced the Gemini API key before this run. The protected configuration remains `/home/mellonelay1999/.config/environment.d/nexi-deepwiki.conf` (mode 0600); the key was never printed or copied into the repository. The new key successfully authenticated a model-list request and a minimal Gemini generation request. `GRAPHIFY_GEMINI_MODEL="gemini-3.5-flash-lite"` is the selected model. This choice followed the owner's AI Studio Free-tier screenshot, where this model showed available capacity (15 RPM / 250,000 input tokens per minute); availability is project- and time-dependent. Google documents rate limits as project-scoped rather than API-key-scoped, so replacing a key does not reset project quota. A Gemini 3.8 Flash request returned HTTP 503 high demand; Gemini 3.6 Flash parallel extraction encountered HTTP 429. These were provider capacity/quota outcomes, not evidence of an invalid replacement key.

**Successful full semantic extraction:** Graphify 0.9.112 processed all 39 chunks with Gemini 3.5 Flash Lite in deep mode, `--token-budget 4000`, `--max-workers 2`, `--max-concurrency 1`, and `--api-timeout 240`. No chunks failed and no rate-limit error occurred. Receipt: `/srv/nexi/graph-enrichment/out/revision-6b3d048/logs/gemini-3.5-flash-lite-deep-extract-4k.log`. Candidate SHA-256: `d9353dec1dfe1ccf37096df971392c2eb9eccc3bc3ab0ec6b6d174d99a507721`; 6,588 nodes / 19,745 edges. It contains 98 semantic-origin nodes and 142 semantic-origin links (135 references, 6 citations, 1 conceptual relationship). In the reconciled graph those LLM-derived links are classified INFERRED. This is a conservative semantic result; the historical graph's larger semantic layer is not a target count and included ambiguous links.

**Reproducible pipeline sequence (VM only):**

~~~bash
GRAPHIFY=/home/mellonelay1999/.local/share/uv/tools/graphifyy/bin/graphify
PY=/home/mellonelay1999/.local/share/uv/tools/graphifyy/bin/python
REFRESH=/srv/nexi/graph-enrichment/refresh.py
BASE=/srv/nexi/graph-enrichment/out/revision-6b3d048/clustered/graphify-out/graph.json
SEM=/srv/nexi/graph-enrichment/out/revision-6b3d048/semantic-gemini-35-flash-lite-deep-4k
STAGE=/srv/nexi/graph-enrichment/out/current-staged-graph.json
cd /home/mellonelay1999/workspaces/Nexi
"$GRAPHIFY" extract /srv/nexi/graph-enrichment/out/revision-6b3d048/source   --backend gemini --model gemini-3.5-flash-lite --mode deep   --max-workers 2 --max-concurrency 1 --token-budget 4000 --api-timeout 240   --out "$SEM"
# Validate and stage first; this command does not activate:
"$PY" "$REFRESH" --source-baseline "$BASE"   --semantic-candidate "$SEM/graphify-out/graph.json" --with-semantics --with-sqlite
# After reviewing the validation receipt, activate through this same pipeline:
"$PY" "$REFRESH" --source-baseline "$BASE"   --semantic-candidate "$SEM/graphify-out/graph.json" --with-semantics --with-sqlite --activate
~~~

**Validation and integration receipts:** Check-only refresh passed with `PASS_WITH_CLASSIFIED_DYNAMIC_BOUNDARIES`, zero dangling relationships, 284 Nest routes, 98 Prisma models, 117 resolved Admin endpoint callsites plus 3 delegated wrappers, 113 module imports, 4 forward references, BullMQ 3 queues / 3 producers / 3 workers, Socket.IO 13 verified joins, and 8 durable outbox-pipeline links. SQLite schema inspection was read-only and read no database rows: 104 tables, 1,116 columns, 310 indexes, 87 foreign keys, 3 triggers; 98 Prisma/table joins, 7 renamed aliases and 5 standalone DDL joins. Tieline matched 33 client/server relationships; its remaining drift/dead classifications are static candidates, not runtime failures.

**Post-activation proof:** Active SHA-256 equals the staged SHA above. Both live MCP `shortest_path` and Graphify CLI `path` returned the one-hop, EXTRACTED relationship `Prisma:LedgerPosting --PRISMA_MODEL_MAPS_TO_SQLITE_TABLE--> LedgerPosting`. Activation created backup `/srv/nexi/graph-enrichment/backups/graph-before-enrichment-4fd8d9c9b94a9723.json`. Repository HEAD did not change. No NEXI application tests, builds, deployments, service restarts, or financial/database row operations were performed.

**Historical note:** Appendix G's 2026-11-16 OpenRouter owner decision and launcher describe the provider/model state at that time. This Appendix records the owner's later Gemini instruction and verified 2026-11-21 run; it supplements the historical record rather than rewriting it. The source graph remains static evidence and does not establish runtime correctness.


### Appendix H.1 — Gemini 3.6 owner-setting correction

This subsection supersedes Appendix H's statement that Gemini 3.5 Flash Lite is the currently selected model.

- The owner's screenshot confirms the replacement key passed a Gemini 3.6 Flash smoke extraction (HTTP 200). The persisted setting is now GRAPHIFY_GEMINI_MODEL=gemini-3.6-flash. The key remains protected in the existing mode-0600 config and was not changed during this correction.
- A full current-revision Gemini 3.6 Flash deep extraction was then attempted with --force, token budget 4000, max-concurrency 1, max-workers 2, and API timeout 240. The run received HTTP 429 on chunks 1–15 and was stopped before completion. Its log is /srv/nexi/graph-enrichment/out/revision-6b3d048/logs/gemini-3.6-flash-deep-extract-4k-full-20261121.log; the separate partial output directory is /srv/nexi/graph-enrichment/out/revision-6b3d048/semantic-gemini-36-flash-deep-4k-full-20261121. Graphify retained only “Error code: 429”, not Google's specific quota dimension. No 3.6 candidate was validated or activated.
- The active graph remains the fully staged and activated current-HEAD candidate whose completed semantic extraction used Gemini 3.5 Flash Lite. It is structurally current and passed the refresh coverage gate, but its semantic model does not match the owner's current 3.6 setting. Treat the requested Gemini 3.6 semantic refresh as PARTIAL until project/model capacity allows a complete extraction.
- Google's supplied rate-limit documentation says quotas are project-scoped, not API-key-scoped. Therefore the 429 does not indicate that the replacement key is invalid; the exact RPM/TPM/RPD cause remains unknown. Do not burn more requests on blind retries. Resume only after capacity/quota state changes or the owner supplies a different solution.


## Appendix I — Kilo semantic candidate: complete unified-graph merge procedure (2026-11-21)

### Live state and what is not merged

At the time of this update, repository HEAD is `6b3d04868caa37d32540bd2fb76dce8f19516ea6`. The canonical active graph remains `/home/mellonelay1999/workspaces/Nexi/graphify-out/graph.json`, SHA-256 `f8d65063d27fd0695aa59eb0ff4fc14a48e7e51da399af1f40d2c12825110ec4`, with 9,743 nodes and 24,368 links. Its activation receipt is still `/srv/nexi/graph-enrichment/out/current-run-report.json`; that receipt identifies the Gemini candidate SHA `d9353dec1dfe1ccf37096df971392c2eb9eccc3bc3ab0ec6b6d174d99a507721`, not the Kilo candidate.

The Kilo semantic candidate is `/srv/nexi/graph-enrichment/out/revision-6b3d048/semantic/graphify-out/graph.json`, SHA-256 `e8523bc65686d5ee0d8627e3b89b0b61a13ee847236a555b3f025519cb1c752c`. At this pre-commit checkpoint, its `built_at_commit` matches HEAD `6b3d04868caa37d32540bd2fb76dce8f19516ea6`. It contains 7,532 nodes, 20,712 links and 54 hyperedges. It is a **candidate only**: it has not been reconciled by `refresh.py` and has not been activated into the unified graph. The cache reconciliation sidecar records `nvidia/nemotron-3.5-super-vl:free` for two retry cache entries only; that does not establish that every candidate record used that model.

**Revision guard after this documentation commit:** Committing this runbook advances repository HEAD, while the Kilo candidate, source baseline and active graph remain stamped with `6b3d04868caa37d32540bd2fb76dce8f19516ea6`. The `refresh.py` driver rejects source/semantic inputs whose `built_at_commit` does not equal HEAD. Therefore, after this commit, the command paths below are a checkpoint recipe and must not be run as-is: generate and receipt a source baseline and complete semantic candidate for the new HEAD first. The post-commit freshness marker may also identify the active graph as behind HEAD even though application source did not change; do not report it as HEAD-matched without a fresh `graph_stats` result.

The Kilo candidate is not automatically safe to promote just because extraction completed. Its hyperedges include D1-era statements and other dated document concepts. The semantic reconciler in `adapter/merge_semantics.py` merges candidate `nodes` and `links` (or `edges`); it does not merge the candidate's `hyperedges`. Review these separately. Do not claim hyperedges were integrated. If hyperedge knowledge is required, extend and validate the existing reconciliation pipeline in a separately scoped engineering change before promotion; do not bypass it with direct JSON concatenation.

### Full merge procedure

Run from the NEXI VM as the repository owner. Use the existing revision-aware `refresh.py` pipeline only. Do not use bare `graphify update`, the legacy `--pristine` baseline, or the standalone semantic merger to replace the enriched active graph.

1. **Freeze and record inputs.** Confirm the expected repository, HEAD, clean relevant source paths, active graph hash, candidate hash, and candidate completion receipt/log. Ensure the semantic extraction completed every intended chunk with no partial or failed output, and that the cache reconciliation is complete. Never infer completeness from node counts or cache hits alone. Preserve the current `out/current-run-report.json` before the next check-only run because `refresh.py` replaces that report and `out/current-staged-graph.json`.

   ```bash
   ROOT=/home/mellonelay1999/workspaces/Nexi
   BASE=/srv/nexi/graph-enrichment
   OUT=$BASE/out
   PY=/home/mellonelay1999/.local/share/uv/tools/graphifyy/bin/python
   REFRESH=$BASE/refresh.py
   SOURCE_BASELINE=$OUT/revision-6b3d048/clustered/graphify-out/graph.json
   SEMANTIC_CANDIDATE=$OUT/revision-6b3d048/semantic/graphify-out/graph.json
   ACTIVE=$ROOT/graphify-out/graph.json
   cd "$ROOT"

   git status --short
   git rev-parse HEAD
   sha256sum "$ACTIVE" "$SOURCE_BASELINE" "$SEMANTIC_CANDIDATE" "$OUT/current-run-report.json"
   ```

   Do not proceed if the source tree is dirty in the paths checked by `refresh.py`, if HEAD differs from the input graphs' `built_at_commit`, if the baseline receipt/hash or surface Git-tree identities fail, or if candidate completion is uncertain. The current Kilo input hashes and counts are recorded above as comparison anchors; re-read them live before a future run.

2. **Review candidate semantics before merge.** Inspect metadata, provenance and a bounded sample of candidate nodes, links and hyperedges. Check for stale architecture terms, sensitive material, unresolved/ambiguous concepts, and model output that conflicts with current source or approved architecture. Treat document-derived edges as hypotheses. The merge code relabels model-origin semantic edges as `INFERRED`; it does not make them source-confirmed. Candidate hyperedges remain outside the current merger.

3. **Run check-only validation.** Archive the old report, then run the same revision-matched command that will be used for promotion, without `--activate`. This regenerates deterministic adapters, reconciles semantics, adds the read-only SQLite schema layer, validates Graphify loading, and writes a staged graph and a new run receipt. It does not replace the active graph.

   ```bash
   mkdir -p "$OUT/logs"
   cp -p "$OUT/current-run-report.json" "$OUT/logs/current-run-report-before-kilo-$(date -u +%Y%m%dT%H%M%SZ).json"

   "$PY" "$REFRESH" \
     --source-baseline "$SOURCE_BASELINE" \
     --semantic-candidate "$SEMANTIC_CANDIDATE" \
     --with-semantics --with-sqlite
   ```

4. **Gate the staged result.** Read `$OUT/current-run-report.json` and `$OUT/current-staged-graph.json`. Require: matching HEAD and baseline/candidate hashes; `coverage_gate.status == PASS_WITH_CLASSIFIED_DYNAMIC_BOUNDARIES`; `unresolved` empty; `semantic_merge.dangling == 0`; Graphify loader node/edge counts matching the staged JSON; SQLite schema validation successful; expected source-contract coverage present; and no unexpected identity remaps or source-layer replacements. Confirm that original deterministic nodes and links remain the prefixes of the staged graph. Record staged SHA-256 and before/after layer counts. Stop on any failed or unexplained condition; never promote a partial or stale candidate.

   Kilo-specific extra gate: compare the report's `semantic_candidate_sha256` to the Kilo input hash above, then separately enumerate the 54 source hyperedges and report that the existing refresh merger does not carry them. Review stale D1-era statements before relying on any semantic text. A passing structural gate does not make those hyperedges part of the result or make semantic claims authoritative.

5. **Promote only the exact validated inputs.** After reviewing the receipt, run the same check command with `--activate`. The driver revalidates HEAD, inputs and the active graph, creates a content-addressed backup of the current active graph, then atomically replaces the canonical graph. If source, candidate or active graph changed after check-only, stop and repeat validation.

   ```bash
   "$PY" "$REFRESH" \
     --source-baseline "$SOURCE_BASELINE" \
     --semantic-candidate "$SEMANTIC_CANDIDATE" \
     --with-semantics --with-sqlite --activate
   ```

   This changes only the active Graphify artifact; it does not deploy NEXI application code or restart application services. Do not run this step until the candidate has passed the gates above.

6. **Prove activation through existing interfaces.** Require receipt `activated == true`, receipt `staged_sha256` equal to `sha256sum "$ACTIVE"`, and a recorded backup whose hash equals the pre-activation active graph hash. Query `graph_stats` through the existing `@nexi-graphify-live` MCP and confirm its commit and counts correspond to the activated artifact. Recheck a known exact path such as Prisma `LedgerPosting` to SQLite table `LedgerPosting`. If the existing MCP still reports old stats, follow its established session reload procedure and then query again; do not create a duplicate server. Record SHA, receipt, MCP result and any reload as activation evidence.

7. **Close out candidate files.** Keep the promoted candidate, its completion/cache reconciliation evidence, the pre-check receipt, and the pipeline's content-addressed active-graph backup until post-activation proof is complete. Only then remove genuinely redundant temporary files after matching hashes against retained snapshots. Preserve any unique prior extraction snapshot. Never delete the canonical graph, the source baseline plus its receipt, the current run receipt, or the pipeline backup as routine cleanup.

### Current Kilo-specific status

The candidate and its cache/reconciliation evidence are retained. The redundant `graph.json.pre-final-rebuild.bak` copy was removed after its SHA-256 was confirmed identical to the timestamped `2026-11-21/graph.json` candidate snapshot. The distinct earlier `graph.json.pre-kilo-refresh.bak` remains retained. The primary Kilo candidate and its cache/reconciliation evidence remain untouched. No Kilo check-only refresh or activation was run here, so the Kilo merge status remains **NOT VALIDATED / NOT ACTIVATED**. The current unified graph and its prior activation receipt remain unchanged.
