## Final completion campaign — source-only checkpoint — 2026-10-23

At source checkpoint `cf9a6ac05ad171e9f8d72a1da2e2b5d46a85414`, the accepted deployed release remains `3bb57e02ea921531975124ce2c827382a9f1ec6b` for Backend, Public, and Admin. This task's application changes are uncommitted and not deployed.

The new Learn category lifecycle path lists active and inactive categories only on the authenticated Admin surface and supports audited, idempotent status changes with `expectedStatus` concurrency fencing. The Admin Learn page exposes Hide/Show and prevents assigning inactive categories to articles. Public category listing retains its ACTIVE filter. No production content or SQLite data was changed. A read-only Public lane found no new source defect; it reused the existing Public proof and did not rerun tests.

`MarketIngestService` stops accepting callbacks, stops providers, drops queued work, and awaits active persistence drains before module teardown. This addresses the observed Prisma-close race. It does not yet prove the systemd 30-second shutdown timeout is resolved; that needs a controlled release/shutdown observation.

Focused proof: Backend Learn/shutdown tests 7/7; backend `tsconfig.build.json` check exit 0; Admin typecheck exit 0; Admin provider/navigation suite 10/10. Admin changed-hunk ESLint has no added-line findings; Backend has no ESLint configuration. Graphify refreshed to 6,624 nodes / 18,011 edges, with missing SQL parser/source-symbol coverage. Fallow reported 16 unused exports/dependencies/class members and one missing-node-modules degraded-analysis warning. CodeScene found no final complex-method signal after a small refactor, but reports `communications.service.ts` at 1,006 LOC (threshold 1,000), up from 928; no broad service split was done.

No production build, migration, service restart, deployment, public-data update, financial operation, or browser interaction occurred in this source checkpoint. Browser acceptance remains partial; Messages lacks an approved controlled conversation fixture, and Admin lower-role / eligible OPEN Binary fixtures remain absent. See [final completion source receipt](tasks/evidence/nexi-final-completion-source-20261023.md).

## Browser acceptance update — 2026-10-23 10:55 UTC

The live source remains `main@8084d860d9672c4de5c3bdbee2b96513db4b2b14`, equal to `origin/main`. Backend and Admin release markers are `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`; Public `.next/BUILD_ID` is `6507cf16a8cd863048b12aa56b23fd43435695ec`. All three services were active, HTTPS `/ops/ready` returned 200, and root free space was 5.0 GiB. No deployment or service change occurred.

The existing authenticated Public Settings page at `/dashboard/settings?tab=profile` was observed at 440×956 CSS px / DPR 3 with document width 440 and the four required tabs present. Existing app requests included `/auth/refresh` HTTP 201 and `/auth/me` HTTP 200. A metadata-only cookie check showed the existing API refresh cookie on `api.nexitrading.app` with Path `/`, HttpOnly, Secure, and SameSite=Lax; its value was never returned. Backend CORS enables credentials for configured origins, and the successful refresh from the Public page demonstrates that the current cross-origin path works. The earlier 401 came from the raw diagnostic fetch that bypassed the app's Axios Bearer-token interceptor; `/auth/me` requires JWT and the Public auth surface. The live wallet control showed only a masked address; current source renders it only when the authenticated profile wallet and connected wagmi address match. The injected provider reports the MetaMask flag, but the active connector name and full account values were not read. No wallet signature was requested.

The existing Admin `/users` tab still showed authenticated `Super Admin` UI at 1500×816 with all eight workspace links and no primary `/sandbox` link. A read-only 390×844 probe found no page-width overflow; the Users table uses its own horizontal scroll container. The approved October 22 desktop/mobile references and a real deployed Admin screenshot were inspected; mobile visual fidelity remains open. Chrome DevTools MCP could not connect to configured port 5859, so read-only direct CDP on the existing Chrome at 5858 was used as the available equivalent. The React DevTools hook had one renderer; no component tree, Requestly rule, or Accessibility Toolkit panel was used.

`npm run test:provider` was rerun in `Admin/`: 10/10 passed, including SQLite numeric announcement publication mapping. The prior Admin TypeScript pass is reused because that source boundary is unchanged. The TEST_ONLY Learn category remains active: schema supports `INACTIVE`, but the Admin UI/provider/controller expose category creation without a status-update route. Public/Admin Messages have no controlled conversation; the Binary inspector has no eligible live-position fixture; and role-denial testing lacks a permitted lower-role identity. No direct database write, test content, customer message, wallet signature, financial action, build, commit, or deployment was performed. Browser and owner acceptance remain open.

## Current Admin/Public release checkpoint — 2026-10-23

Backend and Admin source/release markers are `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`; the unchanged Public build ID is `6507cf16a8cd863048b12aa56b23fd43435695ec`. At the last recorded release check, all three services were active and Public `/dashboard` returned HTTP 200. Migration 0017 was already applied with matching schema; no promoted SQLite write was made during the release. Authenticated browser acceptance and owner acceptance remain open.

### Authenticated browser progress — 2026-10-23

The existing VM Chrome tabs were recovered without replacing the browser profile. Admin authenticated identity was confirmed during read-only Overview/Clients/Trading/Finance inspection; the original tab later reached Markets while DevTools calls stalled. Public read-only checks covered mobile Dashboard, Spot, Binary/Options, Wallet, Settings, Mining, Loans, Messages, Support, Announcements, and Learn. Learn and Announcements currently display `TEST_ONLY PRELIVE` acceptance content through the published Communications API. Public Messages has no existing conversation, so no test message was sent. Full Admin/Public browser acceptance and owner acceptance remain open; exact evidence and current tooling limits: [browser acceptance progress receipt](tasks/evidence/nexi-browser-acceptance-progress-20261023.md). No source, database, service, or release was changed.

### Authenticated browser follow-up — 2026-10-23

The same Admin tab was reauthenticated with the owner's saved browser credentials after an expired API session; no credential values were read. Read-only checks added Admin Products (Mining/Loans), Communications (Messages/Support/Notifications/Announcements/Learn), Public settings/Quotes categories, Roles & Permissions, Networks, Ledger, Price Data Sources, and a synthetic Client detail. Explicitly marked Public announcement and Learn acceptance records were moved to unpublished/Draft through the authenticated Admin API with audit reasons; the Public announcement and Learn APIs, plus the rendered 440×956 pages, no longer serve those records. The `TEST_ONLY PRELIVE` Learn category remains active and publicly listed because no category update endpoint exists. Communications content publication/readback is now verified for those records; broader surface parity remains open.

An Admin client-mapping repair is present but uncommitted: SQLite's numeric `published` value is now recognized alongside boolean `true`; focused provider tests passed 10/10 and Admin TypeScript checking exited 0. It is not deployed. Backend/Admin/ Public release markers remain `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`, `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`, and `6507cf16a8cd863048b12aa56b23fd43435695ec`; all services were active at the follow-up check and root free space was 5.1 GiB. Public wallet provider remains present, but `/auth/me` returned 401 after full-page navigation; no signature was requested or made. The complete evidence, including remaining acceptance limits, is in the browser progress receipt.

The Public Quotes search was subsequently exercised in the existing browser: an `ETH` query filtered the rendered list to ETH/USDT and ETC/USDT, then the query was cleared and the search control closed. The real Dashboard was checked at 320×700, 360×956, 390×956, 430×956, and 440×956 CSS px; no horizontal document overflow was observed, and the mobile search button measured 44×44 px. This adds only Dashboard/search responsive evidence; Public authenticated journeys and other routes remain open.

The existing Public mobile session also opened the Gold detail at `/dashboard/asset/XAUUSD`: the chart rendered, Biquote metadata reached `FRESH` with market session `OPEN`, and no horizontal overflow was observed at 440×956. The existing Admin `/users` tab survived a reload and continued to show the authenticated Admin API identity, `Super Admin` role, and selected Clients route at 1500×816.

A Forex instrument was also opened read-only at `/dashboard/asset/GBPUSD`; its chart and Biquote-backed profile loaded with `FRESH` metadata, `OPEN` session, and no horizontal overflow. This expands asset-detail proof to Crypto, Metals, and Forex; stock detail and other asset profiles remain open.

At 2026-10-23 09:24 UTC, source `HEAD` and `origin/main` were both `8084d860d9672c4de5c3bdbee2b96513db4b2b14`; Backend/Admin deployed markers were both `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`, Public build ID was `6507cf16a8cd863048b12aa56b23fd43435695ec`, all three services were active, and HTTPS `/ops/ready` reported database and Redis ready. Root free space was 5.1 GiB (90% used). No build, deploy, restart, migration, or commit was performed.

The latest direct browser probe at 09:29 UTC still showed Admin authenticated on `/users`. Public remained on `/dashboard` with `/auth/me` returning 401; the actual page reported 330×717 CSS px at DPR 1, despite the owner's original 440×956 DevTools screenshot. The 440×956 viewport was explicitly set and used during earlier route checks, but the final live viewport differs and is not claimed as restored.

---

## Storage maintenance checkpoint — 2026-10-23

The first storage pass removed the Public `.next/cache/webpack` directory (1,043,682,946 bytes), npm `_cacache` (about 177 MB), and APT download cache; its 1,942,331,392-byte free-space reading is historical. A targeted second pass on 2026-10-23 removed the unused Waggle tool environment, a noncanonical repository-root `node_modules`, obsolete source-tree build outputs, and specific inactive temporary build/test caches. The latest check shows 6,008,401,920 bytes available (89% used) on the 51 GiB root filesystem. Production dependency stores and artifacts, SQLite/WAL/SHM, financial backups, active browser/tool state, and rehearsed Backend/Admin rollback archives remain preserved; all three application services are active. Detailed measurements and exact paths: [storage maintenance receipt](tasks/evidence/storage-maintenance-20261023.md).

---

## Current integrated release state — 2026-10-22

Public source `6507cf16a8cd863048b12aa56b23fd43435695ec` remains deployed at `/srv/nexi/public/current`. Admin source `d163bfa85479fb7efb465a8a675141cdc4e50f17` is deployed at canonical `/srv/nexi/admin/current`; its release marker matches the pushed source. Admin Vite client, SSR and Nitro builds passed using the pinned Admin pnpm/shared dependency store. Backend remains at marker `9473e1393ada0c7398ad1aca27e822b2d6d00975`; API readiness returns 200. Admin HTTPS root redirects to `/overview`, overview returns 200, and unauthenticated `api.nexitrading.app/admin/me` returns 401.

The read-only guarded Binary migration runner reports `ALREADY_APPLIED schema_matches=yes`; this task made no promoted SQLite write. Public and Admin services are active with zero systemd restarts. The Admin Sentry release `d163bfa85479fb7efb465a8a675141cdc4e50f17` has processed client, SSR and Nitro artifact bundles; issue search returned none. Some generated chunks lacked source-map references, so full source-map association remains unverified. The prior Public release remains `6507cf16a8cd863048b12aa56b23fd43435695ec`.

Public/Admin/Backend retain separate shared dependency stores. The ignored 1.1 GB `frontend/.next` duplicate and noncanonical `Admin/.output` diagnostic build were removed; verified Public/Admin rollback archives remain until owner browser acceptance. Admin authenticated desktop/mobile rendering is not browser-verified; the Admin browser endpoint was unavailable during the source release task.

---

## Live Admin/Public integration gate — 2026-10-22

### Migration readiness source update — 2026-10-22

Source commit `0c92f90a4b0a8824369de26b184eae3574a23f89` adds a guarded runner for Binary research migration 0017 and temporary-SQLite tests. The runner is dry-run/read-only by default, requires explicit `--apply` plus quiesced-and-backed-up acknowledgment, uses `BEGIN IMMEDIATE`, accepts only absent or complete matching schema, rejects partial/incompatible schema, verifies post-migration columns, and is idempotent for an already-applied schema. Its focused suite passed 6/6 on 2026-10-22. The source commit is pushed to GitHub `main`; its implementation tests used only disposable SQLite. This is migration preparation, not proof that migration 0017 is deployed. Existing coordinated Backend/Public/Admin authorization and production migration/backup gates remain unresolved.

The guarded runner was also invoked against the promoted SQLite in default read-only mode during the 2026-10-22 release preflight. It returned `DRY_RUN state=READY; no changes made`; this confirms the expected tables exist and all four migration columns are absent, but is not migration authorization or an apply result.

### Source frontier update — 2026-10-22

GitHub `main` contains the focused Public Settings source batch at `f2777b150f8643fcd7ff09268b11eff9a4322ef6` (local `HEAD`, `origin/main`, and remote `main` matched; worktree clean at verification). It adds allowlisted NestJS route/banner validation and reads, Admin banner ordering, and Public route-state/navigation and scoped-banner consumers. Focused tests and backend/Admin/Public typechecks plus the Nest build passed; changed Public lint passed. No Admin or Public production build, migration, restart, deployment, browser acceptance, or production database write occurred. Generic feature flags remain unexposed pending an approved named consumer contract. Release still needs current authorization for coordinated Backend/Public deployment and the unapplied Binary migration; do not deploy Admin alone.

