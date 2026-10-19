# Authenticated four-lifecycle live acceptance receipt — 2026-10-19

Source: `/tmp/nexi-four-lifecycle-565068f6-3cd7-4c83-a576-0db585d521ba.json`

SHA-256: `92e20147ce4b5689d89f3322429623f31a44a50b7bf38035485a9da55acfa125`

**Observed:** 20 PASS, 0 FAIL, 4 BLOCKED; runner `fullyAccepted=false`.

| Domain / check | Outcome |
|---|---|
| RUNTIME/ready | PASS |
| AUTH/public | PASS |
| AUTH/admin | PASS |
| BINARY/config | PASS |
| BINARY/fund | PASS |
| BINARY/open | PASS |
| BINARY/settle | PASS |
| BINARY/history | PASS |
| MINING/plans | PASS |
| MINING/fund | PASS |
| MINING/subscribe | PASS |
| MINING/subscribe-replay | PASS |
| MINING/cancel | PASS |
| MINING_ECONOMIC_COMPLETION/gate | BLOCKED |
| LOANS/plans | PASS |
| LOANS/gate | BLOCKED |
| WITHDRAWAL/list | PASS |
| WITHDRAWAL/gate | BLOCKED |
| READBACK/wallet | PASS |
| READBACK/activity | PASS |
| READBACK/ledger | PASS |
| READBACK/admin-withdrawals | PASS |
| READBACK/admin-loans | PASS |
| ACCOUNTING_CORRELATION/gate | BLOCKED |

**Confirmed successful paths:** Auth Public SIWE/Admin; Binary config/funding/open/settle/history; Mining plan/funding/subscribe/replay/cancel; Loan plan read; Withdrawal list; wallet/Activity/Ledger/Admin readback HTTP success.

**Not proven / blocked:** Mining maturity/accrual/redeem; Loan collateral-backed application/Admin approval/disbursement/repay; Withdrawal password/destination and Admin decision/settlement; per-operation Ledger/Activity/EventOutbox economic-group reconciliation. HTTP 200 readback is not reconciliation.

This receipt is additive evidence; it supersedes older statements that authenticated Binary open/settle and Mining subscribe/replay/cancel were unproven. It **does not** close full production backend economic acceptance. No additional live financial test was executed to prepare this report.
