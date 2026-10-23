import { MarketIngestService } from '../../src/market/market-ingest.service';

describe('MarketIngestService shutdown', () => {
  it('waits for in-flight persistence before the Nest module can close SQLite', async () => {
    let finishIngest!: (value: { accepted: boolean }) => void;
    const inFlight = new Promise<{ accepted: boolean }>((resolve) => { finishIngest = resolve; });
    const ingestQuote = jest.fn(() => inFlight);
    const service = new MarketIngestService(
      { ingestQuote } as any,
      {} as any,
      {} as any,
      { stop: jest.fn(async () => undefined) } as any,
      { isAvailable: () => false } as any,
    );
    const event = {
      kind: 'ticker', symbol: 'BTCUSDT', provider: 'binance-spot', source: 'test',
      priceType: 'spot', price: '1', eventTime: new Date().toISOString(),
    } as any;

    (service as any).enqueue(event);
    await Promise.resolve();
    let shutdownFinished = false;
    const shutdown = service.onModuleDestroy().then(() => { shutdownFinished = true; });
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(ingestQuote).toHaveBeenCalledTimes(1);
    expect(shutdownFinished).toBe(false);
    finishIngest({ accepted: true });
    await shutdown;

    expect(shutdownFinished).toBe(true);
    (service as any).enqueue(event);
    expect(ingestQuote).toHaveBeenCalledTimes(1);
  });
});