Release preflight refreshed 2026-10-22 08:57 UTC: local `HEAD`, `origin/main`, and GitHub `main` are `e3a5a89e123e0fabee0457dad55298c77560465b`; the checkout is clean. All three services are active with zero systemd restarts. Admin marker is `e2f7a65ea4ac870c6ea1ff6e299502430ecf5570`, Public build ID is `db802761a97eee1b9739e146a8cf95d2cd83bed8`, and API `SENTRY_RELEASE` is `a6b5c8535d4384d309b05f2102846a8717319acf` (the API has no independent compiled-SHA marker). Public/Admin HTTPS roots return 307, `/readyz` returns 200 with SQLite and Redis ready, and unauthenticated `/admin/me` returns 401. All five Public settings endpoints (navigation, routes, banners, quotes-categories, localization) return 404.

The promoted SQLite database was opened read-only. `User.binaryResearchDefault` and `Gate2BinaryPosition.researchDefault`, `researchOverride`, and `researchControlVersion` are absent; `d1_migrations` has no `0017_binary_research_controls` row. No production write or migration was attempted. The existing guarded runner remains source/test validated only.

The current Admin rollback artifact is `/srv/nexi/admin/shared/rollback-admin-e2f7a65-20261022.tar.gz`, SHA-256 `a2bab873521f9d73a2ca99d5b89c99e40e0e65e8424af9f0535a50c593099fad`, mode 0600. `gzip -t`, extraction of all 162 files into a disposable directory, release-marker comparison, and an empty `rsync --archive --hard-links --acls --xattrs --delete --dry-run` against live `current` passed; the disposable extraction was removed. The prior archive remains untouched. Disk headroom after backup is 3.7 GiB. Retain the current rollback archive until owner acceptance.

Sentry error-event searches for the three current runtime releases over the last 24 hours returned no events. This does not establish issue closure, source-map upload, or natural-error mapping. Existing source repair `a8b32ec4738902f74ea2fbd16ec26f1cdeba83e9` for historical NEXI-17 remains undeployed; no new release was built or uploaded.

Release remains held at the coordinated Backend/Public/migration boundary: the existing authorization is Admin-only, while current Admin cannot be shipped ahead of API/Public contracts. The designated authenticated ChatGPT Work browser is not exposed in this session. No production build, service restart, migration, or deployment was run. The Admin Sentry wrapper must set `VITE_SENTRY_ENVIRONMENT` explicitly for its authorized build.

## Latest source-only frontier — 2026-10-22 — Quotes category behavior

The last-visible-category defect is fixed in source commit `24cf931ced0535a6793253a8bf53e87bdaeff34f`, pushed to GitHub `main`. The Admin disables hiding the final visible category with accessible guidance; NestJS rejects malformed/all-hidden saves before persistence and audit; Public preserves an explicit valid one-category choice and uses built-in defaults for missing/malformed configuration. Changed files: `Admin/src/routes/frontend-control.tsx`, `backend/src/admin/admin.service.ts`, `backend/test/integration/public-settings.integration.spec.ts`, `backend/test/runtime/app.controller.spec.ts`, and `frontend/app/state/public-settings.test.mjs`.

Focused verification passed: disposable SQLite Admin-write/Public-readback integration 3/3, AppController runtime 7/7, backend build-scope TypeScript, Admin/Public TypeScript, changed Admin ESLint, Public settings tests 3/3, Fallow introduced-only review (zero introduced findings), and `git diff --check`. Graphify refreshed to 6,286 nodes / 17,422 edges. The broader backend root `tsc --noEmit` remains red on unrelated existing test/Jest typing errors; do not report a blanket backend typecheck pass. This source SHA is not deployed: the last recorded deployed Admin release remains `e2f7a65ea4ac870c6ea1ff6e299502430ecf5570`. No service restart, production SQLite migration/write, Sentry release check, browser verification, or owner acceptance occurred. Public routes, banners, and feature flags remain unimplemented pending exact product contracts.

## Previous frontier — 2026-10-22 — Admin/Public P3 settings

Application source commit `0107eccca1f6990bef579ea9c2e43ca89423ddbe` contains the bounded Public Settings integration. Evidence-only documentation commits followed to record the proof and task state; the final repository tip is reported in the completion receipt. Admin quote-category settings now reach the existing Public Quotes Hub through an allowlisted NestJS read; ordering and visibility apply to the existing 53-asset catalog. Admin localization values reach only existing Public shell message keys and the six existing locales, with bundled strings as fallback. Existing navigation, Binary, Messages, market-source, Mining, Loan, and wallet/network behavior was reused and not reworked.

Focused proof: backend and Admin/Public TypeScript checks pass; AppController tests 7/7; disposable SQLite Admin system-config write/audit and Public readback tests 2/2; Public settings/locale/message tests 6/6. A Vite SSR module-loader self-check also confirmed the Admin category fallback returns fresh objects after a caller mutates a prior result. Public focused ESLint exits 0 with one existing LocaleProvider state-in-effect warning. Admin provider focused ESLint still reports three unchanged explicit-`any` errors at lines 221–226. Fallow review reports existing provider/API findings plus expected complexity on new allowlist/sanitizer code; those parsers have focused tests and are retained for trust-boundary validation. Graphify refreshed at 6,273 nodes / 17,406 edges; its broad natural-language query was overinclusive and used only for navigation, not proof.

`admin.frontend.routes`, `admin.frontend.banners`, and Admin feature flags remain unexposed because current source does not establish Public route-state effects, banner placement/fields, or named public flag consumers. Exact mappings are recorded in `tasks/plan.md` and `tasks/todo.md`. This source frontier is not deployed, browser-tested, or owner-accepted. No service, production SQLite, Sentry release, source-map upload, or live financial state was changed.

---

## Latest Admin release state — 2026-10-21

Admin release source SHA `e2f7a65ea4ac870c6ea1ff6e299502430ecf5570` was pushed to GitHub `main` and built in the canonical `/srv/nexi/admin/current` output. TanStack resolution now uses lockfile versions `@tanstack/router-core@1.171.37` and `@tanstack/history@1.162.5`; `Admin/pnpm-workspace.yaml` narrowly public-hoists those packages for the Vite integration. TypeScript, Vite client, SSR and Nitro production bundling passed. `/srv/nexi/admin/current/NEXI_RELEASE_SHA`, `/etc/nexi/admin.env` release values and the embedded client release all identify `e2f7a65ea4ac870c6ea1ff6e299502430ecf5570`.

`nexi-admin.service` is active on `127.0.0.1:3001`, with zero restarts during the observation. Admin HTTPS returned 200; the live API origin is embedded in the bundle; unauthenticated `GET /admin/me` returned 401. Successful authenticated browser flow and rendered UI acceptance remain for the owner’s manual review. No Admin browser verification is claimed.

The preserved rollback artifact is `/srv/nexi/admin/shared/rollback-admin-a6b5c853-20261021.tar.gz` (SHA-256 `300795ebdda9d09bdca7d17a8197c53f75a00a7144982921cdc2148c0e0c2632`). Archive integrity, extraction, restoration into a disposable target, content comparison and an empty live-target rsync dry run passed. Retain the archive until owner acceptance.

Sentry source maps were not uploaded and the build did not create a Sentry release: `SENTRY_AUTH_TOKEN` is absent from the existing Admin build environment, and the build reported both omissions. The final public output contains no `.map` files. Sentry release/issue lookups returned HTTP 502, so no release-matched issue result is established. The three Admin Fallow complexity/coverage findings introduced with the prior UI source remain `BLOCKED_WITH_EVIDENCE` pending behavior coverage and owner UI inspection: `exposure.Inner` (CC22/cognitive 37/CRAP 506), `NexiAdminApiProvider.request` (CC13/cognitive 16/CRAP 182), and `AdminShell.SessionControls` (CC6/cognitive 10/CRAP 42). They are static risk findings, not verified functional defects. Focused ESLint remains at its parent-source baseline of 26 findings in the API provider; no Admin logic was changed by this release repair. The backend Mining Sentry issue `NEXI-17` remains a separate, unauthorized backend release dependency.

## 2026-10-23 — Backend/Admin Messages release

Application source commit `c74b3c02c948ceac2df92a76acc4f3c5c19c540d` is pushed to GitHub `main` and deployed to canonical Backend and Admin runtimes. Backend `RELEASE_SHA`/`SENTRY_RELEASE` and Admin `NEXI_RELEASE_SHA`/`VITE_SENTRY_RELEASE` match that commit. Nest build and Admin Vite client/SSR/Nitro build passed using the backend and Admin's separate shared dependency stores; Admin used pinned pnpm 12.14.0. Public production source did not change; its deployed Next build ID remains `6507cf16a8cd863048b12aa56b23fd43435695ec` and was reused.

Backend and Admin services are active. API `/readyz` returns 200 with SQLite and Redis ready; Public navigation/routes/banners/quotes/localization endpoints return 200. Admin Overview/Messages and its built bundle return 200. Unauthenticated Admin message history, moderation history, and reply POST return 401. No message or financial data was written. Migration 0017 was already applied with matching schema; this release did not mutate promoted SQLite.

Verified rollback artifacts are retained at `/srv/nexi/backend/rollback/rollback-backend-9473e13-to-c74b3c0-20261023.tar.gz` and `/srv/nexi/admin/shared/rollback-admin-8977545-to-c74b3c0-20261023.tar.gz`; both restoration rehearsals passed. Sentry accepted the Admin client, SSR, and Nitro artifact bundles for the release and exact-release issue search found no events. Some generated scripts lack auto-detected source-map references, so complete map coverage is not claimed; Sentry has no deployment record. Authenticated browser acceptance and owner acceptance remain open.

---

## Latest Public release state — 2026-10-20

GitHub `main` and local `main` are at `db802761a97eee1b9739e146a8cf95d2cd83bed8`. The Public wallet source change removes NEXI's WalletConnect connector and direct dependency while retaining Coinbase SDK and Wagmi injected/EIP-6963 discovery. The one final optimized build completed in `/srv/nexi/public/current` with canonical dependencies `/srv/nexi/public/shared/node_modules`; standalone asset preparation succeeded. `nexi-public.service` is active with zero restarts, working directory `/srv/nexi/public/current`, and the shared dependency symlink resolves correctly. Build ID, release SHA, and source provenance all identify the same commit. Local and public HTTPS root requests return 307 to `/dashboard`; no service error-level journal entries were present in the initial 10-minute observation.

Owner requested stopping after build/deploy and before browser testing. Therefore no browser, wallet connection/signature, authenticated route, responsive acceptance, or Admin UI acceptance is claimed. Resume Public Polypane verification only after the owner's discussion. New-release Sentry review and Admin Cloud Browser acceptance remain open. Four economic acceptance exceptions remain `OWNER_ACCEPTED_UNTESTED`.

---

## 2026-10-20 — Public EVM wallet compatibility frontier (source only)

Current source frontier is an uncommitted working-tree change on `main` at base SHA `e0038853ed214846db65d70ac0e4ab7079bae663`. `WalletConnectControl` now calls the selected Wagmi connector directly from the click handler; the extra async preflight was removed for every injected connector. Wagmi `multiInjectedProviderDiscovery` is enabled, the named EIP-6963 connectors remain selectable, and account/chain/disconnect handling stays with Wagmi. Focused wallet/SIWE/session tests: 19/19; frontend `tsc --noEmit --incremental false`: pass; changed-source Fallow: 0 findings; focused React Doctor: 0 errors and 4 warnings. Graphify was refreshed to the working tree.

NOT deployed or browser-verified. The live Polypane MCP at 5859 is reachable but only lists internal Polypane pages; the prior Public targets detached and creating a new target is unsupported by this route. Public environment check found `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` absent, so the WalletConnect connector is disabled. Coinbase/MetaMask wallet login or signature was not performed. Preserve unrelated dirty paths and do not claim universal compatibility; resume at WalletConnect configuration and Public Polypane target recovery, then perform the one authorized production build in `/srv/nexi/public/current` only after the frontier is ready.

---

## 2026-10-20 — Source-only backend/Public/Admin closure checkpoint

Owner-directed phases 1–4, no production deployment: source relationships examined with local Graphify CLI/mcpc, proof reuse register and Fallow. Four owner-closed economic acceptance workflows were reviewed as source wiring ONLY; no financial test, SQLite write, API acceptance, queue operation or backend restart was run. The NestJS preview OpenAPI generator was corrected for current SQLite source mode and produced 223 paths / 245 HTTP operations without creating a SQLite preview database. Public transfer, withdrawal, loans and mining DTOs match current controller contracts; Admin uses its live NexiAdminApiProvider. Obsolete 2026-10-17 empty-SQLite/D1/Cloudflare operator guidance corrected, including protected Worker-0 onboarding. Sentry release names for Backend/Public/Admin are prepared as build-time contracts; previous deployed release SHA is NOT this source SHA. Full evidence and exclusions: docs/architecture/NEXI_SOURCE_ONLY_ASSURANCE_20261020.md; deployment preparation: docs/operations/NEXI_THREE_SURFACE_RELEASE_READINESS.md. Git push, next build and release remain separate proof states.

