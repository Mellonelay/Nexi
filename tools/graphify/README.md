# NEXI native Graphify engine patch (0.9.108)

The authoritative customized Graphify runtime is the owner-installed `uv` tool
`graphifyy[all]==0.9.108`, with Python package at:

`/home/mellonelay1999/.local/share/uv/tools/graphifyy/lib/python3.12/site-packages/graphify/`

The upstream wheel is unchanged in Git. The **version-controlled native patch**
`patches/graphifyy-0.9.108-nexi-typed-relation-evidence.patch` modifies the
installed `graphify/build.py` and `graphify/serve.py`; it was applied on the VM.
Do not confuse this with NEXI's separate framework extractor under
`~/.local/share/graphify-nexi/graphify-http-extractor/`.

## Confirmed defect

A native simple Graph/DiGraph collapses different `relation` facts between the
same two node IDs (e.g., `reads_model` and `writes_model`), silently overwriting
one and its provenance. The existing `also_seen` attribute preserves provenance
for a repeated *same* relation, not a different relation. This was reproduced
against the unmodified 0.9.108 builder in an isolated Python fixture.

## Applied ownership and compatibility

- `graphify/build.py`: preserve distinct NEXI typed arcs, including `_src`,
  `_tgt`, `relation`, `context`, confidence and source location, in a sorted
  `parallel_relations` evidence sidecar on the surviving edge. The primary edge
  and native graph class are intentionally unchanged. Repeat provenance still
  uses upstream `also_seen`. Non-NEXI edges retain upstream behavior.
- `graphify/serve.py`: the existing MCP `get_neighbors` renderer expands those
  saved facts with true direction, confidence and provenance. The built-in
  `relation_filter` can select individual retained relationships. Invalid arc
  endpoints are ignored rather than fabricated.
- The maintained `install_patch.py` now checks the two patch markers and applies
  the repo patch on supported clean 0.9.108 package files, refusing partial or
  fuzzy patch mismatches. Upgrading Graphify to another version requires a
  deliberate patch rebase; do not blindly carry this patch to a new release.

## Reapply after reinstalling the exact compatible upstream wheel

Run the existing maintained installer after installing `graphifyy[all]==0.9.108`:

```bash
python3 /home/mellonelay1999/.local/share/graphify-nexi/graphify-http-extractor/install_patch.py
```

It restores the existing framework hooks and this native engine patch.
Without the installer, the native patch can be applied from a clean upstream
0.9.108 site-packages directory with `patch -p1 --fuzz=0`, using this tracked
patch as stdin. Applying it a second time is not supported; inspect markers.
The installer does not rebuild the canonical graph or restart services.

## Proof and limits

Engine-only checks reproduced the failure before the patch, then verified typed
forward/reverse edges, relation filters, provenance, JSON round-trip, and
non-NEXI compatibility. The patch applied with `--fuzz=0` against the original
verified 0.9.108 wheel in an isolated scratch directory. Existing native MCP
remains accessible. **The canonical NEXI graph is not regenerated.** The
`parallel_relations` sidecar is inspectable through `get_neighbors`, but native
query BFS, `path`, `affected`, and clustering still operate on the *primary*
structural edge. The patch is not a full MultiDiGraph migration nor a proof of
all NEXI extractor input coverage or application semantics.

The 0.9.108 upstream source and wheel must be rechecked on any future package
upgrade. Do not run NEXI application tests/builds/deployments as part of this
Graphify-engine maintenance slice.
