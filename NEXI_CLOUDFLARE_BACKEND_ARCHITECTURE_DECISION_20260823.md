# NEXI Cloudflare Backend Architecture Decision — 2026-08-23

Status: PRE-DEPLOYMENT RESEARCH ONLY
Deployment performed: NO
Cloudflare mutation performed: NO

## Executive decision

Select **Option A for staging**:

```text
Browser -> HTTPS/WSS Worker ingress -> one deterministically addressed
Container -> existing NestJS + Socket.IO -> Neon PostgreSQL and TLS Redis Streams
```

Do not add an application Durable Object. Cloudflare's `Container` class already
extends Durable Object and supplies the routing/lifecycle wrapper around the
Container process. NEXI financial truth remains in PostgreSQL and realtime
authority remains NestJS Socket.IO plus Redis Streams.

Staging must begin with one stable named Container instance. The authoritative
Wrangler configuration is now set to max_instances: 1; do not use getRandom()
for the first Socket.IO staging gate.

## Official documentation reviewed

Retrieved on 2026-08-23 through the Cloudflare documentation MCP/current official
indexes and official Socket.IO documentation through Context7.

| Topic | Official source | NEXI implication |
|---|---|---|
| Containers index | https://developers.cloudflare.com/containers/llms.txt | Canonical current tree for WebSocket, lifecycle, scaling, env, limits, rollouts and deployment. |
| Workers index | https://developers.cloudflare.com/workers/llms.txt | Canonical current tree for runtime, bindings, environments and observability. |
| Durable Objects index | https://developers.cloudflare.com/durable-objects/llms.txt | Canonical current tree for Container API and DO WebSocket hibernation. |
| Containers getting started | https://developers.cloudflare.com/containers/get-started/ | Named instances are for stateful/addressable services; `getRandom()` is for interchangeable stateless instances. |
| Container interface | https://developers.cloudflare.com/containers/container-class/ | `fetch()` forwards HTTP and WebSocket requests and starts the Container as needed. |
| WebSocket to Container | https://developers.cloudflare.com/containers/examples/websocket/ | Official upgrade-forwarding pattern; external 101 acceptance is still required. |
| Container architecture/lifecycle | https://developers.cloudflare.com/containers/platform-details/architecture/ | Worker -> DO-backed Container -> Linux VM; shutdown sends SIGTERM, then SIGKILL after the grace period; disk is ephemeral. |
| Container scaling/routing | https://developers.cloudflare.com/containers/platform-details/scaling-and-routing/ | Random routing is not a Socket.IO affinity strategy. |
| Container env/secrets | https://developers.cloudflare.com/containers/examples/env-vars-and-secrets/ | Pass runtime secrets through approved bindings/environment injection, never source or image literals. |
| Container rollouts | https://developers.cloudflare.com/containers/platform-details/rollouts/ | Container image rollout must be verified separately from Worker activation. |
| Wrangler configuration | https://developers.cloudflare.com/workers/wrangler/configuration/ | Compatibility, bindings, containers, migrations and observability are config concerns. |
| Workers bindings | https://developers.cloudflare.com/workers/runtime-apis/bindings/ | Bindings expose capabilities; secrets remain out of source. |
| Workers observability | https://developers.cloudflare.com/workers/observability/ | Use bounded structured logs/metrics/traces; avoid uncontrolled monitoring. |
| DO WebSockets | https://developers.cloudflare.com/durable-objects/best-practices/websockets/ | Hibernation is a separate explicit WebSocket architecture, not automatic Socket.IO recovery. |
| DO lifecycle | https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/ | DO hibernation/eviction rules apply to an explicit DO application. |
| Socket.IO recovery | https://socket.io/docs/v4/connection-state-recovery | Recovery requires explicit server configuration and is distinct from reconnect. |
| Socket.IO Redis Streams adapter | https://socket.io/docs/v4/redis-streams-adapter/ | Requires a real Redis protocol connection and supports recovery-oriented inter-server transport. |
| Socket.IO protocol/client | https://socket.io/docs/v4/socket-io-protocol/ and https://socket.io/docs/v4/client-options/ | Upgrade path, path, polling and transport/affinity requirements must be preserved. |

