import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { D1PrismaService } from '../d1/d1-prisma.service';
import { ADMIN_PERMISSION_KEY } from './admin-permission.decorator';
import { hasAdminPermission, type AdminPermission } from './admin-rbac';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: D1PrismaService, private readonly d1: D1FinancialCommandGateway) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<AdminPermission | undefined>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const identity = this.d1?.isEnabled()
      ? await this.d1.getAdminIdentity(request.user.userId)
      : await this.prisma.user
          .findFirst({
            where: { id: request.user.userId, role: 'ADMIN' },
            select: {
              id: true,
              adminRoleAssignment: { select: { roleId: true } },
            },
          })
          .then((user) =>
            user
              ? { id: user.id, roleId: user.adminRoleAssignment?.roleId }
              : null,
          );
    return hasAdminPermission(identity?.roleId as any, permission);
  }
}
