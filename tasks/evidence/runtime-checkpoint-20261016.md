# VPS runtime checkpoint — 2026-10-16T20:01Z

- Worktree: `/home/mellonelay1999/workspaces/Nexi-sqlite-migration`, branch `migration/sqlite-local-bridge`, HEAD `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; 34 dirty paths preserved.
- API systemd unit: active/running, PID 1671903, `/srv/nexi/backend/dist/src/main.js`, working directory `/srv/nexi/backend`, runtime user `mellonelay1999`; boot enablement is currently disabled. No restart performed.
- Readiness: `/healthz`, `/readyz`, `/health`, `/ops/ready`, `/market/prices`, `/docs`, and `/docs-json` returned HTTP 200. OpenAPI parsed as NEXI API v1.0 with 221 paths. Socket.IO Engine.IO v4 polling handshake returned a valid open packet; no authenticated event exchange was attempted.
- Storage/runtime truth: ready response reports SQLite and Redis healthy and authority SQLite. This is the loopback non-authoritative VPS runtime; no customer/financial cutover occurred.
- Redis endpoint: runtime hostname resolves to the Aiven staging Valkey endpoint over TLS. Read-only TLS PING returned PONG using the active service's in-memory environment. At the same check, API PID 1671903 owned 16 established TCP connections to the resolved Aiven endpoint. Credentials were not printed. The API's live Redis use is therefore not relying on local Valkey; client-level attribution (BullMQ vs Socket.IO vs cache) is not proven by these sockets alone.
- `nexi-valkey.service` remains active for isolated tests; no API PID connections to it were observed. Do not retire it until test consumers are shown not to need it.
- Sentry: runtime DSN/environment are non-empty; compiled startup imports Sentry instrumentation before Nest bootstrap. No synthetic event was sent.
- Package evidence: repository has tracked npm locks at root and `backend/`; no `.npmrc`/pnpm workspace policy was found. Backend source manifest matches the tracked npm lock dependency declarations. The separate untracked `backend/pnpm-lock.yaml` resolves Nest 12.1.3 while tracked npm resolves 12.0.3, both permitted by `^12.0.0`; the active runtime package lock and modules resolve Nest 12.0.3, Prisma client/SQLite adapter 7.3.0, better-sqlite3 12.11.1, BullMQ 6.3.15, ioredis 5.10.1, Socket.IO 4.8.3, and Redis Streams adapter 0.3.0. Thus no active runtime version mismatch was found; do not reinstall/upgrade from this evidence. Prisma CLI is a dev dependency and is absent from the runtime module tree as expected.
- Capacity: 6.3 GB free on the 51 GB filesystem (88% used); RAM about 7.8 GiB total, earlier observed roughly 4.6 GiB available. Avoid duplicate database/export/build trees.
- Limits: no authenticated financial-command event, WebSocket upgrade (only polling handshake), public TLS/API vhost, Cloudflare dependency closure, final D1 delta, or independent off-VPS backup is proven by this checkpoint. No DNS, Cloudflare production, financial writer or database contents changed.


## Follow-up — 2026-10-16T20:03Z

- Enabled `nexi-api.service` for boot using the existing unit. It remained active with the same PID 1671903 and `/healthz` returned HTTP 200; no restart occurred. This persists only the loopback non-authoritative API runtime.
- Removed the duplicate `$nexi_connection_upgrade` map from the inactive `/etc/nginx/sites-available/nexi-api.conf` candidate. The active Nginx configuration passed `sudo -n /usr/sbin/nginx -t`. The API candidate itself remains inactive because `/etc/letsencrypt/live/nexitrading.app/fullchain.pem` and `privkey.pem` are absent. No Nginx reload, public routing, DNS, or Cloudflare change occurred.


## Queue and market path follow-up — 2026-10-16T20:06Z

- `NEXI_LOCAL_ASYNC_ENABLED=true` and `NEXI_SQLITE_LOCAL_ENABLED=true` in the active service. Source `resolveValkeyConnectionOptions` chooses `NEXI_VALKEY_URL` first and falls back to `NEXI_VALKEY_SOCKET`; the active URL is Aiven TLS. The API's active Unix-domain socket connections to the local Valkey service were not observed.
- Active source constructs BullMQ queues and workers for `domain-events`, `notifications`, and `integration-jobs` after checking local SQLite durable-job/workflow/EventInbox schema; it polls persisted work each second. A read-only BullMQ `getJobCounts` against the isolated staging prefix on Aiven succeeded for all three queues; each count was zero. No jobs were inserted and no state changed.
- `MARKET_PROVIDER_ENABLED=true`, provider selection is `binance-spot`. The active source bounds the volatile ingest queue at 256 items, coalesces queued tickers/depth by symbol, prioritizes ticker/kline events, and may discard trade/depth reference events when full. Existing API journal shows recurring saturation warnings for dropped trade/depth events. This is a real observed backpressure condition; acceptance still must establish that quote/kline freshness and required realtime depth/trade behavior meet product expectations at representative load. No market code/config was changed.


## Live Cloudflare identity follow-up — 2026-10-16T20:17Z

- Active Worker deployment: `de16e62e-6bf7-4099-b2c9-6eed4f3dc46d`, version 194, deployment ID `628ccf82-1a2b-4c88-8fa2-67367b565111`. Handlers reported by the deployed version include `fetch`, `queue`, and `scheduled`.
- Container app `nexi-api-staging` has one active instance. The configured image and running instance report the same digest: `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`.
- The live Worker binding inventory remains D1, R2 (deposit proofs and KYC), three Queues, three Workflows, KV, Durable Object/Container, auth rate limiter, Analytics Engine, Secrets Store, and secret bindings. This is a live dependency inventory; no service was retired.
- VM CLI `cf` version `1.0.0-beta.12` is installed. Read-only `cf containers ssh <instance> -- node --version` reached `SSH-2.0-dropbear_2025.89`, then returned protocol negotiation bytes and exited under the 18-second timeout with status 124. The earlier Wrangler SSH attempt had the same result. No remote command result was obtained and no remote mutation occurred.
- Local Git has the deployed Worker release commit object. Its backend manifest specifies NestJS 12 range, Prisma D1 adapter, ioredis, Socket.IO 4 and Redis Streams adapter; it does not declare BullMQ, Prisma client, SQLite adapter or better-sqlite3. This is source-manifest evidence only; the exact Container digest has not been proven to have been built from that commit, and image internals remain unknown.
- VPS backend remains the already active, boot-enabled, loopback-only service on port 3002, with SQLite readiness and Aiven Valkey connected as established in prior checkpoint. No public route, Cloudflare production, DNS or financial writer changed.


## Public API and registry-tag follow-up — 2026-10-16T20:22Z

- Read-only GET `https://api.nexitrading.app/healthz` returned HTTP 200; resolved response edge address was 104.21.2.227. This confirms health through current Cloudflare routing only.
- VM `cf containers images list` listed `nexi-api-staging` tags including `de16e62e`, matching the active Worker version ID. CLI help offers list/delete/prepare (no inspect subcommand). Local Docker exists, but a read-only filtered `docker image ls` found no local Cloudflare/NEXI backend image.
- No image pull/build, deployment, Cloudflare mutation, DNS change or financial write was performed.
- Combined with the prior SSH attempts, exact configured/running digest is known while image-internal Node version, package tree, native dependencies, startup command and build-source provenance remain unverified.


