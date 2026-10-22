import importlib.util
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "backend/scripts/binary_research_controls_migrate.py"
SPEC = importlib.util.spec_from_file_location("binary_research_controls_migrate", SCRIPT)
MIGRATOR = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MIGRATOR)


class BinaryResearchControlsMigrationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="nexi-binary-migration-")
        self.database = Path(self.directory.name) / "fixture.sqlite"
        with sqlite3.connect(self.database) as db:
            db.executescript(
                'CREATE TABLE "User" ("id" TEXT PRIMARY KEY);'
                'CREATE TABLE "Gate2BinaryPosition" ("id" TEXT PRIMARY KEY);'
                'INSERT INTO "User" ("id") VALUES ("user-1");'
                'INSERT INTO "Gate2BinaryPosition" ("id") VALUES ("position-1");'
            )

    def tearDown(self):
        self.directory.cleanup()

    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--db", str(self.database), *args],
            capture_output=True,
            text=True,
            check=False,
        )

    def columns(self, table):
        with sqlite3.connect(self.database) as db:
            return {row[1]: row for row in db.execute(f'PRAGMA table_info("{table}")')}

    def test_dry_run_leaves_schema_unchanged(self):
        result = self.run_cli()

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("DRY_RUN state=READY", result.stdout)
        self.assertNotIn("binaryResearchDefault", self.columns("User"))

    def test_apply_requires_quiesced_and_backup_acknowledgement(self):
        result = self.run_cli("--apply")

        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("binaryResearchDefault", self.columns("User"))

    def test_apply_adds_expected_columns_and_existing_rows_read_defaults(self):
        result = self.run_cli("--apply", "--acknowledge-quiesced-and-backed-up")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("APPLIED", result.stdout)
        user_columns = self.columns("User")
        position_columns = self.columns("Gate2BinaryPosition")
        self.assertEqual((user_columns["binaryResearchDefault"][2:5]), ("TEXT", 1, "'NORMAL'"))
        self.assertEqual((position_columns["researchDefault"][2:5]), ("TEXT", 1, "'NORMAL'"))
        self.assertEqual((position_columns["researchOverride"][2:5]), ("TEXT", 0, None))
        self.assertEqual((position_columns["researchControlVersion"][2:5]), ("INTEGER", 1, "0"))
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT "binaryResearchDefault" FROM "User" WHERE "id"=?', ("user-1",)).fetchone()[0], "NORMAL")
            self.assertEqual(db.execute('SELECT "researchDefault","researchOverride","researchControlVersion" FROM "Gate2BinaryPosition" WHERE "id"=?', ("position-1",)).fetchone(), ("NORMAL", None, 0))

    def test_complete_migration_is_a_noop_and_preserves_saved_controls(self):
        applied = self.run_cli("--apply", "--acknowledge-quiesced-and-backed-up")
        self.assertEqual(applied.returncode, 0, applied.stderr)
        with sqlite3.connect(self.database) as db:
            db.execute('UPDATE "User" SET "binaryResearchDefault"="WIN" WHERE "id"="user-1"')
            db.execute('UPDATE "Gate2BinaryPosition" SET "researchOverride"="LOSS","researchControlVersion"=3 WHERE "id"="position-1"')

        repeated = self.run_cli("--apply", "--acknowledge-quiesced-and-backed-up")

        self.assertEqual(repeated.returncode, 0, repeated.stderr)
        self.assertIn("ALREADY_APPLIED", repeated.stdout)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute('SELECT "binaryResearchDefault" FROM "User" WHERE "id"="user-1"').fetchone()[0], "WIN")
            self.assertEqual(db.execute('SELECT "researchOverride","researchControlVersion" FROM "Gate2BinaryPosition" WHERE "id"="position-1"').fetchone(), ("LOSS", 3))

    def test_partial_schema_fails_closed_without_adding_more_columns(self):
        with sqlite3.connect(self.database) as db:
            db.execute('ALTER TABLE "User" ADD COLUMN "binaryResearchDefault" TEXT NOT NULL DEFAULT \'NORMAL\'')

        result = self.run_cli("--apply", "--acknowledge-quiesced-and-backed-up")

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("partial", result.stderr.lower())
        self.assertNotIn("researchDefault", self.columns("Gate2BinaryPosition"))

    def test_sql_error_rolls_back_all_added_columns(self):
        bad_migration = Path(self.directory.name) / "bad.sql"
        bad_migration.write_text(
            'ALTER TABLE "User" ADD COLUMN "binaryResearchDefault" TEXT NOT NULL DEFAULT \'NORMAL\';\n'
            'ALTER TABLE "Gate2BinaryPosition" ADD COLUMN "researchDefault" THIS IS INVALID;\n'
            'ALTER TABLE "Gate2BinaryPosition" ADD COLUMN "researchOverride" TEXT;\n'
            'ALTER TABLE "Gate2BinaryPosition" ADD COLUMN "researchControlVersion" INTEGER NOT NULL DEFAULT 0;\n',
            encoding="utf-8",
        )

        with patch.object(MIGRATOR, "MIGRATION_FILE", bad_migration):
            with self.assertRaises(sqlite3.Error):
                MIGRATOR.migrate(self.database, apply=True, acknowledge=True)

        self.assertNotIn("binaryResearchDefault", self.columns("User"))


if __name__ == "__main__":
    unittest.main()
