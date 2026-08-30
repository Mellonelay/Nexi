import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthenticatedRequest } from "./auth.types";
import {
  LoginDto,
  RefreshTokenDto,
  SignupDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
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

  @Patch("me")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async updateMe(@Request() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    await this.authService.updateProfile(request.user.userId, body);
    if (!this.walletAuthService) throw new ServiceUnavailableException("Wallet authentication is unavailable");
    return this.walletAuthService.getCurrentUser(request.user.userId);
  }

  @Get("preferences")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async preferences(@Request() request: AuthenticatedRequest) {
    return this.authService.getPreferences(request.user.userId);
  }

  @Patch("preferences")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async updatePreferences(@Request() request: AuthenticatedRequest, @Body() body: UpdatePreferencesDto) {
    return this.authService.updatePreferences(request.user.userId, body);
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async sessions(@Request() request: AuthenticatedRequest) {
    return this.authService.listSessions(request.user);
  }

  @Post("sessions/:sessionId/revoke")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async revokeSession(@Request() request: AuthenticatedRequest, @Param("sessionId") sessionId: string) {
    return this.authService.revokeSession(request.user, sessionId);
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

  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
