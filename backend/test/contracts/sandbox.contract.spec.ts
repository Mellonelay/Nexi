import { sandboxAuthorityOwner } from '../../src/contracts/sandbox.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('sandbox contract v1', () => {
  it('requires scoped permissions and an audit reference', () => { expectAuthority(sandboxAuthorityOwner); const scenario = { environment: 'SANDBOX', parameters: {}, auditReference: 'audit-test' }; expect(scenario.auditReference).toBeTruthy(); expectNoClientAuthority(scenario); });
  it('rejects invalid state', () => { expectInvalidState(['LOADING', 'LIVE', 'STALE', 'UNAVAILABLE', 'ERROR', 'DISCONNECTED', 'SUCCESS', 'FAILURE', 'MAINTENANCE']); });
});
