import { miningAuthorityOwner } from '../../src/contracts/mining.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('mining contract v1', () => {
  it('keeps rewards nullable until backend settlement', () => { expectAuthority(miningAuthorityOwner); const subscription = { rewardTotal: null, state: 'LOADING' }; expect(subscription.rewardTotal).toBeNull(); expectNoClientAuthority(subscription); });
  it('rejects invalid state', () => { expectInvalidState(['LOADING', 'LIVE', 'STALE', 'UNAVAILABLE', 'ERROR', 'DISCONNECTED', 'SUCCESS', 'FAILURE']); });
});
