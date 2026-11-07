# NEXI Admin Operator Usage Guide

Source reference: Admin source in `main` at `27b78bb6f74a0ddb44e9121b15fdbb7c9f1c3c32` (2026-11-07), with eight workspaces, 21 direct navigation destinations and 34 named route files. Cross-surface topology is in `@nexi-graphify-live` and [the coverage report](../../docs/architecture/NEXI_GRAPHIFY_COVERAGE_20261107.md). This guide reflects source inspection only. It does not claim a deployed release, a passing test campaign, or authenticated browser acceptance.

## Before acting

1. Sign in with the Admin account and role assigned by the NEXI owner.
2. Use the eight-workspace navigation. A destination appears only when the current role has its view permission.
3. For changes, confirm the specific action permission and any server-side confirmation/reason prompt. A visible page does not grant mutation authority.
4. Use six-digit Public Profile ID to identify a customer. Use internal UUID only to disambiguate or diagnose.
5. For financial work, inspect the customer, asset/network, amount, status, and prior Ledger activity before submitting. Preserve the generated idempotency key when retrying an uncertain request. Never retry with changed parameters under the old key.
6. Treat the Ledger as accounting truth. External deposit destinations configured in Wallet & Finance are not a customer's internal Funding, Spot, Margin, Option, or Finance Ledger accounts.

## Roles and access

The UI role table is in `Admin/src/admin/config/roles.ts`; navigation visibility is in `Admin/src/admin/config/navigation.ts`. Server-side NestJS guards and permissions remain authoritative.

| Role | Permission scope from `roles.ts` |
| --- | --- |
| Read-only Operator | All permissions ending in `.view`; no mutations. |
| Support Agent | `users.view`, `sessions.view/revoke`, read-only wallet/Ledger/deposit/withdrawal context, `support.view/reply`, `messages.view/send`, `notifications.view`, `operator_alerts.view`, `audit.view`. |
| KYC Reviewer | `users.view`, `kyc.view/decide`, `sessions.view`, `operator_alerts.view`, `audit.view`. |
| Finance Operator | `users.view`, `wallets.view`, `ledger.view/adjust/freeze`, `deposits.view/confirm`, `withdrawals.view/approve`, reconciliation view/resolve, settlement/exposure view, operator alerts, approvals view and audit view. |
| Market Operator | Asset/network/feed view/edit; Spot view/edit/pause/cancel; Binary view/edit/settle; settlement/exposure view, operator alerts and audit view. |
| Content Manager | Frontend/navigation/localization view/edit; feature flags view only; announcements and Learn view/publish; notifications view/send; operator alerts and audit view. |
| Security Auditor | All permissions ending in `.view`; no mutations. |
| Sandbox Operator | Overview, Sandbox, Spot, Binary, wallet, Ledger and audit view; `sandbox.force` only for guarded Sandbox actions. |
| Super Admin | All configured UI permissions. Backend authorization, confirmation, reason and audit still apply. |

This matrix reflects `Admin/src/admin/config/roles.ts`. Route visibility is separately filtered by `navigation.ts`; for example Public App Settings requires `frontend.view` or the configured navigation/flags view alternative. A role label or visible route does not grant an API mutation. NestJS authorization remains authoritative.

## Workspaces

### Overview — Dashboard (`/overview`)

Use the dashboard to review operational summaries and follow links to the owning workspaces. A summary is not a substitute for reading the underlying customer, transaction, Ledger, or audit record.

### Clients — Clients (`/users`), KYC Reviews (`/kyc`)

**Find a customer:** Open Clients, search by six-digit profile ID, name, email, wallet address, or internal UUID, then choose Inspect.

**Customer detail:** Review profile identity, KYC, account status, the five internal account scopes, and Security & Sessions when the role permits. Session status means revoked/not revoked and last-used time; it does not prove current online presence.

