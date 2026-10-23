import { CommunicationsController } from '../../src/communications/communications.controller';
import { AdminPermissionGuard } from '../../src/admin/admin-permission.guard';
import { ADMIN_PERMISSION_KEY } from '../../src/admin/admin-permission.decorator';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../../src/auth/roles.guard';
import { AuthSurfaceGuard } from '../../src/auth/auth-surface.guard';
import { AUTH_SURFACE_METADATA } from '../../src/auth/auth-surface.decorator';
import { GUARDS_METADATA } from '@nestjs/common/constants';

describe('Admin message permissions', () => {
  it('requires message view permission for inbox and moderation reads', () => {
    for (const handler of [
      CommunicationsController.prototype.adminMessages,
      CommunicationsController.prototype.adminMessageModeration,
    ]) {
      expect(Reflect.getMetadata(ADMIN_PERMISSION_KEY, handler)).toBe('messages.view');
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual(
        expect.arrayContaining([JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard]),
      );
      expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler)).toBe('ADMIN');
    }
  });

  it('requires message send permission to change moderation state', () => {
    const handler = CommunicationsController.prototype.resolveMessageModeration;
    expect(Reflect.getMetadata(ADMIN_PERMISSION_KEY, handler)).toBe('messages.send');
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual(
      expect.arrayContaining([JwtAuthGuard, AuthSurfaceGuard, RolesGuard, AdminPermissionGuard]),
    );
    expect(Reflect.getMetadata(AUTH_SURFACE_METADATA, handler)).toBe('ADMIN');
  });
});
