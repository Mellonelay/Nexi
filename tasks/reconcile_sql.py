"""Helpers for safely reading local reconciliation table names."""


def quote_existing_table(connection, table):
    """Return a quoted SQLite table name only when it exists in the local schema."""
    if not isinstance(table, str) or table.startswith(("sqlite_", "_cf_")):
        raise ValueError("Unexpected reconciliation table")
    exists = connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone()
    if exists is None:
        raise ValueError("Unexpected reconciliation table")
    return '"' + table.replace('"', '""') + '"'
