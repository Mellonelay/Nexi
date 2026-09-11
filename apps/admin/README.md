# NEXI Admin Control Plane

Internal, role-gated operations and governance console for the NEXI platform.

> This repository is not the public NEXI trading product. Administrators configure, inspect, approve, pause, investigate, and audit. The selected provider is explicit: live mode uses the configured Admin API, while local mode is demo-only.

## Current status

The Admin foundation and the first three implementation batches are complete:

- responsive Deep Liquid Violet Admin shell
- centralized navigation and all 33 Admin routes
- nine-role RBAC model and DEVELOPMENT/SANDBOX/PRODUCTION switching
- typed `AdminDataProvider`
- explicit local/demo `LocalMockAdminProvider`
- live `NexiAdminApiProvider` for published Admin contracts
- audited provider mutation envelope
- shared `DataTable`, `DetailDrawer`, `FormDrawer`, `ConsequentialActionDialog`, `AuditTimeline`, route guards, and route-state components
- Operations Overview
- Identity: Users, KYC Reviews, Sessions
- Platform: Frontend Control, Navigation, Localization, Feature Flags
- Markets: Assets, Networks, Market Feeds, Spot Administration, Binary Administration, Settlements, Exposure
- Finance: Wallets, Ledger, Deposits, Withdrawals, Reconciliation

Remaining UI implementation:

- Products: Mining, Loans
- Communication: Support, Messages, Announcements, Learn Content, Notifications
- Governance: Admin Accounts, Roles & Permissions, Approvals, Audit Logs, System Health, Maintenance
- Sandbox Controls
- final accessibility, responsive, route, lint, test, and export hardening

Remaining production integration and verification:

- Admin SSO and server-enforced RBAC
- joined runtime verification for the live provider
- authoritative audit, approvals, wallet, ledger, settlement, withdrawal, content, and notification services
- backend contract and integration testing

See `docs/CURRENT_STATUS.md` for the detailed completion matrix and known technical debt.

## Run locally

```bash
bun install --frozen-lockfile
bun run dev
bun x tsc --noEmit
bun run build
```

The current Vite development server is configured for port `5000`.

## Stack

- React 19
- TypeScript strict mode
- TanStack Start and TanStack Router
- TanStack Query
- Tailwind CSS v4
- shadcn/ui and Radix UI
- Bun

## Architecture

```text
Admin pages and components
        ↓
AdminDataProvider
        ↓
LocalMockAdminProvider      explicit local/demo mode
NexiAdminApiProvider        live adapter for published contracts
```

Pages must not access production services directly. Provider replacement is centralized in `src/admin/data/context.tsx`.

## Product boundary

Do not add:

- public Quotes Hub pages
- public Buy/Sell or Long/Short execution tickets
- consumer wallet homepages
- promotional exchange UI
- leverage, margin, futures, perpetuals, liquidation, funding-rate, cross-margin, or isolated-margin features

Binary Administration uses public Long/Short terminology with internal `Long → UP` and `Short → DOWN` mapping. Canonical durations are `30`, `60`, `180`, `240`, and `480` seconds.

## Roles

The local/demo interface supports:

- Read-only Operator
- Support Agent
- KYC Reviewer
- Finance Operator
- Market Operator
- Content Manager
- Security Auditor
- Sandbox Operator
- Super Admin

Route visibility and actions are permission-aware. Sandbox Controls must remain restricted to Sandbox Operator or Super Admin while the selected environment is `SANDBOX`.

## Consequential actions

Every consequential action must:

- verify permission
- require a meaningful reason
- show actor, role, environment, target, current state, and proposed state
- require confirmation
- require typed target confirmation in PRODUCTION
- update through `AdminDataProvider`
- append a linked audit event
- show success or failure feedback

Do not implement arbitrary authoritative balance rewrites.

## Validation evidence

The latest verified continuation passed:

- `bun x tsc --noEmit`
- `bun run build`
- Finance-file ESLint
- preview smoke verification for Wallets, Ledger, Deposits, Withdrawals, and Reconciliation

A full repository lint cleanup and automated test suite are still required before release.

## Portability

The application is intended to move into the authoritative NEXI workspace at:

```text
C:\trae_projects\Dexi_style_TraeWV\apps\admin
```

Before integration, migrate the remaining platform-specific Vite build preset to an official TanStack Start configuration, rename the package, and regenerate the lockfile under controlled local verification.

## Truthful completion boundary

Use this statement only when the selected provider and remaining unsupported surfaces are explicit:

```text
Live Admin API contracts are selected explicitly; unsupported capabilities remain unavailable.
```
