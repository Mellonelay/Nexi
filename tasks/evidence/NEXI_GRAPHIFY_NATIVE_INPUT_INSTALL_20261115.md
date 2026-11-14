# NEXI Graphify 0.9.108 — native source-input installation (2026-11-15)

## Source-first scope
Owner requested native Graphify installation and integration first, not another application-verification campaign or canonical graph rebuild. Existing local Graphify v0.9.108 with `graphifyy[all]` and NEXI's HTTP, NestJS, Prisma, TypeScript compiler, merge and typed-relation modules was retained.

## Confirmed missing installation
The installed Graphify detector did not recognize `.css`; `tree_sitter_css`, `tinycss2`, and `cssselect2` were absent. Current tracked Public/Admin source includes CSS stylesheets (some build-generated CSS was intentionally excluded). No current tracked SCSS stylesheet was identified.

## Native installation performed
- Installed `tinycss2==1.5.1` (and its `webencodings==0.6.1` dependency) inside the isolated Graphify uv Python environment, not the NEXI Backend/Public/Admin application dependency stores.
- Added maintained `tools/graphify/native/graphify/extractors/css.py`, a CSS Syntax 3 structural extractor. It models source-defined CSS class/ID selectors and custom properties with source locations; supports nested @media, @supports, @layer, @container and @scope rules. It does **not** claim JSX use, applied CSS, cascade resolution or runtime layout behavior.
- Updated maintained `tools/graphify/install_native.py` to ensure the exact CSS parser dependency is available, install the maintained native extractor into Graphify's Python package, register `.css` in native `detect.py`, and dispatch `.css` from native `extract.py`. Existing Prisma and unified HTTP/framework hooks remain unchanged.
- Synchronized the historical compatibility installer `~/.local/share/graphify-nexi/graphify-http-extractor/install_patch.py` with the repository-maintained installer. The old installer bytes were backed up prior to replacement.

## Installation receipt
The version-pinned native installer returned `graphify=0.9.108 hook=installed` and then `hook=unchanged` on a second invocation. No canonical graph regeneration, application tests/lint/build, browser acceptance, restarts, deployments, financial mutations or graph-completeness verification were performed.

## Remaining native-source coverage
- `graphifyy[all]` plus the NEXI-native modules does not imply semantic completeness for every source file or execution path.
- SCSS/SASS, generated Tailwind utilities, Nginx/systemd configuration semantics, dynamic HTTP request construction, Graphify query/cluster consumers and cross-surface symbol resolution are not covered by this CSS addition.
- The HTTP extractor and framework adapter are installed; full route-client-consumer completeness is **not yet verified**, as requested by owner.
- The stored canonical source graph is older than the native engine and has not been regenerated. Distinguish source installation from runtime/application behavior.

## Engineering receipt
TASK: Native Graphify dependency/extractor installation.
SKILL APPLIED: Existing NEXI native integration source pattern; Caveman smallest additive adapter/installer change.
KNOWLEDGE: NEXI v3.4 runbook and Graphify source/detector/dispatcher contracts, inspected live.
GRAPH OWNER: `graphify.detect` -> `graphify.extract._get_extractor` -> `graphify.extractors.css`, existing HTTP/Prisma untouched.
PROOF: `INSTALLER_EXECUTED`, not `COMPLETE_GRAPH_COVERAGE`.
NEXT: source-coverage gap classification and remaining native semantic installation, then an owner-authorized isolated verification phase.
