import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigModule } from '@nestjs/config';
import { LedgerModule } from '../../src/ledger/ledger.module';
import { SettlementModule } from '../../src/settlement/settlement.module';
import { NotificationModule } from '../../src/notification/notification.module';
import { AuditModule } from '../../src/audit/audit.module';
import { RiskModule } from '../../src/risk/risk.module';
import { SandboxModule } from '../../src/sandbox/sandbox.module';
import { CommunicationsModule } from '../../src/communications/communications.module';
import { CommunicationsService } from '../../src/communications/communications.service';
import { SupportAttachmentStorageService } from '../../src/communications/support-attachment-storage.service';
import { UsersService } from '../../src/users/users.service';

@Global()
@Module({ providers: [{ provide: UsersService, useValue: {} }], exports: [UsersService] })
class TestUsersModule {}

describe('NEXI authority boundary modules', () => {
  it('compiles each isolated boundary without cross-module leakage', async () => {
    for (const moduleType of [LedgerModule, SettlementModule, NotificationModule, AuditModule, RiskModule, SandboxModule]) {
      const moduleRef = await Test.createTestingModule({ imports: [ConfigModule.forRoot({ isGlobal: true }), moduleType] }).compile();
      expect(moduleRef).toBeDefined();
      await moduleRef.close();
    }
  });

  it('resolves communications providers through the Nest module container', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'nexi-communications-module-'));
    const filename = join(directory, 'fixture.sqlite');
    new Database(filename).close();
    const previousPath = process.env.NEXI_LOCAL_SQLITE_PATH;
    const previousJwtSecret = process.env.JWT_SECRET;
    process.env.NEXI_LOCAL_SQLITE_PATH = filename;
    process.env.JWT_SECRET = 'test-only-secret';
    let moduleRef: TestingModule | undefined;
    try {
      moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true }), TestUsersModule, CommunicationsModule],
      }).compile();
      expect(moduleRef.get(CommunicationsService)).toBeInstanceOf(CommunicationsService);
      expect(moduleRef.get(SupportAttachmentStorageService)).toBeInstanceOf(SupportAttachmentStorageService);
    } finally {
      await moduleRef?.close();
      if (previousPath === undefined) delete process.env.NEXI_LOCAL_SQLITE_PATH;
      else process.env.NEXI_LOCAL_SQLITE_PATH = previousPath;
      if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousJwtSecret;
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
