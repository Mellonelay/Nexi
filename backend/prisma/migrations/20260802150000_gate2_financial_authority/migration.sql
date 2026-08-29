-- Gate 2 B4/B5/B6 forward-only authority tables.
-- Historical tables and Gate 1 migrations remain unchanged. These tables use
-- NUMERIC(38,18) for all authoritative financial quantities.

CREATE TYPE "Gate2SpotOrderType" AS ENUM ('LIMIT', 'MARKET', 'STOP');
CREATE TYPE "Gate2SpotOrderStatus" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED');
CREATE TYPE "Gate2BinaryState" AS ENUM ('ACTIVE', 'SETTLING', 'SETTLEMENT_DELAYED', 'WIN', 'LOSS', 'DRAW', 'REFUND', 'ERROR');
CREATE TYPE "Gate2DepositState" AS ENUM ('OBSERVED', 'CONFIRMING', 'CREDITED', 'REJECTED', 'UNAVAILABLE');
CREATE TYPE "Gate2WithdrawalState" AS ENUM ('PENDING_REVIEW', 'REJECTED', 'APPROVED', 'SETTLED', 'FAILED');
CREATE TYPE "Gate2ConversionQuoteState" AS ENUM ('OPEN', 'ACCEPTED', 'EXPIRED', 'REJECTED');

CREATE TABLE "Gate2SpotOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "side" "OrderSide" NOT NULL,
    "type" "Gate2SpotOrderType" NOT NULL,
    "status" "Gate2SpotOrderStatus" NOT NULL DEFAULT 'OPEN',
    "amount" DECIMAL(38,18) NOT NULL,
    "filled" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "remaining" DECIMAL(38,18) NOT NULL,
    "price" DECIMAL(38,18),
    "stopPrice" DECIMAL(38,18),
    "reserveAsset" TEXT NOT NULL,
    "reservedAmount" DECIMAL(38,18) NOT NULL,
    "feeRate" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gate2SpotOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2SpotOrder_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "Gate2SpotOrder_filled_check" CHECK ("filled" >= 0),
    CONSTRAINT "Gate2SpotOrder_remaining_check" CHECK ("remaining" >= 0),
    CONSTRAINT "Gate2SpotOrder_total_check" CHECK ("filled" + "remaining" = "amount"),
    CONSTRAINT "Gate2SpotOrder_reserved_check" CHECK ("reservedAmount" >= 0),
    CONSTRAINT "Gate2SpotOrder_fee_check" CHECK ("feeRate" >= 0)
);

CREATE TABLE "Gate2SpotTrade" (
    "id" TEXT NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "price" DECIMAL(38,18) NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "buyerFee" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "sellerFee" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gate2SpotTrade_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2SpotTrade_price_check" CHECK ("price" > 0),
    CONSTRAINT "Gate2SpotTrade_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "Gate2SpotTrade_fee_check" CHECK ("buyerFee" >= 0 AND "sellerFee" >= 0)
);

CREATE TABLE "Gate2BinaryConfiguration" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "payoutRate" DECIMAL(38,18) NOT NULL,
    "lossRate" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "minStake" DECIMAL(38,18) NOT NULL,
    "maxStake" DECIMAL(38,18) NOT NULL,
    "tieMode" TEXT NOT NULL DEFAULT 'DRAW',
    "refundRate" DECIMAL(38,18) NOT NULL DEFAULT 1,
    "settlementDelaySeconds" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gate2BinaryConfiguration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2BinaryConfiguration_duration_check" CHECK ("durationSeconds" IN (30, 60, 180, 240, 480)),
    CONSTRAINT "Gate2BinaryConfiguration_rate_check" CHECK ("payoutRate" >= 0 AND "lossRate" >= 0 AND "refundRate" >= 0),
    CONSTRAINT "Gate2BinaryConfiguration_stake_check" CHECK ("minStake" > 0 AND "maxStake" >= "minStake"),
    CONSTRAINT "Gate2BinaryConfiguration_delay_check" CHECK ("settlementDelaySeconds" >= 0)
);

