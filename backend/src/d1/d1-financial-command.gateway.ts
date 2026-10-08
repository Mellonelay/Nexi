export type { D1DepositObservationCommand } from "./deposit-commands";
import { type DepositClaimSubmission, type D1DepositObservationCommand, depositClaimSubmissionStatements, depositClaimReviewStatements, depositClaimCreditStatements, assertDepositClaimReview, readDepositClaim, validateDepositClaimAmount, assertDepositClaimDestination } from "./deposit-commands";
import { findCommandByIdempotencyKey } from "./d1-command-queries";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../prisma/d1-client";
import { createHash, randomUUID } from "crypto";
import {
  LedgerMutationResult,
  LedgerPostingCommand,
  PairedTransferCommand,
} from "../authority/authority-interfaces";
import {
  D1BridgeBatchResult,
  D1BridgeParameter,
  D1BridgeBatchStatement,
  D1WorkerBridgeService,
} from "./d1-worker-bridge.service";

type D1AdminCurrencyCommand = {
  symbol: string;
  name: string;
  logo?: string;
  rate?: string | number;
  minDeposit?: string | number;
  maxDeposit?: string | number;
  minWithdrawal?: string | number;
  maxWithdrawal?: string | number;
  withdrawalFee?: string | number;
  depositEnabled?: boolean;
  withdrawEnabled?: boolean;
  confirmationCount?: number;
  decimals?: number;
  isActive?: boolean;
  adminId: string;
  reason: string;
  idempotencyKey: string;
};

type D1AdminMiningPlanCommand = {
  id: string;
  name: string;
  currency: string;
  lockupPeriod: number;
  dailyYield: string;
  minDeposit: string;
  maxDeposit: string;
  isActive: boolean;
  adminId: string;
  reason: string;
  idempotencyKey: string;
};

type D1AdminMiningPlanPayload = {
  name: string;
  currency: string;
  lockupPeriod: number;
  dailyYield: string;
  minDeposit: string;
  maxDeposit: string;
  isActive: boolean;
};

type D1AdminCurrencyPayload = {
  symbol: string;
  name: string;
  logo: string | null;
  rate: string;
  minDeposit: string;
  maxDeposit: string;
  minWithdrawal: string;
  maxWithdrawal: string;
  withdrawalFee: string;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  confirmationCount: number;
  decimals: number;
  isActive: boolean;
};

type LedgerAccountRow = {
  id: string;
  userId: string;
  asset: string;
  scope?: string;
  status: string;
  available: string;
  locked: string;
};

type LedgerIdempotencyRow = {
  id: string;
  operation: string;
  accountId: string | null;
  debitPostingId: string | null;
  creditPostingId: string | null;
};

type BatchResult = {
  success?: boolean;
  meta?: Record<string, unknown>;
};

export interface D1SpotOrderCommand {
  userId: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  side: string;
  type: string;
  amount: string;
  price: string | null;
  stopPrice: string | null;
  reserveAsset: string;
  reserveScope: string;
  reservedAmount: string;
  feeRate: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface D1SpotMatchCommand {
  pair: string;
}

export interface D1MarginAccountCommand {
  userId: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface D1BinaryOpenCommand {
  userId: string;
  pair: string;
  asset: string;
  side: string;
  stake: string;
  durationSeconds: number;
  expiresAt: string;
  entryPrice: string;
  entryQuoteId: string;
  entryProvider: string;
  entrySource: string;
  entryObservedAt: string;
  entryReceivedAt: string;
  entrySequence: string;
  quoteFreshnessMs: number;
  configurationVersion: number;
  idempotencyKey: string;
  correlationId: string;
}

export interface D1BinarySettleCommand {
  positionId: string;
  userId: string;
  asset: string;
  stake: string;
  payout: string;
  state: string;
  expiryPrice: string;
  expiryQuoteId: string;
  expiryProvider: string;
  expirySource: string;
  expiryObservedAt: string;
  expiryReceivedAt: string;
  expirySequence: string;
  realizedProfit: string;
  idempotencyKey: string;
  correlationId: string;
}

export interface D1WithdrawalCreateCommand {
  userId: string;
  asset: string;
  network: string;
  address: string;
  amount: string;
  fee: string;
  reservedAmount: string;
  requestKey: string;
  reserveKey: string;
  providerState: string;
}

export type D1MarketPairRow = {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
};

export type D1MarketQuoteRow = {
  id: string;
  pairId: string;
  symbol: string;
  provider: string;
  source: string;
  sequence: string;
  price: string;
  state: string;
  observedAt: string;
  receivedAt: string;
  freshnessMs: number;
};

export type D1AuthSessionRow = {
  id: string;
  userId: string;
  surface: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  createdAt: string;
  lastUsedAt: string;
  absoluteExpiresAt: string;
  idleExpiresAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  replacedById: string | null;
  userAgentHash: string | null;
  ipHash: string | null;
};

/**
 * Native D1 command boundary for financial mutations.
 *
 * The Prisma D1 adapter is suitable for ordinary ORM access, but a remote
 * Container -> Worker adapter cannot make a Prisma `$transaction()` atomic.
 * This gateway therefore sends one D1 `batch()` for each consequential
 * command. Exact monetary values remain decimal strings, and every state
 * transition is guarded by the values read before the batch.
 */
@Injectable()
export class D1FinancialCommandGateway {
  constructor(private readonly bridge: D1WorkerBridgeService) {}

  isEnabled(): boolean {
    return process.env.D1_RUNTIME_ENABLED === "true" && this.bridge.isEnabled();
  }

