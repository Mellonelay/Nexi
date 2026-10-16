import Database from 'better-sqlite3';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {ConfigService} from '@nestjs/config';
import {LocalSqliteBridgeService} from '../../src/d1/local-sqlite-bridge.service';
import {LocalWorkflowStore} from '../../src/jobs/local-workflow.store';
import {LocalWorkflowCoordinator} from '../../src/jobs/local-workflow.coordinator';
import {LocalQueueConsumer} from '../../src/jobs/local-queue.consumer';
describe('Existing Inbox and durable workflow queue consumption',()=>{
 let dir:string;let bridge:LocalSqliteBridgeService;let store:LocalWorkflowStore;let engine:LocalWorkflowCoordinator;let consumer:LocalQueueConsumer;let ingress:any[];let now:number;
 const event={type:'LOAN_APPROVED',version:1,idempotencyKey:'synthetic-approval',correlationId:'synthetic-correlation',payload:{loanId:'synthetic-loan'}};
 const context:any={id:'a'.repeat(64),queue:'domain-events',attempts:2};
 beforeEach(()=>{dir=mkdtempSync(join(tmpdir(),'nexi-consumer-'));const filename=join(dir,'fixture.sqlite');const db=new Database(filename);db.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql',import.meta.url),'utf8'));db.close();bridge=new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));store=new LocalWorkflowStore(bridge);now=Date.parse('2026-10-16T00:00:00Z');engine=new LocalWorkflowCoordinator(store,async()=>({done:true}),()=>now);ingress=[];consumer=new LocalQueueConsumer({recordQueueIngress:async(...args:any[])=>{ingress.push(args);return {replayed:ingress.length>1};}} as any,store,engine,()=>now);});
 afterEach(()=>{bridge.onModuleDestroy();rmSync(dir,{recursive:true,force:true});});
 it('records the existing Inbox and durably dispatches a loan even on ingress replay',async()=>{
  await consumer.execute(event,context);await consumer.execute(event,context);
  expect(ingress).toHaveLength(2);expect(ingress[0].slice(0,3)).toEqual(['domain-events',context.id,2]);
  expect(await store.get('loan-synthetic-loan')).toMatchObject({status:'WAITING'});
  expect(await store.event('loan-synthetic-loan','decision')).toMatchObject({payload:{decision:'APPROVED'}});
 });
 it('acknowledges a completed loan without sending a forbidden closed-instance event',async()=>{
  await consumer.execute(event,context);await engine.tick('loan-synthetic-loan');await engine.tick('loan-synthetic-loan');
  expect(await store.get('loan-synthetic-loan')).toMatchObject({status:'COMPLETED'});await expect(consumer.execute(event,context)).resolves.toBeUndefined();
 });
 it('resumes an errored loan after redelivery while preserving its durable history',async()=>{
  await engine.start('loan','loan-synthetic-loan','synthetic-loan');now+=365*86400000;await engine.tick('loan-synthetic-loan');
  expect(await store.get('loan-synthetic-loan')).toMatchObject({status:'FAILED'});
  await consumer.execute(event,context);await engine.tick('loan-synthetic-loan');await engine.tick('loan-synthetic-loan');
  expect(await store.get('loan-synthetic-loan')).toMatchObject({status:'COMPLETED',context:{restartCount:1}});
 });
 it('does not invent downstream handlers for notifications or integration jobs',async()=>{
  await consumer.execute({...event,type:'SYNTHETIC_NOTICE'},{...context,queue:'notifications'});expect(ingress).toHaveLength(1);expect(await store.get('loan-synthetic-loan')).toBeNull();
 });
});