**Financial actions:** Use only the provider-backed customer credit/debit/freeze/unfreeze controls shown to an authorized operator. The searchable balance dialog loads eligible assets from that customer's active Ledger accounts intersected with active configured assets, and lists only scopes that are valid for the selected asset. If the options cannot load or no eligible account exists, the adjustment remains disabled. Select the exact scope and asset, enter a reason, review the confirmation, then verify the resulting Ledger/activity record. A freeze is an account restriction and is not a balance change. Do not use customer balance summaries as a ledger substitute. This is source behavior; verify deployment and browser acceptance separately.

**KYC:** Open KYC Reviews, inspect the submitted evidence and current status, then approve, reject, or request more information only when permitted. A pending submission is not approval.

**VIP and referrals (Clients → Customer Detail):** `users.view` permits reading the customer summary (qualified external-deposit progress/base asset, next enabled tier, benefit metadata, override audit details, referral identity/count, and first-deposit reward decision). `users.entitlements` permits opening the VIP/referral policy editor, saving the base asset, enabled tier threshold/name/benefit metadata and first-deposit reward policy, and assigning/clearing a manual VIP override. Each mutation requires an audit reason; customer override changes also use the consequential confirmation dialog. Saves perform a provider readback; the UI reports success only when the returned policy/profile matches. Clearing an override retains the current tier and resumes future promotion without demotion. Tier benefit JSON is descriptive metadata only: no VIP deposit cap or VIP-specific withdrawal limit is enforced by the deposit/withdrawal owners. Withdrawal bounds currently come from configured asset/network settings. Maximum qualification thresholds select the highest enabled tier and never cap deposits. Reward fields must be explicitly configured; valid credited external deposits qualify cumulatively, and the first valid external deposit creates the single referral reward decision. The invalid-deposit recovery endpoint requires `ledger.adjust`, an audit reason and canonical Ledger correction; it is not exposed as a control in this customer panel. Source presence does not establish deployment, migration, or browser acceptance.

### Trading — Binary · Ongoing, History & Settlements, Spot & Margin (`/binary`, `/settlements`, `/spot`)

- **Binary · Ongoing:** Inspect open positions and their authoritative state. Use global settings for shared duration/payout/stake policy and pair controls for availability. Research defaults/position overrides, where eligible, are separate restricted controls and do not change live quotes.
- **History & Settlements:** Review settled records and their settlement references. A displayed status is not permission to alter a completed settlement.
- **Spot & Margin:** Inspect pairs, orders, maintenance and applicable limits. Cancel or maintain only through the available authorized provider action; risk and balance enforcement remain backend responsibilities.
- **Sandbox:** Contextual and guarded. It is for explicitly permitted isolated scenarios, not production customer trades or a way to write balances.

### Wallet & Finance — Deposit Wallet Settings, Deposits, Withdrawals, Ledger (`/networks`, `/deposits`, `/withdrawals`, `/ledger`)

**Deposit Wallet Settings:** Configure external deposit assets, supported networks, destination addresses, labels, logos, limits, fees/confirmations and activation using the available forms. Verify that the destination is valid and active before making it selectable in Public. These are blockchain destinations, not internal customer Ledger accounts.

**Deposits:** Review the external deposit or customer claim and evidence. Keep confirmation and credit as separate statuses where the workflow exposes them. Accept/credit only after review. The canonical NestJS financial path posts the Ledger credit and records activity/audit/outbox. If the result is uncertain, inspect the claim and Ledger before retrying with the original idempotency key. Rejected claims are not credited. A credited status alone does not prove funds were later withdrawn or that a different customer is online.

**Withdrawals:** Review customer, asset/network/address, requested amount and risk state. Approve/reject through the authorized review flow; processing/settlement status is not established by approval alone. Do not mark a withdrawal complete without the canonical state transition and evidence.

**Ledger:** Use it to confirm postings, account scope, asset, reference, amount, idempotency/correlation and resulting account values. Do not edit ledger rows manually.

### Markets — Assets, Price Data Sources (`/assets`, `/market-feeds`)

