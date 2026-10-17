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

Keep the original historical gzip, the existing final D1 gzip and import manifest, and the pre-promotion SQLite rollback database. No bulk cleanup or removal of unique data was performed. Only confirmed temporary files/orphaned sidecars may be removed after confirming their owning database/process is absent.

**Next frontier:** record the promoted state in docs/tasks; finish a bounded final-data reconciliation decision, verify required application flows, and obtain/establish an authorized encrypted off-VPS backup destination. Cloudflare retirement and any production financial authority declaration require their own direct evidence.