SSH syntax check: `cf containers --help` documents `cf containers ssh <id> [ssh-command..]`. A direct-form `cf containers ssh <id> echo NEXI_CONTAINER_SSH_OK` also returned raw Dropbear negotiation bytes and timed out (124); `node --version` in direct-form returned exit 0 but no remote output. Thus neither CLI invocation yielded admissible in-container command evidence.


## Container runtime comparison — 2026-10-16T20:24Z

Authorized SSH used key `nexi-cloudflare-staging-20260909`: the Worker-0 private key fingerprint was checked against the screenshot-provided public key without exposing private contents. A temporary ssh-agent loaded the key, `script` supplied a PTY, and the agent was stopped after the read-only inspection.

Current Container config and running instance use digest `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`. Runtime: Node v24.21.0, ABI 137, executable `/usr/local/bin/node`; PID 1 command is `node dist/src/main.js`, PID 1 cwd is `/app`, and `/app/dist/src` exists. Image config leaves command/entrypoint at image defaults.

In-image `package.json` SHA-256 `3c03a8ecc71ddf1fde44648992f05e643945eb7f6b304509fcdfb750fcb81151` and `package-lock.json` SHA-256 `f980ac2d042bb462e1bfb283a5275ae23944ef573834ef1288e8d3abac4f6c96` exactly match their files at deployed release commit `7fbde5ca82287902cb351546ccae1b632f1aae44`.

