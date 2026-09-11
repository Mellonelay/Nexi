import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { CommunicationsController } from '../../src/communications/communications.controller';
import { CommunicationsService } from '../../src/communications/communications.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';

describe('A17 announcement lifecycle closure', () => {
  const previous = process.env.D1_RUNTIME_ENABLED;
  beforeEach(() => { process.env.D1_RUNTIME_ENABLED = 'true'; });
  afterEach(() => {
    if (previous === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previous;
  });

  it('creates, publishes, and exposes only publication-ready durable announcements', async () => {
    const draft = { id: 'announcement-1', title: 'Maintenance', body: 'Window', published: false, startsAt: null, endsAt: null };
    const published = { ...draft, published: true };
    const findMany = jest.fn(async () => [published]);
    const d1: any = {
      announcement: {
        upsert: jest.fn(async () => draft),
        findUnique: jest.fn(async () => draft),
        update: jest.fn(async () => published),
        findMany,
      },
    };
    const outbox: any = { recordEvent: jest.fn(async () => ({})) };
    const service = new CommunicationsService(d1, outbox, {} as any, { isAvailable: () => false } as any);

    expect(await service.createAnnouncement({ title: 'Maintenance', body: 'Window', published: false, idempotencyKey: 'announcement-create-1' })).toBe(draft);
    expect(outbox.recordEvent).toHaveBeenNthCalledWith(1, expect.objectContaining({ eventType: 'ANNOUNCEMENT_CREATED', aggregateId: draft.id }));

    expect(await service.publishAnnouncement(draft.id, 'announcement-publish-1')).toBe(published);
    expect(d1.announcement.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: draft.id }, data: expect.objectContaining({ published: true }) }));
    expect(outbox.recordEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({
      eventType: 'ANNOUNCEMENT_PUBLISHED',
      idempotencyKey: `announcement:${draft.id}:announcement-publish-1`,
    }));

    expect(await service.announcements()).toEqual([published]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ published: true }),
    }));
  });

  it('preserves ADMIN-guarded update and publish HTTP contracts', async () => {
    const service: any = {
      updateAnnouncement: jest.fn(async () => ({ id: 'announcement-1' })),
      publishAnnouncement: jest.fn(async () => ({ id: 'announcement-1', published: true })),
    };
    const controller = new CommunicationsController(service);
    await controller.updateAnnouncement('announcement-1', { title: 'Updated', idempotencyKey: 'announcement-update-1' } as any);
    await controller.publishAnnouncement('announcement-1', { idempotencyKey: 'announcement-publish-1' } as any);

    expect(service.updateAnnouncement).toHaveBeenCalledWith('announcement-1', expect.objectContaining({ title: 'Updated' }));
    expect(service.publishAnnouncement).toHaveBeenCalledWith('announcement-1', 'announcement-publish-1');
    expect(Reflect.getMetadata(PATH_METADATA, controller.updateAnnouncement)).toBe('admin/announcements/:id');
    expect(Reflect.getMetadata(PATH_METADATA, controller.publishAnnouncement)).toBe('admin/announcements/:id/publish');
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.updateAnnouncement)).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.publishAnnouncement)).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
  });
});
