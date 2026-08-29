
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCode" INTEGER NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActive" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "forceOutcome" TEXT NOT NULL DEFAULT 'NORMAL'
);

-- CreateTable
CREATE TABLE "WalletIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WalletIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "tokenFamilyId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "absoluteExpiresAt" DATETIME NOT NULL,
    "idleExpiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "revokeReason" TEXT,
    "replacedById" TEXT,
    "userAgentHash" TEXT,
    "ipHash" TEXT,
    CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KYC" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "country" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idFront" TEXT,
    "idBack" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KYC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" TEXT NOT NULL DEFAULT '0',
    "frozenBalance" TEXT NOT NULL DEFAULT '0',
    "balances" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "referenceId" TEXT,
    "transactionType" TEXT NOT NULL DEFAULT 'DEPOSIT',
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ledger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" TEXT,
    "amount" TEXT NOT NULL,
    "filled" TEXT NOT NULL DEFAULT '0',
    "remaining" TEXT NOT NULL DEFAULT '0',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpotOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "fee" TEXT NOT NULL DEFAULT '0',
    "feeCurrency" TEXT NOT NULL DEFAULT 'USDT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotTrade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SpotOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SpotTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BinaryOptionPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "pair" TEXT,
    "side" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "entryPrice" TEXT NOT NULL,
    "timeframe" INTEGER NOT NULL,
    "payoutRate" TEXT,
    "profitRatio" INTEGER,
    "lossRatio" INTEGER,
    "targetPayout" TEXT,
    "closePrice" TEXT,
    "realizedProfit" TEXT,
    "strikePrice" TEXT,
    "payout" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BinaryOptionPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "leverage" INTEGER NOT NULL,
    "entryPrice" TEXT NOT NULL,
    "currentPrice" TEXT,
    "liquidationPrice" TEXT NOT NULL,
    "tpPrice" TEXT,
    "slPrice" TEXT,
    "status" TEXT NOT NULL,
    "pnl" TEXT NOT NULL DEFAULT '0',
    "fee" TEXT NOT NULL DEFAULT '0',
    "marginMode" TEXT NOT NULL DEFAULT 'ISOLATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractPair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "minLeverage" INTEGER NOT NULL DEFAULT 1,
    "maxLeverage" INTEGER NOT NULL DEFAULT 100,
    "makerFee" TEXT NOT NULL DEFAULT '0.0004',
    "takerFee" TEXT NOT NULL DEFAULT '0.0006',
    "minAmount" TEXT NOT NULL DEFAULT '10',
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ConversionTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromCoin" TEXT NOT NULL,
    "toCoin" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "received" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversionTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "amountDecimal" TEXT NOT NULL DEFAULT '0',
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "term" INTEGER NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "interestRate" TEXT NOT NULL DEFAULT '0.1',
    "interestRateDecimal" TEXT NOT NULL DEFAULT '0.1',
    "totalRepayment" TEXT NOT NULL DEFAULT '0',
    "totalRepaymentDecimal" TEXT NOT NULL DEFAULT '0',
    "collateral" TEXT,
    "collateralImg" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productSnapshot" TEXT,
    CONSTRAINT "LoanApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MiningPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "lockupPeriod" INTEGER NOT NULL,
    "dailyYield" TEXT NOT NULL,
    "dailyYieldDecimal" TEXT NOT NULL DEFAULT '0',
    "minDeposit" TEXT NOT NULL,
    "minDepositDecimal" TEXT NOT NULL DEFAULT '0',
    "maxDeposit" TEXT NOT NULL,
    "maxDepositDecimal" TEXT NOT NULL DEFAULT '0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MiningSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "amountDecimal" TEXT NOT NULL DEFAULT '0',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "totalRewards" TEXT NOT NULL DEFAULT '0',
    "totalRewardsDecimal" TEXT NOT NULL DEFAULT '0',
    "lastRewardPaid" DATETIME,
    "planSnapshot" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MiningSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MiningSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MiningPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MiningRewardAccrual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ledgerPostingId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rewardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MiningRewardAccrual_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "MiningSubscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MiningRewardAccrual_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MiningRewardAccrual_ledgerPostingId_fkey" FOREIGN KEY ("ledgerPostingId") REFERENCES "LedgerPosting" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MiningRewardAccrual_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "rate" TEXT NOT NULL DEFAULT '1.0',
    "minDeposit" TEXT NOT NULL DEFAULT '10.0',
    "maxDeposit" TEXT NOT NULL DEFAULT '10000.0',
    "minWithdrawal" TEXT NOT NULL DEFAULT '10.0',
    "maxWithdrawal" TEXT NOT NULL DEFAULT '10000.0',
    "withdrawalFee" TEXT NOT NULL DEFAULT '1.0',
    "depositEnabled" BOOLEAN NOT NULL DEFAULT true,
    "withdrawEnabled" BOOLEAN NOT NULL DEFAULT true,
    "confirmationCount" INTEGER NOT NULL DEFAULT 3,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DepositAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currencyId" INTEGER NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DepositAddress_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DepositClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "depositAddressId" TEXT,
    "destinationAddressSnapshot" TEXT NOT NULL,
    "claimedAmount" TEXT NOT NULL,
    "proofObjectKey" TEXT NOT NULL,
    "proofContentType" TEXT,
    "proofByteSize" INTEGER,
    "txHash" TEXT,
    "state" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "idempotencyKey" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "reviewReason" TEXT,
    "creditedLedgerPostingId" TEXT,
    "linkedObservedDepositId" TEXT,
    CONSTRAINT "DepositClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DepositClaim_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DepositClaim_depositAddressId_fkey" FOREIGN KEY ("depositAddressId") REFERENCES "DepositAddress" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "interestRate" TEXT NOT NULL,
    "minAmount" TEXT NOT NULL,
    "maxAmount" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminRoleAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminGovernanceCommand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "commandType" TEXT NOT NULL,
    "target" TEXT,
    "reason" TEXT NOT NULL,
    "payload" TEXT,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminGovernanceApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commandId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminGovernanceApproval_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "AdminGovernanceCommand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "environment" TEXT NOT NULL,
    "postedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" DATETIME,
    "acknowledgedBy" TEXT,
    "acknowledgementReason" TEXT,
    "acknowledgementIdempotencyKey" TEXT,
    "correlationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminMaintenanceWindow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scope" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "cancelledBy" TEXT,
    "cancelReason" TEXT,
    "cancelIdempotencyKey" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminFeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "reason" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BinaryPair" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "rate" TEXT NOT NULL DEFAULT '1.85',
    "category" TEXT NOT NULL DEFAULT 'crypto',
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "houseWinRatio" INTEGER NOT NULL DEFAULT 50,
    "realId" INTEGER,
    "matchId" INTEGER,
    "currencyId" INTEGER,
    "coinType" INTEGER DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BinaryTimeframe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "payoutRate" TEXT NOT NULL,
    "profitRatio" INTEGER NOT NULL DEFAULT 85,
    "lossRatio" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OptionGameSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currencyId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "symbol" TEXT,
    "payoutRate" TEXT,
    "duration" INTEGER,
    "rawData" TEXT,
    "dummy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "change" TEXT NOT NULL,
    "vol" TEXT NOT NULL,
    "high" TEXT NOT NULL,
    "low" TEXT NOT NULL,
    "rawData" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'crypto',
    "providerSymbol" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketNetwork" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketNetwork_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MarketAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketAssetCapability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "networkId" TEXT,
    "capabilityKey" TEXT NOT NULL,
    "depositEnabled" BOOLEAN NOT NULL DEFAULT false,
    "withdrawEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tradingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketAssetCapability_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MarketAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketAssetCapability_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "MarketNetwork" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "baseAssetId" TEXT NOT NULL,
    "quoteAssetId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'crypto',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maintenanceNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketPair_baseAssetId_fkey" FOREIGN KEY ("baseAssetId") REFERENCES "MarketAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketPair_quoteAssetId_fkey" FOREIGN KEY ("quoteAssetId") REFERENCES "MarketAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketProviderConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "restBaseUrl" TEXT,
    "websocketBaseUrl" TEXT,
    "supportsQuotes" BOOLEAN NOT NULL DEFAULT true,
    "supportsKlines" BOOLEAN NOT NULL DEFAULT true,
    "supportsTrades" BOOLEAN NOT NULL DEFAULT false,
    "supportsDepth" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketProviderSymbol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "providerSymbol" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "capabilityPolicy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketProviderSymbol_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "MarketProviderConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketProviderSymbol_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "providerTradeId" TEXT,
    "sequence" TEXT,
    "side" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "price" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" TEXT,
    CONSTRAINT "MarketTrade_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketDepthSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "providerSnapshotId" TEXT,
    "sequence" TEXT,
    "checksum" TEXT,
    "observedAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" TEXT,
    CONSTRAINT "MarketDepthSnapshot_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketDepthLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "levelIndex" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    CONSTRAINT "MarketDepthLevel_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "MarketDepthSnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketQuoteSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sequence" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "change24h" TEXT,
    "volume24h" TEXT,
    "high24h" TEXT,
    "low24h" TEXT,
    "observedAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawData" TEXT,
    CONSTRAINT "MarketQuoteSnapshot_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketQuoteLatest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sequence" TEXT NOT NULL,
    "price" TEXT,
    "change24h" TEXT,
    "volume24h" TEXT,
    "high24h" TEXT,
    "low24h" TEXT,
    "state" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "observedAt" DATETIME,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketQuoteLatest_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketKline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "openTime" DATETIME NOT NULL,
    "closeTime" DATETIME,
    "open" TEXT NOT NULL,
    "high" TEXT NOT NULL,
    "low" TEXT NOT NULL,
    "close" TEXT NOT NULL,
    "volume" TEXT,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketKline_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'MAIN',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "available" TEXT NOT NULL DEFAULT '0',
    "locked" TEXT NOT NULL DEFAULT '0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LedgerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotMarginAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpotMarginAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotMarginPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "leverage" INTEGER NOT NULL,
    "collateral" TEXT NOT NULL,
    "quantity" TEXT NOT NULL DEFAULT '0',
    "entryPrice" TEXT NOT NULL,
    "markPrice" TEXT,
    "debtAsset" TEXT NOT NULL DEFAULT '',
    "debtPrincipal" TEXT NOT NULL DEFAULT '0',
    "interestAccrued" TEXT NOT NULL DEFAULT '0',
    "realizedPnl" TEXT NOT NULL DEFAULT '0',
    "unrealizedPnl" TEXT NOT NULL DEFAULT '0',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openIdempotencyKey" TEXT NOT NULL,
    "entryOrderId" TEXT,
    "closeOrderId" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpotMarginPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SpotMarginAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotMarginPositionEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "positionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "asset" TEXT,
    "amount" TEXT,
    "price" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotMarginPositionEvent_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "SpotMarginPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpotMarginActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "positionId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "idempotencyKey" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpotMarginActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SpotMarginActivity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SpotMarginAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SpotMarginActivity_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "SpotMarginPosition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "availableDelta" TEXT NOT NULL,
    "lockedDelta" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "economicGroup" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    CONSTRAINT "LedgerPosting_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerIdempotency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "accountId" TEXT,
    "debitPostingId" TEXT,
    "creditPostingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LedgerAuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "postingId" TEXT,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerAuditEvent_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LedgerAuditEvent_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "LedgerPosting" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "totalEarnings" TEXT NOT NULL DEFAULT '0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BinaryOptionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "positionId" TEXT NOT NULL,
    "closePrice" TEXT NOT NULL,
    "profit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BinaryOptionResult_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "BinaryOptionPosition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "amountDecimal" TEXT NOT NULL DEFAULT '0',
    "currency" TEXT NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ledgerPostingId" TEXT,
    "activityId" TEXT,
    CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "LoanApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanRepayment_ledgerPostingId_fkey" FOREIGN KEY ("ledgerPostingId") REFERENCES "LedgerPosting" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LoanRepayment_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupportTicketReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportTicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersistentMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deliveryState" TEXT NOT NULL DEFAULT 'SENT',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "readAt" DATETIME,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" DATETIME,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targeting" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "ledgerCorrelationId" TEXT NOT NULL,
    "ledgerPostingId" TEXT,
    "asset" TEXT,
    "amount" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventOutbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "correlationId" TEXT,
    "payload" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "availableAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    "leaseToken" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "lastErrorAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LearnContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "attachments" TEXT,
    "categoryId" TEXT,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearnContent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LearnCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearnCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LearnArticleRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "attachments" TEXT,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "archivedAt" DATETIME,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LearnContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearnTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LearnArticleTag" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("articleId", "tagId"),
    CONSTRAINT "LearnArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LearnContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LearnArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "LearnTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearnMediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT,
    "revisionId" TEXT,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "provider" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearnMediaAsset_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LearnContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LearnMediaAsset_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "LearnArticleRevision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "notificationSettings" TEXT,
    "tradingSettings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2SpotOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "amount" TEXT NOT NULL,
    "filled" TEXT NOT NULL DEFAULT '0',
    "remaining" TEXT NOT NULL,
    "price" TEXT,
    "stopPrice" TEXT,
    "triggeredAt" DATETIME,
    "triggerQuoteId" TEXT,
    "triggerProvider" TEXT,
    "triggerSource" TEXT,
    "triggerObservedAt" DATETIME,
    "triggerSequence" TEXT,
    "reserveAsset" TEXT NOT NULL,
    "reserveScope" TEXT NOT NULL DEFAULT 'MAIN',
    "reservedAmount" TEXT NOT NULL,
    "feeRate" TEXT NOT NULL DEFAULT '0',
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gate2SpotOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2SpotTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerOrderId" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "buyerFee" TEXT NOT NULL DEFAULT '0',
    "sellerFee" TEXT NOT NULL DEFAULT '0',
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gate2SpotTrade_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "Gate2SpotOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Gate2SpotTrade_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "Gate2SpotOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2BinaryConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pair" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "payoutRate" TEXT NOT NULL,
    "lossRate" TEXT NOT NULL DEFAULT '0',
    "minStake" TEXT NOT NULL,
    "maxStake" TEXT NOT NULL,
    "settlementDelaySeconds" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Gate2BinaryPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "stake" TEXT NOT NULL,
    "entryPrice" TEXT NOT NULL,
    "expiryPrice" TEXT,
    "payoutAmount" TEXT NOT NULL DEFAULT '0',
    "realizedProfit" TEXT NOT NULL DEFAULT '0',
    "durationSeconds" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'ACTIVE',
    "entryQuoteId" TEXT NOT NULL,
    "entryProvider" TEXT NOT NULL,
    "entrySource" TEXT NOT NULL,
    "entryObservedAt" DATETIME NOT NULL,
    "entryReceivedAt" DATETIME NOT NULL,
    "entrySequence" TEXT NOT NULL,
    "expiryQuoteId" TEXT,
    "expiryProvider" TEXT,
    "expirySource" TEXT,
    "expiryObservedAt" DATETIME,
    "expiryReceivedAt" DATETIME,
    "expirySequence" TEXT,
    "quoteFreshnessMs" INTEGER NOT NULL,
    "configurationVersion" INTEGER NOT NULL,
    "settlementReceiptId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gate2BinaryPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2Deposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "requiredConfirmations" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OBSERVED',
    "observationKey" TEXT NOT NULL,
    "creditPostingId" TEXT,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creditedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gate2Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2Withdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "fee" TEXT NOT NULL,
    "reservedAmount" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "requestKey" TEXT NOT NULL,
    "reserveKey" TEXT NOT NULL,
    "reviewReason" TEXT,
    "txHash" TEXT,
    "providerState" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gate2Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2InternalTransfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "debitPostingId" TEXT NOT NULL,
    "creditPostingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gate2InternalTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Gate2InternalTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2ConversionQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromAsset" TEXT NOT NULL,
    "toAsset" TEXT NOT NULL,
    "inputAmount" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "outputAmount" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "configurationVersion" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "quoteKey" TEXT NOT NULL,
    "acceptanceKey" TEXT,
    "conversionRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Gate2ConversionQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gate2OperationAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gate2OperationAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userCode_key" ON "User"("userCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WalletIdentity_userId_key" ON "WalletIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletIdentity_address_key" ON "WalletIdentity"("address");

-- CreateIndex
CREATE INDEX "WalletIdentity_address_chainId_idx" ON "WalletIdentity"("address", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_surface_revokedAt_idx" ON "AuthSession"("userId", "surface", "revokedAt");

-- CreateIndex
CREATE INDEX "AuthSession_tokenFamilyId_revokedAt_idx" ON "AuthSession"("tokenFamilyId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuthSession_absoluteExpiresAt_idx" ON "AuthSession"("absoluteExpiresAt");

-- CreateIndex
CREATE INDEX "AuthSession_idleExpiresAt_idx" ON "AuthSession"("idleExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "KYC_userId_key" ON "KYC"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Ledger_walletId_idx" ON "Ledger"("walletId");

-- CreateIndex
CREATE INDEX "BinaryOptionPosition_status_idx" ON "BinaryOptionPosition"("status");

-- CreateIndex
CREATE INDEX "BinaryOptionPosition_userId_idx" ON "BinaryOptionPosition"("userId");

-- CreateIndex
CREATE INDEX "ContractPosition_userId_idx" ON "ContractPosition"("userId");

-- CreateIndex
CREATE INDEX "ContractPosition_status_idx" ON "ContractPosition"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractPair_symbol_key" ON "ContractPair"("symbol");

-- CreateIndex
CREATE INDEX "LoanApplication_userId_idx" ON "LoanApplication"("userId");

-- CreateIndex
CREATE INDEX "MiningSubscription_planId_idx" ON "MiningSubscription"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "MiningRewardAccrual_ledgerPostingId_key" ON "MiningRewardAccrual"("ledgerPostingId");

-- CreateIndex
CREATE UNIQUE INDEX "MiningRewardAccrual_activityId_key" ON "MiningRewardAccrual"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "MiningRewardAccrual_idempotencyKey_key" ON "MiningRewardAccrual"("idempotencyKey");

-- CreateIndex
CREATE INDEX "MiningRewardAccrual_subscriptionId_rewardedAt_idx" ON "MiningRewardAccrual"("subscriptionId", "rewardedAt");

-- CreateIndex
CREATE INDEX "MiningRewardAccrual_userId_rewardedAt_idx" ON "MiningRewardAccrual"("userId", "rewardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_symbol_key" ON "Currency"("symbol");

-- CreateIndex
CREATE INDEX "DepositAddress_currencyId_idx" ON "DepositAddress"("currencyId");

-- CreateIndex
CREATE UNIQUE INDEX "DepositClaim_idempotencyKey_key" ON "DepositClaim"("idempotencyKey");

-- CreateIndex
CREATE INDEX "DepositClaim_userId_state_submittedAt_idx" ON "DepositClaim"("userId", "state", "submittedAt");

-- CreateIndex
CREATE INDEX "DepositClaim_state_submittedAt_idx" ON "DepositClaim"("state", "submittedAt");

-- CreateIndex
CREATE INDEX "DepositClaim_txHash_idx" ON "DepositClaim"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRoleAssignment_userId_key" ON "AdminRoleAssignment"("userId");

-- CreateIndex
CREATE INDEX "AdminRoleAssignment_roleId_idx" ON "AdminRoleAssignment"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminGovernanceCommand_idempotencyKey_key" ON "AdminGovernanceCommand"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AdminGovernanceCommand_status_createdAt_idx" ON "AdminGovernanceCommand"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminGovernanceCommand_requestedBy_createdAt_idx" ON "AdminGovernanceCommand"("requestedBy", "createdAt");

-- CreateIndex
CREATE INDEX "AdminGovernanceApproval_approverId_createdAt_idx" ON "AdminGovernanceApproval"("approverId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminGovernanceApproval_commandId_approverId_key" ON "AdminGovernanceApproval"("commandId", "approverId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminIncident_acknowledgementIdempotencyKey_key" ON "AdminIncident"("acknowledgementIdempotencyKey");

-- CreateIndex
CREATE INDEX "AdminIncident_active_postedAt_idx" ON "AdminIncident"("active", "postedAt");

-- CreateIndex
CREATE INDEX "AdminIncident_environment_postedAt_idx" ON "AdminIncident"("environment", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminMaintenanceWindow_cancelIdempotencyKey_key" ON "AdminMaintenanceWindow"("cancelIdempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdminMaintenanceWindow_idempotencyKey_key" ON "AdminMaintenanceWindow"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AdminMaintenanceWindow_status_scheduledAt_idx" ON "AdminMaintenanceWindow"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "AdminMaintenanceWindow_scope_target_idx" ON "AdminMaintenanceWindow"("scope", "target");

-- CreateIndex
CREATE INDEX "AdminMaintenanceWindow_environment_scheduledAt_idx" ON "AdminMaintenanceWindow"("environment", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminFeatureFlag_key_key" ON "AdminFeatureFlag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "BinaryPair_symbol_key" ON "BinaryPair"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "BinaryTimeframe_seconds_key" ON "BinaryTimeframe"("seconds");

-- CreateIndex
CREATE UNIQUE INDEX "MarketData_symbol_key" ON "MarketData"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "MarketAsset_symbol_key" ON "MarketAsset"("symbol");

-- CreateIndex
CREATE INDEX "MarketAsset_category_status_idx" ON "MarketAsset"("category", "status");

-- CreateIndex
CREATE INDEX "MarketNetwork_code_status_idx" ON "MarketNetwork"("code", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketNetwork_assetId_code_key" ON "MarketNetwork"("assetId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "MarketAssetCapability_capabilityKey_key" ON "MarketAssetCapability"("capabilityKey");

-- CreateIndex
CREATE INDEX "MarketAssetCapability_assetId_status_idx" ON "MarketAssetCapability"("assetId", "status");

-- CreateIndex
CREATE INDEX "MarketAssetCapability_networkId_idx" ON "MarketAssetCapability"("networkId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPair_symbol_key" ON "MarketPair"("symbol");

-- CreateIndex
CREATE INDEX "MarketPair_category_status_idx" ON "MarketPair"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPair_baseAssetId_quoteAssetId_key" ON "MarketPair"("baseAssetId", "quoteAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketProviderConfig_key_key" ON "MarketProviderConfig"("key");

-- CreateIndex
CREATE INDEX "MarketProviderConfig_status_priority_idx" ON "MarketProviderConfig"("status", "priority");

-- CreateIndex
CREATE INDEX "MarketProviderSymbol_pairId_enabled_idx" ON "MarketProviderSymbol"("pairId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "MarketProviderSymbol_providerId_pairId_key" ON "MarketProviderSymbol"("providerId", "pairId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketProviderSymbol_providerId_providerSymbol_key" ON "MarketProviderSymbol"("providerId", "providerSymbol");

-- CreateIndex
CREATE INDEX "MarketTrade_symbol_observedAt_idx" ON "MarketTrade"("symbol", "observedAt");

-- CreateIndex
CREATE INDEX "MarketTrade_pairId_observedAt_idx" ON "MarketTrade"("pairId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketTrade_pairId_provider_providerTradeId_key" ON "MarketTrade"("pairId", "provider", "providerTradeId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketTrade_pairId_provider_sequence_key" ON "MarketTrade"("pairId", "provider", "sequence");

-- CreateIndex
CREATE INDEX "MarketDepthSnapshot_symbol_observedAt_idx" ON "MarketDepthSnapshot"("symbol", "observedAt");

-- CreateIndex
CREATE INDEX "MarketDepthSnapshot_pairId_observedAt_idx" ON "MarketDepthSnapshot"("pairId", "observedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDepthSnapshot_pairId_provider_providerSnapshotId_key" ON "MarketDepthSnapshot"("pairId", "provider", "providerSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDepthSnapshot_pairId_provider_sequence_key" ON "MarketDepthSnapshot"("pairId", "provider", "sequence");

-- CreateIndex
CREATE INDEX "MarketDepthLevel_snapshotId_side_price_idx" ON "MarketDepthLevel"("snapshotId", "side", "price");

-- CreateIndex
CREATE UNIQUE INDEX "MarketDepthLevel_snapshotId_side_levelIndex_key" ON "MarketDepthLevel"("snapshotId", "side", "levelIndex");

-- CreateIndex
CREATE INDEX "MarketQuoteSnapshot_symbol_sequence_idx" ON "MarketQuoteSnapshot"("symbol", "sequence");

-- CreateIndex
CREATE INDEX "MarketQuoteSnapshot_receivedAt_idx" ON "MarketQuoteSnapshot"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketQuoteSnapshot_pairId_sequence_key" ON "MarketQuoteSnapshot"("pairId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "MarketQuoteLatest_pairId_key" ON "MarketQuoteLatest"("pairId");

-- CreateIndex
CREATE INDEX "MarketQuoteLatest_symbol_state_idx" ON "MarketQuoteLatest"("symbol", "state");

-- CreateIndex
CREATE INDEX "MarketKline_symbol_interval_openTime_idx" ON "MarketKline"("symbol", "interval", "openTime");

-- CreateIndex
CREATE INDEX "MarketKline_receivedAt_idx" ON "MarketKline"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketKline_pairId_interval_openTime_key" ON "MarketKline"("pairId", "interval", "openTime");

-- CreateIndex
CREATE INDEX "LedgerAccount_userId_status_idx" ON "LedgerAccount"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_userId_asset_scope_key" ON "LedgerAccount"("userId", "asset", "scope");

-- CreateIndex
CREATE INDEX "SpotMarginAccount_userId_status_idx" ON "SpotMarginAccount"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SpotMarginAccount_userId_pair_key" ON "SpotMarginAccount"("userId", "pair");

-- CreateIndex
CREATE UNIQUE INDEX "SpotMarginPosition_openIdempotencyKey_key" ON "SpotMarginPosition"("openIdempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "SpotMarginPosition_entryOrderId_key" ON "SpotMarginPosition"("entryOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotMarginPosition_closeOrderId_key" ON "SpotMarginPosition"("closeOrderId");

-- CreateIndex
CREATE INDEX "SpotMarginPosition_accountId_status_openedAt_idx" ON "SpotMarginPosition"("accountId", "status", "openedAt");

-- CreateIndex
CREATE INDEX "SpotMarginPosition_status_markPrice_idx" ON "SpotMarginPosition"("status", "markPrice");

-- CreateIndex
CREATE UNIQUE INDEX "SpotMarginPositionEvent_idempotencyKey_key" ON "SpotMarginPositionEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SpotMarginPositionEvent_positionId_createdAt_idx" ON "SpotMarginPositionEvent"("positionId", "createdAt");

-- CreateIndex
CREATE INDEX "SpotMarginPositionEvent_type_createdAt_idx" ON "SpotMarginPositionEvent"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SpotMarginActivity_idempotencyKey_key" ON "SpotMarginActivity"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SpotMarginActivity_userId_createdAt_idx" ON "SpotMarginActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SpotMarginActivity_accountId_createdAt_idx" ON "SpotMarginActivity"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "SpotMarginActivity_positionId_createdAt_idx" ON "SpotMarginActivity"("positionId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerPosting_referenceType_referenceId_idx" ON "LedgerPosting"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "LedgerPosting_economicGroup_idx" ON "LedgerPosting"("economicGroup");

-- CreateIndex
CREATE INDEX "LedgerPosting_accountId_createdAt_idx" ON "LedgerPosting"("accountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerPosting_accountId_idempotencyKey_key" ON "LedgerPosting"("accountId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerIdempotency_idempotencyKey_key" ON "LedgerIdempotency"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LedgerIdempotency_accountId_createdAt_idx" ON "LedgerIdempotency"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerAuditEvent_accountId_createdAt_idx" ON "LedgerAuditEvent"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerAuditEvent_idempotencyKey_idx" ON "LedgerAuditEvent"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "Affiliate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_referralCode_key" ON "Affiliate"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "BinaryOptionResult_positionId_key" ON "BinaryOptionResult"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_ledgerPostingId_key" ON "LoanRepayment"("ledgerPostingId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_activityId_key" ON "LoanRepayment"("activityId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_createdAt_idx" ON "SupportTicket"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_updatedAt_idx" ON "SupportTicket"("status", "priority", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportTicketReply_ticketId_createdAt_idx" ON "SupportTicketReply"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "PersistentMessage_recipientId_createdAt_idx" ON "PersistentMessage"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "PersistentMessage_senderId_recipientId_sequence_idx" ON "PersistentMessage"("senderId", "recipientId", "sequence");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_published_startsAt_endsAt_idx" ON "Announcement"("published", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_idempotencyKey_key" ON "Activity"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_type_createdAt_idx" ON "Activity"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_referenceType_referenceId_idx" ON "Activity"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "Activity_ledgerCorrelationId_idx" ON "Activity"("ledgerCorrelationId");

-- CreateIndex
CREATE UNIQUE INDEX "EventOutbox_idempotencyKey_key" ON "EventOutbox"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EventOutbox_state_availableAt_idx" ON "EventOutbox"("state", "availableAt");

-- CreateIndex
CREATE INDEX "EventOutbox_aggregateType_aggregateId_createdAt_idx" ON "EventOutbox"("aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE INDEX "EventOutbox_correlationId_createdAt_idx" ON "EventOutbox"("correlationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearnContent_slug_key" ON "LearnContent"("slug");

-- CreateIndex
CREATE INDEX "LearnContent_status_publishedAt_idx" ON "LearnContent"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "LearnContent_categoryId_status_idx" ON "LearnContent"("categoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LearnCategory_slug_key" ON "LearnCategory"("slug");

-- CreateIndex
CREATE INDEX "LearnArticleRevision_articleId_createdAt_idx" ON "LearnArticleRevision"("articleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearnArticleRevision_articleId_revision_key" ON "LearnArticleRevision"("articleId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "LearnTag_slug_key" ON "LearnTag"("slug");

-- CreateIndex
CREATE INDEX "LearnArticleTag_tagId_idx" ON "LearnArticleTag"("tagId");

-- CreateIndex
CREATE INDEX "LearnMediaAsset_articleId_createdAt_idx" ON "LearnMediaAsset"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "LearnMediaAsset_revisionId_createdAt_idx" ON "LearnMediaAsset"("revisionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "Gate2SpotOrder_pair_status_side_price_createdAt_idx" ON "Gate2SpotOrder"("pair", "status", "side", "price", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2SpotOrder_userId_status_createdAt_idx" ON "Gate2SpotOrder"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2SpotOrder_userId_idempotencyKey_key" ON "Gate2SpotOrder"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2SpotTrade_idempotencyKey_key" ON "Gate2SpotTrade"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Gate2SpotTrade_pair_createdAt_idx" ON "Gate2SpotTrade"("pair", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2SpotTrade_buyerOrderId_createdAt_idx" ON "Gate2SpotTrade"("buyerOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2SpotTrade_sellerOrderId_createdAt_idx" ON "Gate2SpotTrade"("sellerOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2BinaryConfiguration_pair_enabled_idx" ON "Gate2BinaryConfiguration"("pair", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2BinaryConfiguration_pair_durationSeconds_version_key" ON "Gate2BinaryConfiguration"("pair", "durationSeconds", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2BinaryPosition_settlementReceiptId_key" ON "Gate2BinaryPosition"("settlementReceiptId");

-- CreateIndex
CREATE INDEX "Gate2BinaryPosition_userId_state_createdAt_idx" ON "Gate2BinaryPosition"("userId", "state", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2BinaryPosition_pair_state_createdAt_idx" ON "Gate2BinaryPosition"("pair", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2BinaryPosition_userId_idempotencyKey_key" ON "Gate2BinaryPosition"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2Deposit_observationKey_key" ON "Gate2Deposit"("observationKey");

-- CreateIndex
CREATE INDEX "Gate2Deposit_userId_state_createdAt_idx" ON "Gate2Deposit"("userId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2Deposit_network_txHash_address_key" ON "Gate2Deposit"("network", "txHash", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2Withdrawal_requestKey_key" ON "Gate2Withdrawal"("requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2Withdrawal_reserveKey_key" ON "Gate2Withdrawal"("reserveKey");

-- CreateIndex
CREATE INDEX "Gate2Withdrawal_userId_state_createdAt_idx" ON "Gate2Withdrawal"("userId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2InternalTransfer_idempotencyKey_key" ON "Gate2InternalTransfer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Gate2InternalTransfer_fromUserId_createdAt_idx" ON "Gate2InternalTransfer"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2InternalTransfer_toUserId_createdAt_idx" ON "Gate2InternalTransfer"("toUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2ConversionQuote_quoteKey_key" ON "Gate2ConversionQuote"("quoteKey");

-- CreateIndex
CREATE UNIQUE INDEX "Gate2ConversionQuote_acceptanceKey_key" ON "Gate2ConversionQuote"("acceptanceKey");

-- CreateIndex
CREATE INDEX "Gate2ConversionQuote_userId_state_expiresAt_idx" ON "Gate2ConversionQuote"("userId", "state", "expiresAt");

-- CreateIndex
CREATE INDEX "Gate2OperationAudit_operationType_operationId_createdAt_idx" ON "Gate2OperationAudit"("operationType", "operationId", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2OperationAudit_userId_createdAt_idx" ON "Gate2OperationAudit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Gate2OperationAudit_idempotencyKey_idx" ON "Gate2OperationAudit"("idempotencyKey");

