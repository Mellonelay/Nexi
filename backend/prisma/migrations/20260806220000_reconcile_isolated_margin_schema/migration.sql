-- CreateEnum
CREATE TYPE "LedgerAccountScope" AS ENUM ('MAIN', 'MARGIN');

-- CreateEnum
CREATE TYPE "SpotMarginAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SpotMarginPositionDirection" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "SpotMarginPositionStatus" AS ENUM ('PENDING', 'OPEN', 'CLOSING', 'CLOSED', 'LIQUIDATED');

-- CreateEnum
CREATE TYPE "SpotMarginEventType" AS ENUM ('TRANSFER_IN', 'TRANSFER_OUT', 'OPEN', 'MARK', 'INTEREST', 'PNL', 'FEE', 'CLOSE', 'LIQUIDATION', 'COLLATERAL_RESERVE', 'COLLATERAL_RELEASE', 'REPAYMENT');

-- CreateEnum
CREATE TYPE "SpotMarginActivityStatus" AS ENUM ('ACCEPTED', 'COMPLETED', 'REJECTED');

-- DropIndex
DROP INDEX "LedgerAccount_userId_asset_key";

-- AlterTable
ALTER TABLE "Gate2SpotOrder" ADD COLUMN     "reserveScope" "LedgerAccountScope" NOT NULL DEFAULT 'MAIN';

-- AlterTable
ALTER TABLE "LedgerAccount" ADD COLUMN     "scope" "LedgerAccountScope" NOT NULL DEFAULT 'MAIN';

-- CreateTable
CREATE TABLE "SpotMarginAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "baseAsset" TEXT NOT NULL,
    "quoteAsset" TEXT NOT NULL,
    "status" "SpotMarginAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotMarginAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotMarginPosition" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "direction" "SpotMarginPositionDirection" NOT NULL,
    "leverage" INTEGER NOT NULL,
    "collateral" DECIMAL(38,18) NOT NULL,
    "quantity" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "entryPrice" DECIMAL(38,18) NOT NULL,
    "markPrice" DECIMAL(38,18),
    "debtAsset" TEXT NOT NULL DEFAULT '',
    "debtPrincipal" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "interestAccrued" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "unrealizedPnl" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "status" "SpotMarginPositionStatus" NOT NULL DEFAULT 'OPEN',
    "openIdempotencyKey" TEXT NOT NULL,
    "entryOrderId" TEXT,
    "closeOrderId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotMarginPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotMarginPositionEvent" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "type" "SpotMarginEventType" NOT NULL,
    "asset" TEXT,
    "amount" DECIMAL(38,18),
    "price" DECIMAL(38,18),
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotMarginPositionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotMarginActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT,
    "positionId" TEXT,
    "type" "SpotMarginEventType" NOT NULL,
    "status" "SpotMarginActivityStatus" NOT NULL DEFAULT 'COMPLETED',
    "idempotencyKey" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotMarginActivity_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "LedgerAccount_userId_asset_scope_key" ON "LedgerAccount"("userId", "asset", "scope");

-- AddForeignKey
ALTER TABLE "SpotMarginAccount" ADD CONSTRAINT "SpotMarginAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotMarginPosition" ADD CONSTRAINT "SpotMarginPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SpotMarginAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotMarginPositionEvent" ADD CONSTRAINT "SpotMarginPositionEvent_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "SpotMarginPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotMarginActivity" ADD CONSTRAINT "SpotMarginActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotMarginActivity" ADD CONSTRAINT "SpotMarginActivity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SpotMarginAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotMarginActivity" ADD CONSTRAINT "SpotMarginActivity_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "SpotMarginPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
