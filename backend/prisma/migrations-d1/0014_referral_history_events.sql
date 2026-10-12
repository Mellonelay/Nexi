-- Record only newly established referral attribution and actual ledger-backed affiliate rewards.
-- Existing Affiliate relationships and legacy Reward rows are intentionally not backfilled.

CREATE TABLE IF NOT EXISTS "ReferralAttributionEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "referrerUserId" TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL UNIQUE,
  "referralCode" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attributedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralAttributionEvent_referrer_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ReferralAttributionEvent_referred_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ReferralAttributionEvent_referrer_attributed_idx"
  ON "ReferralAttributionEvent"("referrerUserId","attributedAt");

CREATE TABLE IF NOT EXISTS "ReferralRewardEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "referrerUserId" TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL,
  "ledgerPostingId" TEXT NOT NULL UNIQUE,
  "amount" TEXT NOT NULL,
  "asset" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "rewardedAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralRewardEvent_referrer_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ReferralRewardEvent_referred_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ReferralRewardEvent_posting_fkey" FOREIGN KEY ("ledgerPostingId") REFERENCES "LedgerPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ReferralRewardEvent_referrer_rewarded_idx"
  ON "ReferralRewardEvent"("referrerUserId","rewardedAt");

CREATE TRIGGER IF NOT EXISTS "Affiliate_capture_referral_attribution"
AFTER UPDATE OF "referredBy" ON "Affiliate"
WHEN OLD."referredBy" IS NULL AND NEW."referredBy" IS NOT NULL
BEGIN
  INSERT OR IGNORE INTO "ReferralAttributionEvent"
    ("id","referrerUserId","referredUserId","referralCode","status","attributedAt","createdAt")
  SELECT
    'referral-attribution-' || NEW."userId",
    referrer."userId",
    NEW."userId",
    referrer."referralCode",
    'ATTRIBUTED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM "Affiliate" referrer
  WHERE referrer."userId"=NEW."referredBy";

  INSERT OR IGNORE INTO "EventOutbox"
    ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","attempts","createdAt","updatedAt")
  SELECT
    'outbox-referral-attribution-' || NEW."userId",
    'event:referral-attribution:' || NEW."userId",
    'ReferralAttributionEvent',
    'referral-attribution-' || NEW."userId",
    'REFERRAL_ATTRIBUTED',
    1,
    'referral-attribution:' || NEW."userId",
    json_object(
      'referrerUserId', referrer."userId",
      'referredUserId', NEW."userId",
      'referralCode', referrer."referralCode",
      'status', 'ATTRIBUTED',
      'attributedAt', CURRENT_TIMESTAMP
    ),
    'PENDING',
    CURRENT_TIMESTAMP,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM "Affiliate" referrer
  WHERE referrer."userId"=NEW."referredBy"
    AND EXISTS (
      SELECT 1 FROM "ReferralAttributionEvent" e
      WHERE e."referredUserId"=NEW."userId"
        AND e."referrerUserId"=NEW."referredBy"
    );
END;

-- The canonical financial posting is the reward source. Its referenceId is the
-- referred user's id; the trigger requires that relationship to already exist.
CREATE TRIGGER IF NOT EXISTS "LedgerPosting_capture_affiliate_reward"
AFTER INSERT ON "LedgerPosting"
WHEN NEW."referenceType"='AFFILIATE_REWARD'
  AND NEW."kind"='CREDIT'
  AND CAST(NEW."availableDelta" AS NUMERIC) > 0
BEGIN
  INSERT OR IGNORE INTO "ReferralRewardEvent"
    ("id","referrerUserId","referredUserId","ledgerPostingId","amount","asset","status","rewardedAt","createdAt")
  SELECT
    'referral-reward-' || NEW."id",
    referrer."userId",
    referred."userId",
    NEW."id",
    NEW."amount",
    NEW."asset",
    'COMPLETED',
    NEW."createdAt",
    CURRENT_TIMESTAMP
  FROM "LedgerAccount" referrerAccount
  JOIN "Affiliate" referred ON referred."userId"=NEW."referenceId"
  JOIN "Affiliate" referrer ON referrer."userId"=referrerAccount."userId"
  WHERE referrerAccount."id"=NEW."accountId"
    AND referred."referredBy"=referrer."userId";

  INSERT OR IGNORE INTO "EventOutbox"
    ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","attempts","createdAt","updatedAt")
  SELECT
    'outbox-referral-reward-' || NEW."id",
    'event:referral-reward:' || NEW."id",
    'ReferralRewardEvent',
    'referral-reward-' || NEW."id",
    'AFFILIATE_REWARD_RECORDED',
    1,
    NEW."correlationId",
    json_object(
      'referrerUserId', e."referrerUserId",
      'referredUserId', e."referredUserId",
      'ledgerPostingId', NEW."id",
      'amount', e."amount",
      'asset', e."asset",
      'status', e."status",
      'rewardedAt', e."rewardedAt"
    ),
    'PENDING',
    CURRENT_TIMESTAMP,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM "ReferralRewardEvent" e
  WHERE e."ledgerPostingId"=NEW."id";
END;
