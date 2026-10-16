import type { EventOutboxService } from '../events/event-outbox.service';
import type { NexiEventEnvelope } from '../events/event-envelope';
import type { LocalDurableJob } from './local-durable-job.store';
import { LocalWorkflowStore } from './local-workflow.store';
import { LocalWorkflowCoordinator } from './local-workflow.coordinator';

/** Mirrors the deployed Queue handler: existing Inbox first, workflow dispatch
 * even for replayed ingress, durable completion only after dispatch succeeds.
 * Notifications/integration preserve their existing ingress-only behavior.
 */
export class LocalQueueConsumer {
 constructor(private readonly events:EventOutboxService,private readonly store:LocalWorkflowStore,private readonly workflows:LocalWorkflowCoordinator,private readonly clock=Date.now) {}
 async execute(event:NexiEventEnvelope,job:LocalDurableJob):Promise<void>{
  if(!['domain-events','notifications','integration-jobs'].includes(job.queue))throw Error('Unsupported durable queue');
  await this.events.recordQueueIngress(job.queue,job.id,job.attempts,event);
  if(event.type!=='LOAN_APPROVED')return;
  const loanId=event.payload.loanId;
  if(typeof loanId!=='string'||!/^[A-Za-z0-9._:-]{1,160}$/.test(loanId))throw Error('Invalid approved loan identity');
  const id='loan-'+loanId;
  await this.workflows.start('loan',id,loanId);
  const row=await this.store.get(id);if(!row)throw Error('Missing durable loan workflow');
  if(row.status==='COMPLETED')return;
  if(row.status==='FAILED'&&!await this.store.resumeFailed(row,this.clock()))throw Error('Loan restart raced; retry dispatch');
  await this.workflows.signal(id,'decision',event.idempotencyKey,{decision:'APPROVED'});
 }
}
