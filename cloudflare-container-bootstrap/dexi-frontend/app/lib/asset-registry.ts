export type AssetCategory = 'Crypto' | 'Stocks' | 'Metals' | 'Forex';
export type AssetAvailability = 'LIVE' | 'UNAVAILABLE' | 'UNVERIFIED';

export interface AssetDefinition {
  id: string;
  category: AssetCategory;
  symbol: string;
  pair: string;
  displaySymbol: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  precision: number;
  iconKey?: string;
  iconSlug?: string;
  iconColor?: string;
  coingeckoId?: string;
  coinmarketcapId?: number;
  providerSymbol: string;
  metadataProvider: string;
  availability: AssetAvailability;
  description: string;
  protocol?: string;
}

const crypto = [
  ['BTC', 'bitcoin', 1, 'Bitcoin', 'Bitcoin network'], ['ETH', 'ethereum', 1027, 'Ethereum', 'Ethereum network'],
  ['LTC', 'litecoin', 2, 'Litecoin', 'Litecoin network'], ['XRP', 'ripple', 52, 'XRP', 'XRP Ledger'],
  ['BCH', 'bitcoin-cash', 1831, 'Bitcoin Cash', 'Bitcoin Cash network'], ['ETC', 'ethereum-classic', 1321, 'Ethereum Classic', 'Ethereum Classic network'],
  ['FIL', 'filecoin', 2280, 'Filecoin', 'Filecoin network'], ['USDC', 'usd-coin', 3408, 'USD Coin', 'Circle USD Coin'],
  ['SUN', 'sun-token', 10529, 'Sun Token', 'TRON network'], ['DOT', 'polkadot', 6636, 'Polkadot', 'Polkadot network'],
  ['ADA', 'cardano', 2010, 'Cardano', 'Cardano network'], ['DOGE', 'dogecoin', 74, 'Dogecoin', 'Dogecoin network'],
  ['MASK', 'mask-network', 8536, 'Mask Network', 'Mask Network'], ['STEEM', 'steem', 1230, 'Steem', 'Steem network'],
  ['TRX', 'tron', 1958, 'TRON', 'TRON network'], ['SOL', 'solana', 5426, 'Solana', 'Solana network'],
  ['SUSHI', 'sushi', 6758, 'Sushi', 'Ethereum network'],
] as const;

const stocks = ['AAPL', 'NVDA', 'MSFT', 'GOOG', 'AMZN', 'META', 'TSLA', 'WMT', 'JNJ', 'NFLX', 'KO', 'AMD', 'MCD', 'WFC', 'AXP', 'DIS', 'UBER', 'NKE', 'SONY', 'BA'] as const;
const stockNames: Record<string, string> = { AAPL: 'Apple', NVDA: 'NVIDIA', MSFT: 'Microsoft', GOOG: 'Alphabet', AMZN: 'Amazon', META: 'Meta Platforms', TSLA: 'Tesla', WMT: 'Walmart', JNJ: 'Johnson & Johnson', NFLX: 'Netflix', KO: 'Coca-Cola', AMD: 'AMD', MCD: "McDonald's", WFC: 'Wells Fargo', AXP: 'American Express', DIS: 'Walt Disney', UBER: 'Uber', NKE: 'Nike', SONY: 'Sony', BA: 'Boeing' };
const forex = ['GBPUSD', 'EURUSD', 'USDCNH', 'USDHKD', 'USDJPY', 'USDTHB', 'AUDUSD', 'USDCHF', 'USDRUB'] as const;
const metals: Array<[string, string, string]> = [['XAUUSD', 'Gold', 'XAU/USD'], ['XAGUSD', 'Silver', 'XAG/USD'], ['XPDUSD', 'Palladium', 'XPD/USD'], ['XPTUSD', 'Platinum', 'XPT/USD'], ['XALUSD', 'Aluminum', 'Aluminum/USD'], ['XCUUSD', 'Copper', 'Copper/USD'], ['XZNUSD', 'Zinc', 'Zinc/USD']];

const simpleIconSources: Record<string, readonly [string, string]> = {
  BTC: ['bitcoin', 'FB9212'], ETH: ['ethereum', '728CD9'], SOL: ['solana', '9945FF'], XRP: ['xrp', '00AAE4'],
  ADA: ['cardano', '1827A3'], DOGE: ['dogecoin', 'C6A64E'], DOT: ['polkadot', 'E6007A'], LTC: ['litecoin', 'BFBBBB'],
  BCH: ['bitcoincash', '8DC351'], FIL: ['filecoin', '0090FF'],
  AAPL: ['apple', 'A2AAAD'], MSFT: ['microsoft', '00A4EF'], GOOG: ['google', '4285F4'], AMZN: ['amazon', 'FF9900'],
  TSLA: ['tesla', 'CC0000'], NVDA: ['nvidia', '76B900'], META: ['meta', '0082FB'], NFLX: ['netflix', 'E50914'],
  WMT: ['walmart', '0071CE'], DIS: ['disney', '113CCF'], AMD: ['amd', 'ED1C24'], UBER: ['uber', '000000'],
};

