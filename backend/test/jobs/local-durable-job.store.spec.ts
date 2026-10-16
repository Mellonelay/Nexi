import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';
import { LocalDurableJobStore } from '../../src/jobs/local-durable-job.store';

describe('SQLite durable transport journal', () => {
  let dir: string; let filename: string; let bridge: LocalSqliteBridgeService; let store: LocalDurableJobStore;
  const event = {type:'LOAN_APPROVED',version:1,idempotencyKey:'test-key',correlationId:'test-correlation',payload:{loanId:'synthetic-loan'}};
  const open = () => new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));
  beforeEach(() => {
    dir=mkdtempSync(join(tmpdir(),'nexi-job-journal-')); filename=join(dir,'fixture.sqlite');
    const db=new Database(filename);
    db.exec(readFileSync(new URL('../../src/jobs/local-durable-job.schema.sql',import.meta.url),'utf8'));db.close();
    bridge=open();store=new LocalDurableJobStore(bridge);
  });
  afterEach(() => {bridge?.onModuleDestroy();rmSync(dir,{recursive:true,force:true});});
  it('records idempotently and rejects changed content for the same logical job',async()=>{
    const a=await store.record('domain-events','key-1',event,100);
    const b=await store.record('domain-events','key-1',{...event,payload:{loanId:'synthetic-loan'}},101);
    expect(a.replayed).toBe(false);expect(b.replayed).toBe(true);expect(b.id).toBe(a.id);
    await expect(store.record('domain-events','key-1',{...event,version:2},102)).rejects.toThrow('content');
    expect(await store.pending(102)).toHaveLength(1);
  });
  it('retains undispatched work across SQLite reconnect and transport loss',async()=>{
    const a=await store.record('notifications','notify-1',event,100);
    bridge.onModuleDestroy();bridge=open();store=new LocalDurableJobStore(bridge);
    expect((await store.pending(101)).map(x=>x.id)).toEqual([a.id]);
  });
  it('claims once across two connections and fences a stale completion after lease expiry',async()=>{
    const a=await store.record('domain-events','key-2',event,100);const otherBridge=open();
    try {const other=new LocalDurableJobStore(otherBridge);
      expect(await store.claim(a.id,'lease-a',100,1000)).toMatchObject({attempts:1});
      expect(await other.claim(a.id,'lease-b',101,1000)).toBeNull();
      expect(await store.pending(1099)).toHaveLength(0);
      expect(await other.claim(a.id,'lease-b',1100,1000)).toMatchObject({attempts:2});
      expect(await store.complete(a.id,'lease-a',1101)).toBe(false);
      expect(await other.complete(a.id,'lease-b',1101)).toBe(true);
      expect(await store.pending(3000)).toHaveLength(0);
    }finally{otherBridge.onModuleDestroy();}
  });
  it('persists retry due times and retains terminal failures for inspection',async()=>{
    const a=await store.record('integration-jobs','job-1',event,100);
    await store.claim(a.id,'lease-a',100,1000);
    expect(await store.retry(a.id,'lease-a',101,1000,'PROVIDER_UNAVAILABLE',2)).toBe(true);
    expect(await store.pending(999)).toHaveLength(0);
    expect(await store.pending(1000)).toHaveLength(1);
    await store.claim(a.id,'lease-b',1000,1000);
    await store.retry(a.id,'lease-b',1001,2000,'PROVIDER_UNAVAILABLE',2);
    expect(await store.pending(3000)).toHaveLength(0);
    const row=(await bridge.select<any>('SELECT state,attempts,lastError FROM LocalDurableJob WHERE id = ?',[a.id])).results[0];
    expect(row).toEqual({state:'FAILED',attempts:2,lastError:'PROVIDER_UNAVAILABLE'});
  });
  it('lists terminal failures without payload and replays them as a new generation',async()=>{
    const accepted=await store.record('integration-jobs','replay-key',event,100);
    await store.claim(accepted.id,'lease-a',100,1000);
    await store.retry(accepted.id,'lease-a',101,200,'PROVIDER_UNAVAILABLE',1);
    const failed=await store.failed(10);
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatchObject({id:accepted.id,queue:'integration-jobs',state:'FAILED',generation:0,attempts:1,generationAttempts:1,lastError:'PROVIDER_UNAVAILABLE'});
    expect(failed[0]).not.toHaveProperty('envelope');

    const replay=await store.replayFailed(accepted.id,0,300);
    expect(replay).toMatchObject({id:accepted.id,queue:'integration-jobs',generation:1,attempts:1,generationAttempts:0,availableAt:300});
    expect(await store.replayFailed(accepted.id,0,301)).toBeNull();
    expect(await store.failed(10)).toHaveLength(0);
    expect(await store.replayHistory(accepted.id)).toEqual([
      {generation:0,attempts:1,generationAttempts:1,lastError:'PROVIDER_UNAVAILABLE',replayedAt:300},
    ]);
    expect(await store.pending(300)).toMatchObject([{id:accepted.id,generation:1,generationAttempts:0}]);
  });
  it('separates queue identity and rejects unbounded inputs',async()=>{
    const a=await store.record('domain-events','same',event,100);
    const b=await store.record('notifications','same',event,100);expect(a.id).not.toBe(b.id);
    await expect(store.record('unknown','same',event,100)).rejects.toThrow();
    await expect(store.pending(100,1001)).rejects.toThrow();
  });
});
