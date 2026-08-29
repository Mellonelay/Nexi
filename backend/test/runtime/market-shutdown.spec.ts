import { MarketSubscriberService } from '../../src/market/market-subscriber.service';

describe('MarketSubscriberService shutdown', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('suppresses Socket.IO heartbeat broadcasts while Redis is unavailable', async () => {
    jest.useFakeTimers();
    const subscriber = {
      subscribe: jest.fn().mockResolvedValue(1),
      on: jest.fn(),
    } as any;
    const emit = jest.fn();
    const isAvailable = jest.fn().mockReturnValue(false);
    const releaseSubscriber = jest.fn().mockResolvedValue(undefined);
    const service = new MarketSubscriberService(
      { createSubscriber: jest.fn().mockResolvedValue(subscriber), releaseSubscriber, isAvailable } as any,
      { server: { emit } } as any,
    );

    await service.onModuleInit();
    jest.advanceTimersByTime(1000);
    expect(emit).not.toHaveBeenCalled();

    isAvailable.mockReturnValue(true);
    jest.advanceTimersByTime(1000);
    expect(emit).toHaveBeenCalledWith('nexi_heartbeat', expect.objectContaining({ status: 'ALIVE' }));

    await service.onModuleDestroy();
  });

  it('releases the Redis subscriber and clears the heartbeat timer', async () => {
    const subscriber = {} as any;
    const releaseSubscriber = jest.fn().mockResolvedValue(undefined);
    const service = new MarketSubscriberService(
      { createSubscriber: jest.fn(), releaseSubscriber } as any,
      { server: { emit: jest.fn() } } as any,
    );
    (service as any).subscriber = subscriber;
    (service as any).heartbeatTimer = setInterval(() => undefined, 60_000);

    await service.onModuleDestroy();

    expect(releaseSubscriber).toHaveBeenCalledWith(subscriber);
    expect((service as any).heartbeatTimer).toBeUndefined();
  });
});
