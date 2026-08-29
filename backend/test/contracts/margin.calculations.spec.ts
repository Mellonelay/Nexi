import { Prisma } from '@prisma/client';
import { isLiquidatable, marginPnl, simpleInterest } from '../../src/spot/margin.calculations';

describe('Spot isolated margin calculations', () => {
  it('calculates directional PNL with decimal arithmetic', () => {
    expect(marginPnl('LONG', new Prisma.Decimal('2'), new Prisma.Decimal('100'), new Prisma.Decimal('110')).toString()).toBe('20');
    expect(marginPnl('SHORT', new Prisma.Decimal('2'), new Prisma.Decimal('100'), new Prisma.Decimal('90')).toString()).toBe('20');
  });

  it('calculates simple interest without floating point arithmetic', () => {
    expect(simpleInterest(new Prisma.Decimal('1000'), new Prisma.Decimal('0.1'), 31_536_000).toString()).toBe('100');
  });

  it('marks a position liquidatable only below maintenance equity', () => {
    expect(isLiquidatable(new Prisma.Decimal('100'), new Prisma.Decimal('-80'), new Prisma.Decimal('0'), new Prisma.Decimal('0.25'))).toBe(true);
    expect(isLiquidatable(new Prisma.Decimal('100'), new Prisma.Decimal('-20'), new Prisma.Decimal('0'), new Prisma.Decimal('0.25'))).toBe(false);
  });
});
