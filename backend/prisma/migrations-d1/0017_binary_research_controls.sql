-- Persist research-only Binary defaults and per-position override fencing.
ALTER TABLE "User" ADD COLUMN "binaryResearchDefault" TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Gate2BinaryPosition" ADD COLUMN "researchDefault" TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Gate2BinaryPosition" ADD COLUMN "researchOverride" TEXT;
ALTER TABLE "Gate2BinaryPosition" ADD COLUMN "researchControlVersion" INTEGER NOT NULL DEFAULT 0;
