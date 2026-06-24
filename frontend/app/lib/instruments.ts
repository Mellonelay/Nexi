export type MarketCategory = 'crypto' | 'metal' | 'forex' | 'shares';

export interface ActiveInstrument {
  assetId: string;
  displayName: string;
  category: MarketCategory;
  baseAsset: string;
  quoteAsset: string;
  canonicalSymbol: string;
  spotSymbol: string;
  binarySymbol: string;
  logoUrl?: string;
  fallbackMark: string;
}

const crypto = (
  displayName: string,
  baseAsset: string,
  fallbackMark: string,
): ActiveInstrument => ({
  assetId: `crypto-${baseAsset.toLowerCase()}-usdt`,
  displayName,
  category: 'crypto',
  baseAsset,
  quoteAsset: 'USDT',
  canonicalSymbol: `${baseAsset}USDT`,
  spotSymbol: `${baseAsset}USDT`,
  binarySymbol: `${baseAsset}USDT`,
  fallbackMark,
});

const market = (
  category: Exclude<MarketCategory, 'crypto'>,
  displayName: string,
  symbol: string,
  baseAsset: string,
  quoteAsset: string,
  fallbackMark: string,
): ActiveInstrument => ({
  assetId: `${category}-${symbol.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  displayName,
  category,
  baseAsset,
  quoteAsset,
  canonicalSymbol: symbol,
  spotSymbol: symbol,
  binarySymbol: symbol,
  fallbackMark,
});

export const INSTRUMENTS: readonly ActiveInstrument[] = [
  crypto('Bitcoin', 'BTC', '₿'),
  crypto('Ethereum', 'ETH', 'Ξ'),
  crypto('Litecoin', 'LTC', 'Ł'),
  crypto('XRP', 'XRP', 'X'),
  crypto('Bitcoin Cash', 'BCH', 'B'),
  crypto('Ethereum Classic', 'ETC', 'E'),
  crypto('Filecoin', 'FIL', 'F'),
  crypto('USD Coin', 'USDC', '$'),
  crypto('Sun Token', 'SUN', 'S'),
  crypto('Polkadot', 'DOT', '●'),
  crypto('Cardano', 'ADA', 'A'),
  crypto('Dogecoin', 'DOGE', 'Ð'),
  crypto('Mask Network', 'MASK', 'M'),
  crypto('Steem', 'STEEM', 'S'),
  crypto('TRON', 'TRX', 'T'),
  crypto('Solana', 'SOL', 'S'),
  crypto('SushiSwap', 'SUSHI', 'S'),

  market('metal', 'Gold', 'XAUUSD', 'XAU', 'USD', 'Au'),
  market('metal', 'Silver', 'XAGUSD', 'XAG', 'USD', 'Ag'),
  market('metal', 'Palladium', 'XPDUSD', 'XPD', 'USD', 'Pd'),
  market('metal', 'Platinum', 'XPTUSD', 'XPT', 'USD', 'Pt'),
  market('metal', 'Aluminium', 'XALUSD', 'XAL', 'USD', 'Al'),
  market('metal', 'Copper', 'XCUUSD', 'XCU', 'USD', 'Cu'),

  market('forex', 'British Pound / US Dollar', 'GBPUSD', 'GBP', 'USD', '£'),
  market('forex', 'Euro / US Dollar', 'EURUSD', 'EUR', 'USD', '€'),
  market('forex', 'US Dollar / Chinese Yuan', 'USDCNH', 'USD', 'CNH', '¥'),
  market('forex', 'US Dollar / Japanese Yen', 'USDJPY', 'USD', 'JPY', '¥'),
  market('forex', 'Australian Dollar / US Dollar', 'AUDUSD', 'AUD', 'USD', 'A$'),
  market('forex', 'US Dollar / Swiss Franc', 'USDCHF', 'USD', 'CHF', '₣'),

  market('shares', 'Apple', 'AAPL.US', 'AAPL', 'USD', 'A'),
  market('shares', 'NVIDIA', 'NVDA.US', 'NVDA', 'USD', 'N'),
  market('shares', 'Microsoft', 'MSFT.US', 'MSFT', 'USD', 'M'),
  market('shares', 'Alphabet', 'GOOG.US', 'GOOG', 'USD', 'G'),
  market('shares', 'Amazon', 'AMZN.US', 'AMZN', 'USD', 'A'),
  market('shares', 'Meta Platforms', 'META.US', 'META', 'USD', 'M'),
  market('shares', 'Tesla', 'TSLA.US', 'TSLA', 'USD', 'T'),
  market('shares', 'Netflix', 'NFLX.US', 'NFLX', 'USD', 'N'),
  market('shares', 'AMD', 'AMD.US', 'AMD', 'USD', 'A'),
  market('shares', 'Disney', 'DIS.US', 'DIS', 'USD', 'D'),
] as const;

export const DEFAULT_INSTRUMENT = INSTRUMENTS[0];

export const normalizeInstrumentSymbol = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function findInstrument(value?: string | null): ActiveInstrument | undefined {
  if (!value) return undefined;
  const normalized = normalizeInstrumentSymbol(value);

  return INSTRUMENTS.find((instrument) => {
    const aliases = [
      instrument.canonicalSymbol,
      instrument.spotSymbol,
      instrument.binarySymbol,
      instrument.baseAsset,
      `${instrument.baseAsset}${instrument.quoteAsset}`,
    ];

    return aliases.some((alias) => normalizeInstrumentSymbol(alias) === normalized);
  });
}

export function resolveInstrument(value?: string | null): ActiveInstrument {
  return findInstrument(value) ?? DEFAULT_INSTRUMENT;
}
