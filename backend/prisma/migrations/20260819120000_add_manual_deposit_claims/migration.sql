-- Forward-only manual funding evidence authority. Gate2Deposit remains the
-- blockchain/provider observation authority and is intentionally untouched.
CREATE TYPE "DepositClaimState" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CREDITED', 'FAILED');

CREATE TABLE "DepositClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "depositAddressId" TEXT,
    "destinationAddressSnapshot" TEXT NOT NULL,
    "claimedAmount" DECIMAL(38,18) NOT NULL,
    "proofObjectKey" TEXT NOT NULL,
    "proofContentType" TEXT,
    "proofByteSize" INTEGER,
    "txHash" TEXT,
    "state" "DepositClaimState" NOT NULL DEFAULT 'PENDING_REVIEW',
    "idempotencyKey" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewReason" TEXT,
    "creditedLedgerPostingId" TEXT,
    "linkedObservedDepositId" TEXT,
    CONSTRAINT "DepositClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepositClaim_idempotencyKey_key" ON "DepositClaim"("idempotencyKey");
CREATE INDEX "DepositClaim_userId_state_submittedAt_idx" ON "DepositClaim"("userId", "state", "submittedAt");
CREATE INDEX "DepositClaim_state_submittedAt_idx" ON "DepositClaim"("state", "submittedAt");
CREATE INDEX "DepositClaim_txHash_idx" ON "DepositClaim"("txHash");

ALTER TABLE "DepositClaim" ADD CONSTRAINT "DepositClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DepositClaim" ADD CONSTRAINT "DepositClaim_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DepositClaim" ADD CONSTRAINT "DepositClaim_depositAddressId_fkey" FOREIGN KEY ("depositAddressId") REFERENCES "DepositAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
