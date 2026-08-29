import { SetMetadata } from '@nestjs/common';
import { AuthSurface } from './auth.types';

export const AUTH_SURFACE_METADATA = 'auth_surface';

export const RequireAuthSurface = (surface: AuthSurface) =>
  SetMetadata(AUTH_SURFACE_METADATA, surface);
