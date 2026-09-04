import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DepositClaimState, Gate2ConversionQuoteState, Gate2DepositState, Gate2WithdrawalState, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { assertNonNegativeDecimal, assertPositiveDecimal, decimalProduct } from '../gate2/gate2-rules';

export interface DepositObservation {
  userId: string;
  asset: string;
  network: string;
  address: string;
  txHash: string;
  amount: string;
  confirmations: number;
  requiredConfirmations: number;
  observationKey: string;
  provider: 'deterministic-test';
}

export interface WithdrawalInput { asset: string; network: string; address: string; amount: string; idempotencyKey: string; }
export interface TransferInput { toUserId?: string; toUserCode?: number; asset: string; amount: string; idempotencyKey: string; }
export interface ConversionQuoteInput { fromAsset: string; toAsset: string; amount: string; quoteKey: string; }
export interface DepositClaimInput { asset: string; network: string; depositAddressId: string; claimedAmount: string; proofObjectKey: string; txHash?: string; idempotencyKey: string; }

@Injectable()
export class FinancialOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerAuthority: LedgerAuthorityService,
    private readonly d1?: D1FinancialCommandGateway,
  ) {}

  async observeDeposit(observation: DepositObservation): Promise<any> {
    if (observation.provider !== 'deterministic-test') throw new ServiceUnavailableException('External deposit providers are disabled in Gate 2');
    const amount = assertPositiveDecimal(observation.amount);
    if (!Number.isInteger(observation.confirmations) || observation.confirmations < 0 || !Number.isInteger(observation.requiredConfirmations) || observation.requiredConfirmations <= 0) throw new BadRequestException('Confirmation counts are invalid');
    if (this.d1?.isEnabled()) {
      if (!await this.d1.hasAssetCapability(observation.asset, observation.network, 'deposit')) throw new BadRequestException('deposit capability is unavailable');
      const deposit: any = await this.d1.upsertDepositObservation(observation);
      if (deposit.userId !== observation.userId) throw new BadRequestException('Deposit ownership mismatch');
      if (deposit.state === Gate2DepositState.CREDITED && deposit.creditPostingId) return { deposit, credited: false, providerLive: false };
      const account = await this.d1.getAccountForUser(observation.userId, observation.asset);
      const credited = await this.d1.creditDepositAtomic(String(deposit.id), 'Deposit observation reached confirmation threshold', undefined, `gate2:deposit:credit:${deposit.id}`);
      return { deposit: credited, credited: true, providerLive: false };
    }
    await this.requireCapability(observation.asset, observation.network, 'deposit');
    const existing = await this.prisma.gate2Deposit.findUnique({ where: { network_txHash_address: { network: observation.network, txHash: observation.txHash, address: observation.address } } });
    if (existing && existing.userId !== observation.userId) throw new BadRequestException('Deposit ownership mismatch');
    if (existing && existing.state === Gate2DepositState.CREDITED) return { deposit: existing, replayed: true, providerLive: false };
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockCommand(tx, `deposit:${observation.network}:${observation.txHash}:${observation.address}`);
      const current = await tx.gate2Deposit.findUnique({ where: { network_txHash_address: { network: observation.network, txHash: observation.txHash, address: observation.address } } });
      const deposit = current
        ? await tx.gate2Deposit.update({ where: { id: current.id }, data: { confirmations: Math.max(current.confirmations, observation.confirmations), state: current.state === Gate2DepositState.CREDITED ? current.state : observation.confirmations >= current.requiredConfirmations ? Gate2DepositState.CREDITED : Gate2DepositState.CONFIRMING } })
        : await tx.gate2Deposit.create({ data: { id: randomUUID(), userId: observation.userId, asset: observation.asset.toUpperCase(), network: observation.network, address: observation.address, txHash: observation.txHash, amount, confirmations: observation.confirmations, requiredConfirmations: observation.requiredConfirmations, state: observation.confirmations >= observation.requiredConfirmations ? Gate2DepositState.CREDITED : Gate2DepositState.CONFIRMING, observationKey: observation.observationKey } });
      if (deposit.userId !== observation.userId) throw new BadRequestException('Deposit ownership mismatch');
      if (deposit.state !== Gate2DepositState.CREDITED || deposit.creditPostingId) {
        await this.audit(tx, observation.userId, 'DEPOSIT', deposit.id, 'DEPOSIT_OBSERVED', observation.observationKey, { provider: 'deterministic-test', live: false, confirmations: observation.confirmations });
        return { deposit, credited: false };
      }
      const account = await this.ledgerAuthority.getAccountForUser(observation.userId, observation.asset, tx);
      const posting = await this.ledgerAuthority.credit({ accountId: account.id, asset: observation.asset, amount: deposit.amount.toString(), referenceType: 'GATE2_DEPOSIT_CREDIT', referenceId: deposit.id, idempotencyKey: `gate2:deposit:credit:${deposit.id}`, correlationId: deposit.id, economicGroup: deposit.id, metadata: { provider: 'deterministic-test', live: false } }, tx);
      const credited = await tx.gate2Deposit.update({ where: { id: deposit.id }, data: { state: Gate2DepositState.CREDITED, creditPostingId: posting.postingId, creditedAt: new Date() } });
      await this.audit(tx, observation.userId, 'DEPOSIT', deposit.id, 'DEPOSIT_CREDITED', observation.observationKey, { postingId: posting.postingId, provider: 'deterministic-test', live: false });
      return { deposit: credited, credited: true };
    });
    return { ...result, providerLive: false };
  }

  async requestWithdrawal(userId: string, input: WithdrawalInput): Promise<any> {
    this.assertIdempotencyKey(input.idempotencyKey);
    const amount = assertPositiveDecimal(input.amount);
    if (this.d1?.isEnabled()) {
      if (!await this.d1.hasAssetCapability(input.asset, input.network, 'withdraw')) throw new BadRequestException('withdraw capability is unavailable');
      const configuredFee = await this.d1.getSystemConfigValue(`gate2.withdrawal.fee.${input.asset.trim().toUpperCase()}.${input.network.trim().toUpperCase()}`);
      if (configuredFee === null) throw new ServiceUnavailableException('Withdrawal fee configuration unavailable');
      const fee = assertNonNegativeDecimal(configuredFee);
      const reservedAmount = amount.add(fee);
      const existing = await this.d1.getWithdrawal(input.idempotencyKey);
      if (existing) {
        if (String(existing.userId) !== userId) throw new BadRequestException('Withdrawal ownership mismatch');
        return { withdrawal: existing, replayed: true, providerLive: false };
      }
      const withdrawal = await this.d1.reserveWithdrawal({ userId, asset: input.asset, network: input.network, address: input.address, amount: amount.toString(), fee: fee.toString(), reservedAmount: reservedAmount.toString(), requestKey: input.idempotencyKey, reserveKey: `gate2:withdrawal:reserve:${input.idempotencyKey}`, providerState: 'DETERMINISTIC_TEST_NON_LIVE' });
      return { withdrawal, replayed: false, providerLive: false };
    }
    await this.requireCapability(input.asset, input.network, 'withdraw');
    const fee = await this.resolveNetworkFee(input.asset, input.network);
    const reservedAmount = amount.add(fee);
    const existing = await this.prisma.gate2Withdrawal.findUnique({ where: { requestKey: input.idempotencyKey } });
    if (existing) {
      if (existing.userId !== userId) throw new BadRequestException('Withdrawal ownership mismatch');
      return { withdrawal: existing, replayed: true, providerLive: false };
    }
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockCommand(tx, `withdrawal:${input.idempotencyKey}`);
      const current = await tx.gate2Withdrawal.findUnique({ where: { requestKey: input.idempotencyKey } });
      if (current) {
        if (current.userId !== userId) throw new BadRequestException('Withdrawal ownership mismatch');
        return { withdrawal: current, replayed: true };
      }
      const account = await this.ledgerAuthority.getAccountForUser(userId, input.asset, tx);
      await this.ledgerAuthority.reserve({ accountId: account.id, asset: input.asset, amount: reservedAmount.toString(), referenceType: 'GATE2_WITHDRAWAL_RESERVE', referenceId: input.idempotencyKey, idempotencyKey: `gate2:withdrawal:reserve:${input.idempotencyKey}`, correlationId: input.idempotencyKey, economicGroup: input.idempotencyKey }, tx);
      const withdrawal = await tx.gate2Withdrawal.create({ data: { id: randomUUID(), userId, asset: input.asset.toUpperCase(), network: input.network, address: input.address, amount, fee, reservedAmount, state: Gate2WithdrawalState.PENDING_REVIEW, requestKey: input.idempotencyKey, reserveKey: `gate2:withdrawal:reserve:${input.idempotencyKey}`, providerState: 'DETERMINISTIC_TEST_NON_LIVE' } });
      await this.audit(tx, userId, 'WITHDRAWAL', withdrawal.id, 'WITHDRAWAL_RESERVED', input.idempotencyKey, { providerLive: false });
      return { withdrawal, replayed: false };
    });
    return { ...result, providerLive: false };
  }

  async approveWithdrawal(requestId: string, reviewReason: string, adminId?: string, idempotencyKey?: string): Promise<any> {
    if (!reviewReason?.trim()) throw new BadRequestException('Review reason is required');
    if (this.d1?.isEnabled()) {
      const withdrawal: any = await this.d1.getWithdrawalById(requestId);
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.APPROVED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
      const key = idempotencyKey?.trim() || `approve:${requestId}`;
      const approved = await this.d1.approveWithdrawal(requestId, reviewReason, adminId ?? 'system', key);
      return { withdrawal: approved, replayed: false, providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockWithdrawal(tx, requestId);
      const withdrawal = await tx.gate2Withdrawal.findUnique({ where: { id: requestId } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.APPROVED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
      const updated = await tx.gate2Withdrawal.update({ where: { id: requestId }, data: { state: Gate2WithdrawalState.APPROVED, reviewReason, providerState: 'DETERMINISTIC_TEST_NON_LIVE' } });
      await this.audit(tx, withdrawal.userId, 'WITHDRAWAL', requestId, 'WITHDRAWAL_APPROVED', withdrawal.requestKey, { providerLive: false, reviewReason });
      if (adminId) await tx.adminAuditLog.create({ data: { adminId, action: 'WITHDRAWAL_APPROVED', target: requestId, details: { reason: reviewReason, providerLive: false } } });
      return { withdrawal: updated, providerLive: false };
    });
  }

  async rejectWithdrawal(requestId: string, reason: string, adminId?: string, idempotencyKey?: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Rejection reason is required');
    if (this.d1?.isEnabled()) {
      const withdrawal: any = await this.d1.getWithdrawalById(requestId);
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.REJECTED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
      return { withdrawal: await this.d1.releaseWithdrawal(requestId, reason, adminId ?? String(withdrawal.userId), 'REJECTED', idempotencyKey), providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockWithdrawal(tx, requestId);
      const withdrawal = await tx.gate2Withdrawal.findUnique({ where: { id: requestId } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.REJECTED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
      const account = await this.ledgerAuthority.getAccountForUser(withdrawal.userId, withdrawal.asset, tx);
      await this.ledgerAuthority.release({ accountId: account.id, asset: withdrawal.asset, amount: withdrawal.reservedAmount.toString(), referenceType: 'GATE2_WITHDRAWAL_REJECT_RELEASE', referenceId: requestId, idempotencyKey: `gate2:withdrawal:reject:${requestId}`, correlationId: requestId, economicGroup: requestId }, tx);
      const updated = await tx.gate2Withdrawal.update({ where: { id: requestId }, data: { state: Gate2WithdrawalState.REJECTED, reviewReason: reason } });
      await this.audit(tx, withdrawal.userId, 'WITHDRAWAL', requestId, 'WITHDRAWAL_REJECTED', withdrawal.requestKey, { reason });
      if (adminId) await tx.adminAuditLog.create({ data: { adminId, action: 'WITHDRAWAL_REJECTED', target: requestId, details: { reason } } });
      return { withdrawal: updated, providerLive: false };
    });
  }

  async requestWithdrawalReview(requestId: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Review reason is required');
    if (this.d1?.isEnabled()) {
      const withdrawal = await this.d1.getWithdrawalById(requestId);
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) throw new BadRequestException('Withdrawal is not pending review');
      return { withdrawal, replayed: false, providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockWithdrawal(tx, requestId);
      const withdrawal = await tx.gate2Withdrawal.findUnique({ where: { id: requestId } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW) {
        throw new BadRequestException('Withdrawal is not pending review');
      }
      await this.audit(tx, withdrawal.userId, 'WITHDRAWAL', requestId, 'WITHDRAWAL_REVIEW_REQUESTED', idempotencyKey, { reason, adminId });
      await tx.adminAuditLog.create({
        data: { adminId, action: 'WITHDRAWAL_REVIEW_REQUESTED', target: requestId, details: { reason, idempotencyKey } },
      });
      return { withdrawal, replayed: false, providerLive: false };
    });
  }

  async failWithdrawal(requestId: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Failure reason is required');
    if (this.d1?.isEnabled()) {
      const withdrawal: any = await this.d1.getWithdrawalById(requestId);
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.FAILED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state === Gate2WithdrawalState.SETTLED) throw new BadRequestException('Settled withdrawal cannot fail');
      return { withdrawal: await this.d1.releaseWithdrawal(requestId, reason, adminId, 'FAILED'), replayed: false, providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockWithdrawal(tx, requestId);
      const withdrawal = await tx.gate2Withdrawal.findUnique({ where: { id: requestId } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.FAILED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state === Gate2WithdrawalState.SETTLED) throw new BadRequestException('Settled withdrawal cannot fail');
      if (withdrawal.state !== Gate2WithdrawalState.PENDING_REVIEW && withdrawal.state !== Gate2WithdrawalState.APPROVED) {
        throw new BadRequestException('Withdrawal cannot be marked failed from its current state');
      }
      const account = await this.ledgerAuthority.getAccountForUser(withdrawal.userId, withdrawal.asset, tx);
      await this.ledgerAuthority.release({
        accountId: account.id,
        asset: withdrawal.asset,
        amount: withdrawal.reservedAmount.toString(),
        referenceType: 'GATE2_WITHDRAWAL_FAILED_RELEASE',
        referenceId: requestId,
        idempotencyKey: `gate2:withdrawal:failed:${requestId}`,
        correlationId: requestId,
        economicGroup: requestId,
      }, tx);
      const updated = await tx.gate2Withdrawal.update({ where: { id: requestId }, data: { state: Gate2WithdrawalState.FAILED, reviewReason: reason } });
      await this.audit(tx, withdrawal.userId, 'WITHDRAWAL', requestId, 'WITHDRAWAL_FAILED', idempotencyKey, { reason, adminId });
      await tx.adminAuditLog.create({ data: { adminId, action: 'WITHDRAWAL_FAILED', target: requestId, details: { reason, idempotencyKey } } });
      return { withdrawal: updated, replayed: false, providerLive: false };
    });
  }

  async confirmDeposit(requestId: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Confirmation reason is required');
    if (this.d1?.isEnabled()) {
      const deposit: any = await this.d1.getDeposit(requestId);
      if (!deposit) throw new NotFoundException('Deposit not found');
      if (deposit.state === Gate2DepositState.CREDITED) return { deposit, replayed: true, providerLive: false };
      if (deposit.state === Gate2DepositState.REJECTED) throw new BadRequestException('Rejected deposit cannot be confirmed');
      return { deposit: await this.d1.creditDepositAtomic(requestId, reason, adminId, `gate2:deposit:credit:${requestId}`), replayed: false, providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockDeposit(tx, requestId);
      const deposit = await tx.gate2Deposit.findUnique({ where: { id: requestId } });
      if (!deposit) throw new NotFoundException('Deposit not found');
      if (deposit.state === Gate2DepositState.CREDITED) return { deposit, replayed: true, providerLive: false };
      if (deposit.state === Gate2DepositState.REJECTED) throw new BadRequestException('Rejected deposit cannot be confirmed');
      const confirmed = await tx.gate2Deposit.update({
        where: { id: requestId },
        data: { confirmations: Math.max(deposit.confirmations, deposit.requiredConfirmations), state: Gate2DepositState.CONFIRMING },
      });
      return this.creditDepositInTransaction(tx, confirmed, reason, adminId, idempotencyKey);
    });
  }

  async creditDeposit(requestId: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Credit reason is required');
    if (this.d1?.isEnabled()) {
      const deposit: any = await this.d1.getDeposit(requestId);
      if (!deposit) throw new NotFoundException('Deposit not found');
      if (deposit.state === Gate2DepositState.CREDITED) return { deposit, replayed: true, providerLive: false };
      if (Number(deposit.confirmations) < Number(deposit.requiredConfirmations)) throw new BadRequestException('Deposit confirmation threshold has not been reached');
      return { deposit: await this.d1.creditDepositAtomic(requestId, reason, adminId, `gate2:deposit:credit:${requestId}`), replayed: false, providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockDeposit(tx, requestId);
      const deposit = await tx.gate2Deposit.findUnique({ where: { id: requestId } });
      if (!deposit) throw new NotFoundException('Deposit not found');
      if (deposit.state === Gate2DepositState.CREDITED) return { deposit, replayed: true, providerLive: false };
      if (deposit.confirmations < deposit.requiredConfirmations) throw new BadRequestException('Deposit confirmation threshold has not been reached');
      return this.creditDepositInTransaction(tx, deposit, reason, adminId, idempotencyKey);
    });
  }

  async failDeposit(requestId: string, reason: string, adminId: string, idempotencyKey: string): Promise<any> {
    if (!reason?.trim()) throw new BadRequestException('Failure reason is required');
    if (this.d1?.isEnabled()) {
      const deposit: any = await this.d1.getDeposit(requestId);
      if (!deposit) throw new NotFoundException('Deposit not found');
      if (deposit.state === Gate2DepositState.REJECTED) return { deposit, replayed: true, providerLive: false };
      if (deposit.state === Gate2DepositState.CREDITED) throw new BadRequestException('Credited deposit cannot be rejected');
      return { deposit: await this.d1.rejectDepositAtomic(requestId, reason, adminId, idempotencyKey), replayed: false, providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockDeposit(tx, requestId);
      const deposit = await tx.gate2Deposit.findUnique({ where: { id: requestId } });
      if (!deposit) throw new NotFoundException('Deposit not found');
      if (deposit.state === Gate2DepositState.REJECTED) return { deposit, replayed: true, providerLive: false };
      if (deposit.state === Gate2DepositState.CREDITED) throw new BadRequestException('Credited deposit cannot be rejected');
      const failed = await tx.gate2Deposit.update({ where: { id: requestId }, data: { state: Gate2DepositState.REJECTED } });
      await this.audit(tx, deposit.userId, 'DEPOSIT', requestId, 'DEPOSIT_REJECTED', idempotencyKey, { reason, adminId });
      await tx.adminAuditLog.create({ data: { adminId, action: 'DEPOSIT_REJECTED', target: requestId, details: { reason, idempotencyKey } } });
      return { deposit: failed, replayed: false, providerLive: false };
    });
  }

  private async creditDepositInTransaction(tx: any, deposit: any, reason: string, adminId: string, idempotencyKey: string) {
    if (deposit.creditPostingId || deposit.state === Gate2DepositState.CREDITED) return { deposit, replayed: true, providerLive: false };
    const account = await this.ledgerAuthority.getAccountForUser(deposit.userId, deposit.asset, tx);
    const posting = await this.ledgerAuthority.credit({
      accountId: account.id,
      asset: deposit.asset,
      amount: deposit.amount.toString(),
      referenceType: 'GATE2_DEPOSIT_CREDIT',
      referenceId: deposit.id,
      idempotencyKey: `gate2:deposit:credit:${deposit.id}`,
      correlationId: deposit.id,
      economicGroup: deposit.id,
      metadata: { provider: 'admin-deterministic-control', providerLive: false, reason, adminId },
    }, tx);
    const credited = await tx.gate2Deposit.update({ where: { id: deposit.id }, data: { state: Gate2DepositState.CREDITED, creditPostingId: posting.postingId, creditedAt: new Date() } });
    await this.audit(tx, deposit.userId, 'DEPOSIT', deposit.id, 'DEPOSIT_CREDITED', idempotencyKey, { postingId: posting.postingId, reason, adminId, providerLive: false });
    await tx.adminAuditLog.create({ data: { adminId, action: 'DEPOSIT_CREDITED', target: deposit.id, details: { postingId: posting.postingId, reason, idempotencyKey, providerLive: false } } });
    return { deposit: credited, replayed: false, providerLive: false };
  }

  async settleWithdrawal(requestId: string, providerReceipt?: string, adminId?: string, reason?: string): Promise<any> {
    if (adminId && !reason?.trim()) throw new BadRequestException('Settlement reason is required');
    if (!providerReceipt || !providerReceipt.startsWith('deterministic:')) return { state: 'UNAVAILABLE', providerLive: false, reason: 'External provider disabled; no broadcast performed' };
    if (this.d1?.isEnabled()) {
      const withdrawal: any = await this.d1.getWithdrawalById(requestId);
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.SETTLED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state !== Gate2WithdrawalState.APPROVED) throw new BadRequestException('Withdrawal is not approved');
      return { withdrawal: await this.d1.settleWithdrawalAtomic(requestId, providerReceipt, adminId, reason), replayed: false, providerLive: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockWithdrawal(tx, requestId);
      const withdrawal = await tx.gate2Withdrawal.findUnique({ where: { id: requestId } });
      if (!withdrawal) throw new NotFoundException('Withdrawal not found');
      if (withdrawal.state === Gate2WithdrawalState.SETTLED) return { withdrawal, replayed: true, providerLive: false };
      if (withdrawal.state !== Gate2WithdrawalState.APPROVED) throw new BadRequestException('Withdrawal is not approved');
      const account = await this.ledgerAuthority.getAccountForUser(withdrawal.userId, withdrawal.asset, tx);
      await this.ledgerAuthority.settle({ accountId: account.id, asset: withdrawal.asset, amount: withdrawal.reservedAmount.toString(), referenceType: 'GATE2_WITHDRAWAL_SETTLEMENT', referenceId: requestId, idempotencyKey: `gate2:withdrawal:settle:${requestId}`, correlationId: requestId, economicGroup: requestId, metadata: { providerReceipt, providerLive: false } }, tx);
      const updated = await tx.gate2Withdrawal.update({ where: { id: requestId }, data: { state: Gate2WithdrawalState.SETTLED, txHash: providerReceipt, providerState: 'DETERMINISTIC_TEST_NON_LIVE' } });
      await this.audit(tx, withdrawal.userId, 'WITHDRAWAL', requestId, 'WITHDRAWAL_SETTLED', withdrawal.requestKey, { providerReceipt, providerLive: false });
      if (adminId) await tx.adminAuditLog.create({ data: { adminId, action: 'WITHDRAWAL_SETTLED', target: requestId, details: { providerReceipt, providerLive: false, reason } } });
      return { withdrawal: updated, replayed: false, providerLive: false };
    });
  }

  async transfer(userId: string, input: TransferInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    let toUserId = input.toUserId?.trim();
    if (!toUserId && input.toUserCode !== undefined) {
      const recipient = this.d1?.isEnabled()
        ? await this.d1.getUserByUserCode(input.toUserCode)
        : await this.prisma.user.findUnique({ where: { userCode: input.toUserCode }, select: { id: true } });
      toUserId = recipient?.id ? String(recipient.id) : undefined;
    }
    if (!toUserId) throw new NotFoundException('Transfer recipient not found');
    if (userId === toUserId) throw new BadRequestException('Internal transfer accounts must differ');
    const amount = assertPositiveDecimal(input.amount);
    if (this.d1?.isEnabled()) {
      const d1Existing = await this.d1.getInternalTransfer(input.idempotencyKey);
      if (d1Existing) {
        if (d1Existing.fromUserId !== userId) throw new BadRequestException('Transfer ownership mismatch');
        return { transfer: d1Existing, replayed: true };
      }
    }
    const existing = this.d1?.isEnabled() ? null : await this.prisma.gate2InternalTransfer.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.fromUserId !== userId) throw new BadRequestException('Transfer ownership mismatch');
      return { transfer: existing, replayed: true };
    }
    if (this.d1?.isEnabled()) {
      const [from, to] = await Promise.all([this.d1.getUserById(userId), this.d1.getUserById(toUserId)]);
      if (!from || !to) throw new NotFoundException('Transfer user not found');
      const debit = await this.d1.getAccountForUser(userId, input.asset);
      const credit = await this.d1.getAccountForUser(toUserId, input.asset);
      const postings = await this.d1.pairedTransfer({
        debitAccountId: debit.id,
        creditAccountId: credit.id,
        asset: input.asset,
        amount: amount.toString(),
        referenceType: 'GATE2_INTERNAL_TRANSFER',
        referenceId: input.idempotencyKey,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.idempotencyKey,
        economicGroup: input.idempotencyKey,
        internalTransfer: { transferId: randomUUID(), fromUserId: userId, toUserId: toUserId },
      });
      const transfer = await this.d1.getInternalTransfer(input.idempotencyKey);
      if (!transfer) throw new ServiceUnavailableException('D1 transfer record was not materialized');
      return { transfer, postings, replayed: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockCommand(tx, `transfer:${input.idempotencyKey}`);
      const current = await tx.gate2InternalTransfer.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (current) {
        if (current.fromUserId !== userId) throw new BadRequestException('Transfer ownership mismatch');
        return { transfer: current, replayed: true };
      }
      const [from, to] = await Promise.all([tx.user.findUnique({ where: { id: userId }, select: { id: true } }), tx.user.findUnique({ where: { id: toUserId }, select: { id: true } })]);
      if (!from || !to) throw new NotFoundException('Transfer user not found');
      const debit = await this.ledgerAuthority.getAccountForUser(userId, input.asset, tx);
      const credit = await this.ledgerAuthority.getAccountForUser(toUserId, input.asset, tx);
      const postings = await this.ledgerAuthority.pairedTransfer({ debitAccountId: debit.id, creditAccountId: credit.id, asset: input.asset, amount: amount.toString(), referenceType: 'GATE2_INTERNAL_TRANSFER', referenceId: input.idempotencyKey, idempotencyKey: `gate2:transfer:${input.idempotencyKey}`, correlationId: input.idempotencyKey, economicGroup: input.idempotencyKey }, tx);
      const transfer = await tx.gate2InternalTransfer.create({ data: { id: randomUUID(), fromUserId: userId, toUserId: toUserId, asset: input.asset.toUpperCase(), amount, idempotencyKey: input.idempotencyKey, debitPostingId: postings.debitPostingId, creditPostingId: postings.creditPostingId } });
      await this.audit(tx, userId, 'TRANSFER', transfer.id, 'TRANSFER_PAIRED', input.idempotencyKey, { debitPostingId: postings.debitPostingId, creditPostingId: postings.creditPostingId, toUserId: toUserId });
      await this.audit(tx, toUserId, 'TRANSFER', transfer.id, 'TRANSFER_RECEIVED', input.idempotencyKey, { debitPostingId: postings.debitPostingId, creditPostingId: postings.creditPostingId, fromUserId: userId });
      return { transfer, replayed: false };
    });
  }

  async createConversionQuote(userId: string, input: ConversionQuoteInput) {
    this.assertIdempotencyKey(input.quoteKey);
    const amount = assertPositiveDecimal(input.amount);
    const fromAsset = input.fromAsset.trim().toUpperCase();
    const toAsset = input.toAsset.trim().toUpperCase();
    if (fromAsset === toAsset) throw new BadRequestException('Conversion assets must differ');
    if (this.d1?.isEnabled()) {
      const existing = await this.d1.getConversionQuoteByKey(input.quoteKey);
      if (existing) {
        if (String(existing.userId) !== userId) throw new BadRequestException('Conversion quote ownership mismatch');
        return { quote: existing, replayed: true };
      }
      const rateKey = `gate2.conversion.rate.${fromAsset}.${toAsset}`;
      const configuredRate = await this.d1.getSystemConfigValue(rateKey);
      if (configuredRate === null) throw new ServiceUnavailableException('Conversion rate unavailable');
      const rate = assertPositiveDecimal(configuredRate);
      const outputAmount = decimalProduct(amount, rate);
      const expiresAt = new Date(Date.now() + Number(process.env.NEXI_CONVERSION_QUOTE_TTL_MS ?? 30_000));
      const quote = await this.d1.createConversionQuote({
        id: randomUUID(), userId, fromAsset, toAsset, inputAmount: amount.toString(), rate: rate.toString(),
        outputAmount: outputAmount.toString(), provider: 'backend-config', source: rateKey, evidenceId: rateKey,
        configurationVersion: 1, expiresAt: expiresAt.toISOString(), quoteKey: input.quoteKey,
      });
      return { quote, replayed: false };
    }
    const existing = await this.prisma.gate2ConversionQuote.findUnique({ where: { quoteKey: input.quoteKey } });
    if (existing) {
      if (existing.userId !== userId) throw new BadRequestException('Conversion quote ownership mismatch');
      return { quote: existing, replayed: true };
    }
    const rateConfig = await this.prisma.systemConfig.findUnique({ where: { key: `gate2.conversion.rate.${fromAsset}.${toAsset}` } });
    if (!rateConfig) throw new ServiceUnavailableException('Conversion rate unavailable');
    const rate = assertPositiveDecimal(rateConfig.value);
    const outputAmount = decimalProduct(amount, rate);
    const expiresAt = new Date(Date.now() + Number(process.env.NEXI_CONVERSION_QUOTE_TTL_MS ?? 30_000));
    return this.prisma.$transaction(async (tx) => {
      await this.lockCommand(tx, `conversion-quote:${input.quoteKey}`);
      const current = await tx.gate2ConversionQuote.findUnique({ where: { quoteKey: input.quoteKey } });
      if (current) {
        if (current.userId !== userId) throw new BadRequestException('Conversion quote ownership mismatch');
        return { quote: current, replayed: true };
      }
      const quote = await tx.gate2ConversionQuote.create({ data: { id: randomUUID(), userId, fromAsset, toAsset, inputAmount: amount, rate, outputAmount, provider: 'backend-config', source: rateConfig.key, evidenceId: rateConfig.key, configurationVersion: 1, expiresAt, state: Gate2ConversionQuoteState.OPEN, quoteKey: input.quoteKey } });
      return { quote, replayed: false };
    });
  }

  async acceptConversion(userId: string, quoteId: string, acceptanceKey: string) {
    this.assertIdempotencyKey(acceptanceKey);
    if (this.d1?.isEnabled()) {
      const quote: any = await this.d1.getConversionQuoteById(quoteId);
      if (!quote) throw new NotFoundException('Conversion quote not found');
      if (String(quote.userId) !== userId) throw new BadRequestException('Conversion quote ownership mismatch');
      if (String(quote.state) === Gate2ConversionQuoteState.ACCEPTED) {
        if (String(quote.acceptanceKey) !== acceptanceKey) throw new BadRequestException('Conversion quote already accepted');
        return { quote, replayed: true };
      }
      if (String(quote.state) !== Gate2ConversionQuoteState.OPEN) throw new BadRequestException('Conversion quote is not open');
      if (new Date(String(quote.expiresAt)).getTime() <= Date.now()) {
        await this.d1.expireConversionQuote(quoteId, userId);
        throw new BadRequestException('Conversion quote expired');
      }
      const accepted = await this.d1.acceptConversion({
        quoteId, userId, acceptanceKey, fromAsset: String(quote.fromAsset), toAsset: String(quote.toAsset),
        inputAmount: String(quote.inputAmount), outputAmount: String(quote.outputAmount),
      });
      return { quote: accepted, replayed: false };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockCommand(tx, `conversion-accept:${quoteId}`);
      const quote = await tx.gate2ConversionQuote.findUnique({ where: { id: quoteId } });
      if (!quote) throw new NotFoundException('Conversion quote not found');
      if (quote.userId !== userId) throw new BadRequestException('Conversion quote ownership mismatch');
      if (quote.state === Gate2ConversionQuoteState.ACCEPTED) {
        if (quote.acceptanceKey !== acceptanceKey) throw new BadRequestException('Conversion quote already accepted');
        return { quote, replayed: true };
      }
      if (quote.state !== Gate2ConversionQuoteState.OPEN) throw new BadRequestException('Conversion quote is not open');
      if (quote.expiresAt.getTime() <= Date.now()) {
        await tx.gate2ConversionQuote.update({ where: { id: quote.id }, data: { state: Gate2ConversionQuoteState.EXPIRED } });
        throw new BadRequestException('Conversion quote expired');
      }
      const from = await this.ledgerAuthority.getAccountForUser(userId, quote.fromAsset, tx);
      const to = await this.ledgerAuthority.getAccountForUser(userId, quote.toAsset, tx);
      const reference = `gate2:conversion:${quote.id}`;
      await this.ledgerAuthority.debit({ accountId: from.id, asset: quote.fromAsset, amount: quote.inputAmount.toString(), referenceType: 'GATE2_CONVERSION_DEBIT', referenceId: quote.id, idempotencyKey: `${reference}:debit`, correlationId: reference, economicGroup: reference }, tx);
      await this.ledgerAuthority.credit({ accountId: to.id, asset: quote.toAsset, amount: quote.outputAmount.toString(), referenceType: 'GATE2_CONVERSION_CREDIT', referenceId: quote.id, idempotencyKey: `${reference}:credit`, correlationId: reference, economicGroup: reference, metadata: { rate: quote.rate.toString(), evidenceId: quote.evidenceId } }, tx);
      const accepted = await tx.gate2ConversionQuote.update({ where: { id: quote.id }, data: { state: Gate2ConversionQuoteState.ACCEPTED, acceptanceKey, conversionRef: reference } });
      await this.audit(tx, userId, 'CONVERSION', quote.id, 'CONVERSION_SETTLED', acceptanceKey, { input: quote.inputAmount.toString(), output: quote.outputAmount.toString(), rate: quote.rate.toString(), evidenceId: quote.evidenceId });
      return { quote: accepted, replayed: false };
    });
  }

  async getDepositDestinations() {
    if (this.d1?.isEnabled()) return this.d1.listDepositDestinations();
    return this.prisma.depositAddress.findMany({
      where: { isActive: true, currency: { isActive: true, depositEnabled: true } },
      include: { currency: true },
      orderBy: [{ currency: { symbol: 'asc' } }, { network: 'asc' }],
    }).then((rows) => rows.map((row) => ({
      asset: row.currency.symbol,
      assetName: row.currency.name,
      network: row.network,
      depositAddressId: row.id,
      address: row.address,
      label: row.label,
      minDeposit: row.currency.minDeposit,
      confirmationCount: row.currency.confirmationCount,
      decimals: row.currency.decimals,
    })));
  }

  createDepositProofIntent(userId: string, contentType: string, byteSize: string) {
    const size = Number(byteSize);
    if (!/^image\/(png|jpeg|webp|gif)$/.test(contentType) || !Number.isSafeInteger(size) || size <= 0 || size > 10 * 1024 * 1024) {
      throw new BadRequestException('Deposit proof must be an image no larger than 10MB');
    }
    const key = `deposit-proofs/${userId}/${randomUUID()}`;
    return { key, uploadPath: `/storage/deposit-proof?key=${encodeURIComponent(key)}`, contentType, maxBytes: 10 * 1024 * 1024 };
  }

  authorizeDepositProofUpload(userId: string, key: string) {
    const valid = new RegExp(`^deposit-proofs/${userId}/[0-9a-f-]{36}$`).test(key);
    if (!valid) throw new BadRequestException('Deposit proof key is invalid');
    return { authorized: true, key };
  }

  async submitDepositClaim(userId: string, input: DepositClaimInput) {
    this.assertIdempotencyKey(input.idempotencyKey);
    const amount = assertPositiveDecimal(input.claimedAmount);
    if (!input.proofObjectKey.trim()) throw new BadRequestException('Deposit proof is required');
    if (this.d1?.isEnabled()) {
      const claim: any = await this.d1.submitDepositClaim({ id: randomUUID(), userId, asset: input.asset, network: input.network, depositAddressId: input.depositAddressId, claimedAmount: amount.toString(), proofObjectKey: input.proofObjectKey.trim(), txHash: input.txHash?.trim(), idempotencyKey: input.idempotencyKey });
      return { depositRequestId: claim.id, status: claim.state, claim, replayed: false };
    }
    const existing = await this.prisma.depositClaim.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) {
      if (existing.userId !== userId) throw new BadRequestException('Deposit claim ownership mismatch');
      return { depositRequestId: existing.id, status: existing.state, claim: existing, replayed: true };
    }
    return this.prisma.$transaction(async (tx) => {
      await this.lockCommand(tx, `deposit-claim:${input.idempotencyKey}`);
      const address = await tx.depositAddress.findFirst({
        where: { id: input.depositAddressId, network: input.network, isActive: true, currency: { symbol: input.asset.trim().toUpperCase(), isActive: true, depositEnabled: true } },
        include: { currency: true },
      });
      if (!address) throw new BadRequestException('Deposit destination is unavailable');
      const current = await tx.depositClaim.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (current) return { depositRequestId: current.id, status: current.state, claim: current, replayed: true };
      const claim = await tx.depositClaim.create({ data: {
        userId,
        asset: address.currency.symbol,
        network: address.network,
        depositAddressId: address.id,
        destinationAddressSnapshot: address.address,
        claimedAmount: amount,
        proofObjectKey: input.proofObjectKey.trim(),
        txHash: input.txHash?.trim() || undefined,
        idempotencyKey: input.idempotencyKey,
        state: DepositClaimState.PENDING_REVIEW,
      }});
      await this.audit(tx, userId, 'DEPOSIT_CLAIM', claim.id, 'DEPOSIT_CLAIM_SUBMITTED', input.idempotencyKey, { asset: claim.asset, network: claim.network });
      return { depositRequestId: claim.id, status: claim.state, claim, replayed: false };
    });
  }

  async getDepositClaims(userId: string) {
    return this.d1?.isEnabled() ? this.d1.listDepositClaims(userId) : this.prisma.depositClaim.findMany({ where: { userId }, orderBy: { submittedAt: 'desc' } });
  }

  async getAdminDepositClaims() {
    return this.d1?.isEnabled() ? this.d1.listDepositClaims() : this.prisma.depositClaim.findMany({ orderBy: { submittedAt: 'desc' }, take: 500 });
  }

  async confirmDepositClaim(id: string, reason: string, adminId: string, idempotencyKey: string) {
    if (!reason?.trim()) throw new BadRequestException('Confirmation reason is required');
    if (this.d1?.isEnabled()) return { claim: await this.d1.updateDepositClaimState(id, DepositClaimState.APPROVED, adminId, reason, idempotencyKey), replayed: false };
    return this.prisma.$transaction(async (tx) => {
      await this.lockDepositClaim(tx, id);
      const claim = await tx.depositClaim.findUnique({ where: { id } });
      if (!claim) throw new NotFoundException('Deposit claim not found');
      if (claim.state === DepositClaimState.APPROVED || claim.state === DepositClaimState.CREDITED) return { claim, replayed: true };
      if (claim.state !== DepositClaimState.PENDING_REVIEW) throw new BadRequestException('Deposit claim is not pending review');
      const updated = await tx.depositClaim.update({ where: { id }, data: { state: DepositClaimState.APPROVED, reviewedAt: new Date(), reviewedBy: adminId, reviewReason: reason } });
      await tx.adminAuditLog.create({ data: { adminId, action: 'DEPOSIT_CLAIM_APPROVED', target: id, details: { reason, idempotencyKey } } });
      return { claim: updated, replayed: false };
    });
  }

  async creditDepositClaim(id: string, reason: string, adminId: string, idempotencyKey: string) {
    if (!reason?.trim()) throw new BadRequestException('Credit reason is required');
    if (this.d1?.isEnabled()) return { claim: await this.d1.creditDepositClaim(id, adminId, reason, idempotencyKey), replayed: false };
    return this.prisma.$transaction(async (tx) => {
      await this.lockDepositClaim(tx, id);
      const claim = await tx.depositClaim.findUnique({ where: { id } });
      if (!claim) throw new NotFoundException('Deposit claim not found');
      if (claim.state === DepositClaimState.CREDITED) return { claim, replayed: true };
      if (claim.state !== DepositClaimState.APPROVED) throw new BadRequestException('Deposit claim must be approved before credit');
      const account = await this.ledgerAuthority.getAccountForUser(claim.userId, claim.asset, tx);
      const posting = await this.ledgerAuthority.credit({ accountId: account.id, asset: claim.asset, amount: claim.claimedAmount.toString(), referenceType: 'MANUAL_DEPOSIT_CLAIM_CREDIT', referenceId: claim.id, idempotencyKey: `deposit-claim:credit:${claim.id}`, correlationId: claim.id, economicGroup: claim.id, metadata: { adminId, reason } }, tx);
      const credited = await tx.depositClaim.update({ where: { id }, data: { state: DepositClaimState.CREDITED, creditedLedgerPostingId: posting.postingId, reviewedAt: claim.reviewedAt ?? new Date(), reviewedBy: claim.reviewedBy ?? adminId, reviewReason: claim.reviewReason ?? reason } });
      await tx.activity.create({ data: { userId: claim.userId, type: 'DEPOSIT_CLAIM', status: 'COMPLETED', referenceType: 'MANUAL_DEPOSIT_CLAIM', referenceId: claim.id, idempotencyKey: `activity:deposit-claim:${claim.id}`, ledgerCorrelationId: claim.id, ledgerPostingId: posting.postingId, asset: claim.asset, amount: claim.claimedAmount, details: { network: claim.network, adminId } } });
      await tx.adminAuditLog.create({ data: { adminId, action: 'DEPOSIT_CLAIM_CREDITED', target: id, details: { reason, idempotencyKey, postingId: posting.postingId } } });
      return { claim: credited, postingId: posting.postingId, replayed: false };
    });
  }

  async rejectDepositClaim(id: string, reason: string, adminId: string, idempotencyKey: string) {
    if (!reason?.trim()) throw new BadRequestException('Rejection reason is required');
    if (this.d1?.isEnabled()) return { claim: await this.d1.updateDepositClaimState(id, DepositClaimState.REJECTED, adminId, reason, idempotencyKey), replayed: false };
    return this.prisma.$transaction(async (tx) => {
      await this.lockDepositClaim(tx, id);
      const claim = await tx.depositClaim.findUnique({ where: { id } });
      if (!claim) throw new NotFoundException('Deposit claim not found');
      if (claim.state === DepositClaimState.REJECTED) return { claim, replayed: true };
      if (claim.state !== DepositClaimState.PENDING_REVIEW && claim.state !== DepositClaimState.APPROVED) throw new BadRequestException('Deposit claim cannot be rejected from its current state');
      const rejected = await tx.depositClaim.update({ where: { id }, data: { state: DepositClaimState.REJECTED, reviewedAt: new Date(), reviewedBy: adminId, reviewReason: reason } });
      await tx.adminAuditLog.create({ data: { adminId, action: 'DEPOSIT_CLAIM_REJECTED', target: id, details: { reason, idempotencyKey } } });
      return { claim: rejected, replayed: false };
    });
  }

  async getDeposits(userId: string) { return this.d1?.isEnabled() ? this.d1.listDeposits(userId) : this.prisma.gate2Deposit.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  async getWithdrawals(userId: string) { return this.d1?.isEnabled() ? this.d1.listWithdrawals(userId) : this.prisma.gate2Withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }
  async getTransfers(userId: string) { return this.d1?.isEnabled() ? this.d1.listInternalTransfers(userId) : this.prisma.gate2InternalTransfer.findMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] }, orderBy: { createdAt: 'desc' } }); }

  private async requireCapability(asset: string, network: string, operation: 'deposit' | 'withdraw') {
    const marketAsset = await this.prisma.marketAsset.findUnique({ where: { symbol: asset.trim().toUpperCase() } });
    if (!marketAsset || marketAsset.status !== 'ACTIVE') throw new BadRequestException('Asset is unavailable');
    const marketNetwork = await this.prisma.marketNetwork.findFirst({ where: { assetId: marketAsset.id, code: network.trim().toUpperCase() } });
    if (!marketNetwork || marketNetwork.status !== 'ACTIVE') throw new BadRequestException('Network is unavailable');
    const capability = await this.prisma.marketAssetCapability.findFirst({ where: { assetId: marketAsset.id, networkId: marketNetwork.id, status: 'ACTIVE', ...(operation === 'deposit' ? { depositEnabled: true } : { withdrawEnabled: true }) } });
    if (!capability) throw new BadRequestException(`${operation} capability is unavailable`);
    return { marketAsset, marketNetwork, capability };
  }

  private async resolveNetworkFee(asset: string, network: string): Promise<Prisma.Decimal> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key: `gate2.withdrawal.fee.${asset.trim().toUpperCase()}.${network.trim().toUpperCase()}` } });
    if (!config) throw new ServiceUnavailableException('Withdrawal fee configuration unavailable');
    return assertNonNegativeDecimal(config.value);
  }

  private async audit(tx: any, userId: string, operationType: string, operationId: string, eventType: string, idempotencyKey: string, details: Record<string, unknown>) {
    await tx.gate2OperationAudit.create({ data: { id: randomUUID(), userId, operationType, operationId, eventType, idempotencyKey, details } });
  }

  private async lockCommand(tx: any, key: string): Promise<void> {
    if (tx.$executeRaw) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  private async lockWithdrawal(tx: any, requestId: string): Promise<void> {
    if (tx.$queryRaw) await tx.$queryRaw`SELECT "id" FROM "Gate2Withdrawal" WHERE "id" = ${requestId} FOR UPDATE`;
  }

  private async lockDeposit(tx: any, requestId: string): Promise<void> {
    if (tx.$queryRaw) await tx.$queryRaw`SELECT "id" FROM "Gate2Deposit" WHERE "id" = ${requestId} FOR UPDATE`;
  }

  private async lockDepositClaim(tx: any, requestId: string): Promise<void> {
    if (tx.$queryRaw) await tx.$queryRaw`SELECT "id" FROM "DepositClaim" WHERE "id" = ${requestId} FOR UPDATE`;
  }

  private assertIdempotencyKey(key: string): void {
    if (!key || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new BadRequestException('Idempotency key is invalid');
  }
}
