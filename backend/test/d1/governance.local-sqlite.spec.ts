import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { D1FinancialCommandGateway } from '../../src/d1/d1-financial-command.gateway';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';

describe('Governance command SQLite atomic replay and decision', () => {
  let dir: string;
  let filename: string;
  let bridge: LocalSqliteBridgeService;
  let gateway: D1FinancialCommandGateway;
  const old = process.env.D1_RUNTIME_ENABLED;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'nexi-governance-'));
    filename = join(dir, 'fixture.sqlite');
    const db = new Database(filename);
    db.exec(readFileSync(new URL('../../prisma/migrations-d1/0001_initial.sql', import.meta.url), 'utf8'));
    db.close();
    process.env.D1_RUNTIME_ENABLED = 'true';
    const config = {get: (key: string) => key === 'NEXI_LOCAL_SQLITE_PATH' ? filename : undefined} as unknown as ConfigService;
    bridge = new LocalSqliteBridgeService(config);
    gateway = new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService);
  });
  afterEach(() => {
    bridge.onModuleDestroy();
    rmSync(dir, {recursive: true, force: true});
    if (old === undefined) delete process.env.D1_RUNTIME_ENABLED;
    else process.env.D1_RUNTIME_ENABLED = old;
  });
  const request = () => ({
    id:'gov-1', commandType:'FINANCIAL_CORRECTION', target:'user-1',
    reason:'initial correction', idempotencyKey:'gov-key-12345678',
    payload:{amount:'1', nested:{asset:'USDT'}}, requestedBy:'admin-1',
  });
  it('replays exact command, rejects altered terms, writes one audit row', async () => {
    const input = request();
    const first = await gateway.createGovernanceCommand(input);
    const replay = await gateway.createGovernanceCommand({...input,id:'gov-2',payload:{nested:{asset:'USDT'},amount:'1'}});
    expect(replay.id).toBe(first.id);
    await expect(gateway.createGovernanceCommand({...input,id:'gov-3',payload:{amount:'2'}}))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(gateway.createGovernanceCommand({...input,id:'gov-4',reason:'different'}))
      .rejects.toBeInstanceOf(BadRequestException);
    const audit=await bridge.select<{count:number}>("SELECT COUNT(*) AS count FROM AdminAuditLog WHERE action='GOVERNANCE_COMMAND_REQUESTED'");
    expect(audit.results[0].count).toBe(1);
  });
  it('persists one winning decision, one approval and one audit, rejects competing decision', async () => {
    await gateway.createGovernanceCommand(request());
    const settled = await Promise.allSettled([
      gateway.decideGovernanceCommand('gov-1','admin-2','APPROVED','approved'),
      gateway.decideGovernanceCommand('gov-1','admin-3','REJECTED','rejected'),
    ]);
    expect(settled.filter(x=>x.status==='fulfilled')).toHaveLength(1);
    const state=await bridge.select<{status:string}>('SELECT status FROM AdminGovernanceCommand WHERE id=?',['gov-1']);
    const approval=await bridge.select<{decision:string}>('SELECT decision FROM AdminGovernanceApproval WHERE commandId=?',['gov-1']);
    const audit=await bridge.select<{count:number}>("SELECT COUNT(*) AS count FROM AdminAuditLog WHERE target='gov-1' AND action IN ('GOVERNANCE_COMMAND_APPROVED','GOVERNANCE_COMMAND_REJECTED')");
    expect(approval.results).toHaveLength(1);
    expect(approval.results[0].decision).toBe(state.results[0].status);
    expect(audit.results[0].count).toBe(1);
  });
});
