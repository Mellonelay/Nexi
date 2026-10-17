# NEXI Cloudflare Exit — Owner-Directed Migration Plan

## Authority and scope
Current owner directive governs conflicting repository/VM/skill instructions. This plan and todo.md are living migration controllers. Older checkpoints below are preserved historical evidence; the newest dated checkpoint at the end governs live state. The old production ledger and ChatGPT Project uploads are historical only. Preserve NestJS/Public/Admin and every existing domain behavior. Target one existing VPS, SQLite durable application/financial truth after controlled cutover, Ledger accounting, EventOutbox durable publication. PostgreSQL/Timescale/managed-service research is superseded exploration. No framework rewrite.

## Historical recovered baseline (2026-10-16 UTC; superseded by the current checkpoint below; exact observations in evidence/g0-recovery.json)
Migration worktree: /home/mellonelay1999/workspaces/Nexi-sqlite-migration; branch migration/sqlite-local-bridge; HEAD and cached origin/main 9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f. Existing nine migration files preserved, uncommitted. Remote main still requires exact live SHA check. Original checkout main@d24862f preserved with its two untracked Admin pnpm files. No prior tasks directory/files found in either checkout. Public/Admin active. Snapshot SQL gzip 863748144 bytes; restored SQLite 7164264448 bytes; both isolated historical data, not current production. Disk 8.7G available, RAM 5120MiB available, swap 2036MiB used. Previously reported 7/7 SQLite + 53/53 financial + backend build remain historical pending exact native evidence recovery; no automatic repeat. Previous 90/92 count comparison is not content equality.

## Replacements and closure proof
| Dependency | Target owner | Required closure proof |
|---|---|---|
| D1/private HTTP bridge | Prisma better-sqlite3 + local financial gateway | All schema/data/financial reconciliation; ordered atomic rollback; exact decimals/idempotency; PRAGMAs on every connection |
| Worker/Container/DO routing | Existing Nginx + NestJS systemd | Auth/cookies/CORS/SIWE/WSS parity, fail-closed upstreams, resource/restart proof |
| Three queues + DLQ policy | Aiven Valkey + BullMQ, durable Outbox/Inbox | Retry, replay, duplicate delivery, lost-queue recovery, durable failure inspection |
| Withdrawal/mining/loan Workflows | SQLite checkpoints + BullMQ steps | Approval/provider waits/due dates/retries; in-flight manifest; restart and exactly-once financial effects |
| R2 proof/KYC objects | Private local filesystem adapter | Key/MIME/auth parity; count/content hashes; copy/recovery; outside webroot |
| KV/config | SQLite SystemConfig, Valkey ephemeral only | Each actual consumer mapped and parity verified |
| Secrets/rate limit/cron/analytics | Root-owned env, existing Nest/Nginx, bounded jobs/logs | Actual deployed binding inventory and consumers closed |
| Aiven Valkey | Aiven Valkey is final for BullMQ, Socket.IO and ephemeral cache/realtime; loopback Valkey is temporary test-only | TLS/auth, DB/prefix isolation, reconnect and queue recovery; never financial truth |
| Public DNS | Name.com authoritative; owner has switched NS and prepared `www`, `api`, `admin` A records to VPS | Live delegation/A/TLS and service checks; DNSSEC remains disabled per owner report; no NS action pending |
| Backups/operations | SQLite consistent backup + encrypted independent copy | Restore tested; retention/resource budget and runbooks |

## Ordered critical path
G0 recover handles, instructions, source/dirty state, artifacts, prior proof; establish tasks controller.
G1 schema plus all-table canonical key/content reconciliation; migration history, exact money/Ledger, outbox/inbox, auth/domain/config state; explicit source snapshot boundary and market coverage, separately internal SQLite tables. Reuse export, no giant duplicate.
G2 validate local adapter/financial gateway/Prisma, each connection WAL/FULL/FK/busy timeout, SQLITE_BUSY/concurrency, rollback, fault injection/idempotency/restart and real-dataset reads. No production connection.
G3 Aiven Valkey/BullMQ and durable SQLite workflow coordinator; inventory and preserve active source queue/workflow state.
G4 verify R2 copies/manifest and all remaining bindings/consumers.
G5 isolated non-authoritative full backend/Public/Admin/market/auth/browser parity; bounded resource/load/recovery checks; encrypted independent backup/restore. Focused verification before coordinated final build.
G6 exact financial freeze/drain/snapshot/delta/reconciliation and rollback-forward protocol; PENDING_OWNER_ACTION before changing live financial writers or endpoints.
G7 Verify Name.com DNS/TLS (owner change already complete); retire Cloudflare per resource only after dependency closure, independent backup and rollback window, plus explicit owner approval. Billing review separate.

## Parallelism and capacity
One parent; RDC executes; one writer. Independent source/structural, platform and data evidence may run concurrently. Serialize database/schema/Ledger/Outbox/shared contracts, lockfiles, graph writes, Git fan-in, build/deploy and final acceptance. Default one heavy CPU/I/O process on this 2-vCPU/8GB VPS. Preserve existing handles and canonical Public/Admin deployments. Do not create duplicate dependencies/exports/restores. Measure disk/WAL/queue lag/latency/headroom before any justified spending recommendation. No destructive market retention without owner signoff.

## Acceptance and owner gates
Exact financial/accounting data and all existing domain behaviors preserved; no split-brain writers. Local runtime success is distinct from source tests, deployed state and owner acceptance. R2 evidence remains private. Final target has no Cloudflare production dependencies and no intended recurring managed-service dependency. Independent encrypted backup and tested restore required; destination is currently UNKNOWN.

Cutover protocol: prepare exact commands/versions/TTL/routes, stop old authoritative writers, drain/preserve queue/workflow instances, final consistent D1 export/delta, validate schema/hash/Ledger, enable exactly one new writer, verify domain smoke, monitor. After new SQLite writes, DNS rollback alone is unsafe: reconcile forward or reverse data first. Production endpoints, financial cutover, nameservers, Cloudflare resource deletion and destructive retention each require specific owner approval. Prepare and verify all reversible predecessors first.

## Recovery-time unknowns (historical; current frontier below)
Source: current owner directive; live AGENTS and Worker-0 execution contract with conflicts explicitly superseded; exact source/tests/runtime and tasks/evidence receipts. Historical chat/export is continuity only. Open: row content equality; final-delta semantics; per-connection Prisma PRAGMAs; SQLITE_BUSY behavior; current deployed inventory/in-flight state; R2 bytes; independent backup destination; capacity under full stack. No unresolved binding may be silently removed.

## Current verified frontier — 2026-10-16T11:17:43.370864+00:00
Source/branch unchanged at9a41b2e; original checkout and dirty migration work preserved. G1 restore fidelity is proven92/92 with gzipCRC, typed key/content fingerprints and unchanged input stats; see evidence/export-restored-content-reconciliation.json. Live90 smaller-table comparison:84 exact;five config tables timestamp-only drift;MarketQuoteLatest value/provider/state growth. Financial full content and exact Ledger totals/posting-account invariants match. Final source-market prefix/frozen cutover equality remains unproven.

G2 Prisma WAL/FULL/FK/busy-timeout initialization repaired,10 focused tests pass; production-source no-emit typecheck passes. Historical53 financial tests remain PROVEN_UNCHANGED. G3 journal5 tests + real Nest12/BullMQ6/Valkey4 tests pass; existing financial bridge reused; components not activated. Isolated Unix-only Valkey8.0.1 AOF/noeviction crash recovery passed. Aiven9.1.2 TLS/noeviction is transitional only. G4 R2 three objects6073bytes copied privately with preserved metadata and secondGET SHA256 parity; independent backup/authenticated adapter acceptance still open.

