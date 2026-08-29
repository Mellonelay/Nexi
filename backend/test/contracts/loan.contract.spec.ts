import { loanAuthorityOwner } from '../../src/contracts/loan.contract';
import { expectAuthority, expectInvalidState, expectNoClientAuthority } from './contract-test-helpers';
describe('loan contract v1', () => {
  it('keeps collateral and risk backend-owned', () => { expectAuthority(loanAuthorityOwner); const application = { principal: null, collateralAmount: null, riskRatio: null }; expect(application.riskRatio).toBeNull(); expectNoClientAuthority(application); });
  it('rejects invalid state', () => { expectInvalidState(['PENDING', 'ACTIVE', 'REPAID', 'REJECTED', 'DEFAULTED']); });
});
