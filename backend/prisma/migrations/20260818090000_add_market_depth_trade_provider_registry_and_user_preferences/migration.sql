-- Additive forward-only persistence for provider registry, external market trades,
-- order-book snapshots/levels, and account preferences.

CREATE TYPE "MarketProviderLifecycleStatus" AS ENUM ('ACTIVE', 'DISABLED', 'MAINTENANCE');
CREATE TYPE "MarketTradeSide" AS ENUM ('BUY', 'SELL', 'UNKNOWN');
CREATE TYPE "MarketDepthSide" AS ENUM ('BID', 'ASK');

CREATE TABLE "MarketProviderConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "MarketProviderLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "restBaseUrl" TEXT,
    "websocketBaseUrl" TEXT,
    "supportsQuotes" BOOLEAN NOT NULL DEFAULT true,
    "supportsKlines" BOOLEAN NOT NULL DEFAULT true,
    "supportsTrades" BOOLEAN NOT NULL DEFAULT false,
    "supportsDepth" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketProviderConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketProviderConfig_key_key" ON "MarketProviderConfig"("key");
CREATE INDEX "MarketProviderConfig_status_priority_idx" ON "MarketProviderConfig"("status", "priority");

CREATE TABLE "MarketProviderSymbol" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "providerSymbol" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketProviderSymbol_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketProviderSymbol_providerId_pairId_key" ON "MarketProviderSymbol"("providerId", "pairId");
CREATE UNIQUE INDEX "MarketProviderSymbol_providerId_providerSymbol_key" ON "MarketProviderSymbol"("providerId", "providerSymbol");
CREATE INDEX "MarketProviderSymbol_pairId_enabled_idx" ON "MarketProviderSymbol"("pairId", "enabled");
ALTER TABLE "MarketProviderSymbol" ADD CONSTRAINT "MarketProviderSymbol_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MarketProviderConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketProviderSymbol" ADD CONSTRAINT "MarketProviderSymbol_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MarketTrade" (
    "id" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "providerTradeId" TEXT,
    "sequence" BIGINT,
    "side" "MarketTradeSide" NOT NULL DEFAULT 'UNKNOWN',
    "price" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" JSONB,
    CONSTRAINT "MarketTrade_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketTrade_pairId_provider_providerTradeId_key" ON "MarketTrade"("pairId", "provider", "providerTradeId");
CREATE UNIQUE INDEX "MarketTrade_pairId_provider_sequence_key" ON "MarketTrade"("pairId", "provider", "sequence");
CREATE INDEX "MarketTrade_symbol_observedAt_idx" ON "MarketTrade"("symbol", "observedAt");
CREATE INDEX "MarketTrade_pairId_observedAt_idx" ON "MarketTrade"("pairId", "observedAt");
ALTER TABLE "MarketTrade" ADD CONSTRAINT "MarketTrade_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MarketDepthSnapshot" (
    "id" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "providerSnapshotId" TEXT,
    "sequence" BIGINT,
    "checksum" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" JSONB,
    CONSTRAINT "MarketDepthSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketDepthSnapshot_pairId_provider_providerSnapshotId_key" ON "MarketDepthSnapshot"("pairId", "provider", "providerSnapshotId");
CREATE UNIQUE INDEX "MarketDepthSnapshot_pairId_provider_sequence_key" ON "MarketDepthSnapshot"("pairId", "provider", "sequence");
CREATE INDEX "MarketDepthSnapshot_symbol_observedAt_idx" ON "MarketDepthSnapshot"("symbol", "observedAt");
CREATE INDEX "MarketDepthSnapshot_pairId_observedAt_idx" ON "MarketDepthSnapshot"("pairId", "observedAt");
ALTER TABLE "MarketDepthSnapshot" ADD CONSTRAINT "MarketDepthSnapshot_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MarketDepthLevel" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "side" "MarketDepthSide" NOT NULL,
    "levelIndex" INTEGER NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL,
    CONSTRAINT "MarketDepthLevel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MarketDepthLevel_snapshotId_side_levelIndex_key" ON "MarketDepthLevel"("snapshotId", "side", "levelIndex");
CREATE INDEX "MarketDepthLevel_snapshotId_side_price_idx" ON "MarketDepthLevel"("snapshotId", "side", "price");
ALTER TABLE "MarketDepthLevel" ADD CONSTRAINT "MarketDepthLevel_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "MarketDepthSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "notificationSettings" JSONB,
    "tradingSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
