# VPS NestJS Observe removal and runtime verification

Date: 2026-10-16 UTC. Source of implementation: Worker-0 worktree `/home/mellonelay1999/workspaces/Nexi-sqlite-migration`, branch `migration/sqlite-local-bridge`, HEAD `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`. The migration worktree remains dirty with existing implementation work preserved.

## Change

Removed the paid `@nestjs/observe` dependency and its app module/startup instrumentation from `backend/src/app.module.ts`, `backend/src/main.ts`, `backend/src/observe.ts`, package manifest and lockfiles. Removed its temporary focused configuration test. The prior Sentry instrumentation/import and protected Sentry configuration remain. VPS `/etc/nexi/backend.env` has no `OBSERVE_APP_KEY` or `OBSERVE_APP_SECRET` entries (presence check only); Cloudflare secrets were not changed.

## Build and static checks

- `npm run build`: exit 0; output log `/tmp/nexi-backend-build-observe-removed-20261017.log`.
- `fallow dead-code --format json --quiet --file src/app.module.ts --file src/main.ts`: total issues 0.
- `fallow health --complexity --format json --quiet src/app.module.ts`: 0 functions, 0 findings.
- `fallow health --complexity --format json --quiet src/main.ts`: 2 functions, 0 above-threshold findings.
- Backend source/compiled/manifest/lock search for `@nestjs/observe`, `ObserveModule`, `ObserveInstrument`, `hasObserveCredentials`, `OBSERVE_APP_`: no active references.
- `@sentry/nestjs` remains in manifest and compiled instrumentation.

## VPS installation and rollback

Installed the rebuilt `dist/src/app.module.js`, source map, `dist/src/main.js` and source map into canonical `/srv/nexi/backend`; removed active `dist/src/observe.{js,d.ts}` artifacts and updated canonical npm manifest/lock with `npm uninstall @nestjs/observe --package-lock-only --ignore-scripts --no-audit --no-fund`. Moved active module directory into `/srv/nexi/backend/rollback/observe-removal-20261017/node_modules/@nestjs/observe`; the existing release `/srv/nexi/backend/releases/20261016T1810Z-9a41b2e3-readinessfix` remains intact and retains its copy. Canonical systemd runs `/usr/local/bin/node /srv/nexi/backend/dist/src/main.js`, user `mellonelay1999`, host `127.0.0.1`, port `3002`. After restart the service is active, still disabled for boot; Nginx API site/TLS/DNS are unchanged.

## Runtime proof

The first immediate curl raced Nest initialization and was refused while no listener existed. The process subsequently bound on loopback. After the Observe module was removed from active `node_modules`, a cold `systemctl restart nexi-api.service` passed: `/readyz` reports READY with database=true, redis=true, authority=SQLite; Socket.IO polling handshake returned a session; prior same-candidate `/healthz` returned UP, `/market/prices` returned HTTP 200 and a real Socket.IO WebSocket client connected (`transport=websocket`). No Observe telemetry/auth errors (401/429) appeared in the inspected restart journal. This is controlled non-authoritative staging only; no financial write/cutover occurred.

## Current CLI and official documentation findings

Migration worktree: Nest CLI 12.0.8; Prisma CLI and resolved `@prisma/client` report 7.10.0; Socket.IO and client 4.8.4; Redis adapter 8.3.0; better-sqlite3 12.11.1. Canonical VPS installed packages: Nest core/websockets/platform-socket.io 12.0.3; Socket.IO 4.8.3; Redis adapter 8.3.0; Prisma CLI/client/adapter 7.3.0; better-sqlite3 12.11.1; Nest CLI is not installed in the production node_modules. The worktree npm lock resolves Nest 12.0.3 while pnpm lock resolves 12.1.3, and worktree Prisma CLI/client resolution differs from the declared 7.3.0 client/adapter pins. Lock/install reproducibility remains an explicit next item; this Observe removal did not upgrade versions.

Official docs checked with Context7, Exa and live Firecrawl: [NestJS gateways](https://docs.nestjs.com/websockets/gateways), [NestJS GraphQL quick start](https://docs.nestjs.com/graphql/quick-start), [@nestjs/websockets on npm](https://www.npmjs.com/package/@nestjs/websockets), [Socket.IO API overview](https://socket.io/docs/v4/tutorial/api-overview), [Socket.IO glossary](https://socket.io/docs/v4/glossary/), [emit cheatsheet](https://socket.io/docs/v4/emit-cheatsheet/), [Redis adapter](https://socket.io/docs/v4/redis-adapter/), [Prisma ORM v7 SQLite](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite), [Prisma Client v7](https://www.prisma.io/docs/orm/v7/prisma-client), [Prisma CLI v7](https://www.prisma.io/docs/cli/v7), and third-party [Nest API reference](https://api-references-nestjs.netlify.app/api). Docs confirm Nest gateways are providers and by default share the HTTP server port; Socket.IO Redis adapter uses Pub/Sub for cross-node broadcasts and requires protected TLS/authenticated Redis; Redis adapter does not support connection-state recovery, while the distinct Redis Streams adapter can resume after transient disconnect and supports Valkey. NEXI has no `@nestjs/graphql` dependency, so no GraphQL configuration or dependency was added. Prisma current docs default to v8 but preserve a v7 documentation path; NEXI stays on v7.
