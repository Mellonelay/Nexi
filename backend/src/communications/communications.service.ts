import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { Role, Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { RedisService } from "../redis/redis.service";
import { EventOutboxService } from "../events/event-outbox.service";

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly d1: D1PrismaService,
    private readonly outbox: EventOutboxService,
    @Optional() private readonly redis?: RedisService,
  ) {}

  private get database(): any {
    return process.env.D1_RUNTIME_ENABLED === "true" ? this.d1 : this.prisma;
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
    if (process.env.D1_RUNTIME_ENABLED !== "true") return;
    await this.outbox.recordEvent({
      idempotencyKey,
      aggregateType,
      aggregateId,
      eventType,
      correlationId: idempotencyKey,
      payload,
    });
  }

  private async event(
    type: string,
    referenceId: string,
    payload: Record<string, unknown>,
  ) {
    if (!this.redis?.isAvailable()) return;
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
    const ticket = await this.database.$transaction(async (tx) =>
      tx.supportTicket.upsert({
        where: { id: ticketId },
        update: {},
        create: {
          id: ticketId,
          userId,
          subject,
          replies: { create: { authorId: userId, body } },
        },
        include: { replies: true },
      }),
    );
    await this.event("SUPPORT_TICKET_OPENED", ticket.id, { userId });
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
      include: { replies: { orderBy: { createdAt: "asc" } } },
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
        status: role === Role.ADMIN ? "ANSWERED" : "OPEN",
      },
    });
    await this.event("SUPPORT_TICKET_REPLIED", ticketId, { replyId });
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
      data: { assignedToId, status: "ASSIGNED" },
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

  async sendMessage(
    senderId: string,
    recipientId: string,
    body: string,
    key: string,
    attachments?: unknown,
  ) {
    const messageId = this.id(`message:${senderId}:${recipientId}`, key);
    const message = await this.database.$transaction(async (tx) => {
      const last = await tx.persistentMessage.findFirst({
        where: { senderId, recipientId },
        orderBy: { sequence: "desc" },
        select: { sequence: true },
      });
      return tx.persistentMessage.upsert({
        where: { id: messageId },
        update: {},
        create: {
          id: messageId,
          senderId,
          recipientId,
          body,
          sequence: (last?.sequence ?? 0) + 1,
          attachments: attachments as Prisma.InputJsonValue | undefined,
        },
      });
    });
    await this.event("MESSAGE_SENT", message.id, {
      senderId,
      recipientId,
      sequence: message.sequence,
    });
    await this.durableEvent(
      "message:" + message.id,
      "PERSISTENT_MESSAGE",
      message.id,
      "MESSAGE_SENT",
      { senderId, recipientId, sequence: message.sequence },
    );
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
    const result = await this.database.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (result.count !== 1)
      throw new NotFoundException("Notification not found");
    const notification = await this.database.notification.findUnique({
      where: { id },
    });
    await this.durableEvent(
      "notification-read:" + id + ":" + userId,
      "NOTIFICATION",
      id,
      "NOTIFICATION_READ",
      { userId },
    );
    return notification;
  }
  async announcements() {
    return this.database.announcement.findMany({
      where: {
        published: true,
        OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }],
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async createAnnouncement(data: {
    title: string;
    body: string;
    targeting?: unknown;
    published?: boolean;
  }) {
    const announcement = await this.database.announcement.create({
      data: {
        ...data,
        targeting: data.targeting as Prisma.InputJsonValue | undefined,
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

  async learn() {
    return this.database.learnArticle.findMany({
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
  }

  async learnDetail(slug: string) {
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
    return article;
  }

  async listLearnCategories() {
    return this.database.learnCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async adminLearnArticles() {
    return this.database.learnArticle.findMany({
      orderBy: { updatedAt: "desc" },
      include: this.learnInclude(),
    });
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

  async createLearn(data: {
    slug: string;
    title: string;
    body: string;
    summary?: string;
    status?: string;
    attachments?: unknown;
    categoryId?: string;
    scheduledAt?: string;
    tags?: string[];
    media?: Array<{
      url: string;
      altText?: string;
      provider?: string;
      metadata?: unknown;
    }>;
  }) {
    const status = this.learnStatus(data.status);
    const scheduledAt = this.learnDate(data.scheduledAt);
    if (status === "SCHEDULED" && !scheduledAt)
      throw new BadRequestException(
        "Scheduled Learn articles require scheduledAt",
      );
    const publishedAt = status === "PUBLISHED" ? new Date() : undefined;
    const article = await this.database.$transaction(async (tx) => {
      const article = await tx.learnArticle.create({
        data: {
          slug: data.slug,
          title: data.title,
          body: data.body,
          summary: data.summary,
          status,
          attachments: data.attachments as Prisma.InputJsonValue | undefined,
          categoryId: data.categoryId,
          scheduledAt,
          publishedAt,
        },
      });
      await tx.learnArticleRevision.create({
        data: {
          articleId: article.id,
          revision: 1,
          title: article.title,
          body: article.body,
          summary: article.summary,
          status,
          attachments: article.attachments as Prisma.InputJsonValue | undefined,
          scheduledAt,
          publishedAt,
        },
      });
      await this.replaceLearnRelations(tx, article.id, data.tags, data.media);
      return tx.learnArticle.findUnique({
        where: { id: article.id },
        include: this.learnInclude(),
      });
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

  async updateLearn(
    id: string,
    data: {
      title?: string;
      body?: string;
      summary?: string;
      status?: string;
      attachments?: unknown;
      categoryId?: string;
      scheduledAt?: string;
      tags?: string[];
      media?: Array<{
        url: string;
        altText?: string;
        provider?: string;
        metadata?: unknown;
      }>;
    },
  ) {
    const current = await this.database.learnArticle.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException("Learn article not found");
    const status = this.learnStatus(data.status ?? current.status);
    const scheduledAt =
      data.scheduledAt === undefined
        ? current.scheduledAt
        : this.learnDate(data.scheduledAt);
    if (status === "SCHEDULED" && !scheduledAt)
      throw new BadRequestException(
        "Scheduled Learn articles require scheduledAt",
      );
    const publishedAt =
      status === "PUBLISHED"
        ? (current.publishedAt ?? new Date())
        : current.publishedAt;
    const article = await this.database.$transaction(async (tx) => {
      const article = await tx.learnArticle.update({
        where: { id },
        data: {
          title: data.title ?? current.title,
          body: data.body ?? current.body,
          summary: data.summary ?? current.summary,
          status,
          attachments:
            data.attachments === undefined
              ? current.attachments
              : (data.attachments as Prisma.InputJsonValue),
          categoryId: data.categoryId ?? current.categoryId,
          scheduledAt,
          publishedAt,
          archivedAt: status === "ARCHIVED" ? new Date() : null,
        },
      });
      const latest = await tx.learnArticleRevision.findFirst({
        where: { articleId: id },
        orderBy: { revision: "desc" },
        select: { revision: true },
      });
      await tx.learnArticleRevision.create({
        data: {
          articleId: id,
          revision: (latest?.revision ?? 0) + 1,
          title: article.title,
          body: article.body,
          summary: article.summary,
          status,
          attachments: article.attachments as Prisma.InputJsonValue | undefined,
          scheduledAt,
          publishedAt,
        },
      });
      if (data.tags !== undefined || data.media !== undefined)
        await this.replaceLearnRelations(tx, id, data.tags, data.media);
      return tx.learnArticle.findUnique({
        where: { id },
        include: this.learnInclude(),
      });
    });
    if (!article)
      throw new BadRequestException("Learn article was not materialized");
    await this.durableEvent(
      "learn-article:update:" +
        article.id +
        ":" +
        article.updatedAt.toISOString(),
      "LEARN_ARTICLE",
      article.id,
      "LEARN_ARTICLE_UPDATED",
      { status: article.status, slug: article.slug },
    );
    return article;
  }

  async publishLearn(id: string) {
    return this.updateLearn(id, { status: "PUBLISHED" });
  }

  private async replaceLearnRelations(
    tx: any,
    articleId: string,
    tags?: string[],
    media?: Array<{
      url: string;
      altText?: string;
      provider?: string;
      metadata?: unknown;
    }>,
  ) {
    if (tags !== undefined) {
      await tx.learnArticleTag.deleteMany({ where: { articleId } });
      for (const rawTag of tags) {
        const slug = rawTag.trim().toLowerCase().replace(/\s+/g, "-");
        if (!slug) continue;
        const tag = await tx.learnTag.upsert({
          where: { slug },
          update: { name: rawTag.trim() },
          create: { slug, name: rawTag.trim() },
        });
        await tx.learnArticleTag.create({ data: { articleId, tagId: tag.id } });
      }
    }
    if (media !== undefined) {
      await tx.learnMediaAsset.deleteMany({ where: { articleId } });
      if (media.length)
        await tx.learnMediaAsset.createMany({
          data: media.map((item) => ({
            articleId,
            url: item.url,
            altText: item.altText,
            provider: item.provider,
            metadata: item.metadata as Prisma.InputJsonValue | undefined,
          })),
        });
    }
  }
}
