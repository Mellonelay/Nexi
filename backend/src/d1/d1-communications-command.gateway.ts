import { ConflictException, Injectable, Optional } from "@nestjs/common";
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
    return this.bridge.isEnabled();
  }

  async ensureConversation(input: {
    id: string;
    participantAId: string;
    participantBId: string;
  }): Promise<void> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    await this.bridge.batch([{
      sql: `INSERT OR IGNORE INTO "MessageConversation" ("id","participantAId","participantBId","state","createdAt","updatedAt") VALUES (?,?,?,'ACTIVE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      params: [input.id, input.participantAId, input.participantBId],
    }]);
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
        sql: `UPDATE "Notification" SET "readAt"=COALESCE("readAt",CURRENT_TIMESTAMP) WHERE "id"=? AND "userId"=?`,
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
    adminId?: string;
    reason?: string;
  }): Promise<void> {
    if (!this.isEnabled()) throw new Error("D1 runtime is disabled");
    const metadata = input.metadata ? JSON.stringify(input.metadata) : null;
    const eventType = input.eventType ?? "NOTIFICATION_CREATED";
    const eventPayload = JSON.stringify({ userId: input.userId, type: input.type });
    const originalOutbox = this.eventOutboxStatement({
      idempotencyKey: input.idempotencyKey,
      aggregateId: input.id,
      eventType,
      payload: { userId: input.userId, type: input.type },
    });
    const auditDetails = input.adminId ? JSON.stringify({
      reason: input.reason?.trim() ?? "", idempotencyKey: input.idempotencyKey,
      userId: input.userId, type: input.type,
    }) : null;
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: 'INSERT OR IGNORE INTO "Notification" ("id","userId","type","title","body","metadata","createdAt") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)',
        params: [input.id, input.userId, input.type, input.title, input.body, metadata],
      },
      originalOutbox,
    ];
    if (input.adminId) {
      statements.push({
        sql: 'INSERT OR IGNORE INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,\'ADMIN_NOTIFICATION_SENT\',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "Notification" WHERE "id"=?)',
        params: [input.id, input.adminId, input.id, auditDetails, input.id],
      });
    }
    statements.push({
        // Both materialized notification and canonical outbox must match the
        // original key. Fail in the transaction, not after committing an event.
        sql: 'INSERT INTO "Notification" ("id","userId","type","title","body") SELECT ?,NULL,NULL,NULL,NULL WHERE NOT EXISTS (SELECT 1 FROM "Notification" WHERE "id"=? AND "userId"=? AND "type"=? AND "title"=? AND "body"=? AND COALESCE("metadata",\'\')=COALESCE(?,\'\')) OR NOT EXISTS (SELECT 1 FROM "EventOutbox" WHERE "idempotencyKey"=? AND "aggregateType"=\'NOTIFICATION\' AND "aggregateId"=? AND "eventType"=? AND "payload"=?)' +
          (input.adminId ? ' OR NOT EXISTS (SELECT 1 FROM "AdminAuditLog" WHERE "id"=? AND "adminId"=? AND "action"=\'ADMIN_NOTIFICATION_SENT\' AND "target"=? AND "details"=?)' : ''),
        params: ["notification-intent-guard:" + randomUUID(),
          input.id, input.userId, input.type, input.title, input.body, metadata,
          input.idempotencyKey, input.id, eventType, eventPayload,
          ...(input.adminId ? [input.id, input.adminId, input.id, auditDetails] : [])],
      });
    try {
      await this.bridge.batch(statements);
    } catch (error) {
      if (error instanceof Error &&
          /NOT NULL constraint failed: Notification\.(userId|type|title|body)/i.test(error.message)) {
        throw new ConflictException("Notification idempotency key belongs to another request");
      }
      throw error;
    }
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
    const eventKey = "message-moderation:" + input.id + ":" + input.idempotencyKey;
    const eventId = randomUUID();
    const payload = JSON.stringify({
      status: input.status,
      conversationId: input.conversationId,
      reviewedById: input.adminId,
      conversationState: input.conversationState ?? null,
      resolution: input.resolution ?? null,
    });
    // Insert the original event before any mutation. Only this new event ID
    // authorizes updates; identical retries never reapply an older command.
    const original = 'EXISTS (SELECT 1 FROM "EventOutbox" WHERE "id"=? AND "idempotencyKey"=?)';
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: 'INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") SELECT ?,?,\'MESSAGE_MODERATION\',?,\'MESSAGE_MODERATION_RESOLVED\',1,?,?,\'PENDING\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "MessageModerationCase" WHERE "id"=? AND "conversationId"=?)',
        params: [eventId, eventKey, input.id, eventKey, payload, input.id, input.conversationId],
      },
      {
        sql: 'UPDATE "MessageModerationCase" SET "status"=?,"resolution"=COALESCE(?, "resolution"),"reviewedById"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND "conversationId"=? AND ' + original,
        params: [input.status, input.resolution ?? null, input.adminId, input.id,
          input.conversationId, eventId, eventKey],
      },
    ];
    if (input.conversationState) {
      statements.push({
        sql: 'UPDATE "MessageConversation" SET "state"=?,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=? AND ' + original,
        params: [input.conversationState, input.conversationId, eventId, eventKey],
      });
    }
    // A conflicting key must abort inside BEGIN IMMEDIATE, rolling back all
    // preceding statements. MessageModerationCase.conversationId is NOT NULL.
    statements.push({
      sql: 'INSERT INTO "MessageModerationCase" ("id","conversationId","reporterId","reason") SELECT ?,NULL,NULL,NULL WHERE NOT EXISTS (SELECT 1 FROM "EventOutbox" WHERE "idempotencyKey"=? AND "aggregateType"=\'MESSAGE_MODERATION\' AND "aggregateId"=? AND "eventType"=\'MESSAGE_MODERATION_RESOLVED\' AND "payload"=?)',
      params: ["moderation-intent-guard:" + eventId, eventKey, input.id, payload],
    });
    try {
      await this.bridge.batch(statements);
    } catch (error) {
      if (error instanceof Error &&
          /NOT NULL constraint failed: MessageModerationCase\.(conversationId|reporterId|reason)/i.test(error.message)) {
        throw new ConflictException("Moderation key belongs to a different original request");
      }
      throw error;
    }
    return true;
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

  /** One SQLite BEGIN IMMEDIATE transaction owns original intent and outbox. */
  async mutateAnnouncementAtomic(input: {
    id: string; key: string; intentHash: string; mode: "create" | "update";
    values: Record<string, string | number | null>;
    published?: boolean;
  }): Promise<void> {
    if (!this.isEnabled()) throw new Error("SQLite communications gateway disabled");
    const eventKey = input.mode === "create" ? "announcement:" + input.id
      : "announcement:" + input.id + ":" + input.key;
    const eventId = randomUUID();
    const eventType = "ANNOUNCEMENT_CREATED";
    const payload = JSON.stringify({ published: input.published, intentHash: input.intentHash });
    const columns = Object.keys(input.values);
    const permittedColumns = new Set([
      "title", "body", "targeting", "localizations", "published", "pinned",
      "pinOrder", "startsAt", "endsAt",
    ]);
    if (columns.some((column) => !permittedColumns.has(column))) {
      throw new Error("ANNOUNCEMENT_COLUMN_NOT_ALLOWED");
    }
    const insertPrefix =
      'INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") ';
    // Evaluate publication transitions against the SQLite row locked by the same
    // BEGIN IMMEDIATE transaction, not a potentially stale Prisma pre-read.
    const desiredPublished = input.values.published ?? null;
    const event: D1BridgeBatchStatement = input.mode === "create" ? {
      sql: insertPrefix +
        'SELECT ?,?,\'ANNOUNCEMENT\',?,?,1,?,?,\'PENDING\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE changes()=1',
      params: [eventId, eventKey, input.id, eventType, eventKey, payload],
    } : {
      sql: insertPrefix +
        'SELECT ?,?,\'ANNOUNCEMENT\',?,' +
        'CASE WHEN ? IS NOT NULL AND "published"=0 AND ?=1 THEN \'ANNOUNCEMENT_PUBLISHED\' ' +
        'WHEN ? IS NOT NULL AND "published"=1 AND ?=0 THEN \'ANNOUNCEMENT_UNPUBLISHED\' ' +
        'ELSE \'ANNOUNCEMENT_UPDATED\' END,1,?,' +
        'json_object(\'published\',json(CASE WHEN COALESCE(?,"published")<>0 THEN \'true\' ELSE \'false\' END),\'intentHash\',?),\'PENDING\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP ' +
        'FROM "Announcement" WHERE "id"=?',
      params: [
        eventId, eventKey, input.id, desiredPublished, desiredPublished,
        desiredPublished, desiredPublished, eventKey, desiredPublished,
        input.intentHash, input.id,
      ],
    };
    const statements: D1BridgeBatchStatement[] = [];
    if (input.mode === "create") {
      statements.push({
        sql: 'INSERT OR IGNORE INTO "Announcement" ("id",' +
          columns.map(c => '"' + c + '"').join(",") +
          ',"createdAt","updatedAt") VALUES (?,' +
          columns.map(() => "?").join(",") + ',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)',
        params: [input.id, ...columns.map(c => input.values[c])],
      }, event);
    } else {
      statements.push(event, {
        sql: 'UPDATE "Announcement" SET ' +
          columns.map(c => '"' + c + '"=?').concat(['"updatedAt"=CURRENT_TIMESTAMP']).join(",") +
          ' WHERE "id"=? AND EXISTS (SELECT 1 FROM "EventOutbox" WHERE "id"=? AND "idempotencyKey"=? AND "payload"=?)',
        params: [...columns.map(c => input.values[c]), input.id, eventId, eventKey, payload],
      });
    }
    // A mismatched original request or missing update target triggers a NOT NULL
    // constraint *inside* the batch; SQLite rolls back both tables atomically.
    statements.push({
      sql: 'INSERT INTO "Announcement" ("id","title","body") SELECT ?,NULL,NULL WHERE NOT EXISTS ' +
        '(SELECT 1 FROM "EventOutbox" WHERE "idempotencyKey"=? AND "aggregateType"=\'ANNOUNCEMENT\' ' +
        'AND "aggregateId"=? AND json_valid("payload") AND json_extract("payload",\'$.intentHash\')=?' +
        (input.mode === "create" ? ' AND "eventType"=\'ANNOUNCEMENT_CREATED\'' : '') + ')',
      params: ['announcement-intent-guard:' + eventId, eventKey, input.id, input.intentHash],
    });
    try {
      await this.bridge.batch(statements);
    } catch (error) {
      if (error instanceof Error && /NOT NULL constraint failed: Announcement\.(title|body)/i.test(error.message)) {
        throw new ConflictException("Announcement original request intent does not match");
      }
      throw error;
    }
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
