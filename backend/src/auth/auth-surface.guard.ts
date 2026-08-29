import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_SURFACE_METADATA } from './auth-surface.decorator';
import { AuthSurface, AuthenticatedUser } from './auth.types';

interface SurfaceRequest {
  readonly user?: AuthenticatedUser;
}

@Injectable()
export class AuthSurfaceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredSurface = this.reflector.getAllAndOverride<AuthSurface>(AUTH_SURFACE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    const user = context.switchToHttp().getRequest<SurfaceRequest>().user;
    if (!user?.surface) {
      throw new UnauthorizedException('Authentication surface is missing');
    }
    if (requiredSurface && user.surface !== requiredSurface) {
      throw new ForbiddenException('Authentication surface is not authorized');
    }
    return true;
  }
}
