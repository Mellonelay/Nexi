import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { RedisService } from '../../src/redis/redis.service';
import { CommunicationsService } from '../../src/communications/communications.service';
import { LocalAsyncModule } from '../../src/jobs/local-async.module';
import { UsersModule } from '../../src/users/users.module';
import type { EventOutboxService } from '../../src/events/event-outbox.service';
import type { WorkflowCommandsService } from '../../src/workflows/workflow-commands.service';
import { LocalAsyncRuntimeService, resolveValkeyConnectionOptions } from '../../src/jobs/local-async-runtime.service';

const make = (config: Record<string,string>) => {
  const settings = {get: (key:string, fallback?:string)=>config[key]??fallback} as ConfigService;
  return new LocalAsyncRuntimeService(settings, {} as D1WorkerBridgeService,
    {} as EventOutboxService, {} as WorkflowCommandsService);
};

describe('BullMQ Valkey connection configuration', () => {
  const settings = (values: Record<string, string>) => ({
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  }) as ConfigService;

  it('keeps the existing Unix socket connection as the default', () => {
    expect(resolveValkeyConnectionOptions(settings({ NEXI_VALKEY_SOCKET: '/run/nexi/valkey.sock' }), 1, false))
      .toEqual({ path: '/run/nexi/valkey.sock', maxRetriesPerRequest: 1, enableOfflineQueue: false });
  });

  it('supports authenticated rediss endpoints with certificate validation', () => {
    expect(resolveValkeyConnectionOptions(
      settings({ NEXI_VALKEY_URL: 'rediss://default:p%40ss@valkey.example.test:25164/0' }), null,
    )).toEqual({
      host: 'valkey.example.test',
      port: 25164,
      username: 'default',
      password: 'p@ss',
      db: 0,
      tls: { servername: 'valkey.example.test', rejectUnauthorized: true },
      maxRetriesPerRequest: null,
    });
  });

  it('rejects unsupported or malformed connection URLs and missing socket paths', () => {
    expect(() => resolveValkeyConnectionOptions(settings({ NEXI_VALKEY_URL: 'https://valkey.example.test' }), 1))
      .toThrow('NEXI_VALKEY_URL must use redis:// or rediss://');
    expect(() => resolveValkeyConnectionOptions(settings({ NEXI_VALKEY_SOCKET: 'relative.sock' }), null))
      .toThrow('NEXI_VALKEY_SOCKET must identify an absolute Unix socket');
  });
});

describe('Local async runtime activation gate', () => {
  it('does not shut down the provider while an already-running journal cycle remains in flight', async () => {
    const runtime = make({});
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    (runtime as any).transport = { dispatchPending: () => pending };
    (runtime as any).workflowStore = { due: async () => [] };
    (runtime as any).workflows = { tick: async () => undefined };
    const running = (runtime as any).cycle() as Promise<void>;
    let shutdownFinished = false;
    const shutdown = runtime.onModuleDestroy().then(() => { shutdownFinished = true; });
    await Promise.resolve();
    try {
      expect(shutdownFinished).toBe(false);
    } finally {
      release();
      await Promise.all([running, shutdown]);
    }
  });

  it('does not connect to queues or initialize a worker under the default configuration', async () => {
    const runtime = make({});
    await expect(runtime.onModuleInit()).resolves.toBeUndefined();
    await expect(runtime.onModuleDestroy()).resolves.toBeUndefined();
  });
  it('refuses activation without an explicit local SQLite financial bridge', async () => {
    const runtime = make({NEXI_LOCAL_ASYNC_ENABLED:'true', NEXI_SQLITE_LOCAL_ENABLED:'false'});
    await expect(runtime.onModuleInit()).rejects.toThrow('local SQLite financial bridge');
    await runtime.onModuleDestroy();
  });
  it('refuses activation if local mode is claimed but bridge is not local', async () => {
    const runtime = make({NEXI_LOCAL_ASYNC_ENABLED:'true', NEXI_SQLITE_LOCAL_ENABLED:'true'});
    await expect(runtime.onModuleInit()).rejects.toThrow('local SQLite financial bridge');
    await runtime.onModuleDestroy();
  });
});

describe('Local async NestJS module wiring', () => {
  it('resolves the communications service for durable customer notifications', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ JWT_SECRET: 'nexi-module-test-only-secret-with-32chars' })] }), UsersModule, LocalAsyncModule],
    }).overrideProvider(D1WorkerBridgeService).useValue({
      isEnabled: () => true,
      onModuleInit: () => undefined,
      onModuleDestroy: () => undefined,
    }).overrideProvider(RedisService).useValue({
      isAvailable: () => false,
      onModuleInit: () => undefined,
      onModuleDestroy: () => undefined,
    }).compile();
    try {
      const runtime = moduleRef.get(LocalAsyncRuntimeService);
      expect((runtime as any).communications).toBeInstanceOf(CommunicationsService);
    } finally {
      await moduleRef.close();
    }
  });
});

