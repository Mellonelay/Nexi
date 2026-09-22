# NEXI Cross-Source Reconciliation — 2026-09-22

## Scope
This report reconciles the production completion controller against current GitHub main, Worker-0 source/runtime evidence, Official Graphify Cloud, local Graphify, Notion, Fallow, and Riqor.

The production ledger remains the only completion controller. This report is evidence support, not a second queue.

## Current source and deployment identity
- GitHub/Worker-0 source: `main == origin/main == ed26973fe0556a6d75943b3e296be0a899449d6d`.
- Public current release: `/srv/nexi/public/releases/ed26973f-prod`, matching full release SHA.
- Admin current release: `/srv/nexi/admin/releases/ed26973f-prod-node`, matching full release SHA.
- Cloudflare Worker deployment: `bdadd96f-3696-474b-955d-de490a9a466d`, tagged `ed26973f`.
- Remote D1: no pending migrations.
- Backend readiness: ready with D1/database and Redis/Valkey dependencies true.
## Official Graphify Cloud
The current promoted graph is exactly aligned to `ed26973...`: 6,544 nodes, 15,108 edges, 420 communities.

Structural evidence confirms the intended authority chain rather than a competing business owner:
- `MarketAuthorityService` owns the canonical market read/write seam and is consumed by ingest, public controller, gateway, and seeder paths.
- `D1FinancialCommandGateway` is the dominant durable command hub. It is referenced by financial, ledger, wallet, trading, mining, loans, auth, Admin, EventOutbox, and workflow paths.
- `EventOutboxService` persists through the D1 financial gateway and publishes committed rows to the Queue bridge; its code explicitly does not replay originating financial commands.
- `CommunicationsService` depends on D1 communications persistence, EventOutbox, D1 Prisma reads, and Redis realtime, and is consumed by Admin, HTTP, gateway, and focused communications tests.
- `AdminPermissionGuard` resolves permissions through canonical backend RBAC plus D1-backed Admin identity.
- `RedisIoAdapter` is installed by backend bootstrap and provides Socket.IO Redis Streams state recovery. Graphify found no direct test attached to this adapter class.
## Local Graphify
Current local graph contains 7,676 nodes. Its God-node and affected-path analysis agrees with Cloud Graphify on the major owners.

Top architectural hub: `D1FinancialCommandGateway` with degree 228. Its two-hop affected set spans Admin, auth, wallet, ledger, financial operations, Spot/Margin, Binary, Mining, Loans, Workflows, EventOutbox and their tests.

Other major hubs include AdminDataProvider/NexiAdminApiProvider, AdminService/AdminController, CommunicationsService, RedisService, MarketAuthorityService and FinancialOperationsService.

This is concentration and change-risk evidence, not evidence of duplicate financial authority. The current source still routes durable mutations through D1-backed canonical owners.

## Fallow
Fresh Fallow analysis is current to the working source:
- 465 files / 8,049 functions analyzed.
- 624 functions exceed static complexity thresholds: 207 critical, 165 high, 252 moderate.
- No duplicate groups were returned by the top duplicate scan.
- No architecture boundary zones or rule packs are configured, so Fallow cannot currently enforce the documented authority model as policy.
- High-risk hotspots include Public Wallet/Settings/Spot, Worker `src/index.js`, `MarketAuthorityService`, provider adapters, and `FinancialOperationsService`.

These are maintainability/change-risk signals. They do not upgrade any ledger row to a runtime defect by themselves.
## Riqor
Riqor 0.2.6 is healthy; package provenance verified and security audit reports zero critical issues.

Its currently active evidence run is stale: it was created against repository head `e7db15f...`, while current source is `ed26973...`. Therefore that run cannot certify the current production generation and must not be used to close current ledger rows.

Riqor also reports low Worker-0 disk headroom (~4.9 GiB). This is an operator-plane risk, not a NEXI product-authority change.

## Notion
The main Notion engineering ledger was last edited 2026-09-14 and still records the older `3b173ea...` production/source baseline. It is historical/provenance evidence where it conflicts with current GitHub/runtime evidence.

The Sep-12 frontend manual-acceptance page remains useful requirement lineage for wallet-browser gating, explicit wallet choice, mobile drawer geometry, notification categories, deposit UX, and the Deep Liquid Violet product direction. Its old staging deployment identity is not current authority.

Notion independently confirms the evidence taxonomy used here: Graphify/Fallow are structural/static evidence, not runtime proof.
## Material conflicts resolved
1. GitHub ledger/current-state had stale pre-promotion statements. Fresh direct evidence proves Public, Admin and backend promotion at `ed26973...`. Active A-06, A-07 and A-08 are now reconciled locally as COMPLETED.
2. Notion's old source/deployment baseline is stale; it remains historical evidence only.
3. The active Riqor run is stale relative to current source and cannot certify current completion.
4. Fallow has no configured architecture-boundary enforcement. This is a hardening gap, not a product release blocker by itself.
5. Graphify's class-level strict-call views can under-report callees for DI-oriented NestJS classes; imports/references/affected-path evidence was used to avoid a false missing-link conclusion.

## What remains genuinely open
Production promotion itself is no longer an open row.

The genuinely unresolved controller remains `Z-01`: the feature-level rows that still require current end-to-end production proof. Most important are:
- market provider/trading-hours classification, truthful freshness/self-recovery, monotonic persistence, real depth/trades, and soak;
- current deployed Public paths P-01 through P-13;
- financial lifecycle/invariant rows F-01 through F-06;
- Mining/Loans E-01/E-02;
- communications/content/settings C-01 through C-04;
- Admin control-plane rows AD-01 through AD-08;
- EventOutbox/Queues/Workflows/realtime/concurrency rows R-01 through R-05;
- controlled identity rows I-01 through I-03, followed by owner final acceptance.

No cross-source evidence justifies reopening M-05, M-06 or M-07 unless their governing dependencies change or fresh runtime evidence contradicts them.
## Architecture conclusion
No second business or financial authority was found in the current graph. The dominant structural risk is concentration, especially the very large `D1FinancialCommandGateway`, plus the absence of Fallow-enforced boundary policy.

Those are later architecture-hardening candidates. They should not displace the current completion objective: prove or repair the remaining end-to-end ledger rows on the already-deployed unified generation.

## Next execution frontier
Use the production ledger directly. Start with market truth/reliability because it gates downstream Public/Admin market behavior, then verify deployed Public/Admin feature paths, then financial/async/realtime rows, then controlled identity gates, then owner acceptance.

Do not restart source convergence, deployment promotion, DNS, Kline interval proof, prior reconnect/resnapshot proof, or REST market recovery without contradictory evidence.
