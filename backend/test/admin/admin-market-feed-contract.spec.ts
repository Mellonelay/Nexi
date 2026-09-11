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

  it("reads market feeds from the current D1 database surface", async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: "provider-1" }]);
    const prisma = { marketProviderConfig: { findMany } };
    await expect(service(prisma).getMarketFeeds()).resolves.toEqual([{ id: "provider-1" }]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ priority: "asc" }, { key: "asc" }] }));
  });
});
