# Admin engineering contract

Inherits ../AGENTS.md. Preserve current TanStack/React/Vite/Nitro implementation, registered routes and permission-aware deep links.

- Source Admin/src; dependency authority Admin/package.json, pnpm-lock.yaml, pnpm-workspace.yaml and patches/. Preserve Admin/node_modules -> /srv/nexi/admin/shared/node_modules, single output /srv/nexi/admin/current, and Node 24.21.0. Do not install or build as documentation maintenance.
- Eight logical workspaces are the owner-approved operator navigation: Overview, Clients, Trading, Wallet & Finance, Markets, Products, Communications, Administration & Settings. NAV_GROUPS at src/admin/config/navigation.ts and source route files govern exact current route count. Do not remove routes merely because they are contextual/hidden.
- Admin/src/admin/data/nexi-api-provider.ts is the live backend consumer. Local mock is explicit development/demo only; never silently fall back in a production path. Unsupported backend capability fails closed. Permissions are enforced by NestJS, not hiding UI.
- Binary research account defaults and active-position overrides are current source implementations, not future proposals. They require research-account scope, actor/reason, idempotency, audit and version/expiry guards. One NestJS settlement/SQLite writer; no second Admin outcome engine.
- Consequential actions need correct actor, target, approval/reason, confirmation, idempotent command and durable response; protect production data. Admin signed-in UI and Public wallet identity remain distinct.
- Operator procedure: docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md. Original owner Admin design diagram in docs/ is immutable design evidence; not a deployed-release receipt.
- Authorized Admin build uses NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current with the existing pinned corepack pnpm@12.14.0 and project script, only after checking locked dependencies. Sentry/release SHA and verified runtime are separate gates.

## Mandatory MCPC knowledge + source-graph work-slice gate
**What `@nexi-knowledge` actually contains (discover before narrowing the query):** This is a **general engineering knowledge reference library that NEXI also uses**, not just a backend or Graphify source code index. Its 222 canonical sources include reusable MCP protocol/authorization/security, agent and API engineering patterns, frameworks/NestJS, Graphify documentation, source/semantic extraction, SQLite/Prisma ledger and event-outbox practices, Ethereum/SIWE wallet authentication, mobile-first Web3/accessible UX, exchange-grade Spot/Margin/Binary trading and settlement, mining/loans/VIP/referrals, deposits/withdrawals/network finality, real-time/observability, implementation playbooks, and acceptance/reference matrices. New sessions should call `knowledge_overview` or `list_knowledge` to see the **current** domain catalog; use `search_knowledge` with plain-language questions (hybrid keyword + local semantic passage search), followed by `get_evidence` with a returned passage ID for source/line/hash, and `explore_relationships` or legacy `query_graph` only when graph connections add value. Do not assume the corpus covers unrelated topics; an empty result is an evidence gap, not permission to invent support. Neither knowledge references nor LLM-extracted concepts are live source/runtime proof. Do not dump all 222 documents into context.

For EVERY NEXI engineering work slice (architecture, implementation, debugging, review, test or release preparation), retrieve bounded, task-specific knowledge through MCPC and inspect the matching application source relationships before conclusions or edits. **Mandatory retrieval, not blanket ingestion of the entire graph.** Repeat only when the task changes or relevant source/graph state changes. Do not mistake a query for execution proof.

The verified CLI is `/usr/local/bin/nexi-mcpc` (0.8.0). Persistent sessions: `@nexi-knowledge` (reference documents) and `@nexi-graphify-live` (repository dependency graph). Reuse existing sessions:
```bash
MCPC=/usr/local/bin/nexi-mcpc
"$MCPC" --json
"$MCPC" @nexi-knowledge ping
"$MCPC" @nexi-graphify-live ping
"$MCPC" @nexi-knowledge tools-get knowledge_overview
"$MCPC" @nexi-knowledge tools-call knowledge_overview '{}' --json
"$MCPC" @nexi-knowledge tools-call list_knowledge '{"limit":40}' --json
"$MCPC" @nexi-knowledge tools-call search_knowledge '{"question":"<task-specific knowledge question>","limit":6}' --json
# Retrieve exact source IDs from search results with get_evidence; use explore_relationships for connected concepts.
"$MCPC" @nexi-graphify-live tools-call query_graph '{"question":"<actual route, service or symbol>","mode":"bfs","depth":1,"token_budget":1200}' --json
```
Replace placeholders with current task terms. New sessions first discover the corpus with `knowledge_overview` and `list_knowledge`; search ranked passages with `search_knowledge`, then verify original passages and hashes with `get_evidence`. Use `explore_relationships` for semantic links and legacy `query_graph`, `get_section`, `get_neighbors`, `shortest_path`, `get_node`, or `god_nodes` for Graphify traversal when useful. Look up exact tool schemas with `tools-get`. Every finding must be checked against **current Git/source/actual runtime evidence**; extracted source facts, LLM-inferred links and historical decisions are distinct. The graph build commit is volatile: verify it against HEAD before relying on it; if it is behind, treat graph hits as candidates and verify the current source.

Full operating manual, 6 knowledge-specific tools, all 11 preserved Graphify tools, session, resources/prompts, provenance and failure recovery: `/srv/nexi/engineering-knowledge/20261110/KNOWLEDGE_MCPC_OPERATING_GUIDE.md`. The authoritative CLIENT skill is `mcpc help --skill`; `mcpc @session skills-list` only works if that server publishes the MCP skills extension (current Graphify sessions do not). If session use fails, record the actual error, read the relevant verified source and mark graph verification unavailable; never invent a tool result or reconnect/restart/clean sessions blindly. No MCP result gives permission for financial/database writes, builds, restarts or deployment. Owner instructions and applicable AGENTS.md/source authority take precedence.
