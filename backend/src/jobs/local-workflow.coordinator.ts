import { randomUUID } from 'node:crypto';
import type { WorkflowCommand } from '../workflows/workflow-commands.service';
import { LocalWorkflowStore, type WorkflowRow, type WorkflowState } from './local-workflow.store';
export class LocalWorkflowFatalError extends Error {}
const WAIT_MS = 365 * 86_400_000;
const timestamp = (value:unknown):number => {
 const time=typeof value==='number'?value:typeof value==='string'?Date.parse(value):NaN;
 if(!Number.isSafeInteger(time)||time<0)throw new LocalWorkflowFatalError('Invalid workflow timestamp');return time;
};
/** Durable orchestration only. All economic commands remain in existing NestJS services. */
export class LocalWorkflowCoordinator {
 constructor(private readonly store:LocalWorkflowStore,private readonly invoke:(input:WorkflowCommand)=>Promise<Record<string,unknown>>,private readonly clock=Date.now) {}
 async start(workflow:string,id:string,entityId:string):Promise<{replayed:boolean}>{
  if(!['loan','withdrawal','mining'].includes(workflow))throw new LocalWorkflowFatalError('Unsupported local workflow');
  const now=this.clock();const loan=workflow==='loan';return this.store.create({id,workflow,entityId,status:loan?'WAITING':'RUNNING',phase:loan?'loan-decision':workflow==='withdrawal'?'withdrawal-prepare':'mining-plan',awaitedEvent:loan?'decision':null,nextAt:loan?now+WAIT_MS:now,context:loan?{waitDeadline:now+WAIT_MS}:workflow==='mining'?{cycle:0}:{}},now);
 }
 async signal(id:string,type:string,key:string,payload:unknown):Promise<{replayed:boolean}>{return this.store.signal(id,type,key,payload,this.clock());}
 private async save(row:WorkflowRow,patch:Partial<WorkflowState>,step?:{name:string;commandKey:string;result:unknown},eventKey?:string):Promise<void>{
  const state={...row,...patch,context:{...row.context,retryCount:0,...patch.context}};
  if(!await this.store.checkpoint(row.id,row.leaseToken!,row.revision,state,this.clock(),step,eventKey))throw Error('Workflow checkpoint lease lost');
 }
 private async command(row:WorkflowRow,name:string,action:string,suffix:string,payload:Record<string,unknown>={}):Promise<{result:Record<string,unknown>;receipt:{name:string;commandKey:string;result:unknown}}>{
  const commandKey=row.id+suffix;
  const result=await this.store.step(row.id,name)??await this.invoke({workflow:row.workflow,instanceId:row.id,action,entityId:row.entityId,idempotencyKey:commandKey,payload});
  return {result,receipt:{name,commandKey,result}};
 }
 async tick(id:string):Promise<boolean>{
  const row=await this.store.claim(id,randomUUID(),this.clock());if(!row)return false;
  try{if(row.workflow==='loan')await this.loan(row);else if(row.workflow==='withdrawal')await this.withdrawal(row);else await this.mining(row);return true;}
  catch(error){
   const retries=Number(row.context.retryCount??0)+1;const terminal=error instanceof LocalWorkflowFatalError||retries>5;
   await this.save(row,{status:terminal?'FAILED':'SLEEPING',nextAt:this.clock()+5000*2**Math.min(retries-1,5),context:{retryCount:retries,lastErrorCode:terminal?'WORKFLOW_FAILED':'WORKFLOW_STEP_RETRY'}});return true;
  }
 }
 private async loan(row:WorkflowRow):Promise<void>{
  if(row.phase==='loan-decision'){
   const event=await this.store.event(row.id,'decision');const deadline=timestamp(row.context.waitDeadline);
   if(!event||event.receivedAt>deadline){if(this.clock()>=deadline)throw new LocalWorkflowFatalError('Approval wait expired');await this.save(row,{status:'WAITING',nextAt:deadline});return;}
   const decision=String(event.payload?.decision??'').toUpperCase();
   if(!['APPROVED','REJECTED'].includes(decision))throw new LocalWorkflowFatalError('Invalid loan decision');
   await this.save(row,{status:decision==='REJECTED'?'COMPLETED':'RUNNING',phase:decision==='REJECTED'?'complete':'loan-schedule',awaitedEvent:null,nextAt:this.clock()},undefined,event.eventKey);return;
  }
  if(row.phase==='loan-schedule'){
   const {result,receipt}=await this.command(row,'loan-load-schedule','schedule',':schedule');
   await this.save(row,{status:result.done===true?'COMPLETED':'SLEEPING',phase:result.done===true?'complete':'loan-check-due',nextAt:result.done===true?this.clock():timestamp(result.dueAt)},receipt);return;
  }
  if(row.phase==='loan-check-due'){
   const {result,receipt}=await this.command(row,'loan-check-due','check-due',':check-due');
   if(result.done!==true)throw Error('Loan reconciliation is not terminal');
   await this.save(row,{status:'COMPLETED',phase:'complete',nextAt:this.clock()},receipt);return;
  }
  throw new LocalWorkflowFatalError('Unknown loan workflow phase');
 }
 private async withdrawal(row:WorkflowRow):Promise<void>{
  if(row.phase==='withdrawal-prepare'){
   const {result,receipt}=await this.command(row,'withdrawal-prepare','prepare',':prepare');const done=result.done===true;
   await this.save(row,{status:done?'COMPLETED':'WAITING',phase:done?'complete':'withdrawal-provider',awaitedEvent:done?null:'provider-result',nextAt:done?this.clock():this.clock()+WAIT_MS,context:{waitDeadline:this.clock()+WAIT_MS}},receipt);return;
  }
  if(row.phase==='withdrawal-provider'){
   const event=await this.store.event(row.id,'provider-result');const deadline=timestamp(row.context.waitDeadline);
   if(!event||event.receivedAt>deadline){if(this.clock()>=deadline)throw new LocalWorkflowFatalError('Provider wait expired');await this.save(row,{status:'WAITING',nextAt:deadline});return;}
   const status=String(event.payload?.status??'').toUpperCase();if(!['SETTLED','FAILED'].includes(status))throw new LocalWorkflowFatalError('Invalid provider status');
   await this.save(row,{status:'RUNNING',phase:status==='SETTLED'?'withdrawal-settle':'withdrawal-fail',nextAt:this.clock(),awaitedEvent:null,context:{provider:event.payload}},undefined,event.eventKey);return;
  }
  if(['withdrawal-settle','withdrawal-fail'].includes(row.phase)){
   const action=row.phase.slice('withdrawal-'.length);
   const {receipt}=await this.command(row,row.phase,action,':'+action,row.context.provider as Record<string,unknown>);
   await this.save(row,{status:'COMPLETED',phase:'complete',nextAt:this.clock()},receipt);return;
  }
  throw new LocalWorkflowFatalError('Unknown withdrawal workflow phase');
 }

