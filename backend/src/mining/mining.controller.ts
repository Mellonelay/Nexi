import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { DevelopmentOnlyGuard } from "../auth/development-only.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { OwnershipGuard } from "../auth/ownership.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { MiningService } from "./mining.service";
import {
  CreateMiningPlanRequestDto,
  MiningSubscribeDto,
  MiningSubscriptionActionDto,
} from "./mining.dto";

@ApiTags("Mining")
@Controller("mining")
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

  @Get("plans")
  async getPlans() {
    return this.miningService.getPlans();
  }

  @ApiBearerAuth()
  @Get("summary")
  @ApiOkResponse({
    description: "The authenticated user's mining subscription and reward totals.",
    schema: {
      type: "object",
      required: ["activeSubscriptions", "totalSubscriptions", "lockedPrincipal", "accruedRewards", "postedRewards"],
      properties: {
        activeSubscriptions: { type: "integer" },
        totalSubscriptions: { type: "integer" },
        lockedPrincipal: { type: "string" },
        accruedRewards: { type: "string" },
        postedRewards: { type: "string" },
      },
    },
  })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getSummary(@Req() request: AuthenticatedRequest) {
    return this.miningService.getSummary(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("rewards/:userId")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface("PUBLIC")
  async getRewards(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.getRewardHistory(request.user.userId);
  }

  @ApiBearerAuth()
  @Post("subscribe")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async subscribe(
    @Body() body: MiningSubscribeDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.subscribe(
      request.user.userId,
      body.planId,
      body.amount,
      body.idempotencyKey,
    );
  }

  @ApiBearerAuth()
  @Get("my/:userId")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface("PUBLIC")
  async getMySubs(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.getUserSubscriptions(request.user.userId);
  }

  @ApiBearerAuth()
  @Post("redeem")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async redeem(
    @Body() body: MiningSubscriptionActionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.redeemForUser(
      request.user.userId,
      body.subscriptionId,
      body.idempotencyKey,
    );
  }

  @ApiBearerAuth()
  @Post("cancel")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async cancel(
    @Body() body: MiningSubscriptionActionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.cancel(
      request.user.userId,
      body.subscriptionId,
      body.idempotencyKey,
    );
  }

  // Admin: Create Plan
  @ApiBearerAuth()
  @Post("admin/plan")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async createPlan(
    @Body() body: CreateMiningPlanRequestDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.createPlan({
      name: body.name,
      dailyYield: body.dailyYield,
      lockupPeriod: body.lockupPeriod,
      minDeposit: body.min,
      maxDeposit: body.max,
      currency: body.currency ?? "USDT",
      adminContext: {
        adminId: request.user.userId,
        reason: body.reason,
        idempotencyKey: body.idempotencyKey,
      },
    });
  }

  // Dev: Force Yield Distribution
  @ApiBearerAuth()
  @Post("admin/distribute")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, DevelopmentOnlyGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async forceDistribute() {
    return this.miningService.distributeRewards();
  }
}
