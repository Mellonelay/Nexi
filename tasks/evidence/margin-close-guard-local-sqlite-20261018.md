# Margin close-request CAS — local SQLite, 2026-10-18

Source: `backend/src/d1/d1-financial-command.gateway.ts` (`markMarginClosing`).

Proof: `NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand test/d1/margin-closing-guard.local-sqlite.spec.ts` — 1 suite, 1 test PASS. `tsc --noEmit -p tsconfig.build.json` exit 0.

One winner OPEN→CLOSING creates Activity; losing different key rejected with no Activity; same key replays without duplicate; same key with a different close order is rejected. Uses disposable local SQLite. No deployment, live migration, live financial state mutation or late-fill settlement proof.
