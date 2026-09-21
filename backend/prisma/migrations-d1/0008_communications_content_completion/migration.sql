-- Complete the canonical non-market communications/content authority.
-- This migration is source-only until the later authorized Cloudflare deployment.

ALTER TABLE "Announcement" ADD COLUMN "localizations" TEXT;
ALTER TABLE "Announcement" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Announcement" ADD COLUMN "pinOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Announcement_published_pinned_pinOrder_idx"
  ON "Announcement"("published","pinned","pinOrder");

ALTER TABLE "LearnContent" ADD COLUMN "localizations" TEXT;
ALTER TABLE "LearnArticleRevision" ADD COLUMN "localizations" TEXT;

CREATE TABLE IF NOT EXISTS "MessageConversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "participantAId" TEXT NOT NULL,
  "participantBId" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "MessageConversation_participantAId_participantBId_key"
  ON "MessageConversation"("participantAId","participantBId");
CREATE INDEX IF NOT EXISTS "MessageConversation_participantAId_updatedAt_idx"
  ON "MessageConversation"("participantAId","updatedAt");
CREATE INDEX IF NOT EXISTS "MessageConversation_participantBId_updatedAt_idx"
  ON "MessageConversation"("participantBId","updatedAt");

ALTER TABLE "PersistentMessage" ADD COLUMN "conversationId" TEXT;

INSERT OR IGNORE INTO "MessageConversation"
  ("id","participantAId","participantBId","state","createdAt","updatedAt")
SELECT
  'conversation:' ||
    CASE WHEN "senderId" < "recipientId"
      THEN "senderId" || ':' || "recipientId"
      ELSE "recipientId" || ':' || "senderId"
    END,
  CASE WHEN "senderId" < "recipientId" THEN "senderId" ELSE "recipientId" END,
  CASE WHEN "senderId" < "recipientId" THEN "recipientId" ELSE "senderId" END,
  'ACTIVE',
  MIN("createdAt"),
  MAX("createdAt")
FROM "PersistentMessage"
GROUP BY
  CASE WHEN "senderId" < "recipientId" THEN "senderId" ELSE "recipientId" END,
  CASE WHEN "senderId" < "recipientId" THEN "recipientId" ELSE "senderId" END;

UPDATE "PersistentMessage"
SET "conversationId" =
  'conversation:' ||
    CASE WHEN "senderId" < "recipientId"
      THEN "senderId" || ':' || "recipientId"
      ELSE "recipientId" || ':' || "senderId"
    END
WHERE "conversationId" IS NULL;

CREATE INDEX IF NOT EXISTS "PersistentMessage_conversationId_sequence_idx"
  ON "PersistentMessage"("conversationId","sequence");

CREATE TABLE IF NOT EXISTS "MessageModerationCase" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "messageId" TEXT,
  "reporterId" TEXT NOT NULL,
  "reportedUserId" TEXT,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "resolution" TEXT,
  "reviewedById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageModerationCase_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "MessageConversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "MessageModerationCase_conversationId_status_createdAt_idx"
  ON "MessageModerationCase"("conversationId","status","createdAt");
CREATE INDEX IF NOT EXISTS "MessageModerationCase_status_createdAt_idx"
  ON "MessageModerationCase"("status","createdAt");
