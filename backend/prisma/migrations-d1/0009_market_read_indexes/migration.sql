-- Keep the numeric sequence lookup already used in the live D1 database
-- reproducible from migration history.
CREATE INDEX IF NOT EXISTS "MarketQuoteSnapshot_pairId_numericSequence_idx"
  ON "MarketQuoteSnapshot"("pairId", CAST("sequence" AS INTEGER));

-- The public prices query filters on interval and orders across multiple pair
-- IDs by openTime. Prisma also projects the primary key, so the plan may still
-- perform table lookups; this index removes the multi-pair temporary sort.
CREATE INDEX IF NOT EXISTS "MarketKline_interval_openTime_pairId_symbol_close_idx"
  ON "MarketKline"("interval", "openTime", "pairId", "symbol", "close");
