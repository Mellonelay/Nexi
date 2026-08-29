import { SpotGateway } from '../../src/spot/spot.gateway';

describe('SpotGateway', () => {
  it('scopes order-book updates to a normalized pair room with monotonic sequences', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const gateway = new SpotGateway();
    (gateway as any).server = { to };

    gateway.emitOrderBookUpdate('BTC/USDT', { pair: 'BTCUSDT', bids: [], asks: [] });
    gateway.emitOrderBookUpdate('BTCUSDT', { pair: 'BTCUSDT', bids: [], asks: [] });

    expect(to).toHaveBeenCalledWith('spot:pair:BTCUSDT');
    expect(emit).toHaveBeenNthCalledWith(1, 'spot.orderbook', expect.objectContaining({
      version: 'v1', event: 'spot.orderbook', pair: 'BTCUSDT', sequence: '1',
    }));
    expect(emit).toHaveBeenNthCalledWith(2, 'spot.orderbook', expect.objectContaining({ sequence: '2' }));
  });

  it('accepts only normalized pair subscriptions and replaces the prior pair room', () => {
    const handlers: Record<string, (...args: any[]) => void> = {};
    const join = jest.fn();
    const leave = jest.fn();
    const client = {
      id: 'client-1',
      rooms: new Set(['client-1', 'spot:pair:ETHUSDT']),
      on: jest.fn((event: string, handler: (...args: any[]) => void) => { handlers[event] = handler; }),
      join,
      leave,
    };
    const gateway = new SpotGateway();
    gateway.handleConnection(client as any);
    const acknowledge = jest.fn();

    handlers['spot.subscribe']({ pair: 'BTC/USDT' }, acknowledge);

    expect(leave).toHaveBeenCalledWith('spot:pair:ETHUSDT');
    expect(join).toHaveBeenCalledWith('spot:pair:BTCUSDT');
    expect(acknowledge).toHaveBeenCalledWith({ version: 'v1', state: 'LIVE', pair: 'BTCUSDT' });
  });
});