CREATE TABLE "Gate2BinaryPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "side" "BinarySide" NOT NULL,
    "stake" DECIMAL(38,18) NOT NULL,
    "entryPrice" DECIMAL(38,18) NOT NULL,
    "expiryPrice" DECIMAL(38,18),
    "payoutAmount" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "realizedProfit" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "state" "Gate2BinaryState" NOT NULL DEFAULT 'ACTIVE',
    "entryQuoteId" TEXT NOT NULL,
    "entryProvider" TEXT NOT NULL,
    "entrySource" TEXT NOT NULL,
    "entryObservedAt" TIMESTAMP(3) NOT NULL,
    "entryReceivedAt" TIMESTAMP(3) NOT NULL,
    "entrySequence" BIGINT NOT NULL,
    "expiryQuoteId" TEXT,
    "expiryProvider" TEXT,
    "expirySource" TEXT,
    "expiryObservedAt" TIMESTAMP(3),
    "expiryReceivedAt" TIMESTAMP(3),
    "expirySequence" BIGINT,
    "quoteFreshnessMs" INTEGER NOT NULL,
    "configurationVersion" INTEGER NOT NULL,
    "settlementReceiptId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gate2BinaryPosition_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2BinaryPosition_stake_check" CHECK ("stake" > 0),
    CONSTRAINT "Gate2BinaryPosition_entry_price_check" CHECK ("entryPrice" > 0),
    CONSTRAINT "Gate2BinaryPosition_payout_check" CHECK ("payoutAmount" >= 0)
);

CREATE TABLE "Gate2Deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "requiredConfirmations" INTEGER NOT NULL,
    "state" "Gate2DepositState" NOT NULL DEFAULT 'OBSERVED',
    "observationKey" TEXT NOT NULL,
    "creditPostingId" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gate2Deposit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2Deposit_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "Gate2Deposit_confirmations_check" CHECK ("confirmations" >= 0 AND "requiredConfirmations" > 0)
);

CREATE TABLE "Gate2Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "fee" DECIMAL(38,18) NOT NULL,
    "reservedAmount" DECIMAL(38,18) NOT NULL,
    "state" "Gate2WithdrawalState" NOT NULL DEFAULT 'PENDING_REVIEW',
    "requestKey" TEXT NOT NULL,
    "reserveKey" TEXT NOT NULL,
    "reviewReason" TEXT,
    "txHash" TEXT,
    "providerState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gate2Withdrawal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2Withdrawal_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "Gate2Withdrawal_fee_check" CHECK ("fee" >= 0),
    CONSTRAINT "Gate2Withdrawal_reserve_check" CHECK ("reservedAmount" = "amount" + "fee")
);

CREATE TABLE "Gate2InternalTransfer" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "debitPostingId" TEXT NOT NULL,
    "creditPostingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gate2InternalTransfer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2InternalTransfer_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "Gate2InternalTransfer_users_check" CHECK ("fromUserId" <> "toUserId")
);

CREATE TABLE "Gate2ConversionQuote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAsset" TEXT NOT NULL,
    "toAsset" TEXT NOT NULL,
    "inputAmount" DECIMAL(38,18) NOT NULL,
    "rate" DECIMAL(38,18) NOT NULL,
    "outputAmount" DECIMAL(38,18) NOT NULL,
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "configurationVersion" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "state" "Gate2ConversionQuoteState" NOT NULL DEFAULT 'OPEN',
    "quoteKey" TEXT NOT NULL,
    "acceptanceKey" TEXT,
    "conversionRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Gate2ConversionQuote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Gate2ConversionQuote_assets_check" CHECK ("fromAsset" <> "toAsset"),
    CONSTRAINT "Gate2ConversionQuote_amount_check" CHECK ("inputAmount" > 0 AND "rate" > 0 AND "outputAmount" > 0)
);

