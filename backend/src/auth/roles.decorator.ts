import { SetMetadata } from '@nestjs/common';
import { Role } from '../prisma/d1-client';

export const ROLES_KEY = 'nexi:roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
