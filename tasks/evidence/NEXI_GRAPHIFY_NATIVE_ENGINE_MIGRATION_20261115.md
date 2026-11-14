# Graphify 0.9.108 — native engine consolidation (2026-11-15)

## Authority and observations

- Owner explicitly authorized direct native Graphify engineering; NEXI application
  source-first boundary remains in force. `main` was `180c6fa` before this slice.
- Verified official `Graphify-Labs/graphify` v8 `pyproject.toml` and installed
  0.9.108 package, including `detect.py`, `extract.py`, `build.py`, `affected.py`,
  `serve.py`, `extractors/`, resolver registry, export, dedup, cluster, analyze.
- Primary docs: `https://github.com/Graphify-Labs/graphify/blob/v8/ARCHITECTURE.md`,
  `https://docs.graphify.com/open-source/features/languages`,
  `https://github.com/Graphify-Labs/graphify/blob/v8/graphify/extractors/MIGRATION.md`.
- Prior custom toolkit reviewed at
  `/home/mellonelay1999/.local/share/graphify-nexi/graphify-http-extractor/`:
  `install_patch.py`, `http_relationships.py`, `nexi_relationships.py`,
  `nexi_semantic_scan.cjs`, `merge_surface_graphs.py`, `build_unified_graph.py`,
  `detect_nexi_coverage.py`.

## Confirmed defects and native repairs

1. Native `build.py` had collapsed `reads_model` and `writes_model` source facts
   sharing an endpoint pair. Prior slice committed native build/MCP neighbor
   preservation (`180c6fa`); this slice adds the missing `affected.py` consumer.
   Before repair, `affected_nodes(resource, relations=["reads_model"]) == []`
   even when the retained edge's sidecar recorded that relationship.
   After repair, read/write and reverse-direction relations return their
   correct source owner, relation and line. Non-NEXI behavior unchanged.
2. `.prisma` native dispatch previously returned only a file-level node; the
   external adapter had to discover and emit its 98 models/1,237 fields after
   generic Graphify extraction. New `graphify/extractors/prisma.py` reuses the
   verified restricted NEXI schema parser with source identities preserved,
   and emits the structural schema graph in native per-file dispatch.
   The semantic adapter still retains idempotent missing-node fallback for
   incremental scans where the Prisma file was not in the changed-file set.
3. The previous maintained Python/TypeScript extraction source and installer
   lived outside version control. Native-packed Python framework/HTTP and CJS
   scanner sources now have tracked sources under `tools/graphify/native/`;
   the installer uses these exact sources, and the legacy installer is synced.
   TypeScript `TypeChecker` remains the correct symbolic frontend; Python code
   consumes its source-identified records; no additional process/controller.

## Actual isolated engine proof (not application verification)

- Original defect fixture: distinct read/write same-pair facts collapsed.
- Post-patch native `to_json` -> load graph -> `affected_nodes` returned
  `reads_model@L3`, `writes_model@L4`, and reverse `uses_model@L7` with
  correct logical owner; MCP `_neighbor_lines` returned all three.
- Native Graphify `extract([schema.d1.prisma], root=backend,
  cache_root=<isolated temp>, parallel=False)` returned 98 model resource
  nodes, 1,237 field nodes, 98 `maps_to_table`, 1,237 `declares_field`,
  170 `prisma_relation_target`, and 103 *additional* declared SQL table
  edges from the existing adapter. All endpoints and node identities unique.
- `graphify.build.py`, `graphify.serve.py`, `graphify.affected.py` version-pinned
  patch applies to pristine official wheel 0.9.108 with `--fuzz=0`.
- New `nexi_relationships.py`, `http_relationships.py`, `nexi_semantic_scan.cjs`
  and `extractors/prisma.py` installed SHA fingerprints equal tracked sources.
- The maintained installer ran idempotently and installed native Prisma hook.

## Proof boundary

- `STATICALLY_VALIDATED` + `ISOLATED_GRAPHIFY_ENGINE_VERIFIED` only.
- Canonical `graphify-out/graph.json` was not rebuilt; previous SHA
  `e3d2d3d04d20292bfbb4c1605319d2ceab61fa639ff1850acb17b5a00c6ca4dc`.
- `source-map`'s `extractor_manifest_mismatch:python_sha256` remains an actual
  graph-evidence freshness gate until separately authorized regeneration.
- Deferred: end-to-end `graphify extract` of all three surfaces, HTTP joins,
  affected traversal across all custom relation classes, CSS file coverage,
  merge canonicalization consolidation, native graph-query BFS/path on
  secondary edges, graph freshness update, NEXI app tests/lint/build/deploy.

## Applied specialist methods

- Research & Writing Copilot `deep-research`, `verify-sources`,
  `technology-comparison`: verified exact upstream 0.9.108 Python/package
  boundaries against live runtime, disambiguated docs versus source claims.
- LLM & Agent Builder Copilot `choose-system-complexity`,
  `implement-agent-workflow`, `design-tool-contracts`: retained the native
  deterministic pipeline and existing TypeScript checker, avoided an extra
  graph service, preserved typed edge/provenance and fail-closed installer.
- Native Graphify package and SentinelX owner-permitted VM commands were
  actually invoked; no app financial or runtime action was invoked.

## NEXT source frontier

Evaluate and integrate the existing three-surface HTTP/socket canonicalizer
into Graphify native merge/resolve stages without losing typed/provenance or
manifest-staleness guarantees. Do not regenerate the canonical graph before
owner source-first application work closure unless separately authorized.
