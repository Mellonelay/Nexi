# Codex Hook State Snapshot — 2026-10-25

The primary session inspected the native `/hooks` browser in a fresh interactive Codex CLI 0.164.0 session on the canonical checkout (`HEAD` `56da6ce`). This records the observed point-in-time configuration only; it does not establish subsequent state after a restart or configuration change.

| Event | Installed / active | Observed state |
|---|---:|---|
| PreToolUse | 2 / 2 | Project Graphify guidance and NEXI scoped skill/phase gate checked; both showed `Trust: Trusted`. |
| PostToolUse | 3 / 2 | NEXI scoped skill/phase gate and one UI-audit hook checked and trusted; the second UI-audit plugin hook was unchecked. The primary restored the original observed toggle state after accidentally navigating/toggling it; no net change was intended. |
| SessionStart | 7 / 6 | Agent Skills loading, NEXI scoped gate, Capability Orchestrator, Codex Coordinator 0.5.0 task-boundary, context continuity, and Ponytail mode hooks checked. Legacy Codex Coordinator 0.4.0 hook unchecked. |
| UserPromptSubmit | 5 / 4 | Agent Skills task-method selection, NEXI scoped gate, Codex Coordinator, and Ponytail mode hooks checked; Context Handoff plugin hook unchecked. Inspected NEXI, Agent Skills, and Ponytail entries showed `Trust: Trusted`. |

`Installed`, `trusted`, and `enabled` describe different things: installed means present in the hook list; trusted is the displayed trust state; enabled means checked as active. None proves a hook was invoked. Invocation requires an observed run, and behavioral verification requires evidence of its actual effect, such as allow/deny behavior. This inspection did not verify hook execution or blocking behavior.

Relevant NEXI, Agent Skills, and Ponytail hooks were already trusted and enabled, so re-trusting or enabling them was unnecessary. Unrelated or legacy unchecked hooks should not be enabled merely to increase active counts. The primary session read and applied the global `using-agent-skills` and local NEXI Kernel, Capability Router, and Ponytail instructions; that does not prove every skill hook fired or that a selected specialist was invoked automatically.

During the bounded `codex exec` write, the NEXI PreToolUse gate actually denied the helper's first file-write attempt because required full skill reads were missing. After the helper read the Kernel, Capability Router, `using-agent-skills`, and Ponytail files completely, the single-file write proceeded. This demonstrates the gate's behavior for that recognized write; it does not prove universal interception or certify unrelated Codex tasks.
