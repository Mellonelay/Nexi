# NEXI Current State — SQLite Promotion Checkpoint

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

The active D1 and SQLite were compared read-only over all 89 shared application tables outside three large market-history tables. There were 1,754 rows on each side. 84 tables match exact row-content SHA-256 and count. The only five mismatched tables are market catalog/config with equal counts: MarketAsset (55), MarketAssetCapability (55), MarketPair (53), MarketProviderConfig (9), MarketProviderSymbol (270). D1-only `_cf_KV` is platform metadata; five local durable-workflow/journal tables are VPS additions. Per-table hash-only receipt: `tasks/evidence/d1-sqlite-nonmarket-content-check-20261017.json`. No export/import or writes. This is not a quiesced global cutover watermark; market catalog/config and history remain deferred.
