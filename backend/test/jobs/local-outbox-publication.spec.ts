import { jest } from '@jest/globals';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';
import { D1WorkerBridgeService } from '../../src/d1/d1-worker-bridge.service';
import { LocalSqliteBridgeService } from '../../src/d1/local-sqlite-bridge.service';
import { EventOutboxService } from '../../src/events/event-outbox.service';
import { EventOutboxScheduler } from '../../src/events/event-outbox.scheduler';

describe('local Outbox publication through the durable SQLite journal', () => {
  const keys = ['NEXI_LOCAL_ASYNC_ENABLED','NEXI_SQLITE_LOCAL_ENABLED','NEXI_SCHEDULER_ENABLED'] as const;
  const previous = Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  let directory: string;
  let bridge: LocalSqliteBridgeService;
  let gateway: any;
  const row = {
    id:'outbox-vps-1', eventType:'LOAN_APPROVED', eventVersion:1,
    idempotencyKey:'approved:vps:1', correlationId:'vps:1',
    payload:JSON.stringify({loanId:'loan-vps-1'}), leaseToken:'lease-vps-1',attempts:1,
  };
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(),'nexi-outbox-vps-'));
    const filename = join(directory,'fixture.sqlite');
    const db = new Database(filename);
    db.exec(readFileSync(new URL('../../src/jobs/local-durable-job.schema.sql',import.meta.url),'utf8'));
    db.close();
    bridge = new LocalSqliteBridgeService(new ConfigService({NEXI_LOCAL_SQLITE_PATH:filename}));
    process.env.NEXI_LOCAL_ASYNC_ENABLED='true';
    process.env.NEXI_SQLITE_LOCAL_ENABLED='true';
    process.env.NEXI_SCHEDULER_ENABLED='true';
    gateway = {
      isEnabled:()=>true,
      claimPendingEventOutbox:jest.fn().mockResolvedValue([row]),
      markEventOutboxPublished:jest.fn().mockResolvedValue(true),
      markEventOutboxRetry:jest.fn().mockResolvedValue(true),
    };
  });
  afterEach(() => {
    bridge.onModuleDestroy();
    rmSync(directory,{recursive:true,force:true});
    for(const k of keys) {if(previous[k]===undefined) delete process.env[k];else process.env[k]=previous[k];}
    jest.restoreAllMocks();
  });
  it('publishes committed Outbox to SQLite without contacting Cloudflare and keeps stable replay',async()=>{
    const fetchSpy=jest.spyOn(global,'fetch').mockRejectedValue(new Error('should never call Cloudflare'));
    const service=new EventOutboxService(gateway,bridge as unknown as D1WorkerBridgeService);
    const first=await service.publishPending(1);
    expect(first).toEqual({claimed:1,published:1,retried:0,deadLettered:0});
    await service.publishPending(1);
    expect((await bridge.select<any>('SELECT queue,logicalKey,state FROM LocalDurableJob')).results)
      .toEqual([{queue:'domain-events',logicalKey:'outbox-vps-1',state:'PENDING'}]);
    expect(fetchSpy).not.toHaveBeenCalled();
    const scheduler=new EventOutboxScheduler(service);
    await expect(scheduler.publishPending()).resolves.toMatchObject({published:1});
  });
  it('fails closed when local publishing is enabled but the local SQLite bridge is absent',async()=>{
    const service=new EventOutboxService(gateway);
    await expect(service.publishPending(1)).rejects.toThrow('local SQLite');
    expect(gateway.claimPendingEventOutbox).not.toHaveBeenCalled();
  });
});
