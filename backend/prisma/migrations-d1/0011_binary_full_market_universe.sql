-- Complete version-one defaults for every currently active canonical NEXI market pair.
-- Existing Admin/D1 configurations (including disabled rows) remain authoritative.
-- Quote/provider and market availability are still checked at position open/settlement.
WITH durations("durationSeconds") AS (
  VALUES (30), (60), (180), (280), (420)
)
INSERT INTO "Gate2BinaryConfiguration"
  ("id","pair","durationSeconds","payoutRate","lossRate","minStake","maxStake","settlementDelaySeconds","version","enabled","createdAt","updatedAt")
SELECT
  lower(hex(randomblob(16))), p."symbol", d."durationSeconds",
  '0.85', '0', '1', '1000', 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "MarketPair" p
JOIN "MarketAsset" base ON base."id"=p."baseAssetId"
JOIN "MarketAsset" quote ON quote."id"=p."quoteAssetId"
CROSS JOIN durations d
WHERE p."status"='ACTIVE'
  AND p."category" IN ('crypto','stock','forex','metal')
  AND base."status"='ACTIVE'
  AND quote."status"='ACTIVE'
  AND 2=(
    SELECT COUNT(*)
    FROM "MarketAssetCapability" c
    WHERE c."assetId" IN (p."baseAssetId",p."quoteAssetId")
      AND c."status"='ACTIVE'
      AND c."tradingEnabled"=1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "Gate2BinaryConfiguration" current
    WHERE current."pair"=p."symbol"
      AND current."durationSeconds"=d."durationSeconds"
  );
