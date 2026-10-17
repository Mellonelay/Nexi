#!/usr/bin/env python3
"""Exact-decimal, idempotent CAS migration for historical LoanRepayment rows.

Dry-run is the default. Live --apply requires the operator to confirm that
the service is quiesced and independent recovery has been verified.
This is the complete 0016 schema/backfill path; do not separately reapply
0016_loan_repayment_cas.sql to a database migrated through this script.
"""
import argparse
import decimal
import pathlib
import sqlite3
from collections import defaultdict

D = decimal.Decimal
decimal.getcontext().prec = 1024
decimal.getcontext().traps[decimal.Inexact] = True

def amount_value(row):
    raw = str(row["amountDecimal"] if row["amountDecimal"] is not None else "0")
    old = str(row["amount"] if row["amount"] is not None else "0")
    try:
        exact, legacy = D(raw), D(old)
    except decimal.InvalidOperation as error:
        raise ValueError("Invalid historical repayment decimal") from error
    if not all(v.is_finite() and v >= 0 for v in (exact, legacy)):
        raise ValueError("Invalid negative or nonfinite historical repayment")
    if exact != legacy:
        if exact == 0:
            return legacy  # old legacy row without decimal backfill
        raise ValueError("Conflicting historical repayment decimal representations")
    return exact

def canonical(value):
    text = format(value.normalize(), "f")
    return "0" if D(text) == 0 else text

def migrate(path, apply=False):
    path = pathlib.Path(path).expanduser().resolve(strict=True)
    if not path.is_file():
        raise ValueError("SQLite database path is not a file")
    db = sqlite3.connect(str(path) if apply else path.as_uri()+"?mode=ro", uri=not apply)
    db.row_factory = sqlite3.Row
    try:
        db.execute("PRAGMA busy_timeout=5000")
        if apply:
            db.execute("BEGIN IMMEDIATE")
        columns = {r["name"] for r in db.execute('PRAGMA table_info("LoanApplication")')}
        if not {"id", "totalRepaymentDecimal"}.issubset(columns):
            raise ValueError("Unexpected LoanApplication schema")
        repayment_cols = {r["name"] for r in db.execute('PRAGMA table_info("LoanRepayment")')}
        if not {"loanId","amount","amountDecimal"}.issubset(repayment_cols):
            raise ValueError("Unexpected LoanRepayment schema")
        loans = list(db.execute('SELECT "id","totalRepaymentDecimal" FROM "LoanApplication"'))
        known = {r["id"] for r in loans}
        cumulative = defaultdict(lambda: D(0))
        n = 0
        for row in db.execute('SELECT "loanId","amount","amountDecimal" FROM "LoanRepayment"'):
            if row["loanId"] not in known:
                raise ValueError("Orphan historical loan repayment")
            cumulative[row["loanId"]] += amount_value(row)
            n += 1
        for row in loans:
            outstanding = D(str(row["totalRepaymentDecimal"]))
            value = cumulative[row["id"]]
            if not outstanding.is_finite() or outstanding < 0 or value > outstanding:
                raise ValueError("Historical repayment exceeds valid contract total")
        has_column = "totalRepaidDecimal" in columns
        if has_column:
            for row in db.execute('SELECT "id","totalRepaidDecimal" FROM "LoanApplication"'):
                current = D(str(row["totalRepaidDecimal"]))
                if current != 0 and current != cumulative[row["id"]]:
                    raise ValueError("Existing CAS repayment total conflicts with history")
        if not apply:
            print(f"DRY_RUN loans={len(loans)} repayments={n} existing_cas_column={has_column}")
            return
        if not has_column:
            db.execute('ALTER TABLE "LoanApplication" ADD COLUMN "totalRepaidDecimal" TEXT NOT NULL DEFAULT \'0\'')
        for row in loans:
            db.execute('UPDATE "LoanApplication" SET "totalRepaidDecimal"=? WHERE "id"=?',
                       (canonical(cumulative[row["id"]]), row["id"]))
        for row in db.execute('SELECT "id","totalRepaidDecimal" FROM "LoanApplication"'):
            if D(str(row["totalRepaidDecimal"])) != cumulative[row["id"]]:
                raise ValueError("Backfill verification failed")
        db.commit()
        print(f"APPLIED loans={len(loans)} repayments={n} exact_decimal_backfill=yes")
    except BaseException:
        if db.in_transaction: db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", required=True)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--acknowledge-quiesced-and-backed-up", action="store_true")
    args = parser.parse_args()
    if args.apply and not args.acknowledge_quiesced_and_backed_up:
        parser.error("--apply requires --acknowledge-quiesced-and-backed-up")
    migrate(args.db, args.apply)
