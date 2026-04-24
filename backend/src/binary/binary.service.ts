import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { BinarySide, BinaryStatus, LedgerType, User } from "@prisma/client";
import { Cron, CronExpression } from "@nestjs/schedule";
import { BinaryGateway } from "./binary.gateway";

@Injectable()
export class BinaryService {
  private readonly logger = new Logger(BinaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly binaryGateway: BinaryGateway,
  ) {}

  // Place a Binary Option Trade
  async openPosition(
    userId: string,
    pair: string,
    amount: number,
    side: BinarySide,
    duration: number,
  ) {
    if (amount <= 0) throw new BadRequestException("Invalid amount");

    // Fetch pair to check if active and get payout details
    const binaryPair = await this.prisma.binaryPair.findUnique({
      where: { symbol: pair },
    });

    if (!binaryPair || !binaryPair.isActive) {
      throw new BadRequestException("Pair is not active or does not exist");
    }

    // Determine timeframe and payout details
    // Check if real options settings exist for this pair (Defaulting currencyId 32 = USDT for now)
    // In a full implementation, we'd look up the currencyId of the user's wallet or pair.
    const realSettings = await this.prisma.optionGameSettings.findFirst({
      where: { matchId: binaryPair.id, duration: duration },
    });

    let profitRatio = 0;
    let lossRatio = 0;

    if (realSettings) {
      profitRatio = Math.floor(realSettings.payoutRate * 100);
      lossRatio = 0; // Assuming 0 loss refund if using new table
    } else {
      // Fallback to old binary_timeframes
      const timeframe = await this.prisma.binaryTimeframe.findFirst({
        where: { seconds: duration, isActive: true },
      });

      if (!timeframe) {
        throw new BadRequestException("Invalid timeframe");
      }
      profitRatio = timeframe.profitRatio;
      lossRatio = timeframe.lossRatio;
    }

    // Lock Funds
    await this.walletService.lockFunds(
      userId,
      "USDT", // Hardcoded for now, should be dynamic based on user account or pair
      amount,
    );

    // Get Entry Price
    const entryPrice = await this.getCurrentPrice(pair);
    const expiresAt = new Date(Date.now() + duration * 1000);

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
    this.binaryGateway.server
      .to(userId)
      .emit("binary_position_opened", position);

    return position;
  }

