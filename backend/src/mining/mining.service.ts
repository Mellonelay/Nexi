import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { MiningStatus, Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

@Injectable()
export class MiningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerAuthorityService,
    @Optional() private readonly redis?: RedisService,
    @Optional() private readonly d1?: D1FinancialCommandGateway,
  ) {}

  private async publish(type: string, referenceId: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.redis?.isAvailable()) return;
    await this.redis.publish('nexi:b7:mining', JSON.stringify({ type, referenceId, occurredAt: new Date().toISOString(), payload }));
  }

  private decimal(value: string, label: string): Prisma.Decimal {
    let amount: Prisma.Decimal;
    try { amount = new Prisma.Decimal(value); } catch { throw new BadRequestException(`${label} must be a decimal`); }
    if (!amount.isFinite() || amount.isNegative() || amount.isZero()) throw new BadRequestException(`${label} must be positive`);
    return amount;
  }

  private legacyNumber(value: Prisma.Decimal): number {
    const numberValue = Number(value.toString());
    if (!Number.isFinite(numberValue)) throw new BadRequestException('Amount is outside legacy storage range');
    return numberValue;
  }

  private idempotentId(prefix: string, key: string): string {
    const hex = createHash('sha256').update(`${prefix}:${key}`).digest('hex').slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(parseInt(hex.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, '0')}${hex.slice(18, 20)}-${hex.slice(20)}`;
  }

  async createPlan(name: string, dailyYield: string, lockupPeriod: number, minDeposit: string, maxDeposit: string, currency = 'USDT') {
    const yieldRate = this.decimal(dailyYield, 'dailyYield');
    const min = this.decimal(minDeposit, 'minDeposit');
    const max = this.decimal(maxDeposit, 'maxDeposit');
    if (max.lt(min)) throw new BadRequestException('maxDeposit must be greater than minDeposit');
    if (this.d1?.isEnabled()) return this.d1.createMiningPlan({ id: randomUUID(), name, currency, lockupPeriod, dailyYield: yieldRate.toString(), minDeposit: min.toString(), maxDeposit: max.toString() });
    return this.prisma.miningPlan.create({
      data: { name, dailyYield: this.legacyNumber(yieldRate), dailyYieldDecimal: yieldRate.toString(), lockupPeriod, minDeposit: this.legacyNumber(min), minDepositDecimal: min.toString(), maxDeposit: this.legacyNumber(max), maxDepositDecimal: max.toString(), currency: currency.toUpperCase() },
    });
  }

  async getPlans() { return this.d1?.isEnabled() ? this.d1.listMiningPlans() : this.prisma.miningPlan.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }); }

  async subscribe(userId: string, planId: string, amountText: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const amount = this.decimal(amountText, 'amount');
    const subscriptionId = this.idempotentId(`mining:${userId}:${planId}`, idempotencyKey);
    if (this.d1?.isEnabled()) {
      const plan: any = await this.d1.getMiningPlan(planId);
      if (!plan || !plan.isActive) throw new NotFoundException('Mining plan not found');
      const min = new Prisma.Decimal(String(plan.minDepositDecimal));
      const max = new Prisma.Decimal(String(plan.maxDepositDecimal));
      if (amount.lt(min) || amount.gt(max)) throw new BadRequestException('Amount is outside plan limits');
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + Number(plan.lockupPeriod) * 86400000);
      return this.d1.subscribeMining({ subscriptionId, userId, planId, amount: amount.toString(), endDate: endDate.toISOString(), idempotencyKey, planSnapshot: { name: plan.name, currency: plan.currency, lockupPeriod: plan.lockupPeriod, dailyYield: String(plan.dailyYieldDecimal), minDeposit: min.toString(), maxDeposit: max.toString() } });
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.miningSubscription.findUnique({ where: { id: subscriptionId } });
      if (existing) return existing;
      const plan = await tx.miningPlan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) throw new NotFoundException('Mining plan not found');
      const min = new Prisma.Decimal(plan.minDepositDecimal.toString());
      const max = new Prisma.Decimal(plan.maxDepositDecimal.toString());
      if (amount.lt(min) || amount.gt(max)) throw new BadRequestException('Amount is outside plan limits');
      const account = await this.ledger.getAccountForUser(userId, plan.currency, tx);
      await this.ledger.reserve({ accountId: account.id, asset: plan.currency, amount: amount.toString(), referenceType: 'MINING_SUBSCRIPTION', referenceId: subscriptionId, idempotencyKey: `mining-reserve:${subscriptionId}`, economicGroup: subscriptionId }, tx);
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + plan.lockupPeriod * 86400000);
      const created = await tx.miningSubscription.upsert({
        where: { id: subscriptionId },
        update: {},
        create: {
          id: subscriptionId,
          userId,
          planId,
          amount: this.legacyNumber(amount),
          amountDecimal: amount.toString(),
          status: MiningStatus.ACTIVE,
          startDate,
          endDate,
          totalRewards: 0,
          totalRewardsDecimal: '0',
          // The active position keeps the exact plan terms used at entry;
          // later Admin edits affect new subscriptions only.
          planSnapshot: {
            name: plan.name,
            currency: plan.currency,
            lockupPeriod: plan.lockupPeriod,
            dailyYield: plan.dailyYieldDecimal.toString(),
            minDeposit: plan.minDepositDecimal.toString(),
            maxDeposit: plan.maxDepositDecimal.toString(),
          },
        },
      });
      return created;
    });
    await this.publish('MINING_SUBSCRIPTION_OPENED', subscriptionId, { userId, planId, amount: amount.toString() });
    return result;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async distributeRewards() {
    if (process.env.NEXI_B7_ENABLED !== 'true' || process.env.NEXI_SCHEDULER_ENABLED !== 'true') return { skipped: true };
    const owner = randomUUID();
    const lockKey = 'nexi:scheduler:mining-rewards:daily';
    if (!this.redis || !(await this.redis.tryAcquireLock(lockKey, owner, 23 * 60 * 60))) return { skipped: true, reason: 'scheduler-lock-unavailable' };
    try {
      const subscriptions = this.d1?.isEnabled()
        ? await this.d1.listMiningSubscriptionsForScheduler()
        : await this.prisma.miningSubscription.findMany({ where: { status: MiningStatus.ACTIVE }, include: { plan: true } });
      let processed = 0;
      for (const subscription of subscriptions) {
        await this.accrue(String(subscription.id));
        processed += 1;
      }
      return { processed };
    } finally {
      await this.redis.releaseLock(lockKey, owner);
    }
  }

  async accrue(subscriptionId: string) {
    if (this.d1?.isEnabled()) {
      const subscription: any = await this.d1.getMiningSubscription(subscriptionId);
      if (!subscription || String(subscription.status) !== 'ACTIVE') throw new NotFoundException('Active mining subscription not found');
      if (subscription.endDate && new Date(String(subscription.endDate)) <= new Date()) return this.d1.releaseMiningSubscription(subscriptionId, String(subscription.userId), `mature:${subscriptionId}`, 'COMPLETED');
      const result = await this.d1.accrueMiningReward(subscriptionId);
      await this.publish('MINING_REWARD_POSTED', subscriptionId, {});
      return result;
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.miningSubscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });
      if (!subscription || subscription.status !== MiningStatus.ACTIVE) throw new NotFoundException('Active mining subscription not found');
      if (subscription.endDate && subscription.endDate <= new Date()) return this.redeem(subscriptionId, true, tx);
      const principal = new Prisma.Decimal(subscription.amountDecimal.toString());
      const rate = new Prisma.Decimal(subscription.plan.dailyYieldDecimal.toString());
      const reward = principal.mul(rate);
      const account = await this.ledger.getAccountForUser(subscription.userId, subscription.plan.currency, tx);
      const idempotencyKey = `mining-reward:${subscription.id}:${subscription.lastRewardPaid?.toISOString() ?? 'initial'}`;
      const posting = await this.ledger.credit({ accountId: account.id, asset: subscription.plan.currency, amount: reward.toString(), referenceType: 'MINING_REWARD', referenceId: subscription.id, idempotencyKey, economicGroup: subscription.id }, tx);
      const activity = await tx.activity.findUnique({ where: { idempotencyKey }, select: { id: true } });
      if (!activity) throw new BadRequestException('Mining reward ledger activity was not created');
      await tx.miningRewardAccrual.upsert({
        where: { idempotencyKey },
        update: { ledgerPostingId: posting.postingId, activityId: activity.id, amount: reward.toString(), rewardedAt: new Date() },
        create: { subscriptionId: subscription.id, userId: subscription.userId, ledgerPostingId: posting.postingId, activityId: activity.id, idempotencyKey, amount: reward.toString(), currency: subscription.plan.currency },
      });
      const updated = await tx.miningSubscription.update({ where: { id: subscription.id }, data: { totalRewards: { increment: this.legacyNumber(reward) }, totalRewardsDecimal: { increment: reward.toString() }, lastRewardPaid: new Date() } });
      return updated;
    });
    await this.publish('MINING_REWARD_POSTED', subscriptionId, {});
    return result;
  }

  async redeem(subscriptionId: string, matured = false, tx?: any, idempotencyKey?: string) {
    if (!tx && this.d1?.isEnabled()) {
      const subscription: any = await this.d1.getMiningSubscription(subscriptionId);
      if (!subscription) throw new NotFoundException('Mining subscription not found');
      if (!matured && subscription.endDate && new Date(String(subscription.endDate)) > new Date()) throw new BadRequestException('Mining subscription has not matured');
      const result = await this.d1.releaseMiningSubscription(subscriptionId, String(subscription.userId), idempotencyKey?.trim() || `redeem:${subscriptionId}`, 'COMPLETED');
      await this.publish('MINING_REDEEMED', subscriptionId, {});
      return result;
    }
    const run = async (client: any) => {
      const subscription = await client.miningSubscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });
      if (!subscription) throw new NotFoundException('Mining subscription not found');
      if (subscription.status !== MiningStatus.ACTIVE) return subscription;
      if (!matured && subscription.endDate && subscription.endDate > new Date()) throw new BadRequestException('Mining subscription has not matured');
      const account = await this.ledger.getAccountForUser(subscription.userId, subscription.plan.currency, client);
      const releaseKey = idempotencyKey?.trim() ? `mining-release:${subscription.id}:${idempotencyKey}` : `mining-release:${subscription.id}`;
      await this.ledger.release({ accountId: account.id, asset: subscription.plan.currency, amount: subscription.amountDecimal.toString(), referenceType: 'MINING_REDEMPTION', referenceId: subscription.id, idempotencyKey: releaseKey, economicGroup: subscription.id }, client);
      const completed = await client.miningSubscription.update({ where: { id: subscription.id }, data: { status: MiningStatus.COMPLETED } });
      return completed;
    };
    if (tx) return run(tx);
    const result = await this.prisma.$transaction(run);
    await this.publish('MINING_REDEEMED', subscriptionId, {});
    return result;
  }

  async cancel(userId: string, subscriptionId: string, idempotencyKey?: string) {
    if (this.d1?.isEnabled()) {
      const result = await this.d1.releaseMiningSubscription(subscriptionId, userId, idempotencyKey?.trim() || `cancel:${subscriptionId}`, 'CANCELLED');
      await this.publish('MINING_CANCELLED', subscriptionId, {});
      return result;
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.miningSubscription.findUnique({ where: { id: subscriptionId }, include: { plan: true } });
      if (!subscription || subscription.userId !== userId) throw new NotFoundException('Mining subscription not found');
      if (subscription.status !== MiningStatus.ACTIVE) return subscription;
      const account = await this.ledger.getAccountForUser(userId, subscription.plan.currency, tx);
      const releaseKey = idempotencyKey?.trim() ? `mining-cancel:${subscription.id}:${idempotencyKey}` : `mining-cancel:${subscription.id}`;
      await this.ledger.release({ accountId: account.id, asset: subscription.plan.currency, amount: subscription.amountDecimal.toString(), referenceType: 'MINING_CANCELLATION', referenceId: subscription.id, idempotencyKey: releaseKey, economicGroup: subscription.id }, tx);
      const cancelled = await tx.miningSubscription.update({ where: { id: subscription.id }, data: { status: MiningStatus.CANCELLED } });
      return cancelled;
    });
    await this.publish('MINING_CANCELLED', subscriptionId, {});
    return result;
  }

  async getUserSubscriptions(userId: string) { return this.d1?.isEnabled() ? this.d1.listMiningSubscriptions(userId) : this.prisma.miningSubscription.findMany({ where: { userId }, include: { plan: true }, orderBy: { createdAt: 'desc' } }); }

  async getAllSubscriptions() {
    if (this.d1?.isEnabled()) return this.d1.listAllMiningSubscriptions();
    return this.prisma.miningSubscription.findMany({
      include: {
        plan: true,
        user: { select: { id: true, email: true } },
        accruals: { orderBy: { rewardedAt: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async redeemForUser(userId: string, subscriptionId: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const subscription: any = this.d1?.isEnabled() ? await this.d1.getMiningSubscription(subscriptionId, userId) : await this.prisma.miningSubscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription || subscription.userId !== userId) throw new NotFoundException('Mining subscription not found');
    return this.redeem(subscriptionId, false, undefined, idempotencyKey);
  }

  async getRewardHistory(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.listMiningRewards(userId);
    const rows = await this.prisma.miningRewardAccrual.findMany({
      where: { userId },
      orderBy: { rewardedAt: 'desc' },
      take: 100,
      select: { id: true, subscriptionId: true, amount: true, currency: true, rewardedAt: true },
    });
    return rows.map((row) => ({ ...row, amount: row.amount.toString() }));
  }

  async getSummary(userId: string) {
    if (this.d1?.isEnabled()) return this.d1.getMiningSummary(userId);
    const [subscriptions, rewards] = await Promise.all([
      this.prisma.miningSubscription.findMany({ where: { userId }, select: { status: true, amountDecimal: true, totalRewardsDecimal: true } }),
      this.prisma.miningRewardAccrual.aggregate({ where: { userId }, _sum: { amount: true } }),
    ]);
    const sum = (values: Prisma.Decimal[]) => values.reduce((total, value) => total.add(value), new Prisma.Decimal(0)).toString();
    return {
      activeSubscriptions: subscriptions.filter((item) => item.status === MiningStatus.ACTIVE).length,
      totalSubscriptions: subscriptions.length,
      lockedPrincipal: sum(subscriptions.filter((item) => item.status === MiningStatus.ACTIVE).map((item) => item.amountDecimal)),
      accruedRewards: sum(subscriptions.map((item) => item.totalRewardsDecimal)),
      postedRewards: (rewards._sum.amount ?? new Prisma.Decimal(0)).toString(),
    };
  }
}
