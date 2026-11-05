import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { randomUUID } from "node:crypto";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { CommunicationsGateway } from "./communications.gateway";
import { ADMIN_ROLE_DEFINITIONS } from "../admin/admin-rbac";

const CATEGORIES = ["ACCOUNT", "IDENTITY", "WALLET", "TRADING", "PRODUCT", "SYSTEM"] as const;
type Category = typeof CATEGORIES[number];
type Rule = { category: Category; permission: string; title: string; severity?: string };
const RULES: Record<string, Rule> = {
  USER_REGISTERED: { category: "ACCOUNT", permission: "users.view", title: "New user registered" },
  KYC_SUBMITTED: { category: "IDENTITY", permission: "kyc.view", title: "KYC submitted" },
  DEPOSIT_CLAIM_SUBMITTED: { category: "WALLET", permission: "deposits.view", title: "Deposit claim submitted" },
  DEPOSIT_CLAIM_CREDITED: { category: "WALLET", permission: "deposits.view", title: "Deposit credited" },
  DEPOSIT_CREDITED: { category: "WALLET", permission: "deposits.view", title: "Deposit credited" },
  WITHDRAWAL_REVIEW_REQUESTED: { category: "WALLET", permission: "withdrawals.view", title: "Withdrawal review requested" },
  WITHDRAWAL_RESERVED: { category: "WALLET", permission: "withdrawals.view", title: "Withdrawal requested" },
  WITHDRAWAL_APPROVED: { category: "WALLET", permission: "withdrawals.view", title: "Withdrawal approved" },
  WITHDRAWAL_SETTLED: { category: "WALLET", permission: "withdrawals.view", title: "Withdrawal settled" },
  WITHDRAWAL_REVIEW_RETURNED: { category: "WALLET", permission: "withdrawals.view", title: "Withdrawal returned for review" },
  WITHDRAWAL_REJECTED: { category: "WALLET", permission: "withdrawals.view", title: "Withdrawal rejected" },
  WITHDRAWAL_FAILED: { category: "WALLET", permission: "withdrawals.view", title: "Withdrawal failed" },
  BINARY_POSITION_OPENED: { category: "TRADING", permission: "binary.view", title: "Binary position opened" },
  BINARY_POSITION_SETTLED: { category: "TRADING", permission: "binary.view", title: "Binary position settled" },
  SPOT_TRADE_EXECUTED: { category: "TRADING", permission: "spot.view", title: "Spot trade executed" },
  MARGIN_POSITION_OPENED: { category: "TRADING", permission: "spot.view", title: "Margin position opened" },
  MARGIN_INTEREST_ACCRUED: { category: "TRADING", permission: "spot.view", title: "Margin interest accrued" },
  MARGIN_POSITION_FILL_RECONCILED: { category: "TRADING", permission: "spot.view", title: "Margin fill reconciled" },
  MINING_SUBSCRIPTION_OPENED: { category: "PRODUCT", permission: "mining.view", title: "Mining subscription opened" },
  MINING_REWARD_POSTED: { category: "PRODUCT", permission: "mining.view", title: "Mining reward posted" },
  LOAN_APPLICATION_SUBMITTED: { category: "PRODUCT", permission: "loans.view", title: "Loan application submitted" },
  LOAN_APPROVED: { category: "PRODUCT", permission: "loans.view", title: "Loan approved" },
  LOAN_REJECTED: { category: "PRODUCT", permission: "loans.view", title: "Loan rejected" },
  LOAN_OVERDUE: { category: "PRODUCT", permission: "loans.view", title: "Loan overdue" },
  ADMIN_BALANCE_ADJUSTMENT_CREDIT: { category: "SYSTEM", permission: "ledger.view", title: "Ledger credit recorded" },
  ADMIN_BALANCE_ADJUSTMENT_DEBIT: { category: "SYSTEM", permission: "ledger.view", title: "Ledger debit recorded" }
};
type EventRow = { id: string; eventType: string; aggregateType: string; aggregateId: string; createdAt: string | Date; state?: string; lastErrorCode?: string | null };
type AlertRow = { id: string; sourceEventId: string; category: Category; severity: string; title: string; summary: string; referenceType: string; referenceId: string; createdAt: string | Date; readAt: string | Date | null };

