-- Forward-only staging/release contract correction.
-- The previous constraint retained the historical 240/480 second durations.
-- The current owner-approved product contract is 30/60/180/280/420 seconds.
ALTER TABLE "Gate2BinaryConfiguration"
  DROP CONSTRAINT IF EXISTS "Gate2BinaryConfiguration_duration_check";

ALTER TABLE "Gate2BinaryConfiguration"
  ADD CONSTRAINT "Gate2BinaryConfiguration_duration_check"
  CHECK ("durationSeconds" IN (30, 60, 180, 280, 420));
