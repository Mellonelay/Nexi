import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from "@nestjs/common";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  AdminMaintenanceScope,
  AdminMaintenanceStatus,
  Prisma,
  AdminRoleId,
} from "../prisma/d1-client";
import { LedgerAuthorityService } from "../ledger/ledger-authority.service";
import { SpotService } from "../spot/spot.service";
import { BinaryService } from "../binary/binary.service";
import { FinancialOperationsService } from "../financial/financial-operations.service";
import { SandboxExecutionService } from "../sandbox/sandbox-execution.service";
import { ADMIN_ROLE_DEFINITIONS } from "./admin-rbac";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { randomUUID } from "node:crypto";

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

type AdminAccountRecord = Prisma.UserGetPayload<{
  select: typeof ADMIN_ACCOUNT_SELECT;
}>;

type AdminPlanMutationContext = {
  adminId: string;
  reason: string;
  idempotencyKey: string;
};

type AdminWithdrawalDecision = (
  requestId: string,
  reason: string,
  adminId: string,
  idempotencyKey: string,
) => Promise<unknown>;

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
        keyof typeof ADMIN_ROLE_DEFINITIONS | undefined;
      return {
        id: row?.id ?? request.userId,
        email: row?.email ?? request.email,
        backendRole: row?.role ?? request.role,
        authSurface: request.surface ?? "ADMIN",
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
    environment?: string;
    correlationId?: string;
    result?: string;
    limit?: number;
  }) {
    if (this.d1?.isEnabled()) {
      const rows: any[] = await this.d1.listAdminAuditLogs(query.limit ?? 50);
      return rows
        .filter(
          (row) =>
            (!query.actor ||
              String(row.adminId)
                .toLowerCase()
                .includes(query.actor.toLowerCase())) &&
            (!query.action ||
              String(row.action)
                .toLowerCase()
                .includes(query.action.toLowerCase())) &&
            (!query.target ||
              String(row.target ?? "")
                .toLowerCase()
                .includes(query.target.toLowerCase())),
        )
        .map((row) => ({
          id: row.id,
          actor: row.adminId,
          action: row.action,
          target: row.target,
          createdAt: row.createdAt,
          details: row.details,
          correlationId: null,
        }));
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
        ...(query.target
          ? { target: { contains: query.target, mode: "insensitive" } }
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
      return this.d1.replyAdminTicket({ ticketId: id, adminId, ...input });
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
      return this.d1.setAdminTicketStatus({ ticketId: id, adminId, ...input });
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
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for incident acknowledgement",
      );
    if (this.d1?.isEnabled()) {
      return this.d1.acknowledgeIncident({ incidentId: id, adminId, ...input });
    }
    const existing = await this.prisma.adminIncident.findUnique({
      where: { acknowledgementIdempotencyKey: input.idempotencyKey },
    });
    if (existing) return { ...existing, replayed: true };
    const incident = await this.prisma.adminIncident.findUnique({
      where: { id },
    });
    if (!incident) throw new NotFoundException("Incident not found");
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.adminIncident.update({
        where: { id },
        data: {
          acknowledgedAt: new Date(),
          acknowledgedBy: adminId,
          acknowledgementReason: input.reason,
          acknowledgementIdempotencyKey: input.idempotencyKey,
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "INCIDENT_ACKNOWLEDGED",
          target: id,
          details: {
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
          },
        },
      });
      return row;
    });
    return { ...updated, replayed: false };
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
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for maintenance scheduling",
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
    if (existing) return { ...existing, replayed: true };
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
      await tx.adminAuditLog.create({
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
      return row;
    });
    return { ...created, replayed: false };
  }

  async cancelMaintenanceWindow(
    id: string,
    adminId: string,
    input: { reason: string; idempotencyKey: string },
  ) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for maintenance cancellation",
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
    if (replay) return { ...replay, replayed: true };
    const existing = await this.prisma.adminMaintenanceWindow.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Maintenance window not found");
    if (existing.status === "CANCELLED") return { ...existing, replayed: true };
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.adminMaintenanceWindow.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: adminId,
          cancelReason: input.reason.trim(),
          cancelIdempotencyKey: input.idempotencyKey,
        },
      });
      await tx.adminAuditLog.create({
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
      return row;
    });
    return { ...updated, replayed: false };
  }

  // --- Dashboard & Stats ---

  async getAdminStats() {
    if (this.d1?.isEnabled()) return this.d1.getAdminStats();
    const totalVolume = await this.prisma.binaryOptionPosition.aggregate({
      _sum: { amount: true },
    });
    const activeUsers = await this.prisma.user.count();
    const avgPayout = await this.prisma.binaryTimeframe.aggregate({
      _avg: { payoutRate: true },
    });

    return {
      totalVolume: totalVolume._sum.amount || 0,
      activeUsers,
      globalPayoutRate: avgPayout._avg.payoutRate || 1.85,
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
  ) {
    if (!reason?.trim())
      throw new BadRequestException(
        "A reason is required for Admin configuration changes",
      );
    if (this.d1?.isEnabled())
      return this.d1.updateSystemConfig({
        key,
        value,
        description,
        reason,
        adminId: adminId ?? "unknown-admin",
      });
    const result = await this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
    await this.prisma.adminAuditLog.create({
      data: {
        adminId: adminId ?? "unknown-admin",
        action: "SYSTEM_CONFIG_UPDATED",
        target: key,
        details: { value, description, reason },
      },
    });
    return result;
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
    const existing = await this.prisma.adminGovernanceCommand.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing;
    const command = await this.prisma.adminGovernanceCommand.create({
      data: {
        commandType: input.commandType,
        target: input.target,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
        payload: input.payload as Prisma.InputJsonValue | undefined,
        requestedBy: input.requestedBy,
      },
    });
    await this.prisma.adminAuditLog.create({
      data: {
        adminId: input.requestedBy,
        action: "GOVERNANCE_COMMAND_REQUESTED",
        target: input.target,
        details: {
          commandId: command.id,
          commandType: input.commandType,
          reason: input.reason,
        },
      },
    });
    return command;
  }

  async decideGovernanceCommand(
    commandId: string,
    approverId: string,
    decision: "APPROVED" | "REJECTED",
    reason: string,
  ) {
    if (!reason?.trim())
      throw new BadRequestException("A decision reason is required");
    const command = await this.prisma.adminGovernanceCommand.findUnique({
      where: { id: commandId },
    });
    if (!command) throw new NotFoundException("Governance command not found");
    if (command.requestedBy === approverId)
      throw new ForbiddenException(
        "The requester cannot approve their own command",
      );
    if (this.d1?.isEnabled())
      return this.d1.decideGovernanceCommand(
        commandId,
        approverId,
        decision,
        reason,
      );
    if (command.status !== "PENDING") return command;
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.adminGovernanceApproval.upsert({
        where: { commandId_approverId: { commandId, approverId } },
        update: { decision, reason },
        create: { commandId, approverId, decision, reason },
      });
      return tx.adminGovernanceCommand.update({
        where: { id: commandId },
        data:
          decision === "APPROVED"
            ? {
                status: "APPROVED",
                approvedBy: approverId,
                approvedAt: new Date(),
              }
            : { status: "REJECTED" },
      });
    });
    await this.prisma.adminAuditLog.create({
      data: {
        adminId: approverId,
        action: `GOVERNANCE_COMMAND_${decision}`,
        target: commandId,
        details: { reason },
      },
    });
    return updated;
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
  }) {
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
      });
    const flag = await this.prisma.adminFeatureFlag.upsert({
      where: { key: input.key },
      update: {
        enabled: input.enabled,
        environment: input.environment ?? "sandbox",
        reason: input.reason,
        updatedBy: input.updatedBy,
      },
      create: {
        key: input.key,
        enabled: input.enabled,
        environment: input.environment ?? "sandbox",
        reason: input.reason,
        updatedBy: input.updatedBy,
      },
    });
    await this.prisma.adminAuditLog.create({
      data: {
        adminId: input.updatedBy,
        action: "FEATURE_FLAG_UPDATED",
        target: input.key,
        details: {
          enabled: input.enabled,
          environment: input.environment ?? "sandbox",
          reason: input.reason,
        },
      },
    });
    return flag;
  }

  async listFeatureFlags() {
    return this.d1?.isEnabled()
      ? this.d1.listAdminFeatureFlags()
      : this.prisma.adminFeatureFlag.findMany({ orderBy: { key: "asc" } });
  }

  async applyFinancialCorrection(input: {
    userId: string;
    asset: string;
    amount: string;
    direction: "CREDIT" | "DEBIT";
    idempotencyKey: string;
    governanceCommandId: string;
    reason: string;
    adminId: string;
  }) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required for financial corrections",
      );
    if (this.d1?.isEnabled()) {
      return this.d1.applyAdminFinancialCorrection(input);
    }
    const command = await this.prisma.adminGovernanceCommand.findUnique({
      where: { id: input.governanceCommandId },
    });
    if (!command || command.commandType !== "FINANCIAL_CORRECTION")
      throw new ForbiddenException(
        "An independently approved financial correction command is required",
      );
    if (command.requestedBy === input.adminId)
      throw new ForbiddenException(
        "The requester cannot execute their own financial correction",
      );
    const asset = input.asset.trim().toUpperCase();
    const referenceId = `admin-correction:${input.idempotencyKey}`;
    if (command.status === "EXECUTED") {
      const posting = await this.prisma.ledgerPosting.findFirst({
        where: { idempotencyKey: referenceId },
      });
      return { command, posting, replayed: true };
    }
    if (command.status !== "APPROVED")
      throw new ForbiddenException(
        "An independently approved financial correction command is required",
      );
    return this.prisma.$transaction(async (tx) => {
      const account = await this.ledgerAuthority.getAccountForUser(
        input.userId,
        asset,
        tx,
      );
      const posting =
        input.direction === "CREDIT"
          ? await this.ledgerAuthority.credit(
              {
                accountId: account.id,
                asset,
                amount: input.amount,
                referenceType: "ADMIN_FINANCIAL_CORRECTION",
                referenceId,
                idempotencyKey: referenceId,
                correlationId: referenceId,
                economicGroup: referenceId,
                metadata: { adminId: input.adminId, reason: input.reason },
              },
              tx,
            )
          : await this.ledgerAuthority.debit(
              {
                accountId: account.id,
                asset,
                amount: input.amount,
                referenceType: "ADMIN_FINANCIAL_CORRECTION",
                referenceId,
                idempotencyKey: referenceId,
                correlationId: referenceId,
                economicGroup: referenceId,
                metadata: { adminId: input.adminId, reason: input.reason },
              },
              tx,
            );
      const executed = await tx.adminGovernanceCommand.update({
        where: { id: command.id },
        data: { status: "EXECUTED", executedAt: new Date() },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: input.adminId,
          action: "FINANCIAL_CORRECTION_EXECUTED",
          target: input.userId,
          details: {
            commandId: command.id,
            asset,
            amount: input.amount,
            direction: input.direction,
            reason: input.reason,
            postingId: posting.postingId,
          },
        },
      });
      return { command: executed, posting, replayed: false };
    });
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
      throw new BadRequestException("Sandbox mode must be normal, forced_win, or forced_loss");
    if (input.scope !== "binary")
      throw new BadRequestException(`Unsupported sandbox scope: ${input.scope}. Only 'binary' scope is enforced`);
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
    if (!input.reason?.trim())
      throw new BadRequestException("A reason is required to decide KYC");
    if (this.d1?.isEnabled()) {
      return this.d1.decideKyc({
        ...input,
        decision: input.decision.toUpperCase() as "APPROVED" | "REJECTED",
      });
    }
    const existing = await this.prisma.adminGovernanceCommand.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing)
      return {
        ok: true,
        auditId: existing.id,
        replayed: true,
        status: existing.status,
      };
    return this.prisma.$transaction(async (tx) => {
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
          adminId: input.adminId,
          action: "KYC_DECISION",
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

  async getUsers() {
    if (this.d1?.isEnabled()) return this.d1.listUsers();
    return this.prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: "desc" },
    });
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
    if (!reason?.trim())
      throw new BadRequestException("A reason is required to revoke a session");
    if (this.d1?.isEnabled())
      return this.d1.revokeAdminSession({
        sessionId: id,
        adminId,
        reason,
        idempotencyKey,
      });
    return this.prisma.$transaction(async (tx) => {
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
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "ADMIN_SESSION_REVOKED",
          target: id,
          details: { reason, idempotencyKey, userId: session.userId },
        },
      });
      return { ok: true, auditId: idempotencyKey };
    });
  }

  async revokeUserSessions(
    userId: string,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim())
      throw new BadRequestException("A reason is required to revoke sessions");
    if (this.d1?.isEnabled())
      return this.d1.revokeAdminUserSessions({
        userId,
        adminId,
        reason,
        idempotencyKey,
      });
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: reason },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "ADMIN_USER_SESSIONS_REVOKED",
          target: userId,
          details: { reason, idempotencyKey, count: result.count },
        },
      });
      return { ok: true, auditId: idempotencyKey, count: result.count };
    });
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

  async setMarketAssetVisibility(input: {
    id: string;
    visible: boolean;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required to change asset visibility",
      );
    const db = this.marketDatabase();
    const asset = await db.marketAsset.findUnique({
      where: { id: input.id },
      select: { id: true, symbol: true },
    });
    if (!asset) throw new NotFoundException("Market asset not found");
    const updated = await db.marketAsset.update({
      where: { id: asset.id },
      data: {
        status: input.visible ? "ACTIVE" : "MAINTENANCE",
        maintenanceNote: input.visible ? null : input.reason,
      },
    });
    const audit = await db.adminAuditLog.create({
      data: {
        adminId: input.adminId,
        action: "MARKET_ASSET_VISIBILITY_UPDATED",
        target: asset.id,
        details: {
          symbol: asset.symbol,
          visible: input.visible,
          reason: input.reason,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    return { ok: true, auditId: audit.id, status: updated.status };
  }

  async getMarketNetworks() {
    return this.marketDatabase().marketNetwork.findMany({
      include: { asset: true, capabilities: true },
      orderBy: [{ assetId: "asc" }, { code: "asc" }],
    });
  }

  async setMarketNetworkVisibility(input: {
    id: string;
    enabled: boolean;
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required to change network visibility",
      );
    const db = this.marketDatabase();
    const network = await db.marketNetwork.findUnique({
      where: { id: input.id },
      select: { id: true, code: true },
    });
    if (!network) throw new NotFoundException("Market network not found");
    const updated = await db.marketNetwork.update({
      where: { id: network.id },
      data: {
        status: input.enabled ? "ACTIVE" : "MAINTENANCE",
        maintenanceNote: input.enabled ? null : input.reason,
      },
    });
    const audit = await db.adminAuditLog.create({
      data: {
        adminId: input.adminId,
        action: "MARKET_NETWORK_VISIBILITY_UPDATED",
        target: network.id,
        details: {
          code: network.code,
          enabled: input.enabled,
          reason: input.reason,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    return { ok: true, auditId: audit.id, status: updated.status };
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
    id: string;
    status: "LIVE" | "STALE" | "UNAVAILABLE" | "DISABLED";
    adminId: string;
    reason: string;
    idempotencyKey: string;
  }) {
    if (!input.reason?.trim())
      throw new BadRequestException(
        "A reason is required to change provider status",
      );
    if (input.status === "LIVE" || input.status === "STALE")
      throw new BadRequestException(
        "LIVE and STALE are runtime-derived states, not admin configuration",
      );
    const db = this.marketDatabase();
    const replay = await db.adminAuditLog.findFirst({
      where: {
        action: "MARKET_PROVIDER_STATUS_UPDATED",
        details: { path: ["idempotencyKey"], equals: input.idempotencyKey },
      },
      orderBy: { createdAt: "desc" },
    });
    if (replay) return { ok: true, auditId: replay.id, replayed: true };
    const symbol = await db.marketProviderSymbol.findFirst({
      where: { OR: [{ id: input.id }, { providerId: input.id }] },
      select: { providerId: true, provider: { select: { key: true } } },
    });
    const providerId = symbol?.providerId ?? input.id;
    const provider = await db.marketProviderConfig.findUnique({
      where: { id: providerId },
      select: { id: true, key: true },
    });
    if (!provider) throw new NotFoundException("Market provider not found");
    // Runtime states (LIVE/STALE/UNAVAILABLE) are observed by the market
    // pollers. The admin action only changes the lifecycle gate: DISABLED
    // turns polling off; every other accepted action re-enables the provider.
    const status = input.status === "DISABLED" ? "DISABLED" : "ACTIVE";
    const updated = await db.marketProviderConfig.update({
      where: { id: provider.id },
      data: { status },
    });
    const audit = await db.adminAuditLog.create({
      data: {
        adminId: input.adminId,
        action: "MARKET_PROVIDER_STATUS_UPDATED",
        target: provider.key,
        details: {
          status: input.status,
          providerStatus: status,
          reason: input.reason,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    return { ok: true, auditId: audit.id, status: updated.status };
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
    if (this.d1?.isEnabled()) return this.d1.listBinaryPositions();
    return this.prisma.gate2BinaryPosition.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async getAdminSettlements() {
    if (this.d1?.isEnabled())
      return (await this.d1.listBinaryPositions()).filter(
        (row) =>
          !["ACTIVE", "SETTLING", "SETTLEMENT_DELAYED"].includes(
            String(row.state),
          ),
      );
    return this.prisma.gate2BinaryPosition.findMany({
      where: { state: { not: "ACTIVE" } },
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
    const result = await this.binaryService.settlePosition(id);
    const audit = await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: "ADMIN_BINARY_POSITION_SETTLED",
        target: id,
        details: {
          reason,
          idempotencyKey,
          state: result.position?.state ?? null,
          delayed: result.delayed ?? false,
        },
      },
    });
    return { ok: true, auditId: audit.id, ...result };
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
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.marketPair.update({
        where: { id: pair.id },
        data: {
          status: enabled ? "ACTIVE" : "MAINTENANCE",
          maintenanceNote: enabled ? null : reason,
        },
      });
      await tx.gate2BinaryConfiguration.updateMany({
        where: { pair: pair.symbol, enabled: true },
        data: { enabled },
      });
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "ADMIN_BINARY_PAIR_MAINTENANCE",
          target: pair.id,
          details: { symbol: pair.symbol, enabled, reason, idempotencyKey },
        },
      });
      return { updated, audit };
    });
    return {
      ok: true,
      auditId: result.audit.id,
      status: result.updated.status,
    };
  }

  async getAdminWallets() {
    if (this.d1?.isEnabled()) return this.d1.listAdminWallets();
    return this.prisma.wallet.findMany({
      include: { user: true },
      orderBy: { updatedAt: "desc" },
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
    if (this.d1?.isEnabled()) return this.d1.listAdminDeposits();
    const observed = await this.prisma.gate2Deposit.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const claims = await this.financialOperations.getAdminDepositClaims();
    return [
      ...observed,
      ...claims.map((claim) => ({
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
    ]
      .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
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
    const result = await this.spotService.cancelOrder(order.userId, id);
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: "ADMIN_SPOT_ORDER_CANCELLED",
        target: id,
        details: { reason, idempotencyKey },
      },
    });
    return { ok: true, auditId: idempotencyKey, state: result.status };
  }

  async setSpotPairMaintenance(
    symbol: string,
    enabled: boolean,
    adminId: string,
    reason: string,
    idempotencyKey: string,
  ) {
    if (!reason?.trim())
      throw new BadRequestException(
        "A reason is required to change pair maintenance",
      );
    const pair = await this.prisma.marketPair.findFirst({
      where: { OR: [{ id: symbol }, { symbol }] },
    });
    if (!pair) throw new NotFoundException("Spot pair not found");
    const row = await this.prisma.marketPair.update({
      where: { id: pair.id },
      data: {
        status: enabled ? "ACTIVE" : "MAINTENANCE",
        maintenanceNote: enabled ? null : reason,
      },
    });
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: "ADMIN_SPOT_PAIR_MAINTENANCE",
        target: pair.id,
        details: { reason, idempotencyKey, enabled, symbol: pair.symbol },
      },
    });
    return { ok: true, auditId: idempotencyKey, status: row.status };
  }

  async getMarginConfiguration() {
    const read = async (key: string) => this.d1?.isEnabled()
      ? this.d1.getSystemConfigValue(key)
      : (await this.prisma.systemConfig.findUnique({ where: { key } }))?.value ?? null;
    const [ratioRaw, leveragesRaw] = await Promise.all([read("gate2.margin.maintenanceRatio"), read("gate2.margin.leverages")]);
    const leverages = String(leveragesRaw ?? "2,3,5").split(",").map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value >= 2 && value <= 20);
    return { maintenanceRatio: Number(ratioRaw ?? "0.5"), leverages: [...new Set(leverages)].sort((a, b) => a - b) };
  }

  async updateMarginConfiguration(input: { maintenanceRatio: number; leverages?: string; reason: string; idempotencyKey: string }, adminId: string) {
    const leverageValues = String(input.leverages ?? "2,3,5").split(",").map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value >= 2 && value <= 20);
    const leverages = [...new Set(leverageValues)].sort((a, b) => a - b);
    if (!leverages.length) throw new BadRequestException("At least one leverage between 2x and 20x is required");
    if (input.maintenanceRatio <= 0 || input.maintenanceRatio >= 1) throw new BadRequestException("Maintenance ratio must be between 0 and 1");
    if (this.d1?.isEnabled()) {
      await this.d1.updateSystemConfig({ key: "gate2.margin.maintenanceRatio", value: String(input.maintenanceRatio), description: "Isolated margin maintenance ratio", adminId, reason: input.reason });
      await this.d1.updateSystemConfig({ key: "gate2.margin.leverages", value: leverages.join(","), description: "Allowed isolated margin leverage multipliers", adminId, reason: input.reason });
    } else {
      await this.prisma.$transaction([
        this.prisma.systemConfig.upsert({ where: { key: "gate2.margin.maintenanceRatio" }, update: { value: String(input.maintenanceRatio), description: "Isolated margin maintenance ratio" }, create: { key: "gate2.margin.maintenanceRatio", value: String(input.maintenanceRatio), description: "Isolated margin maintenance ratio" } }),
        this.prisma.systemConfig.upsert({ where: { key: "gate2.margin.leverages" }, update: { value: leverages.join(","), description: "Allowed isolated margin leverage multipliers" }, create: { key: "gate2.margin.leverages", value: leverages.join(","), description: "Allowed isolated margin leverage multipliers" } }),
        this.prisma.adminAuditLog.create({ data: { adminId, action: "MARGIN_CONFIGURATION_UPDATED", target: "isolated-margin", details: { reason: input.reason, idempotencyKey: input.idempotencyKey, maintenanceRatio: input.maintenanceRatio, leverages } } }),
      ]);
    }
    return { maintenanceRatio: input.maintenanceRatio, leverages };
  }

  async updateCurrency(id: number, data: any, adminId: string) {
    const { reason = "Admin currency configuration update", idempotencyKey = `currency:${id}:${Date.now()}`, ...patch } = data;
    if (this.d1?.isEnabled()) return this.d1.updateAdminCurrency({ id, patch: patch as Record<string, unknown>, adminId, reason, idempotencyKey });
    const updated = await this.prisma.currency.update({ where: { id }, data: patch });
    await this.prisma.adminAuditLog.create({ data: { adminId, action: "CURRENCY_CONFIGURATION_UPDATED", target: String(id), details: { reason, idempotencyKey, fields: Object.keys(patch) } } });
    return updated;
  }

  async createCurrency(data: any, adminId: string) {
    if (this.d1?.isEnabled()) {
      throw new BadRequestException("Creating a new currency through Admin requires the D1-native create path; update an existing canonical currency instead");
    }
    return this.prisma.currency.create({ data });
  }

  async addDepositAddress(
    currencyId: number,
    network: string,
    address: string,
    label?: string,
  ) {
    return this.prisma.depositAddress.create({
      data: {
        currencyId,
        network,
        address,
        label,
      },
    });
  }

  async deleteDepositAddress(id: string) {
    return this.prisma.depositAddress.delete({ where: { id } });
  }

  // --- Mining Management ---

  async getMiningPlans() {
    if (this.d1?.isEnabled()) return this.d1.listMiningPlans();
    return this.prisma.miningPlan.findMany({
      orderBy: { lockupPeriod: "asc" },
    });
  }

  async createMiningPlan(
    data: any,
    context?: AdminPlanMutationContext,
  ) {
    const dailyYield = new Prisma.Decimal(String(data.dailyYield));
    const minDeposit = new Prisma.Decimal(String(data.minDeposit));
    const maxDeposit = new Prisma.Decimal(String(data.maxDeposit));
    if (
      dailyYield.isNegative() ||
      minDeposit.isNegative() ||
      maxDeposit.lt(minDeposit)
    ) {
      throw new BadRequestException("Mining plan values are invalid");
    }
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.miningPlan.create({
        data: {
          ...data,
          dailyYieldDecimal: dailyYield.toString(),
          minDepositDecimal: minDeposit.toString(),
          maxDepositDecimal: maxDeposit.toString(),
        },
      });
      if (!context) return plan;
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId: context.adminId,
          action: "MINING_PLAN_CREATED",
          target: plan.id,
          details: {
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
            name: plan.name,
          },
        },
      });
      return { ...plan, ok: true, auditId: audit.id };
    });
  }

  async updateMiningPlan(
    id: string,
    data: any,
    context?: AdminPlanMutationContext,
  ) {
    const decimalPatch: any = { ...data };
    if (
      data.dailyYield !== undefined &&
      typeof data.dailyYield === "object" &&
      "set" in data.dailyYield
    ) {
      decimalPatch.dailyYieldDecimal = new Prisma.Decimal(
        String(data.dailyYield.set),
      ).toString();
    }
    if (
      data.minDeposit !== undefined &&
      typeof data.minDeposit === "object" &&
      "set" in data.minDeposit
    ) {
      decimalPatch.minDepositDecimal = new Prisma.Decimal(
        String(data.minDeposit.set),
      ).toString();
    }
    if (
      data.maxDeposit !== undefined &&
      typeof data.maxDeposit === "object" &&
      "set" in data.maxDeposit
    ) {
      decimalPatch.maxDepositDecimal = new Prisma.Decimal(
        String(data.maxDeposit.set),
      ).toString();
    }
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.miningPlan.update({
        where: { id },
        data: decimalPatch,
      });
      if (!context) return plan;
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId: context.adminId,
          action: "MINING_PLAN_UPDATED",
          target: id,
          details: {
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
          },
        },
      });
      return { ...plan, ok: true, auditId: audit.id };
    });
  }

  // --- Loan Management ---

  async getLoanPlans() {
    if (this.d1?.isEnabled()) return this.d1.listLoanPlans();
    return this.prisma.loanPlan.findMany({ orderBy: { durationDays: "asc" } });
  }

  async createLoanPlan(
    data: any,
    context?: AdminPlanMutationContext,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.loanPlan.create({ data });
      if (!context) return plan;
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId: context.adminId,
          action: "LOAN_PLAN_CREATED",
          target: plan.id,
          details: {
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
            name: plan.name,
          },
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
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.loanPlan.update({ where: { id }, data });
      if (!context) return plan;
      const audit = await tx.adminAuditLog.create({
        data: {
          adminId: context.adminId,
          action: "LOAN_PLAN_UPDATED",
          target: id,
          details: {
            reason: context.reason,
            idempotencyKey: context.idempotencyKey,
          },
        },
      });
      return { ...plan, ok: true, auditId: audit.id };
    });
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

    if (!fs.existsSync(dumpPath)) {
      throw new NotFoundException("Market dump file not found");
    }

    const raw = fs.readFileSync(dumpPath, "utf-8");
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
    return this.prisma.gate2BinaryConfiguration.findMany({
      where: pair
        ? { pair: pair.trim().toUpperCase(), enabled: true }
        : { enabled: true },
      orderBy: [
        { pair: "asc" },
        { durationSeconds: "asc" },
        { version: "desc" },
      ],
    });
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
    const sourceDurationSeconds = input.sourceDurationSeconds ?? input.durationSeconds;
    const target = `${pair}:${input.durationSeconds}`;
    if (this.d1?.isEnabled()) {
      const current = await this.d1.getBinaryConfiguration(pair, sourceDurationSeconds);
      if (!current) throw new NotFoundException("Active Binary configuration not found");
      const payoutRate = input.payoutRate ?? Number(current.payoutRate);
      const minStake = input.minStake ?? Number(current.minStake);
      const maxStake = input.maxStake ?? Number(current.maxStake);
      if (!Number.isFinite(payoutRate) || payoutRate <= 0 || !Number.isFinite(minStake) || minStake <= 0 || !Number.isFinite(maxStake) || maxStake < minStake) throw new BadRequestException("Binary payout and stake limits are invalid");
      return this.d1.updateBinaryConfiguration({ pair, sourceDurationSeconds, durationSeconds: input.durationSeconds, payoutRate, minStake, maxStake, enabled: input.enabled !== false, adminId, reason: input.reason, idempotencyKey: input.idempotencyKey });
    }
    return this.prisma.$transaction(
      async (tx) => {
        const replay = await tx.adminAuditLog.findFirst({
          where: {
            action: "BINARY_CONFIGURATION_UPDATED",
            target,
            details: { path: ["idempotencyKey"], equals: input.idempotencyKey },
          },
          orderBy: { createdAt: "desc" },
        });
        if (replay) return { id: replay.id, replayed: true };
        const current = await tx.gate2BinaryConfiguration.findFirst({
          where: {
            pair,
            durationSeconds: sourceDurationSeconds,
            enabled: true,
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
        if (input.durationSeconds !== sourceDurationSeconds) {
          const conflict = await tx.gate2BinaryConfiguration.findFirst({ where: { pair, durationSeconds: input.durationSeconds, enabled: true } });
          if (conflict) throw new BadRequestException("Binary duration already exists for this pair");
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
            enabled: input.enabled !== false,
          },
        });
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: "BINARY_CONFIGURATION_UPDATED",
            target: `${pair}:${input.durationSeconds}`,
            details: {
              reason: input.reason,
              version: next.version,
              idempotencyKey: input.idempotencyKey,
            },
          },
        });
        return next;
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
