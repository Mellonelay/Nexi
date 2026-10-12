# NEXI Public Frontend Completion — Task Checklist

Authoritative execution checklist for `tasks/plan.md`. Update status/evidence/next action at every phase transition. All paths are relative to `/home/mellonelay1999/workspaces/Nexi` unless stated.

## Phase 1 — durable state and current source inventory

### NXF-001 — Establish task authority
- Owner requirement: one durable master plan and one actionable checklist; no competing copies.
- Source paths: `tasks/plan.md`, `tasks/todo.md`.
- Backend/Admin contract: NOT_APPLICABLE.
- Skills/tools: Agent Skills task breakdown; NEXI Work Kernel; RDC.
- Dependencies: none.
- Acceptance: existing task files checked; only authoritative pair created; current Git/dirty/worktree/session evidence captured.
- Verification: RDC file reads; `git status`, HEAD, `git worktree list`, sessions/searches.
- Status: VERIFIED — task authority and checkout/worktree preservation are established.
- Evidence: no existing task files; main @ `473323c876736bb3ca9ab39733b6ad82913fc8b3`; pre-existing dirty source/state files preserved; separate backend-closure worktree preserved; no RDC sessions/searches at phase entry; only authoritative pair created and read back.
- Next: maintain this pair as the sole task authority.

### NXF-002 — Map Public feature surfaces and source owners
- Owner requirement: classify every required feature from current source; never treat coverage requirements as presumed missing.
- Source paths: `cloudflare-container-bootstrap/dexi-frontend/app/**`, `app/lib/**`, `app/components/**`, `DESIGN.md`.
- Backend/Admin contract: verify API strings against `backend/src/**` and `apps/admin/**` per feature.
- Skills/tools: frontend UI engineering, source-driven development, Graphify Multi-View, RDC.
- Dependencies: NXF-001.
- Acceptance: all feature families below have a source owner, actual API path or NOT_APPLICABLE, proof requirement, status and next action.
- Verification: direct current source; directed graph is supporting evidence only.
- Status: VERIFIED — source owners and the required feature families are mapped; runtime proof stays deferred.
- Evidence: Bounded Public, NestJS and Admin source passes now cover the checklist feature families: market catalog/detail/favorites, Spot/Margin, Binary, wallet flows, KYC, VIP/referral/About, Mining/Loans/Learn/Support, Messages/Notifications/Announcements, SIWE/security, sonner, and Quiet Refraction source ownership. Confirmed frontend gaps have been repaired in their existing owners; no extra Public gap was found for the remaining mapped flows. NXF-016 zero-fee semantics remain blocked by absent authoritative fee evidence; KYC deployed binding, authenticated state transitions, chart/data and wallet-browser behavior remain final runtime proof items.
- Next: reuse the reconciled source map; complete the single changed-source gate and preserve runtime proof for the final coordinated acceptance pass.

### NXF-003 — Directed Public → NestJS → Admin graph
- Owner requirement: map only relevant directed paths and confirm each important edge directly.
- Source paths: local generated `graphify-out/**`; Public `app/lib/**`, route/components; `backend/src/**`; `apps/admin/**`.
- Backend/Admin contract: guards, DTOs, service/data authority, Admin provider/permission and readback.
- Skills/tools: Graphify Agent Workflows, Graphify Multi-View, RDC.
- Dependencies: NXF-002.
- Acceptance: feature edges recorded as requirement → Public component/action → API client → NestJS route/guard/service → canonical data authority → Admin control/readback or NOT_APPLICABLE → test/proof.
- Verification: refreshed graph timestamp and direct source checks; note graph JSON lacks commit SHA.
- Status: VERIFIED — direct source contracts are mapped; reuse the current graph and treat Graphify gaps as non-proof.
- Evidence: `graphify update` completed against the current working tree at 2026-10-12: 8,413 nodes / 18,931 edges / 450 communities; no commit SHA metadata. Graphify CLI directed path probes across the HTTP client boundary (favorites→UsersService, Public Settings→KycService, NotificationsPanel→CommunicationsService) returned no path; treat these as graph-boundary gaps, not missing implementation. Direct source confirms the corresponding endpoint/client/controller/service/Admin edges. Graphify reports 90 source files with no symbols (mostly declarations/data/config); no relevance to mapped feature paths established.
- Next: reuse this graph for source ownership/topology; direct source remains acceptance authority. Refresh only after any subsequent code-changing repair.

## Phase 2 — confirmed feature requirements

