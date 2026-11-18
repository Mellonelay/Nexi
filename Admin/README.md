# NEXI Admin

The current Admin is a desktop-first TanStack/React operator consumer of the NestJS API. Source authority: src/admin/config/navigation.ts, src/routes/, src/admin/data/nexi-api-provider.ts, and the matching Backend DTO/guard/service. Admin does not own Ledger state or settlement.

Eight logical workspaces are approved. Route visibility depends on role, environment and navigation context; a route file or direct link is not proof of an enabled/live operator action. No production mock fallback or direct database writer.

- [Current Admin operator usage and domain contract](docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md)
- Original owner navigation and Binary-control diagram: docs/NEXI Admin — Unified Navigation and Binary Control Architecture-2026-10-21-144002.png
- [Maintained system architecture](../docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md)
- [Financial invariants](../docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md)

The older Admin design proposals, route-count snapshots and handoff directives are retained in Git history, not operative instructions. Current source and latest owner decisions take precedence; browser correctness and deployed behavior require separate evidence.
