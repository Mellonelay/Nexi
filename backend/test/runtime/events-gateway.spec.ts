import { EventsGateway } from '../../src/events/events.gateway';

describe('EventsGateway Redis outage handling', () => {
  it('does not publish system metrics while Redis is unavailable', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const isAvailable = jest.fn().mockReturnValue(false);
    const gateway = new EventsGateway(
      { isAvailable } as any,
      {} as any,
      {} as any,
    );
    (gateway as any).server = { to };
    (gateway as any).connectedClients.set('socket-1', 'user-1');

    (gateway as any).broadcastSystemMetrics();

    expect(to).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('publishes system metrics when Redis is available', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const isAvailable = jest.fn().mockReturnValue(true);
    const gateway = new EventsGateway(
      { isAvailable } as any,
      {} as any,
      {} as any,
    );
    (gateway as any).server = { to };
    (gateway as any).connectedClients.set('socket-1', 'user-1');

    (gateway as any).broadcastSystemMetrics();

    expect(to).toHaveBeenCalledWith('admin_room');
    expect(emit).toHaveBeenCalledWith('systemMetrics', expect.objectContaining({ onlineUsers: 1, totalConnections: 1 }));
  });

  it('rejects unauthenticated Admin room joins', async () => {
    const emit = jest.fn();
    const gateway = new EventsGateway(
      { isAvailable: jest.fn().mockReturnValue(true) } as any,
      { verifyAsync: jest.fn() } as any,
      {} as any,
    );
    const client = { handshake: { auth: {} }, emit, join: jest.fn() } as any;

    await expect(gateway.handleJoinAdmin(client)).resolves.toEqual({ ok: false });
    expect(client.join).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('error', { message: 'Admin authentication is required' });
  });

  it('accepts only an authenticated Admin-surface Admin room join', async () => {
    const gateway = new EventsGateway(
      { isAvailable: jest.fn().mockReturnValue(false) } as any,
      { verifyAsync: jest.fn().mockResolvedValue({ sub: 'admin-1', role: 'ADMIN', surface: 'ADMIN' }) } as any,
      {} as any,
    );
    const client = { handshake: { auth: { token: 'admin-token' } }, emit: jest.fn(), join: jest.fn(), data: {} } as any;

    await expect(gateway.handleJoinAdmin(client)).resolves.toEqual({ ok: true });
    expect(client.join).toHaveBeenCalledWith('admin_room');
    expect(client.data.authenticatedUser).toEqual(expect.objectContaining({ sub: 'admin-1', surface: 'ADMIN' }));
  });
});
