# NEXI Graphify, NetworkX, Doctor and Valkey audit — 2026-11-03

## Scope and revisions
Live owner checkout was `main` at `171ccddb3ceabcfaf5eb72e310015ade7838c35b`, equal to `origin/main`; tracked tree was clean before documentation. Application source remained `188fdba1b9e703f04f1c3fbe32186f7daa6dce22`. Historical untracked backups and generated artifacts were preserved and excluded. No application code changes were warranted by this audit.

## Graph provenance and query method
Local Graphify CLI 0.9.101, local `nexi-mcpc` 0.7.0 and MCP session `@nexi-graphify-local` responded. Local graph `graphify-out/graph.json` was built at the exact checked checkout SHA; statistics were 7,917 nodes, 20,340 edges, 411 communities, 94% extracted and 6% inferred. NetworkX 3.6.1 was used against this graph. The hosted graph is separate with less coverage and was not substituted for local results. No graph rebuild or tool upgrade was needed.

Effective queries named concrete owners and relations: exact seed `.handleProviderEvent` with DFS/call context for MarketIngestService; `DurableQueueTransport` with DFS/call context for queue dispatch; hosted queries traced depth/trades routes and conversion-pair consumers. Broad unseeded questions returned large candidate sets, so queries were narrowed by exact symbol/relation. Graph edges were navigation evidence only. Direct source inspection verified NestJS module wiring, dynamic worker callbacks, event literals and channel subscriptions; absence of a static path was not counted as a defect.

## End-to-end paths checked
| Flow | Source path | Evidence / status |
|---|---|---|
| Binance depth/trades | `MarketPublicController.depth/trades` → `MarketProviderRouterService` → `BinanceSpotAdapter`; Public Spot reads `/market/depth` and `/market/trades`, consumes `market.reference.depth` / `market.reference.trade` | Source and contracts connected. Redis reference channel is subscribed by `MarketGateway`, then broadcast by Socket.IO. External reference liquidity remains separate from internal execution. |
| Klines/quotes | Provider event → `MarketIngestService.handleProviderEvent` → native persist or quote aggregation in `MarketKlineService` → `market:klines:v1` → `MarketGateway` Socket.IO `market_kline` → `useRealtimeMarket` → worker/fallback reducers → chart | Source path confirmed at application source 188fdba; exact-source tests/CI are in closure receipt. Market Kline publication has no BullMQ processor. |
| Durable jobs | `LocalAsyncRuntimeService` Queue.add(`domain-events`, `{journalId}`) → BullMQ/Valkey DB 1 → Worker → `DurableQueueTransport.process` → SQLite journal consumer | Source wiring and read-only live counts confirmed. SQLite journal/EventInbox/Workflow and Ledger/Outbox are durable truth; BullMQ/Valkey is transport. |
| Wallet Convert | `/financial/conversion/pairs` eligible-rate path → `ConvertModal` pairs/quote/accept APIs | Graph identified callers; source contract reviewed read-only. No economic operation run. |

Graph limits: static extraction may miss DI registration, event-name strings, worker callbacks and runtime transport. NetworkX paths cover indexed edges only and do not prove live delivery.

## Diagnostics
- React Doctor 0.9.14, full frontend: exit 1; complete, 135/135 source files analyzed; 1 error / 50 warnings. Sole error at `frontend/app/dashboard/wallet/page.tsx:203` was traced: ref increment occurs inside a `useEffect` synchronization callback supplied to `useWalletSession`, not a functional state updater. Assessment: analyzer false positive. A sampled NotificationsPanel warning about reset/finally cleanup also disagreed with source. Other warnings were not individually certified clean.
- NestJS Doctor 0.9.10, backend: exit 0; 190 files; score 86/100; 0 errors, 229 warnings, 116 info. Findings are heuristic absent source confirmation. Existing exact-source CI and market tests at 188fdba remain the applicable code proof.
- No additional application defect was corroborated. No source repair or broad test rerun was justified.

## Staging Valkey and BullMQ (read-only)
Owner-managed backend environment connected over TLS to staging Valkey 9.1.2; PING=PONG, DB 1, 20 connected clients. Read-only INFO and BullMQ counts: `domain-events` 49 completed, 0 wait/active/failed/delayed/paused/waiting-children; `notifications` and `integration-jobs` all zero. No job was consumed, acknowledged, replayed or enqueued. Aiven metrics and server INFO memory differed; this alone does not establish a capacity issue.

Aiven control plane showed `0.0.0.0/0` and `::/0` network allowlists and default ACL `+@all` for all keys/channels, plus pending maintenance updates. The connection credential pasted into chat is treated as exposed and omitted from this receipt. No password, ACL, allowlist, service or queue setting was changed. Owner action: rotate the credential and scope network/ACL after confirming approved client CIDRs and the commands needed by BullMQ/Socket.IO.

## Boundaries
No deployment, restart, database/financial write, migration, queue mutation, job consumption or browser acceptance occurred. The 113-point tracker remains partial; current deployed identity and mobile browser screenshots remain separate acceptance evidence. Do not promote Capability Evolver lessons: no independent production verifier is configured.
