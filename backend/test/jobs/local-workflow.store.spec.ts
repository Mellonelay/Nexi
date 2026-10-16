import Database from 'better-sqlite3';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';
import { LocalWorkflowStore } from '../../src/jobs/local-workflow.store';

describe('Durable workflow checkpoints and event waits',()=>{
 let dir:string;let filename:string;let bridge:LocalSqliteBridgeService;let store:LocalWorkflowStore;
 const initial={id:'loan-synthetic',workflow:'loan',entityId:'synthetic-loan',status:'RUNNING',phase:'loan-start',nextAt:100,context:{}};
 const open=()=>new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));
 beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'nexi-workflow-'));filename=join(dir,'fixture.sqlite');const db=new Database(filename);db.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql',import.meta.url),'utf8'));db.close();bridge=open();store=new LocalWorkflowStore(bridge);});
 afterEach(()=>{bridge?.onModuleDestroy();rmSync(dir,{recursive:true,force:true});});
 it('preserves instance identity and rejects a changed workflow/entity',async()=>{
  expect((await store.create(initial,100)).replayed).toBe(false);expect((await store.create(initial,101)).replayed).toBe(true);
  await expect(store.create({...initial,entityId:'other'},102)).rejects.toThrow('identity');
 });
 it('checkpoints a command result atomically and restores it after reconnect',async()=>{
  await store.create(initial,100);await store.claim(initial.id,'lease-a',100);
  const next={...initial,status:'SLEEPING',phase:'loan-due',nextAt:1000,context:{dueAt:1000}};
  expect(await store.checkpoint(initial.id,'lease-a',0,next,101,{name:'loan-load-schedule',commandKey:initial.id+':schedule',result:{dueAt:1000}})).toBe(true);
  bridge.onModuleDestroy();bridge=open();store=new LocalWorkflowStore(bridge);
  expect(await store.get(initial.id)).toMatchObject({revision:1,status:'SLEEPING',phase:'loan-due'});
  expect(await store.step(initial.id,'loan-load-schedule')).toEqual({dueAt:1000});expect(await store.due(999)).toHaveLength(0);expect(await store.due(1000)).toHaveLength(1);
 });
 it('buffers an early event and wakes a wait without losing it',async()=>{
  await store.create(initial,100);await store.signal(initial.id,'decision','provider-1',{decision:'APPROVED'},100);
  await store.claim(initial.id,'lease-a',100);
  await store.checkpoint(initial.id,'lease-a',0,{...initial,status:'WAITING',phase:'loan-wait',awaitedEvent:'decision',nextAt:999999},101);
  expect(await store.due(101)).toHaveLength(1);expect(await store.event(initial.id,'decision')).toMatchObject({eventKey:'provider-1',payload:{decision:'APPROVED'}});
 });
 it('deduplicates events, rejects changed payloads and does not resurrect completion',async()=>{
  await store.create(initial,100);await store.signal(initial.id,'decision','provider-1',{decision:'APPROVED'},100);
  expect((await store.signal(initial.id,'decision','provider-1',{decision:'APPROVED'},101)).replayed).toBe(true);
  await expect(store.signal(initial.id,'decision','provider-1',{decision:'REJECTED'},102)).rejects.toThrow('content');
  await store.claim(initial.id,'lease-a',100);await store.checkpoint(initial.id,'lease-a',0,{...initial,status:'COMPLETED',phase:'done',nextAt:100},101,undefined,'provider-1');
  expect(await store.event(initial.id,'decision')).toBeNull();expect(await store.due(999999)).toHaveLength(0);
  await expect(store.signal(initial.id,'decision','late',{decision:'APPROVED'},103)).rejects.toThrow('accepting');
 });
 it('rolls back the checkpoint and event consumption if its step record fails',async()=>{
  await store.create(initial,100);await store.signal(initial.id,'decision','event-1',{decision:'APPROVED'},100);expect(await store.claim(initial.id,'lease',100)).not.toBeNull();
  const next={...initial,status:'SLEEPING',phase:'due',nextAt:1000};
  await expect(store.checkpoint(initial.id,'lease',0,next,101,{name:null as unknown as string,commandKey:'schedule',result:{}},'event-1')).rejects.toThrow();
  expect(await store.get(initial.id)).toMatchObject({revision:0,phase:'loan-start'});expect(await store.event(initial.id,'decision')).not.toBeNull();
  expect(await store.checkpoint(initial.id,'lease',0,next,102,{name:'schedule',commandKey:'schedule',result:{dueAt:1000}},'event-1')).toBe(true);
  expect(await store.step(initial.id,'schedule')).toEqual({dueAt:1000});expect(await store.event(initial.id,'decision')).toBeNull();
 });
 it('fences stale checkpoints across connections and never records their step',async()=>{
  await store.create(initial,100);await store.claim(initial.id,'old',100);const b=open();
  try{const other=new LocalWorkflowStore(b);expect(await other.claim(initial.id,'new',101)).toBeNull();expect(await other.claim(initial.id,'new',60100)).not.toBeNull();
   expect(await store.checkpoint(initial.id,'old',0,{...initial,status:'COMPLETED'},60101,{name:'bad-step',commandKey:'bad',result:{}})).toBe(false);
   expect(await other.step(initial.id,'bad-step')).toBeNull();expect((await other.get(initial.id)).revision).toBe(0);
  }finally{b.onModuleDestroy();}
 });
 it('preserves rollback across repeated instances and prior connection changes',async()=>{
  for(let index=0;index<40;index++){
   const state={...initial,id:'loan-repeat-'+index};await store.create(state,100);await store.signal(state.id,'decision','event',{decision:'APPROVED'},100);expect(await store.claim(state.id,'lease',100)).not.toBeNull();
   await expect(store.checkpoint(state.id,'lease',0,{...state,status:'SLEEPING',phase:'due'},101,{name:null as unknown as string,commandKey:'schedule',result:{}},'event')).rejects.toThrow();
   expect(await store.get(state.id)).toMatchObject({revision:0,phase:'loan-start'});expect(await store.event(state.id,'decision')).not.toBeNull();
  }
 });

 it('atomically rolls back a valid checkpoint and consumed event on a native step-insert fault',async()=>{
  await store.create(initial,100);await store.signal(initial.id,'decision','native-fault-event',{decision:'APPROVED'},100);expect(await store.claim(initial.id,'lease',100)).not.toBeNull();
  const db=new Database(filename);db.exec("CREATE TRIGGER synthetic_step_fault BEFORE INSERT ON LocalWorkflowStep BEGIN SELECT RAISE(ABORT,'synthetic step insertion fault'); END");db.close();
  await expect(store.checkpoint(initial.id,'lease',0,{...initial,status:'SLEEPING',phase:'due'},101,{name:'schedule',commandKey:'schedule',result:{}},'native-fault-event')).rejects.toThrow('synthetic step insertion fault');
  expect(await store.get(initial.id)).toMatchObject({revision:0,phase:'loan-start',leaseToken:'lease'});expect(await store.event(initial.id,'decision')).not.toBeNull();expect(await store.step(initial.id,'schedule')).toBeNull();
 });

});
