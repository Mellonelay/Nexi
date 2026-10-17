import { AdminService } from "../../src/admin/admin.service";

describe("AdminService sandbox source contract", () => {
  const originalTargets = process.env.NEXI_SANDBOX_ACCOUNT_IDS;

  afterEach(() => {
    if (originalTargets === undefined)
      delete process.env.NEXI_SANDBOX_ACCOUNT_IDS;
    else process.env.NEXI_SANDBOX_ACCOUNT_IDS = originalTargets;
    jest.restoreAllMocks();
  });

  function service() {
    return new AdminService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  }

  it("fails closed for an account/entity that is not approved for sandbox use", async () => {
    process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
    const subject = service();
    await expect(
      subject.requestSandboxControl({
        scope: "binary",
        target: "production-account",
        mode: "forced_win",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        reason: "test",
        idempotencyKey: "sandbox-contract-1",
        requestedBy: "admin-1",
      }),
    ).rejects.toThrow("approved sandbox account/entity");
  });

  it("persists LoanPlan monetary config as strings and replays its audited idempotency key", async () => {
    const plan = { id: "plan-1", name: "Test", durationDays: 30, interestRate: "0.05", minAmount: "10", maxAmount: "100", isActive: true };
    const audit = { id: "audit-1", adminId: "admin-1", action: "LOAN_PLAN_CREATED", target: "plan-1", details: JSON.stringify({ reason: "test", idempotencyKey: "loan-plan-key-1", payload: { name: "Test", durationDays: 30, interestRate: "0.05", minAmount: "10", maxAmount: "100", isActive: true } }) };
    const tx = {
      loanPlan: { create: jest.fn().mockResolvedValue(plan), findUnique: jest.fn().mockResolvedValue(plan) },
      adminAuditLog: { findFirst: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(audit), create: jest.fn().mockResolvedValue(audit) },
    };
    const prisma = { $transaction: jest.fn(async (work: any) => work(tx)) };
    const subject = new AdminService(prisma as never, {} as never, {} as never, {} as never, {} as never, {} as never, {} as never);
    const input = { name: "Test", durationDays: 30, interestRate: 0.05, minAmount: 10, maxAmount: 100, isActive: true };
    const context = { adminId: "admin-1", reason: "test", idempotencyKey: "loan-plan-key-1" };
    await subject.createLoanPlan(input, context);
    await subject.createLoanPlan(input, context);
    expect(tx.loanPlan.create).toHaveBeenCalledWith({ data: expect.objectContaining({ interestRate: "0.05", minAmount: "10", maxAmount: "100" }) });
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ details: expect.any(String) }) });
    expect(tx.loanPlan.create).toHaveBeenCalledTimes(1);
  });

  it.each(["spot", "balance"] as const)(
    "fails closed for unsupported sandbox scope '%s'",
    async (scope) => {
      process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
      const subject = service();
      await expect(
        subject.requestSandboxControl({
          scope,
          target: "sandbox-account",
          mode: "forced_win",
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
          reason: "test",
          idempotencyKey: `sandbox-contract-${scope}`,
          requestedBy: "admin-1",
        }),
      ).rejects.toThrow("Unsupported sandbox scope");
    },
  );

  it("rejects expired scenarios before creating a governance command", async () => {
    process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
    const subject = service();
    await expect(
      subject.requestSandboxControl({
        scope: "binary",
        target: "sandbox-account",
        mode: "forced_win",
        expiresAt: new Date(Date.now() - 1).toISOString(),
        reason: "test",
        idempotencyKey: "sandbox-contract-2",
        requestedBy: "admin-1",
      }),
    ).rejects.toThrow("expiry must be in the future");
  });

  it("requires an approved target and preserves expiry in the governed command", async () => {
    process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
    const subject = service();
    const create = jest
      .spyOn(subject, "createGovernanceCommand")
      .mockResolvedValue({ id: "command-1" } as never);
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    await subject.requestSandboxControl({
      scope: "binary",
      target: "sandbox-account",
      mode: "forced_win",
      expiresAt,
      reason: "controlled test",
      idempotencyKey: "sandbox-contract-3",
      requestedBy: "admin-1",
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        commandType: "SANDBOX_CONTROL",
        target: "sandbox-account",
        payload: expect.objectContaining({ SANDBOX_ONLY: true, expiresAt }),
      }),
    );
  });
});
