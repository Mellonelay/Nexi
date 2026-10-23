# CURRENT OWNER REMOTE CODEX OVERRIDE — 2026-10-23

The active execution context is paired Codex Remote CLI running on `mellonelay` in the Worker-0 VM, connected to the owner's phone. The current Codex session is the task parent and uses the verified local shell directly. Do not assume this is a ChatGPT Work session, route commands through Work/RDC, or SSH to the same VM. Work-only browser, plugin, skill, and delegation capabilities are unavailable unless this session actually exposes them.

The generic Codex Chrome DevTools MCP is configured for `http://127.0.0.1:5858`. Verify the saved route with `codex mcp get chrome-devtools` and the live browser identity at `/json/version`. Port 5859/Polypane is retired for NEXI; use only the verified 5858 Chrome DevTools route. Updating Codex configuration does not rebind an MCP server already loaded by the current session; verify from a fresh Codex process before claiming runtime reconnection. Preserve the existing browser profile and authenticated tabs.

The currently callable native shell/MCP tools and Codex plugin/skill registries are the authority for this host. Distinguish installed, configured, authenticated, callable, invoked, and verified. Never paste secrets, session cookies, bearer tokens, wallet signatures, or private data into reports. Treat packaged ChatGPT Work instructions as host-specific examples and follow this active-context override where they conflict.

# HISTORICAL WORK ROUTING OVERRIDE — 2026-10-21

For ChatGPT Work sessions, Work remains the parent controller. From a separate authorized host, use the currently verified Worker-0 SSH route; RDC is a fallback. Browser evidence must use sessions and tools actually exposed to that host. Use task-fit skills and only genuinely independent evidence lanes; no routine subagent requirement.


## CANONICAL BUILD EXECUTION

The single checkout on `main` is the only source workspace. No worktrees, clones, staging builds, candidate roots, or duplicate dependency stores. Release builds are serialized, use the app's active lockfile and pre-existing shared dependency owner, and write only to the canonical VPS paths documented in root `AGENTS.md`: Backend `/srv/nexi/backend/dist`, Public `/srv/nexi/public/current/.next`, Admin `/srv/nexi/admin/current`. Follow the per-app service-stop, rollback, source-sync, build, restart, and identity checks before replacing output. Never infer runtime identity from Git HEAD or a diagnostic source-tree output.

# NEXI Codex Remote SSH — execution overlay

Repository-wide NEXI AGENTS.md is the governing rule for all agents; this overlay applies to Codex only, alongside the separate ~/.codex/AGENTS.md. Current owner decisions and present source/runtime authority supersede old historical language.

- In ChatGPT Work, that Work session controls lifecycle through Work Kernel -> Capability Router -> relevant Agent Skills and task-fit specialists. In the current paired Codex Remote CLI session, Codex is the lifecycle parent and operates directly in its verified local shell; do not require a second Work controller or use RDC/SSH-to-self. Direct SSH and RDC apply only when the active host is separate and that route is authorized and callable.
- Begin from the one canonical main checkout /home/mellonelay1999/workspaces/Nexi. Read relevant AGENTS.md, NEXI_CURRENT_STATE.md, NEXI_PROOF_REUSE_REGISTER.md, tasks/todo.md AND tasks/plan.md. Discover exact origin/HEAD, deployed release and dirty changes; never assume stale checkpoint values or restart accepted backend proof. One mutable owner for Git, SQLite/Ledger, dependency lockfiles, services/deploy.
- Use the 25 Addy Agent Skills workflows through the vendor source + using-agent-skills, Ponytail/Karpathy for small controlled changes; Graphify Agent Workflows/graphify query, path and MCP only when structural evidence is valuable, Fallow for TS/JS risks; current NestJS/Next.js/provider docs where relevant. Call tools and capture real proof rather than relying on installed skill names.
- Hook routing (no duplicate installation): native Codex discovers skills directly; the former Addy SessionStart hook file is disabled because its script explicitly targets a different host. Repository `hooks.json` owns Graphify hook-check on PreToolUse/Bash and Worker-0 skill-harness `hook.py` on UserPromptSubmit. Plugin-owned hooks are host-managed; verify effective state when material. Hook registration is advisory evidence, not proof of enforcement or skill invocation.
- NEXI Public/Admin browser: use the authenticated tabs actually present in the active Chrome session and Chrome DevTools MCP callable from this Codex host at port 5858. Verify each tab URL, session state, and browser identity live; keep Public/Admin claims distinct and never transfer credentials or cookies. Use Chrome DevTools MCP at 5858 only. Do not claim browser acceptance from a screenshot alone.
- Backend/financial authority is the promoted VPS SQLite, Ledger, EventOutbox/Inbox, journals; NestJS owns business logic; Valkey/BullMQ/Socket.IO are transport. Cloudflare D1/Worker are historical. No new worktrees, irrelevant rebuilds, duplicate tests or destructive/financial operations without owner approval.
- For protected instruction maintenance: worker0-protect unlock -> bounded edit and verification -> refresh-lock -> status. Do not use retired Agent Kernel for NEXI instructions. Report changed files, actual checks, proof classes and blockers.
