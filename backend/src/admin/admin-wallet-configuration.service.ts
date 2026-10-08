import { Inject, Injectable } from "@nestjs/common";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";
import { D1PrismaService } from "../d1/d1-prisma.service";

@Injectable()
export class AdminWalletConfigurationService {
  constructor(
    @Inject(D1PrismaService) private readonly prisma: any,
    private readonly d1: D1FinancialCommandGateway,
  ) {}

  async createCurrency(data: any, adminId: string) {
    const { reason, idempotencyKey, ...currency } = data;
    if (this.d1?.isEnabled()) {
      return this.d1.createAdminCurrency({
        ...currency,
        adminId,
        reason,
        idempotencyKey,
      });
    }
    return this.prisma.$transaction(async (tx: any) => {
      const created = await tx.currency.create({ data: currency });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "CURRENCY_CREATED",
          target: String(created.id),
          details: { reason, idempotencyKey, symbol: created.symbol },
        },
      });
      return created;
    });
  }

  async getWalletNetworks() {
    if (this.d1?.isEnabled()) return this.d1.listAdminWalletNetworks();
    return this.prisma.walletNetwork.findMany({
      include: { currency: true },
      orderBy: [{ currencyId: "asc" }, { code: "asc" }],
    });
  }

  async createWalletNetwork(
    input: {
      currencyId: number;
      code: string;
      name: string;
      notice?: string;
      instructions?: string;
      reason: string;
      idempotencyKey: string;
    },
    adminId: string,
  ) {
    if (this.d1?.isEnabled()) {
      return this.d1.createAdminWalletNetwork({ ...input, adminId });
    }
    return this.prisma.$transaction(async (tx: any) => {
      const created = await tx.walletNetwork.create({
        data: {
          currencyId: input.currencyId,
          code: input.code.trim().toUpperCase(),
          name: input.name.trim(),
          notice: input.notice,
          instructions: input.instructions,
          isActive: false,
          depositEnabled: false,
          withdrawEnabled: false,
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "WALLET_NETWORK_CREATED",
          target: created.id,
          details: {
            reason: input.reason,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      return created;
    });
  }

  async updateWalletNetwork(
    id: string,
    input: {
      name?: string;
      isActive?: boolean;
      depositEnabled?: boolean;
      withdrawEnabled?: boolean;
      notice?: string;
      instructions?: string;
      reason: string;
      idempotencyKey: string;
    },
    adminId: string,
  ) {
    const { reason, idempotencyKey, ...patch } = input;
    if (this.d1?.isEnabled()) {
      return this.d1.updateAdminWalletNetwork({
        id,
        patch,
        adminId,
        reason,
        idempotencyKey,
      });
    }
    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.walletNetwork.update({
        where: { id },
        data: patch,
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "WALLET_NETWORK_UPDATED",
          target: id,
          details: { reason, idempotencyKey, fields: Object.keys(patch) },
        },
      });
      return updated;
    });
  }

  async setDepositAddressState(
    id: string,
    input: {
      isActive: boolean;
      reason: string;
      idempotencyKey: string;
    },
    adminId: string,
  ) {
    if (this.d1?.isEnabled()) {
      return this.d1.updateAdminDepositAddressState({ id, ...input, adminId });
    }
    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.depositAddress.update({
        where: { id },
        data: { isActive: input.isActive },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: input.isActive
            ? "DEPOSIT_ADDRESS_ENABLED"
            : "DEPOSIT_ADDRESS_DISABLED",
          target: id,
          details: { reason: input.reason, idempotencyKey: input.idempotencyKey },
        },
      });
      return updated;
    });
  }
}
