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
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { MarginService } from "./margin.service";
import {
  CloseMarginPositionDto,
  CancelPendingMarginPositionDto,
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
  @ApiQuery({ name: "pair", required: true, type: String })
  @ApiOkResponse({
    description: "The current approved market quote and enabled leverage options for the pair.",
    schema: {
      type: "object",
      required: ["pair", "state", "price", "quoteId", "provider", "source", "observedAt", "receivedAt", "maintenanceRatio", "leverageOptions"],
      properties: {
        pair: { type: "string" },
        state: { type: "string", enum: ["LIVE"] },
        price: { type: "string" },
        quoteId: { type: "string" },
        provider: { type: "string" },
        source: { type: "string" },
        observedAt: { type: "string", format: "date-time", nullable: true },
        receivedAt: { type: "string", format: "date-time" },
        maintenanceRatio: { type: "string" },
        leverageOptions: { type: "array", items: { type: "number" } },
      },
    },
  })
  getQuote(@Query("pair") pair: string) {
    return this.marginService.getQuote(pair);
  }

  @ApiBearerAuth()
  @Get("positions")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  listPositions(@Req() request: AuthenticatedRequest) {
    return this.marginService.listPositions(request.user.userId);
  }

  @ApiBearerAuth()
  @Post("positions")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  openPosition(
    @Body() body: OpenMarginPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.openPosition(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Post("positions/:positionId/cancel-pending")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  cancelPendingPosition(
    @Param("positionId") positionId: string,
    @Body() body: CancelPendingMarginPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.cancelPendingPosition(
      request.user.userId, positionId, body.idempotencyKey,
    );
  }

  @ApiBearerAuth()
  @Post("positions/:positionId/close")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
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

  @ApiBearerAuth()
  @Post("positions/mark")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  markPosition(
    @Body("positionId") positionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.markPosition(request.user.userId, positionId);
  }

  @ApiBearerAuth()
  @Post("positions/:positionId/liquidate")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
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

  @ApiBearerAuth()
  @Post("transfer")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  @ApiCreatedResponse({ description: "Same-user transfer between MAIN and MARGIN ledger accounts; replayed requests retain the original posting identifiers.", schema: { type: "object", required: ["accountId", "debitPostingId", "creditPostingId", "replayed"], properties: { accountId: { type: "string" }, debitPostingId: { type: "string" }, creditPostingId: { type: "string" }, replayed: { type: "boolean" } } } })
  transfer(
    @Body() body: MarginTransferDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.transfer(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Post("borrows/orphan/repay")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  repayUnmatchedBorrow(
    @Body() body: RepayUnmatchedMarginBorrowDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.marginService.repayUnmatchedBorrow(
      request.user.userId,
      body.openIdempotencyKey,
    );
  }

  @ApiBearerAuth()
  @Get("activity")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  history(@Req() request: AuthenticatedRequest, @Query("take") take?: string) {
    const parsedTake = take === undefined ? undefined : Number(take);
    return this.marginService.history(request.user.userId, parsedTake ?? 50);
  }
}
