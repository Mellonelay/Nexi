-- Project each canonical, ledger-backed referral reward into the owner's Activity.
-- The ledger posting and ReferralRewardEvent remain the financial authorities.
CREATE TRIGGER IF NOT EXISTS "ReferralRewardEvent_create_activity"
AFTER INSERT ON "ReferralRewardEvent"
BEGIN
  INSERT OR IGNORE INTO "Activity"
    ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt")
  SELECT
    'activity-referral-reward-' || NEW."ledgerPostingId",
    NEW."referrerUserId",
    'REFERRAL_REWARD',
    NEW."status",
    'AFFILIATE_REWARD',
    NEW."id",
    'activity:referral-reward:' || NEW."ledgerPostingId",
    posting."correlationId",
    posting."id",
    NEW."asset",
    NEW."amount",
    json_object('rewardEventId', NEW."id", 'referredUserId', NEW."referredUserId", 'ledgerPostingId', posting."id"),
    NEW."rewardedAt"
  FROM "LedgerPosting" posting
  JOIN "LedgerAccount" account ON account."id"=posting."accountId"
  WHERE posting."id"=NEW."ledgerPostingId"
    AND account."userId"=NEW."referrerUserId"
    AND posting."referenceType"='AFFILIATE_REWARD'
    AND posting."kind"='CREDIT'
    AND CAST(posting."availableDelta" AS NUMERIC)>0;
END;

-- 0014 can already have recorded rewards before this Activity projection exists.
INSERT OR IGNORE INTO "Activity"
  ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt")
SELECT
  'activity-referral-reward-' || event."ledgerPostingId",
  event."referrerUserId",
  'REFERRAL_REWARD',
  event."status",
  'AFFILIATE_REWARD',
  event."id",
  'activity:referral-reward:' || event."ledgerPostingId",
  posting."correlationId",
  posting."id",
  event."asset",
  event."amount",
  json_object('rewardEventId', event."id", 'referredUserId', event."referredUserId", 'ledgerPostingId', posting."id"),
  event."rewardedAt"
FROM "ReferralRewardEvent" event
JOIN "LedgerPosting" posting ON posting."id"=event."ledgerPostingId"
JOIN "LedgerAccount" account ON account."id"=posting."accountId"
WHERE account."userId"=event."referrerUserId"
  AND posting."referenceType"='AFFILIATE_REWARD'
  AND posting."kind"='CREDIT'
  AND CAST(posting."availableDelta" AS NUMERIC)>0;
