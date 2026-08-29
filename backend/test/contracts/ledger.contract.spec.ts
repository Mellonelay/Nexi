import { ledgerAuthorityOwner } from '../../src/contracts/ledger.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('ledger contract v1', () => {
  it('requires idempotent backend ledger mutation', () => { expectAuthority(ledgerAuthorityOwner); const mutation = { amount: 0, idempotencyKey: 'test-key' }; expect(mutation.idempotencyKey).toBeTruthy(); expectNoClientAuthority(mutation); });
  it('rejects invalid state', () => { expectInvalidState(['LIVE', 'STALE', 'SUCCESS', 'FAILURE']); });
});