---

## 2026-10-19 — Owner acceptance: four outstanding backend gates closed for current phase

CURRENT OWNER DECISION: Mark remaining four gate rows CLOSED_BY_OWNER_ACCEPTANCE and stop further live backend acceptance for this phase. The owner accepts existing backend/NestJS/schema implementation plus authenticated receipt 20 PASS / 0 FAIL / 4 BLOCKED as sufficient to close the present backend testing campaign. This closes the **work requirement**, not the historical test outcomes. Status per gate: Mining maturity/accrual/redeem = OWNER_ACCEPTED_UNTESTED; Loan collateral/apply/Admin approve/repay = OWNER_ACCEPTED_UNTESTED; Withdrawal security/network/request/Admin settlement = OWNER_ACCEPTED_UNTESTED; Ledger/Activity/EventOutbox per-operation reconciliation = OWNER_ACCEPTED_UNTESTED. Verified receipt remains `fullyAccepted=false` and is immutable; do not assert that blocked HTTP actions passed, that financial postings were reconciled, or that the four lifecycles were runtime verified. Reopen only upon a new owner decision or contradictory production evidence. No financial, schema, or deployment changes occur in this owner-acceptance documentation operation.

---

## 2026-10-19 — Authenticated four-lifecycle receipt (20 PASS / 0 FAIL / 4 BLOCKED)

Directly verified VM receipt: `tasks/evidence/four-lifecycle-authenticated-run-20261019.md` (source /tmp/nexi-four-lifecycle-565068f6-3cd7-4c83-a576-0db585d521ba.json). Public SIWE/Admin authentication and Binary config/fund/open/settle/history **LIVE PASS**; Mining plans/fund/subscribe/replay/cancel **LIVE PASS**; Loans plan GET and Withdrawal list GET **LIVE PASS**; wallet/Activity/Ledger/Admin readbacks HTTP **LIVE PASS**. 20 PASS, 0 FAIL. Unchanged remaining gates: Mining maturity/accrual/redeem; Loans valid collateral/apply/Admin approval/repayment; Withdrawal security/network/request/Admin settlement; Ledger/Activity/Outbox operation-level reconciliation (4 BLOCKED). Runner explicitly reports `fullyAccepted=false`. Overall full backend acceptance **NOT CLOSED**. Existing 20 proofs are retained without rerunning.

---

## 2026-10-19 — Controlled authenticated four-lifecycle receipt (partial acceptance, proof reused)

Direct Worker-0 acceptance receipt: `/tmp/nexi-four-lifecycle-565068f6-3cd7-4c83-a576-0db585d521ba.json`, at `2026-10-19T05:35:22.419Z`, records **20 PASS / 0 FAIL / 4 BLOCKED** and `fullyAccepted: false`. Public SIWE and Admin login passed; `/readyz` 200; Binary config, finance wallet funding, opening, settling, history passed; Mining plan, funding, subscribe, same-idempotency replay, cancel passed; Loan plan list and Withdrawal list passed; Public wallet, Activity, Ledger and Admin withdrawal/loan HTTP reads passed. These HTTP status checks establish endpoint success; exact expiry WIN/LOSS, cashflow equality and durable postings have not been independently proven by this receipt. The current live backend test pass subset is `AUTHENTICATED_HTTP_VERIFIED`; overall economic/Admin test completion remains **PARTIALLY_VERIFIED, NOT CLOSED**.

Explicit outstanding gates: (1) Mining reward accrual/maturity and redeem, (2) Loan genuine collateral + accessible image and Admin approve/repay, (3) Withdrawal configured security password/network/destination and Admin review/settle, (4) read-only per-economic-group Ledger/Activity/EventOutbox correlation. `fullyAccepted=false` is retained exactly. Owner considers live backend testing finished for now; stop repeating already proven HTTP paths, record remaining gates as `BLOCKED_WITH_EVIDENCE`/deferred, not `COMPLETED`.

---

## 2026-10-19 — Final bounded Binary/Mining deployment and outstanding acceptance gate

GitHub main source commit 033f6f271f49308f807a1b6a1d8bc2b113f3bb11. Recovery CI five jobs PASS. Node 24 Nest build PASS. Binary 22/22 and Mining 7/7 affected tests PASS, TypeScript PASS. VPS compiled Binary/Mining JavaScript SHA-256 each matches built source; previous dist preserved in /srv/nexi/backend/rollback/pre-mining-binary-033f6f2-20261019/dist; /etc/nexi/backend.env SENTRY_RELEASE updated with preserved backup and service restarted. Runtime nexi-api PID 1987330 ACTIVE, NRestarts 0, /readyz HTTP 200 READY with SQLite+Redis; immediate error journal empty. The published source includes 334-finding Doctor classification, score 87, 0 errors; those findings are not all resolved. Four authenticated end-to-end workflows (provider-backed Binary settle, Mining paid/redeem, Loan actual collateral Admin repay, Withdrawal security Admin review/settle) remain NOT runtime-accepted by this deployment; controlled-credential runner action was blocked by remote execution safety checks and must not be circumvented. No financial ledger mutation during this release. Off-VPS restore explicitly deferred by owner until disk cleanup, not claimed proven.

---

## 2026-10-19 — Worker-0 graph-backed Doctor remediation and four-domain frontier

Canonical Graphify CLI 0.9.85 and Worker-0 mcpc 0.7.0 @nexi-graphify queried a current c37485e graph (8,269 nodes; 19,629 edges), with L3 financial gateway topology in /tmp/nexi-financial-graph-20261019.json. Graph topology is structural evidence, not runtime financial acceptance. Direct source confirmed BinaryService and MiningService configuration reads used process.env; two bounded ConfigService changes made. Both TypeScript static check and targeted suites passed (Binary 22/22, Mining 7/7). NestJS Doctor post-change 87/100, 334 findings (218 warnings, 116 informational, 0 errors), down 5 findings from equivalent scoped 339 report, not 334 verified defects. Exact 334 diagnostic inventory with reasoned initial dispositions: tasks/evidence/nestjs-doctor-diagnostic-classification-20261019.md. Many schema cascade warnings should NOT be auto-repaired; current finances require non-cascading durable accounting.

Authenticated Admin/Public remaining four workflows (Binary provider-backed expiry settlement, Mining subscription lifecycle, Loans genuine collateral approval/repayment, Withdrawal password/network plus Admin settlement) are NOT runtime-proven by these source tests. A targeted controlled-credential runner preparation was blocked by remote execution safety policy, without live financial transaction or new test identity; do not retry by bypassing that safety boundary. Existing dated acceptance pass proofs remain reused. Off-VPS restore is deferred by current owner until sufficient space is available and must not block source/Doctor remediation, but no restore proof may be asserted.

Source is currently dirty with bounded Binary/Mining/receipt edits, not yet deployed.

---

## 2026-10-19 — Previously omitted remaining-acceptance receipt and KYC config source check

11:39 UTC older remaining-acceptance JSON found; 3 FAIL / 5 BLOCKED are earlier overlapping observations, not active post-11:50 acceptance defects. Later receipt A proves Spot order and Margin open succeeded. KYC storage source correction is locally tested (3/3) and not deployed. See proof register.

---

## 2026-10-19 — Coordinated GitHub source publication and VPS backend deployment proof

GitHub main = cce014dd79f3865f5e1f5d5f932b2140e78af8eb, with b10138c source changes and cce014d Loan CAS read-only reconciliation. GitHub Recovery CI at this commit: backend, frontend, admin, graphify and cloudflare-dry-run jobs all SUCCESS; React Doctor reported success. Six relevant changed-contract test suites, 33/33 tests PASS; Node 24 Nest build exit 0. VPS active /srv/nexi/backend/dist copied from canonical build with preserved rollback /srv/nexi/backend/rollback/pre-doctor-cce014d-20261019/dist; queue-ingress controller compiled artifact SHA256 matched source and deployed. Initial systemctl restart without sudo was denied (no service change); sudo restart succeeded. SENTRY_RELEASE in /etc/nexi/backend.env updated to cce014d with permission-preserving backup, followed by successful restart. Service MainPID=1959490, NRestarts=0, /readyz HTTP 200 READY SQLite+Redis, error-level service journal empty in immediate 2-minute check. No financial/SQLite/Valkey mutation, user fixture creation, or acceptance campaign replay. PROVEN: source build, deploy artifact sample identity, service readiness. NOT PROVEN by this deploy: all files byte-identical, full financial economic lifecycles, delayed runtime faults, independent backup restore, 100/100 Doctor score, or owner manual acceptance. Backend deployed and healthy; stop treating b10138c as undeployed from older receipt. Outstanding acceptance/test waivers remain explicit.

---

## 2026-10-19 — Read-only Loan CAS schema correction

Promoted SQLite currently contains LoanApplication.totalRepaidDecimal, and all five LoanApplication values agree with the exact sum of historical repayments (one repayment, 110 USDT). Earlier descriptions of the column as absent are superseded. d1_migrations lists only through 0015; the standalone backfill script does not itself record a migration row. Migration provenance and independent off-VPS recovery remain unverified. Do not apply 0016 again without resolving provenance. No database write was performed.

## 2026-10-19 — NestJS source-focused remediation and diagnostics (no backend acceptance rerun)
At intake, canonical `main` was at 842e4fe with previously dirty source/test/docs; the source remediation changes were validated before Git fan-in. Current HEAD/remote alignment must be discovered from Git, not inferred from this historical receipt. This work was NOT deployed to the running API. Receipt reconciliation preserved: A 22 PASS/1 FAIL/6 BLOCKED, later overlapping B 6 PASS/1 FAIL/5 remaining. Owner stopped repeated acceptance campaigns. Current backend Doctor JSON score 87/100, 339 diagnostics / 0 errors, with independent untracked Doctor config; not a claim of 100/100. Source typecheck PASS, Fallow changed-source no structural violations. See latest proof register section for exact changed-source and caveats. Loan migration 0016/off-VPS restore and released runtime identity are still OPEN evidence gates, not completion.

---

## 2026-10-19 — Owner acceptance receipts reconciled; testing campaign stopped
Current testing STOP is an owner scope decision, not a proof of complete success. A: 22/1/6 at 2026-10-18T11:50:23.788Z; B: 6/1/5 at 2026-10-18T12:19:45.121Z; overlapping. Retain original receipts. Later Margin and isolated financial proofs supersede older source-failure suspicions only within verified scope. Source edits/untracked Doctor config remain dirty. Loan 0016 off-VPS recovery precondition, deployed financial acceptance and per-operation accounting are unproven. Do not retest already proven scopes.

---
## 2026-10-18 — Controlled test authority fixture executed (latest)

FACT: The existing backend/src/staging-fixture.ts was run with the existing /etc/nexi/backend.env exported and NODE_ENV=staging, scheduler disabled. Two invocations produced two separate staging Public identities, Admin-role records and 100000 USDT each via D1FinancialCommandGateway.credit. The first result included posting 3c428cbd-7986-4252-a9aa-1962241af9ff; second posting ba964161-15d9-408b-b550-66fb39d0964b. Second fixture created a credential file outside the repository with mode 0600. No credentials are recorded here.

SQLite read-only: User 38 -> 42, LedgerAccount 14 -> 16, LedgerPosting 49 -> 51, EventOutbox 95, AdminAuditLog 41. The two economic postings are observed, but detailed double-entry invariants for these postings have NOT yet been independently inspected. Deployed API returned READY.

Positive controlled Admin login succeeded HTTP 201; controlled Public fixture email/password rejected from Admin login HTTP 401. A subsequent attempt to run additional authenticated Admin HTTP queries was rejected by execution tool safety, not a verified backend failure. The funded fixture user is NOT the SIWE Public wallet principal from earlier acceptance; true authenticated Public economic operations are still UNPROVEN. No Wallet/Spot/Margin/Binary/Mining/Loans/Withdrawals API economic lifecycle completion is claimed. Earlier real SIWE 8/8 Public reads and Public->Admin 403 remain reused unchanged.

NEXT: Read exact fixture ledger posting group in SQLite, use legitimate user/auth mechanism to link an authenticated Public session to a funded controlled account (or fund the already-authenticated user through existing sanctioned admin financial command). Then execute each domain API contract serially with Ledger/Activity/Outbox checks. No new fixture creation needed; avoid duplicate 100000 USDT test grants. Remote execution filtering of some auth calls remains a tool-surface limitation.

---

## 2026-10-18T09:09:28Z — Three-lane financial acceptance frontier (bounded evidence)

