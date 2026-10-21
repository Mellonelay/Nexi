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

  @Get("public/config/quotes-categories")
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
  getLiveness() {
    return { status: "UP" };
  }

  @Get("readyz")
  async getReadiness() {
    return this.readinessService.getApplicationReadiness();
  }
}
