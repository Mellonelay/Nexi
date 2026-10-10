import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { MarginService } from "./margin.service";
import {
  CloseMarginPositionDto,
  LiquidateMarginPositionDto,
  MarginTransferDto,
  OpenMarginPositionDto,
  RepayUnmatchedMarginBorrowDto,
} from "./margin.dto";

@ApiTags("Margin Trading")
@Controller("spot/margin")
export class MarginController {
  constructor(private readonly marginService: MarginService) {}

  @Get("quote")
  getQuote(@Query("pair") pair: string) {
    return this.marginService.getQuote(pair);
  }

  @Get("positions")
  @UseGuards(JwtAuthGuard)
  listPositions(@Req() request: AuthenticatedRequest) {
    return this.marginService.listPositions(request.user.userId);
  }

  @Post("positions")
  @UseGuards(JwtAuthGuard)
  openPosition(
    @Body() body: OpenMarginPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.openPosition(request.user.userId, body);
  }

  @Post("positions/:positionId/close")
  @UseGuards(JwtAuthGuard)
  closePosition(
    @Param("positionId") positionId: string,
    @Body() body: CloseMarginPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.closePosition(
      request.user.userId,
      positionId,
      body.idempotencyKey,
    );
  }

  @Post("positions/mark")
  @UseGuards(JwtAuthGuard)
  markPosition(
    @Body("positionId") positionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.markPosition(request.user.userId, positionId);
  }

  @Post("positions/:positionId/liquidate")
  @UseGuards(JwtAuthGuard)
  liquidatePosition(
    @Param("positionId") positionId: string,
    @Body() body: LiquidateMarginPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.liquidatePosition(
      request.user.userId,
      positionId,
      body.idempotencyKey,
    );
  }

  @Post("transfer")
  @UseGuards(JwtAuthGuard)
  transfer(
    @Body() body: MarginTransferDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.transfer(request.user.userId, body);
  }

  @Post("borrows/orphan/repay")
  @UseGuards(JwtAuthGuard)
  repayUnmatchedBorrow(
    @Body() body: RepayUnmatchedMarginBorrowDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.repayUnmatchedBorrow(
      request.user.userId,
      body.openIdempotencyKey,
    );
  }

  @Get("activity")
  @UseGuards(JwtAuthGuard)
  history(@Req() request: AuthenticatedRequest, @Query("take") take?: string) {
    const parsedTake = take === undefined ? undefined : Number(take);
    return this.marginService.history(request.user.userId, parsedTake ?? 50);
  }
}