Use Assets to inspect supported asset metadata and visibility. Use Price Data Sources to inspect provider and feed state. Market display or feed status is not accounting truth. Use an authorized edit/pause action only after confirming its scope and downstream Public/trading impact.

### Products — Mining, Loans (`/mining`, `/loans`)

**Mining:** Configure plans with the supported editor, then inspect subscriptions, reward and maturity state. Confirm the saved plan readback before treating it as Public product configuration. Do not infer an accrued reward from a plan label.

**Loans:** Inspect supported assets, plans, applications, repayment/lifecycle details, and available review actions. Approval, disbursement, repayment and paid-to-date are distinct lifecycle facts. Use the canonical application action and verify the resulting record; do not create manual balance changes to simulate a loan.

### Communications — Messages, Notifications, Announcements, Learn Content (`/messages`, `/notifications`, `/announcements`, `/learn`)

- **Messages:** Use the selected customer conversation for private support correspondence. Review identity and thread history before replying. Attachments remain governed by the message API permissions.
- **Notifications:** The route supports customer notification workflows and operator alerts according to the current role. Check recipient/category and delivery record; a transport acknowledgement is not proof of a business transaction.
- **Announcements:** Draft, review, schedule/publish, and verify the Public readback using the available provider actions.
- **Learn Content:** Edit or publish only supported articles/categories. Confirm visibility through the canonical Public consumer where applicable.

### Administration & Settings — Public App Settings, Admin Accounts, Maintenance (`/frontend-control`, `/admins`, `/maintenance`)

**Public App Settings:** Use its sections for routes/navigation, markets/quotes, content/notices, Contact Us, and advanced controls. Retained compatibility routes may still exist in the route tree; the consolidated destination is the operator entry point. Preserve permission checks, validation, audit and backend readback.

**Admin Accounts:** Inspect Admin identity and role assignment according to current permissions. Do not broaden access to solve a missing feature.

**Maintenance:** Review scope and schedule before enabling or cancelling a maintenance window. Verify the saved scope and audit record. A maintenance flag is not evidence that a backend service is healthy.

## Route → provider → NestJS source authority

| Workspace/destination | View permission | Provider boundary | NestJS/source owner |
| --- | --- | --- | --- |
| Dashboard | `overview.view` | Overview queries through `AdminDataProvider` / `NexiAdminApiProvider` | `AdminController` / `AdminService` |
| Clients | `users.view` | `listUsers`, customer detail, sessions/wallets as separately permitted | Admin controller/service; sessions and wallet owners |
| Clients — VIP & referrals | `users.view`; mutations require `users.entitlements` | `getVipReferralCustomer`, `getVipReferralAdminSettings`, VIP level/base-asset/reward-policy saves, audited assignment/override-clear | `ReferralVipAdminController` / `ReferralVipService`; credited external deposits, SQLite qualification/decision records, Ledger/Outbox reward commands |
| KYC Reviews | `kyc.view` | `listKyc`, evidence and review methods | KYC controller/service |
| Binary · Ongoing | `binary.view` | Binary configuration/position methods | Admin controller/service; Binary owner and `D1FinancialCommandGateway` |
| History & Settlements | `settlements.view` | Settlement queries and actions | Admin controller/service and settlement authority |
| Spot & Margin | `spot.view` | Spot pair/order methods | Market/Spot services and financial command owner |
| Deposit Wallet Settings | `networks.view` | Network/deposit-asset/address methods | Admin wallet configuration service and durable configuration store |
| Deposits | `deposits.view` | Deposit/claim queries and review | Admin/financial controllers and canonical deposit-credit gateway |
| Withdrawals | `withdrawals.view` | Withdrawal review/lifecycle methods | Financial operations controller/service and Ledger gateway |
| Ledger | `ledger.view` | Ledger account/posting queries | SQLite Ledger; no manual row editing |
| Assets | `assets.view` | Asset metadata methods | Admin controller/service and market configuration owner |
| Price Data Sources | `feeds.view` | Provider/feed methods | Market/feed services |
| Mining | `mining.view` | Plan/subscription/reward methods | Mining service and canonical financial commands |
| Loans | `loans.view` | Plan/application/repayment methods | Loan service and canonical financial commands |
| Messages | `messages.view` | Conversation/thread/reply methods | Communications controller/service |
| Notifications | `notifications.view` or `operator_alerts.view` | Customer notification and operator alert methods | Communications/Admin controllers; durable EventOutbox consumers |
| Announcements | `announcements.view` | Announcement lifecycle methods | Admin content owner |
| Learn Content | `learn.view` | Article/category methods | Admin content owner |
| Public App Settings | `frontend.view`, or limited `navigation.view` / `flags.view` view | Public route, quote, banner, Contact Us, navigation and feature-flag provider methods | Frontend-control configuration owner and Public consumers |
| Admin Accounts | `admins.view` | Admin identity/role methods | Admin controller/service and server RBAC |
| Maintenance | `maintenance.view` | Maintenance-window methods | Admin controller/service and maintenance configuration owner |

