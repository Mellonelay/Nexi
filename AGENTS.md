# NEXI engineering rules — current

Last reconciled: 2026-11-21 (workflow guidance and graph-freshness wording). This file contains **standing engineering rules only**; it is not a rolling Git, service or test-status report.

## Authority and scope
1. Latest explicit NEXI owner instructions and current execution authorization.
2. Applicable current repository and surface-specific AGENTS.md rules.
3. Actual source, Git, environment and executed evidence.
4. Dated receipts and research as historical evidence; official framework documentation for external semantics.

**Retired:** mandatory Normal Chat/Work Kernel routing, older source-first/no-tests-before-source-closure prohibition, Cloudflare Worker/D1 as active financial runtime, and fixed historical graph versions/paths. Do not resurrect old instructions from Git history, tasks/evidence or archived handovers. Testing appropriate to an approved task is allowed; production builds, service changes, financial/data writes, migrations and deployment require their own authorization.

## Three surfaces and owners
- Canonical checkout: /home/mellonelay1999/workspaces/Nexi, one coordinated Git/source writer. Preserve unrelated tracked and untracked changes.
- Backend: backend/, NestJS 12, Prisma 7 + native SQLite. Accounting truth is SQLite LedgerAccount/LedgerPosting with idempotent financial commands and durable audit/Activity/EventOutbox/Inbox. Redis/Aiven Valkey, BullMQ and Socket.IO are transport/projections, not financial authority.
- Public: frontend/, Next.js 16 / React, mobile-first web application in actual Web3 wallet DApp browsers. Its visual source is frontend/DESIGN.md; wallet authentication is Ethereum mainnet SIWE chain ID 1.
- Admin: Admin/, React/TanStack Router/Start and Vite/Nitro. Backend guards/DTOs/services own policy, mutations, settlement and persisted configuration. Admin route/UI presence alone does not establish live support.
- Single Node executable: /opt/nexi/runtime/node-v24.21.0/bin/node. Distinct dependency stores are /srv/nexi/backend/shared/node_modules, /srv/nexi/public/shared/node_modules, /srv/nexi/admin/shared/node_modules; corresponding checkout node_modules paths are symlinks. Never merge, replace or reinstall these stores as incidental setup.
- Canonical outputs are /srv/nexi/backend/dist, /srv/nexi/public/current and /srv/nexi/admin/current. Do not create shadow release/build roots.

## Method
Use SentinelX for authorized VM work. Read current Git state and only the relevant source and prior immutable receipt. Trace producer -> NestJS policy -> SQLite transaction/ledger/outbox -> Public/Admin readback for consequential changes. Use Graphify for revision-matched topology, Fallow/CodeScene for bounded static quality, and version-matched framework sources when needed. A scanner result is not proof of runtime behavior. One financial/Git/build writer; parallelize independent read-only investigation only.

Do not weaken an accepted security, ownership, idempotency, settlement or audit invariant to satisfy outdated tests. Preserve open orders, financial balances, wallet sessions and other owner state. Never synthesize financial success or prices.

Proof classes are separate: SOURCE_IMPLEMENTED, FOCUSED_TESTED, BROAD_TESTED, INTEGRATED, BUILT, DEPLOYED, RUNTIME_VERIFIED, BROWSER_VERIFIED, OWNER_ACCEPTED. Report the actual revision, test scope and deployment identity before upgrading status. Reuse previous PASS only if its causal source and environment remain equivalent.

## Documentation discipline
- docs/README.md: single documentation/authority index.
- docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md: maintained cross-surface architecture.
- docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md: financial invariants.
- frontend/DESIGN.md: Public visual contract.
- Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md and original PNG: Admin operator and approved design reference.
- docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md: original 113 criteria; docs/quality/NEXI_MOBILE_WEB3_UI_FIRST_BROWSER_ACCEPTANCE_20261117.md: execution procedure.
- NEXI_CURRENT_STATE.md: **one** bounded current execution/proof checkpoint; tasks/todo.md: **one** current work queue. Detailed dated execution receipts stay in tasks/evidence, not in active instructions.

**Never append another dated 'CURRENT OWNER OVERRIDE' section or create a competing architecture/status/handover document.** Update the existing owner in place; preserve previous versions through Git history. Documentation consolidation does not change runtime, permissions or financial authorization.

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
