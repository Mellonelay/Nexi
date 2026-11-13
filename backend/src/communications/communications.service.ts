import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Role, Prisma } from "../prisma/d1-client";
import { createHash, randomUUID } from "crypto";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { RedisService } from "../redis/redis.service";
import { EventOutboxService } from "../events/event-outbox.service";
import { D1CommunicationsCommandGateway } from "../d1/d1-communications-command.gateway";
import type { D1BridgeBatchStatement } from "../d1/d1-worker-bridge.service";
import { SUPPORT_ATTACHMENT_MAX_COUNT, SupportAttachmentStorageService, type SupportAttachment, type SupportUpload } from "./support-attachment-storage.service";

export const NEXI_SUPPORT_CHANNEL_ID = "support:nexi";

type ResolveMessageModerationInput = {
  status: "OPEN" | "RESOLVED";
  resolution?: string;
  conversationState?: "ACTIVE" | "RESTRICTED";
  idempotencyKey: string;
};

type LearnArticleUpdateData = {
  reason?: string;
  idempotencyKey?: string;
  title?: string;
  body?: string;
  summary?: string;
  localizations?: unknown;
  status?: string;
  attachments?: unknown;
  categoryId?: string;
  scheduledAt?: string;
  tags?: string[];
  media?: Array<{ url: string; altText?: string; provider?: string; metadata?: unknown }>;
};

type LearnArticleCreateData = Omit<
  LearnArticleUpdateData,
  "title" | "body"
> & {
  slug: string;
  title: string;
  body: string;
};

type LearnArticleUpdateContext = {
  id: string;
  data: LearnArticleUpdateData;
  next: any;
  now: string;
};

