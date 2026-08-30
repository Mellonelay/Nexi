---
name: mellonelay-engineering-skill-router
description: Orchestrate deep existing-codebase engineering in ChatGPT Work using Graphify as the always-on codebase intelligence substrate, Addy Osmani's engineering lifecycle as the default build discipline, and only inventory-backed specialist skills. Reuse prior proof, avoid repeated discovery, decompose work into bounded parallel combo lanes, and finish with proportional verification and evidence receipts.
license: MIT
metadata:
  author: Mellonelay
  version: "1.1.0"
  compatibility: Codex, ChatGPT Work, and compatible Agent Skills hosts
  domain: software-engineering
  subdomain: agent-routing
  industries: software,infrastructure,web3
  status: active
  created: "2026-08-30"
  last_updated: "2026-08-30"
  updated_by: Codex
  reviewed_by: Skill Auditor rubric
  standard_edition: "OpenAI Agent Skills schema + Quality-Engineering-Skills Framework 1.0"
---

# Mellonelay Engineering Skill Router

Use this skill for non-trivial engineering work on established codebases, especially multi-module, Cloudflare, backend/API, frontend/mobile-first, debugging, migration, runtime, and long-running project continuation work.

This is a compound engineering controller, not a thin keyword router. It composes complete skill stacks from the installed inventory while keeping one control authority, one evidence model, and one shared Graphify substrate.

## When to use

Use this router for non-trivial work on an existing codebase: recovery or continuation, multi-module implementation, API or schema changes, frontend/backend integration, Cloudflare/runtime work, migrations, debugging, or release verification. Use it for a tiny isolated edit only when the edit has meaningful repository relationships or acceptance risk.

Do not use it as a generic web-research router, a replacement for a domain specialist, or permission to mutate production. For a purely informational question, route only the smallest documentation or analysis skill that answers it.

## Authority and capability states

Keep these states distinct in every state packet and receipt:

`installed` (files exist) → `discovered` (inventory exposes it) → `callable` (tools/runtime can invoke it) → `invoked` (used in this run) → `verified` (its result passed an objective check).

Never report an installed or discovered skill, connector, browser, CLI, or credential as callable or verified. A missing capability is `CAPABILITY_GAP`, with the exact fallback or next action recorded.

## Core contract

1. **Graphify is default-on for existing codebases.** Check graph availability/freshness first, then use bounded graph queries to understand the touched architecture before broad source scans.
2. **Reuse proven state.** Never reopen completed work unless relevant evidence was invalidated by source, graph, config, schema, dependency, or runtime changes.
3. **Addy lifecycle is the default engineering discipline.** Use the installed Addy Osmani `agent-skills` pack for context, source grounding, planning when needed, incremental implementation, testing, review, performance, security, observability, and shipping gates.
4. **Inventory is the routing universe.** Use only skills listed in the supplied/installed skill inventory plus explicitly confirmed ChatGPT Work skills. Do not silently substitute web-discovered skills.
5. **One control authority.** Do not stack competing orchestrators. This skill owns routing; Claus/Frontier/gstack/Superpowers may be called as phase specialists when their exact job applies.
6. **Parallelize coherent workstreams, not tiny roles.** Fan out frontend, backend/API, Cloudflare/runtime, or verification lanes only when dependencies permit and mutation ownership is clear.
7. **Pass state, not history.** Give workers compact current-state packets, Graphify slices, exact files, selected skills, acceptance checks, and explicit no-repeat constraints.
8. **Proof beats graph inference.** Runtime/tests > direct source > extracted graph edges > inferred graph edges > historical summaries.
9. **Stop when acceptance is proven.** Do not continue architecture review, research, or duplicate verification after the current contract is satisfied.

Read `references/router-contract.md` for the full routing policy and `references/graphify-contract.md` before codebase work.

## Fast startup

For an established codebase:

