-- Repair UUID-shaped identifiers produced by migration 0012. Preserve all
-- configuration and cascade existing DepositAddress authority links.
UPDATE "WalletNetwork"
SET "id" = substr("id",1,14) || '4' || substr("id",16,4) || '8' || substr("id",21)
WHERE length("id")=36
  AND (substr("id",15,1) NOT GLOB '[1-8]' OR substr("id",20,1) NOT GLOB '[89aAbB]');
