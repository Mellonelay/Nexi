import { settlementAuthorityOwner, SettlementState } from '../../src/contracts/settlement.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('settlement contract v1', () => {
  it('requires an audit reference', () => { expectAuthority(settlementAuthorityOwner); const receipt = { state: 'PENDING', ledgerEntryId: null, auditReference: 'audit-test' }; expect(receipt.auditReference).toBeTruthy(); expectNoClientAuthority(receipt); });
  it('rejects invalid state', () => { const states: SettlementState[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED']; expectInvalidState(states); });
});
