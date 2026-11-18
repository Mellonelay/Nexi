# NEXI SQLite Database Runbook

**Status:** Maintained SQLite operations reference, created November 15, 2026. The owner's current direction, live service/database state, and root/affected `AGENTS.md` supersede historical observations here. This is not a release-completion claim.

## 1. NEXI database authority

- Current promoted durable application and financial DB: `/var/lib/nexi/sqlite/nexi-staging.sqlite`. The historical name “staging” **does not** mean disposable test data.
- Backend: `/srv/nexi/backend`, service `nexi-api.service`, environment `/etc/nexi/backend.env`, runtime Node `/opt/nexi/runtime/node-v24.21.0/bin/node`.
- NestJS policy/Prisma 7 with better-sqlite3 is the financial and market persistence authority; Public Next.js and Admin TanStack access its APIs. Valkey/BullMQ and Socket.IO are transport, not financial truth.
- Preserve `LedgerAccount`, `LedgerPosting`, wallet/financial operations, audit, settlement, EventOutbox/Inbox, journal/workflow state, `MarketQuoteLatest` and `MarketKline`.
- **Current verified CLI (2026-11-15):** `/usr/local/bin/sqlite3` is SQLite **3.54.1** (source-built). The old `/usr/bin/sqlite3` executable and Debian `sqlite3` package were removed. Backend-linked better-sqlite3 previously reported SQLite **3.53.2**; the CLI upgrade does **not** upgrade the backend-linked engine. Distinct engines may have distinct compile options. Verify each separately before making compatibility claims.

## 2. Original market retention contract

- Historical Oct 11 commit `13b6ce5`: delete raw `MarketQuoteSnapshot` observations older than **72 hours**, default one minute, at most 1,000 rows/tick, feature-flag gated.
- Nov 15 source commit `6326913`: opt-in eight 1,000-row batches / minute and eight-second inter-batch budget. A source commit is **not** deployed-runtime evidence.
- Scheduler gates: `NEXI_SCHEDULER_ENABLED=true`, `NEXI_MARKET_QUOTE_RETENTION_ENABLED=true`, optional `NEXI_MARKET_QUOTE_RETENTION_CATCHUP_ENABLED=true`.
- Protected lineage: exclude snapshots whose pair + sequence match `MarketQuoteLatest`. Do not erase data referenced by active Binary settlement, replay/recovery, audits, ledgers, or wallets.
- `MarketKline`, `MarketQuoteLatest`, financial and durable audit tables are **not** retention candidates.
- `receivedAt` is ISO UTC text. Compare it to ISO UTC text cutoff, e.g. an application-computed `new Date(Date.now()-72*3600*1000).toISOString()`; SQLite `datetime('now')` uses a different textual format and is not an interchangeable lexical cutoff.

## 3. WAL, transactions and concurrency

- WAL mode supports multiple readers but only **one writer**. Concurrent writers yield `SQLITE_BUSY`. Long readers can block checkpoints. Do not spawn parallel deletion writers.
- Preserve foreign keys, application synchronous/durability behavior, idempotency and exact monetary precision. WAL/SHM are SQLite-owned and must never be removed as “cache.”
- A bounded `DELETE` statement is a transaction. Use the existing indexed owner; no second retention scheduler or separate financial writer.
- If the Backend is active, prefer its own scheduler; for owner-authorized maintenance, gracefully stop NEXI services and verify open connections are released before offline deletion.
- `PRAGMA wal_checkpoint(PASSIVE)` is nonblocking as feasible; `TRUNCATE` can wait for readers and may change WAL storage. Use only with controlled maintenance and a single SQLite writer.
- SQLite uses dynamic typing unless STRICT; financial decimal representation and ORM mappings must remain exact. Generated columns, expression indexes and optimizer transformations require proof before adoption.

## 4. Safe SQLite CLI (read-only by default)

