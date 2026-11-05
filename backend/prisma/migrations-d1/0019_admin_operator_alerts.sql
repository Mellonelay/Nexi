CREATE TABLE IF NOT EXISTS "AdminOperatorAlertSource" (
  "sourceEventId" TEXT NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "AdminOperatorAlert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceEventId" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL,
  "requiredPermission" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'NORMAL',
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AdminOperatorAlert_permission_createdAt_idx"
  ON "AdminOperatorAlert"("requiredPermission","createdAt");
CREATE INDEX IF NOT EXISTS "AdminOperatorAlert_category_createdAt_idx"
  ON "AdminOperatorAlert"("category","createdAt");
CREATE TABLE IF NOT EXISTS "AdminOperatorAlertRead" (
  "adminId" TEXT NOT NULL,
  "alertId" TEXT NOT NULL,
  "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("adminId","alertId")
);
CREATE INDEX IF NOT EXISTS "AdminOperatorAlertRead_admin_readAt_idx"
  ON "AdminOperatorAlertRead"("adminId","readAt");
CREATE TABLE IF NOT EXISTS "AdminOperatorAlertPreference" (
  "adminId" TEXT NOT NULL PRIMARY KEY,
  "disabledCategories" TEXT NOT NULL DEFAULT '["TRADING"]',
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
