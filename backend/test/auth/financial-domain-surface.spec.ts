import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AUTH_SURFACE_METADATA } from '../../src/auth/auth-surface.decorator';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { BinaryController } from '../../src/binary/binary.controller';
import { SpotController } from '../../src/spot/spot.controller';
import { MarginController } from '../../src/spot/margin.controller';
import { MiningController } from '../../src/mining/mining.controller';
import { LoansController } from '../../src/loans/loans.controller';
import { WalletController } from '../../src/wallet/wallet.controller';
import { LocalDepositProofController } from '../../src/financial/local-deposit-proof.controller';

describe('Seven financial controller HTTP JWT surfaces', () => {
  const controllers = [
    [BinaryController, 4],
    [SpotController, 5],
    [MarginController, 8],
    [MiningController, 8],
    [LoansController, 6],
    [WalletController, 13],
    [LocalDepositProofController, 1],
  ] as const;

  it.each(controllers)('%s binds all %s protected methods to their correct auth surface', (controller, expected) => {
    const handlers = Object.getOwnPropertyNames(controller.prototype)
      .filter(name => name !== 'constructor')
      .map(name => ({name, handler: (controller.prototype as any)[name]}))
      .filter(({handler}) => typeof handler === 'function');
    const protectedRoutes = handlers.filter(({handler}) =>
      (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined)?.includes(JwtAuthGuard));
    expect(protectedRoutes).toHaveLength(expected);
    for (const {name, handler} of protectedRoutes) {
      const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
      expect(guards).toContain(AuthSurfaceGuard);
      expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler))
        .toBe(guards.includes(RolesGuard) ? 'ADMIN' : 'PUBLIC');
      expect(name).toBeTruthy();
    }
  });
});
