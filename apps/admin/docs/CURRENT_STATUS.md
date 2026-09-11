# NEXI Admin Control Plane — Current Status

**Canonical cleanup branch:** `admin/canonical-clean`  
**Source basis:** latest verified `replit/admin-completion` Finance fix (`c798e3bcd5c8b352f30e100209ea8b2ef1390a15`)  
**Live provider:** connected in source for published Admin contracts; joined runtime verification is not established

## Executive summary

The application has a working Admin shell, explicit provider abstraction, server-backed live identity when selected, local/demo RBAC for local mode, shared workflow components, and provider-backed workflows for Overview, Identity, Platform, Markets, and Finance.

The route registry currently defines **34 Admin destinations**. Of those:

- **20 routes are functionally implemented**
- **14 routes remain structural or minimal**

The local provider is a demo operations console. Live mode uses the Admin API adapter, fails closed for unsupported authorities, and still requires joined runtime verification, production authentication, and deployment hardening.

## Platform cleanup completed

The canonical branch removes obsolete builder/runtime artifacts:

- removed committed `.emergent/cron/*`
- removed `.emergent/system_deps.txt`
- removed `.emergent/emergent.yml`
- removed repository-local `.gitconfig` that used the Emergent agent identity
- removed `EMERGENT.md`
- removed `.replit`
- removed `replit.md`
- replaced Lovable-only `AGENTS.md` sync instructions with neutral NEXI repository authority
- updated `.gitignore` to prevent builder runtime artifacts from returning
- replaced the stale scaffold README with current completion and integration status

Historical builder commits and branches remain in Git history for traceability. They do not define the canonical working state.

## Functional routes completed

### Overview

- `/overview`
  - provider-backed operational metrics (fixture-backed only in local mode)
  - system-health summary
  - recent Admin actions and audit stream

### Identity

- `/users`
  - search, filters, sorting, pagination
  - user detail and entitlements
  - restrictions and account state
  - sandbox-user designation
  - governed mutations and audit timeline
- `/kyc`
  - review queue
  - reviewer assignment and notes
  - approve, reject, request-more-information
  - governed confirmation and audit history
- `/sessions`
  - session inspection
  - device/location/risk context
  - governed session revocation

### Platform

- `/frontend-control`
- `/navigation`
- `/localization`
- `/feature-flags`

Implemented capabilities include public-route configuration, navigation management, six-locale translation management, feature targeting, provider-backed maintenance/incident controls, permissions, confirmations, and audit events.

### Markets

- `/assets`
- `/networks`
- `/market-feeds`
- `/spot`
- `/binary`
- `/settlements`
- `/exposure`

Implemented capabilities include asset/network/feed configuration, feed status/failover controls, Spot pair administration, Binary Long/Short administration, canonical durations, payout and exposure configuration, settlement inspection, governed mutations, and audit history.

Excluded by design: leverage, margin, futures, perpetuals, liquidation, funding-rate, cross-margin, and isolated-margin functionality.

### Finance

- `/wallets`
- `/ledger`
- `/deposits`
- `/withdrawals`
- `/reconciliation`

Implemented capabilities include wallet drill-down, append-only ledger inspection, deposit confirmation/credit flows, withdrawal review and lifecycle actions, reconciliation ownership/notes/resolution, permission checks, PRODUCTION typed confirmation, and linked audit events.

The latest Finance verification fixed a React Rules-of-Hooks defect in `ledger.tsx` and reported:

- TypeScript: clean
- production build: clean
- Finance-file ESLint: clean
- preview smoke test: all five Finance routes without runtime errors

## Routes remaining

### Products

- `/mining`
- `/loans`

Required work:

- product configuration
- terms, rates, limits, capacity, eligibility
- subscriptions/applications
- rewards/disbursement
- repayment and delinquency workflows
- governed mock mutations and audit history

### Communication and content

- `/support`
- `/messages`
- `/announcements`
- `/learn`
- `/notifications`

Required work:

- support inbox, assignment, internal notes, replies, escalation, resolution
- message conversations and read/delivery states
- localized announcement lifecycle
- course/module/lesson lifecycle
- notification targeting, scheduling, delivery, and retry states
- mock-only delivery and attachment metadata

### Governance

