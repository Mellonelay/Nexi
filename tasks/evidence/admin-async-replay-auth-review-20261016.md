# Admin replay authorization and audit map — 2026-10-16

Read-only source map in the isolated migration worktree.

- AdminController is mounted at /admin and class-guards requests with JwtAuthGuard, AuthSurfaceGuard, RolesGuard, and AdminPermissionGuard; it also requires ADMIN auth surface and Role.ADMIN.
- Per-route authorization uses RequireAdminPermission(permission). AdminPermissionGuard resolves the live role via D1FinancialCommandGateway.getAdminIdentity.
- Admin RBAC is centralized in admin-rbac.ts. Current vocabulary has health.view/health.acknowledge but no async-job-specific view/replay permissions.
- AdminAuditLog is an existing canonical table with id, adminId, action, target, details, ipAddress, createdAt.
- Existing generic AdminService patterns sometimes write audit separately after their state mutation. The migration replay operation must use the existing SQLite bridge transaction to commit replay history, generation transition, and canonical audit evidence together. Do not expose the current replay method over HTTP before that property is implemented and tested.
- Route permission, replay reason, request idempotency, actor attribution, bounded failed-job response, admin identity lookup through the local SQLite bridge, and unauthorized/auth-surface regression tests remain prerequisites.

No source code, RBAC, data, or runtime behavior changed in this read-only mapping.
