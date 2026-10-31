import type { EventOutboxService } from '../events/event-outbox.service';
import type { NexiEventEnvelope } from '../events/event-envelope';
import type { LocalDurableJob } from './local-durable-job.store';
import { LocalWorkflowStore } from './local-workflow.store';
import { LocalWorkflowCoordinator } from './local-workflow.coordinator';

/** Mirrors the deployed Queue handler: existing Inbox first, workflow dispatch
 * even for replayed ingress, durable completion only after dispatch succeeds.
 * Notification/integration queues preserve their existing ingress-only behavior.
 */
const CUSTOMER_EVENT_TYPES = new Set([
 'TRANSFER_COMPLETED', 'DEPOSIT_CREDITED', 'WITHDRAWAL_RESERVED', 'WITHDRAWAL_SETTLED',
 'BINARY_POSITION_OPENED', 'BINARY_POSITION_SETTLED', 'SPOT_ORDER_RESERVED',
 'CONVERSION_ACCEPTED', 'SPOT_TRADE_EXECUTED', 'SPOT_ORDER_CANCELLED',
 'DEPOSIT_CLAIM_SUBMITTED', 'DEPOSIT_CLAIM_CREDITED', 'DEPOSIT_CLAIM_APPROVED',
 'DEPOSIT_CLAIM_REJECTED', 'WITHDRAWAL_REJECTED', 'WITHDRAWAL_FAILED',
 'LOAN_APPLICATION_SUBMITTED', 'LOAN_REJECTED', 'LOAN_OVERDUE', 'KYC_SUBMITTED', 'KYC_DECISION',
 'MARGIN_POSITION_OPENED', 'MARGIN_CLOSED', 'MARGIN_LIQUIDATED',
 'MARGIN_INTEREST_ACCRUED', 'MINING_SUBSCRIPTION_OPENED', 'MINING_REWARD_POSTED',
]);

export class LocalQueueConsumer {
 constructor(private readonly events:EventOutboxService,private readonly store:LocalWorkflowStore,private readonly workflows:LocalWorkflowCoordinator,private readonly clock=Date.now,private readonly notifyCustomerEvent?: (event:NexiEventEnvelope)=>Promise<void>) {}
 async execute(event:NexiEventEnvelope,job:LocalDurableJob):Promise<void>{
  if(!['domain-events','notifications','integration-jobs'].includes(job.queue))throw Error('Unsupported durable queue');
  await this.events.recordQueueIngress(job.queue,job.id,job.attempts,event);
  if(job.queue==='domain-events' && CUSTOMER_EVENT_TYPES.has(event.type)) {
   if(!this.notifyCustomerEvent)throw Error('Customer notification handler is unavailable');
   await this.notifyCustomerEvent(event);
   return;
  }
  if(job.queue!=='domain-events'||event.type!=='LOAN_APPROVED')return;
  const loanId=event.payload.loanId;
  if(typeof loanId!=='string'||!/^[A-Za-z0-9._:-]{1,160}$/.test(loanId))throw Error('Invalid approved loan identity');
  const id='loan-'+loanId;
  await this.workflows.start('loan',id,loanId);
  const row=await this.store.get(id);if(!row)throw Error('Missing durable loan workflow');
  // Old durable LOAN_APPROVED envelopes predate the userId addition. Preserve
  // workflow replay for those records rather than retrying them forever.
  const notifyApproval = async () => {
   if(event.payload.userId===undefined) return;
   if(!this.notifyCustomerEvent)throw Error('Customer notification handler is unavailable');
   await this.notifyCustomerEvent(event);
  };
  if(row.status==='COMPLETED') {
   await notifyApproval();
   return;
  }
  if(row.status==='FAILED'&&!await this.store.resumeFailed(row,this.clock()))throw Error('Loan restart raced; retry dispatch');
  await this.workflows.signal(id,'decision',event.idempotencyKey,{decision:'APPROVED'});
  await notifyApproval();
 }
}
