import { RedisIoAdapter } from '../../src/prisma/redis-io.adapter';
import { Server } from 'socket.io';

describe('RedisIoAdapter shutdown', () => {
  it('keeps no-argument close available for lifecycle cleanup', async () => {
    const adapter = new RedisIoAdapter({});
    const redisClient = {
      status: 'ready',
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
    };
    (adapter as any).redisClient = redisClient;

    await adapter.close();

    expect(redisClient.quit).toHaveBeenCalledTimes(1);
    expect(redisClient.disconnect).toHaveBeenCalledTimes(1);
  });

  it('closes Socket.IO servers before disposing the Redis client', async () => {
    const adapter = new RedisIoAdapter({});
    const redisClient = {
      status: 'ready',
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
    };
    (adapter as any).redisClient = redisClient;
    const socketServer = {
      close: jest.fn((callback: (error?: Error) => void) => callback()),
    } as unknown as Server;

    await adapter.close(socketServer);

    expect(socketServer.close).toHaveBeenCalledTimes(1);
    expect(redisClient.quit).not.toHaveBeenCalled();

    await adapter.dispose();

    expect(redisClient.quit).toHaveBeenCalledTimes(1);
    expect(redisClient.disconnect).toHaveBeenCalledTimes(1);
  });
});
