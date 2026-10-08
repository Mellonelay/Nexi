-- Wallet funding networks are a separate authority from MarketNetwork.
CREATE TABLE "WalletNetwork" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "currencyId" INTEGER NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT 0,
  "depositEnabled" BOOLEAN NOT NULL DEFAULT 0,
  "withdrawEnabled" BOOLEAN NOT NULL DEFAULT 0,
  "notice" TEXT,
  "instructions" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletNetwork_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WalletNetwork_currencyId_code_key" ON "WalletNetwork"("currencyId","code");
CREATE INDEX "WalletNetwork_currencyId_isActive_idx" ON "WalletNetwork"("currencyId","isActive");

-- Provision the intended funding universe as inactive, fail-closed configuration.
INSERT OR IGNORE INTO "Currency" ("symbol","name","depositEnabled","withdrawEnabled","isActive","createdAt","updatedAt")
VALUES
  ('BTC','Bitcoin',0,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('ETH','Ethereum',0,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('USDT','Tether',0,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('SOL','Solana',0,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('TRX','Tron',0,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
WITH networks(asset,code,name) AS (
  VALUES ('BTC','BITCOIN','Bitcoin'),('ETH','ETHEREUM','Ethereum'),('ETH','BASE','Base'),('USDT','ERC20','ERC20'),('USDT','TRC20','TRC20'),('USDT','SOLANA','Solana'),('SOL','SOLANA','Solana'),('TRX','TRON','Tron')
)
INSERT OR IGNORE INTO "WalletNetwork" ("id","currencyId","code","name","createdAt","updatedAt")
SELECT lower(substr(hex(randomblob(16)),1,8)||'-'||substr(hex(randomblob(16)),1,4)||'-'||substr(hex(randomblob(16)),1,4)||'-'||substr(hex(randomblob(16)),1,4)||'-'||substr(hex(randomblob(16)),1,12)), c."id", n.code, n.name, CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM "Currency" c JOIN networks n ON n.asset=c."symbol";

-- Preserve historic address strings, adding nullable authority links for existing rows.
ALTER TABLE "DepositAddress" ADD COLUMN "walletNetworkId" TEXT REFERENCES "WalletNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
INSERT OR IGNORE INTO "WalletNetwork" ("id","currencyId","code","name","createdAt","updatedAt")
SELECT lower(substr(hex(randomblob(16)),1,8)||'-'||substr(hex(randomblob(16)),1,4)||'-'||substr(hex(randomblob(16)),1,4)||'-'||substr(hex(randomblob(16)),1,4)||'-'||substr(hex(randomblob(16)),1,12)), d."currencyId", upper(trim(d."network")), trim(d."network"), CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM "DepositAddress" d
WHERE trim(d."network") <> ''
  AND NOT EXISTS (SELECT 1 FROM "WalletNetwork" w WHERE w."currencyId"=d."currencyId" AND w."code"=upper(trim(d."network")));
UPDATE "DepositAddress"
SET "walletNetworkId"=(SELECT w."id" FROM "WalletNetwork" w WHERE w."currencyId"="DepositAddress"."currencyId" AND w."code"=upper(trim("DepositAddress"."network")) LIMIT 1)
WHERE "walletNetworkId" IS NULL;
CREATE INDEX "DepositAddress_walletNetworkId_isActive_idx" ON "DepositAddress"("walletNetworkId","isActive");
