import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Queue } from 'bullmq';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { RedisService } from '../../src/redis/redis.service';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { D1PrismaService } from '../../src/d1/d1-prisma.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';
import { WorkflowCommandsService } from '../../src/workflows/workflow-commands.service';
import { UsersModule } from '../../src/users/users.module';
import { LocalAsyncModule } from '../../src/jobs/local-async.module';
import { LocalDurableJobStore } from '../../src/jobs/local-durable-job.store';

const socket = process.env.NEXI_TEST_VALKEY_SOCKET;
if (!socket) throw new Error('NEXI_TEST_VALKEY_SOCKET is required for the explicit local async integration suite');
const queues = ['domain-events', 'notifications', 'integration-jobs'];
const waitFor = async (condition: () => Promise<boolean>, timeoutMs = 15000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for the isolated NestJS/SQLite/Valkey integration');
};

describe('real NestJS local runtime and financial workflow commands', () => {
  let directory: string;
  let filename: string;
  let prefix: string;
  let moduleRef: TestingModule | undefined;
  let bridge: LocalSqliteBridgeService;
  let commands: WorkflowCommandsService;
  const envKeys = ['NEXI_SQLITE_LOCAL_ENABLED', 'NEXI_LOCAL_SQLITE_PATH', 'D1_RUNTIME_ENABLED',
    'NEXI_LOCAL_ASYNC_ENABLED', 'NEXI_VALKEY_SOCKET', 'NEXI_LOCAL_ASYNC_PREFIX', 'JWT_SECRET'] as const;
  const previous = new Map<string, string | undefined>();

  const boot = async () => {
    const app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        UsersModule,
        LocalAsyncModule,
      ],
    }).overrideProvider(RedisService).useValue({
      isAvailable: () => false,
      publish: async () => 0,
      onModuleInit: () => undefined,
      onModuleDestroy: async () => undefined,
    }).compile();
    await app.init();
    return app;
  };

  beforeAll(async () => {
    for (const key of envKeys) previous.set(key, process.env[key]);
    directory = mkdtempSync(join(tmpdir(), 'nexi-workflow-runtime-'));
    filename = join(directory, 'fixture.sqlite');
    prefix = 'nexi-it-' + randomUUID().replaceAll('-', '');
    const db = new Database(filename);
    db.exec(readFileSync(new URL('../../prisma/migrations-d1/0001_initial.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../../prisma/migrations-d1/0002_event_inbox.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../../src/jobs/local-durable-job.schema.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql', import.meta.url), 'utf8'));

    const userId = 'integration-user';
    db.prepare('INSERT INTO "User" ("id","userCode","email","updatedAt") VALUES (?,?,?,CURRENT_TIMESTAMP)')
      .run(userId, 791000001, 'workflow-test@example.invalid');
    db.prepare(`INSERT INTO "LedgerAccount" ("id","userId","asset","scope","status","available","locked","updatedAt")
      VALUES ('withdrawal-account',?,'USDT','MAIN','ACTIVE','25','1',CURRENT_TIMESTAMP)`).run(userId);
    db.prepare(`INSERT INTO "LedgerAccount" ("id","userId","asset","scope","status","available","locked","updatedAt")
      VALUES ('mining-account',?,'USDT','FINANCE','ACTIVE','0','0',CURRENT_TIMESTAMP)`).run(userId);
    db.prepare(`INSERT INTO "Gate2Withdrawal"
      ("id","userId","asset","network","address","amount","fee","reservedAmount","state","requestKey","reserveKey","updatedAt")
      VALUES ('withdrawal-integration',?,'USDT','TESTNET','synthetic-address','1','0','1','APPROVED','request-integration','reserve-integration',CURRENT_TIMESTAMP)`).run(userId);
    db.prepare(`INSERT INTO "MiningPlan"
      ("id","name","currency","lockupPeriod","dailyYield","dailyYieldDecimal","minDeposit","minDepositDecimal","maxDeposit","maxDepositDecimal","isActive","updatedAt")
      VALUES ('plan-integration','Integration Plan','USDT',30,'0.01','0.01','1','1','1000','1000',1,CURRENT_TIMESTAMP)`).run();
    db.prepare(`INSERT INTO "MiningSubscription"
      ("id","userId","planId","amount","amountDecimal","status","startDate","endDate","totalRewards","totalRewardsDecimal","lastRewardPaid","updatedAt")
      VALUES ('mining-integration',?,'plan-integration','100','100','ACTIVE',CURRENT_TIMESTAMP,?,'0','0',? ,CURRENT_TIMESTAMP)`)
      .run(userId, new Date(Date.now() + 30 * 86400000).toISOString(), new Date(Date.now() - 86400000).toISOString());
    const seedLoan = (id: string) => db.prepare(`INSERT INTO "LoanApplication"
      ("id","userId","amount","amountDecimal","currency","term","durationDays","interestRate","interestRateDecimal",
       "totalRepayment","totalRepaymentDecimal","status","dueDate","updatedAt")
      VALUES (?,?,'10','10','USDT',30,30,'0.1','0.1','11','11','ACTIVE',?,CURRENT_TIMESTAMP)`)
      .run(id, userId, new Date(Date.now() - 86400000).toISOString());
    seedLoan('loan-direct-integration');
    seedLoan('loan-queue-integration');
    db.close();

    process.env.NEXI_SQLITE_LOCAL_ENABLED = 'true';
    process.env.NEXI_LOCAL_SQLITE_PATH = filename;
    process.env.D1_RUNTIME_ENABLED = 'true';
    process.env.NEXI_LOCAL_ASYNC_ENABLED = 'true';
    process.env.NEXI_VALKEY_SOCKET = socket;
    process.env.NEXI_LOCAL_ASYNC_PREFIX = prefix;
    process.env.JWT_SECRET = 'integration-only-secret';
    moduleRef = await boot();
    bridge = moduleRef.get(D1WorkerBridgeService, { strict: false }) as unknown as LocalSqliteBridgeService;
    commands = moduleRef.get(WorkflowCommandsService, { strict: false });
  }, 30000);

  afterAll(async () => {
    if (moduleRef) await moduleRef.close();
    for (const name of queues) {
      const queue = new Queue(name, { connection: { path: socket, maxRetriesPerRequest: 1 }, prefix });
      await queue.obliterate({ force: true });
      await queue.close();
    }
    for (const key of envKeys) {
      const value = previous.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    if (directory) rmSync(directory, { recursive: true, force: true });
  }, 30000);

  it('resolves real Nest providers against the disposable local SQLite file', async () => {
    expect(bridge).toBeInstanceOf(LocalSqliteBridgeService);
    const prisma = moduleRef!.get(D1PrismaService, { strict: false });
    expect(prisma.isEnabled()).toBe(true);
    expect(await prisma.isReady()).toBe(true);
  });

  it('settles a withdrawal exactly once through the real financial service and Ledger gateway', async () => {
    const input = { workflow: 'withdrawal', instanceId: 'withdrawal-test', entityId: 'withdrawal-integration',
      action: 'settle', idempotencyKey: 'settle-integration', payload: { receipt: 'deterministic:integration' } };
    await commands.execute(input);
    const replay = await commands.execute(input);
    const withdrawal = (await bridge.select<any>('SELECT state FROM "Gate2Withdrawal" WHERE id=?', ['withdrawal-integration'])).results[0];
    const account = (await bridge.select<any>('SELECT available,locked FROM "LedgerAccount" WHERE id=?', ['withdrawal-account'])).results[0];
    const postings = await bridge.select<any>('SELECT id FROM "LedgerPosting" WHERE referenceType=? AND referenceId=?',
      ['GATE2_WITHDRAWAL_SETTLEMENT', 'withdrawal-integration']);
    expect(withdrawal.state).toBe('SETTLED');
    expect(account).toEqual({ available: '25', locked: '0' });
    expect(postings.results).toHaveLength(1);
    expect(replay).toMatchObject({ replayed: true, providerLive: false });
  });

  it('accrues one real mining reward and publishes through the canonical EventOutbox', async () => {
    const input = { workflow: 'mining', instanceId: 'mining-test', entityId: 'mining-integration',
      action: 'accrue', idempotencyKey: 'accrue-integration', payload: {} };
    await commands.execute(input);
    await commands.execute(input);
    const account = (await bridge.select<any>('SELECT available FROM "LedgerAccount" WHERE id=?', ['mining-account'])).results[0];
    const accruals = await bridge.select<any>('SELECT id,amount FROM "MiningRewardAccrual" WHERE subscriptionId=?', ['mining-integration']);
    const events = await bridge.select<any>('SELECT id FROM "EventOutbox" WHERE eventType=? AND aggregateId=?',
      ['MINING_REWARD_POSTED', 'mining-integration']);
    expect(account.available).toBe('1');
    expect(accruals.results).toHaveLength(1);
    expect(accruals.results[0].amount).toBe('1');
    expect(events.results).toHaveLength(1);
  });

  it('marks an overdue loan once and records the canonical Outbox event', async () => {
    const result = await commands.execute({ workflow: 'loan', instanceId: 'loan-test', entityId: 'loan-direct-integration',
      action: 'check-due', idempotencyKey: 'loan-check-integration', payload: {} });
    const loan = (await bridge.select<any>('SELECT status FROM "LoanApplication" WHERE id=?', ['loan-direct-integration'])).results[0];
    const events = await bridge.select<any>('SELECT id FROM "EventOutbox" WHERE eventType=? AND aggregateId=?',
      ['LOAN_OVERDUE', 'loan-direct-integration']);
    expect(result.done).toBe(true);
    expect(loan.status).toBe('OVERDUE');
    expect(events.results).toHaveLength(1);
  });

  it('durably accepts generic envelopes from each deployed queue class', async () => {
    const journal = new LocalDurableJobStore(bridge);
    for (const queue of queues) {
      const key = 'queue-parity-' + queue;
      const event = { type: 'QUEUE_INGRESS_PARITY_PROBE', version: 1, idempotencyKey: key,
        correlationId: key, payload: { queue } };
      const accepted = await journal.record(queue, key, event, Date.now());
      await waitFor(async () => {
        const rows = await bridge.select<any>('SELECT state FROM LocalDurableJob WHERE id=?', [accepted.id]);
        const inbox = await bridge.select<any>('SELECT messageId FROM EventInbox WHERE messageId=?', [accepted.id]);
        return rows.results[0]?.state === 'COMPLETED' && inbox.results.length === 1;
      });
    }
    const workflows = await bridge.select<any>("SELECT id FROM LocalWorkflowInstance WHERE id LIKE 'loan-queue-parity-%'");
    expect(workflows.results).toHaveLength(0);
  });

  it('recovers an actual loan workflow across lost queue acknowledgment and Nest restart', async () => {
    const journal = new LocalDurableJobStore(bridge);
    const approval = { type: 'LOAN_APPROVED', version: 1, idempotencyKey: 'approval-ack-loss',
      correlationId: 'approval-ack-loss', payload: { loanId: 'loan-queue-integration' } };
    const triggerDb = new Database(filename);
    triggerDb.exec(`CREATE TRIGGER fail_local_job_ack BEFORE UPDATE OF state ON LocalDurableJob
      WHEN NEW.state='COMPLETED' BEGIN SELECT RAISE(ABORT,'simulated ack loss'); END`);
    triggerDb.close();
    const accepted = await journal.record('domain-events', 'approval-ack-loss', approval, Date.now());
    await waitFor(async () => {
      const rows = await bridge.select<any>('SELECT attempts,state FROM LocalDurableJob WHERE id=?', [accepted.id]);
      const inbox = await bridge.select<any>('SELECT messageId FROM EventInbox WHERE messageId=?', [accepted.id]);
      return Number(rows.results[0]?.attempts) >= 1 && inbox.results.length === 1;
    });
    await moduleRef!.close();
    moduleRef = undefined;
    const local = new Database(filename);
    local.exec('DROP TRIGGER fail_local_job_ack');
    local.close();

    moduleRef = await boot();
    bridge = moduleRef.get(D1WorkerBridgeService, { strict: false }) as unknown as LocalSqliteBridgeService;
    await waitFor(async () => {
      const journalRow = await bridge.select<any>('SELECT state,attempts FROM LocalDurableJob WHERE id=?', [accepted.id]);
      const inbox = await bridge.select<any>('SELECT messageId FROM EventInbox WHERE messageId=?', [accepted.id]);
      const workflow = await bridge.select<any>('SELECT status FROM LocalWorkflowInstance WHERE id=?', ['loan-loan-queue-integration']);
      const loan = await bridge.select<any>('SELECT status FROM LoanApplication WHERE id=?', ['loan-queue-integration']);
      return journalRow.results[0]?.state === 'COMPLETED' && Number(journalRow.results[0]?.attempts) >= 2
        && inbox.results.length === 1 && workflow.results[0]?.status === 'COMPLETED' && loan.results[0]?.status === 'OVERDUE';
    });
    const postings = await bridge.select<any>('SELECT id FROM LedgerPosting WHERE referenceType=? AND referenceId=?',
      ['LOAN_OVERDUE', 'loan-queue-integration']);
    expect(postings.results).toHaveLength(0);
    const events = await bridge.select<any>('SELECT id FROM EventOutbox WHERE eventType=? AND aggregateId=?',
      ['LOAN_OVERDUE', 'loan-queue-integration']);
    expect(events.results).toHaveLength(1);
  }, 45000);
});
