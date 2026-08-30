# Evidence and Worker Contract

## Worker input

```yaml
task_id:
workstream:
objective:
mode: read_only|modify

known_verified_state: []
invalidated_evidence: []
unknowns: []
forbidden_repeat: []

graph_context:
  question:
  mode:
  depth:
  token_budget:
  nodes_or_paths: []

owned_files_or_surfaces: []
selected_skills: []
acceptance_checks: []

budgets:
  token_budget:
  attempt_budget:
  time_budget:

stop_when:
escalate_when:
```

## Worker return receipt

```yaml
task_id:
workstream:
status: PASS|FAIL|BLOCKED|UNKNOWN

facts_confirmed: []
facts_changed: []
findings: []
changes: []
checks_executed: []
runtime_evidence: []

graph_evidence:
  queries: []
  affected_nodes: []
  changed_topology: false

claims_not_proven: []
new_unknowns: []
invalidates: []
requires_followup: false
next_dependency:
```

## Fan-in rules

- Do not accept prose-only "done" claims.
- If two workers conflict, preserve both claims and reconcile against source/runtime evidence.
- A worker may not expand its own scope without explicit escalation.
- Shared files/state require one integration owner.
