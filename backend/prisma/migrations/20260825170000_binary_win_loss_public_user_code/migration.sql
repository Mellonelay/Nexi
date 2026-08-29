-- Current-authority reconciliation: preserve UUIDs internally while exposing
-- a six-digit public user identifier, and remove legacy Binary draw/refund
-- authority from the active Gate2 model.

ALTER TABLE "User" ADD COLUMN "userCode" INTEGER;
WITH numbered AS (
  SELECT "id", (100000 + ROW_NUMBER() OVER (ORDER BY "id"))::INTEGER AS "userCode"
  FROM "User"
)
UPDATE "User" AS u SET "userCode" = numbered."userCode"
FROM numbered WHERE u."id" = numbered."id";
ALTER TABLE "User" ALTER COLUMN "userCode" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_userCode_six_digits" CHECK ("userCode" BETWEEN 100000 AND 999999);
CREATE UNIQUE INDEX "User_userCode_key" ON "User"("userCode");

ALTER TABLE "MarketProviderSymbol" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "MarketProviderSymbol" ADD COLUMN "capabilityPolicy" JSONB;

ALTER TABLE "Gate2BinaryConfiguration" DROP COLUMN "tieMode";
ALTER TABLE "Gate2BinaryConfiguration" DROP COLUMN "refundRate";

CREATE TYPE "Gate2BinaryState_new" AS ENUM ('ACTIVE', 'SETTLING', 'SETTLEMENT_DELAYED', 'WIN', 'LOSS', 'ERROR');
ALTER TABLE "Gate2BinaryPosition" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "Gate2BinaryPosition"
  ALTER COLUMN "state" TYPE "Gate2BinaryState_new"
  USING (CASE WHEN "state"::text IN ('DRAW', 'REFUND') THEN 'LOSS' ELSE "state"::text END)::"Gate2BinaryState_new";
DROP TYPE "Gate2BinaryState";
ALTER TYPE "Gate2BinaryState_new" RENAME TO "Gate2BinaryState";
ALTER TABLE "Gate2BinaryPosition" ALTER COLUMN "state" SET DEFAULT 'ACTIVE'::"Gate2BinaryState";

CREATE TYPE "BinaryStatus_new" AS ENUM ('OPEN', 'WIN', 'LOSS');
ALTER TABLE "BinaryOptionPosition" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BinaryOptionPosition"
  ALTER COLUMN "status" TYPE "BinaryStatus_new"
  USING (CASE WHEN "status"::text IN ('DRAW', 'WON', 'LOST') THEN CASE WHEN "status"::text = 'WON' THEN 'WIN' ELSE 'LOSS' END ELSE "status"::text END)::"BinaryStatus_new";
DROP TYPE "BinaryStatus";
ALTER TYPE "BinaryStatus_new" RENAME TO "BinaryStatus";
ALTER TABLE "BinaryOptionPosition" ALTER COLUMN "status" SET DEFAULT 'OPEN'::"BinaryStatus";
