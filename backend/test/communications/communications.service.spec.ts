import { CommunicationsService } from '../../src/communications/communications.service';

describe('CommunicationsService', () => {
  const outbox = { recordEvent: jest.fn().mockResolvedValue(undefined) };
  const redis = { isAvailable: jest.fn().mockReturnValue(false), publish: jest.fn() };
  const d1Communications = { isEnabled: jest.fn(() => false) };

  it('routes Admin moderation through the canonical D1 command and reads back the result', async () => {
    const current = { id: 'case-1', conversationId: 'conversation:user-1:user-2' };
    const updated = { ...current, status: 'RESOLVED', resolution: 'reviewed', reviewedById: 'admin-1' };
    const findUnique = jest.fn()
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(updated);
    const prisma: any = {
      messageModerationCase: { findUnique },
      $transaction: jest.fn(),
    };
    const d1Commands = {
      isEnabled: jest.fn(() => true),
      resolveMessageModeration: jest.fn().mockResolvedValue(true),
    };
    const durableOutbox = { recordEvent: jest.fn() };
    const service = new CommunicationsService(
      prisma,
      durableOutbox as any,
      d1Commands as any,
      redis as any,
    );

    await expect(service.resolveMessageModeration('case-1', 'admin-1', {
      status: 'RESOLVED',
      resolution: 'reviewed',
      conversationState: 'RESTRICTED',
      idempotencyKey: 'review-1',
    })).resolves.toBe(updated);

    expect(d1Commands.resolveMessageModeration).toHaveBeenCalledWith(expect.objectContaining({
      id: 'case-1',
      conversationId: current.conversationId,
      adminId: 'admin-1',
      status: 'RESOLVED',
      idempotencyKey: 'review-1',
    }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(durableOutbox.recordEvent).not.toHaveBeenCalled();
  });

  it('creates an idempotent ticket with its first reply', async () => {
    const ticket = { id: 'ticket-1', userId: 'user-1', replies: [{ id: 'reply-1' }] };
    const atomicBatch = jest.fn().mockResolvedValue([]);
    const prisma: any = {
      atomicBatch,
      supportTicket: { findUnique: jest.fn(async () => ticket) },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);
    const result = await service.createTicket('user-1', 'Help', 'Body', 'key-1');
    expect(result).toBe(ticket);
    expect(atomicBatch).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ sql: expect.stringContaining('INSERT INTO "SupportTicket"') }),
      expect.objectContaining({ sql: expect.stringContaining('INSERT INTO "SupportTicketReply"') }),
    ]));
    expect(prisma.supportTicket.findUnique).toHaveBeenCalledWith(expect.objectContaining({ include: { replies: true } }));
  });

  it('assigns monotonic sequence inside the deterministic persistent conversation', async () => {
    const conversationId = 'conversation:user-1:user-2';
    const message = { id: 'message-1', conversationId, sequence: 4 };
    const tx: any = {
      messageConversation: {
        upsert: jest.fn(async () => ({ id: conversationId, state: 'ACTIVE' })),
      },
      persistentMessage: {
        findFirst: jest.fn(async () => ({ sequence: 3 })),
        upsert: jest.fn(async () => message),
      },
    };
    const prisma: any = {
      $transaction: async (fn: any) => fn(tx),
      persistentMessage: { findUnique: jest.fn(async () => message) },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);
    const result = await service.sendMessage('user-2', 'user-1', 'Hello', 'key-1');
    expect(result.sequence).toBe(4);
    expect(tx.messageConversation.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ id: conversationId, participantAId: 'user-1', participantBId: 'user-2' }),
    }));
    expect(tx.persistentMessage.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ conversationId, sequence: 4 }),
    }));
    expect(outbox.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'MESSAGE_SENT',
      aggregateType: 'PERSISTENT_MESSAGE',
      payload: expect.objectContaining({ conversationId }),
    }));
  });

  it('rejects sends into a restricted conversation before message creation', async () => {
    const tx: any = {
      messageConversation: {
        upsert: jest.fn(async () => ({ id: 'conversation:user-1:user-2', state: 'RESTRICTED' })),
      },
      persistentMessage: {
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
    };
    const prisma: any = {
      $transaction: async (fn: any) => fn(tx),
      persistentMessage: { findUnique: jest.fn() },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);
    await expect(service.sendMessage('user-1', 'user-2', 'Hello', 'key-2')).rejects.toThrow('restricted');
    expect(tx.persistentMessage.upsert).not.toHaveBeenCalled();
  });

  it('projects canonical conversations with counterpart, read, and delivery state', async () => {
    const conversations = [{
      id: 'conversation:user-1:user-2',
      participantAId: 'user-1',
      participantBId: 'user-2',
      state: 'ACTIVE',
      updatedAt: new Date('2026-09-21T00:00:00Z'),
      messages: [{
        id: 'message-1',
        senderId: 'user-2',
        recipientId: 'user-1',
        deliveryState: 'DELIVERED',
        sequence: 1,
        readAt: null,
      }],
    }];
    const findMany = jest.fn(async () => conversations);
    const prisma: any = { messageConversation: { findMany } };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);
    const result = await service.listConversations('user-1', 1, 25);
    expect(result[0]).toEqual(expect.objectContaining({
      id: conversations[0].id,
      counterpartId: 'user-2',
      state: 'ACTIVE',
      readState: 'UNREAD',
      deliveryState: 'DELIVERED',
    }));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ participantAId: 'user-1' }, { participantBId: 'user-1' }] },
      include: expect.objectContaining({ messages: expect.any(Object) }),
    }));
  });

  it('sends an idempotent admin notification through the canonical notification store', async () => {
    const notification = { id: 'notification-1', userId: 'user-1' };
    const d1: any = {
      notification: {
        findUnique: jest.fn(async () => notification),
      },
    };
    const d1Gateway = { createNotification: jest.fn().mockResolvedValue(undefined) };
    const service = new CommunicationsService(d1, outbox as any, d1Gateway as any, redis as any);
    const result = await service.sendAdminNotification({
      userId: 'user-1', type: 'info', title: 'Hello', body: 'Body', idempotencyKey: 'key-1',
    });
    expect(result).toBe(notification);
    expect(d1Gateway.createNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', title: 'Hello', body: 'Body' }));
  });

  it('lists admin messages and notifications with bounded pagination', async () => {
    const findMany = jest.fn(async () => []);
    const d1: any = {
      persistentMessage: { findMany },
      notification: { findMany },
    };
    const service = new CommunicationsService(d1, outbox as any, d1Communications as any, redis as any);
    await service.adminMessages(2, 10);
    await service.adminNotifications(3, 5);
    expect(findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ skip: 10, take: 10 }));
    expect(findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ skip: 10, take: 5 }));
  });
  it('sends Admin messages through the conversation store with an idempotent audit record', async () => {
    const message = { id: 'message-1', senderId: 'admin-1', recipientId: 'user-1', body: 'Hello' };
    const auditUpsert = jest.fn(async ({ create }: any) => create);
    const prisma: any = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      adminAuditLog: { upsert: auditUpsert },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);
    const send = jest.spyOn(service, 'sendMessage').mockResolvedValue(message as any);

    await expect(service.sendAdminMessage('admin-1', {
      recipientId: 'user-1', body: 'Hello', reason: 'Customer follow-up', idempotencyKey: 'message-key-1',
    })).resolves.toEqual(expect.objectContaining({ ...message, auditId: expect.any(String) }));

    expect(send).toHaveBeenCalledWith('admin-1', 'user-1', 'Hello', 'message-key-1');
    expect(auditUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        action: 'ADMIN_MESSAGE_SENT',
        adminId: 'admin-1',
        target: 'user-1',
        details: expect.stringContaining('Customer follow-up'),
      }),
    }));
  });
  it('hides internal replies from the public ticket timeline', async () => {
    const findMany = jest.fn(async () => []);
    const prisma: any = { supportTicket: { findMany } };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);

    await service.listTickets('user-1', 1, 25);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
      include: {
        replies: {
          where: { internal: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    }));
  });

  it('targets the ticket owner for realtime reply and assignment events', async () => {
    const publish = jest.fn().mockResolvedValue(undefined);
    const realtimeRedis = { isAvailable: jest.fn().mockReturnValue(true), publish };
    const ticket = { id: 'ticket-1', userId: 'user-1', status: 'OPEN' };
    const reply = { id: 'reply-1' };
    const prisma: any = {
      supportTicket: {
        findUnique: jest.fn(async () => ticket),
        update: jest.fn(async ({ data }: any) => ({ ...ticket, ...data })),
      },
      supportTicketReply: { upsert: jest.fn(async () => reply) },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, realtimeRedis as any);

    await service.reply('admin-1', 'ticket-1', 'Reply', 'reply-key', false, undefined, 'ADMIN' as any);
    await service.assign('ticket-1', 'admin-2');

    const payloads = publish.mock.calls.map((call) => JSON.parse(call[1]));
    expect(payloads).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'SUPPORT_TICKET_REPLIED', payload: expect.objectContaining({ userId: 'user-1' }) }),
      expect.objectContaining({ type: 'SUPPORT_TICKET_ASSIGNED', payload: expect.objectContaining({ userId: 'user-1' }) }),
    ]));
    expect(prisma.supportTicket.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PENDING_USER' }),
    }));
    expect(prisma.supportTicket.update).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.not.objectContaining({ status: 'ASSIGNED' }),
    }));
  });

});
