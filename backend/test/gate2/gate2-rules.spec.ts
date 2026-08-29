import { Prisma } from '@prisma/client';
import {
  ALLOWED_BINARY_DURATIONS,
  assertPositiveDecimal,
  binaryTransitionAllowed,
  decimalProduct,
  spotTransitionAllowed,
} from '../../src/gate2/gate2-rules';

describe('Gate 2 financial rules', () => {
  it('accepts only the locked Binary durations', () => {
    expect(ALLOWED_BINARY_DURATIONS).toEqual([30, 60, 180, 280, 420]);
    expect(ALLOWED_BINARY_DURATIONS).not.toContain(90);
  });

  it('does exact decimal multiplication with bounded scale', () => {
    expect(decimalProduct('0.1', '0.2').toString()).toBe('0.02');
    expect(decimalProduct('1.005', '2', 2).toString()).toBe('2.01');
  });

  it('rejects zero, negative, non-decimal and non-finite authority values', () => {
    expect(() => assertPositiveDecimal('0')).toThrow();
    expect(() => assertPositiveDecimal('-1')).toThrow();
    expect(() => assertPositiveDecimal('1e-3')).toThrow();
    expect(() => assertPositiveDecimal(Number.NaN)).toThrow();
    expect(assertPositiveDecimal('1.25')).toEqual(new Prisma.Decimal('1.25'));
  });

  it('permits only valid Spot lifecycle transitions', () => {
    expect(spotTransitionAllowed('OPEN', 'PARTIALLY_FILLED')).toBe(true);
    expect(spotTransitionAllowed('PARTIALLY_FILLED', 'CANCELED')).toBe(true);
    expect(spotTransitionAllowed('FILLED', 'CANCELED')).toBe(false);
    expect(spotTransitionAllowed('CANCELED', 'OPEN')).toBe(false);
  });

  it('permits only one terminal Binary transition', () => {
    expect(binaryTransitionAllowed('ACTIVE', 'SETTLING')).toBe(true);
    expect(binaryTransitionAllowed('SETTLING', 'WIN')).toBe(true);
    expect(binaryTransitionAllowed('WIN', 'LOSS')).toBe(false);
    expect(binaryTransitionAllowed('ERROR', 'REFUND')).toBe(false);
  });
});
