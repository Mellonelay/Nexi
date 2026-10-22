#!/usr/bin/env python3
"""Dry-run-first, atomic schema migration for Binary research controls.

Rolling application code back leaves these additive columns and their values intact.
"""

import argparse
import pathlib
import re
import sqlite3
import sys


MIGRATION_FILE = pathlib.Path(__file__).resolve().parents[1] / "prisma/migrations-d1/0017_binary_research_controls.sql"
EXPECTED = {
    "User": {"binaryResearchDefault": ("TEXT", 1, "NORMAL")},
    "Gate2BinaryPosition": {
        "researchDefault": ("TEXT", 1, "NORMAL"),
        "researchOverride": ("TEXT", 0, None),
        "researchControlVersion": ("INTEGER", 1, "0"),
    },
}
ALTER_TARGET = re.compile(
    r'^\s*ALTER\s+TABLE\s+["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?'
    r'\s+ADD\s+COLUMN\s+["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?\b',
    re.IGNORECASE,
)


def normalize_default(value):
    if value is None:
        return None
    result = str(value).strip()
    if len(result) >= 2 and result[0] == result[-1] == "'":
        return result[1:-1]
    return result


def inspect_schema(db):
    present = 0
    expected_count = sum(len(columns) for columns in EXPECTED.values())
    for table, expected_columns in EXPECTED.items():
        exists = db.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)
        ).fetchone()
        if not exists:
            raise ValueError(f"required table is missing: {table}")
        columns = {row["name"]: row for row in db.execute(f'PRAGMA table_info("{table}")')}
        for name, definition in expected_columns.items():
            column = columns.get(name)
            if column is None:
                continue
            present += 1
            actual = (
                str(column["type"]).upper(),
                int(column["notnull"]),
                normalize_default(column["dflt_value"]),
            )
            if actual != definition:
                raise ValueError(f"unexpected definition for {table}.{name}: {actual}")
    if present == 0:
        return "READY"
    if present == expected_count:
        return "ALREADY_APPLIED"
    raise ValueError("partial Binary research-control schema; stop for manual recovery")


def migration_statements(path):
    source = path.read_text(encoding="utf-8")
    source = "\n".join(line for line in source.splitlines() if not line.strip().startswith("--"))
    statements = [part.strip() for part in source.split(";") if part.strip()]
    targets = []
    for statement in statements:
        match = ALTER_TARGET.match(statement)
        if not match:
            raise ValueError("migration must contain only the expected additive ALTER statements")
        targets.append((match.group(1), match.group(2)))
    expected_targets = {(table, column) for table, columns in EXPECTED.items() for column in columns}
    if len(targets) != len(expected_targets) or set(targets) != expected_targets:
        raise ValueError("migration statements do not match the expected Binary research columns")
    return statements


def migrate(path, apply=False, acknowledge=False):
    if apply and not acknowledge:
        raise ValueError("--apply requires --acknowledge-quiesced-and-backed-up")
    database = pathlib.Path(path).expanduser().resolve(strict=True)
    if not database.is_file():
        raise ValueError("SQLite database path is not a file")
    if apply:
        db = sqlite3.connect(str(database), timeout=5)
    else:
        db = sqlite3.connect(database.as_uri() + "?mode=ro", uri=True, timeout=5)
    db.row_factory = sqlite3.Row
    try:
        db.execute("PRAGMA busy_timeout=5000")
        if apply:
            db.execute("BEGIN IMMEDIATE")
        else:
            db.execute("PRAGMA query_only=ON")
        state = inspect_schema(db)
        if state == "ALREADY_APPLIED":
            if db.in_transaction:
                db.rollback()
            print("ALREADY_APPLIED schema_matches=yes; no changes made")
            return state
        if not apply:
            print("DRY_RUN state=READY; no changes made")
            return state

        for statement in migration_statements(MIGRATION_FILE):
            db.execute(statement)
        if inspect_schema(db) != "ALREADY_APPLIED":
            raise ValueError("post-migration schema verification failed")
        db.commit()
        print("APPLIED columns=4 transaction=committed")
        return "APPLIED"
    except BaseException:
        if db.in_transaction:
            db.rollback()
        raise
    finally:
        db.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", required=True, help="SQLite database file")
    parser.add_argument("--apply", action="store_true", help="apply after acquiring a write lock")
    parser.add_argument(
        "--acknowledge-quiesced-and-backed-up",
        action="store_true",
        help="confirm the service is quiesced and a protected recovery backup is verified",
    )
    args = parser.parse_args(argv)
    try:
        migrate(args.db, apply=args.apply, acknowledge=args.acknowledge_quiesced_and_backed_up)
        return 0
    except (OSError, sqlite3.Error, ValueError) as error:
        print(f"MIGRATION_ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
