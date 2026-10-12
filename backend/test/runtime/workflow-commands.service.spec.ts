import { createHmac } from "crypto";
import { WorkflowCommandsService } from "../../src/workflows/workflow-commands.service";

describe("WorkflowCommandsService loan due reconciliation", () => {
  const run = async (finalStatus: string) => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      getLoanApplication: jest
        .fn()
        .mockResolvedValueOnce({
          id: "loan-1",
          status: "ACTIVE",
          dueDate: "2026-10-08T00:00:00.000Z",
        })
        .mockResolvedValueOnce({
          id: "loan-1",
          status: finalStatus,
          dueDate: "2026-10-08T00:00:00.000Z",
        }),
    };
    const loans = { markOverdue: jest.fn().mockResolvedValue({ count: 1 }) };
    const service = new WorkflowCommandsService(
      {} as any,
      {} as any,
      loans as any,
      d1 as any,
    );
    const result = await service.execute({
      workflow: "loan",
      instanceId: "workflow-1",
      action: "check-due",
      entityId: "loan-1",
      idempotencyKey: "workflow-1:check-due",
      payload: {},
    });
    return { result, d1, loans };
  };

  it.each(["OVERDUE", "PAID", "REJECTED"])(
    "reports %s as terminal after D1 reconciliation",
    async (status) => {
      const { result, d1, loans } = await run(status);
      expect(result).toMatchObject({ done: true, state: status });
      expect(d1.getLoanApplication).toHaveBeenCalledTimes(2);
      expect(loans.markOverdue).toHaveBeenCalledTimes(1);
    },
  );

  it("keeps an active loan nonterminal so the Worker workflow retries its check", async () => {
    const { result } = await run("ACTIVE");
    expect(result).toMatchObject({ done: false, state: "ACTIVE" });
  });
});

describe("WorkflowCommandsService command payload integrity", () => {
  it("accepts the signed payload and rejects a payload changed after signing", () => {
    const secret = "workflow-test-secret";
    const originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
    try {
      const service = new WorkflowCommandsService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );
      const input = {
        workflow: "withdrawal",
        instanceId: "workflow-1",
        action: "fail",
        entityId: "withdrawal-1",
        idempotencyKey: "withdrawal-1:fail",
        payload: { reason: "provider rejected" },
      };
      const timestamp = Date.now();
      const signature = createHmac("sha256", secret)
        .update(
          JSON.stringify([
            timestamp,
            input.workflow,
            input.instanceId,
            input.action,
            input.entityId,
            input.idempotencyKey,
            input.payload,
          ]),
        )
        .digest("hex");

      expect(() =>
        service.assertSignature(input, signature, String(timestamp)),
      ).not.toThrow();
      expect(() =>
        service.assertSignature(
          { ...input, payload: { reason: "mutated" } },
          signature,
          String(timestamp),
        ),
      ).toThrow();
      expect(() =>
        service.assertSignature(
          {
            ...input,
            entityId: "withdrawal-1:withdrawal-1",
            idempotencyKey: "fail",
          },
          signature,
          String(timestamp),
        ),
      ).toThrow();
    } finally {
      if (originalSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = originalSecret;
    }
  });
});
