# NEXI — maintained three-surface architecture

**Reconciled 2026-11-19 (Singapore).** Owner decisions and actual source govern; this is a maintained architecture map, **not** a statement that every current source behavior is tested or deployed. Detailed historical maps are recoverable from Git. Before calling an API/SQLite/graph relationship current, check its source SHA and applicable source/contract.

## Deployment and ownership
| Surface | Source | Runtime owner | Responsibility |
|---|---|---|---|
| Customer | \`frontend/\` Next.js 16/React 19 App Router | \`/srv/nexi/public/current\` / \`nexi-public.service\` | Mobile-first Web3 DApp-browser UI, SIWE, markets/charts, wallet, trading, Finance and messaging |
| Operator | \`Admin/\` React/TanStack Router/Start, Vite/Nitro | \`/srv/nexi/admin/current\` / \`nexi-admin.service\` | Permission-aware desktop administration and authenticated API consumption |
| API | \`backend/\` NestJS 12, Prisma 7, native SQLite | \`/srv/nexi/backend/dist\` / \`nexi-api.service\` | Domain authority, transaction policy, Ledger/audit/outbox, REST and realtime |

Name.com DNS and VPS Nginx route \`www.nexitrading.app\`, \`admin.nexitrading.app\`, and \`api.nexitrading.app\`. Financial truth is the promoted SQLite database at \`/var/lib/nexi/sqlite/nexi-staging.sqlite\` (historical filename, **not disposable**). \`D1PrismaService\`, \`d1_*\` source identifiers and \`d1_migrations\` preserve compatibility names; Cloudflare Worker/D1 are **not** NEXI's live application/financial runtime.

Prisma 7 and the native \`better-sqlite3\` gateway address the **same** durable store. \`LedgerAccount\`/\`LedgerPosting\`, business-state tables, user Activity and \`EventOutbox\`/\`EventInbox\` supply authoritative accounting, readback and durable intent. SQLite journals persist workflow/job commands. BullMQ 6 / Aiven Valkey transports work and Socket.IO projects events; neither creates financial truth or guarantees exactly-once delivery. KYC/proof files require private access and verified provenance.

\`\`\`mermaid
flowchart TD
 P[Public Next.js] --> N[VPS Nginx]
 A[Admin TanStack] --> N
 N --> API[NestJS auth / DTO / domain policies]
 API --> TX[Prisma + native SQLite transaction gateway]
 TX --> DB[(SQLite: business state + Ledger)]
 TX --> O[Audit / Activity / Outbox / Inbox / journals]
 O --> Q[BullMQ / Valkey: retries and transport]
 API --> WS[Socket.IO post-commit projection]
 WS --> P
 WS --> A
 API --> RD[Authenticated REST/readback]
 RD --> P
 RD --> A
\`\`\`

## Canonical producer -> consumer and financial invariant
1. Public wallet/customer or permissioned Admin submits an immutable intent and explicit original-request identity.
2. NestJS authenticates, authorizes and validates state/configuration, balances, ownership, asset/precision and replay/mismatch guards.
3. Coordinated SQLite write commits domain record, balanced Ledger effect, durable audit/Activity/Outbox as applicable; failures are not success-shaped.
4. Worker delivery is at least once; retry checks durable original intent/Inbox and must not double-post. Socket updates are advisory; clients reconcile persisted REST/readbacks.
5. Public and Admin present one truthful status for the same command, account, amount, asset, direction and receipt. An HTTP 200, UI toast, structural graph path or single Ledger row does not establish whole-user-flow correctness.

## Source-domain ownership
| Capability | NestJS owner | Public / Admin consumer |
|---|---|---|
| SIWE, account/session and permissions | \`auth/\`, \`users/\`, \`profile/\`, \`referral-vip/\` | login/settings; Admin users/sessions |
| Market catalog, 53 identities, quote/Klines | \`market/\` | Quotes/Asset Detail/Spot/Options; Admin assets/market-feeds |
| Wallet, deposit, withdrawal, transfer and Convert | \`wallet/\`, \`financial/\`, \`conversion/\`, \`ledger/\`, \`d1/\` | Wallet/Activity; Admin networks/deposits/withdrawals/ledger |
| Spot and isolated Margin | \`spot/\`, local financial command gateway | Spot/Margin/orders; Admin spot/exposure |
| Options/Binary and controlled research | \`binary/\`, \`admin/\`, \`sandbox/\`, settlement gateway | Options chart/positions; Admin research/default/override/settlements |
| Mining, Loans, referral/VIP | \`mining/\`, \`loans/\`, \`referral-vip/\`, \`workflows/\` | Finance; Admin product settings and audit |
| Messaging, notifications, Learn and support | \`communications/\`, \`events/\` | Customer panels; Admin messages/content/notifications |

Five customer-facing wallet scopes are Funding/MAIN, Spot, Margin, Options/BINARY and Finance. Options and user-transferable Margin cash are USDT-only, but liabilities and held assets are distinct; Finance commitments are not freely available. The 53 market symbols are **not** 53 custodial/deposit assets.

## Owner-approved Binary research architecture
Eight logical Admin workspaces and account-level research default + active position-specific override exist in the source. NestJS \`AdminService.persistBinaryResearchControl\` guards eligible research accounts, actor/reason, original request key, audit receipt and position version/expiry. \`BinaryService.buildSandboxSimulation\` generates isolated deterministic candle projection; \`frontend/app/lib/binary-sandbox-chart.ts\` validates the simulation and aggregates a chart. Do not conflate simulation with shared provider prices or create a second settlement/financial writer. Verify the exact current source and real Admin/Public same-release state before making a runtime PASS claim. Original owner design: \`Admin/docs/NEXI Admin — Unified Navigation and Binary Control Architecture-2026-10-21-144002.png\`.

## Current market architecture and proof limits
The 2026-11-18 committed market source (\`8d32b95\`) separates bounded provider tick/Kline processing from best-effort trades/depth, revises same-timestamp Klines and Public trade-gap recovery. In-memory ingestion buffers, a five-second shutdown grace and local type/focused tests do **not** imply zero loss or real released runtime improvement. Source queue/stream semantics, production provider freshness, financial interference, and deploy identity are independent checks. Conditional tradeoff decisions live in [market ADR](ADR-2026-11-18-NEXI-MARKET-DATA-RESOURCE-ARCHITECTURE.md).

## Proof and current status
At audit entry \`main@ed2496efaa63\` had six local commits not on remote and three November 17 services active on earlier artifacts. Current evidence [NEXI_CURRENT_STATE](../../NEXI_CURRENT_STATE.md) includes the failed broad Jest 40/753 tests and later native SQLite cleanup abort. Focused 74 Backend/62 Public/36 Admin checks were historically reported passing and do not erase that gate. The 113-case actual mobile Web3 browser acceptance has not been rerun against the candidate. Source, tests, build, deployment, API behavior, financial correctness and customer acceptance must remain separately labeled.

Reference owners: [root AGENTS](../../AGENTS.md), [financial invariants](../security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md), [source OpenAPI](../contracts/openapi.json), [operator guide](../../Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md), [Public design](../../frontend/DESIGN.md), [operations](../operations/NEXI_VPS_SQLITE_BULLMQ_RUNBOOK.md).