Current methods: Kernel sole parent, Agent Skills incremental/TDD/source-driven/deprecation/review; Ponytail full. A sole source writer via RDC; B read-only ownership/contracts; C read-only data/runtime/continuity. Native receipts in tasks/evidence and Work-side guard /tmp/nexi-work-20261016 (controller aid, not independent proof). Next: close focused review, wire durable queue/workflow execution through existing domain commands, then service adapters and isolated full runtime. No production deployment, financial cutover, DNS/nameserver or source retirement authorized by these proof receipts.

### Current verified frontier — 2026-10-16T15:09Z

G3 local NestJS runtime integration now has a real end-to-end proof. The first isolated Nest TestingModule run failed reproducibly because `LocalAsyncRuntimeService` declared `D1WorkerBridgeService` using a type-only import, erasing the runtime DI token. The regression receipt is `tasks/evidence/workflow-commands-real-runtime-red.log`. The one-line root fix imports the bridge class as a runtime value; no constructor/API shape or business behavior changed.

`backend/test/jobs/workflow-commands.integration.ts` passes 5/5 against temporary SQLite databases created from the existing D1 schema migrations plus VPS-only job/workflow tables, real `LocalAsyncModule`, real Prisma local SQLite adapter, real financial/mining/loan services and gateway, canonical EventInbox/EventOutbox, and the isolated Unix-socket Valkey service. The only stub is Redis Pub/Sub, which these financial cases do not depend on. It proves withdrawal settlement idempotency, one mining Ledger reward plus Outbox publication, overdue-loan state plus Outbox, and an actual `LOAN_APPROVED` job whose journal acknowledgment is forced to fail after dispatch; after module close/restart the event remains one Inbox receipt, the workflow completes, and loan/outbox effects occur once. Final receipt: `tasks/evidence/workflow-commands-real-runtime-final.log`.

Affected backend source typecheck passes: `tasks/evidence/workflow-runtime-typecheck-20261016.log`, exit 0. Graphify was refreshed without clustering (7,862 nodes / 19,027 edges) and its refreshed path shows `LocalAsyncRuntimeService -> local-async-runtime.service.ts -> D1WorkerBridgeService`; see `tasks/evidence/graphify-runtime-import-update-20261016.log`. Scoped Fallow review completed on the one changed source file; its brief shows an 8-file structural impact cone and existing high-risk fan-in/complexity around the runtime, gateway and workflow coordinator. No dependencies, schema, production configuration, Cloudflare resource, deployment, DNS, or financial authority changed in this slice.

Next frontier is source/platform parity: verify actual deployed Queue handlers, all queue/event types, DLQ policy, and in-flight Cloudflare Workflow instances against the local consumer/coordinator before expanding dispatch. Current local consumer special-cases `LOAN_APPROVED`; other accepted events currently record canonical Inbox ingress only. Do not infer parity or add speculative handlers before checking the live Worker source. Historical D1 export reconciliation remains complete and must not be restarted.


### Verified frontier — 2026-10-16T15:35Z

The G3 real Nest runtime integration and Cloudflare queue-class parity slice is now proven in the isolated worktree. One focused test run passed 6/6: actual Nest DI + local SQLite bridge; one-time withdrawal settlement; mining accrual with canonical EventOutbox; overdue loan with canonical EventOutbox; cold-Nest-restart recovery after durable journal acknowledgment failure for LOAN_APPROVED; and generic envelopes through all three deployed queue classes, each completed with one EventInbox receipt and no workflow side effect. Test receipt: tasks/evidence/deployed-queue-class-parity-20261016.log. Existing proofs remain unchanged and were not rerun.

Read-only Cloudflare API evidence confirms deployed Worker nexi-production release 7fbde5ca82287902cb351546ccae1b632f1aae44, queue bindings DOMAIN_EVENTS_QUEUE / INTEGRATION_JOBS_QUEUE / NOTIFICATIONS_QUEUE, one consumer each, max_retries=5, retry_delay=15 seconds, batch size 10, and DLQs; all three backlogs were 0 at the observation. The Worker sends valid envelopes through signed Container ingress and dispatches LOAN_APPROVED to its loan Workflow before acknowledging. Actual workflow inventory: no active/waiting instances; loan has two completed and two historical errored proof IDs, while mining and withdrawal have no instances. Machine-readable evidence: tasks/evidence/cloudflare-queue-workflow-runtime-inventory-20261016.json. This is runtime inventory, not data parity or cutover proof.

First unresolved G3 frontier: safe terminal FAILED-job inspection and replay/recovery contract. The SQLite journal retains terminal rows and bounded error codes; the existing unit proof verifies this, but pending() excludes FAILED rows and no safe replay generation/interface has been verified. Do not reset attempt counters blindly: BullMQ job IDs include row id + attempts and retained completed/failed BullMQ jobs may collide after a naive reset. Design and test recovery generation/lineage before exposing replay. Keep durable SQLite journal as authority and BullMQ/Valkey as wakeup only. No Cloudflare or production mutation occurred.


### Current verified frontier — 2026-10-16

The G3 terminal-job replay increment is complete in the isolated migration worktree. LocalDurableJob now has durable replay lineage: terminal failures are inspectable with bounded error codes, explicit replay is fenced by expected generation, lifetime attempts/history are retained, and each replay maps to a distinct retained BullMQ job ID. SQLite remains delivery authority; BullMQ/Valkey remain wake-up transport. Replay metadata uses the existing SQLite bridge transaction, with no new database, service, or dependency. Producer connections fail fast while workers wait through reconnect. Full official BullMQ v6/NestJS/ioredis docs were read and checked against the installed setup.

Receipt: tasks/evidence/bullmq-failed-job-replay-contract-20261016.md. Focused runtime/transport 8/8, journal store 6/6, source typecheck exit 0, and diff check exit 0. Tests are isolated runtime evidence, not deployment or cutover acceptance.

The Fallow output was not slice-scoped (96 branch files plus generated coverage artifacts) and its dependency index reported node_modules absent. It is retained only as a structural signal. Direct review of the changed replay paths found generation fencing, atomic history/state update, bounded producer behavior, safe payload logging, and graceful resource closure. Full changed-branch review remains open.

Owner correction supersedes the proposed Admin replay interface; it is deferred as unnecessary for migration completion. Continue VPS application startup, mandatory Cloudflare dependency closure, final data delta, independent encrypted backup/restore, and application acceptance. Cloudflare D1 remains production authority. No deployment, DNS change, financial cutover, or Cloudflare retirement occurred.


### Admin replay endpoint — DEFERRED_SCOPE per owner correction 2026-10-16

Earlier source mapping is retained as historical context in tasks/evidence/admin-async-replay-auth-review-20261016.md. Owner has directed that this optional interface is not needed for Cloudflare migration. Do not add the endpoint, permissions, governance controls, schemas, or dedicated test system. Continue to reuse the proven journal replay implementation without expanding its scope.


### Current execution frontier after owner correction — 2026-10-16

Admin async-job inspection/replay is explicitly deferred and is not on the migration critical path. Existing journal/BullMQ replay proofs remain complete and unchanged.

Live recovery found branch migration/sqlite-local-bridge at 9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f with migration changes preserved. Public/Admin staging frontends and Nginx are running. No NEXI API service appears in the running systemd service list; this is the first VPS integration gap to resolve. Repo AGENTS.md and backend/AGENTS.md still encode Cloudflare as backend runtime authority; this conflicts with the newer owner-directed migration objective and is superseded for this task. No Cloudflare or production state changed during recovery.


### VPS runtime candidate — 2026-10-16

Reversible VPS integration work advanced from source build to a staged backend candidate. See `tasks/evidence/vps-runtime-candidate-20261016.md` for the full proof and exact boundary. Cloudflare Container digest and the VM candidate are separate artifacts; no VM backend image existed at recovery. Candidate release `20261016T1658Z-9a41b2e3-dirty` is built from the dirty migration branch and is linked as `/srv/nexi/backend/current`; it is not active traffic.

