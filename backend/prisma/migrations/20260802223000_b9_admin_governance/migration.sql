CREATE TYPE "AdminCommandStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED');
CREATE TYPE "AdminApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

CREATE TABLE "AdminGovernanceCommand" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "commandType" TEXT NOT NULL,
  "target" TEXT,
  "reason" TEXT NOT NULL,
  "payload" JSONB,
  "requestedBy" TEXT NOT NULL,
  "status" "AdminCommandStatus" NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "executedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminGovernanceCommand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminGovernanceCommand_idempotencyKey_key" ON "AdminGovernanceCommand"("idempotencyKey");
CREATE INDEX "AdminGovernanceCommand_status_createdAt_idx" ON "AdminGovernanceCommand"("status", "createdAt");
CREATE INDEX "AdminGovernanceCommand_requestedBy_createdAt_idx" ON "AdminGovernanceCommand"("requestedBy", "createdAt");

CREATE TABLE "AdminGovernanceApproval" (
  "id" TEXT NOT NULL,
  "commandId" TEXT NOT NULL,
  "approverId" TEXT NOT NULL,
  "decision" "AdminApprovalDecision" NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminGovernanceApproval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminGovernanceApproval_commandId_approverId_key" ON "AdminGovernanceApproval"("commandId", "approverId");
CREATE INDEX "AdminGovernanceApproval_approverId_createdAt_idx" ON "AdminGovernanceApproval"("approverId", "createdAt");
ALTER TABLE "AdminGovernanceApproval" ADD CONSTRAINT "AdminGovernanceApproval_commandId_fkey" FOREIGN KEY ("commandId") REFERENCES "AdminGovernanceCommand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AdminFeatureFlag" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "environment" TEXT NOT NULL DEFAULT 'sandbox',
  "reason" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminFeatureFlag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminFeatureFlag_key_key" ON "AdminFeatureFlag"("key");
