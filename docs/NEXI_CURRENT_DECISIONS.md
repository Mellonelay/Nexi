# NEXI Current Decisions

LAST_UPDATED: 2026-08-28  
STATUS: CURRENT OWNER DECISIONS  
SCOPE: Whole NEXI project

## Purpose

This file records durable current owner decisions that must survive chat/session changes.

It is **decision authority**, not implementation evidence.

Use it together with:

- repository/root `AGENTS.md`;
- nearest subsystem `AGENTS.md`;
- `CURRENT_STAGE.md`;
- authoritative current source;
- fresh runtime/test/browser/provider evidence.

When this file conflicts with older roadmaps, historical DEXI evidence, old Notion/Linear pages, archived chat exports, or stale subsystem instructions, this file wins for **intended current architecture/product direction**.

It does not override contradictory source/runtime evidence about what currently exists. If implementation reality differs from this file, report the drift and reconcile it rather than pretending the implementation already matches.

---

# 1. Current Architecture Decision

NEXI remains a three-surface system:

```text
Public NEXI frontend
        |
        | HTTPS / realtime
        v
Cloudflare Worker
        |
        v
Cloudflare Container
        |
        v
NestJS business/domain authority
        |
        +--> D1
        +--> Aiven Valkey
        +--> R2 / Data Catalog / Pipelines
        +--> external market/provider services

Separate Admin Control Plane
        |
        | Admin API
        v
same authoritative backend/domain services
```

The three surfaces remain separate:

1. Public frontend.
2. Authoritative backend/runtime.
3. Separate Admin Control Plane.

Do not embed Admin into the public frontend.

---

# 2. Authority Ownership

## NestJS

NestJS remains the application and business authority.

NestJS owns:

- authentication/session domain decisions;
- wallet/account rules;
- ledger commands and financial invariants;
- deposits;
- withdrawals;
- transfers;
- conversion;
- Spot;
- isolated Margin;
- Binary/Options;
- Mining;
- Loans;
- communications/content business rules;
- Admin/governance commands;
- validation;
- authorization;
- idempotency;
- settlement decisions;
- audit/event creation.

Cloudflare infrastructure may support these operations but must not silently replace NestJS business authority.

## D1

D1 is the current durable application and financial relational authority.

D1 owns durable state for the converted NEXI application/financial domains.

Do not restore PostgreSQL/Neon as the primary financial authority unless the owner explicitly reverses the D1 decision.

Historical PostgreSQL/Prisma assumptions must be treated as migration/legacy evidence and reconciled against current D1-authoritative source.

## Aiven Valkey

Aiven Valkey is ephemeral infrastructure for:

- cache;
- coordination;
- Redis Streams;
- Socket.IO distribution;
- transient realtime state;
- locks/coordination where current design requires them.

Aiven is not durable financial truth.

## R2 / Data Catalog / Pipelines

R2, R2 Data Catalog and Pipelines own high-volume market archive/history and related large-object/archive workloads.

Do not grow high-volume market-history/tape/depth data unboundedly inside D1 merely because D1 is the application database.

---

# 3. Cloudflare Capability Expansion Is Explicitly Deferred

The newly discussed Cloudflare-native capability expansion is **not authorized for implementation yet**.

This includes new architecture or implementation around:

- Workers KV;
- Analytics Engine;
- Secrets Store;
- Queues;
- Workflows;
- new Durable Object responsibilities;
- new Service Binding architecture;
- new outbound-handler capability gateways;
- new Container egress/allowlist policy;
- new Cloudflare rate-limit integration beyond already-established behavior;
- new provider-secret proxying through outbound handlers;
- new Cloudflare AI / Vectorize / Browser Run / Images / Stream usage.

Existing Cloudflare infrastructure required by the current application must remain intact and may be repaired as needed.

Existing D1, Worker, Container, R2, Data Catalog, Pipelines and current outbound/bridge code are **not** being rolled back.

The deferment applies to the **new capability expansion/design phase**.

---

# 4. Required Order Before New Cloudflare Capability Work

Do not begin the new Cloudflare capability-expansion phase until the following work is materially advanced and reconciled:

