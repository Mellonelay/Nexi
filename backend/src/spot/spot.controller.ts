import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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
  @ApiQuery({ name: "pair", required: true, type: String })
  @ApiOkResponse({
    description: "Recent trades executed by NEXI's internal spot matcher for the requested pair.",
    schema: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "pair", "price", "amount", "executedAt", "side", "source"],
        properties: {
          id: { type: "string" },
          pair: { type: "string" },
          price: { type: "string" },
          amount: { type: "string" },
          executedAt: { type: "string", format: "date-time" },
          side: { type: "string", enum: ["MATCHED"] },
          source: { type: "string", enum: ["nexi-internal-spot"] },
        },
      },
    },
  })
  async getMarketTrades(@Query("pair") pair: string) {
    return this.spotService.getMarketTrades(pair);
  }

  @ApiBearerAuth()
  @Get("orders/open")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getOpenOrders(@Req() request: AuthenticatedRequest) {
    return this.spotService.getOpenOrders(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("orders/history")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getOrderHistory(@Req() request: AuthenticatedRequest) {
    return this.spotService.getOrderHistory(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("trades/history")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getTradeHistory(@Req() request: AuthenticatedRequest) {
    return this.spotService.getTradeHistory(request.user.userId);
  }
}
