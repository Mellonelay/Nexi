import { jest } from '@jest/globals';
import Database from 'better-sqlite3';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ConfigService} from '@nestjs/config';
import {LocalSqliteBridgeService} from '../../src/d1/local-sqlite-bridge.service';
import {D1FinancialCommandGateway} from '../../src/d1/d1-financial-command.gateway';
import {D1WorkerBridgeService} from '../../src/d1/d1-worker-bridge.service';
import {LocalWorkflowStore} from '../../src/jobs/local-workflow.store';
import {LocalWorkflowCoordinator} from '../../src/jobs/local-workflow.coordinator';
import { WorkflowCommandsService } from '../../src/workflows/workflow-commands.service';

describe('Mining workflow crash replay across calendar days',()=>{
 let dir:string;let bridge:LocalSqliteBridgeService;let previousEnabled:string|undefined;
 beforeEach(()=>{previousEnabled=process.env.D1_RUNTIME_ENABLED;process.env.D1_RUNTIME_ENABLED='true';});
 afterEach(()=>{jest.useRealTimers();bridge?.onModuleDestroy();if(dir)rmSync(dir,{recursive:true,force:true});if(previousEnabled===undefined)delete process.env.D1_RUNTIME_ENABLED;else process.env.D1_RUNTIME_ENABLED=previousEnabled;});
 const setup=(alreadyPaid=false)=>{
  jest.useFakeTimers();jest.setSystemTime(new Date('2026-10-16T23:59:59Z'));
  const rewards:string[]=alreadyPaid?['2026-10-16']:[];
  dir=mkdtempSync(join(tmpdir(),'nexi-mining-replay-'));const filename=join(dir,'fixture.sqlite');const db=new Database(filename);
  db.exec('CREATE TABLE MiningRewardAccrual (subscriptionId TEXT NOT NULL,idempotencyKey TEXT PRIMARY KEY)');
  if(alreadyPaid)db.prepare('INSERT INTO MiningRewardAccrual VALUES (?,?)').run('synthetic-sub','mining-reward:synthetic-sub:2026-10-16');
  db.prepare('INSERT INTO MiningRewardAccrual VALUES (?,?)').run('other-sub','mining-reward:other-sub:2026-10-16');db.close();
  bridge=new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));
  const d1=new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService);
  d1.getMiningSubscription=async()=>({id:'synthetic-sub',status:'ACTIVE',endDate:'2026-11-01T00:00:00Z',lastRewardPaid:rewards.at(-1)??null});
  // Synthetic accrual rows exercise recovery decisions, not real Ledger postings.
  const mining:any={accrue:async()=>{const day=new Date().toISOString().slice(0,10);if(!rewards.includes(day)){await bridge.batch([{sql:'INSERT INTO MiningRewardAccrual VALUES (?,?)',params:['synthetic-sub','mining-reward:synthetic-sub:'+day]}]);rewards.push(day);}return {replayed:false};}};
  const service=new WorkflowCommandsService({} as any,mining,{} as any,d1);
  const command={workflow:'mining',instanceId:'synthetic-workflow',action:'accrue',entityId:'synthetic-sub',idempotencyKey:'synthetic-workflow:accrue:0',payload:{accrualCheckpoint:{subscriptionId:'synthetic-sub',rewardCount:rewards.length,day:'2026-10-16',alreadyRewarded:alreadyPaid}}};
  return {service,command,rewards,d1,filename};
 };
 it('does not post a second daily reward when a committed step is replayed after midnight',async()=>{
  const {service,command,rewards}=setup();await service.execute(command);expect(rewards).toHaveLength(1);
  // Crash before the coordinator saves the result; replay the exact persisted command.
  jest.setSystemTime(new Date('2026-10-17T00:00:01Z'));await service.execute(command);expect(rewards).toHaveLength(1);
 });
 it('preserves a no-op checkpoint if that day was already rewarded',async()=>{
  const {service,command,rewards}=setup(true);jest.setSystemTime(new Date('2026-10-17T00:00:01Z'));await service.execute(command);expect(rewards).toHaveLength(1);
 });
 it('rejects a checkpoint from a different subscription without crediting',async()=>{
  const {service,command,rewards}=setup();await expect(service.execute({...command,payload:{accrualCheckpoint:{...command.payload.accrualCheckpoint,subscriptionId:'other'}}})).rejects.toThrow('checkpoint');expect(rewards).toHaveLength(0);
 });
 it('reads the native checkpoint only for the intended subscription',async()=>{
  const {d1}=setup(true);await expect(d1.getMiningAccrualCheckpoint('synthetic-sub')).resolves.toEqual({subscriptionId:'synthetic-sub',rewardCount:1,day:'2026-10-16',alreadyRewarded:true});
 });
 it('allows a new cycle with a fresh canonical checkpoint',async()=>{
  const {service,command,rewards}=setup();await service.execute(command);jest.setSystemTime(new Date('2026-10-17T00:00:01Z'));
  await service.execute({...command,idempotencyKey:'synthetic-workflow:accrue:1',payload:{accrualCheckpoint:{subscriptionId:'synthetic-sub',rewardCount:1,day:'2026-10-17',alreadyRewarded:false}}});expect(rewards).toHaveLength(2);
 });
 it('recovers a committed accrual after a native SQLite checkpoint failure and process restart',async()=>{
  const {service,rewards,filename}=setup();
  const db=new Database(filename);db.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql',import.meta.url),'utf8'));db.close();
  let store=new LocalWorkflowStore(bridge);
  const invoke=async(input:any)=>input.action==='plan'?{done:false,nextRunAt:new Date().toISOString()}:service.execute(input);
  let engine=new LocalWorkflowCoordinator(store,invoke);
  await engine.start('mining','synthetic-workflow','synthetic-sub');await engine.tick('synthetic-workflow');await engine.tick('synthetic-workflow');
  expect(await store.get('synthetic-workflow')).toMatchObject({phase:'mining-accrue'});
  const fault=new Database(filename);
  fault.exec("CREATE TRIGGER synthetic_checkpoint_crash BEFORE UPDATE ON LocalWorkflowInstance WHEN OLD.phase='mining-accrue' AND NEW.phase='mining-checkpoint' BEGIN SELECT RAISE(ABORT,'synthetic checkpoint failure'); END");fault.close();
  await engine.tick('synthetic-workflow');
  expect(rewards).toHaveLength(1);expect(await store.step('synthetic-workflow','mining-accrue-0')).toBeNull();
  expect(await store.get('synthetic-workflow')).toMatchObject({phase:'mining-accrue',context:{retryCount:1}});
  bridge.onModuleDestroy();const recovery=new Database(filename);recovery.exec('DROP TRIGGER synthetic_checkpoint_crash');recovery.close();
  bridge=new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));
  // Reconstruct command service as well: no old SQLite connection survives recovery.
  const d1=new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService);
  d1.getMiningSubscription=async()=>({id:'synthetic-sub',status:'ACTIVE',endDate:'2026-11-01T00:00:00Z',lastRewardPaid:'2026-10-16'});
  let duplicateEffects=0;
  const recoveredService=new WorkflowCommandsService({} as any,{accrue:async()=>{duplicateEffects++;return {};}} as any,{} as any,d1);
  store=new LocalWorkflowStore(bridge);engine=new LocalWorkflowCoordinator(store,input=>recoveredService.execute(input));
  jest.setSystemTime(new Date('2026-10-17T00:00:10Z'));await engine.tick('synthetic-workflow');
  expect(duplicateEffects).toBe(0);expect(rewards).toHaveLength(1);
  expect(await store.step('synthetic-workflow','mining-accrue-0')).not.toBeNull();
  expect(await store.get('synthetic-workflow')).toMatchObject({status:'SLEEPING',phase:'mining-checkpoint',context:{cycle:1}});
 });

});
