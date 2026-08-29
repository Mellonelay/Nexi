import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ADMIN_PERMISSION_KEY } from './admin-permission.decorator';
import { hasAdminPermission, type AdminPermission } from './admin-rbac';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { D1FinancialCommandGateway } from '../d1/d1-financial-command.gateway';

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService, @Optional() private readonly d1?: D1FinancialCommandGateway) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<AdminPermission | undefined>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (this.d1?.isEnabled()) {
      const identity = await this.d1.getAdminIdentity(request.user.userId);
      return hasAdminPermission(identity?.roleId as any, permission);
    }
    const assignment = await this.prisma.adminRoleAssignment.findUnique({ where: { userId: request.user.userId } });
    return hasAdminPermission(assignment?.roleId, permission);
  }
}
