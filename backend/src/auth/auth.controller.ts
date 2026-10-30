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
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthenticatedRequest } from "./auth.types";
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

const publicCurrentUserSchema = {
  type: "object",
  required: ["id", "email", "displayName", "walletAddress", "chainId", "kycStatus", "referral", "vip"],
  properties: {
    id: { type: "string" },
    email: { type: "string", nullable: true },
    displayName: { type: "string", nullable: true },
    walletAddress: { type: "string", nullable: true },
    chainId: { type: "integer", nullable: true },
    kycStatus: { type: "string" },
    referral: {
      type: "object",
      nullable: true,
      required: ["referralCode", "referralCount", "totalEarnings", "referredByUserCode"],
      properties: {
        referralCode: { type: "string" },
        referralCount: { type: "integer" },
        totalEarnings: { type: "string" },
        referredByUserCode: { type: "integer", nullable: true },
      },
    },
    vip: {
      type: "object",
      nullable: true,
      required: ["level", "name", "progress", "threshold", "benefits", "evaluatedAt", "qualifiedAt"],
      properties: {
        level: { type: "integer" },
        name: { type: "string" },
        progress: { type: "string" },
        threshold: { type: "string" },
        benefits: {},
        evaluatedAt: { type: "string", format: "date-time" },
        qualifiedAt: { type: "string", format: "date-time", nullable: true },
      },
    },
  },
};

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly walletAuthService?: WalletAuthService,
  ) {}

  @Post("wallet/challenge")
  @ApiCreatedResponse({
    description: "SIWE challenge for the configured Ethereum Mainnet wallet sign-in flow.",
    schema: {
      type: "object",
      required: ["message", "nonce", "domain", "uri", "chainId", "issuedAt", "expirationTime"],
      properties: {
        message: { type: "string" }, nonce: { type: "string" }, domain: { type: "string" },
        uri: { type: "string", format: "uri" }, chainId: { type: "integer", enum: [1] },
        issuedAt: { type: "string", format: "date-time" }, expirationTime: { type: "string", format: "date-time" },
      },
    },
  })
  @AuthRateLimit("wallet-challenge")
  @UseGuards(AuthRateLimitGuard)
  async walletChallenge(@Body() body: WalletChallengeDto) {
    if (!this.walletAuthService)
      throw new ServiceUnavailableException(
        "Wallet authentication is unavailable",
      );
    return this.walletAuthService.createChallenge(body);
  }

  @Post("wallet/verify")
  @ApiCreatedResponse({
    description: "Authenticated Public session; refresh token is set in an HTTP-only cookie.",
    schema: {
      type: "object",
      required: ["access_token", "user", "profile", "metadata"],
      properties: {
        access_token: { type: "string" },
        user: { type: "object", required: ["id", "email", "role", "kycStatus"], properties: {
          id: { type: "string" }, email: { type: "string", nullable: true }, role: { type: "string" }, kycStatus: { type: "string" },
        } },
        profile: { type: "object", required: ["id", "email", "displayName", "walletAddress", "chainId", "kycStatus", "referral", "vip"], properties: {
          id: { type: "string" }, email: { type: "string", nullable: true }, displayName: { type: "string", nullable: true },
          walletAddress: { type: "string", nullable: true }, chainId: { type: "integer", nullable: true }, kycStatus: { type: "string" },
          referral: { type: "object", nullable: true, properties: { referralCode: { type: "string" }, referralCount: { type: "integer" }, totalEarnings: { type: "string" }, referredByUserCode: { type: "integer", nullable: true } } },
          vip: { type: "object", nullable: true, properties: { level: { type: "integer" }, name: { type: "string" }, progress: { type: "string" }, threshold: { type: "string" }, benefits: {}, evaluatedAt: { type: "string", format: "date-time" }, qualifiedAt: { type: "string", format: "date-time", nullable: true } } },
        } },
        metadata: { type: "object", required: ["sessionSurface"], properties: { sessionSurface: { type: "string", enum: ["PUBLIC"] } } },
      },
    },
  })
  @AuthRateLimit("wallet-verify")
  @UseGuards(AuthRateLimitGuard)
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

  @ApiBearerAuth()
  @Get("me")
  @ApiOkResponse({
    description: "The authenticated Public profile and referral/VIP summary.",
    schema: publicCurrentUserSchema,
  })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async me(@Request() request: AuthenticatedRequest) {
    if (!this.walletAuthService)
      throw new ServiceUnavailableException(
        "Wallet authentication is unavailable",
      );
    return this.walletAuthService.getCurrentUser(request.user.userId);
  }

  @ApiBearerAuth()
  @Patch("me")
  @ApiOkResponse({ description: "The updated authenticated Public profile and referral/VIP summary.", schema: publicCurrentUserSchema })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async updateMe(@Request() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    await this.authService.updateProfile(request.user.userId, body);
    if (!this.walletAuthService) throw new ServiceUnavailableException("Wallet authentication is unavailable");
    return this.walletAuthService.getCurrentUser(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("preferences")
  @ApiOkResponse({ schema: { type: "object", properties: {
    locale: { type: "string" }, timezone: { type: "string" }, theme: { type: "string" },
    notificationSettings: { type: "object", additionalProperties: { type: "boolean" }, nullable: true },
    tradingSettings: { type: "object", additionalProperties: true, nullable: true },
  } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async preferences(@Request() request: AuthenticatedRequest) {
    return this.authService.getPreferences(request.user.userId);
  }

  @ApiBearerAuth()
  @Patch("preferences")
  @ApiOkResponse({ schema: { type: "object", properties: {
    locale: { type: "string" }, timezone: { type: "string" }, theme: { type: "string" },
    notificationSettings: { type: "object", additionalProperties: { type: "boolean" }, nullable: true },
    tradingSettings: { type: "object", additionalProperties: true, nullable: true },
  } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async updatePreferences(@Request() request: AuthenticatedRequest, @Body() body: UpdatePreferencesDto) {
    return this.authService.updatePreferences(request.user.userId, body);
  }

  @ApiBearerAuth()
  @Get("sessions")
  @ApiOkResponse({ schema: { type: "array", items: { type: "object", required: ["id", "surface", "createdAt", "lastUsedAt", "absoluteExpiresAt", "idleExpiresAt", "revokedAt", "revokeReason", "userAgentHash", "ipHash"], properties: {
    id: { type: "string" }, surface: { type: "string", enum: ["PUBLIC", "ADMIN"] },
    createdAt: { type: "string", format: "date-time" }, lastUsedAt: { type: "string", format: "date-time" },
    absoluteExpiresAt: { type: "string", format: "date-time" }, idleExpiresAt: { type: "string", format: "date-time" },
    revokedAt: { type: "string", format: "date-time", nullable: true }, revokeReason: { type: "string", nullable: true },
    userAgentHash: { type: "string", nullable: true }, ipHash: { type: "string", nullable: true },
  } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async sessions(@Request() request: AuthenticatedRequest) {
    return this.authService.listSessions(request.user);
  }

  @ApiBearerAuth()
  @Post("sessions/:sessionId/revoke")
  @ApiCreatedResponse({ schema: { type: "object", required: ["revoked"], properties: { revoked: { type: "boolean" } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async revokeSession(@Request() request: AuthenticatedRequest, @Param("sessionId") sessionId: string) {
    return this.authService.revokeSession(request.user, sessionId);
  }

  @Post("refresh")
  @ApiCreatedResponse({
    description: "Rotated Public session; refresh token is set in an HTTP-only cookie.",
    schema: { type: "object", required: ["access_token", "user"], properties: {
      access_token: { type: "string" },
      user: { type: "object", required: ["id", "email", "role", "kycStatus"], properties: {
        id: { type: "string" }, email: { type: "string", nullable: true }, role: { type: "string" }, kycStatus: { type: "string" },
      } },
    } },
  })
  @AuthRateLimit("refresh")
  @UseGuards(AuthRateLimitGuard)
  async refresh(@Request() request: { headers?: { cookie?: string | string[] } }, @Res({ passthrough: true }) response: Response) {
    const refreshToken = readPublicRefreshCookie(request);
    if (!refreshToken) throw new UnauthorizedException("Public refresh cookie is missing");
    const session = await this.authService.refresh(refreshToken, "PUBLIC");
    setPublicRefreshCookie(response, session.refresh_token);
    return publicSessionPayload(session);
  }

  @ApiBearerAuth()
  @Post("logout")
  @ApiCreatedResponse({ schema: { type: "object", required: ["revoked"], properties: { revoked: { type: "boolean" } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async logout(@Request() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      return await this.authService.logout(request.user);
    } finally {
      clearPublicRefreshCookie(response);
    }
  }

  @ApiBearerAuth()
  @Post("logout-all")
  @ApiCreatedResponse({ schema: { type: "object", required: ["revokedCount"], properties: { revokedCount: { type: "integer", minimum: 0 } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async logoutAll(@Request() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    try {
      return await this.authService.logoutAll(request.user);
    } finally {
      clearPublicRefreshCookie(response);
    }
  }

  @ApiBearerAuth()
  @Post("security/password/change")
  @ApiCreatedResponse({ schema: { type: "object", required: ["changed"], properties: { changed: { type: "boolean", enum: [true] } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async changeSecurityPassword(@Request() request: AuthenticatedRequest, @Body() body: SecurityPasswordChangeDto) {
    await this.authService.changeSecurityPassword(request.user.userId, body.currentSecurityPassword, body.newSecurityPassword);
    return { changed: true };
  }

  @ApiBearerAuth()
  @Post("security/mfa/setup")
  @ApiCreatedResponse({ schema: { type: "object", required: ["secret", "uri"], properties: { secret: { type: "string" }, uri: { type: "string", format: "uri" } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async setupMfa(@Request() request: AuthenticatedRequest, @Body() body: SetupMfaDto) {
    return this.authService.setupMfa(request.user.userId, body.label);
  }

  @ApiBearerAuth()
  @Post("security/mfa/verify")
  @ApiCreatedResponse({ schema: { type: "object", required: ["enabled"], properties: { enabled: { type: "boolean", enum: [true] } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async verifyMfa(@Request() request: AuthenticatedRequest, @Body() body: VerifyMfaDto) {
    return this.authService.verifyMfaSetup(request.user.userId, body.token);
  }

  @ApiBearerAuth()
  @Post("security/mfa/disable")
  @ApiCreatedResponse({ schema: { type: "object", required: ["enabled"], properties: { enabled: { type: "boolean", enum: [false] } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async disableMfa(@Request() request: AuthenticatedRequest, @Body() body: DisableMfaDto) {
    return this.authService.disableMfa(request.user.userId, body.securityPassword, body.token);
  }

  @ApiBearerAuth()
  @Post("security/mfa/backup-codes")
  @ApiCreatedResponse({ schema: { type: "object", required: ["codes"], properties: { codes: { type: "array", minItems: 10, maxItems: 10, items: { type: "string" } } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async generateBackupCodes(@Request() request: AuthenticatedRequest, @Body() _body: GenerateBackupCodesDto) {
    return this.authService.generateBackupCodes(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("security/mfa/status")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard)
  @RequireAuthSurface("PUBLIC")
  async mfaStatus(@Request() request: AuthenticatedRequest) {
    return this.authService.getMfaState(request.user.userId);
  }

  @ApiBearerAuth()
  @Get("security/status")
  @ApiOkResponse({
    description: "The authenticated user's password and MFA security state.",
    schema: {
      type: "object",
      required: ["passwordSet", "mfa"],
      properties: {
        passwordSet: { type: "boolean" },
        mfa: {
          type: "object",
          required: ["enabled", "hasSecret", "hasBackupCodes"],
          properties: {
            enabled: { type: "boolean" },
            hasSecret: { type: "boolean" },
            hasBackupCodes: { type: "boolean" },
          },
        },
      },
    },
  })
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
