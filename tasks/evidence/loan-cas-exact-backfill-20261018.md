# Loan repayment CAS migration — historical exact-decimal backfill

**Source-only correction, not applied to live SQLite.**

The existing 0016 migration adds `LoanApplication.totalRepaidDecimal` with default `0`. The current promoted database contains **five LoanApplications and one historical LoanRepayment**, so a bare 0016 schema-only application would incorrectly display that historical repayment as zero until another repayment.

`backend/scripts/loan-repayment-cas-migrate.py` is the exact-decimal, idempotent **complete 0016 migration and historical backfill** operator. It uses Python Decimal with Inexact trapping, checks historical amount/amountDecimal consistency, validates repayment totals and orphans, and performs schema add plus all existing cumulative totals under one SQLite BEGIN IMMEDIATE transaction. Dry-run is default; --apply requires explicit acknowledgment of a quiesced service and verified independent backup. When using this script, **do not also apply 0016 SQL separately**. If 0016 was already applied by the existing migration controller, the script recognizes the column and performs idempotent backfill only. Reconcile the migration registry separately with the operator.

**Verification:** 6/6 isolated Python unittest cases passed: dry-run immutability, exact decimal sums, historic zero-decimal fallback, idempotent repeated application, refusal without explicit operator acknowledgment, and corrupt-history atomic refusal. Read-only preflight of live SQLite returned `DRY_RUN loans=5 repayments=1 existing_cas_column=False`.

**Unproven:** Independent encrypted off-VPS backup and isolated restore destination, owner-approved migration application, live API runtime and authenticated economic acceptance. No live migration, SQL write or service restart occurred.
