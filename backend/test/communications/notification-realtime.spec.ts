import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { CommunicationsController } from '../../src/communications/communications.controller';
import { CommunicationsGateway } from '../../src/communications/communications.gateway';
import { CommunicationsService } from '../../src/communications/communications.service';
import { D1CommunicationsCommandGateway } from '../../src/d1/d1-communications-command.gateway';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';

describe('A19 notification durable realtime closure', () => {
  const previous = process.env.D1_RUNTIME_ENABLED;
  beforeEach(() => { process.env.D1_RUNTIME_ENABLED = 'true'; });
  afterEach(() => {
    if (previous === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previous;
  });

  it('atomically plans D1 notification creation with its EventOutbox record', async () => {
    const bridge: any = { isEnabled: () => true, batch: jest.fn(async () => ({ results: [{ meta: { changes: 1 } }, { meta: { changes: 1 } }] })) };
    const gateway = new D1CommunicationsCommandGateway(bridge);
    await gateway.createNotification({
      id: 'notification-1', userId: '11111111-1111-4111-8111-111111111111', type: 'info', title: 'Alert', body: 'Body',
      idempotencyKey: 'notification-send-1', eventType: 'NOTIFICATION_SENT',
    });
    const statements = bridge.batch.mock.calls[0][0];
    expect(statements).toHaveLength(2);
    expect(statements[0].sql).toContain('INSERT OR IGNORE INTO "Notification"');
    expect(statements[1].sql).toContain('INSERT OR IGNORE INTO "EventOutbox"');
    expect(statements[1].params).toEqual(expect.arrayContaining(['notification-send-1', 'NOTIFICATION', 'notification-1', 'NOTIFICATION_SENT']));
  });

  it('publishes durable notification mutations onto the existing communications Redis channel', async () => {
    const notification = { id: 'notification-1', userId: '11111111-1111-4111-8111-111111111111', type: 'info', title: 'Alert', body: 'Body', readAt: null };
    const d1: any = { notification: { findUnique: jest.fn(async () => notification) } };
    const d1Gateway: any = {
      createNotification: jest.fn(async () => undefined),
      markNotificationRead: jest.fn(async () => true),
    };
    const redis: any = { isAvailable: () => true, publish: jest.fn(async () => 1) };
    const outbox = { recordEvent: jest.fn().mockResolvedValue(undefined) };
    const service = new CommunicationsService(d1, outbox as any, d1Gateway, redis);

    expect(await service.sendAdminNotification({
      userId: notification.userId, type: 'info', title: 'Alert', body: 'Body', idempotencyKey: 'notification-send-1', reason: 'operator request',
    })).toEqual(notification);
    expect(d1Gateway.createNotification).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'NOTIFICATION_SENT', idempotencyKey: 'notification-send-1' }));
    expect(redis.publish).toHaveBeenCalledWith('nexi:b8:communications', expect.stringContaining('NOTIFICATION_SENT'));

    await service.markNotificationRead(notification.userId, notification.id);
    expect(redis.publish).toHaveBeenCalledWith('nexi:b8:communications', expect.stringContaining('NOTIFICATION_READ'));
  });

  it('targets communications events to the authenticated user room', () => {
    const emit = jest.fn();
    const gateway = new CommunicationsGateway({} as any, {} as any, {} as any);
    (gateway as any).server = { to: jest.fn(() => ({ emit })) };
    (gateway as any).broadcast(JSON.stringify({ type: 'NOTIFICATION_SENT', referenceId: 'notification-1', payload: { userId: 'user-1' } }));
    expect((gateway as any).server.to).toHaveBeenCalledWith('user:user-1');
    expect(emit).toHaveBeenCalledWith('communications.event', expect.objectContaining({ event: expect.objectContaining({ type: 'NOTIFICATION_SENT' }) }));
  });

  it('preserves ADMIN-guarded notification send HTTP contract', async () => {
    const service: any = { sendAdminNotification: jest.fn(async () => ({ id: 'notification-1' })) };
    const controller = new CommunicationsController(service);
    await controller.sendAdminNotification({ userId: '11111111-1111-4111-8111-111111111111', type: 'info', title: 'Alert', body: 'Body', idempotencyKey: 'notification-send-1' } as any);
    expect(Reflect.getMetadata(PATH_METADATA, controller.sendAdminNotification)).toBe('admin/notifications');
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.sendAdminNotification)).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
  });
});
