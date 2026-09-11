import { GoneException, Injectable, Optional } from "@nestjs/common";
import { LedgerType } from "../prisma/d1-client";
import { LedgerAuthorityService } from "../ledger/ledger-authority.service";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: D1PrismaService,
    private readonly ledgerAuthority: LedgerAuthorityService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  private legacyMutationDisabled(): never {
    throw new GoneException(
      "Legacy wallet mutation authority disabled; use Gate 2 financial operations or the future B7 domain authority",
    );
  }

  /**
   * Wallet balances, postings, activity, and currency availability are
   * authoritative reads.  A disabled/unavailable D1 bridge must not silently
   * fall back to the legacy Prisma store, which can otherwise present stale
   * or contradictory financial state.
   */
  private requireD1ReadAuthority(): D1FinancialCommandGateway {
    if (!this.d1?.isEnabled()) {
      throw new GoneException("Wallet D1 read authority unavailable");
    }
    return this.d1;
  }

  async createWallet(userId: string) {
    const d1 = this.requireD1ReadAuthority();
    await d1.ensureWallet(userId);
    return { userId };
  }

  async getBalance(userId: string, currency: string) {
    const d1 = this.requireD1ReadAuthority();
    const account = await d1.getAccountForUser(userId, currency);
    return d1.getBalance(account.id);
  }

  async getAllBalances(userId: string) {
    const d1 = this.requireD1ReadAuthority();
    const accounts = await d1.listLedgerAccounts(userId);
    return Object.fromEntries(
      accounts.map((account) => [
        account.asset,
        {
          available: String(account.available ?? "0"),
          locked: String(account.locked ?? "0"),
          total: this.addDecimalStrings(
            String(account.available ?? "0"),
            String(account.locked ?? "0"),
          ),
          state: account.status,
        },
      ]),
    );
  }

  async getSupportedCurrencies() {
    return this.requireD1ReadAuthority().listCurrencies();
  }

  async deposit(
    userId: string,
    currency: string,
    amount: number,
    referenceId?: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async withdraw(
    userId: string,
    currency: string,
    amount: number,
    referenceId?: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async lockFunds(userId: string, currency: string, amount: number) {
    return this.legacyMutationDisabled();
  }

  async unlockFunds(userId: string, currency: string, amount: number) {
    return this.legacyMutationDisabled();
  }

  async deductLockedFunds(
    userId: string,
    currency: string,
    amount: number,
    type: LedgerType,
    refId: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async resolveLockedFunds(
    userId: string,
    currency: string,
    lockedAmount: number,
    profitAmount: number,
    type: LedgerType,
    refId: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async transferFunds(
    fromUserId: string,
    toUserId: string,
    currency: string,
    amount: number,
    referenceId: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async getLedger(userId: string) {
    const d1 = this.requireD1ReadAuthority();
    const postings = await d1.listUserPostings(userId);
    return postings.map((posting) => ({
      id: posting.id,
      walletId: posting.accountId,
      currency: posting.asset,
      amount: String(posting.amount ?? "0"),
      availableDelta: String(posting.availableDelta ?? "0"),
      lockedDelta: String(posting.lockedDelta ?? "0"),
      type: posting.kind,
      referenceId: posting.referenceId,
      idempotencyKey: posting.idempotencyKey,
      correlationId: posting.correlationId,
      createdAt: posting.createdAt,
    }));
  }

  async getActivity(userId: string, limit = 50) {
    const d1 = this.requireD1ReadAuthority();
    const rows = await d1.listUserActivity(userId, limit);
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      ledgerCorrelationId: row.ledgerCorrelationId,
      ledgerPostingId: row.ledgerPostingId,
      asset: row.asset,
      amount: row.amount == null ? null : String(row.amount),
      details: row.details,
      createdAt: row.createdAt,
    }));
  }

  async requestWithdrawal(
    userId: string,
    currency: string,
    amount: number,
    address: string,
  ) {
    return this.legacyMutationDisabled();
  }

  async getPendingWithdrawals() {
    throw new GoneException(
      "Legacy wallet withdrawal read authority disabled; use Gate 2 financial operations",
    );
  }

  async approveWithdrawal(requestId: string, txHash: string) {
    return this.legacyMutationDisabled();
  }

  async rejectWithdrawal(requestId: string, _reason: string) {
    return this.legacyMutationDisabled();
  }

  private addDecimalStrings(left: string, right: string): string {
    const [leftWhole, leftFraction = ""] = left.split(".");
    const [rightWhole, rightFraction = ""] = right.split(".");
    const scale = Math.max(leftFraction.length, rightFraction.length);
    const leftInt = BigInt(
      `${leftWhole}${leftFraction.padEnd(scale, "0")}` || "0",
    );
    const rightInt = BigInt(
      `${rightWhole}${rightFraction.padEnd(scale, "0")}` || "0",
    );
    const sum = (leftInt + rightInt).toString().padStart(scale + 1, "0");
    if (scale === 0) return sum;
    return `${sum.slice(0, -scale)}.${sum.slice(-scale)}`
      .replace(/\.0+$/, "")
      .replace(/(\.[0-9]*?)0+$/, "$1");
  }
}
