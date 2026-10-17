import pathlib
import sqlite3
import subprocess
import sys
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[2] / "scripts" / "loan-repayment-cas-migrate.py"

def fixture(filename):
    db = sqlite3.connect(filename)
    db.executescript("""
    CREATE TABLE LoanApplication(id TEXT PRIMARY KEY,totalRepaymentDecimal TEXT NOT NULL);
    CREATE TABLE LoanRepayment(id TEXT PRIMARY KEY,loanId TEXT,amount TEXT,amountDecimal TEXT);
    INSERT INTO LoanApplication VALUES ('loan-1','1');
    INSERT INTO LoanApplication VALUES ('loan-2','110');
    INSERT INTO LoanApplication VALUES ('loan-3','10');
    INSERT INTO LoanRepayment VALUES ('repay-1','loan-1','0.1','0.1');
    INSERT INTO LoanRepayment VALUES ('repay-2','loan-1','0.2','0.2');
    INSERT INTO LoanRepayment VALUES ('repay-3','loan-2','110','110');
    """)
    db.close()

def execute(path, apply=False, consent=True):
    args = [sys.executable, str(SCRIPT), "--db", str(path)]
    if apply:
        args.append("--apply")
        if consent:
            args.append("--acknowledge-quiesced-and-backed-up")
    return subprocess.run(args, capture_output=True, text=True)

class LoanCasMigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="nexi-loan-migrate-")
        self.path = pathlib.Path(self.temp.name) / "fixture.sqlite"
        fixture(self.path)

    def tearDown(self):
        self.temp.cleanup()

    def columns(self):
        db = sqlite3.connect(self.path)
        columns = [row[1] for row in db.execute('PRAGMA table_info("LoanApplication")')]
        db.close()
        return columns

    def test_dry_run_leaves_schema_unchanged(self):
        result = execute(self.path)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("totalRepaidDecimal", self.columns())

    def test_exact_backfill_and_repeat_apply(self):
        for _ in range(2):
            result = execute(self.path, apply=True)
            self.assertEqual(result.returncode, 0, result.stderr)
        db = sqlite3.connect(self.path)
        self.assertEqual(
            db.execute("SELECT id,totalRepaidDecimal FROM LoanApplication ORDER BY id").fetchall(),
            [("loan-1","0.3"), ("loan-2","110"), ("loan-3","0")],
        )
        db.close()

    def test_legacy_decimal_zero_uses_exact_legacy_amount(self):
        db = sqlite3.connect(self.path)
        db.execute("UPDATE LoanRepayment SET amountDecimal='0' WHERE id='repay-3'")
        db.commit(); db.close()
        self.assertEqual(execute(self.path, apply=True).returncode, 0)
        db = sqlite3.connect(self.path)
        self.assertEqual(db.execute("SELECT totalRepaidDecimal FROM LoanApplication WHERE id='loan-2'").fetchone()[0], '110')
        db.close()

    def test_high_precision_decimal_sum_not_floating_point(self):
        one = '0.0000000000000000000000000000001'
        two = '0.0000000000000000000000000000002'
        db = sqlite3.connect(self.path)
        db.execute("UPDATE LoanRepayment SET amount=?,amountDecimal=? WHERE id='repay-1'", (one, one))
        db.execute("UPDATE LoanRepayment SET amount=?,amountDecimal=? WHERE id='repay-2'", (two, two))
        db.commit(); db.close()
        self.assertEqual(execute(self.path, apply=True).returncode, 0)
        db = sqlite3.connect(self.path)
        self.assertEqual(db.execute("SELECT totalRepaidDecimal FROM LoanApplication WHERE id='loan-1'").fetchone()[0], '0.0000000000000000000000000000003')
        db.close()

    def test_mutation_requires_explicit_operator_acknowledgment(self):
        result = execute(self.path, apply=True, consent=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("totalRepaidDecimal", self.columns())

    def test_corrupt_history_prevents_partial_schema_change(self):
        db = sqlite3.connect(self.path)
        db.execute("UPDATE LoanRepayment SET amountDecimal='invalid' WHERE id='repay-1'")
        db.commit()
        db.close()
        result = execute(self.path, apply=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("totalRepaidDecimal", self.columns())

if __name__ == "__main__":
    unittest.main()
