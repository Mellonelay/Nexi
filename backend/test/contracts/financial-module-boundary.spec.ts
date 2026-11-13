import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuthModule } from '../../src/auth/auth.module';
import { FinancialOperationsModule } from '../../src/financial/financial-operations.module';
import { FinancialHttpModule } from '../../src/financial/financial-http.module';
import { FinancialOperationsController } from '../../src/financial/financial-operations.controller';
import { LocalDepositProofController } from '../../src/financial/local-deposit-proof.controller';
import { FinancialOperationsService } from '../../src/financial/financial-operations.service';
import { LocalDepositProofStore } from '../../src/financial/local-deposit-proof.store';

describe('financial controller and service module ownership', () => {
  it('exposes the same HTTP controllers without a financial-service-to-auth module edge', () => {
    const financialImports: unknown[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, FinancialOperationsModule) ?? [];
    const httpImports: unknown[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, FinancialHttpModule) ?? [];
    const httpControllers: unknown[] = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, FinancialHttpModule) ?? [];
    const financialExports: unknown[] = Reflect.getMetadata(MODULE_METADATA.EXPORTS, FinancialOperationsModule) ?? [];

    expect(financialImports).not.toContain(AuthModule);
    expect(httpImports).toEqual([AuthModule, FinancialOperationsModule]);
    expect(httpControllers).toEqual([FinancialOperationsController, LocalDepositProofController]);
    expect(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, FinancialOperationsModule) ?? []).toEqual([]);
    expect(financialExports).toContain(FinancialOperationsService);
    expect(financialExports).toContain(LocalDepositProofStore);
  });
});
