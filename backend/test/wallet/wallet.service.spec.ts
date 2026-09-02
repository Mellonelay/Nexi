import { GoneException } from "@nestjs/common";
import { WalletService } from "../../src/wallet/wallet.service";

describe("WalletService D1 read authority", () => {
  const prisma = {
    wallet: { upsert: jest.fn() },
    ledgerAccount: { findMany: jest.fn() },
    currency: { findMany: jest.fn() },
    activity: { findMany: jest.fn() },
    withdrawalRequest: { findMany: jest.fn() },
  } as any;
  const ledger = {} as any;

  beforeEach(() => jest.clearAllMocks());

  it.each([
    [
      "createWallet",
      (service: WalletService) => service.createWallet("user-1"),
    ],
    [
      "getBalance",
      (service: WalletService) => service.getBalance("user-1", "USDT"),
    ],
    [
      "getAllBalances",
      (service: WalletService) => service.getAllBalances("user-1"),
    ],
    [
      "getSupportedCurrencies",
      (service: WalletService) => service.getSupportedCurrencies(),
    ],
    ["getLedger", (service: WalletService) => service.getLedger("user-1")],
    ["getActivity", (service: WalletService) => service.getActivity("user-1")],
  ])(
    "fails closed for %s when D1 is unavailable",
    async (_operation, operation) => {
      const service = new WalletService(prisma, ledger);

      await expect(operation(service)).rejects.toBeInstanceOf(GoneException);
      expect(prisma.wallet.upsert).not.toHaveBeenCalled();
      expect(prisma.ledgerAccount.findMany).not.toHaveBeenCalled();
      expect(prisma.currency.findMany).not.toHaveBeenCalled();
      expect(prisma.activity.findMany).not.toHaveBeenCalled();
    },
  );

  it("uses D1 for every authoritative wallet read and create path", async () => {
    const d1 = {
      isEnabled: jest.fn(() => true),
      ensureWallet: jest.fn(),
      getAccountForUser: jest
        .fn()
        .mockResolvedValue({ id: "account-1", asset: "USDT" }),
      getBalance: jest
        .fn()
        .mockResolvedValue({ available: "10.25", locked: "1.75" }),
      listLedgerAccounts: jest
        .fn()
        .mockResolvedValue([
          {
            asset: "USDT",
            available: "10.25",
            locked: "1.75",
            status: "ACTIVE",
          },
        ]),
      listCurrencies: jest.fn().mockResolvedValue([{ symbol: "USDT" }]),
      listUserPostings: jest
        .fn()
        .mockResolvedValue([
          {
            id: "posting-1",
            accountId: "account-1",
            asset: "USDT",
            amount: "2",
            availableDelta: "-2",
            lockedDelta: "0",
            kind: "DEBIT",
            referenceId: "ref-1",
            idempotencyKey: "key-1",
            correlationId: "corr-1",
            createdAt: "2026-09-02T00:00:00.000Z",
          },
        ]),
      listUserActivity: jest
        .fn()
        .mockResolvedValue([
          {
            id: "activity-1",
            type: "WITHDRAWAL",
            status: "PENDING",
            referenceType: "Withdrawal",
            referenceId: "withdrawal-1",
            ledgerCorrelationId: "corr-1",
            ledgerPostingId: "posting-1",
            asset: "USDT",
            amount: "2",
            details: {},
            createdAt: "2026-09-02T00:00:00.000Z",
          },
        ]),
    } as any;
    const service = new WalletService(prisma, ledger, d1);

    await service.createWallet("user-1");
    expect(await service.getBalance("user-1", "USDT")).toEqual({
      available: "10.25",
      locked: "1.75",
    });
    expect(await service.getAllBalances("user-1")).toEqual({
      USDT: {
        available: "10.25",
        locked: "1.75",
        total: "12",
        state: "ACTIVE",
      },
    });
    expect(await service.getSupportedCurrencies()).toEqual([
      { symbol: "USDT" },
    ]);
    expect(await service.getLedger("user-1")).toEqual([
      expect.objectContaining({ amount: "2", walletId: "account-1" }),
    ]);
    expect(await service.getActivity("user-1")).toEqual([
      expect.objectContaining({ amount: "2", referenceId: "withdrawal-1" }),
    ]);
    expect(d1.ensureWallet).toHaveBeenCalledWith("user-1");
    expect(prisma.wallet.upsert).not.toHaveBeenCalled();
    expect(prisma.ledgerAccount.findMany).not.toHaveBeenCalled();
    expect(prisma.currency.findMany).not.toHaveBeenCalled();
    expect(prisma.activity.findMany).not.toHaveBeenCalled();
  });

  it("keeps the legacy pending-withdrawal read disabled regardless of D1 state", async () => {
    const service = new WalletService(prisma, ledger);

    await expect(service.getPendingWithdrawals()).rejects.toBeInstanceOf(
      GoneException,
    );
    expect(prisma.withdrawalRequest.findMany).not.toHaveBeenCalled();
  });
});
