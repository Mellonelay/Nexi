export type MarketCatalogCategory = 'crypto' | 'stock' | 'forex' | 'metal';

export interface CanonicalMarketPair {
  symbol: string;
  category: MarketCatalogCategory;
  displayName: string;
  providerSymbol: string;
  metadataProvider: string;
}

const crypto = [
  ['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['LTC', 'Litecoin'], ['XRP', 'XRP'],
  ['BCH', 'Bitcoin Cash'], ['ETC', 'Ethereum Classic'], ['FIL', 'Filecoin'],
  ['USDC', 'USD Coin'], ['SUN', 'Sun Token'], ['DOT', 'Polkadot'],
  ['ADA', 'Cardano'], ['DOGE', 'Dogecoin'], ['MASK', 'Mask Network'],
  ['STEEM', 'Steem'], ['TRX', 'TRON'], ['SOL', 'Solana'], ['SUSHI', 'Sushi'],
] as const;

const stocks = [
  ['AAPL', 'Apple'], ['NVDA', 'NVIDIA'], ['MSFT', 'Microsoft'], ['GOOG', 'Alphabet'],
  ['AMZN', 'Amazon'], ['META', 'Meta Platforms'], ['TSLA', 'Tesla'], ['WMT', 'Walmart'],
  ['JNJ', 'Johnson & Johnson'], ['NFLX', 'Netflix'], ['KO', 'Coca-Cola'], ['AMD', 'AMD'],
  ['MCD', "McDonald's"], ['WFC', 'Wells Fargo'], ['AXP', 'American Express'],
  ['DIS', 'Walt Disney'], ['UBER', 'Uber'], ['NKE', 'Nike'], ['SONY', 'Sony'], ['BA', 'Boeing'],
] as const;

const forex = [
  ['GBPUSD', 'GBP/USD'], ['EURUSD', 'EUR/USD'], ['USDCNH', 'USD/CNH'], ['USDHKD', 'USD/HKD'],
  ['USDJPY', 'USD/JPY'], ['USDTHB', 'USD/THB'], ['AUDUSD', 'AUD/USD'], ['USDCHF', 'USD/CHF'],
  ['USDRUB', 'USD/RUB'],
] as const;

const metals = [
  ['XAUUSD', 'Gold', 'XAU/USD'], ['XAGUSD', 'Silver', 'XAG/USD'], ['XPDUSD', 'Palladium', 'XPD/USD'],
  ['XPTUSD', 'Platinum', 'XPT/USD'], ['XALUSD', 'Aluminum', 'Aluminum/USD'],
  ['XCUUSD', 'Copper', 'Copper/USD'], ['XZNUSD', 'Zinc', 'Zinc/USD'],
] as const;

export const CANONICAL_MARKET_CATALOG: readonly CanonicalMarketPair[] = [
  ...crypto.map(([symbol, displayName]) => ({
    symbol: `${symbol}USDT`, category: 'crypto' as const, displayName,
    providerSymbol: symbol, metadataProvider: 'CoinGecko/CoinMarketCap',
  })),
  ...stocks.map(([symbol, displayName]) => ({
    symbol: `${symbol}USDT`, category: 'stock' as const, displayName,
    providerSymbol: symbol, metadataProvider: 'Massive',
  })),
  ...forex.map(([symbol, displayName]) => ({
    symbol, category: 'forex' as const, displayName,
    providerSymbol: `${symbol.slice(0, 3)}/${symbol.slice(3)}`, metadataProvider: 'Massive/Finnhub',
  })),
  ...metals.map(([symbol, displayName, providerSymbol]) => ({
    symbol, category: 'metal' as const, displayName, providerSymbol, metadataProvider: 'Metals-API/MetalpriceAPI',
  })),
];

export const CANONICAL_MARKET_CATALOG_COUNT = CANONICAL_MARKET_CATALOG.length;

export const canonicalMarketPair = new Map(
  CANONICAL_MARKET_CATALOG.map((entry) => [entry.symbol, entry]),
);
