import { RuntimeLifecycleService } from '../../src/runtime/runtime-lifecycle.service';

describe('RuntimeLifecycleService', () => {
  it('closes the registered Socket.IO adapter during application shutdown', async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const lifecycle = new RuntimeLifecycleService();
    lifecycle.registerSocketAdapter({ close });

    await lifecycle.beforeApplicationShutdown();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
