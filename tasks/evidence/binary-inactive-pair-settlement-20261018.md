# Binary already-opened position — inactive pair continuity

Current source repair: expiry settlement resolves persisted MarketPair and asset symbols without the ACTIVE/new-order capability gate. Opening a new position still uses getActiveMarketPair with trading enablement rules. Existing persisted configuration version and settlement-approved provider quote policy still apply.

**Proof complete at source level:** No deployed backend mutation, market provider changes, wallet balances or trade outcomes changed.

- Binary service affected suite: **18/18 passed** (Node 24.21, Jest), including a disabled-pair existing-position settlement preserving configuration version, provider approval and exact payout.
- Disposable SQLite gateway: **1/1 passed** demonstrating `getActiveMarketPair` rejects a pair in maintenance, while `getMarketPairForSettlement` retains the historical asset symbols.
- Backend TypeScript `tsc --noEmit --incremental false` passed. No live financial operation, provider mapping or deployed artifact changed.
- LIMIT: A settlement provider still must produce an approved expiry quote; the change does not invent missing quotes or override a disabled pair for **new trades**. Actual production settlement remains unverified.
