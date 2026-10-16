import { randomUUID } from 'node:crypto';
import type { Queue } from 'bullmq';
import { isNexiEventEnvelope, type NexiEventEnvelope } from '../events/event-envelope';
import { type LocalDurableJob, LocalDurableJobStore } from './local-durable-job.store';

/** SQLite owns pending/retry/completion state; BullMQ6 Redis is a wake-up transport.
 * Queue job IDs include the durable attempt generation. A lost/completed old
 * transport job cannot suppress a later SQLite recovery dispatch.
 * Consumers MUST preserve original domain idempotency keys for external effects.
 * Sources: https://docs.bullmq.io/guide/queues/ and https://docs.bullmq.io/guide/connections
 * Retry policy matches deployed Worker queue handler (2^min(attempts,7) seconds, cap300).
 */
export class DurableQueueTransport {
  constructor(
    private readonly store: LocalDurableJobStore,
    private readonly queues: Record<string, Queue>,
    private readonly execute: (envelope: NexiEventEnvelope, context: LocalDurableJob) => Promise<void>,
    private readonly clock = Date.now,
  ) {}

  async accept(queue: string, key: string, envelope: unknown): Promise<{id: string; replayed: boolean}> {
    if (!this.queues[queue]) throw new Error('Unconfigured durable queue');
    if (!isNexiEventEnvelope(envelope)) throw new Error('Invalid queue envelope');
    // Successful durable storage is acceptance, even if Valkey is unavailable.
    return this.store.record(queue, key, envelope, this.clock());
  }

  async dispatchPending(): Promise<{dispatched: number; deferred: number}> {
    const receipt = {dispatched:0, deferred:0};
    for (const row of await this.store.pending(this.clock())) {
      try {
        const queue = this.queues[row.queue];
        if (!queue) throw new Error('Unconfigured durable queue');
        await queue.add('durable-event', {journalId:row.id}, {
          jobId: `${row.id}-${row.generation}-${row.generationAttempts}`,
          attempts:1, removeOnComplete:false, removeOnFail:false,
        });
        receipt.dispatched++;
      } catch {
        // Keep the durable row pending. Never lose work because enqueue failed.
        receipt.deferred++;
      }
    }
    return receipt;
  }

  async process(id: string): Promise<void> {
    const token = randomUUID();
    const row = await this.store.claim(id,token,this.clock(),60_000);
    if (!row) return; // Already completed, or another live lease owns this work.
    try {
      const envelope: unknown = JSON.parse(row.envelope);
      if (!isNexiEventEnvelope(envelope)) throw new Error('Invalid queue envelope');
      await this.execute(envelope,row);
      if (!await this.store.complete(row.id,token,this.clock())) throw new Error('Lease expired');
    } catch {
      const now = this.clock();
      await this.store.retry(row.id,token,now,now + Math.min(300_000,1000 * 2 ** Math.min(row.generationAttempts,7)),'JOB_EXECUTION_FAILED');
      // Generic code avoids leaking provider credentials or payloads into Valkey.
      throw new Error('DURABLE_JOB_EXECUTION_FAILED');
    }
  }
}
