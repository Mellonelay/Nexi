import type {
  AdminDataProvider,
  AdminIdentity,
  ConsequentialContext,
  MutationResult,
} from "./provider";
import type {
  Asset,
  AdminUser,
  ApprovalRequest,
  BinaryPair,
  AuditEvent,
  FeatureFlag,
  HealthCheck,
  IncidentMessage,
  KycReview,
  LedgerEntry,
  MarketFeed,
  MarketProviderRuntime,
  MaintenanceScope,
  MaintenanceWindow,
  Network,
  Permission,
  RoleId,
  Session,
  SpotOrder,
  SpotPair,
  BinaryPosition,
  Deposit,
  WalletRow,
  Withdrawal,
  User,
  SupportTicket,
  SettlementRecord,
  Announcement,
  AssetCategory,
  MiningPlan,
  LoanPlan,
  MiningSubscriptionAdmin,
  LoanApplicationAdmin,
  AdminMessage,
  AdminNotification,
  AdminLearnArticle,
  ExposureRow,
  Locale,
  NavItem,
  NavSurface,
  PublicBanner,
  PublicRoute,
  PublicRouteState,
  QuotesCategory,
  SupportEntryPoint,
  TranslationKey,
} from "../types";

type ApiConfig = { baseUrl: string; getToken: () => Promise<string> };
type JsonRecord = Record<string, unknown>;

const UNSUPPORTED_OPERATIONS = new Set<keyof AdminDataProvider>([
  "setUserStatus",
  "updateUserEntitlements",
  "updateUserRestrictions",
  "setUserSandbox",
  "assignKycReviewer",
  "updateKycNotes",
  "updateAsset",
  "reorderAssets",
  "failoverFeed",
  "updateSpotPair",
  "correctSettlement",
  "listReconciliation",
  "assignReconciliationOwner",
  "setReconciliationStatus",
  "addReconciliationNote",
  "setAdminStatus",
  "updateRolePermission",
]);

