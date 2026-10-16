# Canonical main VPS backend integration evidence

Timestamp: 2026-10-16T21:29:02Z
Repository: `/home/mellonelay1999/workspaces/Nexi`
Branch/base: `main` at `9a41b2e3da2729173f6d7aac6a1fd2f6c6c4657f`; migration integration remains uncommitted in this working tree.

## Dependency and build proof

- Canonical package manager: npm; `backend/package.json` and `backend/package-lock.json` SHA-256 match the active `/srv/nexi/backend` copies.
- Node `v24.21.0`; npm `11.19.0`.
- Fresh canonical `npm ci`: exit 0, 923 packages added.
- `npm ls --depth=0`: exit 0; no unmet dependencies. `@nestjs/observe` absent.
- Resolved: Nest core `12.0.3`, Nest BullMQ `12.0.0`, Prisma client + SQLite adapter `7.3.0`, better-sqlite3 `12.11.1`, SQLite engine `3.53.2`, BullMQ `6.3.15`, ioredis `5.10.1`, Socket.IO `4.8.3`, Socket.IO Redis Streams adapter `0.3.0`.
- Native better-sqlite3 in-memory load succeeded.
- `npm run build`: exit 0.
- Compiled `backend/dist/src/main.js` SHA-256 and active `/srv/nexi/backend/dist/src/main.js` SHA-256 both `95f8934947e2a4bb7df6e7beacc5ea57e20ede1de78930bd5c899a2d71997608`.
- `nexi-api.service`: active and enabled. It was not restarted; existing runtime evidence was reused.
- `git diff --check`: exit 0.

## Structural review

- Graphify CLI 0.9.85 local refresh completed on integrated source: 7,962 nodes / 19,141 edges, no clustering.
- Focused Graphify undirected path from `D1FinancialCommandGateway` to `LocalAsyncRuntimeService` is three hops through `durable-queue.integration.ts` and `DurableQueueTransport`, all marked EXTRACTED. This is graph structure, not runtime proof.
- Fallow 3.30.0 scoped review covered 24 changed backend production TS paths. No unresolved imports, cycles, boundary violations, unused files/types/dependencies reported. Six unused-member candidates were source checked; `LocalWorkflowFatalError` has internal uses, `DurableQueueTransport.process` has a production caller, and replay methods remain covered by focused tests. The policy detector did not execute because the workspace has no rule packs.
- No migration regression suites were rerun because the integrated code matches the already proven migration source and the current source changes do not invalidate those receipts.

## Boundaries and open proof

No Cloudflare production resources, DNS, financial writers, Nginx configuration or running service were changed. The package install reported 56 vulnerabilities in the complete dependency tree (2 low, 31 moderate, 22 high, 1 critical); this aggregate includes development dependencies and needs production-only audit classification before deployment. Authenticated financial acceptance, trusted API TLS, current live D1 delta, independent encrypted off-VPS backup/restore, and owner-controlled production cutover remain open.


## Follow-up integrity checks

- Local Graphify refreshed 583 code files on the canonical current worktree; resulting graph has 7,962 nodes and 19,141 edges. Focused path command: `graphify path D1FinancialCommandGateway LocalAsyncRuntimeService --undirected` returned three EXTRACTED hops via `durable-queue.integration.ts` and `DurableQueueTransport`. The path traverses a test node and is topology only, not proof of production call execution.
- Relative Markdown links and fenced-code balance checked in 11 active architecture/instruction docs: zero issues.
- Stale Cloudflare-only runtime-authority pattern search across the updated core docs returned no false Cloudflare/D1-only authority statements.
- `npm audit --omit=dev --json`: 27 production dependency advisories (1 low, 10 moderate, 16 high, 0 critical). Full install audit reported 56 total including dev dependencies (2 low, 31 moderate, 22 high, 1 critical). No audit fix or package upgrade was applied in this migration integration slice.
