# NEXI native Graphify merger handoff — 2026-11-15

## Scope
Owner-approved Graphify-native Python engineering only; no application source tests/builds, service restarts, financial state changes, or canonical graph regeneration.

## Changes and evidence
- Tracked `tools/graphify/native/graphify/nexi_merge.py`: moved the prior 549-line NEXI `merge_surface_graphs.py` canonicalization code into the installed Graphify Python package, preserving HTTP operation canonical IDs, conservative Socket.IO candidate joins, declared Nginx/systemd topology, and source-manifest validation.
- Module references now use installed native Graphify `http_relationships.py`, `nexi_relationships.py`, `nexi_semantic_scan.cjs`, and `extractors/prisma.py`; the manifest additionally fingerprints native Prisma and the three-module version-pinned patch, refusing stale fingerprints.
- `tools/graphify/install_native.py` installs/verifies `nexi_merge.py` alongside its framework/Prisma/TypeScript components. Legacy `install_patch.py` has the same bytes as the tracked installer; legacy `merge_surface_graphs.py` is a compatibility launcher of `python -m graphify.nexi_merge`, with the previous script preserved as a dated file on the VM.
- Confirmed native `nexi_merge.normalize_graph()` on isolated synthetic data: a Public HTTP caller and Backend HTTP handler referencing the same method/path/origin were canonicalized to one operation ID with matching incoming/outgoing edges and all endpoints intact.
- `SentinelX` native capabilities, read, script_run, project_snapshot, git_diff and safe edit tools were invoked on the connected host. The normal-chat Graphify runbook v3.4 was read in this session.

## Boundaries
- The upstream `graphify merge-graphs` CLI still does not call `nexi_merge` automatically. Native packaging and the prior CLI compatibility shim are implemented, but full automatic merge integration is NOT established.
- Old canonical graph is still a Graphify 0.9.105 snapshot with a graph source revision older than current HEAD; `source-map` previously reported `extractor_manifest_mismatch:python_sha256`.
- Graphify 0.9.108 native query/path/clustering completeness for every secondary relationship and all NEXI tracked inputs is not proven. The default `affected` relation list remains narrow by design. Source exhaustiveness requires separately authorized graph regeneration, outside current source-first application boundary.
- Only Graphify tooling files were changed in this slice; unrelated untracked application backups remain untouched.

## Next
Integrate opt-in native canonicalization at the existing `graphify merge-graphs` end boundary with strict source-manifest checks; then map source coverage and impact semantics in isolated engine fixtures before any authorized canonical rebuild.