function boundedIdempotencyKey(prefix: string, values: string[]): string {
  const input = values.join(":");
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}:${Math.abs(hash >>> 0).toString(36)}`.slice(0, 128);
}

export class NexiAdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NexiAdminApiError";
  }
}

const ROLE_IDS = new Set<RoleId>([
  "readonly_operator",
  "support_agent",
  "kyc_reviewer",
  "finance_operator",
  "market_operator",
  "content_manager",
  "security_auditor",
  "sandbox_operator",
  "super_admin",
]);
const PERMISSIONS = new Set<Permission>([
  "overview.view",
  "users.view",
  "users.restrict",
  "users.entitlements",
  "kyc.view",
  "kyc.decide",
  "sessions.view",
  "sessions.revoke",
  "frontend.view",
  "frontend.edit",
  "navigation.view",
  "navigation.edit",
  "localization.view",
  "localization.edit",
  "flags.view",
  "flags.edit",
  "assets.view",
  "assets.edit",
  "networks.view",
  "networks.edit",
  "feeds.view",
  "feeds.edit",
  "spot.view",
  "spot.edit",
  "spot.pause",
  "spot.cancel_order",
  "binary.view",
  "binary.edit",
  "binary.settle",
  "settlements.view",
  "exposure.view",
  "wallets.view",
  "ledger.view",
  "deposits.view",
  "deposits.confirm",
  "withdrawals.view",
  "withdrawals.approve",
  "reconciliation.view",
  "reconciliation.resolve",
  "mining.view",
  "mining.edit",
  "loans.view",
  "loans.edit",
  "support.view",
  "support.reply",
  "messages.view",
  "announcements.view",
  "announcements.publish",
  "learn.view",
  "learn.publish",
  "notifications.view",
  "notifications.send",
  "admins.view",
  "admins.edit",
  "roles.view",
  "roles.edit",
  "approvals.view",
  "approvals.decide",
  "audit.view",
  "health.view",
  "health.acknowledge",
  "maintenance.view",
  "maintenance.edit",
  "sandbox.view",
  "sandbox.force",
]);

function record(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" ? (value as JsonRecord) : {};
}
function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
function role(value: unknown): RoleId | "unassigned" {
  const candidate = stringValue(value);
  return ROLE_IDS.has(candidate as RoleId) ? (candidate as RoleId) : "unassigned";
}
function permission(value: unknown): Permission | undefined {
  const candidate = stringValue(value);
  return PERMISSIONS.has(candidate as Permission) ? (candidate as Permission) : undefined;
}
function scope(commandType: string): ApprovalRequest["scope"] {
  const value = commandType.toLowerCase();
  if (value.includes("sandbox")) return "sandbox";
  if (value.includes("finance") || value.includes("withdraw") || value.includes("deposit"))
    return "finance";
  if (value.includes("market") || value.includes("spot") || value.includes("binary"))
    return "markets";
  if (value.includes("identity") || value.includes("user")) return "identity";
  return "governance";
}

/**
 * NexiAdminApiProvider
 * -----------------------------------
 * Explicit live adapter for the currently published Admin identity, role,
 * approval, and audit contracts. It is intentionally not the default provider.
 *
 * Contract for the eventual implementation:
 *   - Accept a base URL + bearer token acquired via NEXI Admin SSO.
 *   - Implement every AdminDataProvider method using typed fetch calls.
 *   - Translate NEXI API errors into typed domain errors.
 *   - Preserve the consequential-action envelope (actor/role/env/reason,
 *     before/after snapshots, correlation id) by returning the same
 *     MutationResult shape and letting the server append the real audit event.
 *
 * Methods without a canonical backend authority fail explicitly with
 * NexiAdminApiError(501); they never fall back to mock data or return
 * success-shaped placeholders.
 */
export class NexiAdminApiProvider implements AdminDataProvider {
  constructor(private readonly config: ApiConfig) {}

  supports(operation: keyof AdminDataProvider): boolean {
    return !UNSUPPORTED_OPERATIONS.has(operation);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.config.getToken();
    if (!token.trim()) throw new NexiAdminApiError(401, "Admin session token is unavailable");
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await response.text();
    let payload: unknown = undefined;
    try {
      payload = body ? JSON.parse(body) : undefined;
    } catch {
      payload = undefined;
    }
    if (!response.ok) {
      const detail = record(payload).message;
      throw new NexiAdminApiError(
        response.status,
        typeof detail === "string" ? detail : `Admin API request failed (${response.status})`,
      );
    }
    return payload as T;
  }

  private async requestMutation(
    path: string,
    ctx: ConsequentialContext,
    payload: JsonRecord = {},
    keyValues: string[] = [],
    method: "POST" | "PATCH" = "POST",
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>(path, {
      method,
      body: JSON.stringify({
        ...payload,
        reason: ctx.reason,
        idempotencyKey: boundedIdempotencyKey("admin", [path, ctx.actor, ctx.reason, ...keyValues]),
      }),
    });
    return { ok: result.ok !== false, auditId: stringValue(result.auditId ?? result.id) };
  }

  private async getSystemConfigMap(): Promise<Record<string, string>> {
    const payload = await this.request<{ config?: Record<string, unknown> }>("/admin/system-config");
    const config = record(payload.config);
    return Object.fromEntries(
      Object.entries(config).flatMap(([key, value]) =>
        typeof value === "string" ? [[key, value] as const] : [],
      ),
    );
  }

  private async readJsonConfig<T>(key: string, fallback: T): Promise<T> {
    const config = await this.getSystemConfigMap();
    const raw = config[key];
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new NexiAdminApiError(502, `Invalid JSON stored for system config ${key}`);
    }
  }

  private async writeJsonConfig<T>(
    key: string,
    value: T,
    description: string,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>("/admin/system-config", {
      method: "POST",
      body: JSON.stringify({ key, value: JSON.stringify(value), description, reason: ctx.reason }),
    });
    return { ok: true, auditId: stringValue(result.auditId ?? result.id) };
  }

  async login(email: string, password: string) {
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/admin/auth/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.text();
    let payload: unknown = undefined;
    try { payload = body ? JSON.parse(body) : undefined; } catch { payload = undefined; }
    if (!response.ok) {
      const detail = record(payload).message;
      throw new NexiAdminApiError(
        response.status,
        typeof detail === "string" ? detail : `Admin login failed (${response.status})`,
      );
    }
    return payload as { access_token: string; refresh_token?: string; user: JsonRecord };
  }
  async getAdminIdentity(): Promise<AdminIdentity> {
    const row = await this.request<JsonRecord>("/admin/me");
    const identityRole = row.roleId === null ? null : role(row.roleId);
    return {
      id: stringValue(row.id),
      email: stringValue(row.email),
      roleId: identityRole === "unassigned" ? null : identityRole,
      roleLabel: typeof row.roleLabel === "string" ? row.roleLabel : null,
      effectivePermissions: Array.isArray(row.effectivePermissions)
        ? row.effectivePermissions.map(permission).filter((p): p is Permission => !!p)
        : [],
      roleMappingStatus: stringValue(
        row.roleMappingStatus,
        "UNASSIGNED_ADMIN_REQUIRES_ROLE_ASSIGNMENT",
      ),
    };
  }

  private unsupportedAuthority(method: string, detail: string): never {
    throw new NexiAdminApiError(501, `${method} is intentionally unavailable: ${detail}`);
  }

  async applySandboxOverride(
    payload: Parameters<AdminDataProvider["applySandboxOverride"]>[0],
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>("/admin/sandbox/controls", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        reason: ctx.reason,
        idempotencyKey: boundedIdempotencyKey("sandbox", [
          ctx.actor,
          payload.scope,
          payload.target,
          payload.mode,
          payload.seed ?? "",
          payload.expiresAt ?? "",
        ]),
      }),
    });
    return { ok: result.ok !== false, auditId: stringValue(result.auditId ?? result.id) };
  }

  async executeSandboxCommand(
    commandId: string,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>(
      `/admin/sandbox/controls/${encodeURIComponent(commandId)}/execute`,
      { method: "POST" },
    );
    return { ok: result.ok !== false, auditId: stringValue(result.auditId ?? result.id) };
  }

  private mapUser(value: unknown): User {
    const row = record(value);
    const profile = record(row.profile);
    const status = ["active", "restricted", "frozen", "closed"].includes(stringValue(row.status))
      ? (stringValue(row.status) as User["status"])
      : "active";
    return {
      id: stringValue(row.id),
      email: stringValue(row.email),
      displayName: stringValue(
        row.displayName,
        stringValue(profile.displayName, stringValue(row.email)),
      ),
      country: stringValue(row.country, stringValue(profile.country, "UNKNOWN")),
      status,
      kyc: ["unverified", "pending", "approved", "rejected", "more_info"].includes(
        stringValue(row.kycStatus),
      )
        ? (stringValue(row.kycStatus) as User["kyc"])
        : "unverified",
      tier: ["T0", "T1", "T2", "T3"].includes(stringValue(row.tier))
        ? (stringValue(row.tier) as User["tier"])
        : "T0",
      createdAt: stringValue(row.createdAt, new Date(0).toISOString()),
      lastLoginAt: stringValue(row.lastLoginAt, new Date(0).toISOString()),
      entitlements: {
        spot: row.spotEnabled !== false,
        binary: row.binaryEnabled !== false,
        mining: row.miningEnabled === true,
        loans: row.loansEnabled === true,
      },
      restrictions: Array.isArray(row.restrictions)
        ? row.restrictions.filter((v): v is string => typeof v === "string")
        : [],
      sandbox: row.sandbox === true,
    };
  }

  async listUsers(): Promise<User[]> {
    const rows = await this.request<unknown[]>("/admin/users");
    return rows.map((row) => this.mapUser(row));
  }
  async getUser(id: string): Promise<User | undefined> {
    return (await this.listUsers()).find((user) => user.id === id);
  }
  setUserStatus() {
    return this.unsupportedAuthority(
      "setUserStatus",
      "User has no canonical lifecycle-status field; use authentication/session governance instead",
    );
  }
  updateUserEntitlements() {
    return this.unsupportedAuthority(
      "updateUserEntitlements",
      "product entitlements are not represented by the canonical User authority",
    );
  }
  updateUserRestrictions() {
    return this.unsupportedAuthority(
      "updateUserRestrictions",
      "restriction state has no canonical persistence authority",
    );
  }
  setUserSandbox() {
    return this.unsupportedAuthority(
      "setUserSandbox",
      "sandbox is an action-scoped governance control, not a User flag",
    );
  }
  async listKyc(): Promise<KycReview[]> {
    const rows = await this.request<unknown[]>("/admin/kyc");
    return rows.map((value) => {
      const row = record(value);
      const documentType = stringValue(row.documentType);
      return {
        id: stringValue(row.id),
        userId: stringValue(row.userId),
        submittedAt: stringValue(row.createdAt, new Date(0).toISOString()),
        documentType:
          documentType === "passport" ||
          documentType === "id_card" ||
          documentType === "drivers_license"
            ? documentType
            : "id_card",
        country: stringValue(row.country, "UNKNOWN"),
        status: ["unverified", "pending", "approved", "rejected", "more_info"].includes(
          stringValue(row.status).toLowerCase(),
        )
          ? (stringValue(row.status).toLowerCase() as KycReview["status"])
          : "pending",
      };
    });
  }
  async decideKyc(
    id: string,
    decision: Parameters<AdminDataProvider["decideKyc"]>[1],
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>("/admin/kyc/decision", {
      method: "POST",
      body: JSON.stringify({
        id,
        decision,
        reason: ctx.reason,
        idempotencyKey: boundedIdempotencyKey("kyc", [id, decision, ctx.actor, ctx.reason]),
      }),
    });
    return { ok: result.ok !== false, auditId: stringValue(result.auditId ?? result.id) };
  }
  assignKycReviewer() {
    return this.unsupportedAuthority(
      "assignKycReviewer",
      "canonical KYC has no reviewer assignment field",
    );
  }
  updateKycNotes() {
    return this.unsupportedAuthority("updateKycNotes", "canonical KYC has no notes field");
  }
  async listSessions(): Promise<Session[]> {
    const rows = await this.request<unknown[]>("/admin/sessions");
    return rows.map((value) => {
      const row = record(value);
      return {
        id: stringValue(row.id),
        userId: stringValue(row.userId),
        ip: "REDACTED",
        device: typeof row.userAgentHash === "string" ? "Known device" : "Unknown device",
        location: "UNAVAILABLE",
        createdAt: stringValue(row.createdAt, new Date(0).toISOString()),
        lastSeenAt: stringValue(row.lastUsedAt, new Date(0).toISOString()),
        active: row.revokedAt === null || row.revokedAt === undefined,
      };
    });
  }
  async revokeSession(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/sessions/${encodeURIComponent(id)}/revoke`, ctx);
  }
  async revokeUserSessions(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/users/${encodeURIComponent(id)}/sessions/revoke`, ctx);
  }
  async listAssets(): Promise<Asset[]> {
    const rows = await this.request<unknown[]>("/admin/market/assets");
    return rows.map((value, index) => {
      const row = record(value);
      const symbol = stringValue(row.symbol);
      const capabilities = Array.isArray(row.capabilities) ? row.capabilities : [];
      const capability = (name: string) =>
        capabilities.some((item) => {
          const c = record(item);
          return stringValue(c.capabilityKey).endsWith(`:${name}`) && c.status === "ACTIVE";
        });
      const categoryValue = stringValue(row.category, "crypto");
      const category: AssetCategory = (
        ["crypto", "stablecoin", "fiat_proxy", "stock", "forex", "metal"] as const
      ).includes(categoryValue as AssetCategory)
        ? (categoryValue as AssetCategory)
        : "crypto";
      return {
        id: stringValue(row.id, symbol),
        symbol,
        name: stringValue(row.displayName, symbol),
        category,
        order: index,
        visible: stringValue(row.status) === "ACTIVE",
        spot: capability("market"),
        binary: capability("binary"),
        mining: capability("mining"),
        loans: capability("loans"),
      };
    });
  }
  async toggleAssetVisibility(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    const assets = await this.listAssets();
    const asset = assets.find((item) => item.id === id);
    if (!asset) throw new NexiAdminApiError(404, "Market asset not found");
    return this.requestMutation("/admin/market/assets/visibility", ctx, {
      id,
      visible: !asset.visible,
    });
  }
  async listNetworks() {
    const [networkRows, currencyRows] = await Promise.all([
      this.request<unknown[]>("/admin/market/networks"),
      this.request<unknown[]>("/admin/currencies"),
    ]);
    const currencies = currencyRows.map(record);
    return networkRows.map((value) => {
      const row = record(value);
      const asset = record(row.asset);
      const assetSymbol = stringValue(asset.symbol);
      const currency =
        currencies.find(
          (item) => stringValue(item.symbol).toUpperCase() === assetSymbol.toUpperCase(),
        ) ?? {};
      return {
        id: stringValue(row.id),
        name: stringValue(row.name),
        assetSymbol,
        chainId: stringValue(row.code),
        decimals: Number(currency.decimals ?? 0),
        explorer: "",
        minDeposit: stringValue(currency.minDeposit, "0"),
        maxDeposit: stringValue(currency.maxDeposit, "0"),
        minWithdrawal: stringValue(currency.minWithdrawal, "0"),
        maxWithdrawal: stringValue(currency.maxWithdrawal, "0"),
        withdrawalFee: stringValue(currency.withdrawalFee, "0"),
        confirmations: Number(currency.confirmationCount ?? 0),
        depositEnabled: currency.depositEnabled === true || currency.depositEnabled === 1,
        withdrawEnabled: currency.withdrawEnabled === true || currency.withdrawEnabled === 1,
        currencyId: Number(currency.id),
        depositAddresses: Array.isArray(currency.depositAddresses)
          ? currency.depositAddresses.map((item) => {
              const address = record(item);
              return {
                id: stringValue(address.id),
                network: stringValue(address.network),
                address: stringValue(address.address),
                label: typeof address.label === "string" ? address.label : undefined,
                isActive: address.isActive === true || address.isActive === 1,
              };
            })
          : [],
        enabled: stringValue(row.status) === "ACTIVE",
      };
    });
  }
  async addDepositAddress(
    currencyId: number,
    input: { network: string; address: string; label?: string },
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>(`/admin/currencies/${currencyId}/address`, {
      method: "POST",
      body: JSON.stringify({
        ...input,
        reason: ctx.reason,
        idempotencyKey: boundedIdempotencyKey("deposit-address", [
          String(currencyId),
          input.network,
          input.address,
          ctx.actor,
          ctx.reason,
        ]),
      }),
    });
    return { ok: result.ok !== false, auditId: stringValue(result.auditId ?? result.id) };
  }

  async disableDepositAddress(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/address/${encodeURIComponent(id)}/disable`, ctx, {}, [id]);
  }

  async toggleNetwork(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    const networks = await this.listNetworks();
    const network = networks.find((item) => item.id === id);
    if (!network) throw new NexiAdminApiError(404, "Market network not found");
    return this.requestMutation("/admin/market/networks/visibility", ctx, {
      id,
      enabled: !network.enabled,
    });
  }
  private marketFeedFromRow(providerRow: JsonRecord, symbolValue: unknown): MarketFeed {
    const symbol = record(symbolValue);
    const pair = record(symbol.pair);
    const latest = record(pair.latest);
    const provider = stringValue(providerRow.key);
    const active = stringValue(providerRow.status) === "ACTIVE" && symbol.enabled !== false;
    const observedAt = Date.parse(stringValue(latest.observedAt));
    const receivedAt = Date.parse(stringValue(latest.receivedAt));
    const latestState = stringValue(latest.state);
    const state: MarketFeed["status"] =
      latestState === "LIVE" || latestState === "STALE" ? latestState : "UNAVAILABLE";
    return {
      id: stringValue(symbol.id, stringValue(providerRow.id)),
      pair: stringValue(pair.symbol, "UNKNOWN"),
      provider,
      fallback: undefined,
      latencyMs:
        Number.isFinite(receivedAt) && Number.isFinite(observedAt)
          ? Math.max(0, receivedAt - observedAt)
          : 0,
      ageMs: Number.isFinite(observedAt) ? Math.max(0, Date.now() - observedAt) : 0,
      status: !active
        ? "DISABLED"
        : stringValue(latest.provider) !== provider
          ? "UNAVAILABLE"
          : state,
    };
  }

  listFeeds(): Promise<MarketFeed[]> {
    return this.request<unknown[]>("/admin/market/feeds").then((rows) =>
      rows.flatMap((value) => {
        const row = record(value);
        const symbols = Array.isArray(row.symbols) && row.symbols.length ? row.symbols : [null];
        return symbols.map((item) => this.marketFeedFromRow(row, item));
      }),
    );
  }
  getMarketRuntime(): Promise<MarketProviderRuntime[]> {
    return this.request<unknown[]>("/admin/market/runtime").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const capabilities = record(row.capabilities);
        return {
          key: stringValue(row.key),
          displayName: stringValue(row.displayName, stringValue(row.key)),
          status: stringValue(row.status, "UNKNOWN"),
          priority: Number(row.priority ?? 0),
          runtimeActive: row.runtimeActive === true,
          capabilities: {
            quotes: capabilities.quotes === true,
            klines: capabilities.klines === true,
            trades: capabilities.trades === true,
            depth: capabilities.depth === true,
          },
          symbols: Array.isArray(row.symbols)
            ? row.symbols.map((item) => {
                const symbol = record(item);
                return {
                  symbol: stringValue(symbol.symbol),
                  providerSymbol: stringValue(symbol.providerSymbol),
                };
              })
            : [],
        };
      }),
    );
  }
  async setFeedStatus(
    id: string,
    status: MarketFeed["status"],
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation("/admin/market/feeds/status", ctx, { id, status });
  }
  listSpotPairs(): Promise<SpotPair[]> {
    return this.request<unknown[]>("/admin/spot/pairs").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const base = record(row.baseAsset);
        const quote = record(row.quoteAsset);
        const ps = Array.isArray(row.providerSymbols) ? record(row.providerSymbols[0]) : {};
        const provider = record(ps.provider);
        return {
          id: stringValue(row.id),
          symbol: stringValue(row.symbol),
          base: stringValue(base.symbol),
          quote: stringValue(quote.symbol),
          enabled: stringValue(row.status) === "ACTIVE",
          buy: true,
          sell: true,
          supports: ["market", "limit"],
          tpSl: false,
          pricePrecision: 8,
          sizePrecision: 8,
          minNotional: "0",
          maxNotional: "0",
          feeBps: 0,
          provider: stringValue(provider.key),
          maintenance: stringValue(row.status) !== "ACTIVE",
        } as SpotPair;
      }),
    );
  }
  listSpotOrders(): Promise<SpotOrder[]> {
    return this.request<unknown[]>("/admin/spot/orders").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const side = stringValue(row.side).toLowerCase();
        const type = stringValue(row.type).toLowerCase();
        const status = stringValue(row.status).toLowerCase();
        return {
          id: stringValue(row.id),
          userId: stringValue(row.userId),
          pair: stringValue(row.pair),
          side: side === "sell" ? "sell" : "buy",
          type: type === "market" ? "market" : type === "stop" ? "stop_limit" : "limit",
          price: typeof row.price === "string" ? row.price : undefined,
          size: stringValue(row.amount),
          filled: stringValue(row.filled),
          status:
            status === "canceled"
              ? "cancelled"
              : status === "filled"
                ? "filled"
                : status === "rejected"
                  ? "rejected"
                  : "open",
          createdAt: stringValue(row.createdAt, new Date(0).toISOString()),
        } as SpotOrder;
      }),
    );
  }
  async pauseSpotPair(
    id: string,
    paused: boolean,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation("/admin/spot/pairs/maintenance", ctx, {
      symbol: id,
      enabled: !paused,
    });
  }
  async cancelSpotOrder(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/spot/orders/${encodeURIComponent(id)}/cancel`, ctx);
  }
  getMarginConfiguration(): Promise<{ maintenanceRatio: number; leverages: number[] }> {
    return this.request<{ maintenanceRatio: number; leverages: number[] }>(
      "/admin/spot/margin/config",
    );
  }
  updateMarginConfiguration(
    config: { maintenanceRatio: number; leverages: number[] },
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation("/admin/spot/margin/config", ctx, {
      maintenanceRatio: config.maintenanceRatio,
      leverages: config.leverages.join(","),
    });
  }
  async listBinaryPairs(): Promise<BinaryPair[]> {
    const rows = await this.request<unknown[]>("/admin/binary/config");
    const grouped = new Map<string, JsonRecord[]>();
    for (const value of rows) {
      const row = record(value);
      const pair = stringValue(row.pair);
      if (!pair) continue;
      grouped.set(pair, [...(grouped.get(pair) ?? []), row]);
    }
    return [...grouped.entries()].map(([symbol, configs]) => {
      const sortedConfigs = [...configs].sort(
        (a, b) => Number(a.durationSeconds) - Number(b.durationSeconds),
      );
      const current = sortedConfigs[0] ?? {};
      const payoutBps = Object.fromEntries(
        sortedConfigs.map((config) => [
          Number(config.durationSeconds),
          Math.round(Number(config.payoutRate ?? 0) * 10000),
        ]),
      ) as BinaryPair["payoutBps"];
      const durationConfigs = sortedConfigs.map((config) => ({
        sourceDurationSeconds: Number(config.durationSeconds),
        durationSeconds: Number(config.durationSeconds),
        payoutBps: Math.round(Number(config.payoutRate ?? 0) * 10000),
        minStake: stringValue(config.minStake, "0"),
        maxStake: stringValue(config.maxStake, "0"),
        enabled: config.enabled !== false,
      }));
      return {
        id: symbol,
        symbol,
        enabled: configs.some((row) => row.enabled !== false),
        payoutBps,
        durationConfigs,
        minStake: stringValue(current.minStake, "0"),
        maxStake: stringValue(current.maxStake, "0"),
        exposureCap: "UNAVAILABLE",
        exposureUsed: "UNAVAILABLE",
        settlementDelayMs: Number(current.settlementDelaySeconds ?? 0) * 1000,
        maintenance: configs.every((row) => row.enabled === false),
      };
    });
  }
  listBinaryPositions(): Promise<BinaryPosition[]> {
    return this.request<unknown[]>("/admin/binary/positions").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const state = stringValue(row.state).toLowerCase();
        const side = stringValue(row.side);
        const status =
          state === "active" || state === "settling" || state === "settlement_delayed"
            ? "open"
            : state === "win"
              ? "won"
              : state === "loss"
                ? "lost"
                : "error";
        return {
          id: stringValue(row.id),
          userId: stringValue(row.userId),
          pair: stringValue(row.pair),
          direction: side === "DOWN" ? "short" : "long",
          duration: Number(row.durationSeconds) as BinaryPosition["duration"],
          stake: stringValue(row.stake),
          openPrice: stringValue(row.entryPrice),
          strikeAt: stringValue(row.expiresAt, new Date(0).toISOString()),
          status,
          payout: typeof row.payoutAmount === "string" ? row.payoutAmount : undefined,
        } as BinaryPosition;
      }),
    );
  }
  async pauseBinaryPair(
    id: string,
    paused: boolean,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const pair = (await this.listBinaryPairs()).find((item) => item.id === id);
    return this.requestMutation("/admin/binary/pairs/maintenance", ctx, {
      symbol: pair?.symbol ?? id,
      enabled: !paused,
    });
  }
  async settleBinaryPosition(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/binary/positions/${encodeURIComponent(id)}/settle`, ctx);
  }
  listWallets(): Promise<WalletRow[]> {
    return this.request<unknown[]>("/admin/wallets").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        return {
          id: stringValue(row.id),
          userId: stringValue(row.userId),
          domain: "overview",
          asset: "MULTI",
          available: stringValue(row.balance),
          locked: stringValue(row.frozenBalance),
          updatedAt: stringValue(row.updatedAt, new Date(0).toISOString()),
          status: "active",
        } as WalletRow;
      }),
    );
  }
  listLedger(): Promise<LedgerEntry[]> {
    return this.request<unknown[]>("/admin/ledger").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const account = record(row.account);
        const kind = stringValue(row.kind).toLowerCase();
        return {
          id: stringValue(row.id),
          ts: stringValue(row.createdAt, new Date(0).toISOString()),
          userId: typeof account.userId === "string" ? account.userId : undefined,
          domain: "financial",
          asset: stringValue(row.asset),
          amount: stringValue(row.amount),
          type: kind.includes("deposit")
            ? "deposit"
            : kind.includes("withdraw")
              ? "withdrawal"
              : kind.includes("trade")
                ? "trade"
                : kind.includes("fee")
                  ? "fee"
                  : "adjustment",
          refId: stringValue(row.referenceId),
          note: undefined,
          status: "posted",
        } as LedgerEntry;
      }),
    );
  }
  listDeposits(): Promise<Deposit[]> {
    return this.request<unknown[]>("/admin/deposits").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const state = stringValue(row.state).toLowerCase();
        return {
          id: stringValue(row.id),
          userId: stringValue(row.userId),
          asset: stringValue(row.asset),
          network: stringValue(row.network),
          amount: stringValue(row.amount),
          txHash: stringValue(row.txHash),
          confirmations: Number(row.confirmations ?? 0),
          requiredConfirmations: Number(row.requiredConfirmations ?? 0),
          status:
            state === "credited"
              ? "credited"
              : state === "rejected"
                ? "failed"
                : state === "approved"
                  ? "confirmed"
                  : state === "confirming"
                    ? "confirming"
                    : "detected",
          createdAt: stringValue(row.createdAt, new Date(0).toISOString()),
          detectedAt: stringValue(row.observedAt, new Date(0).toISOString()),
          creditedAt: typeof row.creditedAt === "string" ? row.creditedAt : undefined,
        } as Deposit;
      }),
    );
  }
  confirmDeposit(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/deposits/${encodeURIComponent(id)}/confirm`, ctx, {}, [id]);
  }
  listWithdrawals(): Promise<Withdrawal[]> {
    return this.request<unknown[]>("/admin/withdrawals").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const state = stringValue(row.state).toLowerCase();
        return {
          id: stringValue(row.id),
          userId: stringValue(row.userId),
          asset: stringValue(row.asset),
          network: stringValue(row.network),
          amount: stringValue(row.amount),
          destination: stringValue(row.address),
          status:
            state === "approved"
              ? "approved"
              : state === "settled"
                ? "confirmed"
                : state === "rejected"
                  ? "rejected"
                  : "pending",
          createdAt: stringValue(row.createdAt, new Date(0).toISOString()),
          fee: stringValue(row.fee),
          txHash: typeof row.txHash === "string" ? row.txHash : undefined,
        } as Withdrawal;
      }),
    );
  }
  decideWithdrawal(
    id: string,
    decision: "approved" | "rejected",
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation(
      `/admin/withdrawals/${encodeURIComponent(id)}/${decision === "approved" ? "approve" : "reject"}`,
      ctx,
      {},
      [id, decision],
    );
  }
  listTickets(): Promise<SupportTicket[]> {
    return this.request<unknown[]>("/admin/tickets").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const status = stringValue(row.status).toLowerCase();
        const priority = stringValue(row.priority).toLowerCase();
        const replies = Array.isArray(row.replies) ? row.replies : [];
        return {
          id: stringValue(row.id),
          userId: stringValue(row.userId),
          subject: stringValue(row.subject),
          priority: ["low", "normal", "high", "urgent"].includes(priority)
            ? (priority as SupportTicket["priority"])
            : "normal",
          status:
            status === "resolved"
              ? "resolved"
              : status === "escalated"
                ? "escalated"
                : status === "pending_user"
                  ? "pending_user"
                  : "open",
          assignee: typeof row.assignedToId === "string" ? row.assignedToId : undefined,
          createdAt: stringValue(row.createdAt, new Date(0).toISOString()),
          updatedAt: stringValue(row.updatedAt, new Date(0).toISOString()),
          messages: replies.map((reply) => {
            const r = record(reply);
            return {
              id: stringValue(r.id),
              author: stringValue(r.authorId),
              internal: r.internal === true,
              body: stringValue(r.body),
              ts: stringValue(r.createdAt, new Date(0).toISOString()),
            };
          }),
        };
      }),
    );
  }
  replyTicket(id: string, body: string, internal: boolean, ctx: ConsequentialContext) {
    return this.requestMutation(
      `/admin/tickets/${encodeURIComponent(id)}/reply`,
      ctx,
      { body, internal },
      [id, body, String(internal)],
    );
  }
  setTicketStatus(id: string, status: SupportTicket["status"], ctx: ConsequentialContext) {
    return this.requestMutation(
      `/admin/tickets/${encodeURIComponent(id)}/status`,
      ctx,
      { status },
      [id, status],
    );
  }
  listAdmins() {
    return this.request<unknown[]>("/admin/admins").then((rows) =>
      rows.map((value) => this.mapAdminAccount(value)),
    );
  }
  async getAdminDetail(id: string): Promise<AdminUser> {
    return this.mapAdminAccount(
      await this.request<unknown>(`/admin/admins/${encodeURIComponent(id)}`),
    );
  }
  private mapAdminAccount(value: unknown): AdminUser {
    const row = record(value);
    const assignments = Array.isArray(row.roleAssignments) ? row.roleAssignments : [];
    const assignment = record(assignments[0]);
    const assignedRole = role(assignment.roleId);
    const sessions = Array.isArray(row.sessions) ? row.sessions : [];
    return {
      id: stringValue(row.id),
      email: stringValue(row.email),
      displayName: stringValue(row.displayName, stringValue(row.email)),
      role: assignedRole,
      mfaState:
        row.mfaState === "enabled" || row.mfaState === "disabled" || row.mfaState === "unknown"
          ? row.mfaState
          : "unknown",
      lastActiveAt: stringValue(row.lastActiveAt, new Date(0).toISOString()),
      status:
        row.accountStatus === "active" ||
        row.accountStatus === "suspended" ||
        row.accountStatus === "invited" ||
        row.accountStatus === "unknown"
          ? row.accountStatus
          : "unknown",
      roleAssignments: assignments.map((item) => {
        const assignmentRow = record(item);
        const assignmentRole = role(assignmentRow.roleId);
        if (assignmentRole === "unassigned") {
          throw new NexiAdminApiError(502, "Admin API returned an unknown role assignment");
        }
        return {
          id: stringValue(assignmentRow.id),
          roleId: assignmentRole,
          assignedBy:
            typeof assignmentRow.assignedBy === "string" ? assignmentRow.assignedBy : null,
          createdAt: stringValue(assignmentRow.createdAt, new Date(0).toISOString()),
          updatedAt: stringValue(assignmentRow.updatedAt, new Date(0).toISOString()),
        };
      }),
      sessions: sessions.map((item) => {
        const session = record(item);
        return {
          id: stringValue(session.id),
          surface: "ADMIN" as const,
          createdAt: stringValue(session.createdAt, new Date(0).toISOString()),
          lastUsedAt: stringValue(session.lastUsedAt, new Date(0).toISOString()),
          absoluteExpiresAt: stringValue(session.absoluteExpiresAt, new Date(0).toISOString()),
          idleExpiresAt: stringValue(session.idleExpiresAt, new Date(0).toISOString()),
          revokedAt: typeof session.revokedAt === "string" ? session.revokedAt : null,
          active: session.active === true,
        };
      }),
    };
  }
  async listAudit(): Promise<AuditEvent[]> {
    const rows = await this.request<unknown[]>("/admin/audit");
    return rows.map((value) => {
      const row = record(value);
      const details = record(row.details);
      const result = stringValue(details.result, "unknown");
      return {
        id: stringValue(row.id),
        ts: stringValue(row.createdAt, new Date(0).toISOString()),
        actor: stringValue(row.actor),
        role: role(row.actorRole),
        environment: stringValue(details.environment, "UNSPECIFIED") as AuditEvent["environment"],
        action: stringValue(row.action),
        target: stringValue(row.target),
        reason: stringValue(details.reason),
        before: details.before,
        after: details.after,
        correlationId: stringValue(
          row.correlationId,
          stringValue(details.correlationId, row.id as string),
        ),
        result:
          result === "ok" ? "ok" : result === "error" || result === "denied" ? "failed" : "unknown",
      };
    });
  }
  async listMiningPlans(): Promise<MiningPlan[]> {
    return this.request<MiningPlan[]>("/admin/mining-plans");
  }
  async createMiningPlan(
    payload: Omit<MiningPlan, "id">,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation("/admin/mining-plans", ctx, payload as JsonRecord, [payload.name]);
  }
  async updateMiningPlan(
    id: string,
    patch: Partial<Omit<MiningPlan, "id">>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation(
      `/admin/mining-plans/${encodeURIComponent(id)}`,
      ctx,
      patch as JsonRecord,
      [id],
      "PATCH",
    );
  }
  async listLoanPlans(): Promise<LoanPlan[]> {
    return this.request<LoanPlan[]>("/admin/loan-plans");
  }
  async createLoanPlan(
    payload: Omit<LoanPlan, "id">,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation("/admin/loan-plans", ctx, payload as JsonRecord, [payload.name]);
  }
  async updateLoanPlan(
    id: string,
    patch: Partial<Omit<LoanPlan, "id">>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    return this.requestMutation(
      `/admin/loan-plans/${encodeURIComponent(id)}`,
      ctx,
      patch as JsonRecord,
      [id],
      "PATCH",
    );
  }
  async listMiningSubscriptions(): Promise<MiningSubscriptionAdmin[]> {
    const rows = await this.request<JsonRecord[]>("/admin/mining/subscriptions");
    return rows.map((row) => ({
      id: stringValue(row.id),
      userId: stringValue(row.userId),
      userEmail: stringValue(record(row.user).email),
      planName: stringValue(record(row.plan).name),
      amount: stringValue(row.amountDecimal, stringValue(row.amount)),
      currency: stringValue(record(row.plan).currency, "USDT"),
      status: stringValue(row.status),
      startDate: stringValue(row.startDate),
      endDate: typeof row.endDate === "string" ? row.endDate : null,
      totalRewards: stringValue(row.totalRewardsDecimal, stringValue(row.totalRewards)),
    }));
  }
  async listLoanApplications(): Promise<LoanApplicationAdmin[]> {
    const rows = await this.request<JsonRecord[]>("/admin/loans/applications");
    return rows.map((row) => ({
      id: stringValue(row.id),
      userId: stringValue(row.userId),
      userEmail: stringValue(record(row.user).email),
      amount: stringValue(row.amountDecimal, stringValue(row.amount)),
      currency: stringValue(row.currency, "USDT"),
      status: stringValue(row.status),
      durationDays: Number(row.durationDays ?? row.term),
      totalRepayment: stringValue(row.totalRepaymentDecimal, stringValue(row.totalRepayment)),
      createdAt: stringValue(row.createdAt),
      dueDate: typeof row.dueDate === "string" ? row.dueDate : null,
      collateral: typeof row.collateral === "string" ? row.collateral : null,
      collateralImg: typeof row.collateralImg === "string" ? row.collateralImg : null,
      approvedAt: typeof row.approvedAt === "string" ? row.approvedAt : null,
    }));
  }
  async approveLoanApplication(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(
      `/admin/loans/applications/${encodeURIComponent(id)}/approve`,
      ctx,
      { loanId: id },
      [id],
    );
  }
  async rejectLoanApplication(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(
      `/admin/loans/applications/${encodeURIComponent(id)}/reject`,
      ctx,
      {},
      [id],
    );
  }
  async listFlags(): Promise<FeatureFlag[]> {
    return this.request<FeatureFlag[]>("/admin/feature-flags");
  }
  async toggleFlag(key: string, ctx: ConsequentialContext): Promise<MutationResult> {
    const current = (await this.listFlags()).find((flag) => flag.key === key);
    if (!current) return { ok: false, auditId: "" };
    await this.request("/admin/feature-flags", {
      method: "POST",
      body: JSON.stringify({ key, enabled: !current.enabled, reason: ctx.reason }),
    });
    return { ok: true, auditId: "" };
  }
  async updateFlag(
    key: string,
    patch: Parameters<AdminDataProvider["updateFlag"]>[1],
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    await this.request("/admin/feature-flags", {
      method: "POST",
      body: JSON.stringify({
        key,
        enabled: patch.enabled ?? false,
        environment: patch.env,
        reason: ctx.reason,
      }),
    });
    return { ok: true, auditId: "" };
  }
  updateAsset(
    id: string,
    patch: Parameters<AdminDataProvider["updateAsset"]>[1],
    _ctx: ConsequentialContext,
  ) {
    if (Object.keys(patch).length === 0) return Promise.resolve({ ok: true, auditId: "" });
    return this.unsupportedAuthority(
      "updateAsset",
      `canonical MarketAsset exposes lifecycle status only; requested fields for ${id} are not represented`,
    );
  }
  reorderAssets(_orderMap: Record<string, number>, _ctx: ConsequentialContext) {
    return this.unsupportedAuthority(
      "reorderAssets",
      "canonical MarketAsset has no ordering authority",
    );
  }
  async updateNetwork(
    id: string,
    patch: Parameters<AdminDataProvider["updateNetwork"]>[1],
    ctx: ConsequentialContext,
  ) {
    const network = (await this.listNetworks()).find((item) => item.id === id);
    if (!network?.currencyId)
      throw new NexiAdminApiError(404, "Canonical currency configuration not found for network");
    const payload: JsonRecord = {};
    if (patch.decimals !== undefined) payload.decimals = patch.decimals;
    if (patch.minDeposit !== undefined) payload.minDeposit = Number(patch.minDeposit);
    if (patch.maxDeposit !== undefined) payload.maxDeposit = Number(patch.maxDeposit);
    if (patch.minWithdrawal !== undefined) payload.minWithdrawal = Number(patch.minWithdrawal);
    if (patch.maxWithdrawal !== undefined) payload.maxWithdrawal = Number(patch.maxWithdrawal);
    if (patch.withdrawalFee !== undefined) payload.withdrawalFee = Number(patch.withdrawalFee);
    if (patch.confirmations !== undefined) payload.confirmationCount = patch.confirmations;
    if (patch.depositEnabled !== undefined) payload.depositEnabled = patch.depositEnabled;
    if (patch.withdrawEnabled !== undefined) payload.withdrawEnabled = patch.withdrawEnabled;
    if (Object.keys(payload).length === 0) return { ok: true, auditId: "" };
    return this.requestMutation(
      `/admin/currencies/${network.currencyId}`,
      ctx,
      payload,
      [network.assetSymbol],
      "PATCH",
    );
  }
  failoverFeed(id: string, _ctx: ConsequentialContext) {
    return this.unsupportedAuthority(
      "failoverFeed",
      `provider priority/failover authority is not implemented for ${id}`,
    );
  }
  updateSpotPair(
    id: string,
    patch: Parameters<AdminDataProvider["updateSpotPair"]>[1],
    ctx: ConsequentialContext,
  ) {
    const keys = Object.keys(patch);
    if (keys.length === 0) return Promise.resolve({ ok: true, auditId: "" });
    if (keys.length === 1 && "enabled" in patch) {
      return this.requestMutation(
        "/admin/spot/pairs/maintenance",
        ctx,
        { symbol: id, enabled: patch.enabled },
        [id],
      );
    }
    return this.unsupportedAuthority(
      "updateSpotPair",
      `canonical MarketPair supports lifecycle maintenance only; unsupported fields: ${keys.join(", ")}`,
    );
  }
  async updateBinaryPair(
    id: string,
    patch: Parameters<AdminDataProvider["updateBinaryPair"]>[1],
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const pair = (await this.listBinaryPairs()).find(
      (item) => item.id === id || item.symbol === id,
    );
    const symbol = pair?.symbol ?? id;
    if (patch.enabled !== undefined) {
      await this.requestMutation(
        "/admin/binary/pairs/maintenance",
        ctx,
        { symbol, enabled: patch.enabled },
        [symbol],
      );
    }
    const configPatch = patch as Record<string, unknown>;
    const configRows = await this.request<unknown[]>(
      `/admin/binary/config?pair=${encodeURIComponent(symbol)}`,
    );
    const requestedConfigs = Array.isArray(configPatch.durationConfigs)
      ? (configPatch.durationConfigs as Array<{
          sourceDurationSeconds: number;
          durationSeconds: number;
          payoutBps: number;
          minStake: string;
          maxStake: string;
          enabled: boolean;
        }>)
      : configRows.map((row) => {
          const current = record(row);
          const duration = Number(current.durationSeconds);
          const payout =
            configPatch.payoutBps && typeof configPatch.payoutBps === "object"
              ? (configPatch.payoutBps as Record<string, unknown>)[String(duration)]
              : undefined;
          return {
            sourceDurationSeconds: duration,
            durationSeconds: duration,
            payoutBps:
              typeof payout === "number"
                ? payout
                : Math.round(Number(current.payoutRate ?? 0) * 10000),
            minStake:
              typeof configPatch.minStake === "string"
                ? configPatch.minStake
                : stringValue(current.minStake),
            maxStake:
              typeof configPatch.maxStake === "string"
                ? configPatch.maxStake
                : stringValue(current.maxStake),
            enabled: current.enabled !== false,
          };
        });
    let lastAuditId = "";
    for (const config of requestedConfigs) {
      if (!Number.isInteger(config.durationSeconds) || config.durationSeconds < 1) continue;
      const result = await this.request<JsonRecord>("/admin/binary/config", {
        method: "POST",
        body: JSON.stringify({
          pair: symbol,
          sourceDurationSeconds: config.sourceDurationSeconds,
          durationSeconds: config.durationSeconds,
          payoutRate: config.payoutBps / 10000,
          minStake: Number(config.minStake),
          maxStake: Number(config.maxStake),
          enabled: config.enabled,
          reason: ctx.reason,
          idempotencyKey: boundedIdempotencyKey("binary", [
            symbol,
            String(config.sourceDurationSeconds),
            String(config.durationSeconds),
            ctx.actor,
            ctx.reason,
          ]),
        }),
      });
      lastAuditId = stringValue(result.auditId ?? result.id, lastAuditId);
    }
    if (Object.keys(configPatch).length === 0) return { ok: true, auditId: lastAuditId };
    return { ok: true, auditId: lastAuditId };
  }
  listSettlements(): Promise<SettlementRecord[]> {
    return this.request<unknown[]>("/admin/binary/settlements").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const side = stringValue(row.side);
        const state = stringValue(row.state).toLowerCase();
        const settlementState =
          state === "win"
            ? "win"
            : state === "loss"
              ? "loss"
              : state === "error"
                ? "error"
                : state === "settling" || state === "settlement_delayed"
                  ? "settling"
                  : "open";
        return {
          id: stringValue(row.id),
          positionId: stringValue(row.id),
          userId: stringValue(row.userId),
          pair: stringValue(row.pair),
          direction: side === "DOWN" ? "short" : "long",
          duration: Number(row.durationSeconds) as SettlementRecord["duration"],
          stake: stringValue(row.stake),
          openPrice: stringValue(row.entryPrice),
          settlePrice: typeof row.expiryPrice === "string" ? row.expiryPrice : undefined,
          state: settlementState,
          settledAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
          payout: typeof row.payoutAmount === "string" ? row.payoutAmount : undefined,
        } as SettlementRecord;
      }),
    );
  }
  correctSettlement(
    id: string,
    _outcome: Parameters<AdminDataProvider["correctSettlement"]>[1],
    _ctx: ConsequentialContext,
  ) {
    return this.unsupportedAuthority(
      "correctSettlement",
      `settlement correction authority is disabled for ${id}; BinaryService owns settlement outcomes`,
    );
  }
  async listExposure(): Promise<ExposureRow[]> {
    const [spotPairs, spotOrders, binaryPairs] = await Promise.all([
      this.listSpotPairs(),
      this.listSpotOrders(),
      this.listBinaryPairs(),
    ]);
    const spot = spotPairs.map((pair) => {
      const used = spotOrders
        .filter((order) => order.pair === pair.symbol && order.status === "open")
        .reduce((sum, order) => {
          const remaining = Math.max(Number(order.size) - Number(order.filled), 0);
          return sum + remaining * Number(order.price ?? 0);
        }, 0);
      const cap = Number(pair.maxNotional || 0);
      const utilisation = cap > 0 ? used / cap : 0;
      return {
        id: `spot:${pair.id}`,
        pair: pair.symbol,
        product: "spot" as const,
        used: String(used),
        cap: pair.maxNotional,
        utilisation,
        status: utilisation >= 1 ? "over_limit" as const : utilisation >= 0.8 ? "warning" as const : "ok" as const,
      };
    });
    const binary = binaryPairs.map((pair) => {
      const used = Number(pair.exposureUsed || 0);
      const cap = Number(pair.exposureCap || 0);
      const utilisation = cap > 0 ? used / cap : 0;
      return {
        id: `binary:${pair.id}`,
        pair: pair.symbol,
        product: "binary" as const,
        used: pair.exposureUsed,
        cap: pair.exposureCap,
        utilisation,
        status: utilisation >= 1 ? "over_limit" as const : utilisation >= 0.8 ? "warning" as const : "ok" as const,
      };
    });
    return [...spot, ...binary];
  }
  listPublicRoutes(): Promise<PublicRoute[]> {
    return this.readJsonConfig<PublicRoute[]>("admin.frontend.routes", []);
  }
  async setPublicRouteState(
    id: string,
    state: PublicRouteState,
    message: string | undefined,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const routes = await this.listPublicRoutes();
    const index = routes.findIndex((item) => item.id === id);
    if (index < 0) throw new NexiAdminApiError(404, `Public route ${id} not found`);
    routes[index] = { ...routes[index], state, unavailableMessage: message };
    return this.writeJsonConfig("admin.frontend.routes", routes, "Public route visibility and maintenance state", ctx);
  }
  async reorderPublicRoutes(
    orderMap: Record<string, number>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const routes = await this.listPublicRoutes();
    const next = routes.map((item) => ({ ...item, order: orderMap[item.id] ?? item.order }));
    return this.writeJsonConfig("admin.frontend.routes", next, "Public route ordering", ctx);
  }
  listQuotesCategories(): Promise<QuotesCategory[]> {
    return this.readJsonConfig<QuotesCategory[]>("admin.frontend.quoteCategories", []);
  }
  async toggleQuotesCategory(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    const categories = await this.listQuotesCategories();
    const index = categories.findIndex((item) => item.id === id);
    if (index < 0) throw new NexiAdminApiError(404, `Quote category ${id} not found`);
    categories[index] = { ...categories[index], visible: !categories[index].visible };
    return this.writeJsonConfig("admin.frontend.quoteCategories", categories, "Quotes category visibility", ctx);
  }
  async reorderQuotesCategories(
    orderMap: Record<string, number>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const categories = await this.listQuotesCategories();
    const next = categories.map((item) => ({ ...item, order: orderMap[item.id] ?? item.order }));
    return this.writeJsonConfig("admin.frontend.quoteCategories", next, "Quotes category ordering", ctx);
  }
  listBanners(): Promise<PublicBanner[]> {
    return this.readJsonConfig<PublicBanner[]>("admin.frontend.banners", []);
  }
  async setBannerActive(
    id: string,
    active: boolean,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const banners = await this.listBanners();
    const index = banners.findIndex((item) => item.id === id);
    if (index < 0) throw new NexiAdminApiError(404, `Banner ${id} not found`);
    banners[index] = { ...banners[index], active };
    return this.writeJsonConfig("admin.frontend.banners", banners, "Public banner configuration", ctx);
  }
  async upsertBanner(banner: PublicBanner, ctx: ConsequentialContext): Promise<MutationResult> {
    const banners = await this.listBanners();
    const index = banners.findIndex((item) => item.id === banner.id);
    if (index < 0) banners.push(banner);
    else banners[index] = banner;
    return this.writeJsonConfig("admin.frontend.banners", banners, "Public banner configuration", ctx);
  }
  async listIncidents(): Promise<IncidentMessage[]> {
    const rows = await this.request<unknown[]>("/admin/incidents");
    return rows.map((value) => {
      const row = record(value);
      return {
        id: stringValue(row.id),
        title: stringValue(row.title),
        body: stringValue(row.body),
        severity: ["info", "warning", "critical"].includes(stringValue(row.severity).toLowerCase())
          ? (stringValue(row.severity).toLowerCase() as IncidentMessage["severity"])
          : "info",
        active: row.active === true,
        postedAt: stringValue(row.postedAt),
        environment: stringValue(row.environment) as IncidentMessage["environment"],
        acknowledgedAt: typeof row.acknowledgedAt === "string" ? row.acknowledgedAt : null,
        acknowledgedBy: typeof row.acknowledgedBy === "string" ? row.acknowledgedBy : null,
        correlationId: typeof row.correlationId === "string" ? row.correlationId : null,
      };
    });
  }
  async setIncidentActive(
    id: string,
    active: boolean,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    if (active)
      throw new NexiAdminApiError(
        409,
        "Reopening an incident is not available in the current live contract",
      );
    await this.request<JsonRecord>(`/admin/incidents/${encodeURIComponent(id)}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ reason: ctx.reason, idempotencyKey: `incident-ack:${id}` }),
    });
    const audit = (await this.listAudit()).find(
      (entry) => entry.action === "INCIDENT_ACKNOWLEDGED" && entry.target === id,
    );
    return { ok: true, auditId: audit?.id ?? "" };
  }
  listSupportEntryPoints(): Promise<SupportEntryPoint[]> {
    return this.readJsonConfig<SupportEntryPoint[]>("admin.frontend.supportEntryPoints", []);
  }
  async updateSupportEntryPoint(
    id: string,
    patch: Partial<Pick<SupportEntryPoint, "label" | "target" | "channel" | "visible" | "order">>,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const items = await this.listSupportEntryPoints();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new NexiAdminApiError(404, `Support entry point ${id} not found`);
    items[index] = { ...items[index], ...patch };
    return this.writeJsonConfig("admin.frontend.supportEntryPoints", items, "Public support entry-point configuration", ctx);
  }
  listNavItems(): Promise<NavItem[]> {
    return this.readJsonConfig<NavItem[]>("admin.navigation.items", []);
  }
  async updateNavItems(
    surface: NavSurface,
    items: NavItem[],
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const current = await this.listNavItems();
    const next = [...current.filter((item) => item.surface !== surface), ...items.map((item) => ({ ...item, surface }))];
    return this.writeJsonConfig("admin.navigation.items", next, "Admin-controlled Public navigation configuration", ctx);
  }
  listTranslationKeys(): Promise<TranslationKey[]> {
    return this.readJsonConfig<TranslationKey[]>("admin.localization.translations", []);
  }
  async updateTranslationValue(
    id: string,
    locale: Locale,
    value: string,
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const keys = await this.listTranslationKeys();
    const index = keys.findIndex((item) => item.id === id);
    if (index < 0) throw new NexiAdminApiError(404, `Translation key ${id} not found`);
    keys[index] = {
      ...keys[index],
      values: { ...keys[index].values, [locale]: value },
      updatedAt: new Date().toISOString(),
      editor: ctx.actor,
    };
    return this.writeJsonConfig("admin.localization.translations", keys, "Admin localization catalog", ctx);
  }
  creditDeposit(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/deposits/${encodeURIComponent(id)}/credit`, ctx, {}, [id]);
  }
  failDeposit(id: string, reason: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(
      `/admin/deposits/${encodeURIComponent(id)}/fail`,
      { ...ctx, reason },
      {},
      [id, reason],
    );
  }
  requestWithdrawalReview(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    return this.requestMutation(`/admin/withdrawals/${encodeURIComponent(id)}/review`, ctx, {}, [
      id,
    ]);
  }
  setWithdrawalProcessing(
    id: string,
    processing: "processing" | "completed" | "failed",
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    if (processing === "failed") {
      return this.requestMutation(`/admin/withdrawals/${encodeURIComponent(id)}/fail`, ctx, {}, [
        id,
        processing,
      ]);
    }
    throw new NexiAdminApiError(
      409,
      processing === "processing"
        ? "Withdrawal processing state is not represented by the canonical Gate2 state machine"
        : "Withdrawal completion requires an externally verified provider receipt",
    );
  }
  listReconciliation() {
    return this.unsupportedAuthority(
      "listReconciliation",
      "reconciliation projection has no canonical durable model",
    );
  }
  assignReconciliationOwner() {
    return this.unsupportedAuthority(
      "assignReconciliationOwner",
      "reconciliation projection has no canonical durable model",
    );
  }
  setReconciliationStatus() {
    return this.unsupportedAuthority(
      "setReconciliationStatus",
      "reconciliation projection has no canonical durable model",
    );
  }
  addReconciliationNote() {
    return this.unsupportedAuthority(
      "addReconciliationNote",
      "reconciliation projection has no canonical durable model",
    );
  }
  listAnnouncements(): Promise<Announcement[]> {
    return this.request<unknown[]>("/admin/announcements").then((rows) =>
      rows.map((value) => {
        const row = record(value);
        const status = row.published === true ? "published" : row.startsAt ? "scheduled" : "draft";
        return {
          id: stringValue(row.id),
          title: stringValue(row.title),
          body: stringValue(row.body),
          status,
          locale: "en",
          scheduledAt: typeof row.startsAt === "string" ? row.startsAt : undefined,
          publishedAt:
            typeof row.updatedAt === "string" && row.published === true ? row.updatedAt : undefined,
        } as Announcement;
      }),
    );
  }
  createAnnouncement(
    payload: { title: string; body: string; published?: boolean },
    ctx: ConsequentialContext,
  ) {
    return this.requestMutation("/communications/admin/announcements", ctx, payload);
  }
  updateAnnouncement(
    id: string,
    payload: { title?: string; body?: string; published?: boolean },
    ctx: ConsequentialContext,
  ) {
    return this.requestMutation(
      `/communications/admin/announcements/${encodeURIComponent(id)}`,
      ctx,
      payload,
      [id],
      "PATCH",
    );
  }
  publishAnnouncement(id: string, ctx: ConsequentialContext) {
    return this.requestMutation(
      `/communications/admin/announcements/${encodeURIComponent(id)}/publish`,
      ctx,
      {},
      [id],
    );
  }
  listMessages(): Promise<AdminMessage[]> {
    return this.request<unknown[]>("/communications/admin/messages").then((rows) =>
      rows.map((v) => {
        const r = record(v);
        return {
          id: stringValue(r.id),
          senderId: stringValue(r.senderId),
          recipientId: stringValue(r.recipientId),
          body: stringValue(r.body),
          deliveryState: stringValue(r.deliveryState),
          createdAt: stringValue(r.createdAt),
        };
      }),
    );
  }
  listNotifications(): Promise<AdminNotification[]> {
    return this.request<unknown[]>("/communications/admin/notifications").then((rows) =>
      rows.map((v) => {
        const r = record(v);
        return {
          id: stringValue(r.id),
          userId: stringValue(r.userId),
          type: stringValue(r.type),
          title: stringValue(r.title),
          body: stringValue(r.body),
          readAt: typeof r.readAt === "string" ? r.readAt : undefined,
          createdAt: stringValue(r.createdAt),
        };
      }),
    );
  }
  sendNotification(
    payload: { userId: string; type: string; title: string; body: string },
    ctx: ConsequentialContext,
  ) {
    return this.requestMutation("/communications/admin/notifications", ctx, payload, [
      payload.userId,
      payload.title,
    ]);
  }
  listLearnArticles(): Promise<AdminLearnArticle[]> {
    return this.request<unknown[]>("/communications/admin/learn/articles").then((rows) =>
      rows.map((v) => {
        const r = record(v);
        return {
          id: stringValue(r.id),
          slug: stringValue(r.slug),
          title: stringValue(r.title),
          body: stringValue(r.body),
          status: stringValue(r.status),
          updatedAt: stringValue(r.updatedAt),
        };
      }),
    );
  }
  createLearnArticle(
    payload: { slug: string; title: string; body: string; status?: string },
    ctx: ConsequentialContext,
  ) {
    return this.requestMutation("/communications/admin/learn", ctx, payload);
  }
  updateLearnArticle(
    id: string,
    payload: { title?: string; body?: string; status?: string },
    ctx: ConsequentialContext,
  ) {
    return this.requestMutation(
      `/communications/admin/learn/${encodeURIComponent(id)}`,
      ctx,
      payload,
      [id],
      "PATCH",
    );
  }
  publishLearnArticle(id: string, ctx: ConsequentialContext) {
    return this.requestMutation(
      `/communications/admin/learn/${encodeURIComponent(id)}/publish`,
      ctx,
      {},
      [id],
    );
  }
  async listHealth(): Promise<HealthCheck[]> {
    const started = performance.now();
    const health = await this.request<{ status?: string }>("/healthz");
    const healthLatencyMs = Math.round(performance.now() - started);
    const readyStarted = performance.now();
    const ready = await this.request<{
      status?: string;
      dependencies?: { database?: boolean; redis?: boolean };
    }>("/ops/ready");
    const readyLatencyMs = Math.round(performance.now() - readyStarted);
    const updatedAt = new Date().toISOString();
    const serviceStatus: HealthCheck["status"] = health.status === "UP" ? "ok" : "down";
    const dependencyStatus = (available: boolean | undefined): HealthCheck["status"] =>
      ready.status === "ready" && available === true ? "ok" : "down";
    return [
      {
        id: "backend",
        name: "Admin API",
        status: serviceStatus,
        latencyMs: healthLatencyMs,
        updatedAt,
      },
      {
        id: "d1",
        name: "D1 (durable relational)",
        status: dependencyStatus(ready.dependencies?.database),
        latencyMs: readyLatencyMs,
        updatedAt,
      },
      {
        id: "valkey",
        name: "Aiven Valkey (cache/streams)",
        status: dependencyStatus(ready.dependencies?.redis),
        latencyMs: readyLatencyMs,
        updatedAt,
      },
    ];
  }
  setAdminStatus() {
    return this.unsupportedAuthority(
      "setAdminStatus",
      "admin lifecycle status has no canonical backend authority",
    );
  }
  async listRoleDefinitions(): Promise<
    { id: RoleId; label: string; description: string; permissions: Permission[] }[]
  > {
    const rows = await this.request<unknown[]>("/admin/roles");
    return rows.map((value) => {
      const row = record(value);
      const id = role(row.id);
      if (id === "unassigned")
        throw new NexiAdminApiError(502, "Admin API returned an unknown role identifier");
      return {
        id,
        label: stringValue(row.label, id),
        description: stringValue(row.description),
        permissions: Array.isArray(row.permissions)
          ? row.permissions.map(permission).filter((p): p is Permission => !!p)
          : [],
      };
    });
  }
  updateRolePermission() {
    return this.unsupportedAuthority(
      "updateRolePermission",
      "role permissions are governed by the backend role definition authority",
    );
  }
  async listApprovals(): Promise<ApprovalRequest[]> {
    const rows = await this.request<unknown[]>("/admin/governance/commands");
    return rows.map((value) => {
      const row = record(value);
      const status = stringValue(row.status).toLowerCase();
      const requestedAt = stringValue(row.createdAt, new Date(0).toISOString());
      const payload = row.payload;
      return {
        id: stringValue(row.id),
        requestedBy: stringValue(row.requestedBy),
        requestedByRole: role(row.requestedByRole),
        requestedAt,
        action: stringValue(row.commandType),
        target: stringValue(row.target, stringValue(row.id)),
        targetId: stringValue(row.target, stringValue(row.id)),
        scope: scope(stringValue(row.commandType)),
        status:
          status === "approved" || status === "rejected" || status === "expired"
            ? status
            : "pending",
        reason: stringValue(row.reason),
        before: record(payload).before,
        after: record(payload).after,
        expiresAt: typeof row.expiresAt === "string" ? row.expiresAt : undefined,
        decidedBy: stringValue(row.approvedBy) || undefined,
        decidedAt: stringValue(row.approvedAt) || undefined,
        decisionReason: Array.isArray(row.approvals)
          ? stringValue(record(row.approvals[0]).reason) || undefined
          : undefined,
      };
    });
  }
  async decideApproval(
    id: string,
    decision: "approved" | "rejected",
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>(
      `/admin/governance/commands/${encodeURIComponent(id)}/${decision === "approved" ? "approve" : "reject"}`,
      { method: "POST", body: JSON.stringify({ reason: ctx.reason }) },
    );
    // The current backend returns the updated command, while its append-only
    // audit row is exposed by the audit query rather than as an auditId field.
    // Resolve the receipt link from that authoritative record instead of
    // inventing a success-shaped identifier in the adapter.
    const action = `GOVERNANCE_COMMAND_${decision === "approved" ? "APPROVED" : "REJECTED"}`;
    const audit = (await this.listAudit()).find(
      (entry) => entry.action === action && entry.target === id,
    );
    return { ok: true, auditId: audit?.id ?? stringValue(result.auditId) };
  }
  async listMaintenanceWindows(): Promise<MaintenanceWindow[]> {
    const rows = await this.request<unknown[]>("/admin/maintenance-windows");
    return rows.map((value) => {
      const row = record(value);
      return {
        id: stringValue(row.id),
        scope: stringValue(row.scope) as MaintenanceScope,
        target: stringValue(row.target),
        status: stringValue(row.status) as MaintenanceWindow["status"],
        scheduledAt: stringValue(row.scheduledAt),
        endsAt: stringValue(row.endsAt),
        reason: stringValue(row.reason),
        createdBy: stringValue(row.createdBy),
        createdAt: stringValue(row.createdAt),
        cancelledAt: typeof row.cancelledAt === "string" ? row.cancelledAt : undefined,
        cancelledBy: typeof row.cancelledBy === "string" ? row.cancelledBy : undefined,
        cancelReason: typeof row.cancelReason === "string" ? row.cancelReason : undefined,
        environment: stringValue(row.environment) as MaintenanceWindow["environment"],
        correlationId: typeof row.correlationId === "string" ? row.correlationId : null,
      };
    });
  }
  async scheduleMaintenanceWindow(
    payload: {
      scope: MaintenanceScope;
      target: string;
      scheduledAt: string;
      endsAt: string;
      reason: string;
    },
    ctx: ConsequentialContext,
  ): Promise<MutationResult> {
    const result = await this.request<JsonRecord>("/admin/maintenance-windows", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        environment: ctx.environment,
        idempotencyKey: `maintenance:${ctx.actor}:${payload.scope}:${payload.target}:${payload.scheduledAt}:${payload.endsAt}`,
      }),
    });
    const audit = (await this.listAudit()).find(
      (entry) =>
        entry.action === "MAINTENANCE_WINDOW_SCHEDULED" && entry.target === stringValue(result.id),
    );
    return { ok: true, auditId: audit?.id ?? stringValue(result.auditId) };
  }
  async cancelMaintenanceWindow(id: string, ctx: ConsequentialContext): Promise<MutationResult> {
    const result = await this.request<JsonRecord>(
      `/admin/maintenance-windows/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({ reason: ctx.reason, idempotencyKey: `maintenance-cancel:${id}` }),
      },
    );
    const audit = (await this.listAudit()).find(
      (entry) => entry.action === "MAINTENANCE_WINDOW_CANCELLED" && entry.target === id,
    );
    return { ok: true, auditId: audit?.id ?? stringValue(result.auditId) };
  }
  subscribe() {
    return () => {};
  }
}