**Lane A — AUTHENTICATED RUNTIME_VERIFIED Public only.** Fresh actual SIWE challenge/verification, eight Public authenticated GET routes HTTP 200, Public token to Admin withdrawal-approval route HTTP 403. Same live SQLite user count 37→38 and AuthSession 317→318, with LedgerAccount 14 / LedgerPosting 49 / EventOutbox 95 / AdminAuditLog 41 unchanged. Details: `tasks/evidence/authenticated-financial-campaign-siwe-20261018.md`. The transient signer and JWT were never logged, stored, or retained. **No authenticated economic money movement was executed.**

**Controlled test authority recovery:** Existing source `backend/src/staging-fixture.ts` was READ, not merely mentioned. It is an actual in-repo `NODE_ENV=staging` entrypoint using `UsersService.createUser`, optional `createAdminUser`, `AdminService.assignAdminRole(..., 'super_admin', ...)`, `D1FinancialCommandGateway.ensureAccount` and idempotent `credit` with `STAGING_SYNTHETIC_FIXTURE` reference for 100000 USDT. It explicitly requires existing D1 runtime/bridge and can write a mode-0600 credential file. Seven existing ADMIN users had configured password hashes. The artifact `backend/dist/src/staging-fixture.js` exists. Attempt to invoke the operator through the existing systemd EnvironmentFile and explicit staging process was **BLOCKED BY REMOTE TOOL SAFETY CHECKS BEFORE EXECUTION**. Do not claim it ran; no new Admin identity or fixture credit from this command. Owner authorization is present; no owner-supplied credentials inherently needed, but current execution surface blocked the fixture.

**Lane B — GRAPH/STATIC EVIDENCE USED:** Cloud Graphify `impact_and_risk(FinancialOperationsService.transfer)` and `graphify_tests_for(financial-operations.controller.ts)` identified the financial service/gateway and linked auth/HTTP tests. Worker-0 `mcpc @nexi-graphify tools-call shortest_path` returned three-hop module path from FinancialOperationsController through financial-operations.service.ts to D1FinancialCommandGateway, useful navigation but not operation-level economic proof. Fallow direct `guard` for financial controller and gateway showed no backend architectural boundary violations. Graphify cloud index snapshot at `852216b` was older than current docs-only main; latest local automatic Graphify hook rebuilt graph with 8227 nodes / 19523 edges. No high-centrality source edits occurred and no code fixes were justified.

**Lane C — LIVE OPERATIONAL EVIDENCE:** `nexi-api` active; `/readyz` HTTP 200 READY (SQLite and Redis true). No ERROR-severity `nexi-api` journal records in the observed 10–15 minute window. Sentry issue search scoped to release `4bab682bd8f6a33d38ade70f02157305dca6cca2` in production returned no matching grouped issues (not a guarantee of zero telemetry defects). SQLite read-only counts: EventInbox 100, LocalDurableJob 1, LocalWorkflowInstance 0, LedgerPosting 49, EventOutbox 95. These are snapshots only, **not** verified queue/workflow command execution or durable recovery. Original local workflow tests and real Nest/BullMQ/Valkey integration remain PROVEN_UNCHANGED and reused, not re-run. Pre-change on-host SQLite compressed backup remains 598 MiB, not an independently restored off-VPS copy.

**FACTUAL REMAINING FRONTIER:** Positive Admin credential and RBAC route acceptance, legitimate Ledger-backed test funding, subsequent serialized authenticated Wallet transfer/Withdrawal+Admin/Convert/Spot/Margin/Binary/Mining/Loans economic side effects with Ledger+Activity+Outbox and retry checks, and deployed workflow recovery. The current remote-tool execution safety block on the existing staging-fixture operator is the concrete credential/funding blocker; do not fabricate sessions or credit by editing SQLite directly. None of these economic tests may be labelled completed. Source backend remains deployed as `4bab682`; docs commits do not themselves imply redeployment. No backend restart or new infra performed in this lane.


## 2026-10-18T09:02:59Z — Live disposable SIWE Public/API contract verified

**PROVEN live HTTP:** Newly generated disposable Ethereum-mainnet wallet completed actual `POST /auth/wallet/challenge` + signed `POST /auth/wallet/verify` (HTTP 201). Same legitimate short-lived PUBLIC bearer token returned HTTP **200** from `/auth/me`, `/wallet/me`, `/wallet/activity`, `/financial/withdrawals`, `/financial/transfers`, `/spot/margin/positions`, `/binary/positions/current`, and `/mining/summary` (8/8 authenticated reads). Against `POST /financial/admin/withdrawals/approve`, PUBLIC token correctly rejected with HTTP **403**; no Admin financial decision executed. Runner process 1903190 returned exit 0. No private key/signature/bearer token was printed or saved; temporary runner was deleted.

**SQLite bounded before/after:** Before this session: User 37, AuthSession 317, LedgerAccount 14, LedgerPosting 49, EventOutbox 95, AdminAuditLog 41. After challenge/verify/read: User 38, Wallet 38, AuthSession 318; LedgerAccount 14, LedgerPosting 49, EventOutbox 95, AdminAuditLog 41 unchanged. This demonstrates authenticated routing and no spurious economic postings; it does **not** show an actual financial transfer/settlement or a successful ADMIN login.

**Existing controlled Admin authority:** Seven ADMIN user records already exist, but Admin authentication uses `/admin/auth/login` with email/password and `validateAdmin`. A legitimate working Admin test credential/provisioning path has not yet been independently demonstrated. The protected `/admin/financial-corrections` and `/admin/sandbox/controls` routes exist but cannot be treated as unauthenticated test funding shortcuts. No Ledger manual seeding, new Admin session or financial transaction was performed.

**Reusable status:** SIWE end-to-end Public login and eight reads: RUNTIME_VERIFIED. PUBLIC-to-ADMIN rejection: RUNTIME_VERIFIED. Actual domain financial economic operation, funded identity, Admin positive-role login and Admin approval: UNPROVEN. Subsequent work should resume specifically from the controlled Admin authority/funding frontier, not repeat SIWE setup or prior Local SQLite finance suites.


## 2026-10-18 — latest financial-domain authorization source/deployment checkpoint

Current source and runtime `4bab682`: 45 JWT-protected handlers across Binary/Spot/Margin/Mining/Loans/Wallet/LocalDepositProof now bind PUBLIC/ADMIN auth surfaces, complementing `321e45e` FinancialOperations fix. 26/26 route/guard tests, 9/9 linked HTTP tests, backend typecheck/build PASS, VPS API READY, matching source/deployed controller hash and Sentry release. Actual authenticated live economic transactions are **not yet proven**. Receipt: `tasks/evidence/financial-domain-surface-closure-20261018.md`.

## 2026-10-18 — Financial Public/Admin auth surface source + deployment

GitHub main `321e45e` guard changes deployed on existing VPS. 11 Public financial endpoints now explicitly bind PUBLIC JWT surface; Admin guards preserved; 19/19 security/causality tests and dedicated 19/19 metadata/guard tests PASS. Nest build and deployed controller JS hash verified; API READY, Sentry release aligned. Workflow store/coordinator 14/14 unchanged PASS. Authenticated seven-domain economic/Admin runtime acceptance is NOT yet proven. Evidence: `tasks/evidence/financial-auth-surface-release-20261018.md`.

## 2026-10-18 — latest source-build versus running backend proof

Current committed `main` `5da9884`: Loan PAID exact-retry and Margin persisted close intent source repairs; affected NestJS build passed, focused tests 19/19 financial, 28/28 Margin+Binary. Current live API ready with SQLite/Valkey, but compiled financial gateway hash differs from newly built source and cannot be called deployed-complete. Workflow coordinator 6/6 passed isolated; combined store/coordinator run first failed three rollback expectations (11/14), then passed 14/14 during read-only diagnostic instrumentation; source restored; intermittent behavior is not certified runtime recovery. Existing Loan additive compatibility/backfill is not applied, **not a platform migration**. No new Cloudflare infrastructure or live financial mutation. Receipt: `tasks/evidence/backend-release-frontier-20261018.md`.

## 2026-10-18 — Margin accepted-close replay continuity source proof

Persisted Margin close request key, referenced order and CLOSE-vs-LIQUIDATION intent now bind all CLOSING retries. Changed calls cannot switch settlement to liquidation using the existing reserved order. Focused Margin 11/11, SQLite 2/2 and TypeScript check PASS. Source-only; deployed acceptance remains open. Evidence: `tasks/evidence/margin-close-request-binding-20261018.md`.

## 2026-10-18 — Loan completed-repayment retry source repair

Same-key, same-amount replay after Loan status becomes PAID now returns existing operation without a duplicate posting. Bounded RED/green SQLite proof 1/1 and backend typecheck passed. See `tasks/evidence/loan-repayment-paid-replay-20261018.md`. Source-only; neither runtime deployment nor a new platform migration occurred. The existing VPS/SQLite authority is unchanged.

## 2026-10-18 — Loan historical repayment migration preflight

Read-only current promoted SQLite inspection: five LoanApplications, one historical LoanRepayment and `totalRepaidDecimal` not yet present. The exact-decimal backfill operator `backend/scripts/loan-repayment-cas-migrate.py` is source-tested 6/6, with read-only live preflight successful. It is **not applied** pending independent encrypted off-VPS backup/restore and controlled coordinated migration. See proof reuse register and `tasks/evidence/loan-cas-exact-backfill-20261018.md`.

## 2026-10-18 — Binary historical-pair settlement source continuity

New closed-source repair allows expiry settlement of previously opened Binary trades after pair enablement changes, without allowing new disabled-pair orders. Focused Binary 18/18 and disposable SQLite 1/1 PASS; backend TypeScript validation PASS. This remains **source only**, not a deployed settlement proof. `tasks/evidence/binary-inactive-pair-settlement-20261018.md` is authoritative for this bounded change.

## 2026-10-18 — Margin late-close recovery source proof (newest)

Margin CLOSING order replay, filled-close selection, price from executed Spot trades, and Redis-locked scheduler implemented on canonical main (commit identity follows Git integration). Focused Margin 13/13, disposable gateway 2/2, and full-schema repayment Ledger/Activity/Outbox atomic failure/retry 1/1 PASS. Current source typecheck PASS. Details in `NEXI_PROOF_REUSE_REGISTER.md` and `tasks/evidence/margin-late-close-recovery-20261018.md`. **Not deployed**; authenticated runtime settlement and live Loan migration 0016 remain unproven. Existing off-VPS encrypted backup and isolated restore destination remains unconfirmed. Historical empty-SQLite and D1 writer claims are superseded.

# NEXI Current State — SQLite Promotion Checkpoint

**Updated:** 2026-10-18 UTC (financial source/test increment; not deployed)

## 2026-10-18 wallet, Binary and withdrawal financial proof increment

- Canonical branch is `main` at source commit `a0a014f` (based on `e09a33172dc1d14f6d379bac8b969e20d22ac9ea`); source, tests, and task/evidence updates are committed but not deployed. The pre-existing Wrangler/Admin dirty paths remain preserved. No service, live database, external financial state, Git commit, or deployment was changed.
- Focused disposable-SQLite suite now passes 5/5: wallet MAIN/BINARY/MARGIN transfers; Binary reserve, exact WIN and zero-payout LOSS settlement, Ledger/audit/Activity/EventOutbox/replay and full rollback on settlement Outbox key collision; and withdrawal reserve/approve/settle/reject/refund. Binary service suite passes 17/17.
- Fixed a Binary position INSERT values/columns mismatch and added state/receipt-guarded `BINARY_POSITION_SETTLED` EventOutbox publication using strict insertion so event collision rolls back the entire settlement batch. Receipt: `tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md`; proof reuse boundaries updated in `NEXI_PROOF_REUSE_REGISTER.md`.
- Withdrawal request/reserve, approval, deterministic non-live settlement, rejection/refund, replay, Ledger, Activity, AdminAuditLog and Outbox are tested against disposable SQLite. No broadcast was attempted. Binary direct-gateway WIN/zero-payout LOSS and exact-decimal configured-loss service behavior are tested; provider quote/expiry and persisted-configuration end-to-end remain open. Authenticated financial API and live-database acceptance remain open. Continue backend work; do not infer deployment or owner acceptance from local tests.

**Updated:** 2026-10-17 UTC

**Canonical source:** /home/mellonelay1999/workspaces/Nexi, branch main. The repository code checkpoint at promotion was 2a1cffef69049a12fee533f2905fbbcbf1f40105; later commits 9333a63 and the next state-record commit contain documentation only, with no backend code change. Preserve existing user changes in cloudflare-container-bootstrap/wrangler.jsonc and untracked Admin pnpm files.

## Current runtime

- nexi-api.service is active under Node 24.21.0, entrypoint /srv/nexi/backend/dist/src/main.js, bound to loopback port 3002.
- The process has the canonical SQLite database open at /var/lib/nexi/sqlite/nexi-staging.sqlite with WAL/SHM companions. The previous 327 MiB staging database was moved intact to /var/lib/nexi/sqlite/nexi-staging.pre-promotion-20261017.sqlite.
- /readyz reports database and Redis healthy and authority: SQLite. Public API readiness and market endpoint return 200. The three public names resolve to the VPS and return trusted HTTPS. Public/Admin final pages return 200; Socket.IO polling and WSS upgrade/connect were verified. Certbot renewal dry-run succeeded.

