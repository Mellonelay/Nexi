-- Queue delivery receipt. It records at-least-once Queue ingress only; it never owns domain or financial truth.
CREATE TABLE IF NOT EXISTS "EventInbox" (
  "messageId" TEXT NOT NULL PRIMARY KEY,
  "queue" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventVersion" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'RECEIVED',
  "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" DATETIME,
  "lastErrorCode" TEXT,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "EventInbox_queue_idempotencyKey_key" ON "EventInbox"("queue", "idempotencyKey");
CREATE INDEX IF NOT EXISTS "EventInbox_state_receivedAt_idx" ON "EventInbox"("state", "receivedAt");
