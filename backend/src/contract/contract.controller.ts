import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ContractService } from "./contract.service";
import {
  ClosePositionDto,
  ContractDealDto,
  SetStopDto,
  TradeQueryDto,
} from "./contract.dto";

@ApiTags("Leveraged Contracts")
@Controller("lever")
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @ApiBearerAuth()
  @Post("deal")
  @UseGuards(JwtAuthGuard)
  async deal(
    @Body() body: ContractDealDto,
    @Req() request: AuthenticatedRequest,
  ) {
    // Frontend sends: { currency_id, share, direction, leverage, ... }
    // Or: { symbol, side, amount, leverage }
    // We map frontend fields to service args

    // Example mapping:
    // symbol: body.symbol || "BTC/USDT"
    // side: body.direction === 'BUY' ? 'BUY' : 'SELL'
    // amount: body.amount || body.share
    // leverage: body.leverNumber

    const side = body.direction === "BUY" || body.type === 1 ? "BUY" : "SELL";

    return this.contractService.openPosition(
      request.user.userId,
      body.symbol,
      side,
      Number(body.amount),
      Number(body.leverNumber),
    );
  }

  @ApiBearerAuth()
  @Post("setstop")
  @UseGuards(JwtAuthGuard)
  async setStop(
    @Body() body: SetStopDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.contractService.setStop(
      request.user.userId,
      body.id,
      Number(body.target_profit_price),
      Number(body.stop_loss_price),
    );
  }

  @ApiBearerAuth()
  @Post("close")
  @UseGuards(JwtAuthGuard)
  async close(
    @Body() body: ClosePositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.contractService.closePosition(
      request.user.userId,
      body.positionId || body.id,
    );
  }

  @ApiBearerAuth()
  @Get("my_trade")
  @UseGuards(JwtAuthGuard)
  async myTrade(
    @Query() query: TradeQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.contractService.getMyTrades(
      request.user.userId,
      query.status, // 'history' or undefined
    );
  }
}
