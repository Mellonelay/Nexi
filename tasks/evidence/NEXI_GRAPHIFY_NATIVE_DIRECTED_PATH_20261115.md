# NEXI Graphify native directed-path proof — 2026-11-15

## Task and root cause
Native Graphify 0.9.108 simple Graph/DiGraph retains only one primary relation per pair. Previous NEXI parallel_relations sidecar preserved distinct source-directed facts, but serve.py path search/renderer ignored secondary relations. Isolated producer/consumer fixture returned No directed path for a valid secondary consumer→producer relationship.

## Changed source
- Installed graphify/serve.py: _path_edge_facts and use in directed shortest-path search, hop evidence and rendering.
- Tracked tools/graphify/patches/graphifyy-0.9.108-nexi-typed-relation-evidence.patch regenerated for exact original 0.9.108 wheel.
- Tracked tools/graphify/install_native.py now requires _path_edge_facts alongside existing MCP neighbor patch; legacy installer synchronized.

## Isolated engine proof
- Before repair: no directed consumer→producer path despite source-supported secondary fact.
- After repair: consumer --responds [INFERRED]--> producer; unrelated primary calls fact not mislabeled as reversed.
- Original 0.9.108 four-file upstream wheel patch applied with --fuzz=0 in a temporary directory.
- Native installer reran successfully reporting Graphify 0.9.108 and unchanged patch.
- No NEXI app tests, builds, browser acceptance, service restarts, deployments, financial changes or canonical graph rebuild.

## Skills and authority actually used
- Exa Search methodology: targeted upstream source query, evidence comparison.
- GitHub: official extractor MIGRATION.md and extractors/__init__.py retrieved and read.
- Caveman explore: parallel read-only source localization before repair.
- Software & AI Copilot debug-failure: reproduced native path discrepancy and repaired consumer, isolated recheck.
- LLM & Agent Builder Copilot tool contracts: preserves direction, confidence and non-NEXI compatibility constraints.
- Context7: NetworkX Graph/DiGraph versus MultiDiGraph edge semantics consulted.

## Open frontier
Candidate-to-node coverage, TypeScript/framework semantic precision, other query consumers and clustering, fresh canonical graph, and application correctness remain unproven; source-first owner restrictions remain in force.
## Additional adjacent query consumer proof

The native `_subgraph_to_text` MCP query renderer previously emitted only the primary edge from a simple graph even where two NEXI source-directed `parallel_relations` existed. It now iterates valid preserved facts in the same existing render loop. Isolated engine fixture returned two EDGE lines: `producer --calls [EXTRACTED context=nexi]--> consumer at=f.ts:L3` and `consumer --responds [INFERRED context=nexi]--> producer at=f.ts:L7`. Reproducible upstream 0.9.108 four-module patch rerun passed. This establishes output evidence preservation for the tested NEXI case; full query relevance/recall and other consumers remain unproven.
