import { Injectable, Optional, ServiceUnavailableException } from "@nestjs/common";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";
import { NexiEventEnvelope } from "./event-envelope";
import { D1WorkerBridgeService } from "../d1/d1-worker-bridge.service";
import { LocalSqliteBridgeService } from "../d1/local-sqlite-bridge.service";
import { LocalDurableJobStore } from "../jobs/local-durable-job.store";

export type QueueIngressReceipt = {
  messageId: string;
  replayed: boolean;
  state: string;
};

export type EventOutboxPublishReceipt = {
  claimed: number;
  published: number;
  retried: number;
  deadLettered: number;
};

@Injectable()
export class EventOutboxService {
  constructor(
    private readonly d1: D1FinancialCommandGateway,
    @Optional() private readonly bridge?: D1WorkerBridgeService,
  ) {}

  async recordQueueIngress(
    queue: string,
    messageId: string,
    attempts: number,
    event: NexiEventEnvelope,
  ): Promise<QueueIngressReceipt> {
    if (!this.d1.isEnabled()) {
      throw new ServiceUnavailableException(
        "D1 event inbox is required when queue ingress is enabled",
      );
    }
    return this.d1.recordEventInbox({
      queue,
      messageId,
      attempts,
      eventType: event.type,
      eventVersion: event.version,
      idempotencyKey: event.idempotencyKey,
      correlationId: event.correlationId,
      payload: event.payload,
    });
  }

  async recordEvent(command: {
    idempotencyKey: string;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    eventVersion?: number;
    correlationId?: string | null;
    payload: Record<string, unknown>;
  }): Promise<{ id: string; replayed: boolean }> {
    if (!this.d1.isEnabled()) {
      throw new ServiceUnavailableException("D1 event outbox is disabled");
    }
    return this.d1.recordEventOutbox(command);
  }

  /** Publish committed outbox rows; this never replays the originating command. */
  async publishPending(limit = 10): Promise<EventOutboxPublishReceipt> {
    if (!this.d1.isEnabled()) {
      throw new ServiceUnavailableException("D1 event outbox is disabled");
    }
    const local = process.env.NEXI_SQLITE_LOCAL_ENABLED === "true" &&
      process.env.NEXI_LOCAL_ASYNC_ENABLED === "true";
    const localBridge = this.bridge instanceof LocalSqliteBridgeService ? this.bridge : null;
    if (local && !localBridge) {
      throw new ServiceUnavailableException("Local durable Outbox publication requires local SQLite");
    }
    const journal = local && localBridge ? new LocalDurableJobStore(localBridge) : null;
    const rows = await this.d1.claimPendingEventOutbox(limit);
    const receipt: EventOutboxPublishReceipt = {
      claimed: rows.length,
      published: 0,
      retried: 0,
      deadLettered: 0,
    };
    const host = process.env.QUEUE_BRIDGE_HOST || "nexi.queue";
    for (const row of rows) {
      try {
        const payload = JSON.parse(row.payload) as Record<string, unknown>;
        const event: NexiEventEnvelope = {
          type: row.eventType,
          version: row.eventVersion,
          idempotencyKey: row.idempotencyKey,
          correlationId: row.correlationId || row.id,
          payload,
        };
        if (journal) {
          // Outbox row ID remains the stable journal identity across retry/restart.
          // A crash between record() and marking published replays the same key.
          await journal.record("domain-events", row.id, event, Date.now());
        } else {
          const response = await fetch(`http://${host}/domain-events`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(event),
          });
          if (!response.ok) throw new Error(`QUEUE_HTTP_${response.status}`);
        }
        if (await this.d1.markEventOutboxPublished(row.id, row.leaseToken)) {
          receipt.published += 1;
        }
      } catch (error) {
        const code =
          error instanceof Error ? error.message : "OUTBOX_PUBLISH_FAILED";
        if (await this.d1.markEventOutboxRetry(row.id, row.leaseToken, code)) {
          if (row.attempts >= 10) receipt.deadLettered += 1;
          else receipt.retried += 1;
        }
      }
    }
    return receipt;
  }
}
