# NEXI Cloudflare Exit — Owner-Directed Migration Plan

## Authority and scope
Current owner directive (2026-10-16) governs conflicting repository/VM/skill instructions. This plan and todo.md are the living migration controller. The old production ledger and ChatGPT Project uploads are historical only. Preserve NestJS/Public/Admin and every existing domain behavior. Target one existing VPS, SQLite durable application/financial truth, Ledger accounting, EventOutbox durable publication. PostgreSQL/Timescale/managed-service research is superseded exploration. No framework rewrite.

## Recovered baseline (2026-10-16 UTC; exact observations in evidence/g0-recovery.json)
Migration worktree: /home/mellonelay1999/workspaces/Nexi-sqlite-migration; branch migration/sqlite-local-bridge; HEAD and cached origin/main 9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f. Existing nine migration files preserved, uncommitted. Remote main still requires exact live SHA check. Original checkout main@d24862f preserved with its two untracked Admin pnpm files. No prior tasks directory/files found in either checkout. Public/Admin active. Snapshot SQL gzip 863748144 bytes; restored SQLite 7164264448 bytes; both isolated historical data, not current production. Disk 8.7G available, RAM 5120MiB available, swap 2036MiB used. Previously reported 7/7 SQLite + 53/53 financial + backend build remain historical pending exact native evidence recovery; no automatic repeat. Previous 90/92 count comparison is not content equality.

## Replacements and closure proof
| Dependency | Target owner | Required closure proof |
|---|---|---|
| D1/private HTTP bridge | Prisma better-sqlite3 + local financial gateway | All schema/data/financial reconciliation; ordered atomic rollback; exact decimals/idempotency; PRAGMAs on every connection |
| Worker/Container/DO routing | Existing Nginx + NestJS systemd | Auth/cookies/CORS/SIWE/WSS parity, fail-closed upstreams, resource/restart proof |
| Three queues + DLQ policy | Local Valkey + BullMQ, durable Outbox/Inbox | Retry, replay, duplicate delivery, lost-queue recovery, durable failure inspection |
| Withdrawal/mining/loan Workflows | SQLite checkpoints + BullMQ steps | Approval/provider waits/due dates/retries; in-flight manifest; restart and exactly-once financial effects |
| R2 proof/KYC objects | Private local filesystem adapter | Key/MIME/auth parity; count/content hashes; copy/recovery; outside webroot |
| KV/config | SQLite SystemConfig, Valkey ephemeral only | Each actual consumer mapped and parity verified |
| Secrets/rate limit/cron/analytics | Root-owned env, existing Nest/Nginx, bounded jobs/logs | Actual deployed binding inventory and consumers closed |
| Aiven Valkey | Aiven Valkey is final for BullMQ, Socket.IO and ephemeral cache/realtime; loopback Valkey is temporary test-only | TLS/auth, DB/prefix isolation, reconnect and queue recovery; never financial truth |
| Cloudflare DNS | Name.com authoritative DNS | Full record sheet/DNSSEC/ACME and owner-approved nameserver change; registration stays at Name.com |
| Backups/operations | SQLite consistent backup + encrypted independent copy | Restore tested; retention/resource budget and runbooks |

## Ordered critical path
G0 recover handles, instructions, source/dirty state, artifacts, prior proof; establish tasks controller.
G1 schema plus all-table canonical key/content reconciliation; migration history, exact money/Ledger, outbox/inbox, auth/domain/config state; explicit source snapshot boundary and market coverage, separately internal SQLite tables. Reuse export, no giant duplicate.
G2 validate local adapter/financial gateway/Prisma, each connection WAL/FULL/FK/busy timeout, SQLITE_BUSY/concurrency, rollback, fault injection/idempotency/restart and real-dataset reads. No production connection.
G3 local Valkey/BullMQ and durable workflow coordinator; inventory and preserve active source queue/workflow state.
G4 verify R2 copies/manifest and all remaining bindings/consumers.
G5 isolated non-authoritative full backend/Public/Admin/market/auth/browser parity; bounded resource/load/recovery checks; encrypted independent backup/restore. Focused verification before coordinated final build.
G6 exact financial freeze/drain/snapshot/delta/reconciliation and rollback-forward protocol; PENDING_OWNER_ACTION before changing live financial writers or endpoints.
G7 Name.com DNS + Cloudflare per-resource retirement after owner approval, independent backup and rollback window. Billing review separate.

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
4. Remaining pre-cutover evidence: trusted API TLS/Nginx route, authorized authenticated acceptance identity, market and Socket.IO recovery acceptance, independent encrypted off-VPS backup/restore, current live D1 delta and controlled freeze/drain/reconciliation/rollback-forward packet.
5. Owner-only: financial writer/traffic cutover, Name.com nameserver change, and destructive Cloudflare retirement. Keep production Cloudflare/D1 unchanged pending those gates.

Historical records below preserve the chronology and are superseded where their branch, runtime, Node version, Aiven target or pending task contradicts this checkpoint.

## 2026-10-17 Checkpoint — Public DNS/TLS routed to VPS

- VERIFIED — Name.com is authoritative by owner action; all three hostnames route to VPS IP 34.143.137.221. Screenshot and GCP rule describe confirm enabled ingress ALLOW TCP/80 at priority 1000 for tag singbox-chatgpt-24443; TCP/443 already reached Nginx.
- VERIFIED — Certbot staging and production HTTP-01 succeeded. SAN certificate for www/api/admin is installed; expiry 2027-01-15. Active Nginx certificate references were changed with pre-change backups retained. nginx -t and reload passed.
- VERIFIED — Strict HTTPS reached Public/Admin final routes (HTTP 200), API /ops/ready (200; SQLite/Redis ready), /market/prices (200), Socket.IO polling, and a real Socket.IO WSS session. All returned TLS verify result 0 and the VPS IP.
- VERIFIED — Certbot timer active; NEXI deploy hook syntax/manual execution passed; certbot renew --dry-run passed.
- VERIFIED — Canonical main remains 927d313b5f873eaf814fb3e1d2a00e8a101dc37b = origin/main. Only preserved untracked Admin pnpm files remain. Runtime local SQLite, async and object flags are enabled.
- OPEN — Authenticated financial acceptance, independent encrypted off-VPS backup/restore, final live D1 delta, single-writer cutover and Cloudflare retirement. Cloudflare resources remain deployed; D1 remains financial authority. No financial writer or Cloudflare resource changed.
