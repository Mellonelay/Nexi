import { AdminRoleId } from '../prisma/d1-client';

/** Canonical Admin vocabulary shared with the live Admin UI contract. */
export const ADMIN_PERMISSION_KEYS = [
  'overview.view', 'users.view', 'users.restrict', 'users.entitlements',
  'kyc.view', 'kyc.decide', 'sessions.view', 'sessions.revoke',
  'frontend.view', 'frontend.edit', 'navigation.view', 'navigation.edit',
  'localization.view', 'localization.edit', 'flags.view', 'flags.edit',
  'assets.view', 'assets.edit', 'networks.view', 'networks.edit',
  'feeds.view', 'feeds.edit', 'spot.view', 'spot.edit', 'spot.pause',
  'spot.cancel_order', 'binary.view', 'binary.edit', 'binary.settle',
  'settlements.view', 'exposure.view', 'wallets.view', 'ledger.view',
  'deposits.view', 'deposits.confirm', 'withdrawals.view', 'withdrawals.approve',
  'reconciliation.view', 'reconciliation.resolve', 'mining.view', 'mining.edit',
  'loans.view', 'loans.edit', 'support.view', 'support.reply', 'messages.view',
  'announcements.view', 'announcements.publish', 'learn.view', 'learn.publish',
  'notifications.view', 'notifications.send', 'admins.view', 'admins.edit',
  'roles.view', 'roles.edit', 'approvals.view', 'approvals.decide', 'audit.view',
  'health.view', 'health.acknowledge', 'maintenance.view', 'maintenance.edit',
  'sandbox.view', 'sandbox.force',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_KEYS)[number];
const viewPermissions = ADMIN_PERMISSION_KEYS.filter((permission) => permission.endsWith('.view')) as AdminPermission[];
const pick = (...permissions: AdminPermission[]) => permissions;

export const ADMIN_ROLE_DEFINITIONS: Record<AdminRoleId, { label: string; description: string; permissions: readonly AdminPermission[] }> = {
  readonly_operator: { label: 'Read-only Operator', description: 'Inspect governed state without mutations.', permissions: viewPermissions },
  support_agent: { label: 'Support Agent', description: 'Support and user-context operations.', permissions: pick('overview.view', 'users.view', 'sessions.view', 'sessions.revoke', 'wallets.view', 'ledger.view', 'deposits.view', 'withdrawals.view', 'support.view', 'support.reply', 'messages.view', 'notifications.view', 'audit.view') },
  kyc_reviewer: { label: 'KYC Reviewer', description: 'Identity review operations.', permissions: pick('overview.view', 'users.view', 'kyc.view', 'kyc.decide', 'sessions.view', 'audit.view') },
  finance_operator: { label: 'Finance Operator', description: 'Deposits, withdrawals, ledger, and reconciliation.', permissions: pick('overview.view', 'users.view', 'wallets.view', 'ledger.view', 'deposits.view', 'deposits.confirm', 'withdrawals.view', 'withdrawals.approve', 'reconciliation.view', 'reconciliation.resolve', 'settlements.view', 'exposure.view', 'approvals.view', 'audit.view') },
  market_operator: { label: 'Market Operator', description: 'Assets, networks, feeds, Spot, and Binary administration.', permissions: pick('overview.view', 'assets.view', 'assets.edit', 'networks.view', 'networks.edit', 'feeds.view', 'feeds.edit', 'spot.view', 'spot.edit', 'spot.pause', 'spot.cancel_order', 'binary.view', 'binary.edit', 'binary.settle', 'settlements.view', 'exposure.view', 'audit.view') },
  content_manager: { label: 'Content Manager', description: 'Frontend composition and content operations.', permissions: pick('overview.view', 'frontend.view', 'frontend.edit', 'navigation.view', 'navigation.edit', 'localization.view', 'localization.edit', 'flags.view', 'flags.edit', 'announcements.view', 'announcements.publish', 'learn.view', 'learn.publish', 'notifications.view', 'notifications.send', 'audit.view') },
  security_auditor: { label: 'Security Auditor', description: 'Read-only governance, health, and audit access.', permissions: viewPermissions },
  sandbox_operator: { label: 'Sandbox Operator', description: 'Sandbox-only normal/forced-win/forced-loss controls.', permissions: pick('overview.view', 'sandbox.view', 'sandbox.force', 'spot.view', 'binary.view', 'wallets.view', 'ledger.view', 'audit.view') },
  super_admin: { label: 'Super Admin', description: 'Full Admin authority with audit and environment gates.', permissions: ADMIN_PERMISSION_KEYS },
};

export function hasAdminPermission(role: AdminRoleId | null | undefined, permission: AdminPermission): boolean {
  return role ? ADMIN_ROLE_DEFINITIONS[role].permissions.includes(permission) : false;
}
