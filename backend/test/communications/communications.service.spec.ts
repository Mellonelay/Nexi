import { CommunicationsService, NEXI_SUPPORT_CHANNEL_ID } from '../../src/communications/communications.service';

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
    const priorOutboxCalls = outbox.recordEvent.mock.calls.length;
    const conversationId = 'conversation:user-1:user-2';
    let message: any;
    const outboxUpsert = jest.fn(async ({ create }: any) => create);
    const tx: any = {
      messageConversation: {
        upsert: jest.fn(async () => ({ id: conversationId, state: 'ACTIVE' })),
      },
      eventOutbox: { upsert: outboxUpsert },
      persistentMessage: {
        findFirst: jest.fn(async () => ({ sequence: 3 })),
        upsert: jest.fn(async ({ create }: any) => {
          message = create;
          return message;
        }),
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
    expect(outboxUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        aggregateType: 'PERSISTENT_MESSAGE',
        aggregateId: message.id,
        eventType: 'MESSAGE_SENT',
      }),
    }));
    expect(JSON.parse(outboxUpsert.mock.calls[0][0].create.payload)).toEqual({
      conversationId,
      senderId: 'user-2',
      recipientId: 'user-1',
    });
    expect(outbox.recordEvent).toHaveBeenCalledTimes(priorOutboxCalls);
  });

  it('rejects reuse of a public message idempotency key with a different payload', async () => {
    const existing = {
      id: 'existing-message',
      conversationId: 'conversation:user-1:user-2',
      senderId: 'user-1',
      recipientId: 'user-2',
      body: 'Original body',
      attachments: null,
    };
    const outboxUpsert = jest.fn();
    const tx: any = {
      messageConversation: {
        upsert: jest.fn(async () => ({ id: existing.conversationId, state: 'ACTIVE' })),
      },
      persistentMessage: {
        findFirst: jest.fn(async () => null),
        upsert: jest.fn(async () => existing),
      },
      eventOutbox: { upsert: outboxUpsert },
    };
    const prisma: any = { $transaction: async (fn: any) => fn(tx) };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);

    await expect(service.sendMessage('user-1', 'user-2', 'Changed body', 'same-key'))
      .rejects.toThrow('Message idempotency key was already used with a different payload');
    expect(outboxUpsert).not.toHaveBeenCalled();
  });

  it('keeps reversed sender and recipient directions on the same canonical thread', async () => {
    const conversationId = 'conversation:admin-1:user-1';
    const conversationUpsert = jest.fn(async ({ create }: any) => ({ ...create, state: 'ACTIVE' }));
    let lastSequence = 0;
    let persistedMessage: any;
    const tx: any = {
      messageConversation: { upsert: conversationUpsert },
      eventOutbox: { upsert: jest.fn(async ({ create }: any) => create) },
      persistentMessage: {
        findFirst: jest.fn(async () => lastSequence ? { sequence: lastSequence } : null),
        upsert: jest.fn(async ({ create }: any) => {
          lastSequence = create.sequence;
          persistedMessage = create;
          return create;
        }),
      },
    };
    const prisma: any = {
      $transaction: async (fn: any) => fn(tx),
      persistentMessage: { findUnique: jest.fn(async () => persistedMessage) },
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      adminAuditLog: { upsert: jest.fn(async ({ create }: any) => create) },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);

    const publicMessage = await service.sendMessage('user-1', 'admin-1', 'Question', 'public-key');
    const adminMessage = await service.sendAdminMessage('admin-1', {
      recipientId: 'user-1',
      body: 'Reply',
      reason: 'Customer follow-up',
      idempotencyKey: 'admin-key',
    });

    expect(publicMessage.conversationId).toBe(conversationId);
    expect(adminMessage.conversationId).toBe(conversationId);
    expect(conversationUpsert).toHaveBeenCalledTimes(2);
    for (const [input] of conversationUpsert.mock.calls) {
      expect(input.where.participantAId_participantBId).toEqual({
        participantAId: 'admin-1',
        participantBId: 'user-1',
      });
      expect(input.create.id).toBe(conversationId);
    }
  });

  it('routes Public first messages and Admin replies to one server-owned support conversation', async () => {
    const customerId = 'user-1';
    const [participantAId, participantBId] = [customerId, NEXI_SUPPORT_CHANNEL_ID].sort();
    const supportConversationId = `conversation:${participantAId}:${participantBId}`;
    let lastSequence = 0;
    let persistedMessage: any;
    const tx: any = {
      messageConversation: { upsert: jest.fn(async ({ create }: any) => ({ ...create, state: 'ACTIVE' })) },
      eventOutbox: { upsert: jest.fn(async ({ create }: any) => create) },
      persistentMessage: {
        findFirst: jest.fn(async () => lastSequence ? { sequence: lastSequence } : null),
        upsert: jest.fn(async ({ create }: any) => {
          lastSequence = create.sequence;
          persistedMessage = create;
          return create;
        }),
      },
    };
    const prisma: any = {
      $transaction: async (fn: any) => fn(tx),
      persistentMessage: { findUnique: jest.fn(async () => persistedMessage) },
      messageConversation: {
        findUnique: jest.fn(async () => ({ id: supportConversationId, participantAId, participantBId, state: 'ACTIVE' })),
        upsert: jest.fn(async ({ create }: any) => ({ ...create, state: 'ACTIVE' })),
      },
      user: { findFirst: jest.fn().mockResolvedValue({ id: customerId }) },
      adminAuditLog: { upsert: jest.fn(async ({ create }: any) => create) },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);

    const first = await service.sendSupportMessage(customerId, 'Help', 'public-key');
    const reply = await service.sendAdminMessage('admin-1', {
      recipientId: customerId,
      conversationId: supportConversationId,
      body: 'We can help',
      reason: 'Customer reply',
      idempotencyKey: 'admin-key',
    });

    expect(first.conversationId).toBe(supportConversationId);
    expect(first.attachments).toEqual([]);
    expect(first.recipientId).toBe(NEXI_SUPPORT_CHANNEL_ID);
    expect(reply.conversationId).toBe(supportConversationId);
    expect(reply.senderId).toBe(NEXI_SUPPORT_CHANNEL_ID);
    expect(prisma.adminAuditLog.upsert.mock.calls[0][0].create.adminId).toBe('admin-1');
    expect(tx.messageConversation.upsert).toHaveBeenCalledTimes(2);
  });

  it('replays a persisted support message after its staged attachment expires', async () => {
    const customerId = 'user-1';
    const [participantAId, participantBId] = [customerId, NEXI_SUPPORT_CHANNEL_ID].sort();
    const conversationId = `conversation:${participantAId}:${participantBId}`;
    const attachment = { id: 'a4f3c234-b857-4fc9-8f3e-e9e1a5f00421', name: 'image.png', mimeType: 'image/png', size: 8 };
    const persisted = {
      id: 'persisted-support-message', conversationId, senderId: customerId,
      recipientId: NEXI_SUPPORT_CHANNEL_ID, body: 'Please help', attachments: JSON.stringify([attachment]),
    };
    const attachmentStorage = { resolve: jest.fn().mockRejectedValue(new Error('Attachment upload expired')) };
    const prisma: any = {
      messageConversation: { findUnique: jest.fn().mockResolvedValue({
        id: conversationId, participantAId, participantBId, state: 'ACTIVE',
      }) },
      persistentMessage: { findUnique: jest.fn().mockResolvedValue(persisted) },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any, attachmentStorage as any);

    await expect(service.sendSupportMessage(customerId, 'Please help', 'retry-key', [attachment.id]))
      .resolves.toMatchObject({ id: persisted.id, attachments: [attachment] });
    expect(attachmentStorage.resolve).not.toHaveBeenCalled();
    expect(prisma.persistentMessage.findUnique).toHaveBeenCalledWith({
      where: { id: (service as any).id(`message:${customerId}:${NEXI_SUPPORT_CHANNEL_ID}`, 'retry-key') },
    });
  });

  it('rejects a changed support-message payload before resolving an expired attachment', async () => {
    const customerId = 'user-1';
    const [participantAId, participantBId] = [customerId, NEXI_SUPPORT_CHANNEL_ID].sort();
    const conversationId = `conversation:${participantAId}:${participantBId}`;
    const attachment = { id: 'a4f3c234-b857-4fc9-8f3e-e9e1a5f00421', name: 'image.png', mimeType: 'image/png', size: 8 };
    const persisted = {
      id: 'persisted-support-message', conversationId, senderId: customerId,
      recipientId: NEXI_SUPPORT_CHANNEL_ID, body: 'Please help', attachments: JSON.stringify([attachment]),
    };
    const attachmentStorage = { resolve: jest.fn().mockRejectedValue(new Error('Attachment upload expired')) };
    const prisma: any = {
      messageConversation: { findUnique: jest.fn().mockResolvedValue({
        id: conversationId, participantAId, participantBId, state: 'ACTIVE',
      }) },
      persistentMessage: { findUnique: jest.fn().mockResolvedValue(persisted) },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any, attachmentStorage as any);

    await expect(service.sendSupportMessage(customerId, 'Changed body', 'retry-key', [attachment.id]))
      .rejects.toThrow('Message idempotency key was already used with a different payload');
    expect(attachmentStorage.resolve).not.toHaveBeenCalled();
  });

  it('returns an empty canonical support thread without creating or marking state read', async () => {
    const customerId = 'user-1';
    const [participantAId, participantBId] = [customerId, NEXI_SUPPORT_CHANNEL_ID].sort();
    const supportConversationId = `conversation:${participantAId}:${participantBId}`;
    const conversationUpsert = jest.fn();
    const messageFindMany = jest.fn();
    const prisma: any = {
      messageConversation: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: conversationUpsert,
      },
      persistentMessage: { findMany: messageFindMany },
    };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);

    await expect(service.supportThread(customerId)).resolves.toEqual({
      conversationId: supportConversationId,
      page: 1,
      limit: 100,
      messages: [],
    });
    expect(conversationUpsert).not.toHaveBeenCalled();
    expect(messageFindMany).not.toHaveBeenCalled();
  });

  it('keeps retired support tickets out of realtime snapshots', async () => {
    const service = new CommunicationsService({} as any, outbox as any, d1Communications as any, redis as any);
    const listTickets = jest.spyOn(service, 'listTickets').mockResolvedValue([{ id: 'historical-ticket' }] as any);
    jest.spyOn(service, 'listMessages').mockResolvedValue([] as any);
    jest.spyOn(service, 'listNotifications').mockResolvedValue([] as any);

    const snapshot = await service.snapshot('user-1');

    expect(snapshot).not.toHaveProperty('tickets');
    expect(listTickets).not.toHaveBeenCalled();
  });

  it('leaves incoming support read state unchanged during a thread GET', async () => {
    const customerId = 'user-1';
    const [participantAId, participantBId] = [customerId, NEXI_SUPPORT_CHANNEL_ID].sort();
    const supportConversationId = `conversation:${participantAId}:${participantBId}`;
    const incoming = {
      id: 'reply-1',
      conversationId: supportConversationId,
      senderId: NEXI_SUPPORT_CHANNEL_ID,
      recipientId: customerId,
      body: 'We can help',
      readAt: null,
      attachments: null,
      sequence: 1,
    };
    const markMessageRead = jest.fn();
    const prisma: any = {
      messageConversation: {
        findUnique: jest.fn().mockResolvedValue({
          id: supportConversationId,
          participantAId,
          participantBId,
          state: 'ACTIVE',
        }),
      },
      persistentMessage: { findMany: jest.fn().mockResolvedValue([incoming]) },
    };
    const service = new CommunicationsService(
      prisma,
      outbox as any,
      { ...d1Communications, markMessageRead } as any,
      redis as any,
    );

    const result = await service.supportThread(customerId);

    expect(result.messages[0]).toEqual(expect.objectContaining({ id: incoming.id, readAt: null }));
    expect(markMessageRead).not.toHaveBeenCalled();
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
    expect(findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      skip: 10,
      take: 10,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }));
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

    expect(send).toHaveBeenCalledWith('admin-1', 'user-1', 'Hello', 'message-key-1', undefined);
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
