import { FinancialOperationsService } from '../../src/financial/financial-operations.service';

describe('Gate 2 financial operations', () => {
  function createService() {
    const withdrawal = { id: 'withdrawal-1', userId: 'user-1', asset: 'USDT', amount: '10', fee: '0.2', reservedAmount: '10.2', state: 'PENDING_REVIEW' };
    const transfer = { id: 'transfer-1', fromUserId: 'user-1', toUserId: 'user-2', asset: 'USDT', amount: '5', debitPostingId: 'debit-1', creditPostingId: 'credit-1' };
    const quote = { id: 'quote-1', userId: 'user-1', fromAsset: 'USDT', toAsset: 'BTC', inputAmount: '10', rate: '0.000025', outputAmount: '0.00025', state: 'OPEN', expiresAt: new Date(Date.now() + 30_000) };
    const tx = {
      gate2Withdrawal: { create: jest.fn().mockResolvedValue(withdrawal), findUnique: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue({ ...withdrawal, state: 'REJECTED' }) },
      gate2OperationAudit: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
      gate2InternalTransfer: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(transfer) },
      gate2ConversionQuote: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(quote) },
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-2' }) },
    };
    const prisma = {
      marketAsset: { findUnique: jest.fn().mockResolvedValue({ id: 'asset-usdt', status: 'ACTIVE' }) },
      marketNetwork: { findFirst: jest.fn().mockResolvedValue({ id: 'network-1', status: 'ACTIVE' }) },
      marketAssetCapability: { findFirst: jest.fn().mockResolvedValue({ id: 'cap-1' }) },
      systemConfig: { findUnique: jest.fn().mockImplementation(({ where }: any) => where.key.startsWith('gate2.withdrawal.fee') ? { key: where.key, value: '0.2' } : { key: where.key, value: '0.000025' }) },
      gate2Withdrawal: { findUnique: jest.fn().mockResolvedValue(null) },
      gate2InternalTransfer: { findUnique: jest.fn().mockResolvedValue(null) },
      gate2ConversionQuote: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback: (client: unknown) => unknown) => callback(tx)),
    };
    const ledger = {
      getAccountForUser: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
      reserve: jest.fn().mockResolvedValue({ postingId: 'reserve-1' }),
      pairedTransfer: jest.fn().mockResolvedValue({ debitPostingId: 'debit-1', creditPostingId: 'credit-1' }),
    };
    return { service: new FinancialOperationsService(prisma as any, ledger as any), prisma, ledger, tx, withdrawal, transfer, quote };
  }

  it('reserves a configured withdrawal fee atomically before review', async () => {
    const { service, ledger, tx } = createService();
    const result = await service.requestWithdrawal('user-1', { asset: 'USDT', network: 'TRC20', address: 'T-address', amount: '10', idempotencyKey: 'withdraw-key-1' });
    expect(ledger.reserve).toHaveBeenCalledWith(expect.objectContaining({ amount: '10.2', referenceType: 'GATE2_WITHDRAWAL_RESERVE' }), tx);
    expect(result.providerLive).toBe(false);
    expect(tx.gate2Withdrawal.create).toHaveBeenCalled();
  });

  it('keeps provider-disabled settlement explicit and performs no broadcast', async () => {
    const { service } = createService();
    await expect(service.settleWithdrawal('withdrawal-1')).resolves.toEqual(expect.objectContaining({ state: 'UNAVAILABLE', providerLive: false }));
  });

  it('creates an exact conversion quote from backend rate evidence', async () => {
    const { service, tx } = createService();
    const result = await service.createConversionQuote('user-1', { fromAsset: 'USDT', toAsset: 'BTC', amount: '10', quoteKey: 'quote-key-1' });
    expect(result.replayed).toBe(false);
    const created = tx.gate2ConversionQuote.create.mock.calls[0][0].data;
    expect(created.inputAmount.toString()).toBe('10');
    expect(created.rate.toString()).toBe('0.000025');
    expect(created.outputAmount.toString()).toBe('0.00025');
    expect(created.source).toContain('gate2.conversion.rate.USDT.BTC');
  });

  it('uses paired ledger postings for an internal transfer', async () => {
    const { service, ledger, tx } = createService();
    const result = await service.transfer('user-1', { toUserId: 'user-2', asset: 'USDT', amount: '5', idempotencyKey: 'transfer-key-1' });
    expect(result.transfer).toEqual(expect.objectContaining({ debitPostingId: 'debit-1', creditPostingId: 'credit-1' }));
    expect(ledger.pairedTransfer).toHaveBeenCalledWith(expect.objectContaining({ amount: '5', referenceType: 'GATE2_INTERNAL_TRANSFER' }), tx);
  });

  it('routes internal transfers through the native D1 paired command when enabled', async () => {
    const { service, prisma } = createService();
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      getUserById: jest.fn().mockImplementation((userId: string) => Promise.resolve({ id: userId })),
      getInternalTransfer: jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'transfer-1', fromUserId: 'user-1', toUserId: 'user-2', asset: 'USDT', amount: '5' }),
      getAccountForUser: jest.fn()
        .mockResolvedValueOnce({ id: 'd1-debit', asset: 'USDT' })
        .mockResolvedValueOnce({ id: 'd1-credit', asset: 'USDT' }),
      pairedTransfer: jest.fn().mockResolvedValue({ debitPostingId: 'd1-debit-posting', creditPostingId: 'd1-credit-posting' }),
    };
    (prisma as any).user = { findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }) };
    prisma.gate2InternalTransfer.findUnique = jest.fn().mockResolvedValue(null);
    const d1Service = new FinancialOperationsService(prisma as any, {} as any, d1 as any);

    const result = await d1Service.transfer('user-1', { toUserId: 'user-2', asset: 'USDT', amount: '5', idempotencyKey: 'transfer-key-1' });

    expect(d1.pairedTransfer).toHaveBeenCalledWith(expect.objectContaining({
      idempotencyKey: 'transfer-key-1',
      internalTransfer: expect.objectContaining({ fromUserId: 'user-1', toUserId: 'user-2' }),
    }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.replayed).toBe(false);
  });
});
