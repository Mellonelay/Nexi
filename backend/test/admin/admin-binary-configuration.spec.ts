import { AdminService } from '../../src/admin/admin.service';

describe('Admin Binary configuration authority', () => {
  it('lists disabled latest configurations and allows an administrator to re-enable one', async () => {
    const current = {
      pair: 'BTCUSDT',
      durationSeconds: 60,
      payoutRate: '0.85',
      minStake: '1',
      maxStake: '1000',
      enabled: 0,
      version: 2,
    };
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      listBinaryConfigurations: jest.fn().mockResolvedValue([current]),
      getBinaryConfiguration: jest.fn().mockResolvedValue(current),
      updateBinaryConfiguration: jest.fn().mockResolvedValue({ ...current, enabled: 1, version: 3 }),
    };
    const service: any = Object.create(AdminService.prototype);
    service.d1 = d1;

    await expect(service.getBinaryConfigurations('BTCUSDT')).resolves.toEqual([current]);
    await service.updateBinaryConfiguration({
      pair: 'BTCUSDT',
      durationSeconds: 60,
      payoutRate: 0.85,
      minStake: 1,
      maxStake: 1000,
      enabled: true,
      reason: 'Re-enable duration',
      idempotencyKey: 'binary-enable-60',
    }, 'admin-1');

    expect(d1.getBinaryConfiguration).toHaveBeenCalledWith('BTCUSDT', 60, undefined, true);
    expect(d1.updateBinaryConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      pair: 'BTCUSDT',
      sourceDurationSeconds: 60,
      durationSeconds: 60,
      enabled: true,
      adminId: 'admin-1',
    }));
  });

  it('keeps the five owner-required duration records fixed', async () => {
    const d1 = {
      isEnabled: jest.fn().mockReturnValue(true),
      getBinaryConfiguration: jest.fn(),
      updateBinaryConfiguration: jest.fn(),
    };
    const service: any = Object.create(AdminService.prototype);
    service.d1 = d1;

    await expect(service.updateBinaryConfiguration({
      pair: 'BTCUSDT',
      sourceDurationSeconds: 30,
      durationSeconds: 31,
      reason: 'Change duration',
      idempotencyKey: 'binary-duration-edit',
    }, 'admin-1')).rejects.toThrow('Binary duration records cannot be moved');
    expect(d1.getBinaryConfiguration).not.toHaveBeenCalled();
  });
});
