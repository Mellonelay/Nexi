import { Test, TestingModule } from '@nestjs/testing';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue, QueueEvents, Worker } from 'bullmq';
import Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';
import { LocalDurableJobStore } from '../../src/jobs/local-durable-job.store';
import { DurableQueueTransport } from '../../src/jobs/durable-queue.transport';
import {D1FinancialCommandGateway} from '../../src/d1/d1-financial-command.gateway';
import type {D1WorkerBridgeService} from '../../src/d1/d1-worker-bridge.service';
import {EventOutboxService} from '../../src/events/event-outbox.service';
import {LocalWorkflowStore} from '../../src/jobs/local-workflow.store';
import {LocalWorkflowCoordinator} from '../../src/jobs/local-workflow.coordinator';
import {LocalQueueConsumer} from '../../src/jobs/local-queue.consumer';
const socket=process.env.NEXI_TEST_VALKEY_SOCKET;
if (!socket) throw new Error('NEXI_TEST_VALKEY_SOCKET is required for the explicit local async integration suite');
describe('NestJS12/BullMQ6/Valkey durable transport integration',()=>{
 let dir:string;let bridge:LocalSqliteBridgeService;let store:LocalDurableJobStore;let module:TestingModule;
 let queue:Queue;let events:QueueEvents;let worker:Worker|undefined;let transport:DurableQueueTransport;
 let now:number;let effects:number;let fail:boolean;let prefix:string;
 const envelope={type:'TEST_SYNTHETIC',version:1,idempotencyKey:'synthetic',correlationId:'synthetic',payload:{}};
 const wait=async(fn:()=>Promise<boolean>)=>{const end=Date.now()+5000;while(!await fn()){if(Date.now()>end)throw Error('Timed out');await new Promise(r=>setTimeout(r,10));}};
 beforeEach(async()=>{
  now=Date.now();effects=0;fail=false;prefix='nexi-test-'+randomUUID();
  dir=mkdtempSync(join(tmpdir(),'nexi-bullmq-'));const filename=join(dir,'fixture.sqlite');const db=new Database(filename);
  db.exec(readFileSync(new URL('../../src/jobs/local-durable-job.schema.sql',import.meta.url),'utf8'));db.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql',import.meta.url),'utf8'));db.exec(readFileSync(new URL('../../prisma/migrations-d1/0002_event_inbox.sql',import.meta.url),'utf8'));db.close();
  bridge=new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));store=new LocalDurableJobStore(bridge);
  module=await Test.createTestingModule({imports:[BullModule.forRoot({connection:{path:socket,maxRetriesPerRequest:1},prefix}),BullModule.registerQueue({name:'domain-events'})]}).compile();
  await module.init();queue=module.get<Queue>(getQueueToken('domain-events'));await queue.waitUntilReady();
  events=new QueueEvents('domain-events',{connection:{path:socket,maxRetriesPerRequest:null},prefix});await events.waitUntilReady();
  transport=new DurableQueueTransport(store,{'domain-events':queue},async()=>{if(fail)throw Error('synthetic failure');effects++;},()=>now);
 });
 afterEach(async()=>{
  if(worker)await worker.close();worker=undefined;
  if(events)await events.close();if(queue)await queue.obliterate({force:false});if(module)await module.close();
  bridge?.onModuleDestroy();if(dir)rmSync(dir,{recursive:true,force:true});
 });
 const completed=async(id:string)=>(await bridge.select<any>('SELECT state FROM LocalDurableJob WHERE id = ?',[id])).results[0]?.state==='COMPLETED';
 const start=async()=>{worker=new Worker('domain-events',job=>transport.process(job.data.journalId),{connection:{path:socket,maxRetriesPerRequest:null},prefix,concurrency:1});worker.on('error',()=>{});await worker.waitUntilReady();};
 it('uses a new retained BullMQ job id for each failed-journal replay generation',async()=>{
  const accepted=await store.record('domain-events','generation-replay',envelope,now);
  const priorId=`${accepted.id}-0-0`;
  await queue.add('durable-event',{journalId:accepted.id},{jobId:priorId,attempts:1,removeOnComplete:false,removeOnFail:false});
  await store.claim(accepted.id,'lease-failed',now,1000);
  await store.retry(accepted.id,'lease-failed',now+1,now+1,'JOB_EXECUTION_FAILED',1);
  const replay=await store.replayFailed(accepted.id,0,now+2);
  expect(replay).toMatchObject({generation:1,generationAttempts:0});
  now=replay!.availableAt;
  await transport.dispatchPending();
  const prior=await queue.getJob(priorId);
  const current=await queue.getJob(`${accepted.id}-1-0`);
  try {
    expect(prior).toBeDefined();
    expect(current).toBeDefined();
    expect(current!.id).not.toBe(prior!.id);
  } finally {
    await prior?.remove();
    await current?.remove();
  }
 });
 it('accepts durably before enqueue and recovers a job removed from transport',async()=>{
  const receipt=await transport.accept('domain-events','one',envelope);expect(await store.pending(now)).toHaveLength(1);
  await transport.dispatchPending();const queued=(await queue.getJobs(['waiting']))[0];expect(queued).toBeDefined();await queued.remove();
  expect(await queue.getWaitingCount()).toBe(0);await transport.dispatchPending();await start();
  await wait(async()=>effects===1);await wait(()=>completed(receipt.id));
  expect(receipt.id).toBeDefined();expect(effects).toBe(1);
 });
 it('keeps retries in SQLite and preserves failed BullMQ attempts for inspection',async()=>{
  fail=true;await transport.accept('domain-events','two',envelope);await start();await transport.dispatchPending();
  await wait(async()=>(await queue.getFailedCount())===1);expect(await store.pending(now)).toHaveLength(0);
  now+=1999;expect(await store.pending(now)).toHaveLength(0);now+=1;fail=false;expect(await store.pending(now)).toHaveLength(1);await transport.dispatchPending();
  await wait(async()=>effects===1);expect(await queue.getFailedCount()).toBe(1);
 });
 it('rejects invalid event versions before durable acceptance',async()=>{
  await expect(transport.accept('domain-events','invalid',{...envelope,version:0})).rejects.toThrow('envelope');
  expect(await store.pending(now)).toHaveLength(0);
 });
 it('does not repeat a completed durable job on duplicate acceptance',async()=>{
  const first=await transport.accept('domain-events','three',envelope);await start();await transport.dispatchPending();await wait(async()=>effects===1);
  await wait(()=>completed(first.id));const second=await transport.accept('domain-events','three',envelope);
  expect(second.replayed).toBe(true);await transport.dispatchPending();expect(effects).toBe(1);
 });
 it('recovers delivery after Inbox and workflow dispatch commit but before queue completion',async()=>{
  const previous=process.env.D1_RUNTIME_ENABLED;process.env.D1_RUNTIME_ENABLED='true';
  try{
   const gateway=new D1FinancialCommandGateway(bridge as unknown as D1WorkerBridgeService);
   const workflowStore=new LocalWorkflowStore(bridge);
   const coordinator=new LocalWorkflowCoordinator(workflowStore,async()=>({done:true}),()=>now);
   const consumer=new LocalQueueConsumer(new EventOutboxService(gateway),workflowStore,coordinator,()=>now);
   let interrupt=true;
   transport=new DurableQueueTransport(store,{'domain-events':queue},async(event,job)=>{await consumer.execute(event,job);if(interrupt){interrupt=false;throw Error('synthetic interruption after durable dispatch');}},()=>now);
   const approval={...envelope,type:'LOAN_APPROVED',payload:{loanId:'synthetic-loan'}};
   const accepted=await transport.accept('domain-events','loan-approval',approval);await start();await transport.dispatchPending();
   await wait(async()=>(await queue.getFailedCount())===1);
   expect(await workflowStore.event('loan-synthetic-loan','decision')).not.toBeNull();
   now+=2000;await transport.dispatchPending();await wait(()=>completed(accepted.id));
   const rows=(await bridge.select<any>('SELECT messageId,queue,state FROM EventInbox')).results;
   expect(rows).toEqual([{messageId:accepted.id,queue:'domain-events',state:'RECEIVED'}]);
   await coordinator.tick('loan-synthetic-loan');await coordinator.tick('loan-synthetic-loan');
   expect(await workflowStore.get('loan-synthetic-loan')).toMatchObject({status:'COMPLETED'});
   expect(await queue.getFailedCount()).toBe(1);
  }finally{if(previous===undefined)delete process.env.D1_RUNTIME_ENABLED;else process.env.D1_RUNTIME_ENABLED=previous;}
 });

});
