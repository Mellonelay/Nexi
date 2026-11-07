# NEXI Capability and Execution Routing

## Authority

Use current owner instructions and the root [AGENTS.md](../../AGENTS.md), then the relevant surface guidance and live source/runtime evidence. This page is a repository tool-routing guide; it does not establish that a capability is installed, authenticated, callable, authorized, or used. Session-specific controllers and permissions take precedence. Historical routes must not be assumed active.

Current system boundary: NestJS owns business decisions; promoted VPS SQLite and its ledger/outbox/inbox/journals own durable application state; BullMQ/Aiven Valkey carries jobs and Socket.IO/Redis Streams carries realtime/cache traffic. Cloudflare Worker/Container/D1/Queues/Workflows are retired from NEXI runtime.

## Route by evidence responsibility

| Need | Primary capability | Evidence limit |
|---|---|---|
| VM state, files, commands, services | Authorized SentinelX host tools for this VM; use native read/edit/Git operations for their scoped responsibilities. Use `sentinel_capabilities` before commands and inspect current state before mutation. | A command result proves only what it directly observed. Production, financial, service, deployment and destructive actions need explicit current authority. |
| Existing VM MCP sessions | `/usr/local/bin/nexi-mcpc`; inspect active sessions and tool schema before calling. Reuse the existing Graphify session; do not connect a duplicate session or change its target as a side effect of documentation work. | MCP registration/session presence is not a successful query or proof of application behavior. |
| Repository source and history | Git/GitHub for branch, commit, review, CI and push. Confirm HEAD, remote and dirty state before edits; stage only task files. | A Git commit or CI run does not establish the deployed release identity. |
| Source topology and blast radius | Canonical Graphify graph via `@nexi-graphify-live`. | Structural source evidence only. It does not prove runtime HTTP requests, authorization, financial outcomes, or deployed behavior. |
| Framework/API semantics | Version-matched official documentation or Context7 when a specific contract question requires it. | Retrieved documentation informs the expected contract; current NEXI source and runtime establish implementation and behavior. |
| Static changed-code risk | Fallow for JavaScript/TypeScript scope; relevant language/framework diagnostics only when source changes warrant them. | Static findings are not runtime proof; report analyzed scope and degraded inputs. |
| Runtime failures and traces | Sentry, systemd/journald, and Jaeger as available and authorized. Check each data source's freshness and access. | Missing data, denied access, or collector smoke traces do not prove absence of production errors or production trace emission. |
| Rendered browser behavior | Reuse the existing authenticated browser tab/profile when available; inspect the requested surface and exact deployed identity. | A rendered page is point-in-time evidence, not full route, role, responsive, or financial workflow acceptance. |

## Execution sequence

1. Recover the task frontier and current authority. Reuse unchanged evidence; refresh volatile source, release, service and auth state.
2. Identify the exact question and choose one primary tool for each evidence responsibility. Read the relevant tool contract before using it.
3. Keep read-only inspection separate from authorized mutation. Do not restart services, alter production data, deploy, or perform financial operations as a documentation or graph task.
4. Make the smallest source or documentation correction. Preserve dated receipts as dated evidence and label superseded/current claims explicitly.
5. Verify the exact changed files, Git diff, and any claimed runtime facts. Distinguish implemented, tested, deployed, runtime-verified, browser-verified, and owner-accepted evidence.
6. Commit and push only after confirming the branch/remote and reviewing the scoped diff when requested or authorized.

Do not infer capability use from an @mention, installed package, MCP registration, or old session transcript. Record only tools actually invoked and results actually used.
