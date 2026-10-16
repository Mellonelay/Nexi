# BullMQ failed-job replay slice — 2026-10-16

Scope: isolated migration worktree; no production services or data touched.

## Official contracts read

Read the full supplied BullMQ v6 connections, queues, NestJS, Queue API, and production guides, plus the ioredis reconnect section and its surrounding README contract.

- BullMQ Queue producers use bounded maxRetriesPerRequest; enableOfflineQueue: false makes Redis unavailability fail the enqueue promptly. SQLite journal rows remain pending and are retried by the local dispatcher.
- BullMQ Workers use maxRetriesPerRequest: null so a running worker waits through Redis reconnect. Worker and Queue resources are closed on Nest module shutdown.
- BullMQ prefix owns queue key namespacing; do not combine it with ioredis keyPrefix.
- Queue add accepts a serializable data payload and job options. A retained job ID suppresses duplicate additions, so replay must create a different ID. Queue can accept jobs before a Worker starts.
- Production guidance calls for Redis persistence, noeviction, error handlers, graceful shutdown, bounded payloads, and retained failed jobs for inspection. Local stage inspection reported noeviction, AOF enabled, appendfsync everysec.
- ioredis reconnects by default with a capped retry strategy; maxRetriesPerRequest: null waits indefinitely, while bounded producer retries avoid indefinite request waits.
- NestJS queue integration documents BullModule, registerQueue, Processor/WorkerHost; current runtime also directly constructs BullMQ Queue/Worker inside its Nest provider. Installed versions: BullMQ 6.3.15, @nestjs/bullmq 12.0.0, ioredis 5.10.1.

Sources:
- https://docs.bullmq.io/guide/connections
- https://docs.bullmq.io/guide/queues/
- https://docs.bullmq.io/guide/nestjs/
- https://docs.bullmq.io/api/classes/v6.Queue.html
- https://docs.bullmq.io/guide/going-to-production
- https://www.npmjs.com/package/ioredis#Auto-reconnect

## Implemented contract

- The existing LocalDurableJob SQLite journal remains delivery authority. Replay history and generation changes share the bridge's existing atomic batch transaction.
- Replay is conditional on state and expected generation. It preserves total attempts and prior error metadata, resets only per-generation attempts, and creates a new BullMQ job ID.
- The retained old BullMQ job remains inspectable; a later generation does not collide with it. BullMQ receives only the journal ID, not the event payload.
- Producer Queue connections use the private Unix socket, bounded retries, and disabled offline queue; queue connection errors are logged without payload or credential details. Worker connections retain maxRetriesPerRequest: null.
- Startup checks the additive journal/replay schema and fails closed when replay-history schema is missing.

## Verification recorded in the active session

- test/jobs/local-async-runtime.integration.ts + test/jobs/durable-queue.integration.ts: 2 suites, 8 tests passed against isolated SQLite and the private stage Valkey Unix socket (RDC PID 1653382).
- test/jobs/local-durable-job.store.spec.ts: 1 suite, 6 tests passed (RDC PID 1653537).
- node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json: exit 0 (RDC PID 1653499).
- git diff --check: exit 0.
- Tests are isolated source/runtime evidence; they are not production deployment or financial cutover acceptance.

## Review limitation

The attempted Fallow review discovered 96 changed branch files and generated coverage output, despite the requested slice diff. It also warned that node_modules was absent in its review environment, degrading dependency classification. Treat its output as a broad structural risk signal only, not as a scoped clean verdict. Direct source review confirmed atomic replay history/reset, generation fencing, safe queue payloads, bounded producer behavior, and graceful resource closure. Full branch review remains open.
