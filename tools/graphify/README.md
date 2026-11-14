# NEXI native Graphify 0.9.108 engine

**Authoritative source:** `tools/graphify/native/graphify/` and the version-pinned
`tools/graphify/patches/graphifyy-0.9.108-nexi-typed-relation-evidence.patch`.
`tools/graphify/install_native.py` is the maintained reinstall procedure; the
older `~/.local/share/graphify-nexi/graphify-http-extractor/install_patch.py`
entrypoint is synchronized with it for compatibility, but its older Python
extractor files are **not** source-of-truth after this migration.

Installed runtime: `graphifyy[all]==0.9.108` at
`~/.local/share/uv/tools/graphifyy/lib/python3.12/site-packages/graphify/`.
This is offline/local Graphify, not the hosted Graphify Platform.

## Native components and contract

| Installed module | NEXI responsibility |
| --- | --- |
| `detect.py` | `.prisma` classified as code; existing security/ignore checks preserved. |
| `extract.py` | Native `.prisma` extractor dispatch, plus one combined framework hook before AST provenance finalization. |
| `extractors/prisma.py` | Native, source-bounded Prisma model, field, table and relation declarations. Exact NEXI IDs and source locations preserved. |
| `nexi_relationships.py` | Native-packaged compiler-backed NestJS, Prisma operation, SQLite, BullMQ/Valkey, Socket.IO, Next/TanStack/React relationship interpretation. |
| `http_relationships.py` | Native-packaged HTTP endpoints, calls, delegation and React Context source interpretation. |
| `nexi_semantic_scan.cjs` | Native-packaged TypeScript 6.0.2 `Program`/`TypeChecker` companion, executed with the existing Node 24 runtime and project-local TypeScript. Not reimplemented in weaker Python regex. |
| `build.py` | Preserve distinct NEXI source-directed typed facts and provenance when the native simple graph collapses endpoint pairs. |
| `serve.py` | Expose the retained facts through existing MCP `get_neighbors`, retaining direction, confidence, line and `relation_filter`. |
| `affected.py` | Reverse-dependency traversal reads those retained NEXI facts, including oppositely oriented relationships and correct source sites; caller must explicitly select extra NEXI relations. |

Graphify still uses its original Python `detect -> extract -> build -> cluster ->
analyze -> export/serve` pipeline. The native TypeScript companion is a *parser*
within that flow, not a second graph engine or controller. The NEXI HTTP/Socket.IO and infrastructure canonicalizer is now packaged as
`graphify/nexi_merge.py` and callable through `python -m graphify.nexi_merge`.
The old `merge_surface_graphs.py` forwards to that native-packaged module.
However, upstream `graphify merge-graphs` has NOT yet been wired to invoke
NEXI canonicalization automatically; NEXI's source-manifest validation is
required before promotion. Existing graph-consumer and completeness limits remain.

## Reinstall (after exact same upstream version)

```bash
python3 /home/mellonelay1999/workspaces/Nexi/tools/graphify/install_native.py
```

The installer detects the exact 0.9.108 package, parses candidate Python files,
checks the companion scanner with Node, and refuses absent or ambiguous upstream
hook anchors. It applies the zero-fuzz patch to a pristine upstream `build.py`,
`serve.py`, and `affected.py` or confirms all three are already modified;
it rejects partial native core patch states. It copies tracked native framework,
HTTP, Prisma, and CJS source into the installed package before turning on hooks.
Modified installed files are backed up into the old toolkit's backup directory.
The compatibility installer entrypoint has the same bytes as this tracked file.

Do **not** run `uv tool upgrade` without first reviewing this version pin and
rebasing the patch and native hooks for the new upstream source. The installer
neither regenerates the canonical graph nor restarts application services.

## Evidence and limitations

The native Prisma per-file extractor returns 98 schema models, 1,237 fields,
98 model-to-table mapping edges and 170 model relation-target edges for the
current `backend/prisma/schema.d1.prisma` schema. Full isolated `extract()`
proves native dispatch and no duplicate node IDs/invalid structural endpoints.
Native typed multi-relation edge preservation and `affected()` traversal were
checked through `to_json()` and `load_graph()` using isolated tiny graphs.
The patch was also applied with `patch --fuzz=0` to untouched upstream wheel
0.9.108 in a temporary directory.

**Not proven:** full repo source-file coverage, unindexed CSS/SCSS, native multi-
relation BFS/shortest path/clustering, cross-surface merge replacement, dynamic
runtime events, and application correctness. `affected` default relation names
remain intentionally conservative; custom NEXI relations require explicit
selection. The current `graphify-out/graph.json` is an older 0.9.105 extract;
new native semantics are not reflected there without a separately authorized
canonical graph regeneration. Knowledge-first Kernel source-map currently
reports an extractor-manifest SHA mismatch. Source-first defers NEXI application
tests/builds/restarts/deployment.

Reference: `tasks/evidence/NEXI_GRAPHIFY_NATIVE_ENGINE_MIGRATION_20261115.md`.

## Native merge and candidate-inventory extension (2026-11-15)

`graphify merge-graphs` now accepts the NEXI-only environment gate
`GRAPHIFY_NEXI_NATIVE_MERGE=1`, where the requested destination and all three
input graph hashes must match a current `nexi-native-v2` source manifest.
Without that gate, upstream merge behavior remains unchanged. The NEXI merge
resolves HTTP operation IDs and conservative Socket.IO candidate links before
writing. Invalid secondary typed-edge endpoints, duplicate relation facts,
dangling edges and source-less HTTP facts fail closed. The native source
inventory hashes tracked and newly-added eligible files; it separately counts
candidate inputs without graph nodes. This is a freshness/coverage report, **not**
a claim that every candidate is graph-covered or semantically correct.

The currently recorded candidate counts (Public 177, Backend 399, Admin 110)
are source-snapshot dependent. The canonical NEXI graph remains untouched.
No application tests, builds, runtime changes or deployments are performed by
this engine workflow.
