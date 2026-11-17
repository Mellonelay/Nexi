import { Inject, Injectable } from "@nestjs/common";
import { D1FinancialCommandGateway } from "../d1/d1-financial-command.gateway";
import { D1PrismaService } from "../d1/d1-prisma.service";
import { executeAdminMutation } from "./admin-mutation-replay";

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
    return executeAdminMutation(
      this.prisma,
      {
        action: "CURRENCY_CREATED",
        adminId,
        reason,
        idempotencyKey,
        payload: currency,
      },
      (tx) => tx.currency.create({ data: currency }),
      (created) => String(created.id),
      (tx, target) => tx.currency.findUnique({ where: { id: Number(target) } }),
    );
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
    const payload = {
      currencyId: input.currencyId,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      notice: input.notice,
      instructions: input.instructions,
    };
    return executeAdminMutation(
      this.prisma,
      {
        action: "WALLET_NETWORK_CREATED",
        adminId,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
        payload,
      },
      (tx) =>
        tx.walletNetwork.create({
          data: {
            ...payload,
            isActive: false,
            depositEnabled: false,
            withdrawEnabled: false,
          },
        }),
      (created) => String(created.id),
      (tx, target) => tx.walletNetwork.findUnique({ where: { id: target } }),
    );
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
    return executeAdminMutation(
      this.prisma,
      {
        action: "WALLET_NETWORK_UPDATED",
        adminId,
        reason,
        idempotencyKey,
        target: id,
        payload: patch,
      },
      (tx) => tx.walletNetwork.update({ where: { id }, data: patch }),
      (updated) => String(updated.id),
      (tx, target) => tx.walletNetwork.findUnique({ where: { id: target } }),
    );
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
    const action = input.isActive
      ? "DEPOSIT_ADDRESS_ENABLED"
      : "DEPOSIT_ADDRESS_DISABLED";
    return executeAdminMutation(
      this.prisma,
      {
        action,
        actionAliases: ["DEPOSIT_ADDRESS_ENABLED", "DEPOSIT_ADDRESS_DISABLED"],
        identityScope: "DEPOSIT_ADDRESS_STATE",
        adminId,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
        target: id,
        payload: { isActive: input.isActive },
      },
      (tx) =>
        tx.depositAddress.update({
          where: { id },
          data: { isActive: input.isActive },
        }),
      (updated) => String(updated.id),
      (tx, target) => tx.depositAddress.findUnique({ where: { id: target } }),
    );
  }
}