- `/admins`
- `/roles`
- `/approvals`
- `/audit`
- `/health`
- `/maintenance`

Required work:

- Admin account and MFA/session presentation
- granular permission matrix editing
- approval queue and decision workflows
- searchable audit-event investigation
- service health and incident acknowledgement
- global, route, market, and pair maintenance controls

### Sandbox

- `/sandbox`

Existing gating and labels are present, but the control workflows remain structural.

Required controls:

- `SANDBOX_ONLY`
- `NOT_PRODUCTION`
- normal mode
- forced win/loss and `force_result`
- win-ratio profile
- hazard rate
- payout override
- mock market movement
- sandbox balance override
- deterministic scenario and forced execution
- scope, target, seed, expiry, expected result, reason, confirmation, and audit event

## Shared architecture present

- centralized route/navigation registry
- nine-role permission model
- environment switching
- `AdminDataProvider`
- `LocalMockAdminProvider`
- `NexiAdminApiProvider` live adapter for published contracts
- linked fixtures
- `DataTable`
- `DetailDrawer`
- `FormDrawer`
- `ConsequentialActionDialog`
- `AuditTimeline`
- route guards and loading/empty/error/unauthorized/maintenance states

## Remaining technical debt

### Builder-origin build coupling

The application still uses `@lovable.dev/vite-tanstack-config` as a build dependency, and the current Vite configuration imports it. This is runtime build coupling, not merely metadata. It was intentionally retained during cleanup because the latest verified typecheck/build passed with it.

Required controlled migration:

1. replace the Lovable preset with official TanStack Start/Vite/Nitro plugins
2. preserve the custom server entry and path aliases
3. update `package.json`
4. regenerate `bun.lock`
5. remove obsolete Lovable package-age exceptions from `bunfig.toml`
6. rerun typecheck, build, lint, and route smoke tests

Do not remove this package without the verification sequence above.

### Package identity

The package is still named `tanstack_start_ts` in `package.json` and `bun.lock`. Rename it to `nexi-admin-control-plane` when regenerating the lockfile during the build-preset migration.

### Quality gates

Still required:

- complete repository lint repair
- automated component and provider tests
- route-level browser tests
- RBAC matrix tests
- consequential-action/audit tests
- accessibility audit
- responsive regression tests
- CI workflow and protected-branch checks

### Known development warning

A pre-existing TanStack Start development hydration/instrumentation note involving `data-tsd-source` was observed around `__root.tsx`. It did not block the verified production build and was reported as unrelated to Finance, but should be reproduced and classified during final hardening.

## Production integration remaining

- real Admin SSO
- server-enforced RBAC and environment authorization
- joined runtime verification and production provider configuration
- authoritative user/KYC/session services
- market configuration and feed services
- Spot/Binary operation and settlement services
- wallet, ledger, deposit, withdrawal, and reconciliation services
- content, notification, approval, audit, maintenance, and sandbox services
- secrets, environment configuration, observability, deployment, and rollback procedures

## Recommended continuation order

1. Products: Mining and Loans
2. Communication: Support, Messages, Announcements, Learn, Notifications
3. Governance: Admin Accounts, Roles, Approvals, Audit, Health, Maintenance
4. Sandbox Controls
5. builder-preset migration and package rename
6. full lint, tests, responsive/accessibility hardening, CI
7. import into `C:\trae_projects\Dexi_style_TraeWV\apps\admin`
8. connect authoritative NEXI Admin API and SSO

## Truthful status

```text
FOUNDATION_COMPLETE=YES
IDENTITY_MOCK_WORKFLOWS_COMPLETE=YES
PLATFORM_MOCK_WORKFLOWS_COMPLETE=YES
MARKETS_MOCK_WORKFLOWS_COMPLETE=YES
FINANCE_MOCK_WORKFLOWS_COMPLETE=YES
PRODUCTS_MOCK_WORKFLOWS_COMPLETE=NO
COMMUNICATION_MOCK_WORKFLOWS_COMPLETE=NO
GOVERNANCE_MOCK_WORKFLOWS_COMPLETE=NO
SANDBOX_MOCK_WORKFLOWS_COMPLETE=NO
PRODUCTION_INTEGRATION_CONNECTED=NO
PRODUCTION_READY=NO
```
