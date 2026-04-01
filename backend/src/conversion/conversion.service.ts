import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class ConversionService {
  // Mock rates for MVP. In prod, fetch from live API or DB settings.
  private rates: Record<string, number> = {
    'USDT:BTC': 0.000025, // 1 USDT = 0.000025 BTC
    'BTC:USDT': 40000,    // 1 BTC = 40000 USDT
    'USDT:ETH': 0.0005,
    'ETH:USDT': 2000,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) { }

  async getRate(from: string, to: string): Promise<number> {
    const key = `${from}:${to}`;
    return this.rates[key] || 0;
  }

  async convert(userId: string, fromCoin: string, toCoin: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const rate = await this.getRate(fromCoin, toCoin);
    if (!rate || rate === 0) throw new BadRequestException(`Conversion from ${fromCoin} to ${toCoin} not supported`);

    const receiveAmount = amount * rate;

    // Transactional Conversion
    // 1. Withdraw 'fromCoin'
    await this.walletService.withdraw(userId, fromCoin, amount, `CONVERT-OUT-${Date.now()}`);

    // 2. Deposit 'toCoin'
    await this.walletService.deposit(userId, toCoin, receiveAmount, `CONVERT-IN-${Date.now()}`);

    // 3. Log Transaction
    return this.prisma.conversionTransaction.create({
      data: {
        userId,
        fromCoin,
        toCoin,
        amount,
        rate,
        received: receiveAmount,
      },
    });
  }

  // Admin: Update Rate
  async updateRate(pair: string, newRate: number) {
    this.rates[pair] = newRate;
    return { message: `Rate for ${pair} updated to ${newRate}` };
  }
}
