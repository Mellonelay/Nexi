import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { randomBytes, randomUUID } from 'node:crypto';
import { chmodSync, writeFileSync } from 'node:fs';
import { AppModule } from './app.module';
import { D1FinancialCommandGateway } from './d1/d1-financial-command.gateway';
import { UsersService } from './users/users.service';
import { AdminService } from './admin/admin.service';

const FAIL = (message: string): never => { throw new Error(`STAGING_FIXTURE_${message}`); };

async function main() {
  if (process.env.NODE_ENV !== 'staging') FAIL('REQUIRES_NODE_ENV_STAGING');
  if (process.env.D1_RUNTIME_ENABLED !== 'true' || process.env.D1_BRIDGE_ENABLED !== 'true') FAIL('REQUIRES_D1_RUNTIME_AND_BRIDGE');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const d1 = app.get(D1FinancialCommandGateway);
    const users = app.get(UsersService);
    const adminService = app.get(AdminService);
    if (!d1.isEnabled()) FAIL('D1_GATEWAY_DISABLED');
    const existingAdmins = await d1.listAdminUsers();
    const suffix = randomUUID().slice(0, 8);
    const email = `staging-synthetic-${suffix}@invalid.nexi.test`;
    const password = randomBytes(32).toString('base64url');
    const user = await users.createUser({ email, password });
    let adminPassword: string | undefined;
    let adminEmail: string | undefined;
    let admin = existingAdmins[0];
    if (!admin || process.env.STAGING_FIXTURE_CREATE_ADMIN === 'true') {
      adminPassword = randomBytes(32).toString('base64url');
      adminEmail = `staging-admin-${suffix}@invalid.nexi.test`;
      const adminUser = await users.createAdminUser({ email: adminEmail, password: adminPassword });
      admin = await adminService.assignAdminRole(adminUser.id, 'super_admin', 'STAGING_SYNTHETIC_FIXTURE');
    }
    if (!admin) FAIL('ADMIN_FIXTURE_NOT_MATERIALIZED');
    const credentialFile = process.env.STAGING_FIXTURE_CREDENTIAL_FILE;
    if (credentialFile) {
      if (!adminEmail || !adminPassword) FAIL('CREDENTIAL_FILE_REQUIRES_CREATED_ADMIN');
      writeFileSync(credentialFile, JSON.stringify({ userEmail: email, userPassword: password, adminEmail, adminPassword }), { encoding: 'utf8', mode: 0o600 });
      chmodSync(credentialFile, 0o600);
    }
    const account = await d1.ensureAccount(user.id, 'USDT');
    const fundingKey = `STAGING_SYNTHETIC_FIXTURE:${user.id}:USDT:100000`;
    const credit = await d1.credit({ accountId: account.id, asset: 'USDT', amount: '100000', referenceType: 'STAGING_SYNTHETIC_FIXTURE', referenceId: user.id, idempotencyKey: fundingKey, correlationId: user.id, economicGroup: user.id, metadata: { fixture: true, scope: 'staging-only' } });
    const balance = await d1.getBalance(account.id);
    process.stdout.write(JSON.stringify({ fixture: 'STAGING_SYNTHETIC_FIXTURE', userId: user.id, accountId: account.id, fundingPostingId: credit.postingId, startingBalance: '0', fundingAmount: '100000', endingAvailable: balance.available, adminId: admin.id, adminRoleId: admin.roleId }) + '\n');
  } finally { await app.close(); }
}

main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
