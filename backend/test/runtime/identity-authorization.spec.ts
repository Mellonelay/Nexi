import 'reflect-metadata';
import { ExecutionContext, ForbiddenException, ServiceUnavailableException, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { AuthController } from '../../src/auth/auth.controller';
import { KycSubmissionDto, SignupDto } from '../../src/auth/auth.dto';
import { AUTH_RATE_LIMIT_OPERATION } from '../../src/auth/auth-rate-limit.decorator';
import { AuthRateLimitExceededException, AuthRateLimitGuard } from '../../src/auth/auth-rate-limit.guard';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { JwtStrategy } from '../../src/auth/jwt.strategy';
import { AuthenticatedUser } from '../../src/auth/auth.types';
import { AuthService } from '../../src/auth/auth.service';
import { DevelopmentOnlyGuard } from '../../src/auth/development-only.guard';
import { OwnershipGuard } from '../../src/auth/ownership.guard';
import { REFRESH_TOKEN_BYTES, RefreshTokenCryptoService } from '../../src/auth/refresh-token-crypto.service';
import { RedisRateLimitService } from '../../src/auth/redis-rate-limit.service';
import { RolesGuard } from '../../src/auth/roles.guard';
import { AdminAuthController } from '../../src/admin/admin-auth.controller';
import { ContractController } from '../../src/contract/contract.controller';
import { UploadFeedbackDto } from '../../src/feedback/feedback.dto';
import { SpotController } from '../../src/spot/spot.controller';

function httpContext(user: AuthenticatedUser | undefined, requestFields: Record<string, unknown> = {}): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user, ...requestFields }) }),
  } as unknown as ExecutionContext;
}

