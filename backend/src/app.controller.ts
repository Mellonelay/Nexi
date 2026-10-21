import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { MarketAuthorityService } from "./market/market-authority.service";
import { ReadinessService } from "./observability/readiness.service";
import { D1PrismaService } from "./d1/d1-prisma.service";

const PUBLIC_NAVIGATION_TARGETS = new Set([
  "/dashboard",
  "/dashboard/spot",
  "/dashboard/binary",
  "/dashboard/wallet",
  "/dashboard/mining",
  "/dashboard/loans",
  "/dashboard/messages",
  "/dashboard/announcement",
  "/dashboard/learn",
  "/dashboard/support",
  "/dashboard/settings",
]);

@ApiTags("Application")
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly readinessService: ReadinessService,
    private readonly prisma: D1PrismaService,
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

  @Get("public/config/navigation")
  async getPublicNavigation() {
    const row = await this.prisma?.systemConfig.findUnique({
      where: { key: "admin.navigation.items" },
      select: { value: true },
    });
    if (!row) return null;
    try {
      const value: unknown = JSON.parse(row.value);
      if (!Array.isArray(value)) return [];
      return value.flatMap((entry: unknown) => {
        if (typeof entry !== "object" || entry === null) return [];
        const item = entry as Record<string, unknown>;
        if (
          typeof item.id !== "string" ||
          !PUBLIC_NAVIGATION_TARGETS.has(String(item.target)) ||
          (item.surface !== "bottom" && item.surface !== "drawer") ||
          !["public", "authenticated"].includes(
            String(item.audience),
          ) ||
          typeof item.visible !== "boolean" ||
          typeof item.order !== "number" ||
          !Number.isInteger(item.order)
        )
          return [];
        return [
          {
            id: item.id,
            surface: item.surface,
            target: item.target,
            audience: item.audience,
            visible: item.visible,
            order: item.order,
          },
        ];
      });
    } catch {
      return null;
    }
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
