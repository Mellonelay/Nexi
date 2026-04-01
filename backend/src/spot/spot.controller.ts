import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { SpotService } from './spot.service';
import { OrderSide, OrderType } from '@prisma/client';

@Controller('spot')
export class SpotController {
  constructor(private readonly spotService: SpotService) {}

  @Post('order')
  async placeOrder(@Body() body: { userId: string; pair: string; side: OrderSide; type: OrderType; amount: number; price?: number }) {
    return this.spotService.placeOrder(body.userId, body.pair, body.side, body.type, body.amount, body.price);
  }

  @Post('cancel')
  async cancelOrder(@Body() body: { userId: string; orderId: string }) {
    return this.spotService.cancelOrder(body.userId, body.orderId);
  }

  @Get('orderbook')
  async getOrderBook(@Query('pair') pair: string) {
    return this.spotService.getOrderBook(pair);
  }
}
