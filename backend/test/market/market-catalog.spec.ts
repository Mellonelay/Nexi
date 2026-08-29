import { CANONICAL_MARKET_CATALOG, CANONICAL_MARKET_CATALOG_COUNT } from '../../src/market/market-catalog';

describe('canonical market catalog', () => {
  it('contains the approved 17 crypto, 20 stock, 9 forex, and 7 metal pairs', () => {
    expect(CANONICAL_MARKET_CATALOG_COUNT).toBe(53);
    expect(CANONICAL_MARKET_CATALOG.filter((entry) => entry.category === 'crypto')).toHaveLength(17);
    expect(CANONICAL_MARKET_CATALOG.filter((entry) => entry.category === 'stock')).toHaveLength(20);
    expect(CANONICAL_MARKET_CATALOG.filter((entry) => entry.category === 'forex')).toHaveLength(9);
    expect(CANONICAL_MARKET_CATALOG.filter((entry) => entry.category === 'metal')).toHaveLength(7);
    expect(new Set(CANONICAL_MARKET_CATALOG.map((entry) => entry.symbol)).size).toBe(53);
  });
});
