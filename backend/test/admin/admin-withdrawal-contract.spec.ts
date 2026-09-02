import { AdminController } from '../../src/admin/admin.controller';
import { AdminService } from '../../src/admin/admin.service';

describe('Admin withdrawal idempotency contract', () => {
  const request = { user: { userId: 'admin-1' } } as any;
  const body = { reason: 'manual review', idempotencyKey: 'admin-withdrawal-001' };

  it('passes the request idempotency key from the approve controller boundary', async () => {
    const adminService = {
      decideAdminWithdrawal: jest.fn().mockResolvedValue({ ok: true }),
    };
    const controller = new AdminController(adminService as any, {} as any, {} as any);

    await controller.approveAdminWithdrawal('withdrawal-1', body, request);

    expect(adminService.decideAdminWithdrawal).toHaveBeenCalledWith(
      'withdrawal-1',
      'approved',
      'admin-1',
      'manual review',
      'admin-withdrawal-001',
    );
  });

  it('forwards the idempotency key to the financial decision operation', async () => {
    const financialOperations = {
      approveWithdrawal: jest.fn().mockResolvedValue({ ok: true }),
      rejectWithdrawal: jest.fn(),
    };
    const service = new AdminService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    (service as any).financialOperations = financialOperations;

    await service.decideAdminWithdrawal(
      'withdrawal-1',
      'approved',
      'admin-1',
      'manual review',
      'admin-withdrawal-001',
    );

    expect(financialOperations.approveWithdrawal).toHaveBeenCalledWith(
      'withdrawal-1',
      'manual review',
      'admin-1',
      'admin-withdrawal-001',
    );
  });
});