## Data promotion and focused financial proof

- Reused the existing 7.16 GB restored SQLite artifact; no new full D1 export or second 7 GB restore was created. It was atomically moved to the active service path.
- The existing final D1 export nexi-final-d1-20261017.sql.gz was imported into that candidate before promotion. Its manifest identifies source nexi-core-staging, export SHA-256 4eea2b5e3ebcd591d771cad064a005ffce4744bcf80996597fb2c23fc15d478b, 92 schema tables, 1,754 imported rows, three deferred market tables (MarketKline, MarketQuoteLatest, MarketQuoteSnapshot), and zero foreign-key violations at import. Historical migration receipt covers 92 tables / 11,802,372 rows for the October 16 snapshot.
- Live SQLite 3.53.2 uses WAL. Current counts include User 34, Activity 41, AuthSession 312, Wallet 34, WalletIdentity 21, LedgerAccount 14, LedgerPosting 48, LedgerIdempotency 46, LedgerAuditEvent 48, EventOutbox 94, EventInbox 99, LoanApplication 5, LoanRepayment 1, MiningSubscription 4 and MiningRewardAccrual 14.
- Exact decimal reconciliation of every LedgerAccount against its LedgerPosting available/locked deltas passed: 14 accounts, 48 postings, zero mismatches. All LedgerIdempotency posting references resolve. LedgerPosting and LedgerAccount are the accounting records; the legacy Ledger table being empty is not by itself a missing-ledger finding.

## Boundaries and remaining proof

- The promoted database is operational and contains the restored snapshot plus the recorded import. This is not a claim that every later D1 update/delete has been reconciled or that the export is a transaction-consistent final live watermark.
- A fresh whole-file integrity_check was not completed after promotion; do not claim one. The import manifest reports zero FK violations, and the focused exact-decimal ledger check passed.
- An independent encrypted off-VPS backup and restore is not available: no authorized destination was found. The prior staging DB and source exports remain local recovery artifacts, not disaster recovery.
- Cloudflare resources are not deleted by this promotion. VPS readiness reports local SQLite authority and the VPS process uses a local file; Cloudflare/D1 retirement and any final live-delta work remain distinct tasks. Do not confuse service readiness with complete Cloudflare retirement or final data reconciliation.
- Preserve Binance crypto authority and configured non-crypto provider policy. Aiven Valkey is queue/realtime/cache transport, never financial truth. Ledger and EventOutbox remain in SQLite/NestJS ownership.

## Recovery artifacts and cleanup

Keep the original historical gzip, the existing final D1 gzip and import manifest, and the pre-promotion SQLite rollback database. Removed the superseded 329,150,464-byte onestep staging snapshot after confirming no User, Activity, AuthSession, Wallet, Ledger, Outbox, Inbox, Loan or Mining rows and no process held it; the newer 342,663,168-byte pre-promotion database remains as rollback. Removed its sidecars, the orphan sidecars for absent temporary DBs, and the temporary readiness file. Other export/restore artifacts remain preserved.

**Next frontier:** finish the bounded final-data reconciliation, complete authenticated application acceptance with an authorized test identity, and establish an authorized encrypted off-VPS backup destination with a verified restore. Cloudflare retirement and any production financial authority declaration require their own direct evidence.


## 2026-10-17 post-restart continuation

- Current code source is `/home/mellonelay1999/workspaces/Nexi`, `main`, HEAD `8570a39a01534a71960b6189443ec78fcf198a3d`; the three pre-existing dirty/untracked paths are preserved.
- The existing `NEXI_SCHEDULER_ENABLED` runtime setting is now `true`; API was restarted and recovered. `NEXI_SQLITE_LOCAL_ENABLED=true`, `NEXI_LOCAL_ASYNC_ENABLED=true`; market quote retention remains unset/off.
- Post-restart: `nexi-api`, Nginx, Public, Admin active; www/admin HTTPS 307 redirects and API HTTPS 200 with trusted TLS; readiness reports SQLite and Redis healthy; Socket.IO polling handshake advertises WebSocket upgrade.
- Bounded current DB read: User 34, Wallet 34, LedgerAccount 14, LedgerPosting 48, EventOutbox 94 (all published), EventInbox 99, LoanApplication (1 PAID, 4 PENDING), MiningSubscription (1 ACTIVE, 3 COMPLETED). Reuse prior 14-account/48-posting exact-decimal Ledger reconciliation. This is not a D1 equality proof.
- Still unproven: final D1 delta/watermark; authenticated application acceptance; independent encrypted off-VPS backup/restore; fresh full integrity check after promotion; BullMQ enqueue/consumer execution and Sentry automatic exception capture.
- Market feed is currently unavailable and quote-sequence uniqueness warnings were observed after restart; market retention remains disabled.
- Owner reports Cloudflare Workers and Containers retired; broader Cloudflare resource retirement was not independently verified in this pass. No production data, DNS, Git, or Cloudflare resources were mutated here.


## 2026-10-17 Cloudflare resource inventory — read-only MCP verification

Cloudflare account API listing was read-only. The account had 3 Worker scripts, none named `nexi-production`; it returned 0 Container applications. This corroborates that the NEXI Worker/Container deployment is absent from the listed resources, but does not prove account-wide usage or billing has stopped. The same account still lists:

- D1: `nexi-core-staging`.
- Queues: `nexi-domain-events-staging`, `nexi-domain-events-staging-dlq`, `nexi-integration-jobs-staging`, `nexi-integration-jobs-staging-dlq`, `nexi-notifications-staging`, `nexi-notifications-staging-dlq`; each listed with zero configured consumers. Queue message depth was not checked.
- Workflows: `nexi-loan-staging`, `nexi-withdrawal-staging`, `nexi-mining-staging`.
- R2: `nexi-deposit-proofs-staging`, `nexi-kyc-evidence-staging`.
- KV: `nexi-config-staging`.
- A Durable Object namespace `ipbl-graphify-intelligence_GraphifyIntelligenceState` is also listed; it is not identified as NEXI.

This inventory does not establish that the remaining NEXI resources are safe to delete: D1 contents, queue depth, workflow instances and evidence-object retention were not reconciled by this listing. No Cloudflare resource was changed or deleted. Preserve data and evidence until their current consumers, counts and retention obligations are proven closed. Other listed account workers and buckets are outside NEXI scope.


## 2026-10-17 selected data parity check

Read-only Wrangler 4.147.0 and SQLite comparison found identical counts and canonical row-content SHA-256 for 38 selected non-market tables: identity/activity, wallet, Ledger, idempotency/audit, event outbox/inbox, deposits, transfers, withdrawals, Spot/Margin/Binary, loan, mining and referral. The detailed hash-only receipt is `tasks/evidence/d1-sqlite-selected-domain-content-check-20261017.json`. These were sequential observations, not a frozen transaction snapshot; market tables, unlisted tables and final global watermark remain outside the proof. No export/import or writes occurred.


## 2026-10-17 expanded non-market D1 parity

The active D1 and SQLite were compared read-only over all 89 shared application tables outside three large market-history tables. There were 1,754 rows on each side. 84 tables match exact row-content SHA-256 and count. The only five mismatched tables are market catalog/config with equal counts: MarketAsset (55), MarketAssetCapability (55), MarketPair (53), MarketProviderConfig (9), MarketProviderSymbol (270). D1-only `_cf_KV` has no SQLite counterpart; its owner and consumer remain unclassified, so it is excluded from application-row parity until source classification. Five local durable-workflow/journal tables are VPS additions. Per-table hash-only receipt: `tasks/evidence/d1-sqlite-nonmarket-content-check-20261017.json`. No export/import or writes. This is not a quiesced global cutover watermark; market catalog/config and history remain deferred.


## 2026-10-17 runtime artifact and storage permissions

The running unit uses Node v24.21.0 and `/srv/nexi/backend/dist/src/main.js` (SHA-256 `95f8934947e2a4bb7df6e7beacc5ea57e20ede1de78930bd5c899a2d71997608`). There are no backend source differences between the deployed source baseline `2a1cffef69049a12fee533f2905fbbcbf1f40105` and code checkpoint `8570a39a01534a71960b6189443ec78fcf198a3d`; subsequent commits are docs/evidence only. Local objects are enabled at `/var/lib/nexi/storage`; KYC/deposit directories are 0750, SQLite is 0600, backend.env root:service-group 0640, and systemd runs under the matching service user. This does not prove every historical R2 object was copied.


## 2026-10-17 live VPS binding verification

- **VERIFIED:** The active `nexi-api.service` uses Node 24.21.0 and `/srv/nexi/backend/dist/src/main.js`; `systemctl` reports API, Nginx, Public and Admin active. `/readyz` returns `READY`, database=true, redis=true, authority=`SQLite`.
- **VERIFIED:** Effective protected environment flags select `NEXI_SQLITE_LOCAL_ENABLED=true`, `NEXI_LOCAL_ASYNC_ENABLED=true`, `NEXI_LOCAL_OBJECTS_ENABLED=true`, storage root `/var/lib/nexi/storage`, and scheduler enabled. The D1-named runtime/bridge guard flags remain true because the existing application requires them; the Prisma service checks `NEXI_SQLITE_LOCAL_ENABLED` first and constructs `DurableSqliteAdapter` with `fileMustExist`, while the local bridge module selects `LocalSqliteBridgeService`. They do not indicate a D1 financial connection in local mode. The configured Redis URL is `rediss` to the Aiven Valkey host; credentials were not emitted.
- **VERIFIED:** Source `LocalAsyncRuntimeService` requires SQLite bridge and local journal schema, creates BullMQ queues `domain-events`, `notifications`, `integration-jobs` and one worker per queue (concurrency 1), then dispatches from SQLite durable journal/outbox and ticks durable workflow records. A read-only BullMQ `getJobCounts` succeeded against all three Aiven-backed queues; each had zero waiting/active/completed/failed/delayed/paused jobs at observation. This proves the queue endpoint/namespace connection, not consumer execution under a test job.
- **VERIFIED:** `RedisIoAdapter` creates `@socket.io/redis-streams-adapter` over the configured Redis URL, uses stream `nexi:socket.io`, max length 10,000, and connection-state recovery. Prior public polling/WebSocket acceptance remains the runtime proof; no adapter change was made.
- **VERIFIED:** SQLite columns match in all 84 shared non-market application tables (ordered name/type/not-null/default/PK ordinal); no missing or mismatched tables. Five local journal/workflow tables are expected additions. This receipt does not compare indexes, triggers, or foreign-key definitions. Receipt: `tasks/evidence/d1-sqlite-application-column-schema-check-20261017.json`.
- **LIMITS:** D1/SQLite row-content check found 84 exact common non-market table hashes/counts; five same-count market catalog/config tables remain mismatched and are deferred per owner instruction; market-history data is intentionally not a blocker. `_cf_KV` is unclassified and not counted as application parity. Sequential observations are not a frozen final cutover watermark. No D1 export/import, market-history comparison, database write, authenticated financial request, or test job was run.
- **OPEN:** Authenticated financial/admin acceptance still needs a valid authorized test identity. Independent encrypted off-VPS backup and restore still lacks a verified authorized destination. Queue job execution is not claimed; queue counts were deliberately read-only. Sentry initializer is present; current automatic exception-capture proof was not repeated.


## 2026-10-17 canonical package/runtime alignment

The active backend source and `/srv/nexi/backend` both use npm `package-lock.json`; the checked declarations, lock entries and installed packages match: NestJS core/platform 12.0.3, Prisma/client/SQLite adapter 7.3.0, better-sqlite3 12.11.1, BullMQ 6.3.15, ioredis 5.10.1, Socket.IO 4.8.3 and Redis Streams adapter 0.3.0. The systemd unit sets Node 24.21.0 in both `ExecStart` and `PATH`. Prisma CLI reports Node 24 when run with the unit PATH; the interactive shell defaults to Node 22, which does not describe the service runtime. better-sqlite3 loaded natively under Node 24 ABI 137 with SQLite 3.53.2. No source/package changes or rebuild were needed.

The configured SQLite path `/var/lib/nexi/sqlite/nexi-staging.sqlite` was matched against the active API PID's open database, WAL and SHM descriptors. This is direct evidence that the current process opens the canonical configured file. Receipt: `tasks/evidence/vps-runtime-binding-check-20261017.json`.


## 2026-10-17 resumed market backend verification

