import { CANONICAL_MARKET_CATALOG } from '../../src/market/market-catalog';
import { getMarketSourcePolicy, getProviderMapping, isSettlementApproved, resolveProviderInstrument } from '../../src/market/market-source-registry';

describe('Market source registry', () => {
  it('covers the canonical 53 assets without creating alternate identities', () => {
    expect(CANONICAL_MARKET_CATALOG).toHaveLength(53);
    expect(new Set(CANONICAL_MARKET_CATALOG.map((entry) => getMarketSourcePolicy(entry.symbol)?.canonicalAssetId)).size).toBe(53);
    expect(getMarketSourcePolicy('AAPLUSDT')).toMatchObject({ canonicalAssetId: 'stock:aapl', displaySymbol: 'AAPL.US/USDT' });
    expect(getMarketSourcePolicy('USDCNH')).toMatchObject({ canonicalAssetId: 'forex:usdcnh', displaySymbol: 'USD/CNH' });
    expect(getMarketSourcePolicy('XCUUSD')).toMatchObject({ canonicalAssetId: 'metal:xcuusd', displaySymbol: 'Copper/USD' });
  });

  it('resolves provider instruments by asset class', () => {
    expect(resolveProviderInstrument('BTCUSDT', 'binance-spot')).toBe('BTCUSDT');
    expect(resolveProviderInstrument('AAPLUSDT', 'biquote')).toBe('AAPL');
    expect(resolveProviderInstrument('EURUSD', 'oanda')).toBe('EUR_USD');
    expect(resolveProviderInstrument('XAUUSD', 'oanda')).toBe('XAU_USD');
    expect(resolveProviderInstrument('GOOGUSDT', 'bitget')).toBe('GOOGLUSDT');
    expect(getProviderMapping('AAPLUSDT', 'biquote')?.quoteSupported).toBe(true);
    expect(getProviderMapping('DISUSDT', 'bitget')?.quoteSupported).toBe(false);
    expect(getProviderMapping('AXPUSDT', 'gate')?.klineSupported).toBe(true);
    expect(getProviderMapping('EURUSD', 'gate')?.quoteSupported).toBe(false);
    expect(getProviderMapping('XAUUSD', 'gate')?.quoteSupported).toBe(false);
    expect(getProviderMapping('USDRUB', 'yahoo')?.klineSupported).toBe(false);
    expect(getProviderMapping('USDRUB', 'moex')?.klineSupported).toBe(true);
    expect(getMarketSourcePolicy('USDRUB')?.displayPolicy.primaryProvider).toBe('moex');
    expect(getMarketSourcePolicy('USDRUB')?.displayPolicy.fallbackProviders).toContain('yahoo');
  });

  it('gives every canonical asset a quote and Kline source path', () => {
    const missing = CANONICAL_MARKET_CATALOG
      .filter((entry) => {
        const mappings = getMarketSourcePolicy(entry.symbol)?.providerMappings ?? [];
        return !mappings.some((mapping) => mapping.quoteSupported)
          || !mappings.some((mapping) => mapping.klineSupported);
      })
      .map((entry) => entry.symbol);
    expect(missing).toEqual([]);
  });

  it('fails closed for Binary settlement until policy approval exists', () => {
    expect(isSettlementApproved('BTCUSDT', 'binance-spot')).toBe(false);
    expect(getMarketSourcePolicy('XCUUSD')?.capabilities.binary).toBe(false);
  });
});
