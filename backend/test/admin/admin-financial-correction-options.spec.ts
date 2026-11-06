import { AdminService } from "../../src/admin/admin.service";

describe("AdminService financial correction options", () => {
  it("returns only configured assets with active customer ledger scopes", async () => {
    const d1 = {
      isEnabled: () => true,
      listLedgerAccounts: jest.fn().mockResolvedValue([
        { asset: "USDT", scope: "MAIN", status: "ACTIVE" },
        { asset: "USDT", scope: "SPOT", status: "ACTIVE" },
        { asset: "BTC", scope: "MAIN", status: "ACTIVE" },
        { asset: "ETH", scope: "MAIN", status: "FROZEN" },
      ]),
      listAdminCurrencies: jest.fn().mockResolvedValue([
        { symbol: "USDT", name: "Tether", isActive: 1 },
        { symbol: "BTC", name: "Bitcoin", isActive: 0 },
        { symbol: "ETH", name: "Ethereum", isActive: true },
      ]),
    };
    const service: any = Object.assign(Object.create(AdminService.prototype), { d1 });

    await expect(service.getFinancialCorrectionOptions("user-1")).resolves.toEqual([
      { asset: "USDT", name: "Tether", scopes: ["MAIN", "SPOT"] },
    ]);
    expect(d1.listLedgerAccounts).toHaveBeenCalledWith("user-1");
    expect(d1.listAdminCurrencies).toHaveBeenCalledTimes(1);
  });
});


describe("AdminService financial correction eligibility guard", () => {
  function createService() {
    const d1 = {
      isEnabled: () => true,
      listLedgerAccounts: jest.fn().mockResolvedValue([
        { asset: "USDT", scope: "MAIN", status: "ACTIVE" },
      ]),
      listAdminCurrencies: jest.fn().mockResolvedValue([
        { symbol: "USDT", name: "Tether", isActive: 1 },
      ]),
      applyAdminFinancialCorrection: jest.fn().mockResolvedValue({ posting: { postingId: "p1" } }),
    };
    return {
      d1,
      service: Object.assign(Object.create(AdminService.prototype), { d1 }),
    };
  }

  const input = {
    userId: "user-1",
    asset: "BTC",
    amount: "1.25",
    direction: "CREDIT" as const,
    scope: "MAIN" as const,
    idempotencyKey: "admin-correction-1",
    reason: "approved support correction",
    adminId: "admin-1",
  };

  it("rejects an asset/scope pair outside active configured customer accounts", async () => {
    const { d1, service } = createService();
    await expect(service.applyFinancialCorrection(input)).rejects.toThrow(
      "active customer Ledger account and active configured asset",
    );
    expect(d1.applyAdminFinancialCorrection).not.toHaveBeenCalled();
  });

  it("normalizes and forwards an eligible pair to the canonical Ledger gateway", async () => {
    const { d1, service } = createService();
    await expect(service.applyFinancialCorrection({ ...input, asset: " usdt " }))
      .resolves.toEqual({ posting: { postingId: "p1" } });
    expect(d1.applyAdminFinancialCorrection).toHaveBeenCalledWith({
      ...input,
      asset: "USDT",
      scope: "MAIN",
    });
  });
});
