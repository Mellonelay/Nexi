import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "backend/scripts/nexi_sqlite_release_migrate.py"


class NEXISQLiteReleaseMigrationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="nexi-release-migrate-")
        self.db_path = Path(self.temp.name) / "fixture.sqlite"
        with sqlite3.connect(self.db_path) as db:
            db.executescript("""
                CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);
                CREATE TABLE LoanPlan (id TEXT PRIMARY KEY);
                CREATE TABLE LoanApplication (
                    id TEXT PRIMARY KEY, totalRepaymentDecimal TEXT NOT NULL
                );
                CREATE TABLE LoanRepayment (
                    loanId TEXT NOT NULL, amount TEXT NOT NULL, amountDecimal TEXT NOT NULL
                );
                CREATE TABLE User (id TEXT PRIMARY KEY);
                CREATE TABLE Gate2BinaryPosition (id TEXT PRIMARY KEY);
                CREATE TABLE UserVipState (id TEXT PRIMARY KEY, userId TEXT NOT NULL, vipLevel INTEGER NOT NULL);
                INSERT INTO d1_migrations VALUES (15,'0015_referral_reward_activity.sql','2026-10-13');
                INSERT INTO LoanApplication VALUES ('loan-1','1');
                INSERT INTO LoanRepayment VALUES ('loan-1','0.3','0.3');
                INSERT INTO User VALUES ('user-1');
                INSERT INTO Gate2BinaryPosition VALUES ('pos-1');
            """)

    def tearDown(self):
        self.temp.cleanup()

    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--db", str(self.db_path), *args],
            capture_output=True, text=True, check=False,
        )

    def test_dry_run_does_not_change_schema_or_journal(self):
        result = self.run_cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("DRY_RUN additive_statements=", result.stdout)
        with sqlite3.connect(self.db_path) as db:
            self.assertEqual(db.execute("SELECT id,name FROM d1_migrations ORDER BY id").fetchall(),
                             [(15, "0015_referral_reward_activity.sql")])
            self.assertNotIn("currency", {r[1] for r in db.execute('PRAGMA table_info("LoanPlan")')})
            self.assertIsNone(db.execute("SELECT 1 FROM sqlite_master WHERE name='ReferralFirstDepositDecision'").fetchone())

    def test_apply_requires_explicit_acknowledgement(self):
        result = self.run_cli("--apply")
        self.assertNotEqual(result.returncode, 0)
        with sqlite3.connect(self.db_path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM d1_migrations").fetchone()[0], 1)
            self.assertNotIn("currency", {r[1] for r in db.execute('PRAGMA table_info("LoanPlan")')})

    def test_owner_can_explicitly_waive_backup_after_quiescence(self):
        result = self.run_cli("--apply", "--acknowledge-quiesced-owner-waives-backup")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("APPLIED migrations=0016-0020", result.stdout)

    def test_apply_records_all_migrations_and_repeated_apply_is_safe(self):
        for _ in range(2):
            result = self.run_cli("--apply", "--acknowledge-quiesced-and-backed-up")
            self.assertEqual(result.returncode, 0, result.stderr)
        with sqlite3.connect(self.db_path) as db:
            self.assertEqual(db.execute("SELECT id,name FROM d1_migrations ORDER BY id").fetchall()[-5:], [
                (16, "0016_loan_repayment_cas.sql"),
                (17, "0017_binary_research_controls.sql"),
                (18, "0018_loan_plan_currency.sql"),
                (19, "0019_admin_operator_alerts.sql"),
                (20, "0020_deposit_qualification_referral_policy.sql"),
            ])
            self.assertEqual(db.execute('SELECT totalRepaidDecimal FROM LoanApplication WHERE id="loan-1"').fetchone()[0], "0.3")
            self.assertIn("currency", {r[1] for r in db.execute('PRAGMA table_info("LoanPlan")')})
            self.assertIsNotNone(db.execute("SELECT 1 FROM sqlite_master WHERE name='ReferralFirstDepositDecision'").fetchone())
            self.assertIsNotNone(db.execute("SELECT 1 FROM sqlite_master WHERE name='AdminOperatorAlertPreference'").fetchone())


if __name__ == "__main__":
    unittest.main()
