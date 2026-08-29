CREATE TYPE "AdminRoleId" AS ENUM (
  'readonly_operator',
  'support_agent',
  'kyc_reviewer',
  'finance_operator',
  'market_operator',
  'content_manager',
  'security_auditor',
  'sandbox_operator',
  'super_admin'
);

CREATE TABLE "AdminRoleAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" "AdminRoleId" NOT NULL,
  "assignedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminRoleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRoleAssignment_userId_key" ON "AdminRoleAssignment"("userId");
CREATE INDEX "AdminRoleAssignment_roleId_idx" ON "AdminRoleAssignment"("roleId");
ALTER TABLE "AdminRoleAssignment" ADD CONSTRAINT "AdminRoleAssignment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
