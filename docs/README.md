# NEXI Engineering Documentation

**Purpose:** current navigation and ownership, not a phase-completion controller.
**Source policy:** owner decisions > direct runtime proof for runtime claims > GitHub `main` for durable source > platform/graph/static evidence > historical documents. A document never proves deployment or feature acceptance by itself.

## Start here

- [Current state](../NEXI_CURRENT_STATE.md): compact source/runtime split and next verified frontier; recheck volatile values.
- [Repository law](../AGENTS.md): active development, operational boundaries, production source/build constraints.
- [System architecture](architecture/NEXI_SYSTEM_ARCHITECTURE.md) and [cross-surface feature map](architecture/CROSS_SURFACE_FEATURE_MAP.md): ownership and product-to-code interfaces.
- [Backend](backend/README.md): domain features, NestJS owners, persistence, APIs and events.
- [Public frontend](frontend/README.md): user journeys, Next.js routes, wallet account display, backend consumers, responsive design.
- [Admin](admin/README.md): governance, RBAC, Admin routes, backend control authority, audit.
- [Operational Sentry](operations/NEXI_SENTRY_OBSERVABILITY.md): Sentry SDK/source, release lifecycle, telemetry and failure verification.
- [Infrastructure](infrastructure/): Cloudflare Worker/Container/D1, R2, Valkey, runtime/build procedures.
- [Contracts](contracts/): API/event artifacts. Generated API material must be checked against its source revision.
- [Security](security/): SIWE, ownership, privileged controls, Ledger/financial integrity.
- [Quality](quality/): retained test and browser evidence. Old receipts prove only their recorded revision and scope.

## Documentation rules

1. The exact code and tests on current GitHub `main` define what is implemented; live runtime is established separately, per deployed surface.
2. **One owning explanation per invariant:** financial truth lives under Backend/Contracts; Public and Admin link to it without independently changing rules.
3. An entry may be `SPECIFIED`, `SOURCE_IMPLEMENTED`, `TESTED`, `RUNTIME_VERIFIED`, `DEPLOYED`, or `OWNER_ACCEPTED`. Do not flatten these states.
4. Prefer path+symbol/API references over thousands of generated file-level summaries; code is the final implementation detail.
5. Keep released source identifiers separate for Backend Worker/Container, Public, Admin and Sentry. Do not force one SHA onto different builds.
6. Git history and `docs/archive/` carry provenance only. Historical charters, ledgers, checkpoints, old visuals and screenshots do not override current owner decisions.

## Supersession notice

`NEXI_PRODUCTION_COMPLETION_LEDGER.md`, `tasks/plan.md`, `tasks/todo.md`, `docs/implementation/` and old phase documents are **historical evidence, not a current workflow gate**, under the latest owner direction. If an old executable hook still refers to them, treat that as a compatibility/dependency to reconcile separately—not authorization to block current work.

## Changes to this documentation

For a domain change, update its owning document and cross-surface map only when the behavior or interface changes. Avoid duplicating transient logs, work-session narratives and release receipts in architectural documents. Preserve historical decisions in Git when replacing old text.
