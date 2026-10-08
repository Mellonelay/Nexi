import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';

import { createRequire } from 'node:module';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

describe('D1 outbox statements execute as SQLite data statements', () => {
  it.each([undefined, { sql: '1=1', params: [] }, { sql: '1=0', params: [] }])('preserves field alignment and guard %j', (guard) => {
    const db = new DatabaseSync(':memory:');
    try {
      db.exec('CREATE TABLE EventOutbox (id TEXT, idempotencyKey TEXT, aggregateType TEXT, aggregateId TEXT, eventType TEXT, eventVersion INTEGER, correlationId TEXT, payload TEXT, state TEXT, availableAt TEXT, attempts INTEGER, createdAt TEXT, updatedAt TEXT)');
      const gateway = new D1FinancialCommandGateway({} as any);
      const statement = (gateway as any).eventOutboxStatement({ idempotencyKey: 'test-key', aggregateType: 'Currency', aggregateId: '3', eventType: 'CURRENCY_UPDATED', correlationId: 'test-correlation', payload: { enabled: true }, guard });
      db.prepare(statement.sql).run(...statement.params);
      const row = db.prepare('SELECT * FROM EventOutbox').get();
      if (guard?.sql === '1=0') expect(row).toBeUndefined();
      else expect(row).toMatchObject({ idempotencyKey: 'test-key', aggregateType: 'Currency', aggregateId: '3', eventType: 'CURRENCY_UPDATED', eventVersion: 1, correlationId: 'test-correlation', payload: '{"enabled":true}', state: 'PENDING', attempts: 0 });
    } finally { db.close(); }
  });
});
