import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard response caching', () => {
  it('marks authenticated responses private and non-cacheable before Passport runs', () => {
    const response = { setHeader: jest.fn() };
    const context = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ExecutionContext;
    const passportGuard = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
      canActivate: (context: ExecutionContext) => boolean;
    };
    const passportCanActivate = jest.spyOn(passportGuard, 'canActivate').mockReturnValue(true);

    try {
      expect(new JwtAuthGuard().canActivate(context)).toBe(true);
      expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store');
    } finally {
      passportCanActivate.mockRestore();
    }
  });
});
