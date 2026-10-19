import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { FinancialOperationsController } from "../../src/financial/financial-operations.controller";
import { FinancialOperationsService } from "../../src/financial/financial-operations.service";
import { WalletController } from "../../src/wallet/wallet.controller";
import { WalletService } from "../../src/wallet/wallet.service";
import { AdminController } from "../../src/admin/admin.controller";
import { AdminService } from "../../src/admin/admin.service";
import { AdminWalletConfigurationService } from "../../src/admin/admin-wallet-configuration.service";
import { MiningService } from "../../src/mining/mining.service";
import { LoanService } from "../../src/loans/loans.service";
import { KycService } from "../../src/kyc/kyc.service";
import { JwtAuthGuard } from "../../src/auth/jwt-auth.guard";
import { AuthService } from "../../src/auth/auth.service";
import { AuthSurfaceGuard } from "../../src/auth/auth-surface.guard";
import { RolesGuard } from "../../src/auth/roles.guard";
import { AdminPermissionGuard } from "../../src/admin/admin-permission.guard";
import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import { MarketProviderRouterService } from "../../src/market/market-provider-router.service";

/**
 * C3 proof: Public and Admin HTTP surfaces operate on one D1-shaped durable
 * state and observe the same withdrawal transition.  This deliberately keeps
 * the transport, DTO validation and guards real while replacing only the
 * external D1 control-plane boundary with a deterministic transaction model.
 */
class SharedFinancialState {
  private readonly accounts = new Map([
    ["user-1:USDT", { id: "acct-user-1-usdt", userId: "user-1", asset: "USDT", scope: "MAIN", available: "100", locked: "0", status: "ACTIVE" }],
  ]);
  readonly withdrawals: Array<Record<string, any>> = [];
  readonly activities: Array<Record<string, any>> = [];
  readonly audit: Array<Record<string, any>> = [];
  readonly outbox: Array<Record<string, any>> = [];

  isEnabled() { return true; }
  async hasAssetCapability(asset: string, _network: string, capability: string) {
    return asset.toUpperCase() === "USDT" && capability === "withdraw";
  }
  async getWalletAssetNetworkConfig(asset: string, network: string) {
    if (asset.toUpperCase() !== "USDT" || network.toUpperCase() !== "TRC20") return null;
    return { assetActive: 1, withdrawEnabled: 1, networkActive: 1, networkWithdrawEnabled: 1, minWithdrawal: "1", maxWithdrawal: "1000", withdrawalFee: "0.2" };
  }
  async getSystemConfigValue(key: string) {
    return key === "gate2.withdrawal.fee.USDT.TRC20" ? "0.2" : null;
  }
  async getWithdrawal(requestKey: string) {
    return this.withdrawals.find((row) => row.requestKey === requestKey) ?? null;
  }
  async getWithdrawalById(id: string) {
    return this.withdrawals.find((row) => row.id === id) ?? null;
  }
  async reserveWithdrawal(input: Record<string, string>) {
    const account = this.accounts.get(`${input.userId}:${input.asset.toUpperCase()}`);
    if (!account) throw new Error("D1 account missing");
    const reserved = Number(input.reservedAmount);
    if (Number(account.available) < reserved) throw new Error("insufficient funds");
    account.available = String(Number(account.available) - reserved);
    account.locked = String(Number(account.locked) + reserved);
    const withdrawal = {
      id: "00000000-0000-4000-8000-000000000001",
      userId: input.userId,
      asset: input.asset.toUpperCase(),
      network: input.network,
      address: input.address,
      amount: input.amount,
      fee: input.fee,
      reservedAmount: input.reservedAmount,
      state: "PENDING_REVIEW",
      requestKey: input.requestKey,
    };
    this.withdrawals.push(withdrawal);
    this.activities.push({
      id: "activity-withdrawal-1",
      type: "WITHDRAWAL",
      status: "PENDING_REVIEW",
      asset: withdrawal.asset,
      amount: withdrawal.amount,
      referenceId: withdrawal.id,
      ledgerCorrelationId: input.requestKey,
      ledgerPostingId: "posting-reserve-1",
    });
    return withdrawal;
  }
  async approveWithdrawal(id: string, reason: string, adminId: string, idempotencyKey: string) {
    const withdrawal = await this.getWithdrawalById(id);
    if (!withdrawal) throw new Error("withdrawal missing");
    if (withdrawal.state === "APPROVED") return withdrawal;
    if (withdrawal.state !== "PENDING_REVIEW") throw new Error("illegal predecessor state");
    withdrawal.state = "APPROVED";
    withdrawal.reviewReason = reason;
    withdrawal.reviewedBy = adminId;
    this.audit.push({ action: "WITHDRAWAL_APPROVED", target: id, adminId, idempotencyKey });
    this.outbox.push({ eventKey: `event:withdrawal:approve:${id}`, target: id });
    return withdrawal;
  }
  async listWithdrawals(userId: string) {
    return this.withdrawals.filter((row) => row.userId === userId);
  }
  async listAdminWithdrawals() { return [...this.withdrawals]; }
  async listLedgerAccounts(userId: string) {
    return [...this.accounts.values()].filter((account) => account.userId === userId);
  }
  async listUserActivity(userId: string) {
    return userId === "user-1" ? [...this.activities] : [];
  }
}

