import { CommunicationsService } from '../../src/communications/communications.service';

describe('CommunicationsService', () => {
  it('creates an idempotent ticket with its first reply', async () => {
    const ticket = { id: 'ticket-1', userId: 'user-1', replies: [{ id: 'reply-1' }] };
    const tx: any = { supportTicket: { upsert: jest.fn(async () => ticket) } };
    const prisma: any = { $transaction: async (fn: any) => fn(tx) };
    const service = new CommunicationsService(prisma, {} as any, {} as any, {} as any);
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
    const service = new CommunicationsService(prisma, {} as any, {} as any, {} as any);
    const result = await service.sendMessage('user-1', 'user-2', 'Hello', 'key-1');
    expect(result.sequence).toBe(4);
    expect(tx.persistentMessage.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ sequence: 4 }) }));
  });

  it('sends an idempotent admin notification through the canonical notification store', async () => {
    const notification = { id: 'notification-1', userId: 'user-1' };
    const prisma: any = {
      notification: { upsert: jest.fn(async () => notification) },
    };
    const service = new CommunicationsService(prisma, {} as any, {} as any);
    const result = await service.sendAdminNotification({
      userId: 'user-1', type: 'info', title: 'Hello', body: 'Body', idempotencyKey: 'key-1',
    });
    expect(result).toBe(notification);
    expect(prisma.notification.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: expect.any(String) },
      create: expect.objectContaining({ userId: 'user-1', title: 'Hello', body: 'Body' }),
    }));
  });

  it('lists admin messages and notifications with bounded pagination', async () => {
    const findMany = jest.fn(async () => []);
    const prisma: any = {
      persistentMessage: { findMany },
      notification: { findMany },
    };
    const service = new CommunicationsService(prisma, {} as any, {} as any);
    await service.adminMessages(2, 10);
    await service.adminNotifications(3, 5);
    expect(findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ skip: 10, take: 10 }));
    expect(findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ skip: 10, take: 5 }));
  });
});
