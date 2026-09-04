# NEXI Omnipotent Repository Map — 2026-09-03

## Status

`MAPPING_COMPLETE_FOR_CURRENT_READ_ONLY_PASS`

This is an evidence inventory, not a completion claim and not a repair plan. Existing Kline changes were preserved. No source, deployment, or infrastructure mutation was performed during this mapping pass.

## Scope covered

The repository was scanned across Backend, Public frontend, Admin, Cloudflare Worker/Container, D1/Prisma migrations, market/providers, realtime, financial domains, authentication, communications, queues/workflows, tests, and contract/configuration files.

Repository baseline observed:

- HEAD: `c74dbbd`
- 872 source/config files excluding dependency/build output
- 619 TypeScript/JavaScript files
- 26 SQL files
- 190 OpenAPI paths and 74 schemas in `docs/contracts/openapi.json`
- 23 backend controllers and 19 backend DTO files
- 26 Prisma migration files and 5 D1 migration files

## Graphify evidence

Graphify MCP was callable and returned:

- 9,747 nodes
- 21,228 edges
- 0 reported communities
- 96% extracted, 4% inferred, 0% ambiguous

The graph exposes the major hubs required for Phase 2:

- `D1FinancialCommandGateway`
- `AuthenticatedRequest`
- `AdminController` / `AdminService`
- `AdminDataProvider` / `NexiAdminApiProvider`
- `PrismaService` and D1 services
- market provider router, source registry, catalog, Kline service/controller
- financial operations and ledger authority
- EventOutbox, queue ingress, workflow commands, Valkey/Socket surfaces

The graph snapshot is useful for navigation but is not yet a final freshness/reconciliation proof. Its timestamp predates the latest working-tree changes, and the MCP affected-slice query does not consistently expose the newest Public Kline consumer edges.

## Domain topology findings

### Identity/API

Graphify finds SIWE, JWT guard, Admin RBAC, DTO, controller, service, user-code resolution, and D1 authority nodes. Source inventory shows the expected auth/session routes, Admin auth separation, KYC, profile, and referral/VIP surfaces.

Still requiring proof:

- complete Public/Admin/OpenAPI route parity;
- nonce consumption and replay prevention;
- refresh rotation and revocation;
- stable wallet-to-account uniqueness;
- complete permission enforcement and userCode resolution across all commands.

Classification: `PARTIAL_PATH` / `CONTRACT_MISMATCH_POSSIBLE`.

### Market/Kline/realtime

Graphify finds catalog, provider policy, provider adapters, normalization, D1 persistence, Kline REST, Redis/Valkey, Socket.IO, and frontend chart nodes. The source-level Kline producer/consumer path added in the current working tree is covered by focused tests.

Still requiring proof:

- runtime capability and truth state for all 53 assets;
- all seven intervals in deployed execution;
- depth versus executed-trade semantics;
- reconnect/resubscribe and REST recovery;
- fresh graph evidence for the latest Public consumer path.

Classification: `PROVEN_SOURCE_SLICE`; deployed behavior remains `RUNTIME_REQUIRED`.

### Financial authority

Graphify finds Public/Admin financial operations leading to `D1FinancialCommandGateway`, ledger posting, audit, idempotency/locking, settlement, deposit, withdrawal, transfer, conversion, spot, margin, binary, mining, and loan command methods.

High-value paths identified include withdrawal reservation/settlement, deposit credit/rejection, paired transfer, conversion, spot reservation/matching, binary settlement, mining, and loan repayment.

Still requiring proof:

- D1-only authority in every reachable financial path;
- concurrent withdrawal/transfer double-spend prevention;
- duplicate settlement/double-payout prevention;
- partial failure and consumer retry behavior;
- restart persistence and reconciliation.

Classification: `PARTIAL_PATH` / `AUTHORITY_GAP_REQUIRES_RECONCILIATION`.

### Public/Admin causality

