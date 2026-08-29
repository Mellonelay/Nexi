-- B7 forward-only financial authority extension.
-- Legacy Float columns are retained as compatibility projections; new commands use NUMERIC.
ALTER TABLE "LoanApplication"
  ADD COLUMN "amountDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0,
  ADD COLUMN "interestRateDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0.1,
  ADD COLUMN "totalRepaymentDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0;

UPDATE "LoanApplication"
SET "amountDecimal" = "amount"::numeric,
    "interestRateDecimal" = "interestRate"::numeric,
    "totalRepaymentDecimal" = "totalRepayment"::numeric;

ALTER TABLE "MiningPlan"
  ADD COLUMN "dailyYieldDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0,
  ADD COLUMN "minDepositDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0,
  ADD COLUMN "maxDepositDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0;

UPDATE "MiningPlan"
SET "dailyYieldDecimal" = "dailyYield"::numeric,
    "minDepositDecimal" = "minDeposit"::numeric,
    "maxDepositDecimal" = "maxDeposit"::numeric;

ALTER TABLE "MiningSubscription"
  ADD COLUMN "amountDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0,
  ADD COLUMN "totalRewardsDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0;

UPDATE "MiningSubscription"
SET "amountDecimal" = "amount"::numeric,
    "totalRewardsDecimal" = "totalRewards"::numeric;

ALTER TABLE "LoanRepayment"
  ADD COLUMN "amountDecimal" DECIMAL(38,18) NOT NULL DEFAULT 0;

UPDATE "LoanRepayment"
SET "amountDecimal" = "amount"::numeric;
