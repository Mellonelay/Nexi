# Mellonelay OmniRoute Operating Updates Implementation Plan

> **For agentic workers:** This plan is for the native parent. Keep child work read-only and validate every child `agent-report-v1` before use.

**Goal:** Apply the supplied Full Harness/OmniRoute operating updates to the repository's active policy and operational documentation without changing NEXI product authority or runtime state.

**Architecture:** Add one repository-local operational manual as the detailed source-linked reference. Synchronize the root/project instructions, low-token guidance, verification policy, hook context, and Nexi runtime skill with compact rules that point back to that manual.

**Tech Stack:** Markdown, YAML, JSON, PowerShell, existing Full Harness RC3 validators.

## Global Constraints

- Preserve `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md` as the permanent product and completion authority.
- Preserve the Windows ARM64 / PowerShell 7 operating boundary.
- Preserve the 66-skill catalog and minimum dependency-closed routing.
- Preserve native-parent mutation, approval, synthesis, and final-completion authority.
- Keep bounded OmniRoute child roles read-only; do not expose secrets or change runtime credentials.
- Do not deploy, publish, push, mutate production, change live infrastructure, or perform destructive cleanup.

### Task 1: Capture the task contract

**Files:**
- Create: `work/20260727-omniroute-updates/INTENT.yaml`
- Create: `work/20260727-omniroute-updates/ISC.json`
- Create: `work/20260727-omniroute-updates/SKILL_ROUTE.json`

- [x] Record the supplied PDF/manual as operational source material and list the exact policy surfaces in scope.
- [x] Compile and validate the full-mode dependency-closed route before edits.

### Task 2: Add the repository operational manual

**Files:**
- Create: `docs/MELLONELAY_FULL_STACK_UTILIZATION_OPERATING_MANUAL.md`

- [x] Document the parent/child authority model, minimum route, evidence states, OmniRoute cost correction, fallback limitation, safety boundaries, maintenance checks, and requalification gates.
- [x] Explicitly state that the document is subordinate to the NEXI product charter and does not prove current runtime state by itself.

### Task 3: Synchronize active policy surfaces

**Files:**
- Modify: `AGENTS.md`
- Modify: `CODEX_LOW_TOKEN_RULES.md`
- Modify: `.codex/AGENTS.md`
- Modify: `.codex/CUSTOM_INSTRUCTIONS.md`
- Modify: `.codex/references/verification-policy.md`
- Modify: `.agents/skills/nexi-low-token-runtime/SKILL.md`

- [x] Add the manual reference and extended evidence chain.
- [x] Record native-parent ownership, three bounded read-only roles, one-correction fallback, and the non-API-free/non-zero-cost OmniRoute wording.

### Task 4: Synchronize hook context

**Files:**
- Modify: `.codex/hooks/session_start_full_harness.ps1`
- Modify: `.codex/hooks/user_prompt_submit.ps1`

- [x] Make startup/prompt context point to the operational manual and parent-side fallback without exposing secrets or changing hook authority.

### Task 5: Verify and reconcile

- [x] Validate JSON/YAML and PowerShell syntax.
- [x] Run targeted positive/negative consistency searches.
- [x] Confirm the charter was not targeted and summarize the changed-file ledger.
- [x] Report any runtime claims as supplied-report evidence only unless freshly re-verified.
