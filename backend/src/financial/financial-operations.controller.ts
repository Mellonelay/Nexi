import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
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
  WalletAccountTransferDto,
  Gate2WithdrawalDto,
  Gate2WithdrawalReviewDto,
  Gate2WithdrawalSettleDto,
} from "./financial-operations.dto";

const conversionQuoteResponseSchema = {
  type: "object",
  required: ["id", "userId", "fromAsset", "toAsset", "inputAmount", "rate", "outputAmount", "provider", "source", "evidenceId", "configurationVersion", "expiresAt", "state", "quoteKey", "acceptanceKey", "conversionRef", "createdAt", "updatedAt"],
  properties: {
    id: { type: "string" }, userId: { type: "string" }, fromAsset: { type: "string" }, toAsset: { type: "string" },
    inputAmount: { type: "string" }, rate: { type: "string" }, outputAmount: { type: "string" },
    provider: { type: "string" }, source: { type: "string" }, evidenceId: { type: "string" },
    configurationVersion: { type: "integer" }, expiresAt: { type: "string", format: "date-time" },
    state: { type: "string", enum: ["OPEN", "ACCEPTED", "EXPIRED", "REJECTED"] }, quoteKey: { type: "string" },
    acceptanceKey: { type: "string", nullable: true }, conversionRef: { type: "string", nullable: true },
    createdAt: { type: "string" }, updatedAt: { type: "string" },
  },
};

@ApiTags("Financial Operations")
@Controller("financial")
export class FinancialOperationsController {
  constructor(
    private readonly financial: FinancialOperationsService,
    private readonly authService: AuthService,
  ) {}

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Post("account-transfers")
  @ApiCreatedResponse({
    description: "Ledger-backed account transfer and authoritative post-transfer balances.",
    schema: {
      type: "object",
      required: ["transfer", "balances", "postings", "replayed"],
      properties: {
        transfer: {
          type: "object",
          required: ["asset", "amount", "sourceScope", "destinationScope", "sourceAccountId", "destinationAccountId"],
          properties: {
            asset: { type: "string" }, amount: { type: "string" },
            sourceScope: { type: "string" }, destinationScope: { type: "string" },
            sourceAccountId: { type: "string" }, destinationAccountId: { type: "string" },
          },
        },
        balances: {
          type: "object",
          required: ["source", "destination"],
          properties: {
            source: { type: "object", required: ["available", "locked", "total"], properties: { available: { type: "string" }, locked: { type: "string" }, total: { type: "string" } } },
            destination: { type: "object", required: ["available", "locked", "total"], properties: { available: { type: "string" }, locked: { type: "string" }, total: { type: "string" } } },
          },
        },
        postings: {
          type: "object",
          required: ["debitPostingId", "creditPostingId", "replayed"],
          properties: { debitPostingId: { type: "string" }, creditPostingId: { type: "string" }, replayed: { type: "boolean" } },
        },
        replayed: { type: "boolean" },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid account scopes, asset, amount, or idempotency key." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  transferBetweenAccounts(
    @Body() body: WalletAccountTransferDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.transferBetweenAccounts(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Post("transfers")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  transfer(
    @Body() body: Gate2TransferDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.transfer(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Post("conversion/quote")
  @ApiCreatedResponse({
    description: "Persisted conversion quote; quoteKey retries return the same quote.",
    schema: { type: "object", required: ["quote", "replayed"], properties: { quote: conversionQuoteResponseSchema, replayed: { type: "boolean" } } },
  })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  quote(
    @Body() body: Gate2ConversionQuoteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.createConversionQuote(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Post("conversion/accept")
  @ApiCreatedResponse({
    description: "Accepted persisted quote; replayed is true only for the original acceptance key.",
    schema: {
      type: "object",
      required: ["quote", "replayed"],
      properties: {
        quote: conversionQuoteResponseSchema,
        replayed: { type: "boolean" },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Quote expired, already accepted under another key, or not eligible for acceptance." })
  @ApiNotFoundResponse({ description: "Conversion quote not found." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
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

  @ApiBearerAuth()
  @Get("deposits")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  deposits(@Req() request: AuthenticatedRequest) {
    return this.financial.getDeposits(request.user.userId);
  }

  @Get("deposit-destinations")
  getDepositDestinations() {
    return this.financial.getDepositDestinations();
  }

  @ApiBearerAuth()
  @Post("deposit-proof-intents")
  @ApiCreatedResponse({ description: "Upload intent for a private deposit proof image.", schema: { type: "object", required: ["key", "uploadPath", "contentType", "maxBytes"], properties: {
    key: { type: "string" }, uploadPath: { type: "string" }, contentType: { type: "string", enum: ["image/png", "image/jpeg", "image/webp", "image/gif"] }, maxBytes: { type: "integer", maximum: 10485760 },
  } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
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

  @ApiBearerAuth()
  @Post("deposit-proof-upload/authorize")
  @ApiCreatedResponse({ schema: { type: "object", required: ["authorized", "key"], properties: { authorized: { type: "boolean", enum: [true] }, key: { type: "string" } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  authorizeDepositProofUpload(
    @Body() body: DepositProofAuthorizationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.authorizeDepositProofUpload(
      request.user.userId,
      body.key,
    );
  }

  @ApiBearerAuth()
  @Post("deposit-claims")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  submitDepositClaim(
    @Body() body: DepositClaimDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.financial.submitDepositClaim(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Get("deposit-claims")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  getDepositClaims(@Req() request: AuthenticatedRequest) {
    return this.financial.getDepositClaims(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("withdrawals")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  withdrawals(@Req() request: AuthenticatedRequest) {
    return this.financial.getWithdrawals(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("transfers")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  transfers(@Req() request: AuthenticatedRequest) {
    return this.financial.getTransfers(request.user.userId);
  }

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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
