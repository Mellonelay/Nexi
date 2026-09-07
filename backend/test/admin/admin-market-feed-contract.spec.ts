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
      undefined,
      d1Db,
    );
  }

  it("replays an already-audited feed mutation without writing provider state again", async () => {
    const prisma = {
      adminAuditLog: { findFirst: jest.fn().mockResolvedValue({ id: "audit-1" }) },
      marketProviderSymbol: { findFirst: jest.fn() },
      marketProviderConfig: { findUnique: jest.fn(), update: jest.fn() },
    };
    const result = await service(prisma).setMarketFeedStatus({
      id: "provider-1",
      status: "DISABLED",
      adminId: "admin-1",
      reason: "controlled maintenance",
      idempotencyKey: "feed-status-0001",
    });
    expect(result).toEqual({ ok: true, auditId: "audit-1", replayed: true });
    expect(prisma.marketProviderConfig.update).not.toHaveBeenCalled();
  });

  it("uses D1 market authority when it is enabled", async () => {
    const prisma = { marketProviderConfig: { findMany: jest.fn() } };
    const d1Db = {
      isEnabled: () => true,
      marketProviderConfig: { findMany: jest.fn().mockResolvedValue([{ id: "provider-1" }]) },
    };
    await expect(service(prisma, d1Db).getMarketFeeds()).resolves.toEqual([{ id: "provider-1" }]);
    expect(d1Db.marketProviderConfig.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.marketProviderConfig.findMany).not.toHaveBeenCalled();
  });
});
