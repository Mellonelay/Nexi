import { ServiceUnavailableException } from "@nestjs/common";
import { AppController } from "../../src/app.controller";
import { ReadinessService } from "../../src/observability/readiness.service";

describe("AppController runtime probes", () => {
  const originalD1RuntimeEnabled = process.env.D1_RUNTIME_ENABLED;

  const createController = (d1: boolean, redis: boolean, localSqlite = false) =>
    new AppController(
      { getHello: jest.fn() } as any,
      new ReadinessService(
        {
          isReady: jest.fn().mockResolvedValue(d1),
          isLocalMode: jest.fn().mockReturnValue(localSqlite),
        } as any,
        { isReady: jest.fn().mockResolvedValue(redis) } as any,
      ),
      {
        systemConfig: { findUnique: jest.fn().mockResolvedValue(null) },
      } as any,
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

    await expect(createController(true, true).getReadiness()).resolves.toEqual({
      status: "READY",
      dependencies: { database: true, redis: true, authority: "D1" },
    });
  });

  it("reports SQLite as the authority when the local adapter is selected", async () => {
    process.env.D1_RUNTIME_ENABLED = "true";

    await expect(
      createController(true, true, true).getReadiness(),
    ).resolves.toEqual({
      status: "READY",
      dependencies: { database: true, redis: true, authority: "SQLite" },
    });
  });

  it("rejects readiness when an active dependency is unavailable", async () => {
    process.env.D1_RUNTIME_ENABLED = "true";

    await expect(
      createController(false, true).getReadiness(),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("serves only allowlisted public navigation settings", async () => {
    const prisma = {
      systemConfig: {
        findUnique: jest.fn().mockResolvedValue({
          value: JSON.stringify([
            {
              id: "bottom:wallet",
              target: "/dashboard/wallet",
              surface: "bottom",
              audience: "public",
              visible: true,
              order: 2,
            },
            {
              id: "bottom:external",
              target: "https://example.com",
              surface: "bottom",
              audience: "public",
              visible: true,
              order: 1,
            },
            {
              id: "drawer:internal",
              target: "/dashboard/settings",
              surface: "drawer",
              audience: "internal",
              visible: true,
              order: 1,
            },
          ]),
        }),
      },
    };
    const controller = new AppController(
      { getHello: jest.fn() } as any,
      {} as ReadinessService,
      prisma as any,
    );

    await expect(controller.getPublicNavigation()).resolves.toEqual([
      {
        id: "bottom:wallet",
        surface: "bottom",
        target: "/dashboard/wallet",
        audience: "public",
        visible: true,
        order: 2,
      },
    ]);
    expect(prisma.systemConfig.findUnique).toHaveBeenCalledWith({
      where: { key: "admin.navigation.items" },
      select: { value: true },
    });
  });
});
