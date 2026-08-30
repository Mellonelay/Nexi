import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  GoneException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "../auth/auth.types";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { DevelopmentOnlyGuard } from "../auth/development-only.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
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
@ApiBearerAuth()
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
  async getActivity(@Req() request: AuthenticatedRequest) {
    return this.walletService.getActivity(request.user.userId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  @ApiOperation({ summary: "Return balances for the authenticated wallet user." })
  async getMyWallet(@Req() request: AuthenticatedRequest) {
    return this.walletService.getAllBalances(request.user.userId);
  }

  @Get("me/ledger")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  @ApiOperation({ summary: "Return ledger history for the authenticated wallet user." })
  async getMyLedger(@Req() request: AuthenticatedRequest) {
    return this.walletService.getLedger(request.user.userId);
  }

  @Get(":userId")
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  async getWallet(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.walletService.getAllBalances(request.user.userId);
  }

  @Get(":userId/ledger")
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  async getLedger(
    @Param("userId") _userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.walletService.getLedger(request.user.userId);
  }

  @Post("deposit")
  @UseGuards(JwtAuthGuard, RolesGuard, DevelopmentOnlyGuard)
  @Roles(Role.ADMIN)
  async deposit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("withdraw")
  @UseGuards(JwtAuthGuard, RolesGuard, DevelopmentOnlyGuard)
  @Roles(Role.ADMIN)
  async withdraw(_body: WalletTargetWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("admin/credit")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminCredit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("admin/debit")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async adminDebit(_body: WalletTargetAmountDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Get("admin/withdrawals")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getPendingWithdrawals() {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("admin/withdrawals/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveWithdrawal(_body: ApproveWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }

  @Post("admin/withdrawals/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectWithdrawal(_body: RejectWithdrawalDto) {
    return this.legacyFinancialRouteDisabled();
  }
}