describe('B1 identity and authorization foundation', () => {
  it('rejects unauthenticated and non-admin principals at the role boundary', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(httpContext(undefined))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(httpContext({ userId: 'user-1', email: 'u@example.test', role: Role.USER }))).toThrow(ForbiddenException);
    expect(guard.canActivate(httpContext({ userId: 'admin-1', email: 'a@example.test', role: Role.ADMIN }))).toBe(true);
  });

  it('rejects malformed JWT claims and returns a server-derived principal', async () => {
    const config = { getOrThrow: jest.fn().mockReturnValue('test-secret') };
    const strategy = new JwtStrategy(config as never);

    await expect(strategy.validate({ sub: 'user-1', email: 'u@example.test', role: Role.USER })).resolves.toEqual({
      userId: 'user-1',
      email: 'u@example.test',
      role: Role.USER,
      surface: 'PUBLIC',
    });
    await expect(strategy.validate({ sub: 'admin-1', email: 'a@example.test', role: Role.ADMIN, surface: 'ADMIN' })).resolves.toEqual({
      userId: 'admin-1',
      email: 'a@example.test',
      role: Role.ADMIN,
      surface: 'ADMIN',
    });
    await expect(strategy.validate({ sub: '', email: 'u@example.test', role: Role.USER })).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate({ sub: 'user-1', email: 'u@example.test', role: 'SUPER_ADMIN' } as never)).rejects.toThrow(UnauthorizedException);
    await expect(strategy.validate({ sub: 'user-1', email: 'u@example.test', role: Role.USER, surface: 'UNKNOWN' } as never)).rejects.toThrow(UnauthorizedException);
  });

  it('requires an explicit Admin authentication surface for Admin routes', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('ADMIN'),
    } as unknown as Reflector;
    const guard = new AuthSurfaceGuard(reflector);

    expect(guard.canActivate(httpContext({ userId: 'admin-1', email: 'a@example.test', role: Role.ADMIN, surface: 'ADMIN' }))).toBe(true);
    expect(() => guard.canActivate(httpContext({ userId: 'admin-1', email: 'a@example.test', role: Role.ADMIN, surface: 'PUBLIC' }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(httpContext({ userId: 'admin-1', email: 'a@example.test', role: Role.ADMIN }))).toThrow(UnauthorizedException);
  });

  it('rejects revoked sessions and role changes for session-bound access tokens', async () => {
    const config = { getOrThrow: jest.fn().mockReturnValue('test-secret') };
    const session = {
      userId: 'user-1',
      surface: 'PUBLIC',
      revokedAt: null,
      absoluteExpiresAt: new Date(Date.now() + 60_000),
      idleExpiresAt: new Date(Date.now() + 60_000),
    };
    const prisma = {
      authSession: { findUnique: jest.fn().mockResolvedValue(session) },
      user: { findUnique: jest.fn().mockResolvedValue({ role: Role.USER }) },
    };
    const strategy = new JwtStrategy(config as never, prisma as never);

    await expect(strategy.validate({ sub: 'user-1', email: 'u@example.test', role: Role.USER, surface: 'PUBLIC', sid: 'session-1', jti: 'jti-1' })).resolves.toEqual({
      userId: 'user-1',
      email: 'u@example.test',
      role: Role.USER,
      surface: 'PUBLIC',
      sessionId: 'session-1',
    });

    session.revokedAt = new Date();
    await expect(strategy.validate({ sub: 'user-1', email: 'u@example.test', role: Role.USER, surface: 'PUBLIC', sid: 'session-1' })).rejects.toThrow(UnauthorizedException);
    session.revokedAt = null;
    prisma.user.findUnique.mockResolvedValue({ role: Role.ADMIN });
    await expect(strategy.validate({ sub: 'user-1', email: 'u@example.test', role: Role.USER, surface: 'PUBLIC', sid: 'session-1' })).rejects.toThrow(UnauthorizedException);
  });

  it('issues Admin-surface credentials only through the Admin authentication controller', async () => {
    const login = jest.fn().mockResolvedValue({ access_token: 'admin-token' });
    const validateAdmin = jest.fn().mockResolvedValue({ id: 'admin-1', email: 'a@example.test', role: Role.ADMIN });
    const controller = new AdminAuthController({ login, validateAdmin } as never);

    await expect(controller.login({ email: 'a@example.test', password: 'correct horse battery staple' })).resolves.toEqual({ access_token: 'admin-token' });
    expect(validateAdmin).toHaveBeenCalledWith({ email: 'a@example.test', password: 'correct horse battery staple' });
    expect(login).toHaveBeenCalledWith(expect.objectContaining({ id: 'admin-1', role: Role.ADMIN }), 'ADMIN');
  });

  it('adds the authentication surface to signed access-token claims', async () => {
    const sign = jest.fn().mockReturnValue('signed-admin-token');
    const service = new AuthService({} as never, { sign } as never);

    await expect(service.login({ id: 'admin-1', email: 'a@example.test', role: Role.ADMIN }, 'ADMIN')).resolves.toEqual(expect.objectContaining({ access_token: 'signed-admin-token' }));
    expect(sign).toHaveBeenCalledWith(expect.objectContaining({ sub: 'admin-1', role: Role.ADMIN, surface: 'ADMIN' }));
  });

  it('binds newly issued access tokens to a durable session and returns only the raw refresh response value', async () => {
    const sign = jest.fn().mockReturnValue('signed-token');
    const createSession = jest.fn().mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
      surface: 'PUBLIC',
      tokenFamilyId: 'family-1',
      refreshToken: 'refresh-token-value',
    });
    const service = new AuthService({} as never, { sign } as never, { createSession } as never);

    await expect(service.login({ id: 'user-1', email: 'u@example.test', role: Role.USER }, 'PUBLIC')).resolves.toEqual(expect.objectContaining({
      access_token: 'signed-token',
      refresh_token: 'refresh-token-value',
    }));
    expect(createSession).toHaveBeenCalledWith('user-1', 'PUBLIC');
    expect(sign).toHaveBeenCalledWith(expect.objectContaining({ sid: 'session-1', jti: expect.any(String), surface: 'PUBLIC' }));
  });

  it('derives KYC ownership from the authenticated request instead of the body', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'kyc-1' });
    const controller = new AuthController(
      {} as never,
      { kYC: { create } } as never,
    );

    await controller.submitKyc(
      { user: { userId: 'authenticated-user', email: 'u@example.test', role: Role.USER } },
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        dob: '1815-12-10',
        country: 'GB',
        documentType: 'passport',
        documentUrl: 'https://files.example.test/document.png',
      },
    );

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'authenticated-user' }),
    }));
    expect(create.mock.calls[0][0].data).not.toHaveProperty('clientUserId');
  });

  it('rejects client-supplied identity and signup role injection at the validation boundary', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

    await expect(pipe.transform({
      userId: 'attacker',
      firstName: 'Ada',
      lastName: 'Lovelace',
      dob: '1815-12-10',
      country: 'GB',
      documentType: 'passport',
      documentUrl: 'https://files.example.test/document.png',
    }, { type: 'body', metatype: KycSubmissionDto, data: '' })).rejects.toThrow();

    await expect(pipe.transform({
      email: 'u@example.test',
      password: 'correct horse battery staple',
      role: Role.ADMIN,
    }, { type: 'body', metatype: SignupDto, data: '' })).rejects.toThrow();

    await expect(pipe.transform({
      image: 'not-an-image',
      text: 'feedback',
      annotations: [{ x: 1 }],
      unexpected: true,
    }, { type: 'body', metatype: UploadFeedbackDto, data: '' })).rejects.toThrow();
  });

  it('enforces route and body ownership against the authenticated principal', () => {
    const guard = new OwnershipGuard();
    const user = { userId: 'user-1', email: 'u@example.test', role: Role.USER };

    expect(guard.canActivate(httpContext(user, { params: { userId: 'user-1' } }))).toBe(true);
    expect(() => guard.canActivate(httpContext(user, { params: { userId: 'user-2' } }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(httpContext(user, { body: { userId: 'user-2' } }))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(httpContext(undefined, { params: { userId: 'user-1' } }))).toThrow(UnauthorizedException);
  });

  it('keeps development-only routes unavailable outside development', () => {
    const guard = new DevelopmentOnlyGuard();
    const originalEnvironment = process.env.NODE_ENV;

    process.env.NODE_ENV = 'test';
    expect(() => guard.canActivate(httpContext(undefined))).toThrow(ForbiddenException);

    process.env.NODE_ENV = 'development';
    expect(guard.canActivate(httpContext(undefined))).toBe(true);

    process.env.NODE_ENV = originalEnvironment;
  });

  it('derives Spot and leveraged-contract commands from the JWT principal', async () => {
    const spotService = { placeOrder: jest.fn().mockResolvedValue({ id: 'order-1' }) };
    const spotController = new SpotController(spotService as never);
    await spotController.placeOrder({
      userId: 'attacker',
      pair: 'BTC/USDT',
      side: 'BUY',
      type: 'MARKET',
      amount: '1',
      stopPrice: '99',
      idempotencyKey: 'route-order-key',
    } as never, { user: { userId: 'authenticated-user', email: 'u@example.test', role: Role.USER } });
    expect(spotService.placeOrder).toHaveBeenCalledWith('authenticated-user', {
      pair: 'BTC/USDT', side: 'BUY', type: 'MARKET', amount: '1', price: undefined,
      stopPrice: '99', idempotencyKey: 'route-order-key',
    });

    const contractService = { openPosition: jest.fn().mockResolvedValue({ id: 'position-1' }) };
    const contractController = new ContractController(contractService as never);
    await contractController.deal({
      userId: 'attacker',
      symbol: 'BTC/USDT',
      direction: 'BUY',
      amount: 1,
      leverNumber: 2,
      type: 0,
    } as never, { user: { userId: 'authenticated-user', email: 'u@example.test', role: Role.USER } });
    expect(contractService.openPosition).toHaveBeenCalledWith('authenticated-user', 'BTC/USDT', 'BUY', 1, 2);
  });

  it('generates opaque refresh tokens and compares only their hashes', () => {
    const service = new RefreshTokenCryptoService();
    const generated = service.generate();

    expect(Buffer.from(generated.token, 'base64url')).toHaveLength(REFRESH_TOKEN_BYTES);
    expect(generated.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(generated.hash).not.toContain(generated.token);
    expect(service.matches(generated.token, generated.hash)).toBe(true);
    expect(service.matches(`${generated.token}tampered`, generated.hash)).toBe(false);
    expect(service.matches(generated.token, 'not-a-sha256-hash')).toBe(false);

    const second = service.generate();
    expect(second.token).not.toBe(generated.token);
    expect(second.hash).not.toBe(generated.hash);
  });

  it('rate-limits authentication by hashed source and account keys without exposing raw identifiers', async () => {
    const keys: string[] = [];
    const handler = jest.fn();
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('login'),
    } as unknown as Reflector;
    const rateLimiter = {
      consume: jest.fn().mockImplementation(async (key: string) => {
        keys.push(key);
        return { allowed: true, count: 1, limit: 5, retryAfterSeconds: 60 };
      }),
    } as unknown as RedisRateLimitService;
    const guard = new AuthRateLimitGuard(reflector, rateLimiter);
    const context = {
      getHandler: () => handler,
      getClass: () => AuthController,
      switchToHttp: () => ({ getRequest: () => ({ ip: '192.0.2.10', body: { email: 'User@Example.test' } }) }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(keys).toHaveLength(2);
    expect(keys.join('|')).not.toContain('192.0.2.10');
    expect(keys.join('|')).not.toContain('User@Example.test');
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(AUTH_RATE_LIMIT_OPERATION, [handler, AuthController]);
  });

  it('fails closed when an authentication rate-limit decision is unavailable', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue('signup') } as unknown as Reflector;
    const rateLimiter = { consume: jest.fn().mockRejectedValue(new Error('redis unavailable')) } as unknown as RedisRateLimitService;
    const guard = new AuthRateLimitGuard(reflector, rateLimiter);
    const context = httpContext(undefined, { ip: '192.0.2.11', body: { email: 'u@example.test' } });

    await expect(guard.canActivate(context)).rejects.toThrow(ServiceUnavailableException);
  });

  it('rejects authentication when a rate-limit threshold is exceeded', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue('login') } as unknown as Reflector;
    const rateLimiter = {
      consume: jest.fn().mockResolvedValue({ allowed: false, count: 21, limit: 20, retryAfterSeconds: 60 }),
    } as unknown as RedisRateLimitService;
    const guard = new AuthRateLimitGuard(reflector, rateLimiter);

    await expect(guard.canActivate(httpContext(undefined, { ip: '192.0.2.12', body: {} }))).rejects.toThrow(AuthRateLimitExceededException);
  });

  it('hashes refresh-token material before using it for rate-limit keys', async () => {
    const keys: string[] = [];
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue('refresh') } as unknown as Reflector;
    const rateLimiter = {
      consume: jest.fn().mockImplementation(async (key: string) => {
        keys.push(key);
        return { allowed: true, count: 1, limit: 5, retryAfterSeconds: 60 };
      }),
    } as unknown as RedisRateLimitService;
    const guard = new AuthRateLimitGuard(reflector, rateLimiter);
    const refreshToken = 'a'.repeat(43);

    await expect(guard.canActivate(httpContext(undefined, { ip: '192.0.2.13', body: { refreshToken } }))).resolves.toBe(true);
    expect(keys).toHaveLength(2);
    expect(keys.join('|')).not.toContain(refreshToken);
  });
});
