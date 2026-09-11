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

  it('rejects a scheduled article without a schedule', async () => {
    const service = new CommunicationsService({} as any, {} as any, {} as any, { isAvailable: () => false } as any);
    await expect(service.createLearn({ slug: 'scheduled', title: 'Scheduled', body: 'Body', status: 'SCHEDULED' })).rejects.toThrow('scheduledAt');
  });
});
