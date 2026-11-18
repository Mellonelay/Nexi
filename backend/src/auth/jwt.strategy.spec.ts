import { Role } from '../prisma/d1-client';
import { JwtStrategy } from './jwt.strategy';

describe('JWT claim contract', () => {
  const activeSession = {
    id: 'active-wallet-session',
    userId: 'wallet-user',
    surface: 'PUBLIC',
    revokedAt: null,
    absoluteExpiresAt: new Date('2099-01-01T00:00:00.000Z'),
    idleExpiresAt: new Date('2099-01-01T00:00:00.000Z'),
  };
  const d1 = {
    getAuthSessionById: jest.fn().mockResolvedValue(activeSession),
    getUserById: jest.fn().mockResolvedValue({ id: 'wallet-user', role: Role.USER }),
  };
  const strategy = new JwtStrategy({ getOrThrow: () => 'test-only-secret' } as never, d1 as never);

  it('accepts wallet-native users with a valid revocable session and null canonical email', async () => {
    await expect(strategy.validate({ sub: 'wallet-user', sid: 'active-wallet-session', email: null, role: Role.USER, surface: 'PUBLIC' })).resolves.toEqual({
      userId: 'wallet-user',
      email: null,
      role: Role.USER,
      surface: 'PUBLIC',
      sessionId: 'active-wallet-session',
    });
    expect(d1.getAuthSessionById).toHaveBeenCalledWith('active-wallet-session');
  });

  it('rejects tokens without durable session identity before database lookup', async () => {
    await expect(strategy.validate({ sub: 'wallet-user', email: null, role: Role.USER, surface: 'PUBLIC' })).rejects.toThrow('Authentication session identity is missing');
  });

  it('rejects missing subjects and invalid email claims', async () => {
    await expect(strategy.validate({ sub: '', email: null, role: Role.USER, surface: 'PUBLIC' })).rejects.toThrow('Invalid authentication claims');
    await expect(strategy.validate({ sub: 'wallet-user', email: 42 as never, role: Role.USER, surface: 'PUBLIC' })).rejects.toThrow('Invalid authentication claims');
  });
});
