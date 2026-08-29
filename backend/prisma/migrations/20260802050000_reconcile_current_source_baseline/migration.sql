-- D0: reconciled current-source-required baseline.
-- Forward-only and data-preserving. Historical migrations remain immutable.

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REJECTED');
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRADE_SPOT', 'TRADE_BINARY', 'MINING_PAYOUT', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'TRANSFER');
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TYPE "LedgerType" ADD VALUE 'SPOT';
ALTER TYPE "LedgerType" ADD VALUE 'BINARY';
ALTER TYPE "LedgerType" ADD VALUE 'MAIN';
ALTER TYPE "LedgerType" ADD VALUE 'MINING';
ALTER TYPE "LedgerType" ADD VALUE 'LOAN';
ALTER TYPE "OrderStatus" ADD VALUE 'CANCELED';
ALTER TYPE "BinaryStatus" ADD VALUE 'WIN';
ALTER TYPE "BinaryStatus" ADD VALUE 'LOSS';
ALTER TYPE "LoanStatus" ADD VALUE 'OVERDUE';

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "forceOutcome" TEXT NOT NULL DEFAULT 'NORMAL';

ALTER TABLE "KYC" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "KYC" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "KYC" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "KYC" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "KYC" ADD COLUMN "idFront" TEXT;
ALTER TABLE "KYC" ADD COLUMN "idBack" TEXT;

ALTER TABLE "Wallet" ADD COLUMN "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ADD COLUMN "frozenBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Wallet" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Ledger" ADD COLUMN "transactionType" "TransactionType" NOT NULL DEFAULT 'DEPOSIT';
ALTER TABLE "Ledger" ADD COLUMN "status" "TransactionStatus" NOT NULL DEFAULT 'CONFIRMED';

ALTER TABLE "SpotOrder" ADD COLUMN "symbol" TEXT;
UPDATE "SpotOrder"
SET "symbol" = CASE
  WHEN NULLIF(split_part("pair", '/', 1), '') IS NOT NULL THEN split_part("pair", '/', 1)
  ELSE "pair"
END
WHERE "symbol" IS NULL;
ALTER TABLE "SpotOrder" ALTER COLUMN "symbol" SET NOT NULL;
ALTER TABLE "SpotOrder" ALTER COLUMN "remaining" SET DEFAULT 0;

ALTER TABLE "BinaryOptionPosition" ADD COLUMN "symbol" TEXT;
ALTER TABLE "BinaryOptionPosition" ADD COLUMN "timeframe" INTEGER;
ALTER TABLE "BinaryOptionPosition" ADD COLUMN "payoutRate" DOUBLE PRECISION;
ALTER TABLE "BinaryOptionPosition" ADD COLUMN "profitRatio" INTEGER;
ALTER TABLE "BinaryOptionPosition" ADD COLUMN "lossRatio" INTEGER;
ALTER TABLE "BinaryOptionPosition" ADD COLUMN "targetPayout" DOUBLE PRECISION;
ALTER TABLE "BinaryOptionPosition" ADD COLUMN "closePrice" DOUBLE PRECISION;
ALTER TABLE "BinaryOptionPosition" ADD COLUMN "realizedProfit" DOUBLE PRECISION;
ALTER TABLE "BinaryOptionPosition" ALTER COLUMN "pair" DROP NOT NULL;
ALTER TABLE "BinaryOptionPosition" ALTER COLUMN "payout" DROP NOT NULL;
ALTER TABLE "BinaryOptionPosition" ALTER COLUMN "duration" DROP NOT NULL;
UPDATE "BinaryOptionPosition"
SET "symbol" = "pair", "timeframe" = "duration"
WHERE "symbol" IS NULL OR "timeframe" IS NULL;
ALTER TABLE "BinaryOptionPosition" ALTER COLUMN "symbol" SET NOT NULL;
ALTER TABLE "BinaryOptionPosition" ALTER COLUMN "timeframe" SET NOT NULL;