function parseSupportAttachments(value: unknown): SupportAttachment[] {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return []; }
  }
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SupportAttachment =>
    !!item && typeof item === "object" &&
    typeof item.id === "string" && typeof item.name === "string" &&
    typeof item.mimeType === "string" && Number.isSafeInteger(item.size) && item.size >= 0,
  );
}

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly d1: D1PrismaService,
    private readonly outbox: EventOutboxService,
    private readonly d1Communications: D1CommunicationsCommandGateway,
    private readonly redis: RedisService,
    @Optional() private readonly supportAttachments?: SupportAttachmentStorageService,
  ) {}

  private get attachmentStorage(): SupportAttachmentStorageService {
    if (!this.supportAttachments) throw new ServiceUnavailableException("Support attachment storage provider is unavailable");
    return this.supportAttachments;
  }

  private get database(): any {
    return this.d1;
  }

  private id(prefix: string, key: string): string {
    const h = createHash("sha256")
      .update(`${prefix}:${key}`)
      .digest("hex")
      .slice(0, 32);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${h.slice(18, 20)}-${h.slice(20)}`;
  }

  private async durableEvent(
    idempotencyKey: string,
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.outbox.recordEvent({
      idempotencyKey,
      aggregateType,
      aggregateId,
      eventType,
      correlationId: idempotencyKey,
      payload,
    });
  }

  async publishRealtimeEvent(
    type: string,
    referenceId: string,
    payload: Record<string, unknown>,
  ) {
    if (!this.redis.isAvailable()) return;
    await this.redis.publish(
      "nexi:b8:communications",
      JSON.stringify({
        type,
        referenceId,
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );
  }

  async createTicket(
    userId: string,
    subject: string,
    body: string,
    key: string,
  ) {
    const ticketId = this.id(`ticket:${userId}`, key);
    const createdAt = new Date().toISOString();
    const replyId = this.id(`reply:${ticketId}:${userId}`, key);
    await this.d1.atomicBatch([
      {
        sql: `INSERT INTO "SupportTicket" ("id", "userId", "subject", "status", "priority", "createdAt", "updatedAt") VALUES (?, ?, ?, 'OPEN', 'NORMAL', ?, ?) ON CONFLICT("id") DO NOTHING`,
        params: [ticketId, userId, subject, createdAt, createdAt],
      },
      {
        sql: `INSERT INTO "SupportTicketReply" ("id", "ticketId", "authorId", "body", "internal", "createdAt") VALUES (?, ?, ?, ?, 0, ?) ON CONFLICT("id") DO NOTHING`,
        params: [replyId, ticketId, userId, body, createdAt],
      },
    ]);
    const ticket = await this.database.supportTicket.findUnique({
      where: { id: ticketId },
      include: { replies: true },
    });
    if (!ticket) throw new BadRequestException("Support ticket was not materialized");
    await this.publishRealtimeEvent("SUPPORT_TICKET_OPENED", ticket.id, { userId });
    await this.durableEvent(
      "support-ticket:" + ticket.id + ":" + key,
      "SUPPORT_TICKET",
      ticket.id,
      "SUPPORT_TICKET_OPENED",
      { userId },
    );
    return ticket;
  }

  async listTickets(userId: string, page = 1, limit = 25) {
    const skip = (page - 1) * limit;
    return this.database.supportTicket.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: {
        replies: {
          where: { internal: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async reply(
    userId: string,
    ticketId: string,
    body: string,
    key: string,
    internal = false,
    attachments?: unknown,
    role?: Role,
  ) {
    const ticket = await this.database.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException("Support ticket not found");
    if (ticket.userId !== userId && role !== Role.ADMIN)
      throw new ForbiddenException("Ticket ownership required");
    const replyId = this.id(`reply:${ticketId}:${userId}`, key);
    const reply = await this.database.supportTicketReply.upsert({
      where: { id: replyId },
      update: {},
      create: {
        id: replyId,
        ticketId,
        authorId: userId,
        body,
        internal: role === Role.ADMIN ? internal : false,
        attachments: attachments as Prisma.InputJsonValue | undefined,
      },
    });
    await this.database.supportTicket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        status: role === Role.ADMIN ? "PENDING_USER" : "OPEN",
      },
    });
    await this.publishRealtimeEvent("SUPPORT_TICKET_REPLIED", ticketId, {
      replyId,
      userId: ticket.userId,
    });
    await this.durableEvent(
      "support-reply:" + replyId,
      "SUPPORT_TICKET",
      ticketId,
      "SUPPORT_TICKET_REPLIED",
      { replyId, userId },
    );
    return reply;
  }

  async assign(ticketId: string, assignedToId: string) {
    const ticket = await this.database.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException("Support ticket not found");
    const updated = await this.database.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId, updatedAt: new Date() },
    });
    await this.publishRealtimeEvent("SUPPORT_TICKET_ASSIGNED", ticketId, {
      userId: ticket.userId,
      assignedToId,
    });
    await this.durableEvent(
      "support-assign:" + ticketId + ":" + assignedToId,
      "SUPPORT_TICKET",
      ticketId,
      "SUPPORT_TICKET_ASSIGNED",
      { assignedToId },
    );
    return updated;
  }

  private conversationIdentity(userA: string, userB: string) {
    const [participantAId, participantBId] = [userA, userB].sort();
    return {
      participantAId,
      participantBId,
      conversationId: `conversation:${participantAId}:${participantBId}`,
    };
  }

  private supportConversationIdentity(userId: string) {
    return this.conversationIdentity(userId, NEXI_SUPPORT_CHANNEL_ID);
  }

  private async supportConversation(userId: string, create: boolean) {
    const identity = this.supportConversationIdentity(userId);
    if (create) {
      if (this.d1Communications.isEnabled()) await this.d1Communications.ensureConversation({
        id: identity.conversationId,
        participantAId: identity.participantAId,
        participantBId: identity.participantBId,
      });
      else await this.database.messageConversation.upsert({
        where: { participantAId_participantBId: {
          participantAId: identity.participantAId,
          participantBId: identity.participantBId,
        } },
        update: {},
        create: identity,
      });
    }
    const conversation = await this.database.messageConversation.findUnique({ where: { id: identity.conversationId } });
    if (!conversation || conversation.id !== identity.conversationId ||
      conversation.participantAId !== identity.participantAId ||
      conversation.participantBId !== identity.participantBId || conversation.state !== "ACTIVE") {
      throw new ForbiddenException("Support conversation is restricted");
    }
    return identity;
  }

  private async supportAttachmentReferences(conversationId: string): Promise<Set<string>> {
    const rows = await this.database.persistentMessage.findMany({
      where: { conversationId }, select: { attachments: true },
    });
    return new Set(rows.flatMap((row: { attachments?: unknown }) => parseSupportAttachments(row.attachments).map((item) => item.id)));
  }

  private async assertSupportAttachmentLinked(conversationId: string, id: string): Promise<void> {
    const rows = await this.database.persistentMessage.findMany({
      where: { conversationId, attachments: { contains: id } }, select: { attachments: true },
    });
    if (!rows.some((row: { attachments?: unknown }) => parseSupportAttachments(row.attachments).some((item) => item.id === id))) {
      throw new NotFoundException("Attachment not found");
    }
  }

  async supportThread(userId: string, page = 1, limit = 100) {
    const identity = this.supportConversationIdentity(userId);
    const conversation = await this.database.messageConversation.findUnique({
      where: { id: identity.conversationId },
    });
    if (!conversation) return { conversationId: identity.conversationId, page, limit, messages: [] };
    if (
      conversation.participantAId !== identity.participantAId ||
      conversation.participantBId !== identity.participantBId ||
      conversation.state !== "ACTIVE"
    ) throw new ForbiddenException("Support conversation is restricted");
    const messages = await this.database.persistentMessage.findMany({
      where: { conversationId: identity.conversationId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ sequence: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });
    return { conversationId: identity.conversationId, page, limit, messages: messages.map((message) => this.supportMessageResponse(message)) };
  }

  private supportMessageResponse<T extends { attachments?: unknown }>(message: T) {
    return { ...message, attachments: parseSupportAttachments(message.attachments) };
  }

  async uploadSupportAttachment(userId: string, file?: SupportUpload): Promise<SupportAttachment> {
    const identity = await this.supportConversation(userId, true);
    const referenced = await this.supportAttachmentReferences(identity.conversationId);
    await this.attachmentStorage.cleanupExpired(userId, referenced);
    return this.attachmentStorage.upload(userId, file, referenced);
  }

  async getSupportAttachment(userId: string, id: string) {
    const identity = await this.supportConversation(userId, false);
    await this.assertSupportAttachmentLinked(identity.conversationId, id);
    return this.attachmentStorage.read(userId, id);
  }

  async uploadAdminSupportAttachment(userId: string, file?: SupportUpload): Promise<SupportAttachment> {
    const recipient = await this.database.user.findFirst({ where: { id: userId, role: Role.USER }, select: { id: true } });
    if (!recipient) throw new NotFoundException("Client not found");
    const identity = await this.supportConversation(userId, false);
    const referenced = await this.supportAttachmentReferences(identity.conversationId);
    await this.attachmentStorage.cleanupExpired(userId, referenced);
    return this.attachmentStorage.upload(userId, file, referenced);
  }

  async getAdminSupportAttachment(userId: string, id: string) {
    const recipient = await this.database.user.findFirst({ where: { id: userId, role: Role.USER }, select: { id: true } });
    if (!recipient) throw new NotFoundException("Client not found");
    const identity = await this.supportConversation(userId, false);
    await this.assertSupportAttachmentLinked(identity.conversationId, id);
    return this.attachmentStorage.read(userId, id);
  }

  async getSupportMessageByIntent(userId: string, idempotencyKey: string) {
    if (typeof idempotencyKey !== 'string' || !idempotencyKey.trim() || idempotencyKey.length > 128) {
      throw new BadRequestException('Support message idempotency key is invalid');
    }
    const identity = this.supportConversationIdentity(userId);
    const id = this.id(`message:${userId}:${NEXI_SUPPORT_CHANNEL_ID}`, idempotencyKey);
    const row = await this.database.persistentMessage.findUnique({ where: { id } });
    if (!row) return null;
    if (row.conversationId !== identity.conversationId || row.senderId !== userId || row.recipientId !== NEXI_SUPPORT_CHANNEL_ID) {
      throw new ForbiddenException('Support message ownership mismatch');
    }
    return this.supportMessageResponse(row);
  }

  async sendSupportMessage(userId: string, body: string, idempotencyKey: string, attachmentIds: string[] = []) {
    const messageBody = body.trim();
    if (!messageBody && !attachmentIds.length) throw new BadRequestException("Message body or attachment is required");
    if (attachmentIds.length > SUPPORT_ATTACHMENT_MAX_COUNT || new Set(attachmentIds).size !== attachmentIds.length) {
      throw new BadRequestException(`A message may include up to ${SUPPORT_ATTACHMENT_MAX_COUNT} unique attachments`);
    }
    const messageId = this.id(`message:${userId}:${NEXI_SUPPORT_CHANNEL_ID}`, idempotencyKey);
    const existing = await this.database.persistentMessage.findUnique({ where: { id: messageId } });
    if (existing) {
      const activeIdentity = await this.supportConversation(userId, false);
      const attachments = parseSupportAttachments(existing.attachments);
      const attachmentIdsMatch = attachments.length === attachmentIds.length &&
        attachments.every((attachment, index) => attachment.id === attachmentIds[index]) &&
        (existing.attachments == null || attachments.length > 0 || attachmentIds.length === 0);
      if (existing.conversationId !== activeIdentity.conversationId || existing.senderId !== userId ||
        existing.recipientId !== NEXI_SUPPORT_CHANNEL_ID || existing.body !== messageBody || !attachmentIdsMatch) {
        throw new ConflictException("Message idempotency key was already used with a different payload");
      }
      return this.supportMessageResponse(existing);
    }
    const attachments = attachmentIds.length
      ? await this.attachmentStorage.resolve(userId, attachmentIds)
      : [];
    await this.supportConversation(userId, true);
    const message = await this.sendMessage(userId, NEXI_SUPPORT_CHANNEL_ID, messageBody, idempotencyKey, attachments.length ? attachments : undefined);
    return this.supportMessageResponse(message);
  }

  async sendMessage(
    senderId: string,
    recipientId: string,
    body: string,
    key: string,
    attachments?: unknown,
  ) {
    const messageId = this.id(`message:${senderId}:${recipientId}`, key);
    const identity = this.conversationIdentity(senderId, recipientId);
    const serializedAttachments = attachments === undefined ? null : JSON.stringify(attachments);
    const expected = { conversationId: identity.conversationId, senderId, recipientId, body, attachments: serializedAttachments };
    if (this.d1Communications.isEnabled()) {
      await this.d1Communications.sendMessage({
        id: messageId,
        ...identity,
        senderId,
        recipientId,
        body,
        attachments,
        idempotencyKey: `message:${messageId}`,
      });
    } else await this.persistPrismaMessage(messageId, expected, identity);
    const message = await this.database.persistentMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new ForbiddenException("Conversation is restricted");
    this.assertMessageMatches(message, expected);
    await this.publishRealtimeEvent("MESSAGE_SENT", message.id, {
      conversationId: identity.conversationId,
      senderId,
      recipientId,
      sequence: message.sequence,
    });
    return message;
  }

  private async persistPrismaMessage(
    messageId: string,
    expected: { conversationId: string; senderId: string; recipientId: string; body: string; attachments: string | null },
    identity: { conversationId: string; participantAId: string; participantBId: string },
  ) {
    await this.database.$transaction(async (tx: any) => {
      const conversation = await tx.messageConversation.upsert({
        where: { participantAId_participantBId: { participantAId: identity.participantAId, participantBId: identity.participantBId } },
        update: { updatedAt: new Date() },
        create: { id: identity.conversationId, participantAId: identity.participantAId, participantBId: identity.participantBId },
      });
      if (conversation.state !== "ACTIVE") throw new ForbiddenException("Conversation is restricted");
      const last = await tx.persistentMessage.findFirst({
        where: { conversationId: identity.conversationId }, orderBy: { sequence: "desc" }, select: { sequence: true },
      });
      const message = await tx.persistentMessage.upsert({
        where: { id: messageId }, update: {},
        create: { id: messageId, ...expected, sequence: (last?.sequence ?? 0) + 1 },
      });
      this.assertMessageMatches(message, expected);
      await tx.eventOutbox.upsert({
        where: { idempotencyKey: `message:${messageId}` }, update: {},
        create: {
          id: this.id("event-outbox", `message:${messageId}`), idempotencyKey: `message:${messageId}`,
          aggregateType: "PERSISTENT_MESSAGE", aggregateId: messageId, eventType: "MESSAGE_SENT", eventVersion: 1,
          correlationId: `message:${messageId}`,
          payload: JSON.stringify({ conversationId: identity.conversationId, senderId: expected.senderId, recipientId: expected.recipientId }),
        },
      });
    });
  }

  private assertMessageMatches(
    message: { conversationId?: string | null; senderId: string; recipientId: string; body: string; attachments?: unknown },
    expected: { conversationId: string; senderId: string; recipientId: string; body: string; attachments: string | null },
  ) {
    if (message.conversationId !== expected.conversationId || message.senderId !== expected.senderId ||
      message.recipientId !== expected.recipientId || message.body !== expected.body || message.attachments !== expected.attachments) {
      throw new ConflictException("Message idempotency key was already used with a different payload");
    }
  }

  async markMessageRead(userId: string, messageId: string) {
    const updated = await this.d1Communications.markMessageRead(userId, messageId);
    if (!updated) throw new NotFoundException("Message not found");
    const message = await this.d1.persistentMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException("Message not found");
    await this.publishRealtimeEvent("MESSAGE_READ", messageId, {
      userId,
      senderId: message.senderId,
      recipientId: message.recipientId,
    });
    return message;
  }

  async listMessages(userId: string, page = 1, limit = 25) {
    const skip = (page - 1) * limit;
    return this.database.persistentMessage.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      skip,
      take: limit,
      orderBy: [{ createdAt: "desc" }, { sequence: "desc" }],
    });
  }

  async listConversations(userId: string, page = 1, limit = 25) {
    const conversations = await this.database.messageConversation.findMany({
      where: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: [{ sequence: "asc" }, { createdAt: "asc" }] },
      },
    });
    return conversations.map((conversation) => {
      const counterpartId =
        conversation.participantAId === userId
          ? conversation.participantBId
          : conversation.participantAId;
      const unread = conversation.messages.some(
        (message) => message.recipientId === userId && !message.readAt,
      );
      const last = conversation.messages[conversation.messages.length - 1];
      return {
        id: conversation.id,
        counterpartId,
        state: conversation.state,
        readState: unread ? "UNREAD" : "READ",
        deliveryState: last?.deliveryState ?? "SENT",
        updatedAt: conversation.updatedAt,
        messages: conversation.messages,
      };
    });
  }

  async reportConversation(
    userId: string,
    conversationId: string,
    reason: string,
    messageId?: string,
  ) {
    const conversation = await this.database.messageConversation.findUnique({
      where: { id: conversationId },
    });
    if (
      !conversation ||
      (conversation.participantAId !== userId &&
        conversation.participantBId !== userId)
    ) {
      throw new NotFoundException("Conversation not found");
    }
    if (messageId) {
      const message = await this.database.persistentMessage.findFirst({
        where: { id: messageId, conversationId },
      });
      if (!message) throw new NotFoundException("Message not found");
    }
    const reportedUserId =
      conversation.participantAId === userId
        ? conversation.participantBId
        : conversation.participantAId;
    const moderationCase = await this.database.messageModerationCase.create({
      data: {
        conversationId,
        messageId,
        reporterId: userId,
        reportedUserId,
        reason,
      },
    });
    await this.durableEvent(
      `message-moderation:${moderationCase.id}`,
      "MESSAGE_MODERATION",
      moderationCase.id,
      "MESSAGE_MODERATION_REPORTED",
      { conversationId, messageId, reporterId: userId, reportedUserId },
    );
    return moderationCase;
  }

  async adminMessageModeration(page = 1, limit = 100) {
    return this.database.messageModerationCase.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { conversation: { select: { state: true } } },
    });
  }

  async resolveMessageModeration(
    id: string,
    adminId: string,
    input: ResolveMessageModerationInput,
  ) {
    const current = await this.database.messageModerationCase.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException("Moderation case not found");
    const updated = this.d1Communications.isEnabled()
      ? await this.resolveMessageModerationWithD1(id, current.conversationId, adminId, input)
      : await this.resolveMessageModerationWithTransaction(id, current.conversationId, adminId, input);
    await this.publishRealtimeEvent("MESSAGE_MODERATION_UPDATED", id, {
      conversationId: current.conversationId,
      status: updated.status,
      conversationState: input.conversationState,
    });
    return updated;
  }

  private async resolveMessageModerationWithD1(
    id: string,
    conversationId: string,
    adminId: string,
    input: ResolveMessageModerationInput,
  ) {
    const changed = await this.d1Communications.resolveMessageModeration({
      id,
      conversationId,
      adminId,
      status: input.status,
      resolution: input.resolution,
      conversationState: input.conversationState,
      idempotencyKey: input.idempotencyKey,
    });
    if (!changed) throw new NotFoundException("Moderation case not found");
    const updated = await this.database.messageModerationCase.findUnique({ where: { id } });
    if (!updated)
      throw new BadRequestException("Moderation case was not materialized");
    return updated;
  }

  private async resolveMessageModerationWithTransaction(
    id: string,
    conversationId: string,
    adminId: string,
    input: ResolveMessageModerationInput,
  ) {
    const updated = await this.database.$transaction(async (tx) => {
      await (input.conversationState
        ? tx.messageConversation.update({
            where: { id: conversationId },
            data: { state: input.conversationState },
          })
        : Promise.resolve());
      return tx.messageModerationCase.update({
        where: { id },
        data: {
          status: input.status,
          resolution: input.resolution,
          reviewedById: adminId,
        },
      });
    });
    await this.durableEvent(
      `message-moderation:${id}:${input.idempotencyKey}`,
      "MESSAGE_MODERATION",
      id,
      "MESSAGE_MODERATION_RESOLVED",
      {
        status: updated.status,
        conversationId,
        conversationState: input.conversationState,
        reviewedById: adminId,
      },
    );
    return updated;
  }

  async adminMessages(page = 1, limit = 100) {
    const rows = await this.database.persistentMessage.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { conversation: { select: { participantAId: true, participantBId: true } } },
    });
    return rows.map((message: any) => {
      const conversation = message.conversation;
      const supportCustomerId = conversation?.participantAId === NEXI_SUPPORT_CHANNEL_ID
        ? conversation.participantBId
        : conversation?.participantBId === NEXI_SUPPORT_CHANNEL_ID
          ? conversation.participantAId
          : message.recipientId === NEXI_SUPPORT_CHANNEL_ID
            ? message.senderId
            : message.senderId === NEXI_SUPPORT_CHANNEL_ID
              ? message.recipientId
              : undefined;
      return {
        ...message,
        conversationId: message.conversationId ?? (supportCustomerId
          ? this.supportConversationIdentity(supportCustomerId).conversationId
          : message.conversationId),
        supportCustomerId,
      };
    });
  }

  async sendAdminMessage(
    adminId: string,
    input: { recipientId: string; body?: string; reason: string; idempotencyKey: string; conversationId?: string; attachmentIds?: string[] },
  ) {
    const reason = input.reason.trim();
    const body = input.body?.trim() ?? "";
    if (!reason) throw new BadRequestException("An audit reason is required");
    if (input.recipientId === adminId) throw new BadRequestException("An admin cannot message their own account");
    const recipient = await this.database.user.findFirst({
      where: { id: input.recipientId, role: Role.USER },
      select: { id: true },
    });
    if (!recipient) throw new NotFoundException("Client not found");
    const { senderId, attachments } = await this.resolveAdminMessageRoute(adminId, input);
    if (!body && !attachments?.length) throw new BadRequestException("Message body or attachment is required");
    const message = await this.sendMessage(
      senderId,
      input.recipientId,
      body,
      input.idempotencyKey,
      attachments,
    );
    if (
      message.senderId !== senderId || message.recipientId !== input.recipientId || message.body !== body
    ) {
      throw new BadRequestException("Message idempotency key was already used");
    }
    const messageId = this.id(`message:${senderId}:${input.recipientId}`, input.idempotencyKey);
    const details = JSON.stringify({ messageId, reason, idempotencyKey: input.idempotencyKey });
    const audit = await this.database.adminAuditLog.upsert({
      where: { id: this.id(`admin-message-audit:${adminId}:${input.recipientId}`, input.idempotencyKey) },
      update: {},
      create: {
        id: this.id(`admin-message-audit:${adminId}:${input.recipientId}`, input.idempotencyKey),
        adminId,
        action: "ADMIN_MESSAGE_SENT",
        target: input.recipientId,
        details,
      },
    });
    if (audit.details !== details) {
      throw new BadRequestException("Message idempotency key was already used");
    }
    return { ...message, auditId: audit.id };
  }

  private async resolveAdminMessageRoute(adminId: string, input: { recipientId: string; conversationId?: string; attachmentIds?: string[] }) {
    if (!input.conversationId) {
      if (input.attachmentIds?.length) throw new BadRequestException("Attachments are available only in support conversations");
      return { senderId: adminId, attachments: undefined };
    }
    const identity = this.supportConversationIdentity(input.recipientId);
    if (input.conversationId !== identity.conversationId) throw new ForbiddenException("Admin reply does not match the customer's support conversation");
    const conversation = await this.database.messageConversation.findUnique({ where: { id: identity.conversationId } });
    if (!conversation || conversation.state !== "ACTIVE") throw new NotFoundException("Support conversation not found");
    const attachments = input.attachmentIds?.length
      ? await this.attachmentStorage.resolve(input.recipientId, input.attachmentIds)
      : [];
    return { senderId: NEXI_SUPPORT_CHANNEL_ID, attachments: attachments.length ? attachments : undefined };
  }

  async markAdminMessageRead(adminId: string, messageId: string) {
    const message = await this.database.persistentMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException("Message not found");
    if (message.recipientId === NEXI_SUPPORT_CHANNEL_ID && message.conversationId) {
      const conversation = await this.database.messageConversation.findUnique({ where: { id: message.conversationId } });
      const isSupport = conversation?.participantAId === NEXI_SUPPORT_CHANNEL_ID || conversation?.participantBId === NEXI_SUPPORT_CHANNEL_ID;
      if (isSupport) return this.markMessageRead(NEXI_SUPPORT_CHANNEL_ID, messageId);
    }
    if (message.recipientId === adminId) return this.markMessageRead(adminId, messageId);
    throw new NotFoundException("Message not found");
  }

  async adminNotifications(page = 1, limit = 100) {
    return this.database.notification.findMany({
      skip: (page - 1) * limit, take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  private async createAndPublishNotification(data: { userId: string; type: string; title: string; body: string; idempotencyKey: string; reason?: string }, source: "admin" | "system", adminId?: string) {
    if (adminId && !data.reason?.trim())
      throw new BadRequestException("Admin notification requires an audit reason");
    const notificationKey = source === "system" ? `notification:system:${this.id("source-event", data.idempotencyKey)}` : data.idempotencyKey;
    const id = this.id(`${source}-notification`, notificationKey);
    let notification: any;
    await this.d1Communications.createNotification({
        id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        idempotencyKey: notificationKey,
        eventType: "NOTIFICATION_SENT",
        ...(adminId ? { adminId, reason: data.reason } : {}),
    });
    notification = await this.database.notification.findUnique({ where: { id } });
    if (!notification) throw new BadRequestException("Notification was not materialized");
    // INSERT OR IGNORE is safe for identical retries, but must never turn a
    // reused idempotency key into a successful notification for another user.
    if (notification.userId !== data.userId || notification.type !== data.type ||
        notification.title !== data.title || notification.body !== data.body) {
      throw new BadRequestException("Notification idempotency key was already used");
    }
    await this.publishRealtimeEvent("NOTIFICATION_SENT", id, { userId: data.userId, type: data.type });
    return adminId ? { ...notification, auditId: id } : notification;
  }

  async sendAdminNotification(data: { userId: string; type: string; title: string; body: string; idempotencyKey: string; reason?: string }, adminId?: string) {
    return this.createAndPublishNotification(data, "admin", adminId);
  }

  async sendSystemNotification(data: { userId: string; type: string; title: string; body: string; idempotencyKey: string }) {
    // The persisted Public settings apply only to optional event categories.
    // Security and account-critical notices remain visible regardless of opt-outs.
    const type = data.type.toUpperCase();
    const preferenceKey = type === "MARGIN_LIQUIDATED" ? null
      : /^(SPOT|BINARY|MARGIN)/.test(type) ? "tradeEvents"
      : /^(TRANSFER|DEPOSIT|WITHDRAWAL|CONVERSION|MINING)/.test(type) ? "walletEvents"
      : null;
    if (preferenceKey) {
      const row = await this.database.userPreference.findUnique({
        where: { userId: data.userId },
        select: { notificationSettings: true },
      });
      if (row?.notificationSettings) {
        let settings: Record<string, unknown> | null = null;
        try { settings = JSON.parse(row.notificationSettings) as Record<string, unknown>; }
        catch { /* Malformed optional preferences cannot poison durable financial event delivery. */ }
        if (settings?.[preferenceKey] === false) return null;
      }
    }
    return this.createAndPublishNotification(data, "system");
  }

  async snapshot(userId: string) {
    const [messages, notifications] = await Promise.all([
      this.listMessages(userId, 1, 25),
      this.listNotifications(userId, 1, 25),
    ]);
    return {
      messages,
      notifications,
      capturedAt: new Date().toISOString(),
    };
  }

  async unreadNotificationCount(userId: string): Promise<{ count: number }> {
    return { count: await this.database.notification.count({ where: { userId, readAt: null } }) };
  }

  async listNotifications(userId: string, page = 1, limit = 25) {
    return this.database.notification.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }
  async markNotificationRead(userId: string, id: string) {
    const changed = await this.d1Communications.markNotificationRead(userId, id, {
        idempotencyKey: "notification-read:" + id + ":" + userId,
        aggregateId: id,
        eventType: "NOTIFICATION_READ",
        payload: { userId },
    });
    if (!changed) throw new NotFoundException("Notification not found");
    const notification = await this.database.notification.findUnique({
      where: { id },
    });
    await this.publishRealtimeEvent("NOTIFICATION_READ", id, { userId });
    return notification;
  }

  private contentLocalizations(value: unknown): Record<string, Record<string, unknown>> {
    if (!value) return {};
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    }
    return typeof value === "object"
      ? (value as Record<string, Record<string, unknown>>)
      : {};
  }

  private localizedContent<T extends Record<string, any>>(
    record: T,
    locale?: string,
  ): T & { localizations: Record<string, Record<string, unknown>> } {
    const localizations = this.contentLocalizations(record.localizations);
    const normalized = locale?.toLowerCase().split("-")[0];
    const localized = normalized ? localizations[normalized] : undefined;
    return {
      ...record,
      ...(localized ?? {}),
      localizations,
    };
  }

  async announcements(locale?: string) {
    const rows = await this.database.announcement.findMany({
      where: {
        published: true,
        OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }],
      },
      orderBy: [
        { pinned: "desc" },
        { pinOrder: "asc" },
        { createdAt: "desc" },
      ],
    });
    return rows.map((row) => this.localizedContent(row, locale));
  }
  async createAnnouncement(data: {
    title: string;
    body: string;
    targeting?: unknown;
    localizations?: unknown;
    published?: boolean;
    pinned?: boolean;
    pinOrder?: number;
    startsAt?: string;
    endsAt?: string;
    reason?: string;
    idempotencyKey?: string;
  }) {
    const key = data.idempotencyKey ?? randomUUID();
    const id = this.id("announcement", key);
    const values: Record<string, string | number | null> = {
      title: data.title,
      body: data.body,
      targeting: data.targeting === undefined ? null : JSON.stringify(data.targeting),
      localizations: data.localizations === undefined ? null : JSON.stringify(data.localizations),
      published: data.published ? 1 : 0,
      pinned: data.pinned ? 1 : 0,
      pinOrder: data.pinOrder ?? 0,
      startsAt: data.startsAt ? new Date(data.startsAt).getTime() : null,
      endsAt: data.endsAt ? new Date(data.endsAt).getTime() : null,
    };
    const intentHash = createHash("sha256")
      .update(JSON.stringify({ values, reason: data.reason ?? null })).digest("hex");
    await this.d1Communications.mutateAnnouncementAtomic({
      id, key, intentHash, mode: "create", values, published: Boolean(data.published),
    });
    const announcement = await this.database.announcement.findUnique({ where: { id } });
    if (!announcement) throw new ServiceUnavailableException("Announcement creation not materialized");
    return announcement;
  }

  async updateAnnouncement(
    id: string,
    data: {
      title?: string;
      body?: string;
      targeting?: unknown;
      localizations?: unknown;
      published?: boolean;
      pinned?: boolean;
      pinOrder?: number;
      startsAt?: string;
      endsAt?: string;
      reason?: string;
      idempotencyKey: string;
    },
  ) {
    const current = await this.database.announcement.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Announcement not found");
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.body !== undefined) update.body = data.body;
    if (data.targeting !== undefined) update.targeting = data.targeting as Prisma.InputJsonValue;
    if (data.localizations !== undefined)
      update.localizations = JSON.stringify(data.localizations);
    if (data.published !== undefined) update.published = data.published;
    if (data.pinned !== undefined) update.pinned = data.pinned;
    if (data.pinOrder !== undefined) update.pinOrder = data.pinOrder;
    if (data.startsAt !== undefined) update.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) update.endsAt = data.endsAt ? new Date(data.endsAt) : null;
    const values: Record<string, string | number | null> = {};
    for (const [field, value] of Object.entries(update)) {
      values[field] = value instanceof Date ? value.getTime() :
        value === null ? null : typeof value === "boolean" ? Number(value) :
        typeof value === "number" || typeof value === "string" ? value :
        JSON.stringify(value);
    }
    const intentHash = createHash("sha256")
      .update(JSON.stringify({ id, values, reason: data.reason ?? null })).digest("hex");
    // The gateway derives the event type and resulting publication state
    // from the row held by SQLite's BEGIN IMMEDIATE transaction.
    await this.d1Communications.mutateAnnouncementAtomic({
      id, key: data.idempotencyKey, intentHash, mode: "update", values,
    });
    const announcement = await this.database.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException("Announcement not found");
    return announcement;
  }

  async publishAnnouncement(id: string, idempotencyKey: string) {
    return this.updateAnnouncement(id, { published: true, idempotencyKey });
  }
  private readonly learnStatuses = new Set([
    "DRAFT",
    "SCHEDULED",
    "PUBLISHED",
    "ARCHIVED",
  ]);

  private learnStatus(status?: string): string {
    const value = status ?? "DRAFT";
    if (!this.learnStatuses.has(value))
      throw new BadRequestException(
        "Learn status must be DRAFT, SCHEDULED, PUBLISHED, or ARCHIVED",
      );
    return value;
  }

  private learnDate(value?: string | Date): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException("Learn date is invalid");
    return date;
  }

  private learnInclude() {
    return {
      category: true,
      tags: { include: { tag: true } },
      media: true,
      revisions: { orderBy: { revision: "desc" as const } },
    };
  }

  async learn(locale?: string) {
    const articles = await this.database.learnArticle.findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
      orderBy: { publishedAt: "desc" },
      include: {
        category: true,
        tags: { include: { tag: true } },
        media: true,
      },
    });
    return articles.map((article) => this.localizedContent(article, locale));
  }

  async learnDetail(slug: string, locale?: string) {
    const article = await this.database.learnArticle.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        archivedAt: null,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
      },
      include: this.learnInclude(),
    });
    if (!article) throw new NotFoundException("Learn article not found");
    return this.localizedContent(article, locale);
  }

  async listLearnCategories() {
    return this.database.learnCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async adminLearnCategories() {
    return this.database.learnCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async adminLearnArticles() {
    const articles = await this.database.learnArticle.findMany({
      orderBy: { updatedAt: "desc" },
      include: this.learnInclude(),
    });
    return articles.map((article) => this.localizedContent(article));
  }

  async createLearnCategory(adminId: string, data: {
    slug: string;
    name: string;
    description?: string;
    sortOrder?: number;
    status?: string;
    reason: string;
    idempotencyKey: string;
  }) {
    const status = data.status ?? "ACTIVE";
    if (!["ACTIVE", "INACTIVE"].includes(status))
      throw new BadRequestException("Learn category status is invalid");
    if (!data.reason.trim() || !data.idempotencyKey)
      throw new BadRequestException("Category creation requires audit reason and idempotency key");
    const id = this.id("learn-category", data.idempotencyKey);
    const auditId = this.id("learn-category-audit:" + adminId, data.idempotencyKey);
    const eventKey = "learn-category:" + id;
    const description = data.description ?? null;
    const sortOrder = data.sortOrder ?? 0;
    const intentHash = createHash("sha256").update(JSON.stringify({
      slug: data.slug, name: data.name, description, sortOrder,
      status, reason: data.reason.trim(), adminId,
    })).digest("hex");
    const details = JSON.stringify({
      reason: data.reason.trim(), idempotencyKey: data.idempotencyKey,
      slug: data.slug, name: data.name, description, sortOrder, status,
    });
    const payload = JSON.stringify({ slug: data.slug, status, intentHash });
    // The deterministic original intent, category and durable notification are
    // committed by the existing single SQLite writer. An incompatible retry
    // fails while the transaction is open.
    try {
      await this.d1.atomicBatch([
        {
          sql: 'INSERT OR IGNORE INTO "LearnCategory" ("id","slug","name","description","sortOrder","status","createdAt","updatedAt") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)',
          params: [id, data.slug, data.name, description, sortOrder, status],
        },
        {
          sql: 'INSERT OR IGNORE INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") SELECT ?,?,\'LEARN_CATEGORY_CREATED\',?,?,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LearnCategory" WHERE "id"=?)',
          params: [auditId, adminId, id, details, id],
        },
        {
          sql: 'INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") SELECT ?,?,\'LEARN_CATEGORY\',?,\'LEARN_CATEGORY_CREATED\',1,?,?,\'PENDING\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LearnCategory" WHERE "id"=? AND "slug"=? AND "name"=? AND COALESCE("description",\'\')=COALESCE(?,\'\') AND "sortOrder"=? AND "status"=?)',
          params: [this.id("learn-category-outbox", id), eventKey, id, eventKey,
            payload, id, data.slug, data.name, description, sortOrder, status],
        },
        {
          sql: 'INSERT INTO "LearnCategory" ("id","slug","name") SELECT ?,NULL,NULL WHERE NOT EXISTS (SELECT 1 FROM "EventOutbox" WHERE "idempotencyKey"=? AND "aggregateType"=\'LEARN_CATEGORY\' AND "aggregateId"=? AND "eventType"=\'LEARN_CATEGORY_CREATED\' AND json_valid("payload") AND json_extract("payload",\'$.intentHash\')=?) OR NOT EXISTS (SELECT 1 FROM "AdminAuditLog" WHERE "id"=? AND "adminId"=? AND "action"=\'LEARN_CATEGORY_CREATED\' AND "target"=? AND "details"=?)',
          params: ["learn-category-intent-guard:" + randomUUID(), eventKey, id,
            intentHash, auditId, adminId, id, details],
        },
      ]);
    } catch (error) {
      if (error instanceof Error && /NOT NULL constraint failed: LearnCategory\.(slug|name)/i.test(error.message))
        throw new ConflictException("Learn category key or slug belongs to another request");
      throw error;
    }
    const category = await this.database.learnCategory.findUnique({ where: { id } });
    if (!category) throw new ServiceUnavailableException("Learn category creation not materialized");
    return { ...category, auditId };
  }

  async updateLearnCategoryStatus(
    id: string,
    adminId: string,
    input: { expectedStatus: "ACTIVE" | "INACTIVE"; status: "ACTIVE" | "INACTIVE"; reason: string; idempotencyKey: string },
  ) {
    const reason = input.reason.trim();
    if (!reason) throw new BadRequestException("An audit reason is required");
    if (!["ACTIVE", "INACTIVE"].includes(input.status))
      throw new BadRequestException("Learn category status is invalid");
    const auditId = this.id(`learn-category-status:${id}:${adminId}`, input.idempotencyKey);
    const details = JSON.stringify({ reason, idempotencyKey: input.idempotencyKey, expectedStatus: input.expectedStatus, status: input.status });
    const updated = await this.database.$transaction(async (tx: any) => {
      const category = await this.updateLearnCategoryStatusTransaction(tx, {
        id, adminId, auditId, details,
        expectedStatus: input.expectedStatus,
        status: input.status,
      });
      if (category) {
        await tx.eventOutbox.upsert({
          where: { idempotencyKey: `learn-category-status:${id}:${input.idempotencyKey}` },
          update: {},
          create: {
            idempotencyKey: `learn-category-status:${id}:${input.idempotencyKey}`,
            aggregateType: "LEARN_CATEGORY",
            aggregateId: id,
            eventType: "LEARN_CATEGORY_STATUS_UPDATED",
            correlationId: `learn-category-status:${id}:${input.idempotencyKey}`,
            payload: JSON.stringify({ status: category.status, adminId, auditId }),
          },
        });
      }
      return category;
    });
    if (!updated) throw new NotFoundException("Learn category not found");
    return { ...updated, auditId };
  }

  private async updateLearnCategoryStatusTransaction(
    tx: any,
    input: { id: string; adminId: string; auditId: string; details: string; expectedStatus: "ACTIVE" | "INACTIVE"; status: "ACTIVE" | "INACTIVE" },
  ) {
    const previous = await this.previousLearnCategoryStatusRequest(tx, input);
    if (previous) return previous;

    const current = await tx.learnCategory.findUnique({ where: { id: input.id } });
    if (!current) throw new NotFoundException("Learn category not found");
    if (current.status !== input.expectedStatus)
      throw new ConflictException("Learn category changed; refresh and retry");

    const changed = await tx.learnCategory.updateMany({
      where: { id: input.id, status: input.expectedStatus },
      data: { status: input.status },
    });
    if (changed.count !== 1)
      throw new ConflictException("Learn category changed; refresh and retry");

    await this.recordLearnCategoryStatusAudit(tx, input);
    return tx.learnCategory.findUnique({ where: { id: input.id } });
  }

  private async previousLearnCategoryStatusRequest(
    tx: any,
    input: { id: string; auditId: string; details: string },
  ) {
    const priorAudit = await tx.adminAuditLog.findUnique({ where: { id: input.auditId } });
    if (!priorAudit) return null;
    if (priorAudit.details !== input.details)
      throw new BadRequestException("Learn category idempotency key was already used");
    const current = await tx.learnCategory.findUnique({ where: { id: input.id } });
    if (!current) throw new NotFoundException("Learn category not found");
    return current;
  }

  private async recordLearnCategoryStatusAudit(
    tx: any,
    input: { id: string; adminId: string; auditId: string; details: string },
  ) {
    const audit = await tx.adminAuditLog.upsert({
      where: { id: input.auditId },
      update: {},
      create: {
        id: input.auditId,
        adminId: input.adminId,
        action: "LEARN_CATEGORY_STATUS_UPDATED",
        target: input.id,
        details: input.details,
      },
    });
    if (audit.details !== input.details)
      throw new BadRequestException("Learn category idempotency key was already used");
  }

  private learnOriginalIntentHash(data: LearnArticleCreateData | LearnArticleUpdateData, adminId?: string): string {
    const values = Object.keys(data).filter((key) => key !== "reason" && key !== "idempotencyKey")
      .sort().map((key) => [key, (data as Record<string, unknown>)[key]]);
    return createHash("sha256").update(JSON.stringify({
      values, reason: data.reason?.trim() ?? null,
      key: data.idempotencyKey ?? null, ...(adminId ? { adminId } : {}),
    })).digest("hex");
  }

  private async existingLearnIntent(
    eventKey: string, articleId: string, type: string, expectedHash: string,
  ): Promise<boolean> {
    const previous = await this.database.eventOutbox.findUnique({
      where: { idempotencyKey: eventKey },
    });
    if (!previous) return false;
    let payload: Record<string, unknown> | null = null;
    try { payload = JSON.parse(previous.payload); } catch { /* fail closed */ }
    if (previous.aggregateId !== articleId || previous.aggregateType !== "LEARN_ARTICLE" ||
      previous.eventType !== type || payload?.intentHash !== expectedHash) {
      throw new ConflictException("Learn idempotency key belongs to a different original request");
    }
    return true;
  }

  async createLearn(data: LearnArticleCreateData, adminId?: string) {
    const status = this.learnStatus(data.status);
    const scheduledAt = this.learnDate(data.scheduledAt);
    if (status === "SCHEDULED" && !scheduledAt)
      throw new BadRequestException("Scheduled Learn articles require scheduledAt");
    const articleId = this.id("learn-article", data.slug);
    const eventKey = "learn-article:create:" + (data.idempotencyKey ?? articleId);
    const intentHash = data.idempotencyKey ? this.learnOriginalIntentHash(data, adminId) : null;
    if (intentHash && await this.existingLearnIntent(eventKey, articleId, "LEARN_ARTICLE_CREATED", intentHash)) {
      const replay = await this.database.learnArticle.findUnique({
        where: { id: articleId }, include: this.learnInclude(),
      });
      if (!replay) throw new ServiceUnavailableException("Original Learn article no longer exists");
      return replay;
    }
    const publishedAt = status === "PUBLISHED" ? new Date() : undefined;
    const revisionId = this.id("learn-revision:" + articleId, "1");
    const now = new Date().toISOString();
    const statements = this.learnCreationStatements({
      data, articleId, revisionId, status, scheduledAt, publishedAt, now,
    });
    this.appendLearnEvent(statements, eventKey, articleId, "LEARN_ARTICLE_CREATED",
      { status, slug: data.slug, ...(intentHash ? { intentHash } : {}) });
    const auditId = adminId && data.idempotencyKey && data.reason
      ? this.appendLearnAdminAudit(statements, adminId, articleId, eventKey,
          "LEARN_ARTICLE_CREATED", data.reason, intentHash)
      : null;
    try {
      await this.d1.atomicBatch(statements);
    } catch (error) {
      // A concurrent identical command may commit after our initial read;
      // its unique outbox key is the authoritative reconciliation receipt.
      if (!intentHash || !(await this.existingLearnIntent(
        eventKey, articleId, "LEARN_ARTICLE_CREATED", intentHash,
      ))) throw error;
    }
    const article = await this.database.learnArticle.findUnique({
      where: { id: articleId }, include: this.learnInclude(),
    });
    if (!article) throw new ServiceUnavailableException("Learn article not materialized");
    return auditId ? { ...article, auditId } : article;
  }

  async updateLearn(id: string, data: LearnArticleUpdateData, adminId?: string) {
    const eventKey = "learn-article:update:" + id + ":" +
      (data.idempotencyKey ?? new Date().toISOString());
    const intentHash = data.idempotencyKey ? this.learnOriginalIntentHash(data, adminId) : null;
    if (intentHash && await this.existingLearnIntent(eventKey, id, "LEARN_ARTICLE_UPDATED", intentHash)) {
      const replay = await this.database.learnArticle.findUnique({
        where: { id }, include: this.learnInclude(),
      });
      if (!replay) throw new ServiceUnavailableException("Original Learn article no longer exists");
      return replay;
    }
    const current = await this.database.learnArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Learn article not found");
    const next = this.resolveLearnUpdate(current, data);
    const now = new Date().toISOString();
    const statements = this.learnUpdateStatements({ id, data, next, now });
    this.appendLearnEvent(statements, eventKey, id, "LEARN_ARTICLE_UPDATED",
      { status: next.status, slug: current.slug, ...(intentHash ? { intentHash } : {}) });
    // The original-key INSERT must run first under BEGIN IMMEDIATE.
    // A concurrent retry fails the unique outbox key before any content,
    // revision or relation mutation; durable readback resolves its result.
    const originalEvent = statements.pop();
    if (!originalEvent) throw new ServiceUnavailableException("Learn event command missing");
    statements.unshift(originalEvent);
    const auditId = adminId && data.idempotencyKey && data.reason
      ? this.appendLearnAdminAudit(statements, adminId, id, eventKey,
          "LEARN_ARTICLE_UPDATED", data.reason, intentHash)
      : null;
    try {
      await this.d1.atomicBatch(statements);
    } catch (error) {
      if (!intentHash || !(await this.existingLearnIntent(
        eventKey, id, "LEARN_ARTICLE_UPDATED", intentHash,
      ))) throw error;
    }
    const article = await this.database.learnArticle.findUnique({
      where: { id }, include: this.learnInclude(),
    });
    if (!article) throw new ServiceUnavailableException("Learn article not materialized");
    return auditId ? { ...article, auditId } : article;
  }

  private resolveLearnUpdate(current: any, data: LearnArticleUpdateData) {
    const status = this.learnStatus(data.status ?? current.status);
    return {
      title: data.title ?? current.title,
      body: data.body ?? current.body,
      summary: data.summary ?? current.summary,
      localizations: this.learnUpdateLocalizations(current, data),
      status,
      attachments: this.learnUpdateAttachments(current, data),
      categoryId: data.categoryId ?? current.categoryId,
      scheduledAt: this.learnUpdateSchedule(current, data, status),
      publishedAt: this.learnUpdatePublishedAt(current, status),
      archivedAt: status === "ARCHIVED" ? new Date() : null,
    };
  }

  private learnUpdateLocalizations(current: any, data: LearnArticleUpdateData) {
    return data.localizations === undefined
      ? current.localizations
      : JSON.stringify(data.localizations);
  }

  private learnUpdateAttachments(current: any, data: LearnArticleUpdateData) {
    return data.attachments === undefined ? current.attachments : data.attachments;
  }

  private learnUpdateSchedule(
    current: any,
    data: LearnArticleUpdateData,
    status: string,
  ) {
    const scheduledAt =
      data.scheduledAt === undefined
        ? current.scheduledAt
        : this.learnDate(data.scheduledAt);
    if (status === "SCHEDULED" && !scheduledAt)
      throw new BadRequestException(
        "Scheduled Learn articles require scheduledAt",
      );
    return scheduledAt;
  }

  private learnUpdatePublishedAt(current: any, status: string) {
    return status === "PUBLISHED"
      ? (current.publishedAt ?? new Date())
      : current.publishedAt;
  }

  private learnUpdateStatements(
    input: LearnArticleUpdateContext,
  ): D1BridgeBatchStatement[] {
    const { id, data, next, now } = input;
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: 'UPDATE "LearnContent" SET "title"=?,"body"=?,"summary"=?,"localizations"=?,"status"=?,"attachments"=?,"categoryId"=?,"scheduledAt"=?,"publishedAt"=?,"archivedAt"=?,"updatedAt"=? WHERE "id"=?',
        params: [
          next.title, next.body, next.summary, next.localizations, next.status,
          this.learnStoredValue(next.attachments), next.categoryId,
          next.scheduledAt?.toISOString() ?? null,
          next.publishedAt?.toISOString() ?? null,
          next.archivedAt?.toISOString() ?? null, now, id,
        ],
      },
      {
        // Revision is allocated under SQLite's BEGIN IMMEDIATE writer lock,
        // avoiding the stale pre-read MAX(revision) race across admins.
        sql: 'INSERT INTO "LearnArticleRevision" ("id","articleId","revision","title","body","summary","localizations","status","attachments","scheduledAt","publishedAt","createdAt") SELECT ?,?,COALESCE((SELECT MAX("revision") FROM "LearnArticleRevision" WHERE "articleId"=?),0)+1,?,?,?,?,?,?,?,?,?',
        params: [
          randomUUID(), id, id,
          next.title, next.body, next.summary, next.localizations, next.status,
          this.learnStoredValue(next.attachments),
          next.scheduledAt?.toISOString() ?? null,
          next.publishedAt?.toISOString() ?? null, now,
        ],
      },
    ];
    if (data.tags !== undefined || data.media !== undefined)
      this.replaceLearnRelations(statements, id, data.tags, data.media);
    return statements;
  }

  async publishLearn(id: string, idempotencyKey?: string, adminId?: string, reason?: string) {
    if (adminId && !reason?.trim())
      throw new BadRequestException("Learn publication requires an audit reason");
    const current = await this.database.learnArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Learn article not found");
    const eventKey = "learn-article:publish:" + id + ":" + (idempotencyKey ?? randomUUID());
    const eventId = randomUUID();
    const now = new Date().toISOString();
    const eventPayload = JSON.stringify({
      status: "PUBLISHED", slug: current.slug,
      ...(adminId ? { adminId, reason: reason?.trim() } : {}),
    });
    // The publish intent, article transition, revision and both durable
    // event envelopes must commit together. Replayed keys cannot mutate.
    const newEvent = 'EXISTS (SELECT 1 FROM "EventOutbox" WHERE "id"=? AND "idempotencyKey"=?)';
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: 'INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") SELECT ?,?,\'LEARN_ARTICLE\',?,\'LEARN_ARTICLE_PUBLISHED\',1,?,?,\'PENDING\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE EXISTS (SELECT 1 FROM "LearnContent" WHERE "id"=?)',
        params: [eventId, eventKey, id, eventKey, eventPayload, id],
      },
      {
        sql: 'UPDATE "LearnContent" SET "status"=\'PUBLISHED\',"publishedAt"=COALESCE("publishedAt",?),"updatedAt"=? WHERE "id"=? AND ' + newEvent,
        params: [now, now, id, eventId, eventKey],
      },
      {
        sql: 'INSERT INTO "LearnArticleRevision" ("id","articleId","revision","title","body","summary","localizations","status","attachments","scheduledAt","publishedAt") SELECT ?, "id", COALESCE((SELECT MAX("revision") FROM "LearnArticleRevision" WHERE "articleId"=?),0)+1,"title","body","summary","localizations","status","attachments","scheduledAt","publishedAt" FROM "LearnContent" WHERE "id"=? AND ' + newEvent,
        params: [randomUUID(), id, id, eventId, eventKey],
      },
      {
        sql: 'INSERT OR IGNORE INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") SELECT ?,?,\'LEARN_ARTICLE\',?,\'LEARN_ARTICLE_UPDATED\',1,?,?,\'PENDING\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP WHERE ' + newEvent,
        params: [randomUUID(), "learn-article:update:" + id + ":" + now,
          id, eventKey, eventPayload, eventId, eventKey],
      },
      {
        // Force SQLite to roll back all preceding writes for a conflicting
        // original key. LearnContent.slug is NOT NULL in the canonical schema.
        sql: 'INSERT INTO "LearnContent" ("id","slug","title","body","status") SELECT ?,NULL,NULL,NULL,NULL WHERE NOT EXISTS (SELECT 1 FROM "EventOutbox" WHERE "idempotencyKey"=? AND "aggregateType"=\'LEARN_ARTICLE\' AND "aggregateId"=? AND "eventType"=\'LEARN_ARTICLE_PUBLISHED\' AND "payload"=?)',
        params: ["learn-publish-guard:" + eventId, eventKey, id, eventPayload],
      },
    ];
    const auditId = adminId && reason
      ? this.id("learn-article-publish-audit:" + adminId, eventKey)
      : null;
    if (auditId) {
      statements.push({
        sql: 'INSERT OR IGNORE INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,\'LEARN_ARTICLE_PUBLISHED\',?,?,CURRENT_TIMESTAMP)',
        params: [auditId, adminId!, id,
          JSON.stringify({ reason: reason!.trim(), eventKey })],
      });
    }
    try {
      await this.d1.atomicBatch(statements);
    } catch (error) {
      if (error instanceof Error && /NOT NULL constraint failed: LearnContent\.(slug|title|body|status)/i.test(error.message))
        throw new ConflictException("Learn publication key belongs to a different original request");
      throw error;
    }
    const article = await this.database.learnArticle.findUnique({
      where: { id }, include: this.learnInclude(),
    });
    if (!article) throw new NotFoundException("Learn article not found");
    return auditId ? { ...article, auditId } : article;
  }

  private learnCreationStatements(input: {
    data: {
      slug: string;
      title: string;
      body: string;
      summary?: string;
      localizations?: unknown;
      attachments?: unknown;
      categoryId?: string;
      tags?: string[];
      media?: Array<{ url: string; altText?: string; provider?: string; metadata?: unknown }>;
    };
    articleId: string;
    revisionId: string;
    status: string;
    scheduledAt: Date | undefined;
    publishedAt: Date | undefined;
    now: string;
  }): D1BridgeBatchStatement[] {
    const { data, articleId, revisionId, status, scheduledAt, publishedAt, now } = input;
    const sharedContent = [
      data.title,
      data.body,
      data.summary ?? null,
      data.localizations === undefined ? null : JSON.stringify(data.localizations),
      status,
      this.learnStoredValue(data.attachments),
    ];
    const statements: D1BridgeBatchStatement[] = [
      {
        sql: `INSERT INTO "LearnContent" ("id", "slug", "title", "body", "summary", "localizations", "status", "attachments", "categoryId", "scheduledAt", "publishedAt", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [articleId, data.slug, ...sharedContent, data.categoryId ?? null, scheduledAt?.toISOString() ?? null, publishedAt?.toISOString() ?? null, now, now],
      },
      {
        sql: `INSERT INTO "LearnArticleRevision" ("id", "articleId", "revision", "title", "body", "summary", "localizations", "status", "attachments", "scheduledAt", "publishedAt") VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [revisionId, articleId, ...sharedContent, scheduledAt?.toISOString() ?? null, publishedAt?.toISOString() ?? null],
      },
    ];
    this.appendLearnRelationStatements({
      statements,
      articleId,
      tags: data.tags,
      media: data.media,
      now,
    });
    return statements;
  }

  private appendLearnAdminAudit(
    statements: D1BridgeBatchStatement[],
    adminId: string,
    articleId: string,
    eventKey: string,
    action: "LEARN_ARTICLE_CREATED" | "LEARN_ARTICLE_UPDATED",
    reason: string,
    intentHash: string | null,
  ): string {
    if (statements.length >= 16)
      throw new BadRequestException("Learn command exceeds the atomic SQLite batch limit");
    const auditId = this.id("learn-article-audit:" + adminId, eventKey);
    statements.push({
      sql: 'INSERT INTO "AdminAuditLog" ("id","adminId","action","target","details","createdAt") VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)',
      params: [auditId, adminId, action, articleId,
        JSON.stringify({ reason: reason.trim(), eventKey, intentHash })],
    });
    return auditId;
  }

  private appendLearnEvent(
    statements: D1BridgeBatchStatement[],
    eventKey: string,
    articleId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): void {
    if (statements.length >= 16)
      throw new BadRequestException("Learn article atomic batch exceeds the SQLite statement limit");
    statements.push({
      sql: 'INSERT INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","correlationId","payload","state","availableAt","createdAt","updatedAt") VALUES (?,?,\'LEARN_ARTICLE\',?,?,1,?,?,\'PENDING\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)',
      params: [this.id("learn-outbox", eventKey), eventKey, articleId,
        eventType, eventKey, JSON.stringify(payload)],
    });
  }

  private learnStoredValue(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    return typeof value === "string" ? value : JSON.stringify(value);
  }

  private replaceLearnRelations(
    statements: D1BridgeBatchStatement[],
    articleId: string,
    tags?: string[],
    media?: Array<{
      url: string;
      altText?: string;
      provider?: string;
      metadata?: unknown;
    }>,
  ): void {
    if (tags !== undefined)
      statements.push({
        sql: 'DELETE FROM "LearnArticleTag" WHERE "articleId"=?',
        params: [articleId],
      });
    if (media !== undefined)
      statements.push({
        sql: 'DELETE FROM "LearnMediaAsset" WHERE "articleId"=?',
        params: [articleId],
      });
    this.appendLearnRelationStatements({
      statements,
      articleId,
      tags,
      media,
      now: new Date().toISOString(),
    });
  }

  private appendLearnRelationStatements(input: {
    statements: D1BridgeBatchStatement[];
    articleId: string;
    tags?: string[];
    media?: Array<{ url: string; altText?: string; provider?: string; metadata?: unknown }>;
    now: string;
  }): void {
    const { statements, articleId, now } = input;
    const selectedTags = (input.tags ?? []).map((name) => name.trim()).filter(Boolean);
    const selectedMedia = input.media ?? [];
    // One additional slot is reserved for the domain EventOutbox insert.
    if (statements.length + selectedTags.length * 2 + selectedMedia.length > 15)
      throw new BadRequestException("Learn article relations exceed the atomic SQLite batch limit");
    for (const name of selectedTags) {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      statements.push({
        sql: `INSERT INTO "LearnTag" ("id", "slug", "name", "updatedAt") VALUES (?, ?, ?, ?) ON CONFLICT("slug") DO UPDATE SET "name" = excluded."name", "updatedAt" = excluded."updatedAt"`,
        params: [this.id("learn-tag", slug), slug, name, now],
      });
      statements.push({
        sql: `INSERT INTO "LearnArticleTag" ("articleId", "tagId") SELECT ?, "id" FROM "LearnTag" WHERE "slug" = ?`,
        params: [articleId, slug],
      });
    }
    selectedMedia.forEach((item, index) => {
      statements.push({
        sql: `INSERT INTO "LearnMediaAsset" ("id", "articleId", "url", "altText", "provider", "metadata") VALUES (?, ?, ?, ?, ?, ?)`,
        params: [this.id(`learn-media:${articleId}`, String(index)), articleId, item.url, item.altText ?? null, item.provider ?? null, this.learnStoredValue(item.metadata)],
      });
    });
  }


}
