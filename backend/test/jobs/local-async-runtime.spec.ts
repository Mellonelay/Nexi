import { ConfigService } from '@nestjs/config';
import type { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
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
