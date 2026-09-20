import { CommunicationsService } from '../../src/communications/communications.service';
import { D1CommunicationsCommandGateway } from '../../src/d1/d1-communications-command.gateway';
import { CommunicationsController } from '../../src/communications/communications.controller';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';

describe('recipient-owned message read', () => {
  const previous = process.env.D1_RUNTIME_ENABLED;
  beforeEach(() => { process.env.D1_RUNTIME_ENABLED = 'true'; });
  afterEach(() => {
    if (previous === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previous;
  });

  it('batches ownership-scoped read and guarded outbox insertion, preserving first read time', async () => {
    const bridge: any = { isEnabled: () => true, batch: jest.fn(async () => ({ results: [{ meta: { changes: 1 } }] })) };
    const gateway = new D1CommunicationsCommandGateway(bridge);
    expect(await gateway.markMessageRead('recipient', 'message')).toBe(true);
    const statements = bridge.batch.mock.calls[0][0];
    expect(statements).toHaveLength(2);
    expect(statements[0].sql).toContain('COALESCE("readAt",CURRENT_TIMESTAMP)');
    expect(statements[0].sql).toContain('"recipientId"=?');
    expect(statements[0].params).toEqual(['message', 'recipient']);
    expect(statements[1].sql).toContain('WHERE EXISTS');
    expect(statements[1].sql).toContain('"recipientId"=?');
    expect(statements[1].params).toEqual(expect.arrayContaining(['message-read:message', 'PERSISTENT_MESSAGE', 'MESSAGE_READ', 'message', 'recipient']));
    await gateway.markMessageRead('recipient', 'message');
    expect(bridge.batch.mock.calls[1][0][1].params[1]).toBe(statements[1].params[1]);
  });

  it('does not read back another recipient message when the command rejects ownership', async () => {
    const findUnique = jest.fn();
    const gateway: any = { markMessageRead: jest.fn(async () => false) };
    const service = new CommunicationsService({ persistentMessage: { findUnique } } as any, {} as any, gateway, { isAvailable: () => false } as any);
    await expect(service.markMessageRead('stranger', 'message')).rejects.toMatchObject({ status: 404 });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('uses authenticated identity and preserves the guarded HTTP route contract', async () => {
    const service: any = { markMessageRead: jest.fn(async () => ({ id: 'message' })) };
    const controller = new CommunicationsController(service);
    await controller.readMessage({ user: { userId: 'recipient' } } as any, 'message');
    expect(service.markMessageRead).toHaveBeenCalledWith('recipient', 'message');
    expect(Reflect.getMetadata(PATH_METADATA, controller.readMessage)).toBe('messages/:id/read');
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.readMessage)).toContain(JwtAuthGuard);
  });

  it('reports zero changes and fails closed on disabled bridge or batch failure', async () => {
    const bridge: any = { isEnabled: () => true, batch: jest.fn(async () => ({ results: [{ meta: { changes: 0 } }] })) };
    const gateway = new D1CommunicationsCommandGateway(bridge);
    expect(await gateway.markMessageRead('stranger', 'message')).toBe(false);
    bridge.batch.mockRejectedValueOnce(new Error('batch failed'));
    await expect(gateway.markMessageRead('recipient', 'message')).rejects.toThrow('batch failed');
    process.env.D1_RUNTIME_ENABLED = 'false';
    await expect(gateway.markMessageRead('recipient', 'message')).rejects.toThrow('disabled');
    expect(bridge.batch).toHaveBeenCalledTimes(2);
  });

  it('returns authoritative D1 read-back after successful durable command', async () => {
    const message = { id: 'message', senderId: 'sender', recipientId: 'recipient', readAt: '2026-09-08T00:00:00Z' };
    const findUnique = jest.fn(async () => message);
    const gateway: any = { markMessageRead: jest.fn(async () => true) };
    const publish = jest.fn().mockResolvedValue(undefined);
    const redis: any = { isAvailable: () => true, publish };
    const service = new CommunicationsService({ persistentMessage: { findUnique } } as any, {} as any, gateway, redis);
    expect(await service.markMessageRead('recipient', 'message')).toBe(message);
    expect(gateway.markMessageRead).toHaveBeenCalledWith('recipient', 'message');
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'message' } });
    expect(JSON.parse(publish.mock.calls[0][1])).toEqual(expect.objectContaining({
      type: 'MESSAGE_READ',
      payload: expect.objectContaining({
        userId: 'recipient',
        senderId: 'sender',
        recipientId: 'recipient',
      }),
    }));
  });
});
