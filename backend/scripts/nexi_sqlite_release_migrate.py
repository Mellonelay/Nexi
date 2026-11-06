#!/usr/bin/env python3
"""Dry-run-first ordered SQLite release migration for NEXI migrations 0016-0020.

Uses the existing guarded 0016/0017 migrators, then applies additive 0018-0020
DDL and reconciles d1_migrations. Any interrupted sequence is safe to rerun.
"""
import argparse, pathlib, re, sqlite3, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "prisma/migrations-d1"
EARLY = [
    (16, "0016_loan_repayment_cas.sql", ROOT / "scripts/loan-repayment-cas-migrate.py"),
    (17, "0017_binary_research_controls.sql", ROOT / "scripts/binary_research_controls_migrate.py"),
]
LATE = [(18, "0018_loan_plan_currency.sql"), (19, "0019_admin_operator_alerts.sql"),
        (20, "0020_deposit_qualification_referral_policy.sql")]
ALTER = re.compile(r'^ALTER\s+TABLE\s+["`]?([\w]+)["`]?\s+ADD\s+COLUMN\s+["`]?([\w]+)["`]?\s+(.+)$', re.I | re.S)
CREATE = re.compile(r'^CREATE\s+(TABLE|(?:UNIQUE\s+)?INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([\w]+)', re.I)

def split_sql(path):
    source = "\n".join(line for line in path.read_text().splitlines() if not line.strip().startswith("--"))
    return [s.strip() for s in source.split(";") if s.strip()]

def norm(sql):
    sql = re.sub(r'\bIF\s+NOT\s+EXISTS\b', '', sql or '', flags=re.I)
    return " ".join(sql.split()).casefold()

def run_prior(script, db, apply):
    cmd = [sys.executable, str(script), "--db", str(db)]
    if apply:
        cmd += ["--apply", "--acknowledge-quiesced-and-backed-up"]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(f"{script.name}: {(p.stderr or p.stdout).strip()}")
    return p.stdout.strip()

def column(db, table, name):
    row = next((r for r in db.execute(f'PRAGMA table_info("{table}")') if r["name"] == name), None)
    if row is None: return None
    return (str(row["type"]).upper(), int(row["notnull"]),
            str(row["dflt_value"]).strip() if row["dflt_value"] is not None else None)

def expected(definition):
    m = re.match(r'^\s*(TEXT|INTEGER|REAL|BLOB|NUMERIC|DATETIME)(?:\s+(NOT\s+NULL))?(?:\s+DEFAULT\s+(.+?))?\s*$', definition, re.I)
    if not m: raise ValueError(f"unsupported column definition: {definition}")
    return (m.group(1).upper(), int(bool(m.group(2))), m.group(3).strip() if m.group(3) else None)

def journal(db):
    if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='d1_migrations'").fetchone():
        raise ValueError("d1_migrations is missing")
    expected_rows = [(i, n) for i, n, _ in EARLY] + [(i, n) for i, n in LATE]
    applied = set()
    for i, name in expected_rows:
        rows = list(db.execute("SELECT id,name FROM d1_migrations WHERE id=? OR name=?", (i, name)))
        if rows:
            if len(rows) != 1 or (int(rows[0]["id"]), str(rows[0]["name"])) != (i, name):
                raise ValueError(f"migration journal conflict: {i} {name}")
            applied.add(i)
    return applied

def pending_ddl(db, applied):
    pending = []
    for mid, filename in LATE:
        for sql in split_sql(MIGRATIONS / filename):
            m = ALTER.match(sql)
            if m:
                table, col, definition = m.groups()
                if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone():
                    raise ValueError(f"required table is missing: {table}")
                actual, wanted = column(db, table, col), expected(definition)
                if actual is None: pending.append((mid, sql))
                elif actual != wanted: raise ValueError(f"incompatible column {table}.{col}: {actual} != {wanted}")
                continue
            m = CREATE.match(sql)
            if not m: raise ValueError(f"unsupported migration SQL: {sql[:100]}")
            kind, name = m.groups()
            typ = "table" if kind.upper() == "TABLE" else "index"
            row = db.execute("SELECT sql FROM sqlite_master WHERE type=? AND name=?", (typ, name)).fetchone()
            if row is None: pending.append((mid, sql))
            elif norm(row["sql"]) != norm(sql): raise ValueError(f"incompatible existing {typ}: {name}")
    if any(mid in applied for mid, _ in pending):
        raise ValueError("migration journal says applied but required schema objects are absent")
    return pending

def migrate(path, apply=False, acknowledge=False):
    if apply and not acknowledge: raise ValueError("--apply requires --acknowledge-quiesced-and-backed-up")
    dbpath = pathlib.Path(path).expanduser().resolve(strict=True)
    prior = [run_prior(script, dbpath, False) for _, _, script in EARLY]
    ro = sqlite3.connect(dbpath.as_uri()+"?mode=ro", uri=True, timeout=5); ro.row_factory = sqlite3.Row
    try:
        ro.execute("PRAGMA query_only=ON"); ro.execute("PRAGMA busy_timeout=5000")
        applied = journal(ro); pending = pending_ddl(ro, applied)
        if not apply:
            print("DRY_RUN order=0016,0017,0018,0019,0020")
            print("\n".join(prior))
            print(f"DRY_RUN additive_statements={len(pending)} journal_entries=5; no changes made")
            return
    finally: ro.close()
    for _, _, script in EARLY: print(run_prior(script, dbpath, True))
    db = sqlite3.connect(str(dbpath), timeout=5); db.row_factory = sqlite3.Row
    try:
        db.execute("PRAGMA busy_timeout=5000"); db.execute("BEGIN IMMEDIATE")
        applied = journal(db); pending = pending_ddl(db, applied)
        for _, sql in pending: db.execute(sql)
        if pending_ddl(db, applied): raise ValueError("post-migration schema verification failed")
        for i, name, *_ in EARLY:
            if i not in applied: db.execute("INSERT INTO d1_migrations(id,name,applied_at) VALUES(?,?,CURRENT_TIMESTAMP)", (i,name))
        for i, name in LATE:
            if i not in applied: db.execute("INSERT INTO d1_migrations(id,name,applied_at) VALUES(?,?,CURRENT_TIMESTAMP)", (i,name))
        db.commit(); print("APPLIED migrations=0016-0020 journal=verified")
    except BaseException:
        if db.in_transaction: db.rollback()
        raise
    finally: db.close()

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--db", required=True); p.add_argument("--apply", action="store_true")
    p.add_argument("--acknowledge-quiesced-and-backed-up", action="store_true")
    a = p.parse_args()
    try: migrate(a.db, a.apply, a.acknowledge_quiesced_and_backed_up)
    except (OSError, sqlite3.Error, ValueError, RuntimeError) as e: p.exit(1, f"migration stopped: {e}\n")

if __name__ == "__main__": main()