CREATE TABLE "Gate2OperationAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gate2OperationAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Gate2SpotOrder_userId_idempotencyKey_key" ON "Gate2SpotOrder"("userId", "idempotencyKey");
CREATE UNIQUE INDEX "Gate2SpotTrade_idempotencyKey_key" ON "Gate2SpotTrade"("idempotencyKey");
CREATE UNIQUE INDEX "Gate2BinaryConfiguration_pair_durationSeconds_key" ON "Gate2BinaryConfiguration"("pair", "durationSeconds");
CREATE UNIQUE INDEX "Gate2BinaryPosition_settlementReceiptId_key" ON "Gate2BinaryPosition"("settlementReceiptId");
CREATE UNIQUE INDEX "Gate2BinaryPosition_userId_idempotencyKey_key" ON "Gate2BinaryPosition"("userId", "idempotencyKey");
CREATE UNIQUE INDEX "Gate2Deposit_observationKey_key" ON "Gate2Deposit"("observationKey");
CREATE UNIQUE INDEX "Gate2Deposit_network_txHash_address_key" ON "Gate2Deposit"("network", "txHash", "address");
CREATE UNIQUE INDEX "Gate2Withdrawal_requestKey_key" ON "Gate2Withdrawal"("requestKey");
CREATE UNIQUE INDEX "Gate2Withdrawal_reserveKey_key" ON "Gate2Withdrawal"("reserveKey");
CREATE UNIQUE INDEX "Gate2InternalTransfer_idempotencyKey_key" ON "Gate2InternalTransfer"("idempotencyKey");
CREATE UNIQUE INDEX "Gate2ConversionQuote_acceptanceKey_key" ON "Gate2ConversionQuote"("acceptanceKey");
CREATE UNIQUE INDEX "Gate2ConversionQuote_quoteKey_key" ON "Gate2ConversionQuote"("quoteKey");

CREATE INDEX "Gate2SpotOrder_pair_status_side_price_createdAt_idx" ON "Gate2SpotOrder"("pair", "status", "side", "price", "createdAt");
CREATE INDEX "Gate2SpotOrder_userId_status_createdAt_idx" ON "Gate2SpotOrder"("userId", "status", "createdAt");
CREATE INDEX "Gate2SpotTrade_pair_createdAt_idx" ON "Gate2SpotTrade"("pair", "createdAt");
CREATE INDEX "Gate2SpotTrade_buyerOrderId_createdAt_idx" ON "Gate2SpotTrade"("buyerOrderId", "createdAt");
CREATE INDEX "Gate2SpotTrade_sellerOrderId_createdAt_idx" ON "Gate2SpotTrade"("sellerOrderId", "createdAt");
CREATE INDEX "Gate2BinaryConfiguration_pair_enabled_idx" ON "Gate2BinaryConfiguration"("pair", "enabled");
CREATE INDEX "Gate2BinaryPosition_userId_state_createdAt_idx" ON "Gate2BinaryPosition"("userId", "state", "createdAt");
CREATE INDEX "Gate2BinaryPosition_pair_state_createdAt_idx" ON "Gate2BinaryPosition"("pair", "state", "createdAt");
CREATE INDEX "Gate2Deposit_userId_state_createdAt_idx" ON "Gate2Deposit"("userId", "state", "createdAt");
CREATE INDEX "Gate2Withdrawal_userId_state_createdAt_idx" ON "Gate2Withdrawal"("userId", "state", "createdAt");
CREATE INDEX "Gate2InternalTransfer_fromUserId_createdAt_idx" ON "Gate2InternalTransfer"("fromUserId", "createdAt");
CREATE INDEX "Gate2InternalTransfer_toUserId_createdAt_idx" ON "Gate2InternalTransfer"("toUserId", "createdAt");
CREATE INDEX "Gate2ConversionQuote_userId_state_expiresAt_idx" ON "Gate2ConversionQuote"("userId", "state", "expiresAt");
CREATE INDEX "Gate2OperationAudit_operationType_operationId_createdAt_idx" ON "Gate2OperationAudit"("operationType", "operationId", "createdAt");
CREATE INDEX "Gate2OperationAudit_userId_createdAt_idx" ON "Gate2OperationAudit"("userId", "createdAt");
CREATE INDEX "Gate2OperationAudit_idempotencyKey_idx" ON "Gate2OperationAudit"("idempotencyKey");

ALTER TABLE "Gate2SpotOrder" ADD CONSTRAINT "Gate2SpotOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2SpotTrade" ADD CONSTRAINT "Gate2SpotTrade_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "Gate2SpotOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2SpotTrade" ADD CONSTRAINT "Gate2SpotTrade_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "Gate2SpotOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2BinaryPosition" ADD CONSTRAINT "Gate2BinaryPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2Deposit" ADD CONSTRAINT "Gate2Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2Withdrawal" ADD CONSTRAINT "Gate2Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2InternalTransfer" ADD CONSTRAINT "Gate2InternalTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2InternalTransfer" ADD CONSTRAINT "Gate2InternalTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2ConversionQuote" ADD CONSTRAINT "Gate2ConversionQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gate2OperationAudit" ADD CONSTRAINT "Gate2OperationAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
