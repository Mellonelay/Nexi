import { AuthController } from '../../src/auth/auth.controller';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AUTH_RATE_LIMIT_OPERATION } from '../../src/auth/auth-rate-limit.decorator';
import { AuthRateLimitGuard } from '../../src/auth/auth-rate-limit.guard';
import { AuthService } from '../../src/auth/auth.service';
import { WalletAuthService } from '../../src/auth/wallet-auth.service';
import { RedisRateLimitService } from '../../src/auth/redis-rate-limit.service';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

function responseDouble() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe('Public authentication controller contract', () => {
  it.each([
    ['walletChallenge', 'wallet-challenge'],
    ['walletVerify', 'wallet-verify'],
  ] as const)('protects %s with its own rate limit', (method, operation) => {
    const handler = AuthController.prototype[method];
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(AuthRateLimitGuard);
    expect(Reflect.getMetadata(AUTH_RATE_LIMIT_OPERATION, handler)).toBe(operation);
  });

  it('limits wallet requests per forwarded client and fails closed when the limiter fails', async () => {
    const counts = new Map<string, number>();
    const consume = jest.fn().mockImplementation(async (key: string, limit: number) => {
      const count = (counts.get(key) ?? 0) + 1;
      counts.set(key, count);
      return { allowed: count <= limit };
    });
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthRateLimitGuard, { provide: RedisRateLimitService, useValue: { consume } },
        { provide: AuthService, useValue: {} },
        { provide: WalletAuthService, useValue: {
          createChallenge: jest.fn().mockResolvedValue({}),
          verifyChallenge: jest.fn().mockResolvedValue({ access_token: 'access', refresh_token: 'refresh' }),
        } }],
    }).compile();
    const app = module.createNestApplication<NestExpressApplication>();
    app.set('trust proxy', 'loopback');
    await app.init();
    try {
      for (let i = 0; i < 20; i += 1) {
        await request(app.getHttpServer()).post('/auth/wallet/challenge').set('X-Forwarded-For', '198.51.100.2, 203.0.113.10').send({}).expect(201);
      }
      await request(app.getHttpServer()).post('/auth/wallet/challenge').set('X-Forwarded-For', '198.51.100.3, 203.0.113.10').send({}).expect(429);
      await request(app.getHttpServer()).post('/auth/wallet/verify').set('X-Forwarded-For', '203.0.113.10').send({}).expect(201);
      await request(app.getHttpServer()).post('/auth/wallet/challenge').set('X-Forwarded-For', '203.0.113.11').send({}).expect(201);
      consume.mockRejectedValueOnce(new Error('unavailable'));
      await request(app.getHttpServer()).post('/auth/wallet/challenge').set('X-Forwarded-For', '203.0.113.12').send({}).expect(503);
    } finally {
      await app.close();
    }
  });
  it('does not expose public email/password login or signup routes', () => {
    const controller = new AuthController({} as never);

    expect((controller as unknown as { login?: unknown }).login).toBeUndefined();
    expect((controller as unknown as { signup?: unknown }).signup).toBeUndefined();
  });

  it('establishes wallet sessions by setting an HttpOnly Secure refresh cookie', async () => {
    const response = responseDouble();
    const walletAuth = {
      verifyChallenge: jest.fn().mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        profile: { id: '100001' },
      }),
    };
    const controller = new AuthController({} as never, walletAuth as never);

    const result = await controller.walletVerify({ message: 'siwe', signature: '0xsigned' }, {} as never, response as never);

    expect(result).toEqual({ access_token: 'access-token', profile: { id: '100001' } });
    expect(response.cookie).toHaveBeenCalledWith('nexi_public_refresh', 'refresh-token', expect.objectContaining({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    }));
  });

  it('rotates the public cookie without accepting a refresh token from the request body', async () => {
    const response = responseDouble();
    const authService = {
      refresh: jest.fn().mockResolvedValue({ access_token: 'next-access', refresh_token: 'next-refresh', user: { id: '100001' } }),
    };
    const controller = new AuthController(authService as never);

    const result = await controller.refresh({ headers: { cookie: 'nexi_public_refresh=refresh-token' } } as never, response as never);

    expect(authService.refresh).toHaveBeenCalledWith('refresh-token', 'PUBLIC');
    expect(result).toEqual({ access_token: 'next-access', user: { id: '100001' } });
    expect(response.cookie).toHaveBeenCalledWith('nexi_public_refresh', 'next-refresh', expect.objectContaining({ httpOnly: true, secure: true }));
  });

  it('clears the public cookie on logout and logout-all', async () => {
    const response = responseDouble();
    const authService = {
      logout: jest.fn().mockResolvedValue({ revoked: true }),
      logoutAll: jest.fn().mockResolvedValue({ revokedCount: 1 }),
    };
    const controller = new AuthController(authService as never);
    const request = { user: { userId: 'user-1', surface: 'PUBLIC', sessionId: 'session-1' } } as never;

    await controller.logout(request, response as never);
    await controller.logoutAll(request, response as never);

    expect(response.clearCookie).toHaveBeenCalledTimes(2);
    expect(response.clearCookie).toHaveBeenCalledWith('nexi_public_refresh', expect.objectContaining({ path: '/', secure: true }));
  });
});
