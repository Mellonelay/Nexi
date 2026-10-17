# Wallet, Binary and withdrawal financial paths — isolated local SQLite proof

**Source identity:** Canonical `main` base `e09a33172dc1d14f6d379bac8b969e20d22ac9ea`, with the working-tree gateway/test changes recorded below. The active VPS API was not changed or deployed.

**Safety boundary:** Each Jest case creates and removes a disposable SQLite file from the repository's initial D1-shaped schema plus the existing wallet-network authority migration. Withdrawal test configuration is seeded only in that disposable file. No live database, account balance, service, external financial state, or deployed artifact was changed.

## Wallet account transfer

The existing `FinancialOperationsService.transferBetweenAccounts` and `D1FinancialCommandGateway.pairedTransfer` were exercised through the local SQLite bridge. MAIN→BINARY and MARGIN→MAIN USDT transfers verified exact paired LedgerPosting deltas and resulting balances, LedgerAuditEvent, unified Activity scope metadata, EventOutbox payloads and replay without duplicate effects. Rejection coverage includes unsupported BINARY asset, cross-user destination, changed-amount idempotency collision, and overdraft with no partial records.

## Binary reserve and settlement

Direct `D1FinancialCommandGateway.openBinaryPosition` and `settleBinaryPositionAtomic` tests exposed two defects: the open SQL supplied 22 values for 23 columns, and settlement wrote Ledger/audit/Activity/state without a durable settlement event. The open SQL binding is corrected. Settlement now emits `BINARY_POSITION_SETTLED` with an idempotency key scoped to position and command, guarded by the settled position state/receipt and included in the same batch. A strict Outbox insert causes an occupied event key to abort and roll back the entire local SQLite batch; other uses of the shared helper retain their previous `INSERT OR IGNORE` behavior.

The tests verify a 1.25 USDT stake reserve, exact release and 2.5 USDT WIN payout, and a 0.5 USDT LOSS with zero payout and no payout posting. Assertions cover final available/locked balances, Ledger postings, LedgerAuditEvent, unified Activity, Gate2OperationAudit, position state, opening and settlement Outbox payloads, and replay without duplicate publication. An occupied settlement event key leaves the position ACTIVE, stake reserved, and no settlement postings or Activity.

Existing `test/gate2/binary.service.spec.ts` passes 17/17, including a new exact-decimal nonzero LOSS-rate calculation (`10` stake, `0.15` loss rate → `1.5` payout and `-8.5` realized profit). It also covers service quote/expiry selection, configuration-version use, and sandbox WIN/LOSS price behavior with a mocked gateway. It does not replace end-to-end provider or financial persistence proof.

## Withdrawal lifecycle

The existing `FinancialOperationsService` and gateway were exercised against disposable Currency/WalletNetwork capability configuration. The test requests a 1.25 USDT withdrawal with a 0.1 fee, replays the request, approves it, and settles it with a `deterministic:` non-live receipt; then it creates and rejects a second withdrawal. It verifies exact account available/locked balances, reserve/settlement/release posting deltas, LedgerAuditEvent, unified Activity transitions, AdminAuditLog approval/settlement/rejection records, Outbox reserve/approve/settle/reject events, idempotent request/terminal replay, and insufficient-funds rejection. No provider broadcast is attempted.

## Verification

From `backend/`:

```sh
PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --config test/jest-local-sqlite.config.cjs --runInBand --runTestsByPath test/d1/wallet-account-transfer.local-sqlite.spec.ts
PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand --runTestsByPath test/gate2/binary.service.spec.ts
PATH=/opt/nexi/runtime/node-v24.21.0/bin:$PATH ./node_modules/.bin/tsc --noEmit --incremental false --project tsconfig.build.json
```

Results: local SQLite suite PASS, 1 suite / 5 tests; Binary service suite PASS, 1 suite / 17 tests; backend source typecheck PASS, exit 0 before the later test-only withdrawal fixture expansion. Earlier red runs exposed the SQL placeholder mismatch and missing settlement event; interim test assertion/query mistakes were corrected before the final green run.

Fallow `inspect` on the changed gateway reported zero dead-code and security findings. Its filtered report includes existing gateway duplication and complexity findings; `settleBinaryPositionAtomic` is cyclomatic 12, cognitive 11, CRAP 43.1. No broad refactor was made. Fallow inspection of the test file reported zero dead-code, duplication, complexity, and security findings. The workspace has no configured Fallow policy rule packs, so policy coverage is not claimed.

Graphify Agent Workflow source-path analysis and the Graphify MCP query were used to identify the Binary service/gateway, Ledger, Activity and Outbox neighborhood. The refreshed local graph contains 8,060 nodes and 19,271 edges; no directed edge connects the private settlement method to the private Outbox helper, so source and SQLite execution—not graph topology—establish this behavior.

## Limits and next

This evidence covers wallet transfer, direct Binary gateway WIN/LOSS persistence, and the deterministic non-live withdrawal service/gateway lifecycle. Real Binary provider quote authority/expiry selection and service payout calculation against persisted configuration plus SQLite remain unproven. Authenticated API/RBAC, live database behavior, external withdrawal provider broadcast, Admin funding, deployed artifact behavior and owner acceptance remain unproven. Continue with another independent financial domain. Preserve the separate authorized test-balance and off-VPS backup destination/key-custody gates.

## Consolidated backend causal repair batch — 2026-10-18

