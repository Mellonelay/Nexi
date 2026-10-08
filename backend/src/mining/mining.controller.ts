import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Headers,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { DevelopmentOnlyGuard } from "../auth/development-only.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
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

  @Get("summary")
  @UseGuards(JwtAuthGuard)
  async getSummary(@Req() request: AuthenticatedRequest) {
    return this.miningService.getSummary(request.user.userId);
  }

  @Get("rewards/:userId")
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  async getRewards(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.getRewardHistory(request.user.userId);
  }

  @Post("subscribe")
  @UseGuards(JwtAuthGuard)
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

  @Get("my/:userId")
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  async getMySubs(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.miningService.getUserSubscriptions(request.user.userId);
  }

  @Post("redeem")
  @UseGuards(JwtAuthGuard)
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

  @Post("cancel")
  @UseGuards(JwtAuthGuard)
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
  @Post("admin/plan")
  @UseGuards(JwtAuthGuard, RolesGuard)
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
  @Post("admin/distribute")
  @UseGuards(JwtAuthGuard, RolesGuard, DevelopmentOnlyGuard)
  @Roles(Role.ADMIN)
  async forceDistribute() {
    return this.miningService.distributeRewards();
  }
}
