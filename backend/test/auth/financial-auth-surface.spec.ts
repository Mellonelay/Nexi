import { GUARDS_METADATA } from '@nestjs/common/constants';
import { FinancialOperationsController } from '../../src/financial/financial-operations.controller';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { AUTH_SURFACE_METADATA } from '../../src/auth/auth-surface.decorator';

describe('Financial HTTP authentication surfaces', () => {
  const publicMethods = [
    'requestWithdrawal', 'transferBetweenAccounts', 'transfer', 'quote',
    'accept', 'deposits', 'createDepositProofIntent',
    'authorizeDepositProofUpload', 'submitDepositClaim', 'getDepositClaims',
    'withdrawals', 'transfers',
  ] as const;
  const adminMethods = ['approve', 'reject', 'settle'] as const;

  it.each(publicMethods)('%s requires public JWT and surface guards', (method) => {
    const handler = FinancialOperationsController.prototype[method];
    expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler)).toBe('PUBLIC');
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(AuthSurfaceGuard);
  });

  it.each(adminMethods)('%s preserves Admin JWT, surface and role guards', (method) => {
    const handler = FinancialOperationsController.prototype[method];
    expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler)).toBe('ADMIN');
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(AuthSurfaceGuard);
    expect(guards).toContain(RolesGuard);
  });

  it('retains public deposit-destination discovery with no route guard', () => {
    const handler = FinancialOperationsController.prototype.getDepositDestinations;
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toBeUndefined();
  });
});