  // Get Configuration for Frontend
  async getConfig() {
    const currencies = await this.prisma.currency.findMany({
      where: { isActive: true },
    });
    const pairs = await this.prisma.binaryPair.findMany({
      where: { isActive: true },
    });
    // Fetch from Real Data Seeding Table (OptionGameSettings)
    // Default to BTC settings (currencyId: 32, matchId: 61) as seeded
    const realSettings = await this.prisma.optionGameSettings.findMany({
      where: { currencyId: 32, matchId: 61 },
      orderBy: { duration: "asc" },
    });

    let timeList: {
      seconds: number;
      profit: string;
      name: string;
      profit_ratio: number;
      loss_ratio: number;
    }[] = [];
    if (realSettings.length > 0) {
      timeList = realSettings.map((s) => ({
        seconds: s.duration,
        profit: s.payoutRate.toFixed(2),
        name: `${s.duration}s`,
        profit_ratio: Math.floor(s.payoutRate * 100), // Approx if not in DB
        loss_ratio: 0, // Default
      }));
    } else {
      // Fallback to old table
      const timeframes = await this.prisma.binaryTimeframe.findMany({
        where: { isActive: true },
        orderBy: { seconds: "asc" },
      });
      timeList = timeframes.map((t) => ({
        seconds: t.seconds,
        profit: (t.profitRatio / 100).toFixed(2),
        name: t.name,
        profit_ratio: t.profitRatio,
        loss_ratio: t.lossRatio,
      }));
    }

    // Transform to match Dexixz structure approximately
    // data: [{ name: "USDT", list: [...], times: [...] }]

    const usdt = currencies.find((c) => c.symbol === "USDT");

    // Map pairs
    const pairList = pairs.map((p) => ({
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
      logo: p.logo, // Pass logo to frontend
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
          times: timeList,
        },
      ],
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
    const user = await this.prisma.user.findUnique({
      where: { id: position.userId },
    });

    // Determine Outcome
    const status = await this.determineFinalStatus(position, closePrice, user);

    await this.processSettlement(
      position,
      status,
      closePrice,
      `BINARY-SETTLE-${position.id}`,
    );
  }

  // Admin Override Outcome
  async adminForceResult(positionId: string, outcome: "WIN" | "LOSE") {
    const position = await this.prisma.binaryOptionPosition.findUnique({
      where: { id: positionId },
    });
    if (!position || position.status !== BinaryStatus.OPEN)
      throw new BadRequestException("Invalid position");

    // Mock price to force outcome
    // If force WIN and CALL -> price = entry + 1
    // If force LOSE and CALL -> price = entry - 1
    let forcedPrice = position.entryPrice;
    if (outcome === "WIN") {
      forcedPrice =
        position.side === BinarySide.CALL
          ? position.entryPrice + 100
          : position.entryPrice - 100;
    } else {
      forcedPrice =
        position.side === BinarySide.CALL
          ? position.entryPrice - 100
          : position.entryPrice + 100;
    }

    await this.settlePositionWithPrice(position, forcedPrice);
    return { message: `Position forced to ${outcome}` };
  }

  async settlePositionWithPrice(position: any, closePrice: number) {
    const status = this.determineMarketOutcome(position, closePrice);
    await this.processSettlement(
      position,
      status,
      closePrice,
      `BINARY-SETTLE-FORCE-${position.id}`,
    );
  }

  // Helper method: Determine market outcome (Win, Loss, Draw)
  private determineMarketOutcome(
    position: any,
    closePrice: number,
  ): BinaryStatus {
    if (position.side === BinarySide.CALL) {
      if (closePrice > position.entryPrice) return BinaryStatus.WIN;
      if (closePrice === position.entryPrice) return BinaryStatus.DRAW;
    } else {
      // PUT
      if (closePrice < position.entryPrice) return BinaryStatus.WIN;
      if (closePrice === position.entryPrice) return BinaryStatus.DRAW;
    }
    return BinaryStatus.LOSS;
  }

  // Helper method: Determine final outcome considering user force and risk management
  private async determineFinalStatus(
    position: any,
    closePrice: number,
    user: User | null,
  ): Promise<BinaryStatus> {
    if (user?.forceOutcome === "ALWAYS_WIN" || user?.forceOutcome === "WIN") {
      return BinaryStatus.WIN;
    }
    if (user?.forceOutcome === "ALWAYS_LOSS" || user?.forceOutcome === "LOSS") {
      return BinaryStatus.LOSS;
    }

    const marketOutcome = this.determineMarketOutcome(position, closePrice);

    // Global Risk Management (House Edge)
    // Only apply risk logic if user would have won normally
    if (marketOutcome === BinaryStatus.WIN) {
      const pairConfig = await this.prisma.binaryPair.findUnique({
        where: { symbol: position.symbol },
      });
      const riskRatio = pairConfig?.houseWinRatio ?? 50;
      const roll = Math.random() * 100;

      if (roll < riskRatio) {
        this.logger.log(
          `Risk Management Triggered: User ${position.userId} forced loss on ${position.symbol} (Roll: ${roll.toFixed(2)} < Ratio: ${riskRatio})`,
        );
        return BinaryStatus.LOSS;
      }
    }

    return marketOutcome;
  }

  // Helper method: Process settlement financially and update DB/WS
  private async processSettlement(
    position: any,
    status: BinaryStatus,
    closePrice: number,
    ledgerDesc: string,
  ) {
    let profit = -position.amount; // Default Loss
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

    // Atomic Resolution
    await this.walletService.resolveLockedFunds(
      position.userId,
      "USDT",
      position.amount,
      totalPayout,
      LedgerType.BINARY,
      ledgerDesc,
    );

    // Update DB
    await this.prisma.binaryOptionPosition.update({
      where: { id: position.id },
      data: {
        status,
        closePrice,
        realizedProfit: profit,
      },
    });

    // Notify User via WS
    this.binaryGateway.server
      .to(position.userId)
      .emit("binary_position_closed", {
        id: position.id,
        status,
        closePrice,
        profit,
      });

    this.logger.log(`Position ${position.id} settled: ${status}`);
  }

  // Mock Price Service
  async getCurrentPrice(pair: string): Promise<number> {
    // Random price for BTC/USDT around 40000
    return 40000 + Math.random() * 100;
  }
}