### NXF-010 — Dashboard and 53-market catalog
- Owner requirement: market discovery uses the separate canonical 53-instrument catalog; never merge with wallet funding currencies.
- Source paths: Public `app/dashboard/page.tsx`, `app/dashboard/asset/[symbol]/page.tsx`, `app/hooks/useFavoriteAssets.ts`, `app/lib/asset-registry.ts`, `app/lib/market-catalog.ts`, `app/hooks/useMarketData.ts`, `tests/e2e/favorites.spec.ts`.
- Backend/Admin contract: Authenticated PUBLIC GET/PATCH `/auth/preferences` accepts `tradingSettings: Record<string, unknown>`; `UsersService` normalizes JSON and `D1FinancialCommandGateway.updateUserPreference` persists the field in the user preference record. Favorites are a nested `favoriteAssetSymbols` value; the client shallow-merges the existing object to preserve other preference keys. No Admin market-favorites control exists in inspected source: NOT_APPLICABLE.
- Skills/tools: frontend UI engineering, Next/React, Graphify, focused tests; Fallow if callable.
- Dependencies: NXF-003.
- Acceptance: categories/search/favorites/selection, all 53 instruments and data states reconcile to source/API; no duplicate funding-asset list.
- Verification: catalog count and schema, direct API route/controller path, focused source tests; final rendering deferred.
- Status: SOURCE_IMPLEMENTED; RUNTIME_VERIFICATION_PENDING — Favorites/catalog repairs are in source; final tests and authenticated runtime remain.
- Evidence: Public `asset-registry.ts` has 17 crypto + 20 stocks + 9 forex + 7 metals = 53 definitions; backend `market-catalog.ts` declares the same four arrays and computed count. Dashboard offers Favorites/Crypto/Metals/Forex/Stocks and uses the shared asset registry/catalog; this remains separate from Wallet funding-currency lists. The previous gap was real: Dashboard Favorites returned `[]`, both Dashboard and Asset Detail stars were disabled. Implemented `useFavoriteAssets.ts` over authenticated `/auth/preferences`, merging `favoriteAssetSymbols` into the existing `tradingSettings` object and preserving other keys; the Dashboard Favorites tab now filters the existing live/fallback market catalog, and both pair-header/Asset Detail stars add/remove the same account-scoped entries. Anonymous sessions receive an explicit connect-wallet empty state; API failures render an unavailable state and mutation errors use Sonner. Added `tests/e2e/favorites.spec.ts` for account-preference loading, filtering, removal and preservation of another trading preference. Test not run yet under the consolidated source-closure gate.
- Evidence update: directly confirmed GET/PATCH /auth/preferences is guarded by JwtAuthGuard and AuthSurfaceGuard for PUBLIC; DTO accepts tradingSettings as an object; UsersService JSON-normalizes the preference; D1 gateway reads the existing value and shallow-preserves it when the patch does not replace it. Favorites client shallow-merges its loaded object before PATCH. Tightened error mapping so only 401 prompts wallet sign-in; 403 and other failures display unavailable. Star tooltips now distinguish loading, sign-in-required, unavailable and ready states. No source test has been run under the deferred consolidated gate.
- Next: finish source-closure coverage; execute tests/e2e/favorites.spec.ts during the single consolidated test pass.

### NXF-011 — Asset Detail and category metadata
- Owner requirement: asset-specific metadata and selected-asset handoff remain authoritative; display source-backed category metadata and provenance honestly.
- Source paths: app/dashboard/asset/[symbol]/page.tsx; backend/src/market/market-public.controller.ts; backend/src/market/market-asset-metadata.service.ts; backend/src/market/market-asset-metadata.mapper.ts; backend/src/admin/admin.controller.ts; apps/admin/src/admin/data/nexi-api-provider.ts.
- Backend/Admin contract: Public GET /market/assets/:symbol validates/normalizes the symbol, reads the canonical market asset, and adds MarketAssetMetadataService.getProfile(); metadata is cached with provider/fallback status and provenance. Category mapping is crypto→CoinGecko, stocks→issuer/Gate.io, forex/metals→Biquote with canonical fallback. Admin lists canonical market assets and toggles visibility under assets.view/assets.edit; it does not author asset metadata, so metadata Admin control/readback is NOT_APPLICABLE.
- Skills/tools: frontend-ui-engineering, source-driven development, incremental-implementation, code-review-and-quality; Graphify support plus direct source.
- Dependencies: NXF-003, NXF-010.
- Acceptance: each source-backed category field, safe external links, provenance and metadata freshness are displayed; selected symbol is preserved into Spot/Options; loading/ready/unavailable states remain honest.
- Verification: direct Public→Nest controller→metadata service/mapper→provider/fallback source; final typecheck/focused tests and render remain in consolidated gates.
- Status: SOURCE_IMPLEMENTED; RUNTIME_VERIFICATION_PENDING — category metadata/provenance repair is in source; final tests and rendered data-state proof remain.
- Evidence: direct controller/service/mapper review confirmed category fields and provenance contract. The former UI showed only a small subset. Updated the existing About Asset section to show common status/source/refreshed/expiry, crypto categories/supply/market stats, issuer/exchange/sector details, metal contract/session details, forex pair/currency/provider details, allowlisted HTTPS profile links and provenance source links with checked/verified timestamps. The existing loading/unavailable descriptions and Spot/Options handoffs remain. Admin source confirms only visibility controls; no metadata authoring edge. Code review found and fixed the empty metadata-source fallback when provenance is an empty array. No test/build/render run.
- Next: continue source closure; review this changed JSX in the consolidated static/type checks and test category data/provenance states in the final authenticated mobile render.

### NXF-012 — Spot/Margin market workspace
- Owner requirement: real chart, order book, recent trades, open orders/positions and supported controls; retain chart overlays/metrics while removing the bottom indicator toggle rail from Spot/Margin and Options as explicitly requested.
- Source paths: `app/dashboard/spot/page.tsx`, `app/dashboard/binary/page.tsx`, `app/components/TradingChart.tsx`, `RealtimeTradingChart.tsx`, market API/client, order/activity components.
- Backend/Admin contract: market depth/trades APIs and authenticated order/position routes; verify guard/data authority and Admin NOT_APPLICABLE unless source shows a control.
- Skills/tools: frontend UI engineering, Next/React, Build Web Apps, Graphify, Fallow if callable, focused tests.
- Dependencies: NXF-003.
- Acceptance: genuine API-backed depth/trades and order/position states; remove only specified bottom indicator controls on Spot/Margin and Options while retaining any chart overlay behavior required by current design; no fake data or behavior loss.
- Verification: direct endpoint/service/data path + focused UI tests/typecheck; consolidated render deferred.
- Status: PROVEN_UNCHANGED; RUNTIME_VERIFICATION_PENDING — required market/depth/trade/order behavior and indicator-rail suppression are already source-owned; preserve them and verify at the final gate.
- Evidence: current Spot wrapper passes `showIndicatorControls={false}` to both SPOT and isolated MARGIN charts; Binary/Options passes false as well. MA/EMA/BOLL/RSI/MACD/VOL calculations, overlays and metric readouts remain active. Public Spot calls GET `/spot/orderbook` and `/spot/market-trades`, refreshes them over the `/spot` socket, loads `/spot/orders/open`, `/spot/orders/history`, `/spot/trades/history`, and submits `/spot/order`. These `/spot/*` book/tape endpoints are a genuine internal Nexi venue: D1 open/partially-filled `Gate2SpotOrder` rows (top 50 per side) and D1 `Gate2SpotTrade` rows (last 50, source `nexi-internal-spot`). Separate public `/market/depth` and `/market/trades` provider endpoints exist but are not used by the Spot page; preserve the existing venue semantics. Margin UI calls `/spot/margin/quote` and authenticated GET/POST/close/mark position routes via `app/lib/margin-api.ts`; `listMarginPositions()` backs the displayed positions. Nest guards scope order/position mutations and reads by JWT user. D1FinancialCommandGateway is canonical for orders, trades and margin ledger positions. Backend also has GET `/spot/margin/activity`, but no Public caller was found and this task's accepted surface lists orders/positions rather than a separate Margin activity panel; do not invent that panel. Admin market/order controls: NOT_APPLICABLE. No code change needed for the requested indicator-rail removal.
- Next: source path is mapped; retain internal venue contract and include Spot/Margin order, book, trade and position cases in the consolidated verification pass.