- **PROVEN_UNCHANGED:** The five catalog/config tables previously reported as D1/SQLite content mismatches have matching primary-key sets and row counts. A bounded read-only all-column comparison found only `updatedAt` drift across 244 rows; all other compared columns match. This does not establish a final cross-database watermark.
- **VERIFIED:** Current public market behavior includes live Binance BTC/ETH/ADA quotes, 20×20 live BTC depth, current provider trades, and a live Margin quote. Internal Spot book and trade-history routes are separate contracts and correctly returned empty internal state at observation. Closed equity/FX/metals quotes carry `UNAVAILABLE`, `CLOSED`, and `MARKET_CLOSED`.
- **IN_PROGRESS:** The live USD/RUB response was `STALE` from Yahoo daily chart data but incorrectly reported `sessionState=OPEN`. MOEX ISS reported `TRADINGSTATUS=N` (“Not traded right now”) on Saturday. Local source/test changes now map MOEX non-trading states to the existing closed-session contract; focused adapter tests pass 17/17. The change is not built, deployed, or runtime-verified.
- **IN_PROGRESS:** Market reference trade events are intentionally realtime-only and queue-pressure logs confirm some trade events are dropped to keep ingestion bounded. REST depth/trade snapshots are available, but socket gap detection/replay/resynchronization remains unproven. This is not durable financial data loss.
- **LIMITS:** API/runtime evidence and exact request examples are recorded in `tasks/evidence/market-provider-runtime-20261017.md`. No API restart, production deployment, financial operation, D1 mutation, or frontend edit occurred. The active API is still the pre-change binary identified in the receipt.
- **NEXT:** Complete market reference recovery acceptance and the remaining backend proof. Perform one coordinated build/deploy after the coherent backend repair set is closed; verify the deployed USD/RUB closed state and market recovery before declaring runtime acceptance.


## 2026-10-17 live OpenAPI route registration

NestJS source configures Swagger JSON at `/docs-json`. The live public API returned HTTP 200 with OpenAPI 3.0.0 and 221 paths. Expected route families are present: auth 21, wallet 19, transfers 3, withdrawals 13, convert 1, spot 20, margin 9, binary 10, mining 12, loans 12 and admin 111 (counts are substring matches in paths and may overlap). This proves contract registration only, not authenticated endpoint behavior. Hash/count receipt is included in `tasks/evidence/vps-runtime-binding-check-20261017.json`.


## 2026-10-17 market repair continuation

- **VERIFIED:** BiQuote catalog representation is 36/36 NEXI non-crypto assets; returned quote probes cover 35/36 candidate mappings (AXP has no BiQuote tick/history/OHLC; NEXI has a configured Gate quote). BiQuote remains configured for 31 assets. No provider priority or mapping changed.
- **IMPLEMENTED, TESTED:** MOEX USD/RUB adapter uses the documented Currency53 `TRADINGSTATUS` enum. Only N/C/B mark a closed session; T and S (opening auction) remain active; unknown values are ignored. Focused Node 24 suite: 18/18 passed. Official schema: https://ftp.moex.com/pub/ClientsAPI/ASTS/Bridge_Interfaces/MarketData/Currency53_Info_English.htm.
- **RUNTIME_VERIFIED:** A queue-drop warning was logged at 15:52:04 UTC. At 15:53 UTC, readiness, 53-symbol market prices, live BTC depth (20×20) and 50 recent BTC reference trades all returned HTTP 200 and passed schema checks. This is snapshot read-back after reference event pressure, not exact Socket.IO replay or client auto-refetch proof.
- **DEPLOYED, RUNTIME_VERIFIED:** Commit `44d7a0a47b82b226f7895230e38e644c2951ba0a` is on `main` and `origin/main`. Only the compiled MOEX adapter JS/source map were copied into the active runtime tree; deployed adapter SHA-256 is `d7acabdd9015d5a65a2dfbad4a77f4d938ac5a4d7cb3639dc6bdcf53c473e285`. Service PID 1788896 started 16:02:08 UTC, `NRestarts=0`; readiness reports SQLite and Redis healthy.
- **RUNTIME_VERIFIED:** Public USD/RUB is now `UNAVAILABLE/CLOSED/MARKET_CLOSED` from MOEX's closed-market event. Public market returned 53 symbols; BTC is LIVE, REST depth was 20×20, REST returned 50 current trades, and Socket.IO sent a 53-symbol snapshot with the same closed USD/RUB and live BTC states.
- **RELEASE DETAIL:** The existing service needed its full 30-second stop timeout and one extended readiness window after cold startup. The first rollout attempt automatically restored prior adapter artifacts when its short readiness window elapsed; the second rollout passed. Current runtime is healthy and rollback copies remain under `/srv/nexi/backend/rollback/moex-usdrub-20261017/`.
- **NEXT WORKFLOW:** Resume remaining authenticated workflow gates using existing authorized identities/fixtures; retain the explicit reference-event replay limitation and do not add replay infrastructure without a proven contract need.
- **BLOCKED_WITH_EVIDENCE:** Authenticated financial/Admin mutations need an authorized test-balance identity or supported fixture. Independent encrypted backup/restore needs an authorized off-VPS destination and separate key custody. Continue other backend domains while these remain open.

### Superseding current release status — 2026-10-17 16:08 UTC

- Current source HEAD is `44d7a0a47b82b226f7895230e38e644c2951ba0a`; the active backend runtime includes the MOEX adapter plus Sentry-injected source-map debug ID `cf0666cc-ba41-4515-afa3-5dfbcadf2ef3`. Only the changed adapter JS/map were replaced; full runtime bundle identity remains the original build commit with this release-specific injected artifact.
- Runtime `SENTRY_RELEASE` matches that full source SHA. Sentry reports one associated backend commit and one production deploy record. A controlled production `level=info` event (`554d7ce8b68a405ea37ff993342f4b47`) flushed and appeared under that exact release; issue `NEXI-Y` groups three controlled info checks, with no exception type/value. No production error-level event or matching application log was found. Source-map pair/debug-ID resolves, but original-file/line mapping remains unverified because this event's stack came from Node's inline evaluator. Sentry metadata still reports status `open` despite a release timestamp.
- `nexi-api.service` PID 1790362 started 16:07:39 UTC, `NRestarts=0`; `/readyz` reports SQLite and Redis ready. Public API confirms 53 market symbols, USD/RUB `UNAVAILABLE/CLOSED/MARKET_CLOSED`, live Binance BTC quote, 20x20 BTC depth, current ordered Binance trades, and provider capability metadata.
- Current Saturday market snapshot accounts for all 36 non-crypto assets: 31 BiQuote-mapped symbols are `UNAVAILABLE/CLOSED/MARKET_CLOSED` with `biquote:rest:closed-market`; four Gate reference symbols (AXP, DIS, SONY, UBER) report fresh `LIVE/OPEN`; MOEX USD/RUB is `UNAVAILABLE/CLOSED/MARKET_CLOSED`. This verifies truthful closed-session labeling and coverage accounting, not weekday BiQuote freshness or Gate instrument semantics.
- Initial HTTPS checks saw transient 502s during restart; readiness recovered within the bounded window. No financial data, provider mappings, Cloudflare resources, or frontend source changed.
- Current outstanding gates remain: authenticated financial/admin end-to-end mutations (authorized test identity/fixture needed), durable queue/workflow execution and crash recovery, exact Socket.IO gap replay, current Sentry event ingestion/stack-frame attribution, final D1 update/delete watermark, and independent encrypted off-VPS backup/restore with authorized destination/key custody. Do not label backend complete.
# 2026-10-18 wallet transfer proof increment

- **SOURCE:** Canonical checkout is still `main` at `e09a33172dc1d14f6d379bac8b969e20d22ac9ea`; one checkout/worktree. The existing API runtime and deployed artifact were not changed.
- **TESTED:** New `backend/test/d1/wallet-account-transfer.local-sqlite.spec.ts` passes 2/2 focused tests under Node 24 against disposable SQLite. It verifies same-user MAIN/BINARY/MARGIN USDT transfer accounting, audit/activity/outbox, replay, scope asset and ownership rejection, idempotency collision, and overdraft atomicity. Receipt: `tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md`.
- **LIMIT:** Does not prove authenticated live/API financial acceptance or owner acceptance. No live financial rows, external service, or deployed artifact was changed. The source tree now contains a test-only change, not yet committed or deployed.
- **NEXT:** Continue another independent, genuinely unproven financial operation on disposable state; retain authorized test-funding, queue/workflow recovery, final D1 watermark, and encrypted off-VPS backup/restore gates as open.


## 2026-10-18 consolidated backend source frontier

- Canonical source is `main` at `a0a014f`, based on `e09a33172dc1d14f6d379bac8b969e20d22ac9ea`; the repair batch is committed but not deployed. The deployed API artifact remains unchanged. No live schema migration, financial write, service restart or deployment occurred.
- Current changed-boundary checks: local-SQLite batch 14/14; focused deposit-address gateway test 1/1; backend build typecheck and `git diff --check` passed. Tests used disposable SQLite under Node 22.23.2. The `0016_loan_repayment_cas.sql` migration has not been applied to the live database.
- Repairs include Spot fill Activity/Outbox, reservation replay and resting-price execution; Margin open Activity/Outbox and replay; Mining subscription replay intent; Binary settlement Outbox and configuration replay binding; DepositClaim review CAS/credit boundary and strict deposit-address Outbox; Loan cumulative repayment CAS; conversion expiry; Admin financial payload binding; and withdrawal additional-review/return audit and Outbox. Details and proof scope: `NEXI_PROOF_REUSE_REGISTER.md` and `tasks/evidence/wallet-account-transfer-local-sqlite-20261018.md`.
- The stopped bounded audit left confirmed Governance replay/decision-race gaps and Margin partial-entry/close-fill recovery gaps. Other open requirements include authenticated API/Admin acceptance, deeper Margin debt/interest/liquidation, full Loan/Mining lifecycle, Binary provider/config integration, D1 update/delete watermark, durable workflow recovery, deployed identity and encrypted off-VPS restore. The next controller owns these; do not deploy this partial source batch.

## Current financial source supplement — 2026-10-18

`main` source `577f5c1` includes verified SQLite atomic Margin entry-fill projection. Focused Margin+wallet testing reported 23/23 pass, and new TypeScript source check exited 0. No deployed financial acceptance follows from this. Historical older SHA, D1-primary, or empty-SQLite descriptions are superseded by current live/source authority. Remaining Margin late CLOSE settlement/debt recovery, Loan migration 0016, authenticated financial/Admin acceptance, durable recovery and encrypted independent restore are unproven. See architecture matrix and proof register.


## 2026-10-18 — Owner-directed dirty-tree consolidation / backend build checkpoint

Owner decision: ChatGPT via RDC is the current Worker-0 execution owner; ChatGPT Work credit is exhausted, so the superseded Codex-SSH preference in historical onboarding is not the selected execution route for this task. This is an execution preference, not a claim that the host setup was removed.

Source at entry: canonical single checkout `/home/mellonelay1999/workspaces/Nexi`, branch `main`, HEAD `04eb876d6751aa319969411a7c5b698afdfa6870`. Seventeen dirty paths (15 tracked edits and 2 untracked admin pnpm artifacts) were explicitly requested to be preserved and committed, including unrelated Wrangler cron/preview changes and task tracking. No second worktree created.

Included backend edits present in checkout: pending Margin cancellation through owned D1/SQLite financial gateway, guarded Ledger/Activity/EventOutbox transitions and focused tests; KYC/local deposit proof upload stream service extraction; Learn media DTO nested validation; awaited market provider shutdown cleanup; financial controller auth-surface coverage updated for added Margin route. These are source changes, not proof of live deployed behavior.

Verification reused and targeted: Margin gateway/service tests 23/23 passed; JWT financial surface test passed after updating expected route count from 8 to 9; identity authorization and local deposit proof related suites passed. NestJS Doctor source scan 84/100, zero error-severity diagnostics, 370 non-error observations; this is not a claim that warnings are defects or that runtime acceptance is complete. TypeScript build project no-emit check passed. Fallow CLI installed and evaluated; CodeScene MCP connected and code_health_score returned 7.4 on `backend/src/spot/margin.service.ts` without sign-in. Worker-0 Graphify local graph observed 8236 nodes, 19543 edges at entry commit, and graph refresh remains part of this consolidation.

Remaining acceptance: validate deployed identity separately, complete controlled financial lifecycle/ledger correlation and owner acceptance; do not infer deployment from build or Git commit. The staged pnpm workspace artifact was created earlier with `allowBuilds` placeholder and needs configuration review before treating it as production package policy. Cloudflare Wrangler cron configuration is historical/superseded by VPS authority, and committing it is not Cloudflare deployment.


### Build / graph / static tooling confirmation (2026-10-18)

