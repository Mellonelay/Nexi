import { Role } from '@prisma/client';

export type AuthSurface = 'PUBLIC' | 'ADMIN';

export interface JwtPayload {
  sub: string;
  email?: string | null;
  role: Role;
  surface?: AuthSurface;
  sid?: string;
  jti?: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
  role: Role;
  surface?: AuthSurface;
  sessionId?: string;
}

export interface LoginUser {
  id: string;
  publicId?: string;
  email: string | null;
  role: Role;
  kycStatus?: string;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
}
