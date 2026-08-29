import { Test } from '@nestjs/testing';
import { LedgerModule } from '../../src/ledger/ledger.module';
import { SettlementModule } from '../../src/settlement/settlement.module';
import { NotificationModule } from '../../src/notification/notification.module';
import { AuditModule } from '../../src/audit/audit.module';
import { RiskModule } from '../../src/risk/risk.module';
import { SandboxModule } from '../../src/sandbox/sandbox.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('NEXI authority boundary modules', () => {
  it('compiles each isolated boundary without cross-module leakage', async () => {
    for (const moduleType of [LedgerModule, SettlementModule, NotificationModule, AuditModule, RiskModule, SandboxModule]) {
      const moduleRef = await Test.createTestingModule({ imports: [moduleType] })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile();
      expect(moduleRef).toBeDefined();
      await moduleRef.close();
    }
  });
});
