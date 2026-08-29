# NEXI VM Authoritative Operating Contract

## Authority
This workspace is the authoritative source for NEXI backend, Cloudflare Worker/Container, D1 integration, runtime, and deployment-sensitive engineering.

- VM authority: `/root/workspaces/nexi-authoritative-20260823`
- Windows `C:\trae_projects\Dexi_style_TraeWV` owns Public Frontend and Admin source only.
- Windows backend files are checkpoint/reference mirrors, never backend implementation authority.
- Do not continuously sync backend edits to Windows during active implementation. Sync only at an explicit verified checkpoint/final join.

Current owner/product decisions and current approved NEXI architecture outrank historical DEXI/Neon assumptions.
Current VM source and fresh runtime evidence outrank stale receipts or chat summaries about technical state.

## Canonical architecture
Public Frontend / Admin -> Cloudflare Worker -> canonical Cloudflare Container -> NestJS.
NestJS owns business/domain decisions.
D1 owns durable application + financial relational truth.
Aiven Valkey owns cache, Streams, Socket.IO, and ephemeral coordination.
R2/Data Catalog/Pipelines own archive/analytics objects.
Queue/Workflow/Worker/Container orchestrate; they never own financial truth.

Do not restore PostgreSQL/Neon authority. Do not introduce a second Admin plane, second financial authority, direct frontend D1 access, Worker financial logic, or custom VM lifecycle engine.
## Fast execution routing
Use direct source when the affected file/symbol is already known.
Use Graphify for topology, ownership, dependency paths, and blast radius.
Use Codebase Memory or bounded `rg`/`fd` for exact symbols/callers/snippets.
Use Forensic Graphify only for unclear structural failures, drift, hidden paths, or competing hypotheses.
Use current official docs/Context7 only when external framework/provider semantics are uncertain.
Use Cloudflare docs + project-local Wrangler for Cloudflare-sensitive work.
Use API contract tools only against real controller/DTO/OpenAPI artifacts, not progress summaries.

Default loop:
`LOCATE IF NEEDED -> READ EXACT SOURCE -> IMPLEMENT -> FOCUSED VERIFY -> REPAIR ONCE -> CONTINUE`.

Do not pause between dependency-ready tasks merely to report progress.
Do not run every skill/tool mechanically.

## VM toolchain
Primary shell/search: `ssh`, `scp`, `rsync`, `rg`, `fd`, `find`, `grep`, `sed`, `awk`, `jq`, `tree`.
Code/runtime: `node`, `npm`, `npx`, `python3`, `docker`.
Architecture/static: `graphify`, `fallow`, `agnix`.
Cloud/data/runtime: `wrangler`, `avn`, `redis-cli`.
HTTP/network: `curl`, `wget`, `openssl`, `socat`, `nc`, `nmap`, `dig`, `host`, `nslookup`, `mtr`.
System diagnostics: `journalctl`, `systemctl`, `ss`, `lsof`, `strace`, `bpftrace`, `perf`, `tcpdump`.
Build/support: `make`, `gcc`, `g++`, `cmake`, `zip`, `unzip`, `tar`, `zstd`, `gzip`, `xz`.

`sqlite3`, `psql`, and Git are installed utilities but are not canonical NEXI authority workflows. Do not use sqlite3/direct SQLite files for D1 operator truth. Do not restore PostgreSQL/Neon. Do not introduce Git workflow unless the owner explicitly changes the rule.
## D1 operator policy
All D1 operator inspection/migration/verification must use project-local Wrangler from `cloudflare-container-bootstrap`.
Preferred form: `npx --no-install wrangler ...`.
Current canonical Wrangler is `4.127.1`; verify version before consequential operator work.
Do not use dashboard SQL, direct REST, sqlite3, or another DB client as D1 operator authority.
Runtime application access remains through the official D1 Workers binding/private bridge.
Use migrations for schema changes. Use bounded remote Wrangler queries/PRAGMAs for inspection.

## Graphify policy
Installed VM Graphify CLI is command authority; use `graphify --help` before assuming syntax.
Graphify is navigation evidence, never behavioral proof.

Freshness:
- `graphify check-update .` reports pending semantic-update state only.
- If graph-dependent reasoning follows meaningful source edits newer than `graphify-out/graph.json`, refresh with `graphify update . --no-cluster` first.
- Use full `graphify update .` / reclustering only after coherent architecture batches where communities matter.

Fast analysis:
- `affected` -> blast radius.
- `path` -> concrete relationship chain.
- `explain` -> node + neighbor context.
- bounded `query` -> unresolved broad relationship question.
- `god-nodes` -> shared/high-risk hub review only.
- `diagnose multigraph` -> suspicious graph ambiguity.

After high-impact changes, refresh once and rerun only the relevant impact/path checks, then verify source/tests/runtime.
## Cloudflare policy
For Cloudflare behavior consult current official Cloudflare docs first, then inspect the project-local Wrangler help/config/schema and current VM source/runtime.
Do not repeat broad Cloudflare rediscovery that is already complete; perform targeted freshness checks for the exact resource/change.
No production mutation without explicit owner approval.

## Financial and event invariants
Consequential financial commands must preserve authorization, validation, idempotency, atomic domain + ledger semantics, audit/activity linkage, EventOutbox publication, and safe retry/recovery.
Queues and Workflows coordinate downstream work; they do not re-own or blindly replay originating financial commands.
Do not fabricate balances, prices, settlement, runtime success, or acceptance data.

## Simultaneous-work discipline
Re-read files before consequential edits.
Avoid broad formatting or unrelated rewrites.
Format only files changed in the current batch.
Do not overwrite the parallel Cloudflare/platform lane or Windows Frontend/Admin authority.

## Verification and reporting
Keep `IMPLEMENTED`, `STATICALLY_VALIDATED`, `TESTED`, `INTEGRATED`, and `RUNTIME_VERIFIED` distinct.
A passing focused compile does not prove runtime. A graph path does not prove behavior. A Cloudflare resource existing does not prove integration.
Before a completion claim, verify the exact changed boundary with fresh evidence appropriate to that layer.
Report compactly: outcome, decisive evidence, changed files/resources, remaining unverified surfaces, production-changed status, next dependency-ready action.
## Historical artifact policy
Windows `work/` receipts and VM backup artifacts are evidence/history only, not current execution authority. Consult them only when the current baton, fresh source/runtime evidence, or the owner explicitly requires them. Never let an old receipt or prompt override current authoritative VM source/runtime.