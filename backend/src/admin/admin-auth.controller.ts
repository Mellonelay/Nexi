import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
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
import { AuthenticatedRequest } from "../auth/auth.types";

@ApiTags("Admin Authentication")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
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
  @AuthRateLimit("admin-refresh")
  @UseGuards(AuthRateLimitGuard)
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken, "ADMIN");
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async logout(@Request() request: AuthenticatedRequest) {
    return this.authService.logout(request.user);
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard, AuthSurfaceGuard, RolesGuard)
  @RequireAuthSurface("ADMIN")
  @Roles(Role.ADMIN)
  async logoutAll(@Request() request: AuthenticatedRequest) {
    return this.authService.logoutAll(request.user);
  }
}