### NXF-013 — Binary trade lifecycle
- Owner requirement: active trades, per-trade simulation/result, settlement and Activity reflect actual backend-configured state.
- Source paths: `app/dashboard/binary/page.tsx`, Binary chart/order/activity components and API client.
- Backend/Admin contract: map trade create/read/settle/activity NestJS routes, guards and D1/Ledger/EventOutbox authority; Admin control only if an actual endpoint exists.
- Skills/tools: frontend UI engineering, backend-contract read lane, Graphify, Fallow if callable.
- Dependencies: NXF-003.
- Acceptance: each displayed trade/result is associated with the correct trade ID and real backend status; sandbox/test data is labeled and never presented as production.
- Verification: exact API/service/settlement paths and focused lifecycle tests.
- Status: PROVEN_UNCHANGED; RUNTIME_VERIFICATION_PENDING — current trade-ID lifecycle and server settlement are mapped with no confirmed source defect.
- Evidence: Public Binary reads `/binary/config`, `/binary/positions/current`, and `/binary/positions/history`; opens via POST `/binary/position`; updates the matching position ID from `binary_position_update`, moves terminal states to history, and renders that position’s result/chart. It does not call `/binary/settle`: Nest's expiry scheduler settles eligible positions, and D1 `settleBinaryPositionAtomic` posts stake/payout ledger entries, audit/activity, and position transition. The scheduler is enabled only with `NEXI_SCHEDULER_ENABLED=true` and its Redis lock. Sandbox settlement is attached to a specific position/directive and visibly labeled `nexi-sandbox-simulation`; UI also shows the sandbox/test-data status. These Public calls match the guarded/current-history and create contracts. No Admin control path is relevant: NOT_APPLICABLE. Backend lane did not verify websocket auth or the precise service path used by the public response serializer; no Public gap is confirmed from current direct code.
- Next: keep settlement authority server-side; verify lifecycle IDs/status and sandbox label in the consolidated test/runtime pass.

### NXF-014 — Wallet overview and balances
- Owner requirement: accurate supported account scopes and balances; keep 53 market instruments separate from wallet funding currencies.
- Source paths: `app/dashboard/wallet/page.tsx`, wallet components/API client.
- Backend/Admin contract: balance/readback route, auth guard, canonical D1/Ledger authority; Admin NOT_APPLICABLE unless actual control.
- Skills/tools: frontend UI engineering, backend contract mapping, focused tests.
- Dependencies: NXF-003.
- Acceptance: totals, scopes, and holdings only use authoritative supported fields; honest unavailable/error states.
- Verification: exact endpoint/service/ledger read path and focused UI checks.
- Status: PROVEN_UNCHANGED; RUNTIME_VERIFICATION_PENDING — wallet readback and supported scopes are present; no source repair is confirmed.
- Evidence: Public source confirms /wallet/me and /wallet/activity are loaded independently; overview/account tabs and asset category filters are present. Activity rows are rejected without a source activity ID or ledger transaction ID. Backend contract lane directly confirmed JWT-scoped routes and WalletService requires D1FinancialCommandGateway for canonical MAIN-ledger balances; no legacy balance fallback. Public gap lane found no missing UI behavior. Deposit remains a separate, already-owned flow and was not reopened.
- Next: reuse existing wallet UI; include wallet readback in final authenticated acceptance. No source repair confirmed.

### NXF-015 — Deposit flow
- Owner requirement: preserve the already separate currencies/networks/address/QR flow; do not rebuild it.
- Source paths: `app/dashboard/wallet/page.tsx`, deposit sheet/components and wallet API client.
- Backend/Admin contract: existing deposit-address/network service and any Admin configuration; preserve exact current contract.
- Skills/tools: frontend UI engineering, source-driven development; no backend changes.
- Dependencies: NXF-003, NXF-014.
- Acceptance: source proves existing two-step asset→details flow and honest address/network/QR states; only actual regressions are repaired.
- Verification: prior proof reuse when current paths unchanged; focused invalidated test only.
- Status: PROVEN_UNCHANGED — preserve the already-proven Deposit flow; no source change.
- Evidence: the owner explicitly directs preserving the already separate Deposit currencies, networks, address and QR flow. The bounded Public lane intentionally did not reopen it; no Deposit component/API source changed in this slice. Reuse existing proof; no rebuild or rewrite performed.
- Next: keep untouched; include its existing interaction only in the consolidated acceptance if a changed dependency invalidates prior proof.

