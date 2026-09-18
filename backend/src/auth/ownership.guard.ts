import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.types';

type RequestWithIdentity = AuthenticatedRequest & {
  params?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
};

/**
 * Prevents a caller from reading a different user's resource through a
 * userId route or body field. Financial commands should normally omit userId
 * from their DTO and derive it from request.user instead.
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithIdentity>();
    const authenticatedUserId = request.user?.userId;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Authentication required');
    }

    const requestedUserId = request.params?.userId ?? request.body?.userId;
    if (requestedUserId === undefined) {
      return true;
    }

    if (typeof requestedUserId !== 'string' || requestedUserId !== authenticatedUserId) {
      throw new ForbiddenException('Resource ownership violation');
    }

    return true;
  }
}