@Injectable()
export class AdminOperatorAlertsService {
  constructor(private readonly prisma: D1PrismaService, private readonly gateway: CommunicationsGateway) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async materializeCommittedEvents() {
    const names = Object.keys(RULES);
    const rows = await this.prisma.$queryRawUnsafe<EventRow[]>(
      'SELECT e."id",e."eventType",e."aggregateType",e."aggregateId",e."createdAt" FROM "EventOutbox" e LEFT JOIN "AdminOperatorAlertSource" s ON s."sourceEventId"=e."id" WHERE s."sourceEventId" IS NULL AND e."eventType" IN (' + names.map(() => "?").join(",") + ') ORDER BY e."createdAt",e."id" LIMIT 100',
      ...names,
    );
    const deadLetters = await this.prisma.$queryRawUnsafe<EventRow[]>(
      `SELECT e."id",e."eventType",e."aggregateType",e."aggregateId",e."createdAt",e."state",e."lastErrorCode" FROM "EventOutbox" e LEFT JOIN "AdminOperatorAlertSource" s ON s."sourceEventId"=('DEAD_LETTER:' || e."id") WHERE s."sourceEventId" IS NULL AND e."state"='DEAD_LETTERED' ORDER BY e."createdAt",e."id" LIMIT 50`,
    );
    for (const event of rows) {
      const rule = RULES[event.eventType];
      await this.persist(event.id, event, rule);
    }
    for (const event of deadLetters) {
      await this.persist("DEAD_LETTER:" + event.id, event, {
        category: "SYSTEM",
        permission: "overview.view",
        title: "Event delivery failed",
        severity: "HIGH",
      }, event.lastErrorCode ?? undefined);
    }
    if (rows.length || deadLetters.length) this.gateway.notifyOperatorAlertsChanged();
    return { events: rows.length, deadLetters: deadLetters.length };
  }

  private async persist(sourceId: string, event: EventRow, rule: Rule, errorCode?: string) {
    const createdAt = event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt;
    const summary = errorCode
      ? "Durable event delivery reached the dead-letter limit (" + errorCode.slice(0, 80) + ")."
      : event.eventType.toLowerCase().replaceAll("_", " ") + " recorded.";
    await this.prisma.atomicBatch([
      { sql: 'INSERT OR IGNORE INTO "AdminOperatorAlertSource" ("sourceEventId") VALUES (?)', params: [sourceId] },
      { sql: 'INSERT OR IGNORE INTO "AdminOperatorAlert" ("id","sourceEventId","category","requiredPermission","severity","title","summary","referenceType","referenceId","createdAt") VALUES (?,?,?,?,?,?,?,?,?,?)', params: [randomUUID(), sourceId, rule.category, rule.permission, rule.severity ?? "NORMAL", rule.title, summary, event.aggregateType, event.aggregateId, createdAt] }
    ]);
  }

