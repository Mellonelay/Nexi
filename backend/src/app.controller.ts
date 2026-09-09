import {
  Controller,
  Get,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { MarketAuthorityService } from "./market/market-authority.service";
import { ReadinessService } from './observability/readiness.service';

@ApiTags("Application")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly readinessService: ReadinessService,
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
    return this.readinessService.getApplicationReadiness();
  }
}
