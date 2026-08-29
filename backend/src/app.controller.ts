import {
  Controller,
  Get,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { PrismaService } from "./prisma/prisma.service";
import { D1PrismaService } from "./d1/d1-prisma.service";
import { RedisService } from "./redis/redis.service";
import { MarketAuthorityService } from "./market/market-authority.service";

@ApiTags("Application")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    private readonly d1PrismaService: D1PrismaService,
    private readonly redisService: RedisService,
    private readonly marketAuthority?: MarketAuthorityService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Proxy for external market data (e.g. Yahoo Finance)
  // Usage: /market/proxy?symbol=AAPL
  @Get("market/proxy")
  async getMarketData(@Query("symbol") symbol: string) {
    return this.appService.fetchMarketData(symbol);
  }

  // Bulk prices endpoint for frontend hook
  @Get("market/prices")
  async getAllPrices() {
    return this.marketAuthority?.getPrices() ?? [];
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Dexi Trading Platform",
    };
  }

  @Get("healthz")
  getLiveness() {
    return { status: "UP" };
  }

  @Get("readyz")
  async getReadiness() {
    const d1Enabled = process.env.D1_RUNTIME_ENABLED === "true";
    const [database, redis] = await Promise.all([
      d1Enabled ? this.d1PrismaService.isReady() : this.prismaService.isReady(),
      this.redisService.isReady(),
    ]);

    if (!database || !redis) {
      throw new ServiceUnavailableException({
        status: "NOT_READY",
        dependencies: {
          database,
          redis,
          authority: d1Enabled ? "D1" : "PostgreSQL",
        },
      });
    }

    return {
      status: "READY",
      dependencies: {
        database,
        redis,
        authority: d1Enabled ? "D1" : "PostgreSQL",
      },
    };
  }
}
