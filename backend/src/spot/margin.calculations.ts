import { Prisma } from '@prisma/client';

export function marginPnl(direction: 'LONG' | 'SHORT', quantity: Prisma.Decimal, entryPrice: Prisma.Decimal, markPrice: Prisma.Decimal): Prisma.Decimal {
  const delta = direction === 'LONG' ? markPrice.sub(entryPrice) : entryPrice.sub(markPrice);
  return delta.mul(quantity).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
}

export function simpleInterest(principal: Prisma.Decimal, annualRate: Prisma.Decimal, elapsedSeconds: number): Prisma.Decimal {
  if (!Number.isInteger(elapsedSeconds) || elapsedSeconds < 0) throw new Error('Elapsed seconds must be a non-negative integer');
  if (annualRate.isNegative() || principal.isNegative()) throw new Error('Interest inputs cannot be negative');
  return principal.mul(annualRate).mul(elapsedSeconds).div(31_536_000).toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
}

export function isLiquidatable(collateral: Prisma.Decimal, unrealizedPnl: Prisma.Decimal, interest: Prisma.Decimal, maintenanceRatio: Prisma.Decimal): boolean {
  if (maintenanceRatio.isNegative() || maintenanceRatio.gte(1)) throw new Error('Maintenance ratio must be between 0 and 1');
  const equity = collateral.add(unrealizedPnl).sub(interest);
  return equity.lte(collateral.mul(maintenanceRatio));
}