```text
1. Reconcile and continue the current backend implementation.
2. Finish the remaining D1 financial/domain semantics and authority cleanup.
3. Reconcile current API/OpenAPI contracts.
4. Continue the already-advanced public frontend against canonical backend contracts.
5. Continue/reconcile the separate Admin Control Plane against canonical backend contracts.
6. Verify communications/content contracts against current backend/D1/Admin/frontend state.
7. Reach a stable backend/frontend/Admin contract boundary.
8. Then begin a dedicated Cloudflare documentation and architecture phase.
```

Do not mix the future Cloudflare capability redesign into the current backend-reconciliation campaign.

---

# 5. Cloudflare Docs-First Rule for the Later Phase

When the deferred Cloudflare capability phase begins, do **not** design or implement from model memory, old chat history, stale examples, or assumptions.

Before any Cloudflare-specific architecture or code change:

1. Identify the exact Cloudflare product/resource/runtime/config surface.
2. Identify the relevant installed Wrangler/Containers/runtime version.
3. Read the current official Cloudflare documentation for that exact behavior.
4. Read the relevant documentation in detail, including limitations, runtime semantics, local-development behavior, permissions, binding shape, lifecycle, failure behavior, and pricing/plan constraints where relevant.
5. Prefer official Cloudflare documentation / Cloudflare MCP / current Wrangler schema as authority.
6. Use Context7 or other retrieval tools only as supporting retrieval, not as a replacement for current official Cloudflare docs.
7. Compare the documented contract with current NEXI source/config/runtime.
8. Only then decide whether the capability should be:
   - `USE_NOW`
   - `USE_SELECTIVELY`
   - `DEFER`
   - `REJECT`
   - `OVERLAPS_EXISTING_SERVICE`
9. Implement only after the capability-placement decision is explicit.
10. Verify using direct VM/Container/Cloudflare/provider evidence.

For Cloudflare work, current documentation retrieval is mandatory.

---

# 6. Future Cloudflare Capability Placement Must Be Deliberate

Do not enable Cloudflare products merely because they are available.

For every candidate capability, produce a placement record:

```text
Capability:
Current NEXI need:
Current implementation:
Candidate Cloudflare role:
Existing service overlap:
Business authority affected:
Durable financial authority affected:
Security impact:
Runtime dependency:
Free/paid plan relevance:
Migration required:
Use now / selective / defer / reject:
Evidence:
```

The goal is one clear responsibility per service, not overlapping authorities.

Expected direction from the current discussion, subject to later full documentation review:

```text
D1
= durable application + financial truth

R2 / Data Catalog / Pipelines
= high-volume market archive/history/analytics

Aiven Valkey
= cache + Redis Streams + Socket.IO/realtime coordination

Workers
= edge/runtime/bridge infrastructure

Potential later additions:
KV
= low-risk config/read cache

Analytics Engine
= operational/product/provider telemetry

Secrets Store
= Cloudflare-managed runtime secrets

Queues
= async delivery/retry/fan-out

Workflows
= long-running orchestration

Durable Objects
= selective realtime/stateful coordination where they do not duplicate Aiven
```

This expected direction is **not implementation authorization**. It must be revalidated against current official Cloudflare documentation during the dedicated Cloudflare phase.

---

# 7. Container-to-Bindings Decision

The owner has accepted the architectural possibility that Cloudflare Containers can access Worker bindings through outbound handlers.

The conceptual pattern is:

```text
NestJS Container
    |
    | internal HTTP request
    v
Container outbound handler / outboundByHost
    |
    v
Workers runtime
    |
    v
bound Cloudflare resource
```

This may later provide a clean same-provider infrastructure capability layer around the Container.

Important invariant:

```text
Worker/binding layer supports NestJS.
Worker/binding layer does not become the trading/financial business authority.
```

Example future conceptual flow:

```text
Frontend
→ Worker
→ Container
→ NestJS SpotService
→ typed infrastructure boundary
→ Worker binding
→ D1 / Queue / Workflow / R2 / KV as applicable
```

Do not implement generic privileged RPC such as one unrestricted `/cloudflare` proxy.

If capability gateways are implemented later, prefer narrow typed boundaries per capability/domain.

---

# 8. Current Product Scope

Current NEXI product decisions outrank historical DEXI behavior.

Current trading scope:

- Spot.
- Isolated Margin on the Spot surface.
- Options/Binary/Microtrade as the separate Options surface.

Excluded unless the owner explicitly changes scope:

