import { calcIsolated, pnlDisplay } from './margin-preview.ts';

describe('backend-owned margin preview helpers', () => {
  test('calculates display-only estimates for approved leverage', () => {
    const result = calcIsolated('100', 2, 'LONG', 50000, 51000, 0.5);
    expect(result.isValid).toBe(true);
    expect(result.positionSize).toBeCloseTo(0.004, 6);
    expect(result.unrealizedPnl).toBeGreaterThan(0);
  });

  test('rejects invalid collateral without claiming a backend position', () => {
    expect(calcIsolated('0', 5, 'SHORT', 50000, 50000, null).isValid).toBe(false);
  });

  test('formats unavailable PNL explicitly', () => {
    expect(pnlDisplay(null).text).toBe('—');
  });
});
