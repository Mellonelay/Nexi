import { SandboxExecutionService } from "../../src/sandbox/sandbox-execution.service";

describe("SandboxExecutionService", () => {
  const future = new Date(Date.now() + 60_000).toISOString();

  function subject(command: Record<string, unknown>) {
    const calls = { audit: 0, update: 0 };
    const tx = {
      adminGovernanceCommand: {
        findUnique: jest.fn().mockResolvedValue(command),
        update: jest.fn().mockImplementation(async () => {
          calls.update += 1;
          return { ...command, status: "EXECUTED" };
        }),
      },
      adminAuditLog: {
        create: jest.fn().mockImplementation(async () => {
          calls.audit += 1;
          return { id: "audit-1" };
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (value: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    return {
      service: new SandboxExecutionService(prisma as never, {
        assertSupportedMode: jest.fn(),
      } as never),
      calls,
      tx,
    };
  }

  afterEach(() => {
    delete process.env.NEXI_SANDBOX_ACCOUNT_IDS;
    delete process.env.NODE_ENV;
  });

  it("executes an approved, scoped, unexpired sandbox command and audits it", async () => {
    process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
    const { service, calls } = subject({
      id: "command-1",
      commandType: "SANDBOX_CONTROL",
      status: "APPROVED",
      payload: {
        SANDBOX_ONLY: true,
        NON_PRODUCTION: true,
        ROLE_GATED: true,
        ACCOUNT_SCOPED: true,
        target: "sandbox-account",
        mode: "deterministic",
        expiresAt: future,
      },
    });
    const result = await service.executeApproved("command-1", "admin-1");
    expect(result.replayed).toBe(false);
    expect((result.receipt as { authority?: string }).authority).toBe(
      "backend/sandbox",
    );
    expect(calls.update).toBe(1);
    expect(calls.audit).toBe(1);
  });

  it("rejects an unapproved command", async () => {
    process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
    const { service } = subject({
      id: "command-1",
      commandType: "SANDBOX_CONTROL",
      status: "PENDING",
      payload: {},
    });
    await expect(
      service.executeApproved("command-1", "admin-1"),
    ).rejects.toThrow("must be approved");
  });

  it("replays an already executed command without a second audit", async () => {
    const { service, calls } = subject({
      id: "command-1",
      commandType: "SANDBOX_CONTROL",
      status: "EXECUTED",
      payload: {},
    });
    const result = await service.executeApproved("command-1", "admin-1");
    expect(result.replayed).toBe(true);
    expect(calls.update).toBe(0);
    expect(calls.audit).toBe(0);
  });

  it("rejects an expired scenario and a target outside the sandbox allowlist", async () => {
    process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
    const expired = subject({
      id: "command-1",
      commandType: "SANDBOX_CONTROL",
      status: "APPROVED",
      payload: {
        SANDBOX_ONLY: true,
        NON_PRODUCTION: true,
        ROLE_GATED: true,
        ACCOUNT_SCOPED: true,
        target: "sandbox-account",
        mode: "deterministic",
        expiresAt: new Date(Date.now() - 1).toISOString(),
      },
    });
    await expect(
      expired.service.executeApproved("command-1", "admin-1"),
    ).rejects.toThrow("expired");
    const outside = subject({
      id: "command-2",
      commandType: "SANDBOX_CONTROL",
      status: "APPROVED",
      payload: {
        SANDBOX_ONLY: true,
        NON_PRODUCTION: true,
        ROLE_GATED: true,
        ACCOUNT_SCOPED: true,
        target: "production-account",
        mode: "deterministic",
        expiresAt: future,
      },
    });
    await expect(
      outside.service.executeApproved("command-2", "admin-1"),
    ).rejects.toThrow("not approved");
  });
});
