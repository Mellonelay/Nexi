import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import {
  KycEvidenceStorageService,
  PrivateKycEvidence,
  validateKycEvidence,
} from './kyc-evidence-storage.service';

const evidenceKey = (userId: string, evidenceId: string) =>
  `kyc-evidence/${encodeURIComponent(userId)}/${evidenceId}`;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class KycService {
  constructor(
    private readonly d1: D1FinancialCommandGateway,
    @Optional() private readonly evidenceStorage?: KycEvidenceStorageService,
  ) {}

  private storage(): KycEvidenceStorageService {
    if (!this.evidenceStorage) {
      throw new ServiceUnavailableException('Private KYC evidence storage is unavailable');
    }
    return this.evidenceStorage;
  }

  async uploadEvidenceStream(userId: string, stream: AsyncIterable<Uint8Array>, contentType?: string, contentLength?: string) {
    const { PayloadTooLargeException } = await import('@nestjs/common');
    const KYC_EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;
    const normalizedType = contentType?.split(';', 1)[0].trim().toLowerCase();
    if (!normalizedType) throw new BadRequestException('KYC evidence content type is required');
    const declaredSize = Number(contentLength);
    if (Number.isFinite(declaredSize) && declaredSize > KYC_EVIDENCE_MAX_BYTES) {
      throw new PayloadTooLargeException('KYC evidence exceeds the 5 MiB limit');
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of stream) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > KYC_EVIDENCE_MAX_BYTES) throw new PayloadTooLargeException('KYC evidence exceeds the 5 MiB limit');
      chunks.push(bytes);
    }
    return this.uploadEvidence(userId, Buffer.concat(chunks, size), normalizedType);
  }

  async uploadEvidence(userId: string, body: Buffer, contentType: string) {
    const normalizedType = validateKycEvidence(body, contentType);
    const id = randomUUID();
    const key = evidenceKey(userId, id);
    await this.storage().put(key, body, normalizedType);
    return { evidenceId: id, status: 'UPLOADED' as const };
  }

  async submitKyc(userId: string, data: {
    firstName: string;
    lastName: string;
    dob: string;
    country: string;
    documentType: string;
    frontEvidenceId: string;
    backEvidenceId?: string;
  }) {
    if (!uuidPattern.test(data.frontEvidenceId) ||
        data.backEvidenceId !== undefined && !uuidPattern.test(data.backEvidenceId)) {
      throw new BadRequestException('KYC evidence identifiers are invalid');
    }
    const frontKey = evidenceKey(userId, data.frontEvidenceId);
    const backKey = data.backEvidenceId ? evidenceKey(userId, data.backEvidenceId) : null;
    if (!await this.storage().head(frontKey)) throw new BadRequestException('Front KYC evidence is unavailable');
    if (backKey && !await this.storage().head(backKey)) throw new BadRequestException('Back KYC evidence is unavailable');
    return this.d1.submitKyc({
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      country: data.country,
      documentType: data.documentType,
      documentUrl: '',
      idFront: frontKey,
      idBack: backKey,
    });
  }

  // Public status exposes lifecycle metadata only, never identity documents or their locators.
  async getKycStatus(userId: string) {
    const kyc = await this.d1.getKyc(userId);
    if (!kyc) return { status: 'NOT_SUBMITTED' };
    return {
      status: kyc.status,
      submittedAt: kyc.createdAt ?? null,
      updatedAt: kyc.updatedAt ?? null,
    };
  }

  async getAdminEvidence(userId: string, side: 'front' | 'back'): Promise<PrivateKycEvidence> {
    const kyc = await this.d1.getKyc(userId);
    const key = side === 'front' ? kyc?.idFront : kyc?.idBack;
    const ownerPrefix = `kyc-evidence/${encodeURIComponent(userId)}/`;
    if (typeof key !== 'string' || !key.startsWith(ownerPrefix)) {
      throw new NotFoundException('KYC evidence is unavailable');
    }
    const evidence = await this.storage().get(key);
    if (!evidence) throw new NotFoundException('KYC evidence is unavailable');
    return evidence;
  }

  // Admin: Approve KYC
  async approveKyc(userId: string) {
    return this.d1.updateKycState(userId, 'APPROVED');
  }

  // Admin: Reject KYC
  async rejectKyc(userId: string) {
    return this.d1.updateKycState(userId, 'REJECTED');
  }
}
