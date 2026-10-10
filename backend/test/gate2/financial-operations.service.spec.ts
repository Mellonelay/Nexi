import { FinancialOperationsService } from '../../src/financial/financial-operations.service';

describe('Gate 2 financial operations', () => {
  function createD1() {
    const withdrawal = { id: 'withdrawal-1', userId: 'user-1', asset: 'USDT', amount: '10', fee: '0.2', reservedAmount: '10.2', state: 'PENDING_REVIEW' };
    const transfer = { id: 'transfer-1', fromUserId: 'user-1', toUserId: 'user-2', asset: 'USDT', amount: '5', debitPostingId: 'debit-1', creditPostingId: 'credit-1' };
    const d1: any = {
      hasAssetCapability: jest.fn().mockResolvedValue(true),
      getWalletAssetNetworkConfig: jest.fn().mockResolvedValue({ assetActive: 1, withdrawEnabled: 1, networkActive: 1, networkWithdrawEnabled: 1, minWithdrawal: '1', maxWithdrawal: '1000', withdrawalFee: '0.2' }),
      getSystemConfigValue: jest.fn().mockImplementation(async (key: string) => key.includes('conversion.rate') ? '0.000025' : null),
      getWithdrawal: jest.fn().mockResolvedValue(null),
      reserveWithdrawal: jest.fn().mockResolvedValue(withdrawal),
      getInternalTransfer: jest.fn().mockResolvedValue(null),
      getConversionQuoteByKey: jest.fn().mockResolvedValue(null),
      getActiveMarketPair: jest.fn().mockImplementation(async (symbol: string) => symbol === 'BTCUSDT' ? { id: 'pair-btc-usdt', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' } : null),
      getLiveMarketQuote: jest.fn().mockResolvedValue({ id: 'market-quote-1', symbol: 'BTCUSDT', price: '40000', provider: 'binance-spot', source: 'websocket' }),
      getUserById: jest.fn().mockImplementation(async (id: string) => ({ id })),
      getAccountForUser: jest.fn().mockResolvedValue({ id: 'account-1', asset: 'USDT' }),
      pairedTransfer: jest.fn().mockResolvedValue({ debitPostingId: 'debit-1', creditPostingId: 'credit-1' }),
      createConversionQuote: jest.fn().mockImplementation(async (command: any) => ({ id: 'quote-1', ...command })),
    };
    return { d1, withdrawal, transfer };
  }

  it('reserves a configured withdrawal fee through D1 before review', async () => {
    const { d1 } = createD1();
    const result = await new FinancialOperationsService(d1).requestWithdrawal('user-1', { asset: 'USDT', network: 'TRC20', address: 'T-address', amount: '10', idempotencyKey: 'withdraw-key-1' });
    expect(d1.reserveWithdrawal).toHaveBeenCalledWith(expect.objectContaining({ amount: '10', fee: '0.2', reservedAmount: '10.2', requestKey: 'withdraw-key-1' }));
    expect(result.providerLive).toBe(false);
  });

  it('creates an exact conversion quote from D1 configuration evidence', async () => {
    const { d1 } = createD1();
    const result = await new FinancialOperationsService(d1).createConversionQuote('user-1', { fromAsset: 'USDT', toAsset: 'BTC', amount: '10', quoteKey: 'quote-key-1' });
    expect(result.replayed).toBe(false);
    expect(d1.createConversionQuote).toHaveBeenCalledWith(expect.objectContaining({ inputAmount: '10', rate: '0.000025', outputAmount: '0.00025', source: 'gate2.conversion.rate.USDT.BTC', quoteKey: 'quote-key-1' }));
  });

  it('uses a fresh D1 market quote and its lineage when conversion config is absent', async () => {
    const { d1 } = createD1();
    d1.getSystemConfigValue.mockResolvedValue(null);
    const result = await new FinancialOperationsService(d1).createConversionQuote('user-1', { fromAsset: 'USDT', toAsset: 'BTC', amount: '10', quoteKey: 'market-quote-key-1' });
    expect(result.replayed).toBe(false);
    expect(d1.getActiveMarketPair).toHaveBeenNthCalledWith(1, 'USDTBTC');
    expect(d1.getActiveMarketPair).toHaveBeenNthCalledWith(2, 'BTCUSDT');
    expect(d1.createConversionQuote).toHaveBeenCalledWith(expect.objectContaining({
      inputAmount: '10', rate: '0.000025', outputAmount: '0.00025',
      provider: 'binance-spot', source: 'BTCUSDT:websocket', evidenceId: 'market-quote-1',
      quoteKey: 'market-quote-key-1',
    }));
  });

  it('fails closed when market-pair metadata disagrees with the requested conversion direction', async () => {
    const { d1 } = createD1();
    d1.getSystemConfigValue.mockResolvedValue(null);
    d1.getActiveMarketPair.mockImplementation(async (symbol: string) => symbol === 'BTCUSDT'
      ? { id: 'pair-btc-usdt', symbol: 'BTCUSDT', baseAsset: 'USDT', quoteAsset: 'BTC' }
      : null);
    await expect(new FinancialOperationsService(d1).createConversionQuote('user-1', { fromAsset: 'USDT', toAsset: 'BTC', amount: '10', quoteKey: 'market-direction-key' })).rejects.toThrow('Conversion market unavailable');
    expect(d1.createConversionQuote).not.toHaveBeenCalled();
  });

  it('fails closed when neither config nor an active market pair exists', async () => {
    const { d1 } = createD1();
    d1.getSystemConfigValue.mockResolvedValue(null);
    d1.getActiveMarketPair.mockResolvedValue(null);
    await expect(new FinancialOperationsService(d1).createConversionQuote('user-1', { fromAsset: 'USDT', toAsset: 'BTC', amount: '10', quoteKey: 'market-unavailable-key' })).rejects.toThrow('Conversion market unavailable');
    expect(d1.createConversionQuote).not.toHaveBeenCalled();
  });

  it('uses paired D1 ledger postings for an internal transfer', async () => {
    const { d1 } = createD1();
    d1.getInternalTransfer.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'transfer-1', fromUserId: 'user-1', toUserId: 'user-2', asset: 'USDT', amount: '5' });
    const result = await new FinancialOperationsService(d1).transfer('user-1', { toUserId: 'user-2', asset: 'USDT', amount: '5', idempotencyKey: 'transfer-key-1' });
    expect(result.transfer).toMatchObject({ id: 'transfer-1' });
    expect(d1.pairedTransfer).toHaveBeenCalledWith(expect.objectContaining({ amount: '5', referenceType: 'GATE2_INTERNAL_TRANSFER', internalTransfer: expect.objectContaining({ fromUserId: 'user-1', toUserId: 'user-2' }) }));
  });

  it('rejects another user’s proof key when submitting a deposit claim', async () => {
    const { d1 } = createD1();
    await expect(new FinancialOperationsService(d1).submitDepositClaim('user-1', {
      asset: 'USDT', network: 'TRC20', depositAddressId: 'address-1', claimedAmount: '10',
      proofObjectKey: 'deposit-proofs/user-2/123e4567-e89b-12d3-a456-426614174000', idempotencyKey: 'deposit-key-123',
    })).rejects.toThrow('Deposit proof key is invalid');
  });

  it('rejects malformed financial idempotency before D1 mutation', async () => {
    const { d1 } = createD1();
    await expect(new FinancialOperationsService(d1).transfer('user-1', { toUserId: 'user-2', asset: 'USDT', amount: '5', idempotencyKey: 'short' })).rejects.toThrow('Idempotency key is invalid');
    expect(d1.pairedTransfer).not.toHaveBeenCalled();
  });
});