ALTER TABLE "LoanApplication" ADD COLUMN "term" INTEGER;
UPDATE "LoanApplication" SET "term" = "durationDays" WHERE "term" IS NULL;
ALTER TABLE "LoanApplication" ALTER COLUMN "currency" SET DEFAULT 'USDT';
ALTER TABLE "LoanApplication" ALTER COLUMN "durationDays" SET DEFAULT 30;
ALTER TABLE "LoanApplication" ALTER COLUMN "interestRate" SET DEFAULT 0.1;
ALTER TABLE "LoanApplication" ALTER COLUMN "totalRepayment" SET DEFAULT 0;
ALTER TABLE "LoanApplication" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "LoanApplication" ALTER COLUMN "term" SET NOT NULL;

ALTER TABLE "MiningSubscription" ALTER COLUMN "endDate" DROP NOT NULL;
ALTER TABLE "MiningSubscription" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "ContractPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "leverage" INTEGER NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "liquidationPrice" DOUBLE PRECISION NOT NULL,
    "tpPrice" DOUBLE PRECISION,
    "slPrice" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marginMode" TEXT NOT NULL DEFAULT 'ISOLATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContractPosition_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ContractPair" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "minLeverage" INTEGER NOT NULL DEFAULT 1,
    "maxLeverage" INTEGER NOT NULL DEFAULT 100,
    "makerFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0004,
    "takerFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0006,
    "minAmount" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ContractPair_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Currency" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minDeposit" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "maxDeposit" DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
    "minWithdrawal" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "maxWithdrawal" DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
    "withdrawalFee" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "depositEnabled" BOOLEAN NOT NULL DEFAULT true,
    "withdrawEnabled" BOOLEAN NOT NULL DEFAULT true,
    "confirmationCount" INTEGER NOT NULL DEFAULT 3,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DepositAddress" (
    "id" TEXT NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DepositAddress_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LoanPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "minAmount" DOUBLE PRECISION NOT NULL,
    "maxAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoanPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BinaryPair" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 1.85,
    "category" TEXT NOT NULL DEFAULT 'crypto',
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "houseWinRatio" INTEGER NOT NULL DEFAULT 50,
    "realId" INTEGER,
    "matchId" INTEGER,
    "currencyId" INTEGER,
    "coinType" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BinaryPair_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BinaryTimeframe" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "payoutRate" DOUBLE PRECISION NOT NULL,
    "profitRatio" INTEGER NOT NULL DEFAULT 85,
    "lossRatio" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "BinaryTimeframe_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OptionGameSettings" (
    "id" TEXT NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "symbol" TEXT,
    "payoutRate" DOUBLE PRECISION,
    "duration" INTEGER,
    "rawData" JSONB,
    "dummy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OptionGameSettings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "vol" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "rawData" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContractPair_symbol_key" ON "ContractPair"("symbol");
CREATE UNIQUE INDEX "Currency_symbol_key" ON "Currency"("symbol");
CREATE UNIQUE INDEX "BinaryPair_symbol_key" ON "BinaryPair"("symbol");
CREATE UNIQUE INDEX "BinaryTimeframe_seconds_key" ON "BinaryTimeframe"("seconds");
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");
CREATE UNIQUE INDEX "MarketData_symbol_key" ON "MarketData"("symbol");
CREATE INDEX "Ledger_walletId_idx" ON "Ledger"("walletId");
CREATE INDEX "BinaryOptionPosition_status_idx" ON "BinaryOptionPosition"("status");
CREATE INDEX "BinaryOptionPosition_userId_idx" ON "BinaryOptionPosition"("userId");
CREATE INDEX "ContractPosition_userId_idx" ON "ContractPosition"("userId");
CREATE INDEX "ContractPosition_status_idx" ON "ContractPosition"("status");
CREATE INDEX "LoanApplication_userId_idx" ON "LoanApplication"("userId");
CREATE INDEX "MiningSubscription_planId_idx" ON "MiningSubscription"("planId");
CREATE INDEX "DepositAddress_currencyId_idx" ON "DepositAddress"("currencyId");
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");
ALTER TABLE "SpotTrade" ALTER COLUMN "fee" SET DEFAULT 0;
ALTER TABLE "SpotTrade" ALTER COLUMN "feeCurrency" SET DEFAULT 'USDT';

ALTER TABLE "ContractPosition" ADD CONSTRAINT "ContractPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepositAddress" ADD CONSTRAINT "DepositAddress_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