## Current NEXI source and version mapping

| Component | Current evidence | Cloudflare decision |
|---|---|---|
| API/financial authority | NestJS backend | Run inside Container unchanged apart from runtime env/port. |
| Durable truth | Prisma/PostgreSQL ledger | Remains external authority; no Container-local balances. |
| Realtime | NestJS Socket.IO | Remains inside NestJS. |
| Redis adapter | `@socket.io/redis-streams-adapter` with ioredis | Keep; do not substitute classic Pub/Sub. |
| Edge | `cloudflare-container-bootstrap/src/index.js` | Routing/validation only; no financial truth. |
| Object storage | R2 `DEPOSIT_PROOFS` | Staging proof-object boundary only. |

Installed backend versions: Socket.IO `^4.8.3`, socket.io-client `^4.8.3`, Redis
Streams adapter `^0.3.0`, classic adapter `^8.3.0`, ioredis `^5.10.1`, Nest
Socket.IO `^10.4.22`. The classic adapter is installed but is not selected.

`backend/src/prisma/redis-io.adapter.ts` uses stream `nexi:socket.io`, bounded
read/trim settings, and `connectionStateRecovery` with a 120-second window. It
refuses server creation before Redis is connected.

`cloudflare-container-bootstrap/src/index.js` uses `defaultPort = 3000`,
`pingEndpoint = "localhost/ops/live"`, `sleepAfter = "10m"`, and forwards the
original request with `getContainer(..., "nexi-api").fetch(request)`. The current
Worker also contains bounded R2 deposit-proof authorization/claim checks.

`wrangler.jsonc` has compatibility date `2026-08-19`, `nodejs_compat`, Worker
observability, required secrets `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and
`CORS_ORIGINS`, a staging R2 bucket, and a Container-backed DO migration. It
does not pass `DIRECT_URL`; that is correct only when migrations run in a
separate controlled job, never at application startup.

## Selected topology and responsibilities

### Worker

Terminate HTTPS, route requests, enforce bounded R2 object checks, pass HTTP and
Socket.IO upgrades through unchanged, and emit bounded observability. It must
not own balances, sessions, ledger postings, settlement or market truth.

### Container

Run the Linux/amd64 NestJS image on port 3000, expose `/ops/live` and `/ops/ready`,
connect to Neon and remote TLS Redis, receive secrets via runtime environment,
and handle SIGTERM. Local disk is ephemeral.

### Durable Object

**Additional application Durable Object: NONE.** Cloudflare documents that the
Container class extends Durable Object and manages routing, lifecycle, readiness
and associated state. A second DO would create a second realtime authority and
duplicate authentication, ordering, recovery and observability.

### Redis

Remote Redis with persistent TLS Redis protocol support, Streams commands,
reconnect behavior and permissions required by the installed adapter. Local
Memurai is disposable Windows validation only, not a Cloudflare target.

### Neon

Use pooled URL for application runtime and direct URL only for a separately
controlled migration job. Never migrate automatically from every Container.
Hyperdrive is not needed while only NestJS in the Container accesses Postgres.

## Options considered

| Option | Assessment | Decision |
|---|---|---|
| A: Worker -> one named Container -> NestJS/Socket.IO -> Redis/Neon | Lowest change and stable affinity; supports polling/WSS pending live proof. | **Selected for staging.** |
| B: Worker -> multiple Containers -> Redis Streams/Neon | Possible, but polling requires affinity and random routing is unsafe. | Defer until scale/affinity evidence. |
| C: Worker -> explicit DO WebSocket layer -> Container | Adds another realtime authority and hibernation model. | Rejected for current scope. |
| D: Worker/Hyperdrive-owned API | Splits current NestJS/Prisma authority without evidence. | Rejected. |

## Explicit architecture answers

1. Current NestJS can run nearly unchanged in a Container if the image is
   Linux/amd64-compatible, listens on 3000, receives process env, and passes
   outbound Neon/Redis/readiness checks.
2. Socket.IO can remain inside NestJS.
3. Cloudflare's Container `fetch()` supports HTTP/WebSocket forwarding, and the
   current Worker forwards the original request. A real external 101 test is
   still required.
4. Polling should pass through, but it requires session affinity. One named
   instance is the initial safe gate.
5. Multiple instances require deterministic affinity or WebSocket-only transport;
   Redis Streams does not itself route polling sessions.
6. `getRandom()` is not safe for initial Socket.IO staging.
7. Staging should begin with exactly one stable named instance.
8. Redis Streams remains required for the selected multi-node-capable design.
9. Source enables recovery, but external recovery is not runtime-proven.
10. No additional DO is needed.
11. A DO would require a separately justified edge registry, hibernating rooms,
    or edge protocol termination; none is currently required.
12. The Container's DO-backed lifecycle plus NestJS/Redis Streams already covers
    the current need.
13. Current `sleepAfter: "10m"` is a blocker until active Socket.IO behavior is
    measured. Official docs define expiry after no incoming requests and stop
    behavior; they do not prove that an active Socket.IO connection prevents it.
14. Stop/replacement can terminate clients; recovery helps only after reconnect.
15. Start with configured `basic` only after checking account limits and actual
    backend measurements. The local Codex memory spike is not Container sizing
    evidence.
16. Pass non-secret vars as vars and credentials as Worker secrets/approved
    secret mechanism into Container env; never log or store values.
17. Use bounded Worker/Container structured logs, metrics and exceptions; no
    unbounded memory watcher.
18. Treat Worker activation and Container rollout as separate; preserve prior
    versions and validate/rollback each layer independently.
19. Allow `http://127.0.0.1:3001` only as an explicit staging CORS origin; it is
    not a production origin.
