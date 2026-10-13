import { RuntimeLifecycleService } from '../../src/runtime/runtime-lifecycle.service';

describe('RuntimeLifecycleService', () => {
  it('closes the Socket.IO adapter after Nest disposes the transport', async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const lifecycle = new RuntimeLifecycleService();
    lifecycle.registerSocketAdapter({ close });

    await lifecycle.beforeApplicationShutdown();
    expect(close).not.toHaveBeenCalled();

    await lifecycle.onApplicationShutdown();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
