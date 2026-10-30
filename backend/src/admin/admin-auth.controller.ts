import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "../prisma/d1-client";
import { AuthService } from "../auth/auth.service";
import { AuthRateLimit } from "../auth/auth-rate-limit.decorator";
import { AuthRateLimitGuard } from "../auth/auth-rate-limit.guard";
import { LoginDto, RefreshTokenDto } from "../auth/auth.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthSurfaceGuard } from "../auth/auth-surface.guard";
import { RequireAuthSurface } from "../auth/auth-surface.decorator";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import type { AuthenticatedRequest } from "../auth/auth.types";

@ApiTags("Admin Authentication")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiCreatedResponse({ description: "Admin access token, authenticated identity, and optional refresh token in the JSON response.", schema: { type: "object", required: ["access_token", "user"], properties: { access_token: { type: "string" }, refresh_token: { type: "string" }, user: { type: "object", required: ["id", "email", "role", "kycStatus"], properties: { id: { type: "string" }, email: { type: "string", nullable: true }, role: { type: "string", enum: ["ADMIN"] }, kycStatus: { type: "string" } }, additionalProperties: true } } } })
  @AuthRateLimit("admin-login")
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() credentials: LoginDto) {
    const user = await this.authService.validateAdmin(credentials);
    if (!user) {
      throw new UnauthorizedException("Invalid Admin credentials");
    }
    return this.authService.login(user, "ADMIN");
  }

  @Post("refresh")
  @ApiCreatedResponse({ description: "Rotated Admin access token, refresh token, and authenticated identity in the JSON response.", schema: { type: "object", required: ["access_token", "refresh_token", "user"], properties: { access_token: { type: "string" }, refresh_token: { type: "string" }, user: { type: "object", required: ["id", "email", "role", "kycStatus"], properties: { id: { type: "string" }, email: { type: "string", nullable: true }, role: { type: "string", enum: ["ADMIN"] }, kycStatus: { type: "string" } }, additionalProperties: true } } } })
  @AuthRateLimit("admin-refresh")
  @UseGuards(AuthRateLimitGuard)
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken, "ADMIN");
  }

  @ApiBearerAuth()
  @Post("logout")
  @ApiCreatedResponse({ schema: { type: "object", required: ["revoked"], properties: { revoked: { type: "boolean" } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async logout(@Request() request: AuthenticatedRequest) {
    return this.authService.logout(request.user);
  }

  @ApiBearerAuth()
  @Post("logout-all")
  @ApiCreatedResponse({ schema: { type: "object", required: ["revokedCount"], properties: { revokedCount: { type: "integer", minimum: 0 } } } })
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async logoutAll(@Request() request: AuthenticatedRequest) {
    return this.authService.logoutAll(request.user);
  }
}