The working-tree batch also repairs and covers Spot matched-fill Activity/Outbox publication, zero-reserve and reserved Spot cancellation publication, Margin open Activity/Outbox and stable-key replay, Mining release Activity plus zero-yield no-op handling, deposit-claim replay scoping and atomic credit/Outbox rollback, conversion expiry compare-and-set, financial-command payload collision checks, Admin correction payload binding/fail-closed gateway behavior, loan replay parameter checks, and Admin LoanPlan string/idempotency handling. Withdrawal additional review now transitions to `ADDITIONAL_REVIEW`, blocks approval, and returns through a separately audited/outboxed idempotent action. A follow-up causal review found Mining subscription replay accepted changed amounts/plan terms; the gateway now validates those persisted terms, and the SQLite case proves matching replay creates no extra posting, Activity or Outbox while changed terms are rejected.

**Verification:** Final consolidated run passed 9 affected Jest suites / 106 tests. This includes the prior 84-test financial batch, the 4-test Admin controller/service contract, and the new Mining replay assertions. `npx tsc --noEmit -p tsconfig.build.json` passed. `git diff --check` passed. Tests ran under Node 22.23.2 against disposable databases; the local generated `better-sqlite3` binding was rebuilt for the shell's Node ABI 127 after detecting a stale Node 24 ABI 137 binary. No production service, live SQLite database, financial account, or deployed artifact was changed.

The initial consolidated run exposed only fixture/runtime setup failures: the native binding ABI mismatch, a missing `SpotMarginPositionEvent` fixture table, and an outdated Admin audit expectation. These were corrected before the passing batches. The successful typecheck is the source-only build config; a broad `tsc --noEmit` over the repository's Jest files is not a valid project gate and reports pre-existing ESM/Jest typing/config errors.

Graphify was refreshed after the final source edit (8,073 nodes / 19,318 edges). Its exact bounded path confirms `MiningService` imports `D1FinancialCommandGateway`; this is ownership/navigation evidence only. Fallow 3.30.0 changed-backend dead-code analysis found no unused files/exports/types, unresolved imports, cycles, or boundary violations; its ten findings are dependency declarations. Changed-backend health analysis flagged static-estimated coverage/complexity for the large shared gateway and Admin identity paths; no repository-wide refactor or suppression was made. The touched Mining and withdrawal review methods remain moderately flagged by static estimated coverage despite the focused passing cases; branch coverage was not measured. CodeScene review was attempted on the three changed backend services, then installation verification confirmed the configured token is expired (3/6 checks passed); no CodeScene score is claimed.

**Limits:** Source remains uncommitted on `main` based on `e09a33172dc1d14f6d379bac8b969e20d22ac9ea`. Authenticated API/Admin RBAC acceptance, Admin UI representation of `ADDITIONAL_REVIEW`, deeper Margin debt/interest/liquidation paths, complete Loan/Mining lifecycles, deployed artifact identity and runtime behavior remain unproven. No build/deployment or live financial operation was performed.

## Owner stop and closeout addendum — 2026-10-18

Per the current owner directive, no further audit or implementation followed the source fixes already in progress. Final affected checks: `test/d1/wallet-account-transfer.local-sqlite.spec.ts` passed 14/14; `test/d1/d1-financial-command.gateway.spec.ts -t "binds new deposit addresses"` passed 1/1 (44 skipped); `npx tsc --noEmit -p tsconfig.build.json` passed; `git diff --check` passed. The Binary config gateway suite passed in an earlier focused invocation after its mock was adjusted. The earlier 9-suite / 106-test run predates the final Binary, Loan, DepositClaim and price-time changes; those changed boundaries are covered by the later focused runs instead.

Additional completed fixes in this closeout slice:

- Binary configuration updates now bind key replay to admin, target, reason and exact payload; altered terms reject, and the Outbox insert is strict. Disposable SQLite verifies one version, one audit and one event across exact replay.
- Loan repayment now compare-and-sets `totalRepaidDecimal` in the same atomic batch as the repayment and Ledger operation. Migration `backend/prisma/migrations-d1/0016_loan_repayment_cas.sql` adds the field. A forced two-caller interleaving permits one repayment and rejects the other. The migration is not applied to the VPS database.
- Deposit claim review uses a pending-state CAS; dependent audit and Outbox rows are written only after a winning transition. The concurrent local SQLite case verifies exactly one winner. Deposit-address Outbox collisions now fail the batch; a focused gateway test passed.
- Spot fill pricing now uses the first resting order under price-time priority. BUY-first and SELL-first cases verify price and ledger price-improvement release. `LocalSqliteBridgeService` now allows up to 128 bound parameters per statement so its bounded fill statement (over 64 parameters on price improvement) can run atomically.

The initial closeout test attempt exposed setup/adapter issues, not backend assertion failures: the DepositClaim fixture used reviewer IDs absent from the disposable `User` table (changed to its seeded users), and the local SQLite bridge rejected a 65+ parameter fill statement at its former 64-parameter ceiling (raised to 128). A Binary mock also returned an audit row for the new replay lookup; its fixture now returns no prior audit. After these corrections, the focused checks above passed.

Confirmed defects intentionally left for the next controller under the stop instruction: Governance command replay does not bind payload, Governance competing decisions can leave loser approval/audit rows, Margin partial-entry fills do not reconcile the linked position, and a later fill of a Margin close order has no automatic settlement recovery. Other domains and operational gates remain as listed in the proof register. No Jest, typecheck, deployment, restart or live DB command remained running at handoff; persistent Graphify MCP server processes were present. No production runtime was changed.
