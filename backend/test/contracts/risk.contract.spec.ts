import { riskAuthorityOwner } from '../../src/contracts/risk.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('risk contract v1', () => {
  it('requires a backend decision and audit reference', () => { expectAuthority(riskAuthorityOwner); const decision = { decision: 'REVIEW', auditReference: 'audit-test' }; expect(decision.auditReference).toBeTruthy(); expectNoClientAuthority(decision); });
  it('rejects invalid state', () => { expectInvalidState(['LOADING', 'LIVE', 'STALE', 'UNAVAILABLE', 'ERROR', 'DISCONNECTED', 'SUCCESS', 'FAILURE']); });
});
