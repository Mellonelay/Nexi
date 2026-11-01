import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiProperty, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { MarketAuthorityService } from "./market/market-authority.service";
import { ReadinessService } from "./observability/readiness.service";
import { D1PrismaService } from "./d1/d1-prisma.service";
import { normalizePublicBanners, normalizePublicRouteSettings, normalizePublicSupportContacts, normalizePublicNavigation, normalizePublicQuotesCategories, normalizePublicLocalization } from "./admin/public-ui-config";

class PublicSupportContactsResponseDto {
  @ApiProperty({ type: String, nullable: true, format: "uri", description: "Configured trusted Telegram support URL, or null when disabled." })
  telegramUrl!: string | null;

  @ApiProperty({ type: String, nullable: true, format: "email", description: "Configured support email address, or null when disabled." })
  email!: string | null;
}

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
  @ApiServiceUnavailableResponse({ description: "Market data provider is unavailable; this legacy proxy currently has no configured provider." })
  async getMarketData(@Query("symbol") symbol: string) {
    return this.appService.fetchMarketData(symbol);
  }

  // Bulk prices endpoint for frontend hook
  @Get("market/prices")
  async getAllPrices() {
    return this.marketAuthority ? await this.marketAuthority.getPrices() : [];
  }

  @Get("health")
  @ApiOkResponse({ schema: { type: "object", required: ["status", "timestamp", "service"], properties: { status: { type: "string", enum: ["ok"] }, timestamp: { type: "string", format: "date-time" }, service: { type: "string", enum: ["Dexi Trading Platform"] } } } })
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Dexi Trading Platform",
    };
  }

  @Get("public/config/navigation")
  @ApiOkResponse({
    description: "Configured Public navigation items, or null when no configuration is available.",
    schema: {
      type: "array",
      nullable: true,
      items: {
        type: "object",
        required: ["id", "surface", "target", "audience", "visible", "order"],
        properties: {
          id: { type: "string" },
          surface: { type: "string", enum: ["bottom", "drawer"] },
          target: {
            type: "string",
            enum: [
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
            ],
          },
          audience: { type: "string", enum: ["public", "authenticated"] },
          visible: { type: "boolean" },
          order: { type: "integer" },
        },
      },
    },
  })
  async getPublicNavigation() {
    const row = await this.prisma?.systemConfig.findUnique({
      where: { key: "admin.navigation.items" },
      select: { value: true },
    });
    return normalizePublicNavigation(row);
  }

  @Get("public/config/routes")
  async getPublicRouteSettings() {
    const row = await this.prisma?.systemConfig.findUnique({
      where: { key: "admin.frontend.routes" },
      select: { value: true },
    });
    let value: unknown;
    try {
      value = row ? JSON.parse(row.value) : null;
    } catch {
      value = null;
    }
    return normalizePublicRouteSettings(value);
  }

  @Get("public/config/banners")
  @ApiOkResponse({
    description: "Active Public banners; an empty array is returned when none are available.",
    schema: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "message", "severity", "scope", "active"],
        properties: {
          id: { type: "string" },
          message: { type: "string" },
          severity: { type: "string", enum: ["info", "warning", "critical"] },
          scope: { type: "string", enum: ["global", "spot", "binary", "wallets"] },
          active: { type: "boolean", enum: [true] },
        },
      },
    },
  })
  async getPublicBanners() {
    const row = await this.prisma?.systemConfig.findUnique({
      where: { key: "admin.frontend.banners" },
      select: { value: true },
    });
    let value: unknown;
    try {
      value = row ? JSON.parse(row.value) : null;
    } catch {
      value = null;
    }
    return normalizePublicBanners(value);
  }

  @Get("public/config/support")
  @ApiOkResponse({ type: PublicSupportContactsResponseDto })
  async getPublicSupportContacts() {
    const row = await this.prisma?.systemConfig.findUnique({
      where: { key: "admin.frontend.supportEntryPoints" },
      select: { value: true },
    });
    let value: unknown;
    try {
      value = row ? JSON.parse(row.value) : null;
    } catch {
      value = null;
    }
    return normalizePublicSupportContacts(value);
  }

  @Get("public/config/quotes-categories")
  @ApiOkResponse({
    description: "Visible, allowlisted quote categories in display order.",
    schema: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "visible", "order"],
        properties: {
          id: { type: "string", enum: ["Crypto", "Metals", "Forex", "Stocks"] },
          visible: { type: "boolean", enum: [true] },
          order: { type: "integer", minimum: 0, maximum: 1000 },
        },
      },
    },
  })
  async getPublicQuotesCategories() {
    const row = await this.prisma?.systemConfig.findUnique({
      where: { key: "admin.frontend.quoteCategories" },
      select: { value: true },
    });
    return normalizePublicQuotesCategories(row);
  }

  @Get("public/config/localization")
  @ApiOkResponse({
    description: "Public UI message overrides; an empty array is returned when none are configured.",
    schema: {
      type: "array",
      items: {
        type: "object",
        required: ["key", "values"],
        properties: {
          key: { type: "string" },
          values: { type: "object", additionalProperties: { type: "string" } },
        },
      },
    },
  })
  async getPublicLocalization() {
    const row = await this.prisma?.systemConfig.findUnique({
      where: { key: "admin.localization.translations" },
      select: { value: true },
    });
    return normalizePublicLocalization(row);
  }

  @Get("healthz")
  @ApiOkResponse({ schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["UP"] } } } })
  getLiveness() {
    return { status: "UP" };
  }

  @Get("readyz")
  @ApiOkResponse({ description: "Application readiness with database and Redis dependency state.", schema: { type: "object", required: ["status", "dependencies"], properties: { status: { type: "string", enum: ["READY"] }, dependencies: { type: "object", required: ["database", "redis", "authority"], properties: { database: { type: "boolean" }, redis: { type: "boolean" }, authority: { type: "string", enum: ["SQLite", "D1"] } } } } } })
  async getReadiness() {
    return this.readinessService.getApplicationReadiness();
  }
}