1. Recover the smallest current state packet: objective, active phase, completed/verified work, blockers, known failed paths, already-read files, already-run graph questions, already-passed checks, and changed surface.
2. Check Graphify freshness. Prefer incremental refresh over full rebuild.
3. Ask one bounded graph question tied to the user goal. Use BFS for orientation; DFS/path for execution flow; neighbors/community/god nodes only when they answer a real question.
4. Identify the smallest dependency-closed set of workstreams.
5. Compose one complete combo stack per workstream using `references/combo-matrix.md`.
6. Dispatch only independent work in parallel. Shared-state mutation stays sequential or gets explicit ownership.
7. Fan in structured receipts, integrate, then run proportional verification.
8. If architecture changed, refresh Graphify and check affected paths before claiming completion.

## Operational workflow

1. Build the compact state packet in `references/router-contract.md`; classify each prior claim as `REUSE`, `REFRESH`, `REVERIFY`, `CONFLICT`, or `UNKNOWN`.
2. Select one `CONTROL` route (this router), one Graphify/Memory route, the smallest applicable Addy lifecycle set, and only the domain/docs/verification specialists needed for the current phase.
3. Define acceptance checks before mutation. Assign one integration owner and disjoint file/state ownership to any parallel lane; default fan-out is three.
4. Execute the smallest dependency-closed change. Keep staging and production actions explicit, and never use secrets or unverified external skills as hidden dependencies.
5. Run focused checks, then proportional integration/runtime checks. Refresh Graphify when topology changes and query the affected path, not the entire graph.
6. Fan in structured receipts, reconcile conflicts against source or runtime evidence, and stop once the completion gate is satisfied.

## Mandatory Graphify behavior

Use Graphify for all non-trivial work on existing codebases unless it is unavailable or demonstrably irrelevant to a tiny isolated edit. Do not treat Graphify as runtime truth.

Preferred order:

```text
freshness/update
→ bounded query
→ path/DFS if flow matters
→ node/neighbors/community only as needed
→ direct source
→ domain specialist(s)
→ implementation/test/runtime
→ graph refresh if structure changed
→ affected/impact check
```

Use explicit token budgets for Graphify MCP/query output. Start small and escalate. Do not dump the full graph into workers.

## Addy lifecycle defaults

When available, prefer these Addy skills by phase:

- session/context: `using-agent-skills`, `context-engineering`
- clarify only when genuinely underspecified: `interview-me`, `idea-refine`
- significant new work: `spec-driven-development`, `constraint-driven-development`, `planning-and-task-breakdown`
- implementation: `incremental-implementation`, `test-driven-development`, `source-driven-development`
- frontend: `frontend-ui-engineering`, `browser-testing-with-devtools`, `performance-optimization`
- API/boundaries: `api-and-interface-design`
- debugging: `debugging-and-error-recovery`
- high-risk challenge: `doubt-driven-development`
- review/cleanup: `code-review-and-quality`, `code-simplification`
- security: `security-and-hardening`
- production: `observability-and-instrumentation`, `ci-cd-and-automation`, `shipping-and-launch`
- architecture/change records: `documentation-and-adrs`
- migrations: `deprecation-and-migration`

Do not mechanically run every phase. Reuse completed phases and skip gates whose inputs did not change.

## Specialist composition

Use inventory-backed specialists only when their domain is touched. Common preferred combinations live in `references/combo-matrix.md`.

Examples:

- Cloudflare: Graphify + Addy source/incremental/TDD + `cloudflare` + relevant Cloudflare subskill + `wrangler` + runtime proof.
- Frontend/mobile-first: Graphify + Addy frontend/browser/performance + inventory-backed premium UI/UX finish gate.
- Backend/API: Graphify + Addy source/incremental/TDD + backend specialist + `api-and-interface-design` + API contract/impact tools when available.
- Security/high-risk: Graphify trust path + Addy security/doubt + security specialist + negative-path/runtime evidence.
- Hard bug: Addy debugging + Graphify localization/path + exact source + runtime/test evidence + regression guard.

## Anti-repeat rules

Never redo work solely because a new session or subagent started.

