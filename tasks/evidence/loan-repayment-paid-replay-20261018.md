# Completed Loan repayment idempotent retry — 2026-10-18

**Corrected defect:** The gateway rejected an exact repayment retry once the initial full repayment changed `LoanApplication.status` to `PAID`, because status eligibility was checked before idempotent replay. That could make clients retry an already-successful payment and receive a false failure.

**Fix:** `repayLoan()` still authenticates and scopes the Loan to the requesting user, hashes the same idempotency key, verifies original amount and returns existing receipt/state first. Only *new* repayments require `ACTIVE` or `OVERDUE`. Changed amount under the same key is rejected. No new account/Ledger/Activity/Outbox writes are made on retry.

**Evidence:** RED disposable-SQLite test failed with `BadRequestException: Loan is not repayable`. The same new targeted test passed after correction (1/1); existing 19/19 financial test suites passed earlier at unchanged baseline. Current backend `tsc --noEmit --incremental false -p tsconfig.build.json` exit 0 and targeted Fallow boundary check clear.

**Limits:** Source and disposable-SQLite proof only. No live database alteration, service restart, new migration, Cloudflare infrastructure, or deployed/authenticated financial acceptance in this operation. Preserve existing Loan 0016 compatibility/backfill gate separately; do not restart platform migration.
