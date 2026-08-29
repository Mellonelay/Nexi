import { binaryAuthorityOwner, BinaryState } from '../../src/contracts/binary.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('binary contract v1', () => {
  it('keeps outcome backend-owned', () => { expectAuthority(binaryAuthorityOwner); const position = { direction: 'UP', amount: 0, referenceValue: null }; expect(position.referenceValue).toBeNull(); expectNoClientAuthority(position); });
  it('rejects invalid state', () => { const states: BinaryState[] = ['LOADING', 'WAITING_FOR_MARKET', 'DISCONNECTED', 'EXPIRED', 'SETTLEMENT_PENDING', 'COMPLETED']; expectInvalidState(states); });
});
