import { SetMetadata } from '@nestjs/common';
import type { AdminPermission } from './admin-rbac';

export const ADMIN_PERMISSION_KEY = 'nexi:admin-permission';
export const RequireAdminPermission = (permission: AdminPermission) => SetMetadata(ADMIN_PERMISSION_KEY, permission);