describe("C3 Public ↔ Backend ↔ Admin financial causality", () => {
  let app: INestApplication;
  let state: SharedFinancialState;

  beforeAll(async () => {
    state = new SharedFinancialState();
    const financial = new FinancialOperationsService(state as any);
    const adminFacade = {
      getAdminWithdrawals: () => state.listAdminWithdrawals(),
      decideAdminWithdrawal: (id: string, decision: "approved" | "rejected", adminId: string, reason: string, key: string) =>
        decision === "approved" ? financial.approveWithdrawal(id, reason, adminId, key) : financial.rejectWithdrawal(id, reason, adminId, key),
    };
    const module = await Test.createTestingModule({
      controllers: [FinancialOperationsController, WalletController, AdminController],
      providers: [
        { provide: FinancialOperationsService, useValue: financial },
        { provide: WalletService, useFactory: () => new WalletService({} as any, {} as any, state as any) },
        { provide: AdminService, useValue: adminFacade },
        { provide: AdminWalletConfigurationService, useValue: {} },
        { provide: MiningService, useValue: {} },
        { provide: LoanService, useValue: {} },
        { provide: KycService, useValue: {} },
        { provide: D1FinancialCommandGateway, useValue: state },
        { provide: MarketProviderRouterService, useValue: { currentStatus: jest.fn() } },
        { provide: AuthService, useValue: { verifySensitiveAction: jest.fn().mockResolvedValue(undefined) } },
        { provide: ConfigService, useValue: { get: (name: string) => name === "NODE_ENV" ? "test" : undefined } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (context: any) => {
        const request = context.switchToHttp().getRequest();
        request.user = request.url.startsWith("/admin")
          ? { userId: "admin-1", role: "ADMIN", surface: "ADMIN" }
          : { userId: "user-1", role: "USER", surface: "PUBLIC" };
        return true;
      } })
      .overrideGuard(AuthSurfaceGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .overrideGuard(AdminPermissionGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => { if (app) await app.close(); });

  it("keeps Public-created withdrawal, Admin decision, and Public read-back causally continuous", async () => {
    const financialController = app.get(FinancialOperationsController);
    const walletController = app.get(WalletController);
    const adminController = app.get(AdminController);
    const publicRequest = { user: { userId: "user-1", role: "USER", surface: "PUBLIC" } } as any;
    const adminRequest = { user: { userId: "admin-1", role: "ADMIN", surface: "ADMIN" } } as any;
    const created = await financialController.requestWithdrawal({
      asset: "USDT", network: "TRC20", address: "T-c3-destination", amount: "10", idempotencyKey: "c3-public-withdrawal-001", securityPassword: "test-security-password",
    } as any, publicRequest);
    expect(created.withdrawal.state).toBe("PENDING_REVIEW");

    const adminQueue = await adminController.getAdminWithdrawals();
    expect(adminQueue).toEqual([expect.objectContaining({ id: created.withdrawal.id, state: "PENDING_REVIEW" })]);

    const approved = await adminController.approveAdminWithdrawal(created.withdrawal.id, {
      reason: "C3 approval", idempotencyKey: "c3-admin-approval-001",
    } as any, adminRequest);
    expect(approved.withdrawal).toMatchObject({ id: created.withdrawal.id, state: "APPROVED", reviewedBy: "admin-1" });
    expect(state.audit).toEqual([expect.objectContaining({ action: "WITHDRAWAL_APPROVED", idempotencyKey: "c3-admin-approval-001" })]);
    expect(state.outbox).toEqual([expect.objectContaining({ eventKey: `event:withdrawal:approve:${created.withdrawal.id}` })]);

    const publicReadBack = await financialController.withdrawals(publicRequest);
    expect(publicReadBack).toEqual([expect.objectContaining({ id: created.withdrawal.id, state: "APPROVED" })]);
    const walletReadBack = await walletController.getMyWallet(publicRequest);
    expect(walletReadBack.USDT).toMatchObject({ available: "89.8", locked: "10.2", total: "100" });
  });
});