const fallbackIconColors: Record<string, string> = {
  GBPUSD: '012169', EURUSD: '003399', USDHKD: 'DE2910', USDJPY: 'BC002D', AUDUSD: '00843D', USDCHF: 'FF0000',
  XAUUSD: 'FFD700', XAGUSD: 'C0C0C0', XPDUSD: 'CEC8B8', XPTUSD: 'E5E4E2', XCUUSD: 'B87333',
};

const cryptoDefinitions: AssetDefinition[] = crypto.map(([symbol, coingeckoId, coinmarketcapId, name, protocol]) => ({
  id: `crypto:${symbol.toLowerCase()}`,
  category: 'Crypto', symbol, pair: `${symbol}/USDT`, displaySymbol: symbol, name, baseAsset: symbol, quoteAsset: 'USDT', precision: 8,
  iconKey: symbol.toLowerCase(), iconSlug: simpleIconSources[symbol]?.[0], iconColor: simpleIconSources[symbol]?.[1], coingeckoId, coinmarketcapId, providerSymbol: symbol, metadataProvider: 'CoinGecko/CoinMarketCap', availability: 'LIVE', description: `${name} market and project information.`, protocol,
}));

const stockDefinitions: AssetDefinition[] = stocks.map((symbol) => ({
  id: `stock:${symbol.toLowerCase()}`, category: 'Stocks', symbol: `${symbol}.US`, pair: `${symbol}.US/USDT`, displaySymbol: symbol, name: stockNames[symbol], baseAsset: `${symbol}.US`, quoteAsset: 'USDT', precision: 4,
  iconKey: symbol.toLowerCase(), iconSlug: simpleIconSources[symbol]?.[0], iconColor: simpleIconSources[symbol]?.[1], providerSymbol: symbol, metadataProvider: 'BiQuote', availability: 'UNAVAILABLE', description: `${stockNames[symbol]} equity reference information.`,
}));

const forexDefinitions: AssetDefinition[] = forex.map((symbol) => ({
  id: `forex:${symbol.toLowerCase()}`, category: 'Forex', symbol, pair: `${symbol}/USDT`, displaySymbol: symbol, name: `${symbol.slice(0, 3)}/${symbol.slice(3)}`, baseAsset: symbol.slice(0, 3), quoteAsset: symbol.slice(3), precision: 6,
  iconKey: symbol.toLowerCase(), iconColor: fallbackIconColors[symbol], providerSymbol: `${symbol.slice(0, 3)}/${symbol.slice(3)}`, metadataProvider: 'BiQuote/MOEX', availability: symbol === 'USDRUB' ? 'UNVERIFIED' : 'UNAVAILABLE', description: `${symbol.slice(0, 3)}/${symbol.slice(3)} currency pair reference information.`,
}));

const metalDefinitions: AssetDefinition[] = metals.map(([symbol, name, providerSymbol]) => ({
  id: `metal:${symbol.toLowerCase()}`, category: 'Metals', symbol, pair: `${symbol}/USDT`, displaySymbol: symbol, name, baseAsset: symbol.slice(0, 3), quoteAsset: 'USD', precision: 4,
  iconKey: symbol.toLowerCase(), iconColor: fallbackIconColors[symbol] ?? '7353DD', providerSymbol, metadataProvider: 'Metals-API/MetalpriceAPI (candidate)', availability: 'UNAVAILABLE', description: `${name} commodity reference information.`,
}));

export const ASSET_REGISTRY = [...cryptoDefinitions, ...stockDefinitions, ...forexDefinitions, ...metalDefinitions] as const;
export const ASSET_REGISTRY_COUNT = ASSET_REGISTRY.length;

const aliases = new Map<string, AssetDefinition>();
for (const asset of ASSET_REGISTRY) {
  for (const value of [asset.id, asset.symbol, asset.pair, asset.displaySymbol, asset.symbol.replace('.US', ''), asset.pair.replace('/USDT', ''), asset.category === 'Stocks' ? `${asset.displaySymbol}USDT` : '']) aliases.set(value.replaceAll('/', '').toUpperCase(), asset);
}

export function findAsset(value: string | undefined | null): AssetDefinition | undefined {
  if (!value) return undefined;
  return aliases.get(value.replaceAll('/', '').toUpperCase());
}

export function assetIconPath(asset: Pick<AssetDefinition, 'iconKey' | 'iconSlug' | 'iconColor'>): string | undefined {
  return asset.iconKey ? `/assets/market/${asset.iconKey}.svg` : undefined;
}

export const cryptoAssets = cryptoDefinitions;
export const stockAssets = stockDefinitions;
export const metalAssets = metalDefinitions;
export const forexAssets = forexDefinitions;
