-- Additive source migration. Do not apply to the promoted database in this task.
ALTER TABLE "UserVipState" ADD COLUMN "manualOverride" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserVipState" ADD COLUMN "overrideAdminId" TEXT;
ALTER TABLE "UserVipState" ADD COLUMN "overrideReason" TEXT;
ALTER TABLE "UserVipState" ADD COLUMN "overrideAt" TEXT;

CREATE TABLE IF NOT EXISTS "VipDepositQualification" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "depositRef" TEXT NOT NULL UNIQUE,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "asset" TEXT NOT NULL,
  "amount" TEXT NOT NULL,
  "baseAsset" TEXT NOT NULL,
  "baseAmount" TEXT NOT NULL,
  "rate" TEXT NOT NULL,
  "rateSource" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "creditedAt" TEXT NOT NULL,
  "invalidatedAt" TEXT,
  "invalidationReason" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "VipDepositQualification_user_status" ON "VipDepositQualification" ("userId","status","creditedAt");

CREATE TABLE IF NOT EXISTS "ReferralFirstDepositDecision" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "referredUserId" TEXT NOT NULL UNIQUE,
  "referrerUserId" TEXT,
  "depositRef" TEXT NOT NULL UNIQUE,
  "depositBaseAsset" TEXT NOT NULL,
  "depositBaseAmount" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "decisionReason" TEXT NOT NULL,
  "rewardAsset" TEXT,
  "rewardAmount" TEXT,
  "policySnapshot" TEXT,
  "ledgerPostingId" TEXT UNIQUE,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ReferralFirstDepositDecision_referrer_status" ON "ReferralFirstDepositDecision" ("referrerUserId","status");

CREATE TABLE IF NOT EXISTS "DepositInvalidationRecovery" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "depositRef" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "asset" TEXT NOT NULL,
  "amount" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "ledgerPostingId" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "DepositInvalidationRecovery_user_status" ON "DepositInvalidationRecovery" ("userId","status");
