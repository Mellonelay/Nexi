ALTER TABLE "MarketQuoteSnapshot" ADD COLUMN "bid" TEXT;
ALTER TABLE "MarketQuoteSnapshot" ADD COLUMN "ask" TEXT;
ALTER TABLE "MarketQuoteSnapshot" ADD COLUMN "spread" TEXT;
ALTER TABLE "MarketQuoteLatest" ADD COLUMN "bid" TEXT;
ALTER TABLE "MarketQuoteLatest" ADD COLUMN "ask" TEXT;
ALTER TABLE "MarketQuoteLatest" ADD COLUMN "spread" TEXT;

INSERT INTO "MarketProviderConfig" (
  "id", "key", "displayName", "status", "priority", "restBaseUrl", "websocketBaseUrl",
  "supportsQuotes", "supportsKlines", "supportsTrades", "supportsDepth", "createdAt", "updatedAt"
) VALUES (
  'provider-moex', 'moex', 'Moscow Exchange ISS', 'ACTIVE', 5,
  'https://iss.moex.com', NULL, 1, 1, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT("key") DO UPDATE SET
  "displayName"=excluded."displayName", "status"='ACTIVE', "priority"=5,
  "restBaseUrl"=excluded."restBaseUrl", "supportsQuotes"=1, "supportsKlines"=1,
  "supportsTrades"=0, "supportsDepth"=0, "updatedAt"=CURRENT_TIMESTAMP;

INSERT INTO "MarketProviderSymbol" (
  "id", "providerId", "pairId", "providerSymbol", "enabled", "priority", "capabilityPolicy", "createdAt", "updatedAt"
)
SELECT 'moex-' || p."id", c."id", p."id", 'USD000UTSTOM', 1, 1,
  '{"quote":true,"kline":true,"bidAsk":true,"websocket":false,"depth":false,"trades":false,"delayed":true}',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "MarketPair" p CROSS JOIN "MarketProviderConfig" c
WHERE c."key"='moex' AND p."symbol"='USDRUB'
ON CONFLICT("providerId","pairId") DO UPDATE SET
  "providerSymbol"='USD000UTSTOM', "enabled"=1, "priority"=1,
  "capabilityPolicy"=excluded."capabilityPolicy", "updatedAt"=CURRENT_TIMESTAMP;

UPDATE "MarketProviderSymbol"
SET "capabilityPolicy"='{"quote":false,"kline":false,"bidAsk":false,"websocket":true,"depth":false,"trades":false}',
    "updatedAt"=CURRENT_TIMESTAMP
WHERE "providerId"=(SELECT "id" FROM "MarketProviderConfig" WHERE "key"='biquote')
  AND "pairId" IN (
    SELECT "id" FROM "MarketPair" WHERE "symbol" IN ('AXPUSDT','DISUSDT','UBERUSDT','SONYUSDT','USDRUB')
  );
