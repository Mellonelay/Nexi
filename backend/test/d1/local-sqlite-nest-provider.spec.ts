import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { D1PrismaModule } from '../../src/d1/d1-prisma.module';
import { D1PrismaService } from '../../src/d1/d1-prisma.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';

describe('NEXI SQLite / D1 Nest provider selection', () => {
  let root: string;
  const original = {
    mode: process.env.NEXI_SQLITE_LOCAL_ENABLED,
    d1: process.env.D1_RUNTIME_ENABLED,
    path: process.env.NEXI_LOCAL_SQLITE_PATH,
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'nexi-provider-'));
    const filename = join(root, 'test.sqlite');
    new Database(filename).close();
    process.env.NEXI_LOCAL_SQLITE_PATH = filename;
    delete process.env.NEXI_SQLITE_LOCAL_ENABLED;
    delete process.env.D1_RUNTIME_ENABLED;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries({
      NEXI_SQLITE_LOCAL_ENABLED: original.mode,
      D1_RUNTIME_ENABLED: original.d1,
      NEXI_LOCAL_SQLITE_PATH: original.path,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(root, { recursive: true, force: true });
  });

  async function initialize() {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        D1PrismaModule,
      ],
    }).compile();
    await module.init();
    return module;
  }

  it('preserves D1 bridge as the default without an opt-in', async () => {
    const module = await initialize();
    try {
      const bridge = module.get(D1WorkerBridgeService);
      expect(bridge).toBeInstanceOf(D1WorkerBridgeService);
      expect(bridge).not.toBeInstanceOf(LocalSqliteBridgeService);
      expect(module.get(D1PrismaService).isEnabled()).toBe(false);
    } finally {
      await module.close();
    }
  });

  it('routes Nest bridge and Prisma to local SQLite only with explicit opt-in', async () => {
    process.env.NEXI_SQLITE_LOCAL_ENABLED = 'true';
    const module = await initialize();
    try {
      const bridge = module.get(D1WorkerBridgeService);
      expect(bridge).toBeInstanceOf(LocalSqliteBridgeService);
      expect(module.get(D1PrismaService).isEnabled()).toBe(true);
      expect(await module.get(D1PrismaService).isReady()).toBe(true);
    } finally {
      await module.close();
    }
  });
});
