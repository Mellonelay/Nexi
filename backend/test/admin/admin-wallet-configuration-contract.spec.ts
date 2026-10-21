import { AdminController } from "../../src/admin/admin.controller";
import { AdminService } from "../../src/admin/admin.service";
import { AdminWalletConfigurationService } from "../../src/admin/admin-wallet-configuration.service";

function createAdminService(d1: Record<string, any>) {
  return new AdminService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    d1 as any,
  );
}

function createWalletConfigurationService(d1: Record<string, any>) {
  return new AdminWalletConfigurationService({} as any, d1 as any);
}

describe("Admin Wallet funding authority contract", () => {
  it("routes wallet network commands to D1 with admin context", async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      listAdminWalletNetworks: jest.fn().mockResolvedValue([{ id: "network-1" }]),
      createAdminWalletNetwork: jest.fn().mockResolvedValue({ id: "network-1" }),
      updateAdminWalletNetwork: jest.fn().mockResolvedValue({ id: "network-1" }),
    };
    const service = createWalletConfigurationService(d1);
    const adminId = "admin-1";

    await expect(service.getWalletNetworks()).resolves.toEqual([{ id: "network-1" }]);
    await service.createWalletNetwork({
      currencyId: 3,
      code: "base",
      name: "Base",
      reason: "Configure Base network",
      idempotencyKey: "wallet-network-001",
    }, adminId);
    await service.updateWalletNetwork("network-1", {
      depositEnabled: true,
      reason: "Enable reviewed network",
      idempotencyKey: "wallet-network-002",
    }, adminId);

    expect(d1.listAdminWalletNetworks).toHaveBeenCalledTimes(1);
    expect(d1.createAdminWalletNetwork).toHaveBeenCalledWith(expect.objectContaining({
      currencyId: 3,
      code: "base",
      adminId,
      idempotencyKey: "wallet-network-001",
    }));
    expect(d1.updateAdminWalletNetwork).toHaveBeenCalledWith({
      id: "network-1",
      patch: { depositEnabled: true },
      adminId,
      reason: "Enable reviewed network",
      idempotencyKey: "wallet-network-002",
    });
  });

  it("routes deposit address commands to D1 with admin context", async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      createAdminDepositAddress: jest.fn().mockResolvedValue({ id: "address-1", isActive: 0 }),
      updateAdminDepositAddressState: jest.fn().mockResolvedValue({ id: "address-1", isActive: 1 }),
    };
    const adminService = createAdminService(d1);
    const walletService = createWalletConfigurationService(d1);
    const adminId = "admin-1";

    await adminService.addDepositAddress(3, "BASE", "0x12345678", undefined, adminId, "Configure destination", "wallet-address-001");
    await walletService.setDepositAddressState("address-1", {
      isActive: true,
      reason: "Enable reviewed destination",
      idempotencyKey: "wallet-address-002",
    }, adminId);

    expect(d1.createAdminDepositAddress).toHaveBeenCalledWith({
      currencyId: 3,
      network: "BASE",
      address: "0x12345678",
      label: undefined,
      adminId,
      reason: "Configure destination",
      idempotencyKey: "wallet-address-001",
    });
    expect(d1.updateAdminDepositAddressState).toHaveBeenCalledWith({
      id: "address-1",
      isActive: true,
      reason: "Enable reviewed destination",
      idempotencyKey: "wallet-address-002",
      adminId,
    });
  });

  it("preserves the authenticated admin identity through controller wallet routes", async () => {
    const adminService = {
      addDepositAddress: jest.fn().mockResolvedValue({ id: "address-1" }),
    };
    const walletConfiguration = {
      createCurrency: jest.fn().mockResolvedValue({ id: 3 }),
      getWalletNetworks: jest.fn().mockResolvedValue([]),
      createWalletNetwork: jest.fn().mockResolvedValue({ id: "network-1" }),
      updateWalletNetwork: jest.fn().mockResolvedValue({ id: "network-1" }),
      setDepositAddressState: jest.fn().mockResolvedValue({ id: "address-1" }),
    };
    const controller = new AdminController(
      adminService as any,
      walletConfiguration as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const request = { user: { userId: "admin-7" } } as any;
    const currency = { symbol: "BTC", name: "Bitcoin", reason: "reviewed", idempotencyKey: "wallet-currency-003" };
    const network = { currencyId: 3, code: "BASE", name: "Base", reason: "reviewed", idempotencyKey: "wallet-network-003" };
    const address = { network: "BASE", address: "0x12345678", reason: "reviewed", idempotencyKey: "wallet-address-003" };

    await controller.createCurrency(currency as any, request);
    await controller.getWalletNetworks();
    await controller.createWalletNetwork(network as any, request);
    await controller.updateWalletNetwork("network-1", { depositEnabled: false, reason: "reviewed", idempotencyKey: "wallet-network-004" } as any, request);
    await controller.addDepositAddress(3, address as any, request);
    await controller.updateDepositAddressState("address-1", { isActive: false, reason: "reviewed", idempotencyKey: "wallet-address-004" } as any, request);

    expect(walletConfiguration.createCurrency).toHaveBeenCalledWith(currency, "admin-7");
    expect(walletConfiguration.createWalletNetwork).toHaveBeenCalledWith(network, "admin-7");
    expect(walletConfiguration.updateWalletNetwork).toHaveBeenCalledWith("network-1", expect.objectContaining({ depositEnabled: false }), "admin-7");
    expect(adminService.addDepositAddress).toHaveBeenCalledWith(3, "BASE", "0x12345678", undefined, "admin-7", "reviewed", "wallet-address-003");
    expect(walletConfiguration.setDepositAddressState).toHaveBeenCalledWith("address-1", expect.objectContaining({ isActive: false }), "admin-7");
  });
});
