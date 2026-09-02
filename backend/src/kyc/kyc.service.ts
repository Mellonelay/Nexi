import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { D1WorkerBridgeService } from '../d1/d1-worker-bridge.service';

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bridge: D1WorkerBridgeService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  async submitKyc(userId: string, data: { firstName: string; lastName: string; dob: string; country: string; documentType: string; documentUrl: string }) {
    if (this.d1?.isEnabled()) {
      const existing = await this.d1.getKyc(userId);
      if (existing?.status === 'APPROVED') throw new BadRequestException('KYC already approved');
      if (existing?.status === 'PENDING') throw new BadRequestException('KYC already pending');
      const kycId = String(existing?.id ?? randomUUID());
      const eventId = randomUUID();
      await this.bridge.batch([
        {
          sql: `INSERT INTO "KYC" ("id","userId","firstName","lastName","dob","country","documentType","documentUrl","status","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT("userId") DO UPDATE SET "firstName"=excluded."firstName","lastName"=excluded."lastName","dob"=excluded."dob","country"=excluded."country","documentType"=excluded."documentType","documentUrl"=excluded."documentUrl","status"='PENDING',"updatedAt"=CURRENT_TIMESTAMP`,
          params: [kycId, userId, data.firstName, data.lastName, data.dob, data.country, data.documentType, data.documentUrl],
        },
        {
          sql: `INSERT INTO "EventOutbox" ("id","idempotencyKey","aggregateType","aggregateId","eventType","eventVersion","payload","state","availableAt","attempts","createdAt","updatedAt") VALUES (?,?,?,?,?,1,?,'PENDING',CURRENT_TIMESTAMP,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
          params: [eventId, `event:kyc:submit:${userId}:${eventId}`, 'KYC', userId, 'KYC_SUBMITTED', JSON.stringify({ userId })],
        },
      ], { transactional: true });
      return this.d1.getKyc(userId);
    }

<<<<<<< HEAD
=======
  // Submit KYC
  async submitKyc(userId: string, data: { firstName: string; lastName: string; dob: string; country: string; documentType: string; documentUrl: string }) {
    if (this.d1?.isEnabled()) return this.d1.submitKyc({ userId, ...data });
>>>>>>> origin/codex/vm-dirty-recovery-20260830
    const existing = await this.prisma.kYC.findUnique({ where: { userId } });
    if (existing) {
      if (existing.status === 'APPROVED') throw new BadRequestException('KYC already approved');
      if (existing.status === 'PENDING') throw new BadRequestException('KYC already pending');
      return this.prisma.kYC.update({
        where: { userId },
<<<<<<< HEAD
        data: { ...data, dob: new Date(data.dob), status: 'PENDING' },
=======
        data: {
          ...data,
          status: 'PENDING',
          dob: new Date(data.dob)
        },
>>>>>>> origin/codex/vm-dirty-recovery-20260830
      });
    }
    return this.prisma.kYC.create({
<<<<<<< HEAD
      data: { userId, ...data, dob: new Date(data.dob), status: 'PENDING' },
=======
      data: {
        userId,
        ...data,
        dob: new Date(data.dob)
        status: 'PENDING',
      },
>>>>>>> origin/codex/vm-dirty-recovery-20260830
    });
  }

  async getKycStatus(userId: string) {
    if (this.d1?.isEnabled()) return (await this.d1.getKyc(userId)) ?? { status: 'NOT_SUBMITTED' };
    const kyc = await this.prisma.kYC.findUnique({ where: { userId } });
    return kyc ?? { status: 'NOT_SUBMITTED' };
  }

  async approveKyc(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.updateKycState(userId, 'APPROVED');
    return this.prisma.kYC.update({ where: { userId }, data: { status: 'APPROVED' } });
  }

  async rejectKyc(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.updateKycState(userId, 'REJECTED');
    return this.prisma.kYC.update({ where: { userId }, data: { status: 'REJECTED' } });
  }
}
