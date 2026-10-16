import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';
import { LocalDurableJobStore } from '../../src/jobs/local-durable-job.store';
import { LocalAsyncRuntimeService } from '../../src/jobs/local-async-runtime.service';
import type { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import type { EventOutboxService } from '../../src/events/event-outbox.service';
import type { WorkflowCommandsService } from '../../src/workflows/workflow-commands.service';

const socket = process.env.NEXI_TEST_VALKEY_SOCKET;
if (!socket) throw Error('Explicit NEXI_TEST_VALKEY_SOCKET required for runtime acceptance');
describe('local VPS async Nest runtime transport acceptance', () => {
  it('dispatches a persisted SQLite event to the real private Valkey worker and durably completes it', async () => {
    const dir=mkdtempSync(join(tmpdir(),'nexi-async-runtime-'));
    const filename=join(dir,'local.sqlite');
    const db=new Database(filename);
    db.exec(readFileSync(new URL('../../src/jobs/local-durable-job.schema.sql',import.meta.url),'utf8'));
    db.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql',import.meta.url),'utf8'));
    db.exec('CREATE TABLE EventInbox(messageId TEXT PRIMARY KEY)');
    db.close();
    const bridge=new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));
    const seen:string[]=[];
    const outbox={recordQueueIngress:async(_queue:string,_id:string,_attempts:number,event:{type:string})=>{seen.push(event.type);return {replayed:false};}} as unknown as EventOutboxService;
    const config=new ConfigService({
      NEXI_SQLITE_LOCAL_ENABLED:'true',
      NEXI_LOCAL_ASYNC_ENABLED:'true',
      NEXI_VALKEY_SOCKET:socket,
      NEXI_LOCAL_ASYNC_PREFIX:'nexi-accept-'+randomUUID().replaceAll('-',''),
    });
    const runtime=new LocalAsyncRuntimeService(config,bridge as unknown as D1WorkerBridgeService,outbox,{} as WorkflowCommandsService);
    try {
      const journal=new LocalDurableJobStore(bridge);
      const accepted=await journal.record('notifications',randomUUID(),{
        type:'TEST_SYNTHETIC',version:1,idempotencyKey:'test-event',correlationId:'synthetic-test',payload:{}
      },Date.now());
      await runtime.onModuleInit();
      const limit=Date.now()+12000;
      let state='';
      do {
        const result=(await bridge.select<{state:string}>('SELECT state FROM LocalDurableJob WHERE id = ?',[accepted.id])).results[0];
        state=result?.state??'';
        if(state==='COMPLETED')break;
        await new Promise(r=>setTimeout(r,100));
      }while(Date.now()<limit);
      expect(state).toBe('COMPLETED');
      expect(seen).toEqual(['TEST_SYNTHETIC']);
    }finally{
      await runtime.onModuleDestroy();
      bridge.onModuleDestroy();
      rmSync(dir,{recursive:true,force:true});
    }
  },18000);

  it('refuses startup when the replay-history schema is missing', async () => {
    const dir=mkdtempSync(join(tmpdir(),'nexi-async-schema-'));
    const filename=join(dir,'local.sqlite');
    const db=new Database(filename);
    db.exec(readFileSync(new URL('../../src/jobs/local-durable-job.schema.sql',import.meta.url),'utf8'));
    db.exec(readFileSync(new URL('../../src/jobs/local-workflow.schema.sql',import.meta.url),'utf8'));
    db.exec('CREATE TABLE EventInbox(messageId TEXT PRIMARY KEY)');
    db.exec('DROP TABLE LocalDurableJobReplayHistory');
    db.close();
    const bridge=new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));
    const config=new ConfigService({
      NEXI_SQLITE_LOCAL_ENABLED:'true',NEXI_LOCAL_ASYNC_ENABLED:'true',NEXI_VALKEY_SOCKET:socket,
      NEXI_LOCAL_ASYNC_PREFIX:'nexi-schema-'+randomUUID().replaceAll('-',''),
    });
    const runtime=new LocalAsyncRuntimeService(config,bridge as unknown as D1WorkerBridgeService,{} as EventOutboxService,{} as WorkflowCommandsService);
    try {
      await expect(runtime.onModuleInit()).rejects.toThrow('Local async schema is not ready');
    } finally {
      await runtime.onModuleDestroy();bridge.onModuleDestroy();rmSync(dir,{recursive:true,force:true});
    }
  },18000);
});