  async list(userId: string) {
    const permissions = await this.permissions(userId);
    const disabled = await this.disabled(userId);
    if (!permissions.length) return { items: [], unreadCount: 0, categories: CATEGORIES, disabledCategories: disabled };
    const filter = 'a."requiredPermission" IN (' + permissions.map(() => "?").join(",") + ')' +
      (disabled.length ? ' AND a."category" NOT IN (' + disabled.map(() => "?").join(",") + ')' : "");
    const joins = ' FROM "AdminOperatorAlert" a LEFT JOIN "AdminOperatorAlertRead" r ON r."alertId"=a."id" AND r."adminId"=? WHERE ' + filter;
    const rows = await this.prisma.$queryRawUnsafe<AlertRow[]>(
      'SELECT a."id",a."sourceEventId",a."category",a."severity",a."title",a."summary",a."referenceType",a."referenceId",a."createdAt",r."readAt"' + joins + ' ORDER BY a."createdAt" DESC LIMIT 200',
      userId, ...permissions, ...disabled,
    );
    const count = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      'SELECT COUNT(*) as "count" FROM "AdminOperatorAlert" a LEFT JOIN "AdminOperatorAlertRead" r ON r."alertId"=a."id" AND r."adminId"=? WHERE ' + filter + ' AND r."readAt" IS NULL',
      userId, ...permissions, ...disabled,
    );
    return {
      items: rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString(), readAt: row.readAt ? new Date(row.readAt).toISOString() : null, href: this.href(row.category, row.referenceType, row.referenceId) })),
      unreadCount: Number(count[0]?.count ?? 0),
      categories: CATEGORIES,
      disabledCategories: disabled,
    };
  }

  async markRead(userId: string, id: string) {
    const permissions = await this.permissions(userId);
    if (!permissions.length) throw new NotFoundException("Operator alert not found");
    const visible = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      'SELECT "id" FROM "AdminOperatorAlert" WHERE "id"=? AND "requiredPermission" IN (' + permissions.map(() => "?").join(",") + ')',
      id, ...permissions,
    );
    if (!visible.length) throw new NotFoundException("Operator alert not found");
    await this.prisma.atomicBatch([{ sql: 'INSERT INTO "AdminOperatorAlertRead" ("adminId","alertId") VALUES (?,?) ON CONFLICT("adminId","alertId") DO UPDATE SET "readAt"=CURRENT_TIMESTAMP', params: [userId, id] }]);
    return { ok: true };
  }

  async preferences(userId: string) {
    return { categories: CATEGORIES, disabledCategories: await this.disabled(userId) };
  }

  async updatePreferences(userId: string, value: unknown) {
    if (!Array.isArray(value) || value.some((item) => !CATEGORIES.includes(item))) throw new BadRequestException("Invalid operator alert categories");
    const disabled = [...new Set(value as Category[])];
    await this.prisma.atomicBatch([{ sql: 'INSERT INTO "AdminOperatorAlertPreference" ("adminId","disabledCategories") VALUES (?,?) ON CONFLICT("adminId") DO UPDATE SET "disabledCategories"=excluded."disabledCategories","updatedAt"=CURRENT_TIMESTAMP', params: [userId, JSON.stringify(disabled)] }]);
    return this.preferences(userId);
  }

  private async permissions(userId: string): Promise<string[]> {
    const row = await this.prisma.adminRoleAssignment.findUnique({ where: { userId }, select: { roleId: true } });
    return row ? ADMIN_ROLE_DEFINITIONS[row.roleId].permissions.filter((permission) =>
      ["users.view","kyc.view","deposits.view","withdrawals.view","binary.view","spot.view","mining.view","loans.view","ledger.view","overview.view"].includes(permission)) : [];
  }

  private async disabled(userId: string): Promise<Category[]> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ disabledCategories: string }>>('SELECT "disabledCategories" FROM "AdminOperatorAlertPreference" WHERE "adminId"=?', userId);
    if (!rows.length) return ["TRADING"];
    try {
      const value: unknown = JSON.parse(rows[0].disabledCategories);
      return Array.isArray(value) ? value.filter((item): item is Category => CATEGORIES.includes(item)) : ["TRADING"];
    } catch { return ["TRADING"]; }
  }

  private href(category: Category, type: string, id: string) {
    const route = category === "ACCOUNT" || category === "IDENTITY" ? "/users" :
      category === "WALLET" ? type.toUpperCase().includes("WITHDRAWAL") ? "/withdrawals" : "/deposits" :
      category === "TRADING" ? type.toUpperCase().startsWith("SPOT") || type.toUpperCase().startsWith("MARGIN") ? "/spot" : "/binary" :
      category === "PRODUCT" ? type.toUpperCase().startsWith("MINING") ? "/mining" : "/loans" :
      "/overview";
    return route + "?reference=" + encodeURIComponent(id);
  }
}