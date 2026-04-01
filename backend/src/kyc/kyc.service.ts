import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  // Submit KYC
  async submitKyc(userId: string, data: { firstName: string; lastName: string; country: string; documentType: string; documentUrl: string }) {
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
          dob: new Date(), // Mock DOB for now as it wasn't in input
        },
      });
    }

    return this.prisma.kYC.create({
      data: {
        userId,
        ...data,
        dob: new Date(), // Mock DOB
        status: 'PENDING',
      },
    });
  }

  // Get KYC Status
  async getKycStatus(userId: string) {
    const kyc = await this.prisma.kYC.findUnique({ where: { userId } });
    if (!kyc) return { status: 'NOT_SUBMITTED' };
    return kyc;
  }

  // Admin: Approve KYC
  async approveKyc(userId: string) {
    return this.prisma.kYC.update({
      where: { userId },
      data: { status: 'APPROVED' },
    });
  }

  // Admin: Reject KYC
  async rejectKyc(userId: string) {
    return this.prisma.kYC.update({
      where: { userId },
      data: { status: 'REJECTED' },
    });
  }
}
