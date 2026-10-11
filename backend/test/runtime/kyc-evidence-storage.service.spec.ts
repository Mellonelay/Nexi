import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { validateKycEvidence } from '../../src/kyc/kyc-evidence-storage.service';

describe('KYC private evidence validation', () => {
  it.each([
    ['image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01])],
    ['image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0x01])],
    ['image/webp', Buffer.from('RIFF\x04\x00\x00\x00WEBPVP8 ')],
    ['application/pdf', Buffer.from('%PDF-1.7\n')],
  ])('accepts declared %s only when the bytes match', (contentType, bytes) => {
    expect(validateKycEvidence(bytes, contentType)).toBe(contentType);
  });

  it('rejects mismatched, unsupported, and empty evidence', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => validateKycEvidence(png, 'image/jpeg')).toThrow(BadRequestException);
    expect(() => validateKycEvidence(png, 'image/gif')).toThrow(BadRequestException);
    expect(() => validateKycEvidence(Buffer.alloc(0), 'image/png')).toThrow(BadRequestException);
  });

  it('enforces the private evidence size limit', () => {
    expect(() => validateKycEvidence(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png')).toThrow(PayloadTooLargeException);
  });
});
