# Combo Matrix

All names beyond the Addy pack must resolve in the installed inventory before invocation.

## Cloudflare Platform Combo

CONTROL: current router
GRAPH: Graphify
LIFECYCLE: Addy context/source/incremental/TDD/review as needed
DOMAIN:
- cloudflare
- workers-best-practices when Worker code/config is touched
- wrangler before Wrangler commands
- durable-objects when DOs are touched
- agents-sdk for Cloudflare Agents SDK
- sandbox-stable / sandbox-next / sandbox-migrate-to-next by actual package/version
- d1-drizzle-schema / d1-migration when present and relevant
- cloudflare-deploy only when deployment is explicitly requested
VERIFY: focused runtime/binding/storage/observability proof + codex-engineering-guardrails:codex-engineering-guardrails:code-verification / Riqor for consequential claims

Rules:
- retrieve current Cloudflare documentation instead of relying on memory;
- do not load every Cloudflare skill;
- check whether the exact sub-product was already completed/verified before reopening it.

## Frontend Product Combo

GRAPH: Graphify page→component→state→API/backend paths
LIFECYCLE:
- frontend-ui-engineering
- source-driven-development
- incremental-implementation
- browser-testing-with-devtools
- performance-optimization when warranted
- code-review-and-quality
DOMAIN/QUALITY when present:
- premium/high-fidelity interface implementation
- frontend-app-builder for creation/redesign
- frontend-testing-debugging for responsive/runtime issues
- react-best-practices for React/Next
- Riqor UI/UX/finish-gate specialists
- cloudflare:web-perf for measured browser performance
VERIFY: browser + responsive + accessibility + visual/perceptual + performance evidence proportional to change

Mobile-first policy: validate narrow/mobile layouts before desktop for layout-affecting changes.

## Backend/API Contract Combo

GRAPH: request→route→auth→DTO→service→authority→persistence→side effect→response
LIFECYCLE:
- source-driven-development
- api-and-interface-design when interfaces change
- incremental-implementation
- test-driven-development
- code-review-and-quality
DOMAIN: inventory-backed backend/API/database/realtime specialists
CONTRACT: API Documentation Checker / API Impact Mapper when available in the current host
VERIFY: focused unit/integration/contract/runtime evidence

## Debug/Runtime Recovery Combo

LIFECYCLE: debugging-and-error-recovery
GRAPH: bounded BFS then DFS/path/neighbors as hypothesis narrows
DOCS: current provider/framework docs only if behavior depends on them
DOMAIN: one primary specialist
VERIFY: reproduce → minimal fix → regression guard → runtime confirmation

## Security/Authority Combo

GRAPH: entry point→validation→authn/authz→privileged operation→persistence/side effect
LIFECYCLE: security-and-hardening + doubt-driven-development where high risk
DOMAIN: inventory-backed security specialist
VERIFY: negative paths + runtime/test evidence + independent verifier

## Migration/Deprecation Combo

GRAPH: old/new paths + consumers + persistence/config dependencies
LIFECYCLE: deprecation-and-migration + source-driven-development + tests
DOMAIN: platform/database specialist
VERIFY: compatibility, migration state, rollback/recovery, affected consumers

## Completion Combo

- code-review-and-quality
- code-simplification only if complexity remains and behavior is already proven
- observability-and-instrumentation for production runtime changes
- ci-cd-and-automation when pipeline behavior changed
- shipping-and-launch only when actual release/launch scope exists
- codex-engineering-guardrails:code-verification / Riqor independent evidence for consequential completion claims
