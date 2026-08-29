import { GoneException, Injectable, Optional } from '@nestjs/common';
import { LedgerType, WithdrawalStatus } from '@prisma/client';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { PrismaService } from '../prisma/prisma.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerAuthority: LedgerAuthorityService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  private legacyMutationDisabled(): never {
    throw new GoneException('Legacy wallet mutation authority disabled; use Gate 2 financial operations or the future B7 domain authority');
  }

  async createWallet(userId: string) {
    if (this.d1?.isEnabled()) {
      await this.d1.ensureWallet(userId);
      return { userId };
    }
    return this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balances: {} },
    });
  }

  async getBalance(userId: string, currency: string) {
    const account = await this.ledgerAuthority.getAccountForUser(userId, currency);
    return this.ledgerAuthority.getBalance(account.id);
  }

  async getAllBalances(userId: string) {
    if (this.d1?.isEnabled()) {
      const accounts = await this.d1.listLedgerAccounts(userId);
      return Object.fromEntries(accounts.map((account) => {
        const available = String(account.available ?? '0');
        const locked = String(account.locked ?? '0');
        return [String(account.asset), { available, locked, total: this.addDecimalStrings(available, locked), state: account.status }];
      }));
    }
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { userId },
      orderBy: { asset: 'asc' },
    });
    return Object.fromEntries(accounts.map((account) => [account.asset, {
      available: account.available.toString(),
      locked: account.locked.toString(),
      total: account.available.add(account.locked).toString(),
      state: account.status,
    }]));
  }

  async getSupportedCurrencies() {
    if (this.d1?.isEnabled()) return this.d1.listCurrencies();
    return this.prisma.currency.findMany({
      where: { isActive: true },
      select: { symbol: true, name: true, logo: true, minDeposit: true },
    });
  }

  async deposit(userId: string, currency: string, amount: number, referenceId?: string) {
    return this.legacyMutationDisabled();
  }

  async withdraw(userId: string, currency: string, amount: number, referenceId?: string) {
    return this.legacyMutationDisabled();
  }

  async lockFunds(userId: string, currency: string, amount: number) {
    return this.legacyMutationDisabled();
  }

  async unlockFunds(userId: string, currency: string, amount: number) {
    return this.legacyMutationDisabled();
  }

  async deductLockedFunds(userId: string, currency: string, amount: number, type: LedgerType, refId: string) {
    return this.legacyMutationDisabled();
  }

  async resolveLockedFunds(userId: string, currency: string, lockedAmount: number, profitAmount: number, type: LedgerType, refId: string) {
    return this.legacyMutationDisabled();
  }

  async transferFunds(fromUserId: string, toUserId: string, currency: string, amount: number, referenceId: string) {
    return this.legacyMutationDisabled();
  }

  async getLedger(userId: string) {
    if (this.d1?.isEnabled()) {
      const postings = await this.d1.listUserPostings(userId);
      return postings.map((posting) => ({
        id: posting.id,
        walletId: posting.accountId,
        currency: posting.asset,
        amount: String(posting.amount ?? '0'),
        availableDelta: String(posting.availableDelta ?? '0'),
        lockedDelta: String(posting.lockedDelta ?? '0'),
        type: posting.kind,
        referenceId: posting.referenceId,
        idempotencyKey: posting.idempotencyKey,
        correlationId: posting.correlationId,
        createdAt: posting.createdAt,
      }));
    }
    const accounts = await this.prisma.ledgerAccount.findMany({ where: { userId }, select: { id: true } });
    const postings = (await Promise.all(accounts.map((account) => this.ledgerAuthority.getPostings(account.id)))).flat();
    return postings.map((posting) => ({
      id: posting.id,
      walletId: posting.accountId,
      currency: posting.asset,
      amount: posting.amount.toString(),
      availableDelta: posting.availableDelta.toString(),
      lockedDelta: posting.lockedDelta.toString(),
      type: posting.kind,
      referenceId: posting.referenceId,
      idempotencyKey: posting.idempotencyKey,
      correlationId: posting.correlationId,
      createdAt: posting.createdAt,
    }));
  }

  async getActivity(userId: string, limit = 50) {
    if (this.d1?.isEnabled()) {
      const rows = await this.d1.listUserActivity(userId, limit);
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
    const rows = await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      ledgerCorrelationId: row.ledgerCorrelationId,
      ledgerPostingId: row.ledgerPostingId,
      asset: row.asset,
      amount: row.amount?.toString() ?? null,
      details: row.details,
      createdAt: row.createdAt,
    }));
  }

  async requestWithdrawal(userId: string, currency: string, amount: number, address: string) {
    return this.legacyMutationDisabled();
  }

  async getPendingWithdrawals() {
    return this.prisma.withdrawalRequest.findMany({
      where: { status: WithdrawalStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, id: true } } },
    });
  }

  async approveWithdrawal(requestId: string, txHash: string) {
    return this.legacyMutationDisabled();
  }

  async rejectWithdrawal(requestId: string, _reason: string) {
    return this.legacyMutationDisabled();
  }

  private addDecimalStrings(left: string, right: string): string {
    const [leftWhole, leftFraction = ''] = left.split('.');
    const [rightWhole, rightFraction = ''] = right.split('.');
    const scale = Math.max(leftFraction.length, rightFraction.length);
    const leftInt = BigInt(`${leftWhole}${leftFraction.padEnd(scale, '0')}` || '0');
    const rightInt = BigInt(`${rightWhole}${rightFraction.padEnd(scale, '0')}` || '0');
    const sum = (leftInt + rightInt).toString().padStart(scale + 1, '0');
    if (scale === 0) return sum;
    return `${sum.slice(0, -scale)}.${sum.slice(-scale)}`.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
  }
}
