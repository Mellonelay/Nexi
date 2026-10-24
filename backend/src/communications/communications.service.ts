import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role, Prisma } from "../prisma/d1-client";
import { createHash } from "crypto";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { RedisService } from "../redis/redis.service";
import { EventOutboxService } from "../events/event-outbox.service";
import { D1CommunicationsCommandGateway } from "../d1/d1-communications-command.gateway";
import type { D1BridgeBatchStatement } from "../d1/d1-worker-bridge.service";

type ResolveMessageModerationInput = {
  status: "OPEN" | "RESOLVED";
  resolution?: string;
  conversationState?: "ACTIVE" | "RESTRICTED";
  idempotencyKey: string;
};

type LearnArticleUpdateData = {
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
  revision: number;
  now: string;
};

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly d1: D1PrismaService,
    private readonly outbox: EventOutboxService,
    private readonly d1Communications: D1CommunicationsCommandGateway,
    private readonly redis: RedisService,
  ) {}

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
      orderBy: { updatedAt: "desc" },
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

  async sendMessage(
    senderId: string,
    recipientId: string,
    body: string,
    key: string,
    attachments?: unknown,
  ) {
    const messageId = this.id(`message:${senderId}:${recipientId}`, key);
    const identity = this.conversationIdentity(senderId, recipientId);
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
    } else {
      await this.database.$transaction(async (tx) => {
        const conversation = await tx.messageConversation.upsert({
          where: {
            participantAId_participantBId: {
              participantAId: identity.participantAId,
              participantBId: identity.participantBId,
            },
          },
          update: {},
          create: {
            id: identity.conversationId,
            participantAId: identity.participantAId,
            participantBId: identity.participantBId,
          },
        });
        if (conversation.state !== "ACTIVE")
          throw new ForbiddenException("Conversation is restricted");
        const last = await tx.persistentMessage.findFirst({
          where: { conversationId: identity.conversationId },
          orderBy: { sequence: "desc" },
          select: { sequence: true },
        });
        await tx.persistentMessage.upsert({
          where: { id: messageId },
          update: {},
          create: {
            id: messageId,
            conversationId: identity.conversationId,
            senderId,
            recipientId,
            body,
            sequence: (last?.sequence ?? 0) + 1,
            attachments: attachments as Prisma.InputJsonValue | undefined,
          },
        });
      });
      await this.durableEvent(
        "message:" + messageId,
        "PERSISTENT_MESSAGE",
        messageId,
        "MESSAGE_SENT",
        { conversationId: identity.conversationId, senderId, recipientId },
      );
    }
    const message = await this.database.persistentMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new ForbiddenException("Conversation is restricted");
    await this.publishRealtimeEvent("MESSAGE_SENT", message.id, {
      conversationId: identity.conversationId,
      senderId,
      recipientId,
      sequence: message.sequence,
    });
    return message;
  }

  async markMessageRead(userId: string, messageId: string) {
    const updated = await this.d1Communications.markMessageRead(userId, messageId);
    if (!updated) throw new NotFoundException("Message not found");
    const message = await this.d1.persistentMessage.findUnique({
      where: { id: messageId },
    });
    if (message) {
      await this.publishRealtimeEvent("MESSAGE_READ", messageId, {
        userId,
        senderId: message.senderId,
        recipientId: message.recipientId,
      });
    }
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
      orderBy: { createdAt: "desc" },
      include: { conversation: true },
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
    return this.database.persistentMessage.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async sendAdminMessage(
    adminId: string,
    input: { recipientId: string; body: string; reason: string; idempotencyKey: string },
  ) {
    const reason = input.reason.trim();
    const body = input.body.trim();
    if (!reason) throw new BadRequestException("An audit reason is required");
    if (!body) throw new BadRequestException("Message body is required");
    if (input.recipientId === adminId) throw new BadRequestException("An admin cannot message their own account");
    const recipient = await this.database.user.findFirst({
      where: { id: input.recipientId, role: Role.USER },
      select: { id: true },
    });
    if (!recipient) throw new NotFoundException("Client not found");
    const message = await this.sendMessage(
      adminId,
      input.recipientId,
      body,
      input.idempotencyKey,
    );
    if (
      message.senderId !== adminId ||
      message.recipientId !== input.recipientId ||
      message.body !== body
    ) {
      throw new BadRequestException("Message idempotency key was already used");
    }
    const messageId = this.id(`message:${adminId}:${input.recipientId}`, input.idempotencyKey);
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

  async adminNotifications(page = 1, limit = 100) {
    return this.database.notification.findMany({
      skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  async sendAdminNotification(data: { userId: string; type: string; title: string; body: string; idempotencyKey: string; reason?: string }) {
    const id = this.id("admin-notification", data.idempotencyKey);
    let notification: any;
    await this.d1Communications.createNotification({
        id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        idempotencyKey: data.idempotencyKey,
        eventType: "NOTIFICATION_SENT",
    });
    notification = await this.database.notification.findUnique({ where: { id } });
    if (!notification) throw new BadRequestException("Notification was not materialized");
    await this.publishRealtimeEvent("NOTIFICATION_SENT", id, { userId: data.userId, type: data.type });
    return notification;
  }

  async snapshot(userId: string) {
    const [tickets, messages, notifications] = await Promise.all([
      this.listTickets(userId, 1, 25),
      this.listMessages(userId, 1, 25),
      this.listNotifications(userId, 1, 25),
    ]);
    return {
      tickets,
      messages,
      notifications,
      capturedAt: new Date().toISOString(),
    };
  }

  async listNotifications(userId: string, page = 1, limit = 25) {
    return this.database.notification.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
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
    const id = data.idempotencyKey ? this.id("announcement", data.idempotencyKey) : undefined;
    const { idempotencyKey: _idempotencyKey, reason: _reason, startsAt, endsAt, ...announcementData } = data;
    const announcement = await this.database.announcement.upsert({
      where: { id: id ?? this.id("announcement", `${data.title}:${data.body}`) },
      update: {},
      create: {
        ...(id ? { id } : {}),
        ...announcementData,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        targeting: data.targeting as Prisma.InputJsonValue | undefined,
        localizations:
          data.localizations === undefined
            ? undefined
            : JSON.stringify(data.localizations),
      },
    });
    await this.durableEvent(
      "announcement:" + announcement.id,
      "ANNOUNCEMENT",
      announcement.id,
      "ANNOUNCEMENT_CREATED",
      { published: announcement.published },
    );
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
    const announcement = await this.database.announcement.update({ where: { id }, data: update });
    const eventType = !current.published && announcement.published
      ? "ANNOUNCEMENT_PUBLISHED"
      : current.published && !announcement.published
        ? "ANNOUNCEMENT_UNPUBLISHED"
        : "ANNOUNCEMENT_UPDATED";
    await this.durableEvent(
      `announcement:${id}:${data.idempotencyKey}`,
      "ANNOUNCEMENT",
      id,
      eventType,
      { published: announcement.published },
    );
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

  async createLearnCategory(data: {
    slug: string;
    name: string;
    description?: string;
    sortOrder?: number;
    status?: string;
  }) {
    const status = data.status ?? "ACTIVE";
    if (!["ACTIVE", "INACTIVE"].includes(status))
      throw new BadRequestException("Learn category status is invalid");
    const category = await this.database.learnCategory.create({
      data: { ...data, status },
    });
    await this.durableEvent(
      "learn-category:" + category.id,
      "LEARN_CATEGORY",
      category.id,
      "LEARN_CATEGORY_CREATED",
      { slug: category.slug, status: category.status },
    );
    return category;
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

  async createLearn(data: LearnArticleCreateData) {
    const status = this.learnStatus(data.status);
    const scheduledAt = this.learnDate(data.scheduledAt);
    if (status === "SCHEDULED" && !scheduledAt)
      throw new BadRequestException(
        "Scheduled Learn articles require scheduledAt",
      );
    const publishedAt = status === "PUBLISHED" ? new Date() : undefined;
    const articleId = this.id("learn-article", data.slug);
    const revisionId = this.id(`learn-revision:${articleId}`, "1");
    const now = new Date().toISOString();
    const statements = this.learnCreationStatements({
      data,
      articleId,
      revisionId,
      status,
      scheduledAt,
      publishedAt,
      now,
    });
    await this.d1.atomicBatch(statements);
    const article = await this.database.learnArticle.findUnique({
      where: { id: articleId },
      include: this.learnInclude(),
    });
    if (!article)
      throw new BadRequestException("Learn article was not materialized");
    await this.durableEvent(
      "learn-article:create:" + article.id,
      "LEARN_ARTICLE",
      article.id,
      "LEARN_ARTICLE_CREATED",
      { status: article.status, slug: article.slug },
    );
    return article;
  }

  async updateLearn(id: string, data: LearnArticleUpdateData) {
    const current = await this.database.learnArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Learn article not found");
    const next = this.resolveLearnUpdate(current, data);
    const latest = await this.database.learnArticleRevision.findFirst({
      where: { articleId: id },
      orderBy: { revision: "desc" },
      select: { revision: true },
    });
    const now = new Date().toISOString();
    await this.d1.atomicBatch(this.learnUpdateStatements({
      id, data, next, revision: (latest?.revision ?? 0) + 1, now,
    }));
    const article = await this.database.learnArticle.findUnique({
      where: { id },
      include: this.learnInclude(),
    });
    if (!article)
      throw new BadRequestException("Learn article was not materialized");
    const updatedAt =
      article.updatedAt instanceof Date
        ? article.updatedAt.toISOString()
        : new Date(article.updatedAt).toISOString();
    await this.durableEvent(
      "learn-article:update:" + article.id + ":" + updatedAt,
      "LEARN_ARTICLE",
      article.id,
      "LEARN_ARTICLE_UPDATED",
      { status: article.status, slug: article.slug },
    );
    return article;
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
    const { id, data, next, revision, now } = input;
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
        sql: 'INSERT INTO "LearnArticleRevision" ("id","articleId","revision","title","body","summary","localizations","status","attachments","scheduledAt","publishedAt","createdAt") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        params: [
          this.id("learn-revision:" + id, String(revision)), id, revision,
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

  async publishLearn(id: string, idempotencyKey?: string) {
    const article = await this.updateLearn(id, { status: "PUBLISHED" });
    if (idempotencyKey) {
      await this.durableEvent(
        `learn-article:publish:${id}:${idempotencyKey}`,
        "LEARN_ARTICLE",
        id,
        "LEARN_ARTICLE_PUBLISHED",
        { status: article.status, slug: article.slug },
      );
    }
    return article;
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
    if (statements.length + selectedTags.length * 2 + selectedMedia.length > 16)
      throw new BadRequestException("Learn article relations exceed the atomic D1 batch limit");
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