### NXF-016 — Withdraw, Transfer, Convert and Wallet Activity
- Owner requirement: preserve guarded financial actions, zero-fee Convert semantics, and authoritative activity.
- Source paths: wallet page/components/API client.
- Backend/Admin contract: map DTO/guards/service/D1 ledger/idempotency/EventOutbox; no duplicate financial logic in React.
- Skills/tools: frontend UI engineering, backend contract mapping, security/financial verification.
- Dependencies: NXF-014.
- Acceptance: each action uses source-owned contract; conversion fee is zero only where API/business rules affirm it; review/validation/error/activity states are truthful.
- Verification: source/API/service/ledger path + focused tests; no financial mutation.
- Status: PROVEN_UNCHANGED; RUNTIME_VERIFICATION_PENDING — zero separate Convert commission is source-proven; other guarded wallet actions remain runtime-deferred.
- Evidence: Public withdrawal checks security status then POSTs /financial/withdrawals with idempotency/security password/MFA; transfer POSTs /financial/transfers with recipient/asset/amount/idempotency; ConvertModal requests `/financial/conversion/quote`, displays returned input/output amounts, rate and expiry, then accepts by quote ID before refreshing wallet. Sonner success/error feedback exists. Backend contract lane confirmed guarded D1/Ledger-backed withdraw, transfer and conversion quote/accept paths. Gate2ConversionQuote has no commission field. FinancialOperationsService.acceptConversion passes the stored quote input/output into D1FinancialCommandGateway.acceptConversion; the D1 settlement debits exactly inputAmount and credits exactly outputAmount, with paired postings/audit/EventOutbox and no separate commission posting. The accepted market rate may include spread; this is not a zero-spread claim. No mutation was run.
- Next: retain current UI; preserve the conversion engine and UI; include quote/accept readback in the final authenticated runtime campaign.

### NXF-017 — KYC evidence and Admin review
- Owner requirement: front/back evidence upload, submission/status, authenticated Admin review integration.
- Source paths: `app/dashboard/settings/page.tsx`, KYC client/components; backend KYC controller/service; Admin provider and KYC views.
- Backend/Admin contract: Worker routes private evidence operations through `nexi-kyc-evidence` to the configured `KYC_EVIDENCE` R2 binding; verify current deployed binding separately from source configuration. Nest enforces ownership/content validation/status; Admin review uses explicit permissions.
- Skills/tools: frontend UI engineering, Cloudflare/R2 and security guidance only for relevant path, Graphify, focused tests.
- Dependencies: NXF-003.
- Acceptance: front/back files use correct endpoint/content type/size constraints; status transitions/readback map to backend; Admin review is live-provider-backed with no silent mock fallback.
- Verification: direct Public→Nest→`nexi-kyc-evidence` worker→`KYC_EVIDENCE` R2 binding and Admin provider→controller paths; focused source tests; actual authenticated flow deferred.
- Status: SOURCE_IMPLEMENTED; RUNTIME_VERIFICATION_PENDING — existing KYC upload/status integration is preserved; authenticated/Admin state proof remains.
- Evidence: Settings source uses GET /kyc/status, POST /kyc/evidence with file bytes and MIME content type, then POST /kyc/submit with returned evidence IDs/profile fields. Front is required, back optional, accepted MIME list and 5 MiB guidance are present; Sonner feedback exists. Public gap lane found no missing upload/submit/status UI. Backend contract lane confirmed JWT ownership, signature/MIME/ownership validation, private `kyc-evidence/{user}/{uuid}` key shape, and no document URL in status. Direct current Admin source confirms `/kyc` route, `kyc.view`/`kyc.decide` permission gates, live-provider `listKyc`, private evidence read `/admin/kyc/:userId/evidence/:side`, decision `/admin/kyc/decision`, and explicit unsupported reviewer/notes operations where canonical fields do not exist. Direct Cloudflare source confirms `cloudflare-container-bootstrap/kyc-evidence-storage.js` operates only on `env.KYC_EVIDENCE`, with the private key prefix and no-store/nosniff reads; `wrangler.jsonc` binds that R2 bucket and routes the Nest container through `nexi-kyc-evidence`. This proves the configured source path, not the live deployed binding.
- Next: preserve the Public/Admin flow; verify deployed binding and authenticated evidence readback only in the final runtime pass, while retaining unsupported reviewer/notes operations as unsupported.

### NXF-018 — VIP level, progress and benefits
- Owner requirement: show authoritative VIP level beside Profile, with progress and benefits.
- Source paths: `app/components/AccountIdentityHeader.tsx`, `app/lib/wallet-auth.ts`; backend `backend/src/referral-vip/referral-vip.controller.ts`, `referral-vip.service.ts`; Admin `apps/admin` referral/VIP provider and screens.
- Backend/Admin contract: authenticated PUBLIC `GET /vip/me`; Nest service returns level/name/progress/threshold/benefits/timestamps from D1-backed UserVipState/VipLevel. Admin endpoints read VIP users/levels and audit entitlement changes.
- Skills/tools: frontend UI engineering, React, source-driven development, focused tests; Graphify; Fallow if callable.
- Dependencies: NXF-003.
- Acceptance: actual /auth/me or /vip/me source is used; account profile shows level and usable progress/benefits without fabricated defaults; loading/unavailable states honest; Admin-controlled changes read back after refresh.
- Verification: current auth response inclusion or dedicated endpoint client; typecheck and focused component test.
- Status: SOURCE_IMPLEMENTED; RUNTIME_VERIFICATION_PENDING — VIP presentation is in existing header/Profile owners; runtime/Admin readback remains.
- Evidence: Implemented on the existing Public owners: AccountIdentityHeader derives VIP level/name from its cached `/auth/me` profile; Settings Profile now shows level/name, raw progress/threshold, and safely rendered benefit values, with a visual progressbar only when both values parse as a nonnegative current value and positive maximum. No new request or backend/Admin behavior was added. Backend `WalletAuthService.getCurrentUser()` includes `referral` and `vip` from `ReferralVipService.ensureAccountState()`; D1 `UserVipState` + `VipLevel` own values. Admin has guarded read/assignment APIs; the current Admin provider search found no VIP methods. Backend stores progress/threshold as text without unit semantics, so the UI preserves raw values rather than inventing units or a percentage. `npm run typecheck` passed (Next `typegen` + `tsc`); React Doctor scanned both files (90/100) and reported three existing Settings findings: SettingsPage complexity and two handler-only state warnings. Fallow repository-root audit completed; broad dirty-frontend styling findings are not attributed to this VIP change, and the VIP panel itself is no longer a high-complexity function. `git diff --check` passed.
- Next: include VIP level/benefit loading and Admin-readback refresh in the deferred authenticated mobile interaction campaign; do not add a new API request unless `/auth/me` ceases to supply VIP.

