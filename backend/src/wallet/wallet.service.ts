import { BadRequestException, GoneException, Injectable, Optional } from "@nestjs/common";
import { LedgerType } from "../prisma/d1-client";
import { LedgerAuthorityService } from "../ledger/ledger-authority.service";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: D1PrismaService,
    private readonly ledgerAuthority: LedgerAuthorityService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  private legacyMutationDisabled(): never {
    throw new GoneException(
      "Legacy wallet mutation authority disabled; use Gate 2 financial operations or the future B7 domain authority",
    );
  }

  /**
   * Wallet balances, postings, activity, and currency availability are
   * authoritative reads.  A disabled/unavailable D1 bridge must not silently
   * fall back to the legacy Prisma store, which can otherwise present stale
   * or contradictory financial state.
   */
  private requireD1ReadAuthority(): D1FinancialCommandGateway {
    if (!this.d1?.isEnabled()) {
      throw new GoneException("Wallet D1 read authority unavailable");
    }
    return this.d1;
  }

  async createWallet(userId: string) {
    const d1 = this.requireD1ReadAuthority();
    await d1.ensureWallet(userId);
    return { userId };
  }

  async getBalance(userId: string, currency: string) {
    const d1 = this.requireD1ReadAuthority();
    const account = await d1.getAccountForUser(userId, currency);
    return d1.getBalance(account.id);
  }

  async getAllBalances(userId: string) {
    const d1 = this.requireD1ReadAuthority();
    const accounts = (await d1.listLedgerAccounts(userId)).filter(
      (account) => String(account.scope ?? "").toUpperCase() === "MAIN",
    );
    return Object.fromEntries(
      accounts.map((account) => [account.asset, this.balanceSummary(account)]),
    );
  }

  async getOverview(userId: string) {
    const d1 = this.requireD1ReadAuthority();
    const [accounts, currencies] = await Promise.all([
      d1.listLedgerAccounts(userId),
      d1.listCurrencies(),
    ]);
    return this.buildOverview(accounts, currencies);
  }

  private buildOverview(accounts: any[], currencies: any[]) {
    const byAsset = new Map<string, Record<string, any>>();
    currencies
      .map((currency) => {
        const asset = String(currency.symbol ?? "").trim().toUpperCase();
        return asset ? { asset, name: currency.name ?? asset, logo: currency.logo ?? null, scopes: {} } : null;
      })
      .filter(Boolean)
      .forEach((item: any) => byAsset.set(item.asset, item));
    accounts.forEach((account) => this.addOverviewAccount(byAsset, account));
    const assets = [...byAsset.entries()].map(([asset, item]) => ({
      ...item,
      asset,
      scopes: {
        ...item.scopes,
        MAIN: item.scopes.MAIN ?? { available: "0", locked: "0", total: "0", state: "NOT_OPENED", accountExists: false },
      },
    }));
    return {
      currencies: currencies.map((currency) => String(currency.symbol ?? "").toUpperCase()),
      assets: assets.sort((left, right) => left.asset.localeCompare(right.asset)),
    };
  }

  private addOverviewAccount(byAsset: Map<string, Record<string, any>>, account: any) {
    const asset = String(account.asset ?? "").trim().toUpperCase();
    if (!asset) return;
    const item = byAsset.get(asset) ?? { asset, name: asset, logo: null, scopes: {} };
    const scope = String(account.scope ?? "MAIN").toUpperCase();
    item.scopes[scope] = { ...this.balanceSummary(account), accountExists: true };
    byAsset.set(asset, item);
  }

  private balanceSummary(account: any) {
    const available = String(account.available ?? "0");
    const locked = String(account.locked ?? "0");
    return {
      available,
      locked,
      total: this.addDecimalStrings(available, locked),
      state: account.status,
    };
  }

  async getSupportedCurrencies() {
    return this.requireD1ReadAuthority().listCurrencies();
  }

  async deposit(
    userId: string,
    currency: string,
    amount: number,
    referenceId?: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async withdraw(
    userId: string,
    currency: string,
    amount: number,
    referenceId?: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async lockFunds(userId: string, currency: string, amount: number) {
    return this.legacyMutationDisabled();
  }

  async unlockFunds(userId: string, currency: string, amount: number) {
    return this.legacyMutationDisabled();
  }

  async deductLockedFunds(
    userId: string,
    currency: string,
    amount: number,
    type: LedgerType,
    refId: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async resolveLockedFunds(
    userId: string,
    currency: string,
    lockedAmount: number,
    profitAmount: number,
    type: LedgerType,
    refId: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async transferFunds(
    fromUserId: string,
    toUserId: string,
    currency: string,
    amount: number,
    referenceId: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async getLedger(userId: string) {
    const d1 = this.requireD1ReadAuthority();
    const postings = await d1.listUserPostings(userId);
    return postings.map((posting) => ({
      id: posting.id,
      walletId: posting.accountId,
      currency: posting.asset,
      amount: String(posting.amount ?? "0"),
      availableDelta: String(posting.availableDelta ?? "0"),
      lockedDelta: String(posting.lockedDelta ?? "0"),
      type: posting.kind,
      referenceId: posting.referenceId,
      idempotencyKey: posting.idempotencyKey,
      correlationId: posting.correlationId,
      createdAt: posting.createdAt,
    }));
  }

  async getActivity(
    userId: string,
    input: { limit?: string | number; cursor?: string; type?: string; asset?: string; status?: string } = {},
  ) {
    const d1 = this.requireD1ReadAuthority();
    const query = this.prepareActivityQuery(input);
    const page = d1.listUserActivityPage
      ? await d1.listUserActivityPage(userId, query)
      : { rows: await d1.listUserActivity(userId, query.limit), hasMore: false };
    const activities = page.rows.map((row: any) => this.toActivityReceipt(row));
    const last = page.rows.at(-1);
    return {
      activities,
      hasMore: page.hasMore,
      nextCursor: page.hasMore && last
        ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, id: last.id })).toString("base64url")
        : null,
    };
  }

  private prepareActivityQuery(input: {
    limit?: string | number;
    cursor?: string;
    type?: string;
    asset?: string;
    status?: string;
  }) {
    const cursor = input.cursor ? this.decodeActivityCursor(input.cursor) : undefined;
    return {
      limit: this.parseActivityLimit(input.limit),
      beforeCreatedAt: cursor?.createdAt,
      beforeId: cursor?.id,
      type: this.normalizeActivityFilter(input.type),
      asset: this.normalizeActivityAsset(input.asset),
      status: this.normalizeActivityFilter(input.status),
    };
  }

  private parseActivityLimit(value?: string | number) {
    const limit = value === undefined ? 50 : Number(value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException("Activity limit must be between 1 and 100");
    }
    return limit;
  }

  private normalizeActivityFilter(value?: string) {
    const normalized = value?.trim().toUpperCase() || undefined;
    if ((normalized?.length ?? 0) > 80) {
      throw new BadRequestException("Activity filter is invalid");
    }
    return normalized;
  }

  private normalizeActivityAsset(value?: string) {
    const asset = this.normalizeActivityFilter(value);
    if (asset && !/^[A-Z0-9]{2,24}$/.test(asset)) {
      throw new BadRequestException("Activity filter is invalid");
    }
    return asset;
  }

  private toActivityReceipt(row: any) {
    let relatedLedgerPostings: unknown[] = [];
    try {
      const raw = row.relatedLedgerPostings;
      relatedLedgerPostings = Array.isArray(raw) ? raw : typeof raw === "string" ? JSON.parse(raw) : [];
      if (!Array.isArray(relatedLedgerPostings)) relatedLedgerPostings = [];
    } catch {
      relatedLedgerPostings = [];
    }
    const { relatedLedgerPostings: _rawRelated, ...activity } = row;
    return {
      id: activity.id,
      type: activity.type,
      status: activity.status,
      referenceType: activity.referenceType,
      referenceId: activity.referenceId,
      ledgerCorrelationId: activity.ledgerCorrelationId,
      ledgerPostingId: activity.ledgerPostingId,
      relatedLedgerPostings,
      asset: activity.asset,
      amount: activity.amount == null ? null : String(activity.amount),
      details: activity.details,
      createdAt: activity.createdAt,
    };
  }

  private decodeActivityCursor(value: string): { createdAt: string; id: string } {
    try {
      if (value.length > 512) throw new Error("cursor too long");
      const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
      if (!this.isActivityCursor(parsed)) throw new Error("cursor shape invalid");
      return { createdAt: parsed.createdAt, id: parsed.id };
    } catch {
      throw new BadRequestException("Activity cursor is invalid");
    }
  }

  private isActivityCursor(value: any): value is { createdAt: string; id: string } {
    const { createdAt, id } = value ?? {};
    const validId = typeof id === "string" && Boolean(id.trim()) && id.length <= 200;
    return typeof createdAt === "string" && Number.isFinite(new Date(createdAt).getTime()) && validId;
  }

  async requestWithdrawal(
    userId: string,
    currency: string,
    amount: number,
    address: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async getPendingWithdrawals() {
    throw new GoneException(
      "Legacy wallet withdrawal read authority disabled; use Gate 2 financial operations",
    );
  }

  async approveWithdrawal(requestId: string, txHash: string) {
    return this.legacyMutationDisabled();
  }

  async rejectWithdrawal(requestId: string, _reason: string) {
    return this.legacyMutationDisabled();
  }

  private addDecimalStrings(left: string, right: string): string {
    const [leftWhole, leftFraction = ""] = left.split(".");
    const [rightWhole, rightFraction = ""] = right.split(".");
    const scale = Math.max(leftFraction.length, rightFraction.length);
    const leftInt = BigInt(
      `${leftWhole}${leftFraction.padEnd(scale, "0")}` || "0",
    );
    const rightInt = BigInt(
      `${rightWhole}${rightFraction.padEnd(scale, "0")}` || "0",
    );
    const sum = (leftInt + rightInt).toString().padStart(scale + 1, "0");
    if (scale === 0) return sum;
    return `${sum.slice(0, -scale)}.${sum.slice(-scale)}`
      .replace(/\.0+$/, "")
      .replace(/(\.[0-9]*?)0+$/, "$1");
  }
}
