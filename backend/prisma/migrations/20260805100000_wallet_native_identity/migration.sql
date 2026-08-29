ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "password" DROP NOT NULL,
  ADD COLUMN "displayName" TEXT;

CREATE TABLE "WalletIdentity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "chainId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WalletIdentity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WalletIdentity_userId_key" ON "WalletIdentity"("userId");
CREATE UNIQUE INDEX "WalletIdentity_address_key" ON "WalletIdentity"("address");
CREATE INDEX "WalletIdentity_address_chainId_idx" ON "WalletIdentity"("address", "chainId");
ALTER TABLE "WalletIdentity" ADD CONSTRAINT "WalletIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
