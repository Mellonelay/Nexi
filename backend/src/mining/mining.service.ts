import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../prisma/d1-client';
import { createHash, randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LedgerAuthorityService } from '../ledger/ledger-authority.service';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { RedisService } from '../redis/redis.service';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';
import { SentryCron } from '@sentry/nestjs';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class MiningService {
  constructor(
    private readonly redis: RedisService,
    private readonly d1: D1FinancialCommandGateway,
    @Optional() private readonly config: ConfigService = new ConfigService(),
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

  private nonNegativeDecimal(value: string, label: string): Prisma.Decimal {
    let amount: Prisma.Decimal;
    try { amount = new Prisma.Decimal(value); } catch { throw new BadRequestException(`${label} must be a decimal`); }
    if (!amount.isFinite() || amount.isNegative()) throw new BadRequestException(`${label} must be non-negative`);
    return amount;
  }

  private idempotentId(prefix: string, key: string): string {
    const hex = createHash('sha256').update(`${prefix}:${key}`).digest('hex').slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(parseInt(hex.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, '0')}${hex.slice(18, 20)}-${hex.slice(20)}`;
  }

  private requireD1FinancialAuthority(): D1FinancialCommandGateway {
    return this.d1;
  }

  async createPlan(input: {
    name: string;
    dailyYield: string;
    lockupPeriod: number;
    minDeposit: string;
    maxDeposit: string;
    currency: string;
    adminContext: { adminId: string; reason: string; idempotencyKey: string };
  }) {
    const yieldRate = this.nonNegativeDecimal(input.dailyYield, 'dailyYield');
    const min = this.nonNegativeDecimal(input.minDeposit, 'minDeposit');
    const max = this.nonNegativeDecimal(input.maxDeposit, 'maxDeposit');
    if ([max.lt(min), !Number.isInteger(input.lockupPeriod), input.lockupPeriod < 1].some(Boolean)) {
      throw new BadRequestException('Mining plan values are invalid');
    }
    if ([input.adminContext.adminId, input.adminContext.reason.trim(), input.adminContext.idempotencyKey.trim()].some((value) => !value)) {
      throw new BadRequestException('Mining plan audit context is required');
    }
    const d1 = this.requireD1FinancialAuthority();
    return d1.createMiningPlan({
      id: randomUUID(),
      name: input.name,
      currency: input.currency,
      lockupPeriod: input.lockupPeriod,
      dailyYield: yieldRate.toString(),
      minDeposit: min.toString(),
      maxDeposit: max.toString(),
      isActive: true,
      ...input.adminContext,
    });
  }

  async getPlans() { return this.d1.listMiningPlans(); }

  async subscribe(userId: string, planId: string, amountText: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const d1 = this.requireD1FinancialAuthority();
    const amount = this.decimal(amountText, 'amount');
    const subscriptionId = this.idempotentId(`mining:${userId}:${planId}`, idempotencyKey);
    const plan: any = await d1.getMiningPlan(planId);
    if (!plan || !plan.isActive) throw new NotFoundException('Mining plan not found');
    const min = new Prisma.Decimal(String(plan.minDepositDecimal));
    const max = new Prisma.Decimal(String(plan.maxDepositDecimal));
    if (amount.lt(min) || amount.gt(max)) throw new BadRequestException('Amount is outside plan limits');
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + Number(plan.lockupPeriod) * 86400000);
    return d1.subscribeMining({ subscriptionId, userId, planId, amount: amount.toString(), endDate: endDate.toISOString(), idempotencyKey, planSnapshot: { name: plan.name, currency: plan.currency, lockupPeriod: plan.lockupPeriod, dailyYield: String(plan.dailyYieldDecimal), minDeposit: min.toString(), maxDeposit: max.toString() } });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @SentryCron('nexi-mining-daily-rewards', {
    schedule: { type: 'crontab', value: '0 0 * * *' },
    checkinMargin: 5,
    maxRuntime: 60,
    timezone: 'UTC',
  })
  async distributeRewards() {
    if (this.config.get<string>('NEXI_SCHEDULER_ENABLED') !== 'true') return { skipped: true };
    const d1 = this.requireD1FinancialAuthority();
    const owner = randomUUID();
    const lockKey = 'nexi:scheduler:mining-rewards:daily';
    if (!this.redis || !(await this.redis.tryAcquireLock(lockKey, owner, 23 * 60 * 60))) return { skipped: true, reason: 'scheduler-lock-unavailable' };
    try {
      const subscriptions = await d1.listMiningSubscriptionsForScheduler();
      let processed = 0;
      for (const subscription of subscriptions) {
        await this.accrue(String(subscription.id));
        processed += 1;
      }
      Sentry.metrics.count('nexi.mining.rewards.processed', processed);
      return { processed };
    } finally {
      await this.redis.releaseLock(lockKey, owner);
    }
  }

  private alreadyRewardedToday(lastRewardPaid: unknown): boolean {
    return String(lastRewardPaid ?? '').slice(0, 10) >= new Date().toISOString().slice(0, 10);
  }

  async accrue(subscriptionId: string) {
    const d1 = this.requireD1FinancialAuthority();
    const subscription: any = await d1.getMiningSubscription(subscriptionId);
    if (!subscription || String(subscription.status) !== 'ACTIVE') throw new NotFoundException('Active mining subscription not found');
    if (subscription.endDate && new Date(String(subscription.endDate)) <= new Date()) return d1.releaseMiningSubscription(subscriptionId, String(subscription.userId), `mature:${subscriptionId}`, 'COMPLETED');
    if (this.alreadyRewardedToday(subscription.lastRewardPaid))
      return { ...subscription, replayed: true };
    const result = await d1.accrueMiningReward(subscriptionId);
    if (!result.replayed) await this.publish('MINING_REWARD_POSTED', subscriptionId, {});
    return result;
  }

  async redeem(subscriptionId: string, matured = false, tx?: any, idempotencyKey?: string) {
    if (tx) throw new Error('D1 mining redemption cannot use a Prisma transaction');
    const d1 = this.requireD1FinancialAuthority();
    const subscription: any = await d1.getMiningSubscription(subscriptionId);
    if (!subscription) throw new NotFoundException('Mining subscription not found');
    if (!matured && subscription.endDate && new Date(String(subscription.endDate)) > new Date()) throw new BadRequestException('Mining subscription has not matured');
    const result = await d1.releaseMiningSubscription(subscriptionId, String(subscription.userId), idempotencyKey?.trim() || `redeem:${subscriptionId}`, 'COMPLETED');
    await this.publish('MINING_REDEEMED', subscriptionId, {});
    return result;
  }

  async cancel(userId: string, subscriptionId: string, idempotencyKey?: string) {
    const d1 = this.requireD1FinancialAuthority();
    const result = await d1.releaseMiningSubscription(subscriptionId, userId, idempotencyKey?.trim() || `cancel:${subscriptionId}`, 'CANCELLED');
    await this.publish('MINING_CANCELLED', subscriptionId, {});
    return result;
  }

  async getUserSubscriptions(userId: string) { return this.d1.listMiningSubscriptions(userId); }

  async getAllSubscriptions() {
    return this.d1.listAllMiningSubscriptions();
  }

  async redeemForUser(userId: string, subscriptionId: string, idempotencyKey: string) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency key is required');
    const d1 = this.requireD1FinancialAuthority();
    const subscription: any = await d1.getMiningSubscription(subscriptionId, userId);
    if (!subscription || subscription.userId !== userId) throw new NotFoundException('Mining subscription not found');
    return this.redeem(subscriptionId, false, undefined, idempotencyKey);
  }

  async getRewardHistory(userId: string) {
    return this.d1.listMiningRewards(userId);
  }

  async getSummary(userId: string) {
    return this.d1.getMiningSummary(userId);
  }
}
