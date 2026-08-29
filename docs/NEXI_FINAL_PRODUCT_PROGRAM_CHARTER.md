# NEXI Final Product Program Charter

> **Current owner authority override — 2026-08-19:** Active trading scope is
> **Spot/Margin + Options**. Spot and isolated Margin share one public page;
> Margin is limited to LONG/SHORT at 2x, 3x, and 5x. Options is the separate
> public page backed by the Binary/Microtrade domain. Cross margin, futures,
> perpetual contracts, portfolio margin, C2C, and copy trading remain
> excluded. See `docs\implementation\NEXI_CURRENT_PRODUCT_SCOPE_AUTHORITY.md`.

**Status:** Permanent canonical product and delivery authority  
**Project root:** `C:\trae_projects\Dexi_style_TraeWV`  
**Applies to:** Public frontend, authoritative backend, Admin Control Plane, sandbox, integration, verification, and release.

## 1. Authority and precedence

This charter defines the final destination of the complete Dexi–Nexi program.
It overrides temporary plans, historical reports, archived documents, generated analyses, browser-reference captures, recovery notes, and one-off implementation prompts.

The following remain separate authorities within their own domains:

- `DESIGN.md`
- `.stitch\DESIGN.md`
- `docs\design\NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

Those three files are the visual-design authority and must remain byte-identical.
This charter is the product, architecture, control-plane, delivery, and completion authority.

Temporary model choices, current blockers, transient runtime state, credentials, and session-specific evidence do not belong in this document.
## 2. Project identity and operating boundary

NEXI is an educational research and sandbox reconstruction of the original DEXI-style platform.

```text
PROJECT_TYPE=EDUCATIONAL_RESEARCH_AND_SANDBOX
REAL_USERS=NO
REAL_FUNDS=NO
LIVE_FINANCIAL_SERVICE=NO
```

This boundary must not be used to remove realistic product functions, administration workflows, ledger behavior, settlement controls, or testing capabilities.
Sensitive-looking components must be classified, isolated, governed, and tested rather than silently deleted.

The objective is to reconstruct the complete intended platform, preserve the useful original workflows, and improve architecture, performance, interface quality, governance, observability, and maintainability.

## 3. Final three-surface architecture

The final system has exactly three primary surfaces:

1. Public NEXI frontend.
2. Authoritative backend API and runtime.
3. Separate role-gated Admin Control Plane.
### Surface 1 — Public frontend

The public application owns presentation, interaction, local display state, and user workflow composition.
It does not own authoritative balances, settlement truth, market truth, secrets, administrative rules, or sandbox outcome logic.

### Surface 2 — Backend authority

The backend owns authentication, users, market data, configuration, wallets,
ledger, Spot/Margin execution, Options/Binary execution and settlement, mining,
loans, messages, notifications, audit records, administrative APIs, sandbox
APIs, and database authority.

Cloudflare is the selected deployment infrastructure, but product contracts and domain logic must not become inseparable from one temporary Worker, container, or routing layout.

### Surface 3 — Admin Control Plane

The Admin website is a separate application boundary with its own authentication, route or domain, session policy, role model, API namespace, and deployment boundary.
It contains production administration and sandbox or simulation administration.

The canonical control chain is:

```text
Admin Control Plane
→ governed Admin API
→ authoritative backend services and configuration
→ public frontend behavior and visible state
```
## 4. Locked public frontend scope

The public frontend preserves exactly these 11 primary destinations:

1. Dashboard
2. Spot Trading
3. Options
4. Wallet
5. Earn / Mining
6. Loan
7. Support
8. Announcement
9. Learn
10. Messages
11. Settings

`Quotes` is not a twelfth destination. `/dashboard` is the Quotes Hub with exactly:

```text
Favorites
Crypto
Metal
Forex
Shares
```

The backend-driven asset catalog may grow without changing this navigation contract.
The active trading scope is:

```text
SPOT=INCLUDED
SPOT_MARGIN=INCLUDED
OPTION_BINARY_MICROTRADE=INCLUDED
SPOT_MARGIN_PAGE=SHARED_WITH_SPOT
SPOT_ISOLATED_MARGIN=INCLUDED
SPOT_ISOLATED_MARGIN_LEVERAGE=2X_3X_5X_ONLY
CROSS_MARGIN=EXCLUDED
FUTURES_PERPETUALS=EXCLUDED
PORTFOLIO_MARGIN=EXCLUDED
C2C=EXCLUDED
COPY_TRADING=EXCLUDED
```

Excluded systems must not reappear in public navigation, Admin routes, backend roadmaps, or implementation claims without explicit scope approval.

The public frontend must not hardcode operational truth. Assets, pairs, route availability, labels, fees, limits, durations, payout rates, maintenance states, content, and feature visibility must come through typed backend-controlled configuration or typed mock adapters that implement the same contracts.

## 5. Shared market state and data truth

There is one canonical Active Asset / Active Pair state:

```text
Quotes Hub selection
→ shared Active Pair
→ Dashboard
→ Spot
→ Option / Binary
→ chart and price consumers
```
Pages must not silently create independent defaults after the user selects another asset or pair.
The same backend quote and market state must be represented consistently across every consuming surface.

Public data states must explicitly distinguish:

```text
LOADING
LIVE
STALE
UNAVAILABLE
ERROR
```

Do not invent public prices, balances, percentages, PNL, payouts, order results, or market movement.
Mock values are allowed only inside clearly identified development or sandbox adapters.

## 6. Backend authority and frontend control model

The backend must expose typed contracts that allow the Admin Control Plane to control both public frontend behavior and backend operations.
Operational values must be stored and served authoritatively rather than duplicated across pages.

Backend authority includes:

- authentication, users, sessions, roles, and permissions;
- feature configuration and public frontend composition;
- market feeds, normalized quotes, assets, networks, and pairs;
- wallets, ledger, transfers, deposits, withdrawals, and reconciliation;
- Spot orders, trades, fees, limits, market states, and history;
- Option/Binary configuration, positions, exposure, expiry, and settlement;
- Earn/Mining plans, rewards, eligibility, and history;
- Loan products, applications, decisions, repayment, and status;
- announcements, learning content, support, messages, and notifications;
- audit events, system health, maintenance, and incident controls;
- sandbox simulation, deterministic scenarios, and test-only overrides.

The public frontend consumes backend configuration and cannot override authoritative rules.
The Admin frontend edits or operates those rules through governed Admin APIs.

## 7. Complete Admin Control Plane

The final Admin website must include complete control surfaces for:

```text
Overview
Users
Wallets and Ledger
Assets and Networks
Market Feeds
Spot Trading
Option / Binary
Settlement and Exposure
Deposits and Withdrawals
Earn / Mining
Loans
Support and In-App Chat
Messages and Notifications
Announcements and Learn Content
Feature Flags and Frontend Control
Maintenance and System Health
Admin Accounts, Roles, and Permissions
Audit Logs
Sandbox and Simulation
```
Admin must be able to control public frontend composition without source edits, including:

- route and feature visibility;
- navigation availability and maintenance presentation;
- assets, categories, markets, pairs, labels, ordering, and status;
- fees, limits, precision, duration options, and payout presentation;
- announcements, educational content, support entry points, and notifications;
- user-specific feature access and controlled overrides;
- global, market-specific, pair-specific, and account-specific configuration;
- loading, unavailable, stale, maintenance, and incident messaging.

Admin must also control backend operations, including configuration, user state, ledger-backed corrections, market pauses, settlement review, withdrawal review, operational health, sandbox scenarios, and auditable administrative actions.

Broad control surfaces are part of the intended product. Later security filtering, approval depth, and deployment restrictions refine how controls execute; they do not remove the controls from the target architecture.

## 8. Spot Trading administration

Spot administration must support:

- asset and pair enable or disable;
- buy and sell availability;
- market, limit, and supported order-type configuration;
- price and quantity precision;
- minimum and maximum order values;
- maker, taker, and other applicable fees;
- price-source and market-status configuration;
- open-order and trade-history inspection;
- governed cancellation or intervention workflows;
- global, pair, and account-level risk or maintenance controls;
- development and sandbox market simulation adapters.
## 9. Option / Binary administration

Option/Binary administration must support:

- pair enable or disable;
- available contract durations;
- payout percentage by pair and duration;
- minimum and maximum stake;
- global, pair, and per-user stake limits;
- global and pair exposure limits;
- price source, entry-price rule, expiry-price rule, and settlement delay;
- tie, refund, cancellation, and unavailable-market policies;
- round suspension and maintenance mode;
- open-position monitoring and settlement history;
- manual investigation and governed correction workflows.

The locked default durations are:

```text
30 seconds
60 seconds
180 seconds
240 seconds
480 seconds
```

Durations and payout rates are backend-configurable. They must not be permanently embedded in public frontend components.
## 10. Wallet and ledger architecture

NEXI uses separated wallet domains:

```text
Wallet Overview
Spot Wallet
Margin Wallet
Option Wallet
Funding Wallet
Financial Wallet
```

Transfers between wallet domains are ledger events, not direct balance rewrites.
Every financial mutation must create an attributable record containing:

- transaction identifier;
- user or account;
- source and destination wallet where applicable;
- asset and amount;
- operation type and reason;
- timestamp and status;
- execution source and environment;
- linked order, position, loan, reward, or administrative event;
- audit linkage where applicable.

Administrative corrections must be ledger-backed, attributable, reviewable, and auditable.
The unified history includes deposits, withdrawals, conversions, internal transfers, Spot events, Binary events, mining rewards, loan events, and administrative corrections.
## 11. Assets, networks, deposits, and withdrawals

Admin controls must include:

- asset symbol, name, category, logo, ordering, and visibility;
- network name, contract address, decimals, and explorer URL;
- deposit address and QR presentation where applicable;
- deposit and withdrawal availability;
- confirmation requirements;
- minimum deposit and withdrawal;
- withdrawal fee and processing policy;
- user-facing network instructions;
- maintenance, activation, and deactivation states;
- deposit and withdrawal review, status, evidence, and history.

## 12. Earn, Mining, Loans, content, and communications

Earn and Mining controls include plans, rates, durations, eligibility, capacity, reward schedules, activation, subscriptions, reward history, and sandbox reward simulation.

Loan controls include products, principal limits, interest configuration, terms, eligibility, applications, approval workflow, repayment schedules, delinquency state, administrative adjustments, and audit history.

Content and communication controls include announcements, Learn content, notifications, in-app messages, support conversations, attachments, templates, audience targeting, scheduling, draft or publish state, read state, delivery state, support assignment, internal notes, escalation, and conversation history.
## 13. Sandbox and simulation controls

The Admin Control Plane must preserve explicit sandbox capabilities:

```text
normal mode
force_result
forced win
forced loss
win_ratio test profile
hazard_rate
payout override
mock market movement
sandbox balance override
deterministic scenario preset
forced sandbox execution
```

Controls may be scoped globally, by pair, by sandbox account, by test position, or by a defined time window.
Scenario records should support a seed, description, expected state, start conditions, expiry conditions, and result evidence.

These controls belong to the educational and testing system. They must eventually be governed by environment checks, sandbox-account checks, RBAC, reason capture, before-and-after evidence, clear `SANDBOX_ONLY` labeling, and immutable audit records.

Governance requirements refine execution safety; they must not be used to erase the intended sandbox control surface.
## 14. Security, permissions, and cryptographic research

The final system must define and enforce:

- separate public and Admin authentication boundaries;
- Admin roles, permissions, session policy, and API namespace;
- environment-aware authorization;
- reason and evidence capture for consequential operations;
- immutable audit events for administrative and financial changes;
- secret isolation and least-privilege service access;
- input validation, rate limits, abuse controls, and incident response;
- explicit production, development, and sandbox indicators.

Agreed research components, including Ed25519 or other browser-side cryptographic proposals, must be preserved long enough to define their threat model, boundary, implementation, tests, and residual risk.
A generic warning is not sufficient reason to silently delete an agreed research component.

Correct treatment is:

```text
preserve requirement
→ define threat model
→ define boundary
→ implement the educational or sandbox design
→ test it
→ document residual risk
```

## 15. Frontend visual and performance authority

The synchronized Deep Liquid Violet files remain the only current visual authority.
The target includes:

- deep black-violet foundations;
- layered violet surfaces and selective liquid glass;
- electric violet with restrained cyan or aqua energy;
- official asset identities and logos;
- high-density professional financial readability;
- mobile Web3-browser-first behavior;
- safe-area and dynamic viewport handling;
- premium depth and restrained glow;
- app-native responsive behavior;
- opaque execution surfaces where clarity requires them.

Do not regress to generic bento dashboards, flat graphite or amber designs, casino styling, consumer-banking styling, generic crypto neon, or decorative glass that compromises information density.

Performance architecture should use the appropriate technology by workload:

```text
Next.js and React application shell
+ Canvas or WebGL for measured high-frequency visual surfaces
+ Web Workers for stream processing
+ WASM where measured workloads justify it
+ device-native refresh-rate adaptation
```

The requirement is 120 Hz-capable smoothness with graceful device-native fallback, not an unsupported claim of literal 120 Hz on every device.
## 16. Current execution priority

The active continuation order is:

```text
canonical authority
→ inventory the implementation already present
→ preserve working code
→ finish all 11 public frontend routes
→ finish the separate Admin frontend control surfaces
→ connect both frontends to typed backend contracts
→ replace mock adapters progressively with backend authority
→ complete integration and verification
```

Do not restart NEXI as a greenfield dashboard.
Do not rebuild working routes merely to conform to a new plan.
The first implementation report after this charter must classify existing work as `KEEP`, `FINISH`, `REPLACE`, or `MISSING`.

## 17. Complete delivery roadmap

### Phase 0 — Canonical authority and inventory
Lock this charter, design authority, active project paths, current implementation inventory, exclusions, dependencies, and evidence model.

### Phase 1 — Current-state classification
Inspect the public frontend, Admin implementation, backend, database, Cloudflare runtime, contracts, adapters, and tests. Produce the `KEEP / FINISH / REPLACE / MISSING` matrix.

### Phase 2 — Public frontend completion
Complete the shared shell, Quotes Hub, Active Pair state, and all 11 public destinations using the Deep Liquid Violet authority.
### Phase 3 — Admin frontend completion
Build or finish the separate Admin Control Plane with the complete intended control surface and typed mock adapters where authoritative APIs are incomplete.

### Phase 4 — Shared contracts and adapters
Define canonical configuration, market, user, wallet, ledger, Spot, Binary, content, support, notification, audit, and sandbox interfaces shared across surfaces.

### Phase 5 — Authentication, RBAC, and security boundaries
Implement public and Admin identity boundaries, sessions, roles, permissions, environment checks, secret handling, and audit identity.

### Phase 6 — Database, ledger, and audit authority
Complete schemas, migrations, wallet domains, double-entry or equivalent ledger invariants, administrative correction records, reconciliation, and immutable audit linkage.

### Phase 7 — Market-data engine and live transport
Complete provider ingestion, normalization, health, staleness, REST contracts, WebSocket delivery, subscriptions, and cross-surface quote consistency.

### Phase 8 — Spot Trading authority
Complete order validation, execution model, fees, limits, state transitions, history, Admin controls, tests, and frontend integration.

### Phase 9 — Option / Binary authority and settlement
Complete configuration, durations, payouts, positions, exposure, entry and expiry pricing, settlement, history, Admin controls, and frontend integration.

### Phase 10 — Wallet operations
Complete deposits, withdrawals, internal transfers, conversion, wallet history, review workflows, reconciliation, and public/Admin integration.
### Phase 11 — Earn / Mining
Complete products, subscriptions, rewards, history, Admin controls, sandbox simulation, and public integration.

### Phase 12 — Loans
Complete products, eligibility, applications, decisions, repayment, delinquency, adjustments, history, Admin controls, and public integration.

### Phase 13 — Content, support, messages, and notifications
Complete announcements, Learn content, in-app support, chat, messages, targeting, delivery, read states, templates, and Admin workflows.

### Phase 14 — Sandbox simulation authority
Complete deterministic scenarios, forced outcomes, payout and market simulation, test balances, account and pair scoping, environment labels, reason capture, and audit evidence.

### Phase 15 — Full integration and browser verification
Verify public and Admin routes, responsive behavior, Active Pair synchronization, backend configuration propagation, live and failure states, and critical end-to-end workflows.

### Phase 16 — Security and defensive red-team validation
Perform threat modeling, authorization testing, input and abuse testing, secret review, financial invariant review, sandbox-boundary testing, and defensive remediation.

### Phase 17 — Observability, recovery, and operations
Complete logs, metrics, traces, health, alerts, reconciliation reports, incident controls, backup and recovery procedures, and operational runbooks.

### Phase 18 — Cloudflare deployment preparation
Validate Workers or container boundaries, configuration, secrets, networking, build artifacts, rollback, and environment separation without coupling domain logic to one deployment layout.
### Phase 19 — Independent completion review and approved release
Run final claim verification, code and security review, product-scope review, browser/runtime verification, release-candidate evidence, rollback verification, and explicit release approval.

Every phase must define:

- objective;
- verified inputs and dependencies;
- implementation scope;
- affected interfaces and data;
- outputs and acceptance criteria;
- automated tests and static validation;
- browser and runtime verification;
- security and audit checks;
- evidence and completion status;
- approval boundaries;
- rollback or recovery;
- next-phase handoff.

## 18. Anti-drift rules

Codex, agents, contributors, and automation must not:

- treat NEXI as a generic greenfield dashboard;
- reduce the program to frontend-only or backend-only work;
- reduce the program to Cloudflare recovery;
- treat a temporary bridge, mock adapter, or container as final authority;
- turn Quotes into a twelfth navigation item;
- create independent page-level Active Pair state;
- invent public prices, balances, payouts, PNL, or market outcomes;
- merge public and Admin authentication or control boundaries;
- remove Admin or sandbox controls because they appear sensitive;
- expose sandbox controls in the public application;
- revive retired Margin, leverage, futures, perpetual, portfolio-margin, or C2C surfaces;
- revive archived graphite, amber, generic crypto-neon, bento, banking, or casino design authority;
- delete agreed cryptographic research through generic assumptions;
- restore archived project documentation as current authority;
- revive Graphify-first routing or generated Graphify artifacts as product authority;
- claim completion from documentation, file creation, static checks, generated graphs, or tool success alone;
- deploy, publish, push, mutate production, change credentials, or perform destructive cleanup without current-turn approval;
- stop at a plan when implementation and verification were explicitly authorized.

## 19. Evidence and completion model

Keep these states distinct:

```text
specified
→ implemented
→ statically validated
→ tested
→ integrated
→ runtime verified
→ browser verified
→ security reviewed
→ independently reviewed
→ approved complete
```

A feature is incomplete when only its UI, mock adapter, backend endpoint, database table, test, or document exists in isolation.
Material completion claims require current source, test, runtime, browser, data, security, and integration evidence appropriate to the feature.
## 20. Definition of complete

The complete NEXI program requires all of the following:

- the locked 11-route public frontend is implemented and browser-verified;
- the Deep Liquid Violet design authority is consistently applied;
- Active Pair and market truth are shared correctly across consuming surfaces;
- the separate Admin Control Plane exposes the complete intended control surface;
- Admin configuration controls public frontend behavior through backend authority;
- authentication, roles, permissions, and environment boundaries are enforced;
- wallets, ledger, Spot, Binary, deposits, withdrawals, mining, loans, content, support, messages, and notifications are integrated;
- sandbox controls are functional, isolated, labeled, and audited;
- failure, stale, unavailable, maintenance, and recovery states are verified;
- tests, builds, runtime checks, browser checks, security review, observability, and recovery evidence pass;
- Cloudflare deployment preparation and rollback evidence are complete;
- an independent completion review confirms scope and evidence;
- release or deployment occurs only after explicit approval.

Until these conditions are met, report the exact completed, partial, blocked, and unverified states. Do not substitute documentation or planned intent for implementation evidence.

---

This charter is intentionally stable. Amend it only when the user explicitly changes the final product scope, architecture, exclusions, or definition of completion.