The Admin plane is separate and has both live and local mock providers. The live provider explicitly avoids silent mock fallback, but mock fixtures remain broadly present for development/demo mode.

Still requiring proof:

- every required Public destination uses the canonical client;
- every Admin action reaches canonical backend commands;
- opposite-surface read-back after Public and Admin mutations;
- no fixture/mock provider is active in live mode.

Classification: `PARTIAL_PATH` / `SHADOW_AUTHORITY_POSSIBLE`.

### Async/recovery/platform

Source topology includes EventOutbox, queue ingress, workflow commands, Valkey/Redis adapter paths, and Cloudflare bindings.

Still requiring proof:

- atomic relationship between business write, ledger/audit, and EventOutbox;
- actual queue consumers and message contracts;
- retry/redelivery/deduplication behavior;
- workflow resume semantics;
- Valkey outage and Socket.IO recovery;
- REST convergence after missed realtime events.

Classification: `ASYNC_GAP` / `RECOVERY_GAP` until verified.

## Concrete risk signals found

1. Prisma remains widely reachable in backend source: 158 Prisma-service/import references were observed, while D1 service/gateway references were also present. This is not automatically a defect, but it is a required authority audit because the stated rule is D1 canonical for deployed financial authority.
2. A frontend communications contract test references the unavailable path `../../../work/20260806-api-foundation/openapi.yaml`. This is an actionable unresolved/legacy reference.
3. Admin mock fixtures and `LocalMockAdminProvider` remain present. They are acceptable only behind explicit development/demo boundaries; live-mode reachability must be proven.
4. Graphify reports duplicate-named hubs such as `AdminDataProvider`, `NexiAdminApiProvider`, and `LocalMockAdminProvider`, requiring source-level duplicate/shadow review rather than automatic deletion.
5. Fallow was not callable from the current Work repository path during this pass. Earlier VM evidence remains historical and must not be represented as fresh current-run Fallow verification.

## Current classification ledger

| Area | Classification | Meaning |
|---|---|---|
| Graphify transport | `VERIFIED` | MCP stats, god-nodes, and bounded queries returned successfully |
| Repository coverage | `PARTIAL_SOURCE_MAP` | Broad scan complete; final folder/domain acceptance ledger still needed |
| Kline source path | `PROVEN_SOURCE_SLICE` | Focused source/tests passed; deployed runtime not proven here |
| API/OpenAPI parity | `UNKNOWN/PARTIAL_PATH` | Inventory exists; complete parity is not established |
| Identity/security | `PARTIAL_PATH` | Relevant nodes/files exist; replay/rotation/uniqueness proof remains |
| Financial authority | `PARTIAL_PATH` | Strong D1/ledger topology; full domain and concurrency proof remains |
| Public/Admin sync | `PARTIAL_PATH` | Live provider exists; opposite-surface causality remains |
| Async/recovery | `ASYNC_GAP/RECOVERY_GAP` | Source nodes exist; deterministic proof remains |
| Fallow current run | `CAPABILITY_GAP` | Executable unavailable in this Work path |
| Sentry current run | `NOT_VERIFIED` | No callable Sentry MCP/current runtime sweep in this pass |

## Gate result

`CODE_TO_CODE_CLOSED = BLOCKED`

The repository has a usable structural map and a prioritized defect universe, but it is not yet valid to claim that all API, identity, financial, Public/Admin, async, recovery, or runtime paths are closed.

## Next repair order

1. Resolve and verify the Prisma/D1 authority boundary, beginning with withdrawal/deposit commands.
2. Reconcile OpenAPI against backend controllers and Public/Admin clients.
3. Prove Public/Admin opposite-surface read-back for financial and market controls.
4. Prove EventOutbox, queue/workflow, Valkey, and realtime recovery semantics.
5. Refresh the affected Graphify slice after each structural repair, then perform final whole-repository reconciliation.
6. Re-run Fallow when its callable Work/VM path is restored; use Sentry only for deployed runtime evidence afterward.
