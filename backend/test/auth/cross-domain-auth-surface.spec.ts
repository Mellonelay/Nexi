import type { Type } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { AUTH_SURFACE_METADATA } from '../../src/auth/auth-surface.decorator';
import { AuthSurface } from '../../src/auth/auth.types';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { ConversionController } from '../../src/conversion/conversion.controller';
import { KycController } from '../../src/kyc/kyc.controller';

const controllerContracts: Array<{
  controller: Type<unknown>;
  expectedSurface: Record<string, AuthSurface>;
}> = [
  {
    controller: ConversionController,
    expectedSurface: { convert: 'PUBLIC', setRate: 'ADMIN' },
  },
  {
    controller: KycController,
    expectedSurface: {
      uploadEvidence: 'PUBLIC',
      submitKyc: 'PUBLIC',
      getMyStatus: 'PUBLIC',
      getStatus: 'PUBLIC',
    },
  },
];

describe.each(controllerContracts)('$controller.name authentication surfaces', ({ controller, expectedSurface }) => {
  it('requires the intended surface on every JWT-protected handler', () => {
    const handlers = Object.getOwnPropertyNames(controller.prototype)
      .map((name) => ({ name, handler: (controller.prototype as Record<string, unknown>)[name] }))
      .filter(({ handler }) => typeof handler === 'function');
    const jwtHandlers = handlers.filter(({ handler }) =>
      (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined)?.includes(JwtAuthGuard));

    expect(jwtHandlers.map(({ name }) => name).sort()).toEqual(Object.keys(expectedSurface).sort());

    for (const [name, surface] of Object.entries(expectedSurface)) {
      const handler = (controller.prototype as Record<string, unknown>)[name] as Function;
      const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];

      expect(guards).toContain(JwtAuthGuard);
      expect(guards).toContain(AuthSurfaceGuard);
      expect(guards.indexOf(JwtAuthGuard)).toBeLessThan(guards.indexOf(AuthSurfaceGuard));
      expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler)).toBe(surface);
      if (surface === 'ADMIN') {
        expect(guards).toContain(RolesGuard);
        expect(guards.indexOf(AuthSurfaceGuard)).toBeLessThan(guards.indexOf(RolesGuard));
      }
    }
  });
});
