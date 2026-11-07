# NEXI Graphify and trace coverage reconciliation — 2026-11-07

## Authority and artifact

This snapshot reconciles current source, deployed release markers and the active local Graphify MCP. It does not treat a graph edge as proof of a successful production request.

- Repository main and GitHub main: 27b78bb6f74a0ddb44e9121b15fdbb7c9f1c3c32.
- Deployed release markers checked: Public 27b78bb6f74a0ddb44e9121b15fdbb7c9f1c3c32; Backend and Admin 45a857de6a4d4101fc3f42738eb7d83f52bd62eb. These differ from current source main for Backend/Admin.
- Graphify 0.9.103, active MCP session @nexi-graphify-live.
- Canonical current-source graph: /srv/nexi/graphify-live/20261107/merged-graph.json; SHA-256 0c18266bab126d924e5e77acde7e940e004534a03a0bf033785fdeecf5f8337d; machine report: /srv/nexi/graphify-live/20261107/merged-graph-report.json. Graphify MCP config and compatibility symlink resolve to this file.
- Current-source manifest: three independent Graphify extracts from frontend/, backend/, and Admin/ at main SHA 27b78bb6f74a0ddb44e9121b15fdbb7c9f1c3c32; 104 + 227 + 102 = 433 detected code files. Tests/specs are excluded to keep the product topology focused; code-only extraction skips docs and media.
- Historical source-graph lineage is confirmed by SentinelX audit record 2026-11-06T16:23:32Z (command return code 0): Graphify extracted `/srv/nexi/public/current`, `/srv/nexi/backend`, and `/srv/nexi/admin/current` into `/srv/nexi/graphify-live/20261106/{public,backend,admin}`, then `graphify merge-graphs` wrote `/srv/nexi/graphify-live/20261106/merged-graph.json`. Thus `graphify-live` was the generated-output staging directory, not a fourth application source tree.
- The earlier Nov 7 unified-extraction figures were superseded by the current-source three-graph rebuild. /home/mellonelay1999/.mcpc/nexi-graphify-live.json targets /srv/nexi/graphify-live/20261107/merged-graph.json; the compatibility symlink and default Graphify path resolve to the same merged graph.

## Rebuild sequence

The current-main source graph is built from three separate Graphify CLI extractions, then merged:

```bash
graphify extract /home/mellonelay1999/workspaces/Nexi/frontend --code-only --force --no-cluster --max-workers 4 --exclude "**/*.test.*" --exclude "**/*.spec.*" --exclude "**/__tests__/**" --exclude "test/**" --exclude "tests/**" --exclude "**/test/**" --exclude "**/tests/**" --out /srv/nexi/graphify-live/20261107/surfaces/frontend
graphify extract /home/mellonelay1999/workspaces/Nexi/backend --code-only --force --no-cluster --max-workers 4 --exclude "**/*.test.*" --exclude "**/*.spec.*" --exclude "**/__tests__/**" --exclude "test/**" --exclude "tests/**" --exclude "**/test/**" --exclude "**/tests/**" --out /srv/nexi/graphify-live/20261107/surfaces/backend
graphify extract /home/mellonelay1999/workspaces/Nexi/Admin --code-only --force --no-cluster --max-workers 4 --exclude "**/*.test.*" --exclude "**/*.spec.*" --exclude "**/__tests__/**" --exclude "test/**" --exclude "tests/**" --exclude "**/test/**" --exclude "**/tests/**" --out /srv/nexi/graphify-live/20261107/surfaces/admin
graphify merge-graphs /srv/nexi/graphify-live/20261107/surfaces/frontend/graphify-out/graph.json /srv/nexi/graphify-live/20261107/surfaces/backend/graphify-out/graph.json /srv/nexi/graphify-live/20261107/surfaces/admin/graphify-out/graph.json --out /srv/nexi/graphify-live/20261107/merged-graph.json
```

