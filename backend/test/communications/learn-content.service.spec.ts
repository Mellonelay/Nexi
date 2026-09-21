import { CommunicationsService } from '../../src/communications/communications.service';

describe('CommunicationsService Learn authority', () => {
  it('only lists published, scheduled-ready, non-archived articles', async () => {
    const prisma: any = {
      learnArticle: { findMany: jest.fn(async () => []) },
    };
    const service = new CommunicationsService(prisma, {} as any, {} as any, { isAvailable: () => false } as any);
    await service.learn();
    expect(prisma.learnArticle.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'PUBLISHED',
        archivedAt: null,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: expect.any(Date) } }],
      }),
      include: expect.objectContaining({ category: true, media: true }),
    }));
  });

  it('resolves localized public browse and detail from canonical article content', async () => {
    const article = {
      id: 'learn-1',
      slug: 'intro',
      title: 'English title',
      body: 'English body',
      summary: 'English summary',
      localizations: JSON.stringify({ my: { title: 'မြန်မာခေါင်းစဉ်', body: 'မြန်မာစာ', summary: 'အကျဉ်း' } }),
      category: null,
      tags: [],
      media: [],
      revisions: [],
    };
    const prisma: any = {
      learnArticle: {
        findMany: jest.fn(async () => [article]),
        findFirst: jest.fn(async () => article),
      },
    };
    const service = new CommunicationsService(prisma, {} as any, {} as any, { isAvailable: () => false } as any);

    expect((await service.learn('my'))[0]).toEqual(expect.objectContaining({ title: 'မြန်မာခေါင်းစဉ်', summary: 'အကျဉ်း' }));
    expect(await service.learnDetail('intro', 'my-MM')).toEqual(expect.objectContaining({ title: 'မြန်မာခေါင်းစဉ်', body: 'မြန်မာစာ' }));
  });

  it('rejects a scheduled article without a schedule', async () => {
    const service = new CommunicationsService({} as any, {} as any, {} as any, { isAvailable: () => false } as any);
    await expect(service.createLearn({ slug: 'scheduled', title: 'Scheduled', body: 'Body', status: 'SCHEDULED' })).rejects.toThrow('scheduledAt');
  });
});
