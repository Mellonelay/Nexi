import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import { Redis } from 'ioredis';
import { resolveRuntimeConfig } from '../runtime/runtime.config';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;
  private redisClient?: Redis;

  connectToRedis(): void {
    const { redisUrl } = resolveRuntimeConfig();
    const options = {
      lazyConnect: true,
      connectTimeout: 15_000,
      maxRetriesPerRequest: null,
      retryStrategy: (attempt: number) => Math.min(attempt * 100, 2_000),
    };
    const redisClient = new Redis(redisUrl, options);
    redisClient.on('error', () => undefined);

    this.adapterConstructor = createAdapter(redisClient, {
      streamName: 'nexi:socket.io',
      channelPrefix: 'nexi:socket.io',
      maxLen: 10_000,
      readCount: 100,
      blockTimeInMs: 5_000,
      sessionKeyPrefix: 'nexi:socket.io:session:',
      onlyPlaintext: true,
    });
    this.redisClient = redisClient;
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      connectionStateRecovery: options?.connectionStateRecovery ?? {
        maxDisconnectionDuration: 120_000,
        skipMiddlewares: false,
      },
    });
    if (!this.adapterConstructor) {
      throw new Error('Socket.IO Redis adapter is not connected');
    }
    server.adapter(this.adapterConstructor);
    return server;
  }

  async close(): Promise<void> {
    await this.closeClient(this.redisClient);
    this.redisClient = undefined;
  }

  private async closeClient(client?: Redis): Promise<void> {
    if (!client || client.status === 'end') {
      return;
    }
    try {
      await Promise.race([
        client.quit(),
        new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
      ]);
    } catch {
      // Force-disconnect below handles incomplete TLS shutdowns.
    }
    client.disconnect();
  }
}
