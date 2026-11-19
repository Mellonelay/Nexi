import { JwtService } from '@nestjs/jwt';
import { BinaryGateway } from '../../src/binary/binary.gateway';

describe('Gate2 Binary realtime boundary', () => {
  const tokenService = new JwtService({ secret: 'gate2-gateway-test-secret' });

  it('joins only the verified public JWT subject and revocable session rooms', async () => {
    const jwtStrategy = { validate: jest.fn().mockResolvedValue({ userId: 'verified-user', surface: 'PUBLIC', sessionId: 'session-1' }) };
    const gateway = new BinaryGateway(tokenService, jwtStrategy as never, {} as never);
    const join = jest.fn();
    const disconnect = jest.fn();
    const token = tokenService.sign({ sub: 'verified-user', surface: 'PUBLIC', sid: 'session-1' });

    await gateway.handleConnection({ handshake: { auth: { token }, headers: {} }, join, disconnect } as never);

    expect(jwtStrategy.validate).toHaveBeenCalledWith(expect.objectContaining({ sid: 'session-1' }));
    expect(join).toHaveBeenCalledWith('verified-user');
    expect(join).toHaveBeenCalledWith('auth-session:session-1');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('rejects an otherwise signed Public token without a validated active session', async () => {
    const jwtStrategy = { validate: jest.fn().mockResolvedValue({ userId: 'verified-user', surface: 'PUBLIC' }) };
    const gateway = new BinaryGateway(tokenService, jwtStrategy as never, {} as never);
    const join = jest.fn();
    const disconnect = jest.fn();
    await gateway.handleConnection({
      handshake: { auth: { token: tokenService.sign({ sub: 'verified-user', surface: 'PUBLIC' }) }, headers: {} },
      join, disconnect,
    } as never);
    expect(join).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('rejects missing, invalid, and Admin-surface tokens', async () => {
    const jwtStrategy = { validate: jest.fn().mockResolvedValue({ userId: 'admin', surface: 'ADMIN', sessionId: 'admin-session' }) };
    const gateway = new BinaryGateway(tokenService, jwtStrategy as never, {} as never);
    for (const auth of [{}, { token: 'invalid' }, { token: tokenService.sign({ sub: 'admin', surface: 'ADMIN' }) }]) {
      const disconnect = jest.fn();
      await gateway.handleConnection({ handshake: { auth, headers: {} }, join: jest.fn(), disconnect } as never);
      expect(disconnect).toHaveBeenCalledWith(true);
    }
  });
});
