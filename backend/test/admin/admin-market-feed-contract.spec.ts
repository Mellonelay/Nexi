import { AdminService } from "../../src/admin/admin.service";

describe("AdminService market feed contract", () => {
  function service(prisma: any, d1Db?: any) {
    return new AdminService(
      prisma,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      d1Db,
    );
  }

  it("replays an already-audited feed mutation without writing provider state again", async () => {
    const original = {
      id: "provider-1", status: "DISABLED", adminId: "admin-1",
      reason: "controlled maintenance", idempotencyKey: "feed-status-0001",
    };
    const prisma: any = {
      marketProviderSymbol: { findFirst: jest.fn().mockResolvedValue(null) },
      marketProviderConfig: {
        findUnique: jest.fn().mockResolvedValue({ id: original.id, key: "binance", status: "DISABLED" }),
        update: jest.fn(),
      },
      adminAuditLog: {
        findUnique: jest.fn().mockResolvedValue({
          adminId: original.adminId, action: "MARKET_PROVIDER_STATUS_UPDATED",
          target: "binance",
          details: JSON.stringify({
            status: original.status, providerStatus: "DISABLED",
            reason: original.reason, idempotencyKey: original.idempotencyKey,
          }),
        }),
      },
    };
    prisma.$transaction = jest.fn(async (work: (tx: any) => Promise<unknown>) => work(prisma));
    const result = await service(prisma).setMarketFeedStatus({
      id: "provider-1",
      status: "DISABLED",
      adminId: "admin-1",
      reason: "controlled maintenance",
      idempotencyKey: "feed-status-0001",
    });
    expect(result).toMatchObject({ ok: true, auditId: expect.any(String), replayed: true, status: "DISABLED" });
    expect(prisma.marketProviderConfig.update).not.toHaveBeenCalled();
  });

  it("reads market feeds from the current D1 database surface", async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: "provider-1" }]);
    const prisma = { marketProviderConfig: { findMany } };
    await expect(service(prisma).getMarketFeeds()).resolves.toEqual([{ id: "provider-1" }]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ priority: "asc" }, { key: "asc" }] }));
  });
});
