import { LedgerAuthorityService } from '../../src/ledger/ledger-authority.service';

describe('LedgerAuthorityService', () => {
  const command = (idempotencyKey: string) => ({ accountId: 'account-1', asset: 'USDT', amount: '12.345678901234567890', referenceType: 'TEST', referenceId: 'ref-1', idempotencyKey });

  it('delegates exact financial commands to the D1 gateway', async () => {
    const d1: any = { isEnabled: jest.fn().mockReturnValue(true), reserve: jest.fn().mockResolvedValue({ postingId: 'posting-1', replayed: false }) };
    const service = new LedgerAuthorityService(d1);
    await expect(service.reserve(command('reserve-1'))).resolves.toEqual({ postingId: 'posting-1', replayed: false });
    expect(d1.reserve).toHaveBeenCalledWith(command('reserve-1'));
  });

  it('preserves D1 replay results', async () => {
    const d1: any = { isEnabled: jest.fn().mockReturnValue(true), reserve: jest.fn().mockResolvedValueOnce({ replayed: false }).mockResolvedValueOnce({ replayed: true }) };
    const service = new LedgerAuthorityService(d1);
    await expect(service.reserve(command('reserve-1'))).resolves.toMatchObject({ replayed: false });
    await expect(service.reserve(command('reserve-1'))).resolves.toMatchObject({ replayed: true });
  });

  it('fails closed when D1 is unavailable', async () => {
    const d1: any = { isEnabled: jest.fn().mockReturnValue(false), reserve: jest.fn() };
    expect(() => new LedgerAuthorityService(d1).reserve(command('reserve-2'))).toThrow('D1 financial authority unavailable');
    expect(d1.reserve).not.toHaveBeenCalled();
  });

  it('rejects ORM transaction mixing before reaching D1', async () => {
    const d1: any = { isEnabled: jest.fn().mockReturnValue(true), reserve: jest.fn() };
    expect(() => new LedgerAuthorityService(d1).reserve(command('d1-boundary-1'), {})).toThrow('D1 financial commands cannot participate in ORM transactions');
    expect(d1.reserve).not.toHaveBeenCalled();
  });
});
