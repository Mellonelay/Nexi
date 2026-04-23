import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerType, WithdrawalStatus, Prisma } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) { }

  // Initialize wallet for a new user
  async createWallet(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.wallet.create({
      data: {
        userId,
        balances: {}, // Initialize empty JSON object
      },
    });
  }

  // Get user balance for a specific currency
  async getBalance(userId: string, currency: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const balances = wallet.balances as Record<string, { available: number; locked: number }>;
    return balances[currency] || { available: 0, locked: 0 };
  }

  // Get all balances
  async getAllBalances(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet.balances;
  }

  // Get Supported Currencies
  async getSupportedCurrencies() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
      select: { symbol: true, name: true, logo: true, minDeposit: true }
    });
  }

  // Deposit funds (Admin or Simulated)
  async deposit(userId: string, currency: string, amount: number, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const action = async (transaction: Prisma.TransactionClient) => {
      const wallet = await transaction.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balances = wallet.balances as Record<string, { available: number; locked: number }>;
      const current = balances[currency] || { available: 0, locked: 0 };

      // Update balance
      current.available += amount;
      balances[currency] = current;

      // Update wallet
      await transaction.wallet.update({
        where: { userId },
        data: { balances },
      });

      // Create Ledger Entry
      await transaction.ledger.create({
        data: {
          walletId: wallet.id,
          currency,
          amount,
          type: LedgerType.DEPOSIT,
          referenceId: referenceId || `DEP-${Date.now()}`,
        },
      });

      return balances[currency];
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  // Withdraw funds
  async withdraw(userId: string, currency: string, amount: number, referenceId?: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const action = async (transaction: Prisma.TransactionClient) => {
      const wallet = await transaction.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balances = wallet.balances as Record<string, { available: number; locked: number }>;
      const current = balances[currency] || { available: 0, locked: 0 };

      if (current.available < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // Update balance
      current.available -= amount;
      balances[currency] = current;

      await transaction.wallet.update({
        where: { userId },
        data: { balances },
      });

      // Create Ledger Entry
      await transaction.ledger.create({
        data: {
          walletId: wallet.id,
          currency,
          amount: -amount, // Negative for withdrawal
          type: LedgerType.WITHDRAWAL,
          referenceId: referenceId || `WTH-${Date.now()}`,
        },
      });

      return balances[currency];
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  // Lock funds (for trading)
  async lockFunds(userId: string, currency: string, amount: number, tx?: Prisma.TransactionClient) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const action = async (transaction: Prisma.TransactionClient) => {
      const wallet = await transaction.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      // 1. Handle Main Balance (for USDT/Demo trading mostly)
      if (currency === 'USDT' || currency === 'DEMO') {
        if (wallet.balance < amount) {
          throw new BadRequestException('Insufficient main balance');
        }
        await transaction.wallet.update({
          where: { userId },
          data: {
            balance: { decrement: amount },
            frozenBalance: { increment: amount }
          }
        });
      }

      // 2. Handle Multi-Asset JSON Balances
      const balances = wallet.balances as Record<string, { available: number; locked: number }>;
      const current = balances[currency] || { available: 0, locked: 0 };

      // If using specific asset wallet (not main USDT)
      if (currency !== 'USDT' && currency !== 'DEMO') {
        if (current.available < amount) {
          throw new BadRequestException(`Insufficient ${currency} funds`);
        }
        current.available -= amount;
        current.locked += amount;
        balances[currency] = current;

        await transaction.wallet.update({
          where: { userId },
          data: { balances },
        });
      }

      return true;
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  // Unlock funds (e.g. order cancelled)
  async unlockFunds(userId: string, currency: string, amount: number, tx?: Prisma.TransactionClient) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const action = async (transaction: Prisma.TransactionClient) => {
      const wallet = await transaction.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      // 1. Handle Main Balance (USDT)
      if (currency === 'USDT' || currency === 'DEMO') {
        if (wallet.frozenBalance < amount) {
          // Log warning?
        }
        await transaction.wallet.update({
          where: { userId },
          data: {
            frozenBalance: { decrement: amount },
            balance: { increment: amount }
          }
        });
      }
      // 2. Handle Multi-Asset
      else {
        const balances = wallet.balances as Record<string, { available: number; locked: number }>;
        const current = balances[currency] || { available: 0, locked: 0 };

        current.locked = Math.max(0, current.locked - amount);
        current.available += amount;
        balances[currency] = current;

        await transaction.wallet.update({
          where: { userId },
          data: { balances }
        });
      }
      return true;
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  // Deduct locked funds (e.g. order filled or trade lost)
  async deductLockedFunds(userId: string, currency: string, amount: number, type: LedgerType, refId: string, tx?: Prisma.TransactionClient) {
    const action = async (transaction: Prisma.TransactionClient) => {
      const wallet = await transaction.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      // 1. Handle Main Balance (USDT)
      if (currency === 'USDT' || currency === 'DEMO') {
        await transaction.wallet.update({
          where: { userId },
          data: {
            frozenBalance: { decrement: amount }
          }
        });

        await transaction.ledger.create({
          data: {
            walletId: wallet.id,
            currency,
            amount: -amount,
            type: type,
            referenceId: refId,
            status: 'CONFIRMED'
          }
        });
      }
      // 2. Handle Multi-Asset
      else {
        const balances = wallet.balances as Record<string, { available: number; locked: number }>;
        const current = balances[currency] || { available: 0, locked: 0 };

        current.locked = Math.max(0, current.locked - amount);
        balances[currency] = current;

        await transaction.wallet.update({
          where: { userId },
          data: { balances },
        });

        await transaction.ledger.create({
          data: {
            walletId: wallet.id,
            currency,
            amount: -amount,
            type: type,
            referenceId: refId,
            status: 'CONFIRMED'
          },
        });
      }

      return true;
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  // Resolve Locked Funds (Win/Loss Settlement)
  async resolveLockedFunds(userId: string, currency: string, lockedAmount: number, profitAmount: number, type: LedgerType, refId: string, tx?: Prisma.TransactionClient) {
    const action = async (transaction: Prisma.TransactionClient) => {
      const wallet = await transaction.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      // 1. Handle Main Balance (USDT)
      if (currency === 'USDT' || currency === 'DEMO') {
        await transaction.wallet.update({
          where: { userId },
          data: {
            frozenBalance: { decrement: lockedAmount },
            balance: { increment: profitAmount } // profitAmount here must be total payout
          }
        });

        // Ledger
        await transaction.ledger.create({
          data: {
            walletId: wallet.id,
            currency,
            amount: profitAmount - lockedAmount, // Net PnL for ledger
            type,
            referenceId: refId,
            status: 'CONFIRMED'
          }
        });
      }

      // 2. Handle Multi-Asset
      else {
        const balances = wallet.balances as Record<string, { available: number; locked: number }>;
        const current = balances[currency] || { available: 0, locked: 0 };

        current.locked = Math.max(0, current.locked - lockedAmount);
        current.available += profitAmount; // Add total payout

        balances[currency] = current;

        await transaction.wallet.update({
          where: { userId },
          data: { balances }
        });

        await transaction.ledger.create({
          data: {
            walletId: wallet.id,
            currency,
            amount: profitAmount - lockedAmount,
            type,
            referenceId: refId,
            status: 'CONFIRMED'
          }
        });
      }

      return true;
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  async getLedger(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.ledger.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async requestWithdrawal(userId: string, currency: string, amount: number, address: string, tx?: Prisma.TransactionClient) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const action = async (transaction: Prisma.TransactionClient) => {
      const wallet = await transaction.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balances = wallet.balances as Record<string, { available: number; locked: number }>;
      const current = balances[currency] || { available: 0, locked: 0 };

      if (current.available < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      // Lock funds
      current.available -= amount;
      current.locked += amount;
      balances[currency] = current;

      await transaction.wallet.update({
        where: { userId },
        data: { balances },
      });

      return transaction.withdrawalRequest.create({
        data: {
          userId,
          currency,
          amount,
          address,
        },
      });
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  // Admin: Get Pending Withdrawals
  async getPendingWithdrawals() {
    return this.prisma.withdrawalRequest.findMany({
      where: { status: WithdrawalStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, id: true } } }
    });
  }

  // Admin: Approve Withdrawal
  async approveWithdrawal(requestId: string, txHash: string, tx?: Prisma.TransactionClient) {
    const action = async (transaction: Prisma.TransactionClient) => {
      const request = await transaction.withdrawalRequest.findUnique({ where: { id: requestId } });
      if (!request) throw new NotFoundException('Request not found');
      if (request.status !== WithdrawalStatus.PENDING) throw new BadRequestException('Request not pending');

      // 1. Update Request Status
      await transaction.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: WithdrawalStatus.APPROVED,
          txHash
        }
      });

      // 2. Deduct Locked Funds (Finalize Withdrawal)
      // We already moved funds to 'locked' when requesting. Now we simply remove them.
      const wallet = await transaction.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const balances = wallet.balances as Record<string, { available: number; locked: number }>;
      const current = balances[request.currency] || { available: 0, locked: 0 };

      if (current.locked < request.amount) {
        // Should not happen if logic is correct, but safety check
        throw new BadRequestException('Insufficient locked funds to finalize withdrawal');
      }

      current.locked -= request.amount;
      balances[request.currency] = current;

      await transaction.wallet.update({
        where: { userId: request.userId },
        data: { balances }
      });

      // 3. Create Ledger Entry
      await transaction.ledger.create({
        data: {
          walletId: wallet.id,
          currency: request.currency,
          amount: -request.amount,
          type: LedgerType.WITHDRAWAL,
          referenceId: `WTH-Approve-${requestId}`,
          status: 'CONFIRMED'
        }
      });

      return { success: true };
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }

  // Admin: Reject Withdrawal
  async rejectWithdrawal(requestId: string, reason: string, tx?: Prisma.TransactionClient) {
    const action = async (transaction: Prisma.TransactionClient) => {
      const request = await transaction.withdrawalRequest.findUnique({ where: { id: requestId } });
      if (!request) throw new NotFoundException('Request not found');
      if (request.status !== WithdrawalStatus.PENDING) throw new BadRequestException('Request not pending');

      // 1. Update Request Status
      await transaction.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: WithdrawalStatus.REJECTED,
          // We could store reason in a note field if schema had one, but for now just status
        }
      });

      // 2. Refund Locked Funds (Move back to Available)
      const wallet = await transaction.wallet.findUnique({ where: { userId: request.userId } });
      const balances = wallet.balances as Record<string, { available: number; locked: number }>;
      const current = balances[request.currency] || { available: 0, locked: 0 };

      current.locked -= request.amount;
      current.available += request.amount;
      balances[request.currency] = current;

      await transaction.wallet.update({
        where: { userId: request.userId },
        data: { balances }
      });

      return { success: true };
    };

    return tx ? action(tx) : this.prisma.$transaction(action);
  }
}
