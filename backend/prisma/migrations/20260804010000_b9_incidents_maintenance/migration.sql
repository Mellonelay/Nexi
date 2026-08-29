CREATE TYPE "AdminIncidentSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

CREATE TABLE "AdminIncident" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "severity" "AdminIncidentSeverity" NOT NULL DEFAULT 'INFO',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "environment" TEXT NOT NULL,
  "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgedBy" TEXT,
  "acknowledgementReason" TEXT,
  "acknowledgementIdempotencyKey" TEXT,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminIncident_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminIncident_acknowledgementIdempotencyKey_key" ON "AdminIncident"("acknowledgementIdempotencyKey");
CREATE INDEX "AdminIncident_active_postedAt_idx" ON "AdminIncident"("active", "postedAt");
CREATE INDEX "AdminIncident_environment_postedAt_idx" ON "AdminIncident"("environment", "postedAt");

CREATE TYPE "AdminMaintenanceScope" AS ENUM ('GLOBAL', 'ROUTE', 'MARKET', 'PAIR');
CREATE TYPE "AdminMaintenanceStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "AdminMaintenanceWindow" (
  "id" TEXT NOT NULL,
  "scope" "AdminMaintenanceScope" NOT NULL,
  "target" TEXT NOT NULL,
  "status" "AdminMaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  "cancelledBy" TEXT,
  "cancelReason" TEXT,
  "cancelIdempotencyKey" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminMaintenanceWindow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdminMaintenanceWindow_cancelIdempotencyKey_key" ON "AdminMaintenanceWindow"("cancelIdempotencyKey");
CREATE UNIQUE INDEX "AdminMaintenanceWindow_idempotencyKey_key" ON "AdminMaintenanceWindow"("idempotencyKey");
CREATE INDEX "AdminMaintenanceWindow_status_scheduledAt_idx" ON "AdminMaintenanceWindow"("status", "scheduledAt");
CREATE INDEX "AdminMaintenanceWindow_scope_target_idx" ON "AdminMaintenanceWindow"("scope", "target");
CREATE INDEX "AdminMaintenanceWindow_environment_scheduledAt_idx" ON "AdminMaintenanceWindow"("environment", "scheduledAt");
