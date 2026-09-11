import { ServiceUnavailableException } from "@nestjs/common";
import { AppController } from "../../src/app.controller";
import { ReadinessService } from "../../src/observability/readiness.service";

describe("AppController runtime probes", () => {
  const originalD1RuntimeEnabled = process.env.D1_RUNTIME_ENABLED;

  const createController = (d1: boolean, redis: boolean) =>
    new AppController(
      { getHello: jest.fn() } as any,
      new ReadinessService(
        { isReady: jest.fn().mockResolvedValue(d1) } as any,
        { isReady: jest.fn().mockResolvedValue(redis) } as any,
      ),
    );

  afterEach(() => {
    if (originalD1RuntimeEnabled === undefined) {
      delete process.env.D1_RUNTIME_ENABLED;
      return;
    }
    process.env.D1_RUNTIME_ENABLED = originalD1RuntimeEnabled;
  });

  it("reports process liveness without requiring dependencies", () => {
    expect(createController(false, false, false).getLiveness()).toEqual({
      status: "UP",
    });
  });

  it("reports readiness from D1 only when it and Redis are ready", async () => {
    process.env.D1_RUNTIME_ENABLED = "true";

    await expect(
      createController(true, true).getReadiness(),
    ).resolves.toEqual({
      status: "READY",
      dependencies: { database: true, redis: true, authority: "D1" },
    });
  });

  it("rejects readiness when an active dependency is unavailable", async () => {
    process.env.D1_RUNTIME_ENABLED = "true";

    await expect(
      createController(false, true).getReadiness(),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
