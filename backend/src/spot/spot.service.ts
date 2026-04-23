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
      await tx.spotTrade.create({
        data: {
          orderId: buyOrder.id,
          userId: buyOrder.userId, // Buyer
          pair: buyOrder.pair,
          price,
          amount,
          side: OrderSide.BUY,
          fee: 0,
          feeCurrency: 'USDT',
        }
      });
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

      // BUYER Settlement
      // 1. Deduct full reserved amount for this chunk from Locked (USDT)
      await this.walletService.deductLockedFunds(
        buyOrder.userId,
        quote,
        amount * buyOrder.price,
        LedgerType.TRADE_SPOT,
        `TRADE-${buyOrder.id}`,
        tx,
      );
      // 2. Refund difference (if bought cheaper)
      if (buyOrder.price > price) {
        const refund = amount * (buyOrder.price - price);
        if (refund > 0) {
          await this.walletService.deposit(buyOrder.userId, quote, refund, `REFUND-${buyOrder.id}`, tx);
        }
      }
      // 3. Credit Bought Asset (Base)
      await this.walletService.deposit(buyOrder.userId, base, amount, `TRADE-RECV-${buyOrder.id}`, tx);

      // SELLER Settlement
      // 1. Deduct Locked Base Asset
      await this.walletService.deductLockedFunds(
        sellOrder.userId,
        base,
        amount,
        LedgerType.TRADE_SPOT,
        `TRADE-${sellOrder.id}`,
        tx,
      );
      // 2. Credit Quote Asset (USDT) earned
      await this.walletService.deposit(sellOrder.userId, quote, totalQuote, `TRADE-RECV-${sellOrder.id}`, tx);
    });
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
