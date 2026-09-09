import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthenticatedRequest } from "./auth.types";
import {
  DisableMfaDto,
  GenerateBackupCodesDto,
  SecurityPasswordChangeDto,
  SetupMfaDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
  VerifyMfaDto,
  WalletChallengeDto,
  WalletVerifyDto,
} from "./auth.dto";
import { AuthRateLimit } from "./auth-rate-limit.decorator";
import { AuthRateLimitGuard } from "./auth-rate-limit.guard";
import { AuthSurfaceGuard } from "./auth-surface.guard";
import { RequireAuthSurface } from "./auth-surface.decorator";
import { WalletAuthService } from "./wallet-auth.service";
import type { Response } from "express";

const PUBLIC_REFRESH_COOKIE = "nexi_public_refresh";
const PUBLIC_REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function readPublicRefreshCookie(request: { headers?: { cookie?: string | string[] } }): string | null {
  const header = request.headers?.cookie;
  const value = Array.isArray(header) ? header.join(";") : header;
  if (!value) return null;
  const encoded = value.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${PUBLIC_REFRESH_COOKIE}=`))?.slice(PUBLIC_REFRESH_COOKIE.length + 1);
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function publicSessionPayload(session: { refresh_token?: string; [key: string]: unknown }) {
  const { refresh_token: _refreshToken, ...payload } = session;
  return payload;
}

function setPublicRefreshCookie(response: Response, refreshToken: unknown) {
  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw new UnauthorizedException("Public session refresh token is unavailable");
  }
  response.cookie(PUBLIC_REFRESH_COOKIE, refreshToken, PUBLIC_REFRESH_COOKIE_OPTIONS);
}

function clearPublicRefreshCookie(response: Response) {
  response.clearCookie(PUBLIC_REFRESH_COOKIE, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private walletAuthService?: WalletAuthService,
  ) {}

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
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!this.walletAuthService)
      throw new ServiceUnavailableException(
        "Wallet authentication is unavailable",
      );
    const session = await this.walletAuthService.verifyChallenge(body, {
      userAgent: request.headers?.["user-agent"],
      ip: request.ip,
    });
    setPublicRefreshCookie(response, session.refresh_token);
    return publicSessionPayload(session);
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
  async refresh(@Request() request: { headers?: { cookie?: string | string[] } }, @Res({ passthrough: true }) response: Response) {
    const refreshToken = readPublicRefreshCookie(request);
    if (!refreshToken) throw new UnauthorizedException("Public refresh cookie is missing");
    const session = await this.authService.refresh(refreshToken, "PUBLIC");
    setPublicRefreshCookie(response, session.refresh_token);
    return publicSessionPayload(session);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async logout(@Request() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      return await this.authService.logout(request.user);
    } finally {
      clearPublicRefreshCookie(response);
    }
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async logoutAll(@Request() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      return await this.authService.logoutAll(request.user);
    } finally {
      clearPublicRefreshCookie(response);
    }
  }

  @Post("security/password/change")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async changeSecurityPassword(@Request() request: AuthenticatedRequest, @Body() body: SecurityPasswordChangeDto) {
    await this.authService.changeSecurityPassword(request.user.userId, body.currentSecurityPassword, body.newSecurityPassword);
    return { changed: true };
  }

  @Post("security/mfa/setup")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async setupMfa(@Request() request: AuthenticatedRequest, @Body() body: SetupMfaDto) {
    return this.authService.setupMfa(request.user.userId, body.label);
  }

  @Post("security/mfa/verify")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async verifyMfa(@Request() request: AuthenticatedRequest, @Body() body: VerifyMfaDto) {
    return this.authService.verifyMfaSetup(request.user.userId, body.token);
  }

  @Post("security/mfa/disable")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async disableMfa(@Request() request: AuthenticatedRequest, @Body() body: DisableMfaDto) {
    return this.authService.disableMfa(request.user.userId, body.securityPassword, body.token);
  }

  @Post("security/mfa/backup-codes")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async generateBackupCodes(@Request() request: AuthenticatedRequest, @Body() _body: GenerateBackupCodesDto) {
    return this.authService.generateBackupCodes(request.user.userId);
  }

  @Get("security/mfa/status")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async mfaStatus(@Request() request: AuthenticatedRequest) {
    return this.authService.getMfaState(request.user.userId);
  }

  @Get("security/status")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async securityStatus(@Request() request: AuthenticatedRequest) {
    return this.authService.getSecurityState(request.user.userId);
  }

  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