Local Valkey is active on loopback with AOF, `noeviction`, private Unix socket and PONG checks. A blank 96-table staging SQLite file was created from the 15 existing D1 schema migrations plus the VPS-only job/workflow schemas; integrity and foreign-key checks pass. The API unit and environment file are installed; service is disabled/inactive. Nginx API TLS vhost is staged but disabled because the certificate is absent. Public/Admin and Cloudflare production remain unchanged.

Current startup blocker: no authorized `JWT_SECRET` is available in the VPS environment. No generated or Cloudflare-extracted secret was used. Next is secure owner provisioning of the required signing secret and any provider inputs, followed by loopback API startup/readiness checks and certificate-backed Nginx validation. No data cutover, DNS, or Cloudflare retirement occurred.


### Runtime package correction — 2026-10-16

The first staging candidate's Prisma smoke found and fixed a deployment-only runtime packaging defect: `@prisma/client` was development-only, omitting required `@prisma/client-runtime-utils` from production installs. A regression test was red before and green after moving the exact 7.3.0 client to production dependencies. The new production-only release also includes the generated D1 client per the existing Dockerfile copy rule. See the superseding section in `tasks/evidence/vps-runtime-candidate-20261016.md`.

Current symlink now targets `/srv/nexi/backend/releases/20261016T1735Z-9a41b2e3-prisma-runtimefix`; old candidate is preserved. Actual D1PrismaService now connects to the empty staging DB with expected WAL/FULL/FK/busy-timeout PRAGMAs, and one disposable BullMQ job passes over the local Valkey socket. These checks prove database/queue integration only; the API service remains disabled/inactive pending authorized JWT and provider configuration, and Nginx API remains disabled pending TLS. Live KV/Analytics handlers are still present without NestJS callers; external Container clients must be ruled out before retiring them.


## Checkpoint — 2026-10-16 readiness runtime
The latest isolated VPS release is `/srv/nexi/backend/releases/20261016T1810Z-9a41b2e3-readinessfix` and `/srv/nexi/backend/current` selects it. Its actual Prisma/readiness smoke on the empty staging SQLite DB returns READY with SQLite authority. The API systemd unit remains inactive pending an authorized JWT secret and confirmed provider settings; API TLS/Nginx activation remains pending a certificate. Existing Public/Admin, Cloudflare production, DNS, and financial authority are unchanged. Detailed receipt: `tasks/evidence/vps-runtime-candidate-20261016.md`.


### Owner architecture correction — 2026-10-16
Aiven Valkey is the final Redis-compatible service for BullMQ, Socket.IO, cache and realtime. Local Valkey remains test-only and can be retired after no tests require it. This supersedes earlier target-table wording and historical notes that called Aiven transitional; preserve completed local-Valkey test evidence. Backend remains NestJS on the existing VPS; no paid NestJS Observe product.

### Current verified frontier — NestJS Observe removal — 2026-10-16T18:45Z

The paid `@nestjs/observe` integration is removed from backend source, package manifest, npm lock, pnpm lock, active compiled output and active `/srv/nexi/backend/node_modules`. A rollback copy of the former manifest/lock/compiled files and Observe module is kept under `/srv/nexi/backend/rollback/observe-removal-20261017`; the prior release and its package files remain intact. The new branch build passed; the controlled loopback VPS service was cold-restarted without Observe installed. Health/readiness, SQLite and Aiven Redis dependencies, market endpoint and Socket.IO polling/WebSocket handshake passed. API remains bound to 127.0.0.1:3002; systemd remains disabled for boot; Nginx/DNS/Cloudflare production were not changed. Sentry remains configured and imported. See `tasks/evidence/vps-observe-removal-20261016.md`.

Current CLI/doc facts: Nest CLI 12.0.8 in the migration worktree; VPS runtime Nest core/websockets/platform-socket.io 12.0.3. Migration-worktree Prisma CLI/client resolve to 7.10.0 while its manifest pins client and better-sqlite adapter 7.3.0; VPS canonical Prisma CLI/client/adapter are 7.3.0. Worktree npm lock resolves Nest 12.0.3 while pnpm lock resolves 12.1.3. Treat the worktree install/lock divergence as an unresolved reproducibility item before the final canonical build; do not silently upgrade Prisma or Nest. Current official docs show Prisma 8 is now the default documentation branch while the requested v7 docs remain available; this migration stays on Prisma 7 pending explicit compatibility evidence. Nest GraphQL is absent from NEXI dependencies.

### Live VPS checkpoint — 2026-10-16T20:01Z

The previous checkpoint statements that the API was inactive and awaiting a JWT secret are superseded by live Worker-0 evidence: systemd  is active (PID 1671903) and loopback health/readiness, market prices, Swagger/OpenAPI and Socket.IO polling handshake checks passed. The service is still disabled at boot and remains non-authoritative; no authenticated financial command or public API vhost was tested. SQLite/Redis readiness is green. The active API PID owns 16 established connections to the Aiven Valkey endpoint and a credential-safe TLS PING returned PONG. Aiven remains the final Redis-compatible service; local Valkey is test-only and retained while tests may depend on it. The active module versions match the canonical  package lock (Nest 12.0.3, Prisma client/adapter 7.3.0, better-sqlite3 12.11.1, BullMQ 6.3.15, ioredis 5.10.1, Socket.IO 4.8.3, Streams adapter 0.3.0). Tracked npm locks match manifest ranges; the extra pnpm resolution differs only within the declared Nest semver range and no runtime version mismatch is established. No install or rebuild was warranted. Evidence: . Cloudflare production, DNS and financial authority remain unchanged; 6.3 GB disk headroom means avoid duplicate large artifacts.


### Live VPS checkpoint — 2026-10-16T20:01Z

The previous checkpoint statements that the API was inactive and awaiting a JWT secret are superseded by live Worker-0 evidence: systemd `nexi-api.service` is active (PID 1671903) and loopback health/readiness, market prices, Swagger/OpenAPI and Socket.IO polling handshake checks passed. The service is still disabled at boot and remains non-authoritative; no authenticated financial command or public API vhost was tested. SQLite/Redis readiness is green. The active API PID owns 16 established connections to the Aiven Valkey endpoint and a credential-safe TLS PING returned PONG. Aiven remains the final Redis-compatible service; local Valkey is test-only and retained while tests may depend on it. The active module versions match the canonical `/srv/nexi/backend` package lock (Nest 12.0.3, Prisma client/adapter 7.3.0, better-sqlite3 12.11.1, BullMQ 6.3.15, ioredis 5.10.1, Socket.IO 4.8.3, Streams adapter 0.3.0). Tracked npm locks match manifest ranges; the extra pnpm resolution differs only within the declared Nest semver range and no runtime version mismatch is established. No install or rebuild was warranted. Evidence: `tasks/evidence/runtime-checkpoint-20261016.md`. Cloudflare production, DNS and financial authority remain unchanged; 6.3 GB disk headroom means avoid duplicate large artifacts.


### VPS boot supervision and Nginx candidate — 2026-10-16T20:03Z

Enabled the existing `nexi-api.service` for boot; the already-running PID stayed the same and loopback health remained HTTP 200. The service remains bound to 127.0.0.1 and is non-authoritative. Removed the duplicate WebSocket `map` declaration from the inactive API vhost draft. Active Nginx syntax passes; the API vhost is still not enabled because the referenced Let's Encrypt certificate/key are unavailable. No Nginx reload, public route, DNS, Cloudflare, or financial authority changed. Evidence appended to `tasks/evidence/runtime-checkpoint-20261016.md`.


### Queue transport and market backpressure — 2026-10-16T20:06Z

