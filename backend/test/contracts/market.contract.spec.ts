import { marketAuthorityOwner, MarketStatus } from '../../src/contracts/market.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';

describe('market contract v1', () => {
  it('owns nullable quote values in the backend boundary', () => {
    expectAuthority(marketAuthorityOwner);
    const quote = { pair: 'BTC/USDT', price: null, change24h: null, volume24h: null };
    expect(quote.price).toBeNull();
    expectNoClientAuthority(quote);
  });
  it('rejects an invalid market state vocabulary', () => {
    const states: MarketStatus[] = ['LIVE', 'STALE', 'OFFLINE', 'MAINTENANCE'];
    expectInvalidState(states);
  });
});
