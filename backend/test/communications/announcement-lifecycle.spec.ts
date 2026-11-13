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
        findUnique: jest.fn()
          .mockResolvedValueOnce(draft)
          .mockResolvedValueOnce(draft)
          .mockResolvedValueOnce(published),
        update: jest.fn(async () => published),
        findMany,
      },
    };
    const outbox: any = { recordEvent: jest.fn(async () => ({})) };
    const commands: any = { mutateAnnouncementAtomic: jest.fn(async () => undefined) };
    const service = new CommunicationsService(d1, outbox, commands, { isAvailable: () => false } as any);

    expect(await service.createAnnouncement({ title: 'Maintenance', body: 'Window', published: false, idempotencyKey: 'announcement-create-1' })).toBe(draft);
    expect(commands.mutateAnnouncementAtomic).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'create', values: expect.objectContaining({ title: 'Maintenance', published: 0 }),
    }));

    expect(await service.publishAnnouncement(draft.id, 'announcement-publish-1')).toBe(published);
    expect(commands.mutateAnnouncementAtomic).toHaveBeenLastCalledWith(expect.objectContaining({
      mode: 'update', values: expect.objectContaining({ published: 1 }),
    }));

    expect(await service.announcements()).toEqual([expect.objectContaining(published)]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ published: true }),
    }));
  });

  it('orders pinned announcements first and resolves backend-owned localization', async () => {
    const row = {
      id: 'announcement-2',
      title: 'English',
      body: 'Body',
      published: true,
      pinned: true,
      pinOrder: 2,
      localizations: JSON.stringify({ my: { title: 'မြန်မာ', body: 'စာကိုယ်' } }),
    };
    const findMany = jest.fn(async () => [row]);
    const service = new CommunicationsService(
      { announcement: { findMany } } as any,
      { recordEvent: jest.fn() } as any,
      {} as any,
      { isAvailable: () => false } as any,
    );

    const result = await service.announcements('my-MM');
    expect(result[0]).toEqual(expect.objectContaining({ title: 'မြန်မာ', body: 'စာကိုယ်', pinned: true }));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ pinned: 'desc' }, { pinOrder: 'asc' }, { createdAt: 'desc' }],
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


describe('Admin announcement RBAC boundary', () => {
  it('requires the publish permission on every announcement mutation', () => {
    const permissionKey = 'nexi:admin-permission';
    const handlers = [CommunicationsController.prototype.createAnnouncement, CommunicationsController.prototype.updateAnnouncement, CommunicationsController.prototype.publishAnnouncement];
    for (const handler of handlers) {
      expect(Reflect.getMetadata(permissionKey, handler)).toBe('announcements.publish');
      expect(Reflect.getMetadata(GUARDS_METADATA, handler).some((guard: { name: string }) => guard.name === 'AdminPermissionGuard')).toBe(true);
    }
  });
});