Read-only source/runtime tracing confirms the active API local-async path selects `NEXI_VALKEY_URL` (Aiven TLS) ahead of the local socket fallback, and has local SQLite + async execution enabled. The source registers three BullMQ queues/workers; read-only counts against the isolated active prefix succeeded on Aiven for all three, all zero. The API's repeated queue-saturation warning is emitted by the explicit bounded market-ingest behavior: at 256 queued events it drops a trade/depth reference event first while prioritizing ticker/kline work. This is not evidence of financial or durable quote loss by itself; representative-load acceptance must still prove quote/kline freshness and required market realtime behavior. Do not modify it without a confirmed defect. See `tasks/evidence/runtime-checkpoint-20261016.md`.


### Live Cloudflare image and bindings — 2026-10-16T20:17Z

- [x] VERIFIED — Read-only Cloudflare API/Wrangler evidence identifies active Worker deployment version `de16e62e-6bf7-4099-b2c9-6eed4f3dc46d` (version 194; deployment `628ccf82-1a2b-4c88-8fa2-67367b565111`) and its `fetch`, `queue`, and `scheduled` handlers. Active Container application `nexi-api-staging` has one running instance; application config and running instance both pin image `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`. This proves configured/running digest identity, not the image's internal runtime contents or source provenance.
- [x] VERIFIED — Live binding inventory still includes D1, two R2 buckets, three Queues, three Workflows, KV, Durable Object/Container, auth rate limiter, Analytics Engine, Secrets Store, and secret bindings. These remain production dependencies until each actual consumer has a tested VPS replacement and cutover is approved.
- [ ] BLOCKED_WITH_EVIDENCE — VM `cf` v1.0.0-beta.12 is callable; `timeout 18s cf containers ssh <instance> -- node --version` reached Dropbear but emitted SSH negotiation bytes and exited 124 without a command result. Earlier Wrangler SSH had the same limitation. Therefore the Container's Node version, installed package tree, native library set, and live entrypoint remain unverified. Source manifest at deployed release commit uses the D1 adapter and lacks BullMQ/SQLite runtime dependencies, but image provenance from that commit is not proven.
- Cloudflare production, D1 authority, public DNS, Container configuration, and Worker resources were not changed.


### Cloudflare endpoint and image CLI follow-up — 2026-10-16T20:22Z

- [x] VERIFIED — Read-only HTTPS GET to `https://api.nexitrading.app/healthz` returned 200 from a Cloudflare edge IP; current public API health is reachable. This does not prove VPS parity or a production cutover.
- [x] VERIFIED — VM `cf containers images list` returned the `nexi-api-staging` registry tags, including tag `de16e62e`, matching the active Worker version ID. The CLI exposes image list/delete/prepare, but no image-inspect command. Local Docker is present; no local `nexi-api-staging` or Cloudflare registry image was found. No pull/build/delete occurred.
- [ ] BLOCKED_WITH_EVIDENCE — Both Cloudflare SSH clients reach Dropbear protocol negotiation but fail to return remote command output. Continue parity work from immutable digest, deployed source and build metadata where provable; do not claim in-image Node/native-package/entrypoint proof.


### Live Container runtime comparison — 2026-10-16T20:24Z

- [x] VERIFIED — Authorized SSH now works through a PTY and a temporary agent loaded with the Worker-0 private key whose derived SHA-256 fingerprint matches screenshot key `nexi-cloudflare-staging-20260909`. Agent stopped after inspection; private contents were not read or emitted.
- [x] VERIFIED — App config and running Container instance use digest `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`. In-container Node v24.21.0 (ABI 137); PID 1 command `node dist/src/main.js`, cwd `/app`, executable `/usr/local/bin/node`; `/app/dist/src` exists. Command and entrypoint use image defaults.
- [x] VERIFIED — In-image `package.json` and `package-lock.json` SHA-256 exactly match deployed release commit `7fbde5ca82287902cb351546ccae1b632f1aae44` (manifest `3c03a8ecc71ddf1fde44648992f05e643945eb7f6b304509fcdfb750fcb81151`, lock `f980ac2d042bb462e1bfb283a5275ae23944ef573834ef1288e8d3abac4f6c96`). Installed: Nest core/platform/websockets 12.0.3, Observe 0.1.10, D1 adapter 7.3.0, ioredis 5.10.1, Socket.IO 4.8.3, Streams adapter 0.3.0.
- [x] VERIFIED — Cloudflare image uses D1 and omits Prisma client, SQLite adapter, better-sqlite3, BullMQ and `@nestjs/bullmq`. Native prebuilds include bcrypt/build tooling; no better-sqlite3 addon found. VPS instead runs Node v22.23.2 with SQLite/Prisma, better-sqlite3 12.11.1, BullMQ 6.3.15 and Observe removed. Shared Nest/ioredis/Socket.IO versions do not make these runtime images interchangeable.
- [x] CLOSED — Container runtime inspection is complete. Compiled dist source provenance was not independently hashed. No Cloudflare deployment/config, DNS, financial authority or running service changed.

## Latest execution checkpoint — 2026-10-16 20:52 UTC

This checkpoint supersedes earlier lock/install and Node-runtime uncertainty above. The active non-authoritative nexi-api.service runs Node 24.21.0 from /srv/nexi/backend/dist/src/main.js, is enabled for boot, and reports SQLite + Aiven Redis readiness. Public/Admin and production Cloudflare/DNS remain unchanged. In the migration worktree, npm 10.9.8 was selected from the tracked npm lock; its 926-package npm ci aligned dependencies under Node24 while preserving the untracked pnpm lock. Exact installed versions and native SQLite load are recorded in tasks/evidence/runtime-checkpoint-20261016.md. Focused SQLite tests passed 16/16, async/workflow tests passed 14/14 against isolated local Valkey, and Nest build exited 0. Sentry staging SDK flush plus Sentry search confirmed one tagged, non-PII event. Lane B found only conditional Cloudflare fallback paths under active local selection flags; do not rewrite them without a demonstrated need. Remaining blockers are trusted public API TLS/DNS sequencing, authenticated REST/financial acceptance credentials, current live D1 delta and controlled cutover, independent encrypted off-VPS backup/restore destination, and exact in-image parity (Cloudflare SSH has not provided shell output). Historical D1 reconciliation remains closed. No production cutover, public DNS, Cloudflare resource, or financial writer was changed.


## Current canonical-main integration checkpoint — 2026-10-16 21:29 UTC

The recovered repository is `/home/mellonelay1999/workspaces/Nexi`, branch `main`, based on `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`. Migration source and documentation are committed locally on canonical `main`; GitHub synchronization is pending. The isolated migration worktree remains preserved. The migration worktree and original untracked Admin pnpm workspace files are preserved. The canonical backend uses npm; the migration branch's additional pnpm lock and self-hosted Valkey drafts were not imported.

Canonical-backend dependency install from its checked-in `package-lock.json` completed under Node v24.21.0/npm 11.19.0 (923 packages). `npm run build` passed. Native `better-sqlite3` loaded SQLite 3.53.2; Prisma SQLite adapter resolved 7.3.0. Built `dist/src/main.js` SHA-256 matches active `/srv/nexi/backend/dist/src/main.js`; the existing `nexi-api.service` remains active and enabled, so no restart/deploy was needed. Exact build/dependency/native/runtime evidence: `tasks/evidence/canonical-main-integration-20261016.md`.

Documentation now has a canonical VPS runtime map at `docs/architecture/NEXI_VPS_BACKEND_RUNTIME.md`; core architecture, routing, backend, current-state and repository instructions are being reconciled to the owner-approved target. The production Cloudflare operator docs/resources remain only as live-production/cutover references and are not VPS implementation authority. No Cloudflare, DNS, financial-writer or production configuration changed.

Graphify hosted index is known to predate the current source; it was only used for navigation. Local Graphify refresh completed on integrated source: 7,962 nodes / 19,141 edges; bounded path output is recorded in the evidence note. The promoted graph is older. Scoped Fallow 3.30.0 analysis covered 24 changed backend production TS files: no unresolved imports, cycles or boundary violations; unused-member candidates were source checked and retained where tests/use warrant. Policy analysis did not run because no rule packs are installed.

### Remaining critical path

