import { BadRequestException } from "@nestjs/common";
import { Prisma } from "../prisma/d1-client";
import type { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";

export type AdminPlanMutationContext = {
  adminId: string;
  reason: string;
  idempotencyKey: string;
};

export function requireMiningPlanMutationContext(
  context?: AdminPlanMutationContext,
): AdminPlanMutationContext {
  if (
    [context?.adminId, context?.reason?.trim(), context?.idempotencyKey?.trim()].some(
      (value) => !value,
    )
  ) {
    throw new BadRequestException("Mining plan audit context is required");
  }
  return context;
}

export function assertValidMiningPlanValues(
  dailyYield: Prisma.Decimal,
  minDeposit: Prisma.Decimal,
  maxDeposit: Prisma.Decimal,
  lockupPeriod?: number,
): void {
  const invalid = [
    dailyYield.isNegative(),
    minDeposit.isNegative(),
    maxDeposit.lt(minDeposit),
    lockupPeriod !== undefined && !Number.isInteger(lockupPeriod),
    lockupPeriod !== undefined && lockupPeriod < 1,
  ].some(Boolean);
  if (invalid) throw new BadRequestException("Mining plan values are invalid");
}

function hasPrismaSetValue(value: unknown): value is { set: unknown } {
  return value !== null && typeof value === "object" && "set" in value;
}

export function miningPlanDecimalPatch(data: any): any {
  const patch: any = { ...data };
  for (const [field, decimalField] of [
    ["dailyYield", "dailyYieldDecimal"],
    ["minDeposit", "minDepositDecimal"],
    ["maxDeposit", "maxDepositDecimal"],
  ]) {
    const value = data[field];
    if (!hasPrismaSetValue(value)) continue;
    patch[decimalField] = new Prisma.Decimal(String(value.set)).toString();
  }
  return patch;
}

function miningPlanPatchedValue(value: unknown, fallback: unknown): unknown {
  if (value === undefined) return fallback;
  if (!hasPrismaSetValue(value)) return value;
  return value.set;
}

function miningPlanDecimal(value: unknown, fallback: unknown): Prisma.Decimal {
  return new Prisma.Decimal(String(miningPlanPatchedValue(value, fallback)));
}

export async function updateD1MiningPlan(input: {
  d1: D1FinancialCommandGateway;
  id: string;
  data: any;
  existing: any;
  context: AdminPlanMutationContext;
}) {
  const { d1, id, data, existing, context } = input;
  const dailyYield = miningPlanDecimal(
    data.dailyYield,
    existing.dailyYieldDecimal ?? existing.dailyYield,
  );
  const minDeposit = miningPlanDecimal(
    data.minDeposit,
    existing.minDepositDecimal ?? existing.minDeposit,
  );
  const maxDeposit = miningPlanDecimal(
    data.maxDeposit,
    existing.maxDepositDecimal ?? existing.maxDeposit,
  );
  const lockupPeriod = Number(data.lockupPeriod ?? existing.lockupPeriod);
  assertValidMiningPlanValues(dailyYield, minDeposit, maxDeposit, lockupPeriod);
  return d1.updateMiningPlan({
    id,
    name: String(data.name ?? existing.name).trim(),
    currency: String(data.currency ?? existing.currency).trim().toUpperCase(),
    lockupPeriod,
    dailyYield: dailyYield.toString(),
    minDeposit: minDeposit.toString(),
    maxDeposit: maxDeposit.toString(),
    isActive:
      data.isActive === undefined
        ? Boolean(Number(existing.isActive))
        : Boolean(data.isActive),
    adminId: context.adminId,
    reason: context.reason,
    idempotencyKey: context.idempotencyKey,
  });
}