 private async mining(row:WorkflowRow):Promise<void>{
  const cycle=Number(row.context.cycle??0);if(!Number.isSafeInteger(cycle)||cycle<0||cycle>=1000)throw new LocalWorkflowFatalError('Mining cycle limit');
  if(row.phase==='mining-plan'){
   const {result,receipt}=await this.command(row,'mining-plan','plan',':plan');const done=result.done===true;
   await this.save(row,{status:done?'COMPLETED':'SLEEPING',phase:done?'complete':'mining-checkpoint',nextAt:done?this.clock():timestamp(result.nextRunAt)},receipt);return;
  }
  if(row.phase==='mining-checkpoint'){
   const {result,receipt}=await this.command(row,`mining-checkpoint-${cycle}`,'accrual-checkpoint',`:checkpoint:${cycle}`);const done=result.done===true;
   if(!done&&(!result.accrualCheckpoint||typeof result.accrualCheckpoint!=='object'))throw new LocalWorkflowFatalError('Missing canonical accrual checkpoint');
   await this.save(row,{status:done?'COMPLETED':'RUNNING',phase:done?'complete':'mining-accrue',nextAt:this.clock(),context:{accrualCheckpoint:result.accrualCheckpoint??null}},receipt);return;
  }
  if(row.phase==='mining-accrue'){
   const {result,receipt}=await this.command(row,`mining-accrue-${cycle}`,'accrue',`:accrue:${cycle}`,{accrualCheckpoint:row.context.accrualCheckpoint});
   const done=result.done===true;const exhausted=!done&&cycle+1>=1000;
   await this.save(row,{status:done?'COMPLETED':exhausted?'FAILED':'SLEEPING',phase:done?'complete':exhausted?'cycle-limit':'mining-checkpoint',nextAt:done||exhausted?this.clock():timestamp(result.nextRunAt),context:{cycle:cycle+1,accrualCheckpoint:null}},receipt);return;
  }
  throw new LocalWorkflowFatalError('Unknown mining workflow phase');
 }

}
