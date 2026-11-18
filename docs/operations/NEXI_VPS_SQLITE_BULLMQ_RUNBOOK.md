# NEXI — VPS / SQLite / BullMQ / Valkey operations

**Current operational constraints**, not an approval to stop services, alter data, change Aiven access, build or deploy. Check exact running revision and configuration first.

## Authority and locations
- Checkout \`/home/mellonelay1999/workspaces/Nexi\`; Backend \`/srv/nexi/backend/dist\` (\`nexi-api.service\`), Public \`/srv/nexi/public/current\`, Admin \`/srv/nexi/admin/current\`. Distinct per-app shared dependency stores and canonical Node 24.21.0 are defined in root/surface AGENTS.
- Promoted SQLite \`/var/lib/nexi/sqlite/nexi-staging.sqlite\` is financial and application truth; historical name 'staging' is **not** disposable. Backend Prisma 7 and native better-sqlite3 gateway use this same store. Preserve journals, WAL/SHM, protected financial tables, Ledger/audit/Outbox.
- BullMQ 6 / Aiven Valkey handles at-least-once transport for \`domain-events\`, \`notifications\` and \`integration-jobs\`, through source \`backend/src/jobs/local-async-runtime.service.ts\`. Configuration is gated; source registration doesn't prove workers are active. \`maxRetriesPerRequest\` differs for producer (bounded) and worker (null) and must not be 'fixed' by bulk config rewrites. Durable SQLite journal/Inbox identities prevent repeated business effects; job IDs are not permanent economic dedupe.
- Socket.IO/Redis Streams are post-commit projections. Nginx controls the three HTTPS hosts. Backend policy owns validation/settlement. Valkey can never replace SQLite or act as a second writer.

## Safety and read-only observation
Inspect service/process state with SentinelX allowed status/journal/read commands, current source hashes and explicit release markers. Use only bounded, read-only SQLite queries and monitor filesystem space before expensive scans. Never detach SQLite WAL/SHM; copying a live \`.sqlite\` main file alone is not a valid backup. One financial writer; do not run multiple cleanup workers.

Read-only SQL example:
\`\`\`sh
sqlite3 -readonly /var/lib/nexi/sqlite/nexi-staging.sqlite 'PRAGMA database_list; PRAGMA journal_mode; PRAGMA foreign_keys;'
\`\`\`

For the original 72-hour raw quote retention, current eligibility and 1,000-row bounded deletion must be rechecked against \`market-quote-retention.scheduler.ts\`. \`MarketKline\`, \`MarketQuoteLatest\`, settlement and Ledger rows are **not** generic cleanup targets. Historical 2026-11-16 physical file **4,352,483,328 bytes**, but never assume it remains that size. Source, query plan, disk pressure and actual committed deletion count are separate proof. [SQLite procedure](NEXI_SQLITE_DATABASE_RUNBOOK.md) contains safe maintenance syntax.

## Transport security
Aiven Valkey uses TLS (\`rediss://\`, certificate validation) with \`maxmemory-policy=noeviction\` where currently configured. The historical November 15 Aiven allowed CIDRs \`0.0.0.0/0\` and \`::/0\` were an explicit network-access exposure candidate; verify current provider configuration before claiming it persists or changing it. With noeviction, memory exhaustion can reject writes; watch queue backlog, stalled/failed jobs, pending journal age, reconnects, latency and used memory. Never run FLUSH/KEYS * or queue obliterate/clean as 'documentation maintenance'.

## Migration and release gate
Source migrator: \`backend/scripts/nexi_sqlite_release_migrate.py\`. Default read-only dry-run; applying schema changes requires independently approved quiescence, a verified consistent recovery copy and schema checks. No migration is authorized by this runbook.
Authorized build/release must separately verify source/remote synchronization, actual artifacts under three canonical outputs, process and Sentry release identity, negative authorization/idempotency and product acceptance. No source-only or Postman GET pass proves a deployed economic lifecycle. The November 17 running release is not evidence that November 18 market source was deployed.

Official docs: https://www.sqlite.org/wal.html ; https://www.sqlite.org/backup.html ; https://docs.bullmq.io/guide/going-to-production ; https://docs.bullmq.io/patterns/idempotent-jobs .
