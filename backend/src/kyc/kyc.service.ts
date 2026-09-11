import { Injectable } from '@nestjs/common';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

@Injectable()
export class KycService {
  constructor(private readonly d1: D1FinancialCommandGateway) {}

  // Submit KYC
  async submitKyc(userId: string, data: { firstName: string; lastName: string; dob: string; country: string; documentType: string; documentUrl: string }) {
    return this.d1.submitKyc({ userId, ...data });
  }

  // Get KYC Status
  async getKycStatus(userId: string) {
    return (await this.d1.getKyc(userId)) ?? { status: 'NOT_SUBMITTED' };
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
