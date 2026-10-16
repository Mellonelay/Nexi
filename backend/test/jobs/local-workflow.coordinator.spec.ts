import Database from 'better-sqlite3';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {ConfigService} from '@nestjs/config';
import {LocalSqliteBridgeService} from '../../src/d1/local-sqlite-bridge.service';
import {LocalWorkflowStore} from '../../src/jobs/local-workflow.store';
import {LocalWorkflowCoordinator} from '../../src/jobs/local-workflow.coordinator';
import type {WorkflowCommand} from '../../src/workflows/workflow-commands.service';
describe('Durable loan, withdrawal and mining workflow coordinator',()=>{
 let dir:string;let filename:string;let bridge:LocalSqliteBridgeService;let store:LocalWorkflowStore;let engine:LocalWorkflowCoordinator;
 let now:number;let due:number;let terminal:boolean;let calls:WorkflowCommand[];
 const invoke=async(input:WorkflowCommand):Promise<Record<string,unknown>>=>{calls.push(input);return input.action==='schedule'?{done:false,dueAt:new Date(due).toISOString()}:{done:terminal,state:terminal?'OVERDUE':'ACTIVE'};};
 const reopen=()=>{bridge=new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));store=new LocalWorkflowStore(bridge);engine=new LocalWorkflowCoordinator(store,invoke,()=>now);};
 beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'nexi-coordinator-'));filename=join(dir,'fixture.sqlite');const d=new Database(filename);d.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql',import.meta.url),'utf8'));d.close();now=Date.parse('2026-10-16T00:00:00Z');due=now+1000;terminal=true;calls=[];reopen();});
 afterEach(()=>{bridge?.onModuleDestroy();rmSync(dir,{recursive:true,force:true});});
 const approve=async()=>{await engine.start('loan','loan-synthetic','synthetic');await engine.signal('loan-synthetic','decision','approval-1',{decision:'APPROVED'});await engine.tick('loan-synthetic');await engine.tick('loan-synthetic');};
 it('persists approval and schedule across restart, then completes at the real due time',async()=>{
  await approve();expect(await store.get('loan-synthetic')).toMatchObject({status:'SLEEPING',phase:'loan-check-due'});
  bridge.onModuleDestroy();reopen();now=due-1;expect(await engine.tick('loan-synthetic')).toBe(false);expect(calls).toHaveLength(1);
  now=due;await engine.tick('loan-synthetic');expect(await store.get('loan-synthetic')).toMatchObject({status:'COMPLETED'});
  expect(calls.map(c=>c.idempotencyKey)).toEqual(['loan-synthetic:schedule','loan-synthetic:check-due']);
 });
 it('retries a nonterminal due check without caching its failed result',async()=>{
  await approve();terminal=false;now=due;await engine.tick('loan-synthetic');
  expect(await store.step('loan-synthetic','loan-check-due')).toBeNull();expect((await store.get('loan-synthetic'))?.nextAt).toBe(now+5000);
  now+=5000;terminal=true;await engine.tick('loan-synthetic');expect(await store.get('loan-synthetic')).toMatchObject({status:'COMPLETED'});
  expect(calls.filter(c=>c.action==='check-due')).toHaveLength(2);
 });
 it('expires the365-day approval wait without invoking a financial command',async()=>{
  await engine.start('loan','loan-synthetic','synthetic');now+=365*86400000;await engine.tick('loan-synthetic');
  expect(await store.get('loan-synthetic')).toMatchObject({status:'FAILED'});expect(calls).toHaveLength(0);
 });
 it('persists a withdrawal provider result across restart without inventing a receipt',async()=>{
  let settlements=0;const supplied='deterministic:synthetic-provider-proof';
  const withdrawal=async(input:WorkflowCommand):Promise<Record<string,unknown>>=>{calls.push(input);if(input.action==='prepare')return {done:false,state:'APPROVED'};settlements++;return {state:'SETTLED',providerLive:false};};
  engine=new LocalWorkflowCoordinator(store,withdrawal,()=>now);await engine.start('withdrawal','withdrawal-synthetic','synthetic');await engine.tick('withdrawal-synthetic');
  expect(await store.get('withdrawal-synthetic')).toMatchObject({status:'WAITING'});
  await engine.signal('withdrawal-synthetic','provider-result','result-1',{status:'SETTLED',receipt:supplied});await engine.tick('withdrawal-synthetic');
  bridge.onModuleDestroy();reopen();engine=new LocalWorkflowCoordinator(store,withdrawal,()=>now);await engine.tick('withdrawal-synthetic');
  expect(await store.get('withdrawal-synthetic')).toMatchObject({status:'COMPLETED'});expect(settlements).toBe(1);
  expect(calls[1]).toMatchObject({action:'settle',idempotencyKey:'withdrawal-synthetic:settle',payload:{receipt:supplied}});
  expect(await engine.tick('withdrawal-synthetic')).toBe(false);expect(settlements).toBe(1);
 });
 it('fails an invalid provider status before executing settlement',async()=>{
  const withdrawal=async(input:WorkflowCommand):Promise<Record<string,unknown>>=>{calls.push(input);return {done:false,state:'APPROVED'};};
  engine=new LocalWorkflowCoordinator(store,withdrawal,()=>now);await engine.start('withdrawal','withdrawal-synthetic','synthetic');await engine.tick('withdrawal-synthetic');
  await engine.signal('withdrawal-synthetic','provider-result','result-1',{status:'UNKNOWN'});await engine.tick('withdrawal-synthetic');
  expect(await store.get('withdrawal-synthetic')).toMatchObject({status:'FAILED'});expect(calls).toHaveLength(1);
 });

 it('persists a mining accrual checkpoint before invoking its existing economic command',async()=>{
  let rewardCalls=0;
  const mining=async(input:WorkflowCommand):Promise<Record<string,unknown>>=>{calls.push(input);
   if(input.action==='plan')return {done:false,nextRunAt:new Date(due).toISOString()};
   if(input.action==='accrual-checkpoint')return {done:false,accrualCheckpoint:{subscriptionId:'synthetic',rewardCount:0,day:'2026-10-16',alreadyRewarded:false}};
   rewardCalls++;expect(input.payload.accrualCheckpoint).toMatchObject({rewardCount:0});return {done:false,nextRunAt:new Date(due+86400000).toISOString()};
  };
  engine=new LocalWorkflowCoordinator(store,mining,()=>now);await engine.start('mining','mining-synthetic','synthetic');await engine.tick('mining-synthetic');
  expect(rewardCalls).toBe(0);now=due;await engine.tick('mining-synthetic');expect(await store.step('mining-synthetic','mining-checkpoint-0')).not.toBeNull();
  bridge.onModuleDestroy();reopen();engine=new LocalWorkflowCoordinator(store,mining,()=>now);await engine.tick('mining-synthetic');
  expect(rewardCalls).toBe(1);expect(calls.at(-1)?.idempotencyKey).toBe('mining-synthetic:accrue:0');
  expect(await store.get('mining-synthetic')).toMatchObject({status:'SLEEPING',context:{cycle:1}});
 });

});