1. Finish focused documentation/source consistency and relative-link checks; resolve only verified issues.
2. Canonical npm install/build/native/dependency checks are complete and recorded; do not rerun unchanged SQLite/financial/workflow proof suites.
3. [x] Committed canonical source/docs and pushed to GitHub; the GitHub `index.popsql` update was fast-forwarded and the reconciliation checkpoint was pushed. Original untracked Admin pnpm workspace files remain untouched.
4. Remaining pre-cutover evidence: authorized authenticated acceptance identity, market and Socket.IO recovery acceptance, independent encrypted off-VPS backup/restore, current live D1 delta and controlled freeze/drain/reconciliation/rollback-forward packet. Public TLS was closed on 2026-10-17.
5. Owner-only: financial writer/traffic cutover and destructive Cloudflare retirement. Name.com nameserver change is complete. Keep production Cloudflare/D1 unchanged pending those gates.

Historical records below preserve the chronology and are superseded where their branch, runtime, Node version, Aiven target or pending task contradicts this checkpoint.

## 2026-10-17 Checkpoint — Public DNS/TLS routed to VPS

- VERIFIED — Name.com is authoritative by owner action; all three hostnames route to VPS IP 34.143.137.221. Screenshot and GCP rule describe confirm enabled ingress ALLOW TCP/80 at priority 1000 for tag singbox-chatgpt-24443; TCP/443 already reached Nginx.
- VERIFIED — Certbot staging and production HTTP-01 succeeded. SAN certificate for www/api/admin is installed; expiry 2027-01-15. Active Nginx certificate references were changed with pre-change backups retained. nginx -t and reload passed.
- VERIFIED — HTTP returns 301 to HTTPS for all three hosts, while the ACME challenge path is still served over HTTP. Strict HTTPS reached Public/Admin final routes (HTTP 200), API /ops/ready (200; SQLite/Redis ready), /market/prices (200), Socket.IO polling, and a real Socket.IO WSS session. All returned TLS verify result 0 and the VPS IP.
- VERIFIED — Certbot timer active; NEXI deploy hook syntax/manual execution passed; certbot renew --dry-run passed.
- VERIFIED — Canonical main remains 927d313b5f873eaf814fb3e1d2a00e8a101dc37b = origin/main. Only preserved untracked Admin pnpm files remain. Runtime local SQLite, async and object flags are enabled.
- OPEN — Authenticated financial acceptance, independent encrypted off-VPS backup/restore, final live D1 delta, single-writer cutover and Cloudflare retirement. Cloudflare resources remain deployed; D1 remains financial authority. No financial writer or Cloudflare resource changed.


## 2026-10-17 live public-routing and authority checkpoint

Current source checkpoint before this update: canonical `main` and `origin/main` were both `bbc849b16291b034b596b80f77790d13112f4cb2`; docs/evidence reconciliation is now committed as `89244628428176cc81239321291799333866caef` on both. Preserve the two untracked Admin pnpm files. Public DNS was changed by the owner to Name.com and routes all three public hostnames to the VPS; prior direct checks verified trusted Let's Encrypt HTTPS and API/Public/Admin/WebSocket reachability. Reuse those results unless a deployment or DNS change invalidates them.

**New decision-driving evidence:** project-local Wrangler 4.127.1 read-only queries confirm Cloudflare D1 still has nonzero User/Wallet/WalletIdentity, LedgerAccount/Posting/Idempotency/Audit, EventOutbox/EventInbox, Loan and Mining records. Active `nexi-api.service` uses `/var/lib/nexi/sqlite/nexi-staging.sqlite`, whose sampled core rows are zero. Runtime configuration enables the local SQLite adapter and the local-backed financial gateway. This is a public endpoint/data-authority mismatch. No write was sent, no database changed, and no historical export reconciliation was repeated. Detailed counts and source/config references: `tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json`.

**Critical path adjustment:** pause production financial acceptance/cutover claims. Before financial actions can safely be accepted, the owner must decide how to protect public financial command paths while the active VPS DB is empty; then complete controlled delta, verification and explicit writer-cutover acceptance. Continue unrelated read-only/docs/backup-preparation work. Off-VPS independent backup is blocked by absence of an approved destination and denied bucket-list permission. Cloudflare retirement remains blocked by active one-minute Worker cron/queue handlers and the other dependency/backup/cutover gates; Wrangler review confirmed both errored loan instances were invalid-`loanId` proof probes with no steps or business effects indicated. No DNS, database writer, queue/workflow or Cloudflare resource mutation is authorized by this checkpoint.


## 2026-10-17 authenticated-write risk clarification

Source review confirms the active public NestJS API can write authenticated financial mutations to the empty local SQLite database. The local adapter is selected in D1PrismaService; D1FinancialCommandGateway also enables because its bridge resolves to LocalSqliteBridgeService. Some JWT-protected /lever routes use direct Prisma mutation paths and bypass that gateway. NEXI_SCHEDULER_ENABLED=false is confirmed but NEXI_LOCAL_ASYNC_ENABLED=true remains active. Therefore changing only D1_RUNTIME_ENABLED is not a complete write freeze. Source refs and representative routes are recorded in tasks/evidence/vps-financial-write-path-risk-20261017.md. No API financial request, config change, process stop, or database mutation was performed.

Owner choice is required for the live write-safety action: coordinated temporary maintenance/write freeze that covers HTTP and local async consumers, or verified return to a working D1-backed API after bridge reachability and parity are proven. Do not switch adapter flags blindly. Preserve existing data and proceed with safe documentation/backup preparation while awaiting this operational decision; then require explicit one-writer cutover acceptance separately.


## 2026-10-17 Wrangler workflow error classification

Project-local Wrangler 4.127.1 read-only list/describe of the two errored `nexi-loan-staging` instances returned `NonRetryableError: Workflow parameter loanId is invalid`, immediate zero-second completion, API trigger, and no steps. Names are explicit proof probes. This closes the prior unknown-error classification; inference: malformed test inputs rather than business loans. No payload was copied, and no workflow action was issued. Evidence: `tasks/evidence/cloudflare-loan-workflow-error-review-20261017.md`. Active Worker cron/queue consumers, D1, backup, write-safety and one-writer cutover gates remain unresolved.

## 2026-10-17 — SQLite artifact/runtime authority recovery

- **Confirmed cause:** the restored historical database was never the file opened by the live service. nexi-api.service opens /var/lib/nexi/sqlite/nexi-staging.sqlite (distinct inode 421320; 322,699,264 bytes at inspection), with its WAL/SHM open. That 96-table file has zero rows in the sampled auth/financial/domain core tables. The 7,164,264,448-byte restored artifact is a separate 92-table file under /home/mellonelay1999/nexi-migration-snapshots/; its source gzip currently matches recorded SHA-256 and its prior typed-key/content reconciliation covers 92/92 tables / 11,802,372 rows. This explains the empty runtime versus populated artifact without implying current D1 equality.
- **Schema/state difference:** runtime-only tables are LocalDurableJob, LocalDurableJobReplayHistory, LocalWorkflowEvent, LocalWorkflowInstance, LocalWorkflowStep; restored-only table is d1_migrations. The five runtime tables currently contain zero rows. Promotion needs compatible schema handling, even though no local journal state needs transfer at this observation.
- **Current D1 evidence:** project-local Wrangler 4.127.1 read-only query against the configured CORE_DB ID reports posting/audit/idempotency timestamps through 2026-10-17 00:00:04, outbox through 00:00:13, and inbox through 00:00:19. Timestamp maxima are diagnostic only, not a consistent cutover watermark; the October 16 export file mtime is not a transaction boundary. Historical snapshot-to-export hashes do not cover current D1 delta.
- **Safety frontier:** do not copy/promote while the API has active DB descriptors and while current D1 delta, integrity/foreign-key proof, financial invariants, independent encrypted backup/restore, and coordinated owner-approved write freeze/cutover are unresolved. The live gateway is pointed at local SQLite. Any protected freeze must include HTTP direct-Prisma writers and local async consumers; flipping only D1_RUNTIME_ENABLED is insufficient.
- **Evidence:** tasks/evidence/wrangler-live-d1-vps-authority-mismatch-20261017.json now records runtime/export identities, schema/count findings, D1 row timestamp maxima and provenance limits. Existing historical fingerprint receipt reused, not rerun. Direct SQLite integrity/foreign-key check is currently running read-only on the restored artifact (RDC PID 1718014); append its result before marking candidate integrity proven.
- **Next:** finish the single candidate integrity check; identify only a previously authorized off-VPS encrypted backup destination (none was configured or mounted at inspection); prepare exact freeze/drain/delta/import/rollback procedure. Ask for owner action only for the production write freeze/writer cutover and approved external backup destination. No DB data, service, DNS or Cloudflare resource has been changed.

