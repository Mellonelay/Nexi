import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { BinaryGateway } from '../binary/binary.gateway';
import { MARKET_TICKS_CHANNEL } from './market.types';
import { Redis } from 'ioredis';

@Injectable()
export class MarketSubscriberService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketSubscriberService.name);
  private subscriber?: Redis;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(
    private readonly redisService: RedisService,
    private readonly binaryGateway: BinaryGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('📡 Initializing Shadow Proxy: Subscribing to Redis Ticks...');
    try {
      this.subscriber = await this.redisService.createSubscriber();

      const count = await this.subscriber.subscribe(MARKET_TICKS_CHANNEL);
      this.logger.log(`Subscribed to ${MARKET_TICKS_CHANNEL}. Count: ${count}`);
    } catch {
      this.subscriber = undefined;
      this.logger.warn('Redis ticks subscription deferred; readiness remains false until Redis is available.');
      return;
    }

    this.subscriber.on('messageBuffer', (channel: Buffer, message: Buffer) => {
      if (channel.toString() === MARKET_TICKS_CHANNEL) {
        // BROADCAST: Send raw 60-byte binary buffer to all connected clients
        this.binaryGateway.server.emit('market_tick_binary', message);
      }
    });

    // HEARTBEAT PULSE: 1Hz check to verify socket connectivity
    this.heartbeatTimer = setInterval(() => {
        if (!this.redisService.isAvailable()) {
          return;
        }
        this.binaryGateway.server?.emit('nexi_heartbeat', { status: 'ALIVE', time: Date.now() });
    }, 1000);
  }

  async onModuleDestroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    if (this.subscriber) {
      await this.redisService.releaseSubscriber(this.subscriber);
      this.subscriber = undefined;
      this.logger.log('Shadow Proxy: unsubscribed from Redis.');
    }
  }
}