- cross margin;
- futures;
- perpetuals;
- portfolio margin;
- C2C;
- copy trading.

Canonical market catalog:

- 53 canonical assets.
- Crypto: 17.
- Stocks: 20.
- Forex: 9.
- Metals: 7.
- SHIB is historical feed-only and must not become canonical asset 54.
- XZNUSD is Zinc/USD.

---

# 9. Communications / Content Contract Is Already Established

Do not rediscover whether these domains should exist.

Current established contracts:

## Support

```text
user support request
→ Admin ticket queue
→ assignment
→ internal notes
→ reply
→ escalation
→ resolution
→ persisted/audited/realtime response
```

## Messages

```text
conversation
→ sequence
→ delivery state
→ read state
→ moderation
→ persistence/reconnect
```

## Announcements

```text
draft
→ review
→ schedule
→ publish
→ archive
→ localization
```

## Learn

```text
Admin authoring
→ category/content
→ revisions
→ tags/media
→ publication
→ frontend read
```

Learn is one product slice. Do not create a separate School product.

## Notifications

```text
targeting
→ scheduling
→ delivery
→ retry/failure
→ read state
```

Current work should reconcile these established contracts against D1/source/API/Admin/frontend implementation before proposing new schema.

---

# 10. Admin Decision

Admin remains a separate peer application/control plane.

Preserve:

- separate Admin authentication;
- RBAC;
- governance/approval semantics;
- audit;
- operational controls;
- Admin provider/API boundary.

Canonical backend control plane should converge on `/admin/*`.

Older domain-shaped Admin routes such as:

```text
/communications/admin/*
/kyc/admin/*
/mining/admin/*
/loans/admin/*
/wallet/admin/*
/financial/admin/*
/conversion/admin/*
```

are reconciliation/normalization targets, not justification for a second Admin architecture.

Do not rebuild completed Admin UI work.

---

# 11. Frontend Decision

The public frontend is already substantially advanced.

Preserve the accepted NEXI visual/product system and existing implementation.

Do not rebuild completed frontend surfaces merely because backend contracts are being reconciled.

Backend contract closure should enable adapter reconciliation rather than frontend replacement.

Known accepted direction includes:

- Office Agent/NEXI visual-system authority;
- Deep Liquid Violet visual language;
- established glass hierarchy;
- visual haptics/motion/reduced-motion behavior;
- responsive/mobile work;
- Support;
- Messages;
- Notifications;
- Announcements;
- Learn;
- Dashboard/market/trading work already present.

Authenticated inner-state verification and canonical backend wiring remain separate completion gates.

---

# 12. Current Backend Reconciliation Decision

The revised reconciliation package is a current historical/contract authority beneath current owner decisions/source/runtime.

Use both packages when requested, with the REVISED package superseding the original where they differ.

Do not restart broad DEXI forensic archaeology.

Use the reconciliation artifacts to answer:

```text
How much of the already-defined contract exists now?
What current source is canonical?
What remains legacy?
What remains D1-incomplete?
What remains runtime-unverified?
```

Do not ask again:

```text
Should Support exist?
Should Messages exist?
Should Admin be separate?
Should Learn exist?
What should the broad NEXI product be?
```

Those decisions are already established.

---

# 13. Current Backend Priority

Current backend execution remains focused on:

```text
D1 semantic conversion
→ canonical financial authority cleanup
→ identity/account/security reconciliation
→ referral/VIP verification
→ communications/Admin contract reconciliation
→ Mining lifecycle verification
→ Loan lifecycle verification
→ API/OpenAPI completeness
→ Activity/EventOutbox/Aiven/Socket.IO regression
→ Neon-free staging acceptance
```

Production remains unauthorized until staging acceptance.

---

# 14. Current Financial Verification State

Already established D1 semantic proof includes:

- ledger credit;
- debit;
- reservation;
- release;
- reconciliation;
- idempotent retry;
- paired transfer;
- atomic transfer invariant;
- synthetic cleanup.

These proofs must not be confused with complete end-to-end NestJS/Container acceptance.

Still requiring domain/application verification include, as applicable:

- Deposit;
- Withdrawal;
- Conversion;
- Spot full mutation/settlement/cancel lifecycle;
- Margin;
- Binary settlement;
- Mining financial lifecycle;
- Loans financial lifecycle;
- authenticated application-path proof;
- Neon-free staging acceptance.