### NXF-019 — Referral attribution, rewards and history
- Owner requirement: referral history AND reward history: referred NEXI account identifier, attribution date/status; actual earned reward, asset, amount/date/status. Authenticated account-scoped canonical data only; do not backfill aggregates or expose private wallet data.
- Source paths: backend/src/referral-vip/referral-vip.controller.ts, backend/src/referral-vip/referral-vip.service.ts, backend/prisma/schema.d1.prisma, backend/prisma/migrations-d1/0014_referral_history_events.sql, backend/test/referral/referral-history.spec.ts, cloudflare-container-bootstrap/dexi-frontend/app/dashboard/settings/page.tsx.
- Backend/Admin contract: new JWT + PUBLIC-surface guarded GET /referral/history?limit=&offset= uses only request.user.userId; D1 reads are account-scoped and paginated. D1 migration records new Affiliate.referredBy transitions with attribution date/status and EventOutbox event. A second D1 trigger records only a positive CREDIT LedgerPosting with referenceType=AFFILIATE_REWARD whose reference identifies an actually referred account; exact ledger amount/asset/date are recorded with status COMPLETED, and an EventOutbox record is created in the same D1 transaction. No referral payout writer exists in current source; no payout economics were added. Admin aggregate /admin/referrals is not the Public account-history contract; Admin history UI is NOT_APPLICABLE to this Public task.
- Skills/tools: Agent Skills using-agent-skills, api-and-interface-design, cached frontend UI/source/incremental/testing/review workflows; Cloudflare D1 guidance; Graphify bounded query attempted but errored, so direct source + migration test are authoritative.
- Dependencies: NXF-003; migration 0014 is now applied to the deployed nexi-production CORE_DB D1 database; Public API runtime still requires release.
- Acceptance: Public Settings Profile shows separate referral and reward histories with paginated loading, empty/error/unavailable states. Legacy referral relationships remain visible with attributedAt=null and “Date unavailable”; legacy aggregate earnings and unlinked Reward rows are not converted into dated history. No private wallet/address fields are selected or returned. Future reward rows exist only when backed by an actual canonical affiliate credit posting.
- Verification: `backend/test/referral/referral-history.spec.ts` passed 4/4 after reward event IDs were included; covers account-scoped binds, pagination, authenticated request identity, no legacy backfill, actual credit-only reward capture, and Outbox writes. Public `npm run typecheck` passed. Migration 0014 applied once through Wrangler to D1 ID `522177fa-ac42-4d8f-a6a8-b34eed262f15`, confirmed as the `CORE_DB` binding on deployed Worker version 192; Wrangler reports no pending migrations, both tables/triggers/indexes exist, both new tables contain 0 rows, and migration history records `2026-10-12 17:56:54`. This performs no backfill. Targeted Fallow review completed; React Doctor’s initial two referral-panel findings (handler-only offset state and index-based keys) were fixed and its follow-up found no such referral findings. The three existing Settings warnings remain: page complexity and handler-only front/back KYC file state; the file values are consumed by the submit handler, so these are not confirmed regressions. Authored-source `git diff --check` passed; full-repo check only reports generated Prisma declaration whitespace. Browser/render remains deferred.
- Status: SOURCE_IMPLEMENTED; TESTED; RUNTIME_VERIFICATION_PENDING — focused backend tests pass and D1 migration is applied; Public API deployment/runtime and final render remain.
- Evidence: Existing Public referral code/count/aggregate panel and ?ref=→SIWE attribution remain unchanged. Direct source found no referral payout writer and no reliable historical attribution date; updatedAt, aggregate totals, legacy Reward rows, and MiningRewardAccrual are not used to fabricate history. New event triggers are transaction-coupled to the attribution transition or canonical ledger posting, and both create EventOutbox events. Public UI reads the one authenticated history endpoint and keeps referred NEXI user codes, not wallet addresses.
- Next: after the owner authorizes the release/browser gate, deploy the source that exposes the API, then include referral loading/empty/error/pagination states in the single consolidated authenticated mobile acceptance. No payout writer or historical backfill is included.

