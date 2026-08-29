import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BinaryService } from "./binary.service";
import { OpenBinaryPositionDto, SettleBinaryPositionDto } from "./binary.dto";

@ApiTags("Binary Options")
@Controller("binary")
export class BinaryController {
  constructor(private readonly binaryService: BinaryService) {}

  @Get("config")
  getConfig() {
    return this.binaryService.getConfig();
  }

  @Post("position")
  @UseGuards(JwtAuthGuard)
  openPosition(
    @Body() body: OpenBinaryPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.binaryService.openPosition(request.user.userId, body);
  }

  @Post("settle")
  @UseGuards(JwtAuthGuard)
  settlePosition(
    @Body() body: SettleBinaryPositionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.binaryService.settlePosition(
      body.positionId,
      request.user.userId,
    );
  }

  @Get("positions/current")
  @UseGuards(JwtAuthGuard)
  currentPositions(@Req() request: AuthenticatedRequest) {
    return this.binaryService.getCurrentPositions(request.user.userId);
  }

  @Get("positions/history")
  @UseGuards(JwtAuthGuard)
  history(@Req() request: AuthenticatedRequest) {
    return this.binaryService.getHistory(request.user.userId);
  }
}
