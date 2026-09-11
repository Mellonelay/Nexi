import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LedgerAccountScope } from '../prisma/d1-client';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import {
  LedgerMutationResult,
  LedgerPostingCommand,
  PairedTransferCommand,
  WalletLedgerAuthority,
} from '../authority/authority-interfaces';

@Injectable()
export class LedgerAuthorityService implements WalletLedgerAuthority {
  constructor(private readonly d1: D1FinancialCommandGateway) {}

  async ensureAccount(userId: string, asset: string, tx?: unknown) {
    this.assertNoTransaction(tx);
    return this.d1.ensureAccount(userId, asset);
  }

  async getAccountForUser(userId: string, asset: string, tx?: unknown) {
    this.assertNoTransaction(tx);
    return this.d1.getAccountForUser(userId, asset);
  }

  async getAccountForUserInScope(
    userId: string,
    asset: string,
    scope: LedgerAccountScope,
    tx?: unknown,
  ) {
    this.assertNoTransaction(tx);
    return this.d1.getAccountForUser(userId, asset, scope);
  }

  reserve(command: LedgerPostingCommand, tx?: unknown): Promise<LedgerMutationResult> {
    this.assertNoTransaction(tx);
    return this.d1.reserve(command);
  }

  release(command: LedgerPostingCommand, tx?: unknown): Promise<LedgerMutationResult> {
    this.assertNoTransaction(tx);
    return this.d1.release(command);
  }

  settle(command: LedgerPostingCommand, tx?: unknown): Promise<LedgerMutationResult> {
    this.assertNoTransaction(tx);
    return this.d1.settle(command);
  }

  credit(command: LedgerPostingCommand, tx?: unknown): Promise<LedgerMutationResult> {
    this.assertNoTransaction(tx);
    return this.d1.credit(command);
  }

  debit(command: LedgerPostingCommand, tx?: unknown): Promise<LedgerMutationResult> {
    this.assertNoTransaction(tx);
    return this.d1.debit(command);
  }

  compensate(command: LedgerPostingCommand, tx?: unknown): Promise<LedgerMutationResult> {
    this.assertNoTransaction(tx);
    return this.d1.compensate(command);
  }

  pairedTransfer(
    command: PairedTransferCommand,
    tx?: unknown,
  ): Promise<{ debitPostingId: string; creditPostingId: string }> {
    this.assertNoTransaction(tx);
    return this.d1.pairedTransfer(command);
  }

  reconcile(accountId: string, asset: string) {
    return this.d1.reconcile(accountId, asset);
  }

  assertReconciled(accountId: string) {
    return this.d1.assertReconciled(accountId);
  }

  getBalance(accountId: string) {
    return this.d1.getBalance(accountId);
  }

  getPostings(accountId: string) {
    return this.d1.getPostings(accountId);
  }

  private assertNoTransaction(tx?: unknown): void {
    if (tx) {
      throw new BadRequestException(
        'D1 financial commands cannot participate in ORM transactions',
      );
    }
    if (!this.d1.isEnabled()) {
      throw new NotFoundException('D1 financial authority unavailable');
    }
  }
}
