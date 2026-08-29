import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthenticatedRequest } from "./auth.types";
import {
  KycSubmissionDto,
  LoginDto,
  RefreshTokenDto,
  SignupDto,
  WalletChallengeDto,
  WalletVerifyDto,
} from "./auth.dto";
import { AuthRateLimit } from "./auth-rate-limit.decorator";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import { AuthSurfaceGuard } from "./auth-surface.guard";
import { RequireAuthSurface } from "./auth-surface.decorator";
import { WalletAuthService } from "./wallet-auth.service";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
    private walletAuthService?: WalletAuthService,
  ) {}

  @Post("login")
  @AuthRateLimit("login")
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() credentials: LoginDto) {
    const user = await this.authService.validateUser(credentials);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.login(user);
  }

  @Post("signup")
  @AuthRateLimit("signup")
  @UseGuards(AuthRateLimitGuard)
  async signup(@Body() data: SignupDto) {
    return this.authService.signup(data);
  }

  @Post("wallet/challenge")
  async walletChallenge(@Body() body: WalletChallengeDto) {
    if (!this.walletAuthService)
      throw new ServiceUnavailableException(
        "Wallet authentication is unavailable",
      );
    return this.walletAuthService.createChallenge(body);
  }

  @Post("wallet/verify")
  async walletVerify(
    @Body() body: WalletVerifyDto,
    @Request()
    request: { headers?: Record<string, string | undefined>; ip?: string },
  ) {
    if (!this.walletAuthService)
      throw new ServiceUnavailableException(
        "Wallet authentication is unavailable",
      );
    return this.walletAuthService.verifyChallenge(body, {
      userAgent: request.headers?.["user-agent"],
      ip: request.ip,
    });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async me(@Request() request: AuthenticatedRequest) {
    if (!this.walletAuthService)
      throw new ServiceUnavailableException(
        "Wallet authentication is unavailable",
      );
    return this.walletAuthService.getCurrentUser(request.user.userId);
  }

  @Post("refresh")
  @AuthRateLimit("refresh")
  @UseGuards(AuthRateLimitGuard)
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken, "PUBLIC");
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async logout(@Request() request: AuthenticatedRequest) {
    return this.authService.logout(request.user);
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async logoutAll(@Request() request: AuthenticatedRequest) {
    return this.authService.logoutAll(request.user);
  }

  @Post("kyc")
  @UseGuards(JwtAuthGuard)
  async submitKyc(
    @Request() request: AuthenticatedRequest,
    @Body() body: KycSubmissionDto,
  ) {
    return this.prisma.kYC.create({
      data: {
        userId: request.user.userId,
        firstName: body.firstName,
        lastName: body.lastName,
        dob: new Date(body.dob),
        country: body.country,
        documentType: body.documentType,
        documentUrl: body.documentUrl, // In real app, this is S3 URL
        status: "PENDING",
      },
    });
  }

  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
