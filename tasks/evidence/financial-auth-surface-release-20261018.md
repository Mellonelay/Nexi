## 2026-10-18 — Financial surface guard repair, runtime activation and focused verification

**Source authority:** Direct `main` commit `321e45e10204f3a7d88ab5ee5910e1bac8e673d0`. Existing promoted VPS SQLite, NestJS and Valkey architecture unchanged. No frontend/browser campaign, new infrastructure, D1 migration, or financial balance mutation.

**PROVEN CODE:** Eleven Public financial endpoints (account transfers, transfers, conversion quote/accept, deposits, proof intents/upload authorization, deposit claims/readbacks and withdrawal/transfer reads) now apply `JwtAuthGuard, AuthSurfaceGuard` and `RequireAuthSurface("PUBLIC")`, matching existing Public withdrawal behavior. Three Admin withdrawal decision handlers retain `ADMIN` surface and RolesGuard; public deposit-destination discovery remains unguarded as designed.

**PROVEN focused tests:** Before deployment the linked auth-security and financial HTTP suites were 3/3 suites, 19/19 tests PASS. Dedicated metadata+behavior guard suite additionally passed 19/19 after adding PUBLIC-valid / ADMIN-denied / missing-surface-denied cases. Linked causality integration passed. TypeScript `tsc --noEmit --incremental false -p tsconfig.build.json` passed, Nest build exit 0. Fallow boundary guard reported no violation. Graphify Cloud impact and tests-for at previous source `17d8fd3` linked the controller to the three relevant suites; new Graphify hook executed after commit. Local code and focused runtime tests outrank any stale graph index.

**PROVEN deployed version:** Committed and pushed `321e45e` to GitHub `main`; compiled artifact copied to existing VPS `/srv/nexi/backend/dist`, with preserved rollback folder `/srv/nexi/backend/rollback/pre-auth-surface-321e45e/dist`. Controller JS SHA-256 both source and deployed: `cefbed699fc8bb9ad9df3e0022d0f60a6ad5dcf11228b1ffe82e6386f0d6a50a`. NestJS restarted successfully. `/readyz` returned HTTP 200 `READY` with database/Redis connected, and no error-level journal entries in the immediate post-restart check. Sentry release/deployment recorded for `321e45e`; `SENTRY_RELEASE` synchronized in `/etc/nexi/backend.env`, then restarted/readiness reverified.

**PROVEN reusable workflow:** Combined existing local workflow store+coordinator suite 2/2 suites, 14/14 PASS unchanged; no need to reopen previous intermittent behavior absent contradictory fresh results.

**UNPROVEN:** Actual *authenticated* production financial economy/Admin journeys for all seven domains, end-to-end withdrawal external settlement, all scheduled recovery and off-VPS encrypted independent full restore. HTTP 401 unauthenticated tests and metadata guard behavior are **not** valid JWT business transaction acceptance. Do not claim backend owner-accepted or production defect count zero.

**Preserved dirty files:** unrelated `cloudflare-container-bootstrap/wrangler.jsonc`, untracked `apps/admin/pnpm-lock.yaml` and `apps/admin/pnpm-workspace.yaml`. No other source mutation requested.