Classify prior evidence:

- `REUSE`: still current and unaffected.
- `REFRESH`: source/docs/runtime may have changed; update only the relevant slice.
- `REVERIFY`: proof is invalidated or was insufficient.
- `CONFLICT`: current sources disagree; resolve before mutation.
- `UNKNOWN`: no trustworthy evidence exists.

A worker packet must include `forbidden_repeat` entries for already-proven work.

## Parallelism contract

Parallelize only if:

- workstreams are dependency-independent for the current phase; and
- file/state ownership is disjoint or read-only; and
- each worker has a bounded acceptance contract.

Maximum default fan-out: 3 workstreams. Increase only when independence is explicit.

Each worker returns only the receipt schema from `references/evidence-contract.md`; no mini-essays.

## Documentation and current-source rules

For framework/library/provider behavior that can drift, use current official docs or Context7 after Graphify identifies the relevant technology. For Cloudflare tasks, prefer Cloudflare's own retrieval-first skills/docs and current Wrangler syntax.

For OpenAI, Codex, ChatGPT, Work, or API behavior, invoke `openai-docs` first and use only its official-source policy before planning or implementation. Do not rely on remembered product behavior.

Research tools are not default hot-path dependencies. Use them only for current facts, ecosystem/security questions, or missing official documentation.

## Token and context policy

Treat the token-optimizer harness as an observation/context sidecar, not as an execution authority or proof source. Use only its observe, guide, and checkpoint modes at phase boundaries; preserve the project instructions and do not silently compact, alter hooks/configuration, install daemons, or enable aggressive modes. Optimize packets and Graphify budgets before dropping evidence.

## Skill admission and trust boundary

For a new or externally discovered skill, record source, revision/hash, and inventory status; inspect it with Skill Auditor (and Skill Craft when callable) before routing it. Do not execute installer scripts or hidden commands merely because a repository advertises a skill. If admission is incomplete, return `CAPABILITY_GAP` and continue with an already verified route.

## Failure and fallback

If Graphify, a connector, a browser, or a CLI is unavailable, continue only with direct source/tests/runtime evidence that can answer the bounded objective, and mark the missing capability and reduced confidence in the receipt. Never fabricate graph, browser, provider, deployment, or runtime proof.

## Completion gate

Before claiming completion:

1. required acceptance checks passed;
2. material claims have source/test/runtime evidence;
3. no unresolved blocker affects the requested outcome;
4. changed architecture has a refreshed Graphify view when Graphify is available;
5. affected paths/consumers were checked proportionally;
6. no completed work was silently reopened or discarded;
7. the final receipt states what was not verified.

For consequential work, use an independent verification skill such as `codex-engineering-guardrails:code-verification` / Riqor when present in the inventory.

## Meta-quality

Use Skill Craft and Plugin Eval to review this skill itself after edits. Do not treat self-authored fixes as independently cleared. Keep the main `SKILL.md` compact; detailed maps belong in `references/`.

## Output format

Every run ends with a compact receipt (not a prose-only “done” claim):

```yaml
STATUS: PASS|PARTIAL|BLOCKED|UNKNOWN
OBJECTIVE:
PHASE:
ROUTED_SKILLS: []
REUSED_EVIDENCE: []
ACTIONS: []
FILES_CHANGED: []
CHECKS: []
EVIDENCE: []
BLOCKERS: []
NOT_VERIFIED: []
NEXT:
```

Worker receipts must additionally follow `references/evidence-contract.md`. Distinguish `confirmed`, `implemented_unverified`, `blocked`, and `assumed` facts; include command/test/runtime evidence for each material claim.

## Changelog

- **1.1.0 (2026-08-30):** Added schema/document-control metadata, explicit invocation and capability states, operational workflow, OpenAI-docs and token-policy routing, skill-admission/fallback rules, and a structured completion receipt.
- **1.0.0:** Initial Graphify-first Mellonelay engineering router with Addy lifecycle composition and evidence gates.
