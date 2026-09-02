import axios from "axios";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { FinancialOperationsController } from "../../src/financial/financial-operations.controller";
import { FinancialOperationsService } from "../../src/financial/financial-operations.service";
import { WalletController } from "../../src/wallet/wallet.controller";
import { WalletService } from "../../src/wallet/wallet.service";
import { JwtAuthGuard } from "../../src/auth/jwt-auth.guard";
import { D1FinancialCommandGateway } from "../../src/d1/d1-financial-command.gateway";
import { PrismaService } from "../../src/prisma/prisma.service";
import { LedgerAuthorityService } from "../../src/ledger/ledger-authority.service";

/**
 * C2 proof harness for the Public financial surface.
 *
 * The request uses the exact JSON contract emitted by the Public
 * WithdrawModal, crosses a real Nest HTTP server, ValidationPipe, guard,
 * controller and service, then persists/read-backs through a D1-shaped
 * authoritative adapter. No service-direct call or financial mock is used
 * as the proof boundary.
 */
class D1FinancialHarness {
  private readonly accounts = new Map([
    ["user-1:USDT", { id: "acct-user-1-usdt", userId: "user-1", asset: "USDT", available: "100", locked: "0", status: "ACTIVE" }],
  ]);
  readonly withdrawals: Array<Record<string, unknown>> = [];
  readonly activities: Array<Record<string, unknown>> = [];

  isEnabled() { return true; }

  async hasAssetCapability(asset: string, _network: string, capability: string) {
    return asset.toUpperCase() === "USDT" && capability === "withdraw";
  }

  async getSystemConfigValue(key: string) {
    return key === "gate2.withdrawal.fee.USDT.TRC20" ? "0.2" : null;
  }

  async getWithdrawal(requestKey: string) {
    return this.withdrawals.find((row) => row.requestKey === requestKey) ?? null;
  }

  async reserveWithdrawal(input: Record<string, string>) {
    const account = this.accounts.get(`${input.userId}:${input.asset.toUpperCase()}`);
    if (!account) throw new Error("D1 account missing");
    const reserved = Number(input.reservedAmount);
    if (Number(account.available) < reserved) throw new Error("insufficient funds");
    account.available = String(Number(account.available) - reserved);
    account.locked = String(Number(account.locked) + reserved);
    const withdrawal = {
      id: `withdrawal-${this.withdrawals.length + 1}`,
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
      id: `activity-${this.activities.length + 1}`,
      type: "WITHDRAWAL",
      status: "PENDING_REVIEW",
      asset: withdrawal.asset,
      amount: withdrawal.amount,
      ledgerCorrelationId: input.requestKey,
      ledgerPostingId: `posting-${this.withdrawals.length}`,
    });
    return withdrawal;
  }

  async listLedgerAccounts(userId: string) {
    return [...this.accounts.values()].filter((account) => account.userId === userId);
  }

  async listUserActivity(userId: string) {
    return userId === "user-1" ? this.activities : [];
  }
}

describe("Public financial C2 HTTP path", () => {
  let app: INestApplication;
  let d1: D1FinancialHarness;

  beforeAll(async () => {
    d1 = new D1FinancialHarness();
    const module = await Test.createTestingModule({
      controllers: [FinancialOperationsController, WalletController],
      providers: [
        FinancialOperationsService,
        WalletService,
        { provide: D1FinancialCommandGateway, useValue: d1 },
        { provide: PrismaService, useValue: {} },
        { provide: LedgerAuthorityService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          context.switchToHttp().getRequest().user = { userId: "user-1", role: "USER" };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();
    await app.listen(0, "127.0.0.1");
  });

  afterAll(async () => { await app.close(); });

  it("proves Public withdrawal JSON → Nest → D1 reservation → wallet read-back", async () => {
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address");
    const baseURL = `http://127.0.0.1:${address.port}`;

    const withdrawal = await axios.post(`${baseURL}/financial/withdrawals`, {
      asset: "USDT",
      network: "TRC20",
      address: "T-public-c2-destination",
      amount: "10",
      idempotencyKey: "public-c2-withdrawal-001",
    }, { validateStatus: () => true });

    expect(withdrawal.status).toBe(201);
    expect(withdrawal.data).toMatchObject({
      replayed: false,
      providerLive: false,
      withdrawal: { state: "PENDING_REVIEW", requestKey: "public-c2-withdrawal-001" },
    });

    const wallet = await axios.get(`${baseURL}/wallet/me`);
    expect(wallet.data).toMatchObject({ USDT: { available: "89.8", locked: "10.2", total: "100" } });

    const activity = await axios.get(`${baseURL}/wallet/activity`);
    expect(activity.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "WITHDRAWAL",
        asset: "USDT",
        amount: "10",
        ledgerCorrelationId: "public-c2-withdrawal-001",
        ledgerPostingId: "posting-1",
      }),
    ]));

    const replay = await axios.post(`${baseURL}/financial/withdrawals`, {
      asset: "USDT",
      network: "TRC20",
      address: "T-public-c2-destination",
      amount: "10",
      idempotencyKey: "public-c2-withdrawal-001",
    });
    expect(replay.data).toMatchObject({ replayed: true, withdrawal: { id: "withdrawal-1" } });
    expect(d1.withdrawals).toHaveLength(1);
  });

  it("enforces the Public DTO boundary for malformed withdrawal input", async () => {
    const address = app.getHttpServer().address();
    if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address");
    const response = await axios.post(`http://127.0.0.1:${address.port}/financial/withdrawals`, {
      asset: "USDT",
      network: "TRC20",
      address: "T-public-c2-destination",
      amount: "not-a-decimal",
      idempotencyKey: "public-c2-invalid",
    }, { validateStatus: () => true });
    expect(response.status).toBe(400);
    expect(d1.withdrawals).toHaveLength(1);
  });
});
