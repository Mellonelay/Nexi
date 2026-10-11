import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KycService } from '../../src/kyc/kyc.service';
import { KYC_EVIDENCE_MAX_BYTES } from '../../src/kyc/kyc-evidence-storage.service';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function createService(record: Record<string, unknown> | null = null) {
  const d1 = {
    getKyc: jest.fn().mockResolvedValue(record),
    submitKyc: jest.fn().mockResolvedValue({ status: 'PENDING' }),
    updateKycState: jest.fn(),
  };
  const storage = {
    put: jest.fn().mockResolvedValue(undefined),
    head: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue({ body: png, contentType: 'image/png' }),
  };
  return { service: new KycService(d1 as never, storage as never), d1, storage };
}

describe('KYC private evidence lifecycle', () => {
  it('uses authenticated owner scope and a server-generated private key for uploads', async () => {
    const { service, storage } = createService();
    const result = await service.uploadEvidence('user/one', png, 'image/png');
    expect(result.status).toBe('UPLOADED');
    expect(result.evidenceId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(storage.put).toHaveBeenCalledWith(
      expect.stringMatching(/^kyc-evidence\/user%2Fone\//),
      png,
      'image/png',
    );
  });

  it('persists only server-scoped private keys and accepts evidence owned by the submitter', async () => {
    const { service, d1, storage } = createService();
    const evidenceId = 'a8edbb2f-622f-4b20-9b0a-c3523c6432d2';
    await service.submitKyc('user-1', {
      firstName: 'Ada', lastName: 'Lovelace', dob: '1815-12-10',
      country: 'GB', documentType: 'PASSPORT', frontEvidenceId: evidenceId,
    });
    expect(storage.head).toHaveBeenCalledWith(`kyc-evidence/user-1/${evidenceId}`);
    expect(d1.submitKyc).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      documentUrl: '',
      idFront: `kyc-evidence/user-1/${evidenceId}`,
      idBack: null,
    }));
  });

  it('rejects unknown and cross-user evidence identifiers before D1 persistence', async () => {
    const { service, d1, storage } = createService();
    storage.head.mockResolvedValue(false);
    await expect(service.submitKyc('user-2', {
      firstName: 'Ada', lastName: 'Lovelace', dob: '1815-12-10',
      country: 'GB', documentType: 'PASSPORT',
      frontEvidenceId: 'a8edbb2f-622f-4b20-9b0a-c3523c6432d2',
    })).rejects.toThrow(BadRequestException);
    expect(d1.submitKyc).not.toHaveBeenCalled();
    await expect(service.submitKyc('user-2', {
      firstName: 'Ada', lastName: 'Lovelace', dob: '1815-12-10',
      country: 'GB', documentType: 'PASSPORT', frontEvidenceId: 'not-a-uuid',
    })).rejects.toThrow(BadRequestException);
  });

  it('serves evidence only for the target user record and side', async () => {
    const { service, storage } = createService({
      userId: 'user-1',
      idFront: 'kyc-evidence/user-1/front-id',
      idBack: 'kyc-evidence/user-2/other-user',
    });
    await expect(service.getAdminEvidence('user-1', 'front')).resolves.toEqual({
      body: png, contentType: 'image/png',
    });
    await expect(service.getAdminEvidence('user-1', 'back')).rejects.toThrow(NotFoundException);
    expect(storage.get).toHaveBeenCalledTimes(1);
  });

  it('does not accept evidence larger than the private upload limit', async () => {
    const { service, storage } = createService();
    await expect(service.uploadEvidence('user-1', Buffer.alloc(KYC_EVIDENCE_MAX_BYTES + 1), 'image/png'))
      .rejects.toThrow();
    expect(storage.put).not.toHaveBeenCalled();
  });
});