Mutation permissions differ from route view permissions. Examples: `networks.edit`, `deposits.confirm`, `withdrawals.approve`, `ledger.adjust`/`ledger.freeze`, `binary.edit`, `announcements.publish`, and `maintenance.edit`. Check the exact provider interface and NestJS decorator before claiming a particular action is supported.

The exact provider methods and `@Controller` routes are maintained in `Admin/src/admin/data/provider.ts`, `Admin/src/admin/data/nexi-api-provider.ts`, and the referenced NestJS controllers. Check those files before relying on a route name. Unsupported provider methods must fail closed; local mock behavior is not live backend authority.

## Status meanings

- **Pending review:** submitted and awaiting an authorized decision; not accepted or credited.
- **Approved/accepted:** a workflow decision; does not itself prove a Ledger posting.
- **Credited:** canonical deposit credit state; verify the associated posting and activity.
- **Rejected/failed:** a terminal/review outcome defined by the owning service; inspect the reason and audit entry.
- **Settled/completed:** a recorded terminal transition; verify its transaction/posting reference.
- **Disabled:** unavailable for new use where the owning consumer enforces it; confirm readback.
- **Not revoked:** a session has not been revoked. It does not mean online now.
- **Offline/not observed:** no presence proof. Do not infer customer presence from authentication session state.

## Troubleshooting and audit

- If a page is empty, first check role visibility, filters, loading/error state and the live provider mode. Do not switch to mock mode to make a production workflow appear successful.
- On validation or permission failure, preserve the response and do not retry with broadened parameters or a different operator identity.
- For uncertain financial results, inspect the canonical deposit/withdrawal record, Ledger posting, Activity, idempotency evidence, Outbox and Admin audit before retrying.
- For configuration, compare the Admin save response with its authoritative GET/Public consumer readback.
- Escalate missing API/provider contracts or reversal handling to the owning backend team; do not create frontend-only success states.

## Current source gaps and evidence boundary

**VIP financial enforcement contract gap:** VIP benefit JSON has no typed financial semantics and neither NestJS deposit-credit nor withdrawal-request/approval validation reads it. The existing withdrawal min/max are asset/network configuration and are not VIP benefits. Therefore configured benefit values remain informational; no per-tier deposit or withdrawal limit is enforced. Adding enforcement requires an explicit owner contract defining benefit keys, units/assets, period, and behavior for pending/credited transactions, then wiring the existing NestJS financial owners without introducing another writer. Do not infer enforcement from the Admin display. Maximum qualification thresholds are tier-selection thresholds only and must never cap deposits. Invalidated credited deposits have an audited recovery route at `POST /admin/deposits/invalidate` guarded by `ledger.adjust`; it uses canonical Ledger corrections and recalculates qualification without demotion. Automated provider chargeback handling is not established by this source.

Source inspection and this guide are not tests, deployed evidence, or browser acceptance. Authenticated browser acceptance is pending a later deployed revision.
