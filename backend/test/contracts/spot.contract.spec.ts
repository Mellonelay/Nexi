import { spotAuthorityOwner } from '../../src/contracts/spot.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('spot contract v1', () => {
  it('requires backend-owned order-book fields', () => { expectAuthority(spotAuthorityOwner); const book = { bids: [], asks: [], spread: null, state: 'LOADING' }; expect(book.spread).toBeNull(); expectNoClientAuthority(book); });
  it('rejects invalid state', () => { expectInvalidState(['LOADING', 'STALE', 'UNAVAILABLE', 'DISCONNECTED', 'SUBMITTING', 'SUCCESS', 'FAILURE']); });
});
