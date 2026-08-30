# Router Contract

## 1. State packet

```yaml
goal:
project_root:
current_phase:
current_gate:
mode: read_only|modify

verified_complete: []
implemented_unverified: []
blocked: []
superseded: []
known_failed_paths: []

already_read: []
already_queried_graph: []
already_retrieved_docs: []
already_passed_checks: []

changed_surface: []
invalidated_evidence: []
unknowns: []
```

## 2. Evidence invalidation

Invalidate a proof only if at least one dependency changed materially:

- relevant source files or generated artifacts;
- API/schema/config/binding;
- dependency/runtime/provider version;
- graph topology for the affected path;
- acceptance criteria;
- test/runtime environment where proof depends on it.

Do not invalidate unrelated domains. CSS changes do not automatically invalidate D1 or API proof. Schema changes may invalidate downstream API/runtime checks.

## 3. Routing roles

Every selected skill must have one explicit role:

- CONTROL
- THINK
- GRAPH
- DOMAIN
- DOCS
- EXECUTE
- VERIFY
- MEMORY
- META

Do not select two skills for the same primary role unless the second is an explicit independent verifier or a documented complementary specialist.

## 4. Control precedence

1. This router owns task decomposition and composition.
2. Claus `orchestrate-projects` or `design-optimal-ai-workflow` may be used for broad workflow architecture, not as a second live controller.
3. Frontier `goal-contract` may author bounded worker contracts.
4. gstack may own an explicit phase such as plan/review/QA/ship when requested or useful.
5. Superpowers may provide engineering discipline skills, not override the current router state.

## 5. Task-size policy

### Tiny isolated edit
Graphify freshness + one bounded query if repository relationship matters; otherwise source + focused check. No broad planning.

### Medium multi-module change
Graphify + Addy context/source + one primary domain combo + tests + review.

### Large/ambiguous change
Graphify architecture + state recovery + spec/constraints if not already established + task DAG + bounded parallel combo workstreams + integration verifier.

### Hard defect
Reproduce first. Addy debugging + Graphify localization/path + runtime/test proof. Avoid redesign until root cause is established.

### High risk
Addy doubt/security + independent verification + stricter evidence. Do not automatically broaden unrelated checks.

## 6. Skill admission

The installed inventory is the default closed set. A web-discovered skill is never routed merely because it exists.

Exception: a skill explicitly confirmed by the user as installed in ChatGPT Work may be referenced by exact confirmed name/package, such as the Addy Osmani pack.

If a capability is missing, emit `CAPABILITY_GAP` and recommend evaluation rather than silently substituting.

## 7. Token economy

- Graphify queries should start around 500–1500 output tokens when possible.
- Workers receive current state + graph slice + exact files, not full chat history.
- Domain docs are retrieved only after the relevant technology is known.
- Do not send every selected skill's full text to every worker.
- Fan-in uses structured receipts.
- Stop when acceptance criteria are proven.
