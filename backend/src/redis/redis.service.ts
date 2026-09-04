import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { resolveRuntimeConfig } from '../runtime/runtime.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client?: Redis;
  private clientReady = false;
  private readonly subscribers = new Set<Redis>();
  private readonly logger = new Logger(RedisService.name);

  onModuleInit(): void {
    this.client = this.createClient();
    void this.client.connect().then(() => this.client?.ping()).then(() => {
      this.clientReady = true;
      this.logger.log('Connected to Redis');
    }).catch(() => {
      this.clientReady = false;
      this.logger.warn('Redis startup is pending; readiness remains false until the client reconnects.');
    });
  }

  async onModuleDestroy() {
    this.clientReady = false;
    await Promise.allSettled([
      ...[this.client].filter((client): client is Redis => Boolean(client)).map((client) => this.closeClient(client)),
      ...[...this.subscribers].map((client) => this.closeClient(client)),
    ]);
    this.subscribers.clear();
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }
    return this.client;
  }

  async createSubscriber(): Promise<Redis> {
    const subscriber = this.createClient();
    this.subscribers.add(subscriber);
    try {
      await subscriber.connect();
      return subscriber;
    } catch (error) {
      this.subscribers.delete(subscriber);
      subscriber.disconnect();
      throw error;
    }
  }

  async releaseSubscriber(subscriber: Redis): Promise<void> {
    this.subscribers.delete(subscriber);
    await this.closeClient(subscriber);
  }

  isAvailable(): boolean {
    return this.clientReady && this.client?.status === 'ready';
  }

  async publish(channel: string, message: string | Buffer) {
    return this.getClient().publish(channel, message as any);
  }

  async get(key: string) {
    return this.getClient().get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.getClient().set(key, value, 'EX', ttl);
    }
    return this.getClient().set(key, value);
  }

  async tryAcquireLock(key: string, owner: string, ttlSeconds: number): Promise<boolean> {
    if (!this.isAvailable() || !key || !owner || !Number.isInteger(ttlSeconds) || ttlSeconds <= 0) return false;
    return (await this.getClient().set(key, owner, 'EX', ttlSeconds, 'NX')) === 'OK';
  }

  async releaseLock(key: string, owner: string): Promise<void> {
    if (!this.isAvailable() || !key || !owner) return;
    await this.getClient().eval(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
      1,
      key,
      owner,
    );
  }

  async incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
    if (!key || !Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('Redis rate-limit key and TTL are invalid');
    }

    const result = await this.getClient().eval(
      `local current = redis.call('INCR', KEYS[1])
       if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
       return current`,
      1,
      key,
      ttlSeconds,
    );
    const count = Number(result);
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new Error('Redis rate-limit counter response is invalid');
    }
    return count;
  }

  async isReady(): Promise<boolean> {
    const client = this.client;
    if (!this.isAvailable() || !client) {
      return false;
    }

    try {
      return (await client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }

  private createClient(): Redis {
    const { redisUrl } = resolveRuntimeConfig();
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 15_000,
      // Long-lived readiness/subscriber clients must survive transient TLS
      // reconnects without flushing queued commands and crashing NestJS.
      maxRetriesPerRequest: null,
      retryStrategy: (attempt) => Math.min(attempt * 100, 2_000),
    });
    client.on('ready', () => {
      if (client === this.client) {
        this.clientReady = true;
      }
    });
    client.on('end', () => {
      if (client === this.client) {
        this.clientReady = false;
      }
    });
    client.on('error', () => {
      if (client === this.client) {
        this.clientReady = false;
      }
      this.logger.error('Redis client error');
    });
    return client;
  }

  private async closeClient(client: Redis): Promise<void> {
    if (client.status === 'end') {
      return;
    }
    try {
      await Promise.race([
        client.quit(),
        new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
      ]);
    } catch {
      // The hard disconnect below is still required for TLS sockets that do
      // not complete a graceful QUIT handshake during container shutdown.
    }
    client.disconnect();
  }
}
