import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { OwnershipGuard } from "../auth/ownership.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { LoanService } from "./loans.service";
import {
  ApplyLoanDto,
  LoanLegacyAdminDecisionDto,
  LoanRepaymentDto,
} from "./loans.dto";

@ApiTags("Loans")
@Controller("loans")
export class LoansController {
  constructor(private readonly loanService: LoanService) {}

  @Get("plans")
  async getPlans() {
    return this.loanService.getActiveLoanPlans();
  }

  @ApiBearerAuth()
  @Post("apply")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async apply(
    @Body() body: ApplyLoanDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.loanService.applyForLoan(
      request.user.userId,
      body.amount,
      body.duration,
      body.collateralImg,
      body.collateral,
      body.idempotencyKey,
      body.planId,
    );
  }

  @ApiBearerAuth()
  @Get("my/:userId")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface("PUBLIC")
  async getMyLoans(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.loanService.getUserLoans(request.user.userId);
  }

  // Admin Endpoints
  @ApiBearerAuth()
  @Get("admin/all")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }

  @ApiBearerAuth()
  @Post("admin/approve")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async approve(
    @Body() body: LoanLegacyAdminDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.loanService.approveLoan(body.loanId, body.idempotencyKey, {
      adminId: request.user.userId,
      reason: body.reason,
    });
  }

  @ApiBearerAuth()
  @Post("admin/reject")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async reject(
    @Body() body: LoanLegacyAdminDecisionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.loanService.rejectLoan(body.loanId, body.idempotencyKey, {
      adminId: request.user.userId,
      reason: body.reason,
    });
  }

  @ApiBearerAuth()
  @Post("repay")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async repay(
    @Body() body: LoanRepaymentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.loanService.repay(
      request.user.userId,
      body.loanId,
      body.amount,
      body.idempotencyKey,
    );
  }
}