- **Git checkpoint:** the updated state/architecture/task/evidence files were committed and pushed to `origin/main` as `d6b6ac2012a683b334eae1750028b80135c63f42`; application source and deployed build were unchanged. The two untracked Admin pnpm files remain preserved.


## 2026-10-17 Follow-up — consistent snapshot and async-schema preflight

- **Verified local rollback snapshot:** created `/home/mellonelay1999/nexi-migration-snapshots/nexi-active-vps-staging-20261017-onestep.sqlite` with SQLite's online backup API. 329,150,464 bytes, mode 0600, SHA-256 `ac5aa8d23094d04bab0392185caabd237b6a953927401cacfb68cd7dc4c849ce`; SQLite CLI 3.40.1 reported `integrity_check=ok`, foreign-key violations 0, 80,359 pages × 4,096 bytes, WAL mode. A separate temporary restore copy passed integrity/FK checks and matched zero User/Wallet/LedgerPosting rows, then that exact temporary copy was removed. The API remained active at PID 1680547; this work issued no source DB writes or service restart, while normal application writes continued. This is local rollback evidence, not independent off-VPS DR.
- **Backup-method finding:** the incremental shell `.backup` kept restarting under live writes. It was stopped; its known incomplete output was removed. The one-step online backup completed in 13.54s without stopping the API.
- **Candidate integrity:** reused the owner-reported historical integrity/FK proof. A redundant full reread was stopped after 17m14s and 3.18GB read without a result; do not claim a fresh pass.
- **Startup schema requirement:** direct source at `backend/src/jobs/local-async-runtime.service.ts` confirms startup fails closed unless five VPS-only Local* tables plus canonical `EventInbox` and replay columns exist. The schemas are in `backend/src/jobs/local-durable-job.schema.sql` and `backend/src/jobs/local-workflow.schema.sql`; the historical candidate lacks the five Local* tables, and none were applied.
- **Next:** complete no-cost off-VPS encrypted backup/restore only after an owner-approved destination is available; establish authorized write protection; take the consistent D1 delta, reconcile inserts/updates/deletes, then apply the additive VPS schema to the candidate and prove financial invariants before requesting explicit writer-cutover acceptance. No data promotion or financial command occurred.


## 2026-10-17 — SQLite promotion and runtime checkpoint (supersedes contradictory older status below)

- **COMPLETED:** Reused the existing restored SQLite artifact and existing final D1 export; did not create another full export or another 7 GB restore. Promoted the candidate to `/var/lib/nexi/sqlite/nexi-staging.sqlite`; prior staging database preserved as `/var/lib/nexi/sqlite/nexi-staging.pre-promotion-20261017.sqlite`.
- **VERIFIED:** `nexi-api.service` active on Node 24.21.0, entrypoint `/srv/nexi/backend/dist/src/main.js`; process has canonical DB and WAL/SHM open. `/readyz` reports SQLite and Redis healthy. Public API/market HTTP, trusted HTTPS for all three hostnames, Public/Admin final pages, Socket.IO polling/WSS and `certbot renew --dry-run` passed.
- **DATA PROVENANCE:** Existing final export manifest: source `nexi-core-staging`, SHA-256 `4eea2b5e3ebcd591d771cad064a005ffce4744bcf80996597fb2c23fc15d478b`, 92 schema tables, 1,754 imported rows, three deferred market tables, zero FK violations at import. Historical snapshot receipt remains 92 tables / 11,802,372 rows. The manifest is not a full row-level change log for later updates/deletes.
- **FINANCIAL CHECK:** SQLite 3.53.2 WAL. LedgerAccount 14, LedgerPosting 48, LedgerIdempotency 46, EventOutbox 94, EventInbox 99; exact decimal posted deltas reconcile against all available/locked account projections with zero mismatches; zero dangling idempotency posting references. Empty legacy `Ledger` table is not the accounting authority per source; LedgerAccount/LedgerPosting are.
- **OPEN:** No fresh whole-file integrity_check after promotion; do not claim one. Final D1 update/delete/watermark reconciliation, full application acceptance, independent encrypted off-VPS backup/restore, and Cloudflare resource retirement remain unproven. Preserve original gzip exports, final export/manifest and rollback database. No broad artifact deletion.
- **CLEANUP:** Removed superseded `/home/mellonelay1999/nexi-migration-snapshots/nexi-active-vps-staging-20261017-onestep.sqlite` (329,150,464 bytes) and its sidecars after confirming it held no User/Activity/AuthSession/Wallet/Ledger/Outbox/Inbox/Loan/Mining rows, no process held it, and the newer pre-promotion rollback remained intact. This freed about 329 MiB. Original and final export files, import manifest and rollback DB remain.
- **Supersedes:** Earlier task entries saying the candidate was unpromoted, runtime core tables were empty, required Local* schema was absent, no DB promotion occurred, or API was inactive. Those entries remain historical provenance only.


## 2026-10-17 continuation checkpoint — scheduler and post-restart acceptance

- **VERIFIED:** Live Worker-0 repository is `/home/mellonelay1999/workspaces/Nexi`, branch `main`, HEAD `8570a39a01534a71960b6189443ec78fcf198a3d`. Preserved pre-existing dirty paths: modified `cloudflare-container-bootstrap/wrangler.jsonc`; untracked `apps/admin/pnpm-lock.yaml` and `apps/admin/pnpm-workspace.yaml`. No cleanup or Git mutation performed.
- **COMPLETED:** Enabled the existing NestJS scheduler via `NEXI_SCHEDULER_ENABLED=true` in `/etc/nexi/backend.env`, then restarted only `nexi-api.service`. The service is active; SQLite-local and local-async flags remain true; market-quote retention remains unset/off.
- **VERIFIED after restart:** All four systemd units `nexi-api`, `nginx`, `nexi-public`, `nexi-admin` are active. Public and Admin HTTPS return 307 redirects, API HTTPS returns 200; TLS verification result is 0 for all. `/readyz` reports READY, database=true, redis=true, authority=SQLite. Socket.IO polling handshake returns a session and advertises WebSocket upgrade. No authenticated mutation was sent.
- **VERIFIED bounded DB state:** User 34, Wallet 34, LedgerAccount 14, LedgerPosting 48, EventOutbox 94 (all PUBLISHED), EventInbox 99; LoanApplication 1 PAID / 4 PENDING; MiningSubscription 1 ACTIVE / 3 COMPLETED. These counts do not establish full D1 delta equality. Existing exact-decimal Ledger reconciliation remains the reused proof (14 accounts, 48 postings, zero mismatches).
- **REMAINING:** Final D1 insert/update/delete watermark and full data completeness; authenticated end-to-end acceptance (authorized test identity not documented); independent encrypted off-VPS backup and verified restore (no authorized destination established); full fresh post-promotion integrity check (not claimed); BullMQ execution beyond TCP connectivity; current market provider feed is unavailable and quote-sequence uniqueness warnings were observed. Market history retention remains off.
- **CLOUDFLARE:** Owner reports Workers and Containers retired. This checkpoint did not verify account-level status or D1/Queues/Workflows/R2/KV/DO/Analytics/Secrets retirement; no destructive Cloudflare action performed.
- **NEXT:** Resolve the remaining controlled data-completeness/financial-authority boundary and backup destination, then use an authorized test identity for targeted application acceptance. Do not repeat the historical export/import or 92-table reconciliation.


