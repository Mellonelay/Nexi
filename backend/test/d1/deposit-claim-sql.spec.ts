import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite');

it('executes claim submission, review and credit against migrated schema with durable lifecycle events and replay', async () => {
  process.env.D1_RUNTIME_ENABLED = 'true';
  const db = new DatabaseSync(':memory:');
  try {
    const migration = readFileSync('prisma/migrations-d1/0001_initial.sql','utf8');
    for (const table of ['DepositClaim','Gate2OperationAudit','AdminAuditLog','EventOutbox']) {
      const start = migration.indexOf('CREATE TABLE "'+table+'" (');
      if (start < 0) throw new Error('Missing migrated table '+table);
      const end = migration.indexOf(');',start);
      db.exec(migration.slice(start,end+2));
    }
    db.exec('CREATE TABLE User (id TEXT PRIMARY KEY); INSERT INTO User VALUES (\'user\'),(\'admin\'); CREATE TABLE Currency (id INTEGER, symbol TEXT, minDeposit TEXT, maxDeposit TEXT, isActive INTEGER, depositEnabled INTEGER); CREATE TABLE WalletNetwork (id TEXT, currencyId INTEGER, code TEXT, isActive INTEGER, depositEnabled INTEGER); CREATE TABLE DepositAddress (id TEXT PRIMARY KEY, currencyId INTEGER, walletNetworkId TEXT, address TEXT, isActive INTEGER);');
    db.prepare('INSERT INTO Currency VALUES (1,?,?,?,?,?)').run('USDT','1','1000000',1,1);
    db.prepare('INSERT INTO WalletNetwork VALUES (?,1,?,1,1)').run('network','ERC20');
    db.prepare('INSERT INTO DepositAddress VALUES (?,1,?,?,1)').run('destination','network','TEST_ONLY');
    const bridge = {
      isEnabled: () => true,
      select: async (sql: string, params: any[] = []) => ({results: db.prepare(sql).all(...params)}),
      batch: async (statements: any[]) => {
        db.exec('BEGIN');
        try { const results = statements.map(s => ({meta: {changes: Number(db.prepare(s.sql).run(...(s.params ?? [])).changes)}})); db.exec('COMMIT'); return {results}; }
        catch (error) { db.exec('ROLLBACK'); throw error; }
      },
    };
    const gateway = new D1FinancialCommandGateway(bridge as any);
    jest.spyOn(gateway,'getAccountForUser').mockResolvedValue({id:'account'} as any);
    const credit = jest.spyOn(gateway,'credit').mockResolvedValue({postingId:'posting'} as any);
    const command = {id:'claim',userId:'user',asset:'USDT',network:'ERC20',depositAddressId:'destination',claimedAmount:'100',proofObjectKey:'proof',idempotencyKey:'test-claim'};
    await expect(gateway.submitDepositClaim(command)).resolves.toMatchObject({state:'PENDING_REVIEW'});
    await gateway.submitDepositClaim(command);
    await expect(gateway.updateDepositClaimState('claim','APPROVED','admin','TEST_ONLY','test-approve')).resolves.toMatchObject({state:'APPROVED'});
    await gateway.updateDepositClaimState('claim','APPROVED','admin','TEST_ONLY','test-approve');
    await expect(gateway.creditDepositClaim('claim','admin','TEST_ONLY','test-credit')).resolves.toMatchObject({state:'CREDITED',creditedLedgerPostingId:'posting'});
    await gateway.creditDepositClaim('claim','admin','TEST_ONLY','test-credit');
    expect(credit).toHaveBeenCalledTimes(1);
    await expect(gateway.updateDepositClaimState('claim','APPROVED','admin','TEST_ONLY','other-key')).rejects.toThrow('not pending review');
    expect(db.prepare('SELECT eventType FROM EventOutbox ORDER BY rowid').all().map((r: any)=>r.eventType)).toEqual(['DEPOSIT_CLAIM_SUBMITTED','DEPOSIT_CLAIM_APPROVED','DEPOSIT_CLAIM_CREDITED']);
    expect(db.prepare('SELECT COUNT(*) AS count FROM DepositClaim').get().count).toBe(1);
  } finally { db.close(); delete process.env.D1_RUNTIME_ENABLED; }
});
