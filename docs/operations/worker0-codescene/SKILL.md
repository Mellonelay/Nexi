---
name: nexi-codescene-quality-gates
description: Integrate CodeScene CLI and MCP into NEXI and Worker-0 code changes, refactoring, pre-commit safeguards, PR risk reviews, tool updates, and Code Health planning. Use with the NEXI Work Kernel when AI modifies code or maintainability evidence is needed; route the nine official CodeScene skills by task.
---

# NEXI CodeScene Quality Gates

Keep the NEXI Work Kernel as parent controller. Apply using-agent-skills to the current phase. Read [the organized skill and capability list](references/capabilities.md) for task routing, commands, evidence boundaries and ACE constraints.

## Three parent-owned lanes

1. Implementation: one semantic writer, surgical repairs, invalidated checks, Git fan-in and authorized deployment.
2. Structural evidence: Graphify Locate → Impact → Multi-View; broader causal analysis only when ambiguity remains. Fallow checks dead code, unused dependencies and structural findings. CodeScene owns maintainability and Code Health. Avoid duplicate scans.
3. Runtime evidence: real API/deployed generation and preserved authenticated Chrome. Polypane owns affected responsive/perceptual breadth. Static tools do not prove rendered or financial behavior.

Parallelize independent reads. Serialize shared source, indexes, configuration, skills, Git, deployment and completion claims. Preserve paused candidates, existing authority diffs and completed geometry.

## Mandatory change gates

- Treat Code Health as authoritative for maintainability. Target **10.0** for AI-touched scorable code; 9+ is not the owner's completion standard. A non-regression PASS does not establish 10.0.
- Inspect a baseline before a nontrivial code edit. After each AI modification, run `code_health_review` on the touched supported file and record its score/findings.
- Before every commit-oriented recommendation or commit, run `pre_commit_code_health_safeguard` for the actual repository. Inspect `quality_gates`, metadata status and checked-file count; empty results do not prove coverage.
- Compose the deterministic staged CLI guard, `cs delta --git-hook --staged`, with existing repository hooks. Never overwrite another hook, silently skip an unavailable CLI, weaken scoring rules, or treat plain `cs delta` exit 0 as PASS.
- Before a PR, run `analyze_change_set` against the exact existing base ref. It compares **HEAD**, not uncommitted changes; retain the pre-commit gate for those.
- On regression or a missed target, inspect the review, plan 3–5 small causal refactor steps, remeasure after each significant step, and run behavior checks. Do not declare ready until restored and the target is met, or the owner explicitly accepts a scoped risk. Record inherited debt and blocked targets honestly; avoid unrelated rewrites or reopening closed geometry.
- Unsupported files and zero eligible files are **NOT_SCORED**, not 10.0. Use their applicable validator.

## Discover, invoke and reuse

Prefer the healthy persistent `mcpc @nexi-codescene` session on Worker-0; use `rdc-mcp codescene` for distinct diagnostics. Discover the needed tool schema, invoke it, use the result and cache the unchanged contract. Refresh after updates, auth/schema changes or contradictory results. Record DISCOVERED → INSTRUCTIONS_READ → INVOKED → RESULT_USED separately.

Use live names: `select_project`, project/file variants of hotspots and goals, and `code_ownership_for_path`. Do not invoke stale `select_codescene_project`. Match project IDs to NEXI; exposed tools and valid auth do not prove project analysis exists. Local review/delta remain useful when project APIs are blocked.

Keep credentials out of receipts. Reuse existing auth. Account switching, scoring-rule edits and ACE require their relevant scope and owner authorization. Tool updates do not authorize logout, credential migration or application rewrites.

## Completion

Report exact versions, actual results and covered files/refs. Keep source, deployed release and product acceptance separate. Record complete requested text/skill reads separately from unread videos, linked papers and untested features. Save bounded evidence through the existing controller rather than creating another ledger.