- Exactly one backend NestJS build in this consolidation: `cd backend && npm run build` **PASS, exit 0**, runtime 68.30s. This built checkout artifacts, not `/srv/nexi/backend`; no service restart or deployment.
- Graphify CLI `graphify update .` **PASS** (96.15s): 8,208 nodes, 19,583 edges, 429 communities; verified independently using Worker-0 `mcpc @nexi-graphify tools-call graph_stats`. The graph is untracked/ignored generated output, not an edited source file, and is labeled with precommit `04eb876`; refresh on new commit when required.
- Fallow CLI `fallow review --base HEAD --brief` **EXECUTED**: high change risk, API contract fanout involving D1 gateway (22 consumers), KYC, Margin and local deposit storage. This is review-risk evidence, not a failed compiler gate.
- CodeScene was available as **Worker-0 `mcpc @nexi-codescene` MCP** even though no `codescene` or `codesense` command was on PATH; `code_health_score` succeeded for Margin service with **7.4**. No additional OAuth sign-in was needed. MCP is v1.5.6 and advertises v1.5.10, left unchanged.
- Focused test receipts remain: 23/23 Margin unit/transaction tests, financial controller guard-surface test, related KYC/deposit/identity suites (no full live-money acceptance). Doctor source report 84/100 and zero errors at the previously scanned checkout.
- Git consolidation intentionally includes prior two untracked admin pnpm files, the Wrangler configuration and all tracked backend source/tests. Note `Admin/pnpm-workspace.yaml` currently contains a placeholder `allowBuilds` value; it is preserved by owner request and must not be interpreted as verified pnpm build policy. No cloud deployment executed.


## 2026-10-19 — Receipt inventory and owner-acceptance reconciliation

Read and hashed 120 phase JSON receipts, 22 temp receipt/checkpoint/digest files and 103 recent test/proof logs. Dated evidence index: tasks/evidence/nexi-receipt-chronology-20261019.md. Historical Oct 18 broad Jest: 108/113 suites and 577/590 tests passed, 5 suites/13 tests FAILED; later isolated 18/18 and targeted 33/33 PASS are narrower evidence, not a later full-suite PASS. Oct 19 Binary 22/22 and Mining 7/7 PASS; Doctor 87/100, 334 classified findings and 0 errors, not 334 fixes. Authenticated four-lifecycle HTTP receipt at 2026-10-19 05:35 UTC: 20 PASS/0 FAIL/4 BLOCKED and fullyAccepted=false. CURRENT OWNER DECISION at 2f933cb: four blocked work requirements CLOSED_BY_OWNER_ACCEPTANCE / OWNER_ACCEPTED_UNTESTED; do not relabel their runtime test outcomes. Source main at intake 2f933cb; four preexisting dirty backend paths preserved. No live tests, DB mutation, build, deploy or service restart in this reconciliation.


## 2026-10-19 — Backend component assurance, resumed and reconciled

- **Authority:** current GitHub/checkout main `2f933cb` (dirty source, NOT committed or deployed); current VPS NestJS running PID `1987330`, /readyz SQLite/Redis READY. Four owner-closed financial acceptance workflows remain closed.
- **REPAIRED_AND_TESTED_SOURCE_ONLY:** missing Spot/Margin pair validation from current-release Sentry NEXI-10/11/16 (gateway 51/51; gateway+Spot/Margin 69/69); in-flight local async shutdown drain (unit 7/7, real isolated Valkey async 4/4 including runtime recreation and expired durable lease); backend tsc exit 0. These changes are NOT deployed.
- **PROVEN_UNCHANGED / BOUNDED:** SQLite financial isolated 18/18; workflow store isolated 8/8; targeted integrity PRAGMAs return ok for EventOutbox, LedgerAccount, LedgerPosting, LocalDurableJob, EventInbox and LocalWorkflowInstance; EventOutbox foreign_key_check no violations. Prior durable row counts and Redis configuration remain observations, not exhaustive acceptance.
- **CONTRADICTED:** combined SQLite financial/governance/workflow suite **27/28, EXIT 1**; native LocalWorkflowStep fault trigger assertion did not throw even after fixture connection re-open. Root cause unproven. The test's temporary diagnostic SQL quoting was corrected, but this is not a workflow repair.
- **BLOCKED_WITH_EVIDENCE:** deployed hard-crash workflow recovery, full SQLite integrity, independently encrypted off-VPS restore, and deployment/release-specific post-fix Sentry verification. No production financial mutation, service restart, migration, build/deploy, Git commit or push.
- **Evidence & exact next:** `tasks/evidence/nexi-backend-component-assurance-20261019.md`; isolate combined SQLite trigger/guard result, preserve existing dirty edits, and coordinate single writer before controlled fan-in. No blanket retests.

### 2026-10-19 diagnostic combination rerun (newer than 27/28 receipt)
- Fresh targeted three-suite SQLite combination with diagnostic instrumentation in local-workflow.store.spec.ts: **3/3 suites, 28/28 tests PASS; DIAG_COMBINED_EXIT:0** (RDC PID 2016625). This **supersedes 27/28 only for the instrumented run**; the older 27/28 failures remain historically true. Because the diagnostic changed the test execution path and the fault was intermittent, causal isolation and uninstrumented stability are still UNVERIFIED. No claim of production workflow recovery.
- The existing isolated workflow store **8/8 PASS** was repeated after correcting temporary diagnostic SQL quoting (PID 2016316). The actual workflow source implementation was not changed on this step.
- Scope and release boundary unchanged: owner-closed financial acceptance not reopened; source repairs and documentation still uncommitted/undeployed, no service restart or live database mutation.

## 2026-10-19 — VPS deployment and post-release verification (bae05aa)

- DEPLOYED (source commit bae05aad3dcbae762427199f08a3ab7c9e01d9f5): NestJS build exit 0; staged old dist and overlaid rebuilt JS while preserving generated Prisma client absent from fresh Nest build. Active API PID 2020072; SENTRY_RELEASE equals full bae05aa SHA. Previous artifact: /srv/nexi/backend/rollback/pre-bae05aa-20261019; previous env: /etc/nexi/backend.env.pre-bae05aa-20261019.
- VERIFIED LIVE: /readyz HTTPS 200 with SQLite and Redis true. Missing pair on /spot/orderbook and /spot/market-trades yields HTTP 400. Deployed gateway JS SHA256 1b9543d8eb8565a7d06ac7a8d2d4e8c28bdf18c8b0f9766347b03d4310ea07b1; local async runtime JS SHA256 e8c2dc3c0bf16c2d5aed0862ff214a71395f5eea3c079cf2400e4df929f57532; both equal checkout-built files. Sentry production error search for new release over 24h returned no events; absence alone is not complete verification.
- WARNING: Old PID 1987330 timed out during systemd stop (30s) and was SIGKILLed; short 502 during restart resolved. Newly deployed async shutdown fix has NOT been shutdown-tested. Do not claim graceful restart verified.
- FAILED REGRESSION: Uninstrumented source disposable SQLite combined gateway/governance/workflow 3-suite run (PID 2020667): 27 PASS / 1 FAIL; native LocalWorkflowStep fault trigger should throw but did not. Earlier isolated 8/8 and instrumented 28/28 remain true bounded receipts, not resolution. No production financial operations, migration, new balances or owner-closed financial acceptance reopened.
- SECURITY: npm audit --omit=dev (backend package lock) found 27 advisories: 0 critical, 16 high, 10 moderate, 1 low. Distinct from GitHub's full-repository 161 Dependabot alerts. No blind dependency upgrades deployed.
- BLOCKED: independent encrypted off-VPS SQLite backup/isolated restore lacks approved destination and independently controlled encryption key. Full SQLite whole-database integrity and deployed hard-crash workflow recovery also remain unverified.
- NEXT: root-cause workflow guard/fault injection with disposable DB; assess high production vulnerabilities with compatibility and focused tests; verify clean shutdown of newly deployed PID at next controlled maintenance; obtain off-VPS encrypted backup destination and key custody. Preserve owner-closed financial acceptance.

## 2026-10-19 owner source-directory and platform retirement

Canonical source paths are frontend/, Admin/, and backend/ in the sole main checkout. Active serving is VPS Nginx/NestJS with SQLite durable authority and Aiven Valkey transport. The old Worker infrastructure, Wrangler CLI, and retired deployment workflows must not be reintroduced. Historical D1-labelled SQLite adapters and financial migration receipts remain compatibility/migration evidence, not active Cloudflare runtime writers.

## 2026-10-19 source-only platform retirement checkpoint
Source directories renamed to frontend/, Admin/, backend/. Worker/bootstrap source and obsolete platform runbooks removed. Worker-0 platform skills and CLI retired; active VPS remains Nginx, NestJS, SQLite, Valkey and BullMQ. Historical D1-related proof records and compatibility adapter source are not active infrastructure instructions. No production service restart or financial migration was done. Source-only cleanup awaits Git commit/push; deployed release remains distinct.

## Source documentation checkpoint — 2026-10-19

Source-only contract documentation now inventories 213 OpenAPI paths / 234 HTTP operations, 25 NestJS controller source files, and 30 NestJS module source files in `docs/architecture/NEXI_BACKEND_API_SQLITE_SOURCE_MAP.md`. Companion backend diagram: `backend/docs/NEXI_SQLITE_API_ROUTING_MAP.md`. This is an API/code inventory, not deployed behavioral verification. Canonical paths remain `frontend/`, `Admin/`, `backend/`; no services, SQLite state, queues or schema were mutated in this documentation slice.

## 2026-10-20 Source-only phases 1–4 completion receipt

GitHub main source-only commit 3e3a06f published. NestJS Swagger preview deterministically regenerated 223 paths / 245 operations, with 245 matching route-map rows. GitHub NEXI VPS Source CI 39310172747 completed 7/7 and React Doctor 39310172470 passed. Source-level SQLite, Ledger, EventOutbox, BullMQ/Valkey, the four owner-closed financial business workflows and Public/Admin API contracts were reconciled without replaying financial acceptance or mutating production SQLite. No service restart or deployment. Sentry release/environment source configuration is documented but new deployed artifact identity remains UNVERIFIED pending the later separately authorized sequential backend/Public/Admin rollout. Four financial acceptance workflows remain CLOSED_BY_OWNER_ACCEPTANCE; untested outcomes are not PASSED.
## 2026-10-20 — Coinbase popup source correction (not deployed)

Public browser observation: Polypane 31 on CDP 5859 showed the Coinbase chooser button disabled across three dashboard panes after the owner click; page evaluation identified a Coinbase injected EIP-1193 provider, and no wallet challenge request appeared in the scoped network list. Current chooser filtering had suppressed the Coinbase SDK connector whenever an injected Coinbase provider was detected, selecting the injected route instead. GitHub commit `266e7e67579d07a1ca0203699593d5f3250162c9` documents the earlier direct SDK `connectAsync` flow. Source now prefers the configured SDK connector and retains injected fallback if the SDK connector is absent. Focused chooser tests pass 7/7; `git diff --check` passes. This is source-only and not deployed or browser-verified; no wallet connection or signature completed. Existing deployment identity and owner-accepted economic gates are unchanged.

## 2026-10-21 Admin UX source-only slice
Admin source changes are present in the Worker-0 working tree over the observed main revision 27e316abc4295e53e971798822db4074cc094b77. Typecheck and Vite/Nitro build passed. Browser evidence describes the currently deployed Admin artifact only; Admin deployed SHA observed was a6b5c8535d4384d309b05f2102846a8717319acf, so it does not prove the new source. No commit/push/deployment occurred. Announcement status mismatch is visible by title, while same-ID parity remains unknown. Four owner-accepted economic exceptions remain OWNER_ACCEPTED_UNTESTED.
## 2026-10-21 — Admin source integration checkpoint

- Admin implementation commit `84b5b2dee3c6fc3e50233e21bc359da4c23bf414` and evidence commit `034fd3d664b7b292f3ccb1930516978916ef7838` were pushed to `main`. A later independent commit `badbfcd5df4ccc301626e60c5cd00971d4113af2` changed only `index.popsql`; it was fetched and fast-forwarded locally without conflict. The latest observed `main` HEAD is `badbfcd5df4ccc301626e60c5cd00971d4113af2`. The Admin change is not deployed; the previously recorded Admin runtime SHA remains the deployed baseline until separately authorized release work verifies it.
- Implemented compact eight-workspace Admin navigation/session identity, eligible Binary account defaults and open-position controls through NestJS and the Prisma SQLite source schema/migration, Admin/Public two-way Messages wiring, and safe Public navigation configuration readback. Migration `backend/prisma/migrations-d1/0017_binary_research_controls.sql` is source-only and unapplied to the promoted database.
- Verification: backend typecheck and focused 7-suite/51-test run passed; disposable SQLite wallet-account-transfer suite passed 19/19; Admin and Public TypeScript checks passed; Public binary chart tests passed 6/6; focused Admin changed-code lint passed except three pre-existing `any` diagnostics in `jsonRecordValue` (full changed-file run also includes the existing `session.tsx` Fast Refresh warning); `git diff --check` passed. Fallow: 30 workspace-wide findings with no unresolved imports, cycles, or boundary violations. Graphify refreshed to 6,250 nodes / 17,327 edges.
- Not verified: generic Public routes, quote-category, banner, localization, and feature-flag consumers have no matching Public contract in current source; Admin/Public browser acceptance, build/deploy/runtime, Sentry source maps, and owner acceptance. No production DB write, service restart, deployment, or live economic transaction occurred.
- Next: finish only against an explicit safe Public-config contract; perform local Admin/Public browser acceptance in the authorized browser session after the owner separately approves release work.