### NXF-020 — Settings cleanup and About NEXI
- Owner requirement: clean Settings tabs and full static About NEXI page/content.
- Source paths: `app/dashboard/settings/page.tsx`, route/nav ownership; current product facts grounded in Public/backend source.
- Backend/Admin contract: NOT_APPLICABLE for static content; settings values retain current API owners.
- Skills/tools: Agent Skills `using-agent-skills`, frontend-ui-engineering, source-driven-development, incremental-implementation, test-driven-development, code-review-and-quality; NEXI Design authority.
- Dependencies: source-backed product facts; no additional API dependency.
- Acceptance: static About overview describes current markets/trading, wallet/account services, identity/security, and market-data availability; no unsupported release, financial, or runtime promises. Settings categories remain correctly routed.
- Verification: direct source review of the changed Settings About section; consolidated visual/interaction proof deferred to the final owner-authorized browser pass.
- Status: SOURCE_IMPLEMENTED; RUNTIME_VERIFICATION_PENDING — Settings cleanup and source-grounded About content are in the existing Settings About surface; final mobile review remains.
- Evidence: Replaced the technical placeholder with a static, mobile-first overview in the existing `about` tab of `app/dashboard/settings/page.tsx`. Copy is grounded in current source contracts: catalog count/categories, Spot/isolated Margin and backend-configured Options, wallet/financial service names, wallet signature auth and settings security controls, and honest provider/session availability. It adds no endpoint or state and does not change Settings routing. Five-axis source review: facts are source-backed; copy is divided into short sections; content remains in the existing Settings tab/Panel; no sensitive values or user-controlled data are introduced; static rendering adds no fetch or loop. No test/typecheck/build was run after this edit under the consolidated-gate sequencing instruction. Agent Skills actual state: meta/package and all five named workflow instructions read; `using-agent-skills` invoked to choose/apply the relevant methods; frontend/source/incremental/TDD/code-review methods applied as stated in `tasks/plan.md`.
- Next: continue source/API/Admin mapping for open checklist tasks; include the About section in the one deferred mobile Settings acceptance pass.

