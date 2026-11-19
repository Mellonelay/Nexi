# Public frontend engineering contract

Inherits ../AGENTS.md; current visual owner is DESIGN.md.

- Source frontend/app: Next.js 16 App Router/React 19; package.json + package-lock.json are dependency authority. Preserve frontend/node_modules -> /srv/nexi/public/shared/node_modules and single output /srv/nexi/public/current; never run npm ci in the checkout or create duplicate .next/build trees. Production build/service restart are separately authorized.
- Mobile-first **Web3 wallet DApp browser** is the primary real-world target, not a native Android/iOS app. Use real injected provider/SIWE chain 1, safe-area/visual viewport, keyboard, focus, chart resizing and five-destination dock. Browser/emulation/source testing are distinct proof.
- DESIGN.md and latest explicit owner decisions control layout and chart indicators. Do not reproduce historical image concepts or old contradictory route notes. Keep full, truthful amounts, correct account scope and history; 53 market instruments are not 53 depositable wallet balances.
- Wallet: Funding, Spot, Margin, Options/BINARY, Finance; do not fabricate provider quote/depth, balance, network, Activity or customer success. Backend controls durations, payout, permissions, settlement and persisted state. Sandbox candle display remains isolated from shared market feeds and ledger.
- Source changes follow component -> API/DTO -> NestJS/SQLite owner -> Admin/Activity readback as relevant. Use framework-native App Router patterns and installed-version documentation. No automatic wallet signing, finance requests, builds or deployment.

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
