import { AppController } from '../../src/app.controller';
import { ReadinessService } from '../../src/observability/readiness.service';

describe('Public market prices boundary', () => {
  it('delegates GET /market/prices to the canonical snapshot authority', async () => {
    const prices = [{ symbol: 'BTCUSDT', state: 'LIVE' }];
    const marketAuthority = { getPrices: jest.fn().mockResolvedValue(prices) };
    const controller = new AppController(
      { getHello: jest.fn() } as any,
      {} as ReadinessService,
      marketAuthority as any,
    );

    await expect(controller.getAllPrices()).resolves.toBe(prices);
    expect(marketAuthority.getPrices).toHaveBeenCalledTimes(1);
  });
});
