# Backend graceful-shutdown adapter fix — 2026-10-23

**Source baseline:** `bdb24005e3a50116a36e8b624a9957d25751e011` plus the uncommitted changes listed here.
**Scope:** NestJS Socket.IO adapter shutdown contract. No database, dependency, service, or deployment change.

## Diagnosis and change

- Installed runtime is NestJS Core 12.0.3. Its shutdown sequence awaits module destroy hooks, `beforeApplicationShutdown`, then `NestApplication.dispose()`; application shutdown hooks run only after disposal.
- `NestApplication.dispose()` awaits `SocketModule.close()` before closing the HTTP adapter. `SocketModule.close()` calls `IoAdapter.close(server)` for each Socket.IO server, then `IoAdapter.dispose()`.
- The custom `RedisIoAdapter.close()` previously overrode Nest's `close(server)` with a no-argument method. Nest therefore passed the Socket.IO server, but the override ignored it and only closed the Redis client. Socket.IO did not close its namespaces/transports before the shared HTTP server close. This matches the observed old service log sequence: `beforeApplicationShutdown` appeared, `onApplicationShutdown` did not, and systemd killed the process at its shutdown timeout. The precise runtime wait is source-confirmed; a controlled stop/restart has not been performed to prove the repaired process exits cleanly.
- `backend/src/prisma/redis-io.adapter.ts` now delegates `close(server)` to Nest's Socket.IO adapter and releases its Redis client in `dispose()`. The no-argument `close()` path remains available to the existing lifecycle cleanup. The Redis quit timeout is unreferenced and cleared when it wins or loses, avoiding a leftover timer after successful close.
- `backend/test/prisma/redis-io.adapter.spec.ts` first failed against the prior implementation because the Socket.IO server's close callback was never called. It also covers the no-argument cleanup path still used by `RuntimeLifecycleService`.

## Skills and tools applied

- Read and applied Agent Skills `using-agent-skills`, Context Engineering, Test-Driven Development, and Debugging and Error Recovery; Ponytail; NestJS Code Audit; NestJS Professional Software Engineering and implementation-verification; Vibe shared workflow, Vibe Backend, and Vibe Redis.
- Inspected installed NestJS 12.0.3 `NestApplicationContext`, `NestApplication`, `SocketModule`, `IoAdapter`, Socket.IO server shutdown, and Socket.IO Redis Streams adapter close behavior.
- Graphify CLI was refreshed with `graphify update . --no-cluster`; its current `explain RedisIoAdapter` output includes the new `dispose()` method and focused test. The earlier cloud graph snapshot was at baseline `bdb2400` and was used for pre-edit topology only.
- Fallow 3.30.0 changed-code analysis scoped to Backend reported 8 findings, including the two framework-overridden adapter methods as unused class members. Analysis was degraded because the generated 4.5 MB Prisma WASM JavaScript file was skipped; dependency findings were also marked incomplete. Treat this as a risk signal, not a clean pass or a basis for removing dependencies/methods.

## Verification

- RED: `cd backend && NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand test/prisma/redis-io.adapter.spec.ts` — failed before the fix: expected the Socket.IO server close callback once, received zero calls.
- GREEN: same focused command — PASS, 1 suite / 2 tests.
- `cd backend && ./node_modules/.bin/tsc -p tsconfig.build.json --noEmit --pretty false` — PASS, exit 0.
- `git diff --check` — PASS.
- No Backend production build, service stop/restart, deployment, browser check, or production data operation was performed. Current deployed artifacts remain separate from this uncommitted source.

## Status

The close-method mismatch is source-implemented, statically validated, and focused-tested. Runtime shutdown after the fix remains unverified until an authorized maintenance window. The pre-existing Learn authorization/transaction changes are separately documented in [the Learn evidence receipt](nexi-backend-learn-authorization-outbox-20261023.md).