```bash
DB=/var/lib/nexi/sqlite/nexi-staging.sqlite
sqlite3 -readonly "$DB" 'PRAGMA database_list; PRAGMA journal_mode; PRAGMA page_size; PRAGMA page_count; PRAGMA freelist_count; PRAGMA auto_vacuum;'
sqlite3 -readonly "$DB" 'PRAGMA table_info("MarketQuoteSnapshot"); PRAGMA index_list("MarketQuoteSnapshot");'
sqlite3 -readonly "$DB" 'SELECT COUNT(*) FROM "MarketQuoteLatest";'
sqlite3 -readonly "$DB" 'SELECT receivedAt FROM "MarketQuoteSnapshot" ORDER BY receivedAt ASC LIMIT 1;'
sqlite3 -readonly "$DB" '.schema MarketQuoteSnapshot'
df -hT /var/lib/nexi/sqlite
fuser -v "$DB"
```

SQLite shell dot-commands are separate from SQL; `.tables`, `.schema`, `.dbinfo`, `.backup`, `.dump`, `.eqp`, `.mode`, `.headers` and `.read` have distinct semantics. Avoid unrestricted `COUNT(*)`, `dbstat` and `integrity_check` against a 34 GB file during normal live operations.

```bash
sqlite3 -readonly "$DB" 'EXPLAIN QUERY PLAN SELECT rowid FROM "MarketQuoteSnapshot" WHERE receivedAt < "2026-11-12T00:00:00.000Z" ORDER BY receivedAt LIMIT 10;'
```

The timestamp above is illustrative, **not** a current deletion cutoff. The SQLite 3.54.1 CLI provides **`.diskused`**, officially introduced in SQLite 3.54.0 to replace the now-deprecated `sqlite3_analyzer`. For an adequately resourced maintenance inspection, use `/usr/local/bin/sqlite3 -readonly "$DB" '.diskused'`; this can scan a 34 GB file and is **not** an inexpensive health check. Auxiliary SQLite 3.54.1 tools retained at `/home/mellonelay1999/.local/share/nexi-sqlite-tools/3.54.1/` are `sqlite3`, `sqlite3_analyzer`, `sqldiff`, and `sqlite3_rsync`. Their presence does not imply an execution or database result.

## 5. Indexed bounded deletion (maintenance-only)

The native 2026-11-15 maintenance measured the indexed selection fast; deleting by `rowid` rather than forcing a second UUID lookup helped a 1,000-row batch complete. Correct predicate:

```sql
DELETE FROM "MarketQuoteSnapshot"
WHERE rowid IN (
  SELECT s.rowid
  FROM "MarketQuoteSnapshot" AS s INDEXED BY MarketQuoteSnapshot_receivedAt_idx
  LEFT JOIN "MarketQuoteLatest" AS latest
    ON latest."pairId" = s."pairId"
   AND latest."sequence" = s."sequence"
  WHERE s."receivedAt" < :iso_utc_cutoff
    AND latest."id" IS NULL
  ORDER BY s."receivedAt"
  LIMIT 1000
);
```

Use a real bound ISO UTC parameter. Execute one transaction at a time with a limited busy timeout, explicit receipt of SQLite `changes()`, disk headroom guard, and periodic WAL checkpoints. A time-out is **not proof of a committed deletion count**. Do not increase limits speculatively or disable SQLite integrity controls.

## 6. File size, freelists and physical recovery

- `page_size × page_count` is SQLite allocated size; `freelist_count` counts pages reusable internally. `auto_vacuum=NONE` means row deletion alone does not truncate the main file.
- `PRAGMA incremental_vacuum` is ineffective while auto-vacuum is NONE. Switching modes needs an intentional rebuild and may add write overhead.
- `VACUUM` rebuilds the database and can require up to roughly twice its size in extra disk space; do not run on a 34 GB database with ~1.6 GB free.
- `VACUUM INTO '/verified/other-volume/nexi-compacted.sqlite'` creates a compact copy on **a separately verified mounted volume**. The destination must not exist or be empty, and the original remains unchanged. Verify integrity, foreign keys, schemas, protected rows, file ownership and compatibility before replacing the authoritative original.
- Reclaiming a 34 GB file cannot be inferred from reclaiming a 34 MB WAL or an internal free-list. Confirm real filesystem bytes recovered with `stat`/`df`.
- The VM on Nov 15 had **one** ~61 GB ext4 root and no second data volume. Google service account lacked bucket-list permission and snapshot-list scopes. No external backup/compaction destination was verified. Do not invent a mount or run a rebuild that exhausts storage.

## 7. Controlled shutdown and restoration

Maintenance downtime requires **explicit current owner authorization**. NEXI database writer is `nexi-api.service`. Public and Admin may also be stopped during coordinated downtime.

