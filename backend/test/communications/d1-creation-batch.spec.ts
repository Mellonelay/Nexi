import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { CommunicationsService } from '../../src/communications/communications.service';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

describe('D1 atomic communications creation', () => {
  it('persists idempotent support ticket and first reply in one D1 batch', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      const migration = readFileSync('prisma/migrations-d1/0001_initial.sql', 'utf8');
      for (const table of ['SupportTicket', 'SupportTicketReply']) {
        const start = migration.indexOf(`CREATE TABLE "${table}" (`);
        const end = migration.indexOf(');', start);
        db.exec(migration.slice(start, end + 2));
      }
      const atomicBatch = jest.fn(async (statements: Array<{sql: string; params?: unknown[]}>) => {
        db.exec('BEGIN');
        try {
          for (const statement of statements) db.prepare(statement.sql).run(...(statement.params ?? []));
          db.exec('COMMIT');
          return [];
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      });
      const prisma: any = {
        atomicBatch,
        supportTicket: { findUnique: jest.fn(({ where }: any) => ({
          ...db.prepare('SELECT * FROM SupportTicket WHERE id = ?').get(where.id),
          replies: db.prepare('SELECT * FROM SupportTicketReply WHERE ticketId = ?').all(where.id),
        })) },
      };
      const outbox: any = { recordEvent: jest.fn(async () => undefined) };
      const service = new CommunicationsService(prisma, outbox, {} as any, { isAvailable: () => false } as any);
      const first = await service.createTicket('user-1', 'Help', 'Body', 'key-1');
      const replay = await service.createTicket('user-1', 'Changed retry', 'Changed body', 'key-1');
      expect(replay).toEqual(first);
      expect(atomicBatch).toHaveBeenCalledTimes(2);
      expect(atomicBatch.mock.calls[0][0]).toHaveLength(2);
      expect(db.prepare('SELECT COUNT(*) AS n FROM SupportTicket').get().n).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS n FROM SupportTicketReply').get().n).toBe(1);
      expect(first.replies[0].body).toBe('Body');
    } finally { db.close(); }
  });

  it('persists Learn article, first revision, tags, and media atomically in D1', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      const migration = readFileSync('prisma/migrations-d1/0001_initial.sql', 'utf8');
      for (const table of ['LearnCategory', 'LearnContent', 'LearnArticleRevision', 'LearnTag', 'LearnArticleTag', 'LearnMediaAsset']) {
        const start = migration.indexOf(`CREATE TABLE "${table}" (`);
        const end = migration.indexOf(');', start);
        db.exec(migration.slice(start, end + 2));
      }
      db.exec('ALTER TABLE LearnContent ADD COLUMN localizations TEXT; ALTER TABLE LearnArticleRevision ADD COLUMN localizations TEXT; CREATE UNIQUE INDEX LearnContent_slug_key ON LearnContent(slug); CREATE UNIQUE INDEX LearnTag_slug_key ON LearnTag(slug);');
      const atomicBatch = jest.fn(async (statements: Array<{sql: string; params?: unknown[]}>) => {
        db.exec('BEGIN');
        try {
          for (const statement of statements) db.prepare(statement.sql).run(...(statement.params ?? []));
          db.exec('COMMIT');
          return [];
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      });
      const prisma: any = {
        atomicBatch,
        learnArticle: { findUnique: jest.fn(({ where }: any) => db.prepare('SELECT * FROM LearnContent WHERE id = ?').get(where.id)) },
      };
      const outbox: any = { recordEvent: jest.fn(async () => undefined) };
      const service = new CommunicationsService(prisma, outbox, {} as any, { isAvailable: () => false } as any);
      const article = await service.createLearn({
        slug: 'controlled-test', title: 'Controlled', body: 'Test content', status: 'DRAFT',
        tags: ['Wallet', ' Backend '], media: [{ url: 'https://test.invalid/image.png', metadata: { testOnly: true } }],
      });
      expect(article).toMatchObject({ slug: 'controlled-test', title: 'Controlled' });
      expect(atomicBatch.mock.calls[0][0]).toHaveLength(7);
      expect(db.prepare('SELECT COUNT(*) AS n FROM LearnContent').get().n).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS n FROM LearnArticleRevision').get().n).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS n FROM LearnArticleTag').get().n).toBe(2);
      expect(db.prepare('SELECT metadata FROM LearnMediaAsset').get().metadata).toBe('{"testOnly":true}');
      await expect(service.createLearn({ slug: 'controlled-test', title: 'Duplicate', body: 'Retry' })).rejects.toThrow();
      expect(db.prepare('SELECT COUNT(*) AS n FROM LearnArticleRevision').get().n).toBe(1);
    } finally { db.close(); }
  });
  it('publishes Learn content with an atomic article/revision batch and durable events', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      const migration = readFileSync('prisma/migrations-d1/0001_initial.sql', 'utf8');
      for (const table of ['LearnCategory', 'LearnContent', 'LearnArticleRevision']) {
        const start = migration.indexOf('CREATE TABLE "' + table + '" (');
        const end = migration.indexOf(');', start);
        db.exec(migration.slice(start, end + 2));
      }
      db.exec('ALTER TABLE LearnContent ADD COLUMN localizations TEXT; ALTER TABLE LearnArticleRevision ADD COLUMN localizations TEXT;');
      const atomicBatch = jest.fn(async (statements: Array<{sql: string; params?: unknown[]}>) => {
        db.exec('BEGIN');
        try {
          for (const statement of statements) db.prepare(statement.sql).run(...(statement.params ?? []));
          db.exec('COMMIT');
          return [];
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      });
      const prisma: any = {
        atomicBatch,
        learnArticle: {
          findUnique: jest.fn(({ where }: any) => db.prepare('SELECT * FROM LearnContent WHERE id = ?').get(where.id)),
        },
        learnArticleRevision: {
          findFirst: jest.fn(({ where }: any) => db.prepare('SELECT revision FROM LearnArticleRevision WHERE articleId = ? ORDER BY revision DESC LIMIT 1').get(where.articleId)),
        },
      };
      const outbox: any = { recordEvent: jest.fn(async () => undefined) };
      const service = new CommunicationsService(prisma, outbox, {} as any, { isAvailable: () => false } as any);
      const created = await service.createLearn({
        slug: 'publish-test', title: 'Draft', body: 'Controlled content', status: 'DRAFT',
      });
      const published = await service.publishLearn(created.id, 'publish-key');
      expect(published.status).toBe('PUBLISHED');
      expect(atomicBatch).toHaveBeenCalledTimes(2);
      expect(atomicBatch.mock.calls[1][0]).toHaveLength(2);
      expect(db.prepare('SELECT status FROM LearnContent WHERE id = ?').get(created.id).status).toBe('PUBLISHED');
      expect(db.prepare('SELECT status, revision FROM LearnArticleRevision WHERE articleId = ? ORDER BY revision DESC LIMIT 1').get(created.id)).toMatchObject({ status: 'PUBLISHED', revision: 2 });
      expect(outbox.recordEvent).toHaveBeenCalledTimes(3);
    } finally { db.close(); }
  });
});