## 2026-10-17 Cloudflare resource inventory — read-only MCP verification

Cloudflare account API listing was read-only. The account had 3 Worker scripts, none named `nexi-production`; it returned 0 Container applications. This corroborates that the NEXI Worker/Container deployment is absent from the listed resources, but does not prove account-wide usage or billing has stopped. The same account still lists:

- D1: `nexi-core-staging`.
- Queues: `nexi-domain-events-staging`, `nexi-domain-events-staging-dlq`, `nexi-integration-jobs-staging`, `nexi-integration-jobs-staging-dlq`, `nexi-notifications-staging`, `nexi-notifications-staging-dlq`; each listed with zero configured consumers. Queue message depth was not checked.
- Workflows: `nexi-loan-staging`, `nexi-withdrawal-staging`, `nexi-mining-staging`.
- R2: `nexi-deposit-proofs-staging`, `nexi-kyc-evidence-staging`.
- KV: `nexi-config-staging`.
- A Durable Object namespace `ipbl-graphify-intelligence_GraphifyIntelligenceState` is also listed; it is not identified as NEXI.

This inventory does not establish that the remaining NEXI resources are safe to delete: D1 contents, queue depth, workflow instances and evidence-object retention were not reconciled by this listing. No Cloudflare resource was changed or deleted. Preserve data and evidence until their current consumers, counts and retention obligations are proven closed. Other listed account workers and buckets are outside NEXI scope.


## 2026-10-17 selected D1/SQLite content reconciliation

- **VERIFIED:** Using Wrangler 4.147.0 and read-only SQLite, 38 selected non-market tables covering identity/activity, wallets, Ledger/Idempotency/Audit, Outbox/Inbox, deposit, transfers, withdrawals, Spot/Margin/Binary configuration and positions, loans, mining and referrals had identical row counts and canonical row-content SHA-256 in their respective reads. All 38 matched; no row contents were emitted or persisted. Receipt: `tasks/evidence/d1-sqlite-selected-domain-content-check-20261017.json`. The D1 count query reports 0 rows written.
- **LIMITS:** Reads were sequential, not one quiesced cross-database snapshot. This proves selected-table equality at observation time only; it does not prove all-table parity or final transaction watermark. Market tables intentionally excluded. Historical 92-table snapshot work was not repeated.
- **NEXT:** Preserve the matched production records; close remaining authenticated acceptance, independent off-VPS backup/restore, and queue/workflow/object retention evidence before any destructive resource retirement.


## 2026-10-17 expanded non-market D1 content check

- **VERIFIED:** One read-only Wrangler 4.147.0 batch compared all 89 common D1/application tables outside `MarketKline`, `MarketQuoteLatest`, and `MarketQuoteSnapshot` with the active SQLite DB. 1,754 rows per side were hashed (3,508 total records processed). **84 tables match exactly** by row count and canonical SHA-256. The only five content mismatches are market catalog/config tables: `MarketAsset` (55/55), `MarketAssetCapability` (55/55), `MarketPair` (53/53), `MarketProviderConfig` (9/9), `MarketProviderSymbol` (270/270). Counts match in all five, but content does not. D1-only `_cf_KV` has no SQLite counterpart; its owner and consumer are unclassified and therefore excluded from application-row parity until source classification. No other application source-only or target-only table was found. Five local workflow/job journal tables remain VPS additions.
- **RECEIPT:** `tasks/evidence/d1-sqlite-nonmarket-content-check-20261017.json` contains per-table counts and hashes only; no record payloads. All D1 query statements were SELECTs; no import/export or writes.
- **LIMIT:** This is a bounded observed comparison, not a quiesced production cutover watermark. The three market-history tables were excluded by owner priority; the five market catalog/config tables remain mismatched and are deferred until financial/domain closure.
- **UPDATED FRONTIER:** Application/financial/non-market data parity is now supported across all shared non-market tables except the five market configuration/catalog tables. Final app acceptance, independent off-VPS backup/restore and operational Cloudflare-resource retention/retirement proof remain open.


## 2026-10-17 runtime artifact and private-storage check

- **PROVEN_UNCHANGED:** Deployed source baseline `2a1cffef69049a12fee533f2905fbbcbf1f40105` has no `backend/` changes through code checkpoint `8570a39a01534a71960b6189443ec78fcf198a3d`. Later commits in this session change only documentation/evidence. Runtime entrypoint resolves to `/srv/nexi/backend/dist/src/main.js`; SHA-256 `95f8934947e2a4bb7df6e7beacc5ea57e20ede1de78930bd5c899a2d71997608`; service Node `v24.21.0`. No rebuild required for documentation-only commits.
- **VERIFIED:** `NEXI_LOCAL_OBJECTS_ENABLED=true`, root `/var/lib/nexi/storage`; KYC and deposit-proof directories exist with service-user access (root 0750, child directories 0750); canonical SQLite mode 0600; backend.env root:service-group mode 0640. systemd runs as `mellonelay1999`. Storage source routes deposit proofs under the configured root and KYC to the same root. This verifies configuration/filesystem permissions, not that every historical R2 object has been copied.


## 2026-10-17 canonical backend source/runtime alignment

- **VERIFIED:** Main/origin were at `6d36d5b` before this evidence-only update. Backend source and deployed backend have npm `backend/package-lock.json`; checked lock versions equal installed packages for NestJS 12.0.3, Prisma/client/adapter 7.3.0, better-sqlite3 12.11.1, BullMQ 6.3.15, ioredis 5.10.1, Socket.IO 4.8.3 and Redis Streams adapter 0.3.0. No package mismatch was found.
- **VERIFIED:** systemd runs Node 24.21.0 with Node 24 first in PATH. Prisma CLI under that PATH reports Node 24.21.0. The login shell's default Node 22 does not represent API runtime. better-sqlite3 opened successfully under Node ABI 137; embedded SQLite version 3.53.2.
- **VERIFIED:** `NEXI_LOCAL_SQLITE_PATH=/var/lib/nexi/sqlite/nexi-staging.sqlite` resolves to the same file opened by the active API PID; its main DB, WAL and SHM descriptors are open. See runtime binding receipt.
- **NEXT:** No rebuild/reinstall is warranted by this check. Resume only the actual acceptance frontier: authorized authenticated identity, off-VPS encrypted backup/restore destination, and safe consumer execution proof.


## 2026-10-17 live API contract surface

- **VERIFIED:** Source configures Swagger JSON at `/docs-json`; live endpoint returns OpenAPI 3.0.0 with 221 routes. Auth, wallet, transfer, withdrawal, convert, spot, margin, binary, mining, loan and admin route families are registered. Domain counts are path-substring matches and may overlap.
- **LIMIT:** Route registration does not prove authentication, RBAC or successful business operations. Authenticated runtime acceptance remains pending authorized test identity.


## 2026-10-17 — market sequence, authenticated API, Aiven/BullMQ and Sentry release checkpoint

