import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { CommunicationsController } from '../../src/communications/communications.controller';
import { CommunicationsService } from '../../src/communications/communications.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { AdminPermissionGuard } from '../../src/admin/admin-permission.guard';
import { ADMIN_PERMISSION_KEY } from '../../src/admin/admin-permission.decorator';
import { AUTH_SURFACE_METADATA } from '../../src/auth/auth-surface.decorator';

describe('A18 Learn lifecycle closure', () => {
  const previous = process.env.D1_RUNTIME_ENABLED;
  beforeEach(() => { process.env.D1_RUNTIME_ENABLED = 'true'; });
  afterEach(() => {
    if (previous === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = previous;
  });

  it('publishes through durable Learn authority and public reads remain publication-scoped', async () => {
    const current = {
      id: 'learn-1', slug: 'risk-basics', title: 'Risk', body: 'Draft', summary: null,
      status: 'DRAFT', attachments: null, categoryId: null, scheduledAt: null,
      publishedAt: null, updatedAt: new Date('2026-09-08T00:00:00Z'),
    };
    const published = { ...current, status: 'PUBLISHED', publishedAt: new Date('2026-09-09T00:00:00Z'), updatedAt: new Date('2026-09-09T00:00:00Z') };
    const findMany = jest.fn(async () => [published]);
    const d1: any = {
      learnArticle: {
        findUnique: jest.fn()
          .mockResolvedValueOnce(current)
          .mockResolvedValueOnce(published),
        findMany,
      },
      learnArticleRevision: {
        findFirst: jest.fn(async () => ({ revision: 1 })),
      },
      atomicBatch: jest.fn(async () => []),
    };
    const outbox: any = { recordEvent: jest.fn(async () => ({})) };
    const service = new CommunicationsService(d1, outbox, {} as any, { isAvailable: () => false } as any);

    expect(await service.publishLearn(current.id, 'learn-publish-1')).toEqual(published);
    expect(d1.atomicBatch).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        sql: expect.stringContaining('UPDATE "LearnContent"'),
      }),
      expect.objectContaining({
        sql: expect.stringContaining('INSERT INTO "LearnArticleRevision"'),
      }),
    ]));
    expect(outbox.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'LEARN_ARTICLE_UPDATED', aggregateId: current.id }));
    expect(outbox.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'LEARN_ARTICLE_PUBLISHED',
      idempotencyKey: `learn-article:publish:${current.id}:learn-publish-1`,
    }));

    expect(await service.learn()).toEqual([expect.objectContaining(published)]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'PUBLISHED', archivedAt: null }),
    }));
  });

  it('restricts Learn article operations to the Admin surface and matching permissions', async () => {
    const service: any = {
      adminLearnArticles: jest.fn(async () => []),
      createLearn: jest.fn(async () => ({ id: 'learn-1' })),
      updateLearn: jest.fn(async () => ({ id: 'learn-1' })),
      publishLearn: jest.fn(async () => ({ id: 'learn-1', status: 'PUBLISHED' })),
    };
    const controller = new CommunicationsController(service);
    await controller.adminLearnArticles();
    await controller.createLearn({ slug: 'risk-basics', title: 'Risk', body: 'Draft' } as any);
    await controller.updateLearn('learn-1', { title: 'Updated' } as any);
    await controller.publishLearn('learn-1', { idempotencyKey: 'learn-publish-1' } as any);
    expect(service.adminLearnArticles).toHaveBeenCalled();
    expect(service.createLearn).toHaveBeenCalled();
    expect(service.updateLearn).toHaveBeenCalledWith('learn-1', expect.objectContaining({ title: 'Updated' }));
    expect(service.publishLearn).toHaveBeenCalledWith('learn-1', 'learn-publish-1');
    expect(Reflect.getMetadata(PATH_METADATA, controller.adminLearnArticles)).toBe('admin/learn/articles');
    expect(Reflect.getMetadata(PATH_METADATA, controller.createLearn)).toBe('admin/learn');
    expect(Reflect.getMetadata(PATH_METADATA, controller.updateLearn)).toBe('admin/learn/:id');
    expect(Reflect.getMetadata(PATH_METADATA, controller.publishLearn)).toBe('admin/learn/:id/publish');
    for (const handler of [controller.adminLearnArticles, controller.createLearn, controller.updateLearn, controller.publishLearn]) {
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual(
        expect.arrayContaining([JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard]),
      );
      expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler)).toBe('ADMIN');
    }
    expect(Reflect.getMetadata(ADMIN_PERMISSION_KEY, controller.adminLearnArticles)).toBe('learn.view');
    for (const handler of [controller.createLearn, controller.updateLearn, controller.publishLearn]) {
      expect(Reflect.getMetadata(ADMIN_PERMISSION_KEY, handler)).toBe('learn.publish');
    }
  });

  it('changes category visibility with Admin audit, optimistic status check, and durable event', async () => {
    let category: any = { id: 'category-1', slug: 'test-only-prelive', status: 'ACTIVE' };
    const tx: any = {
      eventOutbox: {
        upsert: jest.fn(async ({ create }: any) => create),
      },
      adminAuditLog: {
        findUnique: jest.fn(async () => null),
        upsert: jest.fn(async ({ create }: any) => create),
      },
      learnCategory: {
        findUnique: jest.fn(async () => category),
        updateMany: jest.fn(async ({ where, data }: any) => {
          if (where.id !== category.id || where.status !== category.status) return { count: 0 };
          category = { ...category, ...data };
          return { count: 1 };
        }),
      },
    };
    const prisma: any = { $transaction: jest.fn((work: any) => work(tx)) };
    const outbox: any = { recordEvent: jest.fn(async () => ({ id: 'event-1' })) };
    const service = new CommunicationsService(prisma, outbox, {} as any, { isAvailable: () => false } as any);

    await expect(service.updateLearnCategoryStatus('category-1', 'admin-1', {
      expectedStatus: 'ACTIVE', status: 'INACTIVE', reason: 'Hide test content', idempotencyKey: 'category-hide-1',
    })).resolves.toEqual(expect.objectContaining({ id: 'category-1', status: 'INACTIVE', auditId: expect.any(String) }));
    expect(tx.learnCategory.updateMany).toHaveBeenCalledWith({
      where: { id: 'category-1', status: 'ACTIVE' }, data: { status: 'INACTIVE' },
    });
    expect(tx.adminAuditLog.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ adminId: 'admin-1', action: 'LEARN_CATEGORY_STATUS_UPDATED', target: 'category-1' }),
    }));
    expect(tx.eventOutbox.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { idempotencyKey: 'learn-category-status:category-1:category-hide-1' },
      create: expect.objectContaining({
        aggregateType: 'LEARN_CATEGORY', aggregateId: 'category-1',
        eventType: 'LEARN_CATEGORY_STATUS_UPDATED',
      }),
    }));
    expect(outbox.recordEvent).not.toHaveBeenCalled();
  });

  it('fails the category status operation when its transactional outbox write fails', async () => {
    const tx: any = {
      eventOutbox: { upsert: jest.fn(async () => { throw new Error('outbox unavailable'); }) },
      adminAuditLog: {
        findUnique: jest.fn(async () => null),
        upsert: jest.fn(async ({ create }: any) => create),
      },
      learnCategory: {
        findUnique: jest.fn(async () => ({ id: 'category-1', status: 'ACTIVE' })),
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
    };
    const prisma: any = { $transaction: jest.fn((work: any) => work(tx)) };
    const service = new CommunicationsService(prisma, { recordEvent: jest.fn() } as any, {} as any, {} as any);

    await expect(service.updateLearnCategoryStatus('category-1', 'admin-1', {
      expectedStatus: 'ACTIVE', status: 'INACTIVE', reason: 'Hide test content', idempotencyKey: 'category-hide-fail',
    })).rejects.toThrow('outbox unavailable');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects a reused category idempotency key with a different request', async () => {
    const tx: any = {
      adminAuditLog: { findUnique: jest.fn(async () => ({ details: 'different request' })) },
      learnCategory: { findUnique: jest.fn(), updateMany: jest.fn() },
    };
    const prisma: any = { $transaction: jest.fn((work: any) => work(tx)) };
    const service = new CommunicationsService(prisma, { recordEvent: jest.fn() } as any, {} as any, {} as any);

    await expect(service.updateLearnCategoryStatus('category-1', 'admin-1', {
      expectedStatus: 'ACTIVE', status: 'INACTIVE', reason: 'Hide test content', idempotencyKey: 'category-hide-1',
    })).rejects.toThrow('idempotency key was already used');
    expect(tx.learnCategory.findUnique).not.toHaveBeenCalled();
    expect(tx.learnCategory.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a stale category status instead of overwriting a newer change', async () => {
    const tx: any = {
      adminAuditLog: { findUnique: jest.fn(async () => null) },
      learnCategory: {
        findUnique: jest.fn(async () => ({ id: 'category-1', status: 'INACTIVE' })),
        updateMany: jest.fn(),
      },
    };
    const service = new CommunicationsService({ $transaction: (work: any) => work(tx) } as any, {} as any, {} as any, {} as any);

    await expect(service.updateLearnCategoryStatus('category-1', 'admin-1', {
      expectedStatus: 'ACTIVE', status: 'INACTIVE', reason: 'Hide test content', idempotencyKey: 'category-hide-stale',
    })).rejects.toThrow('changed; refresh and retry');
    expect(tx.learnCategory.updateMany).not.toHaveBeenCalled();
  });

  it('restricts category status reads and writes to Admin surface permissions', () => {
    const controller = new CommunicationsController({} as any);
    expect(Reflect.getMetadata(PATH_METADATA, controller.adminLearnCategories)).toBe('admin/learn/categories');
    expect(Reflect.getMetadata(PATH_METADATA, controller.updateLearnCategoryStatus)).toBe('admin/learn/categories/:id');
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.adminLearnCategories)).toEqual(
      expect.arrayContaining([JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard]),
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.updateLearnCategoryStatus)).toEqual(
      expect.arrayContaining([JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard]),
    );
    expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, controller.updateLearnCategoryStatus)).toBe('ADMIN');
    expect(Reflect.getMetadata(ADMIN_PERMISSION_KEY, controller.updateLearnCategoryStatus)).toBe('learn.publish');
  });

  it('restricts category creation to Admin surface permission', () => {
    const controller = new CommunicationsController({} as any);
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.createLearnCategory)).toEqual(
      expect.arrayContaining([JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard]),
    );
    expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, controller.createLearnCategory)).toBe('ADMIN');
    expect(Reflect.getMetadata(ADMIN_PERMISSION_KEY, controller.createLearnCategory)).toBe('learn.publish');
  });
});
