# VPS runtime candidate checkpoint — 2026-10-16

## Identity and image comparison

- Migration worktree: `/home/mellonelay1999/workspaces/Nexi-sqlite-migration`
- Branch/HEAD: `migration/sqlite-local-bridge` / `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; pre-existing branch changes preserved.
- Cloudflare Container `nexi-api-staging`: image digest `sha256:a960be426bd4182a2375cbecb09eaa0501c544ac4e549078a70ffe14298d1037`, version 96. Cloudflare Worker production remains deployed separately.
- VM had no backend service/release/container image at recovery. Staged candidate is built from the dirty migration worktree, Node 22.23.2; source Dockerfile uses Node 24. It is not the same image/artifact as the Cloudflare Container. Candidate main entrypoint checksum matches the built worktree output: `cd67b88c2f4a5674cda915cb7af24e1cb7493a60d16d5eedae8f063ea0886f10`.
- Candidate release: `/srv/nexi/backend/releases/20261016T1658Z-9a41b2e3-dirty`; `/srv/nexi/backend/current` points to it. This is staging only, not cutover proof.

## Reversible VPS setup completed

- Local Valkey 8.0.1 service `nexi-valkey.service` is active. TCP `127.0.0.1:6379` and Unix socket `/run/nexi-valkey/valkey.sock` both return PONG. Config reports `noeviction`, AOF enabled, loopback bind and private socket. The initial service start failed because the config mode denied group read; the narrow fix was to set config owner `root:mellonelay1999`, mode 0640. Service now runs.
- Created blank, non-authoritative `/var/lib/nexi/sqlite/nexi-staging.sqlite` from the 15 checked-in D1 schema migrations plus the VPS-only durable-job and workflow schemas. 96 tables, SQLite integrity check `ok`, foreign-key check 0 errors, file mode 0600, 1,708,032 bytes. No customer or financial rows were imported. Historical 7.16 GB restored snapshot was not copied or modified.
- Runtime storage paths exist under `/var/lib/nexi/storage`, including `kyc-evidence` (the KYC adapter's expected key prefix) and `deposit-proofs`. Service user can write the scoped storage paths.
- Protected `/etc/nexi/backend.env` (root:service-group, 0640) contains only nonsecret staging configuration: localhost bind, port 3002, production CORS origins, local SQLite path/opt-in, loopback Redis URL, local Valkey socket, local async and local object-store flags. No Cloudflare secret values or Aiven credential were copied.
- Installed `/etc/systemd/system/nexi-api.service`; uses verified `dist/src/main.js`, service user, working directory, protected system, and scoped writable SQLite/storage paths. `systemd-analyze verify` passed.
- API unit remains disabled and inactive. `JWT_SECRET` is absent from its environment file; no placeholder or generated signing key was created. Do not start until the owner supplies the authorized production/staging secret securely and the remaining runtime configuration is confirmed.
- API Nginx vhost is staged in `/etc/nginx/sites-available/nexi-api.conf`, not enabled. Current global Nginx config passes `nginx -t`. Required Let's Encrypt certificate files are absent, so the staged TLS vhost has not been enabled/reloaded. Cloudflare DNS and routing remain unchanged.
- Existing Public, Admin and Nginx services remained active; local API is not exposed. Root filesystem has 7.3 GB free at this checkpoint.

## Source and verification receipts

- Existing branch proof reused: LocalAsync Nest integration 6/6; BullMQ failed-job replay transport 8/8 and journal 6/6; local async runtime 6/6 and socket integration 2/2; source typecheck and backend build pass. See existing evidence files and the preceding conversation checkpoint; unaffected suites were not rerun.
- Current API bootstrap-host and NEXI_VALKEY_URL parser changes were covered by focused tests (host config test; local async runtime 6/6 including rediss parsing); current backend typecheck/build passed before release copy.
- This checkpoint proves a staged candidate and local supporting service only. It does not prove API startup/readiness, Public/Admin/API parity, live-data equality, final backup/restore, financial cutover, DNS, or Cloudflare dependency retirement.

## Remaining gates

1. Securely provision an authorized JWT signing secret (do not retrieve Cloudflare secret values or invent one).
2. Confirm required market provider and remaining runtime secret/config inputs against live nonsecret Wrangler inventory and owner-approved secret source.
3. Once inputs exist, start API only on loopback; verify health/readiness and representative API/WebSocket routes against the empty staging DB, with no production financial writes.
4. Acquire/validate an API TLS certificate and verify staged Nginx configuration before enabling the vhost.
5. Continue mandatory Cloudflare dependency closure, final controlled live D1 delta, independent encrypted backup/restore, and application acceptance. Production cutover/DNS/retirement remain explicit owner gates.


## Superseding runtime package verification — 2026-10-16

The first candidate path above was retained but is no longer selected by `current`. A real production-only Prisma smoke found that generated D1 Prisma client modules require `@prisma/client-runtime-utils`, while `@prisma/client` was incorrectly declared only as a development dependency. A new regression test was observed RED, then GREEN after moving `@prisma/client` into production dependencies, pinned exactly to 7.3.0 to match the installed adapter/CLI lock set. The lockfile now places Prisma runtime utilities in production closure.

A fresh release was installed with `npm ci --omit=dev --legacy-peer-deps` (489 packages). Its first smoke found the generated D1 client copy was missing from `dist`; the repository Dockerfile explicitly copies `src/prisma/d1-client` to `dist/src/prisma/d1-client`. The candidate was completed with that exact generated client. No source build artifact was changed.

Candidate now selected by `/srv/nexi/backend/current`: `/srv/nexi/backend/releases/20261016T1735Z-9a41b2e3-prisma-runtimefix`. Previous release `20261016T1658Z-9a41b2e3-dirty` remains preserved. Current service remains inactive/disabled.

Runtime checks against the candidate:
- Actual `D1PrismaService` connected to the staged SQLite file and returned ready=true; SQLite 3.53.2; 96 tables; `journal_mode=wal`, `synchronous=2/FULL`, `foreign_keys=1`, `busy_timeout=5000`. No user rows were present.
- Actual BullMQ 6.3.15 + local Valkey Unix socket smoke completed one uniquely named disposable job; result accepted=true, state=completed, then queue was removed.
- Current release main entrypoint SHA256 remains `cd67b88c2f4a5674cda915cb7af24e1cb7493a60d16d5eedae8f063ea0886f10`; generated D1 client SHA256 `42130a5e4963d55d9fc3b0ee2416aa40767ed65df2ceea9f49e9521ba7d2683c`.

Cloudflare closure lane confirms live `NEXI_CONFIG` KV (0 keys but Worker still exposes KV CRUD handlers) and `NEXI_ANALYTICS` (active health telemetry writes and internal bridge route); the migration repo has no NestJS callers, but private Container clients are not ruled out. Keep bindings until those callers/telemetry replacements are resolved. Prior R2 three-object copy/hash proof remains reused; no recopy performed.

API startup remains blocked by absent authorized `JWT_SECRET`; API TLS vhost remains disabled because certificate files are absent. Public/Admin, Cloudflare production, DNS, and financial authority unchanged. Disk free at this checkpoint: 6.5 GB.


## Superseding readiness-authority release — 2026-10-16

- Source `backend/dist` includes the tested readiness fix: local mode reports `authority: SQLite`; source build output SHA256 for `dist/src/observability/readiness.service.js`: `2195129847410304bb4a82d1ec5ee1e32a01ed376b90ad468089145b54103ea4`.
- Staged a new versioned release `/srv/nexi/backend/releases/20261016T1810Z-9a41b2e3-readinessfix`; copied the generated D1 Prisma client per the existing Dockerfile contract and reused the verified production-only `node_modules` without mutating it. Preserved earlier releases.
- Actual production dependency smoke instantiated `D1PrismaService` on `/var/lib/nexi/sqlite/nexi-staging.sqlite`, then `ReadinessService`; result was `READY`, database=true, Redis test double=true, authority=`SQLite`, SQLite 3.53.2. The test used the empty staging DB and made no financial writes.
- Atomic `/srv/nexi/backend/current` pointer now selects this new release. `nexi-api.service` remains inactive; `nexi-valkey.service` and Nginx are active. The API readiness smoke is not a full HTTP/API startup or route-parity test.