20. Exact HTTPS/WSS host is not selected. Use the approved staging host and the
    current Socket.IO path (`/socket.io/`) without inventing a hostname.

## Required pre-deployment changes/decisions

No application architecture rewrite is justified. Before deployment, resolve:

1. explicit Wrangler `staging` environment rather than relying only on a
   top-level config named `nexi-staging`;
2. staging-only CORS and final HTTPS/WSS hostname;
3. retain one named Container instance, or produce a documented affinity design before increasing
   `max_instances`;
4. `sleepAfter` policy for realtime;
5. Linux/amd64 image and port/readiness proof;
6. external Redis Streams and connection-state recovery proof;
7. one controlled migration job using `DIRECT_URL` outside app startup;
8. bounded rollout, observability and rollback procedure.

## Known unknowns and blockers

- No exact deployed staging hostname/WSS endpoint is selected.
- External Worker -> Container HTTP 200 and WebSocket 101 are not yet proven.
- Active Socket.IO behavior across `sleepAfter` is not proven.
- Remote Redis command compatibility/latency and recovery are not proven.
- Container account limits and Linux/amd64 image readiness are not proven.
- CORS/SIWE acceptance from the final staging origin is not proven.
- Local Windows ARM64 Wrangler dry-run is blocked by bundled `workerd` error:
  `Unsupported platform: win32 arm64 LE`. This is a tooling limitation, not a
  configuration pass.
- No Cloudflare deployment, DNS, secret, route, binding, image publication or
  production mutation occurred in this gate.

## Exact staging plan after separate deployment approval

1. On the approved VM, run current Wrangler type/config/dry-run checks.
2. Validate/build Linux/amd64 image.
3. Configure explicit staging with one named Container instance.
4. Set staging vars/CORS and inject secrets without logging values.
5. Run migrations once using the controlled direct URL.
6. Deploy only after separate current-turn approval.
7. Verify Worker `/healthz`, Container `/ops/live`, and `/ops/ready`.
8. Verify REST, Socket.IO 101, polling, affinity, reconnect and recovery.
9. Verify market freshness, wallet/SIWE, ledger, Spot/Margin, Options, Admin and
   deposit-proof boundaries.
10. Capture bounded evidence and independently test rollback.

## Final decision

Selected staging topology:

```text
Browser -> Cloudflare Worker -> deterministic single Container-backed DO
-> NestJS + Socket.IO -> remote TLS Redis Streams -> Neon PostgreSQL
```

