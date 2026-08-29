-- Gate 1 B2/B3 forward-only authority tables.
-- Historical migrations remain immutable. No legacy rows are rewritten or removed.

CREATE TYPE "AssetLifecycleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE "MarketQuoteState" AS ENUM ('LOADING', 'LIVE', 'STALE', 'ERROR', 'UNAVAILABLE');
CREATE TYPE "LedgerAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE "LedgerPostingKind" AS ENUM ('CREDIT', 'DEBIT', 'RESERVE', 'RELEASE', 'SETTLEMENT', 'COMPENSATION', 'TRANSFER');

CREATE TABLE "MarketAsset" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'crypto',
    "providerSymbol" TEXT,
    "status" "AssetLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketNetwork" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AssetLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketNetwork_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketAssetCapability" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "networkId" TEXT,
    "capabilityKey" TEXT NOT NULL,
    "depositEnabled" BOOLEAN NOT NULL DEFAULT false,
    "withdrawEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tradingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "AssetLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketAssetCapability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketPair" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "baseAssetId" TEXT NOT NULL,
    "quoteAssetId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'crypto',
    "status" "AssetLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketPair_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketQuoteSnapshot" (
    "id" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sequence" BIGINT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "change24h" DECIMAL(38,18),
    "volume24h" DECIMAL(38,18),
    "high24h" DECIMAL(38,18),
    "low24h" DECIMAL(38,18),
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" JSONB,
    CONSTRAINT "MarketQuoteSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketQuoteLatest" (
    "id" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sequence" BIGINT NOT NULL,
    "price" DECIMAL(38,18),
    "change24h" DECIMAL(38,18),
    "volume24h" DECIMAL(38,18),
    "high24h" DECIMAL(38,18),
    "low24h" DECIMAL(38,18),
    "state" "MarketQuoteState" NOT NULL DEFAULT 'UNAVAILABLE',
    "observedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketQuoteLatest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "status" "LedgerAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "available" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "locked" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerPosting" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "kind" "LedgerPostingKind" NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "availableDelta" DECIMAL(38,18) NOT NULL,
    "lockedDelta" DECIMAL(38,18) NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "economicGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "LedgerPosting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerIdempotency" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "accountId" TEXT,
    "debitPostingId" TEXT,
    "creditPostingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LedgerIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerAuditEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "postingId" TEXT,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketAsset_symbol_key" ON "MarketAsset"("symbol");
CREATE UNIQUE INDEX "MarketNetwork_assetId_code_key" ON "MarketNetwork"("assetId", "code");
CREATE UNIQUE INDEX "MarketAssetCapability_capabilityKey_key" ON "MarketAssetCapability"("capabilityKey");
CREATE UNIQUE INDEX "MarketPair_symbol_key" ON "MarketPair"("symbol");
CREATE UNIQUE INDEX "MarketPair_baseAssetId_quoteAssetId_key" ON "MarketPair"("baseAssetId", "quoteAssetId");
CREATE UNIQUE INDEX "MarketQuoteSnapshot_pairId_sequence_key" ON "MarketQuoteSnapshot"("pairId", "sequence");
CREATE UNIQUE INDEX "MarketQuoteLatest_pairId_key" ON "MarketQuoteLatest"("pairId");
CREATE UNIQUE INDEX "LedgerAccount_userId_asset_key" ON "LedgerAccount"("userId", "asset");
CREATE UNIQUE INDEX "LedgerPosting_accountId_idempotencyKey_key" ON "LedgerPosting"("accountId", "idempotencyKey");
CREATE UNIQUE INDEX "LedgerIdempotency_idempotencyKey_key" ON "LedgerIdempotency"("idempotencyKey");

CREATE INDEX "MarketAsset_category_status_idx" ON "MarketAsset"("category", "status");
CREATE INDEX "MarketNetwork_code_status_idx" ON "MarketNetwork"("code", "status");
CREATE INDEX "MarketAssetCapability_assetId_status_idx" ON "MarketAssetCapability"("assetId", "status");
CREATE INDEX "MarketAssetCapability_networkId_idx" ON "MarketAssetCapability"("networkId");
CREATE INDEX "MarketPair_category_status_idx" ON "MarketPair"("category", "status");
CREATE INDEX "MarketQuoteSnapshot_symbol_sequence_idx" ON "MarketQuoteSnapshot"("symbol", "sequence");
CREATE INDEX "MarketQuoteSnapshot_receivedAt_idx" ON "MarketQuoteSnapshot"("receivedAt");
CREATE INDEX "MarketQuoteLatest_symbol_state_idx" ON "MarketQuoteLatest"("symbol", "state");
CREATE INDEX "LedgerAccount_userId_status_idx" ON "LedgerAccount"("userId", "status");
CREATE INDEX "LedgerPosting_referenceType_referenceId_idx" ON "LedgerPosting"("referenceType", "referenceId");
CREATE INDEX "LedgerPosting_economicGroup_idx" ON "LedgerPosting"("economicGroup");
CREATE INDEX "LedgerPosting_accountId_createdAt_idx" ON "LedgerPosting"("accountId", "createdAt");
CREATE INDEX "LedgerIdempotency_accountId_createdAt_idx" ON "LedgerIdempotency"("accountId", "createdAt");
CREATE INDEX "LedgerAuditEvent_accountId_createdAt_idx" ON "LedgerAuditEvent"("accountId", "createdAt");
CREATE INDEX "LedgerAuditEvent_idempotencyKey_idx" ON "LedgerAuditEvent"("idempotencyKey");

ALTER TABLE "MarketNetwork" ADD CONSTRAINT "MarketNetwork_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MarketAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketAssetCapability" ADD CONSTRAINT "MarketAssetCapability_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MarketAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketAssetCapability" ADD CONSTRAINT "MarketAssetCapability_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "MarketNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketPair" ADD CONSTRAINT "MarketPair_baseAssetId_fkey" FOREIGN KEY ("baseAssetId") REFERENCES "MarketAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketPair" ADD CONSTRAINT "MarketPair_quoteAssetId_fkey" FOREIGN KEY ("quoteAssetId") REFERENCES "MarketAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketQuoteSnapshot" ADD CONSTRAINT "MarketQuoteSnapshot_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketQuoteLatest" ADD CONSTRAINT "MarketQuoteLatest_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerPosting" ADD CONSTRAINT "LedgerPosting_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerAuditEvent" ADD CONSTRAINT "LedgerAuditEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerAuditEvent" ADD CONSTRAINT "LedgerAuditEvent_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "LedgerPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
