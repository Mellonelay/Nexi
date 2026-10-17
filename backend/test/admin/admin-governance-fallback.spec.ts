import { ExecutionContext } from "@nestjs/common";
import { AdminService } from "../../src/admin/admin.service";
import { AdminPermissionGuard } from "../../src/admin/admin-permission.guard";

function service(prisma: any, d1: any = { isEnabled: () => false }) {
  return new AdminService(
    prisma,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    d1,
  );
}

describe("Admin governance Prisma fallback", () => {
  it("rejects an altered payload under an existing idempotency key", async () => {
    const existing = {
      id: "command-1",
      commandType: "SANDBOX_CONTROL",
      target: "sandbox-account",
      reason: "approved reason",
      requestedBy: "requester-1",
      payload: JSON.stringify({ mode: "forced_win", scope: "binary" }),
    };
    const prisma = {
      $transaction: jest.fn(async (work: any) =>
        work({
          adminGovernanceCommand: {
            findUnique: jest.fn().mockResolvedValue(existing),
          },
        }),
      ),
      adminGovernanceCommand: { findUnique: jest.fn() },
    };

    await expect(
      service(prisma).createGovernanceCommand({
        commandType: existing.commandType,
        target: existing.target,
        reason: existing.reason,
        idempotencyKey: "same-key",
        payload: { mode: "forced_loss", scope: "binary" },
        requestedBy: existing.requestedBy,
      }),
    ).rejects.toThrow("changed command terms");
  });

  it("keeps the losing concurrent decision free of approval and audit rows", async () => {
    const command = {
      id: "command-1",
      requestedBy: "requester-1",
      status: "PENDING",
    };
    const current = { ...command, status: "APPROVED", approvedBy: "approver-1" };
    const tx = {
      adminGovernanceCommand: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn().mockResolvedValue(current),
      },
      adminGovernanceApproval: { create: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    };
    const prisma = {
      adminGovernanceCommand: { findUnique: jest.fn().mockResolvedValue(command) },
      $transaction: jest.fn(async (work: any) => work(tx)),
    };

    await expect(
      service(prisma).decideGovernanceCommand(
        command.id,
        "approver-2",
        "REJECTED",
        "competing decision",
      ),
    ).rejects.toThrow("already approved");
    expect(tx.adminGovernanceApproval.create).not.toHaveBeenCalled();
    expect(tx.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it("commits the winning decision, approval, and audit in one transaction", async () => {
    const command = { id: "command-1", requestedBy: "requester-1", status: "PENDING" };
    const updated = { ...command, status: "APPROVED", approvedBy: "approver-1" };
    const tx = {
      adminGovernanceCommand: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue(updated),
      },
      adminGovernanceApproval: { create: jest.fn() },
      adminAuditLog: { create: jest.fn() },
    };
    const prisma = {
      adminGovernanceCommand: { findUnique: jest.fn().mockResolvedValue(command) },
      $transaction: jest.fn(async (work: any) => work(tx)),
      adminAuditLog: { create: jest.fn() },
    };

    await expect(
      service(prisma).decideGovernanceCommand(
        command.id,
        "approver-1",
        "APPROVED",
        "approved",
      ),
    ).resolves.toEqual(updated);
    expect(tx.adminGovernanceApproval.create).toHaveBeenCalledTimes(1);
    expect(tx.adminAuditLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });
});

describe("Admin permission fallback", () => {
  it("resolves the assigned role from Prisma when D1 is disabled", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue("approvals.decide"),
    };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: "admin-1",
          adminRoleAssignment: { roleId: "finance_operator" },
        }),
      },
    };
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: "admin-1" } }),
      }),
    } as unknown as ExecutionContext;
    const guard = new AdminPermissionGuard(
      reflector as never,
      prisma as never,
      { isEnabled: () => false } as never,
    );

    await expect(guard.canActivate(context)).resolves.toBe(false);
    expect(prisma.user.findFirst).toHaveBeenCalled();
  });
});
