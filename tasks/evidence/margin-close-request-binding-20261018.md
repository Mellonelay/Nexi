# Margin closing-request replay and liquidation-type binding — 2026-10-18

**Confirmed source defect:** A position already in CLOSING could be retried through a different close key or through the liquidation endpoint. The service reused the reserved close order but passed the caller's new key/type into terminal settlement. This risked changing the economic outcome of an existing accepted close.

**Repair:** The financial gateway now reads the actual accepted `SpotMarginActivity` keyed by the persisted `closeOrderId`, with authenticated account/user scope. The existing CLOSING handler rejects changed keys, wrong close-order reference and opposite liquidation mode before consulting the filled order or writing settlement records. Ordinary exact-key replay and original scheduled recovery remain valid.

**Verification:** Margin service 11/11 tests PASS, disposable SQLite close recovery 2/2 PASS including the owner-scoped accepted-key lookup, backend TypeScript build configuration exit 0. No new financial balances or deployed service altered.

**Limit:** Source-only proof; live authenticated Margin settlement, deployment artifact identity and owner acceptance remain separate.
