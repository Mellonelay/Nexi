import { Injectable, BadRequestException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { MiningStatus, LedgerType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MiningService implements OnModuleInit {
  private readonly logger = new Logger(MiningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async onModuleInit() {
    const count = await this.prisma.miningPlan.count();
    if (count === 0) {
      this.logger.log('Seeding default mining plans...');
      await this.createPlan('Basic Miner', 0.5, 7, 100, 1000);
      await this.createPlan('Pro Miner', 1.2, 30, 1000, 5000);
      await this.createPlan('Whale Miner', 2.5, 90, 5000, 50000);
    }
  }

  // Admin: Create Plan
  async createPlan(name: string, dailyYield: number, lockupPeriod: number, minDeposit: number, maxDeposit: number) {
    return this.prisma.miningPlan.create({
      data: {
        name,
        dailyYield,
        lockupPeriod,
        minDeposit,
        maxDeposit,
        currency: 'USDT',
      },
    });
  }
  
  async getPlans() {
      return this.prisma.miningPlan.findMany({ where: { isActive: true } });
  }

  // User: Subscribe
  async subscribe(userId: string, planId: string, amount: number) {
    const plan = await this.prisma.miningPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (!plan.isActive) throw new BadRequestException('Plan is inactive');
    if (amount < plan.minDeposit || amount > plan.maxDeposit) {
      throw new BadRequestException(`Amount must be between ${plan.minDeposit} and ${plan.maxDeposit}`);
    }

    // Lock Funds
    await this.walletService.lockFunds(userId, 'USDT', amount);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.lockupPeriod);

    return this.prisma.miningSubscription.create({
      data: {
        userId,
        planId,
        amount,
        startDate: new Date(),
        endDate,
        status: MiningStatus.ACTIVE,
      },
    });
  }

  // Cron: Distribute Daily Yield
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async distributeRewards() {
    this.logger.log('Starting daily yield distribution...');
    const activeSubs = await this.prisma.miningSubscription.findMany({
      where: { status: MiningStatus.ACTIVE },
      include: { plan: true },
    });

    for (const sub of activeSubs) {
      // Check if expired
      if (new Date() > sub.endDate) {
        await this.completeSubscription(sub);
        continue;
      }

      // Calculate Reward
      const reward = sub.amount * (sub.plan.dailyYield / 100);
      
      // Credit Reward to Wallet
      await this.walletService.deposit(sub.userId, 'USDT', reward, `MINING-YIELD-${sub.id}`);

      // Update Subscription Stats
      await this.prisma.miningSubscription.update({
        where: { id: sub.id },
        data: {
          totalRewards: { increment: reward },
          lastRewardPaid: new Date(),
        },
      });
    }
    this.logger.log(`Distributed rewards to ${activeSubs.length} subscriptions.`);
  }

  async completeSubscription(sub: any) {
    // Return Principal
    // The principal was locked. We need to unlock it.
    // Or better: Deduct Locked, Credit Available (like a transfer back).
    
    // Step 1: Deduct from Locked (Burn the reservation)
    await this.walletService.deductLockedFunds(sub.userId, 'USDT', sub.amount, LedgerType.MINING_REWARD, `MINING-UNLOCK-${sub.id}`);
    
    // Step 2: Credit Principal back to Available
    await this.walletService.deposit(sub.userId, 'USDT', sub.amount, `MINING-RETURN-${sub.id}`);

    await this.prisma.miningSubscription.update({
      where: { id: sub.id },
      data: { status: MiningStatus.COMPLETED },
    });
    
    this.logger.log(`Subscription ${sub.id} completed.`);
  }

  async getUserSubscriptions(userId: string) {
      return this.prisma.miningSubscription.findMany({
          where: { userId },
          include: { plan: true }
      });
  }
}
