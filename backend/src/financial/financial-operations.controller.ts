import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { AuthService } from "../auth/auth.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { FinancialOperationsService } from "./financial-operations.service";
import {
  DepositClaimDto,
  DepositProofAuthorizationDto,
  DepositProofIntentDto,
  Gate2ConversionAcceptDto,
  Gate2ConversionQuoteDto,
  Gate2TransferDto,
  Gate2WithdrawalDto,
  Gate2WithdrawalReviewDto,
  Gate2WithdrawalSettleDto,
} from "./financial-operations.dto";

@ApiTags("Financial Operations")
@Controller("financial")
export class FinancialOperationsController {
  constructor(
    private readonly financial: FinancialOperationsService,
    private readonly authService: AuthService,
  ) {}

  @Post("withdrawals")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async requestWithdrawal(
    @Body() body: Gate2WithdrawalDto,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.authService.verifySensitiveAction(
      request.user.userId,
      body.securityPassword,
      body.mfaToken,
    );
    return this.financial.requestWithdrawal(request.user.userId, {
      asset: body.asset,
      network: body.network,
      address: body.address,
      amount: body.amount,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post("transfers")
  @UseGuards(JwtAuthGuard)
  transfer(
    @Body() body: Gate2TransferDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.transfer(request.user.userId, body);
  }

  @Post("conversion/quote")
  @UseGuards(JwtAuthGuard)
  quote(
    @Body() body: Gate2ConversionQuoteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.createConversionQuote(request.user.userId, body);
  }

  @Post("conversion/accept")
  @UseGuards(JwtAuthGuard)
  accept(
    @Body() body: Gate2ConversionAcceptDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.acceptConversion(
      request.user.userId,
      body.quoteId,
      body.acceptanceKey,
    );
  }

  @Get("deposits")
  @UseGuards(JwtAuthGuard)
  deposits(@Req() request: AuthenticatedRequest) {
    return this.financial.getDeposits(request.user.userId);
  }

  @Get("deposit-destinations")
  getDepositDestinations() {
    return this.financial.getDepositDestinations();
  }

  @Post("deposit-proof-intents")
  @UseGuards(JwtAuthGuard)
  createDepositProofIntent(
    @Body() body: DepositProofIntentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.createDepositProofIntent(
      request.user.userId,
      body.contentType,
      body.byteSize,
    );
  }

  @Post("deposit-proof-upload/authorize")
  @UseGuards(JwtAuthGuard)
  authorizeDepositProofUpload(
    @Body() body: DepositProofAuthorizationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.authorizeDepositProofUpload(
      request.user.userId,
      body.key,
    );
  }

  @Post("deposit-claims")
  @UseGuards(JwtAuthGuard)
  submitDepositClaim(
    @Body() body: DepositClaimDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.submitDepositClaim(request.user.userId, body);
  }

  @Get("deposit-claims")
  @UseGuards(JwtAuthGuard)
  getDepositClaims(@Req() request: AuthenticatedRequest) {
    return this.financial.getDepositClaims(request.user.userId);
  }

  @Get("withdrawals")
  @UseGuards(JwtAuthGuard)
  withdrawals(@Req() request: AuthenticatedRequest) {
    return this.financial.getWithdrawals(request.user.userId);
  }

  @Get("transfers")
  @UseGuards(JwtAuthGuard)
  transfers(@Req() request: AuthenticatedRequest) {
    return this.financial.getTransfers(request.user.userId);
  }

  @Post("admin/withdrawals/approve")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  approve(
    @Body() body: Gate2WithdrawalReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.approveWithdrawal(
      body.withdrawalId,
      body.reason,
      request.user.userId,
    );
  }

  @Post("admin/withdrawals/reject")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  reject(
    @Body() body: Gate2WithdrawalReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.rejectWithdrawal(
      body.withdrawalId,
      body.reason,
      request.user.userId,
    );
  }

  @Post("admin/withdrawals/settle")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  settle(
    @Body() body: Gate2WithdrawalSettleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.settleWithdrawal(
      body.withdrawalId,
      body.providerReceipt,
      request.user.userId,
      body.reason,
    );
  }
}