  async ensureAccount(
    userId: string,
    assetValue: string,
    scope = "MAIN",
  ): Promise<{ id: string; asset: string }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const asset = this.normalizeAsset(assetValue);
    const id = randomUUID();
    await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerAccount" ("id", "userId", "asset", "scope", "status", "available", "locked", "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, 'ACTIVE', '0', '0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        params: [id, userId, asset, scope],
      },
    ]);
    return this.findAccountForUser(userId, asset, scope);
  }

  async getAccountForUser(
    userId: string,
    assetValue: string,
    scope = "MAIN",
  ): Promise<{ id: string; asset: string }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const asset = this.normalizeAsset(assetValue);
    const existing = await this.findAccountForUserOrNull(userId, asset, scope);
    return existing ?? this.ensureAccount(userId, asset, scope);
  }

  async getBalance(
    accountId: string,
  ): Promise<{ available: string; locked: string }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const account = await this.findAccount(accountId);
    return {
      available: this.nonNegativeDecimal(account.available).toString(),
      locked: this.nonNegativeDecimal(account.locked).toString(),
    };
  }

  async getPostings(accountId: string): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "LedgerPosting" WHERE "accountId" = ? ORDER BY "createdAt" DESC`,
      [accountId],
    );
    return result.results;
  }

  async getInternalTransfer(
    idempotencyKey: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2InternalTransfer" WHERE "idempotencyKey" = ? LIMIT 1`,
      [idempotencyKey],
    );
    return result.results[0] ?? null;
  }

  async listUserAuthSessions(
    userId: string,
    surface: string,
  ): Promise<D1AuthSessionRow[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<D1AuthSessionRow>(
      `SELECT "id","userId","surface","tokenFamilyId","refreshTokenHash","createdAt","lastUsedAt","absoluteExpiresAt","idleExpiresAt","revokedAt","revokeReason","replacedById","userAgentHash","ipHash" FROM "AuthSession" WHERE "userId"=? AND "surface"=? ORDER BY "lastUsedAt" DESC LIMIT 100`,
      [userId, surface],
    );
    return result.results;
  }

  async getAuthSessionById(
    sessionId: string,
  ): Promise<D1AuthSessionRow | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<D1AuthSessionRow>(
      `SELECT "id","userId","surface","tokenFamilyId","refreshTokenHash","createdAt","lastUsedAt","absoluteExpiresAt","idleExpiresAt","revokedAt","revokeReason","replacedById","userAgentHash","ipHash" FROM "AuthSession" WHERE "id"=? LIMIT 1`,
      [sessionId],
    );
    return result.results[0] ?? null;
  }

  async getAuthSessionByHash(
    refreshTokenHash: string,
  ): Promise<D1AuthSessionRow | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<D1AuthSessionRow>(
      `SELECT "id","userId","surface","tokenFamilyId","refreshTokenHash","createdAt","lastUsedAt","absoluteExpiresAt","idleExpiresAt","revokedAt","revokeReason","replacedById","userAgentHash","ipHash" FROM "AuthSession" WHERE "refreshTokenHash"=? LIMIT 1`,
      [refreshTokenHash],
    );
    return result.results[0] ?? null;
  }

  async getUserByWallet(
    address: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT u.*,wi."address" AS "walletAddress",wi."chainId" AS "walletChainId",k."status" AS "kycStatus" FROM "User" u JOIN "WalletIdentity" wi ON wi."userId"=u."id" LEFT JOIN "KYC" k ON k."userId"=u."id" WHERE wi."address"=? LIMIT 1`,
      [address.toLowerCase()],
    );
    return result.results[0] ?? null;
  }

  async getUserById(userId: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT u.*,wi."address" AS "walletAddress",wi."chainId" AS "walletChainId",k."status" AS "kycStatus" FROM "User" u LEFT JOIN "WalletIdentity" wi ON wi."userId"=u."id" LEFT JOIN "KYC" k ON k."userId"=u."id" WHERE u."id"=? LIMIT 1`,
      [userId],
    );
    return result.results[0] ?? null;
  }

  async getUserByUserCode(
    userCode: number,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","userCode","email","displayName","role" FROM "User" WHERE "userCode"=? LIMIT 1`,
      [userCode],
    );
    return result.results[0] ?? null;
  }

  async updateUserProfile(
    userId: string,
    patch: { displayName?: string; email?: string },
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const assignments: string[] = [];
    const params: D1BridgeParameter[] = [];
    if (patch.displayName !== undefined) {
      assignments.push(`"displayName"=?`);
      params.push(patch.displayName.trim());
    }
    if (patch.email !== undefined) {
      assignments.push(`"email"=?`);
      params.push(patch.email.trim().toLowerCase());
    }
    if (assignments.length > 0) {
      assignments.push(`"updatedAt"=CURRENT_TIMESTAMP`);
      params.push(userId);
      await this.bridge.batch([
        {
          sql: `UPDATE "User" SET ${assignments.join(",")} WHERE "id"=?`,
          params,
        },
      ]);
    }
    const row = await this.getUserById(userId);
    if (!row) throw new NotFoundException("User not found");
    return row;
  }

  async getUserPreference(userId: string): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "UserPreference" WHERE "userId"=? LIMIT 1`,
      [userId],
    );
    return (
      result.results[0] ?? {
        userId,
        locale: "en",
        timezone: "UTC",
        theme: "dark",
        notificationSettings: null,
        tradingSettings: null,
      }
    );
  }

  async updateUserPreference(
    userId: string,
    patch: {
      locale?: string;
      timezone?: string;
      theme?: string;
      notificationSettings?: Record<string, boolean>;
      tradingSettings?: Record<string, unknown>;
    },
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const current = await this.getUserPreference(userId);
    const locale = patch.locale ?? String(current.locale ?? "en");
    const timezone = patch.timezone ?? String(current.timezone ?? "UTC");
    const theme = patch.theme ?? String(current.theme ?? "dark");
    const serialize = (value: unknown): D1BridgeParameter => {
      if (value === null || value === undefined) return null;
      return typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
        ? value
        : JSON.stringify(value);
    };
    const notificationSettings =
      patch.notificationSettings === undefined
        ? serialize(current.notificationSettings)
        : JSON.stringify(patch.notificationSettings);
    const tradingSettings =
      patch.tradingSettings === undefined
        ? serialize(current.tradingSettings)
        : JSON.stringify(patch.tradingSettings);
    await this.bridge.batch([
      {
        sql: `INSERT INTO "UserPreference" ("id","userId","locale","timezone","theme","notificationSettings","tradingSettings","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO UPDATE SET "locale"=excluded."locale","timezone"=excluded."timezone","theme"=excluded."theme","notificationSettings"=excluded."notificationSettings","tradingSettings"=excluded."tradingSettings","updatedAt"=CURRENT_TIMESTAMP`,
        params: [
          randomUUID(),
          userId,
          locale,
          timezone,
          theme,
          notificationSettings,
          tradingSettings,
        ],
      },
    ]);
    return this.getUserPreference(userId);
  }

  async createWalletUser(command: {
    userId: string;
    userCode: number;
    address: string;
    chainId: number;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "User" ("id","userCode","role","forceOutcome","createdAt","updatedAt","lastActive") VALUES (?,?, 'USER','NORMAL',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [command.userId, command.userCode],
      },
      {
        sql: `INSERT OR IGNORE INTO "WalletIdentity" ("id","userId","address","chainId","createdAt","updatedAt") SELECT ?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "User" WHERE "id"=?)`,
        params: [
          randomUUID(),
          command.userId,
          command.address.toLowerCase(),
          command.chainId,
          command.userId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","frozenBalance","balances","createdAt","updatedAt") SELECT ?,?,'0','0','{}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "User" WHERE "id"=?)`,
        params: [randomUUID(), command.userId, command.userId],
      },
    ]);
    if (!(result.results[0] as BatchResult | undefined)?.success)
      throw new BadRequestException("D1 wallet user could not be created");
    const user = await this.getUserByWallet(command.address);
    if (!user)
      throw new BadRequestException("D1 wallet identity was not materialized");
    return user;
  }

  async ensureWallet(userId: string): Promise<void> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","frozenBalance","balances","createdAt","updatedAt") VALUES (?,?, '0','0','{}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [randomUUID(), userId],
      },
    ]);
    if (!(result.results[0] as BatchResult | undefined)?.success)
      throw new BadRequestException("D1 wallet could not be materialized");
  }

  async createAuthSession(command: {
    id: string;
    userId: string;
    surface: string;
    tokenFamilyId: string;
    refreshTokenHash: string;
    createdAt: string;
    lastUsedAt: string;
    absoluteExpiresAt: string;
    idleExpiresAt: string;
    userAgentHash: string | null;
    ipHash: string | null;
  }): Promise<D1AuthSessionRow> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "AuthSession" ("id","userId","surface","tokenFamilyId","refreshTokenHash","createdAt","lastUsedAt","absoluteExpiresAt","idleExpiresAt","userAgentHash","ipHash") VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        params: [
          command.id,
          command.userId,
          command.surface,
          command.tokenFamilyId,
          command.refreshTokenHash,
          command.createdAt,
          command.lastUsedAt,
          command.absoluteExpiresAt,
          command.idleExpiresAt,
          command.userAgentHash,
          command.ipHash,
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 auth session creation");
    const row = await this.getAuthSessionByHash(command.refreshTokenHash);
    if (!row)
      throw new BadRequestException("D1 auth session was not materialized");
    return row;
  }

  async rotateAuthSession(
    currentId: string,
    replacement: {
      id: string;
      userId: string;
      surface: string;
      tokenFamilyId: string;
      refreshTokenHash: string;
      createdAt: string;
      lastUsedAt: string;
      absoluteExpiresAt: string;
      idleExpiresAt: string;
      userAgentHash: string | null;
      ipHash: string | null;
    },
    now: string,
  ): Promise<D1AuthSessionRow> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "AuthSession" SET "revokedAt"=? ,"revokeReason"='ROTATED',"replacedById"=? ,"lastUsedAt"=? WHERE "id"=? AND "revokedAt" IS NULL`,
        params: [now, replacement.id, now, currentId],
      },
      {
        sql: `INSERT INTO "AuthSession" ("id","userId","surface","tokenFamilyId","refreshTokenHash","createdAt","lastUsedAt","absoluteExpiresAt","idleExpiresAt","userAgentHash","ipHash") SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE changes()=1`,
        params: [
          replacement.id,
          replacement.userId,
          replacement.surface,
          replacement.tokenFamilyId,
          replacement.refreshTokenHash,
          replacement.createdAt,
          replacement.lastUsedAt,
          replacement.absoluteExpiresAt,
          replacement.idleExpiresAt,
          replacement.userAgentHash,
          replacement.ipHash,
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 auth session rotation");
    this.requireChanges(result, 1, "D1 auth successor creation");
    const row = await this.getAuthSessionByHash(replacement.refreshTokenHash);
    if (!row)
      throw new BadRequestException(
        "D1 rotated auth session was not materialized",
      );
    return row;
  }

  async revokeAuthSession(
    userId: string,
    surface: string,
    sessionId: string,
    reason: string,
    now: string,
  ): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "AuthSession" SET "revokedAt"=? ,"revokeReason"=? WHERE "id"=? AND "userId"=? AND "surface"=? AND "revokedAt" IS NULL`,
        params: [now, reason, sessionId, userId, surface],
      },
    ]);
    return (
      Number(
        (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
      ) > 0
    );
  }

  async revokeAllAuthSessions(
    userId: string,
    surface: string,
    now: string,
  ): Promise<number> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "AuthSession" SET "revokedAt"=? ,"revokeReason"='LOGOUT_ALL' WHERE "userId"=? AND "surface"=? AND "revokedAt" IS NULL`,
        params: [now, userId, surface],
      },
    ]);
    return Number(
      (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
    );
  }

  async getConversionQuoteByKey(quoteKey: string): Promise<any> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2ConversionQuote" WHERE "quoteKey"=? LIMIT 1`,
      [quoteKey],
    );
    return result.results[0] ?? null;
  }

  async getConversionQuoteById(quoteId: string): Promise<any> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2ConversionQuote" WHERE "id"=? LIMIT 1`,
      [quoteId],
    );
    return result.results[0] ?? null;
  }

  async createConversionQuote(command: {
    id: string;
    userId: string;
    fromAsset: string;
    toAsset: string;
    inputAmount: string;
    rate: string;
    outputAmount: string;
    provider: string;
    source: string;
    evidenceId: string;
    configurationVersion: number;
    expiresAt: string;
    quoteKey: string;
  }): Promise<any> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "Gate2ConversionQuote"
        ("id","userId","fromAsset","toAsset","inputAmount","rate","outputAmount","provider","source","evidenceId","configurationVersion","expiresAt","state","quoteKey","createdAt","updatedAt")
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'OPEN',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          command.id,
          command.userId,
          this.normalizeAsset(command.fromAsset),
          this.normalizeAsset(command.toAsset),
          command.inputAmount,
          command.rate,
          command.outputAmount,
          command.provider,
          command.source,
          command.evidenceId,
          command.configurationVersion,
          command.expiresAt,
          command.quoteKey,
        ],
      },
    ]);
    const quote = await this.getConversionQuoteByKey(command.quoteKey);
    if (!quote)
      throw new BadRequestException("D1 conversion quote was not materialized");
    return quote;
  }

  async expireConversionQuote(quoteId: string, userId: string): Promise<any> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    await this.bridge.batch([
      {
        sql: `UPDATE "Gate2ConversionQuote" SET "state"='EXPIRED',"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "userId"=? AND "state"='OPEN'`,
        params: [quoteId, userId],
      },
    ]);
    return this.getConversionQuoteById(quoteId);
  }

  async acceptConversion(command: {
    quoteId: string;
    userId: string;
    acceptanceKey: string;
    fromAsset: string;
    toAsset: string;
    inputAmount: string;
    outputAmount: string;
  }): Promise<any> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const quote = await this.getConversionQuoteById(command.quoteId);
    if (!quote || String(quote.userId) !== command.userId)
      throw new NotFoundException("Conversion quote not found");
    if (String(quote.state) !== "OPEN")
      throw new BadRequestException("Conversion quote is not open");
    if (
      String(quote.fromAsset).toUpperCase() !==
        this.normalizeAsset(command.fromAsset) ||
      String(quote.toAsset).toUpperCase() !==
        this.normalizeAsset(command.toAsset)
    ) {
      throw new BadRequestException("Conversion quote assets do not match");
    }

    const from = await this.getAccountForUser(
      command.userId,
      command.fromAsset,
    );
    const to = await this.getAccountForUser(command.userId, command.toAsset);
    if (from.id === to.id)
      throw new BadRequestException("Conversion accounts must differ");
    const fromRow = await this.findAccount(from.id);
    const toRow = await this.findAccount(to.id);
    const inputAmount = this.decimal(command.inputAmount);
    const outputAmount = this.decimal(command.outputAmount);
    const fromAvailable = this.nonNegativeDecimal(fromRow.available);
    const toAvailable = this.nonNegativeDecimal(toRow.available);
    if (fromAvailable.lt(inputAmount))
      throw new BadRequestException("Insufficient available funds");

    const reference = `gate2:conversion:${command.quoteId}`;
    const debitKey = `${reference}:debit`;
    const creditKey = `${reference}:credit`;
    const debitIdemId = randomUUID();
    const creditIdemId = randomUUID();
    const debitPostingId = randomUUID();
    const creditPostingId = randomUUID();
    const correlationId = reference;
    const fromAsset = this.normalizeAsset(command.fromAsset);
    const toAsset = this.normalizeAsset(command.toAsset);
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt")
          SELECT ?,?,'DEBIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?)
            AND EXISTS (SELECT 1 FROM "Gate2ConversionQuote" WHERE "id"=? AND "userId"=? AND "state"='OPEN' AND "acceptanceKey" IS NULL)`,
        params: [
          debitIdemId,
          debitKey,
          from.id,
          debitKey,
          command.quoteId,
          command.userId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt")
          SELECT ?,?,'CREDIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?)
            AND EXISTS (SELECT 1 FROM "Gate2ConversionQuote" WHERE "id"=? AND "userId"=? AND "state"='OPEN' AND "acceptanceKey" IS NULL)`,
        params: [
          creditIdemId,
          creditKey,
          to.id,
          creditKey,
          command.quoteId,
          command.userId,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=?,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=? AND "asset"=? AND "scope"='MAIN' AND "status"='ACTIVE'
            AND "available"=? AND "locked"=?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "idempotencyKey"=? AND "debitPostingId" IS NULL)
            AND EXISTS (SELECT 1 FROM "Gate2ConversionQuote" WHERE "id"=? AND "userId"=? AND "state"='OPEN' AND "acceptanceKey" IS NULL)`,
        params: [
          fromAvailable.minus(inputAmount).toString(),
          from.id,
          fromAsset,
          fromRow.available,
          fromRow.locked,
          debitIdemId,
          debitKey,
          command.quoteId,
          command.userId,
        ],
      },
      this.rollbackIfNoChanges(debitKey, "CONVERSION_DEBIT_ACCOUNT"),
      {
        sql: `UPDATE "LedgerAccount" SET "available"=?,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=? AND "asset"=? AND "scope"='MAIN' AND "status"='ACTIVE'
            AND "available"=? AND "locked"=?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "idempotencyKey"=? AND "creditPostingId" IS NULL)
            AND EXISTS (SELECT 1 FROM "Gate2ConversionQuote" WHERE "id"=? AND "userId"=? AND "state"='OPEN' AND "acceptanceKey" IS NULL)`,
        params: [
          toAvailable.plus(outputAmount).toString(),
          to.id,
          toAsset,
          toRow.available,
          toRow.locked,
          creditIdemId,
          creditKey,
          command.quoteId,
          command.userId,
        ],
      },
      this.rollbackIfNoChanges(creditKey, "CONVERSION_CREDIT_ACCOUNT"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata")
          SELECT ?,?,?, 'DEBIT',?,?, '0','GATE2_CONVERSION_DEBIT',?,?,?, ?,CURRENT_TIMESTAMP,?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          debitPostingId,
          from.id,
          fromAsset,
          inputAmount.toString(),
          inputAmount.negated().toString(),
          command.quoteId,
          command.quoteId,
          debitKey,
          correlationId,
          command.quoteId,
          JSON.stringify({ toAsset, outputAmount: outputAmount.toString() }),
          debitIdemId,
          debitKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=?,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=? AND "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [debitPostingId, debitIdemId, debitKey, debitPostingId],
      },
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata")
          SELECT ?,?,?, 'CREDIT',?,?, '0','GATE2_CONVERSION_CREDIT',?,?,?, ?,CURRENT_TIMESTAMP,?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "idempotencyKey"=? AND "creditPostingId" IS NULL)`,
        params: [
          creditPostingId,
          to.id,
          toAsset,
          outputAmount.toString(),
          outputAmount.toString(),
          command.quoteId,
          command.quoteId,
          creditKey,
          correlationId,
          command.quoteId,
          JSON.stringify({ fromAsset, inputAmount: inputAmount.toString() }),
          creditIdemId,
          creditKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "creditPostingId"=?,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=? AND "idempotencyKey"=? AND "creditPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [creditPostingId, creditIdemId, creditKey, creditPostingId],
      },
      this.auditStatement(
        from.id,
        debitPostingId,
        "CONVERSION_DEBIT_POSTED",
        debitKey,
        correlationId,
        "GATE2_CONVERSION_DEBIT",
        command.quoteId,
      ),
      this.auditStatement(
        to.id,
        creditPostingId,
        "CONVERSION_CREDIT_POSTED",
        creditKey,
        correlationId,
        "GATE2_CONVERSION_CREDIT",
        command.quoteId,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt")
          SELECT ?,?,'CONVERSION','COMPLETED','GATE2_CONVERSION',?,?,?,?,?,?,?,CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "creditPostingId"=?)`,
        params: [
          randomUUID(),
          command.userId,
          command.quoteId,
          command.acceptanceKey,
          correlationId,
          debitPostingId,
          fromAsset,
          inputAmount.toString(),
          JSON.stringify({
            toAsset,
            outputAmount: outputAmount.toString(),
            debitPostingId,
            creditPostingId,
          }),
          debitIdemId,
          debitPostingId,
          creditIdemId,
          creditPostingId,
        ],
      },
      {
        sql: `INSERT INTO "Gate2OperationAudit" ("id","userId","operationType","operationId","eventType","idempotencyKey","details","createdAt")
          SELECT ?,?,'CONVERSION',?,'CONVERSION_SETTLED',?,?,CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "creditPostingId"=?)`,
        params: [
          randomUUID(),
          command.userId,
          command.quoteId,
          command.acceptanceKey,
          JSON.stringify({
            inputAmount: inputAmount.toString(),
            outputAmount: outputAmount.toString(),
            fromAsset,
            toAsset,
            debitPostingId,
            creditPostingId,
          }),
          debitIdemId,
          debitPostingId,
          creditIdemId,
          creditPostingId,
        ],
      },
      {
        sql: `UPDATE "Gate2ConversionQuote" SET "state"='ACCEPTED',"acceptanceKey"=?,"conversionRef"=?,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=? AND "userId"=? AND "state"='OPEN' AND "acceptanceKey" IS NULL`,
        params: [
          command.acceptanceKey,
          reference,
          command.quoteId,
          command.userId,
        ],
      },
      this.rollbackIfNoChanges(
        command.acceptanceKey,
        "CONVERSION_QUOTE_ACCEPT",
      ),
    ];

    statements.push(
      this.eventOutboxStatement({
        idempotencyKey: `event:conversion:accept:${command.quoteId}:${command.acceptanceKey}`,
        aggregateType: "CONVERSION",
        aggregateId: command.quoteId,
        eventType: "CONVERSION_ACCEPTED",
        correlationId: correlationId,
        payload: {
          userId: command.userId,
          fromAsset,
          toAsset,
          inputAmount: inputAmount.toString(),
          outputAmount: outputAmount.toString(),
        },
      }),
    );
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 2, "D1 conversion debit account transition");
    this.requireChanges(result, 4, "D1 conversion credit account transition");
    this.requireChanges(result, 6, "D1 conversion debit posting");
    this.requireChanges(result, 7, "D1 conversion debit idempotency");
    this.requireChanges(result, 8, "D1 conversion credit posting");
    this.requireChanges(result, 9, "D1 conversion credit idempotency");
    this.requireChanges(result, 14, "D1 conversion quote acceptance");
    const accepted = await this.getConversionQuoteById(command.quoteId);
    if (!accepted || String(accepted.state) !== "ACCEPTED")
      throw new BadRequestException("D1 conversion quote was not accepted");
    return accepted;
  }

  async getActiveMarketPair(
    symbolValue: string,
  ): Promise<D1MarketPairRow | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const symbol = symbolValue
      .trim()
      .toUpperCase()
      .replaceAll("/", "")
      .replaceAll(".", "");
    const result = await this.bridge.select<D1MarketPairRow>(
      `SELECT p."id",p."symbol",base."symbol" AS "baseAsset",quote."symbol" AS "quoteAsset"
       FROM "MarketPair" p
       JOIN "MarketAsset" base ON base."id"=p."baseAssetId"
       JOIN "MarketAsset" quote ON quote."id"=p."quoteAssetId"
       WHERE p."symbol"=? AND p."status"='ACTIVE' AND base."status"='ACTIVE' AND quote."status"='ACTIVE'
         AND (SELECT COUNT(*) FROM "MarketAssetCapability" c WHERE c."assetId" IN (p."baseAssetId",p."quoteAssetId") AND c."status"='ACTIVE' AND c."tradingEnabled"=1)=2
       LIMIT 1`,
      [symbol],
    );
    return result.results[0] ?? null;
  }

  async getLiveMarketQuote(
    pairId: string,
    minimumObservedAt?: string,
    minimumSequence?: string,
  ): Promise<D1MarketQuoteRow | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT q."id",q."pairId",q."symbol",q."provider",q."source",q."sequence",q."price",q."state",q."observedAt",q."receivedAt"
       FROM "MarketQuoteLatest" q WHERE q."pairId"=? AND q."state"='LIVE' AND q."price" IS NOT NULL
         AND q."observedAt" IS NOT NULL
         AND (? IS NULL OR q."observedAt">=?)
         AND (? IS NULL OR CAST(q."sequence" AS INTEGER)>CAST(? AS INTEGER)) LIMIT 1`,
      [
        pairId,
        minimumObservedAt ?? null,
        minimumObservedAt ?? null,
        minimumSequence ?? null,
        minimumSequence ?? null,
      ],
    );
    const row = result.results[0];
    if (!row) return null;
    const receivedAt = new Date(String(row.receivedAt));
    const observedAt = new Date(String(row.observedAt));
    // Recent delivery cannot make an old provider observation fresh.
    const freshnessMs = Date.now() - Math.min(receivedAt.getTime(), observedAt.getTime());
    const staleAfterMs = Number(
      process.env.NEXI_MARKET_STALE_AFTER_MS ?? 30_000,
    );
    if (
      !Number.isFinite(receivedAt.getTime()) ||
      !Number.isFinite(observedAt.getTime()) ||
      freshnessMs > staleAfterMs
    )
      return null;
    return {
      id: String(row.id),
      pairId: String(row.pairId),
      symbol: String(row.symbol),
      provider: String(row.provider),
      source: String(row.source),
      sequence: String(row.sequence),
      price: String(row.price),
      state: String(row.state),
      observedAt: observedAt.toISOString(),
      receivedAt: receivedAt.toISOString(),
      freshnessMs,
    };
  }

  async getBinaryConfiguration(
    pair: string,
    durationSeconds: number,
    version?: number, includeDisabled = false,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2BinaryConfiguration" WHERE "pair"=? AND "durationSeconds"=? ${version === undefined ? `${includeDisabled ? '' : 'AND "enabled"=1'} ORDER BY "version" DESC` : 'AND "version"=?'} LIMIT 1`,
      version === undefined
        ? [pair, durationSeconds]
        : [pair, durationSeconds, version],
    );
    return result.results[0] ?? null;
  }

  async getSystemConfigValue(key: string): Promise<string | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<{ value: string }>(
      `SELECT "value" FROM "SystemConfig" WHERE "key"=? LIMIT 1`,
      [key],
    );
    return result.results[0]?.value ?? null;
  }

  async hasAssetCapability(
    assetValue: string,
    networkValue: string,
    operation: "deposit" | "withdraw",
  ): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const column =
      operation === "deposit" ? "depositEnabled" : "withdrawEnabled";
    const result = await this.bridge.select<{ id: string }>(
      `SELECT w."id" FROM "Currency" c JOIN "WalletNetwork" w ON w."currencyId"=c."id" WHERE c."symbol"=? AND c."isActive"=1 AND c."${column}"=1 AND w."code"=? AND w."isActive"=1 AND w."${column}"=1 LIMIT 1`,
      [this.normalizeAsset(assetValue), networkValue.trim().toUpperCase()],
    );
    return result.results.length === 1;
  }

  async ensureMarginAccount(command: D1MarginAccountCommand): Promise<{
    id: string;
    userId: string;
    pair: string;
    baseAsset: string;
    quoteAsset: string;
  }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const id = randomUUID();
    await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginAccount" ("id","userId","pair","baseAsset","quoteAsset","status","createdAt","updatedAt")
        VALUES (?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          id,
          command.userId,
          command.pair.trim().toUpperCase(),
          this.normalizeAsset(command.baseAsset),
          this.normalizeAsset(command.quoteAsset),
        ],
      },
    ]);
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","userId","pair","baseAsset","quoteAsset","status" FROM "SpotMarginAccount" WHERE "userId"=? AND "pair"=? LIMIT 1`,
      [command.userId, command.pair.trim().toUpperCase()],
    );
    const account = row.results[0];
    if (!account)
      throw new BadRequestException("D1 margin account could not be created");
    return {
      id: String(account.id),
      userId: String(account.userId),
      pair: String(account.pair),
      baseAsset: String(account.baseAsset),
      quoteAsset: String(account.quoteAsset),
    };
  }

  async getMarginPosition(
    positionId: string,
    userId?: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT p.*,a."userId" AS "accountUserId",a."pair" AS "accountPair",a."quoteAsset" AS "accountQuoteAsset" FROM "SpotMarginPosition" p JOIN "SpotMarginAccount" a ON a."id"=p."accountId" WHERE p."id"=? ${userId ? 'AND a."userId"=?' : ""} LIMIT 1`,
      userId ? [positionId, userId] : [positionId],
    );
    return result.results[0] ?? null;
  }

  async listMarginPositions(
    userId: string,
    status?: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT p.*,a."pair" AS "accountPair",a."baseAsset" AS "accountBaseAsset",a."quoteAsset" AS "accountQuoteAsset" FROM "SpotMarginPosition" p JOIN "SpotMarginAccount" a ON a."id"=p."accountId" WHERE a."userId"=?${status ? ' AND p."status"=?' : ""} ORDER BY p."openedAt" DESC`,
      status ? [userId, status] : [userId],
    );
    return result.results;
  }

  async getMarginAccount(
    userId: string,
    pair: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "SpotMarginAccount" WHERE "userId"=? AND "pair"=? LIMIT 1`,
      [userId, pair.trim().toUpperCase()],
    );
    return result.results[0] ?? null;
  }

  async listMarginActivities(
    userId: string,
    take = 50,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "SpotMarginActivity" WHERE "userId"=? ORDER BY "createdAt" DESC LIMIT ?`,
      [userId, Math.min(Math.max(take, 1), 100)],
    );
    return result.results;
  }

  async createMarginPosition(command: {
    positionId: string;
    accountId: string;
    userId: string;
    direction: string;
    leverage: number;
    collateral: string;
    quantity: string;
    entryPrice: string;
    markPrice: string;
    status: string;
    debtAsset: string;
    debtPrincipal: string;
    openIdempotencyKey: string;
    entryOrderId: string;
    pair: string;
    positionAsset: string;
    activityId: string;
    positionEventId: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginPosition" ("id","accountId","direction","leverage","collateral","quantity","entryPrice","markPrice","debtAsset","debtPrincipal","interestAccrued","realizedPnl","unrealizedPnl","status","openIdempotencyKey","entryOrderId","openedAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?, '0','0','0',?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          command.positionId,
          command.accountId,
          command.direction,
          command.leverage,
          command.collateral,
          command.quantity,
          command.entryPrice,
          command.markPrice,
          command.debtAsset,
          command.debtPrincipal,
          command.status,
          command.openIdempotencyKey,
          command.entryOrderId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginPositionEvent" ("id","positionId","type","asset","amount","price","idempotencyKey","metadata","createdAt") SELECT ?,?, 'OPEN', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "SpotMarginPosition" WHERE "id"=?)`,
        params: [
          command.positionEventId,
          command.positionId,
          command.positionAsset,
          command.quantity,
          command.entryPrice,
          `margin:event:open:${command.openIdempotencyKey}`,
          JSON.stringify({
            entryOrderId: command.entryOrderId,
            pair: command.pair,
          }),
          command.positionId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginActivity" ("id","userId","accountId","positionId","type","status","idempotencyKey","details","createdAt") SELECT ?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "SpotMarginPosition" WHERE "id"=?)`,
        params: [
          command.activityId,
          command.userId,
          command.accountId,
          command.positionId,
          "OPEN",
          "ACCEPTED",
          command.openIdempotencyKey,
          JSON.stringify({
            pair: command.pair,
            direction: command.direction,
            leverage: command.leverage,
            collateral: command.collateral,
            entryPrice: command.entryPrice,
            state:
              command.status === "OPEN" ? "OPEN" : "PENDING_SPOT_EXECUTION",
          }),
          command.positionId,
        ],
      },
    ]);
    const row = await this.getMarginPosition(command.positionId);
    if (!row)
      throw new BadRequestException("D1 margin position was not materialized");
    return row;
  }

  async markMarginPosition(
    positionId: string,
    userId: string,
    quoteId: string,
    markPrice: string,
    unrealizedPnl: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const activityKey = `margin:mark:${positionId}:${quoteId}`;
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "SpotMarginPosition" SET "markPrice"=? ,"unrealizedPnl"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='OPEN' AND EXISTS (SELECT 1 FROM "SpotMarginAccount" WHERE "id"="SpotMarginPosition"."accountId" AND "userId"=?)`,
        params: [markPrice, unrealizedPnl, positionId, userId],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginPositionEvent" ("id","positionId","type","price","amount","idempotencyKey","metadata","createdAt") SELECT ?,?,'MARK',?,?,?, ?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "SpotMarginPosition" WHERE "id"=? AND "status"='OPEN')`,
        params: [
          randomUUID(),
          positionId,
          markPrice,
          unrealizedPnl,
          `margin:event:mark:${positionId}:${quoteId}`,
          JSON.stringify({ quoteId }),
          positionId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginActivity" ("id","userId","positionId","type","status","idempotencyKey","details","createdAt") SELECT ?,?,'PNL','COMPLETED',?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "SpotMarginPosition" WHERE "id"=?)`,
        params: [
          randomUUID(),
          userId,
          activityKey,
          JSON.stringify({ quoteId, markPrice, unrealizedPnl }),
          positionId,
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 margin mark transition");
    const row = await this.getMarginPosition(positionId, userId);
    if (!row)
      throw new BadRequestException(
        "D1 marked margin position was not materialized",
      );
    return row;
  }

  async accrueMarginInterest(
    positionId: string,
    userId: string,
    interest: string,
    annualRate: string,
    elapsedSeconds: number,
    idempotencyKey: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const position = await this.getMarginPosition(positionId, userId);
    if (!position || String(position.status) !== "OPEN")
      throw new BadRequestException("Open margin position not found");
    const eventKey = `margin:event:interest:${idempotencyKey}`;
    const currentInterest = this.nonNegativeDecimal(
      String(position.interestAccrued ?? "0"),
    );
    const nextInterest = currentInterest.plus(this.decimal(interest));
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "SpotMarginPosition" SET "interestAccrued"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='OPEN' AND "interestAccrued"=?`,
        params: [
          nextInterest.toString(),
          positionId,
          String(position.interestAccrued ?? "0"),
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginPositionEvent" ("id","positionId","type","asset","amount","idempotencyKey","metadata","createdAt") SELECT ?,?,'INTEREST',?,?,?, ?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "SpotMarginPosition" WHERE "id"=? AND "status"='OPEN')`,
        params: [
          randomUUID(),
          positionId,
          String(position.debtAsset),
          interest,
          eventKey,
          JSON.stringify({ annualRate, elapsedSeconds }),
          positionId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginActivity" ("id","userId","accountId","positionId","type","status","idempotencyKey","details","createdAt") SELECT ?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "SpotMarginPosition" WHERE "id"=?)`,
        params: [
          randomUUID(),
          userId,
          String(position.accountId),
          positionId,
          "INTEREST",
          "COMPLETED",
          idempotencyKey,
          JSON.stringify({ interest, annualRate, elapsedSeconds }),
          positionId,
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 margin interest transition");
    const row = await this.getMarginPosition(positionId, userId);
    if (!row)
      throw new BadRequestException("D1 margin interest was not materialized");
    return {
      positionId,
      interest,
      activityId:
        (result.results[2] as BatchResult | undefined)?.meta?.last_row_id ??
        null,
      replayed: false,
      position: row,
    };
  }

  async markMarginClosing(
    positionId: string,
    userId: string,
    accountId: string,
    activityId: string,
    orderId: string,
    idempotencyKey: string,
    liquidation = false,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const type = liquidation ? "LIQUIDATION" : "CLOSE";
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "SpotMarginPosition" SET "status"='CLOSING',"closeOrderId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='OPEN'`,
        params: [orderId, positionId],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginActivity" ("id","userId","accountId","positionId","type","status","idempotencyKey","details","createdAt") SELECT ?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "SpotMarginPosition" WHERE "id"=?)`,
        params: [
          activityId,
          userId,
          accountId,
          positionId,
          type,
          "ACCEPTED",
          idempotencyKey,
          JSON.stringify({ state: "CLOSING", orderId }),
          positionId,
        ],
      },
    ]);
    if (
      Number(
        (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
      ) === 0
    ) {
      const existing = await this.bridge.select<Record<string, unknown>>(
        `SELECT * FROM "SpotMarginActivity" WHERE "idempotencyKey"=? LIMIT 1`,
        [idempotencyKey],
      );
      if (existing.results[0])
        return { ...existing.results[0], replayed: true };
      throw new BadRequestException("D1 margin close transition was rejected");
    }
    return {
      positionId,
      activityId,
      orderId,
      replayed: false,
      state: "CLOSING",
    };
  }

  async settleMarginClose(command: {
    positionId: string;
    userId: string;
    closeOrderId: string;
    state: "CLOSED" | "LIQUIDATED";
    markPrice: string;
    realizedPnl: string;
    repayment: string;
    debtAsset: string;
    activityId: string;
    idempotencyKey: string;
    correlationId: string;
    maintenanceRatio?: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const position = await this.getMarginPosition(
      command.positionId,
      command.userId,
    );
    if (!position || !["OPEN", "CLOSING"].includes(String(position.status)))
      throw new BadRequestException("Margin position is not settleable");
    const account = await this.getAccountForUser(
      command.userId,
      command.debtAsset,
      "MARGIN",
    );
    const current = await this.findAccount(account.id);
    const repayment = this.decimal(command.repayment);
    const available = this.nonNegativeDecimal(current.available);
    if (available.lt(repayment))
      throw new BadRequestException("Insufficient margin funds for repayment");
    const receipt = `margin:${command.state.toLowerCase()}:${command.positionId}:${command.idempotencyKey}`;
    const idemId = randomUUID();
    const postingId = randomUUID();
    const eventType =
      command.state === "LIQUIDATED" ? "LIQUIDATION" : "REPAYMENT";
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'DEBIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "asset"=? AND "scope"='MARGIN' AND "available"=? AND "locked"=?)`,
        params: [
          idemId,
          `${receipt}:debit`,
          account.id,
          `${receipt}:debit`,
          account.id,
          command.debtAsset,
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "scope"='MARGIN' AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          available.minus(repayment).toString(),
          account.id,
          command.debtAsset,
          current.available,
          current.locked,
          idemId,
        ],
      },
      this.rollbackIfNoChanges(`${receipt}:debit`, "MARGIN_CLOSE_DEBIT"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'DEBIT',?,?, '0',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          command.debtAsset,
          repayment.toString(),
          repayment.negated().toString(),
          `SPOT_MARGIN_${eventType}`,
          command.positionId,
          `${receipt}:debit`,
          command.correlationId,
          command.positionId,
          JSON.stringify({ state: command.state }),
          idemId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, idemId, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        `MARGIN_${eventType}_DEBIT_POSTED`,
        `${receipt}:debit`,
        command.correlationId,
        `SPOT_MARGIN_${eventType}`,
        command.positionId,
      ),
      {
        sql: `UPDATE "SpotMarginPosition" SET "status"=? ,"closeOrderId"=? ,"closedAt"=CURRENT_TIMESTAMP,"realizedPnl"=? ,"unrealizedPnl"='0',"markPrice"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status" IN ('OPEN','CLOSING')`,
        params: [
          command.state,
          command.closeOrderId,
          command.realizedPnl,
          command.markPrice,
          command.positionId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginPositionEvent" ("id","positionId","type","asset","amount","price","idempotencyKey","metadata","createdAt") VALUES (?,?,?,?,?,?,?, ?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.positionId,
          eventType,
          command.debtAsset,
          repayment.toString(),
          command.markPrice,
          `margin:event:${eventType.toLowerCase()}:${command.idempotencyKey}`,
          JSON.stringify({
            closeOrderId: command.closeOrderId,
            maintenanceRatio: command.maintenanceRatio ?? null,
          }),
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginPositionEvent" ("id","positionId","type","asset","amount","idempotencyKey","metadata","createdAt") VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.positionId,
          "COLLATERAL_RELEASE",
          String(position.accountQuoteAsset ?? ""),
          String(position.collateral),
          `margin:event:${eventType.toLowerCase()}-release:${command.idempotencyKey}`,
          JSON.stringify({ closeOrderId: command.closeOrderId }),
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "SpotMarginActivity" ("id","userId","accountId","positionId","type","status","idempotencyKey","details","createdAt") VALUES (?,?,?,?,?,'COMPLETED',?,?,CURRENT_TIMESTAMP)`,
        params: [
          command.activityId,
          command.userId,
          String(position.accountId),
          command.positionId,
          eventType,
          command.idempotencyKey,
          JSON.stringify({
            state: command.state,
            closeOrderId: command.closeOrderId,
            realizedPnl: command.realizedPnl,
            repayment: command.repayment,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:margin:settle:${command.positionId}:${command.idempotencyKey}`,
        aggregateType: "MARGIN_POSITION",
        aggregateId: command.positionId,
        eventType: `MARGIN_${command.state}`,
        correlationId: command.correlationId,
        payload: {
          userId: command.userId,
          state: command.state,
          realizedPnl: command.realizedPnl,
          repayment: command.repayment,
        },
      }),
    ]);
    this.requireChanges(result, 1, "D1 margin close debt transition");
    this.requireChanges(result, 3, "D1 margin close debt posting");
    this.requireChanges(result, 4, "D1 margin close idempotency");
    this.requireChanges(result, 7, "D1 margin position settlement");
    const row = await this.getMarginPosition(
      command.positionId,
      command.userId,
    );
    if (!row)
      throw new BadRequestException(
        "D1 margin settlement was not materialized",
      );
    return {
      ...row,
      positionId: command.positionId,
      activityId: command.activityId,
      closeOrderId: command.closeOrderId,
      replayed: false,
      state: command.state,
    };
  }

  async getMiningPlan(planId: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "MiningPlan" WHERE "id"=? LIMIT 1`,
      [planId],
    );
    return result.results[0] ?? null;
  }

  private eventOutboxStatement(command: {
    idempotencyKey: string;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    correlationId?: string | null;
    payload: Record<string, unknown>;
    guard?: { sql: string; params: D1BridgeParameter[] };
  }): D1BridgeBatchStatement {
    const prefix = `INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","attempts","createdAt","updatedAt")`;
    const values = `?,?,?,?,?,1,?,?,'PENDING',CURRENT_TIMESTAMP,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP`;
    return {
      sql: `${prefix} ${command.guard ? `SELECT ${values} WHERE ${command.guard.sql}` : `VALUES (${values})`}`,
      params: [
        randomUUID(),
        command.idempotencyKey,
        command.aggregateType,
        command.aggregateId,
        command.eventType,
        command.correlationId ?? command.aggregateId,
        JSON.stringify(command.payload),
        ...(command.guard?.params ?? []),
      ],
    };
  }

  async listMiningPlans(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "MiningPlan" WHERE "isActive"=1 ORDER BY "createdAt" DESC`,
    );
    return result.results;
  }

  async listAdminMiningPlans(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "MiningPlan" ORDER BY "lockupPeriod" ASC,"createdAt" DESC`,
    );
    return result.results;
  }

  private miningPlanPayload(command: D1AdminMiningPlanCommand): D1AdminMiningPlanPayload {
    return {
      name: command.name.trim(),
      currency: this.normalizeAsset(command.currency),
      lockupPeriod: command.lockupPeriod,
      dailyYield: command.dailyYield,
      minDeposit: command.minDeposit,
      maxDeposit: command.maxDeposit,
      isActive: command.isActive,
    };
  }

  private async findAdminMiningPlanReplay(
    action: "MINING_PLAN_CREATED" | "MINING_PLAN_UPDATED",
    command: D1AdminMiningPlanCommand,
    payload: D1AdminMiningPlanPayload,
  ): Promise<Record<string, unknown> | null> {
    const replay = await this.bridge.select<Record<string, unknown>>(
      `SELECT "adminId","target","details" FROM "AdminAuditLog" WHERE "action"=? AND json_extract("details",'$.idempotencyKey')=? ORDER BY "createdAt" DESC LIMIT 1`,
      [action, command.idempotencyKey],
    );
    const audit = replay.results[0];
    if (!audit) return null;
    let details: Record<string, unknown>;
    try {
      details = JSON.parse(String(audit.details ?? "{}")) as Record<string, unknown>;
    } catch {
      throw new BadRequestException("Mining plan idempotency record is invalid");
    }
    if (
      audit.adminId !== command.adminId ||
      details.reason !== command.reason ||
      JSON.stringify(details.payload) !== JSON.stringify(payload)
    ) {
      throw new BadRequestException("Mining plan idempotency key was already used");
    }
    const existing = await this.getMiningPlan(String(audit.target ?? command.id));
    if (!existing) throw new BadRequestException("Mining plan replay no longer resolves");
    return existing;
  }

  private miningPlanAdminAuditStatement(
    action: "MINING_PLAN_CREATED" | "MINING_PLAN_UPDATED",
    command: D1AdminMiningPlanCommand,
    payload: Record<string, unknown>,
  ): D1BridgeBatchStatement {
    return {
      sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,?, ?,?,CURRENT_TIMESTAMP WHERE changes()=1`,
      params: [
        randomUUID(),
        command.adminId,
        action,
        command.id,
        JSON.stringify({ reason: command.reason, idempotencyKey: command.idempotencyKey, payload }),
      ],
    };
  }

  private async replayOrThrowMiningPlanMutation(
    action: "MINING_PLAN_CREATED" | "MINING_PLAN_UPDATED",
    command: D1AdminMiningPlanCommand,
    payload: D1AdminMiningPlanPayload,
  ): Promise<Record<string, unknown>> {
    const replay = await this.findAdminMiningPlanReplay(action, command, payload);
    if (replay) return replay;
    if (action === "MINING_PLAN_CREATED") {
      throw new BadRequestException("Mining plan already exists or idempotency key is invalid");
    }
    throw new NotFoundException("Mining plan not found or idempotency key was invalid");
  }

  private async completeAdminMiningPlanMutation(
    action: "MINING_PLAN_CREATED" | "MINING_PLAN_UPDATED",
    command: D1AdminMiningPlanCommand,
    payload: D1AdminMiningPlanPayload,
    result: D1BridgeBatchResult,
  ): Promise<Record<string, unknown>> {
    if (Number(result.results[0]?.meta?.changes ?? 0) !== 1) {
      return this.replayOrThrowMiningPlanMutation(action, command, payload);
    }
    this.requireChanges(result, 1, `D1 mining plan ${action === "MINING_PLAN_CREATED" ? "creation" : "update"} audit`);
    this.requireChanges(result, 2, `D1 mining plan ${action === "MINING_PLAN_CREATED" ? "creation" : "update"} outbox`);
    const row = await this.getMiningPlan(command.id);
    if (!row) {
      const message = action === "MINING_PLAN_CREATED"
        ? "D1 mining plan was not materialized"
        : "D1 mining plan update was not materialized";
      throw new BadRequestException(message);
    }
    return row;
  }

  async createMiningPlan(command: D1AdminMiningPlanCommand): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const payload = this.miningPlanPayload(command);
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "MiningPlan" ("id","name","currency","lockupPeriod","dailyYield","dailyYieldDecimal","minDeposit","minDepositDecimal","maxDeposit","maxDepositDecimal","isActive","createdAt","updatedAt") SELECT ?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "AdminAuditLog" WHERE "action"='MINING_PLAN_CREATED' AND json_extract("details",'$.idempotencyKey')=?)`,
        params: [command.id,payload.name,payload.currency,payload.lockupPeriod,payload.dailyYield,payload.dailyYield,payload.minDeposit,payload.minDeposit,payload.maxDeposit,payload.maxDeposit,payload.isActive ? 1 : 0,command.idempotencyKey],
      },
      this.miningPlanAdminAuditStatement("MINING_PLAN_CREATED", command, payload),
      this.eventOutboxStatement({
        idempotencyKey: `event:mining-plan:create:${command.idempotencyKey}`,
        aggregateType: "MINING_PLAN",
        aggregateId: command.id,
        eventType: "MINING_PLAN_CREATED",
        correlationId: command.idempotencyKey,
        payload,
        guard: { sql: "changes()=1", params: [] },
      }),
    ]);
    return this.completeAdminMiningPlanMutation("MINING_PLAN_CREATED", command, payload, result);
  }

  async updateMiningPlan(command: D1AdminMiningPlanCommand): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const payload = this.miningPlanPayload(command);
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "MiningPlan" SET "name"=?,"currency"=?,"lockupPeriod"=?,"dailyYield"=?,"dailyYieldDecimal"=?,"minDeposit"=?,"minDepositDecimal"=?,"maxDeposit"=?,"maxDepositDecimal"=?,"isActive"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND NOT EXISTS (SELECT 1 FROM "AdminAuditLog" WHERE "action"='MINING_PLAN_UPDATED' AND json_extract("details",'$.idempotencyKey')=?)`,
        params: [payload.name,payload.currency,payload.lockupPeriod,payload.dailyYield,payload.dailyYield,payload.minDeposit,payload.minDeposit,payload.maxDeposit,payload.maxDeposit,payload.isActive ? 1 : 0,command.id,command.idempotencyKey],
      },
      this.miningPlanAdminAuditStatement("MINING_PLAN_UPDATED", command, payload),
      this.eventOutboxStatement({
        idempotencyKey: `event:mining-plan:update:${command.idempotencyKey}`,
        aggregateType: "MINING_PLAN",
        aggregateId: command.id,
        eventType: "MINING_PLAN_UPDATED",
        correlationId: command.idempotencyKey,
        payload,
        guard: { sql: "changes()=1", params: [] },
      }),
    ]);
    return this.completeAdminMiningPlanMutation("MINING_PLAN_UPDATED", command, payload, result);
  }

  async getMiningSubscription(
    subscriptionId: string,
    userId?: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT s.*,p."name" AS "planName",p."currency" AS "planCurrency",p."dailyYieldDecimal" AS "planDailyYieldDecimal",p."lockupPeriod" AS "planLockupPeriod" FROM "MiningSubscription" s JOIN "MiningPlan" p ON p."id"=s."planId" WHERE s."id"=?${userId ? ' AND s."userId"=?' : ""} LIMIT 1`,
      userId ? [subscriptionId, userId] : [subscriptionId],
    );
    return result.results[0] ?? null;
  }

  async listMiningSubscriptions(
    userId: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT s.*,p."name" AS "planName",p."currency" AS "planCurrency",p."dailyYieldDecimal" AS "planDailyYieldDecimal",p."lockupPeriod" AS "planLockupPeriod" FROM "MiningSubscription" s JOIN "MiningPlan" p ON p."id"=s."planId" WHERE s."userId"=? ORDER BY s."createdAt" DESC`,
      [userId],
    );
    return result.results;
  }

  async listMiningSubscriptionsForScheduler(): Promise<
    Record<string, unknown>[]
  > {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","userId","status","endDate" FROM "MiningSubscription" WHERE "status"='ACTIVE' ORDER BY "createdAt" ASC`,
    );
    return result.results;
  }

  async listAllMiningSubscriptions(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT s.*,p."name" AS "planName",p."currency" AS "planCurrency",p."dailyYieldDecimal" AS "planDailyYieldDecimal",p."lockupPeriod" AS "planLockupPeriod",u."email" AS "userEmail"
       FROM "MiningSubscription" s
       JOIN "MiningPlan" p ON p."id"=s."planId"
       JOIN "User" u ON u."id"=s."userId"
       ORDER BY s."createdAt" DESC"`,
    );
    return result.results;
  }

  async subscribeMining(command: {
    subscriptionId: string;
    userId: string;
    planId: string;
    amount: string;
    endDate: string;
    planSnapshot: Record<string, unknown>;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const plan: any = await this.getMiningPlan(command.planId);
    if (!plan || !plan.isActive)
      throw new NotFoundException("Mining plan not found");
    const existing = await this.getMiningSubscription(
      command.subscriptionId,
      command.userId,
    );
    if (existing) return existing;
    const account = await this.getAccountForUser(
      command.userId,
      String(plan.currency),
    );
    const current = await this.findAccount(account.id);
    const amount = this.decimal(command.amount);
    const idem = `mining-reserve:${command.subscriptionId}`;
    const ledgerId = randomUUID();
    const postingId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'RESERVE',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "asset"=? AND "available"=? AND "locked"=?)`,
        params: [
          ledgerId,
          idem,
          account.id,
          idem,
          account.id,
          String(plan.currency),
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"locked"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.available).minus(amount).toString(),
          this.nonNegativeDecimal(current.locked).plus(amount).toString(),
          account.id,
          current.available,
          current.locked,
          ledgerId,
        ],
      },
      this.rollbackIfNoChanges(idem, "MINING_RESERVE"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'RESERVE',?,?,?, 'MINING_SUBSCRIPTION',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(plan.currency),
          amount.toString(),
          amount.negated().toString(),
          amount.toString(),
          command.subscriptionId,
          idem,
          command.idempotencyKey,
          command.subscriptionId,
          JSON.stringify({ planId: command.planId }),
          ledgerId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "debitPostingId" IS NULL`,
        params: [postingId, ledgerId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "MINING_RESERVE_POSTED",
        idem,
        command.idempotencyKey,
        "MINING_SUBSCRIPTION",
        command.subscriptionId,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") SELECT ?,?,'MINING_SUBSCRIPTION','COMPLETED','MINING_SUBSCRIPTION',?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          randomUUID(),
          command.userId,
          command.subscriptionId,
          command.idempotencyKey,
          command.idempotencyKey,
          postingId,
          String(plan.currency),
          amount.toString(),
          JSON.stringify({ planId: command.planId }),
          ledgerId,
          postingId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "MiningSubscription" ("id","userId","planId","amount","amountDecimal","status","startDate","endDate","totalRewards","totalRewardsDecimal","planSnapshot","createdAt","updatedAt") SELECT ?,?,?,?,?,'ACTIVE',CURRENT_TIMESTAMP,?,'0','0',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          command.subscriptionId,
          command.userId,
          command.planId,
          amount.toString(),
          amount.toString(),
          command.endDate,
          JSON.stringify(command.planSnapshot),
          ledgerId,
          postingId,
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:mining:subscription:${command.subscriptionId}`,
        aggregateType: "MINING_SUBSCRIPTION",
        aggregateId: command.subscriptionId,
        eventType: "MINING_SUBSCRIPTION_OPENED",
        correlationId: command.idempotencyKey,
        payload: {
          userId: command.userId,
          planId: command.planId,
          amount: amount.toString(),
        },
      }),
    ]);
    this.requireChanges(result, 1, "D1 mining reservation");
    this.requireChanges(result, 3, "D1 mining reservation posting");
    this.requireChanges(result, 7, "D1 mining subscription");
    const row = await this.getMiningSubscription(
      command.subscriptionId,
      command.userId,
    );
    if (!row)
      throw new BadRequestException(
        "D1 mining subscription was not materialized",
      );
    return row;
  }

  async releaseMiningSubscription(
    subscriptionId: string,
    userId: string,
    idempotencyKey: string,
    status: "COMPLETED" | "CANCELLED",
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const subscription: any = await this.getMiningSubscription(
      subscriptionId,
      userId,
    );
    if (!subscription)
      throw new NotFoundException("Mining subscription not found");
    if (String(subscription.status) !== "ACTIVE") return subscription;
    const account = await this.getAccountForUser(
      userId,
      String(subscription.planCurrency),
    );
    const current = await this.findAccount(account.id);
    const amount = this.decimal(String(subscription.amountDecimal));
    const idem = `mining-release:${subscriptionId}:${idempotencyKey}`;
    const ledgerId = randomUUID();
    const postingId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'RELEASE',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "MiningSubscription" WHERE "id"=? AND "userId"=? AND "status"='ACTIVE') AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "locked"=? )`,
        params: [
          ledgerId,
          idem,
          account.id,
          idem,
          subscriptionId,
          userId,
          account.id,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"locked"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.available).plus(amount).toString(),
          this.nonNegativeDecimal(current.locked).minus(amount).toString(),
          account.id,
          current.available,
          current.locked,
          ledgerId,
        ],
      },
      this.rollbackIfNoChanges(idem, "MINING_RELEASE"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'RELEASE',?,?,?, 'MINING_REDEMPTION',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(subscription.planCurrency),
          amount.toString(),
          amount.toString(),
          amount.negated().toString(),
          subscriptionId,
          idem,
          idempotencyKey,
          subscriptionId,
          JSON.stringify({ status }),
          ledgerId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "debitPostingId" IS NULL`,
        params: [postingId, ledgerId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "MINING_RELEASE_POSTED",
        idem,
        idempotencyKey,
        "MINING_REDEMPTION",
        subscriptionId,
      ),
      {
        sql: `UPDATE "MiningSubscription" SET "status"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='ACTIVE'`,
        params: [status, subscriptionId],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:mining:release:${subscriptionId}:${idempotencyKey}`,
        aggregateType: "MINING_SUBSCRIPTION",
        aggregateId: subscriptionId,
        eventType:
          status === "COMPLETED" ? "MINING_REDEEMED" : "MINING_CANCELLED",
        correlationId: idempotencyKey,
        payload: { userId, status },
      }),
    ]);
    this.requireChanges(result, 1, "D1 mining release");
    this.requireChanges(result, 3, "D1 mining release posting");
    this.requireChanges(result, 6, "D1 mining subscription completion");
    const row = await this.getMiningSubscription(subscriptionId, userId);
    if (!row)
      throw new BadRequestException("D1 mining release was not materialized");
    return row;
  }

  async accrueMiningReward(
    subscriptionId: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const subscription: any = await this.getMiningSubscription(subscriptionId);
    if (!subscription || String(subscription.status) !== "ACTIVE")
      throw new NotFoundException("Active mining subscription not found");
    const principal = this.decimal(String(subscription.amountDecimal));
    const rate = this.decimal(String(subscription.planDailyYieldDecimal));
    const reward = principal.times(rate);
    const account = await this.getAccountForUser(
      String(subscription.userId),
      String(subscription.planCurrency),
    );
    const current = await this.findAccount(account.id);
    const key = `mining-reward:${subscription.id}:${subscription.lastRewardPaid ?? "initial"}`;
    const idemId = randomUUID();
    const postingId = randomUUID();
    const activityId = randomUUID();
    const accrualId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'CREDIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=?)`,
        params: [
          idemId,
          key,
          account.id,
          key,
          account.id,
          String(subscription.planCurrency),
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.available).plus(reward).toString(),
          account.id,
          String(subscription.planCurrency),
          current.available,
          current.locked,
          idemId,
        ],
      },
      this.rollbackIfNoChanges(key, "MINING_REWARD"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'CREDIT',?,?,?, 'MINING_REWARD',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(subscription.planCurrency),
          reward.toString(),
          reward.toString(),
          "0",
          subscription.id,
          key,
          key,
          subscription.id,
          JSON.stringify({ subscriptionId: subscription.id }),
          idemId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, idemId, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "MINING_REWARD_POSTED",
        key,
        key,
        "MINING_REWARD",
        subscription.id,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") SELECT ?,?,'MINING_REWARD','COMPLETED','MINING_REWARD',?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          activityId,
          subscription.userId,
          subscription.id,
          key,
          key,
          postingId,
          String(subscription.planCurrency),
          reward.toString(),
          JSON.stringify({ subscriptionId: subscription.id }),
          idemId,
          postingId,
        ],
      },
      {
        sql: `INSERT OR IGNORE INTO "MiningRewardAccrual" ("id","subscriptionId","userId","ledgerPostingId","activityId","idempotencyKey","amount","currency","rewardedAt") SELECT ?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          accrualId,
          subscription.id,
          subscription.userId,
          postingId,
          activityId,
          key,
          reward.toString(),
          String(subscription.planCurrency),
          idemId,
          postingId,
        ],
      },
      {
        sql: `UPDATE "MiningSubscription" SET "totalRewards"=? ,"totalRewardsDecimal"=? ,"lastRewardPaid"=CURRENT_TIMESTAMP ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='ACTIVE' AND NOT EXISTS (SELECT 1 FROM "MiningRewardAccrual" WHERE "idempotencyKey"=? AND "id"<>?)`,
        params: [
          this.nonNegativeDecimal(String(subscription.totalRewards ?? "0"))
            .plus(reward)
            .toString(),
          this.nonNegativeDecimal(
            String(subscription.totalRewardsDecimal ?? "0"),
          )
            .plus(reward)
            .toString(),
          subscription.id,
          key,
          accrualId,
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:mining:reward:${key}`,
        aggregateType: "MINING_SUBSCRIPTION",
        aggregateId: subscriptionId,
        eventType: "MINING_REWARD_POSTED",
        correlationId: key,
        payload: {
          userId: String(subscription.userId),
          amount: reward.toString(),
          currency: String(subscription.planCurrency),
        },
      }),
    ]);
    this.requireChanges(result, 1, "D1 mining reward account transition");
    this.requireChanges(result, 3, "D1 mining reward posting");
    const row = await this.getMiningSubscription(
      subscriptionId,
      String(subscription.userId),
    );
    if (!row)
      throw new BadRequestException("D1 mining reward was not materialized");
    return row;
  }

  async listMiningRewards(userId: string): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","subscriptionId","amount","currency","rewardedAt" FROM "MiningRewardAccrual" WHERE "userId"=? ORDER BY "rewardedAt" DESC LIMIT 100`,
      [userId],
    );
    return result.results;
  }

  async getMiningSummary(userId: string): Promise<{
    activeSubscriptions: number;
    totalSubscriptions: number;
    lockedPrincipal: string;
    accruedRewards: string;
    postedRewards: string;
  }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const subscriptions = await this.bridge.select<any>(
      `SELECT "status","amountDecimal","totalRewardsDecimal" FROM "MiningSubscription" WHERE "userId"=?`,
      [userId],
    );
    const rewards = await this.bridge.select<any>(
      `SELECT COALESCE(SUM(CAST("amount" AS REAL)),0) AS "postedRewards" FROM "MiningRewardAccrual" WHERE "userId"=?`,
      [userId],
    );
    const sum = (rows: any[], field: string) =>
      rows
        .reduce(
          (total, row) =>
            total.plus(
              this.nonNegativeOrSignedDecimal(String(row[field] ?? "0")),
            ),
          new Prisma.Decimal(0),
        )
        .toString();
    return {
      activeSubscriptions: subscriptions.results.filter(
        (row: any) => String(row.status) === "ACTIVE",
      ).length,
      totalSubscriptions: subscriptions.results.length,
      lockedPrincipal: sum(
        subscriptions.results.filter(
          (row: any) => String(row.status) === "ACTIVE",
        ),
        "amountDecimal",
      ),
      accruedRewards: sum(subscriptions.results, "totalRewardsDecimal"),
      postedRewards: String(rewards.results[0]?.postedRewards ?? "0"),
    };
  }

  async listLoanPlans(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "LoanPlan" WHERE "isActive"=1 ORDER BY "durationDays" ASC`,
      [],
    );
    return result.results;
  }

  async getLoanPlan(planId: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "LoanPlan" WHERE "id"=? LIMIT 1`,
      [planId],
    );
    return result.results[0] ?? null;
  }

  async getLoanApplication(
    loanId: string,
    userId?: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "LoanApplication" WHERE "id"=?${userId ? ' AND "userId"=?' : ""} LIMIT 1`,
      userId ? [loanId, userId] : [loanId],
    );
    return result.results[0] ?? null;
  }

  async listLoanApplications(
    userId?: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "LoanApplication"${userId ? ' WHERE "userId"=?' : ""} ORDER BY "createdAt" DESC`,
      userId ? [userId] : [],
    );
    return result.results;
  }

  async applyLoan(command: {
    id: string;
    userId: string;
    amount: string;
    currency: string;
    term: number;
    durationDays: number;
    interestRate: string;
    totalRepayment: string;
    collateral?: string;
    collateralImg?: string;
    productSnapshot: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LoanApplication" ("id","userId","amount","amountDecimal","currency","term","durationDays","interestRate","interestRateDecimal","totalRepayment","totalRepaymentDecimal","collateral","collateralImg","status","productSnapshot","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDING',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          command.id,
          command.userId,
          command.amount,
          command.amount,
          this.normalizeAsset(command.currency),
          command.term,
          command.durationDays,
          command.interestRate,
          command.interestRate,
          command.totalRepayment,
          command.totalRepayment,
          command.collateral ?? null,
          command.collateralImg ?? null,
          JSON.stringify(command.productSnapshot),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:loan:apply:${command.id}`,
        aggregateType: "LOAN_APPLICATION",
        aggregateId: command.id,
        eventType: "LOAN_APPLICATION_SUBMITTED",
        correlationId: command.id,
        payload: { loanId: command.id, userId: command.userId },
        guard: {
          sql: `EXISTS (SELECT 1 FROM "LoanApplication" WHERE "id"=? AND "status"='PENDING')`,
          params: [command.id],
        },
      }),
    ]);
    const changes = Number(
      (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
    );
    if (changes !== 0 && changes !== 1)
      throw new BadRequestException(
        "D1 loan application creation returned an invalid change count",
      );
    const row = await this.getLoanApplication(command.id, command.userId);
    if (!row)
      throw new BadRequestException("D1 loan application was not materialized");
    return row;
  }

  async approveLoan(command: {
    loanId: string;
    idempotencyKey: string;
    adminId?: string;
    reason?: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const loan: any = await this.getLoanApplication(command.loanId);
    if (!loan) throw new NotFoundException("Loan application not found");
    if (["ACTIVE", "APPROVED"].includes(String(loan.status))) return loan;
    if (String(loan.status) !== "PENDING")
      throw new BadRequestException("Loan is not pending review");
    const account = await this.getAccountForUser(
      String(loan.userId),
      String(loan.currency),
    );
    const current = await this.findAccount(account.id);
    const amount = this.decimal(String(loan.amountDecimal));
    const key = `loan-disbursement:${command.loanId}:${command.idempotencyKey}`;
    const idemId = randomUUID();
    const postingId = randomUUID();
    const due = new Date(
      Date.now() + Number(loan.durationDays) * 86400000,
    ).toISOString();
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'CREDIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=?)`,
        params: [
          idemId,
          key,
          account.id,
          key,
          account.id,
          String(loan.currency),
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.available).plus(amount).toString(),
          account.id,
          String(loan.currency),
          current.available,
          current.locked,
          idemId,
        ],
      },
      this.rollbackIfNoChanges(key, "LOAN_DISBURSEMENT"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'CREDIT',?,?, 'LOAN_DISBURSEMENT',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(loan.currency),
          amount.toString(),
          amount.toString(),
          "0",
          loan.id,
          key,
          command.idempotencyKey,
          loan.id,
          JSON.stringify({ reason: command.reason ?? null }),
          idemId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, idemId, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "LOAN_DISBURSEMENT_POSTED",
        key,
        command.idempotencyKey,
        "LOAN_DISBURSEMENT",
        loan.id,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") SELECT ?,?,'LOAN_DISBURSEMENT','COMPLETED','LOAN_DISBURSEMENT',?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          randomUUID(),
          loan.userId,
          loan.id,
          key,
          command.idempotencyKey,
          postingId,
          String(loan.currency),
          amount.toString(),
          JSON.stringify({ loanId: loan.id }),
          idemId,
          postingId,
        ],
      },
      {
        sql: `UPDATE "LoanApplication" SET "status"='ACTIVE',"approvedAt"=CURRENT_TIMESTAMP,"dueDate"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='PENDING' AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [due, loan.id, idemId, postingId],
      },
    ];
    if (command.adminId)
      statements.push({
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.adminId,
          "LOAN_APPLICATION_APPROVED",
          loan.id,
          JSON.stringify({
            reason: command.reason ?? null,
            idempotencyKey: command.idempotencyKey,
          }),
        ],
      });
    statements.push(
      this.eventOutboxStatement({
        idempotencyKey: `event:loan:approve:${command.loanId}:${command.idempotencyKey}`,
        aggregateType: "LOAN_APPLICATION",
        aggregateId: command.loanId,
        eventType: "LOAN_APPROVED",
        correlationId: command.idempotencyKey,
        payload: {
          loanId: loan.id,
          adminId: command.adminId ?? null,
          reason: command.reason ?? null,
        },
      }),
    );
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 1, "D1 loan disbursement account transition");
    this.requireChanges(result, 3, "D1 loan disbursement posting");
    this.requireChanges(result, 7, "D1 loan activation");
    const row = await this.getLoanApplication(loan.id);
    if (!row)
      throw new BadRequestException("D1 approved loan was not materialized");
    return row;
  }

  async rejectLoan(
    loanId: string,
    idempotencyKey: string,
    adminId?: string,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    if (!idempotencyKey?.trim())
      throw new BadRequestException("Idempotency key is required");
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `UPDATE "LoanApplication" SET "status"='REJECTED',"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='PENDING'`,
        params: [loanId],
      },
    ];
    if (adminId)
      statements.push({
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          adminId,
          "LOAN_APPLICATION_REJECTED",
          loanId,
          JSON.stringify({ reason: reason ?? null }),
        ],
      });
    statements.push(
      this.eventOutboxStatement({
        idempotencyKey: `event:loan:reject:${loanId}:${idempotencyKey}`,
        aggregateType: "LOAN_APPLICATION",
        aggregateId: loanId,
        eventType: "LOAN_REJECTED",
        payload: { adminId: adminId ?? null, reason: reason ?? null },
      }),
    );
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 0, "D1 loan rejection");
    const row = await this.getLoanApplication(loanId);
    if (!row) throw new NotFoundException("Loan application not found");
    return row;
  }

  async repayLoan(command: {
    userId: string;
    loanId: string;
    amount: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const loan: any = await this.getLoanApplication(
      command.loanId,
      command.userId,
    );
    if (!loan) throw new NotFoundException("Loan not found");
    if (!["ACTIVE", "OVERDUE"].includes(String(loan.status)))
      throw new BadRequestException("Loan is not repayable");
    const amount = this.decimal(command.amount);
    const repaymentId = this.hashId(
      `repayment:${loan.id}`,
      command.idempotencyKey,
    );
    const existing = await this.bridge.select<any>(
      `SELECT "id" FROM "LoanRepayment" WHERE "id"=? LIMIT 1`,
      [repaymentId],
    );
    if (existing.results[0]) return loan;
    const paidRows = await this.bridge.select<any>(
      `SELECT "amountDecimal" FROM "LoanRepayment" WHERE "loanId"=?`,
      [loan.id],
    );
    const paid = paidRows.results.reduce(
      (sum: Prisma.Decimal, row: any) =>
        sum.plus(
          this.nonNegativeOrSignedDecimal(String(row.amountDecimal ?? "0")),
        ),
      new Prisma.Decimal(0),
    );
    const outstanding = this.nonNegativeOrSignedDecimal(
      String(loan.totalRepaymentDecimal),
    ).minus(paid);
    if (amount.gt(outstanding))
      throw new BadRequestException("Repayment exceeds outstanding balance");
    const account = await this.getAccountForUser(
      command.userId,
      String(loan.currency),
    );
    const current = await this.findAccount(account.id);
    if (this.nonNegativeDecimal(current.available).lt(amount))
      throw new BadRequestException("Insufficient available funds");
    const key = `loan-repayment:${loan.id}:${command.idempotencyKey}`;
    const idemId = randomUUID();
    const postingId = randomUUID();
    const nextStatus = amount.eq(outstanding) ? "PAID" : String(loan.status);
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'DEBIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=?)`,
        params: [
          idemId,
          key,
          account.id,
          key,
          account.id,
          String(loan.currency),
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.available).minus(amount).toString(),
          account.id,
          String(loan.currency),
          current.available,
          current.locked,
          idemId,
        ],
      },
      this.rollbackIfNoChanges(key, "LOAN_REPAYMENT"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'DEBIT',?,?, 'LOAN_REPAYMENT',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(loan.currency),
          amount.toString(),
          amount.negated().toString(),
          "0",
          loan.id,
          key,
          command.idempotencyKey,
          loan.id,
          JSON.stringify({ loanId: loan.id }),
          idemId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, idemId, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "LOAN_REPAYMENT_POSTED",
        key,
        command.idempotencyKey,
        "LOAN_REPAYMENT",
        loan.id,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") SELECT ?,?,'LOAN_REPAYMENT','COMPLETED','LOAN_REPAYMENT',?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          randomUUID(),
          command.userId,
          loan.id,
          key,
          command.idempotencyKey,
          postingId,
          String(loan.currency),
          amount.toString(),
          JSON.stringify({ loanId: loan.id }),
          idemId,
          postingId,
        ],
      },
      {
        sql: `INSERT INTO "LoanRepayment" ("id","loanId","amount","amountDecimal","currency","ledgerPostingId","paidAt") SELECT ?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          repaymentId,
          loan.id,
          amount.toString(),
          amount.toString(),
          String(loan.currency),
          postingId,
          idemId,
          postingId,
        ],
      },
      {
        sql: `UPDATE "LoanApplication" SET "status"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "userId"=? AND "status" IN ('ACTIVE','OVERDUE')`,
        params: [nextStatus, loan.id, command.userId],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:loan:repay:${loan.id}:${command.idempotencyKey}`,
        aggregateType: "LOAN_APPLICATION",
        aggregateId: loan.id,
        eventType:
          nextStatus === "PAID" ? "LOAN_COMPLETED" : "LOAN_REPAYMENT_POSTED",
        correlationId: command.idempotencyKey,
        payload: {
          userId: command.userId,
          amount: amount.toString(),
          status: nextStatus,
        },
      }),
    ]);
    this.requireChanges(result, 1, "D1 loan repayment account transition");
    this.requireChanges(result, 3, "D1 loan repayment posting");
    this.requireChanges(result, 7, "D1 loan repayment record");
    const row = await this.getLoanApplication(loan.id, command.userId);
    if (!row)
      throw new BadRequestException("D1 loan repayment was not materialized");
    return row;
  }

  async markOverdueLoans(
    now = new Date().toISOString(),
  ): Promise<{ count: number }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const dueLoans = await this.bridge.select<{
      id: string;
      dueDate: string | null;
    }>(
      `SELECT "id","dueDate" FROM "LoanApplication" WHERE "status"='ACTIVE' AND "dueDate" IS NOT NULL AND "dueDate" < ? ORDER BY "dueDate" ASC`,
      [now],
    );
    let count = 0;
    // D1 batches are bounded by the bridge contract. Pair each guarded state
    // transition with its durable event and process at most eight loans per
    // batch so no overdue transition can bypass EventOutbox.
    for (let offset = 0; offset < dueLoans.results.length; offset += 8) {
      const chunk = dueLoans.results.slice(offset, offset + 8);
      const statements: D1BridgeBatchStatement[] = [];
      for (const loan of chunk) {
        statements.push({
          sql: `UPDATE "LoanApplication"
          SET "status"='OVERDUE',"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=? AND "status"='ACTIVE' AND "dueDate" IS NOT NULL AND "dueDate" < ?`,
          params: [loan.id, now],
        });
        statements.push(
          this.eventOutboxStatement({
            idempotencyKey: `event:loan:overdue:${loan.id}:${loan.dueDate}`,
            aggregateType: "LOAN_APPLICATION",
            aggregateId: loan.id,
            eventType: "LOAN_OVERDUE",
            correlationId: loan.id,
            payload: { loanId: loan.id, dueDate: loan.dueDate },
            guard: {
              sql: `EXISTS (SELECT 1 FROM "LoanApplication" WHERE "id"=? AND "status"='OVERDUE')`,
              params: [loan.id],
            },
          }),
        );
      }
      const result = await this.bridge.batch(statements);
      for (let index = 0; index < result.results.length; index += 2) {
        const changes = Number(
          (result.results[index] as BatchResult | undefined)?.meta?.changes ??
            0,
        );
        if (Number.isFinite(changes)) count += changes;
      }
    }
    return { count };
  }

  async recordEventOutbox(command: {
    idempotencyKey: string;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    eventVersion?: number;
    correlationId?: string | null;
    payload: Record<string, unknown>;
  }): Promise<{ id: string; replayed: boolean }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const id = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          id,
          command.idempotencyKey,
          command.aggregateType,
          command.aggregateId,
          command.eventType,
          command.eventVersion ?? 1,
          command.correlationId ?? null,
          JSON.stringify(command.payload),
        ],
      },
    ]);
    const changes = Number(
      (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
    );
    const existing =
      changes === 0
        ? await this.bridge.select<{ id: string }>(
            `SELECT "id" FROM "EventOutbox" WHERE "idempotencyKey"=? LIMIT 1`,
            [command.idempotencyKey],
          )
        : null;
    return { id: existing?.results[0]?.id ?? id, replayed: changes === 0 };
  }
  async claimPendingEventOutbox(limit = 10): Promise<
    Array<{
      id: string;
      idempotencyKey: string;
      aggregateType: string;
      aggregateId: string;
      eventType: string;
      eventVersion: number;
      correlationId: string | null;
      payload: string;
      attempts: number;
      leaseToken: string;
    }>
  > {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const rows = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","attempts" FROM "EventOutbox" WHERE "state" IN ('PENDING','RETRY') AND "availableAt" <= CURRENT_TIMESTAMP AND ("claimedAt" IS NULL OR "claimedAt" < datetime('now','-10 minutes')) ORDER BY "createdAt" ASC LIMIT ?`,
      [Math.min(Math.max(limit, 1), 50)],
    );
    const claimed: Array<{
      id: string;
      idempotencyKey: string;
      aggregateType: string;
      aggregateId: string;
      eventType: string;
      eventVersion: number;
      correlationId: string | null;
      payload: string;
      attempts: number;
      leaseToken: string;
    }> = [];
    for (const row of rows.results) {
      const leaseToken = randomUUID();
      const result = await this.bridge.batch([
        {
          sql: `UPDATE "EventOutbox" SET "claimedAt"=CURRENT_TIMESTAMP,"leaseToken"=?,"attempts"="attempts"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state" IN ('PENDING','RETRY') AND ("claimedAt" IS NULL OR "claimedAt" < datetime('now','-10 minutes'))`,
          params: [leaseToken, String(row.id)],
        },
      ]);
      const changes = Number(
        (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
      );
      if (changes !== 1) continue;
      claimed.push({
        id: String(row.id),
        idempotencyKey: String(row.idempotencyKey),
        aggregateType: String(row.aggregateType),
        aggregateId: String(row.aggregateId),
        eventType: String(row.eventType),
        eventVersion: Number(row.eventVersion),
        correlationId:
          row.correlationId == null ? null : String(row.correlationId),
        payload: String(row.payload),
        attempts: Number(row.attempts ?? 0) + 1,
        leaseToken,
      });
    }
    return claimed;
  }

  async markEventOutboxPublished(
    id: string,
    leaseToken: string,
  ): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "EventOutbox" SET "state"='PUBLISHED',"publishedAt"=CURRENT_TIMESTAMP,"claimedAt"=NULL,"leaseToken"=NULL,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "leaseToken"=?`,
        params: [id, leaseToken],
      },
    ]);
    return (
      Number(
        (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
      ) === 1
    );
  }

  async markEventOutboxRetry(
    id: string,
    leaseToken: string,
    errorCode: string,
  ): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "EventOutbox" SET "state"=CASE WHEN "attempts" >= 10 THEN 'DEAD_LETTERED' ELSE 'RETRY' END,"lastErrorCode"=?,"lastErrorAt"=CURRENT_TIMESTAMP,"availableAt"=datetime('now','+60 seconds'),"claimedAt"=NULL,"leaseToken"=NULL,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "leaseToken"=?`,
        params: [errorCode.slice(0, 160), id, leaseToken],
      },
    ]);
    return (
      Number(
        (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
      ) === 1
    );
  }
  async recordEventInbox(command: {
    queue: string;
    messageId: string;
    attempts: number;
    eventType: string;
    eventVersion: number;
    idempotencyKey: string;
    correlationId: string;
    payload: Record<string, unknown>;
  }): Promise<{ messageId: string; replayed: boolean; state: string }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "EventInbox" ("messageId","queue","attempts","eventType","eventVersion","idempotencyKey","correlationId","payload","state","receivedAt","updatedAt") VALUES (?,?,?,?,?,?,?,?, 'RECEIVED',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          command.messageId,
          command.queue,
          command.attempts,
          command.eventType,
          command.eventVersion,
          command.idempotencyKey,
          command.correlationId,
          JSON.stringify(command.payload),
        ],
      },
    ]);
    const changes = Number(
      (result.results[0] as BatchResult | undefined)?.meta?.changes ?? 0,
    );
    return {
      messageId: command.messageId,
      replayed: changes === 0,
      state: "RECEIVED",
    };
  }

  async listAdminAuthSessions(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","userId","surface","createdAt","lastUsedAt","absoluteExpiresAt","idleExpiresAt","revokedAt","userAgentHash","ipHash" FROM "AuthSession" ORDER BY "lastUsedAt" DESC LIMIT 500`,
      [],
    );
    return result.results;
  }

  async revokeAdminSession(command: {
    sessionId: string;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const session = await this.getAuthSessionById(command.sessionId);
    if (!session) throw new NotFoundException("Session not found");
    const now = new Date().toISOString();
    const changed = await this.revokeAuthSession(
      String(session.userId),
      String(session.surface),
      command.sessionId,
      command.reason,
      now,
    );
    const auditId = randomUUID();
    await this.bridge.batch([
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          auditId,
          command.adminId,
          "ADMIN_SESSION_REVOKED",
          command.sessionId,
          JSON.stringify({
            reason: command.reason,
            idempotencyKey: command.idempotencyKey,
            changed,
          }),
        ],
      },
    ]);
    return { ok: true, auditId, changed, replayed: !changed };
  }

  async revokeAdminUserSessions(command: {
    userId: string;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const count = await this.revokeAllAuthSessions(
      command.userId,
      "ADMIN",
      new Date().toISOString(),
    );
    const auditId = randomUUID();
    await this.bridge.batch([
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          auditId,
          command.adminId,
          "ADMIN_USER_SESSIONS_REVOKED",
          command.userId,
          JSON.stringify({
            reason: command.reason,
            idempotencyKey: command.idempotencyKey,
            count,
          }),
        ],
      },
    ]);
    return { ok: true, auditId, count, replayed: count === 0 };
  }

  async listAdminTickets(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const tickets = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "SupportTicket" ORDER BY "updatedAt" DESC LIMIT 500`,
      [],
    );
    const replies = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "SupportTicketReply" ORDER BY "createdAt" ASC`,
      [],
    );
    const byTicket = new Map<string, Record<string, unknown>[]>();
    for (const reply of replies.results) {
      const key = String(reply.ticketId);
      const list = byTicket.get(key) ?? [];
      list.push(reply);
      byTicket.set(key, list);
    }
    return tickets.results.map((ticket) => ({
      ...ticket,
      replies: byTicket.get(String(ticket.id)) ?? [],
    }));
  }

  async listAdminAnnouncements(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Announcement" ORDER BY "updatedAt" DESC LIMIT 500`,
      [],
    );
    return result.results;
  }

  async listAdminWallets(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT w.*,u."email" FROM "Wallet" w LEFT JOIN "User" u ON u."id"=w."userId" ORDER BY w."updatedAt" DESC LIMIT 500`,
      [],
    );
    return result.results;
  }

  async listAdminLedger(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT p.*,a."userId",a."asset",a."scope" FROM "LedgerPosting" p JOIN "LedgerAccount" a ON a."id"=p."accountId" ORDER BY p."createdAt" DESC LIMIT 500`,
      [],
    );
    return result.results;
  }

  async listAdminDeposits(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Deposit" ORDER BY "createdAt" DESC LIMIT 500`,
      [],
    );
    return result.results;
  }

  async listAdminWithdrawals(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Withdrawal" ORDER BY "createdAt" DESC LIMIT 500`,
      [],
    );
    return result.results;
  }

  async getAdminIdentity(
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT u."id",u."email",u."role",r."roleId" FROM "User" u LEFT JOIN "AdminRoleAssignment" r ON r."userId"=u."id" WHERE u."id"=? AND u."role"='ADMIN' LIMIT 1`,
      [userId],
    );
    return result.results[0] ?? null;
  }

  async replyAdminTicket(command: {
    ticketId: string;
    adminId: string;
    body: string;
    internal: boolean;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const replay = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id" AS "auditId" FROM "AdminAuditLog" WHERE "action"='SUPPORT_TICKET_REPLIED' AND "target"=? AND json_extract("details",'$.idempotencyKey')=? ORDER BY "createdAt" DESC LIMIT 1`,
      [command.ticketId, command.idempotencyKey],
    );
    if (replay.results[0])
      return { ok: true, ...replay.results[0], replayed: true };
    const ticket = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id" FROM "SupportTicket" WHERE "id"=? LIMIT 1`,
      [command.ticketId],
    );
    if (!ticket.results[0])
      throw new NotFoundException("Support ticket not found");
    const replyId = randomUUID(),
      auditId = randomUUID();
    const correlationId = `support:${command.ticketId}:${command.idempotencyKey}`;
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "SupportTicketReply" ("id","ticketId","authorId","body","internal","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          replyId,
          command.ticketId,
          command.adminId,
          command.body.trim(),
          command.internal ? 1 : 0,
        ],
      },
      {
        sql: `UPDATE "SupportTicket" SET "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,
        params: [command.ticketId],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          auditId,
          command.adminId,
          "SUPPORT_TICKET_REPLIED",
          command.ticketId,
          JSON.stringify({
            reason: command.reason.trim(),
            internal: command.internal,
            idempotencyKey: command.idempotencyKey,
            correlationId,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:support:reply:${command.ticketId}:${command.idempotencyKey}`,
        aggregateType: "SUPPORT_TICKET",
        aggregateId: command.ticketId,
        eventType: "SUPPORT_TICKET_REPLIED",
        correlationId,
        payload: {
          replyId,
          adminId: command.adminId,
          internal: command.internal,
        },
      }),
    ]);
    this.requireChanges(result, 0, "D1 support reply");
    return { ok: true, auditId, replayed: false };
  }

  async setAdminTicketStatus(command: {
    ticketId: string;
    adminId: string;
    status: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const replay = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id" AS "auditId",json_extract("details",'$.after.status') AS "status" FROM "AdminAuditLog" WHERE "action"='SUPPORT_TICKET_STATUS_CHANGED' AND "target"=? AND json_extract("details",'$.idempotencyKey')=? LIMIT 1`,
      [command.ticketId, command.idempotencyKey],
    );
    if (replay.results[0])
      return { ok: true, ...replay.results[0], replayed: true };
    const ticket = (
      await this.bridge.select<Record<string, unknown>>(
        `SELECT "status" FROM "SupportTicket" WHERE "id"=? LIMIT 1`,
        [command.ticketId],
      )
    ).results[0];
    if (!ticket) throw new NotFoundException("Support ticket not found");
    const status = command.status.trim().toUpperCase(),
      auditId = randomUUID();
    const correlationId = `support:${command.ticketId}:${command.idempotencyKey}`;
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "SupportTicket" SET "status"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,
        params: [status, command.ticketId],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          auditId,
          command.adminId,
          "SUPPORT_TICKET_STATUS_CHANGED",
          command.ticketId,
          JSON.stringify({
            reason: command.reason.trim(),
            before: ticket.status,
            after: { status },
            idempotencyKey: command.idempotencyKey,
            correlationId,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:support:status:${command.ticketId}:${command.idempotencyKey}`,
        aggregateType: "SUPPORT_TICKET",
        aggregateId: command.ticketId,
        eventType: "SUPPORT_TICKET_STATUS_CHANGED",
        correlationId,
        payload: { adminId: command.adminId, status },
      }),
    ]);
    this.requireChanges(result, 0, "D1 support status");
    return { ok: true, auditId, replayed: false, status };
  }

  async acknowledgeIncident(command: {
    incidentId: string;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const replay = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminIncident" WHERE "acknowledgementIdempotencyKey"=? LIMIT 1`,
      [command.idempotencyKey],
    );
    if (replay.results[0]) return { ...replay.results[0], replayed: true };
    const incident = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminIncident" WHERE "id"=? LIMIT 1`,
      [command.incidentId],
    );
    if (!incident.results[0]) throw new NotFoundException("Incident not found");
    const auditId = randomUUID();
    const correlationId =
      "incident:" + command.incidentId + ":" + command.idempotencyKey;
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "AdminIncident" SET "acknowledgedAt"=CURRENT_TIMESTAMP,"acknowledgedBy"=?,"acknowledgementReason"=?,"acknowledgementIdempotencyKey"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "acknowledgementIdempotencyKey" IS NULL`,
        params: [
          command.adminId,
          command.reason.trim(),
          command.idempotencyKey,
          command.incidentId,
        ],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          auditId,
          command.adminId,
          "INCIDENT_ACKNOWLEDGED",
          command.incidentId,
          JSON.stringify({
            reason: command.reason.trim(),
            idempotencyKey: command.idempotencyKey,
            correlationId,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey:
          "event:incident:ack:" +
          command.incidentId +
          ":" +
          command.idempotencyKey,
        aggregateType: "ADMIN_INCIDENT",
        aggregateId: command.incidentId,
        eventType: "INCIDENT_ACKNOWLEDGED",
        correlationId,
        payload: { adminId: command.adminId },
      }),
    ]);
    this.requireChanges(result, 0, "D1 incident acknowledgement");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminIncident" WHERE "id"=? LIMIT 1`,
      [command.incidentId],
    );
    return { ...(row.results[0] ?? {}), replayed: false };
  }

  async createMaintenanceWindow(command: {
    id: string;
    scope: string;
    target: string;
    scheduledAt: string;
    endsAt: string;
    reason: string;
    environment: string;
    idempotencyKey: string;
    createdBy: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const replay = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminMaintenanceWindow" WHERE "idempotencyKey"=? LIMIT 1`,
      [command.idempotencyKey],
    );
    if (replay.results[0]) return { ...replay.results[0], replayed: true };
    const correlationId = "maintenance:" + command.idempotencyKey,
      auditId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "AdminMaintenanceWindow" ("id","scope","target","scheduledAt","endsAt","reason","environment","createdBy","idempotencyKey","correlationId","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          command.id,
          command.scope.toUpperCase(),
          command.target.trim(),
          command.scheduledAt,
          command.endsAt,
          command.reason.trim(),
          command.environment,
          command.createdBy,
          command.idempotencyKey,
          correlationId,
        ],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          auditId,
          command.createdBy,
          "MAINTENANCE_WINDOW_SCHEDULED",
          command.id,
          JSON.stringify({
            reason: command.reason.trim(),
            idempotencyKey: command.idempotencyKey,
            correlationId,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: "event:maintenance:create:" + command.idempotencyKey,
        aggregateType: "ADMIN_MAINTENANCE_WINDOW",
        aggregateId: command.id,
        eventType: "MAINTENANCE_WINDOW_SCHEDULED",
        correlationId,
        payload: {
          scope: command.scope.toUpperCase(),
          target: command.target,
          environment: command.environment,
        },
      }),
    ]);
    this.requireChanges(result, 0, "D1 maintenance creation");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminMaintenanceWindow" WHERE "id"=? LIMIT 1`,
      [command.id],
    );
    return { ...(row.results[0] ?? {}), replayed: false };
  }

  async cancelMaintenanceWindow(command: {
    windowId: string;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const replay = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminMaintenanceWindow" WHERE "cancelIdempotencyKey"=? LIMIT 1`,
      [command.idempotencyKey],
    );
    if (replay.results[0]) return { ...replay.results[0], replayed: true };
    const existing = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminMaintenanceWindow" WHERE "id"=? LIMIT 1`,
      [command.windowId],
    );
    if (!existing.results[0])
      throw new NotFoundException("Maintenance window not found");
    const correlationId =
        "maintenance:" + command.windowId + ":" + command.idempotencyKey,
      auditId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "AdminMaintenanceWindow" SET "status"='CANCELLED',"cancelledAt"=CURRENT_TIMESTAMP,"cancelledBy"=?,"cancelReason"=?,"cancelIdempotencyKey"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status" <> 'CANCELLED'`,
        params: [
          command.adminId,
          command.reason.trim(),
          command.idempotencyKey,
          command.windowId,
        ],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          auditId,
          command.adminId,
          "MAINTENANCE_WINDOW_CANCELLED",
          command.windowId,
          JSON.stringify({
            reason: command.reason.trim(),
            idempotencyKey: command.idempotencyKey,
            correlationId,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey:
          "event:maintenance:cancel:" +
          command.windowId +
          ":" +
          command.idempotencyKey,
        aggregateType: "ADMIN_MAINTENANCE_WINDOW",
        aggregateId: command.windowId,
        eventType: "MAINTENANCE_WINDOW_CANCELLED",
        correlationId,
        payload: { adminId: command.adminId },
      }),
    ]);
    this.requireChanges(result, 0, "D1 maintenance cancellation");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminMaintenanceWindow" WHERE "id"=? LIMIT 1`,
      [command.windowId],
    );
    return { ...(row.results[0] ?? {}), replayed: false };
  }

  async getAdminStats(): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT (SELECT COALESCE(SUM("amount"),0) FROM "BinaryOptionPosition") AS "totalVolume", (SELECT COUNT(*) FROM "User") AS "activeUsers", (SELECT COALESCE(AVG("payoutRate"),0) FROM "Gate2BinaryConfiguration" WHERE "enabled"=1) AS "globalPayoutRate"`,
      [],
    );
    return (
      result.results[0] ?? {
        totalVolume: "0",
        activeUsers: 0,
        globalPayoutRate: 0,
      }
    );
  }

  async listUsers(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT u.*,w."id" AS "walletId",w."balance" AS "walletBalance",w."frozenBalance" AS "walletFrozenBalance",w."balances" AS "walletBalances" FROM "User" u LEFT JOIN "Wallet" w ON w."userId"=u."id" ORDER BY u."createdAt" DESC`,
      [],
    );
    return result.results.map((row) => ({
      ...row,
      wallet: row.walletId
        ? {
            id: row.walletId,
            balance: row.walletBalance,
            frozenBalance: row.walletFrozenBalance,
            balances: row.walletBalances,
          }
        : null,
    }));
  }

  async listAdminUsers(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT u."id",u."email",u."role",u."lastActive",r."roleId",m."enabled" AS "mfaEnabled" FROM "User" u LEFT JOIN "AdminRoleAssignment" r ON r."userId"=u."id" LEFT JOIN "UserMfa" m ON m."userId"=u."id" WHERE u."role"='ADMIN' ORDER BY u."lastActive" DESC`,
      [],
    );
    return result.results;
  }

  async listAdminAuditLogs(limit = 50): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminAuditLog" ORDER BY "createdAt" DESC LIMIT ?`,
      [Math.min(Math.max(limit, 1), 500)],
    );
    return result.results;
  }

  async listAdminIncidents(limit = 50): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminIncident" ORDER BY "postedAt" DESC LIMIT ?`,
      [Math.min(Math.max(limit, 1), 500)],
    );
    return result.results;
  }

  async listAdminMaintenance(limit = 100): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminMaintenanceWindow" ORDER BY "scheduledAt" DESC LIMIT ?`,
      [Math.min(Math.max(limit, 1), 500)],
    );
    return result.results;
  }

  async listAdminFeatureFlags(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminFeatureFlag" ORDER BY "key" ASC`,
      [],
    );
    return result.results;
  }

  async getUserByEmail(email: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT u.*,k."status" AS "kycStatus" FROM "User" u LEFT JOIN "KYC" k ON k."userId"=u."id" WHERE u."email"=? LIMIT 1`,
      [email],
    );
    return result.results[0] ?? null;
  }

  async createPasswordUser(command: {
    id: string;
    userCode: number;
    email: string;
    password: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "User" ("id","userCode","email","password","role","forceOutcome","createdAt","updatedAt","lastActive") VALUES (?,?,?,?, 'USER','NORMAL',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [command.id, command.userCode, command.email, command.password],
      },
      {
        sql: `INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","frozenBalance","balances","createdAt","updatedAt") VALUES (?,?, '0','0','{}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [randomUUID(), command.id],
      },
    ]);
    this.requireChanges(result, 0, "D1 user creation");
    const row = await this.getUserById(command.id);
    if (!row) throw new BadRequestException("D1 user was not materialized");
    return row;
  }

  async createPasswordAdminUser(command: {
    id: string;
    userCode: number;
    email: string;
    password: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "User" ("id","userCode","email","password","role","forceOutcome","createdAt","updatedAt","lastActive") VALUES (?,?,?,?, 'ADMIN','NORMAL',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [command.id, command.userCode, command.email, command.password],
      },
      {
        sql: `INSERT OR IGNORE INTO "Wallet" ("id","userId","balance","frozenBalance","balances","createdAt","updatedAt") VALUES (?,?, '0','0','{}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [randomUUID(), command.id],
      },
    ]);
    this.requireChanges(result, 0, "D1 admin user creation");
    const row = await this.getUserById(command.id);
    if (!row || row.role !== "ADMIN")
      throw new BadRequestException("D1 admin user was not materialized");
    return row;
  }

  async assignAdminRole(command: {
    userId: string;
    roleId: string;
    assignedBy?: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR REPLACE INTO "AdminRoleAssignment" ("id","userId","roleId","assignedBy","createdAt","updatedAt") SELECT ?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "User" WHERE "id"=? AND "role"='ADMIN')`,
        params: [
          randomUUID(),
          command.userId,
          command.roleId,
          command.assignedBy ?? null,
          new Date().toISOString(),
          command.userId,
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 admin role assignment");
    const row = await this.getAdminIdentity(command.userId);
    if (!row || row.roleId !== command.roleId)
      throw new BadRequestException(
        "D1 admin role assignment was not materialized",
      );
    return row;
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "User" SET "password"=?, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,
        params: [passwordHash, userId],
      },
    ]);
    this.requireChanges(result, 0, "D1 password update");
    const row = await this.getUserById(userId);
    if (!row) throw new BadRequestException("D1 user password was not materialized");
    return row;
  }

  async updateUserSecurityPassword(
    userId: string,
    securityPasswordHash: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "User" SET "securityPasswordHash"=?, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,
        params: [securityPasswordHash, userId],
      },
    ]);
    this.requireChanges(result, 0, "D1 security password update");
    const row = await this.getUserById(userId);
    if (!row) throw new BadRequestException("D1 user security password was not materialized");
    return row;
  }

  async upsertUserMfa(
    userId: string,
    enabled: boolean,
    secret: string | null,
    backupCodes: string | null,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const id = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "UserMfa" ("id","userId","enabled","secret","backupCodes","createdAt","updatedAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO UPDATE SET "enabled"=excluded."enabled","secret"=excluded."secret","backupCodes"=excluded."backupCodes","updatedAt"=CURRENT_TIMESTAMP`,
        params: [id, userId, enabled ? 1 : 0, secret, backupCodes],
      },
    ]);
    this.requireChanges(result, 0, "D1 MFA upsert");
    const row = await this.getUserMfa(userId);
    if (!row) throw new BadRequestException("D1 user MFA was not materialized");
    return row;
  }

  async getUserMfa(userId: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "UserMfa" WHERE "userId"=? LIMIT 1`,
      [userId],
    );
    return result.results[0] ?? null;
  }

  async listLedgerAccounts(userId: string): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","asset","status","available","locked" FROM "LedgerAccount" WHERE "userId"=? ORDER BY "asset" ASC`,
      [userId],
    );
    return result.results;
  }

  async listUserPostings(
    userId: string,
    limit = 100,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT p.* FROM "LedgerPosting" p JOIN "LedgerAccount" a ON a."id"=p."accountId" WHERE a."userId"=? ORDER BY p."createdAt" DESC LIMIT ?`,
      [userId, Math.min(Math.max(limit, 1), 200)],
    );
    return result.results;
  }

  async listUserActivity(
    userId: string,
    limit = 100,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Activity" WHERE "userId"=? ORDER BY "createdAt" DESC LIMIT ?`,
      [userId, Math.min(Math.max(limit, 1), 100)],
    );
    return result.results;
  }

  async listCurrencies(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "symbol","name","logo","minDeposit" FROM "Currency" WHERE "isActive"=1 ORDER BY "symbol" ASC`,
      [],
    );
    return result.results;
  }

  async listAdminCurrencies(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const [currencies, addresses] = await Promise.all([
      this.bridge.select<Record<string, unknown>>(
        `SELECT "id","symbol","name","logo","rate","minDeposit","maxDeposit","minWithdrawal","maxWithdrawal","withdrawalFee","depositEnabled","withdrawEnabled","confirmationCount","decimals","isActive","createdAt","updatedAt" FROM "Currency" ORDER BY "id" ASC`,
        [],
      ),
      this.bridge.select<Record<string, unknown>>(
        `SELECT "id","currencyId","network","address","label","isActive","createdAt","updatedAt" FROM "DepositAddress" ORDER BY "createdAt" DESC`,
        [],
      ),
    ]);
    const byCurrency = new Map<number, Record<string, unknown>[]>();
    for (const address of addresses.results) {
      const currencyId = Number(address.currencyId);
      byCurrency.set(currencyId, [...(byCurrency.get(currencyId) ?? []), address]);
    }
    return currencies.results.map((currency) => ({
      ...currency,
      depositAddresses: byCurrency.get(Number(currency.id)) ?? [],
    }));
  }

  private adminCurrencyDefault<T>(value: T | undefined, fallback: T): T {
    return value ?? fallback;
  }

  private adminCurrencyFlag(value: boolean | undefined): boolean {
    return value === true;
  }

  private adminCurrencyPayload(
    command: D1AdminCurrencyCommand,
  ): D1AdminCurrencyPayload {
    const value = this.adminCurrencyDefault;
    const flag = this.adminCurrencyFlag;
    return {
      symbol: command.symbol.trim().toUpperCase(),
      name: command.name.trim(),
      logo: value(command.logo, null),
      rate: String(value(command.rate, "1.0")),
      minDeposit: String(value(command.minDeposit, "10.0")),
      maxDeposit: String(value(command.maxDeposit, "10000.0")),
      minWithdrawal: String(value(command.minWithdrawal, "10.0")),
      maxWithdrawal: String(value(command.maxWithdrawal, "10000.0")),
      withdrawalFee: String(value(command.withdrawalFee, "1.0")),
      depositEnabled: flag(command.depositEnabled),
      withdrawEnabled: flag(command.withdrawEnabled),
      confirmationCount: value(command.confirmationCount, 3),
      decimals: value(command.decimals, 18),
      isActive: flag(command.isActive),
    };
  }

  private async findAdminCurrencyReplay(
    command: D1AdminCurrencyCommand,
    payload: D1AdminCurrencyPayload,
  ): Promise<Record<string, unknown> | null> {
    const replay = await this.bridge.select<Record<string, unknown>>(
      `SELECT "adminId","details" FROM "AdminAuditLog" WHERE "action"='CURRENCY_CREATED' AND json_extract("details",'$.idempotencyKey')=? ORDER BY "createdAt" DESC LIMIT 1`,
      [command.idempotencyKey],
    );
    const audit = replay.results[0];
    if (!audit) return null;

    let details: Record<string, unknown>;
    try {
      details = JSON.parse(String(audit.details ?? "{}")) as Record<string, unknown>;
    } catch {
      throw new BadRequestException("Currency creation idempotency record is invalid");
    }
    if (
      audit.adminId !== command.adminId ||
      details.reason !== command.reason ||
      JSON.stringify(details.payload) !== JSON.stringify(payload)
    ) {
      throw new BadRequestException("Currency creation idempotency key was already used");
    }

    const existing = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Currency" WHERE "symbol"=? LIMIT 1`,
      [payload.symbol],
    );
    if (!existing.results[0])
      throw new BadRequestException("Currency creation replay no longer resolves");
    return existing.results[0];
  }

  private adminCurrencyCreateStatements(
    command: D1AdminCurrencyCommand,
    payload: D1AdminCurrencyPayload,
  ): D1BridgeBatchStatement[] {
    return [
      {
        sql: `INSERT OR IGNORE INTO "Currency" ("symbol","name","logo","rate","minDeposit","maxDeposit","minWithdrawal","maxWithdrawal","withdrawalFee","depositEnabled","withdrawEnabled","confirmationCount","decimals","isActive","createdAt","updatedAt") SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "AdminAuditLog" WHERE "action"='CURRENCY_CREATED' AND json_extract("details",'$.idempotencyKey')=?)`,
        params: [
          payload.symbol,
          payload.name,
          payload.logo,
          payload.rate,
          payload.minDeposit,
          payload.maxDeposit,
          payload.minWithdrawal,
          payload.maxWithdrawal,
          payload.withdrawalFee,
          payload.depositEnabled ? 1 : 0,
          payload.withdrawEnabled ? 1 : 0,
          payload.confirmationCount,
          payload.decimals,
          payload.isActive ? 1 : 0,
          command.idempotencyKey,
        ],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,'CURRENCY_CREATED',?,?,CURRENT_TIMESTAMP WHERE changes()=1`,
        params: [
          randomUUID(),
          command.adminId,
          payload.symbol,
          JSON.stringify({
            reason: command.reason,
            idempotencyKey: command.idempotencyKey,
            payload,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:${command.idempotencyKey}`,
        aggregateType: "Currency",
        aggregateId: payload.symbol,
        eventType: "CURRENCY_CREATED",
        correlationId: command.idempotencyKey,
        payload: { symbol: payload.symbol, name: payload.name },
        guard: { sql: "changes()=1", params: [] },
      }),
    ];
  }

  private async insertAdminCurrency(
    command: D1AdminCurrencyCommand,
    payload: D1AdminCurrencyPayload,
  ): Promise<Record<string, unknown>> {
    const result = await this.bridge.batch(
      this.adminCurrencyCreateStatements(command, payload),
    );
    if (Number(result.results[0]?.meta?.changes ?? 0) !== 1) {
      const replay = await this.findAdminCurrencyReplay(command, payload);
      if (replay) return replay;
      throw new BadRequestException("Currency symbol already exists");
    }
    this.requireChanges(result, 1, "D1 currency creation audit");
    this.requireChanges(result, 2, "D1 currency creation outbox");

    const created = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Currency" WHERE "symbol"=? LIMIT 1`,
      [payload.symbol],
    );
    if (!created.results[0])
      throw new BadRequestException("D1 currency creation was not materialized");
    return created.results[0];
  }

  private assertAdminCurrencyCreateContext(command: D1AdminCurrencyCommand): void {
    if (!command.reason?.trim())
      throw new BadRequestException("A reason is required to create a currency");
    if (!command.idempotencyKey?.trim())
      throw new BadRequestException("An idempotency key is required to create a currency");
  }

  async createAdminCurrency(
    command: D1AdminCurrencyCommand,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    this.assertAdminCurrencyCreateContext(command);

    const payload = this.adminCurrencyPayload(command);
    const replay = await this.findAdminCurrencyReplay(command, payload);
    if (replay) return replay;
    return this.insertAdminCurrency(command, payload);
  }

  private adminCurrencyUpdateEntries(patch: Record<string, unknown>): Array<[string, unknown]> {
    const allowed = new Set(["name","logo","rate","minDeposit","maxDeposit","minWithdrawal","maxWithdrawal","withdrawalFee","depositEnabled","withdrawEnabled","confirmationCount","decimals","isActive"]);
    const booleanFields = new Set(["depositEnabled","withdrawEnabled","isActive"]);
    return Object.entries(patch)
      .filter(([key, value]) => allowed.has(key) && value !== undefined)
      .map(([key, value]) => [key, booleanFields.has(key) ? (value === true ? 1 : 0) : value]);
  }

  private async findAdminCurrencyUpdateReplay(
    command: { id: number; adminId: string; reason: string; idempotencyKey: string },
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const replay = await this.bridge.select<{ target: string }>(
      `SELECT "target" FROM "AdminAuditLog" WHERE "action"='CURRENCY_CONFIGURATION_UPDATED' AND json_extract("details",'$.idempotencyKey')=? LIMIT 1`,
      [command.idempotencyKey],
    );
    if (!replay.results[0]) return null;
    const exact = await this.bridge.select<{ target: string }>(
      `SELECT "target" FROM "AdminAuditLog" WHERE "action"='CURRENCY_CONFIGURATION_UPDATED' AND json_extract("details",'$.idempotencyKey')=? AND "adminId"=? AND json_extract("details",'$.reason')=? AND json_extract("details",'$.payload')=? LIMIT 1`,
      [command.idempotencyKey, command.adminId, command.reason, JSON.stringify(payload)],
    );
    if (!exact.results[0]) throw new BadRequestException("Currency idempotency key was already used");
    const row = await this.bridge.select<Record<string, unknown>>(`SELECT * FROM "Currency" WHERE "id"=? LIMIT 1`, [command.id]);
    if (!row.results[0]) throw new BadRequestException("Currency update replay no longer resolves");
    return row.results[0];
  }

  private async persistAdminCurrencyUpdate(
    command: { id: number; adminId: string; reason: string; idempotencyKey: string },
    entries: Array<[string, unknown]>,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const assignments = entries.map(([key]) => `"${key}"=?`).join(",");
    const params = entries.map(([, value]) => value as D1BridgeParameter);
    const before = await this.bridge.select<Record<string, unknown>>(`SELECT * FROM "Currency" WHERE "id"=? LIMIT 1`, [command.id]);
    if (!before.results[0]) throw new BadRequestException("Currency not found");
    const result = await this.bridge.batch([
      { sql: `UPDATE "Currency" SET ${assignments},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`, params: [...params, command.id] },
      { sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,'CURRENCY_CONFIGURATION_UPDATED',?,?,CURRENT_TIMESTAMP WHERE changes()=1`, params: [randomUUID(), command.adminId, String(command.id), JSON.stringify({ reason: command.reason, idempotencyKey: command.idempotencyKey, payload })] },
      this.eventOutboxStatement({ idempotencyKey: `event:${command.idempotencyKey}`, aggregateType: "Currency", aggregateId: String(command.id), eventType: "CURRENCY_CONFIGURATION_UPDATED", correlationId: command.idempotencyKey, payload, guard: { sql: "changes()=1", params: [] } }),
    ]);
    this.requireChanges(result, 0, "D1 currency configuration update");
    this.requireChanges(result, 1, "D1 currency audit");
    this.requireChanges(result, 2, "D1 currency outbox");
    const row = await this.bridge.select<Record<string, unknown>>(`SELECT * FROM "Currency" WHERE "id"=? LIMIT 1`, [command.id]);
    return row.results[0];
  }

  async updateAdminCurrency(command: {
    id: number;
    patch: Record<string, unknown>;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    this.assertAdminMutationContext(command.reason, command.idempotencyKey);
    const entries = this.adminCurrencyUpdateEntries(command.patch);
    if (!entries.length) throw new BadRequestException("No supported currency fields were supplied");
    const payload = { id: command.id, ...Object.fromEntries(entries) };
    const replay = await this.findAdminCurrencyUpdateReplay(command, payload);
    if (replay) return replay;
    return this.persistAdminCurrencyUpdate(command, entries, payload);
  }

  async listAdminWalletNetworks(currencyId?: number): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT w.*,c."symbol" AS "asset" FROM "WalletNetwork" w JOIN "Currency" c ON c."id"=w."currencyId" WHERE (? IS NULL OR w."currencyId"=?) ORDER BY c."symbol",w."code"`,
      [currencyId ?? null, currencyId ?? null],
    );
    return result.results;
  }

  async getWalletAssetNetworkConfig(assetValue: string, networkValue: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT c."id" AS "currencyId",c."symbol",c."isActive" AS "assetActive",c."depositEnabled",c."withdrawEnabled",c."minDeposit",c."maxDeposit",c."minWithdrawal",c."maxWithdrawal",c."withdrawalFee",c."confirmationCount",c."decimals",w."id" AS "walletNetworkId",w."code" AS "network",w."name" AS "networkName",w."isActive" AS "networkActive",w."depositEnabled" AS "networkDepositEnabled",w."withdrawEnabled" AS "networkWithdrawEnabled",w."notice",w."instructions" FROM "Currency" c JOIN "WalletNetwork" w ON w."currencyId"=c."id" WHERE c."symbol"=? AND w."code"=? LIMIT 1`,
      [this.normalizeAsset(assetValue), networkValue.trim().toUpperCase()],
    );
    return result.results[0] ?? null;
  }

  private walletNetworkPayload(command: { currencyId: number; code: string; name: string; notice?: string; instructions?: string }) {
    return { currencyId: command.currencyId, code: command.code.trim().toUpperCase(), name: command.name.trim(), notice: command.notice ?? null, instructions: command.instructions ?? null };
  }

  private assertAdminMutationContext(reason: string, idempotencyKey: string): void {
    if (!reason.trim() || !idempotencyKey.trim()) throw new BadRequestException("Reason and idempotency key are required");
  }

  private async findWalletMutationReplay(table: "WalletNetwork" | "DepositAddress", entity: "network" | "address", action: string, command: { adminId: string; reason: string; idempotencyKey: string }, payload: Record<string,unknown>): Promise<Record<string,unknown> | null> {
    const replay = await this.bridge.select<{ target: string }>(
      `SELECT "target" FROM "AdminAuditLog" WHERE "action"=? AND json_extract("details",'$.idempotencyKey')=? LIMIT 1`,
      [action,command.idempotencyKey],
    );
    const target = replay.results[0]?.target;
    if (!target) return null;
    const exact = await this.bridge.select<{ target: string }>(
      `SELECT "target" FROM "AdminAuditLog" WHERE "action"=? AND json_extract("details",'$.idempotencyKey')=? AND "adminId"=? AND json_extract("details",'$.reason')=? AND json_extract("details",'$.payload')=? LIMIT 1`,
      [action,command.idempotencyKey,command.adminId,command.reason,JSON.stringify(payload)],
    );
    if (!exact.results[0]) throw new BadRequestException(`Wallet ${entity} idempotency key was already used`);
    const row = await this.bridge.select<Record<string,unknown>>(`SELECT * FROM "${table}" WHERE "id"=? LIMIT 1`,[String(target)]);
    if (!row.results[0]) throw new BadRequestException(`Wallet ${entity} replay no longer resolves`);
    return row.results[0];
  }

  private async insertAdminWalletNetwork(command: { currencyId: number; adminId: string; reason: string; idempotencyKey: string }, payload: ReturnType<D1FinancialCommandGateway["walletNetworkPayload"]>): Promise<Record<string,unknown>> {
    const currency = await this.bridge.select<{ id: number }>(`SELECT "id" FROM "Currency" WHERE "id"=? LIMIT 1`, [command.currencyId]);
    if (!currency.results[0]) throw new NotFoundException("Wallet asset not found");
    const id = randomUUID();
    const result = await this.bridge.batch([
      { sql: `INSERT OR IGNORE INTO "WalletNetwork" ("id","currencyId","code","name","isActive","depositEnabled","withdrawEnabled","notice","instructions","createdAt","updatedAt") VALUES (?,?,?,?,0,0,0,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`, params: [id,payload.currencyId,payload.code,payload.name,payload.notice,payload.instructions] },
      { sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,'WALLET_NETWORK_CREATED',?,?,CURRENT_TIMESTAMP WHERE changes()=1`, params: [randomUUID(),command.adminId,id,JSON.stringify({reason:command.reason,idempotencyKey:command.idempotencyKey,payload})] },
      this.eventOutboxStatement({ idempotencyKey:`event:${command.idempotencyKey}`,aggregateType:"WalletNetwork",aggregateId:id,eventType:"WALLET_NETWORK_CREATED",correlationId:command.idempotencyKey,payload,guard:{sql:"changes()=1",params:[]} }),
    ]);
    if (Number(result.results[0]?.meta?.changes ?? 0) !== 1) throw new BadRequestException("Wallet network already exists");
    this.requireChanges(result,1,"Wallet network audit"); this.requireChanges(result,2,"Wallet network outbox");
    const row=await this.bridge.select<Record<string,unknown>>(`SELECT * FROM "WalletNetwork" WHERE "id"=? LIMIT 1`,[id]);
    return row.results[0] ?? {};
  }

  async createAdminWalletNetwork(command: {
    currencyId: number; code: string; name: string; notice?: string; instructions?: string;
    adminId: string; reason: string; idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    this.assertAdminMutationContext(command.reason, command.idempotencyKey);
    const payload = this.walletNetworkPayload(command);
    const replay = await this.findWalletMutationReplay("WalletNetwork", "network", "WALLET_NETWORK_CREATED", command, payload);
    if (replay) return replay;
    return this.insertAdminWalletNetwork(command, payload);
  }

  private async persistAdminWalletNetworkUpdate(
    command: { id: string; adminId: string; reason: string; idempotencyKey: string },
    entries: Array<[string, unknown]>,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const current = await this.bridge.select<Record<string, unknown>>(`SELECT * FROM "WalletNetwork" WHERE "id"=? LIMIT 1`, [command.id]);
    if (!current.results[0]) throw new NotFoundException("Wallet network not found");
    const sets = entries.map(([key]) => `"${key}"=?`).join(",");
    const parameters = entries.map(([key, value]) =>
      ["isActive", "depositEnabled", "withdrawEnabled"].includes(key) ? (value === true ? 1 : 0) : value as D1BridgeParameter,
    );
    const result = await this.bridge.batch([
      { sql: `UPDATE "WalletNetwork" SET ${sets},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`, params: [...parameters, command.id] },
      { sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,'WALLET_NETWORK_UPDATED',?,?,CURRENT_TIMESTAMP WHERE changes()=1`, params: [randomUUID(), command.adminId, command.id, JSON.stringify({ reason: command.reason, idempotencyKey: command.idempotencyKey, payload })] },
      this.eventOutboxStatement({ idempotencyKey: `event:${command.idempotencyKey}`, aggregateType: "WalletNetwork", aggregateId: command.id, eventType: "WALLET_NETWORK_UPDATED", correlationId: command.idempotencyKey, payload, guard: { sql: "changes()=1", params: [] } }),
    ]);
    this.requireChanges(result, 0, "Wallet network update");
    this.requireChanges(result, 1, "Wallet network audit");
    this.requireChanges(result, 2, "Wallet network outbox");
    const row = await this.bridge.select<Record<string, unknown>>(`SELECT * FROM "WalletNetwork" WHERE "id"=? LIMIT 1`, [command.id]);
    return row.results[0] ?? {};
  }

  async updateAdminWalletNetwork(command: {
    id: string; patch: Record<string, unknown>; adminId: string; reason: string; idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    this.assertAdminMutationContext(command.reason, command.idempotencyKey);
    const allowed = new Set(["name", "isActive", "depositEnabled", "withdrawEnabled", "notice", "instructions"]);
    const entries = Object.entries(command.patch).filter(([key, value]) => allowed.has(key) && value !== undefined);
    if (!entries.length) throw new BadRequestException("No supported Wallet network fields supplied");
    const payload = { id: command.id, ...Object.fromEntries(entries) };
    const replay = await this.findWalletMutationReplay("WalletNetwork", "network", "WALLET_NETWORK_UPDATED", command, payload);
    if (replay) return replay;
    return this.persistAdminWalletNetworkUpdate(command, entries, payload);
  }

  async createAdminDepositAddress(command: {
    currencyId: number;
    network: string;
    address: string;
    label?: string;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    this.assertAdminMutationContext(command.reason, command.idempotencyKey);
    const currency = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","symbol" FROM "Currency" WHERE "id"=? LIMIT 1`,
      [command.currencyId],
    );
    if (!currency.results[0]) throw new BadRequestException("Currency not found");
    const walletNetwork = await this.bridge.select<Record<string,unknown>>(
      `SELECT "id","code" FROM "WalletNetwork" WHERE "currencyId"=? AND "code"=? LIMIT 1`,
      [command.currencyId, command.network.trim().toUpperCase()],
    );
    if (!walletNetwork.results[0]) throw new BadRequestException("Wallet network is not configured for this asset");
    const payload = { currencyId: command.currencyId, network: String(walletNetwork.results[0].code), address: command.address, label: command.label ?? null };
    const replay = await this.findWalletMutationReplay("DepositAddress", "address", "DEPOSIT_ADDRESS_CREATED", command, payload);
    if (replay) return replay;
    const id = randomUUID();
    const auditId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "DepositAddress" ("id","currencyId","walletNetworkId","network","address","label","isActive","createdAt","updatedAt") VALUES (?,?,?,?,?,?,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [id, command.currencyId, String(walletNetwork.results[0].id), String(walletNetwork.results[0].code), command.address, command.label ?? null],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [auditId, command.adminId, "DEPOSIT_ADDRESS_CREATED", id, JSON.stringify({ reason: command.reason, idempotencyKey: command.idempotencyKey, payload })],
      },
      this.eventOutboxStatement({ idempotencyKey: `event:${command.idempotencyKey}`, aggregateType: "DepositAddress", aggregateId: id, eventType: "DEPOSIT_ADDRESS_CREATED", correlationId: command.idempotencyKey, payload: { depositAddressId: id, currencyId: command.currencyId, network: command.network } }),
    ]);
    this.requireChanges(result, 0, "D1 deposit address create");
    const row = await this.bridge.select<Record<string, unknown>>(`SELECT * FROM "DepositAddress" WHERE "id"=? LIMIT 1`, [id]);
    return { ...(row.results[0] ?? {}), auditId };
  }

  async updateAdminDepositAddressState(command: {
    id: string; isActive: boolean; adminId: string; reason: string; idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    this.assertAdminMutationContext(command.reason, command.idempotencyKey);
    const current = await this.bridge.select<Record<string,unknown>>(`SELECT * FROM "DepositAddress" WHERE "id"=? LIMIT 1`,[command.id]);
    if (!current.results[0]) throw new NotFoundException("Deposit address not found");
    const action=command.isActive ? "DEPOSIT_ADDRESS_ENABLED" : "DEPOSIT_ADDRESS_DISABLED";
    const payload={depositAddressId:command.id,isActive:command.isActive};
    const replay=await this.findWalletMutationReplay("DepositAddress", "address", action, command, {id:command.id,isActive:command.isActive});
    if (replay) return replay;
    const result=await this.bridge.batch([
      {sql:`UPDATE "DepositAddress" SET "isActive"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,params:[command.isActive?1:0,command.id]},
      {sql:`INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,?,?, ?,CURRENT_TIMESTAMP WHERE changes()=1`,params:[randomUUID(),command.adminId,action,command.id,JSON.stringify({reason:command.reason,idempotencyKey:command.idempotencyKey,payload:{id:command.id,isActive:command.isActive}})]},
      this.eventOutboxStatement({idempotencyKey:`event:${command.idempotencyKey}`,aggregateType:"DepositAddress",aggregateId:command.id,eventType:action,correlationId:command.idempotencyKey,payload,guard:{sql:"changes()=1",params:[]}}),
    ]);
    this.requireChanges(result,0,"Deposit address state update"); this.requireChanges(result,1,"Deposit address audit"); this.requireChanges(result,2,"Deposit address outbox");
    const row=await this.bridge.select<Record<string,unknown>>(`SELECT * FROM "DepositAddress" WHERE "id"=? LIMIT 1`,[command.id]);
    return row.results[0] ?? {};
  }

  async deactivateAdminDepositAddress(command: {
    id: string;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    return this.updateAdminDepositAddressState({ ...command, isActive: false });
  }

  async touchUserLastActive(userId: string): Promise<void> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    await this.bridge.batch([
      {
        sql: `UPDATE "User" SET "lastActive"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,
        params: [userId],
      },
    ]);
  }

  async getKyc(userId: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "KYC" WHERE "userId"=? LIMIT 1`,
      [userId],
    );
    return result.results[0] ?? null;
  }

  async submitKyc(command: {
    userId: string;
    firstName: string;
    lastName: string;
    dob: string;
    country: string;
    documentType: string;
    documentUrl: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const existing = await this.getKyc(command.userId);
    if (existing?.status === "APPROVED")
      throw new BadRequestException("KYC already approved");
    if (existing?.status === "PENDING")
      throw new BadRequestException("KYC already pending");
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "KYC" ("id","userId","firstName","lastName","dob","country","documentType","documentUrl","status","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO UPDATE SET "firstName"=excluded."firstName","lastName"=excluded."lastName","dob"=excluded."dob","country"=excluded."country","documentType"=excluded."documentType","documentUrl"=excluded."documentUrl","status"='PENDING',"updatedAt"=CURRENT_TIMESTAMP`,
        params: [
          randomUUID(),
          command.userId,
          command.firstName,
          command.lastName,
          command.dob,
          command.country,
          command.documentType,
          command.documentUrl,
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:kyc:submit:${command.userId}`,
        aggregateType: "KYC",
        aggregateId: command.userId,
        eventType: "KYC_SUBMITTED",
        payload: { userId: command.userId },
      }),
    ]);
    this.requireChanges(result, 0, "D1 KYC submission");
    const row = await this.getKyc(command.userId);
    if (!row) throw new BadRequestException("D1 KYC was not materialized");
    return row;
  }

  async updateKycState(
    userId: string,
    state: "APPROVED" | "REJECTED",
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "KYC" SET "status"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "userId"=?`,
        params: [state, userId],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:kyc:state:${userId}:${state}`,
        aggregateType: "KYC",
        aggregateId: userId,
        eventType: `KYC_${state}`,
        payload: { userId, state },
      }),
    ]);
    this.requireChanges(result, 0, "D1 KYC state transition");
    const row = await this.getKyc(userId);
    if (!row) throw new NotFoundException("KYC record not found");
    return row;
  }

  async listKycReviews(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT k.*,u."email" FROM "KYC" k JOIN "User" u ON u."id"=k."userId" ORDER BY k."updatedAt" DESC`,
      [],
    );
    return result.results;
  }

  async listDepositDestinations(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT c."symbol" AS "asset",c."name" AS "assetName",w."code" AS "network",w."name" AS "networkName",d."id" AS "depositAddressId",d."address",d."label",c."minDeposit",c."maxDeposit",c."confirmationCount",c."decimals",w."notice",w."instructions" FROM "DepositAddress" d JOIN "Currency" c ON c."id"=d."currencyId" JOIN "WalletNetwork" w ON w."id"=d."walletNetworkId" WHERE d."isActive"=1 AND c."isActive"=1 AND c."depositEnabled"=1 AND w."isActive"=1 AND w."depositEnabled"=1 ORDER BY c."symbol" ASC,w."code" ASC`,
      [],
    );
    return result.results;
  }

  async decideKyc(command: {
    id: string;
    decision: "APPROVED" | "REJECTED";
    reason: string;
    adminId: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const kyc = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","userId","status" FROM "KYC" WHERE "id"=? LIMIT 1`,
      [command.id],
    );
    const current = kyc.results[0];
    if (!current) throw new NotFoundException("KYC review not found");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "AdminGovernanceCommand" ("id","commandType","target","reason","idempotencyKey","payload","status","requestedBy","createdAt","updatedAt") VALUES (?,?,?,?,?,?, 'EXECUTED',?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          "KYC_DECISION",
          command.id,
          command.reason,
          command.idempotencyKey,
          JSON.stringify({
            decision: command.decision,
            userId: current.userId,
          }),
          command.adminId,
        ],
      },
      {
        sql: `UPDATE "KYC" SET "status"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,
        params: [command.decision, command.id],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.adminId,
          "KYC_DECISION",
          command.id,
          JSON.stringify({
            decision: command.decision,
            before: current.status,
            after: command.decision,
            reason: command.reason,
            idempotencyKey: command.idempotencyKey,
            userId: current.userId,
          }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: "event:kyc:decision:" + command.idempotencyKey,
        aggregateType: "KYC",
        aggregateId: command.id,
        eventType: "KYC_DECISION",
        correlationId: command.idempotencyKey,
        payload: {
          userId: current.userId,
          decision: command.decision,
          adminId: command.adminId,
        },
      }),
    ]);
    if (
      !(result.results[1] as BatchResult | undefined)?.success &&
      !(result.results[0] as BatchResult | undefined)?.success
    )
      throw new BadRequestException("D1 KYC decision was not applied");
    return {
      ok: true,
      auditId: command.idempotencyKey,
      replayed: false,
      status: command.decision,
    };
  }

  async listSystemConfig(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "SystemConfig" ORDER BY "key" ASC`,
      [],
    );
    return result.results;
  }

  async updateSystemConfig(command: {
    key: string;
    value: string;
    description?: string;
    adminId: string;
    reason: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const id = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "SystemConfig" ("id","key","value","description","updatedAt") VALUES (?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT("key") DO UPDATE SET "value"=excluded."value","description"=excluded."description","updatedAt"=CURRENT_TIMESTAMP`,
        params: [id, command.key, command.value, command.description ?? null],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.adminId,
          "SYSTEM_CONFIG_UPDATED",
          command.key,
          JSON.stringify({ reason: command.reason }),
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 system configuration update");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "SystemConfig" WHERE "key"=? LIMIT 1`,
      [command.key],
    );
    if (!row.results[0])
      throw new BadRequestException("D1 system config was not materialized");
    return row.results[0];
  }

  async updateFeatureFlag(command: {
    key: string;
    enabled: boolean;
    environment: string;
    reason: string;
    updatedBy: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "AdminFeatureFlag" ("id","key","enabled","environment","reason","updatedBy","createdAt","updatedAt") VALUES (?,?,?, ?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("key") DO UPDATE SET "enabled"=excluded."enabled","environment"=excluded."environment","reason"=excluded."reason","updatedBy"=excluded."updatedBy","updatedAt"=CURRENT_TIMESTAMP`,
        params: [
          randomUUID(),
          command.key,
          command.enabled ? 1 : 0,
          command.environment,
          command.reason,
          command.updatedBy,
        ],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.updatedBy,
          "FEATURE_FLAG_UPDATED",
          command.key,
          JSON.stringify({
            enabled: command.enabled,
            environment: command.environment,
            reason: command.reason,
          }),
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 feature flag update");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminFeatureFlag" WHERE "key"=? LIMIT 1`,
      [command.key],
    );
    if (!row.results[0])
      throw new BadRequestException("D1 feature flag was not materialized");
    return row.results[0];
  }

  async listGovernanceCommands(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminGovernanceCommand" ORDER BY "createdAt" DESC LIMIT 500`,
      [],
    );
    return result.results;
  }

  async createGovernanceCommand(command: {
    id: string;
    commandType: string;
    target?: string;
    reason: string;
    idempotencyKey: string;
    payload?: Record<string, unknown>;
    requestedBy: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const existing = await findCommandByIdempotencyKey(this.bridge,
      "AdminGovernanceCommand",
      command.idempotencyKey,
    );
    if (existing) return existing;
    const result = await this.bridge.batch([
      {
        sql: `INSERT INTO "AdminGovernanceCommand" ("id","idempotencyKey","commandType","target","reason","payload","requestedBy","status","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          command.id,
          command.idempotencyKey,
          command.commandType,
          command.target ?? null,
          command.reason,
          command.payload ? JSON.stringify(command.payload) : null,
          command.requestedBy,
        ],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.requestedBy,
          "GOVERNANCE_COMMAND_REQUESTED",
          command.target ?? null,
          JSON.stringify({
            commandId: command.id,
            commandType: command.commandType,
            reason: command.reason,
            idempotencyKey: command.idempotencyKey,
          }),
        ],
      },
    ]);
    this.requireChanges(result, 0, "D1 governance command creation");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminGovernanceCommand" WHERE "id"=? LIMIT 1`,
      [command.id],
    );
    if (!row.results[0])
      throw new BadRequestException(
        "D1 governance command was not materialized",
      );
    return row.results[0];
  }

  async decideGovernanceCommand(
    commandId: string,
    approverId: string,
    decision: "APPROVED" | "REJECTED",
    reason: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const command: any = (
      await this.bridge.select<Record<string, unknown>>(
        `SELECT * FROM "AdminGovernanceCommand" WHERE "id"=? LIMIT 1`,
        [commandId],
      )
    ).results[0];
    if (!command) throw new NotFoundException("Governance command not found");
    if (String(command.requestedBy) === approverId)
      throw new BadRequestException(
        "The requester cannot approve their own command",
      );
    if (String(command.status) !== "PENDING") return command;
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR REPLACE INTO "AdminGovernanceApproval" ("id","commandId","approverId","decision","reason","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [randomUUID(), commandId, approverId, decision, reason],
      },
      {
        sql: `UPDATE "AdminGovernanceCommand" SET "status"=?,"approvedBy"=CASE WHEN ?='APPROVED' THEN ? ELSE "approvedBy" END,"approvedAt"=CASE WHEN ?='APPROVED' THEN CURRENT_TIMESTAMP ELSE "approvedAt" END,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='PENDING'`,
        params: [decision, decision, approverId, decision, commandId],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          approverId,
          `GOVERNANCE_COMMAND_${decision}`,
          commandId,
          JSON.stringify({ reason }),
        ],
      },
    ]);
    this.requireChanges(result, 1, "D1 governance command decision");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "AdminGovernanceCommand" WHERE "id"=? LIMIT 1`,
      [commandId],
    );
    if (!row.results[0])
      throw new BadRequestException(
        "D1 governance decision was not materialized",
      );
    return row.results[0];
  }

  async applyAdminFinancialCorrection(command: {
    governanceCommandId: string;
    userId: string;
    asset: string;
    amount: string;
    direction: "CREDIT" | "DEBIT";
    idempotencyKey: string;
    reason: string;
    adminId: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const governance = (
      await this.bridge.select<Record<string, unknown>>(
        `SELECT * FROM "AdminGovernanceCommand" WHERE "id"=? LIMIT 1`,
        [command.governanceCommandId],
      )
    ).results[0] as any;
    if (
      !governance ||
      String(governance.commandType) !== "FINANCIAL_CORRECTION"
    ) {
      throw new BadRequestException(
        "An independently approved financial correction command is required",
      );
    }
    if (String(governance.requestedBy) === command.adminId) {
      throw new BadRequestException(
        "The requester cannot execute their own financial correction",
      );
    }
    const referenceId = `admin-correction:${command.idempotencyKey}`;
    const existing = await this.findIdempotency(referenceId);
    if (String(governance.status) === "EXECUTED") {
      return {
        command: governance,
        posting: existing?.debitPostingId
          ? { postingId: existing.debitPostingId }
          : null,
        replayed: true,
      };
    }
    if (String(governance.status) !== "APPROVED") {
      throw new BadRequestException(
        "An independently approved financial correction command is required",
      );
    }
    const asset = this.normalizeAsset(command.asset);
    const amount = this.decimal(command.amount);
    const account = await this.getAccountForUser(command.userId, asset);
    const current = await this.findAccount(account.id);
    const nextAvailable =
      command.direction === "CREDIT"
        ? this.nonNegativeDecimal(current.available).plus(amount)
        : this.nonNegativeDecimal(current.available).minus(amount);
    if (nextAvailable.isNegative())
      throw new BadRequestException(
        "Ledger account cannot satisfy the requested mutation",
      );
    const postingId = randomUUID();
    const ledgerId = randomUUID();
    const operation = command.direction;
    const availableDelta =
      command.direction === "CREDIT"
        ? amount.toString()
        : amount.negated().toString();
    const details = JSON.stringify({
      commandId: command.governanceCommandId,
      asset,
      amount: amount.toString(),
      direction: command.direction,
      reason: command.reason,
      postingId,
      idempotencyKey: command.idempotencyKey,
    });
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "AdminGovernanceCommand" WHERE "id"=? AND "status"='APPROVED')`,
        params: [
          ledgerId,
          referenceId,
          operation,
          account.id,
          referenceId,
          command.governanceCommandId,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          nextAvailable.toString(),
          account.id,
          asset,
          current.available,
          current.locked,
          ledgerId,
        ],
      },
      this.rollbackIfNoChanges(referenceId, operation),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?,?,?,?,'0','ADMIN_FINANCIAL_CORRECTION',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          asset,
          operation,
          amount.toString(),
          availableDelta,
          referenceId,
          referenceId,
          referenceId,
          referenceId,
          JSON.stringify({ adminId: command.adminId, reason: command.reason }),
          ledgerId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, ledgerId, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        `${operation}_POSTED`,
        referenceId,
        referenceId,
        "ADMIN_FINANCIAL_CORRECTION",
        referenceId,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") SELECT ?,?,'ADMIN_FINANCIAL_CORRECTION','COMPLETED','ADMIN_FINANCIAL_CORRECTION',?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          randomUUID(),
          command.userId,
          referenceId,
          referenceId,
          postingId,
          asset,
          amount.toString(),
          details,
          ledgerId,
          postingId,
        ],
      },
      {
        sql: `UPDATE "AdminGovernanceCommand" SET "status"='EXECUTED',"executedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "status"='APPROVED' AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [command.governanceCommandId, ledgerId, postingId],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,'FINANCIAL_CORRECTION_EXECUTED',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "AdminGovernanceCommand" WHERE "id"=? AND "status"='EXECUTED')`,
        params: [
          randomUUID(),
          command.adminId,
          command.userId,
          details,
          command.governanceCommandId,
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:admin-financial-correction:${command.idempotencyKey}`,
        aggregateType: "ADMIN_FINANCIAL_CORRECTION",
        aggregateId: command.governanceCommandId,
        eventType: "FINANCIAL_CORRECTION_EXECUTED",
        correlationId: referenceId,
        payload: {
          commandId: command.governanceCommandId,
          userId: command.userId,
          asset,
          amount: amount.toString(),
          direction: command.direction,
          postingId,
          adminId: command.adminId,
        },
      }),
    ]);
    this.requireChanges(
      result,
      1,
      "D1 admin financial correction ledger transition",
    );
    this.requireChanges(result, 3, "D1 admin financial correction posting");
    this.requireChanges(
      result,
      7,
      "D1 admin financial correction governance transition",
    );
    const executed = (
      await this.bridge.select<Record<string, unknown>>(
        `SELECT * FROM "AdminGovernanceCommand" WHERE "id"=? LIMIT 1`,
        [command.governanceCommandId],
      )
    ).results[0];
    const finalAccount = await this.findAccount(account.id);
    return {
      command: executed,
      posting: this.result(postingId, finalAccount, false),
      replayed: false,
    };
  }

  async openBinaryPosition(
    command: D1BinaryOpenCommand,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const quoteAsset = this.normalizeAsset(command.asset);
    const existing = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2BinaryPosition" WHERE "userId"=? AND "idempotencyKey"=? LIMIT 1`,
      [command.userId, command.idempotencyKey],
    );
    if (existing.results[0]) return existing.results[0];
    const account = await this.getAccountForUser(command.userId, quoteAsset);
    const current = await this.findAccount(account.id);
    const stake = this.decimal(command.stake);
    const available = this.nonNegativeDecimal(current.available);
    const locked = this.nonNegativeDecimal(current.locked);
    if (available.lt(stake))
      throw new BadRequestException("Insufficient available funds");
    const idemId = randomUUID();
    const postingId = randomUUID();
    const positionId = randomUUID();
    const receipt = `gate2:binary:open:${command.idempotencyKey}`;
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt")
          SELECT ?,?,'BINARY_OPEN',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?)
            AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "asset"=? AND "scope"='MAIN' AND "status"='ACTIVE' AND "available"=? AND "locked"=?)`,
        params: [
          idemId,
          command.idempotencyKey,
          account.id,
          command.idempotencyKey,
          account.id,
          quoteAsset,
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"locked"=? ,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=? AND "asset"=? AND "scope"='MAIN' AND "status"='ACTIVE' AND "available"=? AND "locked"=?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          available.minus(stake).toString(),
          locked.plus(stake).toString(),
          account.id,
          quoteAsset,
          current.available,
          current.locked,
          idemId,
          command.idempotencyKey,
        ],
      },
      this.rollbackIfNoChanges(command.idempotencyKey, "BINARY_OPEN"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata")
          SELECT ?,?,?, 'RESERVE', ?, ?, ?, 'GATE2_BINARY_STAKE_RESERVE', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          quoteAsset,
          stake.toString(),
          stake.negated().toString(),
          stake.toString(),
          command.idempotencyKey,
          command.idempotencyKey,
          command.correlationId,
          command.correlationId,
          JSON.stringify({
            pair: command.pair,
            durationSeconds: command.durationSeconds,
          }),
          idemId,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, idemId, command.idempotencyKey, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "BINARY_RESERVE_POSTED",
        command.idempotencyKey,
        command.correlationId,
        "GATE2_BINARY_STAKE_RESERVE",
        command.idempotencyKey,
      ),
      {
        sql: `INSERT INTO "Gate2BinaryPosition" ("id","userId","pair","side","stake","entryPrice","payoutAmount","realizedProfit","durationSeconds","expiresAt","state","entryQuoteId","entryProvider","entrySource","entryObservedAt","entryReceivedAt","entrySequence","quoteFreshnessMs","configurationVersion","idempotencyKey","correlationId","createdAt","updatedAt")
          SELECT ?,?,?,?,?,?,'0','0',?,?,'ACTIVE',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)
            AND NOT EXISTS (SELECT 1 FROM "Gate2BinaryPosition" WHERE "userId"=? AND "idempotencyKey"=?)`,
        params: [
          positionId,
          command.userId,
          command.pair,
          command.side,
          stake.toString(),
          command.entryPrice,
          command.durationSeconds,
          command.expiresAt,
          command.entryQuoteId,
          command.entryProvider,
          command.entrySource,
          command.entryObservedAt,
          command.entryReceivedAt,
          command.entrySequence,
          command.quoteFreshnessMs,
          command.configurationVersion,
          command.idempotencyKey,
          command.correlationId,
          idemId,
          postingId,
          command.userId,
          command.idempotencyKey,
        ],
      },
      {
        sql: `INSERT INTO "Gate2OperationAudit" ("id","userId","operationType","operationId","eventType","idempotencyKey","details","createdAt")
          SELECT ?,?,'BINARY',?,'BINARY_OPENED',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Gate2BinaryPosition" WHERE "id"=?)`,
        params: [
          randomUUID(),
          command.userId,
          positionId,
          command.idempotencyKey,
          JSON.stringify({ receipt, postingId, pair: command.pair }),
          positionId,
        ],
      },
    ];
    statements.push(
      this.eventOutboxStatement({
        idempotencyKey: `event:binary:open:${command.idempotencyKey}`,
        aggregateType: "BINARY_POSITION",
        aggregateId: positionId,
        eventType: "BINARY_POSITION_OPENED",
        correlationId: command.correlationId ?? command.idempotencyKey,
        payload: {
          userId: command.userId,
          pair: command.pair,
          side: command.side,
          stake: stake.toString(),
        },
      }),
    );
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 1, "D1 binary stake reservation");
    this.requireChanges(result, 3, "D1 binary reserve posting");
    this.requireChanges(result, 4, "D1 binary idempotency completion");
    this.requireChanges(result, 6, "D1 binary position record");
    const created = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2BinaryPosition" WHERE "userId"=? AND "idempotencyKey"=? LIMIT 1`,
      [command.userId, command.idempotencyKey],
    );
    if (!created.results[0])
      throw new BadRequestException("D1 binary position was not materialized");
    return created.results[0];
  }

  async getBinaryPosition(
    positionId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2BinaryPosition" WHERE "id"=? LIMIT 1`,
      [positionId],
    );
    return result.results[0] ?? null;
  }

  async listBinaryPositions(
    userId?: string,
    activeOnly = false,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const active = activeOnly
      ? ` AND "state" IN ('ACTIVE','SETTLING','SETTLEMENT_DELAYED')`
      : "";
    const owner = userId === undefined ? "" : ' AND "userId"=?';
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2BinaryPosition" WHERE 1=1${owner}${active} ORDER BY "createdAt" DESC`,
      userId === undefined ? [] : [userId],
    );
    return result.results;
  }

  async updateBinaryConfiguration(command: {
    pair: string;
    sourceDurationSeconds: number;
    durationSeconds: number;
    payoutRate: number;
    minStake: number;
    maxStake: number;
    enabled: boolean;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const currentResult = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2BinaryConfiguration" WHERE "pair"=? AND "durationSeconds"=? ORDER BY "version" DESC LIMIT 1`,
      [command.pair, command.sourceDurationSeconds],
    );
    const current = currentResult.results[0];
    if (!current) throw new BadRequestException("Active Binary configuration not found");
    if (command.durationSeconds !== command.sourceDurationSeconds) {
      const conflict = await this.bridge.select<Record<string, unknown>>(
        `SELECT "id" FROM "Gate2BinaryConfiguration" WHERE "pair"=? AND "durationSeconds"=? AND "enabled"=1 LIMIT 1`,
        [command.pair, command.durationSeconds],
      );
      if (conflict.results[0]) throw new BadRequestException("Binary duration already exists for this pair");
    }
    const nextVersion = Number(current.version ?? 0) + 1;
    const nextId = randomUUID();
    const result = await this.bridge.batch([
      { sql: `UPDATE "Gate2BinaryConfiguration" SET "enabled"=0,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`, params: [String(current.id)] },
      { sql: `INSERT INTO "Gate2BinaryConfiguration" ("id","pair","durationSeconds","payoutRate","lossRate","minStake","maxStake","settlementDelaySeconds","version","enabled","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`, params: [nextId, command.pair, command.durationSeconds, command.payoutRate, Number(current.lossRate ?? 0), command.minStake, command.maxStake, Number(current.settlementDelaySeconds ?? 0), nextVersion, command.enabled ? 1 : 0] },
      { sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`, params: [randomUUID(), command.adminId, "BINARY_CONFIGURATION_UPDATED", `${command.pair}:${command.durationSeconds}`, JSON.stringify({ reason: command.reason, idempotencyKey: command.idempotencyKey, sourceDurationSeconds: command.sourceDurationSeconds, durationSeconds: command.durationSeconds, version: nextVersion })] },
      this.eventOutboxStatement({ idempotencyKey: `event:${command.idempotencyKey}`, aggregateType: "Gate2BinaryConfiguration", aggregateId: nextId, eventType: "BINARY_CONFIGURATION_UPDATED", correlationId: command.idempotencyKey, payload: { pair: command.pair, sourceDurationSeconds: command.sourceDurationSeconds, durationSeconds: command.durationSeconds, version: nextVersion } }),
    ]);
    this.requireChanges(result, 0, "D1 Binary configuration update");
    const row = await this.bridge.select<Record<string, unknown>>(`SELECT * FROM "Gate2BinaryConfiguration" WHERE "id"=? LIMIT 1`, [nextId]);
    return row.results[0];
  }

  async listBinaryConfigurations(): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT "id","pair","durationSeconds","payoutRate","lossRate","minStake","maxStake","settlementDelaySeconds","version","enabled","createdAt","updatedAt" FROM (SELECT *,ROW_NUMBER() OVER (PARTITION BY "pair","durationSeconds" ORDER BY "version" DESC) AS row_num FROM "Gate2BinaryConfiguration") WHERE row_num=1 ORDER BY "pair" ASC,"durationSeconds" ASC`,
      [],
    );
    return result.results;
  }

  async upsertDepositObservation(
    command: D1DepositObservationCommand,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const asset = this.normalizeAsset(command.asset);
    // A deposit is not CREDITED until the ledger posting and state transition
    // commit together in creditDepositAtomic().
    const state = "CONFIRMING";
    const id = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "Gate2Deposit" ("id","userId","asset","network","address","txHash","amount","confirmations","requiredConfirmations","state","observationKey","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          id,
          command.userId,
          asset,
          command.network,
          command.address,
          command.txHash,
          command.amount,
          command.confirmations,
          command.requiredConfirmations,
          state,
          command.observationKey,
        ],
      },
      {
        sql: `UPDATE "Gate2Deposit" SET "confirmations"=CASE WHEN "confirmations" < ? THEN ? ELSE "confirmations" END,"state"=CASE WHEN "state"='CREDITED' OR "creditPostingId" IS NOT NULL THEN "state" ELSE 'CONFIRMING' END,"updatedAt"=CURRENT_TIMESTAMP WHERE "network"=? AND "txHash"=? AND "address"=? AND "userId"=?`,
        params: [
          command.confirmations,
          command.confirmations,
          command.confirmations,
          command.network,
          command.txHash,
          command.address,
          command.userId,
        ],
      },
    ]);
    if (!result.results[0]?.success && !result.results[1]?.success)
      throw new BadRequestException("D1 deposit observation failed");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Deposit" WHERE "network"=? AND "txHash"=? AND "address"=? LIMIT 1`,
      [command.network, command.txHash, command.address],
    );
    if (!row.results[0])
      throw new BadRequestException("D1 deposit was not materialized");
    return row.results[0];
  }

  async markDepositCredited(
    depositId: string,
    postingId: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "Gate2Deposit" SET "state"='CREDITED',"creditPostingId"=?,"creditedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state"<>'REJECTED' AND ("creditPostingId" IS NULL OR "creditPostingId"=?)`,
        params: [postingId, depositId, postingId],
      },
    ]);
    this.requireChanges(result, 0, "D1 deposit credit state");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Deposit" WHERE "id"=? LIMIT 1`,
      [depositId],
    );
    if (!row.results[0])
      throw new BadRequestException("D1 credited deposit was not materialized");
    return row.results[0];
  }

  /** Credits a confirmed deposit and records ledger/audit/outbox in one D1 batch. */
  async creditDepositAtomic(
    depositId: string,
    reason: string,
    adminId?: string,
    idempotencyKey = `gate2:deposit:credit:${depositId}`,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const deposit: any = await this.getDeposit(depositId);
    if (!deposit) throw new NotFoundException("Deposit not found");
    if (String(deposit.state) === "CREDITED" && deposit.creditPostingId)
      return deposit;
    if (String(deposit.state) === "REJECTED")
      throw new BadRequestException("Rejected deposit cannot be credited");
    if (Number(deposit.confirmations) < Number(deposit.requiredConfirmations))
      throw new BadRequestException(
        "Deposit confirmation threshold has not been reached",
      );
    const account = await this.getAccountForUser(
      String(deposit.userId),
      String(deposit.asset),
    );
    const current = await this.findAccount(account.id);
    const amount = this.decimal(String(deposit.amount));
    const idemId = randomUUID();
    const postingId = randomUUID();
    const correlationId = depositId;
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'CREDIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "Gate2Deposit" WHERE "id"=? AND "state"<>'REJECTED' AND "creditPostingId" IS NULL)`,
        params: [idemId, idempotencyKey, account.id, idempotencyKey, depositId],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.available).plus(amount).toString(),
          account.id,
          this.normalizeAsset(String(deposit.asset)),
          current.available,
          current.locked,
          idempotencyKey,
        ],
      },
      this.rollbackIfNoChanges(idempotencyKey, "DEPOSIT_CREDIT"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'CREDIT',?,?, '0','GATE2_DEPOSIT_CREDIT',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          this.normalizeAsset(String(deposit.asset)),
          amount.toString(),
          amount.toString(),
          depositId,
          idempotencyKey,
          correlationId,
          depositId,
          JSON.stringify({ reason, adminId: adminId ?? null }),
          idempotencyKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, idempotencyKey, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "DEPOSIT_CREDIT_POSTED",
        idempotencyKey,
        correlationId,
        "GATE2_DEPOSIT_CREDIT",
        depositId,
      ),
      {
        sql: `UPDATE "Gate2Deposit" SET "state"='CREDITED',"creditPostingId"=? ,"creditedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state"<>'REJECTED' AND "creditPostingId" IS NULL AND "confirmations">="requiredConfirmations" AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=?)`,
        params: [postingId, depositId, idempotencyKey, postingId],
      },
      this.rollbackIfNoChanges(idempotencyKey, "DEPOSIT_CREDIT_STATE"),
      {
        sql: `INSERT INTO "Gate2OperationAudit" ("id","userId","operationType","operationId","eventType","idempotencyKey","details","createdAt") SELECT ?,?, 'DEPOSIT',?,'DEPOSIT_CREDITED',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Gate2Deposit" WHERE "id"=? AND "creditPostingId"=?)`,
        params: [
          randomUUID(),
          String(deposit.userId),
          depositId,
          idempotencyKey,
          JSON.stringify({ reason, adminId: adminId ?? null, postingId }),
          depositId,
          postingId,
        ],
      },
      ...(adminId
        ? [
            {
              sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,'DEPOSIT_CREDITED',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Gate2Deposit" WHERE "id"=? AND "creditPostingId"=?)`,
              params: [
                randomUUID(),
                adminId,
                depositId,
                JSON.stringify({ reason, idempotencyKey, postingId }),
                depositId,
                postingId,
              ],
            } as D1BridgeBatchStatement,
          ]
        : []),
      this.eventOutboxStatement({
        idempotencyKey: `event:deposit:credit:${depositId}:${idempotencyKey}`,
        aggregateType: "DEPOSIT",
        aggregateId: depositId,
        eventType: "DEPOSIT_CREDITED",
        correlationId,
        payload: {
          userId: String(deposit.userId),
          asset: String(deposit.asset),
          amount: String(deposit.amount),
          postingId,
        },
      }),
    ];
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 1, "D1 deposit credit account transition");
    this.requireChanges(result, 3, "D1 deposit credit posting");
    this.requireChanges(result, 6, "D1 deposit credit state");
    const row = await this.getDeposit(depositId);
    if (!row)
      throw new BadRequestException("D1 deposit credit was not materialized");
    return row;
  }

  /** Rejects a non-credited deposit with audit and durable publication atomically. */
  async rejectDepositAtomic(
    depositId: string,
    reason: string,
    adminId: string,
    idempotencyKey: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const deposit: any = await this.getDeposit(depositId);
    if (!deposit) throw new NotFoundException("Deposit not found");
    if (String(deposit.state) === "REJECTED") return deposit;
    if (String(deposit.state) === "CREDITED")
      throw new BadRequestException("Credited deposit cannot be rejected");
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `UPDATE "Gate2Deposit" SET "state"='REJECTED',"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state" NOT IN ('CREDITED','REJECTED')`,
        params: [depositId],
      },
      this.rollbackIfNoChanges(idempotencyKey, "DEPOSIT_REJECTION_STATE"),
      {
        sql: `INSERT INTO "Gate2OperationAudit" ("id","userId","operationType","operationId","eventType","idempotencyKey","details","createdAt") SELECT ?,?, 'DEPOSIT',?,'DEPOSIT_REJECTED',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Gate2Deposit" WHERE "id"=? AND "state"='REJECTED')`,
        params: [
          randomUUID(),
          String(deposit.userId),
          depositId,
          idempotencyKey,
          JSON.stringify({ reason, adminId }),
          depositId,
        ],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          adminId,
          "DEPOSIT_REJECTED",
          depositId,
          JSON.stringify({ reason, idempotencyKey }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:deposit:reject:${depositId}`,
        aggregateType: "DEPOSIT",
        aggregateId: depositId,
        eventType: "DEPOSIT_REJECTED",
        correlationId: idempotencyKey,
        payload: { userId: String(deposit.userId), reason, adminId },
      }),
    ];
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 0, "D1 deposit rejection state");
    const row = await this.getDeposit(depositId);
    if (!row)
      throw new BadRequestException(
        "D1 deposit rejection was not materialized",
      );
    return row;
  }

  async getDeposit(depositId: string): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Deposit" WHERE "id"=? LIMIT 1`,
      [depositId],
    );
    return row.results[0] ?? null;
  }

  async updateDepositState(
    depositId: string,
    state: string,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "Gate2Deposit" SET "state"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=?`,
        params: [state, depositId],
      },
    ]);
    this.requireChanges(result, 0, "D1 deposit state transition");
    const row = await this.getDeposit(depositId);
    if (!row)
      throw new BadRequestException(
        `D1 deposit ${reason ?? "state"} was not materialized`,
      );
    return row;
  }

  async getWithdrawal(
    requestKey: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Withdrawal" WHERE "requestKey"=? LIMIT 1`,
      [requestKey],
    );
    return row.results[0] ?? null;
  }

  private validateDepositClaimAmount(amountValue: string, minimumValue: string, maximumValue: string): void {
    validateDepositClaimAmount({amountValue, minimumValue, maximumValue});
  }

  async submitDepositClaim(command: DepositClaimSubmission): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const existing = await findCommandByIdempotencyKey(this.bridge,
      "DepositClaim",
      command.idempotencyKey,
    );
    if (existing) {
      if (String(existing.userId) !== command.userId)
        throw new BadRequestException("Deposit claim ownership mismatch");
      return existing;
    }
    const address = await this.bridge.select<any>(
      `SELECT d."id",d."address",c."symbol",c."minDeposit",c."maxDeposit",w."code" AS "network" FROM "DepositAddress" d JOIN "Currency" c ON c."id"=d."currencyId" JOIN "WalletNetwork" w ON w."id"=d."walletNetworkId" WHERE d."id"=? AND w."code"=? AND d."isActive"=1 AND c."symbol"=? AND c."isActive"=1 AND c."depositEnabled"=1 AND w."isActive"=1 AND w."depositEnabled"=1 LIMIT 1`,
      [
        command.depositAddressId,
        command.network.trim().toUpperCase(),
        this.normalizeAsset(command.asset),
      ],
    );
    assertDepositClaimDestination(address.results[0], command.claimedAmount);
    const result = await this.bridge.batch(depositClaimSubmissionStatements(command, address.results[0], this.eventOutboxStatement({ idempotencyKey: `event:${command.idempotencyKey}`, aggregateType: "DepositClaim", aggregateId: command.id, eventType: "DEPOSIT_CLAIM_SUBMITTED", correlationId: command.idempotencyKey, payload: { userId: command.userId, asset: address.results[0].symbol, network: address.results[0].network, claimedAmount: command.claimedAmount } })));
    this.requireChanges(result, 0, "D1 deposit claim creation");
    this.requireChanges(result, 2, "D1 deposit claim outbox");
    return readDepositClaim({bridge: this.bridge, id: command.id});
  }

  async listDepositClaims(userId?: string): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "DepositClaim"${userId ? ' WHERE "userId"=?' : ""} ORDER BY "submittedAt" DESC LIMIT 500`,
      userId ? [userId] : [],
    );
    return result.results;
  }

  async updateDepositClaimState(
    id: string,
    state: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const claim: any = (
      await this.bridge.select<Record<string, unknown>>(
        `SELECT * FROM "DepositClaim" WHERE "id"=? LIMIT 1`,
        [id],
      )
    ).results[0];
    if (!claim) throw new NotFoundException("Deposit claim not found");
    if (String(claim.state) === state) return claim;
    assertDepositClaimReview(String(claim.state));
    const result = await this.bridge.batch(depositClaimReviewStatements({id, state, adminId, reason, idempotencyKey}, this.eventOutboxStatement({ idempotencyKey: `event:${idempotencyKey}`, aggregateType: "DepositClaim", aggregateId: id, eventType: `DEPOSIT_CLAIM_${state}`, correlationId: idempotencyKey, payload: { userId: claim.userId, state, adminId, reason } })));
    this.requireChanges(result, 0, "D1 deposit claim state transition");
    this.requireChanges(result, 2, "D1 deposit claim outbox");
    return readDepositClaim({bridge: this.bridge, id});
  }

  async creditDepositClaim(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const claim: any = (
      await this.bridge.select<Record<string, unknown>>(
        `SELECT * FROM "DepositClaim" WHERE "id"=? LIMIT 1`,
        [id],
      )
    ).results[0];
    if (!claim) throw new NotFoundException("Deposit claim not found");
    if (String(claim.state) === "CREDITED") return claim;
    if (String(claim.state) !== "APPROVED")
      throw new BadRequestException(
        "Deposit claim must be approved before credit",
      );
    const account = await this.getAccountForUser(
      String(claim.userId),
      String(claim.asset),
    );
    const posting = await this.credit({
      accountId: account.id,
      asset: String(claim.asset),
      amount: String(claim.claimedAmount),
      referenceType: "MANUAL_DEPOSIT_CLAIM_CREDIT",
      referenceId: id,
      idempotencyKey: `deposit-claim:credit:${id}`,
      correlationId: id,
      economicGroup: id,
      metadata: { adminId, reason },
    });
    const result = await this.bridge.batch(depositClaimCreditStatements({id, postingId: posting.postingId, adminId, reason, idempotencyKey}, this.eventOutboxStatement({ idempotencyKey: `event:${idempotencyKey}`, aggregateType: "DepositClaim", aggregateId: id, eventType: "DEPOSIT_CLAIM_CREDITED", correlationId: idempotencyKey, payload: { userId: claim.userId, asset: claim.asset, amount: claim.claimedAmount, postingId: posting.postingId, adminId, reason } })));
    this.requireChanges(result, 0, "D1 deposit claim credit");
    this.requireChanges(result, 2, "D1 deposit claim outbox");
    return readDepositClaim({bridge: this.bridge, id});
  }

  async getWithdrawalById(
    requestId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Withdrawal" WHERE "id"=? LIMIT 1`,
      [requestId],
    );
    return row.results[0] ?? null;
  }

  async listDeposits(userId: string): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Deposit" WHERE "userId"=? ORDER BY "createdAt" DESC LIMIT 500`,
      [userId],
    );
    return row.results;
  }

  async listWithdrawals(userId: string): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Withdrawal" WHERE "userId"=? ORDER BY "createdAt" DESC LIMIT 500`,
      [userId],
    );
    return row.results;
  }

  async listInternalTransfers(
    userId: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2InternalTransfer" WHERE "fromUserId"=? OR "toUserId"=? ORDER BY "createdAt" DESC LIMIT 500`,
      [userId, userId],
    );
    return row.results;
  }

  async createWithdrawal(
    command: D1WithdrawalCreateCommand,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const id = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "Gate2Withdrawal" ("id","userId","asset","network","address","amount","fee","reservedAmount","state","requestKey","reserveKey","providerState","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,'PENDING_REVIEW',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [
          id,
          command.userId,
          this.normalizeAsset(command.asset),
          command.network,
          command.address,
          command.amount,
          command.fee,
          command.reservedAmount,
          command.requestKey,
          command.reserveKey,
          command.providerState,
        ],
      },
    ]);
    if (!result.results[0]?.success)
      throw new BadRequestException(
        "D1 withdrawal record could not be created",
      );
    const row = await this.getWithdrawal(command.requestKey);
    if (!row)
      throw new BadRequestException("D1 withdrawal was not materialized");
    return row;
  }

  async reserveWithdrawal(
    command: D1WithdrawalCreateCommand,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const existing = await this.getWithdrawal(command.requestKey);
    if (existing) return existing;
    const account = await this.getAccountForUser(command.userId, command.asset);
    const current = await this.findAccount(account.id);
    const reserved = this.decimal(command.reservedAmount);
    const available = this.nonNegativeDecimal(current.available);
    const locked = this.nonNegativeDecimal(current.locked);
    if (available.lt(reserved))
      throw new BadRequestException("Insufficient available funds");
    const reserveKey = command.reserveKey;
    const idemId = randomUUID();
    const postingId = randomUUID();
    const withdrawalId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'RESERVE',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=?)`,
        params: [
          idemId,
          reserveKey,
          account.id,
          reserveKey,
          account.id,
          String(command.asset).toUpperCase(),
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"locked"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          available.minus(reserved).toString(),
          locked.plus(reserved).toString(),
          account.id,
          String(command.asset).toUpperCase(),
          current.available,
          current.locked,
          reserveKey,
        ],
      },
      this.rollbackIfNoChanges(reserveKey, "WITHDRAWAL_RESERVE"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'RESERVE',?,?, 'GATE2_WITHDRAWAL_RESERVE',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(command.asset).toUpperCase(),
          reserved.toString(),
          reserved.negated().toString(),
          reserved.toString(),
          command.requestKey,
          reserveKey,
          command.requestKey,
          command.requestKey,
          JSON.stringify({ requestKey: command.requestKey }),
          reserveKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, reserveKey, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "WITHDRAWAL_RESERVE_POSTED",
        reserveKey,
        command.requestKey,
        "GATE2_WITHDRAWAL_RESERVE",
        command.requestKey,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") SELECT ?,?,'WITHDRAWAL','COMPLETED','GATE2_WITHDRAWAL_RESERVE',?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=?)`,
        params: [
          randomUUID(),
          command.userId,
          command.requestKey,
          reserveKey,
          command.requestKey,
          postingId,
          String(command.asset).toUpperCase(),
          reserved.toString(),
          JSON.stringify({ requestKey: command.requestKey }),
          reserveKey,
          postingId,
        ],
      },
      {
        sql: `INSERT INTO "Gate2Withdrawal" ("id","userId","asset","network","address","amount","fee","reservedAmount","state","requestKey","reserveKey","providerState","createdAt","updatedAt") SELECT ?,?,?,?,?,?,?,?,'PENDING_REVIEW',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=?)`,
        params: [
          withdrawalId,
          command.userId,
          String(command.asset).toUpperCase(),
          command.network,
          command.address,
          command.amount,
          command.fee,
          command.reservedAmount,
          command.requestKey,
          command.reserveKey,
          command.providerState,
          reserveKey,
          postingId,
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:withdrawal:reserve:${command.requestKey}`,
        aggregateType: "WITHDRAWAL",
        aggregateId: withdrawalId,
        eventType: "WITHDRAWAL_RESERVED",
        correlationId: command.requestKey,
        payload: {
          userId: command.userId,
          asset: String(command.asset).toUpperCase(),
          amount: String(command.amount),
          network: command.network,
        },
      }),
    ]);
    this.requireChanges(result, 1, "D1 withdrawal reserve account transition");
    this.requireChanges(result, 3, "D1 withdrawal reserve posting");
    this.requireChanges(result, 7, "D1 withdrawal record");
    const row = await this.getWithdrawal(command.requestKey);
    if (!row)
      throw new BadRequestException("D1 withdrawal was not materialized");
    return row;
  }

  async releaseWithdrawal(
    requestId: string,
    reason: string,
    actorId: string,
    terminalState: "REJECTED" | "FAILED",
    requestedIdempotencyKey?: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const withdrawal: any = await this.getWithdrawalById(requestId);
    if (!withdrawal) throw new NotFoundException("Withdrawal not found");
    if (String(withdrawal.state) === terminalState) return withdrawal;
    if (!["PENDING_REVIEW", "APPROVED"].includes(String(withdrawal.state)))
      throw new BadRequestException(
        "Withdrawal cannot be released from its current state",
      );
    const account = await this.getAccountForUser(
      String(withdrawal.userId),
      String(withdrawal.asset),
    );
    const current = await this.findAccount(account.id);
    const amount = this.decimal(String(withdrawal.reservedAmount));
    if (this.nonNegativeDecimal(current.locked).lt(amount))
      throw new BadRequestException("Withdrawal locked funds are insufficient");
    const key =
      requestedIdempotencyKey?.trim() ||
      `gate2:withdrawal:${terminalState.toLowerCase()}:${requestId}`;
    const idemId = randomUUID();
    const postingId = randomUUID();
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'RELEASE',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "Gate2Withdrawal" WHERE "id"=? AND "state" IN ('PENDING_REVIEW','APPROVED'))`,
        params: [idemId, key, account.id, key, requestId],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"locked"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.available).plus(amount).toString(),
          this.nonNegativeDecimal(current.locked).minus(amount).toString(),
          account.id,
          String(withdrawal.asset).toUpperCase(),
          current.available,
          current.locked,
          key,
        ],
      },
      this.rollbackIfNoChanges(key, "WITHDRAWAL_RELEASE"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'RELEASE',?,?, 'GATE2_WITHDRAWAL_RELEASE',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(withdrawal.asset).toUpperCase(),
          amount.toString(),
          amount.toString(),
          amount.negated().toString(),
          requestId,
          key,
          requestId,
          requestId,
          JSON.stringify({ reason, actorId, state: terminalState }),
          key,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, key, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "WITHDRAWAL_RELEASE_POSTED",
        key,
        requestId,
        "GATE2_WITHDRAWAL_RELEASE",
        requestId,
      ),
      {
        sql: `UPDATE "Gate2Withdrawal" SET "state"=? ,"reviewReason"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state" IN ('PENDING_REVIEW','APPROVED') AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=?)`,
        params: [terminalState, reason, requestId, key, postingId],
      },
      {
        sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          actorId,
          `WITHDRAWAL_${terminalState}`,
          requestId,
          JSON.stringify({ reason, idempotencyKey: key }),
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:withdrawal:${terminalState.toLowerCase()}:${requestId}`,
        aggregateType: "WITHDRAWAL",
        aggregateId: requestId,
        eventType: `WITHDRAWAL_${terminalState}`,
        correlationId: requestId,
        payload: {
          userId: String(withdrawal.userId),
          asset: String(withdrawal.asset),
          reason,
          actorId,
          idempotencyKey: key,
        },
      }),
    ]);
    this.requireChanges(result, 1, "D1 withdrawal release account transition");
    this.requireChanges(result, 3, "D1 withdrawal release posting");
    this.requireChanges(result, 6, "D1 withdrawal state transition");
    const row = await this.getWithdrawalById(requestId);
    if (!row)
      throw new BadRequestException(
        "D1 withdrawal release was not materialized",
      );
    return row;
  }

  async updateWithdrawalState(
    requestId: string,
    state: string,
    reason?: string,
    txHash?: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const allowedFrom =
      state === "APPROVED"
        ? "PENDING_REVIEW"
        : state === "SETTLED"
          ? "APPROVED"
          : null;
    if (!allowedFrom)
      throw new BadRequestException("Unsupported withdrawal state transition");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "Gate2Withdrawal" SET "state"=?,"reviewReason"=COALESCE(?,"reviewReason"),"txHash"=COALESCE(?,"txHash"),"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state"=?`,
        params: [state, reason ?? null, txHash ?? null, requestId, allowedFrom],
      },
    ]);
    this.requireChanges(result, 0, "D1 withdrawal state transition");
    const row = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2Withdrawal" WHERE "id"=? LIMIT 1`,
      [requestId],
    );
    if (!row.results[0])
      throw new BadRequestException("D1 withdrawal was not materialized");
    return row.results[0];
  }

  /** Settles an approved withdrawal, ledger release and publication atomically. */
  async settleWithdrawalAtomic(
    requestId: string,
    providerReceipt: string,
    adminId?: string,
    reason?: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const withdrawal: any = await this.getWithdrawalById(requestId);
    if (!withdrawal) throw new NotFoundException("Withdrawal not found");
    if (String(withdrawal.state) === "SETTLED") return withdrawal;
    if (String(withdrawal.state) !== "APPROVED")
      throw new BadRequestException("Withdrawal is not approved");
    const account = await this.getAccountForUser(
      String(withdrawal.userId),
      String(withdrawal.asset),
    );
    const current = await this.findAccount(account.id);
    const amount = this.decimal(String(withdrawal.reservedAmount));
    const key = `gate2:withdrawal:settle:${requestId}`;
    const idemId = randomUUID();
    const postingId = randomUUID();
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'SETTLEMENT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?) AND EXISTS (SELECT 1 FROM "Gate2Withdrawal" WHERE "id"=? AND "state"='APPROVED')`,
        params: [idemId, key, account.id, key, requestId],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "locked"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          this.nonNegativeDecimal(current.locked).minus(amount).toString(),
          account.id,
          this.normalizeAsset(String(withdrawal.asset)),
          current.available,
          current.locked,
          key,
        ],
      },
      this.rollbackIfNoChanges(key, "WITHDRAWAL_SETTLEMENT"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'SETTLEMENT',?,?, 'GATE2_WITHDRAWAL_SETTLEMENT',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          this.normalizeAsset(String(withdrawal.asset)),
          amount.toString(),
          "0",
          requestId,
          key,
          requestId,
          requestId,
          JSON.stringify({
            providerReceipt,
            adminId: adminId ?? null,
            reason: reason ?? null,
          }),
          key,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [postingId, key, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "WITHDRAWAL_SETTLEMENT_POSTED",
        key,
        requestId,
        "GATE2_WITHDRAWAL_SETTLEMENT",
        requestId,
      ),
      {
        sql: `UPDATE "Gate2Withdrawal" SET "state"='SETTLED',"txHash"=? ,"providerState"='DETERMINISTIC_TEST_NON_LIVE',"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state"='APPROVED' AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=?)`,
        params: [providerReceipt, requestId, key, postingId],
      },
      this.rollbackIfNoChanges(key, "WITHDRAWAL_SETTLEMENT_STATE"),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") SELECT ?,?,'WITHDRAWAL','COMPLETED','GATE2_WITHDRAWAL_SETTLEMENT',?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Gate2Withdrawal" WHERE "id"=? AND "state"='SETTLED')`,
        params: [
          randomUUID(),
          String(withdrawal.userId),
          requestId,
          key,
          requestId,
          postingId,
          this.normalizeAsset(String(withdrawal.asset)),
          amount.toString(),
          JSON.stringify({ providerReceipt }),
          requestId,
        ],
      },
      ...(adminId
        ? [
            {
              sql: `INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,'WITHDRAWAL_SETTLED',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Gate2Withdrawal" WHERE "id"=? AND "state"='SETTLED')`,
              params: [
                randomUUID(),
                adminId,
                requestId,
                JSON.stringify({ providerReceipt, reason }),
                requestId,
              ],
            } as D1BridgeBatchStatement,
          ]
        : []),
      this.eventOutboxStatement({
        idempotencyKey: `event:withdrawal:settle:${requestId}`,
        aggregateType: "WITHDRAWAL",
        aggregateId: requestId,
        eventType: "WITHDRAWAL_SETTLED",
        correlationId: requestId,
        payload: {
          userId: String(withdrawal.userId),
          asset: String(withdrawal.asset),
          amount: String(withdrawal.amount),
          providerReceipt,
        },
      }),
    ];
    const result = await this.bridge.batch(statements);
    this.requireChanges(
      result,
      1,
      "D1 withdrawal settlement account transition",
    );
    this.requireChanges(result, 3, "D1 withdrawal settlement posting");
    this.requireChanges(result, 6, "D1 withdrawal settlement state");
    const row = await this.getWithdrawalById(requestId);
    if (!row)
      throw new BadRequestException(
        "D1 withdrawal settlement was not materialized",
      );
    return row;
  }

  async approveWithdrawal(
    requestId: string,
    reason: string,
    adminId: string,
    idempotencyKey: string,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    if (!idempotencyKey?.trim())
      throw new BadRequestException("Idempotency key is required");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "Gate2Withdrawal" SET "state"='APPROVED',"reviewReason"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "state"='PENDING_REVIEW'`,
        params: [reason, requestId],
      },
      {
        sql: `INSERT OR IGNORE INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?, 'WITHDRAWAL_APPROVED',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Gate2Withdrawal" WHERE "id"=? AND "state"='APPROVED')`,
        params: [
          randomUUID(),
          adminId,
          requestId,
          JSON.stringify({ reason, idempotencyKey }),
          requestId,
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: `event:withdrawal:approve:${requestId}:${idempotencyKey}`,
        aggregateType: "WITHDRAWAL",
        aggregateId: requestId,
        eventType: "WITHDRAWAL_APPROVED",
        correlationId: idempotencyKey,
        payload: { adminId, reason },
      }),
    ]);
    this.requireChanges(result, 0, "D1 withdrawal approval");
    const row = await this.getWithdrawalById(requestId);
    if (!row) throw new NotFoundException("Withdrawal not found");
    return row;
  }

  async settleBinaryPosition(
    command: D1BinarySettleCommand,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const account = await this.getAccountForUser(command.userId, command.asset);
    const receipt = `gate2:binary:settlement:${command.positionId}`;
    await this.settle({
      accountId: account.id,
      asset: command.asset,
      amount: command.stake,
      referenceType: "GATE2_BINARY_STAKE_SETTLEMENT",
      referenceId: command.positionId,
      idempotencyKey: `${receipt}:stake`,
      correlationId: command.correlationId,
      economicGroup: receipt,
    });
    if (!new Prisma.Decimal(command.payout).isZero()) {
      await this.credit({
        accountId: account.id,
        asset: command.asset,
        amount: command.payout,
        referenceType: "GATE2_BINARY_PAYOUT",
        referenceId: command.positionId,
        idempotencyKey: `${receipt}:payout`,
        correlationId: command.correlationId,
        economicGroup: receipt,
      });
    }
    const updated = await this.bridge.batch([
      {
        sql: `UPDATE "Gate2BinaryPosition" SET "state"=?,"expiryPrice"=?,"payoutAmount"=?,"realizedProfit"=?,"expiryQuoteId"=?,"expiryProvider"=?,"expirySource"=?,"expiryObservedAt"=?,"expiryReceivedAt"=?,"expirySequence"=?,"settlementReceiptId"=?,"updatedAt"=CURRENT_TIMESTAMP
        WHERE "id"=? AND "userId"=? AND "state" IN ('ACTIVE','SETTLING','SETTLEMENT_DELAYED')`,
        params: [
          command.state,
          command.expiryPrice,
          command.payout,
          command.realizedProfit,
          command.expiryQuoteId,
          command.expiryProvider,
          command.expirySource,
          command.expiryObservedAt,
          command.expiryReceivedAt,
          command.expirySequence,
          receipt,
          command.positionId,
          command.userId,
        ],
      },
    ]);
    this.requireChanges(updated, 0, "D1 binary position settlement");
    const row = await this.getBinaryPosition(command.positionId);
    if (!row)
      throw new BadRequestException(
        "D1 binary settlement was not materialized",
      );
    return row;
  }

  /** Settles the stake release, payout, audit trail, and position transition in one D1 batch. */
  async settleBinaryPositionAtomic(
    command: D1BinarySettleCommand,
  ): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const existing: any = await this.getBinaryPosition(command.positionId);
    if (!existing) throw new NotFoundException("Binary position not found");
    if (String(existing.userId) !== command.userId)
      throw new BadRequestException("Binary position ownership mismatch");
    if (["WIN", "LOSS", "ERROR"].includes(String(existing.state)))
      return existing;
    const account = await this.getAccountForUser(command.userId, command.asset);
    const current = await this.findAccount(account.id);
    const stake = this.decimal(command.stake);
    const payout = this.nonNegativeOrSignedDecimal(command.payout);
    const available = this.nonNegativeDecimal(current.available);
    const locked = this.nonNegativeDecimal(current.locked);
    if (locked.lt(stake))
      throw new BadRequestException("Binary stake is not reserved");
    const receipt = `gate2:binary:settlement:${command.positionId}`;
    const stakeKey = `${receipt}:stake`;
    const payoutKey = `${receipt}:payout`;
    const stakeId = randomUUID();
    const payoutId = randomUUID();
    const stakePostingId = randomUUID();
    const payoutPostingId = randomUUID();
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'SETTLEMENT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?)`,
        params: [stakeId, stakeKey, account.id, stakeKey],
      },
      ...(payout.isZero()
        ? []
        : [
            {
              sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt") SELECT ?,?,'CREDIT',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=?)`,
              params: [payoutId, payoutKey, account.id, payoutKey],
            },
          ]),
      {
        sql: `UPDATE "LedgerAccount" SET "available"=? ,"locked"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "status"='ACTIVE' AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)${payout.isZero() ? "" : ' AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)'}`,
        params: [
          available.plus(payout).toString(),
          locked.minus(stake).toString(),
          account.id,
          String(command.asset).toUpperCase(),
          current.available,
          current.locked,
          stakeKey,
          ...(payout.isZero() ? [] : [payoutKey]),
        ],
      },
      this.rollbackIfNoChanges(stakeKey, "BINARY_SETTLEMENT"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'SETTLEMENT',?,?, 'GATE2_BINARY_STAKE_SETTLEMENT',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
        params: [
          stakePostingId,
          account.id,
          String(command.asset).toUpperCase(),
          stake.toString(),
          "0",
          stake.negated().toString(),
          command.positionId,
          stakeKey,
          command.correlationId,
          receipt,
          JSON.stringify({ positionId: command.positionId }),
          stakeKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
        params: [stakePostingId, stakeKey, stakePostingId],
      },
      this.auditStatement(
        account.id,
        stakePostingId,
        "BINARY_SETTLEMENT_POSTED",
        stakeKey,
        command.correlationId,
        "GATE2_BINARY_STAKE_SETTLEMENT",
        command.positionId,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") VALUES (?,?, 'BINARY_SETTLEMENT','COMPLETED','GATE2_BINARY_STAKE_SETTLEMENT',?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          command.userId,
          command.positionId,
          stakeKey,
          command.correlationId,
          stakePostingId,
          String(command.asset).toUpperCase(),
          stake.toString(),
          JSON.stringify({ receipt }),
        ],
      },
    ];
    if (!payout.isZero()) {
      statements.push(
        {
          sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") SELECT ?,?,?, 'CREDIT',?,?, 'GATE2_BINARY_PAYOUT',?,?,?,?,CURRENT_TIMESTAMP,? WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL)`,
          params: [
            payoutPostingId,
            account.id,
            String(command.asset).toUpperCase(),
            payout.toString(),
            payout.toString(),
            "0",
            command.positionId,
            payoutKey,
            command.correlationId,
            receipt,
            JSON.stringify({ positionId: command.positionId }),
            payoutKey,
          ],
        },
        {
          sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "idempotencyKey"=? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id"=?)`,
          params: [payoutPostingId, payoutKey, payoutPostingId],
        },
        this.auditStatement(
          account.id,
          payoutPostingId,
          "BINARY_PAYOUT_POSTED",
          payoutKey,
          command.correlationId,
          "GATE2_BINARY_PAYOUT",
          command.positionId,
        ),
        {
          sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") VALUES (?,?, 'BINARY_PAYOUT','COMPLETED','GATE2_BINARY_PAYOUT',?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
          params: [
            randomUUID(),
            command.userId,
            command.positionId,
            payoutKey,
            command.correlationId,
            payoutPostingId,
            String(command.asset).toUpperCase(),
            payout.toString(),
            JSON.stringify({ receipt }),
          ],
        },
      );
    }
    const positionIndex = statements.length;
    statements.push({
      sql: `UPDATE "Gate2BinaryPosition" SET "state"=? ,"expiryPrice"=? ,"payoutAmount"=? ,"realizedProfit"=? ,"expiryQuoteId"=? ,"expiryProvider"=? ,"expirySource"=? ,"expiryObservedAt"=? ,"expiryReceivedAt"=? ,"expirySequence"=? ,"settlementReceiptId"=? ,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "userId"=? AND "state" IN ('ACTIVE','SETTLING','SETTLEMENT_DELAYED') AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=?)`,
      params: [
        command.state,
        command.expiryPrice,
        command.payout,
        command.realizedProfit,
        command.expiryQuoteId,
        command.expiryProvider,
        command.expirySource,
        command.expiryObservedAt,
        command.expiryReceivedAt,
        command.expirySequence,
        receipt,
        command.positionId,
        command.userId,
        stakeKey,
        stakePostingId,
      ],
    });
    const result = await this.bridge.batch(statements);
    const accountIndex = payout.isZero() ? 1 : 2;
    const stakePostingIndex = accountIndex + 2;
    this.requireChanges(result, accountIndex, "D1 binary account settlement");
    this.requireChanges(result, stakePostingIndex, "D1 binary stake posting");
    this.requireChanges(result, positionIndex, "D1 binary position settlement");
    const row = await this.getBinaryPosition(command.positionId);
    if (!row)
      throw new BadRequestException(
        "D1 binary settlement was not materialized",
      );
    return row;
  }

  async reserveSpotOrder(command: D1SpotOrderCommand): Promise<any> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const existing = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "userId" = ? AND "idempotencyKey" = ? LIMIT 1`,
      [command.userId, command.idempotencyKey],
    );
    if (existing.results[0]) return existing.results[0];

    const account = await this.getAccountForUser(
      command.userId,
      command.reserveAsset,
      command.reserveScope,
    );
    const current = await this.findAccount(account.id);
    const available = this.nonNegativeDecimal(current.available);
    const locked = this.nonNegativeDecimal(current.locked);
    const reserved = this.decimal(command.reservedAmount);
    if (available.lt(reserved))
      throw new BadRequestException("Insufficient available funds");

    const idempotencyId = randomUUID();
    const postingId = randomUUID();
    const orderId = randomUUID();
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id", "idempotencyKey", "operation", "accountId", "createdAt", "updatedAt")
          SELECT ?, ?, 'RESERVE', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey" = ?)
            AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id" = ? AND "asset" = ? AND "scope" = ? AND "status" = 'ACTIVE' AND "available" = ? AND "locked" = ?)`,
        params: [
          idempotencyId,
          command.idempotencyKey,
          account.id,
          command.idempotencyKey,
          account.id,
          command.reserveAsset.toUpperCase(),
          command.reserveScope,
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available" = ?, "locked" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "asset" = ? AND "scope" = ? AND "status" = 'ACTIVE' AND "available" = ? AND "locked" = ?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          available.minus(reserved).toString(),
          locked.plus(reserved).toString(),
          account.id,
          command.reserveAsset.toUpperCase(),
          command.reserveScope,
          current.available,
          current.locked,
          idempotencyId,
          command.idempotencyKey,
        ],
      },
      this.rollbackIfNoChanges(command.idempotencyKey, "RESERVE"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id", "accountId", "asset", "kind", "amount", "availableDelta", "lockedDelta", "referenceType", "referenceId", "idempotencyKey", "correlationId", "economicGroup", "createdAt", "metadata")
          SELECT ?, ?, ?, 'RESERVE', ?, ?, ?, 'GATE2_SPOT_ORDER_RESERVE', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          command.reserveAsset.toUpperCase(),
          reserved.toString(),
          reserved.negated().toString(),
          reserved.toString(),
          command.idempotencyKey,
          command.idempotencyKey,
          command.correlationId,
          command.correlationId,
          JSON.stringify({
            pair: command.pair,
            side: command.side,
            type: command.type,
          }),
          idempotencyId,
          command.idempotencyKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id" = ?)`,
        params: [postingId, idempotencyId, command.idempotencyKey, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "RESERVE_POSTED",
        command.idempotencyKey,
        command.correlationId,
        "GATE2_SPOT_ORDER_RESERVE",
        command.idempotencyKey,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id", "userId", "type", "status", "referenceType", "referenceId", "idempotencyKey", "ledgerCorrelationId", "ledgerPostingId", "asset", "amount", "details", "createdAt")
          SELECT ?, ?, 'GATE2_SPOT_ORDER', 'COMPLETED', 'GATE2_SPOT_ORDER_RESERVE', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "debitPostingId" = ?)`,
        params: [
          randomUUID(),
          command.userId,
          command.idempotencyKey,
          `activity:gate2:spot:${command.idempotencyKey}`,
          command.correlationId,
          postingId,
          command.reserveAsset.toUpperCase(),
          reserved.toString(),
          JSON.stringify({
            pair: command.pair,
            side: command.side,
            type: command.type,
          }),
          idempotencyId,
          postingId,
        ],
      },
      {
        sql: `INSERT INTO "Gate2SpotOrder" ("id", "userId", "pair", "baseAsset", "quoteAsset", "side", "type", "status", "amount", "filled", "remaining", "price", "stopPrice", "reserveAsset", "reserveScope", "reservedAmount", "feeRate", "idempotencyKey", "correlationId", "createdAt", "updatedAt")
          SELECT ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, '0', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "debitPostingId" = ?)
            AND NOT EXISTS (SELECT 1 FROM "Gate2SpotOrder" WHERE "userId" = ? AND "idempotencyKey" = ?)`,
        params: [
          orderId,
          command.userId,
          command.pair,
          command.baseAsset,
          command.quoteAsset,
          command.side,
          command.type,
          command.amount,
          command.amount,
          command.price,
          command.stopPrice,
          command.reserveAsset.toUpperCase(),
          command.reserveScope,
          reserved.toString(),
          command.feeRate,
          command.idempotencyKey,
          command.correlationId,
          idempotencyId,
          postingId,
          command.userId,
          command.idempotencyKey,
        ],
      },
    ];
    statements.push(
      this.eventOutboxStatement({
        idempotencyKey: `event:spot:open:${command.idempotencyKey}`,
        aggregateType: "SPOT_ORDER",
        aggregateId: orderId,
        eventType: "SPOT_ORDER_RESERVED",
        correlationId: command.idempotencyKey,
        payload: {
          userId: command.userId,
          pair: command.pair,
          side: command.side,
          amount: String(command.amount),
          reserveAsset: command.reserveAsset,
        },
      }),
    );
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 1, "D1 spot order account reservation");
    this.requireChanges(result, 3, "D1 spot order ledger posting");
    this.requireChanges(result, 7, "D1 spot order record");
    const created = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "userId" = ? AND "idempotencyKey" = ? LIMIT 1`,
      [command.userId, command.idempotencyKey],
    );
    if (!created.results[0])
      throw new Error("D1 spot order was not materialized");
    return created.results[0];
  }

  async cancelSpotOrder(userId: string, orderId: string): Promise<any> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const found = await this.bridge.select<any>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "id" = ? AND "userId" = ? LIMIT 1`,
      [orderId, userId],
    );
    const order = found.results[0];
    if (!order) throw new BadRequestException("Order not found");
    if (order.status === "CANCELED") return { ...order, replayed: true };
    if (!["OPEN", "PARTIALLY_FILLED"].includes(String(order.status))) {
      throw new BadRequestException("Order is already terminal");
    }
    const release = this.nonNegativeDecimal(String(order.reservedAmount));
    const account = await this.getAccountForUser(
      userId,
      String(order.reserveAsset),
      String(order.reserveScope ?? "MAIN"),
    );
    const current = await this.findAccount(account.id);
    const available = this.nonNegativeDecimal(current.available);
    const locked = this.nonNegativeDecimal(current.locked);
    const key = `gate2:spot:cancel-release:${orderId}`;
    const idem = randomUUID();
    const postingId = randomUUID();
    if (release.isZero()) {
      const result = await this.bridge.batch([
        {
          sql: `UPDATE "Gate2SpotOrder" SET "status" = 'CANCELED', "reservedAmount" = '0', "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "userId" = ? AND "status" IN ('OPEN', 'PARTIALLY_FILLED')`,
          params: [orderId, userId],
        },
      ]);
      this.requireChanges(result, 0, "D1 Spot zero-reserve cancellation");
      const updated = await this.bridge.select<any>(
        `SELECT * FROM "Gate2SpotOrder" WHERE "id" = ? LIMIT 1`,
        [orderId],
      );
      return { ...updated.results[0], replayed: false };
    }
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id", "idempotencyKey", "operation", "accountId", "createdAt", "updatedAt")
          SELECT ?, ?, 'RELEASE', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey" = ?)
            AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id" = ? AND "asset" = ? AND "scope" = ? AND "status" = 'ACTIVE' AND "available" = ? AND "locked" = ?)`,
        params: [
          idem,
          key,
          account.id,
          key,
          account.id,
          String(order.reserveAsset).toUpperCase(),
          String(order.reserveScope ?? "MAIN"),
          current.available,
          current.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount" SET "available" = ?, "locked" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "asset" = ? AND "scope" = ? AND "status" = 'ACTIVE' AND "available" = ? AND "locked" = ?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          available.plus(release).toString(),
          locked.minus(release).toString(),
          account.id,
          String(order.reserveAsset).toUpperCase(),
          String(order.reserveScope ?? "MAIN"),
          current.available,
          current.locked,
          idem,
          key,
        ],
      },
      this.rollbackIfNoChanges(key, "RELEASE"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id", "accountId", "asset", "kind", "amount", "availableDelta", "lockedDelta", "referenceType", "referenceId", "idempotencyKey", "correlationId", "economicGroup", "createdAt", "metadata")
          SELECT ?, ?, ?, 'RELEASE', ?, ?, ?, 'GATE2_SPOT_ORDER_CANCEL_RELEASE', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          account.id,
          String(order.reserveAsset).toUpperCase(),
          release.toString(),
          release.toString(),
          release.negated().toString(),
          orderId,
          key,
          String(order.correlationId),
          String(order.correlationId),
          JSON.stringify({ orderId }),
          idem,
          key,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id" = ?)`,
        params: [postingId, idem, key, postingId],
      },
      this.auditStatement(
        account.id,
        postingId,
        "RELEASE_POSTED",
        key,
        String(order.correlationId),
        "GATE2_SPOT_ORDER_CANCEL_RELEASE",
        orderId,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id", "userId", "type", "status", "referenceType", "referenceId", "idempotencyKey", "ledgerCorrelationId", "ledgerPostingId", "asset", "amount", "details", "createdAt")
          SELECT ?, ?, 'GATE2_SPOT_ORDER', 'COMPLETED', 'GATE2_SPOT_ORDER_CANCEL_RELEASE', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "debitPostingId" = ?)`,
        params: [
          randomUUID(),
          userId,
          orderId,
          `activity:gate2:spot:cancel:${orderId}`,
          String(order.correlationId),
          postingId,
          String(order.reserveAsset).toUpperCase(),
          release.toString(),
          JSON.stringify({ orderId }),
          idem,
          postingId,
        ],
      },
      {
        sql: `UPDATE "Gate2SpotOrder" SET "status" = 'CANCELED', "reservedAmount" = '0', "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "userId" = ? AND "status" IN ('OPEN', 'PARTIALLY_FILLED') AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "debitPostingId" = ?)`,
        params: [orderId, userId, idem, postingId],
      },
    ];
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 1, "D1 Spot cancellation release");
    this.requireChanges(result, 3, "D1 Spot cancellation posting");
    this.requireChanges(result, 7, "D1 Spot cancellation order transition");
    const updated = await this.bridge.select<any>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "id" = ? LIMIT 1`,
      [orderId],
    );
    if (!updated.results[0])
      throw new Error("D1 Spot cancellation was not materialized");
    return { ...updated.results[0], replayed: false };
  }

  /**
   * Match exactly one FIFO/price-priority pair in one atomic D1 batch.
   * Monetary values remain decimal strings in storage; ordering is therefore
   * performed with Prisma.Decimal in the command boundary rather than SQLite
   * numeric coercion. A compare-and-swap guard prevents stale concurrent fills.
   */
  async matchSpotOrder(
    command: D1SpotMatchCommand,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const pair = command.pair.trim().toUpperCase();
    const eligible = `("type" <> 'STOP' OR ("type" = 'STOP' AND "triggeredAt" IS NOT NULL))`;
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "pair" = ? AND "side" IN ('BUY', 'SELL')
        AND "status" IN ('OPEN', 'PARTIALLY_FILLED') AND ${eligible}`,
      [pair],
    );
    const orders = result.results;
    const buys = orders.filter((o) => String(o.side) === "BUY");
    const sells = orders.filter((o) => String(o.side) === "SELL");
    const price = (o: Record<string, unknown>) =>
      this.nonNegativeDecimal(String(o.price));
    buys.sort(
      (a, b) =>
        price(b).comparedTo(price(a)) ||
        String(a.createdAt).localeCompare(String(b.createdAt)) ||
        String(a.id).localeCompare(String(b.id)),
    );
    sells.sort(
      (a, b) =>
        price(a).comparedTo(price(b)) ||
        String(a.createdAt).localeCompare(String(b.createdAt)) ||
        String(a.id).localeCompare(String(b.id)),
    );
    const buy = buys[0];
    const sell = sells[0];
    if (!buy || !sell || price(buy).lt(price(sell))) return null;
    if (
      String(buy.userId) === String(sell.userId) &&
      String(buy.id) === String(sell.id)
    )
      return null;

    const amount = Prisma.Decimal.min(
      this.decimal(String(buy.remaining)),
      this.decimal(String(sell.remaining)),
    );
    if (amount.isZero()) return null;
    const tradePrice = price(sell);
    const buyerFee = amount
      .mul(tradePrice)
      .mul(this.nonNegativeDecimal(String(buy.feeRate)))
      .toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
    const sellerFee = amount
      .mul(tradePrice)
      .mul(this.nonNegativeDecimal(String(sell.feeRate)))
      .toDecimalPlaces(18, Prisma.Decimal.ROUND_DOWN);
    const buyerReserveChunk = amount
      .mul(price(buy))
      .mul(
        new Prisma.Decimal(1).add(this.nonNegativeDecimal(String(buy.feeRate))),
      );
    const buyerUsed = amount.mul(tradePrice).add(buyerFee);
    const buyerRelease = buyerReserveChunk.sub(buyerUsed);
    if (buyerRelease.isNegative())
      throw new BadRequestException("D1 Spot buyer reserve is inconsistent");
    const sellerProceeds = amount.mul(tradePrice).sub(sellerFee);
    const fillKey = `gate2:spot:fill:${buy.id}:${sell.id}:${buy.filled}:${sell.filled}:${amount.toString()}`;
    const existing = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotTrade" WHERE "idempotencyKey" = ? LIMIT 1`,
      [fillKey],
    );
    if (existing.results[0]) return existing.results[0];

    const buyerQuote = await this.getAccountForUser(
      String(buy.userId),
      String(buy.reserveAsset),
      String(buy.reserveScope ?? "MAIN"),
    );
    const sellerBase = await this.getAccountForUser(
      String(sell.userId),
      String(sell.reserveAsset),
      String(sell.reserveScope ?? "MAIN"),
    );
    const buyerBase = await this.getAccountForUser(
      String(buy.userId),
      String(buy.baseAsset),
      String(buy.reserveScope ?? "MAIN"),
    );
    const sellerQuote = await this.getAccountForUser(
      String(sell.userId),
      String(sell.quoteAsset),
      String(sell.reserveScope ?? "MAIN"),
    );
    const accounts = await this.findAccounts([
      buyerQuote.id,
      sellerBase.id,
      buyerBase.id,
      sellerQuote.id,
    ]);
    const byId = (id: string) => accounts.find((a) => a.id === id);
    const buyerQuoteRow = byId(buyerQuote.id);
    const sellerBaseRow = byId(sellerBase.id);
    const buyerBaseRow = byId(buyerBase.id);
    const sellerQuoteRow = byId(sellerQuote.id);
    if (!buyerQuoteRow || !sellerBaseRow || !buyerBaseRow || !sellerQuoteRow)
      throw new BadRequestException("D1 Spot fill account is unavailable");
    const buyerQuoteLocked = this.nonNegativeDecimal(buyerQuoteRow.locked);
    const sellerBaseLocked = this.nonNegativeDecimal(sellerBaseRow.locked);
    if (buyerQuoteLocked.lt(buyerReserveChunk) || sellerBaseLocked.lt(amount))
      throw new BadRequestException("D1 Spot reserved balance is inconsistent");
    const buyerQuoteNext = {
      available: this.nonNegativeDecimal(buyerQuoteRow.available).plus(
        buyerRelease,
      ),
      locked: buyerQuoteLocked.sub(buyerReserveChunk),
    };
    const sellerBaseNext = {
      available: this.nonNegativeDecimal(sellerBaseRow.available),
      locked: sellerBaseLocked.sub(amount),
    };
    const buyerBaseNext = {
      available: this.nonNegativeDecimal(buyerBaseRow.available).plus(amount),
      locked: this.nonNegativeDecimal(buyerBaseRow.locked),
    };
    const sellerQuoteNext = {
      available: this.nonNegativeDecimal(sellerQuoteRow.available).plus(
        sellerProceeds,
      ),
      locked: this.nonNegativeDecimal(sellerQuoteRow.locked),
    };
    const buyerRemaining = this.decimal(String(buy.remaining)).sub(amount);
    const sellerRemaining = this.decimal(String(sell.remaining)).sub(amount);
    const buyerStatus = buyerRemaining.isZero() ? "FILLED" : "PARTIALLY_FILLED";
    const sellerStatus = sellerRemaining.isZero()
      ? "FILLED"
      : "PARTIALLY_FILLED";
    const idemId = randomUUID();
    const postingRows = [
      {
        id: randomUUID(),
        account: buyerQuoteRow,
        asset: String(buy.reserveAsset).toUpperCase(),
        kind: "SETTLEMENT",
        amount: buyerUsed,
        availableDelta: new Prisma.Decimal(0),
        lockedDelta: buyerUsed.negated(),
        ref: "GATE2_SPOT_FILL_BUYER",
        meta: { side: "BUY", orderId: buy.id, fillKey },
      },
      ...(buyerRelease.gt(0)
        ? [
            {
              id: randomUUID(),
              account: buyerQuoteRow,
              asset: String(buy.reserveAsset).toUpperCase(),
              kind: "RELEASE",
              amount: buyerRelease,
              availableDelta: buyerRelease,
              lockedDelta: buyerRelease.negated(),
              ref: "GATE2_SPOT_FILL_BUYER_RELEASE",
              meta: { orderId: buy.id, fillKey },
            },
          ]
        : []),
      {
        id: randomUUID(),
        account: buyerBaseRow,
        asset: String(buy.baseAsset).toUpperCase(),
        kind: "CREDIT",
        amount,
        availableDelta: amount,
        lockedDelta: new Prisma.Decimal(0),
        ref: "GATE2_SPOT_FILL_BUYER_CREDIT",
        meta: { orderId: buy.id, fillKey },
      },
      {
        id: randomUUID(),
        account: sellerBaseRow,
        asset: String(sell.reserveAsset).toUpperCase(),
        kind: "SETTLEMENT",
        amount,
        availableDelta: new Prisma.Decimal(0),
        lockedDelta: amount.negated(),
        ref: "GATE2_SPOT_FILL_SELLER",
        meta: { orderId: sell.id, fillKey },
      },
      {
        id: randomUUID(),
        account: sellerQuoteRow,
        asset: String(sell.quoteAsset).toUpperCase(),
        kind: "CREDIT",
        amount: sellerProceeds,
        availableDelta: sellerProceeds,
        lockedDelta: new Prisma.Decimal(0),
        ref: "GATE2_SPOT_FILL_SELLER_CREDIT",
        meta: { orderId: sell.id, fillKey },
      },
    ];
    const markerParams: D1BridgeParameter[] = [
      idemId,
      fillKey,
      buyerQuoteRow.id,
      fillKey,
      String(buy.id),
      String(buy.status),
      String(buy.filled),
      String(buy.remaining),
      String(buy.reservedAmount),
      String(sell.id),
      String(sell.status),
      String(sell.filled),
      String(sell.remaining),
      String(sell.reservedAmount),
      buyerQuoteRow.id,
      buyerQuoteRow.asset,
      buyerQuoteRow.scope ?? "MAIN",
      buyerQuoteRow.available,
      buyerQuoteRow.locked,
      sellerBaseRow.id,
      sellerBaseRow.asset,
      sellerBaseRow.scope ?? "MAIN",
      sellerBaseRow.available,
      sellerBaseRow.locked,
      buyerBaseRow.id,
      buyerBaseRow.asset,
      buyerBaseRow.scope ?? "MAIN",
      buyerBaseRow.available,
      buyerBaseRow.locked,
      sellerQuoteRow.id,
      sellerQuoteRow.asset,
      sellerQuoteRow.scope ?? "MAIN",
      sellerQuoteRow.available,
      sellerQuoteRow.locked,
    ];
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id","idempotencyKey","operation","accountId","createdAt","updatedAt")
        SELECT ?, ?, 'SPOT_FILL', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey" = ?)
        AND EXISTS (SELECT 1 FROM "Gate2SpotOrder" WHERE "id" = ? AND "status" = ? AND "filled" = ? AND "remaining" = ? AND "reservedAmount" = ?)
        AND EXISTS (SELECT 1 FROM "Gate2SpotOrder" WHERE "id" = ? AND "status" = ? AND "filled" = ? AND "remaining" = ? AND "reservedAmount" = ?)
        AND (SELECT COUNT(*) FROM "LedgerAccount" WHERE ("id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=?) OR ("id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=?) OR ("id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=?) OR ("id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=?)) = 4`,
        params: markerParams,
      },
      this.rollbackIfNoChanges(fillKey, "SPOT_FILL"),
      {
        sql: `UPDATE "LedgerAccount" SET "available"=?,"locked"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "operation"='SPOT_FILL' AND "debitPostingId" IS NULL)`,
        params: [
          buyerQuoteNext.available.toString(),
          buyerQuoteNext.locked.toString(),
          buyerQuoteRow.id,
          buyerQuoteRow.asset,
          buyerQuoteRow.scope ?? "MAIN",
          buyerQuoteRow.available,
          buyerQuoteRow.locked,
          fillKey,
        ] as D1BridgeParameter[],
      },
      this.rollbackIfNoChanges(fillKey, "SPOT_FILL_BUYER_QUOTE"),
      {
        sql: `UPDATE "LedgerAccount" SET "available"=?,"locked"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "operation"='SPOT_FILL' AND "debitPostingId" IS NULL)`,
        params: [
          sellerBaseNext.available.toString(),
          sellerBaseNext.locked.toString(),
          sellerBaseRow.id,
          sellerBaseRow.asset,
          sellerBaseRow.scope ?? "MAIN",
          sellerBaseRow.available,
          sellerBaseRow.locked,
          fillKey,
        ] as D1BridgeParameter[],
      },
      this.rollbackIfNoChanges(fillKey, "SPOT_FILL_SELLER_BASE"),
      {
        sql: `UPDATE "LedgerAccount" SET "available"=?,"locked"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "operation"='SPOT_FILL' AND "debitPostingId" IS NULL)`,
        params: [
          buyerBaseNext.available.toString(),
          buyerBaseNext.locked.toString(),
          buyerBaseRow.id,
          buyerBaseRow.asset,
          buyerBaseRow.scope ?? "MAIN",
          buyerBaseRow.available,
          buyerBaseRow.locked,
          fillKey,
        ] as D1BridgeParameter[],
      },
      this.rollbackIfNoChanges(fillKey, "SPOT_FILL_BUYER_BASE"),
      {
        sql: `UPDATE "LedgerAccount" SET "available"=?,"locked"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "asset"=? AND "scope"=? AND "available"=? AND "locked"=? AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "operation"='SPOT_FILL' AND "debitPostingId" IS NULL)`,
        params: [
          sellerQuoteNext.available.toString(),
          sellerQuoteNext.locked.toString(),
          sellerQuoteRow.id,
          sellerQuoteRow.asset,
          sellerQuoteRow.scope ?? "MAIN",
          sellerQuoteRow.available,
          sellerQuoteRow.locked,
          fillKey,
        ] as D1BridgeParameter[],
      },
      this.rollbackIfNoChanges(fillKey, "SPOT_FILL_SELLER_QUOTE"),
      {
        sql: `INSERT INTO "LedgerPosting" ("id","accountId","asset","kind","amount","availableDelta","lockedDelta","referenceType","referenceId","idempotencyKey","correlationId","economicGroup","createdAt","metadata") VALUES ${postingRows.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)").join(",")}`,
        params: postingRows.flatMap((p) => [
          p.id,
          p.account.id,
          p.asset,
          p.kind,
          p.amount.toString(),
          p.availableDelta.toString(),
          p.lockedDelta.toString(),
          p.ref,
          fillKey,
          `${fillKey}:${p.kind}:${p.id}`,
          fillKey,
          fillKey,
          JSON.stringify(p.meta),
        ]),
      },
      {
        sql: `UPDATE "LedgerIdempotency" SET "debitPostingId"=?,"creditPostingId"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "idempotencyKey"=? AND "debitPostingId" IS NULL`,
        params: [
          postingRows[0].id,
          postingRows[postingRows.length - 1].id,
          idemId,
          fillKey,
        ],
      },
      {
        sql: `INSERT INTO "LedgerAuditEvent" ("id","accountId","postingId","eventType","idempotencyKey","correlationId","details","createdAt") VALUES ${postingRows.map(() => "(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)").join(",")}`,
        params: postingRows.flatMap((p) => [
          randomUUID(),
          p.account.id,
          p.id,
          `${p.kind}_POSTED`,
          `${fillKey}:${p.kind}`,
          fillKey,
          JSON.stringify({ referenceType: p.ref, referenceId: fillKey }),
        ]),
      },
      {
        sql: `INSERT INTO "Gate2SpotTrade" ("id","buyerOrderId","sellerOrderId","pair","baseAsset","quoteAsset","price","amount","buyerFee","sellerFee","idempotencyKey","createdAt") SELECT ?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id"=? AND "debitPostingId"=?)`,
        params: [
          randomUUID(),
          String(buy.id),
          String(sell.id),
          pair,
          String(buy.baseAsset),
          String(buy.quoteAsset),
          tradePrice.toString(),
          amount.toString(),
          buyerFee.toString(),
          sellerFee.toString(),
          fillKey,
          idemId,
          postingRows[0].id,
        ] as D1BridgeParameter[],
      },
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id","userId","type","status","referenceType","referenceId","idempotencyKey","ledgerCorrelationId","ledgerPostingId","asset","amount","details","createdAt") VALUES (?,?,'GATE2_SPOT_TRADE','COMPLETED','GATE2_SPOT_FILL',?,?,?,?,?,?,?,CURRENT_TIMESTAMP),(?,?,'GATE2_SPOT_TRADE','COMPLETED','GATE2_SPOT_FILL',?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          randomUUID(),
          String(buy.userId),
          `${fillKey}:buyer`,
          fillKey,
          postingRows[0].id,
          String(buy.quoteAsset),
          buyerUsed.toString(),
          JSON.stringify({ orderId: buy.id, tradeId: fillKey }),
          randomUUID(),
          String(sell.userId),
          `${fillKey}:seller`,
          fillKey,
          postingRows[postingRows.length - 1].id,
          String(sell.quoteAsset),
          sellerProceeds.toString(),
          JSON.stringify({ orderId: sell.id, tradeId: fillKey }),
        ] as D1BridgeParameter[],
      },
      {
        sql: `UPDATE "Gate2SpotOrder" SET "filled"=CASE "id" WHEN ? THEN ? WHEN ? THEN ? END,"remaining"=CASE "id" WHEN ? THEN ? WHEN ? THEN ? END,"reservedAmount"=CASE "id" WHEN ? THEN ? WHEN ? THEN ? END,"status"=CASE "id" WHEN ? THEN ? WHEN ? THEN ? END,"updatedAt"=CURRENT_TIMESTAMP WHERE "id" IN (?,?) AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=?) AND (SELECT COUNT(*) FROM "Gate2SpotOrder" WHERE ("id"=? AND "status"=? AND "filled"=? AND "remaining"=? AND "reservedAmount"=?) OR ("id"=? AND "status"=? AND "filled"=? AND "remaining"=? AND "reservedAmount"=?))=2`,
        params: [
          String(buy.id),
          buyerRemaining
            .add(this.nonNegativeDecimal(String(buy.filled)))
            .toString(),
          String(sell.id),
          sellerRemaining
            .add(this.nonNegativeDecimal(String(sell.filled)))
            .toString(),
          String(buy.id),
          buyerRemaining.toString(),
          String(sell.id),
          sellerRemaining.toString(),
          String(buy.id),
          this.nonNegativeDecimal(String(buy.reservedAmount))
            .sub(buyerReserveChunk)
            .toString(),
          String(sell.id),
          this.nonNegativeDecimal(String(sell.reservedAmount))
            .sub(amount)
            .toString(),
          String(buy.id),
          buyerStatus,
          String(sell.id),
          sellerStatus,
          String(buy.id),
          String(sell.id),
          fillKey,
          postingRows[0].id,
          String(buy.id),
          String(buy.status),
          String(buy.filled),
          String(buy.remaining),
          String(buy.reservedAmount),
          String(sell.id),
          String(sell.status),
          String(sell.filled),
          String(sell.remaining),
          String(sell.reservedAmount),
        ] as D1BridgeParameter[],
      },
    ];
    const batch = await this.bridge.batch(statements);
    this.requireChanges(batch, 2, "D1 Spot buyer quote transition");
    this.requireChanges(batch, 4, "D1 Spot seller base transition");
    this.requireChanges(batch, 6, "D1 Spot buyer base transition");
    this.requireChanges(batch, 8, "D1 Spot seller quote transition");
    this.requireAtLeastChanges(
      batch,
      10,
      postingRows.length,
      "D1 Spot fill postings",
    );
    this.requireChanges(batch, 11, "D1 Spot fill idempotency completion");
    this.requireAtLeastChanges(
      batch,
      12,
      postingRows.length,
      "D1 Spot fill audit",
    );
    this.requireChanges(batch, 13, "D1 Spot trade record");
    this.requireAtLeastChanges(batch, 15, 2, "D1 Spot order transitions");
    const created = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotTrade" WHERE "idempotencyKey"=? LIMIT 1`,
      [fillKey],
    );
    return created.results[0] ?? null;
  }

  async getSpotOrder(
    userId: string,
    orderId: string,
  ): Promise<Record<string, unknown> | null> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "id"=? AND "userId"=? LIMIT 1`,
      [orderId, userId],
    );
    return result.results[0] ?? null;
  }

  async getSpotOrderBook(pairInput: string): Promise<Record<string, unknown>> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const pair = pairInput.trim().toUpperCase().replaceAll("/", "");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "pair"=? AND "status" IN ('OPEN','PARTIALLY_FILLED') AND ("type" <> 'STOP' OR "triggeredAt" IS NOT NULL)`,
      [pair],
    );
    const orders = result.results;
    const sort = (side: string) =>
      orders
        .filter((o) => String(o.side) === side)
        .sort((a, b) => {
          const d = this.nonNegativeDecimal(String(a.price)).comparedTo(
            this.nonNegativeDecimal(String(b.price)),
          );
          return (
            (side === "BUY" ? -d : d) ||
            String(a.createdAt).localeCompare(String(b.createdAt)) ||
            String(a.id).localeCompare(String(b.id))
          );
        })
        .slice(0, 50);
    return {
      pair,
      bids: sort("BUY").map((o) => ({
        orderId: o.id,
        price: o.price,
        amount: o.remaining,
      })),
      asks: sort("SELL").map((o) => ({
        orderId: o.id,
        price: o.price,
        amount: o.remaining,
      })),
      state: orders.length ? "LIVE" : "UNAVAILABLE",
      source: "nexi-internal-spot",
    };
  }

  async listSpotOrders(
    userId: string,
    openOnly = false,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const status = openOnly
      ? ` AND "status" IN ('OPEN','PARTIALLY_FILLED')`
      : "";
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotOrder" WHERE "userId"=?${status} ORDER BY "createdAt" DESC`,
      [userId],
    );
    return result.results;
  }

  async listSpotTrades(userId: string): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT t.* FROM "Gate2SpotTrade" t JOIN "Gate2SpotOrder" b ON b."id"=t."buyerOrderId" JOIN "Gate2SpotOrder" s ON s."id"=t."sellerOrderId" WHERE b."userId"=? OR s."userId"=? ORDER BY t."createdAt" DESC`,
      [userId, userId],
    );
    return result.results;
  }

  async listSpotTradesForPair(
    pairInput: string,
  ): Promise<Record<string, unknown>[]> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const pair = pairInput.trim().toUpperCase().replaceAll("/", "");
    const result = await this.bridge.select<Record<string, unknown>>(
      `SELECT * FROM "Gate2SpotTrade" WHERE "pair"=? ORDER BY "createdAt" DESC LIMIT 50`,
      [pair],
    );
    return result.results;
  }

  async reconcile(
    accountId: string,
    assetValue: string,
  ): Promise<{ available: string; locked: string }> {
    const account = await this.findAccount(accountId);
    const asset = this.normalizeAsset(assetValue);
    if (account.asset !== asset)
      throw new BadRequestException("Ledger account not found");
    const postings = await this.bridge.select<{
      availableDelta: string;
      lockedDelta: string;
    }>(
      `SELECT "availableDelta", "lockedDelta" FROM "LedgerPosting" WHERE "accountId" = ?`,
      [accountId],
    );
    const totals = postings.results.reduce(
      (sum, posting) => ({
        available: sum.available.plus(
          this.nonNegativeOrSignedDecimal(posting.availableDelta),
        ),
        locked: sum.locked.plus(
          this.nonNegativeOrSignedDecimal(posting.lockedDelta),
        ),
      }),
      { available: new Prisma.Decimal(0), locked: new Prisma.Decimal(0) },
    );
    const current = {
      available: this.nonNegativeDecimal(account.available),
      locked: this.nonNegativeDecimal(account.locked),
    };
    if (
      !current.available.eq(totals.available) ||
      !current.locked.eq(totals.locked)
    ) {
      throw new Error(`Ledger invariant mismatch for account ${accountId}`);
    }
    return {
      available: current.available.toString(),
      locked: current.locked.toString(),
    };
  }

  async assertReconciled(
    accountId: string,
  ): Promise<{ available: string; locked: string; matches: boolean }> {
    const account = await this.findAccount(accountId);
    const result = await this.reconcile(accountId, account.asset);
    return { ...result, matches: true };
  }

  async reserve(command: LedgerPostingCommand): Promise<LedgerMutationResult> {
    return this.execute(command, "RESERVE", {
      availableDelta: "-amount",
      lockedDelta: "amount",
    });
  }

  async release(command: LedgerPostingCommand): Promise<LedgerMutationResult> {
    return this.execute(command, "RELEASE", {
      availableDelta: "amount",
      lockedDelta: "-amount",
    });
  }

  async settle(command: LedgerPostingCommand): Promise<LedgerMutationResult> {
    return this.execute(command, "SETTLEMENT", {
      availableDelta: "zero",
      lockedDelta: "-amount",
    });
  }

  async credit(command: LedgerPostingCommand): Promise<LedgerMutationResult> {
    return this.execute(command, "CREDIT", {
      availableDelta: "amount",
      lockedDelta: "zero",
    });
  }

  async debit(command: LedgerPostingCommand): Promise<LedgerMutationResult> {
    return this.execute(command, "DEBIT", {
      availableDelta: "-amount",
      lockedDelta: "zero",
    });
  }

  async compensate(
    command: LedgerPostingCommand,
  ): Promise<LedgerMutationResult> {
    return this.execute(command, "COMPENSATION", {
      availableDelta: "amount",
      lockedDelta: "zero",
    });
  }

  async pairedTransfer(
    command: PairedTransferCommand,
  ): Promise<{ debitPostingId: string; creditPostingId: string }> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    if (command.debitAccountId === command.creditAccountId) {
      throw new BadRequestException("Transfer accounts must differ");
    }

    const amount = this.decimal(command.amount);
    const asset = this.normalizeAsset(command.asset);
    const existing = await this.findIdempotency(command.idempotencyKey);
    if (existing) {
      if (
        existing.operation !== "PAIRED_TRANSFER" ||
        existing.accountId !== command.debitAccountId
      ) {
        throw new BadRequestException(
          "Idempotency key belongs to another ledger operation",
        );
      }
      if (existing.debitPostingId && existing.creditPostingId) {
        return {
          debitPostingId: existing.debitPostingId,
          creditPostingId: existing.creditPostingId,
        };
      }
      throw new BadRequestException("Idempotent transfer is still completing");
    }

    const accounts = await this.findAccounts([
      command.debitAccountId,
      command.creditAccountId,
    ]);
    const debit = accounts.find(
      (account) => account.id === command.debitAccountId,
    );
    const credit = accounts.find(
      (account) => account.id === command.creditAccountId,
    );
    if (
      !debit ||
      !credit ||
      debit.status !== "ACTIVE" ||
      credit.status !== "ACTIVE"
    ) {
      throw new BadRequestException("Transfer account is unavailable");
    }
    if (debit.asset !== asset || credit.asset !== asset) {
      throw new BadRequestException(
        "Transfer accounts must use the requested asset",
      );
    }

    const debitAvailable = this.nonNegativeDecimal(debit.available);
    if (debitAvailable.lt(amount))
      throw new BadRequestException("Insufficient available funds");
    const debitNextAvailable = debitAvailable.minus(amount).toString();
    const creditNextAvailable = this.nonNegativeDecimal(credit.available)
      .plus(amount)
      .toString();
    const correlationId = command.correlationId ?? command.idempotencyKey;
    const id = randomUUID();
    const debitPostingId = randomUUID();
    const creditPostingId = randomUUID();
    const nowParams = [
      id,
      command.idempotencyKey,
      "PAIRED_TRANSFER",
      command.debitAccountId,
    ];

    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id", "idempotencyKey", "operation", "accountId", "createdAt", "updatedAt")
          SELECT ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey" = ?)
            AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id" = ? AND "asset" = ? AND "status" = 'ACTIVE' AND "available" = ? AND "locked" = ?)
            AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id" = ? AND "asset" = ? AND "status" = 'ACTIVE' AND "available" = ? AND "locked" = ?)`,
        params: [
          ...nowParams,
          command.idempotencyKey,
          debit.id,
          asset,
          debit.available,
          debit.locked,
          credit.id,
          asset,
          credit.available,
          credit.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount"
          SET "available" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "asset" = ? AND "status" = 'ACTIVE'
            AND "available" = ? AND "locked" = ?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          debitNextAvailable,
          debit.id,
          asset,
          debit.available,
          debit.locked,
          id,
          command.idempotencyKey,
        ],
      },
      this.rollbackIfNoChanges(command.idempotencyKey, "PAIRED_TRANSFER_DEBIT"),
      {
        sql: `UPDATE "LedgerAccount"
          SET "available" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "asset" = ? AND "status" = 'ACTIVE'
            AND "available" = ? AND "locked" = ?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          creditNextAvailable,
          credit.id,
          asset,
          credit.available,
          credit.locked,
          id,
          command.idempotencyKey,
        ],
      },
      this.rollbackIfNoChanges(
        command.idempotencyKey,
        "PAIRED_TRANSFER_CREDIT",
      ),
      {
        sql: `INSERT INTO "LedgerPosting" ("id", "accountId", "asset", "kind", "amount", "availableDelta", "lockedDelta", "referenceType", "referenceId", "idempotencyKey", "correlationId", "economicGroup", "createdAt", "metadata")
          SELECT ?, ?, ?, 'TRANSFER', ?, ?, '0', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          debitPostingId,
          debit.id,
          asset,
          amount.toString(),
          amount.negated().toString(),
          command.referenceType,
          command.referenceId,
          command.idempotencyKey,
          correlationId,
          command.economicGroup ?? null,
          JSON.stringify({ direction: "DEBIT" }),
          id,
          command.idempotencyKey,
        ],
      },
      {
        sql: `INSERT INTO "LedgerPosting" ("id", "accountId", "asset", "kind", "amount", "availableDelta", "lockedDelta", "referenceType", "referenceId", "idempotencyKey", "correlationId", "economicGroup", "createdAt", "metadata")
          SELECT ?, ?, ?, 'TRANSFER', ?, ?, '0', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          creditPostingId,
          credit.id,
          asset,
          amount.toString(),
          amount.toString(),
          command.referenceType,
          command.referenceId,
          command.idempotencyKey,
          correlationId,
          command.economicGroup ?? null,
          JSON.stringify({ direction: "CREDIT" }),
          id,
          command.idempotencyKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency"
          SET "debitPostingId" = ?, "creditPostingId" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL
            AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id" = ?)
            AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id" = ?)`,
        params: [
          debitPostingId,
          creditPostingId,
          id,
          command.idempotencyKey,
          debitPostingId,
          creditPostingId,
        ],
      },
      this.auditStatement(
        command.debitAccountId,
        debitPostingId,
        "TRANSFER_DEBIT_POSTED",
        command.idempotencyKey,
        correlationId,
        command.referenceType,
        command.referenceId,
      ),
      this.auditStatement(
        command.creditAccountId,
        creditPostingId,
        "TRANSFER_CREDIT_POSTED",
        command.idempotencyKey,
        correlationId,
        command.referenceType,
        command.referenceId,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id", "userId", "type", "status", "referenceType", "referenceId", "idempotencyKey", "ledgerCorrelationId", "ledgerPostingId", "asset", "amount", "details", "createdAt")
          SELECT ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "debitPostingId" = ? AND "creditPostingId" = ?)`,
        params: [
          randomUUID(),
          debit.userId,
          command.referenceType,
          command.referenceType,
          command.referenceId,
          command.idempotencyKey,
          correlationId,
          debitPostingId,
          asset,
          amount.toString(),
          JSON.stringify({
            debitPostingId,
            creditPostingId,
            direction: "PAIRED_TRANSFER",
          }),
          id,
          debitPostingId,
          creditPostingId,
        ],
      },
    ];

    if (command.internalTransfer) {
      const transfer = command.internalTransfer;
      statements.push(
        {
          sql: `INSERT INTO "Gate2InternalTransfer" ("id", "fromUserId", "toUserId", "asset", "amount", "idempotencyKey", "debitPostingId", "creditPostingId", "createdAt")
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
            WHERE EXISTS (SELECT 1 FROM "User" WHERE "id" = ?)
              AND EXISTS (SELECT 1 FROM "User" WHERE "id" = ?)
              AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey" = ? AND "debitPostingId" = ? AND "creditPostingId" = ?)
              AND NOT EXISTS (SELECT 1 FROM "Gate2InternalTransfer" WHERE "idempotencyKey" = ?)`,
          params: [
            transfer.transferId,
            transfer.fromUserId,
            transfer.toUserId,
            asset,
            amount.toString(),
            command.idempotencyKey,
            debitPostingId,
            creditPostingId,
            transfer.fromUserId,
            transfer.toUserId,
            command.idempotencyKey,
            debitPostingId,
            creditPostingId,
            command.idempotencyKey,
          ],
        },
        {
          sql: `INSERT INTO "Gate2OperationAudit" ("id", "userId", "operationType", "operationId", "eventType", "idempotencyKey", "details", "createdAt")
            SELECT ?, ?, 'TRANSFER', ?, 'TRANSFER_PAIRED', ?, ?, CURRENT_TIMESTAMP
            WHERE EXISTS (SELECT 1 FROM "Gate2InternalTransfer" WHERE "id" = ?)`,
          params: [
            randomUUID(),
            transfer.fromUserId,
            transfer.transferId,
            command.idempotencyKey,
            JSON.stringify({
              debitPostingId,
              creditPostingId,
              toUserId: transfer.toUserId,
            }),
            transfer.transferId,
          ],
        },
        {
          sql: `INSERT INTO "Gate2OperationAudit" ("id", "userId", "operationType", "operationId", "eventType", "idempotencyKey", "details", "createdAt")
            SELECT ?, ?, 'TRANSFER', ?, 'TRANSFER_RECEIVED', ?, ?, CURRENT_TIMESTAMP
            WHERE EXISTS (SELECT 1 FROM "Gate2InternalTransfer" WHERE "id" = ?)`,
          params: [
            randomUUID(),
            transfer.toUserId,
            transfer.transferId,
            command.idempotencyKey,
            JSON.stringify({
              debitPostingId,
              creditPostingId,
              fromUserId: transfer.fromUserId,
            }),
            transfer.transferId,
          ],
        },
      );
    }

    if (command.marginActivity) {
      const activity = command.marginActivity;
      statements.push({
        sql: `INSERT OR IGNORE INTO "SpotMarginActivity" ("id","userId","accountId","type","status","idempotencyKey","details","createdAt")
          SELECT ?,?,?,?,?,?,?,CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey"=? AND "debitPostingId"=? AND "creditPostingId"=?)
            AND NOT EXISTS (SELECT 1 FROM "SpotMarginActivity" WHERE "idempotencyKey"=?)`,
        params: [
          activity.activityId,
          activity.userId,
          activity.accountId,
          activity.type,
          activity.status,
          command.idempotencyKey,
          JSON.stringify(activity.details),
          command.idempotencyKey,
          debitPostingId,
          creditPostingId,
          command.idempotencyKey,
        ],
      });
    }

    statements.push(
      this.eventOutboxStatement({
        idempotencyKey: `event:transfer:${command.idempotencyKey}`,
        aggregateType: "INTERNAL_TRANSFER",
        aggregateId: command.referenceId,
        eventType: "TRANSFER_COMPLETED",
        correlationId: command.correlationId ?? command.idempotencyKey,
        payload: {
          asset,
          amount: amount.toString(),
          debitAccountId: command.debitAccountId,
          creditAccountId: command.creditAccountId,
        },
      }),
    );
    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 1, "D1 debit account transition");
    this.requireChanges(result, 3, "D1 credit account transition");
    this.requireChanges(result, 5, "D1 debit posting");
    this.requireChanges(result, 6, "D1 credit posting");
    if (command.internalTransfer)
      this.requireChanges(result, 11, "D1 internal transfer record");
    if (command.marginActivity)
      this.requireChanges(result, 11, "D1 margin transfer activity");
    return { debitPostingId, creditPostingId };
  }

  private async execute(
    command: LedgerPostingCommand,
    operation: string,
    delta: { availableDelta: string; lockedDelta: string },
  ): Promise<LedgerMutationResult> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const amount = this.decimal(command.amount);
    const asset = this.normalizeAsset(command.asset);
    const existing = await this.findIdempotency(command.idempotencyKey);
    if (existing) {
      if (
        existing.operation !== operation ||
        existing.accountId !== command.accountId
      ) {
        throw new BadRequestException(
          "Idempotency key belongs to another ledger operation",
        );
      }
      if (!existing.debitPostingId)
        throw new BadRequestException(
          "Idempotent ledger operation is still completing",
        );
      const account = await this.findAccount(command.accountId);
      return this.result(existing.debitPostingId, account, true);
    }

    const account = await this.findAccount(command.accountId);
    if (account.status !== "ACTIVE" || account.asset !== asset) {
      throw new BadRequestException("Ledger account is unavailable");
    }
    const available = this.nonNegativeDecimal(account.available);
    const locked = this.nonNegativeDecimal(account.locked);
    const availableDelta = this.resolveDelta(delta.availableDelta, amount);
    const lockedDelta = this.resolveDelta(delta.lockedDelta, amount);
    const nextAvailable = available.plus(availableDelta);
    const nextLocked = locked.plus(lockedDelta);
    if (nextAvailable.isNegative() || nextLocked.isNegative()) {
      throw new BadRequestException(
        "Ledger account cannot satisfy the requested mutation",
      );
    }

    const correlationId = command.correlationId ?? command.idempotencyKey;
    const id = randomUUID();
    const postingId = randomUUID();
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT OR IGNORE INTO "LedgerIdempotency" ("id", "idempotencyKey", "operation", "accountId", "createdAt", "updatedAt")
          SELECT ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "idempotencyKey" = ?)
            AND EXISTS (SELECT 1 FROM "LedgerAccount" WHERE "id" = ? AND "asset" = ? AND "status" = 'ACTIVE' AND "available" = ? AND "locked" = ?)`,
        params: [
          id,
          command.idempotencyKey,
          operation,
          command.accountId,
          command.idempotencyKey,
          command.accountId,
          asset,
          account.available,
          account.locked,
        ],
      },
      {
        sql: `UPDATE "LedgerAccount"
          SET "available" = ?, "locked" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "asset" = ? AND "status" = 'ACTIVE'
            AND "available" = ? AND "locked" = ?
            AND EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          nextAvailable.toString(),
          nextLocked.toString(),
          command.accountId,
          asset,
          account.available,
          account.locked,
          id,
          command.idempotencyKey,
        ],
      },
      this.rollbackIfNoChanges(command.idempotencyKey, operation),
      {
        sql: `INSERT INTO "LedgerPosting" ("id", "accountId", "asset", "kind", "amount", "availableDelta", "lockedDelta", "referenceType", "referenceId", "idempotencyKey", "correlationId", "economicGroup", "createdAt", "metadata")
          SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL)`,
        params: [
          postingId,
          command.accountId,
          asset,
          operation,
          amount.toString(),
          availableDelta.toString(),
          lockedDelta.toString(),
          command.referenceType,
          command.referenceId,
          command.idempotencyKey,
          correlationId,
          command.economicGroup ?? null,
          command.metadata ? JSON.stringify(command.metadata) : null,
          id,
          command.idempotencyKey,
        ],
      },
      {
        sql: `UPDATE "LedgerIdempotency"
          SET "debitPostingId" = ?, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ? AND "idempotencyKey" = ? AND "debitPostingId" IS NULL
            AND EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id" = ?)`,
        params: [postingId, id, command.idempotencyKey, postingId],
      },
      this.auditStatement(
        command.accountId,
        postingId,
        `${operation}_POSTED`,
        command.idempotencyKey,
        correlationId,
        command.referenceType,
        command.referenceId,
      ),
      {
        sql: `INSERT OR IGNORE INTO "Activity" ("id", "userId", "type", "status", "referenceType", "referenceId", "idempotencyKey", "ledgerCorrelationId", "ledgerPostingId", "asset", "amount", "details", "createdAt")
          SELECT ?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "LedgerIdempotency" WHERE "id" = ? AND "debitPostingId" = ?)`,
        params: [
          randomUUID(),
          account.userId,
          command.referenceType,
          command.referenceType,
          command.referenceId,
          command.idempotencyKey,
          correlationId,
          postingId,
          asset,
          amount.toString(),
          command.metadata ? JSON.stringify(command.metadata) : null,
          id,
          postingId,
        ],
      },
    ];

    const result = await this.bridge.batch(statements);
    this.requireChanges(result, 1, "D1 ledger account transition");
    this.requireChanges(result, 3, "D1 ledger posting");
    const finalAccount = await this.findAccount(command.accountId);
    return this.result(postingId, finalAccount, false);
  }

  private hashId(prefix: string, value: string): string {
    const hex = createHash("sha256")
      .update(`${prefix}:${value}`)
      .digest("hex")
      .slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20)}`;
  }

  private async findAccount(accountId: string): Promise<LedgerAccountRow> {
    const result = await this.bridge.select<LedgerAccountRow>(
      `SELECT "id", "userId", "asset", "scope", "status", "available", "locked" FROM "LedgerAccount" WHERE "id" = ? LIMIT 1`,
      [accountId],
    );
    const account = result.results[0];
    if (!account) throw new BadRequestException("Ledger account not found");
    return account;
  }

  private async findAccounts(
    accountIds: string[],
  ): Promise<LedgerAccountRow[]> {
    const placeholders = accountIds.map(() => "?").join(", ");
    const result = await this.bridge.select<LedgerAccountRow>(
      `SELECT "id", "userId", "asset", "scope", "status", "available", "locked" FROM "LedgerAccount" WHERE "id" IN (${placeholders})`,
      accountIds,
    );
    return result.results;
  }

  private async findAccountForUser(
    userId: string,
    asset: string,
    scope: string,
  ): Promise<{ id: string; asset: string }> {
    const account = await this.findAccountForUserOrNull(userId, asset, scope);
    if (!account)
      throw new BadRequestException("Ledger account could not be created");
    return { id: account.id, asset: account.asset };
  }

  private async findAccountForUserOrNull(
    userId: string,
    asset: string,
    scope: string,
  ): Promise<LedgerAccountRow | null> {
    const result = await this.bridge.select<LedgerAccountRow>(
      `SELECT "id", "userId", "asset", "scope", "status", "available", "locked" FROM "LedgerAccount" WHERE "userId" = ? AND "asset" = ? AND "scope" = ? LIMIT 1`,
      [userId, asset, scope],
    );
    return result.results[0] ?? null;
  }

  private async findIdempotency(
    key: string,
  ): Promise<LedgerIdempotencyRow | null> {
    const result = await this.bridge.select<LedgerIdempotencyRow>(
      `SELECT "id", "operation", "accountId", "debitPostingId", "creditPostingId" FROM "LedgerIdempotency" WHERE "idempotencyKey" = ? LIMIT 1`,
      [key],
    );
    return result.results[0] ?? null;
  }

  private rollbackIfNoChanges(
    key: string,
    operation: string,
  ): D1BridgeBatchStatement {
    return {
      sql: `INSERT INTO "LedgerIdempotency" ("id", "idempotencyKey", "operation") SELECT NULL, ?, ? WHERE changes() = 0`,
      params: [key, operation],
    };
  }

  private auditStatement(
    accountId: string,
    postingId: string,
    eventType: string,
    idempotencyKey: string,
    correlationId: string,
    referenceType: string,
    referenceId: string,
  ): D1BridgeBatchStatement {
    return {
      sql: `INSERT INTO "LedgerAuditEvent" ("id", "accountId", "postingId", "eventType", "idempotencyKey", "correlationId", "details", "createdAt")
        SELECT ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
        WHERE EXISTS (SELECT 1 FROM "LedgerPosting" WHERE "id" = ?)`,
      params: [
        randomUUID(),
        accountId,
        postingId,
        eventType,
        idempotencyKey,
        correlationId,
        JSON.stringify({ referenceType, referenceId }),
        postingId,
      ],
    };
  }

  private result(
    postingId: string,
    account: LedgerAccountRow,
    replayed: boolean,
  ): LedgerMutationResult {
    return {
      postingId,
      accountId: account.id,
      available: this.nonNegativeDecimal(account.available).toString(),
      locked: this.nonNegativeDecimal(account.locked).toString(),
      replayed,
    };
  }

  private resolveDelta(kind: string, amount: Prisma.Decimal): Prisma.Decimal {
    if (kind === "amount") return amount;
    if (kind === "-amount") return amount.negated();
    return new Prisma.Decimal(0);
  }

  private decimal(value: string): Prisma.Decimal {
    const amount = new Prisma.Decimal(value);
    if (!amount.isFinite() || amount.isNegative() || amount.isZero()) {
      throw new BadRequestException("Ledger amount must be a positive decimal");
    }
    return amount;
  }

  private nonNegativeDecimal(value: string): Prisma.Decimal {
    const amount = new Prisma.Decimal(value);
    if (!amount.isFinite() || amount.isNegative()) {
      throw new BadRequestException("Ledger balance is invalid");
    }
    return amount;
  }

  private nonNegativeOrSignedDecimal(value: string): Prisma.Decimal {
    const amount = new Prisma.Decimal(value);
    if (!amount.isFinite())
      throw new BadRequestException("Ledger posting amount is invalid");
    return amount;
  }

  private normalizeAsset(asset: string): string {
    const normalized = asset.trim().toUpperCase();
    if (!/^[A-Z0-9._-]{2,32}$/.test(normalized))
      throw new BadRequestException("Ledger asset is invalid");
    return normalized;
  }

  private requireChanges(
    result: D1BridgeBatchResult,
    index: number,
    operation: string,
  ): void {
    const statement = result.results[index] as BatchResult | undefined;
    const changes = Number(statement?.meta?.changes ?? 0);
    if (changes !== 1)
      throw new BadRequestException(`${operation} did not apply exactly once`);
  }

  private requireAtLeastChanges(
    result: D1BridgeBatchResult,
    index: number,
    minimum: number,
    operation: string,
  ): void {
    const statement = result.results[index] as BatchResult | undefined;
    const changes = Number(statement?.meta?.changes ?? 0);
    if (changes < minimum)
      throw new BadRequestException(`${operation} did not apply all rows`);
  }
}
