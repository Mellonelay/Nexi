# Graphify 0.9.108 native merge and source coverage — 2026-11-15

## Source changes
- Native `graphify/cli.py` adds the opt-in `GRAPHIFY_NEXI_NATIVE_MERGE=1` call inside Graphify's existing `merge-graphs` command, before writing the destination. The default upstream behavior is unchanged.
- Native `graphify/build.py` corrects repository-prefixed IDs inside each preserved `parallel_relations` fact.
- Native `graphify/nexi_merge.py` validates all three surface inputs against source-manifest hashes, canonicalizes HTTP operation IDs, rewrites secondary facts during canonicalization, performs conservative Socket.IO joins, and rejects invalid typed facts.
- Native manifest v2 records eligible source input hashes (including new files and CSS/config candidates) independently of files that already produced graph nodes. Coverage is reported, not assumed.
- Version-pinned tracked patch and installer were updated to include `cli.py` alongside `build.py`, `serve.py`, `affected.py`.

## Isolated evidence
- Native three-surface `graphify merge-graphs` fixture correctly canonicalized a Public HTTP client and Backend handler to one operation and retained two directional typed facts; native `affected` traced the secondary fact to its source line.
- Missing manifest, changed input graph, stale source candidate inventory, malformed secondary endpoint and truncated secondary relation list failed closed.
- Upstream Graphify 0.9.108 wheel patch was successfully applied with `--fuzz=0` in an isolated temporary directory; no application runtime or canonical NEXI graph changed.
- Current candidate inventory: Public 177, Backend 399, Admin 110. Counts are candidates, not guaranteed graph-covered files.
- Current Knowledge-first `source-map` has previously reported an extractor manifest fingerprint mismatch; full canonical graph rebuild is deferred under NEXI source-first owner rule.

## Provenance and limits
- `EXTRACTED` means explicit source, `INFERRED` means static resolution, `AMBIGUOUS` means insufficient source identity. Runtime behavior is NOT proven by graph edges.
- Further work remains: symbol-resolution precision, CSS/config parser coverage, source-file-to-node reconciliation, native query/path/clustering behavior for all typed relations, complete three-surface extraction and final graph freshness.
- Source-first prohibits app tests/lint/build/browser acceptance/restarts/deployment until application source closure.
