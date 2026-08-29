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
        mode: "deterministic",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        reason: "test",
        idempotencyKey: "sandbox-contract-1",
        requestedBy: "admin-1",
      }),
    ).rejects.toThrow("approved sandbox account/entity");
  });

  it("rejects expired scenarios before creating a governance command", async () => {
    process.env.NEXI_SANDBOX_ACCOUNT_IDS = "sandbox-account";
    const subject = service();
    await expect(
      subject.requestSandboxControl({
        scope: "binary",
        target: "sandbox-account",
        mode: "deterministic",
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
      mode: "deterministic",
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
