import { Role } from '../../src/prisma/d1-client';
import { CommunicationsGateway } from '../../src/communications/communications.gateway';

function makeGateway() {
  const jwt = { verifyAsync: jest.fn() };
  const jwtStrategy = { validate: jest.fn() };
  const adminPermissions = { hasPermission: jest.fn() };
  const redis = { isAvailable: jest.fn(() => false), createSubscriber: jest.fn(), releaseSubscriber: jest.fn() };
  const service = { snapshot: jest.fn() };
  const gateway = new CommunicationsGateway(jwt as never, jwtStrategy as never, adminPermissions as never, redis as never, service as never);
  const joins: string[] = [];
  const socket = {
    handshake: { auth: { token: 'token' }, headers: {} },
    data: {} as Record<string, unknown>,
    join: jest.fn(async (room: string) => { joins.push(room); }),
  };
  let middleware: ((socket: typeof socket, next: (error?: Error) => void) => void) | undefined;
  const namespace = {
    use: jest.fn((fn: typeof middleware) => { middleware = fn; }),
    to: jest.fn((room: string) => ({ emit: jest.fn() })),
  };
  (gateway as any).server = namespace;
  gateway.afterInit(namespace as never);
  return { gateway, jwt, jwtStrategy, adminPermissions, socket, joins, namespace, authenticate: (next = jest.fn()) => {
    middleware!(socket as never, next);
    return next;
  } };
}

describe('CommunicationsGateway authenticated rooms', () => {
  it('retries the communications subscription after a startup Redis outage', async () => {
    jest.useFakeTimers();
    try {
      const subscriber = { subscribe: jest.fn().mockResolvedValue(1), on: jest.fn() };
      const redis = {
        isAvailable: jest.fn().mockReturnValueOnce(false).mockReturnValue(true),
        createSubscriber: jest.fn().mockResolvedValue(subscriber),
        releaseSubscriber: jest.fn().mockResolvedValue(undefined),
      };
      const gateway = new CommunicationsGateway({} as never, {} as never, {} as never, redis as never, {} as never);

      await gateway.onModuleInit();
      expect(redis.createSubscriber).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1_000);

      expect(redis.createSubscriber).toHaveBeenCalledTimes(1);
      expect(subscriber.subscribe).toHaveBeenCalledWith('nexi:b8:communications');
      await gateway.onModuleDestroy();
      expect(redis.releaseSubscriber).toHaveBeenCalledWith(subscriber);
    } finally {
      jest.useRealTimers();
    }
  });

  it('accepts a validated Public user and joins only that user room', async () => {
    const ctx = makeGateway();
    ctx.jwt.verifyAsync.mockResolvedValue({ sub: 'customer-1', role: Role.USER, surface: 'PUBLIC' });
    ctx.jwtStrategy.validate.mockResolvedValue({ userId: 'customer-1', role: Role.USER, surface: 'PUBLIC' });
    const next = ctx.authenticate();

    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(next).toHaveBeenCalledWith();
    await ctx.gateway.handleConnection(ctx.socket as never);
    expect(ctx.joins).toEqual(['user:customer-1']);
    expect(ctx.adminPermissions.hasPermission).not.toHaveBeenCalled();
  });

  it('rejects an Admin session without the messages.view permission', async () => {
    const ctx = makeGateway();
    ctx.jwt.verifyAsync.mockResolvedValue({ sub: 'admin-1', role: Role.ADMIN, surface: 'ADMIN' });
    ctx.jwtStrategy.validate.mockResolvedValue({ userId: 'admin-1', role: Role.ADMIN, surface: 'ADMIN' });
    ctx.adminPermissions.hasPermission.mockResolvedValue(false);
    const next = ctx.authenticate();

    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(ctx.adminPermissions.hasPermission).toHaveBeenCalledWith('admin-1', 'messages.view');
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(ctx.joins).toEqual([]);
  });

  it('lets a permitted Admin join the Messages invalidation room', async () => {
    const ctx = makeGateway();
    ctx.jwt.verifyAsync.mockResolvedValue({ sub: 'admin-1', role: Role.ADMIN, surface: 'ADMIN' });
    ctx.jwtStrategy.validate.mockResolvedValue({ userId: 'admin-1', role: Role.ADMIN, surface: 'ADMIN' });
    ctx.adminPermissions.hasPermission.mockResolvedValue(true);
    const next = ctx.authenticate();

    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(next).toHaveBeenCalledWith();
    await ctx.gateway.handleConnection(ctx.socket as never);
    expect(ctx.joins).toEqual(['admin:communications:messages']);
  });

  it('sends support invalidations to Admin without message content and preserves customer events', () => {
    const ctx = makeGateway();
    const emitted = new Map<string, jest.Mock>();
    ctx.namespace.to.mockImplementation((room: string) => {
      const emit = jest.fn();
      emitted.set(room, emit);
      return { emit };
    });
    const event = {
      type: 'MESSAGE_SENT',
      payload: { senderId: 'customer-1', recipientId: 'support:nexi', body: 'private text', attachments: [{ id: 'private-file' }] },
    };

    (ctx.gateway as any).broadcast(JSON.stringify(event));

    expect(emitted.get('admin:communications:messages')).toHaveBeenCalledWith('communications.changed', expect.objectContaining({ sequence: 1 }));
    expect(JSON.stringify(emitted.get('admin:communications:messages')?.mock.calls)).not.toContain('private text');
    expect(emitted.get('user:customer-1')).toHaveBeenCalledWith('communications.event', expect.objectContaining({ event }));
    expect(emitted.has('user:support:nexi')).toBe(false);
  });
});
