-- Make each configured loan product settlement asset explicit.
ALTER TABLE "LoanPlan" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USDT';
