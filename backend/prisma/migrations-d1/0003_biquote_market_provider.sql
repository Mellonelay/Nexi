INSERT INTO "MarketProviderConfig" (
  "id", "key", "displayName", "status", "priority", "restBaseUrl", "websocketBaseUrl",
  "supportsQuotes", "supportsKlines", "supportsTrades", "supportsDepth", "createdAt", "updatedAt"
) VALUES (
  'provider-biquote', 'biquote', 'BiQuote', 'ACTIVE', 15, 'https://biquote.io', 'https://biquote.io/hubs/tick',
  1, 1, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT("key") DO UPDATE SET
  "displayName"=excluded."displayName", "status"='ACTIVE', "priority"=15,
  "restBaseUrl"=excluded."restBaseUrl", "websocketBaseUrl"=excluded."websocketBaseUrl",
  "supportsQuotes"=1, "supportsKlines"=1, "supportsTrades"=0, "supportsDepth"=0,
  "updatedAt"=CURRENT_TIMESTAMP;

INSERT INTO "MarketProviderSymbol" (
  "id", "providerId", "pairId", "providerSymbol", "enabled", "priority", "capabilityPolicy", "createdAt", "updatedAt"
)
SELECT 'biquote-' || p."id", c."id", p."id",
  CASE p."symbol" WHEN 'GOOGUSDT' THEN 'GOOGL' WHEN 'DISUSDT' THEN 'DISNEY' WHEN 'AXPUSDT' THEN 'AMERICANEXPRESS'
    ELSE CASE WHEN p."category"='stock' THEN replace(p."symbol", 'USDT', '') ELSE p."symbol" END END,
  1, 10, '{"quote":true,"kline":true,"bidAsk":true,"websocket":true,"depth":false,"trades":false}',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "MarketPair" p CROSS JOIN "MarketProviderConfig" c
WHERE c."key"='biquote' AND p."category" IN ('stock','forex','metal')
ON CONFLICT("providerId","pairId") DO UPDATE SET
  "providerSymbol"=excluded."providerSymbol", "enabled"=1, "priority"=10,
  "capabilityPolicy"=excluded."capabilityPolicy", "updatedAt"=CURRENT_TIMESTAMP;
