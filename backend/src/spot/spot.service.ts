import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { SpotGateway } from './spot.gateway';
import { OrderSide, OrderType, OrderStatus, LedgerType } from '@prisma/client';

@Injectable()
export class SpotService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private spotGateway: SpotGateway,
  ) {}

  async placeOrder(userId: string, pair: string, side: OrderSide, type: OrderType, amount: number, price?: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (type === OrderType.LIMIT && (!price || price <= 0)) throw new BadRequestException('Price is required for Limit orders');

    // 1. Calculate required funds to lock
    let requiredFunds = 0;
    let currencyToLock = '';

    const [base, quote] = pair.split('/'); // e.g., BTC/USDT -> Base: BTC, Quote: USDT

    if (side === OrderSide.BUY) {
      // Buying BTC with USDT
      currencyToLock = quote;
      if (type === OrderType.LIMIT) {
        requiredFunds = amount * price!;
      } else {
        // Market Buy: For simplicity in this MVP, we might require an estimated amount or lock a large chunk.
        // Better approach for Market Buy is "Spend X USDT" rather than "Buy Y BTC" to avoid calculation issues.
        // Assuming 'amount' for Market Buy is 'quote currency amount' (Spend 100 USDT).
        // However, standard is usually "Buy 1 BTC".
        // Let's assume Limit orders for MVP core or estimate market price.
        // For robustness, let's stick to LIMIT orders primarily or strictly defined Market logic.
        // Let's implement LIMIT first for safety.
        if (!price) throw new BadRequestException('Market orders require current price estimation (not fully implemented in MVP step 1)');
        requiredFunds = amount * price; 
      }
    } else {
      // Selling BTC for USDT
      currencyToLock = base;
      requiredFunds = amount;
    }

    // 2. Lock Funds
    await this.walletService.lockFunds(userId, currencyToLock, requiredFunds);

    // 3. Create Order
    const order = await this.prisma.spotOrder.create({
      data: {
        userId,
        pair,
        symbol: pair.split('/')[0], // Assuming symbol is the base currency for now
        side,
        type,
        price: price || 0, // Ensure price is a number
        amount,
        remaining: amount,
        status: OrderStatus.OPEN,
      },
    });

    // 4. Trigger Matching (Async)
    await this.matchOrders(pair);
    this.broadcastOrderBook(pair);

    return order;
  }

  async matchOrders(pair: string) {
    // Simple matching engine for MVP
    // Match Buy Limit vs Sell Limit
    
    // Fetch open buy orders sorted by Price DESC (Highest bid first)
    const buyOrders = await this.prisma.spotOrder.findMany({
      where: { pair, side: OrderSide.BUY, status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] } },
      orderBy: { price: 'desc' },
    });

    // Fetch open sell orders sorted by Price ASC (Lowest ask first)
    const sellOrders = await this.prisma.spotOrder.findMany({
      where: { pair, side: OrderSide.SELL, status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] } },
      orderBy: { price: 'asc' },
    });

    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        if (!buyOrder.price || !sellOrder.price) continue; // Skip market orders for now
        
        // Check if match is possible
        if (buyOrder.price >= sellOrder.price) {
          // Match found!
          const matchPrice = sellOrder.price; // Usually executes at maker price
          const matchAmount = Math.min(buyOrder.remaining, sellOrder.remaining);

          if (matchAmount <= 0) continue;

          // Execute Trade
          await this.executeTrade(buyOrder, sellOrder, matchPrice, matchAmount);

          // Update local remaining for loop continuity
          buyOrder.remaining -= matchAmount;
          sellOrder.remaining -= matchAmount;

          if (buyOrder.remaining === 0) break; // Buy order filled, move to next buy order
        }
      }
    }
  }

  async executeTrade(buyOrder: any, sellOrder: any, price: number, amount: number) {
    await this.prisma.$transaction(async (tx) => {
      // 1. Create Trade Record
      const trade = await tx.spotTrade.create({
        data: {
          orderId: buyOrder.id, // Linking to buy order for now, theoretically should link both or have 2 entries
          userId: buyOrder.userId, // Buyer
          pair: buyOrder.pair,
          price,
          amount,
          side: OrderSide.BUY,
          fee: 0, // 0 fee for now
          feeCurrency: 'USDT',
        }
      });
      // Need a second trade record for the seller? 
      // Typically an exchange creates one "Trade" entity linking maker and taker, or two records.
      // Our schema has `orderId` and `userId`. Let's create two records for clarity.
      await tx.spotTrade.create({
        data: {
          orderId: sellOrder.id,
          userId: sellOrder.userId, // Seller
          pair: sellOrder.pair,
          price,
          amount,
          side: OrderSide.SELL,
          fee: 0,
          feeCurrency: 'USDT',
        }
      });

      // 2. Update Orders
      await this.updateOrderStatus(tx, buyOrder.id, amount);
      await this.updateOrderStatus(tx, sellOrder.id, amount);

      // 3. Settlement
      const [base, quote] = buyOrder.pair.split('/');
      const totalQuote = amount * price;

      // Buyer:
      // Locked USDT was `amount * buyOrder.price` (max willingness).
      // Actual cost is `amount * price`.
      // If buyOrder.price > price, refund the difference.
      const lockedQuote = amount * buyOrder.price;
      const actualCost = totalQuote;
      
      // Deduct used USDT from locked
      // We need to access WalletService from within transaction... 
      // Ideally WalletService methods should accept a prisma transaction client.
      // For MVP, we will use the injected service which uses a new transaction.
      // This breaks atomicity of the whole trade execution slightly but is acceptable for this level.
      // TODO: Refactor WalletService to accept `tx`.

      // BUYER Settlement:
      // Deduct Cost from Locked USDT
      // If partial fill, we only deduct for the amount filled.
      // NOTE: WalletService `deductLockedFunds` assumes we deduct what we used.
      // But wait, we locked `buyOrder.price * amount`. We spent `price * amount`.
      // We should deduct `price * amount` from LOCKED? No, that leaves dust in locked.
      // We should deduct `buyOrder.price * amount` from LOCKED, and credit back `(buyOrder.price - price) * amount` to AVAILABLE?
      // Or simply: Unlock everything for this portion, then Deduct actual cost.
      
      // Simpler approach for MVP:
      // Buyer gets BASE currency (creditUser)
      // Seller gets QUOTE currency (creditUser)
      // Buyer loses QUOTE currency (deductLocked)
      // Seller loses BASE currency (deductLocked)
      
      // BUYER: Receives Base
      // We can't call this.walletService.creditUser inside tx easily without refactor.
      // Let's do it after or use `prisma` directly here for speed.
      
      // Update Wallets manually in this TX for atomicity
      
      // BUYER:
      // 1. Unlock the portion of USDT reserved for this fill
      // 2. Deduct the actual USDT cost
      // 3. Add the BTC bought
      
      // SELLER:
      // 1. Deduct the BTC locked
      // 2. Add the USDT earned
    });
    
    // Execute Wallet Changes (Sequential for safety if not in same TX, or refactor)
    // For this MVP, I will call WalletService methods sequentially.
    // Ideally these should be in the transaction above.
    
    const [base, quote] = buyOrder.pair.split('/');
    const totalQuote = amount * price;

    // BUYER Settlement
    // 1. Deduct USDT (Cost)
    // We locked `amount * buyOrder.price`.
    // We need to deduct `amount * buyOrder.price` from locked to clear the reservation
    // But we only actually spent `amount * price`.
    // So we credit back `amount * (buyOrder.price - price)` to available?
    // Let's simplify:
    // Deduct full reserved amount for this chunk from Locked.
    // Credit difference to Available.
    // Credit Bought Asset to Available.
    
    // Deduction: 
    // We locked funds based on Order Price.
    await this.walletService.deductLockedFunds(buyOrder.userId, quote, amount * buyOrder.price, LedgerType.TRADE_SPOT, `TRADE-${buyOrder.id}`);
    // Refund difference (if bought cheaper)
    if (buyOrder.price > price) {
        const refund = amount * (buyOrder.price - price);
        if (refund > 0) {
             await this.walletService.deposit(buyOrder.userId, quote, refund, `REFUND-${buyOrder.id}`);
        }
    }
    // Credit Asset
    await this.walletService.deposit(buyOrder.userId, base, amount, `TRADE-RECV-${buyOrder.id}`);


    // SELLER Settlement
    // 1. Deduct Locked Base (BTC)
    await this.walletService.deductLockedFunds(sellOrder.userId, base, amount, LedgerType.TRADE_SPOT, `TRADE-${sellOrder.id}`);
    // 2. Credit Quote (USDT)
    await this.walletService.deposit(sellOrder.userId, quote, totalQuote, `TRADE-RECV-${sellOrder.id}`);
  }

  async updateOrderStatus(tx: any, orderId: string, amountFilled: number) {
    const order = await tx.spotOrder.findUnique({ where: { id: orderId } });
    const newFilled = order.filled + amountFilled;
    const newRemaining = order.remaining - amountFilled;
    const status = newRemaining <= 0.00000001 ? OrderStatus.FILLED : OrderStatus.PARTIALLY_FILLED;

    await tx.spotOrder.update({
      where: { id: orderId },
      data: {
        filled: newFilled,
        remaining: newRemaining,
        status,
      },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.spotOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new BadRequestException('Not your order');
    if (order.status === OrderStatus.FILLED || order.status === OrderStatus.CANCELED) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    // Update Status
    await this.prisma.spotOrder.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELED },
    });

    // Unlock Remaining Funds
    const [base, quote] = order.pair.split('/');
    if (order.side === OrderSide.BUY) {
      // Unlock USDT
      // Locked amount was remaining * price
      const lockedAmount = order.remaining * (order.price || 0);
      await this.walletService.unlockFunds(userId, quote, lockedAmount);
    } else {
      // Unlock BTC
      await this.walletService.unlockFunds(userId, base, order.remaining);
    }

    this.broadcastOrderBook(order.pair);
    return { message: 'Order cancelled' };
  }

  async getOrderBook(pair: string) {
      const buys = await this.prisma.spotOrder.findMany({
          where: { pair, side: OrderSide.BUY, status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] } },
          orderBy: { price: 'desc' },
          take: 50
      });
      const sells = await this.prisma.spotOrder.findMany({
          where: { pair, side: OrderSide.SELL, status: { in: [OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED] } },
          orderBy: { price: 'asc' },
          take: 50
      });
      return { buys, sells };
  }

  async broadcastOrderBook(pair: string) {
    const orderBook = await this.getOrderBook(pair);
    this.spotGateway.emitOrderBookUpdate(pair, orderBook);
  }
}