```bash
sudo systemctl stop nexi-public.service
sudo systemctl stop nexi-admin.service
sudo systemctl stop nexi-api.service
sudo systemctl is-active nexi-api.service nexi-public.service nexi-admin.service
sudo fuser -v /var/lib/nexi/sqlite/nexi-staging.sqlite
```

Stop only affected services; retain SentinelX, SSH, Nginx and unrelated infrastructure. During offline maintenance keep all other writers/ingestion quiesced. **Before restoration, ensure the maintenance writer is closed**.

```bash
sudo systemctl start nexi-api.service
sudo systemctl start nexi-public.service
sudo systemctl start nexi-admin.service
sudo systemctl is-active nexi-api.service nexi-public.service nexi-admin.service
curl --max-time 5 -fsS http://127.0.0.1:3002/readyz
sudo journalctl -u nexi-api.service -n 60 --no-pager
```

Confirm the correct release SHA and runtime flags separately from a health response. Do not imply that a source-only scheduler patch is deployed.

## 8. Backup, integrity and failure recovery

Normal production operations should have a **verified consistent recovery copy**, made via SQLite backup API, `sqlite3 .backup`, or a quiesced snapshot that respects WAL. Do not copy a live .sqlite main file alone. Do not place a 34 GB copy on an almost-full root disk.

**Scoped owner exception, 2026-11-15:** The owner explicitly waived creation of a fresh backup for **expired raw market-quote cleanup only**. This does not permit financial deletion, corruption bypass, or overwriting the original DB with an unvalidated replacement.

For a completed offline recovery, validate `PRAGMA quick_check`, `integrity_check` where time/resources permit, `PRAGMA foreign_key_check`, protected table counts, required indexes, permissions and Prisma compatibility. A full check may be costly on tens of GB. If disk fills, stop new writes. Never report a timed-out or unexecuted integrity check as passing.

## 9. Page stats and optimizer

`EXPLAIN QUERY PLAN` confirms indexed range scan and protective join, not the runtime cost of the actual write. Current relevant indexes: `MarketQuoteSnapshot_receivedAt_idx` and `MarketQuoteLatest_pairId_key`. For detailed page usage, `dbstat` can report per-table and index pages but may take longer than a bounded maintenance window on a 34 GB DB. `sqlite_stat1` exists only after appropriate ANALYZE; do not assume populated statistics. Record actual elapsed time, WAL growth, free-list count and disk pressure.

## 10. Other SQLite features and tools

- Useful if warranted: JSON functions for payload inspection; aggregate/window functions for analytics; expression indexes, generated columns and STRICT tables only as a planned schema change; FTS5/FTS3 for text search; R-Tree for spatial indexing.
- Not required for this retention: Session change sets, RBU patch loader, FTS search, CSV virtual table, `carray`, `generate_series`, `spellfix1`, zipfile/sqlar, IEEE754, decimal, UINT collation and percentile extensions. Do not install extras just because SQLite supports them.
- `dbhash` is not a backup; the SQLite 3.54+ CLI `.diskused` reports storage usage, superseding the deprecated `sqlite3_analyzer`; `sqldiff` compares databases; `sqlite3_rsync` or remote copy requires verified version and destination; Fossil is SQLite's source control ecosystem. These are not automatic maintenance prerequisites.
- **2026-11-15 compilation cleanup receipt:** the isolated `.build-3.54.1` source/build directory and redundant `sqlite3.source-built` copy were removed after all three built binaries were confirmed byte-identical (SHA-256 `a292facc34fa8705167c19cdb0c0ec8df18423e5d422b08af708fca7a296503f`). This removed 28,232,590 file bytes; the installed `/usr/local/bin/sqlite3` and four auxiliary utilities were preserved. This is tooling-cache recovery only, **not database compaction**.
- For advanced incident diagnosis, consult official SQLite documentation on file format, VFS, VDBE, memory allocation, atomic commit, locking, optimizer, compile options, upgrade compatibility and corruption. No arbitrary compile-option or SQLite version changes.

## 11. Long-term maintenance and acceptance metrics

