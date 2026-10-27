import { BadRequestException, GoneException } from "@nestjs/common";
import { WalletService } from "../../src/wallet/wallet.service";

const walletAccountsByScope = [
  { asset: "USDT", scope: "MAIN", available: "10.25", locked: "1.75", status: "ACTIVE" },
  { asset: "USDT", scope: "MARGIN", available: "60", locked: "0", status: "ACTIVE" },
];

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
    ["getOverview", (service: WalletService) => service.getOverview("user-1")],
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
      listLedgerAccounts: jest.fn().mockResolvedValue(walletAccountsByScope),
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
    expect(await service.getActivity("user-1")).toEqual({
      activities: [expect.objectContaining({ amount: "2", referenceId: "withdrawal-1", relatedLedgerPostings: [] })],
      hasMore: false,
      nextCursor: null,
    });
    expect(d1.ensureWallet).toHaveBeenCalledWith("user-1");
    expect(prisma.wallet.upsert).not.toHaveBeenCalled();
    expect(prisma.ledgerAccount.findMany).not.toHaveBeenCalled();
    expect(prisma.currency.findMany).not.toHaveBeenCalled();
    expect(prisma.activity.findMany).not.toHaveBeenCalled();
  });

  it("returns persisted available and locked values across Ledger scopes", async () => {
    const d1 = {
      isEnabled: jest.fn(() => true),
      listLedgerAccounts: jest.fn().mockResolvedValue(walletAccountsByScope),
      listCurrencies: jest.fn().mockResolvedValue([{ symbol: "USDT" }]),
    } as any;
    const service = new WalletService(prisma, ledger, d1);
    await expect(service.getOverview("user-1")).resolves.toEqual({
      currencies: ["USDT"],
      assets: [{
        asset: "USDT",
        name: "USDT",
        logo: null,
        scopes: {
          MAIN: { available: "10.25", locked: "1.75", total: "12", state: "ACTIVE", accountExists: true },
          MARGIN: { available: "60", locked: "0", total: "60", state: "ACTIVE", accountExists: true },
        },
      }],
    });
    expect(d1.listLedgerAccounts).toHaveBeenCalledWith("user-1");
    expect(prisma.ledgerAccount.findMany).not.toHaveBeenCalled();
  });

  it("fills supported currencies with a truthful unopened zero MAIN balance without creating an account", async () => {
    const d1 = {
      isEnabled: jest.fn(() => true),
      listLedgerAccounts: jest.fn().mockResolvedValue([]),
      listCurrencies: jest.fn().mockResolvedValue([{ symbol: "USDT", name: "Tether" }]),
    } as any;
    const service = new WalletService(prisma, ledger, d1);
    await expect(service.getOverview("user-1")).resolves.toEqual({
      currencies: ["USDT"],
      assets: [{
        asset: "USDT",
        name: "Tether",
        logo: null,
        scopes: {
          MAIN: { available: "0", locked: "0", total: "0", state: "NOT_OPENED", accountExists: false },
        },
      }],
    });
    expect(d1.listLedgerAccounts).toHaveBeenCalledWith("user-1");
    expect(prisma.ledgerAccount.findMany).not.toHaveBeenCalled();
  });

  it("rejects malformed activity cursors and keeps filters user scoped", async () => {
    const d1 = {
      isEnabled: jest.fn(() => true),
      listUserActivityPage: jest.fn().mockResolvedValue({ rows: [], hasMore: false }),
    } as any;
    const service = new WalletService(prisma, ledger, d1);
    await expect(service.getActivity("user-1", { cursor: "invalid" })).rejects.toBeInstanceOf(BadRequestException);
    const decodeCursor = jest.spyOn(Buffer, "from");
    await expect(service.getActivity("user-1", { cursor: ["invalid"] as unknown as string })).rejects.toBeInstanceOf(BadRequestException);
    expect(decodeCursor).not.toHaveBeenCalled();
    decodeCursor.mockRestore();
    expect(d1.listUserActivityPage).not.toHaveBeenCalled();
    await service.getActivity("user-1", { limit: 20, type: "transfer", asset: "usdt", status: "completed" });
    expect(d1.listUserActivityPage).toHaveBeenCalledWith("user-1", {
      limit: 20,
      beforeCreatedAt: undefined,
      beforeId: undefined,
      type: "TRANSFER",
      asset: "USDT",
      status: "COMPLETED",
    });
  });

  it("keeps the legacy pending-withdrawal read disabled regardless of D1 state", async () => {
    const service = new WalletService(prisma, ledger);

    await expect(service.getPendingWithdrawals()).rejects.toBeInstanceOf(
      GoneException,
    );
    expect(prisma.withdrawalRequest.findMany).not.toHaveBeenCalled();
  });
});
