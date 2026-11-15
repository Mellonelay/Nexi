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

## 13. Official SQLite 3.54.1 study map and operational interpretation (2026-11-15)

**Scope and evidence:** The live **CLI** is SQLite **3.54.1** at `/usr/local/bin/sqlite3`; the **NestJS better-sqlite3 engine** is a separate linked library (historically observed SQLite 3.53.2). Official documentation is not a blanket assertion that every feature/extension is compiled into either engine. Use `PRAGMA compile_options;`, `PRAGMA function_list;`, `PRAGMA module_list;`, `SELECT sqlite_version();` **for each actual connection** when relevant. The links below are an annotated study/reference map; reviewing a page or summary does not independently prove its behavior in NEXI production.

### SQL language, types, functions, and indexing
- [SQL syntax](https://www.sqlite.org/lang.html) covers `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `DELETE`, `RETURNING`, `SELECT`, `ON CONFLICT`, `UPSERT`, DDL, triggers and `EXPLAIN`. A `DELETE` removes logically selected rows in its transaction; it does **not** automatically shrink a database with `auto_vacuum=NONE`. `changes()` reports direct changes on the connection with documented trigger limitations; use committed transaction receipts, not a timeout or merely selected candidate count.
- [Core](https://www.sqlite.org/lang_corefunc.html) and [aggregate](https://www.sqlite.org/lang_aggfunc.html) functions: `typeof`, `coalesce`, `changes`, `count`, `sum`, `total`, `avg`, `group_concat`; aggregate ordering and floating-point behavior matter. Never substitute approximate floating-point sums for authoritative monetary ledger arithmetic.
- [Date/time](https://www.sqlite.org/lang_datefunc.html) functions: SQLite has no dedicated datetime storage class. ISO-8601 text, Julian day and Unix timestamps have distinct formats. NEXI `receivedAt` uses canonical UTC ISO text; keep deletion cutoffs in the **same normalized representation**. `datetime('now')` yields `YYYY-MM-DD HH:MM:SS`, not NEXI's `YYYY-MM-DDTHH:MM:SS.sssZ`.
- [Window functions](https://www.sqlite.org/windowfunctions.html), [generated columns](https://www.sqlite.org/gencol.html), [datatypes and affinity](https://www.sqlite.org/datatype3.html), [expression indexes](https://www.sqlite.org/expridx.html), [row values](https://www.sqlite.org/rowvalue.html), and [STRICT tables](https://www.sqlite.org/stricttables.html): available design choices, **not** permission to change current schema. Expression-index matches depend on query expressions; generated columns and STRICT migrations need explicit compatibility review. Guard monetary precision and ORM mappings.
- [Query optimizer](https://www.sqlite.org/optoverview.html), [query planner](https://www.sqlite.org/queryplanner.html), [next-generation planner](https://www.sqlite.org/queryplanner-ng.html), and [EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html): use bounded `EXPLAIN QUERY PLAN` and inspect actual indexes `pragma_index_list`/`pragma_index_xinfo`. Indexed `receivedAt` selection and the `MarketQuoteLatest(pairId, sequence)` protection check matter for quote cleanup. A read plan does not establish actual delete runtime; avoid costly `ANALYZE` on an almost-full root, prefer documented `PRAGMA optimize` only in an authorized phase.

### PRAGMAs and physical storage
- [PRAGMA reference](https://www.sqlite.org/pragma.html): useful **read-only queries** include `database_list`, `journal_mode`, `page_size`, `page_count`, `freelist_count`, `auto_vacuum`, `index_list`, `index_xinfo`, `table_xinfo`, `foreign_key_list`, `compile_options`, `quick_check` and `integrity_check` (last two potentially expensive). **Do not infer connection configuration** from a separate CLI. Some PRAGMAs mutate state (`wal_checkpoint`, `optimize`, `incremental_vacuum`, `user_version`, `foreign_keys`, `synchronous`, `journal_mode`, `writable_schema`); do not run them as read-only diagnostics. Unknown PRAGMA names can be silently ignored.
- [VACUUM](https://www.sqlite.org/lang_vacuum.html): repacks the database by rewriting it, requiring substantial spare space (possibly up to twice the source file). `VACUUM INTO` writes a separate compact database; do not replace the authoritative original without a verified destination, consistent validation, owner permission and rollback route. `auto_vacuum=NONE` leaves free pages on the freelist; `incremental_vacuum` cannot reclaim them without the necessary pointer-map mode.
- [DBSTAT](https://www.sqlite.org/dbstat.html) exposes B-tree page utilization; freelist pages are **not included** in its B-tree results. SQLite CLI 3.54+ [`.diskused`](https://www.sqlite.org/diskusedfunc.html) provides a storage usage summary and supersedes deprecated [`sqlite3_analyzer`](https://www.sqlite.org/sqlanalyze.html). These can scan substantial storage and should be measured offline in a sufficiently provisioned window.
- [WAL](https://www.sqlite.org/wal.html), [isolation](https://www.sqlite.org/isolation.html), [locking](https://www.sqlite.org/lockingv3.html), [atomic commit](https://www.sqlite.org/atomiccommit.html), [temporary files](https://www.sqlite.org/tempfiles.html) and [file format](https://www.sqlite.org/fileformat2.html): transactions expose committed snapshots; WAL allows concurrent readers but serializes writes. A hot journal/WAL is a recovery asset, never compilation cache. Temporary B-tree/sort/journal files and VACUUM reconstruction can exhaust an almost-full filesystem. The older `lockingv3` document primarily describes rollback journal locking; use the WAL document for WAL-specific mechanisms.
- [Backup API](https://www.sqlite.org/backup.html), [corruption scenarios](https://www.sqlite.org/howtocorrupt.html), and [defense against malicious input](https://www.sqlite.org/security.html): use a SQLite-aware backup/snapshot, not a casual copy of an active main file. Corruption risks include bad storage, OS/hardware behavior, concurrent unsynchronized file manipulation and improper WAL handling. For *untrusted SQL/database inputs*, SQLite documents defensive DB configuration, trusted-schema restrictions, resource limits, authorizers and progress handlers; adapt only after inspecting actual application integration. The old backup waiver applies **only** to expired raw-quote cleanup.

### Extensions and auxiliary utilities — catalog, not required NEXI dependencies
| Official source | What it provides | NEXI adoption boundary |
| --- | --- | --- |
| [JSON/JSONB](https://www.sqlite.org/json1.html) | JSON functions/operators and JSON tree traversal | Inspect payloads; no new financial-state store |
| [FTS5](https://www.sqlite.org/fts5.html), [FTS3/4](https://www.sqlite.org/fts3.html) | Full-text virtual tables, search indexes and tokenizer behavior | Only if an actual search feature owns the requirement |
| [R-Tree](https://www.sqlite.org/rtree.html) | Spatial indexes | Not needed for market snapshots |
| [Session changesets](https://www.sqlite.org/sessionintro.html), [RBU](https://www.sqlite.org/rbu.html) | Change capture / resumable bulk updates | Not a replacement for Ledger, Inbox/Outbox, or guarded migrations |
| [Loadable extensions](https://www.sqlite.org/loadext.html) | Loading compiled SQL functions or virtual tables | Loadability differs by build; no untrusted extension loading |
| [CSV](https://www.sqlite.org/csv.html), [carray](https://www.sqlite.org/carray.html), [generate_series](https://www.sqlite.org/series.html) | Virtual tables or table-valued helpers | Optional diagnostics only; compile/install availability not assumed |
| [spellfix1](https://www.sqlite.org/spellfix1.html), [zipfile](https://www.sqlite.org/zipfile.html) | Fuzzy search and archive access | Unrelated to quote retention |
| [IEEE754/floating-point](https://www.sqlite.org/floatingpoint.html), [decimal](https://www.sqlite.org/floatingpoint.html#the_decimal_extension) | Floating-point inspection and decimal helpers | Monetary state must keep established exact-decimal contract |
| [UINT collation](https://www.sqlite.org/uintcseq.html), [percentile](https://www.sqlite.org/percentile.html) | Numeric-aware text sort, statistical aggregates | CLI/loadable availability may differ from backend; no schema change |
| [sqldiff](https://www.sqlite.org/sqldiff.html), [sqlite3_rsync](https://www.sqlite.org/rsync.html), [dbhash](https://www.sqlite.org/dbhash.html) | Compare, transfer, checksum tools | Not backup/compaction shortcuts; remote destination and version must be verified |

### Internal architecture and platform reference
- [Architecture](https://www.sqlite.org/arch.html), [VDBE opcodes](https://www.sqlite.org/opcode.html), [VFS](https://www.sqlite.org/vfs.html), [virtual tables](https://www.sqlite.org/vtab.html), [dynamic allocation](https://www.sqlite.org/malloc.html), [custom builds and portability](https://www.sqlite.org/custombuild.html), [compile options](https://www.sqlite.org/compile.html), [debugging hints](https://www.sqlite.org/debugging.html), and [SQLite changes](https://www.sqlite.org/changes.html) describe engine/CLI internals and compatibility. These are **diagnostic references**, not reasons to rebuild the application library or enable extra modules.
- [Android SQLite bindings](https://www.sqlite.org/android/) describe bundling SQLite on Android rather than using OS SQLite; not relevant to the VPS backend. In-memory databases ([reference](https://www.sqlite.org/inmemorydb.html)) are connection-scoped and cannot replace financial truth.
- **Version checking:** inspect CLI `sqlite3 --version` and `PRAGMA compile_options` separately from Node's `better-sqlite3` `sqlite_version()`. Never infer the running application's SQLite patch version from the shell. Official release and migration references are living documents; record a new version only after live verification.

### Read-only versus maintenance-only command surface

```bash
DB=/var/lib/nexi/sqlite/nexi-staging.sqlite
/usr/local/bin/sqlite3 -readonly "$DB" 'PRAGMA page_size; PRAGMA page_count; PRAGMA freelist_count; PRAGMA auto_vacuum; PRAGMA journal_mode;'
/usr/local/bin/sqlite3 -readonly "$DB" 'PRAGMA compile_options;'
# HEAVY analysis — owner-authorized maintenance window, sufficient resources only:
/usr/local/bin/sqlite3 -readonly "$DB" '.diskused'
```

The `-readonly` CLI avoids application-level writes, but opening a WAL database can still involve SQLite sidecar coordination; do **not** interpret it as proof that the filesystem was untouched. `dbstat` / `.diskused` scans do not free space. **No DB compaction, SQLite integrity pass, or production maintenance is claimed from this documentation update.**


## 14. SQLite 3.54.1 installed command encyclopedia

**Authoritative scope:** 2026-11-15 exact installed VM shell `/usr/local/bin/sqlite3`. Collected its real `--help`, `.help`, `PRAGMA pragma_list`, `pragma_function_list`, `pragma_module_list`, `PRAGMA compile_options` via `:memory:` only. No production SQLite query or NEXI application test was executed for this appendix. See official [CLI](https://www.sqlite.org/cli.html), [SQL syntax](https://www.sqlite.org/lang.html), [PRAGMAs](https://www.sqlite.org/pragma.html), [docs categories](https://www.sqlite.org/docs.html).

### Exact commands to inspect THIS CLI

~~~bash
SQLITE=/usr/local/bin/sqlite3
DB=/var/lib/nexi/sqlite/nexi-staging.sqlite
"$SQLITE" --version
"$SQLITE" --help
"$SQLITE" -batch -noinit :memory: '.help'
"$SQLITE" -batch -noinit :memory: '.help -all'
"$SQLITE" -batch -noinit :memory: '.help diskused'
"$SQLITE" -batch -noinit :memory: '.help recover'
"$SQLITE" -batch -noinit :memory: '.help backup'
"$SQLITE" -batch -noinit :memory: '.dbconfig'
"$SQLITE" -batch -noinit :memory: '.version'
"$SQLITE" -batch -noinit :memory: 'PRAGMA pragma_list;'
"$SQLITE" -batch -noinit :memory: 'PRAGMA compile_options;'
"$SQLITE" -batch -noinit :memory: 'SELECT DISTINCT name FROM pragma_function_list ORDER BY name;'
"$SQLITE" -batch -noinit :memory: 'SELECT name FROM pragma_module_list ORDER BY name;'
~~~

**Shell semantics:** SQL statements end with `;`; special dot-commands begin on their own line and are not SQL. To combine, pass separate `-cmd` options or a script via stdin. Use `-readonly -ifexists` to avoid creating an incorrect DB or issuing normal writes. `-safe` is a separate security mode that may prohibit disk-backed opens; never assume it means the same as `-readonly`. `-noinit` prevents user startup script side effects; `-batch -bail` gives fail-fast non-interactive semantics. CLI dot commands such as `.backup`, `.restore`, `.import`, `.load`, `.shell`, `.read`, `.output` and `.save` can write or execute and are NOT diagnostic commands just because they start with a dot.

### Read-only NEXI inspection: exact commands

~~~bash
SQLITE=/usr/local/bin/sqlite3
DB=/var/lib/nexi/sqlite/nexi-staging.sqlite
stat -c '%n %s bytes' "$DB"
df -hT "$(dirname "$DB")"
systemctl is-active nexi-api.service nexi-public.service nexi-admin.service
"$SQLITE" -batch -bail -noinit -ifexists -readonly "$DB" 'PRAGMA database_list; PRAGMA journal_mode; PRAGMA page_size; PRAGMA page_count; PRAGMA freelist_count; PRAGMA auto_vacuum;'
"$SQLITE" -batch -bail -noinit -ifexists -readonly "$DB" 'PRAGMA table_xinfo("MarketQuoteSnapshot"); PRAGMA index_list("MarketQuoteSnapshot"); PRAGMA index_list("MarketQuoteLatest");'
"$SQLITE" -batch -bail -noinit -ifexists -readonly "$DB" '.schema MarketQuoteSnapshot'
"$SQLITE" -batch -bail -noinit -ifexists -readonly "$DB" '.indexes MarketQuoteSnapshot'
"$SQLITE" -batch -bail -noinit -ifexists -readonly "$DB" 'SELECT "receivedAt" FROM "MarketQuoteSnapshot" ORDER BY "receivedAt" LIMIT 1;'
~~~

These are documented recipes, **not executed** on the live NEXI DB in this task. Even queries with `LIMIT` may read substantial data unless an index proves efficient. The database filename contains 'staging' but is authoritative production financial truth. Reading a WAL-mode DB may involve filesystem sidecar coordination. CLI version is NOT proof of the backend's linked better-sqlite3 version.

### Exact query plan, ISO UTC, and bound parameter recipes

~~~bash
# Illustrative static timestamp; not an authorized deletion cutoff.
"$SQLITE" -batch -bail -noinit -ifexists -readonly "$DB" "EXPLAIN QUERY PLAN SELECT rowid FROM MarketQuoteSnapshot WHERE receivedAt < '2026-11-12T00:00:00.000Z' ORDER BY receivedAt LIMIT 1000;"
"$SQLITE" -batch -bail -noinit -ifexists -readonly "$DB" "SELECT name, type FROM pragma_table_list WHERE schema='main' LIMIT 25;"
"$SQLITE" -batch -noinit :memory: "SELECT sqlite_version(), datetime('now'), strftime('%Y-%m-%dT%H:%M:%fZ','now');"
~~~

`datetime('now')` yields a space-separated timestamp; NEXI `receivedAt` is UTC ISO with `T` and `Z`. A lexicographic comparison requires one normalized format. For parameterized SQL use an application prepared statement and bound ISO cutoff, not interpolated SQL or an unbound `:cutoff` placeholder. `.parameter init`, `.parameter set :cutoff ...`, `.parameter list` are CLI helpers on the SAME connection; inspect `.help parameter` first. `EXPLAIN QUERY PLAN` describes plan selection, not runtime cost. Official [date/time](https://www.sqlite.org/lang_datefunc.html), [planner](https://www.sqlite.org/eqp.html), [delete](https://www.sqlite.org/lang_delete.html), [expression indexes](https://www.sqlite.org/expridx.html).

### Expensive read-only analysis — not routine service health checks

~~~bash
# Execute only with bounded offline inspection and adequate resources:
"$SQLITE" -batch -noinit -ifexists -readonly "$DB" '.diskused'
"$SQLITE" -batch -noinit -ifexists -readonly "$DB"   'SELECT name, pageno AS pages, pgsize AS bytes FROM dbstat WHERE aggregate=TRUE ORDER BY pgsize DESC LIMIT 25;'
"$SQLITE" -batch -noinit -ifexists -readonly "$DB" 'PRAGMA quick_check;'
"$SQLITE" -batch -noinit -ifexists -readonly "$DB" 'PRAGMA integrity_check;'
"$SQLITE" -batch -noinit -ifexists -readonly "$DB" 'PRAGMA foreign_key_check;'
~~~

`.diskused` in SQLite 3.54 is the officially preferred replacement for deprecated `sqlite3_analyzer`. `dbstat` excludes freelist pages from B-tree statistics. `PRAGMA page_count * page_size` measures allocated DB bytes; `freelist_count` counts reusable DB pages, **not free filesystem bytes**. `PRAGMA auto_vacuum=NONE` means row deletions do not shrink the main file; `incremental_vacuum` is ineffective in that mode. Queries above can scan a ~34 GB file; none was run here. Official [diskused](https://www.sqlite.org/diskusedfunc.html), [dbstat](https://www.sqlite.org/dbstat.html), [vacuum](https://www.sqlite.org/lang_vacuum.html).

### Maintenance-only command grammar — examples, not current authorization

| Action | Exact SQL/dot-command | Boundary |
| --- | --- | --- |
| Data change | `BEGIN IMMEDIATE; DELETE FROM ...; COMMIT;` | Idempotent authorized writer; never delete ledger/latest quote/klines |
| WAL checkpoint | `PRAGMA wal_checkpoint(PASSIVE);` or `(TRUNCATE)` | Not read-only; active readers/write locks matter |
| Rewrite DB | `VACUUM;` | Can need up to ~2x original size free |
| Make compact copy | `VACUUM INTO '/verified/separate-volume/compact.sqlite';` | Verify real volume, capacity, consistency, permissions, restore path |
| Reclaim incremental pages | `PRAGMA incremental_vacuum(1000);` | Requires INCREMENTAL mode preconfigured |
| Change vacuum mode | `PRAGMA auto_vacuum=INCREMENTAL; VACUUM;` | Requires rebuild; not a quick current setting |
| Optimize statistics | `PRAGMA optimize;` | Can update planner statistics |
| Rebuild indexes | `REINDEX;` | Heavy write |
| Backup | `.backup /verified/destination/backup.sqlite` | Writes backup; valid capacity and owner authorization |
| Restore | `.restore /verified/backup.sqlite` | Destructive to target; separate formal recovery |
| Recover | `.recover` | Generates salvage SQL; does not establish consistency |
| Import data | `.import FILE TABLE` | Writes rows, may violate NEXI source authority |
| Load extension | `.load TRUSTED_LIBRARY` | Executes native code; not an ordinary query |

**Safety:** NEXI source-first and SQLite financial single-writer boundaries apply. Do not run `VACUUM` with only ~1.5 GiB free. Never unlink `.sqlite-wal`/`.sqlite-shm` as cache. Do not restart NEXI services as a documentation step. The scoped prior backup waiver applies to expired raw quotes only.

### Installed program inventory: all SQLite shell dot-commands

The following is generated directly from the installed executable's `.help`; **presence does not imply it is safe to execute**.


~~~text
.archive ...             Manage SQL archives
.auth ON|OFF             Show authorizer callbacks
.backup ?DB? FILE        Backup DB (default "main") to FILE
.bail on|off             Stop after hitting an error.  Default OFF
.cd DIRECTORY            Change the working directory to DIRECTORY
.changes on|off          Show number of rows changed by SQL
.check OPTIONS ...       Verify the results of a .testcase
.clone NEWDB             Clone data into NEWDB from the existing database
.connection [close] [#]  Open or close an auxiliary database connection
.crlf ?on|off?           Whether or not to use \r\n line endings
.databases               List names and files of attached databases
.dbconfig ?op? ?val?     List or change sqlite3_db_config() options
.dbinfo ?DB?             Show status information about the database
.dbtotxt                 Hex dump of the database file
.diskused ?SCHEMA?       Report database space and size stats
.dump ?OBJECTS?          Render database content as SQL
.echo on|off             Turn command echo on or off
.eqp on|off|full|...     Enable or disable automatic EXPLAIN QUERY PLAN
.excel                   Display the output of next command in spreadsheet
.exit ?CODE?             Exit this program with return-code CODE
.expert                  EXPERIMENTAL. Suggest indexes for queries
.explain ?on|off|auto?   Change the EXPLAIN formatting mode.  Default: auto
.filectrl CMD ...        Run various sqlite3_file_control() operations
.fullschema ?--indent?   Show schema and the content of sqlite_stat tables
.headers on|off          Turn display of headers on or off
.help ?-all? ?PATTERN?   Show help text for PATTERN
.import FILE TABLE       Import data from FILE into TABLE
.imposter INDEX TABLE    Create imposter table TABLE on index INDEX
.indexes ?PATTERN?       Show names of indexes matching PATTERN
.intck ?STEPS?           Run an incremental integrity check on the db
.limit ?LIMIT? ?VAL?     Display or change the value of an SQLITE_LIMIT
.lint OPTIONS            Report potential schema issues.
.load FILE ?ENTRY?       Load an extension library
.log FILE|on|off         Turn logging on or off.  FILE can be stderr/stdout
.mode ?MODE? ?OPTIONS?   Set output mode
.nonce STRING            Suspend safe mode for one command if nonce matches
.nullvalue STRING        Use STRING in place of NULL values
.once ?OPTIONS? ?FILE?   Output for the next SQL command only to FILE
.open ?OPTIONS? ?FILE?   Close existing database and reopen FILE
.output ?FILE?           Send output to FILE or stdout if FILE is omitted
.parameter CMD ...       Manage SQL parameter bindings
.print STRING...         Print literal STRING
.progress N              Invoke progress handler after every N opcodes
.prompt MAIN CONTINUE    Replace the standard prompts
.quit                    Stop interpreting input stream, exit if primary.
.read FILE               Read input from FILE or command output
.recover                 Recover as much data as possible from corrupt db.
.restore ?DB? FILE       Restore content of DB (default "main") from FILE
.save ?OPTIONS? FILE     Write database to FILE (an alias for .backup ...)
.scanstats on|off|est    Turn sqlite3_stmt_scanstatus() metrics on or off
.schema ?PATTERN?        Show the CREATE statements matching PATTERN
.sha3sum ...             Compute a SHA3 hash of database content
.shell CMD ARGS...       Run CMD ARGS... in a system shell
.stats ?ARG?             Show stats or turn stats on or off
.system CMD ARGS...      Run CMD ARGS... in a system shell
.tables ?TABLE?          List names of tables matching LIKE pattern TABLE
.testcase NAME           Begin a test case.
.timeout MS              Try opening locked tables for MS milliseconds
.timer on|off|once       Turn SQL timer on or off.
.trace ?OPTIONS?         Output each SQL statement as it is run
.version                 Show source, library and compiler versions
.vfsinfo ?AUX?           Information about the top-level VFS
.vfslist                 List all available VFSes
.vfsname ?AUX?           Print the name of the VFS stack
.www                     Display output of the next command in web browser
~~~

### Installed startup options (verbatim from `--help`)

~~~text
Usage: /usr/local/bin/sqlite3 [OPTIONS] [FILENAME [SQL...]]
FILENAME is the name of an SQLite database. A new database is created
if the file does not previously exist. Defaults to :memory:.
OPTIONS include:
   --                   treat no subsequent arguments as options
   -A ARGS...           run ".archive ARGS" and exit
   -append              append the database to the end of the file
   -ascii               set '.mode ascii'
   -bail                stop after hitting an error
   -batch               force batch I/O
   -box                 set '.mode box'
   -cmd COMMAND         run "COMMAND" before reading stdin
   -cmdline-edit BOOL   enable or disable command-line editing
   -column              set '.mode column'
   -csv                 set '.mode csv -limits off'
   -deserialize         open the database using sqlite3_deserialize()
   -echo                print inputs before execution
   -escape T            ctrl-char escape; T is one of: symbol, ascii, off
   -init FILENAME       read/process named file
   -[no]header          turn headers on or off
   -help                show this message
   -html                set '.mode html'
   -ifexists            only open if database already exists
   -interactive         force interactive I/O
   -json                set '.mode json'
   -line                set '.mode line'
   -list                set '.mode list'
   -lookaside SIZE N    use N entries of SZ bytes for lookaside memory
   -markdown            set '.mode markdown'
   -maxsize N           maximum size for a --deserialize database
   -memtrace            trace all memory allocations and deallocations
   -mmap N              default mmap size set to N
   -newline SEP         set output row separator. Default: '\n'
   -nofollow            refuse to open symbolic links to database files
   -noinit              Do not read the ~/.sqliterc file at startup
   -nonce STRING        set the safe-mode escape nonce
   -no-rowid-in-view    Disable rowid-in-view using sqlite3_config()
   -nullvalue TEXT      set text string for NULL values. Default ''
   -pagecache SIZE N    use N slots of SZ bytes each for page cache memory
   -pcachetrace         trace all page cache operations
   -quote               set '.mode quote'
   -readonly            open the database read-only
   -safe                enable safe-mode
   -screenwidth N       use N as the default screenwidth
   -separator SEP       set output column separator. Default: '|'
   -stats               print memory stats before each finalize
   -table               set '.mode table'
   -tabs                set '.mode tabs'
   -unsafe-testing      allow unsafe commands and modes for testing
   -version             show SQLite version
   -vfs NAME            use NAME as the default VFS
   -vfstrace            enable tracing of all VFS calls
   -zip                 open the file as a ZIP Archive
~~~

### Installed PRAGMA names from `PRAGMA pragma_list`

These are names, not safe forms. A bare value-query and an assignment/action can have very different effects. Unknown PRAGMAs may be silently ignored; see [official PRAGMA definitions](https://www.sqlite.org/pragma.html).

~~~text
analysis_limit  application_id  auto_vacuum  automatic_index  busy_timeout  cache_size  cache_spill  case_sensitive_like  cell_size_check  checkpoint_fullfsync  collation_list  compile_options  count_changes  data_version  database_list  default_cache_size  defer_foreign_keys  empty_result_callbacks  encoding  foreign_key_check  foreign_key_list  foreign_keys  freelist_count  full_column_names  fullfsync  function_list  hard_heap_limit  ignore_check_constraints  incremental_vacuum  index_info  index_list  index_xinfo  integrity_check  journal_mode  journal_size_limit  legacy_alter_table  locking_mode  max_page_count  mmap_size  module_list  optimize  page_count  page_size  pragma_list  query_only  quick_check  read_uncommitted  recursive_triggers  reverse_unordered_selects  schema_version  secure_delete  short_column_names  shrink_memory  soft_heap_limit  synchronous  table_info  table_list  table_xinfo  temp_store  temp_store_directory  threads  trusted_schema  user_version  wal_autocheckpoint  wal_checkpoint  writable_schema
~~~

**Common informational forms:** `PRAGMA page_count;` `PRAGMA page_size;` `PRAGMA freelist_count;` `PRAGMA auto_vacuum;` `PRAGMA journal_mode;` `PRAGMA compile_options;` `PRAGMA index_list('Table');` `PRAGMA table_xinfo('Table');` `PRAGMA function_list;` `PRAGMA module_list;` `PRAGMA foreign_key_list('Table');` `PRAGMA quick_check;` (heavy).

**Actions or state-changing forms:** `PRAGMA wal_checkpoint(...);` `PRAGMA optimize;` `PRAGMA incremental_vacuum(...);` `PRAGMA journal_mode=...;` `PRAGMA synchronous=...;` `PRAGMA foreign_keys=...;` `PRAGMA writable_schema=...;` `PRAGMA user_version=...;`. Do not run as documentation checks. Bare `PRAGMA wal_checkpoint;` is also not a harmless status query.

### Distinct SQL function names visible to this CLI

~~~text
->  ->>  abs  acos  acosh  asin  asinh  atan  atan2  atanh  avg  base64  base85  ceil  ceiling  changes  char  coalesce  concat  concat_ws  cos  cosh  count  cume_dist  current_date  current_time  current_timestamp  date  datetime  decimal  decimal_add  decimal_cmp  decimal_exp  decimal_mul  decimal_pow2  decimal_sub  decimal_sum  degrees  dense_rank  diskused  dtostr  edit  exp  first_value  floor  format  fts3_tokenizer  glob  group_concat  hex  ieee754  ieee754_exponent  ieee754_from_blob  ieee754_from_int  ieee754_inc  ieee754_mantissa  ieee754_to_blob  ieee754_to_int  if  ifnull  iif  instr  is_base85  json  json_array  json_array_insert  json_array_length  json_error_position  json_extract  json_group_array  json_group_object  json_insert  json_object  json_patch  json_pretty  json_quote  json_remove  json_replace  json_set  json_type  json_valid  jsonb  jsonb_array  jsonb_array_insert  jsonb_extract  jsonb_group_array  jsonb_group_object  jsonb_insert  jsonb_object  jsonb_patch  jsonb_remove  jsonb_replace  jsonb_set  julianday  lag  last_insert_rowid  last_value  lead  length  like  likelihood  likely  ln  load_extension  log  log10  log2  lower  lsmode  ltrim  match  matchinfo  max  median  min  mod  nth_value  ntile  nullif  octet_length  offsets  optimize  percent_rank  percentile  percentile_cont  percentile_disc  pi  pow  power  printf  quote  radians  random  randomblob  rank  readfile  realpath  regexp  regexpi  replace  round  row_number  rtreecheck  rtreedepth  rtreenode  rtrim  sha1  sha1_query  sha1b  sha3  sha3_agg  sha3_query  shell_add_schema  shell_complete_sql  shell_format_schema  shell_module_schema  shell_prompt_test  shell_putsnl  shell_temp_filename  sign  sin  sinh  snippet  sqlar_compress  sqlar_uncompress  sqlite_compileoption_get  sqlite_compileoption_used  sqlite_log  sqlite_offset  sqlite_source_id  sqlite_version  sqrt  stmtrand  strdup  strftime  string_agg  strtod  substr  substring  subtype  sum  tan  tanh  time  timediff  total  total_changes  trim  trunc  typeof  unhex  unicode  unistr  unistr_quote  unixepoch  unknown  unlikely  upper  usleep  writefile  zeroblob  zipfile  zipfile_cds
~~~

### Virtual table module names visible to this CLI

~~~text
bytecode  completion  dbstat  fsdir  fts3  fts3tokenize  fts4  fts4aux  generate_series  pragma_module_list  rtree  rtree_i32  sqlite_dbpage  sqlite_stmt  tables_used  zipfile
~~~

### Compilation options visible to this CLI

~~~text
ATOMIC_INTRINSICS=1
COMPILER=gcc-12.2.0
DEFAULT_AUTOVACUUM
DEFAULT_CACHE_SIZE=-2000
DEFAULT_FILE_FORMAT=4
DEFAULT_JOURNAL_SIZE_LIMIT=-1
DEFAULT_MMAP_SIZE=0
DEFAULT_PAGE_SIZE=4096
DEFAULT_PCACHE_INITSZ=20
DEFAULT_RECURSIVE_TRIGGERS
DEFAULT_SECTOR_SIZE=4096
DEFAULT_SYNCHRONOUS=2
DEFAULT_WAL_AUTOCHECKPOINT=1000
DEFAULT_WAL_SYNCHRONOUS=2
DEFAULT_WORKER_THREADS=0
DIRECT_OVERFLOW_READ
DQS=0
ENABLE_BYTECODE_VTAB
ENABLE_DBPAGE_VTAB
ENABLE_DBSTAT_VTAB
ENABLE_EXPLAIN_COMMENTS
ENABLE_FTS3
ENABLE_FTS4
ENABLE_MATH_FUNCTIONS
ENABLE_OFFSET_SQL_FUNC
ENABLE_PERCENTILE
ENABLE_RTREE
ENABLE_STMTVTAB
ENABLE_UNKNOWN_SQL_FUNCTION
MALLOC_SOFT_LIMIT=1024
MAX_ATTACHED=10
MAX_COLUMN=2000
MAX_COMPOUND_SELECT=500
MAX_DEFAULT_PAGE_SIZE=8192
MAX_EXPR_DEPTH=1000
MAX_FUNCTION_ARG=1000
MAX_LENGTH=1000000000
MAX_LIKE_PATTERN_LENGTH=50000
MAX_MMAP_SIZE=0x7fff0000
MAX_PAGE_COUNT=0xfffffffe
MAX_PAGE_SIZE=65536
MAX_SCHEMA=10000000
MAX_SQL_LENGTH=1000000000
MAX_TRIGGER_DEPTH=1000
MAX_VARIABLE_NUMBER=32766
MAX_VDBE_OP=250000000
MAX_WORKER_THREADS=8
MUTEX_PTHREADS
STRICT_SUBTYPE
SYSTEM_MALLOC
TEMP_STORE=1
THREADSAFE=1
~~~

**Direct inventory counts:** 65 CLI dot-commands; 66 PRAGMA names; 203 distinct SQL function names; 16 virtual table modules; 52 compile options. Executable: `3.54.1 2026-10-16 14:45:20 555e07ef33f69a0957d24d8e555b702464a131d6f1607f4c3c1e4551e8e6ca76 (64-bit)`.

### Official SQLite documentation categories and remaining coverage boundary

- **SQL language and functions:** [SQL syntax](https://www.sqlite.org/lang.html), [core](https://www.sqlite.org/lang_corefunc.html), [aggregates](https://www.sqlite.org/lang_aggfunc.html), [math](https://www.sqlite.org/lang_mathfunc.html), [window](https://www.sqlite.org/windowfunctions.html), [date/time](https://www.sqlite.org/lang_datefunc.html), [types](https://www.sqlite.org/datatype3.html), [generated columns](https://www.sqlite.org/gencol.html), [STRICT](https://www.sqlite.org/stricttables.html), [row values](https://www.sqlite.org/rowvalue.html), [expressions](https://www.sqlite.org/expridx.html).
- **Extensions:** [JSON/JSONB](https://www.sqlite.org/json1.html), [FTS5](https://www.sqlite.org/fts5.html), [FTS3/4](https://www.sqlite.org/fts3.html), [R-Tree](https://www.sqlite.org/rtree.html), [sessions](https://www.sqlite.org/sessionintro.html), [loadable extensions](https://www.sqlite.org/loadext.html), [RBU](https://www.sqlite.org/rbu.html), [CSV](https://www.sqlite.org/csv.html), [carray](https://www.sqlite.org/carray.html), [generate_series](https://www.sqlite.org/series.html), [spellfix1](https://www.sqlite.org/spellfix1.html), [zipfile](https://www.sqlite.org/zipfile.html), [IEEE754 and decimal](https://www.sqlite.org/floatingpoint.html), [UINT](https://www.sqlite.org/uintcseq.html), [percentile](https://www.sqlite.org/percentile.html). Optional extension present in official docs does NOT guarantee compiled/loaded on CLI or Node.
- **Storage and reliability:** [WAL](https://www.sqlite.org/wal.html), [locking](https://www.sqlite.org/lockingv3.html), [isolation](https://www.sqlite.org/isolation.html), [atomic commit](https://www.sqlite.org/atomiccommit.html), [backup API](https://www.sqlite.org/backup.html), [tempfiles](https://www.sqlite.org/tempfiles.html), [file format](https://www.sqlite.org/fileformat2.html), [corruption](https://www.sqlite.org/howtocorrupt.html), [security](https://www.sqlite.org/security.html), [memory](https://www.sqlite.org/malloc.html), [in-memory DB](https://www.sqlite.org/inmemorydb.html).
- **Internals and tools:** [architecture](https://www.sqlite.org/arch.html), [VDBE](https://www.sqlite.org/opcode.html), [VFS](https://www.sqlite.org/vfs.html), [virtual tables](https://www.sqlite.org/vtab.html), [optimizer](https://www.sqlite.org/optoverview.html), [NGQP](https://www.sqlite.org/queryplanner-ng.html), [compile options](https://www.sqlite.org/compile.html), [custom builds](https://www.sqlite.org/custombuild.html), [debugging hints](https://www.sqlite.org/debugging.html), [Android bindings](https://www.sqlite.org/android/), [release changes](https://www.sqlite.org/changes.html).
- **Entire official documentation navigation:** [docs index](https://www.sqlite.org/docs.html), [alphabetical index](https://www.sqlite.org/doclist.html), [keyword index](https://www.sqlite.org/keyword_index.html), [sitemap](https://www.sqlite.org/sitemap.html).

**Coverage statement:** This is a complete inventory of the commands/functions/modules advertised by the **installed CLI** at the time of inspection, combined with an annotated operational reference and direct official links. It does NOT assert every page of SQLite's entire documentation website was transcribed or all optional modules available to the backend. Only the in-memory inventory commands were executed. Database correctness, deletion, compaction and service behavior remain separate untested tasks.

## 15. SQLite maintenance result — 2026-11-15

Owner authorization for direct SQLite-only maintenance superseded the app source-first gate **for this operation only**. API writer was already stopped. No build, deployment or service restart took place. Main file is authoritative financial truth regardless of its staging filename.

**Before:** main database 34,550,140,928 bytes; 4096-byte pages, 8,435,093 pages, freelist zero, WAL mode, auto_vacuum=NONE, about 1.6 GB available on ext4 root. Raw snapshot timestamps range from August 25 to November 15; some receivedAt values end in Z and others in +00:00, so fully canonical lexical UTC representation cannot be assumed around an exact cutoff.

**72-hour retention source evidence:** backend/src/market/market-quote-retention.scheduler.ts explicitly specifies 72h and protects MarketQuoteLatest pair/sequence; Public prices read MarketQuoteLatest and charts use MarketKline. No ledger, settlement, latest-quote, or kline table was targeted.

**Committed DELETE:** 1,000 eligible rows in 58.18 seconds plus eight 1,000-row transactions in 465.76 seconds, totaling **9,000 rows**. Each transaction recorded changes()=1000, committed and followed by successful WAL checkpoint(TRUNCATE); latest pair/sequence excluded. The second operation used a 256 MiB SQLite cache and rowid-ordered selection; throughput remained ~58 seconds per 1,000 rows, so the optimization did not improve measurable performance.

**After:** main file **34,550,140,928 bytes unchanged**; freelist **1,161 pages = 4,755,456 bytes** reusable inside the DB. Physical file reduction **0 bytes**, attributable filesystem recovery **0 bytes**, no WAL bytes retained. Current root available capacity approximately 1.6 GB.

**Backlog:** an indexed capped query returned **1,000,001** historical snapshots for cutoff 2026-11-12T15:18:57.000Z; it establishes a lower bound, not an exact eligible-row count. Exact indexed count timed out at 300 seconds; another fresh-history count timed out at 70 seconds. Highest rowid 51,380,762 is not a row count. The full dbstat allocation scan was intentionally terminated after 287 seconds and roughly 3.2 GB of disk reads because of severe I/O pressure. Largest table/index sizes are therefore not measured. Small DBSTAT owners: sqlite_schema 122,880 bytes; MarketQuoteLatest 20,480; MarketQuoteLatest_pairId_key 4,096.

**Physical compaction blocker:** one ~61 GB ext4 root with ~1.6 GB free, no additional mounted block volume; /dev/shm is volatile 4 GB tmpfs, not a durable compaction destination. With auto_vacuum=NONE, incremental_vacuum cannot shrink the file, and both VACUUM and VACUUM INTO require independently adequate temporary/destination capacity. No safe physical compaction executed. The 342,663,168-byte pre-promotion SQLite archive was preserved because its contents were not established as disposable.

**Open:** an approved capacity-assisted compaction/rebuild and faster bulk historical cleanup are necessary. Repeating slow 1,000-row deletes is not a viable way to close a multi-million-row backlog. This operation did NOT complete the requested physical storage recovery. Keep NEXI API stopped until separately authorized.


### 2026-11-15 offline maintenance measured I/O boundary

- Source-validated retention: 72 hours of raw MarketQuoteSnapshot, preserving each MarketQuoteLatest pair/sequence lineage. Public getPrices reads MarketQuoteLatest and MarketKline rather than historical snapshots.
- Direct sqlite3 3.54.1 indexed 1,000-row transaction (cutoff 2026-11-12T15:56:09.126Z) committed 1,000 deletions in **98.12 seconds**. PRAGMA freelist_count increased from **1,161** to **1,295** pages (4 KiB each); main DB remained **34,550,140,928 bytes**. The journal WAL returned to zero bytes after connection exit.
- Query plan uses MarketQuoteSnapshot_receivedAt_idx and MarketQuoteLatest_pairId_key; deletion is nevertheless dominated by very slow random storage I/O (SQLite process observed in kernel folio_wait_bit_common). Index-backed COUNT of eligible rows failed to finish after **248.8 seconds** and was interrupted; whole-db dbstat aggregation failed to finish after **204.2 seconds** and was interrupted. Neither provides a valid total count or per-object byte allocation. Do not treat missing counts as zero.
- Main DB page_count=8,435,093, page_size=4,096, auto_vacuum=NONE; filesystem free ~1,605,214,208 bytes at end of attempt. No second mounted data volume was found. A full-size in-place VACUUM is not viable at this capacity, and an independent VACUUM INTO target was not available. Ordinary DELETE did not physically shrink the DB. No filesystem recovery is claimed.
- API service was verified inactive and not restarted. This is an incomplete maintenance attempt, not a successful backlog clearance or physical-space recovery. Do not launch unbounded delete/scan loops on this disk; a storage-capacity solution and measured viable compaction path are required first.

## 16. SQLite 3.54.1 CLI and measured storage / I/O — 2026-11-15

**Source evidence:** Fully reviewed owner-supplied MHTML copies of https://www.sqlite.org/cli.html (sections 1–24) and https://www.sqlite.org/cliprompt.html (sections 1–4); cross-checked official https://www.sqlite.org/diskusedfunc.html and https://www.sqlite.org/lang_vacuum.html against installed SQLite CLI 3.54.1.

**Important distinction:** The 3.54 CLI prompt features (SQLITE_PS1, SQLITE_PS2, .prompt --show, /r read-only flag, /x transaction flag and NO_COLOR) change only interactive status display. The CLI --safe option is NOT a read-only database guarantee. The -readonly option is the relevant database-open restriction. The .diskused command invokes diskused('main'), which is built on DBSTAT; it is a replacement for sqlite3_analyzer, not an alternative fast database-compaction engine. The .expert command is experimental; .intck, .selftest, .sha3sum, .dump, .clone, .recover and .backup can require large I/O; .clone uses VACUUM INTO.

**Allocation evidence:** Small DBSTAT results were verified against a read-only Python os.pread() parser of SQLite B-tree interior pages. MarketKline has 705 interior and 266,543 leaf pages: **267,248 x 4096 = 1,094,647,808 bytes** in its table B-tree, excluding its indexes and any overflow pages. MarketQuoteLatest table B-tree is 20,480 bytes; MarketQuoteLatest_pairId_key is 4,096 bytes; MarketTrade, MarketDepthSnapshot and MarketDepthLevel table B-trees are 4,096 bytes each. The Python parser is inspection only; it does not belong to the official SQLite maintenance interface, and any overflow pages must be independently counted.

**I/O evidence:** Main database file is 34,550,140,928 bytes; ext4 filefrag found **187,221 physical extents**. During one sampled storage scan the disk was 96.1% busy, completing 82.5 reads/s and 8.78 MB/s at 17.38 ms mean read latency. High IO pressure was also visible in /proc/pressure/io. Host is an e2-standard-2 GCE VM with one approximately 62-GB persistent block disk and approximately 1.595 GB free root filesystem capacity. Guest metadata does not establish its exact Persistent Disk tier; do not claim confirmed pd-standard. Google Cloud official sizing limits: https://docs.cloud.google.com/compute/docs/disks/performance. Gcloud compute disk enumeration reported insufficient authentication scopes: no authorized online disk enlargement was achieved.

**Constraints confirmed:** All three application services (nexi-api, nexi-public, nexi-admin) were checked inactive and were not restarted. Raw MarketQuoteSnapshot retention is 72 hours with MarketQuoteLatest pair/sequence protected; MarketKline data for candles is not eligible. SQLite auto_vacuum=NONE; incremental_vacuum does not shrink this existing DB. Ordinary VACUUM requires substantial working room; VACUUM INTO requires a separate durable destination sized to the compacted output. Do not treat /dev/shm, custom file-hole punching or dropping WAL as a durable reclamation workaround. No physical filesystem space recovered in the current investigation.

**Verification boundary:** The sizes above identify directly measured owners. MarketQuoteSnapshot, its large indexes and MarketKline indexes still need successfully completed bounded allocation measurement before giving a complete owner breakdown; unknown values are NOT zero. No application builds, restarts, financial changes, or database replacement were performed.

### Full major-table/index allocation closure — 2026-11-15

Read-only Python 3 B-tree interior-page traversal, cross-checked against native DBSTAT on small objects, accounted for the main database's twelve largest table/index trees. It counts B-tree internal/leaf pages, not independent overflow chains. No application SQL or financial mutation was executed to obtain these measurements.

| SQLite object | Measured allocated bytes |
| --- | ---: |
| MarketQuoteSnapshot | 20,236,169,216 |
| sqlite_autoindex_MarketQuoteSnapshot_1 | 2,632,331,264 |
| MarketQuoteSnapshot_pairId_sequence_key | 2,971,246,592 |
| MarketQuoteSnapshot_receivedAt_idx | 2,249,580,544 |
| MarketQuoteSnapshot_symbol_sequence_idx | 1,349,873,664 |
| MarketQuoteSnapshot_pairId_numericSequence_idx | 2,819,555,328 |
| **MarketQuoteSnapshot family total** | **32,258,756,608 (93.3679% of file)** |
| MarketKline | 1,094,647,808 |
| sqlite_autoindex_MarketKline_1 | 185,389,056 |
| MarketKline_receivedAt_idx | 149,004,288 |
| MarketKline_pairId_interval_openTime_key | 302,129,152 |
| MarketKline_symbol_interval_openTime_idx | 189,386,752 |
| MarketKline_interval_openTime_pairId_symbol_close_idx | 361,578,496 |
| **MarketKline family total** | **2,282,135,552 (6.6053% of file)** |
| **All remaining pages and objects (incl. freelist)** | **9,248,768 (0.0268% of file)** |
| **SQLite file** | **34,550,140,928 (100%)** |

Of the residual allocation, the most recently verified freelist was **1,295 x 4,096 = 5,304,320 bytes**, leaving at most **3,944,448 bytes** for other B-tree objects, overflow pages, page-format overhead and any other allocations not directly attributed here. These totals are direct allocated page-tree values; they do not measure live row payload or claim compacted output size. The hierarchy and pagecount reconcile to the byte-exact main database file.

**Actual retention cause, source plus effective config:** /etc/nexi/backend.env contains NEXI_SCHEDULER_ENABLED=true but **NEXI_MARKET_QUOTE_RETENTION_ENABLED=false**. backend/src/market/market-quote-retention.scheduler.ts requires BOTH flags true before removing raw snapshots. Thus 72-hour retention is a defined policy, NOT an activated process. The user expressly prohibited activation or restarting services during this maintenance task; the flags were inspected only and NOT changed. The market ingestion source writes a raw snapshot on accepted quotes, so with retention disabled these records accumulate. This is a concrete upstream cause of the 32.26 GB raw-quote footprint, separate from the disk I/O bottleneck.

**Compaction feasibility and risk:** The 2.282 GB presently allocated to the required Kline table and its indexes already exceeds the available ~1.595 GB filesystem free space; remaining recent raw-quote data and financial state must also be retained. The exact minimal packed size cannot be established from these current allocations alone, but there is no **verified** filesystem capacity for a safe compacted copy. Direct row DELETE leaves reusable pages while auto_vacuum=NONE; supported VACUUM/VACUUM INTO still require reconstruction, not CLI prompt or .diskused shortcuts. Existing GCE guest credentials cannot list/resize disks (insufficient authentication scopes). No replacement DB was attempted; main database size and physical filesystem recovery remain unchanged. Only a separately verified durable destination/capacity and managed low-risk migration can close physical recovery. Do not label the 32.26 GB raw historical allocation as immediately recoverable until retention is applied and the compacted copy is validated.

### 2026-11-16 — official sqlite-doc-3540100.zip reclamation review

**Corpus and scope:** The owner supplied `sqlite-doc-3540100.zip` (SQLite **3.54.1** documentation). Archive integrity verified, **1,048 ZIP entries**, **847 HTML documents**, **37,791,672 uncompressed bytes**. The user-side Python/BeautifulSoup corpus index records document names, headings, hyperlinks and per-file SHA-256 values. Relevant **primary sections inspected**: `fileformat2.html` §§1.2–1.8 (pages, freelist, pointer maps, overflow), `pragma.html` (`auto_vacuum`, `incremental_vacuum`, `freelist_count`, `journal_size_limit`, `wal_checkpoint`), `lang_vacuum.html` §§2–3, `rbu.html` §§1–3, `dbstat.html`, `diskusedfunc.html`, `cli.html`, `wal.html`, `tempfiles.html`, `backup.html`, `atomiccommit.html`, `lang_delete.html`, `c3ref/file_control.html`. Indexing all pages does **not** assert that every page was read in full.

**Newly identified supported alternative — SQLite RBU:** `rbu.html` documents **RBU Update** (table/index writes by index order; potentially far fewer random I/Os for large updates) and **RBU Vacuum** (resumable rebuild, approximately **final database size** in temporary disk space, rather than ordinary VACUUM's approximately twice final database size in the RBU comparison). **Both RBU update and RBU vacuum reject a target DB in WAL mode or containing expression indexes**; RBU Update additionally requires a separate RBU input DB, does not run triggers or enforce foreign-key/CHECK constraints, and identifies DELETEs by rowid or non-null primary key. RBU must be explicitly compiled (`SQLITE_ENABLE_RBU`); no standalone RBU executable/extension was located in current VM paths. Current NEXI DB uses WAL and has the explicit expression index `MarketQuoteSnapshot_pairId_numericSequence_idx ON MarketQuoteSnapshot(pairId, CAST(sequence AS INTEGER))`. Therefore **RBU is not directly applicable unchanged** and is NOT a presently verified safer fast deletion or space-recovery route. Do not drop the expression index, switch journaling, or bypass constraints merely to force RBU without independent migration/retention contract review and adequate durable capacity.

**Distinguish four outcomes:** SQL DELETE removes logical rows; SQLite freelist pages become available for later DB reuse; main DB logical length can shrink only through SQLite's supported mechanisms (VACUUM or appropriate auto-vacuum state, or a correctly rebuilt/replaced DB); physical file blocks are reclaimed only once the filesystem actually relinquishes them. The current database has `auto_vacuum=NONE` and **no pointer map for incremental vacuum**. The documented `PRAGMA incremental_vacuum` is not an in-place workaround for a populated NONE database; enabling auto-vacuum requires a VACUUM rebuild. WAL `checkpoint(TRUNCATE)` or `journal_size_limit` affects WAL/journal files, **not** the 34.55-GB main file. `.diskused` uses DBSTAT, and `.clone` relies on VACUUM INTO. `sqlite3_file_control()` delegates to the VFS and provides **no documented general-purpose safe free-page hole-punch operation for this DB**; direct truncation/punching/byte edits are excluded.

**Current measured capacity gate (read-only checkpoint, UTC 2026-11-15 19:24):** main file **34,550,140,928 bytes**, ext4 available **1,585,061,888 bytes**, WAL **0**, page count **8,435,093**, freelist **1,295**, page size **4,096**, `auto_vacuum=0`, `journal_mode=wal`, and all three NEXI app services **inactive**. Required MarketKline table + five indexes currently occupy **2,282,135,552 bytes**, while retained raw quotes and financial durable state must also survive. This allocated size is **not** a mathematically proven lower bound on packed output; actual compacted size remains unmeasured. Nonetheless no sufficiently sized **durable** replacement target has been verified. `/dev/shm` is volatile tmpfs, not a durable atomic swap/recovery copy. Guest GCE credentials previously returned `insufficient authentication scopes` for disk enumeration. Attempting a copy or one huge DELETE on the current nearly full filesystem risks `SQLITE_FULL` or journal/WAL exhaustion. **Do not mark physical shrink or historical deletion complete**; no physical space recovered in this task's ZIP-research pass.

**Controlled next execution boundary:** obtain verified durable capacity for a target using the owner-authorized cloud/storage channel (or independently prove a correctly preserved compacted output fits in existing free space), then use one coordinated SQLite writer: copy required schema/data including full ledger/journals/Klines, protected latest-lineage snapshots and 72-hour raw snapshots; validate foreign keys, invariants, schema/indexes, row counts and durable recovery, then atomically cut over only with adequate rollback path. Alternatively apply indexed age/lineage cleanup and `VACUUM INTO` when adequate destination space is available. No service restarts, scheduler activation, unsupported main-file modifications, or unverified financial mutation.


### 2026-11-15 capacity recovery: Graphify and swap cleanup

Owner authorized targeted VM cleanup to create durable working capacity for SQLite maintenance. Confirmed actual cleanup via SentinelX with no NEXI application service restart or database modification:

| Operation | Verified reclaimed bytes |
| --- | ---: |
| Uninstall inactive-for-project Graphify 0.9.108 via owner-user `uv tool uninstall graphifyy` after stopping four `@nexi-graphify-live`/`@nexi-knowledge` MCP bridge/processes | 1,772,474,368 |
| Successful `swapoff /swapfile`, removal of 4-GiB file and persistent `/etc/fstab` entry | 4,294,946,816 |
| Remove unreferenced September 2026 `worker0-graph/.venv` (no process or service reference); regenerate-able APT metadata; rotate/vacuum old systemd journal archives to retain ~160 MiB | 847,904,768 |
| **Sum of individually measured recovered blocks** | **6,915,325,952** |

**Final check at 2026-11-15 20:06 UTC:** root ext4 available **8,499,793,920 bytes**, used 53,993,869,312 bytes (87% reported); previously ~1.58 GB available. The authoritative SQLite main file remains **34,550,140,928 bytes** (WAL 0), so **zero of the above reclaimed bytes came from shrinking SQLite**. Backend, Public and Admin remain inactive. SentinelX service remains operational. The graphifyy tool and old Python virtualenv are absent; source `graphify-out/` and Knowledge v4 graph assets were preserved. Graphify MCP routes no longer function until the Graphify package is reinstalled: this deliberate owner-approved effect must be considered before returning to general source engineering.

**Operational memory tradeoff:** The 4-GiB disk swap is intentionally disabled (no active swap or fstab entry). The VM has 7.8 GiB RAM with ~4.8 GiB available at verification and cannot page to disk swap. The incomplete **1,265,614,848-byte** SQLite compaction candidate remains at `/dev/shm/nexi-compact-candidate-20261116.sqlite` on *volatile* tmpfs; its presence consumes RAM and it must NOT be considered a durable replacement or backup. It currently contains 104 recreated ordinary tables and a complete copied MarketKline row set but lacks the retained raw snapshots and secondary indexes/triggers; the original DB is authoritative. Confirm memory capacity and scratch durability before continuing any SQLite reconstruction. Avoid simultaneous large-memory jobs, and do not use a temporary staging copy for cutover until full validation and durable storage.


## 2026-11-16 — completed SQLite compact promotion and 20 GB operating standard

**Owner-authorized offline maintenance, runtime receipt**: `/var/lib/nexi/sqlite/.nexi-sqlite-recovery-20261116.json`. Promoted SQLite main DB at `/var/lib/nexi/sqlite/nexi-staging.sqlite`. Source preserved for validation until atomic `renameat2(RENAME_EXCHANGE)` exchange with compact candidate. Initial exchange validation encountered incorrect SQL quoting in the *validation command*; rollback was verified before retry. The corrected exchange and checks succeeded, then old file was unlinked and directory fsynced. Main SQL records were not edited in-place during cutover. **All Backend/Public/Admin services remain inactive.** An application build or live application runtime was not performed.

| Check | Verified result |
| --- | ---: |
| Original database logical bytes | 34,550,140,928 |
| Promoted main file logical bytes | **4,398,145,536** |
| Physical filesystem free gain measured around completed exchange | **34,552,397,824 bytes** |
| Root filesystem available immediately after | **38,653,337,600 bytes** |
| MarketQuoteSnapshot retained within 72-hour cutoff (20:16:29 UTC, 2026-11-12) | 3,606,100 |
| MarketKline candles retained, including historical interval 8h | 3,663,056 |
| Latest price pairs | 53 |
| Tables, indexes (including auto), triggers | 105, 310, 3 |
| Schema definitions (table/index/view/trigger SQL) | All 308 names and normalized SQL matched original |
| Small authoritative nonmarket tables | 102 table row counts and SHA-256 content verified equal |
| Full `PRAGMA integrity_check` | **ok** |
| `PRAGMA foreign_key_check` | **No violations** |
| `sqlite_sequence` | Exact source values preserved |
| SQLite `auto_vacuum`, journal | **INCREMENTAL (2), WAL** |
| Application services | **All inactive** |

**Post-promotion actual allocated B-tree owners**, measured by bounded read-only B-tree interior-page traversal (not a table-payload/overflow scan):

| Family | Table + five indexes |
| --- | ---: |
| `MarketQuoteSnapshot` | **2,167,382,016 bytes** |
| `MarketKline` | **2,221,518,848 bytes** |
| Other objects/free/residual | Approximately 9.24 MB |

Interval counts in the recovered database: 1m 3,197,244; 5m 287,355; 15m 96,395; 30m 48,623; 1h 25,101; 4h 6,539; 1d 1,559; historical 8h 240. **Do not delete any Kline history without new owner approval**. Existing Kline currently accounts for approximately 2.22 GB, with 1m dominant. Current 72-hour quote volume implies approximately **1.202 million rows/day**, **2.167 GB per 72 hours** for raw quote table plus five indexes, approximately **722 MB/day** of quote churn if that rate continues. This is inferred from the retained window, not a peak ingestion guarantee. Current normal main file ~4.40 GB, plus WAL; not a fixed maximum without a Kline retention policy.

**20 GB main+WAL operating thresholds**: warning at 12 GB, maintenance alert at 15 GB, critical alert at 18 GB; hard budget **20,000,000,000 bytes**, advisory not a write-rejection limit. Keep headroom for financial transactions and WAL spikes. Filesystem maintenance requires separate spare durable space for `VACUUM INTO` or validated snapshots; plan output size plus additional OS margin, rather than confuse the 20-GB DB *operating* budget with physical root volume capacity. Live code in `backend/src/market/market-quote-retention.scheduler.ts` measures main+WAL by filesystem stat each hour and logs budget alerts. No global quota denies legitimate financial writes.

**Retention source repairs (not deployed)**: use 2,500-row indexed commits each minute (3.60 million rows/day theoretical ceiling before protected rows and slow operations), optional owner-gated four-batch catch-up with existing eight-second between-batch budget; preserve `MarketQuoteLatest` pair+sequence in every deletion. Do not enable the old catch-up flag by default. Warn hourly when retention is disabled and global scheduling is active. After committed deletes, attempt bounded `PRAGMA incremental_vacuum(256)`; failure logs a warning without reversing committed deletion. The SQLite file must remain in INCREMENTAL mode. `getSnapshot` uses exact pair+sequence unique lookup instead of lexicographically ordering TEXT sequences. The effective /etc/nexi/backend.env normal retention flag was switched from false to true while all application services were stopped, and the aggressive catch-up flag remains disabled; *the source patch was unit-tested but is not deployed runtime proof*.

**Actual provider/source flow**: 53 configured assets, seven actively supported chart intervals (1m/5m/15m/30m/1h/4h/1d), and 240 legacy 8h rows that are retained without implying the active API supports 8h. `MarketIngestService` coalesces queued ticker/depth events per symbol/provider, bounds its queue at 256, uses eight concurrent processing workers, publishes depth/trades to Valkey as realtime-only; authoritative quote snapshot and latest projection writes occur in the existing NestJS market authority transaction. The Kline service upserts unique (pairId,interval,openTime) and aggregates higher intervals from one-minute input. `MarketQuoteLatest` and `MarketKline` support Public spot/prices/charts; Binary reads latest price projection. Avoid adding redundant raw depth/trade persistence without a demonstrated consumer.

**Storage growth**: measured snapshot family fixed near 2.17 GB for current 72-hour volume when properly expired, and currently retained Klines ~2.22 GB. Kline interval distribution includes ~3.20m 1m rows; indefinitely retaining all intervals means no permanent bounded DB size. If all 53 markets continuously produce every supported interval, new candle rows may reach 53 × (1440+288+96+48+24+6+1)=**100,859/day**; at currently measured average B-tree occupancy about **607 bytes/candle including indexes**, an upper-coverage scenario adds ~**61 MB/day** before WAL/free-space effects and future provider changes. This is a model, not observed daily intake. Investigate interval-based history policy before warning threshold is reached; no Kline deletion authorized.

**Runbook operations after owner-approved source deploy**:
1. Keep canonical database authoritative; do not create a competing writer or write directly to the financial ledger.
2. Confirm scheduler flags and that disabled-retention alerts are absent. Do not silently turn on aggressive catch-up.
3. Use `/usr/local/bin/sqlite3 -readonly /var/lib/nexi/sqlite/nexi-staging.sqlite 'PRAGMA page_count; PRAGMA freelist_count; PRAGMA auto_vacuum;'` for cheap page-level checks; combine `stat -c %s nexi-staging.sqlite nexi-staging.sqlite-wal` to monitor main+WAL. Financial writes must remain unblocked at 20 GB alerts.
4. `PRAGMA incremental_vacuum(N)` returns free pages to filesystem in bounded amounts only with INCREMENTAL autovacuum configured. WAL checkpoint `TRUNCATE` is separate from main file reclamation; do not delete active WAL/SHM manually.
5. `PRAGMA optimize;` is a SQLite statistics-maintenance tool, not a physical shrink command. `.diskused` can be expensive and is not a recurring low-cost health probe.
6. Record actual throughput, oldest eligible timestamp, WAL peaks and main+WAL size after deployment. If observed ingest exceeds 2,500 deletes/minute for prolonged periods, review bounded batching and backing storage I/O rather than let backlog grow silently.
7. Create a consistent off-host backup/recovery proof before production cutovers. An offline old-file deletion alone does not establish an independently recoverable disaster-recovery backup.

**No source change is equivalent to activation:** actual flags, tested runtime behavior, and deployment require subsequent owner authorization; the three application services were never restarted as part of this SQLite operation.


### 2026-11-16 — post-promotion retention performance and verified configuration

**Actual offline retention receipts**: `/var/lib/nexi/sqlite/.nexi-sqlite-20261116-retention-offline.json`. Fresh cutoff `2026-11-12T21:32:13.779Z`, with the 72-hour rule and pair+sequence lineage exclusion enforced in SQL. After compact promotion, two independent measured 2,500-row batches deleted 5,000 rows; the subsequent bounded cleanup committed **78,201** additional deletes in **32 batches** and about **224 seconds**. The final batch removed 701 rows (below the 2,500-row limit), establishing that no more unprotected rows satisfied the *frozen cutoff* at that checkpoint. **Total 83,201 additional expired rows** deleted after compaction promotion. Direct retained-row counts after the last cleanup are expensive on this disk; **3,522,899** is the mathematically reconciled count from the promotion count minus committed deletion receipts, not an independently scanned COUNT.

Physical reclamation: after the offline batch, main file `4,375,048,192` bytes, with 5,502 pages on SQLite freelist. The owner-authorized offline `PRAGMA incremental_vacuum; PRAGMA wal_checkpoint(TRUNCATE);` operation completed successfully, reduced freelist to **zero**, truncated the main file to **4,352,483,328 bytes**, and increased ext4 free bytes from **38,668,447,744** to **38,691,008,512** in this final step. Original pre-recovery DB **34,550,140,928 bytes**; final logical main-file reduction **30,197,657,600 bytes**. Actual physical ext4 free increase at the earlier atomic cutover alone was **34,552,397,824 bytes**, since both candidate and original occupied disk at that point; do not confuse the two baselines. A read-only `filefrag` inspection reported **49 ext4 extents**, versus **187,221** before rebuild. This is observed improvement in file layout, not conclusive proof of a specific Google Persistent Disk service tier.

**Retention performance:** Original extremely fragmented 34.55-GB DB: 1,000-row deletion previously took ~98 seconds. New compacted DB: one 2,500-row indexed/lineage-aware delete plus bounded 256-page incremental vacuum took **18.61 seconds**; a 2,500-row rowid-based delete alone took **14.82 seconds**, followed by incremental vacuum; subsequent 78,201 deletes completed in ~224 seconds (~349 deleted rows/sec average during offline catch-up as range shrank). Thus large deletion transactions remain I/O-sensitive, despite actual storage and throughput improvement. Do **not** enable high-volume catch-up without live event-loop and latency evidence. Normal scheduler budget is 2,500 rows/minute, maximum **3,600,000/day** in an ideal uninterrupted minute cadence, approximately three times the recent observed 1.202m/day ingestion. This is a theoretical scheduling ceiling, not guaranteed throughput under load.

**Effective config after source unit verification (no services started):** `NEXI_SCHEDULER_ENABLED=true`; `NEXI_MARKET_QUOTE_RETENTION_ENABLED=true`; optional aggressive `NEXI_MARKET_QUOTE_RETENTION_CATCHUP_ENABLED` is **unset/disabled** in `/etc/nexi/backend.env`. File owner/mode retained. The NestJS source includes hourly warning when retention disabled, hourly combined main+WAL advisory thresholds at 12/15/18 GB, bounded 2,500-row cleanup, and `PRAGMA incremental_vacuum(256)` after committed deletes. All three app services remain **inactive**, and no new application build/deployment was performed: the source patch is tested, not activated runtime. The actual generated Prisma 7/better-sqlite3 adapter was separately exercised against an in-memory SQLite DB, confirming `$queryRawUnsafe('PRAGMA incremental_vacuum(256)')` executes successfully; that fixture had no free pages and is not production timing evidence. Focused Jest source tests: **2 suites / 20 tests PASS**.

**Integrity proof layers:** The reconstructed candidate passed full `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, schema/trigger/index counts, 102 authoritative non-market table data SHA comparisons, protected quote lineage checks, and sample retained market rows *before cutover*. Atomic cutover post-swap foreign-key check passed. A combined full post-cleanup validation statement hit a **400-second read-I/O timeout without reporting an SQLite integrity error**; this is *not* a post-cleanup full integrity PASS. Follow-up targeted check results must be recorded separately when available. Neither the source test receipts nor SQLite verification establish a launched API or released frontend.

**History/retention policy:** Preserve all existing Klines, including 240 historical `8h` observations. Seven supported intervals are `1m`, `5m`, `15m`, `30m`, `1h`, `4h` and `1d`. Do not silently delete any candle history to meet 20 GB. Owner decision required before any tiered Kline policy. Current footprint approximately 4.35 GB. Runtime 20-GB policy is advisory; no financial write block. Graphify and disk swap restoration remains explicitly deferred until after this SQLite task; this runbook does not authorize restoring or modifying either.


### 2026-11-16 — final post-cleanup targeted validation and allocation

After 83,201 confirmed additional expired raw-quote deletes and final incremental vacuum, read-only verified physical B-tree allocation is **2,121,777,152 bytes** for `MarketQuoteSnapshot` (table + 5 indexes), **2,221,518,848 bytes** for `MarketKline` (table + 5 indexes), **9,187,328 bytes** residual, and total main file **4,352,483,328 bytes**. Machine-readable allocation receipt: `/var/lib/nexi/sqlite/.nexi-sqlite-20261116-final-allocation.json`.

**Validation after last write**: `PRAGMA foreign_key_check('MarketQuoteSnapshot')` returned no rows in 27.19 seconds; `PRAGMA quick_check('MarketQuoteSnapshot')` returned **ok** in 175.61 seconds. A *full* `PRAGMA integrity_check` on the reconstructed candidate passed **before** the last 83,201 deletions; combined full post-cleanup verification timed out after 400 seconds due to substantial read-I/O pressure and did not produce a pass/fail output. Do not inflate this into a final full-DB integrity pass. Application services have remained inactive. No other financial rows were altered during offline deletion; 102 source-to-candidate table SHA-256 comparisons pre-cutover confirmed exact preserved authoritative data.

Source regression checks: two focused Jest suites, **20 tests PASS**, including exact pair+sequence lineage, bounded quote retirement, disabled-retention alerting, WAL-inclusive 20-GB monitoring, and tolerated incremental-vacuum failure after committed DELETE. Independently probed Prisma 7 generated client and actual `PrismaBetterSqlite3` adapter using a separate in-memory DB: `$queryRawUnsafe('PRAGMA incremental_vacuum(256)')` succeeded. Source-only checks do not show live Backend behavior because owner prohibited app rebuild/restart/deployment.
