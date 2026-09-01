# Addy Osmani Engineering Lifecycle

Preferred default lifecycle when the Addy pack is installed in ChatGPT Work.

## Meta
- using-agent-skills

## Define
- interview-me
- idea-refine
- spec-driven-development
- constraint-driven-development

## Plan
- planning-and-task-breakdown

## Build
- incremental-implementation
- test-driven-development
- context-engineering
- source-driven-development
- doubt-driven-development
- frontend-ui-engineering
- api-and-interface-design

## Verify
- browser-testing-with-devtools
- debugging-and-error-recovery

## Review
- code-review-and-quality
- code-simplification
- security-and-hardening
- performance-optimization

## Ship
- git-workflow-and-versioning
- ci-cd-and-automation
- deprecation-and-migration
- documentation-and-adrs
- observability-and-instrumentation
- shipping-and-launch

## Router use

Do not run the whole pack. Select the dependency-closed subset required by the active lifecycle phase and touched domains. Reuse already-completed phases.

### Established project continuation
Usually start with:

```text
context-engineering
→ Graphify
→ source-driven-development
→ current domain combo
→ incremental-implementation/TDD if modifying
→ review/verification
```

### Frontend

```text
Graphify
→ frontend-ui-engineering
→ source-driven-development
→ implementation
→ browser-testing-with-devtools
→ performance-optimization when performance is relevant or at a meaningful release gate
→ code-review-and-quality
```

### API/backend

```text
Graphify
→ source-driven-development
→ api-and-interface-design if a contract/boundary changes
→ backend/domain specialists
→ incremental-implementation
→ test-driven-development
→ review/runtime proof
```

### Hard bug

```text
reproduce
→ debugging-and-error-recovery
→ Graphify localization/path
→ source/runtime evidence
→ minimal fix
→ regression test
```

### High risk
Use `doubt-driven-development` only where stakes justify fresh adversarial review.
