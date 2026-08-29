-- Gate 2 correction: preserve STOP trigger provenance and immutable Binary configuration history.
ALTER TABLE "Gate2SpotOrder"
  ADD COLUMN "triggeredAt" TIMESTAMP(3),
  ADD COLUMN "triggerQuoteId" TEXT,
  ADD COLUMN "triggerProvider" TEXT,
  ADD COLUMN "triggerSource" TEXT,
  ADD COLUMN "triggerObservedAt" TIMESTAMP(3),
  ADD COLUMN "triggerSequence" BIGINT;

DROP INDEX "Gate2BinaryConfiguration_pair_durationSeconds_key";

CREATE UNIQUE INDEX "Gate2BinaryConfiguration_pair_durationSeconds_version_key"
  ON "Gate2BinaryConfiguration"("pair", "durationSeconds", "version");