Monitor: oldest/latest snapshot time, rate of new market observations, committed expired-row removals per tick, retention errors, database bytes, WAL bytes, `page_count`, `freelist_count`, filesystem space, database service uptime. Cleanup must eventually exceed ingestion to reduce backlog. Track release SHA and scheduler flags; verify successful retention logs, not mere cron registration.

Maintenance completion requires (a) actual committed expired rows removed, (b) protected data preserved, (c) physical database file reduction on adequate storage, (d) measured filesystem bytes recovered, (e) services restored and healthy. If a required additional storage volume is unavailable, report this as a precise **physical-compaction blocker**, not a successful cleanup.

## 12. Official SQLite documentation consulted / reference index

- [Main site](https://www.sqlite.org/), [documentation index](https://www.sqlite.org/docs.html), [CLI full manual](https://www.sqlite.org/cli.html), [diskused utility](https://www.sqlite.org/diskusedfunc.html), [deprecated analyzer](https://www.sqlite.org/sqlanalyze.html).
- [SQL syntax](https://www.sqlite.org/lang.html), [PRAGMAs](https://www.sqlite.org/pragma.html), [functions](https://www.sqlite.org/lang_corefunc.html), [aggregates](https://www.sqlite.org/lang_aggfunc.html), [time](https://www.sqlite.org/lang_datefunc.html), [window](https://www.sqlite.org/windowfunctions.html), [datatypes](https://www.sqlite.org/datatype3.html), [generated columns](https://www.sqlite.org/gencol.html), [expression indexes](https://www.sqlite.org/expridx.html), [row values](https://www.sqlite.org/rowvalue.html), [STRICT](https://www.sqlite.org/stricttables.html).
- [WAL](https://www.sqlite.org/wal.html), [checkpoint API](https://www.sqlite.org/c3ref/wal_checkpoint_v2.html), [isolation](https://www.sqlite.org/isolation.html), [locking](https://www.sqlite.org/lockingv3.html), [atomic commit](https://www.sqlite.org/atomiccommit.html), [corruption prevention](https://www.sqlite.org/howtocorrupt.html), [temporary files](https://www.sqlite.org/tempfiles.html).
- [VACUUM](https://www.sqlite.org/lang_vacuum.html), [backup API](https://www.sqlite.org/backup.html), [DBSTAT](https://www.sqlite.org/dbstat.html), [query optimizer](https://www.sqlite.org/optoverview.html), [query planner](https://www.sqlite.org/queryplanner.html), [NGQP](https://www.sqlite.org/queryplanner-ng.html), [EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html).
- [JSON](https://www.sqlite.org/json1.html), [FTS5](https://www.sqlite.org/fts5.html), [FTS3](https://www.sqlite.org/fts3.html), [R-Tree](https://www.sqlite.org/rtree.html), [sessions](https://www.sqlite.org/sessionintro.html), [RBU](https://www.sqlite.org/rbu.html), [CSV](https://www.sqlite.org/csv.html), [carray](https://www.sqlite.org/carray.html), [series](https://www.sqlite.org/series.html), [spellfix1](https://www.sqlite.org/spellfix1.html), [zipfile](https://www.sqlite.org/zipfile.html).
- [Architecture](https://www.sqlite.org/arch.html), [VDBE opcodes](https://www.sqlite.org/opcode.html), [VFS](https://www.sqlite.org/vfs.html), [virtual tables](https://www.sqlite.org/vtab.html), [file format](https://www.sqlite.org/fileformat2.html), [compile options](https://www.sqlite.org/compile.html), [memory allocation](https://www.sqlite.org/malloc.html), [version changes](https://www.sqlite.org/changes.html).
- Some links in this reference index were surveyed via SQLite's official documentation index rather than fully read page-by-page. Consult the exact official page before applying its less-frequently-used feature.

## Historic evidence boundary

This maintained maintenance procedure preserves its original operational safeguards (sections 1–12). The former 2026-11-15/16 3.54.1 CLI encyclopedia, large table/page allocation snapshots, offline compaction chronology and older activation claims are recoverable with \`git show ed2496efaa63:docs/operations/NEXI_SQLITE_DATABASE_RUNBOOK.md\`. The last reported file size was 4,352,483,328 bytes; a full post-cleanup database integrity run was not completed. Treat every number as dated and re-check the running database before a new maintenance action. Financial records and the old owner waiver of a *new backup* for expired raw quote maintenance are not general deletion authorization.
