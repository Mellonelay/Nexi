-- Keep the numeric sequence lookup already used in the live D1 database
-- reproducible from migration history.
CREATE INDEX IF NOT EXISTS "MarketQuoteSnapshot_pairId_numericSequence_idx"
  ON "MarketQuoteSnapshot"("pairId", CAST("sequence" AS INTEGER));

-- The public prices query filters on interval, orders across multiple pair IDs
-- by openTime, and only returns symbol/close. This covering index removes the
-- multi-pair temporary sort and avoids table lookups for each candle result.
CREATE INDEX IF NOT EXISTS "MarketKline_interval_openTime_pairId_symbol_close_idx"
  ON "MarketKline"("interval", "openTime", "pairId", "symbol", "close");
