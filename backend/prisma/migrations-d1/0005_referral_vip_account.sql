-- Restore the wallet-native Referral/VIP account layer after the D1 migration.
-- 0004 is reserved for the newer market top-of-book/MOEX migration currently
-- being reconciled from the authoritative VM workspace.

CREATE TABLE IF NOT EXISTS "VipLevel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "level" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "threshold" TEXT NOT NULL DEFAULT '0',
  "benefits" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "VipLevel_level_key" ON "VipLevel"("level");
CREATE INDEX IF NOT EXISTS "VipLevel_enabled_level_idx" ON "VipLevel"("enabled","level");

CREATE TABLE IF NOT EXISTS "UserVipState" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "vipLevelId" TEXT NOT NULL,
  "progress" TEXT NOT NULL DEFAULT '0',
  "evaluatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "qualifiedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserVipState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserVipState_vipLevelId_fkey" FOREIGN KEY ("vipLevelId") REFERENCES "VipLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserVipState_userId_key" ON "UserVipState"("userId");
CREATE INDEX IF NOT EXISTS "UserVipState_level_progress_idx" ON "UserVipState"("vipLevelId","progress");

INSERT INTO "VipLevel" ("id","level","name","threshold","benefits","enabled","createdAt","updatedAt")
VALUES ('vip-level-0',0,'Member','0','{"label":"Member","description":"Default NEXI membership"}',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT("level") DO NOTHING;

-- Existing users receive the same account state that new wallet sign-ins receive.
INSERT INTO "Affiliate" ("id","userId","referralCode","referredBy","totalEarnings","createdAt","updatedAt")
SELECT 'affiliate-' || u."id",u."id",'NEXI' || printf('%06d',u."userCode"),NULL,'0',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM "User" u
WHERE NOT EXISTS (SELECT 1 FROM "Affiliate" a WHERE a."userId"=u."id");

INSERT INTO "UserPreference" ("id","userId","locale","timezone","theme","notificationSettings","tradingSettings","createdAt","updatedAt")
SELECT 'preference-' || u."id",u."id",'en','UTC','dark',NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM "User" u
WHERE NOT EXISTS (SELECT 1 FROM "UserPreference" p WHERE p."userId"=u."id");

INSERT INTO "UserVipState" ("id","userId","vipLevelId","progress","evaluatedAt","qualifiedAt","createdAt","updatedAt")
SELECT 'vip-state-' || u."id",u."id",'vip-level-0','0',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM "User" u
WHERE NOT EXISTS (SELECT 1 FROM "UserVipState" s WHERE s."userId"=u."id");
