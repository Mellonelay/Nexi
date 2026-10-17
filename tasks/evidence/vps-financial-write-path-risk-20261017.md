# Live VPS financial-write path risk — 2026-10-17

Read-only source/config review against canonical `main` at `bbc849b16291b034b596b80f77790d13112f4cb2`; no HTTP financial request or database mutation was performed.

## Runtime and authority

- Active `nexi-api.service` process PID 1680547 uses `NEXI_SQLITE_LOCAL_ENABLED=true`, `D1_RUNTIME_ENABLED=true`, `D1_BRIDGE_ENABLED=true`, and `NEXI_LOCAL_SQLITE_PATH=/var/lib/nexi/sqlite/nexi-staging.sqlite`.
- `NEXI_SCHEDULER_ENABLED=false`; `NEXI_LOCAL_ASYNC_ENABLED=true`.
- The selected local SQLite database has zero rows across the sampled core auth/financial table set; current D1 has nonzero rows. See sibling JSON evidence file.
- `backend/src/d1/d1-prisma.service.ts:58-75` selects `DurableSqliteAdapter(file:<path>)` when local mode is enabled.
- `backend/src/d1/d1-worker-bridge.module.ts:13-16` injects `LocalSqliteBridgeService` under the same flag; `local-sqlite-bridge.service.ts:49` reports the local bridge enabled.
- `backend/src/d1/d1-financial-command.gateway.ts:241-243` enables gateway methods when `D1_RUNTIME_ENABLED` and the bridge are enabled; with the local bridge this gateway writes to SQLite.

## Representative authenticated mutation routes

- Gateway-backed examples: `/financial/withdrawals`, `/financial/account-transfers`, `/financial/transfers`, `/financial/conversion/accept`, `/financial/deposit-claims`, `/loans/apply`, `/loans/repay`, `/binary/position`, `/spot/order`, `/spot/cancel`, `/spot/margin/positions`, `/mining/subscribe`, `/mining/redeem`.
- Some direct Prisma mutations bypass `D1FinancialCommandGateway`: `backend/src/contract/contract.controller.ts:26-76` JWT-protected routes reach `backend/src/contract/contract.service.ts:44,77,127`.
- Therefore setting `D1_RUNTIME_ENABLED=false` alone does not prove a complete financial write freeze.
- Scheduler disablement does not disable authenticated HTTP mutations; local async processing remains enabled.

## Owner decision boundary

Safest next operation requires an explicit choice: apply a coordinated temporary production write freeze/maintenance block that covers both HTTP mutation routes and local async consumers, or restore a verified working D1-backed API route. The D1 bridge host/network reachability from the VPS has not been established; do not switch adapter flags blindly. Any temporary production write block is itself a live behavior change and must preserve auth/read paths and be verified before enabling. Keep both data stores unchanged until controlled final delta and one-writer cutover are explicitly accepted.
