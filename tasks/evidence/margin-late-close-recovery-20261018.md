# Margin late-close recovery — focused source proof, 2026-10-18

Base source: 3ef987897cd3d0097700b0f70004261103d7b197. Source-only repairs, not deployed.

- A CLOSING position reuses its stored close order without another fund reservation. Once the order is FILLED, settlement uses the actual weighted execution price from Gate2SpotTrade, not an out-of-date live quote.
- The existing scheduler flag and Redis distributed lock gate MarginRecoveryScheduler. At most 25 FILLED close orders per pass are resumed using their original accepted close/liquidation idempotency keys; failures are individually counted/logged. SpotModule registers this existing-domain scheduler.
- Tests under Node 24.21 (service, recovery scheduler): 13/13 passed (2 suites). Disposable SQLite under Node 22 (ABI-compatible better-sqlite3): 2/2 passed, including FILLED-only selection and VWAP from two trade rows. TypeScript build-project check exit 0. Fallow import boundary guard reported no violations.
- No live DB mutation or deployment. Ledger conservation and actual settlement on real filled orders remain unverified. Scheduler will defer unresolved debt funding; it does not make previously missing funds appear. Source proofs must not be equated with authenticated finance end-to-end acceptance.

## Additional financial and recovery proof

- Existing-close reuse also works without an active market quotation or a new market-pair lookup; the last FILLED order's executable VWAP (not a new quote) drives close PNL.
- Disposable **full-schema** SQLite settlement fault injection: a synthetic unified Activity failure rolled back the entire repayment Ledger debit, position transition and Outbox; removing the fault allowed exactly one Ledger posting, unified Activity and `MARGIN_CLOSED` Outbox. Targeted new integration test 1/1 PASS in `test/d1/wallet-account-transfer.local-sqlite.spec.ts`.
- Recovery scheduler and Margin service: 13/13 tests PASS across 2 suites. FILLED-only selection and trade VWAP: 2/2 tests PASS. The unchanged workflow store: 8/8 PASS isolated; workflow coordinator: 6/6 PASS isolated. A prior joint workflow run was inconsistent (3/14 failures); not used to certify joint clean acceptance.
- TypeScript build-config `tsc --noEmit --incremental false -p tsconfig.build.json` PASS under Node 24.21; targeted financial native SQLite tests used Node 22 because better-sqlite3 binary was built against Node ABI 127.
- **Limitations:** no deployed financial API proof, live SQLite migration, real authenticated wallet/admin flows, or off-VPS encrypted restore in this change. Financial funding deficits continue to defer settlement rather than inventing money. The scheduler is feature-gated by existing `NEXI_SCHEDULER_ENABLED` and coordinates with Redis.
