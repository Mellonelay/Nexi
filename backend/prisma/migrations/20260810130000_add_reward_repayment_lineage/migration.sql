-- Forward-only domain-evidence migration.
-- LedgerPosting and Activity remain the authorities; these fields/rows make
-- mining rewards and loan repayments queryable with explicit linkage.

CREATE TABLE "MiningRewardAccrual" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ledgerPostingId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amount" DECIMAL(38,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "rewardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiningRewardAccrual_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LoanRepayment"
  ADD COLUMN "ledgerPostingId" TEXT,
  ADD COLUMN "activityId" TEXT;

CREATE UNIQUE INDEX "MiningRewardAccrual_ledgerPostingId_key" ON "MiningRewardAccrual"("ledgerPostingId");
CREATE UNIQUE INDEX "MiningRewardAccrual_activityId_key" ON "MiningRewardAccrual"("activityId");
CREATE UNIQUE INDEX "MiningRewardAccrual_idempotencyKey_key" ON "MiningRewardAccrual"("idempotencyKey");
CREATE INDEX "MiningRewardAccrual_subscriptionId_rewardedAt_idx" ON "MiningRewardAccrual"("subscriptionId", "rewardedAt");
CREATE INDEX "MiningRewardAccrual_userId_rewardedAt_idx" ON "MiningRewardAccrual"("userId", "rewardedAt");
CREATE UNIQUE INDEX "LoanRepayment_ledgerPostingId_key" ON "LoanRepayment"("ledgerPostingId");
CREATE UNIQUE INDEX "LoanRepayment_activityId_key" ON "LoanRepayment"("activityId");

ALTER TABLE "MiningRewardAccrual" ADD CONSTRAINT "MiningRewardAccrual_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "MiningSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MiningRewardAccrual" ADD CONSTRAINT "MiningRewardAccrual_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MiningRewardAccrual" ADD CONSTRAINT "MiningRewardAccrual_ledgerPostingId_fkey"
  FOREIGN KEY ("ledgerPostingId") REFERENCES "LedgerPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MiningRewardAccrual" ADD CONSTRAINT "MiningRewardAccrual_activityId_fkey"
  FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_ledgerPostingId_fkey"
  FOREIGN KEY ("ledgerPostingId") REFERENCES "LedgerPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_activityId_fkey"
  FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