### NXF-021 — Earn/Mining, Loans, Learn, Support, Help Center
- Owner requirement: preserve route-specific journeys, content/data authority and Help Center coverage.
- Source paths: app/dashboard/mining/page.tsx, loans/page.tsx, learn/page.tsx, support/page.tsx, tests/e2e/mining.spec.ts, backend/src/mining/**, backend/src/loans/**, backend/src/communications/communications.controller.ts.
- Backend/Admin contract: Mining: public GET `/mining/plans`; authenticated summary/rewards/my and subscribe/redeem/cancel routes are JWT/ownership guarded; D1/Ledger own plans, subscriptions, rewards and reserved/released balances. Admin plan creation is ADMIN-guarded; reward distribution also has DevelopmentOnlyGuard. Loans: public plans, JWT/ownership my, JWT apply/repay; D1 `LoanPlan`, `LoanApplication`, `LoanRepayment`, Ledger and EventOutbox own applications/repayments; ADMIN approval/rejection routes exist. No eligibility or collateral upload route exists. Learn: public published article/category routes read D1; ADMIN article/category create/edit/publish writes D1 content/revisions and EventOutbox. Support tickets are Public-JWT guarded; static Help Center topics have no Admin control path.
- Skills/tools: Agent Skills frontend-ui-engineering, source-driven-development, incremental-implementation, test-driven-development, code-review-and-quality; React/Next Context7 docs; RDC direct source; backend contract lane.
- Dependencies: NXF-003.
- Acceptance: each route/control and loading/error/empty state accounted for; Help Center coverage is verified without inventing a separate route or topic source.
- Verification: source inventory + exact API/controller edges; tests for changed paths; final rendering deferred.
- Status: SOURCE_IMPLEMENTED; RUNTIME_VERIFICATION_PENDING — Mining confirmation repair is in source; other listed journeys have no confirmed source gap; regression/runtime proof remains.
- Evidence: Public route/API inventory confirms Mining plan/position/summary/reward loads and subscribe/redeem/cancel actions; Loans plan/history plus apply/repay actions and visible input/status states; Learn API-driven categories/list/detail/search with honest unavailable and unavailable progress/bookmark states. Nest/Admin contract lane mapped Mining to D1/Ledger, Loans to D1 application/repayment records (no eligibility or upload API), and Learn published content/categories to D1 with Admin-authorized authoring. Public lane found one confirmed Mining defect: successful subscription feedback is immediately erased by `load()` resetting selected product/stage/message. Authored `tests/e2e/mining.spec.ts` first, then fixed the existing `MiningPage.load` owner to preserve confirmation on post-submit refresh and disabled repeated submission while confirmation is pending. The test remains unrun: owner-sequenced consolidated gate has not started, so no RED result is claimed. Context7’s official React `useCallback` guidance supports keeping the memoized loader’s reactive dependencies explicit; official Next.js Client Component guidance confirms this existing stateful page needs no server/client boundary change ([React](https://react.dev/reference/react/useCallback), [Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components)). No loans/learn gap is confirmed; no collateral evidence-upload or eligibility endpoint exists in current contract. Support remains the existing embedded Help Center surface (no separate route).
- Next: include Mining success confirmation regression case in the consolidated test batch; leave final runtime/browser acceptance deferred.
### NXF-022 — Messages, Notifications, Announcements
- Owner requirement: current filters, conversations/read states, announcements list/detail and notification actions remain functional.
- Source paths: app/dashboard/messages/page.tsx; app/dashboard/announcement/page.tsx; app/components/NotificationsPanel.tsx; backend/src/communications/communications.controller.ts; backend/src/communications/communications.service.ts; apps/admin/src/admin/data/nexi-api-provider.ts.
- Backend/Admin contract: Public JWT-guarded /communications messages, conversations, read, report, notifications and notification-read routes; public announcements GET and ADMIN-guarded create/update/publish methods. Confirm service persistence/read model and Admin permission provider edges.
- Skills/tools: frontend UI engineering, source-driven development, Graphify, direct backend/Admin source.
- Dependencies: NXF-003.
- Acceptance: each source-owned category/action maps to a current API and canonical state; no historical category list treated as current.
- Verification: direct source paths and focused interaction tests; final render deferred.
- Status: PROVEN_UNCHANGED; RUNTIME_VERIFICATION_PENDING — current message, notification, and announcement controls map to source/API with no confirmed defect.
- Evidence: Messages source already has All/Unread filters, search, authenticated conversation read, reply, report, socket refresh and honest unavailable/error states. NotificationsPanel has All/Trading/Wallet/Account/System filters, maps backend event type to categories, loads `/communications/notifications` and marks read through the authenticated route. Announcements loads `/communications/announcements` with locale, search, refresh, list/detail and the only category chip is All. This matches current backend: CreateAnnouncementDto has no category field and CommunicationsService returns published/eligible rows ordered by pin then created time, so do not invent historical category filters. Direct current Admin source confirms `/announcements` and `/notifications` routes, `announcements.view`/`announcements.publish` and `notifications.view`/`notifications.send` gates, and live provider calls to `/communications/admin/announcements*` and `/communications/admin/notifications`; the Admin UI/provider are not a missing Public feature. Nest communications controller guards user list/read routes with JWT; `CommunicationsService.listNotifications` scopes by user; `markNotificationRead` mutates through `D1Communications`, reads back the notification, and publishes the realtime event. Admin notification sends use `D1Communications.createNotification`, verify materialization and publish the realtime event. No Public feature gap is confirmed.
- Next: preserve current Public/Admin behavior; final authenticated read/send and real-time state checks remain in the consolidated deferred pass. No change/test/build/render required by source evidence.
### NXF-023 — Authentication, Security, SIWE and recovery
- Owner requirement: preserve wallet-only SIWE replay protection, reconnection, session/security and MFA. Standalone account recovery is not applicable by owner decision.
- Source paths: `app/login/page.tsx`, `signup/page.tsx`, `app/lib/wallet-auth.ts`, auth/session/recovery components.
- Backend/Admin contract: map challenge/verify nonce, signature/chain/domain checks, rate limits/guards and recovery routes; Admin NOT_APPLICABLE unless actual control exists.
- Skills/tools: frontend UI engineering, auth/security review, EIP-4361 official reference if semantics need fresh research, focused tests.
- Dependencies: NXF-003.
- Acceptance: no local frontend authority replaces backend SIWE/session decisions; recovery/error paths accurate.
- Verification: exact challenge/verify/auth service path; focused security and component tests.
- Status: NOT_APPLICABLE_BY_OWNER_DECISION for standalone account recovery; SOURCE_IMPLEMENTED; RUNTIME_VERIFICATION_PENDING for SIWE/session/MFA behavior.
- Evidence: Public wallet client calls POST `/auth/wallet/challenge`, POST `/auth/wallet/verify`, GET `/auth/me`, and POST logout. Backend contract lane confirmed challenge/verify pre-auth flow, SIWE domain/origin/URI/version/chain validation, Redis challenge expiry and atomic consumption, signature verification, D1 user/session ownership, secure HttpOnly refresh cookie, rate-limited refresh rotation, and guarded PUBLIC session/preferences/password/MFA routes. Settings exposes TOTP and one-use backup codes. Direct current route/controller inventory contains no standalone account/password recovery endpoint; MFA backup codes are not equivalent to account recovery. Do not invent a front-end recovery flow without a backend contract. Admin: NOT_APPLICABLE.
- Next: preserve existing SIWE/security behavior; no standalone recovery UI/API/task is required. Defer signing/session interactions to final acceptance.

### NXF-024 — User feedback via sonner
- Owner requirement: user-facing success/error/loading feedback uses the existing sonner system consistently.
- Source paths: changed Public pages and current mutation handlers; root client runtime/Toaster.
- Backend/Admin contract: NOT_APPLICABLE; message contents must reflect API result.
- Skills/tools: frontend UI engineering, accessibility, focused tests.
- Dependencies: feature path tasks.
- Acceptance: mutations have truthful, nonduplicate feedback; toast provider is mounted once; errors do not expose secrets/internal diagnostics.
- Verification: source paths + focused unit/component tests.
- Status: PROVEN_UNCHANGED; RUNTIME_VERIFICATION_PENDING — the existing Sonner provider and truthful inline states already cover source-owned mutations.
- Evidence: Public provider source mounts exactly one Sonner Toaster. Settings and Wallet mutation flows use Sonner; Mining, Loans, Support and Messages retain inline status/alert feedback with no duplicate toast. Public lane found feedback paths present and no confirmed missing user feedback.
- Next: verify any task-specific changed mutation against truthful nonduplicate feedback during consolidated source checks; do not bulk-convert inline states.

### NXF-025 — Quiet Refraction, accessibility, geometry and dock
- Owner requirement: preserve current owner-approved Quiet Refraction consistently on all routes; mobile-first and wallet-browser safe; no redesign.
- Source paths: `DESIGN.md`, `app/globals.css`, `app/dashboard/layout.tsx`, AppHeader/BottomNav/PagePrimitives and route surfaces.
- Backend/Admin contract: NOT_APPLICABLE except route-owned state remains unchanged.
- Skills/tools: frontend UI engineering, a11y-debugging, browser acceptance deferred, Graphify, Fallow if callable.
- Dependencies: all source repairs; final visual campaign is last.
- Acceptance: existing glass roles preserved; no blur over financial data; controls/focus/reduced-motion and responsive/safe-area source behavior accounted for; five destinations retained; no premature redesign.
- Verification: CSS/source-level checks now; one consolidated mobile/wallet-browser render campaign after source closure.
- Status: PROVEN_UNCHANGED; RUNTIME_VERIFICATION_PENDING — direct CSS/component inspection confirms mobile-first shells, dynamic/visual viewport sizing, safe-area-aware header/page/dock/sheets, scrollable dashboard content, 44px shared controls, focus/reduced-motion/contrast/forced-colors fallbacks, and chart ResizeObserver sizing. Source review found no confirmed repair; 320/360/375/390/430px no-overflow, short-height, zoom, wallet-browser/IME and rendered composite acceptance remain deferred.
- Evidence: current DESIGN.md is authoritative and preserves approved five-destination shell; source calculations are historical and require confirmation only on changed owners.
- Next: inspect the already dirty CSS/layout changes for regressions only; defer rendered geometry.

### NXF-026 — Focused source verification and release handoff
- Owner requirement: verify only invalidated source paths; prepare one coordinated build/deployment after source closure and authorization.
- Source paths: changed Public files, frontend focused tests/scripts, root canonical build workflow.
- Backend/Admin contract: preserve already deployed services and backend; no mutation during source closure.
- Skills/tools: verification-before-completion, Fallow when callable, Next CLI/React Doctor only for relevant source checks, canonical Cloudflare build/release workflow after authorization.
- Dependencies: all applicable source tasks.
- Acceptance: each change has actual test/typecheck/static result; no claims based on editing/build alone; runtime/browser campaign remains deferred until owner instruction.
- Verification: tool output and final Git/worktree/diff reconciliation.
- Status: VERIFIED — all 20 IDs are reconciled; all confirmed missing source work is implemented and integrated in local canonical main commit c72180894621ab469bb08350bc9b6f6273fcee2c. The CodeScene-only blocker is removed from the hook behavior; staged non-generated whitespace check and hook execution pass. Existing focused backend test 4/4, Public typecheck, Public lint (27 warnings/0 errors), targeted Fallow/React Doctor and direct source review are recorded above. Runtime/browser proof remains pending. No build, deployment, service restart or browser/wallet-browser acceptance has run.
- Evidence: NXF-019 backend focused test passed 4/4; Public typecheck passed; Public lint passed with 27 warnings and 0 errors after repairing the ESLint flat-config registration for `eslint-plugin-react-hooks` and declaring the already shared-installed plugin in devDependencies. React Doctor changed-line scan returned five complexity warnings in Dashboard, Asset Detail, Binary, Mining and Settings; focused Settings scan reproduced its three existing warnings (complexity plus front/back file-state performance advisories), with the file state used by the KYC submit handler. Fallow `review --base HEAD --brief` completed for 34 changed files and rated the diff high review risk; it surfaced shared-export coordination questions, style/dependency advisories and inherited complexity/duplication findings, with no confirmed breaking defect found in this bounded review. Authored-source `git diff --check` passed; full-repo check reports trailing whitespace only in regenerated Prisma declarations. Favorites/Mining Playwright specs remain unexecuted for the one final browser campaign. No build, deployment or visual/browser acceptance occurred. Convert remains source-proven zero separate commission; NXF-021 has no additional confirmed source gap; standalone account recovery is N/A.
- Next: wait for the owner's explicit release instruction, then perform the coordinated canonical build/deployment and the single consolidated mobile/wallet-browser acceptance campaign. The local commit is not pushed to origin/main.

## Cross-surface directed evidence ledger (initial)
| Requirement | Public component/action | API client | NestJS route/guard/service | Canonical data | Admin control/readback | Test/proof |
|---|---|---|---|---|---|---|
| VIP identity | AccountIdentityHeader renders VIP identity; Settings Profile renders level/progress/threshold/benefits from loaded profile | `loadCurrentUser` → `/auth/me`; no extra VIP request | `/auth/me` → WalletAuthService.getCurrentUser → ReferralVipService.ensureAccountState; dedicated PUBLIC `GET /vip/me` also exists | D1 UserVipState + VipLevel | Admin guarded VIP user/level read and audited assignment endpoints; provider/UI readback must be separately confirmed | Direct source contract; final profile refresh/interaction is runtime-deferred |
| Referral identity/history | captureReferralCode persists URL ref; WalletConnectControl submits it during wallet verify; Settings Profile shows summary plus separate referral/reward histories | /auth/me summary + authenticated GET /referral/history | PUBLIC-guarded referral controller → ReferralVipService | D1 Affiliate + ReferralAttributionEvent + ledger-backed ReferralRewardEvent + EventOutbox triggers | Aggregate-only Admin /admin/referrals is not account-scoped history; Admin history UI NOT_APPLICABLE | Direct source and 4/4 focused tests passed; typecheck passed; migration 0014 applied and verified; Public API deployment/runtime still pending |
| KYC | Settings has front/back upload, submit/status | api POST `/kyc/evidence`, `/kyc/submit`, GET `/kyc/status` | Exact Nest controller/service guard TBD | Private evidence storage + D1 status (verify source) | live Admin KYC provider/read/decision TBD | Source path confirmed; authenticated runtime deferred |
| Quotes catalog | route/components TBD | market API TBD | asset/market route/service TBD | 53 market instruments, separate wallet currencies | Admin owner TBD | Count/schema and route tests pending |

## Blockers / knowledge sources
- Library-hosted external engineering index/registry/cache not found via authorized current source; task-specific official references may still be retrieved.
- Approved full About NEXI copy/OCH artifact was not found. NXF-020 now uses a bounded static overview grounded in current source; it makes no claim to reproduce owner-approved verbatim copy.
- Graphify Cloud does not disclose indexed SHA; fresh local graph is current to the working tree as of its rebuild, but has no commit metadata.


## Final owner decision reconciliation — 2026-10-12
- Convert: source-proven zero commission; the accepted quote amounts settle as quoted and spread may remain in the market rate. No financial mutation.
- Referral and reward history: implemented under the owner-authorized NXF-019 exception with account-scoped guarded reads and D1 event capture; migration application and runtime acceptance remain release-gated.
- Account recovery: NOT_APPLICABLE_BY_OWNER_DECISION; SIWE/session/MFA remain preserved.

## NXF-019 owner authorization and source closure — 2026-10-12
- Owner approved the minimal NestJS/D1 implementation for authenticated account-scoped referral and reward history, durable event recording, guards and focused backend tests. No production D1 apply/deploy authority was inferred.
- Official Cloudflare D1 migration and batch documentation was consulted. Migration remains a versioned SQL source file; D1 batch statements commit sequentially as one transaction and roll back the sequence on failure. No remote D1 operation was performed.
- Graphify Cloud bounded query errored. No new indexing was run; direct source inspection and focused migration tests establish this slice.
- Existing worktree/session preflight preserved the canonical checkout and backend-closure worktree; active long-running RDC sessions were not stopped. No state/production-ledger documents were edited.
