import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  GoneException,
  Query,
} from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiGoneResponse, ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import type { AuthenticatedRequest } from "../auth/auth.types";
import { DevelopmentOnlyGuard } from "../auth/development-only.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { OwnershipGuard } from "../auth/ownership.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { WalletService } from "./wallet.service";
import {
  ApproveWithdrawalDto,
  RejectWithdrawalDto,
  WalletTargetAmountDto,
  WalletTargetWithdrawalDto,
  WalletActivityResponseDto,
} from "./wallet.dto";

@ApiTags("Wallet")
@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  private legacyFinancialRouteDisabled(): never {
    throw new GoneException(
      "Legacy wallet mutation route disabled; use the Gate 2 financial operations API",
    );
  }

  @Get("currencies/list")
  async getCurrencies() {
    return this.walletService.getSupportedCurrencies();
  }

  @ApiBearerAuth()
  @Get("activity")
  @ApiOkResponse({ type: WalletActivityResponseDto, description: "Ledger-backed activity rows with their related postings and pagination cursor." })
  @ApiBadRequestResponse({ description: "The activity filters or cursor are invalid." })
  @ApiQuery({ name: "limit", required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "asset", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getActivity(
    @Req() request: AuthenticatedRequest,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("type") type?: string,
    @Query("asset") asset?: string,
    @Query("status") status?: string,
  ) {
    return this.walletService.getActivity(request.user.userId, { limit, cursor, type, asset, status });
  }

  @ApiBearerAuth()
  @Get("overview")
  @ApiOkResponse({
    description: "Wallet balances grouped by asset and account scope.",
    schema: {
      type: "object",
      required: ["currencies", "assets"],
      properties: {
        currencies: { type: "array", items: { type: "string" } },
        assets: {
          type: "array",
          items: {
            type: "object",
            required: ["asset", "name", "logo", "scopes"],
            properties: {
              asset: { type: "string" },
              name: { type: "string" },
              logo: { type: "string", nullable: true },
              scopes: {
                type: "object",
                required: ["MAIN"],
                additionalProperties: {
                  type: "object",
                  required: ["available", "locked", "total", "state", "accountExists"],
                  properties: {
                    available: { type: "string" },
                    locked: { type: "string" },
                    total: { type: "string" },
                    state: { type: "string" },
                    accountExists: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getOverview(@Req() request: AuthenticatedRequest) {
    return this.walletService.getOverview(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("me")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getMyWallet(@Req() request: AuthenticatedRequest) {
    return this.walletService.getAllBalances(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("me/ledger")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  @ApiOkResponse({ description: "Ledger posting history scoped to the authenticated user.", schema: { type: "array", items: { type: "object", required: ["id", "walletId", "currency", "amount", "availableDelta", "lockedDelta", "type", "createdAt"], properties: { id: { type: "string" }, walletId: { type: "string" }, currency: { type: "string" }, amount: { type: "string" }, availableDelta: { type: "string" }, lockedDelta: { type: "string" }, type: { type: "string" }, referenceId: { type: "string", nullable: true }, idempotencyKey: { type: "string", nullable: true }, correlationId: { type: "string", nullable: true }, createdAt: { type: "string" } }, additionalProperties: true } } })
  async getMyLedger(@Req() request: AuthenticatedRequest) {
    return this.walletService.getLedger(request.user.userId);
  }

  @ApiBearerAuth()
  @Get(":userId")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface("PUBLIC")
  async getWallet(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.walletService.getAllBalances(request.user.userId);
  }

  @ApiBearerAuth()
  @Get(":userId/ledger")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface("PUBLIC")
  @ApiOkResponse({ description: "Ledger posting history scoped to the authenticated user; the path user must match the session owner.", schema: { type: "array", items: { type: "object", required: ["id", "walletId", "currency", "amount", "availableDelta", "lockedDelta", "type", "createdAt"], properties: { id: { type: "string" }, walletId: { type: "string" }, currency: { type: "string" }, amount: { type: "string" }, availableDelta: { type: "string" }, lockedDelta: { type: "string" }, type: { type: "string" }, referenceId: { type: "string", nullable: true }, idempotencyKey: { type: "string", nullable: true }, correlationId: { type: "string", nullable: true }, createdAt: { type: "string" } }, additionalProperties: true } } })
  async getLedger(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.walletService.getLedger(request.user.userId);
  }

  // Admin or Dev Testing Endpoints
  @ApiBearerAuth()
  @Post("deposit")
  @ApiGoneResponse({ description: "Legacy wallet mutations are disabled; use the Gate 2 financial operations API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, DevelopmentOnlyGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async deposit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @ApiBearerAuth()
  @Post("withdraw")
  @ApiGoneResponse({ description: "Legacy wallet mutations are disabled; use the Gate 2 financial operations API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, DevelopmentOnlyGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async withdraw(_body: WalletTargetWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }

  // Admin Endpoints
  @ApiBearerAuth()
  @Post("admin/credit")
  @ApiGoneResponse({ description: "Legacy wallet mutations are disabled; use the Gate 2 financial operations API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async adminCredit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @ApiBearerAuth()
  @Post("admin/debit")
  @ApiGoneResponse({ description: "Legacy wallet mutations are disabled; use the Gate 2 financial operations API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async adminDebit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @ApiBearerAuth()
  @Get("admin/withdrawals")
  @ApiGoneResponse({ description: "Legacy wallet withdrawals are disabled; use the Gate 2 financial operations API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async getPendingWithdrawals() {
    return this.legacyFinancialRouteDisabled();
  }

  @ApiBearerAuth()
  @Post("admin/withdrawals/approve")
  @ApiGoneResponse({ description: "Legacy wallet mutations are disabled; use the Gate 2 financial operations API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async approveWithdrawal(_body: ApproveWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @ApiBearerAuth()
  @Post("admin/withdrawals/reject")
  @ApiGoneResponse({ description: "Legacy wallet mutations are disabled; use the Gate 2 financial operations API." })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async rejectWithdrawal(_body: RejectWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }
}