describe('Durable account-transfer notification selection', () => {
  const event = (payload: Record<string, unknown>) => ({
    type: 'TRANSFER_COMPLETED', version: 1, idempotencyKey: 'event:transfer:one',
    correlationId: 'transfer:one', payload,
  });
  const notification = jest.fn(async () => undefined);
  const runtime = new LocalAsyncRuntimeService(
    new ConfigService(), {} as D1WorkerBridgeService,
    {} as EventOutboxService, {} as WorkflowCommandsService,
    { sendSystemNotification: notification } as unknown as CommunicationsService,
  );
  beforeEach(() => notification.mockClear());
  it('materializes the scoped account transfer for its owner', async () => {
    await (runtime as any).notifyAccountTransfer(event({userId:'user-1',asset:'USDT',amount:'1.25',sourceScope:'MAIN',destinationScope:'BINARY'}));
    expect(notification).toHaveBeenCalledWith(expect.objectContaining({
      userId:'user-1', type:'TRANSFER_COMPLETED',
      body:'1.25 USDT transferred from Funding to Options.',
      idempotencyKey:'event:transfer:one',
    }));
  });
  it('skips Ledger transfers with no customer recipient contract', async () => {
    await expect((runtime as any).notifyAccountTransfer(event({asset:'USDT',amount:'1.25',debitAccountId:'a',creditAccountId:'b'}))).resolves.toBeUndefined();
    expect(notification).not.toHaveBeenCalled();
  });
  it('routes completed person-to-person transfers independently to sender and recipient', async () => {
    await (runtime as any).notifyAccountTransfer(event({asset:'USDT',amount:'1.25',fromUserId:'user-1',toUserId:'user-2'}));
    expect(notification).toHaveBeenCalledTimes(2);
    expect(notification).toHaveBeenNthCalledWith(1, expect.objectContaining({userId:'user-1',title:'Transfer sent',idempotencyKey:'event:transfer:one:sent'}));
    expect(notification).toHaveBeenNthCalledWith(2, expect.objectContaining({userId:'user-2',title:'Transfer received',idempotencyKey:'event:transfer:one:received'}));
  });
  it('rejects incomplete person-to-person transfer recipient details', async () => {
    await expect((runtime as any).notifyAccountTransfer(event({asset:'USDT',amount:'1.25',fromUserId:'user-1'}))).rejects.toThrow('recipient');
    expect(notification).not.toHaveBeenCalled();
  });
  it('fails closed for an invalid scoped transfer recipient', async () => {
    await expect((runtime as any).notifyAccountTransfer(event({userId:'',asset:'USDT',amount:'1.25',sourceScope:'MAIN',destinationScope:'BINARY'}))).rejects.toThrow('recipient');
    expect(notification).not.toHaveBeenCalled();
  });
});

describe('Committed customer financial event notifications', () => {
  const sendSystemNotification = jest.fn(async () => undefined);
  const runtime = new LocalAsyncRuntimeService(
    new ConfigService(), {} as D1WorkerBridgeService,
    {} as EventOutboxService, {} as WorkflowCommandsService,
    {sendSystemNotification} as unknown as CommunicationsService,
  );
  const event = (type: string, payload: Record<string, unknown>) => ({
    type, version: 1, idempotencyKey: 'event:financial:123', correlationId: 'correlation:123', payload,
  });
  beforeEach(() => sendSystemNotification.mockClear());
  it.each([
    ['DEPOSIT_CREDITED', {userId:'user-1',amount:'5',asset:'USDT'}, 'Deposit confirmed'],
    ['DEPOSIT_REJECTED', {userId:'user-1'}, 'Deposit rejected'],
    ['WITHDRAWAL_APPROVED', {userId:'user-1',asset:'USDT'}, 'Withdrawal approved'],
    ['WITHDRAWAL_RESERVED', {userId:'user-1',amount:'5',asset:'USDT',network:'Ethereum'}, 'Withdrawal requested'],
    ['WITHDRAWAL_SETTLED', {userId:'user-1',amount:'5',asset:'USDT'}, 'Withdrawal completed'],
    ['BINARY_POSITION_OPENED', {userId:'user-1',side:'LONG',pair:'BTCUSDT',stake:'5'}, 'Options position opened'],
    ['BINARY_POSITION_SETTLED', {userId:'user-1',state:'WIN',stake:'5',payout:'9',asset:'USDT'}, 'Options position settled'],
    ['SPOT_ORDER_RESERVED', {userId:'user-1',side:'BUY',pair:'BTCUSDT',amount:'1'}, 'Spot order accepted'],
    ['CONVERSION_ACCEPTED', {userId:'user-1',fromAsset:'USDT',toAsset:'BTC',inputAmount:'100',outputAmount:'0.001'}, 'Conversion completed'],
  ])('%s produces a user-scoped notification', async (type, payload, title) => {
    await (runtime as any).notifyCustomerEvent(event(type, payload));
    expect(sendSystemNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId:'user-1', title, type, idempotencyKey:'event:financial:123:user-1',
    }));
  });
  it('notifies both Spot trade counterparties without crossing recipients', async () => {
    await (runtime as any).notifyCustomerEvent(event('SPOT_TRADE_EXECUTED', {
      buyerUserId:'buyer',sellerUserId:'seller',pair:'BTCUSDT',price:'100',amount:'1',
    }));
    expect(sendSystemNotification).toHaveBeenCalledTimes(2);
    expect(sendSystemNotification.mock.calls.map(call => call[0].userId)).toEqual(['buyer','seller']);
  });
  it('does not invent notifications for unsupported event types', async () => {
    await (runtime as any).notifyCustomerEvent(event('UNSUPPORTED_EVENT', {userId:'user-1'}));
    expect(sendSystemNotification).not.toHaveBeenCalled();
  });
  it('fails on missing customer identity for retry rather than acknowledging', async () => {
    await expect((runtime as any).notifyCustomerEvent(event('DEPOSIT_CREDITED', {amount:'5',asset:'USDT'}))).rejects.toThrow('userId');
    expect(sendSystemNotification).not.toHaveBeenCalled();
  });
});
