# Backend specialist-first workflow hardening — 2026-10-24

## Change and authority

This is an instruction-only change. The repeated failure was procedural: backend behavior work could begin before the relevant NestJS, persistence, transport, queue, realtime, and API-contract knowledge was read. The durable rule is now in `backend/AGENTS.md` under **Backend specialist-first change gate**. It requires a compact evidence receipt, routes only the boundaries actually affected, preserves existing proof, and delays production builds until a compatible batch has passed focused checks.

The Learn-category fix and shutdown repair remain closed at their existing proof levels. This task did not modify backend behavior, Admin/Public source, SQLite, dependencies, services, or deployed artifacts.

## Skill routing and tool availability

Actually read in this task:

- NEXI Work Kernel 0.5.27 and NEXI Capability Router instructions supplied as complete skill content in the active task; `using-agent-skills` 0.6.13; Capability Orchestrator; Ponytail 5.3.2; Context Handoff 0.3.4; Codex Coordinator 0.5.0; Agent Skills `documentation-and-adrs` and `git-workflow-and-versioning`.
- NestJS Professional Software Engineering, NestJS Architecture Principles, NestJS Patterns, NestJS Code Audit, NestJS Features/Performance, API and Interface Design, and Security and Hardening.
- SQL Transactions/Concurrency and SQL Migrations; Vibe SQL, Vibe Redis, Vibe Workflow, and Vibe Realtime.

Current dependency versions were read from `backend/package-lock.json`: NestJS core/platform-socket.io 12.0.3; Prisma/client/adapter-better-sqlite3 7.3.0; better-sqlite3 12.11.1; BullMQ 6.3.15; ioredis 5.10.1; Socket.IO 4.8.3; Redis Streams adapter 0.3.0. These are the lockfile values at the task's source base, not a new runtime deployment check.

The specialist skill files above are discoverable and readable on this host. There is no standalone BullMQ skill at the searched skill roots; queue routing uses Vibe Workflow/Redis guidance and requires the installed BullMQ types/source plus current official documentation when a future API behavior is in question. Skills are instructions, not executable MCP tools. No direct Capability Orchestrator, Codex Coordinator, Vibe Coding, or Promptfoo MCP tool name was exposed in this session; the Capability Orchestrator skill and Coordinator CLI were available. Coordinator board listing worked, but the sole active claim is schema 1 under the schema-2 project marker. This documentation change needs no parallel writer, so no task was created and no board migration or claim mutation was attempted. No Promptfoo config was found in the repository; per instruction, the scenarios below are lightweight recorded dry runs, not a new evaluator.

## Read-only routing regression dry runs

### A — Learn category status transition

- **Symptom / reused reproduction:** Admin supplied the target status in the compare-and-set `expectedStatus` field. Existing release evidence records the failure and corrected transition; no implementation was rerun.
- **Expected route:** NestJS controller/auth-surface/permission → service state transition and transaction → Prisma 7/SQLite concurrency semantics → audit plus idempotent EventOutbox atomicity → Admin request/response contract → focused valid/invalid/unauthorized, forward/inverse, stale-conflict/idempotency, and durable-readback coverage.
- **Dry-run result:** PASS as an instruction-routing check. The new gate requires NestJS for the endpoint, SQL/Prisma for persistence, security/API-contract review, and consumer checks before release. It calls out comparing current state with target state and does not authorize direct SQLite mutation.
- **Reused proof:** `tasks/evidence/nexi-backend-learn-authorization-outbox-20261023.md` and `tasks/evidence/nexi-integrated-release-followthrough-20261024.md`.

### B — Backend graceful shutdown

- **Symptom / reused reproduction:** the custom Redis Socket.IO adapter had swallowed Nest's `close(server)` call, and the old shutdown exceeded systemd's timeout. Existing evidence includes a pre-fix failing adapter test, post-fix focused test, and one controlled deployed restart/readiness check; none was repeated here.
- **Expected route:** NestJS lifecycle and shutdown order → `IoAdapter.close(server)`/Socket.IO adapter contract → Valkey/Redis client ownership and disposal → MarketIngest callback stop and active persistence drain → inspect actual call paths for BullMQ workers and include queue skills only if involved → bounded close/drain regression and controlled process-exit verification.
- **Dry-run result:** PASS as an instruction-routing check. The new gate explicitly includes Nest lifecycle, adapter signature/disposal, Redis cleanup, and durable drain. BullMQ remains conditional on call-path evidence rather than being presumed causal.
- **Reused proof:** `tasks/evidence/nexi-backend-shutdown-fix-20261023.md` and `tasks/evidence/nexi-integrated-release-followthrough-20261024.md`.

These dry runs validate that the written routing points to the expected knowledge and proof. They do not prove future agents will obey it or that repository instructions are runtime-enforced.

## Verification and limits

- `coordination_state.py list --project-root /home/mellonelay1999/workspaces/Nexi` — PASS; schema-2 project, one active schema-1 claim, no claim conflicts.
- `backend/package-lock.json` version inspection — PASS for the versions listed above.
- Specialist file readability checks — PASS for NestJS, SQL, Vibe Redis, Vibe Workflow, and Vibe Realtime files. No standalone BullMQ skill was found at the searched roots.
- Direct exposed-tool-name inventory — no Capability Orchestrator, Coordinator, Vibe Coding, or Promptfoo MCP tool names; Coordinator's local list CLI was callable. No repository Promptfoo config was found.
- No backend tests, application build, migration, deployment, service operation, Graphify, Fallow, or CodeScene check was needed or run because no application code changed. Existing technical proofs remain reusable only within their recorded scopes.

## Source and working-tree boundary

At intake, `main` and `origin/main` were both `71ec6e7bf70891983c42b448a0438cf3eb2b6d70`. Pre-existing edits to root `AGENTS.md` and `.codex/AGENTS.md` were read and preserved; they are not part of this task. The final source/remote state is recorded in the completion report and will be checked again before any Git publication.
