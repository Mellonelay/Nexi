import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
  constructor(private readonly bridge: D1WorkerBridgeService, @Optional() private readonly config: ConfigService = new ConfigService()) {}

  isEnabled(): boolean {
    return this.config.get<string>("D1_RUNTIME_ENABLED") === "true" && this.bridge.isEnabled();
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

  async resolveMessageModeration(input: {
    id: string;
    conversationId: string;
    adminId: string;
    status: "OPEN" | "RESOLVED";
    resolution?: string;
    conversationState?: "ACTIVE" | "RESTRICTED";
    idempotencyKey: string;
  }): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `UPDATE "MessageModerationCase"
          SET "status"=?,"resolution"=COALESCE(?, "resolution"),"reviewedById"=?,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=?`,
        params: [input.status, input.resolution ?? null, input.adminId, input.id],
      },
    ];
    if (input.conversationState) {
      statements.push({
        sql: `UPDATE "MessageConversation"
          SET "state"=?,"updatedAt"=CURRENT_TIMESTAMP
          WHERE "id"=(SELECT "conversationId" FROM "MessageModerationCase" WHERE "id"=?)`,
        params: [input.conversationState, input.id],
      });
    }
    statements.push(
      this.eventOutboxStatement(
        {
          idempotencyKey: `message-moderation:${input.id}:${input.idempotencyKey}`,
          aggregateType: "MESSAGE_MODERATION",
          aggregateId: input.id,
          eventType: "MESSAGE_MODERATION_RESOLVED",
          payload: {
            status: input.status,
            conversationId: input.conversationId,
            reviewedById: input.adminId,
            conversationState: input.conversationState,
          },
        },
        `EXISTS (SELECT 1 FROM "MessageModerationCase" WHERE "id"=?)`,
        [input.id],
      ),
    );
    const result = await this.bridge.batch(statements);
    return Number(result.results[0]?.meta?.changes ?? 0) === 1;
  }

  async sendMessage(input: {
    id: string;
    conversationId: string;
    participantAId: string;
    participantBId: string;
    senderId: string;
    recipientId: string;
    body: string;
    attachments?: unknown;
    idempotencyKey: string;
  }): Promise<boolean> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const result = await this.bridge.batch([
      {
        sql: `INSERT OR IGNORE INTO "MessageConversation" ("id","participantAId","participantBId","state","createdAt","updatedAt") VALUES (?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        params: [input.conversationId, input.participantAId, input.participantBId],
      },
      {
        sql: `INSERT OR IGNORE INTO "PersistentMessage" ("id","conversationId","senderId","recipientId","body","deliveryState","sequence","readAt","attachments","createdAt")
          SELECT ?,?,?,?,?, 'SENT',
            COALESCE((SELECT MAX("sequence") FROM "PersistentMessage" WHERE "conversationId"=?),0)+1,
            NULL,?,CURRENT_TIMESTAMP
          WHERE EXISTS (SELECT 1 FROM "MessageConversation" WHERE "id"=? AND "state"='ACTIVE')`,
        params: [
          input.id,
          input.conversationId,
          input.senderId,
          input.recipientId,
          input.body,
          input.conversationId,
          input.attachments === undefined ? null : JSON.stringify(input.attachments),
          input.conversationId,
        ],
      },
      {
        sql: `UPDATE "MessageConversation" SET "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND EXISTS (SELECT 1 FROM "PersistentMessage" WHERE "id"=?)`,
        params: [input.conversationId, input.id],
      },
      this.eventOutboxStatement(
        {
          idempotencyKey: input.idempotencyKey,
          aggregateType: "PERSISTENT_MESSAGE",
          aggregateId: input.id,
          eventType: "MESSAGE_SENT",
          payload: {
            conversationId: input.conversationId,
            senderId: input.senderId,
            recipientId: input.recipientId,
          },
        },
        `EXISTS (SELECT 1 FROM "PersistentMessage" WHERE "id"=?)`,
        [input.id],
      ),
    ]);
    return Number(result.results[1]?.meta?.changes ?? 0) === 1
      || Number(result.results[3]?.meta?.changes ?? 0) === 1;
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
