import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

export function assertPositiveDecimal(value: string | number | Prisma.Decimal): Prisma.Decimal {
  return parseDecimal(value, false);
}

function parseDecimal(value: string | number | Prisma.Decimal, allowZero: boolean): Prisma.Decimal {
  const raw = value instanceof Prisma.Decimal ? value.toString() : typeof value === 'number' ? String(value) : value;
  if (typeof raw !== 'string' || !DECIMAL_PATTERN.test(raw)) {
    throw new BadRequestException('Financial value must be a finite decimal with at most 18 fractional digits');
  }
  const decimal = new Prisma.Decimal(raw);
  if (!decimal.isFinite() || decimal.isNegative() || (!allowZero && decimal.isZero())) {
    throw new BadRequestException(allowZero ? 'Financial value must be non-negative' : 'Financial value must be positive');
  }
  return decimal;
}

export function assertNonNegativeDecimal(value: string | number | Prisma.Decimal): Prisma.Decimal {
  return parseDecimal(value, true);
}

export function decimalProduct(left: string | number | Prisma.Decimal, right: string | number | Prisma.Decimal, scale = 18): Prisma.Decimal {
  const result = assertNonNegativeDecimal(left).mul(assertNonNegativeDecimal(right));
  return result.toDecimalPlaces(scale, Prisma.Decimal.ROUND_DOWN);
}

export function decimalString(value: string | number | Prisma.Decimal): string {
  return assertPositiveDecimal(value).toString();
}

const SPOT_TRANSITIONS: Record<string, readonly string[]> = {
  OPEN: ['PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED'],
  PARTIALLY_FILLED: ['PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'REJECTED'],
  FILLED: [],
  CANCELED: [],
  REJECTED: [],
};

const BINARY_TRANSITIONS: Record<string, readonly string[]> = {
  ACTIVE: ['SETTLING', 'SETTLEMENT_DELAYED', 'ERROR'],
  SETTLING: ['WIN', 'LOSS', 'ERROR', 'SETTLEMENT_DELAYED'],
  SETTLEMENT_DELAYED: ['SETTLING', 'ERROR'],
  WIN: [],
  LOSS: [],
  ERROR: [],
};

export function spotTransitionAllowed(from: string, to: string): boolean {
  return SPOT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function binaryTransitionAllowed(from: string, to: string): boolean {
  return BINARY_TRANSITIONS[from]?.includes(to) ?? false;
}
