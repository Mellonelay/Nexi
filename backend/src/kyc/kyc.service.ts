import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService, @Optional() private readonly d1?: D1FinancialCommandGateway) {}

  // Submit KYC
  async submitKyc(userId: string, data: { firstName: string; lastName: string; dob: string; country: string; documentType: string; documentUrl: string }) {
    if (this.d1?.isEnabled()) return this.d1.submitKyc({ userId, ...data });
    const existing = await this.prisma.kYC.findUnique({ where: { userId } });
    if (existing) {
      if (existing.status === 'APPROVED') throw new BadRequestException('KYC already approved');
      if (existing.status === 'PENDING') throw new BadRequestException('KYC already pending');
      
      // Update if rejected or not submitted (though findUnique covers it)
      return this.prisma.kYC.update({
        where: { userId },
        data: {
          ...data,
          status: 'PENDING',
          dob: new Date(data.dob)
        },
      });
    }

    return this.prisma.kYC.create({
      data: {
        userId,
        ...data,
        dob: new Date(data.dob)
        status: 'PENDING',
      },
    });
  }

  // Get KYC Status
  async getKycStatus(userId: string) {
    if (this.d1?.isEnabled()) return (await this.d1.getKyc(userId)) ?? { status: 'NOT_SUBMITTED' };
    const kyc = await this.prisma.kYC.findUnique({ where: { userId } });
    if (!kyc) return { status: 'NOT_SUBMITTED' };
    return kyc;
  }

  // Admin: Approve KYC
  async approveKyc(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.updateKycState(userId, 'APPROVED');
    return this.prisma.kYC.update({
      where: { userId },
      data: { status: 'APPROVED' },
    });
  }

  // Admin: Reject KYC
  async rejectKyc(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.updateKycState(userId, 'REJECTED');
    return this.prisma.kYC.update({
      where: { userId },
      data: { status: 'REJECTED' },
    });
  }
}
