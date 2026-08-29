import { BiquoteMarketAdapter } from '../../src/market/biquote-market.adapter';

describe('BiquoteMarketAdapter', () => {
  const originalEnabled = process.env.MARKET_PROVIDER_ENABLED;

  afterEach(() => {
    process.env.MARKET_PROVIDER_ENABLED = originalEnabled;
    jest.restoreAllMocks();
  });

  it('batches configured symbols and emits normalized MID quotes', async () => {
    process.env.MARKET_PROVIDER_ENABLED = 'true';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        AAPL: { symbol: 'AAPL', bid: 319.87, ask: 319.99, mid: 319.93, dayDiffPercent: 0.25, high: 321, low: 316, timestamp: '2026-08-28T19:44:43Z', marketState: 'closed' },
        XAUUSD: { symbol: 'XAUUSD', bid: 4455.832, ask: 4456.014, mid: 4455.923, dayDiffPercent: -0.1, high: 4480, low: 4420, timestamp: '2026-08-28T20:57:35Z', marketState: 'closed' },
      }),
    } as Response);
    const adapter = new BiquoteMarketAdapter();
    adapter.configure([
      { symbol: 'AAPLUSDT', providerInstrument: 'AAPL' },
      { symbol: 'XAUUSD', providerInstrument: 'XAUUSD' },
    ]);
    const events: any[] = [];
    await adapter.start((event) => events.push(event));
    adapter.stop();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain('/api/latest');
    expect(url).toContain('symbols=AAPL');
    expect(url).toContain('symbols=XAUUSD');
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      kind: 'ticker',
      symbol: 'AAPLUSDT',
      provider: 'biquote',
      providerInstrument: 'AAPL',
      priceType: 'MID',
      price: '319.93',
    });
    expect(events[1]).toMatchObject({
      symbol: 'XAUUSD',
      provider: 'biquote',
      price: '4455.923',
    });
  });
});