The merged graph then receives the NEXI HTTP-operation canonicalization pass. For clustering, copy merged-graph.json to graphify-out/graph.json, run graphify cluster-only /srv/nexi/graphify-live/20261107 --no-viz --no-label, then publish the clustered graphify-out/graph.json back to merged-graph.json and make graphify-out/graph.json a symlink to it. This preserves Graphify's per-node community IDs in the canonical MCP input. The live graph_stats call now reports 208 communities. Exclusions are CLI arguments; .graphifyrc is only for language overrides and visualization node limits. These commands were checked against Graphify 0.9.103.

## Graph integrity and coverage

- Current-source merged graph: 5,953 nodes, 17,481 edges, 208 communities; Graphify summary is 94% EXTRACTED, 6% INFERRED, 0% AMBIGUOUS. IDs are unique, there are no dangling edges or exact duplicate edge records, and Graphify diagnose multigraph found no same-endpoint edge collapse.
- Six byte-identical SQL-reference edges were present in the prior export. The graph build script now removes only exact duplicate edge objects before serialization; it does not collapse relationships that differ by source/target, relation, line, context, confidence or other attributes. This reduced edge count by six; nodes, communities, HTTP/context edge totals and source inputs were unchanged.
- Current-source HTTP topology: 293 operation nodes; 173 client-call edges; 280 handler edges; 6 inferred dynamic-path candidates; 1 Next.js route delegation; 152 exact normalized method/path joins (Admin->Backend 103, Frontend->Backend 48, Frontend->Frontend 1). There are 12 client-only and 128 handler-only operation IDs. All 460 HTTP edges and 14 React Context edges retain source file and location.
- The custom HTTP extractor keeps absolute external origins separate from first-party operations and scopes wrapper resolution to a lexical class or unique declared receiver type. Three focused tests passed earlier for NEXI patterns, external-origin collisions, and unrelated same-name request() methods; this graph rebuild did not rerun those tests. This export was checked for unique IDs, zero dangling/duplicate edges, and source file/location on all HTTP and Context edges.
- Current-main Admin route coverage: the graph contains 37 Admin/src/routes source paths, including support.tsx and reconciliation.tsx; both remain in source although not shown in navigation. The source still contains 34 named page files and 21 direct page destinations in NAV_GROUPS. Hidden from the UI does not mean removed from source or omitted from the graph.
- Five React Context nodes carry 14 value-flow edges (1 default value, 4 providers, 5 consumers, 4 root wrappers).
- Verified Public path: MarketDataProvider() -> GET /api/market/prices -> Next.js route delegation and re-export -> readAuthoritativeBackend() -> GET /market/prices -> Nest AppController.getAllPrices(); all six graph hops are extracted.
- Verified Admin path: NexiAdminApiProvider.applyFinancialCorrection() -> POST /admin/financial-corrections -> AdminController.applyFinancialCorrection() are extracted edges. Controller -> AdminService.applyFinancialCorrection() is inferred at 0.85, so that method-level call chain is not fully extracted.
- Retrieval benchmark figures in the earlier snapshot are historical and were not recomputed for these corrected graphs.

## Remaining genuine gaps and scope

- Two dynamic Admin calls (POST /admin/governance/commands/:param/:param and POST /admin/withdrawals/:param/:param) have inferred handler candidates, not exact joins.
- The 12 current-source client-only operation IDs comprise known external provider operations, two dynamic Admin calls with inferred handler candidates, and the /domain-events bridge call described below.
- POST /domain-events at backend/src/events/event-outbox.service.ts:L103 is the one unresolved client-only operation outside those adapters. It is the configured non-local bridge branch (host from QUEUE_BRIDGE_HOST, default nexi.queue); no receiver source is included in this graph. This is an input-boundary gap, not proof the queue bridge is broken.
- 128 current-source handlers have no exact client edge in these selected sources; they may be invoked by other clients, background work, or be intentionally unused. They are not defect evidence.
- Graphify maps static source relationships from the current-main source snapshot. It does not show runtime requests, browser behavior, actual auth success, background dispatch, or external-provider internals. Jaeger provides a separate runtime trace view; its verified coverage is summarized below from the earlier dated check.


