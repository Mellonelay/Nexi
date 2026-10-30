# NEXI capability-routing cleanup — 2026-10-30

## Outcome

- Removed the retired third-party scanner MCP entry with `codex mcp remove vibedoctor`; the CLI reported `Removed global MCP server 'vibedoctor'.`
- Removed the corresponding Codex plugin with `codex plugin remove 'vibedoctor@openai-curated-remote'`; the CLI returned the removed plugin identity.
- Updated the current NEXI capability routing, Codex overlay, global MCP catalog/router, current-state and proof-reuse notes, and plan/todo entries to describe available engineering skills and tools by responsibility.
- Historical dated audit receipts and roadmap remain archival provenance; they are not current installation or availability records.

## Verification and limits

- `codex mcp list` no longer lists the retired MCP. The configured entries include Graphify, Fallow, CodeScene, Vibe Coding, Ponytail, and Sentry; Sentry is not logged in and several local entries report `Unsupported` in this registry output.
- The plugin removal command succeeded. The plugin cache directory is absent. The currently running Codex process was not restarted, so its in-memory registry may remain until a new process starts.
- Active routing files were searched for the retired product name; historical evidence/roadmap files were excluded from cleanup to preserve past tool-use provenance.
- `git diff --check` is the only repository check planned for this documentation/configuration change. No application tests, typechecks, builds, deployment, service restart, migration, production mutation, or browser acceptance were run.

## Skills and methods actually used

- Ponytail: full minimal-change rules invoked through its MCP instructions; `ponytail-debt` search performed with no markers found; review applied to the scoped docs/config diff. Whole-repository code audit and code-simplification are not applicable to this documentation/configuration-only change.
- Short Circuit: context-bounded single-parent execution; its installed context-health assess command returned `checkpoint` for one compaction and one observed context-loss signal. No handoff was requested or authorized.
- Vibe Coding Library: catalog/domain/workflow retrieval used for MCP-server audit/polish and documentation synchronization guidance. Retrieved guidance is not an independent source audit.
- Agent Skills: context engineering, using-agent-skills, documentation/ADRs, and deprecation/migration methods were read and applied to bounded scope and preserved historical receipts.

## Changed-state boundary

No product source, dependencies, runtime configuration, financial data, or production services changed. This cleanup does not complete the broader three-surface source-integration task.
