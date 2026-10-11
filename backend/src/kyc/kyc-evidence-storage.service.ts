import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';

export const KYC_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
const EVIDENCE_HOST = 'http://nexi-kyc-evidence';

export type PrivateKycEvidence = {
  body: Buffer;
  contentType: string;
};

export function validateKycEvidence(body: Buffer, contentType: string): string {
  if (!Buffer.isBuffer(body) || body.length === 0) {
    throw new BadRequestException('A KYC evidence file is required');
  }
  if (body.length > KYC_EVIDENCE_MAX_BYTES) {
    throw new PayloadTooLargeException('KYC evidence exceeds the 5 MiB limit');
  }
  const normalizedType = contentType.split(';', 1)[0].trim().toLowerCase();
  const isPng = body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  const isWebp = body.length >= 12 && body.toString('ascii', 0, 4) === 'RIFF' && body.toString('ascii', 8, 12) === 'WEBP';
  const isPdf = body.length >= 5 && body.toString('ascii', 0, 5) === '%PDF-';
  const matches = (normalizedType === 'image/png' && isPng)
    || (normalizedType === 'image/jpeg' && isJpeg)
    || (normalizedType === 'image/webp' && isWebp)
    || (normalizedType === 'application/pdf' && isPdf);
  if (!matches) throw new BadRequestException('KYC evidence must be a valid PNG, JPEG, WebP, or PDF');
  return normalizedType;
}

@Injectable()
export class KycEvidenceStorageService {
  private objectUrl(key: string): string {
    const url = new URL('/objects', EVIDENCE_HOST);
    url.searchParams.set('key', key);
    return url.toString();
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch {
      throw new ServiceUnavailableException('Private KYC evidence storage is unavailable');
    }
    if (response.status === 503) {
      throw new ServiceUnavailableException('Private KYC evidence storage is not configured');
    }
    return response;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const response = await this.request(this.objectUrl(key), {
      method: 'PUT',
      headers: { 'content-type': contentType },
      body: new Uint8Array(body),
    });
    if (!response.ok) throw new ServiceUnavailableException('Private KYC evidence could not be stored');
  }

  async head(key: string): Promise<boolean> {
    const response = await this.request(this.objectUrl(key), { method: 'HEAD' });
    if (response.status === 404) return false;
    if (!response.ok) throw new ServiceUnavailableException('Private KYC evidence could not be verified');
    return true;
  }

  async get(key: string): Promise<PrivateKycEvidence | null> {
    const response = await this.request(this.objectUrl(key), { method: 'GET' });
    if (response.status === 404) return null;
    if (!response.ok) throw new ServiceUnavailableException('Private KYC evidence could not be retrieved');
    const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
    const body = Buffer.from(await response.arrayBuffer());
    validateKycEvidence(body, contentType);
    return { body, contentType };
  }
}
