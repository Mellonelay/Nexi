import { LocalSqliteBridgeService } from '../d1/local-sqlite-bridge.service';
import type { D1BridgeBatchStatement } from '../d1/d1-worker-bridge.service';

export type WorkflowState = {
 id: string; workflow: string; entityId: string; status: string; phase: string;
 nextAt: number; awaitedEvent?: string | null; context: Record<string, unknown>;
};
export type WorkflowRow = WorkflowState & {revision:number; leaseToken:string|null; leaseUntil:number|null};
type RawRow = Omit<WorkflowRow,'context'> & {context:string};
const validTime=(n:number)=>{if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid workflow time');};
const body=(value:unknown)=>{
 const encoded=JSON.stringify(value,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 if(!encoded||Buffer.byteLength(encoded)>1_048_576)throw Error('Invalid workflow content');return encoded;
};
const decode=(row:RawRow|undefined):WorkflowRow|null=>row?{...row,context:JSON.parse(row.context)}:null;
const active="'RUNNING','WAITING','SLEEPING'";

/** Local-only orchestration metadata. Business commands remain in NestJS/Ledger.
 * Every checkpoint/event/step transition uses the existing ordered SQLite batch.
 * Claim tokens must be fresh UUIDs. Domain commands keep their original keys.
 */
export class LocalWorkflowStore {
 constructor(private readonly bridge:LocalSqliteBridgeService) {}
 private validate(input:WorkflowState,now:number):void {
  validTime(now);validTime(input.nextAt);
  if(!/^[A-Za-z0-9._:-]{1,160}$/.test(input.id)||!/^[A-Za-z0-9._:-]{1,160}$/.test(input.entityId)||!['withdrawal','mining','loan'].includes(input.workflow))throw Error('Invalid workflow identity');
  if(!['RUNNING','WAITING','SLEEPING','COMPLETED','FAILED'].includes(input.status)||!input.phase||input.phase.length>160)throw Error('Invalid workflow state');
  if(input.status==='WAITING'&&!input.awaitedEvent)throw Error('Workflow wait requires event type');
 }
 async get(id:string):Promise<WorkflowRow|null>{return decode((await this.bridge.select<RawRow>('SELECT * FROM LocalWorkflowInstance WHERE id = ?',[id])).results[0]);}
 async create(input:WorkflowState,now:number):Promise<{replayed:boolean}> {
  this.validate(input,now);
  const result=await this.bridge.batch([{sql:'INSERT INTO LocalWorkflowInstance (id,workflow,entityId,status,phase,nextAt,awaitedEvent,context,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',params:[input.id,input.workflow,input.entityId,input.status,input.phase,input.nextAt,input.awaitedEvent??null,body(input.context),now,now]}, {sql:'SELECT workflow,entityId FROM LocalWorkflowInstance WHERE id = ?',params:[input.id]}]);
  const existing=result.results[1].results?.[0] as {workflow:string;entityId:string};
  if(!existing||existing.workflow!==input.workflow||existing.entityId!==input.entityId)throw Error('Conflicting workflow identity');
  return {replayed:result.results[0].meta?.changes===0};
 }
 /** Redelivery may resume a failed instance; receipts/events remain intact. */
 async resumeFailed(row:WorkflowRow,now:number):Promise<boolean>{
  validTime(now);validTime(row.revision);
  const context={...row.context,retryCount:0,restartCount:Number(row.context.restartCount??0)+1,...(row.phase==='loan-decision'?{waitDeadline:now+365*86_400_000}:{})};
  const result=await this.bridge.batch([{sql:"UPDATE LocalWorkflowInstance SET status = 'RUNNING',nextAt = ?,context = ?,revision = revision + 1,leaseToken = NULL,leaseUntil = NULL,updatedAt = ? WHERE id = ? AND status = 'FAILED' AND revision = ? RETURNING id",params:[now,body(context),now,row.id,row.revision]}]);
  return result.results[0].results?.length===1;
 }
 async due(now:number):Promise<WorkflowRow[]> {
  validTime(now);return (await this.bridge.select<RawRow>(`SELECT * FROM LocalWorkflowInstance WHERE status IN (${active}) AND nextAt <= ? AND (leaseUntil IS NULL OR leaseUntil <= ?) ORDER BY nextAt,id LIMIT 10`,[now,now])).results.map(r=>decode(r)!);
 }
 async claim(id:string,token:string,now:number):Promise<WorkflowRow|null>{
  validTime(now);if(!token||token.length>128)throw Error('Fresh workflow lease required');
  const result=await this.bridge.batch([{sql:`UPDATE LocalWorkflowInstance SET leaseToken = ?,leaseUntil = ?,updatedAt = ? WHERE id = ? AND status IN (${active}) AND nextAt <= ? AND (leaseUntil IS NULL OR leaseUntil <= ?) RETURNING *`,params:[token,now+60000,now,id,now,now]}]);
  return decode(result.results[0].results?.[0] as RawRow|undefined);
 }
 async signal(id:string,type:string,key:string,payload:unknown,now:number):Promise<{replayed:boolean}>{
  validTime(now);if(!/^[a-zA-Z0-9_][a-zA-Z0-9_-]{0,99}$/.test(type)||!key||key.length>512)throw Error('Invalid workflow event');
  const encoded=body(payload);
  const result=await this.bridge.batch([
   {sql:`INSERT INTO LocalWorkflowEvent (instanceId,eventType,eventKey,payload,receivedAt) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM LocalWorkflowInstance WHERE id = ? AND status IN (${active})) ON CONFLICT(instanceId,eventKey) DO NOTHING`,params:[id,type,key,encoded,now,id]},
   {sql:`SELECT payload,eventType FROM LocalWorkflowEvent WHERE instanceId = ? AND eventKey = ? AND EXISTS (SELECT 1 FROM LocalWorkflowInstance WHERE id = ? AND status IN (${active}))`,params:[id,key,id]},
   {sql:"UPDATE LocalWorkflowInstance SET nextAt = MIN(nextAt,?),updatedAt = ? WHERE id = ? AND status = 'WAITING' AND awaitedEvent = ?",params:[now,now,id,type]},
  ]);
  const row=result.results[1].results?.[0] as {payload:string;eventType:string}|undefined;
  if(!row)throw Error('Workflow is not accepting events');
  if(row.payload!==encoded||row.eventType!==type)throw Error('Conflicting workflow event content');
  return {replayed:result.results[0].meta?.changes===0};
 }
 async event(id:string,type:string):Promise<{eventKey:string;payload:Record<string,unknown>;receivedAt:number}|null>{
  const row=(await this.bridge.select<{eventKey:string;payload:string;receivedAt:number}>('SELECT eventKey,payload,receivedAt FROM LocalWorkflowEvent WHERE instanceId = ? AND eventType = ? AND consumedAt IS NULL ORDER BY receivedAt,eventKey LIMIT 1',[id,type])).results[0];
  return row?{...row,payload:JSON.parse(row.payload)}:null;
 }
 async step(id:string,name:string):Promise<Record<string,unknown>|null>{
  const row=(await this.bridge.select<{result:string}>('SELECT result FROM LocalWorkflowStep WHERE instanceId = ? AND name = ?',[id,name])).results[0];return row?JSON.parse(row.result):null;
 }
 async checkpoint(id:string,token:string,revision:number,state:WorkflowState,now:number,step?:{name:string;commandKey:string;result:unknown},eventKey?:string):Promise<boolean>{
  this.validate(state,now);validTime(revision);if(state.id!==id)throw Error('Conflicting checkpoint identity');
  const batch:D1BridgeBatchStatement[]=[{sql:"UPDATE LocalWorkflowInstance SET status = ?,phase = ?,nextAt = CASE WHEN ? = 'WAITING' AND EXISTS (SELECT 1 FROM LocalWorkflowEvent WHERE instanceId = ? AND eventType = ? AND consumedAt IS NULL) THEN ? ELSE ? END,awaitedEvent = ?,context = ?,revision = revision + 1,leaseToken = NULL,leaseUntil = NULL,updatedAt = ? WHERE id = ? AND revision = ? AND leaseToken = ? AND leaseUntil > ? AND (? IS NULL OR EXISTS (SELECT 1 FROM LocalWorkflowEvent WHERE instanceId = ? AND eventKey = ? AND consumedAt IS NULL)) RETURNING *",params:[state.status,state.phase,state.status,id,state.awaitedEvent??null,now,state.nextAt,state.awaitedEvent??null,body(state.context),now,id,revision,token,now,eventKey??null,id,eventKey??null]}];
  // The bridge fences dependent effects by the first UPDATE RETURNING row count inside one IMMEDIATE transaction; no changes() chain.
  if(eventKey)batch.push({sql:'UPDATE LocalWorkflowEvent SET consumedAt = ? WHERE instanceId = ? AND eventKey = ? AND consumedAt IS NULL',params:[now,id,eventKey]});
  if(step)batch.push({sql:'INSERT INTO LocalWorkflowStep (instanceId,name,commandKey,result,completedAt) VALUES (?,?,?,?,?) ON CONFLICT(instanceId,name) DO NOTHING',params:[id,step.name,step.commandKey,body(step.result),now]});
  const result=await this.bridge.batchGuardedByFirstRow(batch);return result.results[0].results?.length===1;
 }
}
