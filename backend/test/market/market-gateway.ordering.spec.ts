import { jest } from "@jest/globals";
// This gateway unit test supplies MarketAuthorityService itself. Mocking its
// module keeps the test unit-scoped and avoids loading the production D1
// adapter (which pulls ESM-only `ky`) through Jest's CommonJS runtime.
jest.unstable_mockModule('../../src/market/market-authority.service', () => ({
  MarketAuthorityService: class MarketAuthorityService {},
}));

const { MarketGateway } = await import('../../src/market/market.gateway');

describe('MarketGateway ordering and deduplication', () => {
  it('does not label an unavailable snapshot as live', async () => {
    const emit = jest.fn();
    const gateway = new MarketGateway(
      { isAvailable: jest.fn().mockReturnValue(true) } as any,
      { getPrices: jest.fn().mockResolvedValue([{ symbol: 'BTCUSDT', state: 'UNAVAILABLE' }]) } as any,
    );

    await (gateway as any).sendSnapshot({ emit });

    expect(emit).toHaveBeenCalledWith('market_snapshot', expect.objectContaining({ state: 'UNAVAILABLE' }));
  });

  it('publishes a newer sequence and ignores replayed sequences', () => {
    const emit = jest.fn();
    const gateway = new MarketGateway(
      { isAvailable: jest.fn().mockReturnValue(true) } as any,
      { getPrices: jest.fn() } as any,
    );
    (gateway as any).server = { emit };
    const event = (sequence: string) => ({
      version: 'v1', event: 'market.quote', sequence,
      quote: { symbol: 'BTCUSDT', price: '10', change24h: null, volume24h: null, high24h: null, low24h: null, state: 'LIVE', provider: 'test', source: 'fixture', observedAt: new Date().toISOString(), receivedAt: new Date().toISOString() },
    });

    (gateway as any).broadcastMarketQuote(event('2'));
    (gateway as any).broadcastMarketQuote(event('1'));

    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenNthCalledWith(1, 'market_quote', expect.objectContaining({ sequence: '2' }));
    expect(emit).toHaveBeenNthCalledWith(2, 'market_tick', expect.objectContaining({ sequence: '2' }));
  });

  it('does not crash when Redis adapter publication is closed', () => {
    const gateway = new MarketGateway(
      { isAvailable: jest.fn().mockReturnValue(true) } as any,
      { getPrices: jest.fn() } as any,
    );
    (gateway as any).server = {
      emit: jest.fn(() => { throw new Error('Connection is closed'); }),
    };

    expect(() => (gateway as any).broadcastMarketReference({ event: 'market_depth', sequence: '1' })).not.toThrow();
  });

  it('publishes normalized Kline events and ignores older updates for the same pair and interval', () => {
    const emit = jest.fn();
    const gateway = new MarketGateway(
      { isAvailable: jest.fn().mockReturnValue(true) } as any,
      { getPrices: jest.fn() } as any,
    );
    (gateway as any).server = { emit };
    const event = (sequence: number) => ({
      version: 'v1', event: 'market_kline', symbol: 'BTCUSDT', interval: '1m', sequence,
      openTime: 1_000, closeTime: 60_999, open: '10', high: '12', low: '9', close: '11', volume: null,
      provider: 'fixture', source: 'websocket:kline', observedAt: new Date(sequence * 1_000).toISOString(), receivedAt: new Date(sequence * 1_000).toISOString(),
    });

    (gateway as any).broadcastMarketKline(event(2));
    (gateway as any).broadcastMarketKline(event(1));

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('market_kline', expect.objectContaining({ sequence: 2 }));
  });
  it('subscribes to Valkey market channels and forwards quote events to Socket.IO clients', async () => {
    let onMessage: ((channel: string, message: string) => void) | undefined;
    const subscriber = {
      subscribe: jest.fn().mockResolvedValue(3),
      on: jest.fn((event: string, handler: (channel: string, message: string) => void) => {
        if (event === 'message') onMessage = handler;
      }),
    };
    const redis: any = {
      createSubscriber: jest.fn().mockResolvedValue(subscriber),
      releaseSubscriber: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockReturnValue(true),
    };
    const gateway = new MarketGateway(redis, { getPrices: jest.fn() } as any);
    const emit = jest.fn();
    (gateway as any).server = { emit };

    await gateway.onModuleInit();
    expect(subscriber.subscribe).toHaveBeenCalledWith('market:quotes:v1', 'market:klines:v1', 'market:reference:v1');
    expect(onMessage).toBeDefined();
    onMessage!('market:quotes:v1', JSON.stringify({
      version: 'v1', event: 'market.quote', sequence: '9',
      quote: { symbol: 'BTCUSDT', price: '10', change24h: null, volume24h: null, high24h: null, low24h: null, state: 'LIVE', provider: 'fixture', source: 'redis', observedAt: new Date().toISOString(), receivedAt: new Date().toISOString() },
    }));
    expect(emit).toHaveBeenCalledWith('market_tick', expect.objectContaining({ symbol: 'BTCUSDT', sequence: '9' }));
    await gateway.onModuleDestroy();
    expect(redis.releaseSubscriber).toHaveBeenCalledWith(subscriber);
  });

});