Do not invent conversion rates or financial policy when current source/config does not define them.

---

# 15. Execution-Plane Decision

Windows project root:

```text
C:\trae_projects\Dexi_style_TraeWV
```

is the active Windows control/frontend/Admin workspace.

Authoritative backend runtime/engineering plane remains the configured NEXI VM workspace unless the owner explicitly changes that decision.

Do not independently implement the same backend change on both Windows and VM copies.

Synchronize verified backend milestones deliberately.

Cloudflare/Wrangler/Container/D1/R2/Pipelines platform-sensitive execution remains VM-side unless the owner explicitly changes the execution-plane decision.

---

# 16. No-Git Decision

Do not invent or depend on Git history for NEXI execution.

Unless the owner explicitly requests Git:

- do not use Git as project authority;
- do not invent commits, branches, blame, or diffs;
- use authoritative current source, Graphify, Codebase Memory Pro, tests, runtime, browser, and provider evidence.

---

# 17. Completion Discipline

Keep states distinct:

```text
SPECIFIED
IMPLEMENTED
STATICALLY_VALIDATED
TESTED
INTEGRATED
RUNTIME_VERIFIED
BROWSER_VERIFIED
SECURITY_REVIEWED
COMPLETE
```

Do not promote a subsystem merely because:

- source exists;
- a mock exists;
- a D1 direct probe passed;
- a build passed;
- a historical receipt says it once worked.

Use fresh evidence for the exact completion claim.

---

# 18. Owner Approval Boundaries

Normal reversible implementation inside an already-approved bounded task may proceed autonomously.

Explicit owner approval is required for:

- production deployment;
- destructive production changes;
- credential/secret mutation;
- irreversible migration;
- live routing changes;
- deletion of important source/data/evidence;
- major architecture reversal;
- new Cloudflare capability-expansion implementation before the dedicated Cloudflare docs phase.

---

# 19. Immediate Program Order

Current program order is:

```text
1. Fully read/reconcile the current NEXI reconciliation packages where requested.
2. Continue backend implementation and D1 authority conversion.
3. Close current backend/domain/API contracts.
4. Continue the already-advanced public frontend against canonical contracts.
5. Continue/reconcile the separate Admin Control Plane.
6. Reach stable backend/frontend/Admin contract alignment.
7. Start a dedicated Cloudflare documentation phase.
8. Read all relevant current Cloudflare documentation in detail.
9. Produce the Cloudflare capability-placement matrix.
10. Decide the final Cloudflare-native capability architecture.
11. Implement the approved Cloudflare capability expansion.
12. Run full staging acceptance.
13. Production review only after staging acceptance.
```

Do not skip directly from current backend work to step 8–11.

---

# 20. Machine-Readable Decisions

```text
NEXI_THREE_SURFACE_ARCHITECTURE=LOCKED
NESTJS_BUSINESS_AUTHORITY=YES
D1_DURABLE_APPLICATION_FINANCIAL_AUTHORITY=YES
AIVEN_EPHEMERAL_REALTIME_AUTHORITY=YES
R2_MARKET_ARCHIVE_AUTHORITY=YES

NEW_CLOUDFLARE_CAPABILITY_EXPANSION=DEFERRED
CLOUDFLARE_DOCS_FULL_READ_REQUIRED_BEFORE_EXPANSION=YES
CLOUDFLARE_IMPLEMENT_FROM_MEMORY=NO
CONTAINER_OUTBOUND_BINDING_PATTERN=ACCEPTED_FOR_LATER_EVALUATION
WORKER_FINANCIAL_BUSINESS_AUTHORITY=NO

FRONTEND_REBUILD=NO
ADMIN_REBUILD=NO
DEXI_BROAD_FORENSIC_RESTART=NO

COMMUNICATION_CONTRACTS=ESTABLISHED
ADMIN_SEPARATE_CONTROL_PLANE=LOCKED
CANONICAL_ADMIN_API_DIRECTION=/admin/*

CURRENT_BACKEND_PRIORITY=D1_AND_DOMAIN_CONTRACT_COMPLETION
PRODUCTION_DEPLOYMENT_AUTHORIZED=NO
GIT_AUTHORITY=NO
```
