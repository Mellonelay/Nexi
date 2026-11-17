import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  ServiceUnavailableException,
  Optional,
} from "@nestjs/common";
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import {
  AdminMaintenanceScope,
  AdminMaintenanceStatus,
  Prisma,
  AdminRoleId,
  Gate2BinaryConfiguration,
  Gate2BinaryState,
} from "../prisma/d1-client";
import { LedgerAuthorityService } from "../ledger/ledger-authority.service";
import { SpotService } from "../spot/spot.service";
import { BinaryService } from "../binary/binary.service";
import { FinancialOperationsService } from "../financial/financial-operations.service";
import { SandboxExecutionService } from "../sandbox/sandbox-execution.service";
import { ADMIN_ROLE_DEFINITIONS } from "./admin-rbac";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { executeAdminMutation } from "./admin-mutation-replay";
import { AuthSecurityEventsService } from "../auth/auth-security-events.service";
import { createHash, randomUUID } from "node:crypto";
import { CommunicationsService } from "../communications/communications.service";
import {
  assertPublicBannerSettings,
  assertPublicRouteSettings,
  assertSupportEntryPoints,
} from "./public-ui-config";
import {
  assertBinaryDurationUnchanged,
  latestBinaryConfigurationRows,
  resolveBinaryEnabled,
} from "./binary-configuration.utils";
import {
  AdminPlanMutationContext,
  assertValidMiningPlanValues,
  miningPlanDecimalPatch,
  requireMiningPlanMutationContext,
  updateD1MiningPlan,
} from "./admin-mining-plan-configuration";

const ADMIN_ACCOUNT_SELECT = {
  id: true,
  email: true,
  lastActive: true,
  adminRoleAssignment: {
    select: {
      id: true,
      roleId: true,
      assignedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  authSessions: {
    where: { surface: "ADMIN" as const },
    orderBy: { lastUsedAt: "desc" as const },
    select: {
      id: true,
      surface: true,
      createdAt: true,
      lastUsedAt: true,
      absoluteExpiresAt: true,
      idleExpiresAt: true,
      revokedAt: true,
    },
  },
  mfa: {
    select: {
      enabled: true,
    },
  },
} satisfies Prisma.UserSelect;

const PUBLIC_QUOTES_CATEGORY_IDS = new Set([
  "Crypto",
  "Metals",
  "Forex",
  "Stocks",
]);

function isPublicQuotesCategory(
  value: unknown,
): value is { id: string; visible: boolean; order: number } {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    PUBLIC_QUOTES_CATEGORY_IDS.has(item.id) &&
    typeof item.visible === "boolean" &&
    typeof item.order === "number" &&
    Number.isSafeInteger(item.order) &&
    item.order >= 0 &&
    item.order <= 1000
  );
}

function hasVisiblePublicQuotesCategory(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  const visibility = new Map<string, boolean>();
  for (const item of value.filter(isPublicQuotesCategory))
    visibility.set(item.id, item.visible);
  return [...visibility.values()].some(Boolean);
}

function assertVisiblePublicQuotesCategory(value: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new BadRequestException("Invalid Quotes category configuration");
  }
  if (!hasVisiblePublicQuotesCategory(parsed))
    throw new BadRequestException(
      "At least one Quotes category must remain visible",
    );
}

type AdminAccountRecord = Prisma.UserGetPayload<{
  select: typeof ADMIN_ACCOUNT_SELECT;
}>;

