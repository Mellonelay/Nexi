ALTER TABLE "Gate2BinaryConfiguration"
  DROP CONSTRAINT IF EXISTS "Gate2BinaryConfiguration_duration_check";

ALTER TABLE "Gate2BinaryConfiguration"
  ADD CONSTRAINT "Gate2BinaryConfiguration_duration_check"
  CHECK ("durationSeconds" IN (30, 60, 180, 280, 420));
