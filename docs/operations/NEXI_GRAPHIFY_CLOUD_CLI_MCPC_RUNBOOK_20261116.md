# NEXI — local Graphify/MCPC quick reference

**Versioned locator, not a standing graph authority.** Host paths/CLI versions and source graph revision must be inspected live; no Graphify Cloud upload is implied or authorized.

- Canonical source checkout: \`/home/mellonelay1999/workspaces/Nexi\`.
- Checkout graph: \`graphify-out/graph.json\`; on 2026-11-19 its \`built_at_commit\` was **03cf396**, older than source \`ed2496e\`. Graph traversal on this artifact can omit later market/Admin source changes. Treat it as a candidate locator until rebuilt and verified.
- The historic local MCPC source-session label was \`@nexi-graphify-live\`; reference Knowledge graph was \`@nexi-knowledge\`. Verify actual current MCP/CLI host session list and tool schema before invoking; do not assume previous IDs or cache identities are still callable.
- Installed executables previously included \`/usr/local/bin/nexi-mcpc\` and \`~/.local/bin/graphify\`. Verify executable path, version, permissions and \`--help\` for the actual CLI arguments.
- Preferred query shape: exact source owner -> bounded one-hop neighbors/callers -> path/affected only when necessary -> direct source file:line confirmation. Capture source SHA, graph \`built_at_commit\`, EXTRACTED vs INFERRED, and missing edges as UNKNOWN. Graphify topology is not current test, browser or runtime proof.
- Never refresh/recluster/change semantic extraction merely to answer a known file owner; use direct source or \`rg\`/SentinelX search. Any graph write or hosted indexing needs task-specific authorization.
- Preserve historical Graphify semantics/command manuals and observed graph sizes through Git history rather than re-copying full upstream CLI/Cloud catalogs here.

## Evidence labels
\`GRAPH_MATCHED\`: source graph and checkout SHA aligned; \`GRAPH_STALE\`: not aligned; \`SOURCE_INSPECTED\`: governing code directly read; \`RUNTIME_VERIFIED\`: actual running revision observed separately. No chain of graph edges upgrades itself to financial or user-facing proof.
