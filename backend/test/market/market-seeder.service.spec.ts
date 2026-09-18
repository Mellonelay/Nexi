import { MarketSeederService } from '../../src/market/market-seeder.service';

describe('MarketSeederService reconciliation gate', () => {
  const originalBackfill = process.env.MARKET_BACKFILL_ON_STARTUP;

  afterEach(() => {
    process.env.MARKET_BACKFILL_ON_STARTUP = originalBackfill;
    jest.restoreAllMocks();
  });

  it('shares one in-flight catalog reconciliation across startup consumers', async () => {
    process.env.MARKET_BACKFILL_ON_STARTUP = 'false';
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const marketAuthority = { ensureCatalog: jest.fn().mockReturnValue(gate) };
    const service = new MarketSeederService(
      marketAuthority as never,
      { persist: jest.fn() } as never,
      { isEnabled: jest.fn().mockReturnValue(false) } as never,
    );

    service.onModuleInit();
    const consumerWait = service.ensureReconciled();
    expect(marketAuthority.ensureCatalog).toHaveBeenCalledTimes(1);
    release();
    await consumerWait;
    expect(marketAuthority.ensureCatalog).toHaveBeenCalledTimes(1);
  });
});
