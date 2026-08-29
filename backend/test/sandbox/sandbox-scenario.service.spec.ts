import { SandboxScenarioService } from "../../src/sandbox/sandbox-scenario.service";

describe("SandboxScenarioService", () => {
  const service = new SandboxScenarioService({} as never);

  it("resolves an executed account-scoped forced-win directive", async () => {
    const tx = {
      adminGovernanceCommand: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "command-1",
            payload: {
              SANDBOX_ONLY: true,
              NON_PRODUCTION: true,
              ROLE_GATED: true,
              ACCOUNT_SCOPED: true,
              scope: "binary",
              target: "sandbox-user",
              mode: "forced_win",
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
          },
        ]),
      },
    };
    await expect(
      service.findBinaryDirective(tx, "sandbox-user", "position-1"),
    ).resolves.toMatchObject({
      commandId: "command-1",
      mode: "forced_win",
      result: "WIN",
    });
  });

  it("does not resolve a pair/entity target as an account directive", async () => {
    const tx = {
      adminGovernanceCommand: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    await expect(
      service.findBinaryDirective(tx, "sandbox-user", "position-1"),
    ).resolves.toBeNull();
  });

  it("rejects unsupported outcome modes instead of pretending to mutate runtime", () => {
    expect(() => service.assertSupportedMode("mock_movement")).toThrow(
      "no isolated runtime adapter",
    );
  });
});