type AdminWithdrawalDecision = (
  requestId: string,
  reason: string,
  adminId: string,
  idempotencyKey: string,
) => Promise<unknown>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function governancePayload(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") {
    try {
      return JSON.stringify(canonicalize(JSON.parse(value)));
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(canonicalize(value));
}

function assertGovernanceReplayMatches(
  existing: {
    commandType: string;
    target: string | null;
    reason: string;
    requestedBy: string;
    payload: unknown;
  },
  input: {
    commandType: string;
    target?: string;
    reason: string;
    requestedBy: string;
    payload?: Record<string, unknown>;
  },
) {
  if (
    existing.commandType !== input.commandType ||
    (existing.target ?? null) !== (input.target ?? null) ||
    existing.reason !== input.reason ||
    existing.requestedBy !== input.requestedBy ||
    governancePayload(existing.payload) !== governancePayload(input.payload)
  ) {
    throw new BadRequestException(
      "Governance idempotency key was reused with changed command terms",
    );
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    (error as { code?: unknown }).code === "P2002"
  );
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(D1PrismaService) private readonly prisma: any,
    private readonly ledgerAuthority: LedgerAuthorityService,
    private readonly spotService: SpotService,
    private readonly binaryService: BinaryService,
    private readonly financialOperations: FinancialOperationsService,
    private readonly sandboxExecution: SandboxExecutionService,
    private readonly d1: D1FinancialCommandGateway,
    @Optional() private readonly communications?: CommunicationsService,
    @Optional() private readonly authSecurityEvents?: AuthSecurityEventsService,
  ) {}

  private marketDatabase(): any {
    return this.prisma;
  }

  async getAdminIdentity(request: {
    userId: string;
    email: string;
    role: string;
    surface?: string;
  }) {
    if (this.d1?.isEnabled()) {
      const row: any = await this.d1.getAdminIdentity(request.userId);
      const role = row?.roleId as
        | keyof typeof ADMIN_ROLE_DEFINITIONS
        | undefined;
      return {
        id: row?.id ?? request.userId,
        email: row?.email ?? request.email,
        backendRole: row?.role ?? request.role,
        authSurface: request.surface ?? "ADMIN",
        environment: this.adminEnvironment(),
        permissionModel: "ADMIN_ROLE_ASSIGNMENT",
        roleId: role ?? null,
        roleLabel: role ? ADMIN_ROLE_DEFINITIONS[role].label : null,
        effectivePermissions: role
          ? ADMIN_ROLE_DEFINITIONS[role].permissions
          : [],
        roleMappingStatus: role
          ? "ASSIGNED"
          : "UNASSIGNED_ADMIN_REQUIRES_ROLE_ASSIGNMENT",
      };
    }
    const user = await this.prisma.user.findUnique({
      where: { id: request.userId },
      select: { id: true, email: true, role: true },
    });
    const assignment = await this.prisma.adminRoleAssignment.findUnique({
      where: { userId: request.userId },
    });
    const role = assignment?.roleId;
    return {
      id: user?.id ?? request.userId,
      email: user?.email ?? request.email,
      backendRole: user?.role ?? request.role,
      authSurface: request.surface ?? "ADMIN",
      environment: this.adminEnvironment(),
      permissionModel: "ADMIN_ROLE_ASSIGNMENT",
      roleId: role ?? null,
      roleLabel: role ? ADMIN_ROLE_DEFINITIONS[role].label : null,
      effectivePermissions: role
        ? ADMIN_ROLE_DEFINITIONS[role].permissions
        : [],
      roleMappingStatus: role
        ? "ASSIGNED"
        : "UNASSIGNED_ADMIN_REQUIRES_ROLE_ASSIGNMENT",
    };
  }

  private adminEnvironment(): "DEVELOPMENT" | "SANDBOX" | "PRODUCTION" {
    if (process.env.NODE_ENV === "production") return "PRODUCTION";
    if (process.env.NODE_ENV === "development") return "DEVELOPMENT";
    return "SANDBOX";
  }

  listAdminRoleDefinitions() {
    return Object.entries(ADMIN_ROLE_DEFINITIONS).map(([id, definition]) => ({
      id,
      ...definition,
    }));
  }

  async assignAdminRole(
    userId: string,
    roleId: AdminRoleId,
    assignedBy?: string,
  ) {
    if (!this.d1?.isEnabled())
      throw new Error("Staging Admin fixture requires D1 runtime");
    return this.d1.assignAdminRole({ userId, roleId, assignedBy });
  }

  private toAdminAccountProjection(user: AdminAccountRecord) {
    const assignment = user.adminRoleAssignment;
    const mfaState = user.mfa?.enabled ? "enabled" : "disabled";
    return {
      id: user.id,
      email: user.email,
      displayName: null,
      roleAssignments: assignment ? [assignment] : [],
      accountStatus: "unknown" as const,
      mfaState: mfaState,
      lastActiveAt: user.lastActive.toISOString(),
      sessions: user.authSessions.map((session) => ({
        id: session.id,
        surface: session.surface,
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        absoluteExpiresAt: session.absoluteExpiresAt.toISOString(),
        idleExpiresAt: session.idleExpiresAt.toISOString(),
        revokedAt: session.revokedAt?.toISOString() ?? null,
        active:
          session.revokedAt === null &&
          session.absoluteExpiresAt.getTime() > Date.now() &&
          session.idleExpiresAt.getTime() > Date.now(),
      })),
    };
  }

  async listAdminAccounts() {
    if (this.d1?.isEnabled())
      return (await this.d1.listAdminUsers()).map((row: any) => ({
        id: row.id,
        email: row.email,
        displayName: null,
        roleAssignments: row.roleId ? [{ roleId: row.roleId }] : [],
        accountStatus: "unknown",
        mfaState: row.mfaEnabled ? "enabled" : "disabled",
        lastActiveAt: row.lastActive,
        sessions: [],
      }));
    const users = await this.prisma.user.findMany({
      where: { role: "ADMIN" },
      select: ADMIN_ACCOUNT_SELECT,
      orderBy: { lastActive: "desc" },
    });
    return users.map((user) => this.toAdminAccountProjection(user));
  }

  async getAdminAccount(id: string) {
    if (this.d1?.isEnabled()) {
      const row: any = (await this.d1.listAdminUsers()).find(
        (item: any) => String(item.id) === id,
      );
      if (!row) throw new NotFoundException("Admin account not found");
      return {
        id: row.id,
        email: row.email,
        displayName: null,
        roleAssignments: row.roleId ? [{ roleId: row.roleId }] : [],
        accountStatus: "unknown",
        mfaState: row.mfaEnabled ? "enabled" : "disabled",
        lastActiveAt: row.lastActive,
        sessions: [],
      };
    }
    const user = await this.prisma.user.findFirst({
      where: { id, role: "ADMIN" },
      select: ADMIN_ACCOUNT_SELECT,
    });
    if (!user) throw new NotFoundException("Admin account not found");
    return this.toAdminAccountProjection(user);
  }

  async listAdminAudit(query: {
    actor?: string;
    action?: string;
    target?: string;
    targetExact?: string;
    actionPrefix?: string;
    environment?: string;
    correlationId?: string;
    result?: string;
    limit?: number;
  }) {
    if (this.d1?.isEnabled()) {
      // Apply the DTO filters in SQLite before LIMIT, so old matching events
      // are not silently excluded by newer unrelated audit rows.
      const rows: any[] = await this.d1.listAdminAuditLogs(query.limit ?? 50, query);
      return rows.map((row) => {
        let details: unknown = row.details;
        if (typeof details === "string") {
          try {
            details = JSON.parse(details);
          } catch {
            details = null;
          }
        }
        const correlationId =
          details && typeof details === "object" && !Array.isArray(details)
            ? (details as Record<string, unknown>).correlationId
            : null;
        return {
          id: row.id,
          actor: row.adminId,
          action: row.action,
          target: row.target,
          createdAt: row.createdAt,
          details: row.details,
          // Only the matching persisted Ledger posting can verify success.
          verifiedPostingResult: row.verifiedPostingResult === "ok" ? "ok" : null,
          correlationId: typeof correlationId === "string" ? correlationId : null,
        };
      });
    }
    const rows = await this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
      where: {
        ...(query.actor
          ? { adminId: { contains: query.actor, mode: "insensitive" } }
          : {}),
        ...(query.action
          ? { action: { contains: query.action, mode: "insensitive" } }
          : {}),
        ...(query.actionPrefix
          ? { action: { startsWith: query.actionPrefix } }
          : {}),
        ...(query.target
          ? { target: { contains: query.target, mode: "insensitive" } }
          : {}),
        ...(query.targetExact
          ? { target: query.targetExact }
          : {}),
      },
    });
    return rows
      .filter((row) => {
        const details = (
          row.details && typeof row.details === "object" ? row.details : {}
        ) as Record<string, unknown>;
        return (
          (!query.environment || details.environment === query.environment) &&
          (!query.correlationId ||
            details.correlationId === query.correlationId) &&
          (!query.result || (details.result ?? "unknown") === query.result)
        );
      })
      .map((row) => ({
        id: row.id,
        actor: row.adminId,
        action: row.action,
        target: row.target,
        createdAt: row.createdAt,
        details: row.details,
        correlationId:
          typeof (row.details as Record<string, unknown> | null)
            ?.correlationId === "string"
            ? (row.details as Record<string, string>).correlationId
            : null,
      }));
  }

  async listIncidents(query: {
    active?: boolean;
    environment?: string;
    limit?: number;
  }) {
    if (this.d1?.isEnabled())
      return this.d1.listAdminIncidents(query.limit ?? 50);
    const rows = await this.prisma.adminIncident.findMany({
      where: {
        ...(query.active === undefined ? {} : { active: query.active }),
        ...(query.environment ? { environment: query.environment } : {}),
      },
      orderBy: { postedAt: "desc" },
      take: query.limit ?? 50,
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      severity: row.severity.toLowerCase(),
      active: row.active,
      postedAt: row.postedAt.toISOString(),
      environment: row.environment,
      acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
      acknowledgedBy: row.acknowledgedBy,
      correlationId: row.correlationId,
    }));
  }

  async replyAdminTicket(
    id: string,
    adminId: string,
    input: {
      body: string;
      internal: boolean;
      reason: string;
      idempotencyKey: string;
    },
  ) {
    if (!input.body?.trim() || !input.reason?.trim())
      throw new BadRequestException("A reply body and reason are required");
    if (this.d1?.isEnabled()) {
      const result = await this.d1.replyAdminTicket({
        ticketId: id,
        adminId,
        ...input,
      });
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (ticket?.userId && this.communications) {
        await this.communications.publishRealtimeEvent(
          "SUPPORT_TICKET_REPLIED",
          id,
          {
            userId: ticket.userId,
            adminId,
            internal: input.internal,
          },
        );
      }
      return result;
    }
    return this.prisma.$transaction(async (tx) => {
      const replay = await tx.adminAuditLog.findFirst({
        where: {
          action: "SUPPORT_TICKET_REPLIED",
          target: id,
          details: { path: ["idempotencyKey"], equals: input.idempotencyKey },
        },
        orderBy: { createdAt: "desc" },
      });
      if (replay) return { ok: true, auditId: replay.id, replayed: true };
      const ticket = await tx.supportTicket.findUnique({ where: { id } });
      if (!ticket) throw new NotFoundException("Support ticket not found");
      await tx.supportTicketReply.create({
        data: {
          ticketId: id,
          authorId: adminId,
          body: input.body.trim(),
          internal: input.internal,
        },
      });
      await tx.supportTicket.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "SUPPORT_TICKET_REPLIED",
          target: id,
          details: {
            reason: input.reason,
            internal: input.internal,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      return { ok: true, auditId: audit.id, replayed: false };
    });
  }

  async setAdminTicketStatus(
    id: string,
    adminId: string,
    input: { status: string; reason: string; idempotencyKey: string },
  ) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required to change ticket status",
      );
    if (this.d1?.isEnabled()) {
      const result = await this.d1.setAdminTicketStatus({
        ticketId: id,
        adminId,
        ...input,
      });
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (ticket?.userId && this.communications) {
        await this.communications.publishRealtimeEvent(
          "SUPPORT_TICKET_STATUS_CHANGED",
          id,
          {
            userId: ticket.userId,
            adminId,
            status: String(result.status ?? input.status).toUpperCase(),
          },
        );
      }
      return result;
    }
    return this.prisma.$transaction(async (tx) => {
      const replay = await tx.adminAuditLog.findFirst({
        where: {
          action: "SUPPORT_TICKET_STATUS_CHANGED",
          target: id,
          details: { path: ["idempotencyKey"], equals: input.idempotencyKey },
        },
        orderBy: { createdAt: "desc" },
      });
      if (replay) return { ok: true, auditId: replay.id, replayed: true };
      const ticket = await tx.supportTicket.findUnique({ where: { id } });
      if (!ticket) throw new NotFoundException("Support ticket not found");
      const updated = await tx.supportTicket.update({
        where: { id },
        data: { status: input.status.toUpperCase() },
      });
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "SUPPORT_TICKET_STATUS_CHANGED",
          target: id,
          details: {
            reason: input.reason,
            before: ticket.status,
            after: updated.status,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      return {
        ok: true,
        auditId: audit.id,
        replayed: false,
        status: updated.status,
      };
    });
  }

  async acknowledgeIncident(
    id: string,
    adminId: string,
    input: { reason: string; idempotencyKey: string },
  ) {
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException(
        "Incident acknowledgement requires a reason and original request key",
      );
    if (this.d1?.isEnabled()) {
      return this.d1.acknowledgeIncident({ incidentId: id, adminId, ...input });
    }
    const action = "INCIDENT_ACKNOWLEDGED";
    const auditId = this.marketMutationAuditId(action, adminId, input.idempotencyKey);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.adminIncident.findUnique({
        where: { acknowledgementIdempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        if (existing.id !== id || existing.acknowledgedBy !== adminId ||
            existing.acknowledgementReason !== input.reason)
          throw new ConflictException("Incident acknowledgement key belongs to another original request");
        const previousAudit = await tx.adminAuditLog.findUnique({ where: { id: auditId } }) ??
          await tx.adminAuditLog.findFirst({
            where: {
              adminId,
              action,
              target: id,
              details: { contains: input.idempotencyKey },
            },
            orderBy: { createdAt: "desc" },
          });
        if (!previousAudit)
          throw new ConflictException("Original incident acknowledgement audit receipt is unavailable");
        const previousDetails = JSON.parse(previousAudit.details ?? "{}") as Record<string, unknown>;
        if (previousAudit.adminId !== adminId || previousAudit.action !== action ||
            previousAudit.target !== id || previousDetails.reason !== input.reason ||
            previousDetails.idempotencyKey !== input.idempotencyKey)
          throw new ConflictException("Incident acknowledgement key belongs to another original request");
        return { ...existing, auditId: previousAudit.id, replayed: true };
      }
      const incident = await tx.adminIncident.findUnique({ where: { id } });
      if (!incident) throw new NotFoundException("Incident not found");
      const row = await tx.adminIncident.update({
        where: { id },
        data: {
          acknowledgedAt: new Date(),
          acknowledgedBy: adminId,
          acknowledgementReason: input.reason,
          acknowledgementIdempotencyKey: input.idempotencyKey,
        },
      });
      const audit = await tx.adminAuditLog.create({
        data: {
          id: auditId,
          adminId,
          action,
          target: id,
          details: JSON.stringify({
            reason: input.reason,
            idempotencyKey: input.idempotencyKey,
            before: {
              acknowledgedAt: incident.acknowledgedAt?.toISOString() ?? null,
              acknowledgedBy: incident.acknowledgedBy,
            },
            after: {
              acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
              acknowledgedBy: row.acknowledgedBy,
            },
            result: "ok",
          }),
        },
      });
      return { ...row, auditId: audit.id, replayed: false };
    });
  }

  async listMaintenanceWindows(query: {
    status?: string;
    environment?: string;
    limit?: number;
  }) {
    if (this.d1?.isEnabled())
      return this.d1.listAdminMaintenance(query.limit ?? 100);
    const rows = await this.prisma.adminMaintenanceWindow.findMany({
      where: {
        ...(query.environment ? { environment: query.environment } : {}),
        ...(query.status
          ? { status: query.status.toUpperCase() as AdminMaintenanceStatus }
          : {}),
      },
      orderBy: { scheduledAt: "desc" },
      take: query.limit ?? 100,
    });
    const now = Date.now();
    return rows.map((row) => ({
      id: row.id,
      scope: row.scope.toLowerCase(),
      target: row.target,
      status:
        row.status === "CANCELLED"
          ? "cancelled"
          : row.endsAt.getTime() <= now
            ? "completed"
            : row.scheduledAt.getTime() <= now
              ? "active"
              : "scheduled",
      scheduledAt: row.scheduledAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      reason: row.reason,
      environment: row.environment,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      cancelledAt: row.cancelledAt?.toISOString(),
      cancelledBy: row.cancelledBy,
      cancelReason: row.cancelReason,
      correlationId: row.correlationId,
    }));
  }

  async createMaintenanceWindow(input: {
    scope: "global" | "route" | "market" | "pair";
    target: string;
    scheduledAt: string;
    endsAt: string;
    reason: string;
    environment: string;
    idempotencyKey: string;
    createdBy: string;
  }) {
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException(
        "Maintenance scheduling requires a reason and original request key",
      );
    const start = new Date(input.scheduledAt);
    const end = new Date(input.endsAt);
    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      end <= start
    ) {
      throw new BadRequestException("Maintenance end must be after start");
    }
    if (this.d1?.isEnabled()) {
      return this.d1.createMaintenanceWindow({ id: randomUUID(), ...input });
    }
    const existing = await this.prisma.adminMaintenanceWindow.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.createdBy !== input.createdBy ||
        existing.scope !== input.scope.toUpperCase() ||
        existing.target !== input.target.trim() ||
        existing.reason !== input.reason.trim() ||
        existing.environment !== input.environment ||
        new Date(existing.scheduledAt).getTime() !== start.getTime() ||
        new Date(existing.endsAt).getTime() !== end.getTime())
        throw new ConflictException("Maintenance scheduling key belongs to a different original request");
      const audit = await this.prisma.adminAuditLog.findFirst({
        where: { adminId: input.createdBy, action: "MAINTENANCE_WINDOW_SCHEDULED",
          target: existing.id, details: { contains: '"idempotencyKey":"' + input.idempotencyKey + '"' } },
        orderBy: { createdAt: "desc" },
      });
      if (!audit)
        throw new ConflictException("Original maintenance scheduling audit receipt is unavailable");
      return { ...existing, auditId: audit.id, replayed: true };
    }
    const correlationId = `maintenance:${input.idempotencyKey}`;
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.adminMaintenanceWindow.create({
        data: {
          scope: input.scope.toUpperCase() as AdminMaintenanceScope,
          target: input.target.trim(),
          scheduledAt: start,
          endsAt: end,
          reason: input.reason.trim(),
          environment: input.environment,
          createdBy: input.createdBy,
          idempotencyKey: input.idempotencyKey,
          correlationId,
        },
      });
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId: input.createdBy,
          action: "MAINTENANCE_WINDOW_SCHEDULED",
          target: row.id,
          details: {
            reason: input.reason,
            correlationId,
            idempotencyKey: input.idempotencyKey,
            after: {
              id: row.id,
              scope: row.scope,
              target: row.target,
              status: row.status,
              scheduledAt: row.scheduledAt.toISOString(),
              endsAt: row.endsAt.toISOString(),
              reason: row.reason,
              environment: row.environment,
              createdBy: row.createdBy,
              createdAt: row.createdAt.toISOString(),
              correlationId: row.correlationId,
            },
            result: "ok",
          },
        },
      });
      return { ...row, auditId: audit.id };
    });
    return { ...created, replayed: false };
  }

  async cancelMaintenanceWindow(
    id: string,
    adminId: string,
    input: { reason: string; idempotencyKey: string },
  ) {
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException(
        "Maintenance cancellation requires a reason and original request key",
      );
    if (this.d1?.isEnabled()) {
      return this.d1.cancelMaintenanceWindow({
        windowId: id,
        adminId,
        ...input,
      });
    }
    const replay = await this.prisma.adminMaintenanceWindow.findUnique({
      where: { cancelIdempotencyKey: input.idempotencyKey },
    });
    if (replay) {
      if (replay.id !== id || replay.cancelledBy !== adminId ||
        replay.cancelReason !== input.reason.trim())
        throw new ConflictException("Maintenance cancellation key belongs to a different original request");
      const audit = await this.prisma.adminAuditLog.findFirst({
        where: { adminId, action: "MAINTENANCE_WINDOW_CANCELLED",
          target: id, details: { contains: '"idempotencyKey":"' + input.idempotencyKey + '"' } },
        orderBy: { createdAt: "desc" },
      });
      if (!audit)
        throw new ConflictException("Original maintenance cancellation audit receipt is unavailable");
      return { ...replay, auditId: audit.id, replayed: true };
    }
    const existing = await this.prisma.adminMaintenanceWindow.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Maintenance window not found");
    if (existing.status === "CANCELLED") throw new ConflictException("Window already cancelled by a different command");
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.adminMaintenanceWindow.updateMany({
        where: { id, status: existing.status, cancelIdempotencyKey: null },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: adminId,
          cancelReason: input.reason.trim(),
          cancelIdempotencyKey: input.idempotencyKey,
        },
      });
      if (claimed.count !== 1) {
        const replay = await tx.adminMaintenanceWindow.findUnique({
          where: { cancelIdempotencyKey: input.idempotencyKey },
        });
        if (replay) {
          if (replay.id !== id || replay.cancelledBy !== adminId ||
              replay.cancelReason !== input.reason.trim())
            throw new ConflictException("Maintenance cancellation key belongs to a different original request");
          const audit = await tx.adminAuditLog.findFirst({
            where: { adminId, action: "MAINTENANCE_WINDOW_CANCELLED",
              target: id, details: { contains: '"idempotencyKey":"' + input.idempotencyKey + '"' } },
            orderBy: { createdAt: "desc" },
          });
          if (!audit)
            throw new ConflictException("Original maintenance cancellation audit receipt is unavailable");
          return { ...replay, auditId: audit.id, replayed: true };
        }
        const current = await tx.adminMaintenanceWindow.findUnique({ where: { id } });
        if (!current) throw new NotFoundException("Maintenance window not found");
        throw new ConflictException(
          current.status === "CANCELLED"
            ? "Window already cancelled by a different command"
            : "Maintenance window changed while cancellation was being applied",
        );
      }
      const row = await tx.adminMaintenanceWindow.findUnique({ where: { id } });
      if (!row) throw new NotFoundException("Maintenance window not found");
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "MAINTENANCE_WINDOW_CANCELLED",
          target: id,
          details: {
            reason: input.reason,
            idempotencyKey: input.idempotencyKey,
            before: {
              id: existing.id,
              scope: existing.scope,
              target: existing.target,
              status: existing.status,
              scheduledAt: existing.scheduledAt.toISOString(),
              endsAt: existing.endsAt.toISOString(),
              reason: existing.reason,
              environment: existing.environment,
              createdBy: existing.createdBy,
              createdAt: existing.createdAt.toISOString(),
              correlationId: existing.correlationId,
            },
            after: {
              id: row.id,
              scope: row.scope,
              target: row.target,
              status: row.status,
              scheduledAt: row.scheduledAt.toISOString(),
              endsAt: row.endsAt.toISOString(),
              reason: row.reason,
              environment: row.environment,
              createdBy: row.createdBy,
              createdAt: row.createdAt.toISOString(),
              cancelledAt: row.cancelledAt?.toISOString() ?? null,
              cancelledBy: row.cancelledBy,
              cancelReason: row.cancelReason,
              correlationId: row.correlationId,
            },
            result: "ok",
          },
        },
      });
      return { ...row, auditId: audit.id, replayed: false };
    });
    return updated;
  }

  // --- Dashboard & Stats ---

  async getAdminStats() {
    if (this.d1?.isEnabled()) return this.d1.getAdminStats();
    const totalVolume = await this.prisma.binaryOptionPosition.aggregate({
      _sum: { amount: true },
    });
    const activeUsers = await this.prisma.user.count();
    const binaryConfigurations =
      await this.prisma.gate2BinaryConfiguration.findMany({
        where: { enabled: true },
        select: { payoutRate: true },
      });

    return {
      totalVolume: totalVolume._sum.amount || 0,
      activeUsers,
      globalPayoutRate: binaryConfigurations.length
        ? binaryConfigurations.reduce(
            (sum, config) => sum + Number(config.payoutRate),
            0,
          ) / binaryConfigurations.length
        : 0,
    };
  }

  async getSystemConfig() {
    if (this.d1?.isEnabled()) {
      const configs: any[] = await this.d1.listSystemConfig();
      return {
        status: "ok",
        timeframes: [],
        marketStats: [],
        config: Object.fromEntries(
          configs.map((row) => [String(row.key), String(row.value)]),
        ),
      };
    }
    // Get timeframes and pair stats
    const timeframes = await this.prisma.binaryTimeframe.findMany({
      orderBy: { seconds: "asc" },
    });
    const marketStats = await this.prisma.binaryPair.groupBy({
      by: ["category"],
      _count: true,
    });

    // Get generic system config
    const configs = await this.prisma.systemConfig.findMany();
    const configMap = configs.reduce(
      (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
      {},
    );

    return {
      status: "ok",
      timeframes,
      marketStats,
      config: configMap,
    };
  }

  async updateSystemConfig(
    key: string,
    value: string,
    description?: string,
    reason?: string,
    adminId?: string,
    idempotencyKey?: string,
  ) {
    if (!reason?.trim() || !adminId || !idempotencyKey?.trim())
      throw new BadRequestException("Admin config changes require principal, reason and original key");
    if (key === "admin.frontend.quoteCategories")
      assertVisiblePublicQuotesCategory(value);
    if (key === "admin.frontend.routes") assertPublicRouteSettings(value);
    if (key === "admin.frontend.banners") assertPublicBannerSettings(value);
    if (key === "admin.frontend.supportEntryPoints")
      assertSupportEntryPoints(value);
    if (this.d1?.isEnabled())
      return this.d1.updateSystemConfig({
        key, value, description, reason, adminId, idempotencyKey,
      });
    const auditId = this.marketMutationAuditId("SYSTEM_CONFIG_UPDATED", adminId, idempotencyKey);
    const details = JSON.stringify({ key, value, description: description ?? null,
      reason, idempotencyKey });
    return this.prisma.$transaction(async (tx) => {
      const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
      if (previous) {
        if (previous.adminId !== adminId || previous.action !== "SYSTEM_CONFIG_UPDATED" ||
          previous.target !== key || previous.details !== details)
          throw new ConflictException("System configuration key belongs to another original request");
        const current = await tx.systemConfig.findUnique({ where: { key } });
        if (!current) throw new NotFoundException("Original configuration no longer exists");
        return { ...current, ok: true, auditId, replayed: true };
      }
      const result = await tx.systemConfig.upsert({
        where: { key }, update: { value, description }, create: { key, value, description },
      });
      await tx.adminAuditLog.create({ data: {
        id: auditId, adminId, action: "SYSTEM_CONFIG_UPDATED", target: key, details,
      } });
      return { ...result, ok: true, auditId };
    });
  }

  async createGovernanceCommand(input: {
    commandType: string;
    target?: string;
    reason: string;
    idempotencyKey: string;
    payload?: Record<string, unknown>;
    requestedBy: string;
  }) {
    if (!input.reason?.trim())
      throw new BadRequestException("A reason is required");
    if (this.d1?.isEnabled())
      return this.d1.createGovernanceCommand({ id: randomUUID(), ...input });
    try {
      return await this.prisma.$transaction(async (tx: any) => {
        const existing = await tx.adminGovernanceCommand.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing) {
          assertGovernanceReplayMatches(existing, input);
          return existing;
        }
        const command = await tx.adminGovernanceCommand.create({
          data: {
            commandType: input.commandType,
            target: input.target,
            reason: input.reason,
            idempotencyKey: input.idempotencyKey,
            payload: input.payload
              ? JSON.stringify(canonicalize(input.payload))
              : null,
            requestedBy: input.requestedBy,
          },
        });
        await tx.adminAuditLog.create({
          data: {
            adminId: input.requestedBy,
            action: "GOVERNANCE_COMMAND_REQUESTED",
            target: input.target,
            details: {
              commandId: command.id,
              commandType: input.commandType,
              reason: input.reason,
              idempotencyKey: input.idempotencyKey,
            },
          },
        });
        return command;
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const existing = await this.prisma.adminGovernanceCommand.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (!existing) throw error;
      assertGovernanceReplayMatches(existing, input);
      return existing;
    }
  }

  async decideGovernanceCommand(
    commandId: string,
    approverId: string,
    decision: "APPROVED" | "REJECTED",
    reason: string,
  ) {
    if (!reason?.trim())
      throw new BadRequestException("A decision reason is required");
    if (this.d1?.isEnabled())
      return this.d1.decideGovernanceCommand(
        commandId,
        approverId,
        decision,
        reason,
      );
    const action = `GOVERNANCE_COMMAND_${decision}`;
    return this.prisma.$transaction(async (tx: any) => {
      const command = await tx.adminGovernanceCommand.findUnique({
        where: { id: commandId },
      });
      if (!command)
        throw new NotFoundException("Governance command not found");
      if (command.requestedBy === approverId)
        throw new ForbiddenException(
          "The requester cannot approve their own command",
        );

      const receiptForOriginalDecision = async (current: any) => {
        const approval = await tx.adminGovernanceApproval.findFirst({
          where: { commandId, decision },
          orderBy: { createdAt: "asc" },
        });
        if (!approval || approval.approverId !== approverId ||
            approval.reason !== reason)
          throw new ConflictException(
            "Governance decision is complete under a different original request",
          );
        const auditId = this.marketMutationAuditId(
          action,
          approverId,
          `governance:${commandId}:${decision}`,
        );
        const audit = await tx.adminAuditLog.findUnique({ where: { id: auditId } }) ??
          await tx.adminAuditLog.findFirst({
            where: { adminId: approverId, action, target: commandId },
            orderBy: { createdAt: "asc" },
          });
        if (!audit)
          throw new ConflictException(
            "Original governance decision audit receipt is unavailable",
          );
        let details: Record<string, unknown>;
        try {
          details = JSON.parse(audit.details ?? "{}") as Record<string, unknown>;
        } catch {
          throw new ConflictException(
            "Original governance decision audit receipt is invalid",
          );
        }
        if (audit.adminId !== approverId || audit.action !== action ||
            audit.target !== commandId || details.reason !== reason)
          throw new ConflictException(
            "Original governance decision audit receipt does not match the request",
          );
        return { ...current, auditId: audit.id };
      };

      if (command.status !== "PENDING") {
        if (command.status !== decision)
          throw new BadRequestException(
            `Governance command is already ${String(command.status).toLowerCase()}`,
          );
        return receiptForOriginalDecision(command);
      }

      const claimed = await tx.adminGovernanceCommand.updateMany({
        where: { id: commandId, status: "PENDING" },
        data:
          decision === "APPROVED"
            ? {
                status: "APPROVED",
                approvedBy: approverId,
                approvedAt: new Date(),
              }
            : { status: "REJECTED" },
      });
      if (claimed.count !== 1) {
        const current = await tx.adminGovernanceCommand.findUnique({
          where: { id: commandId },
        });
        if (!current)
          throw new NotFoundException("Governance command not found");
        if (current.status !== decision)
          throw new BadRequestException(
            `Governance command is already ${String(current.status).toLowerCase()}`,
          );
        return receiptForOriginalDecision(current);
      }
      await tx.adminGovernanceApproval.create({
        data: { commandId, approverId, decision, reason },
      });
      const auditId = this.marketMutationAuditId(
        action,
        approverId,
        `governance:${commandId}:${decision}`,
      );
      const audit = await tx.adminAuditLog.create({
        data: {
          id: auditId,
          adminId: approverId,
          action,
          target: commandId,
          details: JSON.stringify({ reason }),
        },
      });
      const updated = await tx.adminGovernanceCommand.findUnique({
        where: { id: commandId },
      });
      if (!updated)
        throw new NotFoundException("Governance command not found");
      return { ...updated, auditId: audit.id };
    });
  }

  async listGovernanceCommands() {
    if (this.d1?.isEnabled()) return this.d1.listGovernanceCommands();
    return this.prisma.adminGovernanceCommand.findMany({
      include: { approvals: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateFeatureFlag(input: {
    key: string;
    enabled: boolean;
    environment?: string;
    reason: string;
    updatedBy: string;
    idempotencyKey: string;
  }) {
    if (!input.idempotencyKey?.trim())
      throw new BadRequestException("Feature flag original request key is required");
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for feature flag changes",
      );
    if (this.d1?.isEnabled())
      return this.d1.updateFeatureFlag({
        key: input.key,
        enabled: input.enabled,
        environment: input.environment ?? "sandbox",
        reason: input.reason,
        updatedBy: input.updatedBy,
        idempotencyKey: input.idempotencyKey,
      });
    const hex = createHash("sha256").update(JSON.stringify([
      "feature-flag", input.updatedBy, input.idempotencyKey,
    ])).digest("hex");
    const auditId = [hex.slice(0, 8), hex.slice(8, 12), "4" + hex.slice(13, 16),
      "8" + hex.slice(17, 20), hex.slice(20, 32)].join("-");
    const environment = input.environment ?? "sandbox";
    const details = JSON.stringify({
      idempotencyKey: input.idempotencyKey, enabled: input.enabled,
      environment, reason: input.reason,
    });
    return this.prisma.$transaction(async (tx) => {
      const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
      if (previous) {
        if (previous.adminId !== input.updatedBy || previous.action !== "FEATURE_FLAG_UPDATED" ||
          previous.target !== input.key || previous.details !== details)
          throw new ConflictException("Feature flag idempotency key belongs to another request");
        const current = await tx.adminFeatureFlag.findUnique({ where: { key: input.key } });
        if (!current) throw new NotFoundException("Feature flag replay cannot resolve");
        return { ...current, ok: true, auditId };
      }
      const flag = await tx.adminFeatureFlag.upsert({
        where: { key: input.key },
        update: { enabled: input.enabled, environment, reason: input.reason, updatedBy: input.updatedBy },
        create: { key: input.key, enabled: input.enabled, environment, reason: input.reason, updatedBy: input.updatedBy },
      });
      await tx.adminAuditLog.create({
        data: { id: auditId, adminId: input.updatedBy, action: "FEATURE_FLAG_UPDATED",
          target: input.key, details },
      });
      return { ...flag, ok: true, auditId };
    });
  }

  async listFeatureFlags() {
    return this.d1?.isEnabled()
      ? this.d1.listAdminFeatureFlags()
      : this.prisma.adminFeatureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async setUserLedgerFreeze(input: {
    userId: string;
    frozen: boolean;
    reason: string;
    idempotencyKey: string;
    adminId: string;
  }) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required to freeze or unfreeze ledger accounts",
      );
    if (this.d1?.isEnabled()) return this.d1.setUserLedgerFreeze(input);
    throw new ServiceUnavailableException(
      "Canonical ledger account authority is unavailable",
    );
  }

  async applyFinancialCorrection(input: {
    userId: string;
    asset: string;
    amount: string;
    direction: "CREDIT" | "DEBIT";
    scope?: "MAIN" | "SPOT" | "MARGIN" | "BINARY" | "FINANCE";
    idempotencyKey: string;
    reason: string;
    adminId: string;
  }) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for financial corrections",
      );
    if (this.d1?.isEnabled()) {
      const asset = String(input.asset ?? "").trim().toUpperCase();
      const scope = input.scope ?? "MAIN";
      const options = await this.getFinancialCorrectionOptions(input.userId);
      if (!options.some((option) => option.asset === asset && option.scopes.includes(scope))) {
        throw new BadRequestException(
          "Financial correction requires an active customer Ledger account and active configured asset for the selected scope",
        );
      }
      return this.d1.applyAdminFinancialCorrection({ ...input, asset, scope });
    }
    throw new ServiceUnavailableException(
      "Canonical financial correction authority is unavailable",
    );
  }

  async requestSandboxControl(input: {
    scope: "binary" | "spot" | "balance";
    target: string;
    mode: "normal" | "forced_win" | "forced_loss";
    seed?: string;
    expectedResult?: string;
    expiresAt?: string;
    reason: string;
    idempotencyKey: string;
    requestedBy: string;
  }) {
    if (process.env.NODE_ENV === "production")
      throw new ForbiddenException(
        "Sandbox controls are disabled in production",
      );
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for sandbox controls",
      );
    if (!["normal", "forced_win", "forced_loss"].includes(input.mode))
      throw new BadRequestException(
        "Sandbox mode must be normal, forced_win, or forced_loss",
      );
    if (input.scope !== "binary")
      throw new BadRequestException(
        `Unsupported sandbox scope: ${input.scope}. Only 'binary' scope is enforced`,
      );
    if (!input.expiresAt) {
      throw new BadRequestException("Sandbox scenarios require an expiry");
    }
    const expiresAt = new Date(input.expiresAt);
    if (
      !Number.isFinite(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        "Sandbox scenario expiry must be in the future",
      );
    }
    const sandboxTargets = (process.env.NEXI_SANDBOX_ACCOUNT_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!sandboxTargets.length || !sandboxTargets.includes(input.target)) {
      throw new ForbiddenException(
        "Sandbox target is not an approved sandbox account/entity",
      );
    }
    return this.createGovernanceCommand({
      commandType: "SANDBOX_CONTROL",
      target: input.target,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
      payload: {
        SANDBOX_ONLY: true,
        NON_PRODUCTION: true,
        ROLE_GATED: true,
        ACCOUNT_SCOPED: true,
        scope: input.scope,
        target: input.target,
        mode: input.mode,
        seed: input.seed,
        expectedResult: input.expectedResult,
        expiresAt: input.expiresAt,
      },
      requestedBy: input.requestedBy,
    });
  }

  executeSandboxControl(commandId: string, executorId: string) {
    return this.sandboxExecution.executeApproved(commandId, executorId);
  }

  async decideKyc(input: {
    id: string;
    decision: "approved" | "rejected";
    reason: string;
    idempotencyKey: string;
    adminId: string;
  }) {
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException(
        "A KYC decision requires a reason and original request key",
      );
    if (this.d1?.isEnabled()) {
      return this.d1.decideKyc({
        ...input,
        decision: input.decision.toUpperCase() as "APPROVED" | "REJECTED",
      });
    }
    const action = "KYC_DECISION";
    const auditId = this.marketMutationAuditId(
      action,
      "KYC_DECISION",
      input.idempotencyKey,
    );
    return this.prisma.$transaction(async (tx) => {
      const previous = await tx.adminAuditLog.findUnique({
        where: { id: auditId },
      }) ?? await tx.adminAuditLog.findFirst({
        where: {
          action,
          details: { path: ["idempotencyKey"], equals: input.idempotencyKey },
        },
        orderBy: { createdAt: "asc" },
      });
      if (previous) {
        let details: Record<string, unknown>;
        try {
          const parsed = typeof previous.details === "string"
            ? JSON.parse(previous.details)
            : previous.details;
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            throw new Error("Invalid audit detail shape");
          details = parsed as Record<string, unknown>;
        } catch {
          throw new ConflictException("Original KYC decision audit receipt is invalid");
        }
        const expectedStatus = input.decision === "approved" ? "APPROVED" : "REJECTED";
        if (previous.adminId !== input.adminId || previous.action !== action ||
            previous.target !== input.id || details.decision !== input.decision ||
            details.reason !== input.reason || details.idempotencyKey !== input.idempotencyKey)
          throw new ConflictException(
            "KYC decision key belongs to a different original request",
          );
        return {
          ok: true,
          auditId: previous.id,
          replayed: true,
          status: expectedStatus,
        };
      }

      const kyc = await tx.kYC.findUnique({
        where: { id: input.id },
        select: { id: true, userId: true, status: true },
      });
      if (!kyc) throw new NotFoundException("KYC review not found");
      const updated = await tx.kYC.update({
        where: { id: input.id },
        data: {
          status: input.decision === "approved" ? "APPROVED" : "REJECTED",
        },
      });
      const audit = await tx.adminAuditLog.create({
        data: {
          id: auditId,
          adminId: input.adminId,
          action,
          target: input.id,
          details: {
            decision: input.decision,
            reason: input.reason,
            before: kyc.status,
            after: updated.status,
            idempotencyKey: input.idempotencyKey,
            userId: kyc.userId,
          },
        },
      });
      return {
        ok: true,
        auditId: audit.id,
        replayed: false,
        status: updated.status,
      };
    });
  }

  // --- User Management ---

  async getFinancialCorrectionOptions(userId: string) {
    const accounts = this.d1?.isEnabled()
      ? await this.d1.listLedgerAccounts(userId)
      : await this.prisma.ledgerAccount.findMany({
          where: { userId },
          select: { asset: true, scope: true, status: true },
          orderBy: [{ asset: "asc" }, { scope: "asc" }],
        });
    const currencies = await this.getCurrencies();
    const configured = new Map<string, string>(
      currencies
        .filter((currency: any) => currency.isActive === true || currency.isActive === 1)
        .map((currency: any): [string, string] => [
          String(currency.symbol).toUpperCase(),
          String(currency.name ?? currency.symbol),
        ]),
    );
    const eligible = new Map<string, { asset: string; name: string; scopes: Set<string> }>();
    for (const account of accounts as any[]) {
      const asset = String(account.asset ?? "").toUpperCase();
      const scope = String(account.scope ?? "");
      if (account.status !== "ACTIVE" || !configured.has(asset)) continue;
      const option = eligible.get(asset) ?? { asset, name: configured.get(asset)!, scopes: new Set<string>() };
      option.scopes.add(scope);
      eligible.set(asset, option);
    }
    return [...eligible.values()]
      .map(({ asset, name, scopes }) => ({ asset, name, scopes: [...scopes].sort() }))
      .sort((a, b) => a.asset.localeCompare(b.asset));
  }

  async getUsers() {
    if (this.d1?.isEnabled()) return this.d1.listUsers();
    const users = await this.prisma.user.findMany({
      include: {
        wallet: true,
        walletIdentity: { select: { address: true } },
        kyc: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return users.map(({ walletIdentity, kyc, ...user }) => ({
      ...user,
      // User has no canonical lifecycle-status field; never infer "active".
      status: "unknown",
      walletAddress: walletIdentity?.address ?? null,
      kycStatus: kyc?.status ?? null,
      binaryResearchEligible: this.isBinaryResearchAccount(user.id),
    }));
  }

  async getKycReviews() {
    if (this.d1?.isEnabled()) return this.d1.listKycReviews();
    return this.prisma.kYC.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        documentType: true,
        country: true,
        status: true,
      },
    });
  }

  async getAuthSessions() {
    if (this.d1?.isEnabled()) return this.d1.listAdminAuthSessions();
    return this.prisma.authSession.findMany({
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        userAgentHash: true,
        ipHash: true,
      },
    });
  }

  async revokeAuthSession(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim() || !idempotencyKey?.trim())
      throw new BadRequestException("Session revocation requires a reason and original request key");
    let sessionIdentity: { userId: string; surface: "PUBLIC" | "ADMIN" } | null;
    let result: { ok: boolean; auditId: string };
    if (this.d1?.isEnabled()) {
      const session = await this.d1.getAuthSessionById(id);
      if (!session) throw new NotFoundException("Session not found");
      if (session.surface !== "PUBLIC" && session.surface !== "ADMIN")
        throw new ConflictException("Session surface is invalid");
      sessionIdentity = { userId: session.userId, surface: session.surface };
      result = await this.d1.revokeAdminSession({
        sessionId: id,
        adminId,
        reason,
        idempotencyKey,
      }) as { ok: boolean; auditId: string };
    } else {
      sessionIdentity = await this.prisma.authSession.findUnique({
        where: { id },
        select: { userId: true, surface: true },
      });
      if (!sessionIdentity) throw new NotFoundException("Session not found");
      const action = "ADMIN_SESSION_REVOKED";
      const auditId = this.marketMutationAuditId(action, adminId, idempotencyKey);
      result = await this.prisma.$transaction(async (tx) => {
        const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
        if (previous) {
          const previousDetails = JSON.parse(previous.details ?? "{}") as Record<string, unknown>;
          if (previous.adminId !== adminId || previous.action !== action || previous.target !== id ||
              previousDetails.reason !== reason || previousDetails.idempotencyKey !== idempotencyKey)
            throw new ConflictException("Session revocation key belongs to another original request");
          return { ok: true, auditId: previous.id };
        }
        const session = await tx.authSession.findUnique({
          where: { id },
          select: { id: true, userId: true, revokedAt: true },
        });
        if (!session) throw new NotFoundException("Session not found");
        if (!session.revokedAt)
          await tx.authSession.update({
            where: { id },
            data: { revokedAt: new Date(), revokeReason: reason },
          });
        const audit = await tx.adminAuditLog.create({
          data: {
            id: auditId,
            adminId,
            action,
            target: id,
            details: JSON.stringify({ reason, idempotencyKey, userId: session.userId }),
          },
        });
        return { ok: true, auditId: audit.id };
      });
    }
    this.authSecurityEvents?.emit({
      type: "LOGOUT",
      occurredAt: new Date(),
      userId: sessionIdentity.userId,
      sessionId: id,
      surface: sessionIdentity.surface,
      reason,
    });
    return result;
  }

  async revokeUserSessions(
    userId: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim() || !idempotencyKey?.trim())
      throw new BadRequestException("Session revocation requires a reason and original request key");
    let result: { ok: boolean; auditId: string; count: number };
    if (this.d1?.isEnabled()) {
      result = await this.d1.revokeAdminUserSessions({
        userId,
        adminId,
        reason,
        idempotencyKey,
      }) as { ok: boolean; auditId: string; count: number };
    } else {
      const action = "ADMIN_USER_SESSIONS_REVOKED";
      const auditId = this.marketMutationAuditId(action, adminId, idempotencyKey);
      result = await this.prisma.$transaction(async (tx) => {
        const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
        if (previous) {
          const previousDetails = JSON.parse(previous.details ?? "{}") as Record<string, unknown>;
          const count = previousDetails.count;
          if (previous.adminId !== adminId || previous.action !== action || previous.target !== userId ||
              previousDetails.reason !== reason || previousDetails.idempotencyKey !== idempotencyKey ||
              typeof count !== "number" || !Number.isInteger(count) || count < 0)
            throw new ConflictException("Session revocation key belongs to another original request");
          return { ok: true, auditId: previous.id, count };
        }
        const updated = await tx.authSession.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date(), revokeReason: reason },
        });
        const audit = await tx.adminAuditLog.create({
          data: {
            id: auditId,
            adminId,
            action,
            target: userId,
            details: JSON.stringify({ reason, idempotencyKey, count: updated.count }),
          },
        });
        return { ok: true, auditId: audit.id, count: updated.count };
      });
    }
    for (const surface of ["PUBLIC", "ADMIN"] as const) {
      this.authSecurityEvents?.emit({
        type: "LOGOUT_ALL",
        occurredAt: new Date(),
        userId,
        surface,
        reason,
      });
    }
    return result;
  }

  async setWinRate(userId: string, outcome: string) {
    throw new ForbiddenException(
      `Sandbox-only outcome control rejected for ${userId}:${outcome}`,
    );
  }

  // --- Crypto Management ---

  async getCurrencies() {
    if (this.d1?.isEnabled()) return this.d1.listAdminCurrencies();
    return this.prisma.currency.findMany({
      orderBy: { id: "asc" },
      include: { depositAddresses: true },
    });
  }

  async getMarketAssets() {
    return this.marketDatabase().marketAsset.findMany({
      include: { networks: true, capabilities: true },
      orderBy: { symbol: "asc" },
    });
  }

  private marketMutationAuditId(action: string, adminId: string, key: string): string {
    const hex = createHash("sha256")
      .update(JSON.stringify(["market-admin", action, adminId, key]))
      .digest("hex");
    return [hex.slice(0, 8), hex.slice(8, 12), "4" + hex.slice(13, 16),
      "8" + hex.slice(17, 20), hex.slice(20, 32)].join("-");
  }

  async setMarketAssetVisibility(input: {
    id: string; visible: boolean; adminId: string; reason: string; idempotencyKey: string;
  }) {
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException("Asset visibility requires reason and original request key");
    const action = "MARKET_ASSET_VISIBILITY_UPDATED";
    const auditId = this.marketMutationAuditId(action, input.adminId, input.idempotencyKey);
    const db = this.marketDatabase();
    return db.$transaction(async (tx: any) => {
      const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
      if (previous) {
        const asset = await tx.marketAsset.findUnique({ where: { id: input.id } });
        const expected = asset && JSON.stringify({
          symbol: asset.symbol, visible: input.visible,
          reason: input.reason, idempotencyKey: input.idempotencyKey,
        });
        if (!asset || previous.adminId !== input.adminId || previous.action !== action ||
          previous.target !== input.id || previous.details !== expected)
          throw new ConflictException("Asset visibility key belongs to another original request");
        return { ok: true, auditId, status: asset.status, replayed: true };
      }
      const asset = await tx.marketAsset.findUnique({
        where: { id: input.id }, select: { id: true, symbol: true },
      });
      if (!asset) throw new NotFoundException("Market asset not found");
      const updated = await tx.marketAsset.update({
        where: { id: asset.id },
        data: { status: input.visible ? "ACTIVE" : "MAINTENANCE",
          maintenanceNote: input.visible ? null : input.reason },
      });
      const audit = await tx.adminAuditLog.create({ data: {
        id: auditId, adminId: input.adminId, action, target: asset.id,
        details: JSON.stringify({ symbol: asset.symbol, visible: input.visible,
          reason: input.reason, idempotencyKey: input.idempotencyKey }),
      } });
      return { ok: true, auditId: audit.id, status: updated.status };
    });
  }

  async getMarketNetworks() {
    return this.marketDatabase().marketNetwork.findMany({
      include: { asset: true, capabilities: true },
      orderBy: [{ assetId: "asc" }, { code: "asc" }],
    });
  }

  async setMarketNetworkVisibility(input: {
    id: string; enabled: boolean; adminId: string; reason: string; idempotencyKey: string;
  }) {
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException("Network visibility requires reason and original request key");
    const action = "MARKET_NETWORK_VISIBILITY_UPDATED";
    const auditId = this.marketMutationAuditId(action, input.adminId, input.idempotencyKey);
    const db = this.marketDatabase();
    return db.$transaction(async (tx: any) => {
      const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
      if (previous) {
        const network = await tx.marketNetwork.findUnique({ where: { id: input.id } });
        const expected = network && JSON.stringify({
          code: network.code, enabled: input.enabled,
          reason: input.reason, idempotencyKey: input.idempotencyKey,
        });
        if (!network || previous.adminId !== input.adminId || previous.action !== action ||
          previous.target !== input.id || previous.details !== expected)
          throw new ConflictException("Network visibility key belongs to another original request");
        return { ok: true, auditId, status: network.status, replayed: true };
      }
      const network = await tx.marketNetwork.findUnique({
        where: { id: input.id }, select: { id: true, code: true },
      });
      if (!network) throw new NotFoundException("Market network not found");
      const updated = await tx.marketNetwork.update({
        where: { id: network.id },
        data: { status: input.enabled ? "ACTIVE" : "MAINTENANCE",
          maintenanceNote: input.enabled ? null : input.reason },
      });
      const audit = await tx.adminAuditLog.create({ data: {
        id: auditId, adminId: input.adminId, action, target: network.id,
        details: JSON.stringify({ code: network.code, enabled: input.enabled,
          reason: input.reason, idempotencyKey: input.idempotencyKey }),
      } });
      return { ok: true, auditId: audit.id, status: updated.status };
    });
  }

  async getMarketFeeds() {
    return this.marketDatabase().marketProviderConfig.findMany({
      include: {
        symbols: {
          include: {
            pair: { include: { latest: true } },
          },
        },
      },
      orderBy: [{ priority: "asc" }, { key: "asc" }],
    });
  }

  async setMarketFeedStatus(input: {
    id: string; status: "LIVE" | "STALE" | "UNAVAILABLE" | "DISABLED";
    adminId: string; reason: string; idempotencyKey: string;
  }) {
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException("Provider status requires reason and original request key");
    if (input.status === "LIVE" || input.status === "STALE")
      throw new BadRequestException("LIVE and STALE are runtime-derived states, not admin configuration");
    const action = "MARKET_PROVIDER_STATUS_UPDATED";
    const auditId = this.marketMutationAuditId(action, input.adminId, input.idempotencyKey);
    const db = this.marketDatabase();
    return db.$transaction(async (tx: any) => {
      const symbol = await tx.marketProviderSymbol.findFirst({
        where: { OR: [{ id: input.id }, { providerId: input.id }] },
        select: { providerId: true },
      });
      const provider = await tx.marketProviderConfig.findUnique({
        where: { id: symbol?.providerId ?? input.id },
        select: { id: true, key: true, status: true },
      });
      if (!provider) throw new NotFoundException("Market provider not found");
      const status = input.status === "DISABLED" ? "DISABLED" : "ACTIVE";
      const details = JSON.stringify({
        status: input.status, providerStatus: status,
        reason: input.reason, idempotencyKey: input.idempotencyKey,
      });
      const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
      if (previous) {
        if (previous.adminId !== input.adminId || previous.action !== action ||
          previous.target !== provider.key || previous.details !== details)
          throw new ConflictException("Provider status key belongs to another original request");
        return { ok: true, auditId, status: provider.status, replayed: true };
      }
      // Runtime LIVE/STALE are observed states, not writable lifecycle gates.
      const updated = await tx.marketProviderConfig.update({
        where: { id: provider.id }, data: { status },
      });
      const audit = await tx.adminAuditLog.create({ data: {
        id: auditId, adminId: input.adminId, action, target: provider.key, details,
      } });
      return { ok: true, auditId: audit.id, status: updated.status };
    });
  }

  async getSpotPairs() {
    return this.marketDatabase().marketPair.findMany({
      include: {
        baseAsset: true,
        quoteAsset: true,
        providerSymbols: { include: { provider: true } },
      },
      orderBy: { symbol: "asc" },
    });
  }

  async getSpotOrders() {
    return this.prisma.gate2SpotOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async getBinaryPositions() {
    const rows = this.d1?.isEnabled()
      ? await this.d1.listBinaryPositions()
      : await this.prisma.gate2BinaryPosition.findMany({
          orderBy: { createdAt: "desc" },
          take: 500,
        });
    return rows.map((position) => ({
      ...position,
      researchEligible: this.isBinaryResearchAccount(String(position.userId)),
    }));
  }

  private isBinaryResearchAccount(userId: string): boolean {
    return (process.env.NEXI_SANDBOX_ACCOUNT_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .includes(userId);
  }

  private async persistBinaryResearchControl(input: {
    target: string;
    scope: "account" | "position";
    mode: "NORMAL" | "WIN" | "LOSS" | "DEFAULT";
    adminId: string;
    reason: string;
    idempotencyKey: string;
    expectedVersion?: number;
  }) {
    if (!input.reason.trim() || !input.idempotencyKey.trim())
      throw new BadRequestException("A reason and original request key are required");
    if (
      input.scope === "account" &&
      !this.isBinaryResearchAccount(input.target)
    ) {
      throw new ForbiddenException(
        "Binary control is limited to approved research accounts",
      );
    }
    const payload = JSON.stringify({
      scope: input.scope,
      mode: input.mode,
      expectedVersion: input.expectedVersion,
    });
    const action = input.scope === "account"
      ? "BINARY_RESEARCH_DEFAULT_UPDATED"
      : "BINARY_RESEARCH_POSITION_UPDATED";
    const auditId = this.marketMutationAuditId(
      action,
      input.adminId,
      input.idempotencyKey,
    );
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.adminGovernanceCommand.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      const target = `${input.scope}:${input.target}`;
      if (existing) {
        if (
          existing.commandType !== "BINARY_RESEARCH_CONTROL" ||
          existing.target !== target ||
          existing.requestedBy !== input.adminId ||
          existing.reason !== input.reason.trim() ||
          existing.payload !== payload
        ) {
          throw new BadRequestException(
            "Binary control idempotency key was already used",
          );
        }
        const audit = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
        if (!audit || audit.adminId !== input.adminId || audit.action !== action ||
            audit.target !== input.target)
          throw new ConflictException(
            "Original Binary control audit receipt is unavailable or mismatched",
          );
        let details: Record<string, unknown>;
        try {
          details = JSON.parse(audit.details ?? "{}") as Record<string, unknown>;
        } catch {
          throw new ConflictException("Original Binary control audit receipt is invalid");
        }
        if (details.scope !== input.scope || details.mode !== input.mode ||
            details.reason !== input.reason.trim() ||
            details.idempotencyKey !== input.idempotencyKey ||
            details.expectedVersion !== input.expectedVersion)
          throw new ConflictException(
            "Binary control key belongs to a different original request",
          );
        return { ok: true, auditId: audit.id, replayed: true };
      }

      await tx.adminGovernanceCommand.create({
        data: {
          commandType: "BINARY_RESEARCH_CONTROL",
          target,
          reason: input.reason.trim(),
          idempotencyKey: input.idempotencyKey,
          payload,
          requestedBy: input.adminId,
          status: "EXECUTED",
          executedAt: new Date(),
        },
      });
      if (input.scope === "account") {
        const changed = await tx.user.updateMany({
          where: { id: input.target },
          data: { binaryResearchDefault: input.mode },
        });
        if (changed.count !== 1)
          throw new NotFoundException("Research account not found");
      } else {
        const position = await tx.gate2BinaryPosition.findUnique({
          where: { id: input.target },
          select: { userId: true },
        });
        if (!position) throw new NotFoundException("Binary position not found");
        if (!this.isBinaryResearchAccount(position.userId)) {
          throw new ForbiddenException(
            "Binary control is limited to approved research accounts",
          );
        }
        const changed = await tx.gate2BinaryPosition.updateMany({
          where: {
            id: input.target,
            userId: position.userId,
            state: "ACTIVE",
            expiresAt: { gt: new Date() },
            researchControlVersion: input.expectedVersion,
          },
          data: {
            researchOverride: input.mode === "DEFAULT" ? null : input.mode,
            researchControlVersion: { increment: 1 },
          },
        });
        if (changed.count !== 1) {
          throw new ConflictException(
            "Position changed, expired, or is no longer open; refresh and retry",
          );
        }
      }
      const audit = await tx.adminAuditLog.create({
        data: {
          id: auditId,
          adminId: input.adminId,
          action,
          target: input.target,
          details: JSON.stringify({
            scope: input.scope,
            mode: input.mode,
            reason: input.reason.trim(),
            idempotencyKey: input.idempotencyKey,
            expectedVersion: input.expectedVersion,
          }),
        },
      });
      return { ok: true, auditId: audit.id, replayed: false };
    });
  }

  setBinaryResearchDefault(input: {
    userId: string;
    mode: "NORMAL" | "WIN" | "LOSS";
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }) {
    return this.persistBinaryResearchControl({
      ...input,
      target: input.userId,
      scope: "account",
    });
  }

  setBinaryResearchPositionOverride(input: {
    positionId: string;
    mode: "DEFAULT" | "NORMAL" | "WIN" | "LOSS";
    expectedVersion: number;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }) {
    return this.persistBinaryResearchControl({
      ...input,
      target: input.positionId,
      scope: "position",
    });
  }

  async getAdminSettlements() {
    if (this.d1?.isEnabled())
      return (await this.d1.listBinaryPositions()).filter((row) =>
        new Set<string>([Gate2BinaryState.WIN, Gate2BinaryState.LOSS, Gate2BinaryState.ERROR]).has(String(row.state)),
      );
    return this.prisma.gate2BinaryPosition.findMany({
      // Match the SQLite command gateway's terminal-only read model.
      where: { state: { in: [Gate2BinaryState.WIN, Gate2BinaryState.LOSS, Gate2BinaryState.ERROR] } },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
  }

  async settleAdminBinaryPosition(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim())
      throw new BadRequestException(
        "A reason is required to settle a Binary position",
      );
    const result = await this.binaryService.settlePosition(id, undefined, {
      adminId,
      reason,
      idempotencyKey,
    });
    const settlementState = String(result.position?.state ?? '').toUpperCase();
    const delayed = 'delayed' in result && result.delayed === true;
    const finalized = !delayed && (settlementState === 'WIN' || settlementState === 'LOSS');
    const replayed = 'replayed' in result && Boolean(result.replayed);
    const adminAuditId = 'adminAuditId' in result && typeof result.adminAuditId === 'string'
      ? result.adminAuditId : undefined;
    if (finalized && !replayed) {
      if (!adminAuditId)
        throw new Error('Atomic Admin Binary settlement audit was not confirmed');
      return { ...result, ok: true, auditId: adminAuditId };
    }
    // A replay/deferred request has no new financial posting to audit atomically.
    // Preserve the original operator intent on retries; do not create an audit
    // entry for every scheduler-delayed response or repeat Admin command.
    const action = finalized ? "ADMIN_BINARY_SETTLEMENT_REPLAYED" : "ADMIN_BINARY_SETTLEMENT_DEFERRED";
    const auditId = this.marketMutationAuditId(action, adminId, idempotencyKey);
    const details = JSON.stringify({ reason, idempotencyKey });
    const audit = await this.prisma.$transaction(async (tx) => {
      const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
      if (previous) {
        if (previous.adminId !== adminId || previous.action !== action ||
            previous.target !== id || previous.details !== details)
          throw new ConflictException("Binary settlement key belongs to another original request");
        return previous;
      }
      return tx.adminAuditLog.create({
        data: { id: auditId, adminId, action, target: id, details },
      });
    });
    return { ...result, ok: finalized, auditId: audit.id };
  }

  async setBinaryPairMaintenance(
    symbol: string,
    enabled: boolean,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim())
      throw new BadRequestException(
        "A reason is required to change Binary pair maintenance",
      );
    const normalized = symbol.trim().toUpperCase().replaceAll("/", "");
    const pair = await this.prisma.marketPair.findFirst({
      where: { OR: [{ id: symbol }, { symbol: normalized }, { symbol }] },
      select: { id: true, symbol: true },
    });
    if (!pair) throw new NotFoundException("Binary market pair not found");
    const action = "ADMIN_BINARY_PAIR_MAINTENANCE";
    // Keep old client keys compatible but scope the persisted outbox identity
    // to the resolved pair and requested state.
    const intent = JSON.stringify([idempotencyKey, pair.id, enabled, reason]);
    const eventKey = `admin:binary-pair:${this.marketMutationAuditId(action, adminId, intent)}`;
    return this.prisma.$transaction(async (tx) => {
      const auditCandidates = await tx.adminAuditLog.findMany({
        where: { adminId, action, target: pair.id },
        orderBy: { createdAt: "desc" },
      });
      const matches: typeof auditCandidates = [];
      for (const candidate of auditCandidates) {
        let previousDetails: Record<string, unknown> | null = null;
        try {
          const parsed = typeof candidate.details === "string"
            ? JSON.parse(candidate.details)
            : candidate.details;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
            previousDetails = parsed as Record<string, unknown>;
        } catch {
          if (candidate.details?.includes(JSON.stringify(idempotencyKey)))
            throw new ConflictException("Original Binary pair maintenance receipt is unreadable");
        }
        if (previousDetails?.idempotencyKey !== idempotencyKey) continue;
        if (previousDetails.reason !== reason || previousDetails.symbol !== pair.symbol)
          throw new ConflictException("Binary pair maintenance key was reused with different request context");
        if (previousDetails.enabled !== true && previousDetails.enabled !== false)
          throw new ConflictException("Original Binary pair maintenance receipt lacks intent state; reconcile before retrying");
        if (previousDetails.enabled === enabled) matches.push(candidate);
      }
      if (matches.length > 1)
        throw new ConflictException("Multiple original Binary pair maintenance receipts require reconciliation");
      if (matches[0])
        return {
          ok: true,
          auditId: matches[0].id,
          status: enabled ? "ACTIVE" : "MAINTENANCE",
          replayed: true,
        };

      const prior = await tx.eventOutbox.findUnique({
        where: { idempotencyKey: eventKey },
      });
      if (prior) {
        let payload: {
          adminId?: string;
          symbol?: string;
          enabled?: boolean;
          reason?: string;
          auditId?: string;
        };
        try {
          payload = JSON.parse(prior.payload);
        } catch {
          throw new ConflictException(
            "Binary pair idempotency key was already used",
          );
        }
        if (
          prior.eventType !== "BINARY_PAIR_AVAILABILITY_UPDATED" ||
          prior.aggregateId !== pair.id ||
          payload.adminId !== adminId ||
          payload.symbol !== pair.symbol ||
          payload.enabled !== enabled ||
          payload.reason !== reason ||
          !payload.auditId
        )
          throw new ConflictException(
            "Binary pair idempotency key was already used",
          );
        const audit = await tx.adminAuditLog.findUnique({
          where: { id: payload.auditId },
        });
        if (!audit || audit.adminId !== adminId || audit.action !== action ||
            audit.target !== pair.id)
          throw new ConflictException("Original Binary pair audit receipt is missing or mismatched");
        let details: Record<string, unknown> | null = null;
        try {
          const parsed = typeof audit.details === "string"
            ? JSON.parse(audit.details) : audit.details;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
            details = parsed as Record<string, unknown>;
        } catch { /* The original receipt must be readable. */ }
        if (!details || details.symbol !== pair.symbol || details.enabled !== enabled ||
            details.reason !== reason || details.idempotencyKey !== idempotencyKey)
          throw new ConflictException("Original Binary pair audit receipt does not match intent");
        return {
          ok: true,
          auditId: audit.id,
          status: enabled ? "ACTIVE" : "MAINTENANCE",
          replayed: true,
        };
      }

      // Append new versions rather than editing configurations referenced by open positions.
      // MarketPair status is shared with Spot/Margin and must remain independently controlled.
      const rows = await tx.gate2BinaryConfiguration.findMany({
        where: { pair: pair.symbol },
        orderBy: { version: "desc" },
        select: {
          pair: true,
          durationSeconds: true,
          payoutRate: true,
          lossRate: true,
          minStake: true,
          maxStake: true,
          settlementDelaySeconds: true,
          version: true,
        },
      });
      const latest = latestBinaryConfigurationRows(
        rows as Pick<
          Gate2BinaryConfiguration,
          | "pair"
          | "durationSeconds"
          | "payoutRate"
          | "lossRate"
          | "minStake"
          | "maxStake"
          | "settlementDelaySeconds"
          | "version"
        >[],
      );
      if (!latest.length)
        throw new NotFoundException("Binary pair configuration not found");
      for (const row of latest) {
        await tx.gate2BinaryConfiguration.create({
          data: {
            pair: row.pair,
            durationSeconds: row.durationSeconds,
            payoutRate: row.payoutRate,
            lossRate: row.lossRate,
            minStake: row.minStake,
            maxStake: row.maxStake,
            settlementDelaySeconds: row.settlementDelaySeconds,
            version: row.version + 1,
            enabled,
          },
        });
      }
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId,
          action,
          target: pair.id,
          details: { symbol: pair.symbol, enabled, reason, idempotencyKey },
        },
      });
      await tx.eventOutbox.create({
        data: {
          idempotencyKey: eventKey,
          aggregateType: "BinaryPair",
          aggregateId: pair.id,
          eventType: "BINARY_PAIR_AVAILABILITY_UPDATED",
          correlationId: idempotencyKey,
          payload: JSON.stringify({
            adminId,
            symbol: pair.symbol,
            enabled,
            reason,
            auditId: audit.id,
          }),
        },
      });
      return {
        ok: true,
        auditId: audit.id,
        status: enabled ? "ACTIVE" : "MAINTENANCE",
        replayed: false,
      };
    });
  }

  async getAdminWallets() {
    if (this.d1?.isEnabled()) return this.d1.listAdminWallets();
    return this.prisma.ledgerAccount.findMany({
      select: {
        id: true,
        userId: true,
        asset: true,
        scope: true,
        status: true,
        available: true,
        locked: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 500,
    });
  }

  async getAdminLedger() {
    if (this.d1?.isEnabled()) return this.d1.listAdminLedger();
    return this.prisma.ledgerPosting.findMany({
      include: { account: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async getAdminDeposits() {
    const observed = this.d1?.isEnabled()
      ? await this.d1.listAdminDeposits()
      : await this.prisma.gate2Deposit.findMany({
          orderBy: { createdAt: "desc" },
          take: 500,
        });
    const claims = await this.financialOperations.getAdminDepositClaims();
    const rows = [
      ...observed.map((deposit: any) => ({
        ...deposit,
        observedAt: deposit.observedAt ?? deposit.createdAt,
      })),
      ...claims.map((claim: any) => ({
        id: claim.id,
        userId: claim.userId,
        asset: claim.asset,
        network: claim.network,
        address: claim.destinationAddressSnapshot,
        txHash: claim.txHash ?? "",
        amount: claim.claimedAmount,
        confirmations: 0,
        requiredConfirmations: 0,
        state: claim.state,
        observedAt: claim.submittedAt,
        creditedAt: claim.state === "CREDITED" ? claim.reviewedAt : null,
        proofObjectKey: claim.proofObjectKey,
        manualClaim: true,
      })),
    ];
    return rows
      .sort(
        (a: any, b: any) =>
          new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
      )
      .slice(0, 500);
  }

  async getAdminDepositClaims() {
    return this.financialOperations.getAdminDepositClaims();
  }
  async confirmDepositClaim(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    return this.financialOperations.confirmDepositClaim(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }
  async creditDepositClaim(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    return this.financialOperations.creditDepositClaim(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }
  async rejectDepositClaim(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    return this.financialOperations.rejectDepositClaim(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }

  async getAdminWithdrawals() {
    if (this.d1?.isEnabled()) return this.d1.listAdminWithdrawals();
    return this.prisma.gate2Withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async confirmAdminDeposit(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (await this.prisma.depositClaim.findUnique({ where: { id } })) {
      return this.financialOperations.confirmDepositClaim(
        id,
        reason,
        adminId,
        idempotencyKey,
      );
    }
    return this.financialOperations.confirmDeposit(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }

  async creditAdminDeposit(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (await this.prisma.depositClaim.findUnique({ where: { id } })) {
      return this.financialOperations.creditDepositClaim(
        id,
        reason,
        adminId,
        idempotencyKey,
      );
    }
    return this.financialOperations.creditDeposit(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }

  async failAdminDeposit(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (await this.prisma.depositClaim.findUnique({ where: { id } })) {
      return this.financialOperations.rejectDepositClaim(
        id,
        reason,
        adminId,
        idempotencyKey,
      );
    }
    return this.financialOperations.failDeposit(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }

  async decideAdminWithdrawal(
    id: string,
    decision: "approved" | "rejected",
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException("Withdrawal idempotency key is required");
    }
    const operation = (
      decision === "approved"
        ? this.financialOperations.approveWithdrawal
        : this.financialOperations.rejectWithdrawal
    ).bind(this.financialOperations) as AdminWithdrawalDecision;
    return operation(id, reason, adminId, idempotencyKey);
  }

  async requestAdminWithdrawalReview(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    return this.financialOperations.requestWithdrawalReview(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }

  async returnAdminWithdrawalFromReview(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    return this.financialOperations.returnWithdrawalFromReview(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }

  async failAdminWithdrawal(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    return this.financialOperations.failWithdrawal(
      id,
      reason,
      adminId,
      idempotencyKey,
    );
  }

  async getAdminTickets() {
    if (this.d1?.isEnabled()) return this.d1.listAdminTickets();
    return this.prisma.supportTicket.findMany({
      include: { replies: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
  }

  async getAdminAnnouncements() {
    if (this.d1?.isEnabled()) return this.d1.listAdminAnnouncements();
    return this.prisma.announcement.findMany({
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
  }

  async cancelAdminSpotOrder(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim())
      throw new BadRequestException("A reason is required to cancel an order");
    const order = await this.prisma.gate2SpotOrder.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!order) throw new NotFoundException("Spot order not found");
    // The operator audit must commit with the same SQLite Ledger/Outbox cancellation.
    const result = await this.spotService.cancelOrder(order.userId, id, { adminId, reason, idempotencyKey });
    if (typeof result.adminAuditId !== 'string') throw new Error('Admin cancellation audit was not confirmed');
    return { ok: true, auditId: result.adminAuditId, state: result.status, replayed: Boolean(result.replayed) };
  }

  async setSpotPairMaintenance(
    symbol: string,
    enabled: boolean,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim() || !idempotencyKey?.trim())
      throw new BadRequestException("Pair maintenance requires reason and original request key");
    const action = "ADMIN_SPOT_PAIR_MAINTENANCE";
    return this.prisma.$transaction(async (tx) => {
      const pair = await tx.marketPair.findFirst({
        where: { OR: [{ id: symbol }, { symbol }] },
      });
      if (!pair) throw new NotFoundException("Spot pair not found");

      // The legacy client key omits pair and desired state. Scope the durable
      // identity to this exact intent while still reconciling old audit rows.
      const intent = JSON.stringify([idempotencyKey, pair.id, enabled]);
      const auditId = this.marketMutationAuditId(action, adminId, intent);
      const details = JSON.stringify({
        reason, idempotencyKey, enabled, symbol: pair.symbol,
      });
      const candidates = await tx.adminAuditLog.findMany({
        where: { adminId, action, target: pair.id },
        orderBy: { createdAt: "desc" },
      });
      const matches: typeof candidates = [];
      for (const candidate of candidates) {
        let previousDetails: Record<string, unknown> | null = null;
        try {
          const parsed = typeof candidate.details === "string"
            ? JSON.parse(candidate.details)
            : candidate.details;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
            previousDetails = parsed as Record<string, unknown>;
        } catch {
          if (candidate.details?.includes(JSON.stringify(idempotencyKey)))
            throw new ConflictException("Original pair maintenance receipt is unreadable");
        }
        if (previousDetails?.idempotencyKey !== idempotencyKey) continue;
        if (previousDetails.reason !== reason || previousDetails.symbol !== pair.symbol)
          throw new ConflictException("Pair maintenance key was reused with different request context");
        if (previousDetails.enabled !== true && previousDetails.enabled !== false)
          throw new ConflictException("Original pair maintenance receipt lacks intent state; reconcile before retrying");
        if (previousDetails.enabled === enabled) matches.push(candidate);
      }
      if (matches.length > 1)
        throw new ConflictException("Multiple original pair maintenance receipts require reconciliation");
      if (matches[0])
        return { ok: true, auditId: matches[0].id, status: pair.status, replayed: true };

      const previous = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
      if (previous)
        throw new ConflictException("Pair maintenance intent identity has an inconsistent audit receipt");

      const row = await tx.marketPair.update({
        where: { id: pair.id },
        data: { status: enabled ? "ACTIVE" : "MAINTENANCE",
          maintenanceNote: enabled ? null : reason },
      });
      const audit = await tx.adminAuditLog.create({ data: {
        id: auditId, adminId, action, target: pair.id, details,
      } });
      return { ok: true, auditId: audit.id, status: row.status, replayed: false };
    });
  }

  async getMarginConfiguration() {
    const read = async (key: string) =>
      this.d1?.isEnabled()
        ? this.d1.getSystemConfigValue(key)
        : ((await this.prisma.systemConfig.findUnique({ where: { key } }))
            ?.value ?? null);
    const [ratioRaw, leveragesRaw] = await Promise.all([
      read("gate2.margin.maintenanceRatio"),
      read("gate2.margin.leverages"),
    ]);
    const leverages = String(leveragesRaw ?? "2,3,5")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value >= 2 && value <= 20);
    return {
      maintenanceRatio: Number(ratioRaw ?? "0.5"),
      leverages: [...new Set(leverages)].sort((a, b) => a - b),
    };
  }

  async updateMarginConfiguration(
    input: {
      maintenanceRatio: number;
      leverages?: string;
      reason: string;
      idempotencyKey: string;
    },
    adminId: string,
  ) {
    const leverageValues = String(input.leverages ?? "2,3,5")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value >= 2 && value <= 20);
    const leverages = [...new Set(leverageValues)].sort((a, b) => a - b);
    if (!leverages.length)
      throw new BadRequestException(
        "At least one leverage between 2x and 20x is required",
      );
    if (input.maintenanceRatio <= 0 || input.maintenanceRatio >= 1)
      throw new BadRequestException(
        "Maintenance ratio must be between 0 and 1",
      );
    let auditId: string;
    if (this.d1?.isEnabled()) {
      const receipts = await this.d1.updateSystemConfigsAtomically([
        {
          key: "gate2.margin.maintenanceRatio",
          value: String(input.maintenanceRatio),
          description: "Isolated margin maintenance ratio",
          adminId, reason: input.reason,
          idempotencyKey: input.idempotencyKey + ":maintenanceRatio",
        },
        {
          key: "gate2.margin.leverages",
          value: leverages.join(","),
          description: "Allowed isolated margin leverage multipliers",
          adminId, reason: input.reason,
          idempotencyKey: input.idempotencyKey + ":leverages",
        },
      ]);
      auditId = String(receipts[0].auditId);
    } else {
      const commandAuditId = this.marketMutationAuditId(
        "MARGIN_CONFIGURATION_UPDATED", adminId, input.idempotencyKey,
      );
      const details = JSON.stringify({
        reason: input.reason, idempotencyKey: input.idempotencyKey,
        maintenanceRatio: input.maintenanceRatio, leverages,
      });
      await this.prisma.$transaction(async (tx) => {
        const previous = await tx.adminAuditLog.findUnique({
          where: { id: commandAuditId },
        });
        if (previous) {
          if (previous.adminId !== adminId ||
            previous.action !== "MARGIN_CONFIGURATION_UPDATED" ||
            previous.target !== "isolated-margin" || previous.details !== details)
            throw new ConflictException("Margin configuration key belongs to another original request");
          return;
        }
        await tx.systemConfig.upsert({
          where: { key: "gate2.margin.maintenanceRatio" },
          update: { value: String(input.maintenanceRatio),
            description: "Isolated margin maintenance ratio" },
          create: { key: "gate2.margin.maintenanceRatio",
            value: String(input.maintenanceRatio),
            description: "Isolated margin maintenance ratio" },
        });
        await tx.systemConfig.upsert({
          where: { key: "gate2.margin.leverages" },
          update: { value: leverages.join(","),
            description: "Allowed isolated margin leverage multipliers" },
          create: { key: "gate2.margin.leverages",
            value: leverages.join(","),
            description: "Allowed isolated margin leverage multipliers" },
        });
        await tx.adminAuditLog.create({ data: {
          id: commandAuditId, adminId,
          action: "MARGIN_CONFIGURATION_UPDATED",
          target: "isolated-margin", details,
        } });
      });
      auditId = commandAuditId;
    }
    return { ok: true, auditId, maintenanceRatio: input.maintenanceRatio, leverages };
  }

  async updateCurrency(id: number, data: any, adminId: string) {
    const { reason, idempotencyKey, ...patch } = data;
    if (this.d1?.isEnabled())
      return this.d1.updateAdminCurrency({
        id,
        patch: patch as Record<string, unknown>,
        adminId,
        reason,
        idempotencyKey,
      });
    return executeAdminMutation(
      this.prisma,
      {
        action: "CURRENCY_CONFIGURATION_UPDATED",
        adminId,
        reason,
        idempotencyKey,
        target: String(id),
        payload: patch,
      },
      (tx) => tx.currency.update({ where: { id }, data: patch }),
      (updated) => String(updated.id),
      (tx, target) => tx.currency.findUnique({ where: { id: Number(target) } }),
    );
  }

  async addDepositAddress(
    currencyId: number,
    network: string,
    address: string,
    label: string | undefined,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (this.d1?.isEnabled())
      return this.d1.createAdminDepositAddress({
        currencyId,
        network,
        address,
        label,
        adminId,
        reason,
        idempotencyKey,
      });
    const payload = { currencyId, network, address, label };
    return executeAdminMutation(
      this.prisma,
      {
        action: "DEPOSIT_ADDRESS_CREATED",
        adminId,
        reason,
        idempotencyKey,
        payload,
      },
      (tx) => tx.depositAddress.create({ data: payload }),
      (created) => String(created.id),
      (tx, target) => tx.depositAddress.findUnique({ where: { id: target } }),
    );
  }

  async deleteDepositAddress(
    id: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (this.d1?.isEnabled())
      return this.d1.deactivateAdminDepositAddress({
        id,
        adminId,
        reason,
        idempotencyKey,
      });
    return executeAdminMutation(
      this.prisma,
      {
        action: "DEPOSIT_ADDRESS_DISABLED",
        actionAliases: ["DEPOSIT_ADDRESS_ENABLED", "DEPOSIT_ADDRESS_DISABLED"],
        identityScope: "DEPOSIT_ADDRESS_STATE",
        adminId,
        reason,
        idempotencyKey,
        target: id,
        payload: { isActive: false },
      },
      (tx) =>
        tx.depositAddress.update({
          where: { id },
          data: { isActive: false },
        }),
      (updated) => String(updated.id),
      (tx, target) => tx.depositAddress.findUnique({ where: { id: target } }),
    );
  }

  // --- Mining Management ---

  async getMiningPlans() {
    if (this.d1?.isEnabled()) return this.d1.listAdminMiningPlans();
    return this.prisma.miningPlan.findMany({
      orderBy: { lockupPeriod: "asc" },
    });
  }

  async createMiningPlan(data: any, context?: AdminPlanMutationContext) {
    const dailyYield = new Prisma.Decimal(String(data.dailyYield));
    const minDeposit = new Prisma.Decimal(String(data.minDeposit));
    const maxDeposit = new Prisma.Decimal(String(data.maxDeposit));
    assertValidMiningPlanValues(dailyYield, minDeposit, maxDeposit);
    if (this.d1?.isEnabled()) {
      const auditContext = requireMiningPlanMutationContext(context);
      return this.d1.createMiningPlan({
        id: randomUUID(),
        name: String(data.name).trim(),
        currency: String(data.currency ?? "USDT")
          .trim()
          .toUpperCase(),
        lockupPeriod: Number(data.lockupPeriod),
        dailyYield: dailyYield.toString(),
        minDeposit: minDeposit.toString(),
        maxDeposit: maxDeposit.toString(),
        isActive: data.isActive ?? true,
        adminId: auditContext.adminId,
        reason: auditContext.reason,
        idempotencyKey: auditContext.idempotencyKey,
      });
    }
    const values = {
      ...data,
      dailyYieldDecimal: dailyYield.toString(),
      minDepositDecimal: minDeposit.toString(),
      maxDepositDecimal: maxDeposit.toString(),
    };
    if (!context) return this.prisma.miningPlan.create({ data: values });
    return executeAdminMutation(
      this.prisma,
      {
        action: "MINING_PLAN_CREATED",
        adminId: context.adminId,
        reason: context.reason,
        idempotencyKey: context.idempotencyKey,
        payload: values,
      },
      (tx) => tx.miningPlan.create({ data: values }),
      (plan) => String(plan.id),
      (tx, target) => tx.miningPlan.findUnique({ where: { id: target } }),
    );
  }

  async updateMiningPlan(
    id: string,
    data: any,
    context?: AdminPlanMutationContext,
  ) {
    const decimalPatch = miningPlanDecimalPatch(data);
    if (this.d1?.isEnabled()) {
      const auditContext = requireMiningPlanMutationContext(context);
      const existing = await this.d1.getMiningPlan(id);
      if (!existing) throw new NotFoundException("Mining plan not found");
      return updateD1MiningPlan({
        d1: this.d1,
        id,
        data,
        existing,
        context: auditContext,
      });
    }
    if (!context) return this.prisma.miningPlan.update({ where: { id }, data: decimalPatch });
    return executeAdminMutation(
      this.prisma,
      {
        action: "MINING_PLAN_UPDATED",
        adminId: context.adminId,
        reason: context.reason,
        idempotencyKey: context.idempotencyKey,
        target: id,
        payload: decimalPatch,
      },
      (tx) => tx.miningPlan.update({ where: { id }, data: decimalPatch }),
      (plan) => String(plan.id),
      (tx, target) => tx.miningPlan.findUnique({ where: { id: target } }),
    );
  }

  // --- Loan Management ---

  async getLoanPlans() {
    if (this.d1?.isEnabled()) return this.d1.listLoanPlans();
    return this.prisma.loanPlan.findMany({ orderBy: { durationDays: "asc" } });
  }

  async getLoanAssets() {
    return this.marketDatabase().marketAsset.findMany({
      where: {
        status: "ACTIVE",
        capabilities: {
          some: { capabilityKey: { endsWith: ":loans" }, status: "ACTIVE" },
        },
      },
      select: { symbol: true, displayName: true },
      orderBy: { symbol: "asc" },
    });
  }

  private loanPlanAuditId(action: "CREATED" | "UPDATED", context: AdminPlanMutationContext): string {
    const hex = createHash("sha256")
      .update(JSON.stringify(["loan-plan", action, context.adminId, context.idempotencyKey]))
      .digest("hex");
    return [hex.slice(0, 8), hex.slice(8, 12), "4" + hex.slice(13, 16),
      "8" + hex.slice(17, 20), hex.slice(20, 32)].join("-");
  }

  private assertLoanPlanTerms(interestRate: unknown, minAmount: unknown, maxAmount: unknown): void {
    const decimal = (value: unknown, field: string) => {
      let amount: Prisma.Decimal;
      try { amount = new Prisma.Decimal(String(value)); }
      catch { throw new BadRequestException(`Loan plan ${field} is not a decimal`); }
      if (!amount.isFinite() || amount.isNegative())
        throw new BadRequestException(`Loan plan ${field} must be non-negative`);
      return amount;
    };
    decimal(interestRate, 'interestRate');
    const minimum = decimal(minAmount, 'minAmount');
    const maximum = decimal(maxAmount, 'maxAmount');
    if (!maximum.gt(minimum))
      throw new BadRequestException('Loan plan maximum must exceed minimum');
  }

  async createLoanPlan(data: any, context?: AdminPlanMutationContext) {
    const currency = String(data.currency ?? "")
      .trim()
      .toUpperCase();
    await this.assertLoanCurrency(currency);
    const planData = {
      ...data,
      currency,
      interestRate: String(data.interestRate),
      minAmount: String(data.minAmount),
      maxAmount: String(data.maxAmount),
    };
    this.assertLoanPlanTerms(planData.interestRate, planData.minAmount, planData.maxAmount);
    const auditId = context ? this.loanPlanAuditId("CREATED", context) : null;
    return this.prisma.$transaction(async (tx) => {
      if (context && auditId) {
        const prior = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
        if (prior) {
          const expected = JSON.stringify({
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
            payload: planData,
          });
          if (prior.adminId !== context.adminId || prior.action !== "LOAN_PLAN_CREATED" || prior.details !== expected)
            throw new BadRequestException(
              "Loan plan idempotency key was reused with different parameters",
            );
          const existing = await tx.loanPlan.findUnique({
            where: { id: prior.target! },
          });
          if (!existing)
            throw new NotFoundException("Loan plan replay no longer resolves");
          return { ...existing, ok: true, auditId: prior.id, replayed: true };
        }
      }
      const plan = await tx.loanPlan.create({ data: planData });
      if (!context) return plan;
      const audit = await tx.adminAuditLog.create({
        data: {
          id: auditId!,
          adminId: context.adminId,
          action: "LOAN_PLAN_CREATED",
          target: plan.id,
          details: JSON.stringify({
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
            payload: planData,
          }),
        },
      });
      return { ...plan, ok: true, auditId: audit.id };
    });
  }

  async updateLoanPlan(
    id: string,
    data: any,
    context?: AdminPlanMutationContext,
  ) {
    const planData = { ...data };
    if (planData.currency !== undefined) {
      planData.currency = String(planData.currency).trim().toUpperCase();
      const current = await this.prisma.loanPlan.findUnique({
        where: { id },
        select: { currency: true },
      });
      if (!current) throw new NotFoundException("Loan plan not found");
      if (planData.currency !== current.currency)
        await this.assertLoanCurrency(planData.currency);
    }
    for (const field of ["interestRate", "minAmount", "maxAmount"] as const)
      if (planData[field] !== undefined)
        planData[field] = String(planData[field]);
    const auditId = context ? this.loanPlanAuditId("UPDATED", context) : null;
    return this.prisma.$transaction(async (tx) => {
      if (context && auditId) {
        const prior = await tx.adminAuditLog.findUnique({ where: { id: auditId } });
        if (prior) {
          const expected = JSON.stringify({
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
            payload: planData,
          });
          if (prior.adminId !== context.adminId || prior.action !== "LOAN_PLAN_UPDATED" || prior.target !== id || prior.details !== expected)
            throw new BadRequestException(
              "Loan plan idempotency key was reused with different parameters",
            );
          const existing = await tx.loanPlan.findUnique({ where: { id } });
          if (!existing)
            throw new NotFoundException("Loan plan replay no longer resolves");
          return { ...existing, ok: true, auditId: prior.id, replayed: true };
        }
      }
      const current = await tx.loanPlan.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Loan plan not found');
      this.assertLoanPlanTerms(
        planData.interestRate ?? current.interestRate,
        planData.minAmount ?? current.minAmount,
        planData.maxAmount ?? current.maxAmount,
      );
      const plan = await tx.loanPlan.update({ where: { id }, data: planData });
      if (!context) return plan;
      const audit = await tx.adminAuditLog.create({
        data: {
          id: auditId!,
          adminId: context.adminId,
          action: "LOAN_PLAN_UPDATED",
          target: id,
          details: JSON.stringify({
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
            payload: planData,
          }),
        },
      });
      return { ...plan, ok: true, auditId: audit.id };
    });
  }

  private async assertLoanCurrency(currency: string): Promise<void> {
    if (!/^[A-Z0-9._-]{2,20}$/.test(currency))
      throw new BadRequestException("Select a valid loan asset");
    const asset = await this.marketDatabase().marketAsset.findFirst({
      where: {
        symbol: currency,
        status: "ACTIVE",
        capabilities: {
          some: { capabilityKey: { endsWith: ":loans" }, status: "ACTIVE" },
        },
      },
      select: { symbol: true },
    });
    if (!asset)
      throw new BadRequestException(
        "Loan asset must have an active Loans capability",
      );
  }

  // --- Risk Management ---

  async getBinaryPairs() {
    return this.prisma.binaryPair.findMany({
      orderBy: { symbol: "asc" },
    });
  }

  async updatePairRisk(symbol: string, houseWinRatio: number) {
    throw new ForbiddenException(
      `Sandbox-only outcome control rejected for ${symbol}:${houseWinRatio}`,
    );
  }

  async syncMarkets() {
    this.logger.log("Starting Market Sync from Dump...");
    const dumpPath = path.join(
      process.cwd(),
      "scripts",
      "dexixz_dump",
      "hb_list.json",
    );

    let raw: string;
    try {
      raw = await readFile(dumpPath, "utf-8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new NotFoundException("Market dump file not found");
      }
      throw error;
    }
    const data = JSON.parse(raw);
    const markets = data.message || [];
    const categoryMap: Record<number, string> = {
      0: "crypto",
      1: "stock",
      2: "forex",
      3: "metal",
    };

    let synced = 0;
    for (const m of markets) {
      const category = categoryMap[m.coin_type] || "other";
      const symbol = `${m.currency_name}/${m.legal_name}`;
      let logo = m.logo;
      if (logo && logo.startsWith("/"))
        logo = `https://www.coindefgie15eg.qpon${logo}`;

      await this.prisma.binaryPair.upsert({
        where: { symbol },
        update: {
          rate: 1.85,
          category,
          logo,
          isActive: m.is_show === 1,
          realId: m.id,
          matchId: m.match_id,
          currencyId: m.currency_id,
          coinType: m.coin_type,
        },
        create: {
          symbol,
          baseAsset: m.currency_name,
          quoteAsset: m.legal_name,
          rate: 1.85,
          category,
          logo,
          isActive: m.is_show === 1,
          realId: m.id,
          matchId: m.match_id,
          currencyId: m.currency_id,
          coinType: m.coin_type,
        },
      });
      synced++;
    }
    await this.seedDefaults();
    return { status: "ok", message: `Synced ${synced} markets.` };
  }

  async updateGlobalPayout(rate: number) {
    const updated = await this.prisma.gate2BinaryConfiguration.updateMany({
      where: { enabled: true },
      data: { payoutRate: rate },
    });
    return {
      message: `Global payout rate updated to ${rate}`,
      updatedConfigurations: updated.count,
    };
  }

  async getBinaryGlobalConfiguration() {
    if (!this.d1?.isEnabled())
      throw new ServiceUnavailableException(
        "Binary global configuration requires the canonical SQLite gateway",
      );
    return this.d1.getBinaryGlobalConfiguration();
  }

  async updateBinaryGlobalConfiguration(
    input: {
      minStake: string;
      maxStake: string;
      durations: Array<{
        durationSeconds: number;
        payoutRate: number;
        enabled: boolean;
      }>;
      reason: string;
      idempotencyKey: string;
    },
    adminId: string,
  ) {
    if (!this.d1?.isEnabled())
      throw new ServiceUnavailableException(
        "Binary global configuration requires the canonical SQLite gateway",
      );
    if (!input.reason?.trim() || !input.idempotencyKey?.trim())
      throw new BadRequestException(
        "Binary configuration changes require a reason and original request key",
      );
    let minStake: Prisma.Decimal;
    let maxStake: Prisma.Decimal;
    try {
      minStake = new Prisma.Decimal(input.minStake);
      maxStake = new Prisma.Decimal(input.maxStake);
    } catch {
      throw new BadRequestException("Binary stake limits are invalid");
    }
    if (
      !minStake.isFinite() ||
      !maxStake.isFinite() ||
      minStake.lte(0) ||
      maxStake.lt(minStake)
    )
      throw new BadRequestException("Binary stake limits are invalid");
    return this.d1.updateBinaryGlobalConfiguration({
      ...input,
      minStake: minStake.toString(),
      maxStake: maxStake.toString(),
      adminId,
    });
  }

  async getBinaryConfigurations(pair?: string) {
    if (this.d1?.isEnabled()) {
      const rows = await this.d1.listBinaryConfigurations();
      return pair
        ? rows.filter(
            (row) =>
              String(row.pair).toUpperCase() === pair.trim().toUpperCase(),
          )
        : rows;
    }
    const rows = await this.prisma.gate2BinaryConfiguration.findMany({
      where: pair ? { pair: pair.trim().toUpperCase() } : undefined,
      orderBy: [
        { pair: "asc" },
        { durationSeconds: "asc" },
        { version: "desc" },
      ],
    });
    return latestBinaryConfigurationRows(rows);
  }

  async updateBinaryConfiguration(
    input: {
      pair: string;
      durationSeconds: number;
      sourceDurationSeconds?: number;
      payoutRate?: number;
      minStake?: number;
      maxStake?: number;
      enabled?: boolean;
      reason: string;
      idempotencyKey: string;
    },
    adminId: string,
  ) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for Binary configuration changes",
      );
    const pair = input.pair.trim().toUpperCase();
    const sourceDurationSeconds =
      input.sourceDurationSeconds ?? input.durationSeconds;
    assertBinaryDurationUnchanged(input.durationSeconds, sourceDurationSeconds);
    const target = `${pair}:${input.durationSeconds}`;
    const action = "BINARY_CONFIGURATION_UPDATED";
    const normalizedRequest = {
      pair,
      durationSeconds: input.durationSeconds,
      sourceDurationSeconds,
      payoutRate: input.payoutRate ?? null,
      minStake: input.minStake ?? null,
      maxStake: input.maxStake ?? null,
      enabled: input.enabled ?? null,
      reason: input.reason.trim(),
    };
    const auditId = this.marketMutationAuditId(
      action,
      adminId,
      input.idempotencyKey,
    );
    if (this.d1?.isEnabled()) {
      const current = await this.d1.getBinaryConfiguration(
        pair,
        sourceDurationSeconds,
        undefined,
        true,
      );
      if (!current)
        throw new NotFoundException("Binary configuration not found");
      const storedGlobal = await this.d1.getSystemConfigValue(
        "gate2.binary.globalPolicy",
      );
      const globalPolicy = storedGlobal
        ? (JSON.parse(storedGlobal) as {
            minStake: string;
            maxStake: string;
            durations: Array<{
              durationSeconds: number;
              payoutRate: number;
              enabled: boolean;
            }>;
          })
        : null;
      const globalDuration = globalPolicy?.durations.find(
        (item) => item.durationSeconds === input.durationSeconds,
      );
      if (globalPolicy && !globalDuration)
        throw new BadRequestException(
          "Binary duration is not present in the global policy",
        );
      const payoutRate =
        globalDuration?.payoutRate ??
        input.payoutRate ??
        Number(current.payoutRate);
      const minStake = globalPolicy
        ? globalPolicy.minStake
        : (input.minStake ?? String(current.minStake));
      const maxStake = globalPolicy
        ? globalPolicy.maxStake
        : (input.maxStake ?? String(current.maxStake));
      let minStakeDecimal: Prisma.Decimal;
      let maxStakeDecimal: Prisma.Decimal;
      try {
        minStakeDecimal = new Prisma.Decimal(minStake);
        maxStakeDecimal = new Prisma.Decimal(maxStake);
      } catch {
        throw new BadRequestException(
          "Binary payout and stake limits are invalid",
        );
      }
      if (
        !Number.isFinite(payoutRate) ||
        payoutRate <= 0 ||
        !minStakeDecimal.isFinite() ||
        minStakeDecimal.lte(0) ||
        !maxStakeDecimal.isFinite() ||
        maxStakeDecimal.lt(minStakeDecimal)
      )
        throw new BadRequestException(
          "Binary payout and stake limits are invalid",
        );
      return this.d1.updateBinaryConfiguration({
        pair,
        sourceDurationSeconds,
        durationSeconds: input.durationSeconds,
        payoutRate,
        minStake,
        maxStake,
        enabled: resolveBinaryEnabled(
          input.enabled,
          current.pairEnabled ?? current.enabled,
        ),
        adminId,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
      });
    }
    const globalPolicy = await this.prisma.systemConfig.findUnique({
      where: { key: "gate2.binary.globalPolicy" },
      select: { id: true },
    });
    if (globalPolicy)
      throw new ServiceUnavailableException(
        "Binary pair availability changes require the canonical SQLite gateway",
      );
    return this.prisma.$transaction(
      async (tx) => {
        const replay = await tx.adminAuditLog.findUnique({
          where: { id: auditId },
        }) ?? await tx.adminAuditLog.findFirst({
          where: {
            action,
            details: { path: ["idempotencyKey"], equals: input.idempotencyKey },
          },
          orderBy: { createdAt: "asc" },
        });
        if (replay) {
          let details: Record<string, unknown>;
          try {
            const parsed = typeof replay.details === "string"
              ? JSON.parse(replay.details)
              : replay.details;
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
              throw new Error("Invalid audit detail shape");
            details = parsed as Record<string, unknown>;
          } catch {
            throw new ConflictException(
              "Original Binary configuration audit receipt is invalid",
            );
          }
          if (replay.adminId !== adminId || replay.action !== action ||
              replay.target !== target || details.idempotencyKey !== input.idempotencyKey ||
              details.reason !== input.reason.trim() ||
              JSON.stringify(details.request) !== JSON.stringify(normalizedRequest))
            throw new ConflictException(
              "Binary configuration key belongs to a different or unreconcilable original request",
            );
          return { ok: true, auditId: replay.id, replayed: true };
        }
        const current = await tx.gate2BinaryConfiguration.findFirst({
          where: {
            pair,
            durationSeconds: sourceDurationSeconds,
          },
          orderBy: { version: "desc" },
        });
        if (!current)
          throw new NotFoundException("Active Binary configuration not found");
        const payoutRate = input.payoutRate ?? Number(current.payoutRate);
        const minStake = input.minStake ?? Number(current.minStake);
        const maxStake = input.maxStake ?? Number(current.maxStake);
        if (
          !Number.isFinite(payoutRate) ||
          payoutRate <= 0 ||
          !Number.isFinite(minStake) ||
          minStake <= 0 ||
          !Number.isFinite(maxStake) ||
          maxStake < minStake
        ) {
          throw new BadRequestException(
            "Binary payout and stake limits are invalid",
          );
        }
        await tx.gate2BinaryConfiguration.updateMany({
          where: {
            pair,
            durationSeconds: sourceDurationSeconds,
            enabled: true,
          },
          data: { enabled: false },
        });
        const next = await tx.gate2BinaryConfiguration.create({
          data: {
            pair,
            durationSeconds: input.durationSeconds,
            payoutRate,
            lossRate: current.lossRate,
            minStake,
            maxStake,
            settlementDelaySeconds: current.settlementDelaySeconds,
            version: current.version + 1,
            enabled: input.enabled ?? current.enabled,
          },
        });
        const audit = await tx.adminAuditLog.create({
          data: {
            id: auditId,
            adminId,
            action,
            target,
            details: {
              reason: input.reason.trim(),
              version: next.version,
              idempotencyKey: input.idempotencyKey,
              request: normalizedRequest,
              after: {
                pair: next.pair,
                durationSeconds: next.durationSeconds,
                payoutRate: String(next.payoutRate),
                minStake: String(next.minStake),
                maxStake: String(next.maxStake),
                enabled: next.enabled,
                version: next.version,
              },
            },
          },
        });
        return { ...next, auditId: audit.id, replayed: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async seedDefaults() {
    const timeframes = [
      { name: "30s", seconds: 30, payoutRate: 1.8 },
      { name: "1m", seconds: 60, payoutRate: 1.85 },
      { name: "3m", seconds: 180, payoutRate: 1.9 },
      { name: "4m40s", seconds: 280, payoutRate: 1.95 },
      { name: "7m", seconds: 420, payoutRate: 2.0 },
    ];

    for (const tf of timeframes) {
      await this.prisma.binaryTimeframe.upsert({
        where: { seconds: tf.seconds },
        update: { name: tf.name, payoutRate: tf.payoutRate },
        create: tf,
      });
    }
  }
}
