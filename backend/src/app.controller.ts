import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiProperty, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { MarketAuthorityService } from "./market/market-authority.service";
import { ReadinessService } from "./observability/readiness.service";
import { D1PrismaService } from "./d1/d1-prisma.service";
import { normalizePublicBanners, normalizePublicRouteSettings, normalizePublicSupportContacts } from "./admin/public-ui-config";

class PublicSupportContactsResponseDto {
  @ApiProperty({ type: String, nullable: true, format: "uri", description: "Configured trusted Telegram support URL, or null when disabled." })
  telegramUrl!: string | null;

  @ApiProperty({ type: String, nullable: true, format: "email", description: "Configured support email address, or null when disabled." })
  email!: string | null;
}

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

const PUBLIC_QUOTES_CATEGORY_DEFAULTS = [
  { id: "Crypto", visible: true, order: 1 },
  { id: "Metals", visible: true, order: 2 },
  { id: "Forex", visible: true, order: 3 },
  { id: "Stocks", visible: true, order: 4 },
];
const PUBLIC_QUOTES_CATEGORIES = new Set(
  PUBLIC_QUOTES_CATEGORY_DEFAULTS.map((category) => category.id),
);
const PUBLIC_LOCALES = new Set(["en", "zh-CN", "ko", "ru", "es", "ms"]);
const PUBLIC_UI_MESSAGE_KEYS = new Set([
  "dashboard", "spot", "options", "wallet", "earn", "quotesHub", "marketDiscovery",
  "discoveryDescription", "activePair", "marketDataUnavailable", "filter", "openQuotesHub",
  "signIn", "createAccount", "exploreOpportunities", "loadingMarketCatalog",
  "noInstrumentsAvailable", "asset", "lastPrice", "change24h", "volume24h", "primary",
  "communicationContent", "accountSystem", "spotTrading", "optionsBinary", "earnMining", "loan",
  "messages", "announcements", "learn", "support", "settings", "language", "logout",
  "guestAccount", "connectUnlock", "tradingWorkspace", "openApplicationMenu",
  "closeApplicationMenu", "backToApplicationMenu", "languageSelection", "notifications",
  "searchMarkets", "profile", "score", "vipLevel", "userStatus", "loadingAccount",
  "accountUnavailable",
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
    let value: unknown;
    try {
      value = row ? JSON.parse(row.value) : null;
    } catch {
      value = null;
    }
    if (!Array.isArray(value)) return PUBLIC_QUOTES_CATEGORY_DEFAULTS;

    const categories = new Map<string, { id: string; visible: boolean; order: number }>();
    for (const entry of value) {
      if (typeof entry !== "object" || entry === null) continue;
      const item = entry as Record<string, unknown>;
      if (
        typeof item.id === "string" &&
        PUBLIC_QUOTES_CATEGORIES.has(item.id) &&
        typeof item.visible === "boolean" &&
        typeof item.order === "number" &&
        Number.isSafeInteger(item.order) &&
        item.order >= 0 &&
        item.order <= 1000
      ) {
        categories.set(item.id, { id: item.id, visible: item.visible, order: item.order });
      }
    }
    const visible = [...categories.values()]
      .filter((item) => item.visible)
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
    return visible.length > 0 ? visible : PUBLIC_QUOTES_CATEGORY_DEFAULTS;
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
    if (!row) return [];
    try {
      const value: unknown = JSON.parse(row.value);
      if (!Array.isArray(value)) return [];
      const translations = new Map<
        string,
        { key: string; values: Record<string, string> }
      >();
      for (const entry of value) {
        if (typeof entry !== "object" || entry === null) continue;
        const item = entry as Record<string, unknown>;
        if (typeof item.key !== "string" || !PUBLIC_UI_MESSAGE_KEYS.has(item.key)) continue;
        if (typeof item.values !== "object" || item.values === null || Array.isArray(item.values))
          continue;
        const values = Object.fromEntries(
          Object.entries(item.values as Record<string, unknown>).filter(
            ([locale, text]) =>
              PUBLIC_LOCALES.has(locale) && typeof text === "string" && text.trim().length > 0,
          ),
        ) as Record<string, string>;
        if (Object.keys(values).length > 0) translations.set(item.key, { key: item.key, values });
      }
      return [...translations.values()];
    } catch {
      return [];
    }
  }

  @Get("healthz")
  @ApiOkResponse({ schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["UP"] } } } })
  getLiveness() {
    return { status: "UP" };
  }

  @Get("readyz")
  async getReadiness() {
    return this.readinessService.getApplicationReadiness();
  }
}
