import sqlite3
import unittest

from tasks.reconcile_sql import quote_existing_table


class QuoteExistingTableTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute('CREATE TABLE "ordinary" (value TEXT)')
        self.db.execute('CREATE TABLE "quoted""name" (value TEXT)')

    def tearDown(self):
        self.db.close()

    def test_quotes_a_table_name_from_local_schema(self):
        quoted = quote_existing_table(self.db, 'quoted"name')
        self.assertEqual(self.db.execute(f"SELECT * FROM {quoted}").fetchall(), [])

    def test_rejects_unlisted_or_injected_table_names(self):
        for name in ('missing', 'ordinary"; DROP TABLE ordinary; --', None):
            with self.subTest(name=name), self.assertRaises(ValueError):
                quote_existing_table(self.db, name)

    def test_rejects_sqlite_internal_tables(self):
        with self.assertRaises(ValueError):
            quote_existing_table(self.db, "sqlite_sequence")


if __name__ == "__main__":
    unittest.main()
