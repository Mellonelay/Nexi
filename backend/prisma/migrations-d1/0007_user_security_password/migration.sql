-- Add a credential used only for public sensitive-action confirmation.
-- User.password remains the independent Admin email/password credential.
ALTER TABLE "User" ADD COLUMN "securityPasswordHash" TEXT;
