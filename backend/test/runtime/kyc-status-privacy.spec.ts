import { KycService } from '../../src/kyc/kyc.service';

describe('KycService status privacy', () => {
  it('returns the owner status without identity fields or document locator', async () => {
    const d1 = {
      getKyc: jest.fn().mockResolvedValue({
        id: 'kyc-1',
        status: 'PENDING',
        firstName: 'Test',
        lastName: 'User',
        dob: '1990-01-01',
        documentType: 'PASSPORT',
        documentUrl: 'https://private.example/document.png',
        createdAt: '2026-10-11T00:00:00.000Z',
        updatedAt: '2026-10-11T00:01:00.000Z',
      }),
    };
    const service = new KycService(d1 as never);

    await expect(service.getKycStatus('user-1')).resolves.toEqual({
      status: 'PENDING',
      submittedAt: '2026-10-11T00:00:00.000Z',
      updatedAt: '2026-10-11T00:01:00.000Z',
    });
    expect(d1.getKyc).toHaveBeenCalledWith('user-1');
  });

  it('keeps the not-submitted contract minimal', async () => {
    const service = new KycService({ getKyc: jest.fn().mockResolvedValue(null) } as never);
    await expect(service.getKycStatus('user-1')).resolves.toEqual({ status: 'NOT_SUBMITTED' });
  });
});
