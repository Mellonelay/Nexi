# Admin engineering contract

Inherits ../AGENTS.md. Preserve current TanStack/React/Vite/Nitro implementation, registered routes and permission-aware deep links.

- Source Admin/src; dependency authority Admin/package.json, pnpm-lock.yaml, pnpm-workspace.yaml and patches/. Preserve Admin/node_modules -> /srv/nexi/admin/shared/node_modules, single output /srv/nexi/admin/current, and Node 24.21.0. Do not install or build as documentation maintenance.
- Eight logical workspaces are the owner-approved operator navigation: Overview, Clients, Trading, Wallet & Finance, Markets, Products, Communications, Administration & Settings. NAV_GROUPS at src/admin/config/navigation.ts and source route files govern exact current route count. Do not remove routes merely because they are contextual/hidden.
- Admin/src/admin/data/nexi-api-provider.ts is the live backend consumer. Local mock is explicit development/demo only; never silently fall back in a production path. Unsupported backend capability fails closed. Permissions are enforced by NestJS, not hiding UI.
- Binary research account defaults and active-position overrides are current source implementations, not future proposals. They require research-account scope, actor/reason, idempotency, audit and version/expiry guards. One NestJS settlement/SQLite writer; no second Admin outcome engine.
- Consequential actions need correct actor, target, approval/reason, confirmation, idempotent command and durable response; protect production data. Admin signed-in UI and Public wallet identity remain distinct.
- Operator procedure: docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md. Original owner Admin design diagram in docs/ is immutable design evidence; not a deployed-release receipt.
- Authorized Admin build uses NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current with the existing pinned corepack pnpm@12.14.0 and project script, only after checking locked dependencies. Sentry/release SHA and verified runtime are separate gates.