Additional Durable Object: **NONE**
Financial authority: **Neon/PostgreSQL ledger**
Realtime authority: **NestJS Socket.IO + Redis Streams**
Deployment status: **NOT DEPLOYED**

## Staging deployment readiness assessment — 2026-08-23

### Final blocker closure evidence — 2026-08-23

- **Authoritative source parity:** PASS for the synchronized bundle on
  `sg-edge-01`. The bundle was created from the Windows checkout without Git,
  transferred to `/root/workspaces/nexi-authoritative-20260823`, and key-file
  SHA-256 values match the Windows source, including `main.ts`,
  `redis-io.adapter.ts`, Worker source, `wrangler.jsonc`, `Dockerfile`, and
  backend package manifests. The Windows bundle was secret-free.
- **Linux/amd64 image:** PASS. `sg-edge-01` built
  `nexi-api-authoritative:20260823` from the synchronized backend Dockerfile
  with `--platform linux/amd64`; image digest is
  `sha256:4346a2f54e8f3b7700c474e75bc1876112c9f17f400c1957a49f2aad50b3c435`.
  Image metadata exposes port 3000 and starts `node dist/src/main.js`.
- **Workers staging hostname:** the account workers.dev subdomain is
  `melloenfrwrk`; the prepared hostname is
  `nexi-staging.melloenfrwrk.workers.dev` once the Worker is deployed. No
  Worker was deployed in this preparation step.
- **Remote Redis:** FAIL for the current `/etc/nexi/nexi-staging.env` target.
  TLS/TCP and PING passed, but `XADD` was rejected with the provider's
  `max requests limit exceeded` response. This is a resource/quota blocker,
  not an adapter-code failure. No keys were retained by the probe.
- **Staging env parity:** FAIL for the current VM env file: the exact QA
  origin `http://127.0.0.1:3001` is absent from `CORS_ORIGINS` and
  `WALLET_AUTH_URI`; the database target does not identify as the approved
  Neon target. No secret values were changed.
- **Rollback:** PASS for preparation. There is no prior NEXI Container image
  reference; the candidate reference is the immutable local build digest
  above. Worker rollback is to keep the current Worker untouched and disable
  or revert the staging binding/runtime if the first staging version fails.

The staging Worker name and account workers.dev subdomain define the prepared
hostname model. Cloudflare deployment, secret mutation, and DNS changes remain
outside this preparation step.

### Independent blocker closure slice — 2026-08-23

- **CORS/SIWE static configuration:** PASS. Staging vars now define the exact
  QA origin `http://127.0.0.1:3001`, SIWE domain `127.0.0.1:3001`, URI
  `http://127.0.0.1:3001`, and chain ID `1`. The Worker forwards all three
  `WALLET_AUTH_*` values into the Container runtime. No wildcard origin is
  used.
- **Neon migration verification:** PASS. The approved project
  `nexi-disposable-integration-20260822`, branch `br-steep-morning-ayo3b55d`,
  reports the current latest migration
  `20260819120000_add_manual_deposit_claims` as finished; it matches the
  latest local migration directory. No migration was run because the target
  was already current.
- **Neon runtime secret installation:** DEFERRED pending the final staging
  Redis target and deployment-created Worker secret surface. No connection
  value was printed or stored in source.
- **Redis:** remains the only external resource blocker. The current remote
  TLS target passes PING but rejects XADD at its provider request limit; local
  Redis is not Cloudflare-reachable and is ineligible.

The architecture gate is accepted. The following are classified as
`STAGING_ACCEPTANCE_REQUIRED` rather than pre-deployment blockers: external
Worker/Container HTTP and WSS proof, Redis Streams recovery through Cloudflare,
reconnect and connection-state recovery, cold start/wake, sleep/wake and active
WebSocket lifecycle, and external SIWE.

