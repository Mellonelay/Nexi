# NEXI Graphify native-engine source proof — 2026-11-15

- **Authority:** Owner-authorized Graphify-native Python engineering; NEXI
  application source-first constraints preserved.
- **Graphify:** installed 0.9.108, upstream wheel verified prior SHA256
  `040c289663cec38ae39dd5e450d9810233e0b70535f2d0b76b1467150aca6cea`.
- **Confirmed defect:** isolated `graphify.build.build_from_json` with two
  extracted NEXI edges on the same node pair returned one edge carrying only
  `writes_model`; `reads_model` provenance was missing.
- **Owner:** native `graphify/build.py` simple-graph collision handling (the
  loss), and `graphify/serve.py` `_neighbor_lines` (the MCP consumer).
- **Native files modified:** the installed `graphify/build.py` and
  `graphify/serve.py`; installed modifications represented by the tracked
  `tools/graphify/patches/graphifyy-0.9.108-nexi-typed-relation-evidence.patch`.
- **Installer:** maintained external `install_patch.py` now applies/checks this
  exact version-pinned native patch rather than silently dropping it after
  reinstallation. Existing Prisma and framework hooks remain unchanged.
- **Isolated engine checks:** two distinct relations, three relations with
  reverse direction, same-relation `also_seen` provenance, non-NEXI unchanged,
  node-link serialization, MCP `_neighbor_lines` source/direction/filter, and
  pristine official wheel patch application (`patch --fuzz=0`) passed.
- **Kernel:** `sx_kernel.py source-map` for this task returned
  `extractor_manifest_mismatch:python_sha256`, a current graph/extractor
  fingerprint mismatch. It is an evidence gate; not an application defect.
- **Canonical graph:** no regeneration or change to
  `graphify-out/graph.json`; recorded SHA256
  `e3d2d3d04d20292bfbb4c1605319d2ceab61fa639ff1850acb17b5a00c6ca4dc`.
- **Deferred:** Graphify full-source extraction rebuild, MCP path traversal
  of preserved secondary edge facts, app tests/builds/restarts/deployments,
  financial mutations. No global graph correctness claim.

Methods applied: Research & Writing Copilot deep-research/verify-sources
(separated upstream docs, observed builder behavior, and inference);
LLM & Agent Builder Copilot choose-system-complexity/implement-agent-workflow
(retained simple graph and existing MCP route; no new extractor/controller),
Caveman investigate-first/surgical-patch/verify-and-stop (owner-local repair and
bounded engine-only proof). NetworkX primary documentation and Graphify v8
source were checked for graph-class semantics.