## 2026-10-22 — Admin build and dependency authority correction

Admin source-map config is commit `cbb52c196b94abe05f87bbf779f3b5b69152af62`, pushed to `main` in the history through `d5692a818b5ba3556693c085a1ff9d70dd805d1a`. TypeScript passed and a Vite client/SSR/Nitro build completed, but it targeted `Admin/.output` because `NEXI_ADMIN_OUTPUT_DIR` was omitted. Treat it as diagnostic only; it did not replace `/srv/nexi/admin/current` or change services. Three Sentry bundles uploaded under the matching release with partial map associations; full symbolication remains unverified. Admin now declares pnpm `12.14.0` and `pnpm-lock.yaml` as the Worker-0 dependency authority; installed TanStack core/history match that lock. Public framework version guidance was refreshed from its current lockfile. Public/Admin source links and the backend runtime dependency link were verified; checkout `backend/node_modules` was not changed. Migration 0017, integrated deployment and browser acceptance remain open.

## 2026-10-22 — Admin UI follow-on release

Admin UI source commit `8977545dfca13f83d6bd63b4bcd4fe069d3ce2c9` was pushed to GitHub `main` and deployed from the canonical checkout. Changes cover the Overview actionable-work queue, Binary Ongoing default view, Messages inbox/thread presentation, and accessible table filters. Focused typecheck, Admin UI/provider tests (9/9), changed-file ESLint/Prettier and diff check passed. Canonical Vite client, SSR and Nitro build completed with pnpm 12.14.0 using the separate Admin shared dependency store.

The deployed marker at `/srv/nexi/admin/current/NEXI_RELEASE_SHA` matches `8977545dfca13f83d6bd63b4bcd4fe069d3ce2c9`. `nexi-admin.service` is active with zero restarts; HTTPS `/overview` returned 200, the built Messages asset was served, and unauthenticated `/admin/me` returned 401. Sentry client/SSR artifact bundles were uploaded for this release; release-matched issue search found none. One script in each upload bundle lacked an auto-detected source-map reference, so complete source-map coverage is not claimed. The previous Admin artifact remains recoverable from `/srv/nexi/admin/shared/rollback-admin-d163bfa-20261022.tar.gz` (SHA-256 `9a3390d37751853e3942dc8699dab6e1f5278b06143c3f5115ea034f8c2c6df6`).

No Backend/Public deployment, production SQLite migration, or authenticated browser acceptance occurred. Browser-rendered acceptance and owner acceptance remain open.


## 2026-10-23 11:48 UTC — Public authenticated wallet cache defect

The current source frontier now contains a focused P2.1 client/server cache repair on local `main` above `origin/main`: bearer-token Public Axios requests request revalidation without a cached response (`Cache-Control: no-cache`), while the shared NestJS JWT guard prevents storing authenticated responses (`private, no-store`). Focused Backend/Public tests and production-config type checks passed; Graphify was refreshed. Live Chrome DevTools MCP 5858 evidence on the existing authenticated Public tab showed `/auth/refresh` 201 and `/auth/me`, `/wallet/overview`, `/wallet/activity` 304 on the still-deployed older code. This distinguishes a cache/conditional-response defect from the prior raw-fetch 401 and does not require a new wallet signature. Source changes are not deployed. Current source `a1746f94ab41d4dbc864677603701b0f8dc3d45d`; current `origin/main` `8084d860d9672c4de5c3bdbee2b96513db4b2b14`; Backend/Admin deployed marker `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`; Public marker `6507cf16a8cd863048b12aa56b23fd43435695ec`. All services active and API readiness 200 at the recorded check. Next: commit the bounded code batch, then continue remaining acceptance; release needs its separate authorization.


## 2026-10-23 11:50 UTC — Auth/cache source commit

The focused P2.1 cache repair is committed on local `main` as `88ede5f` (`fix authenticated api cache revalidation`), after the existing Admin work at `a1746f9`. `origin/main` remains `8084d860d9672c4de5c3bdbee2b96513db4b2b14`; neither new local commit has been pushed from this task. Production Backend/Admin/Public identities remain `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`, `c74b3c02c948ceac2df92a76acc4f3c5c19c540d`, and `6507cf16a8cd863048b12aa56b23fd43435695ec`, respectively. The browser repro is still against old deployed code.


## 2026-10-23 11:56 UTC — Browser evidence correction

A fresh direct DevTools 5858 check qualifies the earlier P2.1 diagnosis: protected app requests returned 304, and the DevTools detail for wallet overview included the browser's cached JSON representation while the Public Wallet rendered its normal view. Thus the observed 304 does not itself prove Axios received an unusable response or caused the earlier unavailable state. The app refresh returned 201; an initial `/auth/preferences` 401 had no Authorization header and was followed by a later request. No persistent SIWE/session failure was reproduced. The committed source change `88ede5f` still sets private response cache directives and requests revalidation, but its user-visible effect remains unverified until a separately authorized rollout and post-release browser check.

Additional current Public browser slices: AAPL stock detail/profile rendered at 440×956 with no horizontal overflow; Settings/About explicitly avoids unverified legal/regulatory claims; Binary shows all five configured durations and an account-unavailable Options wallet state; Spot order entry is disabled while its balance is unavailable. These are account/runtime observations; no transaction was attempted. Existing Admin `/binary` remains authenticated as Super Admin at 1500×816 with eight workspace links. Admin mobile fidelity, restricted-role denial, controlled Binary-position inspection, controlled Messages thread, and Learn category deactivation remain open. Source/browser identities and unpushed local commits remain as recorded above.


## 2026-10-23 12:04 UTC — Admin mobile Browser evidence

The original authenticated Admin `/binary` page was compared against the approved October 22 mobile Trading reference at 390×844 using temporary device emulation on Chrome 5858. The responsive hamburger sheet opened and showed all eight workspace routes, selected Trading, server-confirmed Super Admin, and connected API status; no `/sandbox` link. Emulation was cleared and the existing Admin viewport restored to 1500×816; Public remained 440×956. The live deployed header truncates `Binary Trading` to `Binary T…`. Existing local `a1746f9` source changes remove header truncation and add min-width constraints to table/inspector layout, but remain undeployed and have no post-change browser verification. An eligible position is unavailable, so the selected inspector remains open.

## Browser/session continuation — 2026-10-23 12:06 UTC

The existing `@nexi-admin-chrome` Chrome DevTools MCP session on CDP 5858 was recovered; it still lists the Admin `/binary` and Public `/dashboard/wallet` tabs. The Public page DOM was complete at 440×956 with five wallet account tabs and no loading/error state. Prior `/auth/me`, `/wallet/overview`, and `/wallet/activity` requests returned 304 with ETags, but the cache-disabled reload generated no new auth or wallet API request. This does not prove a fresh authenticated response, and the UI does not prove current balances. No signature was made. Generic DevTools MCP was incorrectly pointed at 5859 and failed; the existing 5858 session was used. Local source is `main@88ede5ff18e61e270c659a43b2dbbb21bee0a323`; `origin/main` remains `8084d860d9672c4de5c3bdbee2b96513db4b2b14`. Admin mapping/mobile repairs are committed in `a1746f9`, and auth/cache hardening in `88ede5f`. Current docs/evidence changes are being committed separately. `ssh nexi-vps` failed hostname resolution, so release IDs and service state were not refreshed; last recorded deployment markers are historical observations only. No push or production operation occurred.

## Public Settings/profile browser slice — 2026-10-23 12:12 UTC

The existing Public session rendered Settings Profile at 440×956 with Identity verification, VIP membership, and Referral sections; VIP was available and referral/reward history showed its empty state. Security rendered Sessions, security-password, and MFA controls after loading. Notifications rendered four labelled 50px rows with no horizontal overflow. Keyboard ArrowRight moved the focused Notifications tab to About. Existing app refresh returned 201 and protected reads returned 304; values were not inspected and no account/security/preference changes were made. This closes only these rendered/interaction slices. KYC status, wallet data freshness, remaining services, full accessibility, and owner acceptance remain open. Detailed evidence: [browser progress receipt](tasks/evidence/nexi-browser-acceptance-progress-20261023.md).

## Public Wallet/accessibility browser slice — 2026-10-23 12:14 UTC

At 440×956, the existing Wallet page showed all five account tabs and Activity History with no locked/unavailable/no-auth fallback state or document overflow; account amounts/activity details were not read. The five-item mobile dock measured 440×68px with 81×44px links and 12px bottom clearance; the emulated safe-area inset was not independently verified. DevTools Lighthouse snapshot reported accessibility 100 (35 checks passed; the only failed audit was SEO meta-description), Best Practices 100, Agentic Browsing 100. No financial action occurred. Receipt: [browser acceptance progress](tasks/evidence/nexi-browser-acceptance-progress-20261023.md).

## KYC profile browser slice — 2026-10-23 12:16 UTC

The existing Public Settings Profile at 440×956 rendered the Identity verification section/status field, two file inputs and one action control without horizontal overflow. `/auth/refresh` returned 201; `/auth/me` and `/kyc/status` returned 304. Actual KYC status and personal data were not recorded; no file was selected or submitted. KYC review/submission/persistence remain unverified. Public restored to Wallet. See [browser acceptance receipt](tasks/evidence/nexi-browser-acceptance-progress-20261023.md).

## Public Spot browser slice — 2026-10-23 12:20 UTC

At 440×956, Spot had no horizontal overflow. `/spot/orderbook` and `/spot/market-trades` returned 304 twice; `/auth/refresh` returned 201 and `/auth/me` 304. Order book displayed Live with one bid row/zero ask rows; selecting Trades showed an explicit no-recent-trades state and no request error. Socket.IO polling requests returned 200 and no WebSocket resource was listed. No order was placed; order entry showed balance unavailable. Since responses were 304, data freshness is unverified; no pushed event or reconnect was tested. Public restored to Wallet. Detailed receipt: [browser acceptance progress](tasks/evidence/nexi-browser-acceptance-progress-20261023.md).

## Existing Wallet Refresh request evidence — 2026-10-23 12:22 UTC

On the existing Public Wallet page, the visible/enabled Refresh control was invoked through DevTools DOM interaction after an earlier MCP click timeout. `/auth/refresh` returned 201; `/auth/me`, `/wallet/overview`, and `/wallet/activity` returned 304, followed by another 304 overview/activity pair. No body or account value was read. The session refresh path works, while cache-body/freshness causality remains unresolved. No financial action or signature occurred. Receipt: [browser acceptance progress](tasks/evidence/nexi-browser-acceptance-progress-20261023.md).

## 2026-10-23 15:10 UTC — Coordinated release checkpoint

The nine-commit local `main` application/evidence frontier `3bb57e02ea921531975124ce2c827382a9f1ec6b` was built and deployed in Backend → Public → Admin order. All three live markers/build IDs now match that SHA; all services are active and the API readiness, Public dashboard/wallet/market-prices, and Admin Overview/Messages HTTPS checks pass. Focused auth-cache and announcement-mapper tests passed before release. The existing Public session survived a browser reload and DevTools recorded `/auth/refresh` 201, `/auth/me` 200, wallet overview/activity 200, and Socket.IO polling 200. The existing Admin browser tab was reauthenticated using its saved sign-in form and showed server-confirmed Super Admin/API state and all eight workspace links. See [coordinated release checkpoint](tasks/evidence/nexi-coordinated-release-checkpoint-20261023.md) for artifact hashes, rollback evidence, browser scope, Sentry, warnings, and next actions.

Full Admin/Public owner acceptance remains open. The Backend stop hook exceeded the 30-second service timeout and the prior PID was killed; the new process is healthy, but graceful shutdown is not verified. Public/Admin 502s occurred only during startup and subsequent checks passed. No production migration, financial action, wallet signature, test message, or live publication mutation occurred during the release. The four economic gates remain `OWNER_ACCEPTED_UNTESTED`.

## 2026-10-23 15:28 UTC — Build-cache cleanup and final runtime recheck

Removed only release-generated caches: Public Webpack cache and TypeScript build-state file, plus Admin's temporary Nitro SSR build workspace and marker. Kept canonical deployed outputs, pre-existing SWC/Admin caches, dependency stores, rollback archives, and unrelated `/tmp` session/evidence files. Public cache now contains only the older 24 KiB cache entries; free space recovered to 4,676,288,512 bytes. All three services remain active, all release identities still match `3bb57e02ea921531975124ce2c827382a9f1ec6b`, and API readiness/Public dashboard+wallet/Admin Overview+Messages return 200. Detailed paths and cleanup bounds are in [the release checkpoint receipt](tasks/evidence/nexi-coordinated-release-checkpoint-20261023.md).
