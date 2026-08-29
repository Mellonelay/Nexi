# NEXI Database Authority Map

## Authority

- Durable authority: PostgreSQL; Neon staging project is `muddy-wind-23521852`.
- ORM: Prisma 7 with `@prisma/adapter-pg`.
- Runtime owner: NestJS backend in `backend/`.
- Redis remains ephemeral cache, realtime, locking, and coordination.
- Cloudflare Worker/Container is transport/runtime delivery, not data authority.

## Current Prisma Model Inventory

`User`, `WalletIdentity`, `AuthSession`, `KYC`, `Wallet`, `Ledger`, `SpotOrder`,
`SpotTrade`, `BinaryOptionPosition`, `ContractPosition`, `ContractPair`,
`ConversionTransaction`, `LoanApplication`, `MiningPlan`, `MiningSubscription`,
`MiningRewardAccrual`, `Currency`, `DepositAddress`, `DepositClaim`, `LoanPlan`,
`SystemConfig`, `AdminAuditLog`, `AdminRoleAssignment`, `AdminGovernanceCommand`,
`AdminGovernanceApproval`, `AdminIncident`, `AdminMaintenanceWindow`,
`AdminFeatureFlag`, `BinaryPair`, `BinaryTimeframe`, `WithdrawalRequest`,
`OptionGameSettings`, `MarketData`, `MarketAsset`, `MarketNetwork`,
`MarketAssetCapability`, `MarketPair`, `MarketProviderConfig`,
`MarketProviderSymbol`, `MarketTrade`, `MarketDepthSnapshot`, `MarketDepthLevel`,
`MarketQuoteSnapshot`, `MarketQuoteLatest`, `MarketKline`, `LedgerAccount`,
`SpotMarginAccount`, `SpotMarginPosition`, `SpotMarginPositionEvent`,
`SpotMarginActivity`, `LedgerPosting`, `LedgerIdempotency`, `LedgerAuditEvent`,
`LegacyAdmin`, `LegacyAffiliate`, `LegacyBinaryOptionResult`, `LegacyLoanRepayment`,
`LegacyReward`, `SupportTicket`, `SupportTicketReply`, `PersistentMessage`,
`Notification`, `Announcement`, `Activity`, `EventOutbox`, `LearnArticle`,
`LearnCategory`, `LearnArticleRevision`, `LearnTag`, `LearnArticleTag`,
`LearnMediaAsset`, `LegacySettings`, `UserPreference`, `Gate2SpotOrder`,
`Gate2SpotTrade`, `Gate2BinaryConfiguration`, `Gate2BinaryPosition`, `Gate2Deposit`,
`Gate2Withdrawal`, `Gate2InternalTransfer`, `Gate2ConversionQuote`,
`Gate2OperationAudit`.

## Migration Lineage

The authoritative forward-only migrations are under `backend/prisma/migrations/`.
The latest source migration is `20260819120000_add_manual_deposit_claims`.
No destructive reset or `db push` is part of this migration.

## Runtime Consumers

- PrismaService and financial authority services: wallet, ledger, deposits,
  withdrawals, transfers, conversion, Spot/Margin, Options/Binary, Loans, Mining,
  Admin, audit, activity, and communications.
- Market persistence: quotes, Klines, trades, depth, provider registry, and outbox.
- Auth/session services: users, wallet identities, sessions, and authorization.
- Cloudflare Container receives database configuration at runtime; the Worker does
  not query PostgreSQL directly.

## Required Environment Contract

- `DATABASE_URL`: application runtime connection; Neon pooled endpoint is preferred.
- `DIRECT_URL`: direct Neon endpoint for migration/introspection operations.
- `REDIS_URL`: external Redis endpoint; never Neon and never a production localhost fallback.
- `JWT_SECRET`, `CORS_ORIGINS`, `PORT`, and `NODE_ENV`.
- Provider credentials and market configuration only where the provider is explicitly enabled.
- Sandbox allowlist/configuration and R2 binding credentials where applicable.

## Neon Migration Decision

Neon project and staging branch creation is complete. Existing VM PostgreSQL data
could not be extracted because the approved SG device currently has no PostgreSQL
listener, `psql`, `pg_dump`, or PostgreSQL process. Therefore schema deployment and
data migration remain separate gates. No claim of data migration is made.

## Reuse and Integrity Requirements

- Reuse the existing Prisma schema and migration lineage; do not duplicate financial models.
- Preserve exact monetary `Decimal`/NUMERIC fields, foreign keys, uniqueness, indexes,
  idempotency, audit linkage, and append-only ledger behavior.
- Validate on the Neon staging branch before any production promotion.
