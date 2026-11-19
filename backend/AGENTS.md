# Backend engineering contract

Inherits ../AGENTS.md. Current owner/source/runtime evidence overrides dated tasks/evidence and retired source-first instructions.

- Source: backend/src; manifest/lock authority: backend/package.json and backend/package-lock.json. Node: /opt/nexi/runtime/node-v24.21.0/bin/node. Dependencies remain the symlink to /srv/nexi/backend/shared/node_modules; output /srv/nexi/backend/dist; service nexi-api.service. No incidental install or production build.
- NestJS controllers/guards/DTOs authenticate and validate; services own domain rules. Prisma 7 and the local SQLite command gateway address one authoritative store, not independent financial writers. Historical d1-prefixed names are compatibility labels, not Cloudflare/D1 deployment.
- Financial commands must be authorization- and asset-scoped, idempotent, precise, atomic or recoverably coordinated across business state, Ledger, audit/Activity and EventOutbox. BullMQ/Valkey/Socket.IO cannot authorize monetary effects. Preserve transaction/compensation and readback semantics.
- Binary/Admin approved research controls are isolated from genuine market reference prices. Research account and position mutations require guarded audit/idempotency and correct active-state/version rules. Public candle projection is not a financial writer.
- Market reference trades/depth are best-effort, separate from the settlement source; closed Kline retention and persistent snapshots are source-dependent. In-memory queues with bounded shutdown grace are not crash-durable guarantees.
- Prisma/SQLite native module lifetime matters: the November 19 broad-Jest run aborted in better-sqlite3 Statement destructor. Preserve the exact failure evidence and investigate test/database teardown, ABI and environment in a bounded test-only lane; never weaken financial/auth source logic or alter production shared dependencies just to make Jest green.
- Reuse source-correct tests and receipts at their SHA. Current OpenAPI is docs/contracts/openapi.json; inspect controller/DTO and generation provenance before editing contract output. Build, migrations, financial writes and service operations require their own approval.

## Mandatory MCPC knowledge + source-graph work-slice gate
For EVERY NEXI engineering work slice (architecture, implementation, debugging, review, test or release preparation), retrieve bounded, task-specific knowledge through MCPC and inspect the matching application source relationships before conclusions or edits. **Mandatory retrieval, not blanket ingestion of the entire graph.** Repeat only when the task changes or relevant source/graph state changes. Do not mistake a query for execution proof.

The verified CLI is `/usr/local/bin/nexi-mcpc` (0.8.0). Persistent sessions: `@nexi-knowledge` (reference documents) and `@nexi-graphify-live` (repository dependency graph). Reuse existing sessions:
```bash
MCPC=/usr/local/bin/nexi-mcpc
"$MCPC" --json
"$MCPC" @nexi-knowledge ping
"$MCPC" @nexi-graphify-live ping
"$MCPC" @nexi-knowledge tools-get query_graph
"$MCPC" @nexi-knowledge tools-call query_graph '{"question":"<task-specific knowledge question>","mode":"bfs","depth":2,"token_budget":1200,"demote_docs":false}' --json
"$MCPC" @nexi-graphify-live tools-call query_graph '{"question":"<actual route, service or symbol>","mode":"bfs","depth":1,"token_budget":1200}' --json
```
Replace placeholders with current task terms. Use `get_section` for the full authoritative paragraph and `get_neighbors`, `shortest_path`, `get_node`, or `god_nodes` only when useful. Look up exact tool schemas with `tools-get`. Every finding must be checked against **current Git/source/actual runtime evidence**; extracted source facts, LLM-inferred links and historical decisions are distinct. The source graph currently reports a build commit behind HEAD, so a graph hit is a candidate, not current-source proof.

Full operating manual, all 11 Graphify tool examples, session, skills/resources, provenance and failure recovery: `/srv/nexi/engineering-knowledge/20261110/KNOWLEDGE_MCPC_OPERATING_GUIDE.md`. The authoritative CLIENT skill is `mcpc help --skill`; `mcpc @session skills-list` only works if that server publishes the MCP skills extension (current Graphify sessions do not). If session use fails, record the actual error, read the relevant verified source and mark graph verification unavailable; never invent a tool result or reconnect/restart/clean sessions blindly. No MCP result gives permission for financial/database writes, builds, restarts or deployment. Owner instructions and applicable AGENTS.md/source authority take precedence.
