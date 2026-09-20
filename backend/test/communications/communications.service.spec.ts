import { CommunicationsService } from '../../src/communications/communications.service';

describe('CommunicationsService', () => {
  const outbox = { recordEvent: jest.fn().mockResolvedValue(undefined) };
  const redis = { isAvailable: jest.fn().mockReturnValue(false), publish: jest.fn() };
  const d1Communications = {};

  it('creates an idempotent ticket with its first reply', async () => {
    const ticket = { id: 'ticket-1', userId: 'user-1', replies: [{ id: 'reply-1' }] };
    const tx: any = { supportTicket: { upsert: jest.fn(async () => ticket) } };
    const prisma: any = { $transaction: async (fn: any) => fn(tx) };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);
    const result = await service.createTicket('user-1', 'Help', 'Body', 'key-1');
    expect(result).toBe(ticket);
    expect(tx.supportTicket.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: expect.anything(), include: { replies: true } }));
  });

  it('assigns monotonic message sequence and reuses the same idempotent message', async () => {
    const message = { id: 'message-1', sequence: 4 };
    const tx: any = {
      persistentMessage: {
        findFirst: jest.fn(async () => ({ sequence: 3 })),
        upsert: jest.fn(async () => message),
      },
    };
    const prisma: any = { $transaction: async (fn: any) => fn(tx) };
    const service = new CommunicationsService(prisma, outbox as any, d1Communications as any, redis as any);
    const result = await service.sendMessage('user-1', 'user-2', 'Hello', 'key-1');
    expect(result.sequence).toBe(4);
    expect(tx.persistentMessage.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ sequence: 4 }) }));
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
