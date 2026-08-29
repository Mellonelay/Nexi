import { JwtService } from '@nestjs/jwt';
import { BinaryGateway } from '../../src/binary/binary.gateway';

describe('Gate2 Binary realtime boundary', () => {
  const tokenService = new JwtService({ secret: 'gate2-gateway-test-secret' });

  it('joins only the verified public JWT subject room', () => {
    const gateway = new BinaryGateway(tokenService);
    const join = jest.fn();
    const disconnect = jest.fn();
    const token = tokenService.sign({ sub: 'verified-user', surface: 'PUBLIC' });

    gateway.handleConnection({ handshake: { auth: { token } }, join, disconnect } as never);

    expect(join).toHaveBeenCalledWith('verified-user');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('rejects missing, invalid, and Admin-surface tokens', () => {
    const gateway = new BinaryGateway(tokenService);
    for (const auth of [{}, { token: 'invalid' }, { token: tokenService.sign({ sub: 'admin', surface: 'ADMIN' }) }]) {
      const disconnect = jest.fn();
      gateway.handleConnection({ handshake: { auth }, join: jest.fn(), disconnect } as never);
      expect(disconnect).toHaveBeenCalledWith(true);
    }
  });
});
