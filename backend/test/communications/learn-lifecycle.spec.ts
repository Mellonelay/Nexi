import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { CommunicationsController } from '../../src/communications/communications.controller';
import { CommunicationsService } from '../../src/communications/communications.service';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';

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
    const tx: any = {
      learnArticle: {
        update: jest.fn(async () => published),
        findUnique: jest.fn(async () => published),
      },
      learnArticleRevision: {
        findFirst: jest.fn(async () => ({ revision: 1 })),
        create: jest.fn(async () => ({ id: 'revision-2' })),
      },
    };
    const d1: any = {
      learnArticle: { findUnique: jest.fn(async () => current), findMany },
      $transaction: jest.fn(async (fn: (arg: any) => Promise<unknown>) => fn(tx)),
    };
    const outbox: any = { recordEvent: jest.fn(async () => ({})) };
    const service = new CommunicationsService({} as any, d1, outbox);

    expect(await service.publishLearn(current.id, 'learn-publish-1')).toEqual(published);
    expect(tx.learnArticle.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: current.id },
      data: expect.objectContaining({ status: 'PUBLISHED' }),
    }));
    expect(outbox.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'LEARN_ARTICLE_UPDATED', aggregateId: current.id }));
    expect(outbox.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'LEARN_ARTICLE_PUBLISHED',
      idempotencyKey: `learn-article:publish:${current.id}:learn-publish-1`,
    }));

    expect(await service.learn()).toEqual([published]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'PUBLISHED', archivedAt: null }),
    }));
  });

  it('preserves ADMIN-guarded update and publish HTTP contracts', async () => {
    const service: any = {
      updateLearn: jest.fn(async () => ({ id: 'learn-1' })),
      publishLearn: jest.fn(async () => ({ id: 'learn-1', status: 'PUBLISHED' })),
    };
    const controller = new CommunicationsController(service);
    await controller.updateLearn('learn-1', { title: 'Updated' } as any);
    await controller.publishLearn('learn-1', { idempotencyKey: 'learn-publish-1' } as any);
    expect(service.updateLearn).toHaveBeenCalledWith('learn-1', expect.objectContaining({ title: 'Updated' }));
    expect(service.publishLearn).toHaveBeenCalledWith('learn-1', 'learn-publish-1');
    expect(Reflect.getMetadata(PATH_METADATA, controller.updateLearn)).toBe('admin/learn/:id');
    expect(Reflect.getMetadata(PATH_METADATA, controller.publishLearn)).toBe('admin/learn/:id/publish');
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.updateLearn)).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(Reflect.getMetadata(GUARDS_METADATA, controller.publishLearn)).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
  });
});
