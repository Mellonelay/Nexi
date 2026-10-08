import { Role } from '../prisma/d1-client';
import { JwtStrategy } from './jwt.strategy';

describe('JWT claim contract', () => {
  const strategy = new JwtStrategy({ getOrThrow: () => 'test-only-secret' } as never, {} as never);

  it('accepts wallet-native users whose canonical email is null', async () => {
    await expect(strategy.validate({ sub: 'wallet-user', email: null, role: Role.USER, surface: 'PUBLIC' })).resolves.toEqual({
      userId: 'wallet-user',
      email: null,
      role: Role.USER,
      surface: 'PUBLIC',
    });
  });

  it('rejects missing subjects and invalid email claims', async () => {
    await expect(strategy.validate({ sub: '', email: null, role: Role.USER, surface: 'PUBLIC' })).rejects.toThrow('Invalid authentication claims');
    await expect(strategy.validate({ sub: 'wallet-user', email: 42 as never, role: Role.USER, surface: 'PUBLIC' })).rejects.toThrow('Invalid authentication claims');
  });
});
