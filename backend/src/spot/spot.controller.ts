import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { SpotService } from "./spot.service";
import { CancelOrderDto, PlaceOrderDto } from "./spot.dto";

@ApiTags("Spot Trading")
@Controller("spot")
export class SpotController {
  constructor(private readonly spotService: SpotService) {}

  @Post("order")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async placeOrder(
    @Body() body: PlaceOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.spotService.placeOrder(request.user.userId, {
      pair: body.pair,
      side: body.side,
      type: body.type,
      amount: body.amount,
      price: body.price,
      stopPrice: body.stopPrice,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post("cancel")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async cancelOrder(
    @Body() body: CancelOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.spotService.cancelOrder(request.user.userId, body.orderId);
  }

  @Get("orderbook")
  async getOrderBook(@Query("pair") pair: string) {
    return this.spotService.getOrderBook(pair);
  }

  @Get("market-trades")
  async getMarketTrades(@Query("pair") pair: string) {
    return this.spotService.getMarketTrades(pair);
  }

  @Get("orders/open")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getOpenOrders(@Req() request: AuthenticatedRequest) {
    return this.spotService.getOpenOrders(request.user.userId);
  }

  @Get("orders/history")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getOrderHistory(@Req() request: AuthenticatedRequest) {
    return this.spotService.getOrderHistory(request.user.userId);
  }

  @Get("trades/history")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getTradeHistory(@Req() request: AuthenticatedRequest) {
    return this.spotService.getTradeHistory(request.user.userId);
  }
}
