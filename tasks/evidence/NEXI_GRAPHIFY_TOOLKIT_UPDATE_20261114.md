# NEXI Graphify toolkit update — 2026-11-14

## Scope and authority
Owner authorized updating Graphify in the NEXI VM/repository environment and inspecting its toolkit. **No NEXI application source, application tests, builds, service restarts, financial state, deployment, or canonical graph rebuild** was authorized or performed.

## Release and tool environment
- Official upstream: `Graphify-Labs/graphify`, stable release `v0.9.108` (2026-11-12); package `graphifyy[all]==0.9.108`.
- Prior VM tool: `graphifyy[all]==0.9.105` in `/home/mellonelay1999/.local/share/uv/tools/graphifyy`.
- Upstream release wheel SHA-256 independently checked: `040c289663cec38ae39dd5e450d9810233e0b70535f2d0b76b1467150aca6cea`.
- Current `uv tool list` and `graphify --version` report `graphifyy v0.9.108` and `graphify 0.9.108`; CLI and `graphify-mcp` entrypoints are installed.
- The exact-0.9.105 receipt with `[all]` extras initially rejected a plain `uv tool upgrade`; replacing `graphifyy[all]==0.9.108` succeeded after correcting root-owned artifacts confined to this uv tool environment.

## Maintained NEXI extension
- Maintained custom source: `/home/mellonelay1999/.local/share/graphify-nexi/graphify-http-extractor/`.
- Installer `install_patch.py` exact version pin advanced to 0.9.108. Prior installer preserved as `install_patch.py.pre-0.9.108-20261114`.
- Installer returned `graphify=0.9.108 hook=installed`.
- Installed `nexi_relationships.py` and `http_relationships.py` SHA-256 fingerprints each equal their maintained equivalents.
- `detect.py` retains one `NEXI_PRISMA_DETECT_V1` hook; `extract.py` retains one `NEXI_PRISMA_EXTRACT_V1` hook and one `NEXI_FRAMEWORK_RELATIONSHIPS_V1` hook.
- Post-install ownership of the isolated tool environment corrected to `mellonelay1999`, and owner-account imports of Graphify and both custom modules succeeded.
- Graphify automatically refreshed local `kilo` and `agents` skill copies to 0.9.108, preserving the previous differing `SKILL.md` as `.bak`.

## Graph and local MCP boundary
- Local MCPC `@nexi-graphify-live` `graph_stats` succeeded: 12,111 nodes, 32,636 edges, 327 communities.
- CLI `graphify query` performed a bounded read-only query against existing `graphify-out/graph.json` successfully.
- Canonical graph bytes remain unchanged, SHA-256 `e3d2d3d04d20292bfbb4c1605319d2ceab61fa639ff1850acb17b5a00c6ca4dc`.
- The graph was previously built under Graphify 0.9.105 with older extractor/installer fingerprints. **The 0.9.108 tool upgrade does not certify that graph as a newly built or source-exhaustive 0.9.108 graph.** A later custom three-surface regeneration is a separate decision and must preserve source-first/project constraints.
- `Graphify` ChatGPT-host plugin tools are separate from this local Graphify CLI/MCPC and do not replace its canonical graph target.

## Proof class and next boundary
`TOOLKIT_VERSION_VERIFIED` + `CUSTOM_HOOK_SOURCE_VERIFIED` + `LOCAL_MCP_READ_VERIFIED`; no application verification or graph rebuild. Wait for the next owner instruction before expanding Graphify architecture, extraction coverage, or application source scope.
