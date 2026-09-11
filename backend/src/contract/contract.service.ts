import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LedgerType } from '../prisma/d1-client';

@Injectable()
export class ContractService {
  private readonly logger = new Logger(ContractService.name);

  constructor(
    private prisma: any,
    private walletService: WalletService,
  ) {}

  // Open a Contract Position (Futures)
  // Matches /lever/deal
  async openPosition(userId: string, symbol: string, side: 'BUY' | 'SELL', amount: number, leverage: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (leverage < 1) throw new BadRequestException('Invalid leverage');

    // 1. Get Current Price (Mock for now)
    const entryPrice = await this.getCurrentPrice(symbol);

    // 2. Lock Funds (Margin)
    // We treat 'lever' wallet as just 'USDT' for now, or we could use 'lever_USDT' if we wanted strict separation.
    // Based on findings, we stick to USDT main wallet but mark ledger as CONTRACT.
    await this.walletService.lockFunds(userId, 'USDT', amount);

    // 3. Calculate Liquidation Price
    // Long: Entry * (1 - 1/Leverage) ? No, that's simple version.
    // Liq Price = Entry - (Margin / Share) ?
    // Share = (Amount * Leverage) / Entry
    // Liq Price (Long) = Entry - (Amount / Share) = Entry - (Amount / ((Amount * Lev)/Entry)) = Entry - (Entry/Lev) = Entry * (1 - 1/Lev)
    // Roughly correct for isolated margin.
    
    let liquidationPrice = 0;
    if (side === 'BUY') {
      liquidationPrice = entryPrice * (1 - 1 / leverage);
    } else {
      liquidationPrice = entryPrice * (1 + 1 / leverage);
    }

    // 4. Create Position
    const position = await this.prisma.contractPosition.create({
      data: {
        userId,
        symbol,
        side,
        amount,
        leverage,
        entryPrice,
        liquidationPrice,
        status: 'OPEN',
        marginMode: 'ISOLATED' 
      }
    });

    return position;
  }

  // Set TP/SL
  // Matches /lever/setstop
  async setStop(userId: string, positionId: string, tpPrice: number, slPrice: number) {
    const position = await this.prisma.contractPosition.findUnique({ where: { id: positionId } });
    if (!position || position.userId !== userId) throw new BadRequestException('Position not found');
    if (position.status !== 'OPEN') throw new BadRequestException('Position is not open');

    // Validate TP/SL Logic (Basic)
    if (position.side === 'BUY') {
      if (tpPrice > 0 && tpPrice <= position.entryPrice) throw new BadRequestException('TP must be higher than entry for Long');
      if (slPrice > 0 && slPrice >= position.entryPrice) throw new BadRequestException('SL must be lower than entry for Long');
    } else {
      if (tpPrice > 0 && tpPrice >= position.entryPrice) throw new BadRequestException('TP must be lower than entry for Short');
      if (slPrice > 0 && slPrice <= position.entryPrice) throw new BadRequestException('SL must be higher than entry for Short');
    }

    return this.prisma.contractPosition.update({
      where: { id: positionId },
      data: { tpPrice, slPrice }
    });
  }

  // Close Position
  // Matches /lever/close
  async closePosition(userId: string, positionId: string) {
    const position = await this.prisma.contractPosition.findUnique({ where: { id: positionId } });
    if (!position || position.userId !== userId) throw new BadRequestException('Position not found');
    if (position.status !== 'OPEN') throw new BadRequestException('Position is not open');

    const closePrice = await this.getCurrentPrice(position.symbol);
    
    // Calculate PnL
    // Formula: ((Close - Entry) * Share * Lev) ? No, Share * Lev is misleading.
    // Standard Formula: Value = Margin * Leverage.
    // Share (Units) = Value / Entry.
    // PnL = (Close - Entry) * Share * Direction
    // PnL = (Close - Entry) * (Margin * Lev / Entry) * (1 or -1)
    
    const value = position.amount * position.leverage;
    const share = value / position.entryPrice;
    
    let pnl = 0;
    if (position.side === 'BUY') {
      pnl = (closePrice - position.entryPrice) * share;
    } else {
      pnl = (position.entryPrice - closePrice) * share;
    }

    // Settlement
    // Total Payout = Margin + PnL
    // If PnL is negative (loss), payout < Margin.
    // If PnL < -Margin, then it's liquidation (Payout = 0).
    
    let totalPayout = position.amount + pnl;
    if (totalPayout < 0) totalPayout = 0; // Bankruptcy protection

    // Unlock Funds
    await this.walletService.resolveLockedFunds(
      userId,
      'USDT',
      position.amount,
      totalPayout,
      LedgerType.TRADE_SPOT, // Should add TRADE_CONTRACT type, but reusing SPOT or generic for now
      `CONTRACT-CLOSE-${position.id}`
    );

    return this.prisma.contractPosition.update({
      where: { id: positionId },
      data: {
        status: 'CLOSED',
        currentPrice: closePrice,
        pnl,
      }
    });
  }

  // Get My Trades
  // Matches /lever/my_trade
  async getMyTrades(userId: string, status: string = 'OPEN') {
    return this.prisma.contractPosition.findMany({
      where: { 
        userId,
        status: status === 'history' ? { in: ['CLOSED', 'LIQUIDATED'] } : 'OPEN'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    throw new Error(`Authoritative market price unavailable for ${symbol}`);
  }
}