## Deployed snapshot comparison - 2026-11-07

A separate build was produced from the exact deployed VM roots /srv/nexi/public/current, /srv/nexi/backend, and /srv/nexi/admin/current, again as three independent extracts followed by merge-graphs. Outputs and report are under /srv/nexi/graphify-live/20261107/deployed-snapshot/. This is a comparison artifact, not the canonical current-source graph: Public is at 27b78bb6f74a0ddb44e9121b15fdbb7c9f1c3c32, while Backend and Admin are both at 45a857de6a4d4101fc3f42738eb7d83f52bd62eb. Generated Prisma client, Admin server bundles, Public agent material, tests/specs, and Graphify caches were excluded.

The deployed merged graph contains 5,956 nodes, 17,297 edges, and 228 communities (SHA-256 fd7f8f34ab18ddfb75032737c8fb8374293d1594a69f1d229810d0b3a88b7a23); it has 297 HTTP operation nodes, 160 call edges, 280 handler edges, 136 exact joins (Admin->Backend 88, Frontend->Backend 48, Frontend->Frontend 1), 6 inferred path candidates, 15 client-only operations, and 144 handler-only operations. It has zero dangling edges and zero missing HTTP/Context source provenance. The gap from current main shows why deployed Admin/Backend and current source remain labeled separately.

## Jaeger v2 state, separate from the source graph

- nexi-jaeger.service is active on the VM with Jaeger v2.23.0, using /etc/nexi-jaeger/config.yaml; its binary is /opt/nexi/jaeger/2.23.0/jaeger.
- OTLP receivers listen on loopback HTTP 4318 and gRPC 4317; Jaeger query/UI is loopback 16686 HTTP / 16685 gRPC. Badger trace and archive storage persists under /var/lib/nexi/jaeger with 48h and 720h span retention.
- A two-span nexi-otel-smoke trace was queryable through /api/v3/trace-summaries, and the services endpoint listed nexi-otel-smoke. This confirms the collector/query/storage test path only.
- The Node SDK, OTLP HTTP exporter and privacy-filtered route-mapping preload are installed under ~/.local/share/nexi-otel-node, but the running nexi-api.service process exposes only NODE_OPTIONS=--enable-source-maps; it does not preload register.cjs. No current production API/Admin/Public trace emission is established.
- An older user-level Jaeger config copy uses different Badger paths. The systemd config at /etc/nexi-jaeger/config.yaml is authoritative; no service, database, deployment or trace config was changed in this reconciliation.

## Source and operation references

- Feature ownership: Cross-surface feature map.
- Runtime and durable-state authority: System architecture and VPS runbook.
- Admin route/behavior map: TanStack architecture and route map. Current main source contains 21 direct sidebar destinations and 34 named route files; 31 was accurate at Nov 1 source SHA 99a460a33d51a05a96ae669aee167fc866723021. A 24-route count is not established by NAV_GROUPS.

This file is a dated evidence snapshot. Refresh volatile markers, graph digest, extractor/report and runtime trace wiring before reusing its current-state assertions.


## Read-only Cloud Browser observation — 2026-11-07

- Reused the already-open signed-in Public tab at `/dashboard/asset/ETHUSDT` and Admin tab at `/overview`; no new tab was opened. Public showed a connected wallet, ETH/USDT asset detail, LIVE market quote, chart with 1h selected, market-data source labels, and the customer dock (Dashboard, Spot/Margin, Options, Wallet, Earn). Admin showed the server-confirmed Super Admin identity/API-connected state, the Overview workspace, the eight workspace navigation groups, and current operational summary cards. No controls that change application state were activated.
- This is a point-in-time observation of two rendered pages and one authenticated Admin role. It does not establish viewport dimensions, all route visibility/reachability, underlying financial workflows, full responsive acceptance, or runtime trace emission. Source/Graphify coverage remains a separate evidence class; the 21 direct navigation destinations versus 34 named route files continues to be determined from the deployed Admin source and graph manifest, not inferred from this page snapshot.
