# NEXI Worker-0 MCP Catalog

Purpose: durable ownership map for Worker-0 MCP services. Exact tool schemas, auth state, versions, and callability are mutable and must be discovered live.

## Dispatcher contract

```bash
rdc-mcp <service> list
rdc-mcp <service> call <tool> key=value ...
```

Run `list` only for the service needed by the task when exact schema is uncertain. Do not dump every catalog at startup.
On this resource-constrained VM, mass-listing many stdio routes can materialize `npx` sandboxes and consume hundreds of MB. Treat live discovery as task-scoped, not a global health sweep.

## Current service families

| Service | Responsibility | Use / avoid | Authority limit | Combines well with | Live discovery |
|---|---|---|---|---|---|
| `graphify` | local graph navigation, nodes, neighbors, communities, paths, PR impact | use for bounded local topology; not runtime proof | graph evidence only | source, Fallow | `rdc-mcp graphify list` |
| `graphify-cloud` | independent promoted repository graph, strict callers/callees, impact, references, tests | use for current promoted topology; do not substitute counts for local/Omni universes | graph evidence only | Git/source | `rdc-mcp graphify-cloud list` |
| `fallow` | TS/JS cleanup, blast radius, structural/change-safety, duplication, boundaries | use for deterministic code-structure questions; not runtime truth | static evidence | Graphify, source | `rdc-mcp fallow list` |
| `codescene` | code health, ownership, hotspots, change risk | use for maintainability/risk prioritization; not acceptance proof | static/history evidence | Graphify, Git | `rdc-mcp codescene list` |
| `context7` | current framework/library documentation semantics | use when API/library behavior is uncertain; not repo truth | external docs | DeepWiki/source | `rdc-mcp context7 list` |
| `filesystem` | repository-scoped file reads/search/writes | use when this MCP is the precise owner; native RDC may be faster | filesystem capability != permission | Graphify | `rdc-mcp filesystem list` |
| `deepwiki` | repo semantic/RAG, architecture, codemaps, diff/impact, wiki/index workflows | use for semantic orientation; not current-source/runtime authority | semantic support | Graphify/source/tests | `rdc-mcp deepwiki list` |
| `cloudflare-docs` | Cloudflare documentation search/migration guidance | use for current platform semantics; not operator state | docs only | project Wrangler | `rdc-mcp cloudflare-docs list` |
| `cloudflare` | Cloudflare account/API specification, read-only inspection, and authorized platform operations | current official docs first; inspect schema; use for Cloudflare runtime/operator evidence | backend/platform runtime authority only; no Ledger/D1 financial semantics ownership | Wrangler + official docs | `rdc-mcp cloudflare list` |
| `cloudflare-bindings` | live Worker binding inspection/operations | use only for binding questions after official docs | platform evidence only | Cloudflare + Wrangler | `rdc-mcp cloudflare-bindings list` |
| `cloudflare-builds` | Cloudflare build/deployment build evidence | use for build pipeline questions | build evidence only | Git/Cloudflare | `rdc-mcp cloudflare-builds list` |
| `cloudflare-observability` | Cloudflare logs/observability surfaces | use for deployed runtime investigation | telemetry only | Sentry/direct runtime | `rdc-mcp cloudflare-observability list` |
| `sentry` | organizations/projects/issues/events/traces and delegated Sentry tools | use for deployed telemetry; not source truth | telemetry | HTTP/runtime/source | `rdc-mcp sentry list` |
| `nest-observe` | Nest Observe MCP for NEXI telemetry when configured | use only when Observe evidence is required and auth is present | telemetry, not source truth | NestJS/Sentry/runtime | `rdc-mcp nest-observe list` |
| `chrome-devtools` | DOM/a11y/console/network/screenshots/interactions/performance for CDP browser | use when a browser target exists; not source authority | rendered/runtime evidence | Polypane, Playwright | `rdc-mcp chrome-devtools list` |
| `ponytail` | targeted frontend review/instructions | use as a bounded specialist; not browser/runtime proof | advisory | frontend source/browser evidence | `rdc-mcp ponytail list` |
| `browserstack` | real devices/browsers, accessibility, Percy, test management/automation insights | use late when real-device/cross-browser evidence matters | cloud test evidence | Playwright/DevTools | `rdc-mcp browserstack list` |

## Current live surface note — volatile

The 2026-09-16 Worker-0 canary found all routes above discoverable through `rdc-mcp`. Exact tool counts/names are volatile; `list` is schema authority.

Notable live families:
- Graphify Cloud: repository discovery, find/node/trace/callers/callees/expand/render, impact/risk, references/imports/exports/tests/file-neighbors/ranking, shortest path, memory/workspaces.
- DeepWiki: indexing/status, Q&A/search/RAG, wiki/docs, architecture/metrics, diff/impact, codemaps, research/workflows.
- Chrome DevTools: pages, DOM snapshots, console/network, input/navigation, screenshots, Lighthouse, traces/heaps.
- BrowserStack: Browser/App Live, Automate setup, accessibility, Percy visual, test management, screenshots/logs, RCA/build insights/self-healing.
- Ponytail currently exposes a targeted instruction surface rather than a broad runtime toolset.

Configured != authenticated != callable != successful required operation. Verify the exact state the task needs.

## Security

Never record secrets, tokens, access keys, or OAuth artifacts in this catalog. Document only the secure status-discovery path.
