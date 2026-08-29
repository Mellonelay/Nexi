import { walletAuthorityOwner } from '../../src/contracts/wallet.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';

describe('wallet contract v1', () => {
  it('keeps balance authority in the backend and permits unavailable values', () => {
    expectAuthority(walletAuthorityOwner);
    const balance = { available: null, locked: null, total: null };
    expect(balance.total).toBeNull();
    expectNoClientAuthority(balance);
  });
  it('rejects an invalid data state vocabulary', () => {
    expectInvalidState(['LOADING', 'LIVE', 'STALE', 'UNAVAILABLE', 'ERROR', 'DISCONNECTED', 'SUBMITTING', 'SUCCESS', 'FAILURE', 'MAINTENANCE']);
  });
});
