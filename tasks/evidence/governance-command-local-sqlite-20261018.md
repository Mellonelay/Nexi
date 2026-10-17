# Governance replay / decision proof — 2026-10-18

Base: `68f0f386da30d4f2763cd6f92dc588f980b0d678`; one canonical `main` checkout.

- Source: `backend/src/d1/d1-financial-command.gateway.ts`.
- Test: `NODE_OPTIONS=--experimental-vm-modules ./node_modules/.bin/jest --runInBand test/d1/governance.local-sqlite.spec.ts` — 1 suite / 2 tests PASSED.
- Build-source check: `./node_modules/.bin/tsc --noEmit -p tsconfig.build.json` — exit 0.
- Atomic constraints: changed replay terms rejected, exact replay returns original, one request audit, one winner decision/approval/audit, losing decision rejected without extra financial side effects.
- Not run: deployed API, Admin JWT/RBAC integration, full financial regression, production data writes or migration.
- Unchanged baseline: previously passed 14/14 financial disposable SQLite and other valid proof reused, not rerun.
