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
import { ApiTags } from "@nestjs/swagger";
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

  @Get("activity")
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

  @Get("overview")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getOverview(@Req() request: AuthenticatedRequest) {
    return this.walletService.getOverview(request.user.userId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getMyWallet(@Req() request: AuthenticatedRequest) {
    return this.walletService.getAllBalances(request.user.userId);
  }

  @Get("me/ledger")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async getMyLedger(@Req() request: AuthenticatedRequest) {
    return this.walletService.getLedger(request.user.userId);
  }

  @Get(":userId")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface("PUBLIC")
  async getWallet(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.walletService.getAllBalances(request.user.userId);
  }

  @Get(":userId/ledger")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, OwnershipGuard)
  @RequireAuthSurface("PUBLIC")
  async getLedger(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.walletService.getLedger(request.user.userId);
  }

  // Admin or Dev Testing Endpoints
  @Post("deposit")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, DevelopmentOnlyGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async deposit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("withdraw")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard, DevelopmentOnlyGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async withdraw(_body: WalletTargetWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }

  // Admin Endpoints
  @Post("admin/credit")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async adminCredit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("admin/debit")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async adminDebit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Get("admin/withdrawals")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async getPendingWithdrawals() {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("admin/withdrawals/approve")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async approveWithdrawal(_body: ApproveWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("admin/withdrawals/reject")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async rejectWithdrawal(_body: RejectWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }
}
