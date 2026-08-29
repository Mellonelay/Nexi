# Mellonelay Full-Stack Utilization Operating Manual

**Status:** Operational PASS with documented runtime and hardening limitations.

**Source basis:** `C:\Users\mello\Downloads\Mellonelay_Codex_Full_Harness_OmniRoute_Complete_Report.pdf` (27 July 2026) and the supplied Full-Stack Utilization Operating Manual.

**Authority:** This is repository operating guidance. It does not override `docs\NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`, the synchronized visual-design authorities, platform safety policy, or explicit current-turn approval boundaries. The report and this manual are not runtime proof for future sessions.

## Operating model

```text
NEXI product authority -> native Codex parent -> Full Harness route
-> bounded repository evidence -> optional read-only children
-> parent implementation and synthesis -> tests/runtime/browser/review
-> claim verification and Quorum when required
```

The native Codex parent owns the objective, scope, approvals, mutations, synthesis, evidence reconciliation, and final completion claim. Full Harness selects the smallest dependency-closed route; it does not mean loading all 66 skill bodies.

## Mandatory route

```text
using-superpowers
-> kernel-using-full-harness
-> kernel-intent-contract for iteration/full work
-> kernel-capability-router
-> dexi-nexi-routing
-> smallest task-specific specialist route
-> verification-before-completion
-> claim-verification
-> Quorum when impact or uncertainty requires independent adjudication
```

Inspect catalog metadata and the dependency graph, but read only selected skill bodies. In full mode, persist and validate the route artifact before consequential action.

## Bounded child roles and authority

The accepted operating model has three bounded read-only roles:

- `mellonelay_pathfinder`: locate files, flows, ownership, and probable evidence.
- `mellonelay_source_verifier`: verify exact source/configuration claims and contradictions.
- `mellonelay_risk_reviewer`: challenge security, rollback, regression, and unsupported completion claims.

Children are evidence and review inputs, not final correctness or approval authorities. The parent must validate the `agent-report-v1` shape and required evidence after every child return. If invalid, request exactly one correction from the same child; if still invalid or unavailable, mark that result incomplete.

## Evidence states

Keep these states distinct:

```text
configured -> discovered -> trusted -> authenticated -> callable
-> invoked -> completed -> verified
```

An invocation, UI visibility, file presence, progress note, screenshot, or generated graph is not independent proof of behavior. Use current source, tests, logs, runtime/API responses, browser behavior, and deployment checks for behavioral claims. The supplied report's acceptance measurements remain report evidence, not an automatically current runtime state.

## OmniRoute correction

OmniRoute is a local OpenAI-compatible transport and model-selection layer. The children are not literally API-free and the report does not prove zero-cost inference. The operational benefit is centralized routing and avoiding a separate direct API integration or key for every child; provider, quota, subscription, and upstream billing behavior still depends on the active configuration.

OmniRoute does not own final completion, evidence authority, memory, production mutation, or approval. Do not expose API keys, tokens, cookies, or provider credentials in repository documentation or tool output.

## Accepted runtime limitations and hardening items

- Native `SubagentStop` dispatch was not observed on the tested patched Desktop/CLI runtime. Use the parent-side report-validation and one-correction fallback; do not repeatedly reinstall working hooks for this known compatibility limitation.
- A listener observed on `0.0.0.0:20128` is a network-hardening consideration. Treat loopback/firewall restriction as a separately approved hardening change, not as an installation failure.
- Desktop/CLI version skew and broad Remote Desktop Commander access are separate requalification or hardening concerns. Do not silently broaden privileges to remove them.

## Safety and mutation boundaries

- Children remain read-only unless an explicitly approved workflow says otherwise; the native parent performs authorized local edits.
- No deploy, publish, push, production mutation, credential change, live infrastructure change, destructive cleanup, or reset/clean action without explicit current-turn approval.
- Repository intelligence, Graphify, Codebase Memory, Second Brain, static validators, progress files, and generated reports are advisory or continuity evidence. They do not replace runtime proof.
- Preserve the NEXI three-surface architecture and product charter while applying operating guidance.

## Maintenance and requalification

At a routine review, check the local OmniRoute process/endpoint, active-key permissions without printing secrets, live-source versus installed-cache drift, role read-only posture, one parent-side `agent-report-v1` validation path, and evidence/rollback readability.

After a component upgrade, record versions and hashes, back up configuration and role metadata, upgrade one component at a time, run parse/static checks, exercise bounded CLI and Desktop child paths, test valid/invalid child reports, retest native `SubagentStop` only on a newer compatible runtime, and regenerate the evidence manifest before accepting the new state.

Requalification requires configuration parsing, catalog/graph agreement, read-only child enforcement, authenticated transport with observable usage, direct valid/invalid hook behavior, regenerated evidence with no unexplained drift, and no unapproved consequential mutation.

## Operator templates

### Read-only investigation

```text
OBJECTIVE: Investigate <problem>.
SCOPE: <repository, directories, systems, or files>.
BOUNDARIES: Read-only; do not edit, install, commit, push, deploy, change credentials, or mutate production.
CHILDREN: Use bounded read-only roles only for independent evidence lanes.
COMPLETION EVIDENCE: Sources inspected, verified facts, inference, contradictions, risks, and exact next action.
```

### Approved local implementation

```text
OBJECTIVE: Implement the approved change.
AUTHORITY: Native parent may edit only approved files; children remain read-only.
BOUNDARIES: No commit, push, deploy, credential change, production mutation, or destructive cleanup.
COMPLETION EVIDENCE: Changed-file ledger, relevant tests, static validation, runtime evidence, residual risks, rollback note, and claim verification.
```
