import { PrismaService } from '../../src/prisma/prisma.service';
import { CommunicationsService } from '../../src/communications/communications.service';
import { CANONICAL_MARKET_CATALOG } from '../../src/market/market-catalog';

jest.setTimeout(60_000);

const runIntegration = process.env.GATE2_RUN_INTEGRATION === '1';
const integrationDescribe = runIntegration ? describe : describe.skip;

integrationDescribe('Approach A persistence smoke campaign', () => {
  let prisma: PrismaService;
  let communications: CommunicationsService;
  const tag = `approach-a-${Date.now()}`;
  let snapshotId: string | undefined;
  let klineId: string | undefined;
  let categoryId: string | undefined;
  let articleId: string | undefined;
  let learnTagId: string | undefined;

  beforeAll(async () => {
    prisma = new PrismaService();
    communications = new CommunicationsService(prisma, {} as any, {} as any);
    await prisma.$connect();
  });

  afterAll(async () => {
    if (articleId) await prisma.learnArticle.delete({ where: { id: articleId } }).catch(() => undefined);
    if (learnTagId) await prisma.learnTag.delete({ where: { id: learnTagId } }).catch(() => undefined);
    if (categoryId) await prisma.learnCategory.delete({ where: { id: categoryId } }).catch(() => undefined);
    if (klineId) await prisma.marketKline.delete({ where: { id: klineId } }).catch(() => undefined);
    if (snapshotId) await prisma.marketQuoteSnapshot.delete({ where: { id: snapshotId } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it('persists and reads Approach A market, activity, and Learn contracts', async () => {
    const pair = await prisma.marketPair.findFirstOrThrow();
    const now = new Date();
    const snapshot = await prisma.marketQuoteSnapshot.create({
      data: {
        pairId: pair.id,
        symbol: pair.symbol,
        provider: 'approach-a-smoke',
        source: 'isolated-verification',
        sequence: BigInt(Date.now()),
        price: '100',
        observedAt: now,
        receivedAt: now,
      },
    });
    snapshotId = snapshot.id;
    const latest = await prisma.marketQuoteLatest.findUniqueOrThrow({ where: { pairId: pair.id } });
    const kline = await prisma.marketKline.create({
      data: {
        pairId: pair.id,
        symbol: pair.symbol,
        interval: '1m',
        openTime: new Date(now.getTime() + 1),
        closeTime: new Date(now.getTime() + 60_001),
        open: '100',
        high: '101',
        low: '99',
        close: '100.5',
        volume: '10',
        provider: 'approach-a-smoke',
        source: 'isolated-verification',
        observedAt: now,
        receivedAt: now,
      },
    });
    klineId = kline.id;
    const klineRead = await prisma.marketKline.findUniqueOrThrow({ where: { id: kline.id } });

    const category = await communications.createLearnCategory({ slug: `${tag}-category`, name: 'Approach A Smoke Category' });
    categoryId = category.id;
    const article = await communications.createLearn({
      slug: `${tag}-article`,
      title: 'Approach A Smoke Article',
      body: 'isolated verification',
      status: 'PUBLISHED',
      categoryId,
      tags: [`${tag}-tag`],
      media: [{ url: 'https://example.invalid/approach-a-smoke', altText: 'smoke', provider: 'test' }],
    });
    articleId = article.id;
    learnTagId = article.tags[0]?.tagId;
    const publicArticles = await communications.learn();
    const detail = await communications.learnDetail(`${tag}-article`);
    const linkedActivity = await prisma.activity.findFirst({ where: { ledgerPostingId: { not: null } } });
    const miningPlans = await prisma.miningPlan.findMany({ take: 1 });
    const loanPlans = await prisma.loanPlan.findMany({ take: 1 });

    expect(snapshot.id).toBeTruthy();
    expect(latest.id).toBeTruthy();
    expect(klineRead.close.toString()).toBe('100.5');
    expect(CANONICAL_MARKET_CATALOG).toHaveLength(53);
    expect(linkedActivity?.ledgerPostingId).toBeTruthy();
    expect(publicArticles.some((entry) => entry.slug === `${tag}-article`)).toBe(true);
    expect(detail.slug).toBe(`${tag}-article`);
    expect(article.revisions).toHaveLength(1);
    expect(article.tags).toHaveLength(1);
    expect(article.media).toHaveLength(1);
    expect(Array.isArray(miningPlans)).toBe(true);
    expect(Array.isArray(loanPlans)).toBe(true);
  });
});
