import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import {
  D1BridgeBatchStatement,
  D1WorkerBridgeService,
} from "./d1-worker-bridge.service";

type NotificationEvent = {
  aggregateType?: string;
  idempotencyKey: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

/** Native D1 command boundary for communication mutations that publish events. */
@Injectable()
export class D1CommunicationsCommandGateway {
  constructor(private readonly bridge: D1WorkerBridgeService) {}

  isEnabled(): boolean {
    return process.env.D1_RUNTIME_ENABLED === "true" && this.bridge.isEnabled();
  }

  async markMessageRead(userId: string, messageId: string): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `UPDATE "PersistentMessage" SET "readAt"=COALESCE("readAt",CURRENT_TIMESTAMP) WHERE "id"=? AND "recipientId"=?`,
        params: [messageId, userId],
      },
      this.eventOutboxStatement(
        {
          idempotencyKey: `message-read:${messageId}`,
          aggregateType: "PERSISTENT_MESSAGE",
          aggregateId: messageId,
          eventType: "MESSAGE_READ",
          payload: { userId, recipientId: userId, messageId },
        },
        `EXISTS (SELECT 1 FROM "PersistentMessage" WHERE "id"=? AND "recipientId"=?)`,
        [messageId, userId],
      ),
    ]);
    return Number(result.results[0]?.meta?.changes ?? 0) === 1;
  }

  async markNotificationRead(
    userId: string,
    notificationId: string,
    event: NotificationEvent,
  ): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `UPDATE "Notification" SET "readAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "userId"=?`,
        params: [notificationId, userId],
      },
      this.eventOutboxStatement(event, `EXISTS (SELECT 1 FROM "Notification" WHERE "id"=? AND "userId"=?)`, [notificationId, userId]),
    ];
    const result = await this.bridge.batch(statements);
    return Number(result.results[0]?.meta?.changes ?? 0) === 1;
  }

  async createNotification(input: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    eventType?: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "Notification" ("id","userId","type","title","body","metadata","createdAt") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
        params: [
          input.id,
          input.userId,
          input.type,
          input.title,
          input.body,
          input.metadata ? JSON.stringify(input.metadata) : null,
        ],
      },
      this.eventOutboxStatement({
        idempotencyKey: input.idempotencyKey,
        aggregateId: input.id,
        eventType: input.eventType ?? "NOTIFICATION_CREATED",
        payload: { userId: input.userId, type: input.type },
      }),
    ]);
  }

  private eventOutboxStatement(
    event: NotificationEvent,
    condition?: string,
    conditionParams: D1BridgeBatchStatement["params"] = [],
  ): D1BridgeBatchStatement {
    const values = `?,?,?,?,?,?,?,?`;
    return {
      sql: condition
        ? `INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") SELECT ${values},'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE ${condition}`
        : `INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") VALUES (${values},'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      params: [
        randomUUID(),
        event.idempotencyKey,
        event.aggregateType ?? "NOTIFICATION",
        event.aggregateId,
        event.eventType,
        1,
        event.idempotencyKey,
        JSON.stringify(event.payload),
        ...conditionParams,
      ],
    };
  }
}
