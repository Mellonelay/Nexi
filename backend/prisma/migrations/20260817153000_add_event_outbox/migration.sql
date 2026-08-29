-- Additive forward-only durable event outbox.
-- Domain state and this event record must be written in one PostgreSQL transaction.

CREATE TYPE "OutboxDeliveryState" AS ENUM ('PENDING', 'PUBLISHED', 'RETRY', 'DEAD_LETTERED');

CREATE TABLE "EventOutbox" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "correlationId" TEXT,
    "payload" JSONB NOT NULL,
    "state" "OutboxDeliveryState" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "leaseToken" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventOutbox_idempotencyKey_key" ON "EventOutbox"("idempotencyKey");
CREATE INDEX "EventOutbox_state_availableAt_idx" ON "EventOutbox"("state", "availableAt");
CREATE INDEX "EventOutbox_aggregateType_aggregateId_createdAt_idx" ON "EventOutbox"("aggregateType", "aggregateId", "createdAt");
CREATE INDEX "EventOutbox_correlationId_createdAt_idx" ON "EventOutbox"("correlationId", "createdAt");