- **FIXED / COMMITTED:** 41837777432f5926ffd2c0a0e7ae390a61284010 (fix: seed market quotes after historical snapshot gaps). First MarketQuoteLatest row now seeds from the indexed maximum historical snapshot sequence + 1, preventing retry collisions for 22 previously affected active pairs. The changed service has a focused Fallow review (no new structural blocker), 14/14 unit tests, a disposable SQLite SQL integration test, and Node 24 npm run build.
- **VERIFIED LIVE:** nexi-api.service recovered after one controlled restart (PID 1749407, NRestarts=0); API /readyz 200 (authority=SQLite, DB/Redis healthy). Public and Admin HTTPS returned 307 and API HTTPS 200 with TLS verification result 0; Socket.IO polling returned 200 with a WebSocket upgrade offer. /market/prices returned 200. Active market pairs with snapshot history but no latest projection fell to 0; sampled latest/snapshot sequences matched; post-startup uniqueness-collision warning count was 0.
- **VERIFIED AUTH:** One disposable SIWE identity completed challenge/verify, authenticated /auth/me, /wallet/me, /wallet/overview, and /wallet/activity (all 200), then logged out. Its ephemeral private key and bearer token were not persisted or logged. SQLite counts after test: User 36, Wallet 36, LedgerAccount 14, LedgerPosting 48, LedgerIdempotency 46, EventOutbox 94, EventInbox 99; financial posting/outbox/inbox counts unchanged from the pre-test checkpoint.
- **VERIFIED ASYNC:** Using the production-configured NEXI_VALKEY_URL TLS resolver and an isolated, temporary BullMQ queue/prefix, one job failed once and completed on its second execution (attemptsMade=2); the disposable queue was obliterated and clients closed. No durable financial workflow was inserted.
- **VERIFIED SENTRY:** Corrected backend SENTRY_RELEASE from the prior SHA to deployed backend SHA 41837777432f5926ffd2c0a0e7ae390a61284010, preserving env-file owner/mode. Sentry CLI 0.47.0 authenticated; release created, backend-path commit association set locally (20 commits; automatic integration discovery returned 0), finalized and deployed to production. The compiled backend instrumentation module emitted one controlled info event; Sentry MCP confirmed it under the exact release. This is SDK/release-ingestion proof, not evidence of a naturally occurring backend error. The release currently has no exception/log/trace event attributed to that SHA. No uptime monitor change attempted.
- **REUSED, NOT REPEATED:** Existing 84/89 common non-market table content/hash match, historical snapshot/export manifests, SQLite/Ledger proofs and previously passing Socket.IO transport checks. No D1 export/import, historical reconciliation, full-file integrity scan or Cloudflare reactivation performed.
- **OPEN:** Production Admin/financial acceptance still needs an authorized Admin test credential or existing supported test-provisioning route to create scoped test balances; no auth bypass or direct SQL financial seed used. Off-VPS encrypted backup/restore remains blocked by the previously established absence of an authorized destination/key-custody path. Full authenticated Socket.IO event/recovery, object round-trip, current-release backend exception/source-map attribution and the five deferred market catalog/config differences remain unproven.
- **SOURCE/DEPLOY IDENTITY:** Worker-0 main and origin/main were both 41837777432f5926ffd2c0a0e7ae390a61284010 before this task-status append; deployed JS SHA-256 c15ef0210c65ba5935449f40d153cfcced52f0ac772f8276dec76e3ca9f3c5de matched canonical dist. Existing unrelated dirty paths remain untouched: modified cloudflare-container-bootstrap/wrangler.jsonc; untracked apps/admin/pnpm-lock.yaml and apps/admin/pnpm-workspace.yaml.


### 2026-10-17 resumed market backend causal verification

- **PROVEN_UNCHANGED:** Read-only Wrangler 4.127.1 plus SQLite all-column comparison of MarketAsset (55), MarketAssetCapability (55), MarketPair (53), MarketProviderConfig (9), and MarketProviderSymbol (270) found identical key sets/counts and no differences except `updatedAt` (244 rows). The prior five content mismatches are timestamp-only; this is not a final global D1 watermark.
- **VERIFIED:** At 15:11 UTC, public BTC/ETH/ADA quotes were current Binance WebSocket data; BTC public depth returned a live 20×20 Binance REST book and `/market/trades` returned 50 current trades. `/spot/orderbook` and `/spot/market-trades` are internal Spot execution surfaces and were empty; `/spot/margin/quote` returned a live Binance quote. Closed-market AAPL/EURUSD/XAUUSD rows had an explicit closed state. `XAUUSDT` is not a canonical symbol; XAUUSD is.
- **CAUSE:** USDRUB was shown as `STALE` from Yahoo `rest:chart:1d` with `sessionState=OPEN`. MOEX ISS returned `TRADINGSTATUS=N` (“Not traded right now”) and Friday's last `SYSTIME` during the Saturday observation. The adapter did not request `TRADINGSTATUS`, so the runtime could not mark the USD/RUB market closed.
- **IN_PROGRESS:** `backend/src/market/moex-usdrub.adapter.ts` now requests MOEX `TRADINGSTATUS` and uses the existing closed-session marker for N/C/B; T remains open and unknown statuses are ignored. `backend/test/market/non-crypto-market.adapters.spec.ts` covers closed, open, and unknown status. Focused test result: 17/17 under Node 24.21.0. No source build, deployment, service restart, or post-change runtime proof yet.
- **IN_PROGRESS:** Bounded queue pressure is directly observed dropping best-effort provider trade events. Quotes/Klines are prioritized and reference depth/trades are non-durable; Binance depth is a full top-20 snapshot and REST endpoints work, but client gap detection/replay/resynchronization remains unproven. No durable financial loss was observed or implied.
- **PRESERVED:** Modified Wrangler config and untracked Admin pnpm files remain untouched; migration worktree remains untouched. No frontend file changed and no Git commit/push or Cloudflare/D1 write occurred.
- **NEXT:** Complete the market realtime recovery proof and remaining backend gates. Build, integrate and deploy once the backend repair set is coherent, then verify the actual deployed USDRUB session state and current provider recovery. Receipt: `tasks/evidence/market-provider-runtime-20261017.md`.

#### Active execution workflow (reconciled 2026-10-17)

1. **Provider coverage:** Distinguish catalog rows, returned quotes, active NEXI mappings and live/closed status. Current BiQuote evidence: catalog 36/36, returned probes 35/36 candidate mappings, NEXI configured 31; do not promote aliases or change authority from catalog presence alone.
2. **Bounded source repair:** Finish MOEX status classification, focused test and source review. Preserve unrelated dirty Wrangler/Admin files and migration worktree.
3. **Market recovery proof:** For dropped realtime-only reference events, verify fresh provider REST depth/trade read-back after pressure and quote snapshot on socket connect. Exact replay is not the current contract. Do not introduce durable storage or frontend changes without evidence that the existing read-back contract fails.
4. **Release once:** Build the coherent backend change once, deploy to the existing `nexi-api.service`, and verify readiness, USD/RUB `CLOSED/MARKET_CLOSED`, supported market snapshots, process/artifact identity and no new blocking runtime faults.
5. **Continue backend gates:** Use existing authorized non-production identities/fixtures. Close authenticated flows only with durable ledger/outbox evidence. Keep unknown owner credentials, off-VPS backup destination/key custody, and any other external dependency as evidence-backed blockers; continue independent domains.

Current progress and exact test/runtime outcomes are recorded in `tasks/evidence/market-provider-runtime-20261017.md` and the 2026-10-17 tail of `NEXI_CURRENT_STATE.md`.


## 2026-10-17 — authenticated storage and Socket.IO acceptance

- **VERIFIED:** A second disposable SIWE identity completed challenge/verify/logout. Authenticated deposit-proof intent and authorization returned 201/201; PUT /storage/deposit-proof returned 200. The private VPS file bytes matched the test PNG SHA-256, then the exact temporary file and empty user directory were removed (0 recent test files remain). No deposit claim was submitted.
- **VERIFIED:** Authenticated Socket.IO WebSocket connected to /communications and its snapshot acknowledgement returned communications.snapshot. This confirms authenticated gateway access and snapshot read; cross-instance reconnect/event-replay behavior remains unproven.
- **VERIFIED:** Post-test SQLite counts User 37, Wallet 37, LedgerAccount 14, LedgerPosting 48, LedgerIdempotency 46, EventOutbox 94, EventInbox 99; no financial rows changed. API readiness and all four systemd services remained healthy.
