# NEXI Margin delayed entry matching — SQLite atomicity receipt

Source: `backend/src/d1/d1-financial-command.gateway.ts`, `backend/src/d1/local-sqlite-bridge.service.ts`. Test file: `backend/test/d1/wallet-account-transfer.local-sqlite.spec.ts`.

**Proof:** `NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand test/d1/wallet-account-transfer.local-sqlite.spec.ts test/gate2/margin.service.spec.ts` → **23/23 PASS**, two suites. `./node_modules/.bin/tsc --noEmit -p tsconfig.build.json` exit 0. `git diff --check` exit 0.

**Behavior:** An entry order filled in two trades moves Margin position quantity 0→1→2 and status PENDING→PENDING→OPEN, with correct mean execution price; position event, SpotMarginActivity, unified Activity, and Outbox accompany each atomic fill. Synthetic SQLite trigger rejects projection insert and proves rollback of the entire Spot trade/Ledger transaction; recovery succeeds after trigger removal.

**Not proven:** Late **close** fill settlement, partial-close debt economics, authenticated API, deployed source identity. No live financial data mutated.
