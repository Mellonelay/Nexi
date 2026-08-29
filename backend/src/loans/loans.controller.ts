import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
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

  @Post("apply")
  @UseGuards(JwtAuthGuard)
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

  @Get("my/:userId")
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  async getMyLoans(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.loanService.getUserLoans(request.user.userId);
  }

  // Admin Endpoints
  @Get("admin/all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }

  @Post("admin/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @Post("admin/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @Post("repay")
  @UseGuards(JwtAuthGuard)
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
