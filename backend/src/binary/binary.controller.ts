import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { BinaryService } from "./binary.service";
import { OpenBinaryPositionDto, SettleBinaryPositionDto } from "./binary.dto";

@ApiTags("Binary Options")
@Controller("binary")
export class BinaryController {
  constructor(private readonly binaryService: BinaryService) {}

  @Get("config")
  @ApiOkResponse({
    description: "Available Binary durations and their persisted configuration values.",
    schema: {
      type: "object",
      required: ["durations", "configurations"],
      properties: {
        durations: { type: "array", items: { type: "integer" } },
        configurations: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "pair", "durationSeconds", "payoutRate", "lossRate", "minStake", "maxStake", "settlementDelaySeconds", "version", "enabled", "createdAt", "updatedAt"],
            properties: {
              id: { type: "string" },
              pair: { type: "string" },
              durationSeconds: { type: "integer" },
              payoutRate: { type: "string" },
              lossRate: { type: "string" },
              minStake: { type: "string" },
              maxStake: { type: "string" },
              settlementDelaySeconds: { type: "integer" },
              version: { type: "integer" },
              enabled: { type: "integer", enum: [0, 1] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  })
  getConfig() {
    return this.binaryService.getConfig();
  }

  @ApiBearerAuth()
  @Post("position")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  openPosition(
    @Body() body: OpenBinaryPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.binaryService.openPosition(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Post("settle")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  settlePosition(
    @Body() body: SettleBinaryPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.binaryService.settlePosition(
      body.positionId,
      request.user.userId,
    );
  }

  @ApiBearerAuth()
  @Get("positions/current")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  currentPositions(@Req() request: AuthenticatedRequest) {
    return this.binaryService.getCurrentPositions(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("positions/history")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  history(@Req() request: AuthenticatedRequest) {
    return this.binaryService.getHistory(request.user.userId);
  }
}
