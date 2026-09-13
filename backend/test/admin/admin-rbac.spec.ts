import { AdminRoleId } from '../../src/prisma/d1-client';
import { ADMIN_PERMISSION_KEYS, ADMIN_ROLE_DEFINITIONS, hasAdminPermission } from '../../src/admin/admin-rbac';

describe('Admin role authority', () => {
  it('defines all nine control-plane roles', () => {
    expect(Object.keys(ADMIN_ROLE_DEFINITIONS).sort()).toEqual(Object.values(AdminRoleId).sort());
  });

  it('keeps super-admin authority explicit and permission-based', () => {
    for (const permission of ADMIN_PERMISSION_KEYS) {
      expect(hasAdminPermission(AdminRoleId.super_admin, permission)).toBe(true);
    }
    expect(hasAdminPermission(undefined, 'audit.view')).toBe(false);
  });

  it('does not grant mutation permissions to read-only operators', () => {
    expect(hasAdminPermission(AdminRoleId.readonly_operator, 'audit.view')).toBe(true);
    expect(hasAdminPermission(AdminRoleId.readonly_operator, 'approvals.decide')).toBe(false);
  });
});