| Check | Status | Evidence / reason |
|---|---|---|
| Architecture gate | PASS | This decision document and current official documentation review. |
| Authoritative source/bundle parity | **FAIL** | Windows hashes for adapter, Worker and Wrangler config do not match the VM copy; VM also has a different runtime Dockerfile. Do not deploy the VM copy. |
| Linux/amd64 image build | UNKNOWN | VM Docker is available (`linux/x86_64`, Buildx `0.35.0`), but a valid build from the authoritative Windows source has not been run. |
| Cloudflare Container availability | PASS | Read-only Containers API returned an existing healthy one-instance application, basic resource class, and Container/DO configuration. This is availability evidence, not deployment approval. |
| Worker configuration | PARTIAL | Worker syntax passes and `nodejs_compat`/observability/R2/Container bindings exist; explicit staging environment and final hostname are not configured. |
| Container configuration | PASS (static) | Port 3000, `0.0.0.0` binding, `/ops/live` ping and graceful Nest shutdown are present in current source. |
| Single-instance routing | PASS (source/config) | Named `getContainer(..., "nexi-api")`; authoritative config changed from `max_instances: 10` to `1`. External behavior remains acceptance evidence. |
| Backend port/binding | PASS (source) | `app.listen(runtimeConfig.port, "0.0.0.0")`; Container `defaultPort=3000`; Docker exposes 3000. |
| Staging CORS/SIWE | **FAIL** | Production runtime requires `CORS_ORIGINS`; current source/defaults do not include `http://127.0.0.1:3001`. Secret/config injection is not verified and no secret was changed. |
| Neon configuration | PARTIAL | Pooled runtime/direct migration separation is designed; target values and deployment environment are not injected or verified here. |
| Redis configuration | UNKNOWN | Current adapter requires TLS/TCP Redis Streams; remote endpoint command compatibility has not been tested in this gate. |
| Secrets/bindings prepared | PARTIAL | Required secret names are declared and Container env propagation exists; actual secret presence is intentionally not read or printed. |
| Health endpoints | PASS (source) | `/ops/live` and `/ops/ready` exist in the Nest runtime contract; external staging proof is deferred. |
| Rollback preparation | PARTIAL | Rollout/rollback model is documented; concrete Worker and image version references are not yet captured for this staging attempt. |
| Tests/build | PASS (local source) | Backend build, frontend typecheck, and Worker `node --check` passed. Wrangler local checks are blocked by Windows ARM64 `workerd`. |
| Graphify | PASS | `graphify check-update .` exited successfully; targeted architecture query completed. |

### True pre-deployment blockers remaining

1. Synchronize or otherwise validate the authoritative Windows source into the
   VM build boundary; the current VM copy is stale/non-parity.
2. Build the synchronized source as a Linux/amd64 image and record its digest.
3. Inject staging-only CORS containing `http://127.0.0.1:3001` and verify SIWE
   configuration without exposing secret values.
4. Verify the selected remote Redis endpoint supports the required TLS/TCP
   Streams commands and adapter connection.
5. Capture concrete rollback references for the Worker and Container image.
6. Determine the approved staging hostname.

All external runtime behavior remains `STAGING_ACCEPTANCE_REQUIRED` after
deployment and must not be used to block this static preparation phase.



## Current 2026-08-25 superseding runtime state

This section supersedes the earlier pre-deployment blocker table for current staging runtime status:

- `nexi-staging` is deployed at `https://nexi-staging.melloenfrwrk.workers.dev`.
- Current external `/ops/live` and `/ops/ready` are HTTP 200; readiness reports PostgreSQL and Redis true.
- The selected Worker → one Container → NestJS → Neon/Aiven-compatible Redis/Valkey topology remains unchanged.
- Market data is currently intentionally unavailable because staging configuration has `MARKET_PROVIDER_ENABLED=false` and `MARKET_BACKFILL_ON_STARTUP=false`. This is the current market-ingestion blocker, not a Container routing or database-readiness blocker.
- The next bounded action is staging market-provider activation/ingestion, followed by frontend/API acceptance. Historical “deployment not started” and pre-deployment blocker entries remain preserved as historical evidence and are not the current state.

Receipt: `work\\20260825-program-realignment\\NEXI_PROGRAM_REALIGNMENT_RECEIPT_20260825.md`.
