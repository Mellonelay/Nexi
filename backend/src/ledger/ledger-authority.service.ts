import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { LedgerAccountScope, LedgerAccountStatus, LedgerPostingKind, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerMutationResult, LedgerPostingCommand, PairedTransferCommand, WalletLedgerAuthority } from '../authority/authority-interfaces';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

type DbClient = PrismaService | any;

type PostingResult = LedgerMutationResult;

@Injectable()
export class LedgerAuthorityService implements WalletLedgerAuthority {
  constructor(private readonly prisma: PrismaService, @Optional() private readonly d1?: D1FinancialCommandGateway) {}

  async ensureAccount(userId: string, asset: string, tx?: DbClient): Promise<{ id: string; asset: string }> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.ensureAccount(userId, asset);
    }
    const client = tx ?? this.prisma;
    return client.ledgerAccount.upsert({
      where: { userId_asset_scope: { userId, asset: this.normalizeAsset(asset), scope: LedgerAccountScope.MAIN } },
      update: {},
      create: { userId, asset: this.normalizeAsset(asset) },
      select: { id: true, asset: true },
    });
  }

  async getAccountForUser(userId: string, asset: string, tx?: DbClient): Promise<{ id: string; asset: string }> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.getAccountForUser(userId, asset);
    }
    const client = tx ?? this.prisma;
    const account = await client.ledgerAccount.findUnique({
      where: { userId_asset_scope: { userId, asset: this.normalizeAsset(asset), scope: LedgerAccountScope.MAIN } },
      select: { id: true, asset: true },
    });
    if (!account) return this.ensureAccount(userId, asset, tx);
    return account;
  }

  async getAccountForUserInScope(userId: string, asset: string, scope: LedgerAccountScope, tx?: DbClient): Promise<{ id: string; asset: string }> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.getAccountForUser(userId, asset, scope);
    }
    const client = tx ?? this.prisma;
    const normalizedAsset = this.normalizeAsset(asset);
    return client.ledgerAccount.upsert({
      where: { userId_asset_scope: { userId, asset: normalizedAsset, scope } },
      update: {},
      create: { userId, asset: normalizedAsset, scope },
      select: { id: true, asset: true },
    });
  }

  async reserve(command: LedgerPostingCommand, tx?: DbClient): Promise<PostingResult> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.reserve(command);
    }
    return this.execute(command, LedgerPostingKind.RESERVE, false, true, tx, { availableOnly: true });
  }

  async release(command: LedgerPostingCommand, tx?: DbClient): Promise<PostingResult> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.release(command);
    }
    return this.execute(command, LedgerPostingKind.RELEASE, true, false, tx);
  }

  async settle(command: LedgerPostingCommand, tx?: DbClient): Promise<PostingResult> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.settle(command);
    }
    return this.execute(command, LedgerPostingKind.SETTLEMENT, false, false, tx, { lockedOnly: true });
  }

  async credit(command: LedgerPostingCommand, tx?: DbClient): Promise<PostingResult> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.credit(command);
    }
    return this.execute(command, LedgerPostingKind.CREDIT, true, false, tx);
  }

  async debit(command: LedgerPostingCommand, tx?: DbClient): Promise<PostingResult> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.debit(command);
    }
    return this.execute(command, LedgerPostingKind.DEBIT, false, false, tx, { availableOnly: true });
  }

  async compensate(command: LedgerPostingCommand, tx?: DbClient): Promise<PostingResult> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.compensate(command);
    }
    return this.execute(command, LedgerPostingKind.COMPENSATION, true, false, tx);
  }

  async pairedTransfer(command: PairedTransferCommand, tx?: DbClient): Promise<{ debitPostingId: string; creditPostingId: string }> {
    if (this.d1?.isEnabled()) {
      this.assertD1TransactionBoundary(tx);
      return this.d1.pairedTransfer(command);
    }
    const run = async (client: DbClient) => {
      const amount = this.decimal(command.amount);
      if (command.debitAccountId === command.creditAccountId) throw new BadRequestException('Transfer accounts must differ');
      const existing = await client.ledgerIdempotency.findUnique({ where: { idempotencyKey: command.idempotencyKey } });
      if (existing?.debitPostingId && existing.creditPostingId) {
        return { debitPostingId: existing.debitPostingId, creditPostingId: existing.creditPostingId };
      }
      await client.ledgerIdempotency.create({
        data: {
          idempotencyKey: command.idempotencyKey,
          operation: 'PAIRED_TRANSFER',
          accountId: command.debitAccountId,
        },
      });

      if (client.$queryRaw) {
        await client.$queryRaw`SELECT "id" FROM "LedgerAccount" WHERE "id" IN (${Prisma.join([command.debitAccountId, command.creditAccountId])}) ORDER BY "id" FOR UPDATE`;
      }

      const accounts = await client.ledgerAccount.findMany({
        where: { id: { in: [command.debitAccountId, command.creditAccountId] } },
        select: { id: true, userId: true, asset: true, status: true },
      });
      if (accounts.length !== 2 || accounts.some((account: any) => account.status !== LedgerAccountStatus.ACTIVE || account.asset !== command.asset)) {
        throw new NotFoundException('Transfer account is unavailable');
      }

      const debitUpdated = await client.ledgerAccount.updateMany({
        where: { id: command.debitAccountId, status: LedgerAccountStatus.ACTIVE, available: { gte: amount } },
        data: { available: { decrement: amount } },
      });
      if (debitUpdated.count !== 1) throw new BadRequestException('Insufficient available funds');
      await client.ledgerAccount.update({
        where: { id: command.creditAccountId },
        data: { available: { increment: amount } },
      });

      const correlationId = command.correlationId ?? command.idempotencyKey;
      const common = {
        asset: this.normalizeAsset(command.asset),
        amount,
        referenceType: command.referenceType,
        referenceId: command.referenceId,
        idempotencyKey: command.idempotencyKey,
        correlationId,
        economicGroup: command.economicGroup,
      };
      const debit = await client.ledgerPosting.create({
        data: {
          accountId: command.debitAccountId,
          kind: LedgerPostingKind.TRANSFER,
          availableDelta: amount.negated(),
          lockedDelta: new Prisma.Decimal(0),
          ...common,
          metadata: { direction: 'DEBIT' },
        },
      });
      const credit = await client.ledgerPosting.create({
        data: {
          accountId: command.creditAccountId,
          kind: LedgerPostingKind.TRANSFER,
          availableDelta: amount,
          lockedDelta: new Prisma.Decimal(0),
          ...common,
          metadata: { direction: 'CREDIT' },
        },
      });
      await client.ledgerIdempotency.update({
        where: { idempotencyKey: command.idempotencyKey },
        data: { debitPostingId: debit.id, creditPostingId: credit.id },
      });
      await this.audit(client, command.debitAccountId, debit.id, 'TRANSFER_DEBIT_POSTED', command.idempotencyKey, correlationId, command);
      await this.audit(client, command.creditAccountId, credit.id, 'TRANSFER_CREDIT_POSTED', command.idempotencyKey, correlationId, command);
      await this.recordActivity(client, accounts.find((account: any) => account.id === command.debitAccountId)?.userId, debit.id, command, amount, correlationId, {
        debitPostingId: debit.id,
        creditPostingId: credit.id,
        direction: 'PAIRED_TRANSFER',
      });
      return { debitPostingId: debit.id, creditPostingId: credit.id };
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async reconcile(accountId: string, asset: string): Promise<{ available: string; locked: string }> {
    if (this.d1?.isEnabled()) return this.d1.reconcile(accountId, asset);
    const account = await this.prisma.ledgerAccount.findUnique({ where: { id: accountId } });
    if (!account || account.asset !== this.normalizeAsset(asset)) throw new NotFoundException('Ledger account not found');
    const totals = await this.prisma.ledgerPosting.aggregate({
      where: { accountId },
      _sum: { availableDelta: true, lockedDelta: true },
    });
    return {
      available: account.available.toString(),
      locked: account.locked.toString(),
    };
  }

  async assertReconciled(accountId: string): Promise<{ available: string; locked: string; matches: boolean }> {
    if (this.d1?.isEnabled()) return this.d1.assertReconciled(accountId);
    const account = await this.prisma.ledgerAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Ledger account not found');
    const totals = await this.prisma.ledgerPosting.aggregate({
      where: { accountId },
      _sum: { availableDelta: true, lockedDelta: true },
    });
    const available = totals._sum.availableDelta ?? new Prisma.Decimal(0);
    const locked = totals._sum.lockedDelta ?? new Prisma.Decimal(0);
    const matches = account.available.eq(available) && account.locked.eq(locked);
    if (!matches) throw new Error(`Ledger invariant mismatch for account ${accountId}`);
    return { available: account.available.toString(), locked: account.locked.toString(), matches };
  }

  async getBalance(accountId: string): Promise<{ available: string; locked: string }> {
    if (this.d1?.isEnabled()) return this.d1.getBalance(accountId);
    const account = await this.prisma.ledgerAccount.findUnique({ where: { id: accountId }, select: { available: true, locked: true } });
    if (!account) throw new NotFoundException('Ledger account not found');
    return { available: account.available.toString(), locked: account.locked.toString() };
  }

  async getPostings(accountId: string): Promise<any[]> {
    if (this.d1?.isEnabled()) return this.d1.getPostings(accountId);
    return this.prisma.ledgerPosting.findMany({ where: { accountId }, orderBy: { createdAt: 'desc' } });
  }

  private async execute(command: LedgerPostingCommand, kind: LedgerPostingKind, availablePositive: boolean, lockedPositive: boolean, tx?: DbClient, options: { lockedOnly?: boolean; availableOnly?: boolean } = {}): Promise<PostingResult> {
    const run = async (client: DbClient) => {
      const amount = this.decimal(command.amount);
      const existing = await client.ledgerIdempotency.findUnique({ where: { idempotencyKey: command.idempotencyKey } });
      if (existing?.debitPostingId) {
        const account = await client.ledgerAccount.findUnique({ where: { id: command.accountId } });
        return { postingId: existing.debitPostingId, accountId: command.accountId, available: account.available.toString(), locked: account.locked.toString(), replayed: true };
      }
      let inserted = true;
      if (client.$queryRaw) {
        const rows = await client.$queryRaw<Array<{ idempotencyKey: string }>>`
          INSERT INTO "LedgerIdempotency" ("id", "idempotencyKey", "operation", "accountId", "createdAt", "updatedAt")
          VALUES (${randomUUID()}, ${command.idempotencyKey}, ${kind}, ${command.accountId}, NOW(), NOW())
          ON CONFLICT ("idempotencyKey") DO NOTHING
          RETURNING "idempotencyKey"
        `;
        inserted = rows.length === 1;
      } else {
        await client.ledgerIdempotency.create({
          data: { idempotencyKey: command.idempotencyKey, operation: kind, accountId: command.accountId },
        });
      }
      if (!inserted) {
        const replay = await client.ledgerIdempotency.findUnique({ where: { idempotencyKey: command.idempotencyKey } });
        if (!replay?.debitPostingId) throw new BadRequestException('Idempotent ledger operation is still completing');
        const account = await client.ledgerAccount.findUnique({ where: { id: command.accountId } });
        return { postingId: replay.debitPostingId, accountId: command.accountId, available: account.available.toString(), locked: account.locked.toString(), replayed: true };
      }
      const availableDelta = availablePositive ? amount : (options.availableOnly ? amount.negated() : new Prisma.Decimal(0));
      const lockedDelta = lockedPositive ? amount : (options.lockedOnly ? amount.negated() : (kind === LedgerPostingKind.RELEASE ? amount.negated() : new Prisma.Decimal(0)));
      const updated = await client.ledgerAccount.updateMany({
        where: {
          id: command.accountId,
          asset: this.normalizeAsset(command.asset),
          status: LedgerAccountStatus.ACTIVE,
          ...(availableDelta.isNegative() ? { available: { gte: amount } } : {}),
          ...(lockedDelta.isNegative() ? { locked: { gte: amount } } : {}),
        },
        data: {
          ...(availableDelta.isZero() ? {} : availableDelta.isNegative() ? { available: { decrement: amount } } : { available: { increment: availableDelta } }),
          ...(lockedDelta.isZero() ? {} : lockedDelta.isNegative() ? { locked: { decrement: amount } } : { locked: { increment: lockedDelta } }),
        },
      });
      if (updated.count !== 1) throw new BadRequestException('Ledger account cannot satisfy the requested mutation');
      const correlationId = command.correlationId ?? command.idempotencyKey;
      const posting = await client.ledgerPosting.create({
        data: {
          accountId: command.accountId,
          asset: this.normalizeAsset(command.asset),
          kind,
          amount,
          availableDelta,
          lockedDelta,
          referenceType: command.referenceType,
          referenceId: command.referenceId,
          idempotencyKey: command.idempotencyKey,
          correlationId,
          economicGroup: command.economicGroup,
          metadata: command.metadata as Prisma.InputJsonValue | undefined,
        },
      });
      await client.ledgerIdempotency.update({ where: { idempotencyKey: command.idempotencyKey }, data: { debitPostingId: posting.id } });
      await this.audit(client, command.accountId, posting.id, `${kind}_POSTED`, command.idempotencyKey, correlationId, command);
      await this.recordActivity(client, undefined, posting.id, command, amount, correlationId);
      const balance = await client.ledgerAccount.findUnique({ where: { id: command.accountId }, select: { available: true, locked: true } });
      return { postingId: posting.id, accountId: command.accountId, available: balance.available.toString(), locked: balance.locked.toString(), replayed: false };
    };
    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  private async recordActivity(
    client: DbClient,
    knownUserId: string | undefined,
    postingId: string,
    command: LedgerPostingCommand | PairedTransferCommand,
    amount: Prisma.Decimal,
    correlationId: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    if (!client.activity?.upsert) return;
    const userId = knownUserId ?? (await client.ledgerAccount.findUnique({ where: { id: (command as LedgerPostingCommand).accountId }, select: { userId: true } }))?.userId;
    if (!userId) throw new NotFoundException('Ledger account owner not found');
    await client.activity.upsert({
      where: { idempotencyKey: command.idempotencyKey },
      update: { ledgerPostingId: postingId },
      create: {
        userId,
        type: command.referenceType,
        status: 'COMPLETED',
        referenceType: command.referenceType,
        referenceId: command.referenceId,
        idempotencyKey: command.idempotencyKey,
        ledgerCorrelationId: correlationId,
        ledgerPostingId: postingId,
        asset: this.normalizeAsset(command.asset),
        amount,
        details: (details ?? ('metadata' in command ? command.metadata : undefined)) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  private async audit(client: DbClient, accountId: string, postingId: string, eventType: string, idempotencyKey: string, correlationId: string, command: LedgerPostingCommand | PairedTransferCommand): Promise<void> {
    await client.ledgerAuditEvent.create({
      data: {
        accountId,
        postingId,
        eventType,
        idempotencyKey,
        correlationId,
        details: { referenceType: command.referenceType, referenceId: command.referenceId },
      },
    });
  }

  private decimal(value: string): Prisma.Decimal {
    const amount = new Prisma.Decimal(value);
    if (!amount.isFinite() || amount.isNegative() || amount.isZero()) throw new BadRequestException('Ledger amount must be a positive decimal');
    return amount;
  }

  private assertD1TransactionBoundary(tx?: DbClient): void {
    if (tx) {
      throw new Error('D1 runtime cannot participate in a PostgreSQL transaction; convert the caller to a native D1 command first');
    }
  }

  private normalizeAsset(asset: string): string {
    const normalized = asset.trim().toUpperCase();
    if (!/^[A-Z0-9._-]{2,32}$/.test(normalized)) throw new BadRequestException('Ledger asset is invalid');
    return normalized;
  }
}