Installed: Nest core/platform/websockets 12.0.3; `@nestjs/observe` 0.1.10; Prisma D1 adapter 7.3.0; ioredis 5.10.1; Socket.IO 4.8.3; Redis Streams adapter 0.3.0. The Cloudflare image uses D1 and omits Prisma client, Prisma SQLite adapter, better-sqlite3, BullMQ and `@nestjs/bullmq`. Native addon file listing found bcrypt and build-tool prebuilds; no better-sqlite3 addon.

Comparison: VPS currently runs Node v22.23.2, Prisma/SQLite adapter 7.3.0, better-sqlite3 12.11.1, BullMQ 6.3.15, and has Observe removed; Nest/ioredis/Socket.IO/Streams versions match the Cloudflare image. Therefore the Container is the Cloudflare/D1 runtime, not the migrated VPS SQLite/BullMQ runtime. Compiled dist source provenance was not separately hashed. No Cloudflare deployment/config, DNS, financial writer or VPS service was changed.## 2026-10-16 — Wrangler SSH runtime confirmation

- Read-only command: `wrangler containers ssh fde387823556b436138bfeac1a031e123de318c86639a5114b2520a8a717298a -- node --version` (run under PTY with the screenshot-authorized `nexi-cloudflare-staging-20260909` key).
- Result: Wrangler 4.129.0 connected successfully; the running container reports Node v24.21.0. This independently confirms the earlier `cf` CLI runtime observation for image `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`.
- Cleanup verified: temporary SSH-agent socket removed. No Wrangler configuration, Worker, image, Cloudflare production setting, VPS service, DNS, or data was changed.
- Interpretation: confirms the deployed container runtime version and authorized Wrangler SSH path. It does not establish that the Cloudflare image is a drop-in VPS backend; the package/lock and dependency comparison recorded above remains controlling.


## 2026-10-16 — Node 24 / canonical npm install / integration checkpoint

- Worktree: /home/mellonelay1999/workspaces/Nexi-sqlite-migration, branch migration/sqlite-local-bridge, HEAD 9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f. All pre-existing dirty source, tracked npm lock, and untracked pnpm lock preserved; no commits/resets.
- Canonical package manager evidence: backend package-lock.json is tracked and used by /srv/nexi/backend; pnpm lock remains untracked and preserved. Ran npm 10.9.8 npm ci --no-audit --no-fund in migration worktree with explicit Node 24.21.0 PATH. 926 packages installed. This replaced the previously divergent node_modules only; source/lock files remain intact.
- Installed package probe under Node v24.21.0 / ABI 137: Nest core 12.0.3; Prisma client/CLI/SQLite adapter 7.3.0; better-sqlite3 12.11.1; BullMQ 6.3.15; ioredis 5.10.1; Socket.IO 4.8.3; Redis Streams adapter 0.3.0. Native better-sqlite3 opened SQLite 3.53.2.
- Post-install focused checks: npm run test:local-sqlite 4 suites / 16 tests passed; NEXI_TEST_VALKEY_SOCKET=/run/nexi-valkey/valkey.sock npm run test:local-async 3 suites / 14 tests passed using isolated local test Valkey; npm run build exit 0. No full historical/financial suite rerun.
- Live nexi-api.service: enabled and active under Node 24.21.0, canonical ExecStart /srv/nexi/backend/dist/src/main.js, non-authoritative loopback port 3002. /healthz 200; /readyz 200 with database=true, redis=true, authority=SQLite. Lane C separately verified Public/Admin unchanged and real Socket.IO WebSocket connection. No financial command used.
- Sentry: one non-PII event tagged vps-staging sent via installed Sentry SDK; SDK flush succeeded. Sentry search confirmed receipt at 2026-10-16 20:52:12 UTC, project nexi, issue NEXI-X; event ID 7f012eded3da480d9ccc2da43267ba76. This verifies configured SDK delivery, not automatic capture of an exception inside the running NestJS process.
- Lane B direct-source/Fallow result: local flags select SQLite, local async jobs and local object storage. Remaining D1/R2/queue code paths are conditional compatibility fallbacks; no active Cloudflare call is established in current VPS process. runtime.config still has D1-named flag coupling. Graphify index predates dirty files; direct source was authoritative. Fallow exit 0 with stale-root-node_modules/generated-coverage caveats and no confirmed Cloudflare gap.
- Disk headroom after install: about 6.1 GB (88% used). No Cloudflare/DNS/financial authority changes. Existing service/env remain non-authoritative.
