import { AdminService } from '../../src/admin/admin.service';

describe('AdminService support realtime', () => {
  const createService = () => {
    const prisma: any = {
      supportTicket: {
        findUnique: jest.fn(async () => ({ userId: 'user-1' })),
      },
    };
    const d1: any = {
      isEnabled: jest.fn(() => true),
      replyAdminTicket: jest.fn(async () => ({ ok: true, auditId: 'audit-1', replayed: false })),
      setAdminTicketStatus: jest.fn(async () => ({ ok: true, auditId: 'audit-2', replayed: false, status: 'RESOLVED' })),
    };
    const communications: any = {
      publishRealtimeEvent: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AdminService(
      prisma,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      d1,
      communications,
    );
    return { service, communications };
  };

  it('targets the ticket owner after a durable admin reply', async () => {
    const { service, communications } = createService();
    await service.replyAdminTicket('ticket-1', 'admin-1', {
      body: 'Reply',
      internal: false,
      reason: 'respond',
      idempotencyKey: 'reply-key-1',
    });
    expect(communications.publishRealtimeEvent).toHaveBeenCalledWith(
      'SUPPORT_TICKET_REPLIED',
      'ticket-1',
      expect.objectContaining({ userId: 'user-1', adminId: 'admin-1' }),
    );
  });

  it('targets the ticket owner after a durable admin status change', async () => {
    const { service, communications } = createService();
    await service.setAdminTicketStatus('ticket-1', 'admin-1', {
      status: 'resolved',
      reason: 'resolved',
      idempotencyKey: 'status-key-1',
    });
    expect(communications.publishRealtimeEvent).toHaveBeenCalledWith(
      'SUPPORT_TICKET_STATUS_CHANGED',
      'ticket-1',
      expect.objectContaining({ userId: 'user-1', status: 'RESOLVED' }),
    );
  });
});
