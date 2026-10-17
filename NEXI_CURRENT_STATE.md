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
